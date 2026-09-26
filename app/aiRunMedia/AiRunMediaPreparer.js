import AiRunMediaCollector from './AiRunMediaCollector.js'
import AiRunMediaDescriptorExtractor from './AiRunMediaDescriptorExtractor.js'
import AiRunMediaProviderUploader from './AiRunMediaProviderUploader.js'
import AiRunMediaRecorder from './AiRunMediaRecorder.js'
import AiRunMediaWorkspace from './AiRunMediaWorkspace.js'

import AiRunStepRecorder from '../aiRun/AiRunStepRecorder.js'
import AiRunWorkFailure from '../aiRun/AiRunWorkFailure.js'

import ASSET_MEDIA_EXTRACTION_STEP_CONSTANT_HASH from '../constants/assetMediaExtractionStepConstants.js'

const {
  ASSET_MEDIA_EXTRACTION_STEP,
  ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE,
} = ASSET_MEDIA_EXTRACTION_STEP_CONSTANT_HASH

/*
 * The field of a declared medium this class reads a key out of.
 *
 * Named once because it is the caller's own JSON: a key misspelled here reads as a request that
 * declared nothing rather than as a defect.
 */
const MEDIA_KEY_FIELD_NAME = 'mediaKey'

/**
 * Prepares one run's media: records what was declared, fetches what may be fetched, hands it to the
 * provider, and answers what the rest of the run works from.
 *
 * **It is the whole of step 2 of specs/1.0.0 §20, and it is a class rather than a phase of one.**
 * Four collaborators belong to this step and to no other - the extractor that reads the media out
 * of the request, the recorder that writes their rows, the collector that fetches them under the
 * caps and the budget, and the uploader that hands them over - and a run's orchestration holding
 * all four alongside the collaborators of its five other steps was one class carrying two jobs.
 * Nothing about what a run does changed when they moved here; where the line falls did.
 *
 * **It sits under `app/aiRunMedia/` rather than beside the run that uses it**, for the same reason
 * the four classes it holds do: this is the arrangement of pieces that belong to the media concept,
 * not to the one AI service that currently asks for them. A second service fetching media for a run
 * asks this class rather than copying the order its four steps go in.
 *
 * **Nothing here decides what the media step decides.** The caps, the allow-list and the three
 * endings a kind of medium gets are `AiRunMediaCollector`'s, tested there; the egress record is
 * `AiRunMediaProviderUploader`'s. What this class adds is the order, the trace row, and the throw
 * that turns a refusal the collector answered as a value into the one failure channel a run's work
 * has.
 *
 * **A refusal is raised carrying the reason code and the parameters the collector already built.**
 * A video among the media, a request over the photograph cap, a file over the byte cap and media
 * that could not be read at all are four of §20's acceptance criteria, and re-deciding any of them
 * here would give one rule two implementations.
 *
 * **The workspace is created here and removed by `BaseAiRunJobWorker`'s own `finally`**, which is
 * §18's fifth acceptance criterion and is on every way a run can end rather than only on the ways
 * this class knows about. So this class makes the directory and owns neither end of its life.
 *
 * **It writes its own step row and holds its own recorder.** The run's other five steps are
 * recorded by the class that runs them; a recorder shared across the boundary would make one class
 * responsible for the trace of a step it does not carry out. Both hold one because the recorder is
 * stateless and each records what it did.
 */
export default class AiRunMediaPreparer {
  /**
   * Constructor.
   *
   * @param {AiRunMediaPreparerParams} params - Parameters.
   */
  constructor ({
    aiRunMediaDescriptorExtractor,
    aiRunMediaRecorder,
    aiRunMediaCollector,
    aiRunMediaProviderUploader,
    aiRunStepRecorder,
  }) {
    this.aiRunMediaDescriptorExtractor = aiRunMediaDescriptorExtractor
    this.aiRunMediaRecorder = aiRunMediaRecorder
    this.aiRunMediaCollector = aiRunMediaCollector
    this.aiRunMediaProviderUploader = aiRunMediaProviderUploader
    this.aiRunStepRecorder = aiRunStepRecorder
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunMediaPreparer ? X : never} T, X
   * @param {AiRunMediaPreparerFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunMediaDescriptorExtractor = this.createAiRunMediaDescriptorExtractor(),
    aiRunMediaRecorder = this.createAiRunMediaRecorder(),
    aiRunMediaCollector = this.createAiRunMediaCollector(),
    aiRunMediaProviderUploader = this.createAiRunMediaProviderUploader(),
    aiRunStepRecorder = this.createAiRunStepRecorder(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunMediaDescriptorExtractor,
        aiRunMediaRecorder,
        aiRunMediaCollector,
        aiRunMediaProviderUploader,
        aiRunStepRecorder,
      })
    )
  }

  /**
   * get: the workspace holding one run's fetched files.
   *
   * It is the class rather than an instance, because a workspace is one run's directory and the
   * run is what one call is about.
   *
   * @returns {typeof AiRunMediaWorkspace} The class.
   */
  static get AiRunMediaWorkspaceCtor () {
    return AiRunMediaWorkspace
  }

  /**
   * get: the failure a refused run is raised as.
   *
   * @returns {typeof AiRunWorkFailure} The class.
   */
  static get AiRunWorkFailureCtor () {
    return AiRunWorkFailure
  }

  /**
   * Create the reader of the media a request declared.
   *
   * @returns {AiRunMediaDescriptorExtractor} Extractor.
   */
  static createAiRunMediaDescriptorExtractor () {
    return AiRunMediaDescriptorExtractor.create()
  }

  /**
   * Create the writer of the run's media rows.
   *
   * @returns {AiRunMediaRecorder} Recorder.
   */
  static createAiRunMediaRecorder () {
    return AiRunMediaRecorder.create()
  }

  /**
   * Create the fetcher of the run's media.
   *
   * @returns {AiRunMediaCollector} Collector.
   */
  static createAiRunMediaCollector () {
    return AiRunMediaCollector.create()
  }

  /**
   * Create the uploader handing the run's media to the provider.
   *
   * @returns {AiRunMediaProviderUploader} Uploader.
   */
  static createAiRunMediaProviderUploader () {
    return AiRunMediaProviderUploader.create()
  }

  /**
   * Create the writer of this step's trace row.
   *
   * @returns {AiRunStepRecorder} Recorder.
   */
  static createAiRunStepRecorder () {
    return AiRunStepRecorder.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunMediaPreparer} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunMediaPreparer} */ (this.constructor)
  }

  /**
   * Prepare one run's media, and answer what the rest of the run works from.
   *
   * @param {PrepareAiRunMediaParams} params - Parameters.
   * @returns {Promise<PreparedAiRunMedia>} What was fetched, what could not be, and what was sent.
   * @throws {AiRunWorkFailure} When the collector refused the run.
   * @public
   */
  async prepareAiRunMedia ({
    aiRunId,
    requestBody,
    aiAgentModelBinding,
    signal,
  }) {
    const startedAt = this.buildCurrentInstant()

    const mediaDescriptors = this.aiRunMediaDescriptorExtractor.extractMediaDescriptors({
      requestBody,
    })

    const aiRunMedia = await this.recordDeclaredAiRunMedia({
      aiRunId,
      mediaDescriptors,
    })

    const aiRunMediaWorkspace = this.createAiRunMediaWorkspace({
      aiRunId,
    })

    await aiRunMediaWorkspace.createWorkspace()

    const collectedAiRunMedia = await this.aiRunMediaCollector.collectAiRunMedia({
      requestBody,
      aiRunMedia,
      aiRunMediaWorkspace,
      signal,
    })

    await this.refuseCollectedAiRunMedia({
      aiRunId,
      collectedAiRunMedia,
      startedAt,
    })

    const attachedFiles = await this.uploadAiRunMedia({
      aiAgentModelBinding,
      readableMedia: collectedAiRunMedia.readableMedia,
    })

    await this.saveAiRunMediaStep({
      aiRunId,
      outcomeCode: ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.MEDIA_FETCHED,
      reasonCode: null,
      startedAt,
    })

    return this.buildPreparedAiRunMedia({
      attachedFiles,
      collectedAiRunMedia,
      mediaDescriptors,
    })
  }

  /**
   * Write the run's media rows, and answer them as they were recorded.
   *
   * **They are read back rather than taken from the write**, which is what
   * `AiRunMediaRecorder#findAiRunMedia()` exists for. The insert is one bulk statement, and what a
   * bulk insert hands back differs by store: the rows the fetch step works from have to carry
   * their own ids and the kind each was recorded under, and a read is the only way to be sure of
   * both. It also fixes the order - the order the request declared them in - which is the order a
   * budget is spent down.
   *
   * @param {{
   *   aiRunId: number
   *   mediaDescriptors: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The run's media rows.
   * @public
   */
  async recordDeclaredAiRunMedia ({
    aiRunId,
    mediaDescriptors,
  }) {
    await this.aiRunMediaRecorder.saveAiRunMedia({
      aiRunId,
      mediaDescriptors,
    })

    return this.aiRunMediaRecorder.findAiRunMedia({
      aiRunId,
    })
  }

  /**
   * Create the workspace this run's fetched files are written into.
   *
   * The directory is created here and removed by `BaseAiRunJobWorker`'s own `finally`, which is
   * §18's fifth acceptance criterion and is on every way a run can end rather than only on the
   * ways this class knows about.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {AiRunMediaWorkspace} The workspace.
   * @public
   */
  createAiRunMediaWorkspace ({
    aiRunId,
  }) {
    return this.Ctor.AiRunMediaWorkspaceCtor.create({
      aiRunId,
    })
  }

  /**
   * Refuse a run whose media the collector would not hand over.
   *
   * **The guard is an early return rather than a wrapped body**, which is what keeps the awaited
   * write out of an `if` - the repository bans `await` anywhere inside one, and a collection that
   * was not refused has nothing to write and nothing to raise.
   *
   * @param {{
   *   aiRunId: number
   *   collectedAiRunMedia: *
   *   startedAt: Date
   * }} params - Parameters.
   * @returns {Promise<null>} Null when the collection was not refused.
   * @throws {AiRunWorkFailure} When it was.
   * @public
   */
  async refuseCollectedAiRunMedia ({
    aiRunId,
    collectedAiRunMedia,
    startedAt,
  }) {
    if (collectedAiRunMedia.failureReasonCode === null) {
      return null
    }

    await this.saveRefusedAiRunMediaStep({
      aiRunId,
      collectedAiRunMedia,
      startedAt,
    })

    throw this.Ctor.AiRunWorkFailureCtor.create({
      failureReasonCode: collectedAiRunMedia.failureReasonCode,
      failureParameters: collectedAiRunMedia.failureParameters,
    })
  }

  /**
   * Record the step a refused run failed at.
   *
   * @param {{
   *   aiRunId: number
   *   collectedAiRunMedia: *
   *   startedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run step.
   * @public
   */
  async saveRefusedAiRunMediaStep ({
    aiRunId,
    collectedAiRunMedia,
    startedAt,
  }) {
    const reasonCode = this.generateStepReasonCode({
      failureReasonCode: collectedAiRunMedia.failureReasonCode,
    })

    return this.saveAiRunMediaStep({
      aiRunId,
      outcomeCode: ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE.MEDIA_FETCH_FAILED,
      reasonCode,
      startedAt,
    })
  }

  /**
   * Generate the word a step records a run's own failure reason under.
   *
   * The step trace writes its reason codes in the lower-case hyphenated form the seeded fixture
   * fixed - `media-unreadable` beside `MEDIA_UNREADABLE` on the run - so the two are derived from
   * one another rather than listed twice. A second list would be a second thing to keep in step
   * with the seven codes the client contract already closes.
   *
   * @param {{
   *   failureReasonCode: string
   * }} params - Parameters.
   * @returns {string} The step's reason code.
   * @public
   */
  generateStepReasonCode ({
    failureReasonCode,
  }) {
    return failureReasonCode
      .toLowerCase()
      .replaceAll('_', '-')
  }

  /**
   * Hand the media this run fetched to the provider, and record the egress.
   *
   * @param {{
   *   aiAgentModelBinding: import('../aiAgent/AiAgentModelBindingFinder.js').AiAgentModelBinding
   *   readableMedia: Array<*>
   * }} params - Parameters.
   * @returns {Promise<Array<Record<string, *>>>} The files as the reading request should carry them.
   * @public
   */
  async uploadAiRunMedia ({
    aiAgentModelBinding,
    readableMedia,
  }) {
    const uploadedAt = this.buildCurrentInstant()

    return this.aiRunMediaProviderUploader.uploadAiRunMedia({
      aiModelProcessor: aiAgentModelBinding.aiModelProcessor,
      aiProviderId: aiAgentModelBinding.aiProviderId,
      readableMedia,
      uploadedAt,
    })
  }

  /**
   * Record this step's one trace row.
   *
   * The step's index, name and category are this class's own and never arrive on the call: there is
   * one step here, and a caller free to say which step was being recorded could record this one
   * under another's number.
   *
   * @param {{
   *   aiRunId: number
   *   outcomeCode: string
   *   reasonCode: string | null
   *   startedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run step.
   * @public
   */
  async saveAiRunMediaStep ({
    aiRunId,
    outcomeCode,
    reasonCode,
    startedAt,
  }) {
    const finishedAt = this.buildCurrentInstant()

    return this.aiRunStepRecorder.saveAiRunStep({
      aiRunId,
      stepIndex: ASSET_MEDIA_EXTRACTION_STEP.FETCH_MEDIA.INDEX,
      stepName: ASSET_MEDIA_EXTRACTION_STEP.FETCH_MEDIA.NAME,
      stepCategoryName: ASSET_MEDIA_EXTRACTION_STEP.FETCH_MEDIA.CATEGORY_NAME,
      outcomeCode,
      rejections: null,
      reasonCode,
      startedAt,
      finishedAt,
    })
  }

  /**
   * Build what this step hands the rest of the run.
   *
   * `sentMediaKeys` is taken from what the request declared and not from what was fetched, because
   * the rule it feeds is "a photo that was not among those sent" - a photograph the caller sent
   * and this service failed to read is still one the caller sent.
   *
   * @param {{
   *   attachedFiles: Array<Record<string, *>>
   *   collectedAiRunMedia: *
   *   mediaDescriptors: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {PreparedAiRunMedia} What this step came to.
   * @public
   */
  buildPreparedAiRunMedia ({
    attachedFiles,
    collectedAiRunMedia,
    mediaDescriptors,
  }) {
    const sentMediaKeys = mediaDescriptors.map(it => it[MEDIA_KEY_FIELD_NAME])
    const { unreadableMediaKeys } = collectedAiRunMedia

    return {
      attachedFiles,
      sentMediaKeys,
      unreadableMediaKeys,
    }
  }

  /**
   * Build the current instant.
   *
   * Both instants this step is bounded by are read through here, so a test states when the step ran
   * rather than taking that long to run one.
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
 *   aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor
 *   aiRunMediaRecorder: AiRunMediaRecorder
 *   aiRunMediaCollector: AiRunMediaCollector
 *   aiRunMediaProviderUploader: AiRunMediaProviderUploader
 *   aiRunStepRecorder: AiRunStepRecorder
 * }} AiRunMediaPreparerParams
 */

/**
 * @typedef {Partial<AiRunMediaPreparerParams>} AiRunMediaPreparerFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   requestBody: Record<string, *>
 *   aiAgentModelBinding: import('../aiAgent/AiAgentModelBindingFinder.js').AiAgentModelBinding
 *   signal: AbortSignal
 * }} PrepareAiRunMediaParams
 */

/**
 * @typedef {{
 *   attachedFiles: Array<Record<string, *>>
 *   sentMediaKeys: Array<string>
 *   unreadableMediaKeys: Array<string>
 * }} PreparedAiRunMedia
 */
