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

const FAILED_TEARDOWN_TAGS = [
  'JobDispatcher',
  'FailedTeardown',
]

const FAILED_SHUTDOWN_TAGS = [
  'JobDispatcher',
  'FailedShutdown',
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
 * **The shutdown owes the exit, so it takes it whatever the teardowns do.** Each dispatcher is
 * closed on its own and a failure to close one is written down rather than thrown, so one stuck
 * connection does not leave the others open; and the whole teardown sits inside a guard, so the
 * exit below it is reached on every path. Attaching a `SIGINT` handler removes the one Node
 * installed, and what that handler replaced was a process that ended.
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
   * for.
   *
   * @param {{
   *   JobDispatcherCtor: JobDispatcherCtor
   * }} params - Parameters.
   * @returns {Promise<JobDispatcher>} The dispatcher.
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

    return this.extractJobDispatcherPromise({
      JobDispatcherCtor,
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
   * stop had made it unstoppable. The guard is what settles that — the failure is written down and
   * the exit is taken, because a queue connection that would not close is not a reason to keep a
   * process the operator asked to end.
   *
   * @returns {Promise<void>}
   * @public
   */
  async shutdownJobDispatchers () {
    try {
      await this.teardownJobDispatchers()
    } catch (error) {
      this.logFailedShutdown({
        error,
      })
    }

    this.processClerk.exit()
  }

  /**
   * Close the queue connection of every dispatcher this provider built.
   *
   * Each is closed on its own and answers for itself, so the whole set is settled rather than
   * abandoned at the first one that would not close — `Promise.all` over promises that reject
   * stops waiting on the rest, and the rest are the connections nothing else is going to close.
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
   * Nothing reaches this today — every teardown answers for itself — and it is here because the
   * exit below it must not depend on that staying true.
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
