import AiRunMediaCategoryInspector from './AiRunMediaCategoryInspector.js'
import AiRunMediaDescriptorExtractor from './AiRunMediaDescriptorExtractor.js'
import AiRunMediaLimitInspector from './AiRunMediaLimitInspector.js'
import AiRunMediaRecorder from './AiRunMediaRecorder.js'
import MediaFetchClient from './MediaFetchClient.js'

import AI_RUN_FAILURE_REASON_CONSTANT_HASH from '../constants/aiRunFailureReasonConstants.js'
import AI_RUN_MEDIA_HANDLING_CONSTANT_HASH from '../constants/aiRunMediaHandlingConstants.js'

const {
  AI_RUN_FAILURE_REASON_CODE,
} = AI_RUN_FAILURE_REASON_CONSTANT_HASH

const {
  AI_RUN_MEDIA_HANDLING,
} = AI_RUN_MEDIA_HANDLING_CONSTANT_HASH

/*
 * How much of a run's clock the whole of the fetch step may spend: half of it.
 *
 * **This is the answer to [[Q125]], and the arithmetic is the reason it exists.** The run's limit
 * is 300000 ms for everything a run does, `MediaFetchClient`'s own bound is 30000 ms for one fetch,
 * and the cap is twelve media - so twelve slow-but-not-stalled fetches spend 360000 ms and end the
 * run under `TIME_LIMIT_EXCEEDED` naming no file at all, before the upload and the three readings
 * have been counted. The per-fetch bound buys a named failure for one medium; it does not bound the
 * step, and nothing below `#media-fetch` was rationing it.
 *
 * **150000 ms is half the run, chosen so the other half is the half that reads.** Step 3 is three
 * provider calls over up to twelve photographs and is the only other part of a run that can take
 * minutes; steps 1, 4, 5 and 6 are arithmetic over a schema of tens of fields. An even split is a
 * statement that fetching and reading are the two halves of this run, which is what §20's table
 * says they are.
 *
 * **What a run that spends it all actually gets.** The allowance handed to each fetch is the lesser
 * of the per-fetch bound and what is left, so a fast medium spends what it takes and leaves the
 * rest. Twelve stalled media therefore fill the budget after five of them, and media six to twelve
 * are not fetched at all: they come back unreadable, by key, and the run either settles on the five
 * that arrived or fails `MEDIA_UNREADABLE` because none did. That is the trade [[Q125]] asks the
 * caller to make, and it is made here: a named answer about nameable media, in place of an unnamed
 * `TIME_LIMIT_EXCEEDED` about the whole run.
 *
 * **The two alternatives [[Q125]] weighed are still refused, for its reasons.** Tightening the
 * per-fetch bound until twelve fit would refuse an honest slow transfer of a file this service
 * accepts. Fetching the twelve concurrently would assemble up to twelve ten-megabyte bodies in
 * memory at once. Rationing sequentially costs neither.
 */
const DEFAULT_MEDIA_BUDGET_MILLISECONDS = 150000

/*
 * The most one fetch may be given, whatever is left of the budget.
 *
 * It is `MediaFetchClient`'s own default restated as a ceiling this class applies, rather than
 * left to that class: the allowance actually handed down is the lesser of this and the budget
 * remaining, and a ceiling that lived in the client could not be compared with a budget the client
 * knows nothing about.
 */
const DEFAULT_MEDIUM_TIMEOUT_MILLISECONDS = 30000

/*
 * The name the refusal of an unrecognized or unhandled kind carries the caller's own word under.
 *
 * `MEDIA_UNSUPPORTED` is the code for both, and `isRecognizedMediaCategory` is what tells them
 * apart: a request naming `video` names a kind this service knows and does not handle, and one
 * naming `hologram` names nothing at all. The client system builds the sentence people read out of
 * the code and these parameters, so the distinction is carried rather than flattened - see
 * `AiRunMediaCategoryInspector`, which exists to keep those two answers separate.
 */
const MEDIA_CATEGORY_PARAMETER_NAME = 'mediaCategoryName'
const MEDIA_KEY_PARAMETER_NAME = 'mediaKey'
const RECOGNIZED_MEDIA_CATEGORY_PARAMETER_NAME = 'isRecognizedMediaCategory'

/**
 * Step 2 of an asset-media-extraction run: fetches the media, checks the caps, and rations the
 * clock it is fetching against.
 *
 * **Three endings, dispatched on the word the master carries.** `ai_run_media_categories` holds
 * `handling_name` - `handle`, `refuse`, `ignore` - so that what happens to a kind is a data fact
 * ([[Q121]]). This class reads that word out of a hash of handlers rather than branching on it, so
 * a kind whose handling changes is a value edited on a row, and a fourth kind is a new row. A name
 * that resolves to no row at all answers `null`, which is **not** `ignore`: an unrecognized kind is
 * refused, because silently dropping a file a caller believes it sent is the failure §20 wrote
 * "rather than being silently skipped" against.
 *
 * **A refusal ends the collection; an ignored medium does not.** A video refuses the whole run by
 * name, and audio is passed over without a fetch, without an entry in `unreadableMediaKeys[]` and
 * without a word to the caller - which is what "ignored" means and why the two cannot share one
 * answer.
 *
 * **The caps are checked against what the caller declared, before anything is fetched.** The count
 * first, against the media the request carried; then each file's declared size. Both refuse the run
 * with the limit named in the parameters (`AiRunMediaLimitInspector`), and both are answered before
 * a single byte crosses the network.
 *
 * **The budget is rationed sequentially**, which is the whole of what the constant above is about.
 * Each fetch is given the lesser of the per-fetch ceiling and what is left of the step's budget;
 * a fetch given nothing is not made at all and its medium comes back unreadable by key.
 *
 * **The cancellation signal is honoured in the two places it can be** ([[Q113]]): no further medium
 * is fetched once it is raised, and - the one `#media-fetch`'s checkpoint 7 asked for by name -
 * nothing is written into the run's workspace once it is raised. A run past its time limit has had
 * its temporary directory removed on the way out of `BaseAiRunJobWorker#executeJob()`, and a write
 * afterwards would recreate a directory nothing will remove again.
 *
 * **It is not handed to the fetch itself, and that is a gap rather than a decision.**
 * `MediaFetchClient#fetchMedium()` takes no external signal - its only signal is the per-fetch
 * timeout it builds - so a fetch already in flight when the signal is raised runs out its own
 * allowance before this class notices. What bounds that is the allowance, at most the ceiling
 * above. Closing it means giving that client an optional signal, which re-opens a class under
 * audit closure; it is reported rather than done here.
 *
 * **The workspace is the caller's to create and the base worker's to remove.** This class writes
 * into the one it is handed and owns neither end of its life, so the directory a run leaves behind
 * is removed by the `finally` that already removes it, whatever this class did or did not manage.
 */
export default class AiRunMediaCollector {
  /**
   * Constructor.
   *
   * @param {AiRunMediaCollectorParams} params - Parameters.
   */
  constructor ({
    aiRunMediaCategoryInspector,
    aiRunMediaDescriptorExtractor,
    aiRunMediaLimitInspector,
    aiRunMediaRecorder,
    mediaBudgetMilliseconds,
    mediumTimeoutMilliseconds,
  }) {
    this.aiRunMediaCategoryInspector = aiRunMediaCategoryInspector
    this.aiRunMediaDescriptorExtractor = aiRunMediaDescriptorExtractor
    this.aiRunMediaLimitInspector = aiRunMediaLimitInspector
    this.aiRunMediaRecorder = aiRunMediaRecorder
    this.mediaBudgetMilliseconds = mediaBudgetMilliseconds
    this.mediumTimeoutMilliseconds = mediumTimeoutMilliseconds
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunMediaCollector ? X : never} T, X
   * @param {AiRunMediaCollectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunMediaCategoryInspector = this.createAiRunMediaCategoryInspector(),
    aiRunMediaDescriptorExtractor = this.createAiRunMediaDescriptorExtractor(),
    aiRunMediaLimitInspector = this.createAiRunMediaLimitInspector(),
    aiRunMediaRecorder = this.createAiRunMediaRecorder(),
    mediaBudgetMilliseconds = DEFAULT_MEDIA_BUDGET_MILLISECONDS,
    mediumTimeoutMilliseconds = DEFAULT_MEDIUM_TIMEOUT_MILLISECONDS,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunMediaCategoryInspector,
        aiRunMediaDescriptorExtractor,
        aiRunMediaLimitInspector,
        aiRunMediaRecorder,
        mediaBudgetMilliseconds,
        mediumTimeoutMilliseconds,
      })
    )
  }

  /**
   * Create the inspector answering what this version does with a kind of medium.
   *
   * @returns {AiRunMediaCategoryInspector} Inspector.
   */
  static createAiRunMediaCategoryInspector () {
    return AiRunMediaCategoryInspector.create()
  }

  /**
   * Create the extractor reading a medium's URL out of the body the run was accepted with.
   *
   * @returns {AiRunMediaDescriptorExtractor} Extractor.
   */
  static createAiRunMediaDescriptorExtractor () {
    return AiRunMediaDescriptorExtractor.create()
  }

  /**
   * Create the inspector answering whether the media are within the two caps.
   *
   * @returns {AiRunMediaLimitInspector} Inspector.
   */
  static createAiRunMediaLimitInspector () {
    return AiRunMediaLimitInspector.create()
  }

  /**
   * Create the writer marking each medium as it is fetched.
   *
   * @returns {AiRunMediaRecorder} Recorder.
   */
  static createAiRunMediaRecorder () {
    return AiRunMediaRecorder.create()
  }

  /**
   * get: the class one medium is fetched through.
   *
   * It is the class rather than an instance, because each fetch is made under an allowance of its
   * own and the allowance is a factory parameter of that class.
   *
   * @returns {typeof MediaFetchClient} The class.
   */
  static get MediaFetchClientCtor () {
    return MediaFetchClient
  }

  /**
   * get: the clock the budget is measured against.
   *
   * Wrapped in a getter so a test can state how long a fetch took rather than take that long. This
   * is the one clock this class reads, and it reads it only to measure what has been spent - every
   * instant a row is written with is handed in.
   *
   * @returns {typeof Date} The class.
   */
  static get DateCtor () {
    return Date
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunMediaCollector} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunMediaCollector} */ (this.constructor)
  }

  /**
   * Fetch what this run may fetch, and answer what came of each medium.
   *
   * @param {CollectAiRunMediaParams} params - Parameters.
   * @returns {Promise<CollectedAiRunMedia>} What was collected, and the reason the run is refused
   * where it is.
   * @public
   */
  async collectAiRunMedia ({
    requestBody,
    aiRunMedia,
    aiRunMediaWorkspace,
    signal,
  }) {
    const mediaCountRefusal = this.buildMediaCountRefusal({
      aiRunMedia,
    })

    if (mediaCountRefusal !== null) {
      return this.buildRefusedCollection({
        refusal: mediaCountRefusal,
      })
    }

    const collection = await this.collectMediaSequentially({
      requestBody,
      aiRunMedia,
      aiRunMediaWorkspace,
      signal,
    })

    return this.buildCollectedAiRunMedia({
      collection,
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
   * Build the refusal a request carrying more media than the cap allows is answered with.
   *
   * @param {{
   *   aiRunMedia: Array<*>
   * }} params - Parameters.
   * @returns {AiRunMediaRefusal | null} The refusal, or null when the count is within the cap.
   * @public
   */
  buildMediaCountRefusal ({
    aiRunMedia,
  }) {
    const mediaCount = aiRunMedia.length

    if (
      this.aiRunMediaLimitInspector.isWithinMediaCountLimit({
        mediaCount,
      })
    ) {
      return null
    }

    const failureParameters = this.aiRunMediaLimitInspector.buildExceededMediaCountLimitParameters({
      mediaCount,
    })

    return {
      failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_LIMIT_EXCEEDED,
      failureParameters,
    }
  }

  /**
   * Build the refusal a file larger than the cap allows is answered with.
   *
   * @param {{
   *   aiRunMediaRow: *
   * }} params - Parameters.
   * @returns {AiRunMediaRefusal | null} The refusal, or null when the size is within the cap.
   * @public
   */
  buildByteSizeRefusal ({
    aiRunMediaRow,
  }) {
    const { byteSize } = aiRunMediaRow

    if (
      this.aiRunMediaLimitInspector.isWithinByteSizeLimit({
        byteSize,
      })
    ) {
      return null
    }

    const limitParameters = this.aiRunMediaLimitInspector.buildExceededByteSizeLimitParameters({
      byteSize,
    })

    const failureParameters = {
      ...limitParameters,
      [MEDIA_KEY_PARAMETER_NAME]: aiRunMediaRow.mediaKey,
    }

    return {
      failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_LIMIT_EXCEEDED,
      failureParameters,
    }
  }

  /**
   * Build the refusal a kind this version does not read is answered with.
   *
   * @param {{
   *   aiRunMediaRow: *
   *   isRecognizedMediaCategory: boolean
   * }} params - Parameters.
   * @returns {AiRunMediaRefusal} The refusal.
   * @public
   */
  buildUnsupportedCategoryRefusal ({
    aiRunMediaRow,
    isRecognizedMediaCategory,
  }) {
    const mediaCategoryName = this.aiRunMediaCategoryInspector.extractAiRunMediaCategoryName({
      aiRunMediaCategoryId: aiRunMediaRow.AiRunMediaCategoryId,
    })

    return {
      failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_UNSUPPORTED,
      failureParameters: {
        [MEDIA_KEY_PARAMETER_NAME]: aiRunMediaRow.mediaKey,
        [MEDIA_CATEGORY_PARAMETER_NAME]: mediaCategoryName,
        [RECOGNIZED_MEDIA_CATEGORY_PARAMETER_NAME]: isRecognizedMediaCategory,
      },
    }
  }

  /**
   * Fetch the media one at a time, rationing the budget as it goes.
   *
   * Sequentially rather than at once, and through a `reduce` rather than a loop: a later medium's
   * allowance depends on what the earlier ones spent, which is exactly the dependency that rules
   * `Promise.all` out.
   *
   * @param {{
   *   requestBody: *
   *   aiRunMedia: Array<*>
   *   aiRunMediaWorkspace: *
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<AiRunMediaCollection>} What each medium came to.
   * @public
   */
  async collectMediaSequentially ({
    requestBody,
    aiRunMedia,
    aiRunMediaWorkspace,
    signal,
  }) {
    return aiRunMedia.reduce(
      async (accumulatedCollectionPromise, aiRunMediaRow) => {
        const accumulatedCollection = await accumulatedCollectionPromise

        return this.appendOneMedium({
          collection: accumulatedCollection,
          requestBody,
          aiRunMediaRow,
          aiRunMediaWorkspace,
          signal,
        })
      },
      Promise.resolve(
        this.buildEmptyCollection()
      )
    )
  }

  /**
   * Collect one medium, or record that it was skipped without spending anything on it.
   *
   * Its own method rather than the body of the callback above, because a higher-order function may
   * carry no `if` - and the guard here says only which media are not reached: a budget already
   * spent, or a run whose time limit has already won.
   *
   * **A skipped medium is still appended.** A run that gave up halfway has to name what it did not
   * fetch, or the caller cannot tell an unreadable file from one nobody reached.
   *
   * @param {AppendOneMediumParams} params - Parameters.
   * @returns {Promise<AiRunMediaCollection>} The collection, with this medium accounted for.
   * @public
   */
  async appendOneMedium ({
    collection,
    requestBody,
    aiRunMediaRow,
    aiRunMediaWorkspace,
    signal,
  }) {
    if (
      !this.shouldCollectMedium({
        collection,
        signal,
      })
    ) {
      return this.appendSkippedMedium({
        collection,
        aiRunMediaRow,
      })
    }

    const startedAt = this.buildCurrentInstant()

    const mediumOutcome = await this.collectMedium({
      requestBody,
      aiRunMediaRow,
      aiRunMediaWorkspace,
      signal,
      budgetRemainingMilliseconds: collection.budgetRemainingMilliseconds,
    })

    const finishedAt = this.buildCurrentInstant()

    return this.appendCollectedMedium({
      collection,
      mediumOutcome,
      startedAt,
      finishedAt,
    })
  }

  /**
   * Build the collection a run starts out with, holding the whole of the step's budget.
   *
   * @returns {AiRunMediaCollection} The collection.
   * @public
   */
  buildEmptyCollection () {
    return {
      mediumOutcomes: [],
      budgetRemainingMilliseconds: this.mediaBudgetMilliseconds,
      refusal: null,
    }
  }

  /**
   * Check whether the next medium is one this run still fetches.
   *
   * @param {{
   *   collection: AiRunMediaCollection
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {boolean} Whether to go on.
   * @public
   */
  shouldCollectMedium ({
    collection,
    signal,
  }) {
    if (collection.refusal !== null) {
      return false
    }

    return !signal.aborted
  }

  /**
   * Append a medium this run never reached.
   *
   * It is recorded as unreadable rather than left out, because the caller answers
   * `unreadableMediaKeys[]` from these outcomes and a caller told nothing about a file it sent has
   * been told a file was read when it was not.
   *
   * @param {{
   *   collection: AiRunMediaCollection
   *   aiRunMediaRow: *
   * }} params - Parameters.
   * @returns {AiRunMediaCollection} The collection.
   * @public
   */
  appendSkippedMedium ({
    collection,
    aiRunMediaRow,
  }) {
    const mediumOutcome = this.buildMediumOutcome({
      aiRunMediaRow,
      handlingName: AI_RUN_MEDIA_HANDLING.HANDLE,
      isReadable: false,
      filePath: null,
      refusal: null,
    })

    return {
      mediumOutcomes: [
        ...collection.mediumOutcomes,
        mediumOutcome,
      ],
      budgetRemainingMilliseconds: collection.budgetRemainingMilliseconds,
      refusal: collection.refusal,
    }
  }

  /**
   * Append what one medium came to, and take what it spent off the budget.
   *
   * @param {{
   *   collection: AiRunMediaCollection
   *   mediumOutcome: AiRunMediumOutcome
   *   startedAt: Date
   *   finishedAt: Date
   * }} params - Parameters.
   * @returns {AiRunMediaCollection} The collection.
   * @public
   */
  appendCollectedMedium ({
    collection,
    mediumOutcome,
    startedAt,
    finishedAt,
  }) {
    const budgetRemainingMilliseconds = this.generateBudgetRemainingMilliseconds({
      budgetRemainingMilliseconds: collection.budgetRemainingMilliseconds,
      startedAt,
      finishedAt,
    })

    return {
      mediumOutcomes: [
        ...collection.mediumOutcomes,
        mediumOutcome,
      ],
      budgetRemainingMilliseconds,
      refusal: mediumOutcome.refusal,
    }
  }

  /**
   * Generate what is left of the budget once one medium has spent its share.
   *
   * A clock that stepped backwards between the two instants would otherwise hand the next medium
   * more budget than the run has, so a negative spend is read as nothing spent rather than as time
   * returned. The floor at nothing is the other end of the same rule: a budget cannot go below
   * empty, and a caller comparing against it reads one value for "there is none left".
   *
   * @param {{
   *   budgetRemainingMilliseconds: number
   *   startedAt: Date
   *   finishedAt: Date
   * }} params - Parameters.
   * @returns {number} What is left.
   * @public
   */
  generateBudgetRemainingMilliseconds ({
    budgetRemainingMilliseconds,
    startedAt,
    finishedAt,
  }) {
    const measuredMilliseconds = finishedAt.getTime() - startedAt.getTime()

    const spentMilliseconds = Math.max(measuredMilliseconds, 0)

    return Math.max(budgetRemainingMilliseconds - spentMilliseconds, 0)
  }

  /**
   * Generate the allowance one fetch is given.
   *
   * @param {{
   *   budgetRemainingMilliseconds: number
   * }} params - Parameters.
   * @returns {number} The allowance, nothing when the budget is spent.
   * @public
   */
  generateFetchAllowanceMilliseconds ({
    budgetRemainingMilliseconds,
  }) {
    return Math.min(this.mediumTimeoutMilliseconds, Math.max(budgetRemainingMilliseconds, 0))
  }

  /**
   * Do with one medium whatever this version does with its kind.
   *
   * The handling is read out of a hash rather than branched on - see the class comment on why the
   * three endings are data. A kind naming no master row answers no handler, and that is the one
   * case read as a refusal here rather than by the hash.
   *
   * @param {CollectMediumParams} params - Parameters.
   * @returns {Promise<AiRunMediumOutcome>} What the medium came to.
   * @public
   */
  async collectMedium ({
    requestBody,
    aiRunMediaRow,
    aiRunMediaWorkspace,
    signal,
    budgetRemainingMilliseconds,
  }) {
    const handlingName = this.extractMediumHandlingName({
      aiRunMediaRow,
    })

    const mediumHandlerHash = this.buildMediumHandlerHash()

    if (!Object.hasOwn(mediumHandlerHash, handlingName)) {
      return this.refuseMedium({
        aiRunMediaRow,
        isRecognizedMediaCategory: false,
      })
    }

    return mediumHandlerHash[handlingName]({
      requestBody,
      aiRunMediaRow,
      aiRunMediaWorkspace,
      signal,
      budgetRemainingMilliseconds,
    })
  }

  /**
   * Extract what this version does with the kind one medium was recorded under.
   *
   * @param {{
   *   aiRunMediaRow: *
   * }} params - Parameters.
   * @returns {string | null} The handling, or null when the kind names no master row.
   * @public
   */
  extractMediumHandlingName ({
    aiRunMediaRow,
  }) {
    return this.aiRunMediaCategoryInspector.extractAiRunMediaHandlingNameById({
      aiRunMediaCategoryId: aiRunMediaRow.AiRunMediaCategoryId,
    })
  }

  /**
   * Build what this class does for each of the three handlings.
   *
   * @returns {Record<string, (params: CollectMediumParams) => Promise<AiRunMediumOutcome>>} The
   * handlers.
   * @public
   */
  buildMediumHandlerHash () {
    return {
      [AI_RUN_MEDIA_HANDLING.HANDLE]: params => this.fetchMedium(params),
      [AI_RUN_MEDIA_HANDLING.REFUSE]: async ({
        aiRunMediaRow,
      }) => this.refuseMedium({
        aiRunMediaRow,
        isRecognizedMediaCategory: true,
      }),
      [AI_RUN_MEDIA_HANDLING.IGNORE]: async ({
        aiRunMediaRow,
      }) => this.ignoreMedium({
        aiRunMediaRow,
      }),
    }
  }

  /**
   * Refuse the whole collection over one medium whose kind this version does not read.
   *
   * @param {{
   *   aiRunMediaRow: *
   *   isRecognizedMediaCategory: boolean
   * }} params - Parameters.
   * @returns {AiRunMediumOutcome} The outcome.
   * @public
   */
  refuseMedium ({
    aiRunMediaRow,
    isRecognizedMediaCategory,
  }) {
    const refusal = this.buildUnsupportedCategoryRefusal({
      aiRunMediaRow,
      isRecognizedMediaCategory,
    })

    return this.buildMediumOutcome({
      aiRunMediaRow,
      handlingName: AI_RUN_MEDIA_HANDLING.REFUSE,
      isReadable: false,
      filePath: null,
      refusal,
    })
  }

  /**
   * Pass over one medium whose kind this version neither reads nor refuses.
   *
   * Nothing is fetched, nothing is written and the caller is told nothing: an ignored medium does
   * not appear in `unreadableMediaKeys[]`, because it was not unreadable - it was not read.
   *
   * @param {{
   *   aiRunMediaRow: *
   * }} params - Parameters.
   * @returns {AiRunMediumOutcome} The outcome.
   * @public
   */
  ignoreMedium ({
    aiRunMediaRow,
  }) {
    return this.buildMediumOutcome({
      aiRunMediaRow,
      handlingName: AI_RUN_MEDIA_HANDLING.IGNORE,
      isReadable: false,
      filePath: null,
      refusal: null,
    })
  }

  /**
   * Fetch one medium this version reads, and put it in the run's workspace.
   *
   * @param {CollectMediumParams} params - Parameters.
   * @returns {Promise<AiRunMediumOutcome>} The outcome.
   * @public
   */
  async fetchMedium ({
    requestBody,
    aiRunMediaRow,
    aiRunMediaWorkspace,
    signal,
    budgetRemainingMilliseconds,
  }) {
    const byteSizeRefusal = this.buildByteSizeRefusal({
      aiRunMediaRow,
    })

    if (byteSizeRefusal !== null) {
      return this.buildMediumOutcome({
        aiRunMediaRow,
        handlingName: AI_RUN_MEDIA_HANDLING.HANDLE,
        isReadable: false,
        filePath: null,
        refusal: byteSizeRefusal,
      })
    }

    const fetchOutcome = await this.fetchMediumBytes({
      requestBody,
      aiRunMediaRow,
      budgetRemainingMilliseconds,
    })

    const filePath = await this.storeFetchedMedium({
      aiRunMediaRow,
      aiRunMediaWorkspace,
      fetchOutcome,
      signal,
    })

    await this.saveFetchedMedium({
      aiRunMediaRow,
      isReadable: filePath !== null,
    })

    return this.buildMediumOutcome({
      aiRunMediaRow,
      handlingName: AI_RUN_MEDIA_HANDLING.HANDLE,
      isReadable: filePath !== null,
      filePath,
      mimeType: fetchOutcome.mimeType,
      refusal: null,
    })
  }

  /**
   * Fetch the bytes of one medium, under the allowance the budget leaves it.
   *
   * A medium the budget cannot reach is not fetched at all - no connection is opened and no line
   * appears in anybody's access log - and it comes back exactly as a failed fetch does. That is the
   * rationing the class comment is about.
   *
   * @param {{
   *   requestBody: *
   *   aiRunMediaRow: *
   *   budgetRemainingMilliseconds: number
   * }} params - Parameters.
   * @returns {Promise<import('./MediaFetchClient.js').MediaFetchOutcome>} What the fetch produced.
   * @public
   */
  async fetchMediumBytes ({
    requestBody,
    aiRunMediaRow,
    budgetRemainingMilliseconds,
  }) {
    const requestTimeoutMilliseconds = this.generateFetchAllowanceMilliseconds({
      budgetRemainingMilliseconds,
    })

    if (requestTimeoutMilliseconds <= 0) {
      return this.buildUnfetchedOutcome()
    }

    const url = this.aiRunMediaDescriptorExtractor.extractMediaUrl({
      requestBody,
      mediaKey: aiRunMediaRow.mediaKey,
    })

    const mediaFetchClient = this.createMediaFetchClient({
      requestTimeoutMilliseconds,
    })

    return mediaFetchClient.fetchMedium({
      url,
    })
  }

  /**
   * Build what a medium nothing was spent on came to.
   *
   * @returns {import('./MediaFetchClient.js').MediaFetchOutcome} The outcome.
   * @public
   */
  buildUnfetchedOutcome () {
    return {
      bytes: null,
      byteSize: null,
      mimeType: null,
      failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_FETCH_FAILED,
    }
  }

  /**
   * Create the client one medium is fetched through, under its own allowance.
   *
   * One per medium, because the allowance is a factory parameter and each medium gets its own. The
   * allow-list it reads is an environment key split on every construction, which is cheap beside
   * the fetch it is about to make.
   *
   * @param {{
   *   requestTimeoutMilliseconds: number
   * }} params - Parameters.
   * @returns {MediaFetchClient} The client.
   * @public
   */
  createMediaFetchClient ({
    requestTimeoutMilliseconds,
  }) {
    return this.Ctor.MediaFetchClientCtor.create({
      requestTimeoutMilliseconds,
    })
  }

  /**
   * Put one fetched medium in the run's workspace, and answer where it went.
   *
   * **The signal is asked here, immediately before the write** ([[Q113]]). A run past its time
   * limit has had its workspace removed already, and a file written afterwards recreates a
   * directory nothing will remove again - so a run that lost the race writes nothing, and the
   * medium is reported unreadable like any other the run never got.
   *
   * @param {{
   *   aiRunMediaRow: *
   *   aiRunMediaWorkspace: *
   *   fetchOutcome: import('./MediaFetchClient.js').MediaFetchOutcome
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<string | null>} Where the file went, or null when nothing was written.
   * @public
   */
  async storeFetchedMedium ({
    aiRunMediaRow,
    aiRunMediaWorkspace,
    fetchOutcome,
    signal,
  }) {
    if (fetchOutcome.bytes === null) {
      return null
    }

    if (signal.aborted) {
      return null
    }

    return aiRunMediaWorkspace.writeMediumFile({
      aiRunMediaId: aiRunMediaRow.id,
      bytes: fetchOutcome.bytes,
    })
  }

  /**
   * Save what became of one medium once the fetch had been attempted.
   *
   * The instant is read here rather than handed in because it is the moment this fetch ended, which
   * nothing above this method knows - see `#get:DateCtor` on the one clock this class reads.
   *
   * @param {{
   *   aiRunMediaRow: *
   *   isReadable: boolean
   * }} params - Parameters.
   * @returns {Promise<number>} How many rows the write moved.
   * @public
   */
  async saveFetchedMedium ({
    aiRunMediaRow,
    isReadable,
  }) {
    const fetchedAt = this.buildCurrentInstant()

    return this.aiRunMediaRecorder.saveFetchedAiRunMedia({
      aiRunMediaId: aiRunMediaRow.id,
      isReadable,
      fetchedAt,
    })
  }

  /**
   * Build what one medium came to.
   *
   * @param {{
   *   aiRunMediaRow: *
   *   handlingName: string
   *   isReadable: boolean
   *   filePath: string | null
   *   mimeType?: string | null
   *   refusal: AiRunMediaRefusal | null
   * }} params - Parameters.
   * @returns {AiRunMediumOutcome} The outcome.
   * @public
   */
  buildMediumOutcome ({
    aiRunMediaRow,
    handlingName,
    isReadable,
    filePath,
    mimeType = null,
    refusal,
  }) {
    return {
      aiRunMediaId: aiRunMediaRow.id,
      mediaKey: aiRunMediaRow.mediaKey,
      handlingName,
      isReadable,
      filePath,
      mimeType,
      refusal,
    }
  }

  /**
   * Build what the whole step answers, out of what each medium came to.
   *
   * **A run whose media could not be read at all fails under `MEDIA_UNREADABLE`**, which is the
   * twelfth acceptance criterion. It is asked of the media this version reads and not of the whole
   * list: a request of one photograph and one audio file whose photograph failed has nothing to
   * read, and an ignored file is not a reading that succeeded.
   *
   * @param {{
   *   collection: AiRunMediaCollection
   * }} params - Parameters.
   * @returns {CollectedAiRunMedia} What was collected.
   * @public
   */
  buildCollectedAiRunMedia ({
    collection,
  }) {
    const refusal = collection.refusal
      ?? this.buildUnreadableRefusal({
        mediumOutcomes: collection.mediumOutcomes,
      })

    const readableMedia = collection.mediumOutcomes.filter(it => it.isReadable)

    const unreadableMediaKeys = this.extractUnreadableMediaKeys({
      mediumOutcomes: collection.mediumOutcomes,
    })

    return {
      readableMedia,
      unreadableMediaKeys,
      failureReasonCode: refusal?.failureReasonCode
        ?? null,
      failureParameters: refusal?.failureParameters
        ?? null,
    }
  }

  /**
   * Build the refusal a run whose media could not be read at all is answered with.
   *
   * @param {{
   *   mediumOutcomes: Array<AiRunMediumOutcome>
   * }} params - Parameters.
   * @returns {AiRunMediaRefusal | null} The refusal, or null when something was read or nothing was
   * meant to be.
   * @public
   */
  buildUnreadableRefusal ({
    mediumOutcomes,
  }) {
    const handledOutcomes = mediumOutcomes
      .filter(it => it.handlingName === AI_RUN_MEDIA_HANDLING.HANDLE)

    if (handledOutcomes.length === 0) {
      return null
    }

    if (handledOutcomes.some(it => it.isReadable)) {
      return null
    }

    return {
      failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_UNREADABLE,
      failureParameters: null,
    }
  }

  /**
   * Extract the keys of the media that were meant to be read and could not be.
   *
   * @param {{
   *   mediumOutcomes: Array<AiRunMediumOutcome>
   * }} params - Parameters.
   * @returns {Array<string>} The keys.
   * @public
   */
  extractUnreadableMediaKeys ({
    mediumOutcomes,
  }) {
    return mediumOutcomes
      .filter(it => it.handlingName === AI_RUN_MEDIA_HANDLING.HANDLE)
      .filter(it => !it.isReadable)
      .map(it => it.mediaKey)
  }

  /**
   * Build what a collection refused before it began answers.
   *
   * @param {{
   *   refusal: AiRunMediaRefusal
   * }} params - Parameters.
   * @returns {CollectedAiRunMedia} What was collected, which is nothing.
   * @public
   */
  buildRefusedCollection ({
    refusal,
  }) {
    return {
      readableMedia: [],
      unreadableMediaKeys: [],
      failureReasonCode: refusal.failureReasonCode,
      failureParameters: refusal.failureParameters,
    }
  }
}

/**
 * @typedef {{
 *   aiRunMediaCategoryInspector: AiRunMediaCategoryInspector
 *   aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor
 *   aiRunMediaLimitInspector: AiRunMediaLimitInspector
 *   aiRunMediaRecorder: AiRunMediaRecorder
 *   mediaBudgetMilliseconds: number
 *   mediumTimeoutMilliseconds: number
 * }} AiRunMediaCollectorParams
 */

/**
 * @typedef {Partial<AiRunMediaCollectorParams>} AiRunMediaCollectorFactoryParams
 */

/**
 * @typedef {{
 *   requestBody: *
 *   aiRunMedia: Array<*>
 *   aiRunMediaWorkspace: *
 *   signal: AbortSignal
 * }} CollectAiRunMediaParams
 */

/**
 * @typedef {{
 *   requestBody: *
 *   aiRunMediaRow: *
 *   aiRunMediaWorkspace: *
 *   signal: AbortSignal
 *   budgetRemainingMilliseconds: number
 * }} CollectMediumParams
 */

/**
 * @typedef {{
 *   failureReasonCode: string
 *   failureParameters: Record<string, *> | null
 * }} AiRunMediaRefusal
 */

/**
 * @typedef {{
 *   aiRunMediaId: number
 *   mediaKey: string
 *   handlingName: string
 *   isReadable: boolean
 *   filePath: string | null
 *   mimeType: string | null
 *   refusal: AiRunMediaRefusal | null
 * }} AiRunMediumOutcome
 */

/**
 * @typedef {{
 *   readableMedia: Array<AiRunMediumOutcome>
 *   unreadableMediaKeys: Array<string>
 *   failureReasonCode: string | null
 *   failureParameters: Record<string, *> | null
 * }} CollectedAiRunMedia
 */
