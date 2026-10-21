import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import StubAssetFieldReadingSupplier from './StubAssetFieldReadingSupplier.js'

import AiModelCallRecorder from '../aiRun/AiModelCallRecorder.js'

import AI_MODEL_CONSTANT_HASH from '../constants/aiModelConstants.js'
import ASSET_MEDIA_EXTRACTION_TOOL_CONSTANT_HASH from '../constants/assetMediaExtractionToolConstants.js'

import {
  env,
  rootPath,
} from '../globals/_.js'

const {
  AI_MODEL,
} = AI_MODEL_CONSTANT_HASH

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

const EVERY_READING_FAILED_MESSAGE = 'took no reading because every call to the model failed'

const LOG_FILE_PATH = rootPath.to('logs/asset-media-reading-')

const FAILED_READING_TAGS = [
  'AssetMediaReading',
  'FailedReading',
]

/*
 * How much of a provider's own error message is written to the log.
 *
 * What the provider says about a failed call is a status and a reason - a model that is gone, a
 * quota that is spent, a key that is refused - and that is the whole of what makes a failure
 * diagnosable. It is bounded so that a provider answering with something long cannot make a log
 * line of it.
 */
const MAXIMUM_LOGGED_ERROR_MESSAGE_LENGTH = 300

/*
 * One logger client per process, for the reason `MediaFetchClient` holds one: the client owns a
 * rotating file, and a provider outage fails every reading of every run at once.
 */
const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

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
 * **The readings are taken at once, and the signal is asked before each is started** ([[Q113]]).
 * Three provider calls made one after another were the longest part of a run - on a measured
 * request, about twenty of its twenty-four seconds - and the readings do not depend on one
 * another: each is the same request, and step 5 settles by comparing them afterwards. They are
 * started together, so the wait is the slowest of the three rather than their sum. What that costs
 * is stated rather than hidden: a run puts three calls on the provider at one instant instead of
 * one, and a run told to stop can no longer skip a reading it has not yet begun, because all of
 * them have. What stops it waiting on those is the signal handed to each call, below.
 *
 * **The signal now goes into the call as well, and the two are different guarantees.** Asking it
 * before a reading starts keeps a run that is already stopped from making any call at all, and a
 * reading is still taken whole or not at all. Handing it to the driver is what stops
 * the run **waiting out** a call already in flight before it reaches that boundary — the item §15
 * deferred until a driver existed that opens a connection at all. Aborting the wait is not
 * aborting the work: `@google/genai` states that its `abortSignal` is client-only, does not cancel
 * the request in the service, and does not stop the usage being charged. So a call dropped this
 * way is recorded with zero tokens against a charge that was really incurred, while every reading
 * that completed before it keeps the counts it was recorded with.
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
 *
 * **On the keyless driver, what the call answered is stood in for by this service's own fixture.**
 * `StubAiModelProcessor` asks for the tool by name and fills in no findings, and is right to: a
 * driver that invented values would let a judgment be recorded that no reading earned. But
 * specs/1.0.0 §20's fourth use case asks that a whole suggestion screen be demonstrable before any
 * key exists, so the findings have to come from somewhere - and the somewhere is
 * `StubAssetFieldReadingSupplier`, which belongs to this service and knows what a field schema is.
 * The fork is the driver's own `#get:aiModel`, compared against the name of the keyless model row:
 * nothing here imports that driver, and any other driver's answer is carried through untouched.
 *
 * **The stand-in is drawn once per run rather than once per reading, and both halves of that
 * matter.** Three readings of one request must agree for step 5 to settle anything, and the
 * substitution happens before the call is recorded rather than after - so `response_body` holds the
 * findings the run went on to settle, and a trace that disagreed with the answer beside it cannot
 * arise.
 */
export default class AssetMediaReadingFetcher {
  /**
   * Constructor.
   *
   * @param {AssetMediaReadingFetcherParams} params - Parameters.
   */
  constructor ({
    aiModelCallRecorder,
    stubAssetFieldReadingSupplier,
    readingCount,
    toolName,
    actionName,
    stubAiModelName,
  }) {
    this.aiModelCallRecorder = aiModelCallRecorder
    this.stubAssetFieldReadingSupplier = stubAssetFieldReadingSupplier
    this.readingCount = readingCount
    this.toolName = toolName
    this.actionName = actionName
    this.stubAiModelName = stubAiModelName
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
    stubAssetFieldReadingSupplier = this.createStubAssetFieldReadingSupplier(),
    readingCount = DEFAULT_READING_COUNT,
    toolName = ASSET_MEDIA_EXTRACTION_TOOL.NAME,
    actionName = READ_MEDIA_ACTION_NAME,
    stubAiModelName = AI_MODEL.STUB.NAME,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiModelCallRecorder,
        stubAssetFieldReadingSupplier,
        readingCount,
        toolName,
        actionName,
        stubAiModelName,
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
   * Create the supplier a run answered by the keyless driver is demonstrated from.
   *
   * @returns {StubAssetFieldReadingSupplier} Supplier.
   */
  static createStubAssetFieldReadingSupplier () {
    return StubAssetFieldReadingSupplier.create()
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
   * get: the logger a failed reading is written through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
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
    fieldSchema,
    mediaSignature,
    attachedFiles,
    readableMediaKeys,
    signal,
  }) {
    const forcedToolSchema = this.extractForcedToolSchema({
      composedPrompt,
    })

    if (forcedToolSchema === null) {
      throw new Error(`${this.Ctor.name}#fetchAssetMediaReadings() ${UNOFFERED_TOOL_MESSAGE}: AiRunId ${aiRunId}, tool ${this.toolName}`)
    }

    const readingIndexes = this.buildReadingIndexes()

    const suppliedFunctionCalls = this.buildSuppliedFunctionCalls({
      aiModelProcessor,
      fieldSchema,
      mediaSignature,
      readableMediaKeys,
    })

    const documents = this.buildReadingDocuments({
      fieldSchema,
      readableMediaKeys,
    })

    const readings = await this.fetchReadingsConcurrently({
      readingIndexes,
      aiRunId,
      aiModelId,
      aiModelProcessor,
      aiAgent,
      composedPrompt,
      forcedToolSchema,
      attachedFiles,
      documents,
      suppliedFunctionCalls,
      signal,
    })

    this.ensureSomeReadingTaken({
      readings,
      aiRunId,
      signal,
    })

    return {
      readings,
      totalReadingCount: this.readingCount,
    }
  }

  /**
   * Build the documents every reading of a run is sent beside the photographs.
   *
   * **Without this the model is told nothing about the request.** The composed instruction says to
   * answer "only with the fields of the schema you were sent" and to "name the photos it came
   * from", and both of those refer to things sent with the call. A model given only the photographs
   * does not know which fields were asked for, and names a photograph by whatever the vendor calls
   * the attached file - which is not the caller's `mediaKey`, so step 4 discards every value it
   * read as coming from a photograph that was never sent.
   *
   * The photographs are listed in the order they are attached, and that order is what ties a
   * `mediaKey` to the file the vendor holds: the keys and the attached files are both taken from the
   * readable media in the order the request declared them. The caller's own schema travels as the
   * caller wrote it. Nothing of the caller's URL goes - only the key step 4 will check against.
   *
   * @param {{
   *   fieldSchema: Array<*>
   *   readableMediaKeys: Array<string>
   * }} params - Parameters.
   * @returns {Array<Record<string, *>>} The documents.
   * @public
   */
  buildReadingDocuments ({
    fieldSchema,
    readableMediaKeys,
  }) {
    const photos = readableMediaKeys.map((mediaKey, index) => ({
      mediaKey,
      attachedAs: index + 1,
    }))

    return [
      {
        fieldSchema,
        photos,
      },
    ]
  }

  /**
   * Refuse a run in which no call to the model answered.
   *
   * **A run every call of which failed is a failed run, and it used to be a succeeded one.** A
   * failed call contributes no reading, so a model that was unreachable, gone, or out of quota
   * left the run with none, and none was read downstream as "the photographs showed nothing": the
   * run was answered `succeeded` with no fields and its trace said the readings were returned. The
   * caller could not tell that from a photograph with nothing in it.
   *
   * A plain error is raised, which `BaseAiRunJobWorker` answers as `PROVIDER_CALL_FAILED` - the
   * code its contract entry gives to exactly this. A run stopped by its signal has no readings
   * either and is not this: nothing failed, the work was told to stop.
   *
   * @param {{
   *   readings: Array<Array<*>>
   *   aiRunId: number
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {void}
   * @throws {Error} When no reading was taken and the run was not stopped.
   * @public
   */
  ensureSomeReadingTaken ({
    readings,
    aiRunId,
    signal,
  }) {
    if (readings.length > 0) {
      return
    }

    if (signal.aborted) {
      return
    }

    throw new Error(`${this.Ctor.name}#fetchAssetMediaReadings() ${EVERY_READING_FAILED_MESSAGE}: AiRunId ${aiRunId}`)
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
   * Build the tool call this service stands in for the driver's, or nothing where it stands in for
   * none.
   *
   * Answered once for the whole run rather than once per reading, because the readings of one run
   * have to agree for step 5 to settle anything - see the class comment.
   *
   * @param {BuildSuppliedFunctionCallsParams} params - Parameters.
   * @returns {Array<Record<string, *>> | null} The calls, or null when the driver answers for
   * itself.
   * @public
   */
  buildSuppliedFunctionCalls ({
    aiModelProcessor,
    fieldSchema,
    mediaSignature,
    readableMediaKeys,
  }) {
    if (
      !this.suppliesFixtureReadings({
        aiModelProcessor,
      })
    ) {
      return null
    }

    const fieldReadings = this.stubAssetFieldReadingSupplier.buildFieldReadings({
      fieldSchema,
      mediaSignature,
      readableMediaKeys,
    })

    return [
      {
        name: this.toolName,
        arguments: {
          [READINGS_ARGUMENT_NAME]: fieldReadings,
        },
      },
    ]
  }

  /**
   * Check whether this run's driver is the keyless one, whose findings this service supplies.
   *
   * Asked of the name the driver answers for itself - `BaseAiModelProcessor#get:aiModel`, the one
   * member every driver in the set declares - rather than of the class it is an instance of. A
   * comparison against the class would make this feature import a driver, and would answer wrongly
   * for a subclass of it; a comparison against the name is the same question the catalog asks.
   *
   * @param {{
   *   aiModelProcessor: *
   * }} params - Parameters.
   * @returns {boolean} Whether the findings are this service's to supply.
   * @public
   */
  suppliesFixtureReadings ({
    aiModelProcessor,
  }) {
    return aiModelProcessor?.aiModel === this.stubAiModelName
  }

  /**
   * Take every reading at once, and answer what each one that answered found.
   *
   * Through `Promise.all` over a `map`, so the readings are all started before any is waited for and
   * the run waits for the slowest of them. This used to be a `reduce` that chained one call after the
   * next, for two reasons that were written down: three calls together would triple the instantaneous
   * load on the provider, and asking the signal between calls was what made stopping possible. The
   * first is a cost this accepts - three calls is a small number against the rate the service admits
   * runs at - and the second is kept in the one place that still has anything to ask, the start of
   * each reading.
   *
   * The readings come back in the order of their indexes, which is the order step 4 numbers them by,
   * and a reading whose call failed is left out exactly as it was before.
   *
   * @param {FetchReadingsConcurrentlyParams} params - Parameters.
   * @returns {Promise<Array<Array<*>>>} What each reading that answered found.
   * @public
   */
  async fetchReadingsConcurrently ({
    readingIndexes,
    aiRunId,
    aiModelId,
    aiModelProcessor,
    aiAgent,
    composedPrompt,
    forcedToolSchema,
    attachedFiles,
    documents,
    suppliedFunctionCalls,
    signal,
  }) {
    const takenReadings = await Promise.all(
      readingIndexes.map(readingIndex =>
        this.takeOneReading({
          readingIndex,
          aiRunId,
          aiModelId,
          aiModelProcessor,
          aiAgent,
          composedPrompt,
          forcedToolSchema,
          attachedFiles,
          documents,
          suppliedFunctionCalls,
          signal,
        })
      )
    )

    return takenReadings.filter(it => it !== null)
  }

  /**
   * Take one reading, or none where the run has already been told to stop.
   *
   * **The signal is asked before the reading rather than after it**, because whichever of the two
   * things raised it, nobody is waiting for what another call would produce. A run whose time
   * limit has won is a run whose row is already settled. A run whose client asked it to stop is
   * one whose row is **not** settled yet - the settle happens after this work returns - but the
   * answer is about to be discarded either way. Asking afterwards would spend the call first.
   *
   * @param {TakeOneReadingParams} params - Parameters.
   * @returns {Promise<Array<*> | null>} What the reading found, or null when none was taken or its
   * call failed.
   * @public
   */
  async takeOneReading ({
    readingIndex,
    aiRunId,
    aiModelId,
    aiModelProcessor,
    aiAgent,
    composedPrompt,
    forcedToolSchema,
    attachedFiles,
    documents,
    suppliedFunctionCalls,
    signal,
  }) {
    if (signal.aborted) {
      return null
    }

    return this.fetchOneReading({
      readingIndex,
      aiRunId,
      aiModelId,
      aiModelProcessor,
      aiAgent,
      composedPrompt,
      forcedToolSchema,
      attachedFiles,
      documents,
      suppliedFunctionCalls,
      signal,
    })
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
    documents,
    suppliedFunctionCalls,
    signal,
  }) {
    const calledAt = this.buildCurrentInstant()

    const aiModelResponse = await this.sendReadingRequest({
      aiModelProcessor,
      aiAgent,
      composedPrompt,
      forcedToolSchema,
      attachedFiles,
      documents,
      signal,
    })

    const respondedAt = this.buildCurrentInstant()

    const functionCalls = this.buildReadingFunctionCalls({
      aiModelResponse,
      suppliedFunctionCalls,
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
      this.logFailedReading({
        aiRunId,
        readingIndex,
        aiModelResponse,
      })

      return null
    }

    return this.extractReadingItems({
      functionCalls,
    })
  }

  /**
   * Write the line a failed reading leaves behind.
   *
   * The call is already recorded on its own row, but that row holds tokens and timings and never
   * the reason, so before this a provider that refused every call left a run with nothing anywhere
   * saying why. The reason is the provider's own message, bounded; the photographs and what was
   * read from them are not written.
   *
   * @param {{
   *   aiRunId: number
   *   readingIndex: number
   *   aiModelResponse: *
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logFailedReading ({
    aiRunId,
    readingIndex,
    aiModelResponse,
  }) {
    const errorMessage = String(aiModelResponse.extractErrorMessage() ?? '')
      .slice(0, MAXIMUM_LOGGED_ERROR_MESSAGE_LENGTH)

    const message = `${this.Ctor.name} a reading failed: AiRunId ${aiRunId}, reading ${readingIndex}, ${errorMessage}`

    this.Ctor.mentsuLogger.error({
      message,
      tags: FAILED_READING_TAGS,
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
   * **The run's signal goes with the request, under the name the driver contract gives it.** Inside
   * this run it is `signal` — one signal the whole work honours, raised for either of two reasons —
   * and `BaseAiModelProcessor#sendRequestToAi()` calls it `abortSignal`, because at that boundary it
   * is a request option and nothing else. The rename happens here, once, at the crossing.
   *
   * **What handing it over buys, and what it does not.** A reading whose call is already in flight
   * when the run is canceled stops being waited for, instead of holding the run open for the rest
   * of a provider's answer nobody will read — which is the whole of what §15 deferred until a real
   * vendor driver existed. It does **not** stop the provider doing the work and it does not stop
   * the provider charging for it: `@google/genai` says so where it declares the field. Such a call
   * is still recorded, and it records zero tokens, because a dropped connection brings back no
   * usage figure. The readings taken before it keep the rows and the counts they were recorded
   * with.
   *
   * @param {{
   *   aiModelProcessor: *
   *   aiAgent: *
   *   composedPrompt: import('../aiAgent/AiAgentPromptComposer.js').ComposedAiAgentPrompt
   *   forcedToolSchema: Record<string, *>
   *   attachedFiles: Array<Record<string, *>>
   *   documents: Array<Record<string, *>>
   *   signal: AbortSignal
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
    documents,
    signal,
  }) {
    return aiModelProcessor.sendRequestToAi({
      aiAgent,
      instruction: composedPrompt.instruction,
      documents,
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
      abortSignal: signal,
    })
  }

  /**
   * Build the tool calls one reading is read out of, and recorded as.
   *
   * Where this service supplies the findings, the supplied call stands in for the driver's whole
   * answer rather than being merged into it: the keyless driver asks for the tool by name and fills
   * in nothing, so there is nothing of its own to keep.
   *
   * A call the driver failed is left as it came back. A reading that never reached a model has no
   * findings to stand in for, and standing in anyway would turn a recorded provider failure into a
   * field a client is offered.
   *
   * @param {{
   *   aiModelResponse: *
   *   suppliedFunctionCalls: Array<Record<string, *>> | null
   * }} params - Parameters.
   * @returns {Array<Record<string, *>>} The calls.
   * @public
   */
  buildReadingFunctionCalls ({
    aiModelResponse,
    suppliedFunctionCalls,
  }) {
    const functionCalls = this.extractFunctionCalls({
      aiModelResponse,
    })

    if (suppliedFunctionCalls === null) {
      return functionCalls
    }

    if (aiModelResponse.hasError()) {
      return functionCalls
    }

    return suppliedFunctionCalls
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
 *   stubAssetFieldReadingSupplier: StubAssetFieldReadingSupplier
 *   readingCount: number
 *   toolName: string
 *   actionName: string
 *   stubAiModelName: string
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
 *   fieldSchema: Array<*>
 *   mediaSignature: *
 *   attachedFiles: Array<Record<string, *>>
 *   readableMediaKeys: Array<string>
 *   signal: AbortSignal
 * }} FetchAssetMediaReadingsParams
 */

/**
 * @typedef {{
 *   aiModelProcessor: *
 *   fieldSchema: Array<*>
 *   mediaSignature: *
 *   readableMediaKeys: Array<string>
 * }} BuildSuppliedFunctionCallsParams
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
 *   documents: Array<Record<string, *>>
 *   suppliedFunctionCalls: Array<Record<string, *>> | null
 *   signal: AbortSignal
 * }} FetchReadingsConcurrentlyParams
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
 *   documents: Array<Record<string, *>>
 *   suppliedFunctionCalls: Array<Record<string, *>> | null
 *   signal: AbortSignal
 * }} TakeOneReadingParams
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
 *   documents: Array<Record<string, *>>
 *   suppliedFunctionCalls: Array<Record<string, *>> | null
 *   signal: AbortSignal
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
