/**
 * The one answer shape a caller reads, whichever model answered.
 *
 * **What this normalizes, and what it does not.** The vendor-shaped work — pulling the text, the
 * tool calls, the failure and the token spend out of whatever JSON came back — belongs to the
 * capsule the driver hands over. This wraps that capsule and publishes the members a caller is
 * allowed to know about, so the surface is identical across drivers and the caller never learns
 * which one it is holding. Adding a driver adds a capsule; it does not add a branch here.
 *
 * **Why each member guards before delegating.** The capsule is duck-typed on purpose: a driver may
 * bring any object that answers `AiResponseCapsule`, including the driver a keyless installation
 * runs. What keeps that honest is a capsule that does not answer a member failing loudly, named,
 * at the point of the call — rather than the member quietly reading as absent and a run recording
 * nothing.
 */
export default class AiModelResponse {
  /**
   * Constructor.
   *
   * @param {AiModelResponseParams} params - Parameters.
   */
  constructor ({
    aiResponseCapsule,
  }) {
    this.aiResponseCapsule = aiResponseCapsule
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiModelResponse ? X : never} T, X
   * @param {AiModelResponseParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiResponseCapsule,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiResponseCapsule,
      })
    )
  }

  /**
   * Check whether the model answered with a failure.
   *
   * @returns {boolean} True when the call failed.
   * @throws {Error} When the capsule does not answer this member.
   * @public
   */
  hasError () {
    if (!this.aiResponseCapsule?.hasError) {
      throw new Error('aiResponseCapsule#hasError() must be implemented')
    }

    return this.aiResponseCapsule.hasError()
  }

  /**
   * Extract the text the model answered with.
   *
   * @returns {string} The answered text.
   * @throws {Error} When the capsule does not answer this member.
   * @public
   */
  extractContentText () {
    if (!this.aiResponseCapsule?.extractContentText) {
      throw new Error('aiResponseCapsule#extractContentText() must be implemented')
    }

    return this.aiResponseCapsule.extractContentText()
  }

  /**
   * Extract the tool calls the model asked for.
   *
   * @returns {Array<AiFunctionCall>} The tool calls, empty when the model asked for none.
   * @throws {Error} When the capsule does not answer this member.
   * @public
   */
  extractFunctionCalls () {
    if (!this.aiResponseCapsule?.extractFunctionCalls) {
      throw new Error('aiResponseCapsule#extractFunctionCalls() must be implemented')
    }

    return this.aiResponseCapsule.extractFunctionCalls()
  }

  /**
   * Extract the message of the failure the model answered with.
   *
   * @returns {string} The failure message.
   * @throws {Error} When the capsule does not answer this member.
   * @public
   */
  extractErrorMessage () {
    if (!this.aiResponseCapsule?.extractErrorMessage) {
      throw new Error('aiResponseCapsule#extractErrorMessage() must be implemented')
    }

    return this.aiResponseCapsule.extractErrorMessage()
  }

  /**
   * Extract how many tokens the request spent.
   *
   * @returns {number} The input token count.
   * @throws {Error} When the capsule does not answer this member.
   * @public
   */
  extractInputTokenCount () {
    if (!this.aiResponseCapsule?.extractInputTokenCount) {
      throw new Error('aiResponseCapsule#extractInputTokenCount() must be implemented')
    }

    return this.aiResponseCapsule.extractInputTokenCount()
  }

  /**
   * Extract how many tokens the answer spent.
   *
   * @returns {number} The output token count.
   * @throws {Error} When the capsule does not answer this member.
   * @public
   */
  extractOutputTokenCount () {
    if (!this.aiResponseCapsule?.extractOutputTokenCount) {
      throw new Error('aiResponseCapsule#extractOutputTokenCount() must be implemented')
    }

    return this.aiResponseCapsule.extractOutputTokenCount()
  }
}

/**
 * @typedef {{
 *   aiResponseCapsule: AiResponseCapsule
 * }} AiModelResponseParams
 */

/**
 * @typedef {{
 *   hasError: () => boolean
 *   extractContentText: () => string
 *   extractFunctionCalls: () => Array<AiFunctionCall>
 *   extractErrorMessage: () => string
 *   extractInputTokenCount: () => number
 *   extractOutputTokenCount: () => number
 * }} AiResponseCapsule
 */

/**
 * @typedef {{
 *   name: string
 *   arguments: Record<string, *>
 * }} AiFunctionCall
 */
