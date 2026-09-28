const NO_CONTENT_TEXT = ''

const NO_TOKEN_COUNT = 0

/*
 * What a driver says when it refused to make a call because the run was already told to stop.
 *
 * It is the whole of the answer rather than a prefix on a vendor's, because no vendor was reached:
 * there is no provider message to carry, and inventing one would put a failure on Google's account
 * that Google never saw.
 */
const REFUSED_ABORTED_CALL_MESSAGE = 'refused a call whose run had already been told to stop'

/**
 * What every driver answers when it refuses a call because the run's abort signal was already
 * raised.
 *
 * **Why the refusal is a capsule rather than a raise.** A driver hands back one shape and the
 * caller asks `#hasError()`; that is the whole reason `AiModelResponse` exists. A refusal that
 * raised would make every caller of every driver wrap the call in a `try`, and — worse here — a
 * raise travelling out of `AssetMediaReadingFetcher` would reach the worker as a thrown failure
 * and be recorded as `PROVIDER_CALL_FAILED`, which is the wrong terminal reason for a run that
 * was canceled. Answered as a capsule, a refused call reads exactly like a call the vendor
 * failed, and the run settles on its own terms.
 *
 * **Why it is vendor-neutral and lives beside `AiModelResponse`.** The question it answers —
 * "this run has already been told to stop" — is asked before any vendor is involved and has the
 * same answer for every driver, the keyless one included. `BaseAiModelProcessor` builds it, so a
 * driver added later refuses in the same words without writing a line.
 *
 * **Why both token counts are zero, and what that does not mean.** Nothing was sent, so nothing
 * was spent, and `ai_model_calls` takes neither count as null. That is the truth for *this*
 * capsule only — a call refused before it left. It is emphatically **not** the story of a call
 * that was already in flight when the signal was raised: that call reached the vendor, the vendor
 * answers no usage figure to a connection that was dropped, its row is recorded with zeros as
 * well, and the vendor bills for it regardless. `@google/genai` states this in its own
 * declaration of `abortSignal`: aborting is a client-only operation, it does not cancel the work
 * in the service, and the usage is still charged. An operator reconciling an invoice against
 * `ai_model_calls` will therefore find charges with no tokens recorded behind them, and the
 * records are not wrong.
 */
export default class AbortedAiCallCapsule {
  /**
   * Constructor.
   *
   * @param {AbortedAiCallCapsuleParams} params - Parameters.
   */
  constructor ({
    refusalMessage,
  }) {
    this.refusalMessage = refusalMessage
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AbortedAiCallCapsule ? X : never} T, X
   * @param {AbortedAiCallCapsuleFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    refusalMessage = REFUSED_ABORTED_CALL_MESSAGE,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        refusalMessage,
      })
    )
  }

  /**
   * Check whether the model answered with a failure.
   *
   * @returns {boolean} Always true: a refused call produced no answer to read.
   * @public
   */
  hasError () {
    return true
  }

  /**
   * Extract the text the model answered with.
   *
   * @returns {string} Always empty: nothing was asked and nothing came back.
   * @public
   */
  extractContentText () {
    return NO_CONTENT_TEXT
  }

  /**
   * Extract the tool calls the model asked for.
   *
   * A fresh array each time rather than one shared constant, so a caller that appends to what it
   * was handed cannot leave the next refusal carrying calls the model never asked for.
   *
   * @returns {Array<Record<string, *>>} Always empty: nothing was asked and nothing came back.
   * @public
   */
  extractFunctionCalls () {
    return []
  }

  /**
   * Extract the message of the failure this call is recorded under.
   *
   * @returns {string} The refusal this driver answered with.
   * @public
   */
  extractErrorMessage () {
    return this.refusalMessage
  }

  /**
   * Extract how many tokens the request spent.
   *
   * @returns {number} Always zero: the request never left this machine.
   * @public
   */
  extractInputTokenCount () {
    return NO_TOKEN_COUNT
  }

  /**
   * Extract how many tokens the answer spent.
   *
   * @returns {number} Always zero: the request never left this machine.
   * @public
   */
  extractOutputTokenCount () {
    return NO_TOKEN_COUNT
  }
}

/**
 * @typedef {{
 *   refusalMessage: string
 * }} AbortedAiCallCapsuleParams
 */

/**
 * @typedef {Partial<AbortedAiCallCapsuleParams>} AbortedAiCallCapsuleFactoryParams
 */
