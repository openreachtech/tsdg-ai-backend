import AI_RUN_STATUS_CONSTANT_HASH from '../constants/aiRunStatusConstants.js'

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

const TERMINAL_AI_RUN_STATUS_IDS = [
  AI_RUN_STATUS.SUCCEEDED.ID,
  AI_RUN_STATUS.FAILED.ID,
  AI_RUN_STATUS.CANCELED.ID,
]

/**
 * Answers whether a run status is one a run never leaves.
 *
 * **Why the question is a class of its own.** Succeeded, failed and canceled are terminal: a run
 * that reached one of them stays there, and every later write against that run has to be refused.
 * That is one question with one answer, asked by whatever is about to write — the recorder that
 * moves a run, a cancellation arriving late, a job deciding whether there is anything left to do —
 * so it is answered in one place rather than re-derived at each of them. Keeping it apart from the
 * write also makes it answerable without a database at all: the question takes a status id and
 * returns a boolean, and a test states the id rather than seeding a row to carry it.
 *
 * **Which statuses are terminal is read from the master constant, never written as a number.** The
 * five statuses and their ids are declared in `constants/aiRunStatusConstants.cjs`, which is also
 * what seeds `ai_run_statuses`. Binding to the hash is what keeps this class and that table saying
 * the same thing; a literal `3` here would keep agreeing with it right up until it did not.
 *
 * **An id this service does not know is not terminal.** A status outside the five answers false —
 * it names no state a run settled in, so nothing about it says a run is finished. The guard that
 * consumes this answer therefore refuses only what it can show to be terminal, rather than refusing
 * everything it does not recognize.
 */
export default class AiRunTerminalStatusInspector {
  /**
   * Constructor.
   *
   * @param {AiRunTerminalStatusInspectorParams} params - Parameters.
   */
  constructor ({
    terminalAiRunStatusIds,
  }) {
    this.terminalAiRunStatusIds = terminalAiRunStatusIds
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunTerminalStatusInspector ? X : never} T, X
   * @param {AiRunTerminalStatusInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    terminalAiRunStatusIds = TERMINAL_AI_RUN_STATUS_IDS,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        terminalAiRunStatusIds,
      })
    )
  }

  /**
   * Check whether a run carrying this status has settled for good.
   *
   * @param {{
   *   aiRunStatusId: *
   * }} params - Parameters.
   * @returns {boolean} Whether the status is one a run never leaves.
   * @public
   */
  isTerminalAiRunStatus ({
    aiRunStatusId,
  }) {
    return this.terminalAiRunStatusIds
      .includes(aiRunStatusId)
  }
}

/**
 * @typedef {{
 *   terminalAiRunStatusIds: Array<number>
 * }} AiRunTerminalStatusInspectorParams
 */

/**
 * @typedef {Partial<AiRunTerminalStatusInspectorParams>} AiRunTerminalStatusInspectorFactoryParams
 */
