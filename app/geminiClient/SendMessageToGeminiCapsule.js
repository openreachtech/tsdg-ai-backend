const NO_ERROR_MESSAGE = ''

const NO_CONTENT_TEXT = ''

const NO_TOKEN_COUNT = 0

/*
 * What a failed call answers with, when the vendor's own message carries a JSON body.
 *
 * The SDK raises an `Error` whose message is a line of prose followed by the API's JSON error
 * object. The message an operator needs is the one inside that object; the prose around it repeats
 * what the status code already said. So the body is looked for and read, and where it is not there
 * - a transport failure, an abort, anything the SDK raised itself - the whole message stands as it
 * is rather than being replaced by something this service made up.
 */
const JSON_BODY_OPENING_CHARACTER = '{'

/**
 * What Gemini answered, in the shape the canonical response reads any answer in.
 *
 * **The six members are the contract, and all six are answered here.** `AiModelResponse` wraps this
 * and publishes exactly `hasError()`, `extractContentText()`, `extractFunctionCalls()`,
 * `extractErrorMessage()`, `extractInputTokenCount()` and `extractOutputTokenCount()`, checking as
 * it delegates that the capsule answers each one. A caller reading a Gemini answer therefore cannot
 * tell it apart from the stub's, which is the whole point of the provider layer.
 *
 * **A failure is a capsule too, not a thrown exception.** The driver hands back one shape whether
 * the call succeeded or not, so nothing above it needs a `try`/`catch` to find out. That is why
 * there are two factory methods: one for a response, one for a raised error, and `#hasError()`
 * tells them apart.
 *
 * **There is no "did the model ask for a tool" predicate, deliberately.** The reference this was
 * ported from has one, because it drives a loop that carries each tool call out and asks the model
 * again. This service never does that - the tool call is the answer - so the calls leave through
 * `#extractFunctionCalls()` and a predicate no caller could reach would only invite a reader to go
 * looking for the loop that reads it.
 *
 * **Why the token counts fall back to zero rather than throwing.** `usageMetadata` is optional in
 * the vendor's own type, and a failed call has none at all. A run that failed still has to record
 * a call, and `ai_model_calls` takes neither count as null - so the absence is reported as zero,
 * which is the truth about a call that produced no usage figure. It is never invented from the
 * request's size the way the stub's is: the stub's figures describe a payload it really built,
 * while a figure made up here would be indistinguishable from one the vendor billed.
 */
export default class SendMessageToGeminiCapsule {
  /**
   * Constructor.
   *
   * @param {SendMessageToGeminiCapsuleParams} params - Parameters.
   */
  constructor ({
    response,
    error,
  }) {
    this.response = response
    this.error = error
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof SendMessageToGeminiCapsule ? X : never} T, X
   * @param {SendMessageToGeminiCapsuleParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    response,
    error,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        response,
        error,
      })
    )
  }

  /**
   * Factory method for a call the vendor answered.
   *
   * @template {X extends typeof SendMessageToGeminiCapsule ? X : never} T, X
   * @param {{
   *   response: *
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static createWithResponse ({
    response,
  }) {
    return this.create({
      response,
      error: null,
    })
  }

  /**
   * Factory method for a call that raised.
   *
   * @template {X extends typeof SendMessageToGeminiCapsule ? X : never} T, X
   * @param {{
   *   error: Error
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static createWithError ({
    error,
  }) {
    return this.create({
      response: null,
      error,
    })
  }

  /**
   * Check whether the model answered with a failure.
   *
   * @returns {boolean} True when the call raised.
   * @public
   */
  hasError () {
    return this.error !== null
  }

  /**
   * Extract the text the model answered with.
   *
   * `GenerateContentResponse#text` is the concatenation of the text parts of the first candidate,
   * and it is absent where the model answered with tool calls alone - which is the ordinary case
   * for a forced tool call, not a failure.
   *
   * @returns {string} The answered text, empty when the answer carried none.
   * @public
   */
  extractContentText () {
    return this.response?.text
      ?? NO_CONTENT_TEXT
  }

  /**
   * Extract the tool calls the model asked for.
   *
   * The vendor answers `{ name, args }` per call; the contract above names the second `arguments`.
   * The rename is the whole of the normalization, and it is done here rather than in the caller so
   * that no caller learns which vendor's spelling it is holding.
   *
   * @returns {Array<import('../tools/AiModelResponse.js').AiFunctionCall>} The tool calls, empty
   * when the model asked for none.
   * @public
   */
  extractFunctionCalls () {
    const functionCalls = this.response?.functionCalls
      ?? []

    return functionCalls.map(it =>
      this.buildFunctionCall({
        functionCall: it,
      })
    )
  }

  /**
   * Build one tool call in the shape the contract names.
   *
   * @param {{
   *   functionCall: Record<string, *>
   * }} params - Parameters.
   * @returns {import('../tools/AiModelResponse.js').AiFunctionCall} The tool call.
   * @public
   */
  buildFunctionCall ({
    functionCall,
  }) {
    const name = functionCall?.name
      ?? null

    const functionCallArguments = functionCall?.args
      ?? {}

    return {
      name,
      arguments: functionCallArguments,
    }
  }

  /**
   * Extract the message of the failure the model answered with.
   *
   * @returns {string} The failure message, empty when the call did not raise.
   * @public
   */
  extractErrorMessage () {
    const rawMessage = this.error?.message
      ?? NO_ERROR_MESSAGE

    return this.extractApiErrorMessage({
      rawMessage,
    })
  }

  /**
   * Extract the message the API stated, out of the message the SDK raised.
   *
   * @param {{
   *   rawMessage: string
   * }} params - Parameters.
   * @returns {string} The API's own message, or the raised message where it carries no JSON body.
   * @public
   */
  extractApiErrorMessage ({
    rawMessage,
  }) {
    const bodyOffset = rawMessage.indexOf(JSON_BODY_OPENING_CHARACTER)

    if (bodyOffset < 0) {
      return rawMessage
    }

    const parsedBody = this.parseErrorBody({
      bodyText: rawMessage.slice(bodyOffset),
    })

    return parsedBody?.error?.message
      ?? rawMessage
  }

  /**
   * Parse the JSON body carried in a raised message.
   *
   * @param {{
   *   bodyText: string
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The parsed body, or null when it is not JSON.
   * @public
   */
  parseErrorBody ({
    bodyText,
  }) {
    try {
      return JSON.parse(bodyText)
    } catch (parseError) {
      return null
    }
  }

  /**
   * Extract how many tokens the request spent.
   *
   * @returns {number} The input token count, zero when the vendor stated none.
   * @public
   */
  extractInputTokenCount () {
    return this.response?.usageMetadata?.promptTokenCount
      ?? NO_TOKEN_COUNT
  }

  /**
   * Extract how many tokens the answer spent.
   *
   * @returns {number} The output token count, zero when the vendor stated none.
   * @public
   */
  extractOutputTokenCount () {
    return this.response?.usageMetadata?.candidatesTokenCount
      ?? NO_TOKEN_COUNT
  }
}

/**
 * @typedef {{
 *   response: *
 *   error: Error | null
 * }} SendMessageToGeminiCapsuleParams
 */
