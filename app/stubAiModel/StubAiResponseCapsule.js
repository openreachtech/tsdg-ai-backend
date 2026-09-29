import StubAnswerDigester from './StubAnswerDigester.js'

const STUB_CONTENT_TEXT_PREFIX = 'stub-answer:'

const CHARACTERS_PER_TOKEN = 4

const MINIMUM_OUTPUT_TOKEN_COUNT = 24
const OUTPUT_TOKEN_COUNT_RANGE = 256
const OUTPUT_TOKEN_COUNT_SEED_SUFFIX = ':outputTokenCount'

const NO_ERROR_MESSAGE = ''

/**
 * What the stub driver answers, in the shape the canonical response reads any answer in.
 *
 * **Why it is a capsule and not a special case.** `AiModelResponse` wraps whatever the driver hands
 * it and publishes six members, checking as it delegates that the capsule answers each one. A stub
 * that returned something else — a bare object, a shortcut past the wrapper — would be the one
 * answer in the system that never went through the shape every other answer goes through, and the
 * first real vendor turned on would be the first time that path was exercised. So this answers all
 * six, and a caller reading it cannot tell it apart from a vendor's.
 *
 * **Why the counts are real numbers rather than zeros.** `ai_model_calls` records an input and an
 * output token count per call and neither is nullable, and a run is billed by reading them. Zeros
 * would make a keyless installation's records unreadable in exactly the way the records exist to
 * prevent, and would hide a recorder that dropped the value. The input count is the size of the
 * request that was built, which is a real quantity even though nothing was sent; the output count is
 * drawn from the digest of the request, so it varies between requests the way a real answer's does
 * and repeats exactly for a request already seen.
 *
 * **Why it never fails.** A driver that opens no connection has no failure to report: there is no
 * timeout, no rate limit and no refused key. `#hasError()` is therefore always false and the message
 * always empty — not because failure is unimportant, but because inventing one here would make a
 * default installation flaky for a reason no operator could investigate.
 */
export default class StubAiResponseCapsule {
  /**
   * Constructor.
   *
   * @param {StubAiResponseCapsuleParams} params - Parameters.
   */
  constructor ({
    contentText,
    functionCalls,
    inputTokenCount,
    outputTokenCount,
  }) {
    this.contentText = contentText
    this.functionCalls = functionCalls
    this.inputTokenCount = inputTokenCount
    this.outputTokenCount = outputTokenCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof StubAiResponseCapsule ? X : never} T, X
   * @param {StubAiResponseCapsuleParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    contentText,
    functionCalls,
    inputTokenCount,
    outputTokenCount,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        contentText,
        functionCalls,
        inputTokenCount,
        outputTokenCount,
      })
    )
  }

  /**
   * Factory method that draws the whole answer from one digested request.
   *
   * Every value it decides is a function of its arguments, so the same request builds the same
   * capsule however many times it is built and wherever it is built.
   *
   * @template {X extends typeof StubAiResponseCapsule ? X : never} T, X
   * @param {StubAiResponseCapsuleAnswerParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static createWithAnswer ({
    requestText,
    answerDigest,
    functionCalls,
    answerDigester = this.createStubAnswerDigester(),
  }) {
    const contentText = this.generateContentText({
      answerDigest,
    })
    const inputTokenCount = this.generateInputTokenCount({
      requestText,
    })
    const outputTokenCount = this.generateOutputTokenCount({
      answerDigest,
      answerDigester,
    })

    return this.create({
      contentText,
      functionCalls,
      inputTokenCount,
      outputTokenCount,
    })
  }

  /**
   * get: the digester an answer is drawn from.
   *
   * @returns {typeof StubAnswerDigester} The class.
   */
  static get StubAnswerDigesterCtor () {
    return StubAnswerDigester
  }

  /**
   * Create the digester an answer is drawn from.
   *
   * @returns {StubAnswerDigester} The digester.
   */
  static createStubAnswerDigester () {
    return this.StubAnswerDigesterCtor.create()
  }

  /**
   * Generate the text the stub answers with.
   *
   * It carries the digest of the request it answers, so two answers can be told apart, and a prefix
   * saying what produced it, so nobody mistakes it for something a model wrote.
   *
   * @param {{
   *   answerDigest: string
   * }} params - Parameters.
   * @returns {string} The answered text.
   */
  static generateContentText ({
    answerDigest,
  }) {
    return `${STUB_CONTENT_TEXT_PREFIX}${answerDigest}`
  }

  /**
   * Generate how many tokens the request would have spent.
   *
   * Taken from the size of the request that was built rather than invented: the payload is assembled
   * whether or not anything is sent, so its size is a quantity a keyless installation really has.
   *
   * @param {{
   *   requestText: string
   * }} params - Parameters.
   * @returns {number} The input token count.
   */
  static generateInputTokenCount ({
    requestText,
  }) {
    return Math.ceil(requestText.length / CHARACTERS_PER_TOKEN)
  }

  /**
   * Generate how many tokens the answer would have spent.
   *
   * Drawn from the digest of the request, so it differs between requests — a count that was the same
   * for every request would let a recorder that dropped the value pass unnoticed.
   *
   * @param {{
   *   answerDigest: string
   *   answerDigester: StubAnswerDigester
   * }} params - Parameters.
   * @returns {number} The output token count.
   */
  static generateOutputTokenCount ({
    answerDigest,
    answerDigester,
  }) {
    const drawnNumber = answerDigester.generateDigestedNumber({
      text: `${answerDigest}${OUTPUT_TOKEN_COUNT_SEED_SUFFIX}`,
    })

    return MINIMUM_OUTPUT_TOKEN_COUNT + (drawnNumber % OUTPUT_TOKEN_COUNT_RANGE)
  }

  /**
   * Check whether the model answered with a failure.
   *
   * @returns {boolean} Always false — a driver that opens no connection has no failure to report.
   * @public
   */
  hasError () {
    return false
  }

  /**
   * Extract the text the model answered with.
   *
   * @returns {string} The answered text.
   * @public
   */
  extractContentText () {
    return this.contentText
  }

  /**
   * Extract the tool calls the model asked for.
   *
   * @returns {Array<Record<string, *>>} The tool calls.
   * @public
   */
  extractFunctionCalls () {
    return this.functionCalls
  }

  /**
   * Extract the message of the failure the model answered with.
   *
   * @returns {string} Always empty — this driver reports no failure.
   * @public
   */
  extractErrorMessage () {
    return NO_ERROR_MESSAGE
  }

  /**
   * Extract how many tokens the request spent.
   *
   * @returns {number} The input token count.
   * @public
   */
  extractInputTokenCount () {
    return this.inputTokenCount
  }

  /**
   * Extract how many tokens the answer spent.
   *
   * @returns {number} The output token count.
   * @public
   */
  extractOutputTokenCount () {
    return this.outputTokenCount
  }
}

/**
 * @typedef {{
 *   contentText: string
 *   functionCalls: Array<Record<string, *>>
 *   inputTokenCount: number
 *   outputTokenCount: number
 * }} StubAiResponseCapsuleParams
 */

/**
 * @typedef {{
 *   requestText: string
 *   answerDigest: string
 *   functionCalls: Array<Record<string, *>>
 *   answerDigester?: StubAnswerDigester
 * }} StubAiResponseCapsuleAnswerParams
 */
