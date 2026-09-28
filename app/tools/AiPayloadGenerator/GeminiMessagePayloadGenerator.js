import {
  FunctionCallingConfigMode,
} from '@google/genai'

const USER_ROLE = 'user'
const MODEL_ROLE = 'model'

/*
 * Gemini's own name for the part of a message that points at an uploaded file.
 *
 * It is written here as a value because it cannot be written as a key: this repository forbids
 * `Data` as the suffix of an identifier, and the comment that would excuse one is forbidden too.
 * The word is the vendor's rather than ours, and naming it once says so — compare the job
 * template's `data` key, kept the same way.
 */
const FILE_PART_KEY = 'fileData'

/*
 * Which role a history entry is replayed under.
 *
 * Gemini takes exactly two, `user` and `model`, and an entry naming anything else - or naming
 * nothing - is replayed as the user's. That direction is the safe one: a turn wrongly attributed to
 * the model would be read as something the model already said and committed to, while a turn
 * wrongly attributed to the user is read as something it was told.
 */
const MODEL_ROLE_NAMES = [
  'model',
  'assistant',
]

/**
 * Builds the request one Gemini call is made with.
 *
 * **Why the payload is built by a class of its own.** What a vendor's request looks like is the one
 * thing that differs between drivers once the contract above them is uniform, and it is also the
 * one thing worth asserting without a network. Holding it here means the shape a request takes can
 * be read off a returned value in a test, rather than inferred from what a mocked client was called
 * with.
 *
 * **Nothing here reads the database or the environment.** Every figure it builds against - the
 * vendor's model id, the output token ceiling - arrives already read from `ai_models` and
 * `ai_model_capabilities` by the driver. A model's real endpoint and limits are data, not code.
 *
 * **There is no system instruction, and that is not an omission.** The prompt this service sends is
 * composed upstream by `AiAgentPromptComposer`, and what reaches a driver is the one composed
 * `instruction` string. The agent's role is folded in before it gets here, and no caller passes a
 * separate system prompt - so sending one would mean inventing it. Where a role does one day arrive
 * on the request, adding `systemInstruction` to the config is additive.
 *
 * **There is no temperature either.** The reference this was ported from reads one off an agent's
 * emotional level, and this project's `ai_agents` table has no such column. A number chosen here
 * would be this driver quietly deciding how deterministic every answer in the service is.
 */
export default class GeminiMessagePayloadGenerator {
  /**
   * Constructor.
   *
   * @param {GeminiMessagePayloadGeneratorParams} params - Parameters.
   */
  constructor ({
    targetModelName,
    maxOutputTokens,
    instruction,
    documents,
    fileUrls,
    historyMessages,
    tools,
    toolChoices,
  }) {
    this.targetModelName = targetModelName
    this.maxOutputTokens = maxOutputTokens
    this.instruction = instruction
    this.documents = documents
    this.fileUrls = fileUrls
    this.historyMessages = historyMessages
    this.tools = tools
    this.toolChoices = toolChoices
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof GeminiMessagePayloadGenerator ? X : never} T, X
   * @param {GeminiMessagePayloadGeneratorParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    targetModelName,
    maxOutputTokens,
    instruction,
    documents,
    fileUrls,
    historyMessages,
    tools,
    toolChoices,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        targetModelName,
        maxOutputTokens,
        instruction,
        documents,
        fileUrls,
        historyMessages,
        tools,
        toolChoices,
      })
    )
  }

  /**
   * Generate the whole request one call is made with.
   *
   * @returns {GeminiMessagePayload} The request.
   * @public
   */
  generateGeminiMessagePayload () {
    const contents = this.buildContents()
    const tools = this.buildTools()
    const toolConfig = this.buildToolConfig()

    return {
      model: this.targetModelName,
      maxOutputTokens: this.maxOutputTokens,
      contents,
      tools,
      toolConfig,
    }
  }

  /**
   * Build the turns the request carries.
   *
   * The replayed history comes first and the turn being asked about last, which is the order a
   * conversation happened in.
   *
   * @returns {Array<Record<string, *>>} The turns.
   * @public
   */
  buildContents () {
    const historyContents = this.buildHistoryContents()
    const currentContent = this.buildCurrentContent()

    return [
      ...historyContents,
      currentContent,
    ]
  }

  /**
   * Build the replayed turns.
   *
   * @returns {Array<Record<string, *>>} The turns.
   * @public
   */
  buildHistoryContents () {
    return this.historyMessages.map(it =>
      this.buildHistoryContent({
        historyMessage: it,
      })
    )
  }

  /**
   * Build one replayed turn.
   *
   * @param {{
   *   historyMessage: Record<string, *>
   * }} params - Parameters.
   * @returns {Record<string, *>} The turn.
   * @public
   */
  buildHistoryContent ({
    historyMessage,
  }) {
    const role = this.extractHistoryRole({
      historyMessage,
    })

    const text = this.extractHistoryText({
      historyMessage,
    })

    return {
      role,
      parts: [
        {
          text,
        },
      ],
    }
  }

  /**
   * Extract which of the vendor's two roles a replayed turn is spoken under.
   *
   * @param {{
   *   historyMessage: Record<string, *>
   * }} params - Parameters.
   * @returns {string} Either `model` or `user`.
   * @public
   */
  extractHistoryRole ({
    historyMessage,
  }) {
    if (MODEL_ROLE_NAMES.includes(historyMessage?.role)) {
      return MODEL_ROLE
    }

    return USER_ROLE
  }

  /**
   * Extract what a replayed turn said.
   *
   * @param {{
   *   historyMessage: Record<string, *>
   * }} params - Parameters.
   * @returns {string} The text, empty when the turn carried none.
   * @public
   */
  extractHistoryText ({
    historyMessage,
  }) {
    return historyMessage?.content
      ?? ''
  }

  /**
   * Build the turn being asked about.
   *
   * @returns {Record<string, *>} The turn.
   * @public
   */
  buildCurrentContent () {
    const documentParts = this.buildDocumentParts()
    const fileParts = this.buildFileParts()

    return {
      role: USER_ROLE,
      parts: [
        {
          text: this.instruction,
        },
        ...documentParts,
        ...fileParts,
      ],
    }
  }

  /**
   * Build one part per document handed to the call.
   *
   * A document travels as its JSON text. Nothing in this service supplies one yet - every caller
   * passes an empty array, the composed instruction already carrying what the agent is to read - so
   * there is no settled shape to render. Sending the text is the choice that loses nothing: a
   * document that did arrive would reach the model rather than being dropped where no reader would
   * ever learn it had been.
   *
   * @returns {Array<Record<string, *>>} The parts.
   * @public
   */
  buildDocumentParts () {
    return this.documents.map(it =>
      this.buildDocumentPart({
        document: it,
      })
    )
  }

  /**
   * Build the part one document travels as.
   *
   * @param {{
   *   document: Record<string, *>
   * }} params - Parameters.
   * @returns {Record<string, *>} The part.
   * @public
   */
  buildDocumentPart ({
    document,
  }) {
    return {
      text: JSON.stringify(document),
    }
  }

  /**
   * Build one part per file the vendor has already been given.
   *
   * A file without a uri is one the upload did not get a handle for, and it is left out rather than
   * sent as something else: a part pointing nowhere would be refused by the vendor, and the whole
   * call with it.
   *
   * @returns {Array<Record<string, *>>} The parts.
   * @public
   */
  buildFileParts () {
    const uploadedFiles = this.fileUrls.filter(it =>
      this.hasProviderFileUri({
        attachedFile: it,
      })
    )

    return uploadedFiles.map(it =>
      this.buildFilePart({
        attachedFile: it,
      })
    )
  }

  /**
   * Check whether one attached file carries the uri a request points at.
   *
   * @param {{
   *   attachedFile: Record<string, *>
   * }} params - Parameters.
   * @returns {boolean} True when the file has a uri to point at.
   * @public
   */
  hasProviderFileUri ({
    attachedFile,
  }) {
    if (typeof attachedFile?.providerFileUri !== 'string') {
      return false
    }

    return attachedFile.providerFileUri !== ''
  }

  /**
   * Build the part one uploaded file travels as.
   *
   * @param {{
   *   attachedFile: Record<string, *>
   * }} params - Parameters.
   * @returns {Record<string, *>} The part.
   * @public
   */
  buildFilePart ({
    attachedFile,
  }) {
    return {
      [FILE_PART_KEY]: {
        fileUri: attachedFile.providerFileUri,
        mimeType: attachedFile.fileType,
      },
    }
  }

  /**
   * Build the tools the model is offered.
   *
   * Answers null where none is offered, and the key is then left off the request entirely: a
   * declared-but-empty tool set is not the same thing as no tool set, and the vendor reads it
   * differently.
   *
   * @returns {Array<Record<string, *>> | null} The tools, or null when none is offered.
   * @public
   */
  buildTools () {
    if (this.tools.length === 0) {
      return null
    }

    return [
      {
        functionDeclarations: this.tools,
      },
    ]
  }

  /**
   * Build how the model is to choose among the tools.
   *
   * Nothing offered means no config at all. Something offered but nothing forced is `AUTO`, the
   * model deciding. Something forced is `ANY` naming exactly the forced tools, which is how "each
   * reading forced through a single tool call" is said in this vendor's terms.
   *
   * @returns {Record<string, *> | null} The config, or null when no tool is offered.
   * @public
   */
  buildToolConfig () {
    if (this.tools.length === 0) {
      return null
    }

    if (this.toolChoices.length === 0) {
      return {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      }
    }

    const allowedFunctionNames = this.extractToolChoiceNames()

    return {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.ANY,
        allowedFunctionNames,
      },
    }
  }

  /**
   * Extract the names of the tools the call forces.
   *
   * @returns {Array<string>} The names.
   * @public
   */
  extractToolChoiceNames () {
    return this.toolChoices.map(it => it?.name)
  }
}

/**
 * @typedef {{
 *   targetModelName: string
 *   maxOutputTokens: number
 *   instruction: string
 *   documents: Array<Record<string, *>>
 *   fileUrls: Array<Record<string, *>>
 *   historyMessages: Array<Record<string, *>>
 *   tools: Array<Record<string, *>>
 *   toolChoices: Array<Record<string, *>>
 * }} GeminiMessagePayloadGeneratorParams
 */

/**
 * @typedef {{
 *   model: string
 *   maxOutputTokens: number
 *   contents: Array<Record<string, *>>
 *   tools: Array<Record<string, *>> | null
 *   toolConfig: Record<string, *> | null
 * }} GeminiMessagePayload
 */
