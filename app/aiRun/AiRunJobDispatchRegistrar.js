/**
 * Registers the dispatch of a run's job on the commit of the transaction that created the run.
 *
 * **Why the registration is a class of its own.** A run is dispatched only once it exists, and
 * "it exists" is a database event rather than an HTTP one: the row is visible to the worker the
 * moment the transaction commits, and never before. The renderer that answered the request is not
 * where that can be decided — it holds an envelope and a status code, and it returns while the
 * commit is still the transaction's business. Keeping the registration here leaves the renderer
 * holding one call, and leaves the same rule reachable from anything else that accepts a run
 * inside a transaction of its own.
 *
 * **The rollback direction is the one this exists for.** A dispatch issued inside the transaction
 * would be sent whether or not the transaction went on to commit, and a rolled-back run would
 * leave a job naming a row that does not exist — the worker would load nothing, and a client
 * would have been told a run was queued that was never written. `transaction.afterCommit()` is
 * what closes that: Sequelize runs those hooks from `commit()` alone (`sequelize/lib/transaction.js`),
 * and `rollback()` never reaches them, so a rolled-back transaction dispatches nothing without
 * this class having to notice the rollback at all.
 *
 * **What `afterCommit` does not close, stated rather than assumed.** Sequelize runs the hooks in
 * the `finally` of `commit()`, so a COMMIT that itself failed still reaches them — the hooks fire
 * on a transaction that did not commit. Nothing here can tell that case apart from a real commit,
 * because the transaction reports `finished: 'commit'` either way. The harm is bounded to the same
 * shape as any stale enqueue, and it is answered where it can be answered: a worker loads its run
 * by id and has nothing to do when the row is absent.
 *
 * **The dispatcher is injected rather than built here, and it is held open.** Building one is
 * asynchronous — the package opens a BullMQ queue and waits until it is ready — so there is no
 * synchronous default a factory method could supply. It is also the one object that must outlive a
 * single run: `BaseJobDispatcher#dispatchJob()` tears its own Redis connection down in a `finally`
 * unless `keepsConnection: true` is passed, which would be a connect and a disconnect per accepted
 * run, and would leave a reused dispatcher's queue closed under the second run. So the dispatch
 * below asks for the connection to be kept, and tearing the dispatcher down belongs to whoever
 * built it, at the end of the process rather than the end of a request.
 */
export default class AiRunJobDispatchRegistrar {
  /**
   * Constructor.
   *
   * @param {AiRunJobDispatchRegistrarParams} params - Parameters.
   */
  constructor ({
    jobDispatcher,
  }) {
    this.jobDispatcher = jobDispatcher
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunJobDispatchRegistrar ? X : never} T, X
   * @param {AiRunJobDispatchRegistrarFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    jobDispatcher,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        jobDispatcher,
      })
    )
  }

  /**
   * Register the run's job to be dispatched once the transaction that created it commits.
   *
   * The callback is registered, not run: nothing is sent while this returns, and what happens next
   * is the transaction's to decide. A commit sends exactly one dispatch, a rollback sends none.
   *
   * @param {{
   *   transaction: Transaction
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  registerAiRunJobDispatch ({
    transaction,
    aiRunId,
  }) {
    transaction.afterCommit(() =>
      this.dispatchAiRunJob({
        aiRunId,
      })
    )
  }

  /**
   * Dispatch the job that runs the accepted run.
   *
   * The body carries the run's id and nothing else — the worker loads the run it names, so a value
   * copied into the queue could only go stale between the enqueue and the run.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The dispatcher's response.
   * @public
   */
  async dispatchAiRunJob ({
    aiRunId,
  }) {
    return this.jobDispatcher.dispatchJob({
      body: {
        aiRunId,
      },
      keepsConnection: true,
    })
  }
}

/**
 * What this class asks of a job dispatcher, and the whole of it. Stated structurally so that the
 * queue this dispatches to stays the dispatcher's business rather than this class's.
 *
 * @typedef {{
 *   dispatchJob: (params: {
 *     body: Record<string, *>
 *     keepsConnection?: boolean
 *   }) => Promise<*>
 * }} JobDispatcherContract
 */

/**
 * @typedef {{
 *   jobDispatcher: JobDispatcherContract
 * }} AiRunJobDispatchRegistrarParams
 */

/**
 * @typedef {AiRunJobDispatchRegistrarParams} AiRunJobDispatchRegistrarFactoryParams
 */

/**
 * @typedef {import('sequelize').Transaction} Transaction
 */
