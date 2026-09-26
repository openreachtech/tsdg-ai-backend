import AiModelCallRecorder from '../aiRun/AiModelCallRecorder.js'

import ASSET_MEDIA_EXTRACTION_TOOL_CONSTANT_HASH from '../constants/assetMediaExtractionToolConstants.js'

const {
  ASSET_MEDIA_EXTRACTION_TOOL,
} = ASSET_MEDIA_EXTRACTION_TOOL_CONSTANT_HASH

/*
 * How many times the media are read.
 *
 * Three is the smallest number an absolute majority means anything at: two readings agree or they
 * do not, and a disagreement between two settles nothing whichever way it falls, so a run of two
 * would answer every contested field as missing. Three lets one reading be wrong - or be dropped
 * whole by step 4 - and the field still settle on the other two.
 *
 * It is the factory's default rather than a literal, because "the media is read **the configured**
 * number of times" is the second acceptance criterion and a run of five readings must be a
 * parameter rather than an edit. The step's own cost scales with it: three readings over twelve
 * photographs is what the other half of the run's clock is for.
 */
const DEFAULT_READING_COUNT = 3

/*
 * The step this class's model calls are recorded under, as the development seeder already spells
 * it. Step 3 of specs/1.0.0 §20 is the only step of this run that asks a model anything, so every
 * row this class writes carries this one name and tells its readings apart by `reading_index`.
 */
const READ_MEDIA_ACTION_NAME = 'read-media'

/*
 * The field of the tool call's arguments that carries what one reading found.
 *
 * It is the schema's own top-level property (`assetMediaExtractionToolConstants.cjs`), read by
 * name rather than by taking whatever the arguments happened to hold.
 */
const READINGS_ARGUMENT_NAME = 'readings'

const UNOFFERED_TOOL_MESSAGE = 'refused a run whose agent offers no reading tool'

/**
 * Step 3 of an asset-media-extraction run: reads the media once per reading, and records each.
 *
 * **One reading is one model call, and each is recorded on its own row.** `ai_model_calls` carries
 * `reading_index`, so the second acceptance criterion - "the media is read the configured number
 * of times, and each reading is recorded separately with its own reading index" - is a property of
 * how this class calls and how it records, not of anything it answers. A reading that failed is
 * recorded too: the call was made, the tokens were spent, and a run billed by its calls must see
 * it.
 *
 * **Each reading is forced through a single tool call, and "forced" is said twice.** Exactly one
 * tool is offered - the one the agent's own rows bind under the name in
 * `assetMediaExtractionToolConstants.cjs` - and that same tool is named in `toolChoices`. Offering
 * one tool is what a vendor with no forcing mechanism honours; naming it is what a vendor with one
 * reads. Anything else the model answers with is left where it is: the call this class reads back
 * is the one carrying that name, and a second call is not read.
 *
 * **The readings are taken one at a time, and the signal is asked between them** ([[Q113]]). Three
 * provider calls over twelve photographs are the other long half of a run, and a run past its time
 * limit stops at the reading boundary rather than making two more calls whose answer nothing will
 * read. The signal is not handed to the call itself, because `BaseAiModelProcessor` takes none -
 * the same gap `AiRunMediaCollector` records against `MediaFetchClient`.
 *
 * **Nothing here judges what came back.** A reading is carried out of the tool call as it arrived
 * and handed on; whether the schema allows any of it is step 4's question, and whether the readings
 * agree is step 5's. That separation is what lets a model that answered nonsense produce a run that
 * settles nothing rather than a run that settles nonsense.
 *
 * **A reading whose call failed contributes nothing and still counts.** It is left out of the
 * readings, and `totalReadingCount` is the number of readings the run set out to take - so a field
 * agreed by the one call that worked is one of three, which is not a majority. A denominator
 * counted off the calls that answered would make a single unchecked answer unanimous.
 */
export default class AssetMediaReadingFetcher {
  /**
   * Constructor.
   *
   * @param {AssetMediaReadingFetcherParams} params - Parameters.
   */
  constructor ({
    aiModelCallRecorder,
    readingCount,
    toolName,
    actionName,
  }) {
    this.aiModelCallRecorder = aiModelCallRecorder
    this.readingCount = readingCount
    this.toolName = toolName
    this.actionName = actionName
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AssetMediaReadingFetcher ? X : never} T, X
   * @param {AssetMediaReadingFetcherFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiModelCallRecorder = this.createAiModelCallRecorder(),
    readingCount = DEFAULT_READING_COUNT,
    toolName = ASSET_MEDIA_EXTRACTION_TOOL.NAME,
    actionName = READ_MEDIA_ACTION_NAME,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiModelCallRecorder,
        readingCount,
        toolName,
        actionName,
      })
    )
  }

  /**
   * Create the writer recording one call a run made to a model.
   *
   * @returns {AiModelCallRecorder} Recorder.
   */
  static createAiModelCallRecorder () {
    return AiModelCallRecorder.create()
  }

  /**
   * get: the clock the two ends of a call are read from.
   *
   * Wrapped in a getter so a test can state a latency rather than wait for one. Both instants are
   * read here and handed to `AiModelCallRecorder`, which reads no clock of its own.
   *
   * @returns {typeof Date} The class.
   */
  static get DateCtor () {
    return Date
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AssetMediaReadingFetcher} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetMediaReadingFetcher} */ (this.constructor)
  }

  /**
   * Read the media the configured number of times, and answer what each reading found.
   *
   * @param {FetchAssetMediaReadingsParams} params - Parameters.
   * @returns {Promise<FetchedAssetMediaReadings>} The readings, and how many were meant to be
   * taken.
   * @throws {Error} When the agent offers no tool a reading can be forced through.
   * @public
   */
  async fetchAssetMediaReadings ({
    aiRunId,
    aiModelId,
    aiModelProcessor,
    aiAgent,
    composedPrompt,
    attachedFiles,
    signal,
  }) {
    const forcedToolSchema = this.extractForcedToolSchema({
      composedPrompt,
    })

    if (forcedToolSchema === null) {
      throw new Error(`${this.Ctor.name}#fetchAssetMediaReadings() ${UNOFFERED_TOOL_MESSAGE}: AiRunId ${aiRunId}, tool ${this.toolName}`)
    }

    const readingIndexes = this.buildReadingIndexes()

    const readings = await this.fetchReadingsSequentially({
      readingIndexes,
      aiRunId,
      aiModelId,
      aiModelProcessor,
      aiAgent,
      composedPrompt,
      forcedToolSchema,
      attachedFiles,
      signal,
    })

    return {
      readings,
      totalReadingCount: this.readingCount,
    }
  }

  /**
   * Build the numbers the readings of one run are taken under.
   *
   * They are one-based, which is what the development seeder's `reading_index` already is and what
   * a person counting readings means by the first one.
   *
   * @returns {Array<number>} The indexes.
   * @public
   */
  buildReadingIndexes () {
    return Array.from(
      {
        length: this.readingCount,
      },
      (unusedValue, index) => index + 1
    )
  }

  /**
   * Extract the one tool a reading is forced through, out of what the agent's rows offer.
   *
   * @param {{
   *   composedPrompt: import('../aiAgent/AiAgentPromptComposer.js').ComposedAiAgentPrompt
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The tool schema, or null when the agent offers none by that
   * name.
   * @public
   */
  extractForcedToolSchema ({
    composedPrompt,
  }) {
    if (!Array.isArray(composedPrompt?.toolSchemas)) {
      return null
    }

    return composedPrompt.toolSchemas
      .find(it => it?.name === this.toolName)
      ?? null
  }

  /**
   * Take the readings one at a time, stopping where the run is told its time is up.
   *
   * Through a `reduce` rather than a loop, and sequentially rather than at once: three calls made
   * together would triple this run's instantaneous load on a provider for no gain, and the signal
   * between them is what makes stopping possible at all.
   *
   * @param {FetchReadingsSequentiallyParams} params - Parameters.
   * @returns {Promise<Array<Array<*>>>} What each reading that answered found.
   * @public
   */
  async fetchReadingsSequentially ({
    readingIndexes,
    aiRunId,
    aiModelId,
    aiModelProcessor,
    aiAgent,
    composedPrompt,
    forcedToolSchema,
    attachedFiles,
    signal,
  }) {
    return readingIndexes.reduce(
      async (accumulatedReadingsPromise, readingIndex) => {
        const accumulatedReadings = await accumulatedReadingsPromise

        return this.appendOneReading({
          accumulatedReadings,
          readingIndex,
          aiRunId,
          aiModelId,
          aiModelProcessor,
          aiAgent,
          composedPrompt,
          forcedToolSchema,
          attachedFiles,
          signal,
        })
      },
      Promise.resolve(
        /** @type {Array<Array<*>>} */ ([])
      )
    )
  }

  /**
   * Take one reading and add what it found, or leave the readings as they were.
   *
   * Its own method rather than the body of the callback above, because a higher-order function may
   * carry no `if` - and both of the guards here are early returns that say nothing more than which
   * readings do not add anything.
   *
   * **The signal is asked before the reading rather than after it.** A run whose time limit has
   * already won is a run whose row is already settled, so another call to a provider would be
   * billed against a run nobody is waiting for. Asking afterwards would spend it first.
   *
   * @param {AppendOneReadingParams} params - Parameters.
   * @returns {Promise<Array<Array<*>>>} The readings, with this one added if it found anything.
   * @public
   */
  async appendOneReading ({
    accumulatedReadings,
    readingIndex,
    aiRunId,
    aiModelId,
    aiModelProcessor,
    aiAgent,
    composedPrompt,
    forcedToolSchema,
    attachedFiles,
    signal,
  }) {
    if (signal.aborted) {
      return accumulatedReadings
    }

    const fieldReadings = await this.fetchOneReading({
      readingIndex,
      aiRunId,
      aiModelId,
      aiModelProcessor,
      aiAgent,
      composedPrompt,
      forcedToolSchema,
      attachedFiles,
    })

    if (fieldReadings === null) {
      return accumulatedReadings
    }

    return [
      ...accumulatedReadings,
      fieldReadings,
    ]
  }

  /**
   * Take one reading of the media, and record the call it took.
   *
   * The call is recorded whether it answered or failed - see the class comment - and the record is
   * written before this method answers, so a run that stops after this reading still bills for it.
   *
   * @param {FetchOneReadingParams} params - Parameters.
   * @returns {Promise<Array<*> | null>} What the reading found, or null when the call failed.
   * @public
   */
  async fetchOneReading ({
    readingIndex,
    aiRunId,
    aiModelId,
    aiModelProcessor,
    aiAgent,
    composedPrompt,
    forcedToolSchema,
    attachedFiles,
  }) {
    const calledAt = this.buildCurrentInstant()

    const aiModelResponse = await this.sendReadingRequest({
      aiModelProcessor,
      aiAgent,
      composedPrompt,
      forcedToolSchema,
      attachedFiles,
    })

    const respondedAt = this.buildCurrentInstant()

    const functionCalls = this.extractFunctionCalls({
      aiModelResponse,
    })

    await this.saveAiModelCall({
      aiRunId,
      aiModelId,
      readingIndex,
      instructionSavedAt: composedPrompt.instructionSavedAt,
      calledAt,
      respondedAt,
      aiModelResponse,
      functionCalls,
    })

    if (aiModelResponse.hasError()) {
      return null
    }

    return this.extractReadingItems({
      functionCalls,
    })
  }

  /**
   * Build the current instant.
   *
   * @returns {Date} The instant.
   * @public
   */
  buildCurrentInstant () {
    return new this.Ctor.DateCtor()
  }

  /**
   * Send one reading's request to the model.
   *
   * `isAutoHandleFunctionCall` is off because the tool call *is* the answer: there is nothing for
   * the driver to carry out on this service's behalf, and a driver that executed it would hand back
   * whatever it made of the call rather than the call itself.
   *
   * @param {{
   *   aiModelProcessor: *
   *   aiAgent: *
   *   composedPrompt: import('../aiAgent/AiAgentPromptComposer.js').ComposedAiAgentPrompt
   *   forcedToolSchema: Record<string, *>
   *   attachedFiles: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {Promise<*>} The normalized response.
   * @public
   */
  async sendReadingRequest ({
    aiModelProcessor,
    aiAgent,
    composedPrompt,
    forcedToolSchema,
    attachedFiles,
  }) {
    return aiModelProcessor.sendRequestToAi({
      aiAgent,
      instruction: composedPrompt.instruction,
      documents: [],
      fileUrls: attachedFiles,
      historyMessages: [],
      tools: [
        forcedToolSchema,
      ],
      toolChoices: [
        forcedToolSchema,
      ],
      isAutoHandleFunctionCall: false,
      extraToolOptions: {},
    })
  }

  /**
   * Extract the tool calls a response asked for.
   *
   * A failed response is not asked for its calls: the capsule of a driver that failed has nothing
   * to answer with, and asking anyway would turn a recorded provider failure into a thrown one.
   *
   * @param {{
   *   aiModelResponse: *
   * }} params - Parameters.
   * @returns {Array<Record<string, *>>} The calls, empty when the response failed.
   * @public
   */
  extractFunctionCalls ({
    aiModelResponse,
  }) {
    if (aiModelResponse.hasError()) {
      return []
    }

    return aiModelResponse.extractFunctionCalls()
  }

  /**
   * Extract what one reading found, out of the call the tool was forced through.
   *
   * The call is found by name rather than taken from the front, so a model that answered a second
   * tool as well is read for the one it was asked for. A call carrying no `readings` array found
   * nothing, which is a reading of nothing rather than a failure - the field it did not mention is
   * settled by the other readings or by none.
   *
   * @param {{
   *   functionCalls: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {Array<*>} What the reading found.
   * @public
   */
  extractReadingItems ({
    functionCalls,
  }) {
    const forcedFunctionCall = functionCalls
      .find(it => it?.name === this.toolName)
      ?? null

    const fieldReadings = forcedFunctionCall
      ?.arguments
      ?.[READINGS_ARGUMENT_NAME]

    if (!Array.isArray(fieldReadings)) {
      return []
    }

    return fieldReadings
  }

  /**
   * Save the record of one call this reading made.
   *
   * @param {SaveReadingModelCallParams} params - Parameters.
   * @returns {Promise<*>} The saved model call.
   * @public
   */
  async saveAiModelCall ({
    aiRunId,
    aiModelId,
    readingIndex,
    instructionSavedAt,
    calledAt,
    respondedAt,
    aiModelResponse,
    functionCalls,
  }) {
    const responseBody = this.generateResponseBody({
      functionCalls,
    })

    return this.aiModelCallRecorder.saveAiModelCall({
      aiRunId,
      aiModelId,
      actionName: this.actionName,
      readingIndex,
      instructionSavedAt,
      calledAt,
      respondedAt,
      inputTokenCount: aiModelResponse.extractInputTokenCount(),
      outputTokenCount: aiModelResponse.extractOutputTokenCount(),
      responseBody,
    })
  }

  /**
   * Generate the text a call's answer is recorded as.
   *
   * The tool calls alone, because they are what the model answered: `response_body` is the one
   * column of that row holding content, and it is purged at thirty days while everything beside it
   * is kept for two years. A call that asked for nothing records null rather than an empty array,
   * so the column reads as "nothing came back" in one way rather than two.
   *
   * @param {{
   *   functionCalls: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {string | null} The answer as text, or null when there was none.
   * @public
   */
  generateResponseBody ({
    functionCalls,
  }) {
    if (functionCalls.length === 0) {
      return null
    }

    return JSON.stringify(functionCalls)
  }
}

/**
 * @typedef {{
 *   aiModelCallRecorder: AiModelCallRecorder
 *   readingCount: number
 *   toolName: string
 *   actionName: string
 * }} AssetMediaReadingFetcherParams
 */

/**
 * @typedef {Partial<AssetMediaReadingFetcherParams>} AssetMediaReadingFetcherFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiModelId: number
 *   aiModelProcessor: *
 *   aiAgent: *
 *   composedPrompt: import('../aiAgent/AiAgentPromptComposer.js').ComposedAiAgentPrompt
 *   attachedFiles: Array<Record<string, *>>
 *   signal: AbortSignal
 * }} FetchAssetMediaReadingsParams
 */

/**
 * @typedef {{
 *   readingIndexes: Array<number>
 *   aiRunId: number
 *   aiModelId: number
 *   aiModelProcessor: *
 *   aiAgent: *
 *   composedPrompt: import('../aiAgent/AiAgentPromptComposer.js').ComposedAiAgentPrompt
 *   forcedToolSchema: Record<string, *>
 *   attachedFiles: Array<Record<string, *>>
 *   signal: AbortSignal
 * }} FetchReadingsSequentiallyParams
 */

/**
 * @typedef {{
 *   readingIndex: number
 *   aiRunId: number
 *   aiModelId: number
 *   aiModelProcessor: *
 *   aiAgent: *
 *   composedPrompt: import('../aiAgent/AiAgentPromptComposer.js').ComposedAiAgentPrompt
 *   forcedToolSchema: Record<string, *>
 *   attachedFiles: Array<Record<string, *>>
 * }} FetchOneReadingParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiModelId: number
 *   readingIndex: number
 *   instructionSavedAt: Date
 *   calledAt: Date
 *   respondedAt: Date
 *   aiModelResponse: *
 *   functionCalls: Array<Record<string, *>>
 * }} SaveReadingModelCallParams
 */

/**
 * @typedef {{
 *   readings: Array<Array<*>>
 *   totalReadingCount: number
 * }} FetchedAssetMediaReadings
 */
