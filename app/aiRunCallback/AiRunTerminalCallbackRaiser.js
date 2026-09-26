import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import {
  env,
  rootPath,
} from '../globals/_.js'

const LOG_FILE_PATH = rootPath.to('logs/ai-run-callback-')

const UNRAISED_TERMINAL_CALLBACK_TAGS = [
  'AiRunCallback',
  'UnraisedJob',
]

const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * Raises the job that posts a run's terminal callback.
 *
 * **The trigger is the terminal transition and nothing else.** Section 12's background-jobs table
 * gives it in those words — "a run reaching succeeded, failed or canceled" — and its first
 * acceptance criterion is that every such run produces one terminal callback. So this class is
 * called by whatever settled the run, once, immediately after the state was written: raising it
 * before the write would promise a client a result the database had not accepted yet, and raising
 * it from a clock would mean sweeping a table for runs that had not been called back.
 *
 * **Why it is a class rather than two lines at the call site.** The caller that settles a run has
 * no business knowing the queue's body shape or that a dispatcher holds its connection open. It
 * has one sentence to say — this run has settled — and this class is that sentence. It is also the
 * seam a test of the settling substitutes, and the one place a second settler (a cancellation,
 * which is a later feature, and which settles a run outside any worker) will reuse rather than
 * restate.
 *
 * **Nothing raised from here is allowed to fail the caller.** The run is already terminal, and a
 * terminal state is never rewritten; a queue that could not be reached must not turn a run that
 * succeeded into a caller that throws, and a retry of that caller could not re-settle the run
 * anyway. So the failure is logged and swallowed, which is this repository's rule at a boundary —
 * and the client's own route to the answer is still open: reading the run back by its key is
 * section 12's second use case and exists for exactly this.
 *
 * **What is lost when that happens, stated rather than implied.** The callback is not raised at
 * all, so it is not retried either — the attempt count in the dispatcher bounds a job that exists,
 * and there is no job. The line this class writes is the only record that a run settled and no
 * callback was ever queued for it.
 */
export default class AiRunTerminalCallbackRaiser {
  /**
   * Constructor.
   *
   * @param {AiRunTerminalCallbackRaiserParams} params - Parameters.
   */
  constructor ({
    jobDispatcher,
  }) {
    this.jobDispatcher = jobDispatcher
  }

  /**
   * Factory method.
   *
   * The dispatcher arrives built. It holds a Redis connection that has to outlive the run that
   * first opened it and be closed once when the process stops, so it is owned by whatever owns the
   * process — a worker's own dispatcher hash, or the request path's provider — and never built
   * here.
   *
   * @template {X extends typeof AiRunTerminalCallbackRaiser ? X : never} T, X
   * @param {AiRunTerminalCallbackRaiserFactoryParams} params - Parameters for the factory method.
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
   * get: the logger client this process writes unraised callbacks through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunTerminalCallbackRaiser} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunTerminalCallbackRaiser} */ (this.constructor)
  }

  /**
   * Raise the terminal callback of a run that has just settled.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The dispatcher's response, or null when the job was not raised.
   * @public
   */
  async raiseTerminalCallback ({
    aiRunId,
  }) {
    const response = await this.dispatchTerminalCallbackJob({
      aiRunId,
    })

    if (response === null) {
      return null
    }

    if (response.hasError()) {
      this.logUnraisedTerminalCallback({
        aiRunId,
      })

      return null
    }

    return response
  }

  /**
   * Send the job to the queue that delivers terminal callbacks.
   *
   * The body carries the run's id and nothing else — the worker reads the run it names, so a value
   * copied into the queue could only go stale between the enqueue and the attempt.
   *
   * The connection is kept open, because the dispatcher handed in is one the process reuses: a
   * dispatch that closed it would leave the next settled run opening another.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The dispatcher's response, or null when the queue could not be reached.
   * @public
   */
  async dispatchTerminalCallbackJob ({
    aiRunId,
  }) {
    try {
      return await this.jobDispatcher.dispatchJob({
        body: {
          aiRunId,
        },
        keepsConnection: true,
      })
    } catch (error) {
      this.logUnraisedTerminalCallback({
        aiRunId,
      })

      return null
    }
  }

  /**
   * Write the line naming a run that settled with no callback queued for it.
   *
   * The line carries the run's id alone. What the queue's own error says is not written: it is
   * composed by a library out of a connection this service configures, and section 7 keeps a log
   * to ids, reason codes and counts.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logUnraisedTerminalCallback ({
    aiRunId,
  }) {
    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name}#raiseTerminalCallback() reached no queue: AiRunId ${aiRunId}`,
      tags: UNRAISED_TERMINAL_CALLBACK_TAGS,
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
 * }} AiRunTerminalCallbackRaiserParams
 */

/**
 * @typedef {AiRunTerminalCallbackRaiserParams} AiRunTerminalCallbackRaiserFactoryParams
 */
