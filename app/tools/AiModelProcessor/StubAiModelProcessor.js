import BaseAiModelProcessor from '../BaseAiModelProcessor.js'
import AiModelResponse from '../AiModelResponse.js'

import StubAnswerDigester from '../../stubAiModel/StubAnswerDigester.js'
import StubAiResponseCapsule from '../../stubAiModel/StubAiResponseCapsule.js'

import AI_MODEL_CONSTANT_HASH from '../../constants/aiModelConstants.js'

const {
  AI_MODEL,
} = AI_MODEL_CONSTANT_HASH

/**
 * The driver a default installation answers on, which calls nobody.
 *
 * **This is a driver in the set, not a test double.** It is what `ai_models` seeds as the default
 * row, it is discovered by the same directory scan every vendor driver will be discovered by, and it
 * is selected by the same `is_default` / `is_active` mechanism — nothing anywhere asks whether the
 * processor it is holding is this one. That is deliberate: a stub reachable only from tests would
 * leave the real path — the job, the steps, the record, the callback — unexercised until the day a
 * key arrives, and the first key would be the first run of the code that matters.
 *
 * **It reads no key and opens no connection.** There is nothing here that touches the environment or
 * the network, and no client module is imported. A machine with no key and no outbound access runs
 * every service on this driver and gets an answer, which is the whole of the first criterion.
 *
 * **The same request is answered the same way, always.** The answer is drawn from a digest of the
 * request itself and from nothing else — no clock, no counter, no random draw — so it repeats across
 * runs, across machines and whatever order the requests arrive in. Two readings of one medium
 * therefore agree, which is what lets a consensus step be exercised without a key.
 *
 * **It answers a tool call with nothing in it, and that is the honest answer.** Where a caller offers
 * tools, this asks for each of them by name so the shape a forced tool call produces is exercised —
 * but it fills in no findings, because it opened nothing and looked at nothing. A driver that
 * invented plausible values would let a judgment be recorded that no reading earned, which is the one
 * failure a suggestion service cannot afford. A service that wants demonstrable answers without a key
 * supplies them as a fixture of its own; inventing them here would put that service's knowledge
 * inside a driver that must not have any.
 *
 * @extends {BaseAiModelProcessor}
 */
export default class StubAiModelProcessor extends BaseAiModelProcessor {
  /**
   * Constructor.
   *
   * @param {StubAiModelProcessorParams} params - Parameters.
   */
  constructor ({
    answerDigester,
  }) {
    super()

    this.answerDigester = answerDigester
  }

  /**
   * Factory method.
   *
   * Answers with no argument at all, because the directory scan that discovers a processor has none
   * to give it — and because nothing about building a driver may presume a key.
   *
   * @template {X extends typeof StubAiModelProcessor ? X : never} T, X
   * @override
   * @param {StubAiModelProcessorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    answerDigester = this.createStubAnswerDigester(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        answerDigester,
      })
    )
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
   * get: the capsule this driver answers in.
   *
   * @returns {typeof StubAiResponseCapsule} The class.
   */
  static get StubAiResponseCapsuleCtor () {
    return StubAiResponseCapsule
  }

  /**
   * get: the canonical response every driver answers in.
   *
   * @returns {typeof AiModelResponse} The class.
   */
  static get AiModelResponseCtor () {
    return AiModelResponse
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
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof StubAiModelProcessor} The class.
   */
  get Ctor () {
    return /** @type {typeof StubAiModelProcessor} */ (this.constructor)
  }

  /**
   * get: the model name this processor answers for.
   *
   * The app-facing `ai_models.name` of the seeded default row, never the vendor's own model id.
   *
   * @override
   * @returns {string} The model name.
   * @public
   */
  get aiModel () {
    return AI_MODEL.STUB.NAME
  }

  /**
   * Send one request to the model and answer with the normalized response.
   *
   * @override
   * @param {import('../BaseAiModelProcessor.js').SendRequestToAiParams} params - Parameters.
   * @returns {Promise<AiModelResponse>} The normalized response.
   * @public
   */
  async sendRequestToAi ({
    aiAgent,
    instruction,
    documents,
    fileUrls,
    historyMessages = [],
    tools = [],
    toolChoices = [],
    isAutoHandleFunctionCall = true,
    extraToolOptions = {},
  }) {
    const request = this.buildRequestIdentity({
      aiAgent,
      instruction,
      documents,
      fileUrls,
      historyMessages,
      tools,
      toolChoices,
      isAutoHandleFunctionCall,
      extraToolOptions,
    })

    return this.buildAiModelResponse({
      request,
      tools,
    })
  }

  /**
   * Build what identifies one request, as the answer is drawn from it.
   *
   * The agent is reduced to its name on purpose. It arrives as a database entity carrying row
   * timestamps, and digesting those would make the answer depend on when the machine was seeded —
   * the same request answered differently on two installations, which is the one thing this driver
   * may not do. Its name is what actually decides what is being asked.
   *
   * @param {import('../BaseAiModelProcessor.js').SendRequestToAiParams} params - Parameters.
   * @returns {Record<string, *>} What identifies the request.
   */
  buildRequestIdentity ({
    aiAgent,
    instruction,
    documents,
    fileUrls,
    historyMessages,
    tools,
    toolChoices,
    isAutoHandleFunctionCall,
    extraToolOptions,
  }) {
    const aiAgentName = aiAgent?.name
      ?? null

    return {
      aiAgentName,
      instruction,
      documents,
      fileUrls,
      historyMessages,
      tools,
      toolChoices,
      isAutoHandleFunctionCall,
      extraToolOptions,
    }
  }

  /**
   * Build the answer to one identified request.
   *
   * @param {{
   *   request: Record<string, *>
   *   tools: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {AiModelResponse} The normalized response.
   */
  buildAiModelResponse ({
    request,
    tools,
  }) {
    const requestText = this.answerDigester.buildCanonicalText({
      value: request,
    })
    const answerDigest = this.answerDigester.digestText({
      text: requestText,
    })
    const functionCalls = this.buildFunctionCalls({
      tools,
    })

    const aiResponseCapsule = this.createStubAiResponseCapsule({
      requestText,
      answerDigest,
      functionCalls,
    })

    return this.createAiModelResponse({
      aiResponseCapsule,
    })
  }

  /**
   * Build the tool calls this driver asks for.
   *
   * One per tool it was offered, so a caller that forces a single tool gets a single call. A caller
   * that offers none gets none, and its run settles nothing — the outcome a service with nothing
   * suggestible is meant to produce.
   *
   * @param {{
   *   tools: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {Array<Record<string, *>>} The tool calls.
   */
  buildFunctionCalls ({
    tools,
  }) {
    return tools.map(it => this.buildFunctionCall({
      tool: it,
    }))
  }

  /**
   * Build one tool call, asking for the tool by name and filling in no findings.
   *
   * @param {{
   *   tool: Record<string, *>
   * }} params - Parameters.
   * @returns {Record<string, *>} The tool call.
   */
  buildFunctionCall ({
    tool,
  }) {
    const name = tool.name
      ?? null

    return {
      name,
      arguments: {}, // A driver that opened nothing has no finding to fill in.
    }
  }

  /**
   * Create the capsule carrying the answer.
   *
   * @param {{
   *   requestText: string
   *   answerDigest: string
   *   functionCalls: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {StubAiResponseCapsule} The capsule.
   */
  createStubAiResponseCapsule ({
    requestText,
    answerDigest,
    functionCalls,
  }) {
    return this.Ctor.StubAiResponseCapsuleCtor.createWithAnswer({
      requestText,
      answerDigest,
      functionCalls,
      answerDigester: this.answerDigester,
    })
  }

  /**
   * Create the normalized response wrapping a capsule.
   *
   * @param {{
   *   aiResponseCapsule: *
   * }} params - Parameters.
   * @returns {AiModelResponse} The normalized response.
   */
  createAiModelResponse ({
    aiResponseCapsule,
  }) {
    return this.Ctor.AiModelResponseCtor.create({
      aiResponseCapsule,
    })
  }

  /**
   * Send one request to the model and answer with the normalized response, streaming as it lands.
   *
   * The answer is complete the moment it is built, so it arrives in one piece: the text is handed to
   * the text hook once and the completion hook is handed the same normalized response this returns.
   * What a streaming caller wants that hook to carry is not settled anywhere this version, and
   * passing it anything else would be inventing a shape nobody asked for.
   *
   * @override
   * @param {import('../BaseAiModelProcessor.js').SendStreamRequestToAiParams} params - Parameters.
   * @returns {Promise<AiModelResponse>} The normalized response.
   * @public
   */
  async sendStreamRequestToAi ({
    aiAgent,
    instruction,
    documents,
    fileUrls,
    historyMessages = [],
    tools = [],
    toolChoices = [],
    isAutoHandleFunctionCall = true,
    extraToolOptions = {},
    onText,
    onComplete,
  }) {
    const aiModelResponse = await this.sendRequestToAi({
      aiAgent,
      instruction,
      documents,
      fileUrls,
      historyMessages,
      tools,
      toolChoices,
      isAutoHandleFunctionCall,
      extraToolOptions,
    })

    onText(aiModelResponse.extractContentText())
    onComplete(/** @type {*} */ (aiModelResponse))

    return aiModelResponse
  }
}

/**
 * @typedef {{
 *   answerDigester: StubAnswerDigester
 * }} StubAiModelProcessorParams
 */

/**
 * @typedef {Partial<StubAiModelProcessorParams>} StubAiModelProcessorFactoryParams
 */
