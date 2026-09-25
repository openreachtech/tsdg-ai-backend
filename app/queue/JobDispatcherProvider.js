import {
  ProcessClerk,
} from '@openreachtech/renchan-job-bullmq'

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
 * **What it promises.** One dispatcher per dispatcher class, built once, reused by everything that
 * asks, and closed once when the process is asked to stop.
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
 */
export default class JobDispatcherProvider {
  /**
   * Pool of dispatcher promises, keyed by the dispatcher class that produced each.
   *
   * @type {WeakMap<JobDispatcherCtor, Promise<JobDispatcher>>}
   */
  static jobDispatcherPromisePool = new WeakMap()

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

    this.JobDispatcherCtors.push(JobDispatcherCtor)

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
   * @returns {NodeJS.Process | null} The process the handlers were attached to.
   * @public
   */
  attachShutdownSink () {
    const sink = this.buildShutdownSink()

    return this.processClerk.attachSink({
      sink,
    })
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
   * Close every open queue connection, then end the process.
   *
   * **The exit is part of this, and not an overreach.** Attaching a `SIGINT` handler to a Node
   * process replaces Node's own, which is the one that ended the process; a handler that closed
   * the queues and returned would leave `Ctrl-C` doing nothing at all. So whoever answers the
   * signal owes the exit, and that is this method.
   *
   * @returns {Promise<void>}
   * @public
   */
  async shutdownJobDispatchers () {
    await this.teardownJobDispatchers()

    this.processClerk.exit()
  }

  /**
   * Close the queue connection of every dispatcher this provider built.
   *
   * @returns {Promise<Array<*>>} What each teardown answered.
   * @public
   */
  async teardownJobDispatchers () {
    const jobDispatchers = await this.extractJobDispatchers()

    return Promise.all(
      jobDispatchers.map(it => it.teardown())
    )
  }

  /**
   * Extract every dispatcher this provider built.
   *
   * @returns {Promise<Array<JobDispatcher>>} The dispatchers.
   * @public
   */
  async extractJobDispatchers () {
    return Promise.all(
      this.JobDispatcherCtors
        .map(it =>
          this.extractJobDispatcherPromise({
            JobDispatcherCtor: it,
          })
        )
    )
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
 * which queue a dispatcher opens stays the dispatcher's business rather than this class's.
 *
 * @typedef {{
 *   createAsync: () => Promise<JobDispatcher>
 * }} JobDispatcherCtor
 */

/**
 * @typedef {{
 *   teardown: () => Promise<*>
 * }} JobDispatcher
 */
