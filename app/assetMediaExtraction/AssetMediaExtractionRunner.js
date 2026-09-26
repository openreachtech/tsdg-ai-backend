import AssetFieldConfidenceScorer from './AssetFieldConfidenceScorer.js'
import AssetFieldReadingInspector from './AssetFieldReadingInspector.js'
import AssetMediaExtractionResultBuilder from './AssetMediaExtractionResultBuilder.js'
import AssetMediaReadingFetcher from './AssetMediaReadingFetcher.js'
import FieldConsensusResolver from './FieldConsensusResolver.js'
import SuggestibleFieldSelector from './SuggestibleFieldSelector.js'

import AiAgentModelBindingFinder from '../aiAgent/AiAgentModelBindingFinder.js'
import AiAgentPromptComposer from '../aiAgent/AiAgentPromptComposer.js'

import AiRunFieldOutcomeRecorder from '../aiRun/AiRunFieldOutcomeRecorder.js'
import AiRunStepRecorder from '../aiRun/AiRunStepRecorder.js'

import AiRunMediaDescriptorExtractor from '../aiRunMedia/AiRunMediaDescriptorExtractor.js'
import AiRunMediaPreparer from '../aiRunMedia/AiRunMediaPreparer.js'

import AI_AGENT_CONSTANT_HASH from '../constants/aiAgentConstants.js'
import AI_RUN_FIELD_STATUS_CONSTANT_HASH from '../constants/aiRunFieldStatusConstants.js'
import ASSET_MEDIA_EXTRACTION_STEP_CONSTANT_HASH from '../constants/assetMediaExtractionStepConstants.js'

import AiRun from '../../sequelize/models/AiRun.js'

const {
  AI_AGENT,
} = AI_AGENT_CONSTANT_HASH

const {
  AI_RUN_FIELD_STATUS,
} = AI_RUN_FIELD_STATUS_CONSTANT_HASH

const {
  ASSET_MEDIA_EXTRACTION_STEP,
  ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE,
  ASSET_MEDIA_EXTRACTION_STEP_REASON_CODE,
} = ASSET_MEDIA_EXTRACTION_STEP_CONSTANT_HASH

/*
 * The field of the request body each step reads its own subject out of.
 *
 * Named once because the body is the caller's own JSON: a key misspelled here reads as a request
 * that declared nothing rather than as a defect, and the same misspelling in two methods would
 * produce two different silences.
 */
const FIELD_SCHEMA_FIELD_NAME = 'fieldSchema'
const MEDIA_SIGNATURE_FIELD_NAME = 'mediaSignature'

const UNKNOWN_AI_RUN_MESSAGE = 'refused a run no row carries'
const UNREADABLE_REQUEST_BODY_MESSAGE = 'refused a run whose request body cannot be read'
const UNBOUND_AI_AGENT_MESSAGE = 'refused a run whose agent names no model this service can call'

/**
 * Runs the six steps of an asset-media-extraction run, and answers the body it settles.
 *
 * **It orchestrates and implements nothing.** Each of §20's six code-and-AI steps is a class of
 * its own, built and tested on its own, and what is left over is the order they run in, what each
 * one is handed, and the trace row each one leaves behind. That leftover is this class. Nothing
 * here re-decides what a step decided: the caps, the allow-list and the three media endings belong
 * to `AiRunMediaCollector`, the five dropping rules to `AssetFieldReadingInspector`, the majority
 * to `FieldConsensusResolver` and the formula to `AssetFieldConfidenceScorer`.
 *
 * **Step 2 is delegated whole rather than run from here, and that is a boundary rather than a
 * detail.** Four of the collaborators this class once held belonged to the media step and to no
 * other, and `AiRunMediaPreparer` is where they went: it records what the request declared,
 * fetches what may be fetched, hands it to the provider, writes that step's own trace row and
 * raises the refusal the collector answered. What is left here is what every step of a run needs
 * from its orchestrator, which is what this class is for.
 *
 * **It writes no run status, and reads no clock the row is settled by.** A run's statuses are
 * `BaseAiRunJobWorker`'s to record - exactly one terminal state per run is the fifth criterion of
 * §11 - so this class answers a result body or raises, and the worker decides what the row becomes.
 * The instants it does read are the step boundaries it records, which are its own.
 *
 * **A failure a step knows the reason for reaches the worker as an `AiRunWorkFailure`.** A video
 * among the media, a request over the photograph cap and media that could not be read at all are
 * answered by `AiRunMediaCollector` as values carrying a reason code and its parameters, and
 * `AiRunMediaPreparer` raises them - a throw being the only failure channel `#executeAiRunWork()`
 * has. This class neither decides nor re-wraps any of them; it lets them out.
 *
 * **A run whose schema has nothing suggestible in it stops after step 1**, which is §20's first
 * acceptance criterion: "an asset type with no suggestible field returns a successful run with no
 * fields and no model call". It stops before the media step as well as before the model call,
 * because §20's own step 1 says "with nothing left it returns no fields and calls no model" and
 * fetching files nothing would read is work done for nobody.
 *
 * **The cancellation signal is passed down and never asked here.** The two steps long enough to be
 * worth stopping - the media fetch and the readings - each ask it at the boundary they can stop
 * at, and both say so in their own words. A third reading of it between steps would stop a run in
 * a place where there is nothing to stop.
 *
 * **The agent, the model and the driver are one lookup, and it happens once.** A service names its
 * agent; everything else about which model answers and which vendor serves it is rows
 * (`AiAgentModelBindingFinder`). Nothing in this file names a vendor, and nothing branches on one.
 */
export default class AssetMediaExtractionRunner {
  /**
   * Constructor.
   *
   * @param {AssetMediaExtractionRunnerParams} params - Parameters.
   */
  constructor ({
    aiAgentModelBindingFinder,
    suggestibleFieldSelector,
    aiRunMediaPreparer,
    assetMediaReadingFetcher,
    assetFieldReadingInspector,
    fieldConsensusResolver,
    assetFieldConfidenceScorer,
    aiRunStepRecorder,
    aiRunFieldOutcomeRecorder,
  }) {
    this.aiAgentModelBindingFinder = aiAgentModelBindingFinder
    this.suggestibleFieldSelector = suggestibleFieldSelector
    this.aiRunMediaPreparer = aiRunMediaPreparer
    this.assetMediaReadingFetcher = assetMediaReadingFetcher
    this.assetFieldReadingInspector = assetFieldReadingInspector
    this.fieldConsensusResolver = fieldConsensusResolver
    this.assetFieldConfidenceScorer = assetFieldConfidenceScorer
    this.aiRunStepRecorder = aiRunStepRecorder
    this.aiRunFieldOutcomeRecorder = aiRunFieldOutcomeRecorder
  }

  /**
   * Factory method.
   *
   * Every collaborator is defaulted, because every one of them builds itself from constants and
   * rows rather than from anything one run knows. That includes the binding finder, whose own
   * factory pools the driver scan behind it against the process rather than against the instance -
   * so a runner built per run does not mean a directory read per run.
   *
   * **Nine, and the number is worth a sentence.** It was twelve, which is more collaborators than
   * any other factory in this repository asks for by a wide margin, and four of the twelve were
   * the media step's. They are `AiRunMediaPreparer`'s now. What is left is one collaborator per
   * remaining step plus the two recorders every step writes through, and a tenth arriving here is
   * a sign that a second step has grown collaborators of its own rather than a sign that this
   * number should grow.
   *
   * @template {X extends typeof AssetMediaExtractionRunner ? X : never} T, X
   * @param {AssetMediaExtractionRunnerFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiAgentModelBindingFinder = this.createAiAgentModelBindingFinder(),
    suggestibleFieldSelector = this.createSuggestibleFieldSelector(),
    aiRunMediaPreparer = this.createAiRunMediaPreparer(),
    assetMediaReadingFetcher = this.createAssetMediaReadingFetcher(),
    assetFieldReadingInspector = this.createAssetFieldReadingInspector(),
    fieldConsensusResolver = this.createFieldConsensusResolver(),
    assetFieldConfidenceScorer = this.createAssetFieldConfidenceScorer(),
    aiRunStepRecorder = this.createAiRunStepRecorder(),
    aiRunFieldOutcomeRecorder = this.createAiRunFieldOutcomeRecorder(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiAgentModelBindingFinder,
        suggestibleFieldSelector,
        aiRunMediaPreparer,
        assetMediaReadingFetcher,
        assetFieldReadingInspector,
        fieldConsensusResolver,
        assetFieldConfidenceScorer,
        aiRunStepRecorder,
        aiRunFieldOutcomeRecorder,
      })
    )
  }

  /**
   * get: the run model.
   *
   * @returns {typeof AiRun} Model.
   */
  static get AiRunModelCtor () {
    return AiRun
  }

  /**
   * get: the composer of what this run's agent sends.
   *
   * It is the class rather than an instance, because a composer is built for one agent and the
   * agent is read out of the database inside the run.
   *
   * @returns {typeof AiAgentPromptComposer} The class.
   */
  static get AiAgentPromptComposerCtor () {
    return AiAgentPromptComposer
  }

  /**
   * get: the reader of the body a run was accepted with.
   *
   * It is the class rather than an instance, because exactly one member of this class reads the
   * request body and a reader looking through what a run's orchestration *holds* should find its
   * six steps there rather than a parser among them.
   *
   * @returns {typeof AiRunMediaDescriptorExtractor} The class.
   */
  static get AiRunMediaDescriptorExtractorCtor () {
    return AiRunMediaDescriptorExtractor
  }

  /**
   * get: the builder of the body a run settles.
   *
   * @returns {typeof AssetMediaExtractionResultBuilder} The class.
   */
  static get AssetMediaExtractionResultBuilderCtor () {
    return AssetMediaExtractionResultBuilder
  }

  /**
   * get: the name of the agent this service runs as.
   *
   * @returns {string} The agent name.
   */
  static get aiAgentName () {
    return AI_AGENT.ASSET_MEDIA_EXTRACTION.NAME
  }

  /**
   * Create the finder answering which agent, model and driver a run is carried out by.
   *
   * @returns {AiAgentModelBindingFinder} Finder.
   */
  static createAiAgentModelBindingFinder () {
    return AiAgentModelBindingFinder.create()
  }

  /**
   * Create the selector of the fields a photograph could answer.
   *
   * @returns {SuggestibleFieldSelector} Selector.
   */
  static createSuggestibleFieldSelector () {
    return SuggestibleFieldSelector.create()
  }

  /**
   * Create the preparer of the run's media.
   *
   * @returns {AiRunMediaPreparer} Preparer.
   */
  static createAiRunMediaPreparer () {
    return AiRunMediaPreparer.create()
  }

  /**
   * Create the taker of the run's readings.
   *
   * @returns {AssetMediaReadingFetcher} Fetcher.
   */
  static createAssetMediaReadingFetcher () {
    return AssetMediaReadingFetcher.create()
  }

  /**
   * Create the inspector holding a reading to the schema that was sent.
   *
   * @returns {AssetFieldReadingInspector} Inspector.
   */
  static createAssetFieldReadingInspector () {
    return AssetFieldReadingInspector.create()
  }

  /**
   * Create the settler of the readings by absolute majority.
   *
   * @returns {FieldConsensusResolver} Resolver.
   */
  static createFieldConsensusResolver () {
    return FieldConsensusResolver.create()
  }

  /**
   * Create the scorer of a settled field's confidence.
   *
   * @returns {AssetFieldConfidenceScorer} Scorer.
   */
  static createAssetFieldConfidenceScorer () {
    return AssetFieldConfidenceScorer.create()
  }

  /**
   * Create the writer of the run's step trace.
   *
   * @returns {AiRunStepRecorder} Recorder.
   */
  static createAiRunStepRecorder () {
    return AiRunStepRecorder.create()
  }

  /**
   * Create the writer of the run's field outcomes.
   *
   * @returns {AiRunFieldOutcomeRecorder} Recorder.
   */
  static createAiRunFieldOutcomeRecorder () {
    return AiRunFieldOutcomeRecorder.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AssetMediaExtractionRunner} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetMediaExtractionRunner} */ (this.constructor)
  }

  /**
   * Run one asset media extraction, and answer the body it settled.
   *
   * The nine statements below are §20's six steps plus what the run is about: the row, the body it
   * was accepted with, and the builder that echoes the caller's signature back. Each step's own
   * method records its trace row, so nothing here is a step and a bookkeeping line at once.
   *
   * @param {{
   *   aiRunId: number
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<string>} The body the run settled.
   * @throws {import('../aiRun/AiRunWorkFailure.js').default} When a step refused the run by name.
   * @throws {Error} When the run, its body, or the model behind its agent cannot be read.
   * @public
   */
  async runAssetMediaExtraction ({
    aiRunId,
    signal,
  }) {
    const aiRun = await this.findAiRun({
      aiRunId,
    })

    if (aiRun === null) {
      throw new Error(`${this.Ctor.name}#runAssetMediaExtraction() ${UNKNOWN_AI_RUN_MESSAGE}: AiRunId ${aiRunId}`)
    }

    const requestBody = this.buildParsedRequestBody({
      aiRun,
    })

    if (requestBody === null) {
      throw new Error(`${this.Ctor.name}#runAssetMediaExtraction() ${UNREADABLE_REQUEST_BODY_MESSAGE}: AiRunId ${aiRunId}`)
    }

    const assetMediaExtractionResultBuilder = this.createAssetMediaExtractionResultBuilder({
      requestBody,
    })

    const fieldSchema = await this.selectSuggestibleFieldSchema({
      aiRunId,
      requestBody,
    })

    if (fieldSchema.length === 0) {
      return this.generateUnsuggestibleResultBody({
        assetMediaExtractionResultBuilder,
      })
    }

    const aiAgentModelBinding = await this.ensureAiAgentModelBinding({
      aiRunId,
    })

    const preparedAiRunMedia = await this.aiRunMediaPreparer.prepareAiRunMedia({
      aiRunId,
      requestBody,
      aiAgentModelBinding,
      signal,
    })

    const fetchedAssetMediaReadings = await this.fetchAssetMediaReadings({
      aiRunId,
      aiAgentModelBinding,
      fieldSchema,
      mediaSignature: requestBody[MEDIA_SIGNATURE_FIELD_NAME],
      attachedFiles: preparedAiRunMedia.attachedFiles,
      readableMediaKeys: preparedAiRunMedia.readableMediaKeys,
      signal,
    })

    const allowedReadings = await this.inspectAssetMediaReadings({
      aiRunId,
      readings: fetchedAssetMediaReadings.readings,
      fieldSchema,
      sentMediaKeys: preparedAiRunMedia.sentMediaKeys,
    })

    const resolvedFieldConsensus = await this.resolveFieldConsensus({
      aiRunId,
      readings: allowedReadings,
      fieldSchema,
      totalReadingCount: fetchedAssetMediaReadings.totalReadingCount,
    })

    const scoredFields = await this.scoreSettledFields({
      aiRunId,
      settledFields: resolvedFieldConsensus.settledFields,
    })

    return assetMediaExtractionResultBuilder.generateResultBody({
      scoredFields,
      missingFieldPaths: resolvedFieldConsensus.missingFieldPaths,
      unreadableMediaKeys: preparedAiRunMedia.unreadableMediaKeys,
    })
  }

  /**
   * Find the run one delivery is about.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The run row, or null when no row carries the id.
   * @public
   */
  async findAiRun ({
    aiRunId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunModelCtor.findByPk(aiRunId)
    )
  }

  /**
   * Build the parsed form of the body the run was accepted with.
   *
   * The parsing is the descriptor extractor's rather than a second `JSON.parse` here: that class
   * already reads this exact column, for the media the same body declares, and two readers of one
   * column would be two answers about a body that is not the JSON it claims to be.
   *
   * @param {{
   *   aiRun: *
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The parsed body, or null when there is none to read.
   * @public
   */
  buildParsedRequestBody ({
    aiRun,
  }) {
    const aiRunMediaDescriptorExtractor = this.createAiRunMediaDescriptorExtractor()

    return aiRunMediaDescriptorExtractor.buildParsedRequestBody({
      requestBody: aiRun.requestBody,
    })
  }

  /**
   * Create the reader of the body a run was accepted with.
   *
   * @returns {AiRunMediaDescriptorExtractor} Extractor.
   * @public
   */
  createAiRunMediaDescriptorExtractor () {
    return this.Ctor.AiRunMediaDescriptorExtractorCtor.create()
  }

  /**
   * Create the builder of the body this run settles.
   *
   * The signature is the one thing about the answer that comes from the request, so it is the
   * builder's state rather than an argument of the build - which is that class's own reason for
   * taking it here.
   *
   * @param {{
   *   requestBody: Record<string, *>
   * }} params - Parameters.
   * @returns {AssetMediaExtractionResultBuilder} The builder.
   * @public
   */
  createAssetMediaExtractionResultBuilder ({
    requestBody,
  }) {
    return this.Ctor.AssetMediaExtractionResultBuilderCtor.create({
      mediaSignature: requestBody[MEDIA_SIGNATURE_FIELD_NAME],
    })
  }

  /**
   * Step 1: keep only the fields a photograph could answer, and record what that came to.
   *
   * @param {{
   *   aiRunId: number
   *   requestBody: Record<string, *>
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The kept entries, in the order the caller sent them.
   * @public
   */
  async selectSuggestibleFieldSchema ({
    aiRunId,
    requestBody,
  }) {
    const startedAt = this.buildCurrentInstant()

    const fieldSchema = this.suggestibleFieldSelector.extractSuggestibleFieldSchema({
      fieldSchema: requestBody[FIELD_SCHEMA_FIELD_NAME],
    })

    const outcomeCode = this.extractSuggestibleFieldSchemaOutcomeCode({
      fieldSchema,
    })

    await this.saveAiRunStep({
      aiRunId,
      step: ASSET_MEDIA_EXTRACTION_STEP.FILTER_SUGGESTIBLE_FIELDS,
      outcomeCode,
      rejections: null,
      reasonCode: null,
      startedAt,
    })

    return fieldSchema
  }

  /**
   * Extract the word step 1 is recorded as having come to.
   *
   * A schema with nothing left in it is its own outcome rather than an empty `fields-kept`: the
   * run that follows makes no model call at all, and a trace that read the same either way would
   * hide the one criterion that difference is.
   *
   * @param {{
   *   fieldSchema: Array<*>
   * }} params - Parameters.
   * @returns {string} The outcome code.
   * @public
   */
  extractSuggestibleFieldSchemaOutcomeCode ({
    fieldSchema,
  }) {
    if (fieldSchema.length === 0) {
      return ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.NO_FIELDS_KEPT
    }

    return ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.FIELDS_KEPT
  }

  /**
   * Generate the body a run whose asset type has no suggestible field settles.
   *
   * It is a success carrying nothing, which is §20's first acceptance criterion in full: no
   * fields, no missing paths - a field that could never have been read is not a field the
   * photographs failed to show - and no unreadable media, because nothing was fetched.
   *
   * @param {{
   *   assetMediaExtractionResultBuilder: AssetMediaExtractionResultBuilder
   * }} params - Parameters.
   * @returns {string} The body.
   * @public
   */
  generateUnsuggestibleResultBody ({
    assetMediaExtractionResultBuilder,
  }) {
    return assetMediaExtractionResultBuilder.generateResultBody({
      scoredFields: [],
      missingFieldPaths: [],
      unreadableMediaKeys: [],
    })
  }

  /**
   * Obtain the agent, model and driver this run is answered by.
   *
   * A run whose agent is unseeded, unbound or served by no driver cannot be carried out at all, and
   * none of the three is something a client did - so it raises rather than being recorded as one
   * of the seven reason codes a client reads a sentence out of.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<import('../aiAgent/AiAgentModelBindingFinder.js').AiAgentModelBinding>} The
   * binding.
   * @throws {Error} When any of its three parts is missing.
   * @public
   */
  async ensureAiAgentModelBinding ({
    aiRunId,
  }) {
    const aiAgentModelBinding = await this.aiAgentModelBindingFinder.findAiAgentModelBinding({
      aiAgentName: this.Ctor.aiAgentName,
    })

    if (aiAgentModelBinding === null) {
      throw new Error(`${this.Ctor.name}#ensureAiAgentModelBinding() ${UNBOUND_AI_AGENT_MESSAGE}: AiRunId ${aiRunId}, agent ${this.Ctor.aiAgentName}`)
    }

    return aiAgentModelBinding
  }

  /**
   * Step 3: read the media the configured number of times, and record what that came to.
   *
   * The prompt is composed from the agent's own rows rather than from anything in this file, which
   * is what "held as data" means for the instruction, the role and the tool schema alike.
   *
   * **The kept schema, the signature and the photographs that were read travel with the call**, and
   * none of the three is read by the step itself. They are what a run answered by the keyless
   * driver is demonstrated from: that driver fills in no findings, so this service supplies them,
   * deterministically from the media the request names. A run answered by any other driver carries
   * them and never looks at them.
   *
   * @param {FetchAssetMediaReadingsStepParams} params - Parameters.
   * @returns {Promise<*>} The readings, and how many were meant to be taken.
   * @public
   */
  async fetchAssetMediaReadings ({
    aiRunId,
    aiAgentModelBinding,
    fieldSchema,
    mediaSignature,
    attachedFiles,
    readableMediaKeys,
    signal,
  }) {
    const startedAt = this.buildCurrentInstant()

    const composedPrompt = await this.composeAiAgentPrompt({
      aiRunId,
      aiAgentModelBinding,
    })

    const fetchedAssetMediaReadings = await this.assetMediaReadingFetcher.fetchAssetMediaReadings({
      aiRunId,
      aiModelId: aiAgentModelBinding.aiModelId,
      aiModelProcessor: aiAgentModelBinding.aiModelProcessor,
      aiAgent: aiAgentModelBinding.aiAgent,
      composedPrompt,
      fieldSchema,
      mediaSignature,
      attachedFiles,
      readableMediaKeys,
      signal,
    })

    await this.saveAiRunStep({
      aiRunId,
      step: ASSET_MEDIA_EXTRACTION_STEP.READ_MEDIA,
      outcomeCode: ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.READINGS_RETURNED,
      rejections: null,
      reasonCode: null,
      startedAt,
    })

    return fetchedAssetMediaReadings
  }

  /**
   * Compose what this run's agent sends, out of the rows that hold it.
   *
   * A composition that answers null is an agent whose instruction, role or tool rows are missing
   * or unreadable. Nothing a client sent can cause it, so it raises rather than being reported as
   * a reason code - and it raises here rather than being handed on as a null the reading fetcher
   * would fault on somewhere deeper.
   *
   * @param {{
   *   aiRunId: number
   *   aiAgentModelBinding: import('../aiAgent/AiAgentModelBindingFinder.js').AiAgentModelBinding
   * }} params - Parameters.
   * @returns {Promise<*>} The composed prompt.
   * @throws {Error} When the agent's rows cannot be composed.
   * @public
   */
  async composeAiAgentPrompt ({
    aiRunId,
    aiAgentModelBinding,
  }) {
    const aiAgentPromptComposer = this.createAiAgentPromptComposer({
      aiAgentModelBinding,
    })

    const composedPrompt = await aiAgentPromptComposer.composePrompt()

    if (composedPrompt === null) {
      throw new Error(`${this.Ctor.name}#composeAiAgentPrompt() ${UNBOUND_AI_AGENT_MESSAGE}: AiRunId ${aiRunId}, agent ${this.Ctor.aiAgentName}`)
    }

    return composedPrompt
  }

  /**
   * Create the composer of what this run's agent sends.
   *
   * @param {{
   *   aiAgentModelBinding: import('../aiAgent/AiAgentModelBindingFinder.js').AiAgentModelBinding
   * }} params - Parameters.
   * @returns {AiAgentPromptComposer} The composer.
   * @public
   */
  createAiAgentPromptComposer ({
    aiAgentModelBinding,
  }) {
    return this.Ctor.AiAgentPromptComposerCtor.create({
      aiAgentId: aiAgentModelBinding.aiAgent.id,
    })
  }

  /**
   * Step 4: drop whatever the schema that was sent does not allow, and record what was dropped.
   *
   * Each reading is inspected under its own one-based index, so a rejection names the reading it
   * came from - which is what the seeded trace's own entries carry and what lets a field be traced
   * back to the reading that offered it.
   *
   * @param {InspectAssetMediaReadingsParams} params - Parameters.
   * @returns {Promise<Array<Array<*>>>} What each reading had left after the schema check.
   * @public
   */
  async inspectAssetMediaReadings ({
    aiRunId,
    readings,
    fieldSchema,
    sentMediaKeys,
  }) {
    const startedAt = this.buildCurrentInstant()

    const inspectedReadings = readings.map((fieldReadings, index) =>
      this.assetFieldReadingInspector.inspectReading({
        fieldReadings,
        fieldSchema,
        sentMediaKeys,
        readingIndex: index + 1,
      })
    )

    const allowedReadings = inspectedReadings.map(it => it.allowedFieldReadings)

    const rejections = inspectedReadings.flatMap(it => it.rejections)

    await this.saveInspectedReadingsStep({
      aiRunId,
      rejections,
      startedAt,
    })

    return allowedReadings
  }

  /**
   * Record what step 4 came to.
   *
   * A step that dropped nothing carries neither rejections nor a reason: `readings-dropped` with an
   * empty payload would read as a drop nobody can name.
   *
   * @param {{
   *   aiRunId: number
   *   rejections: Array<*>
   *   startedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run step.
   * @public
   */
  async saveInspectedReadingsStep ({
    aiRunId,
    rejections,
    startedAt,
  }) {
    if (rejections.length === 0) {
      return this.saveAiRunStep({
        aiRunId,
        step: ASSET_MEDIA_EXTRACTION_STEP.DROP_DISALLOWED_READINGS,
        outcomeCode: ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.READINGS_KEPT,
        rejections: null,
        reasonCode: null,
        startedAt,
      })
    }

    return this.saveAiRunStep({
      aiRunId,
      step: ASSET_MEDIA_EXTRACTION_STEP.DROP_DISALLOWED_READINGS,
      outcomeCode: ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.READINGS_DROPPED,
      rejections,
      reasonCode: ASSET_MEDIA_EXTRACTION_STEP_REASON_CODE.SCHEMA_CHECK_DROPPED_READINGS,
      startedAt,
    })
  }

  /**
   * Step 5: settle the readings by absolute majority, and record every field left unsettled.
   *
   * The required paths are read off the kept schema rather than the whole one, which is that
   * selector's own rule: a required field of a kind no photograph could answer is not a field the
   * photographs failed to show.
   *
   * @param {ResolveFieldConsensusParams} params - Parameters.
   * @returns {Promise<*>} What was settled and what was missing.
   * @public
   */
  async resolveFieldConsensus ({
    aiRunId,
    readings,
    fieldSchema,
    totalReadingCount,
  }) {
    const startedAt = this.buildCurrentInstant()

    const requiredFieldPaths = this.suggestibleFieldSelector.extractRequiredFieldPaths({
      fieldSchema,
    })

    const resolvedFieldConsensus = this.fieldConsensusResolver.resolveFieldConsensus({
      readings,
      requiredFieldPaths,
      totalReadingCount,
    })

    const aiRunStep = await this.saveResolvedFieldConsensusStep({
      aiRunId,
      resolvedFieldConsensus,
      startedAt,
    })

    await this.saveMissingAiRunFieldOutcomes({
      aiRunId,
      aiRunStep,
      resolvedFieldConsensus,
      totalReadingCount,
    })

    return resolvedFieldConsensus
  }

  /**
   * Record what step 5 came to.
   *
   * @param {{
   *   aiRunId: number
   *   resolvedFieldConsensus: *
   *   startedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run step.
   * @public
   */
  async saveResolvedFieldConsensusStep ({
    aiRunId,
    resolvedFieldConsensus,
    startedAt,
  }) {
    const reasonCode = this.extractResolvedFieldConsensusReasonCode({
      resolvedFieldConsensus,
    })

    return this.saveAiRunStep({
      aiRunId,
      step: ASSET_MEDIA_EXTRACTION_STEP.SETTLE_BY_MAJORITY,
      outcomeCode: ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.FIELDS_SETTLED,
      rejections: resolvedFieldConsensus.rejections,
      reasonCode,
      startedAt,
    })
  }

  /**
   * Extract the reason step 5 records, which it has only when it left something unsettled.
   *
   * @param {{
   *   resolvedFieldConsensus: *
   * }} params - Parameters.
   * @returns {string | null} The reason code, or null when every read field settled.
   * @public
   */
  extractResolvedFieldConsensusReasonCode ({
    resolvedFieldConsensus,
  }) {
    if (resolvedFieldConsensus.rejections.length === 0) {
      return null
    }

    return ASSET_MEDIA_EXTRACTION_STEP_REASON_CODE.MAJORITY_NOT_REACHED_FOR_SOME_FIELDS
  }

  /**
   * Record one field outcome per required field no majority settled.
   *
   * **They hang off step 5 and not step 6**, which is where the seeded fixture already puts them:
   * a missing field was decided by the majority step, and step 6 never saw it because there was
   * nothing to score. The two counts are the ones that step recorded against the same path, so the
   * rejection in `ai_run_steps.rejections` and the row here agree by construction.
   *
   * **The rows are written one at a time**, through the accumulator this repository uses where
   * ordered writes matter rather than through `Promise.all`: the writes go to one table under one
   * run, and a fan-out would have them competing for the same table on a store that serializes
   * writes anyway. Nothing is gained by racing them, and the order they land in is the order the
   * step settled them.
   *
   * @param {SaveMissingAiRunFieldOutcomesParams} params - Parameters.
   * @returns {Promise<Array<*>>} The saved field outcomes.
   * @public
   */
  async saveMissingAiRunFieldOutcomes ({
    aiRunId,
    aiRunStep,
    resolvedFieldConsensus,
    totalReadingCount,
  }) {
    const settledAt = this.buildCurrentInstant()

    return resolvedFieldConsensus.missingFieldPaths.reduce(
      async (accumulatedOutcomesPromise, fieldPath) => {
        const accumulatedOutcomes = await accumulatedOutcomesPromise

        const aiRunFieldOutcome = await this.saveMissingAiRunFieldOutcome({
          aiRunId,
          aiRunStepId: aiRunStep.id,
          fieldPath,
          rejections: resolvedFieldConsensus.rejections,
          totalReadingCount,
          settledAt,
        })

        return [
          ...accumulatedOutcomes,
          aiRunFieldOutcome,
        ]
      },
      Promise.resolve([])
    )
  }

  /**
   * Record the outcome of one required field no majority settled.
   *
   * @param {SaveMissingAiRunFieldOutcomeParams} params - Parameters.
   * @returns {Promise<*>} The saved field outcome.
   * @public
   */
  async saveMissingAiRunFieldOutcome ({
    aiRunId,
    aiRunStepId,
    fieldPath,
    rejections,
    totalReadingCount,
    settledAt,
  }) {
    const agreedReadingCount = this.extractAgreedReadingCount({
      fieldPath,
      rejections,
    })

    return this.aiRunFieldOutcomeRecorder.saveAiRunFieldOutcome({
      aiRunId,
      aiRunStepId,
      fieldPath,
      aiRunFieldStatusId: AI_RUN_FIELD_STATUS.MISSING.ID,
      aiRunEvidenceCategoryId: null,
      suggestionConfidence: null,
      agreedReadingCount,
      totalReadingCount,
      confidenceMethodVersion: this.assetFieldConfidenceScorer.confidenceMethodVersion,
      settledAt,
    })
  }

  /**
   * Extract how many readings agreed on a field that still did not settle.
   *
   * A required path no reading answered at all carries no rejection, and nought is the truthful
   * count for it - nought readings agreed, out of however many were taken.
   *
   * @param {{
   *   fieldPath: string
   *   rejections: Array<*>
   * }} params - Parameters.
   * @returns {number} The count.
   * @public
   */
  extractAgreedReadingCount ({
    fieldPath,
    rejections,
  }) {
    return rejections
      .find(it => it.fieldPath === fieldPath)
      ?.figures
      ?.agreedReadingCount
      ?? 0
  }

  /**
   * Step 6: score each settled field's confidence, and record every one of them.
   *
   * @param {{
   *   aiRunId: number
   *   settledFields: Array<*>
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The scored fields, in the order they were settled.
   * @public
   */
  async scoreSettledFields ({
    aiRunId,
    settledFields,
  }) {
    const startedAt = this.buildCurrentInstant()

    const scoredFields = this.assetFieldConfidenceScorer.scoreSettledFields({
      settledFields,
    })

    const aiRunStep = await this.saveAiRunStep({
      aiRunId,
      step: ASSET_MEDIA_EXTRACTION_STEP.SCORE_CONFIDENCE,
      outcomeCode: ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.CONFIDENCE_SCORED,
      rejections: null,
      reasonCode: null,
      startedAt,
    })

    await this.saveScoredAiRunFieldOutcomes({
      aiRunId,
      aiRunStep,
      scoredFields,
    })

    return scoredFields
  }

  /**
   * Record one field outcome per scored field.
   *
   * One at a time, for the reason `#saveMissingAiRunFieldOutcomes()` states.
   *
   * @param {{
   *   aiRunId: number
   *   aiRunStep: *
   *   scoredFields: Array<*>
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The saved field outcomes.
   * @public
   */
  async saveScoredAiRunFieldOutcomes ({
    aiRunId,
    aiRunStep,
    scoredFields,
  }) {
    const settledAt = this.buildCurrentInstant()

    return scoredFields.reduce(
      async (accumulatedOutcomesPromise, scoredField) => {
        const accumulatedOutcomes = await accumulatedOutcomesPromise

        const aiRunFieldOutcome = await this.saveScoredAiRunFieldOutcome({
          aiRunId,
          aiRunStepId: aiRunStep.id,
          scoredField,
          settledAt,
        })

        return [
          ...accumulatedOutcomes,
          aiRunFieldOutcome,
        ]
      },
      Promise.resolve([])
    )
  }

  /**
   * Record the outcome of one scored field.
   *
   * The formula's own version travels with it, which is §20's tenth acceptance criterion: every
   * run records which version scored it, and it is read off the scorer that did rather than
   * restated here.
   *
   * @param {SaveScoredAiRunFieldOutcomeParams} params - Parameters.
   * @returns {Promise<*>} The saved field outcome.
   * @public
   */
  async saveScoredAiRunFieldOutcome ({
    aiRunId,
    aiRunStepId,
    scoredField,
    settledAt,
  }) {
    return this.aiRunFieldOutcomeRecorder.saveAiRunFieldOutcome({
      aiRunId,
      aiRunStepId,
      fieldPath: scoredField.path,
      aiRunFieldStatusId: scoredField.aiRunFieldStatusId,
      aiRunEvidenceCategoryId: scoredField.aiRunEvidenceCategoryId,
      suggestionConfidence: scoredField.suggestionConfidence,
      agreedReadingCount: scoredField.agreement.agreedReadingCount,
      totalReadingCount: scoredField.agreement.totalReadingCount,
      confidenceMethodVersion: scoredField.confidenceMethodVersion,
      settledAt,
    })
  }

  /**
   * Record one step of this run's trace.
   *
   * The finishing instant is read here rather than by each caller, so that the two instants a step
   * is bounded by are read at the two moments they name and never one of them twice.
   *
   * @param {SaveAiRunStepParams} params - Parameters.
   * @returns {Promise<*>} The saved run step.
   * @public
   */
  async saveAiRunStep ({
    aiRunId,
    step,
    outcomeCode,
    rejections,
    reasonCode,
    startedAt,
  }) {
    const finishedAt = this.buildCurrentInstant()

    return this.aiRunStepRecorder.saveAiRunStep({
      aiRunId,
      stepIndex: step.INDEX,
      stepName: step.NAME,
      stepCategoryName: step.CATEGORY_NAME,
      outcomeCode,
      rejections,
      reasonCode,
      startedAt,
      finishedAt,
    })
  }

  /**
   * Build the current instant.
   *
   * Every instant this class records is read through here, so a test states when a step ran rather
   * than taking that long to run one.
   *
   * @returns {Date} The instant.
   * @public
   */
  buildCurrentInstant () {
    return new Date()
  }
}

/**
 * @typedef {{
 *   aiAgentModelBindingFinder: AiAgentModelBindingFinder
 *   suggestibleFieldSelector: SuggestibleFieldSelector
 *   aiRunMediaPreparer: AiRunMediaPreparer
 *   assetMediaReadingFetcher: AssetMediaReadingFetcher
 *   assetFieldReadingInspector: AssetFieldReadingInspector
 *   fieldConsensusResolver: FieldConsensusResolver
 *   assetFieldConfidenceScorer: AssetFieldConfidenceScorer
 *   aiRunStepRecorder: AiRunStepRecorder
 *   aiRunFieldOutcomeRecorder: AiRunFieldOutcomeRecorder
 * }} AssetMediaExtractionRunnerParams
 */

/**
 * @typedef {Partial<AssetMediaExtractionRunnerParams>} AssetMediaExtractionRunnerFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiAgentModelBinding: import('../aiAgent/AiAgentModelBindingFinder.js').AiAgentModelBinding
 *   fieldSchema: Array<*>
 *   mediaSignature: *
 *   attachedFiles: Array<Record<string, *>>
 *   readableMediaKeys: Array<string>
 *   signal: AbortSignal
 * }} FetchAssetMediaReadingsStepParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   readings: Array<Array<*>>
 *   fieldSchema: Array<*>
 *   sentMediaKeys: Array<string>
 * }} InspectAssetMediaReadingsParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   readings: Array<Array<*>>
 *   fieldSchema: Array<*>
 *   totalReadingCount: number
 * }} ResolveFieldConsensusParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiRunStep: *
 *   resolvedFieldConsensus: *
 *   totalReadingCount: number
 * }} SaveMissingAiRunFieldOutcomesParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiRunStepId: number
 *   fieldPath: string
 *   rejections: Array<*>
 *   totalReadingCount: number
 *   settledAt: Date
 * }} SaveMissingAiRunFieldOutcomeParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiRunStepId: number
 *   scoredField: *
 *   settledAt: Date
 * }} SaveScoredAiRunFieldOutcomeParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   step: {
 *     INDEX: number
 *     NAME: string
 *     CATEGORY_NAME: string
 *   }
 *   outcomeCode: string
 *   rejections: Array<*> | null
 *   reasonCode: string | null
 *   startedAt: Date
 * }} SaveAiRunStepParams
 */
