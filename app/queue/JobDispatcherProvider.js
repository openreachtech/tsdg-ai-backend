import timersPromises from 'node:timers/promises'

import {
  ProcessClerk,
} from '@openreachtech/renchan-job-bullmq'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import {
  env,
  rootPath,
} from '../globals/_.js'

const FAILED_TEARDOWN_MESSAGE = 'a queue connection would not close'
const FAILED_SHUTDOWN_MESSAGE = 'the shutdown of the queue connections threw'
const UNREACHED_QUEUE_MESSAGE = 'gave up on a queue connection that would not open'
const UNFINISHED_TEARDOWN_MESSAGE = 'gave up on queue connections that would not close'

/*
 * How long an accepted run waits on a queue connection before it is told the queue is unreachable.
 *
 * It is a bound on a request rather than a measure of how long Redis may take: the connection is
 * opened once per process, so every run after the first is handed a dispatcher with nothing to
 * wait for, and the one run that does wait is holding a socket open while it waits. Five seconds
 * is long enough for a connection to a Redis that is there — the compose file's container answers
 * in single-digit milliseconds — and short enough that a client's own timeout is not what ends the
 * request.
 */
const JOB_DISPATCHER_BUILD_DEADLINE_MILLISECOND = 5000

/*
 * How long the teardown of every open queue connection is waited on before the process exits
 * regardless.
 *
 * What it bounds is not a slow `close()` but a teardown waiting on a build that never connected,
 * which never settles at all. An operator asked the process to stop; a connection that will not
 * close is a line in a log, and is not a reason to leave a process running that has already lost
 * its default signal handling.
 */
const QUEUE_SHUTDOWN_DEADLINE_MILLISECOND = 5000

const FAILED_TEARDOWN_TAGS = [
  'JobDispatcher',
  'FailedTeardown',
]

const FAILED_SHUTDOWN_TAGS = [
  'JobDispatcher',
  'FailedShutdown',
]

const UNREACHED_QUEUE_TAGS = [
  'JobDispatcher',
  'UnreachedQueue',
]

const LOG_FILE_PATH = rootPath.to('logs/job-dispatcher-')

/*
 * One logger client per process, as `AiRunStatusRecorder` and `BaseAiRunJobWorker` each hold one.
 *
 * `@openreachtech/mentsu-logger` writes only under `NODE_ENV=production`, which is where a
 * shutdown nobody watched is the only record there will be of it.
 */
const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * The live job dispatchers of one process, and the whole of their lifetime.
 *
 * **Why a dispatcher may not be built per request.** `BaseJobDispatcher.createAsync()` opens a
 * BullMQ queue and waits until it is ready, which is a Redis connection; and
 * `BaseJobDispatcher#dispatchJob()` closes that connection again in a `finally` unless it is
 * passed `keepsConnection: true`. Building one per accepted run would therefore be a connect and
 * a disconnect per run — and reusing one built that way is worse still, because the queue is shut
 * after the first dispatch and the second run would enqueue against a closed queue.
 * `AiRunJobDispatchRegistrar` passes `keepsConnection: true` for exactly that reason, which leaves
 * closing the connection to whoever opened it. This class is that whoever.
 *
 * **What it promises.** One dispatcher per dispatcher class, built once **and successfully**,
 * reused by everything that asks, and closed once when the process is asked to stop.
 *
 * **A build that failed is not kept, and that word is the whole of the difference.** The pool
 * holds the promise rather than the dispatcher, so a build that rejects leaves a rejected promise
 * in it — and presence is all `#hasJobDispatcher()` asks about, so every later ask would be handed
 * that same rejection without a second build ever being attempted. One Redis blip on a process's
 * first accepted run would then fail every run that process accepted afterwards, until somebody
 * restarted it, because the renderer waits for this promise before it opens its transaction. So
 * the rejection removes its own entry, and the next ask builds again. What is still reused on the
 * failure path is the failure of the **in-flight** build, which is what the pooling is for: two
 * callers asking at once share one attempt, and both are told it failed.
 *
 * **Why the pool is static, and keyed by the dispatcher class.** A cache is not a value: held on
 * an instance it would join this object's equality and serialization, which the class design
 * convention rules out, so it sits in a `static` `WeakMap` as that convention directs. Keying it
 * by the dispatcher class rather than by the provider is deliberate — a second provider built in
 * the same process reuses the connection the first one opened rather than opening a second one
 * against the same queue, which is the single property this class exists for. What the second
 * provider would not do is close it, which is why the classes a provider built are recorded on the
 * provider itself: a `WeakMap` cannot be enumerated, so the keys are held in an array beside it,
 * exactly as the class design convention prescribes for a pool that has to be traversed.
 *
 * **Why the promise is pooled rather than the dispatcher.** Building one is asynchronous, and two
 * requests can ask before the first build has finished. Pooling the promise is what makes the
 * second asker wait for the first build instead of starting a second one: the check and the store
 * happen in the same synchronous step, so no `await` sits between them for a second caller to slip
 * through.
 *
 * **A build that cannot connect is given up on rather than waited out.**
 * `BaseJobDispatcher.createAsync()` waits on BullMQ's `waitUntilReady()`, which resolves on
 * `ready` and rejects on `end`; ioredis, carrying the `maxRetriesPerRequest: null` that BullMQ
 * requires, retries a connection for as long as it takes and never ends. Against a Redis that is
 * not there the build therefore neither succeeds nor fails — it pends, measured at six seconds
 * and counting against a closed port — and the rejection handling above never fires, because
 * nothing rejects. Every ask waiting on it pends with it, which for the accept path is a request
 * that never answers and a socket held for the length of the outage. So an ask is raced against a
 * deadline of its own, and a caller that reaches the deadline is handed a refusal naming the queue
 * rather than left waiting.
 *
 * **The build is not cancelled when an ask gives up, and its entry is not removed.** ioredis goes
 * on trying in the background, so there is one build per dispatcher class however many asks gave
 * up on it, and a Redis that comes back is connected to without a second build being started; the
 * first ask after that is handed the dispatcher. What the deadline costs is a Redis that is merely
 * slow — an ask that would have been answered a moment later is refused, and the ask after it
 * waits on the same build again.
 *
 * **The shutdown owes the exit, and a deadline is what makes it take it.** Each dispatcher is
 * closed on its own and a failure to close one is written down rather than thrown, so one stuck
 * connection does not leave the others open. A guard around the whole teardown was said here to
 * make the exit reachable on every path, and it is not: a guard answers a rejection and has
 * nothing to say to a promise that never settles, which is exactly what a teardown awaiting a
 * build that never connected is — the process stayed up, having already lost the default `SIGINT`
 * handling that attaching a handler removes. So the teardown is raced against a deadline too, and
 * the exit is taken when either of them finishes first.
 */
export default class JobDispatcherProvider {
  /**
   * Pool of dispatcher promises, keyed by the dispatcher class that produced each.
   *
   * @type {WeakMap<JobDispatcherCtor, Promise<JobDispatcher>>}
   */
  static jobDispatcherPromisePool = new WeakMap()

  /**
   * Pool of shutdown sinks, keyed by the provider that built each.
   *
   * A sink is a hash of handler functions, and a handler is removed from a process by its
   * identity. Rebuilding the hash per attach would hand `process.on` a second function answering
   * the same signal and leave `#detachSink()` with nothing it could name, so the one this provider
   * built is kept — here rather than on the instance, because a pool is not a value.
   *
   * @type {WeakMap<JobDispatcherProvider, Record<string, () => Promise<void>>>}
   */
  static shutdownSinkPool = new WeakMap()

  /**
   * Constructor.
   *
   * @param {JobDispatcherProviderParams} params - Parameters.
   */
  constructor ({
    JobDispatcherCtors,
    processClerk,
  }) {
    this.JobDispatcherCtors = JobDispatcherCtors
    this.processClerk = processClerk
  }

  /**
   * Factory method.
   *
   * The array starts empty because nothing is known in advance: a dispatcher class arrives when
   * something asks for its dispatcher, and the array is what that ask records.
   *
   * @template {X extends typeof JobDispatcherProvider ? X : never} T, X
   * @param {JobDispatcherProviderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    JobDispatcherCtors = [],
    processClerk = this.createProcessClerk(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        JobDispatcherCtors,
        processClerk,
      })
    )
  }

  /**
   * get: ProcessClerk class — a seam so tests can substitute it.
   *
   * @returns {typeof ProcessClerk} The class.
   */
  static get ProcessClerkCtor () {
    return ProcessClerk
  }

  /**
   * get: the one logger client this process writes through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * get: the promise-shaped timers of the standard library.
   *
   * Reached through a getter rather than referred to inside the methods that wait, so that the one
   * place this class touches the clock is named and a test can stand something else in its place.
   *
   * @returns {typeof timersPromises} Timers.
   */
  static get timersPromises () {
    return timersPromises
  }

  /**
   * Create the clerk this provider reaches the process's signals through.
   *
   * @returns {ProcessClerk} The clerk.
   */
  static createProcessClerk () {
    return this.ProcessClerkCtor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof JobDispatcherProvider} The class.
   */
  get Ctor () {
    return /** @type {typeof JobDispatcherProvider} */ (this.constructor)
  }

  /**
   * Answer the one live dispatcher of a dispatcher class, building it the first time it is asked
   * for, and giving up on a build that has not connected by the deadline.
   *
   * The build the ask gives up on stays in the pool and stays in flight, so what is given up is
   * this ask and not the connection: the next ask waits on the same build, and the first one after
   * it connects is handed the dispatcher.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {Promise<JobDispatcher>} The dispatcher.
   * @throws {Error} When the build has neither connected nor failed by the deadline.
   * @public
   */
  async ensureJobDispatcher ({
    JobDispatcherCtor,
  }) {
    if (
      !this.hasJobDispatcher({
        JobDispatcherCtor,
      })
    ) {
      this.addJobDispatcherToPool({
        JobDispatcherCtor,
      })
    }

    const jobDispatcherPromise = this.extractJobDispatcherPromise({
      JobDispatcherCtor,
    })

    return this.awaitJobDispatcherWithinDeadline({
      JobDispatcherCtor,
      jobDispatcherPromise,
    })
  }

  /**
   * Check whether a dispatcher class has already been built for.
   *
   * Presence in the pool is the whole of the answer, which it can be because a build that failed
   * takes its own entry back out — so an entry present is an entry worth waiting on, either
   * because it holds a dispatcher or because it is still trying to build one.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {boolean} True when the pool already holds one.
   * @public
   */
  hasJobDispatcher ({
    JobDispatcherCtor,
  }) {
    return this.Ctor.jobDispatcherPromisePool.has(JobDispatcherCtor)
  }

  /**
   * Put the dispatcher of a dispatcher class into the pool, and record the class as one this
   * provider is responsible for closing.
   *
   * The promise is stored rather than awaited, so nothing between the check above and this store
   * lets a second caller start a second build.
   *
   * **The rejection handler is attached to the promise before it is stored, and it is attached to
   * a branch of it rather than in its place.** The pool keeps the original, so a caller awaiting
   * it still sees the rejection and can answer for it; what the branch does is take the entry back
   * out, so the ask after this one builds again instead of being handed a failure from minutes
   * ago. Attaching it here rather than at the ask is also what keeps the rejection handled when
   * nobody is awaiting.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {WeakMap<JobDispatcherCtor, Promise<JobDispatcher>>} The pool.
   * @public
   */
  addJobDispatcherToPool ({
    JobDispatcherCtor,
  }) {
    const jobDispatcherPromise = this.createJobDispatcher({
      JobDispatcherCtor,
    })

    jobDispatcherPromise.catch(() =>
      this.removeJobDispatcherFromPool({
        JobDispatcherCtor,
      })
    )

    this.recordJobDispatcherCtor({
      JobDispatcherCtor,
    })

    return this.Ctor.jobDispatcherPromisePool.set(
      JobDispatcherCtor,
      jobDispatcherPromise
    )
  }

  /**
   * Create the dispatcher of a dispatcher class.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {Promise<JobDispatcher>} The dispatcher.
   * @public
   */
  createJobDispatcher ({
    JobDispatcherCtor,
  }) {
    return JobDispatcherCtor.createAsync()
  }

  /**
   * Take the entry of a dispatcher class back out of the pool.
   *
   * What reaches this is a build that rejected. The class stays in `#JobDispatcherCtors`, because
   * a later ask can build it successfully and there would then be a connection to close; a class
   * with no entry is simply nothing for the shutdown to close.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {boolean} Whether an entry was there to remove.
   * @public
   */
  removeJobDispatcherFromPool ({
    JobDispatcherCtor,
  }) {
    return this.Ctor.jobDispatcherPromisePool.delete(JobDispatcherCtor)
  }

  /**
   * Record a dispatcher class as one this provider is responsible for closing.
   *
   * It is recorded once however often it is built. A class whose first build failed is built again
   * by the next ask, and a second entry in this array would be a second teardown of the one
   * connection the successful build opened.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {Array<JobDispatcherCtor>} The classes this provider is responsible for.
   * @public
   */
  recordJobDispatcherCtor ({
    JobDispatcherCtor,
  }) {
    if (this.JobDispatcherCtors.includes(JobDispatcherCtor)) {
      return this.JobDispatcherCtors
    }

    this.JobDispatcherCtors.push(JobDispatcherCtor)

    return this.JobDispatcherCtors
  }

  /**
   * Extract the pooled promise of a dispatcher class.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {Promise<JobDispatcher> | null} The promise, or null when the pool holds none.
   * @public
   */
  extractJobDispatcherPromise ({
    JobDispatcherCtor,
  }) {
    return this.Ctor.jobDispatcherPromisePool.get(JobDispatcherCtor)
      ?? null
  }

  /**
   * Wait for a build to answer, and give up on waiting when the deadline passes.
   *
   * The deadline is a promise of its own, raced against the build, and it is aborted whichever way
   * the race ends — so a build that answered first leaves no timer behind holding the process open.
   * Aborting it makes it reject, and the race has already attached a handler to it, so that
   * rejection is answered rather than left unhandled.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   *   jobDispatcherPromise: Promise<JobDispatcher>
   * }} params - Parameters.
   * @returns {Promise<JobDispatcher>} The dispatcher.
   * @throws {Error} When the deadline passes first.
   * @public
   */
  async awaitJobDispatcherWithinDeadline ({
    JobDispatcherCtor,
    jobDispatcherPromise,
  }) {
    const deadlineTerminator = new AbortController()

    try {
      return await Promise.race([
        jobDispatcherPromise,
        this.refuseJobDispatcherAtDeadline({
          JobDispatcherCtor,
          signal: deadlineTerminator.signal,
        }),
      ])
    } finally {
      deadlineTerminator.abort()
    }
  }

  /**
   * Refuse a queue connection that has not opened by the deadline.
   *
   * What the caller is handed is an exception rather than a null, on the rule this feature keeps
   * throughout: a caller that asked for a dispatcher and was answered with nothing would carry on
   * as though it had one. For the accept path that exception is what ends the request — with the
   * engine's own answer, because the contract fixes no answer for a queue that cannot be reached.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<void>}
   * @throws {Error} When the deadline passes, which is the whole of what it does.
   * @public
   */
  async refuseJobDispatcherAtDeadline ({
    JobDispatcherCtor,
    signal,
  }) {
    await this.Ctor.timersPromises.setTimeout(
      JOB_DISPATCHER_BUILD_DEADLINE_MILLISECOND,
      null,
      {
        signal,
      }
    )

    this.logUnreachedQueue({
      JobDispatcherCtor,
    })

    throw new Error(`${this.Ctor.name} ${UNREACHED_QUEUE_MESSAGE}: ${JobDispatcherCtor.name}`)
  }

  /**
   * Write the line a queue connection that would not open leaves behind.
   *
   * The dispatcher class names which queue it was, and nothing else is written: what an operator
   * reading this needs is that Redis is not answering, and the exception's own message goes to the
   * caller rather than into two places at once.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logUnreachedQueue ({
    JobDispatcherCtor,
  }) {
    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${UNREACHED_QUEUE_MESSAGE}: ${JobDispatcherCtor.name}`,
      tags: UNREACHED_QUEUE_TAGS,
    })
  }

  /**
   * Attach the handlers that close every open queue connection when the process is asked to stop.
   *
   * **Attaching twice attaches once.** A handler is removed from a process by its identity, and
   * `process.on` handed the same function twice registers it twice — so a provider that rebuilt
   * its sink per attach would answer one `SIGINT` as many times as it had been attached, and
   * `ProcessClerk#detachSink()` could never name any of them. The sink is therefore built once and
   * kept, and it is detached immediately before it is attached: detaching a handler that is not
   * registered does nothing, so the first call attaches and every call after it leaves one
   * registration standing.
   *
   * @returns {NodeJS.Process | null} The process the handlers were attached to.
   * @public
   */
  attachShutdownSink () {
    const sink = this.ensureShutdownSink()

    this.processClerk.detachSink({
      sink,
    })

    return this.processClerk.attachSink({
      sink,
    })
  }

  /**
   * Answer this provider's one shutdown sink, building it the first time it is asked for.
   *
   * @returns {Record<string, () => Promise<void>>} The sink.
   * @public
   */
  ensureShutdownSink () {
    if (!this.hasShutdownSink()) {
      this.addShutdownSinkToPool()
    }

    return this.extractShutdownSink()
  }

  /**
   * Check whether this provider has built its shutdown sink.
   *
   * @returns {boolean} True when the pool already holds one.
   * @public
   */
  hasShutdownSink () {
    return this.Ctor.shutdownSinkPool.has(this)
  }

  /**
   * Put this provider's shutdown sink into the pool.
   *
   * @returns {WeakMap<JobDispatcherProvider, Record<string, () => Promise<void>>>} The pool.
   * @public
   */
  addShutdownSinkToPool () {
    const sink = this.buildShutdownSink()

    return this.Ctor.shutdownSinkPool.set(this, sink)
  }

  /**
   * Build the handlers a shutdown signal is answered by.
   *
   * @returns {Record<string, () => Promise<void>>} The sink.
   * @public
   */
  buildShutdownSink () {
    return {
      SIGINT: () => this.shutdownJobDispatchers(),
      SIGTERM: () => this.shutdownJobDispatchers(),
    }
  }

  /**
   * Extract this provider's pooled shutdown sink.
   *
   * @returns {Record<string, () => Promise<void>> | null} The sink, or null when the pool holds
   * none.
   * @public
   */
  extractShutdownSink () {
    return this.Ctor.shutdownSinkPool.get(this)
      ?? null
  }

  /**
   * Close every open queue connection, then end the process.
   *
   * **The exit is part of this, and not an overreach.** Attaching a `SIGINT` handler to a Node
   * process replaces Node's own, which is the one that ended the process; a handler that closed
   * the queues and returned would leave `Ctrl-C` doing nothing at all. So whoever answers the
   * signal owes the exit, and that is this method.
   *
   * **Which is why the teardown cannot decide whether the exit happens.** A teardown that rejected
   * used to carry the rejection out of here, and the line below it never ran: the process was left
   * running with its default `SIGINT` handling already removed, so the signal that asked it to
   * stop had made it unstoppable. The guard below answers that, and it answers only half of it —
   * a rejection is caught, and a teardown that never settles is not a rejection. One that waits on
   * a build that never connected never settles at all, and the guard waits with it, and the exit
   * is not reached: measured, with Redis gone, as a process that took the signal and stayed up. So
   * the wait is bounded as well as guarded, and between the two the exit is taken on both paths a
   * teardown has.
   *
   * @returns {Promise<void>}
   * @public
   */
  async shutdownJobDispatchers () {
    try {
      await this.teardownJobDispatchersWithinDeadline()
    } catch (error) {
      this.logFailedShutdown({
        error,
      })
    }

    this.processClerk.exit()
  }

  /**
   * Close every open queue connection, and stop waiting when the deadline passes.
   *
   * The deadline throwing is what carries control back to the caller above, which writes the line
   * and takes the exit. What is given up is the waiting and not the closing: a teardown still in
   * flight goes on until the process ends, which is a moment later.
   *
   * @returns {Promise<Array<*>>} What each teardown answered.
   * @throws {Error} When the teardowns have not all settled by the deadline.
   * @public
   */
  async teardownJobDispatchersWithinDeadline () {
    const deadlineTerminator = new AbortController()

    try {
      return await Promise.race([
        this.teardownJobDispatchers(),
        this.abandonTeardownAtDeadline({
          signal: deadlineTerminator.signal,
        }),
      ])
    } finally {
      deadlineTerminator.abort()
    }
  }

  /**
   * Abandon a teardown that has not finished by the deadline.
   *
   * @param {{
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<void>}
   * @throws {Error} When the deadline passes, which is the whole of what it does.
   * @public
   */
  async abandonTeardownAtDeadline ({
    signal,
  }) {
    await this.Ctor.timersPromises.setTimeout(
      QUEUE_SHUTDOWN_DEADLINE_MILLISECOND,
      null,
      {
        signal,
      }
    )

    throw new Error(`${this.Ctor.name} ${UNFINISHED_TEARDOWN_MESSAGE}`)
  }

  /**
   * Close the queue connection of every dispatcher this provider built.
   *
   * Each is closed on its own and answers for itself, so the whole set is settled rather than
   * abandoned at the first one that would not close — `Promise.all` over promises that reject
   * stops waiting on the rest, and the rest are the connections nothing else is going to close.
   *
   * What it cannot answer for is a build still in flight: closing one means waiting for it first,
   * and a build against a Redis that is not there does not answer. The deadline above is what
   * bounds that, rather than anything here.
   *
   * @returns {Promise<Array<*>>} What each teardown answered, null in the place of one that threw
   * and of a dispatcher class no build ever succeeded for.
   * @public
   */
  async teardownJobDispatchers () {
    return Promise.all(
      this.JobDispatcherCtors
        .map(it =>
          this.teardownJobDispatcher({
            JobDispatcherCtor: it,
          })
        )
    )
  }

  /**
   * Close the queue connection of one dispatcher class.
   *
   * A class with no entry in the pool is one whose build failed and was taken back out, so there
   * is no connection of it to close and nothing to report.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {Promise<*>} What the teardown answered, or null when it threw or there was nothing
   * to close.
   * @public
   */
  async teardownJobDispatcher ({
    JobDispatcherCtor,
  }) {
    const jobDispatcherPromise = this.extractJobDispatcherPromise({
      JobDispatcherCtor,
    })

    if (jobDispatcherPromise === null) {
      return null
    }

    try {
      const jobDispatcher = await jobDispatcherPromise

      return await jobDispatcher.teardown()
    } catch (error) {
      this.logFailedJobDispatcherTeardown({
        JobDispatcherCtor,
        error,
      })

      return null
    }
  }

  /**
   * Write the line a queue connection that would not close leaves behind.
   *
   * The dispatcher class names which connection it was, which is the one thing an operator reading
   * this needs and the one thing a settled-rather-than-raced teardown would otherwise lose. The
   * error's class is named and its message is not, on the rule this feature keeps throughout: a
   * message is text this service did not compose.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   *   error: Error
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logFailedJobDispatcherTeardown ({
    JobDispatcherCtor,
    error,
  }) {
    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${FAILED_TEARDOWN_MESSAGE}: ${JobDispatcherCtor.name}, ${error.constructor.name}`,
      tags: FAILED_TEARDOWN_TAGS,
    })
  }

  /**
   * Write the line a shutdown that threw outside any one teardown leaves behind.
   *
   * The deadline is what reaches this in practice: every teardown answers for itself, so what is
   * left for a shutdown to fail at is waiting on one that never answers.
   *
   * What the line carries is the error's class and not its message, on the rule this feature keeps
   * throughout — so a shutdown abandoned at the deadline and one that threw for some other reason
   * read alike here. What an operator learns from it is that the connections were not all closed
   * before the process ended, which is the part that is the same either way.
   *
   * @param {{
   *   error: Error
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logFailedShutdown ({
    error,
  }) {
    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${FAILED_SHUTDOWN_MESSAGE}: ${error.constructor.name}`,
      tags: FAILED_SHUTDOWN_TAGS,
    })
  }
}

/**
 * @typedef {{
 *   JobDispatcherCtors: Array<JobDispatcherCtor>
 *   processClerk: ProcessClerk
 * }} JobDispatcherProviderParams
 */

/**
 * @typedef {Partial<JobDispatcherProviderParams>} JobDispatcherProviderFactoryParams
 */

/**
 * What this class asks of a dispatcher class, and the whole of it. Stated structurally so that
 * which queue a dispatcher opens stays the dispatcher's business rather than this class's. The
 * name is asked for so that a connection that would not close can be named in a log; every class
 * has one.
 *
 * @typedef {{
 *   name: string
 *   createAsync: () => Promise<JobDispatcher>
 * }} JobDispatcherCtor
 */

/**
 * @typedef {{
 *   teardown: () => Promise<*>
 * }} JobDispatcher
 */
