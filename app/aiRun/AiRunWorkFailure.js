/*
 * What a failure raised by a run's work is described as, with its reason code appended.
 *
 * Nothing a caller sent goes into it. `BaseAiRunJobWorker` logs a failure's class and its reason
 * code and deliberately leaves the thrown message where it was thrown, so that a job fetching
 * media or calling a provider cannot put a URL, a file name or a fragment of a medium into a file
 * kept for operators - and a message built here out of any of those would put it back.
 */
const FAILED_AI_RUN_WORK_MESSAGE = 'the work of a run failed'

/**
 * The failure a run's work raises when it knows why the run is over.
 *
 * **It exists because a throw is the only failure channel a run's work has.**
 * `BaseAiRunJobWorker#executeAiRunWork()` answers with the result the run settled, so a work that
 * cannot settle one has to raise - and the run's row wants two things that a bare `Error` carries
 * neither of: the reason code the client contract fixes, and the parameters that reason names. A
 * step that already knows both - `AiRunMediaCollector` answers a refusal as a value carrying
 * exactly those two fields - would otherwise have to flatten them into a message somebody parsed
 * back out.
 *
 * **It is a value with a class, not a hierarchy.** There is one of these rather than one per
 * reason, because what tells two failures apart is the code they carry and that code is already a
 * closed set written down in `aiRunFailureReasonConstants.cjs`. A class per code would be seven
 * classes whose only difference was a string, and an eighth code would then be a file rather than
 * a line.
 *
 * **What reads it is the concrete worker, not the base.** `BaseAiRunJobWorker` knows only that a
 * work threw something, and asks `#extractAiRunFailureReasonCode()` what to record it as; a
 * concrete worker that raises this answers out of the instance it was handed. Anything else thrown
 * - a `TypeError`, a driver's own error - carries no code and falls back to the base's answer,
 * which is what that member is documented to be for.
 */
export default class AiRunWorkFailure extends Error {
  /**
   * Constructor.
   *
   * @param {AiRunWorkFailureParams} params - Parameters.
   */
  constructor ({
    message,
    failureReasonCode,
    failureParameters,
  }) {
    super(message)

    this.failureReasonCode = failureReasonCode
    this.failureParameters = failureParameters
  }

  /**
   * Factory method.
   *
   * The message is composed here rather than in the constructor, because composing it is the one
   * piece of work the construction of this class does and a constructor may hold none.
   *
   * @template {X extends typeof AiRunWorkFailure ? X : never} T, X
   * @param {AiRunWorkFailureFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    failureReasonCode,
    failureParameters = null,
  }) {
    const message = this.generateMessage({
      failureReasonCode,
    })

    return /** @type {InstanceType<T>} */ (
      new this({
        message,
        failureReasonCode,
        failureParameters,
      })
    )
  }

  /**
   * Generate the text this failure carries as its message.
   *
   * **The class's own name is deliberately not in it.** `this.name` inside a static reads the name
   * of the class the call was made on, and a subclass - a test's constructor spy is one - would
   * produce a different message for the same failure. What identifies the class is
   * `error.constructor.name`, which is what `BaseAiRunJobWorker` already logs; what identifies the
   * failure is the reason code, and that is what belongs here.
   *
   * @param {{
   *   failureReasonCode: string
   * }} params - Parameters.
   * @returns {string} The message.
   * @public
   */
  static generateMessage ({
    failureReasonCode,
  }) {
    return `${FAILED_AI_RUN_WORK_MESSAGE}: ${failureReasonCode}`
  }
}

/**
 * @typedef {{
 *   message: string
 *   failureReasonCode: string
 *   failureParameters: Record<string, *> | null
 * }} AiRunWorkFailureParams
 */

/**
 * @typedef {{
 *   failureReasonCode: string
 *   failureParameters?: Record<string, *> | null
 * }} AiRunWorkFailureFactoryParams
 */
