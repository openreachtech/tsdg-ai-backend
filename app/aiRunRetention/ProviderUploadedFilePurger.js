import {
  Op,
} from 'sequelize'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiProviderModelProcessorFinder from '../aiProvider/AiProviderModelProcessorFinder.js'
import AiRunInstantInspector from '../aiRun/AiRunInstantInspector.js'
import UnstatedExpiryHorizonCalculator from './UnstatedExpiryHorizonCalculator.js'

import PROVIDER_UPLOAD_PURGE_SWEEP_CONSTANT_HASH from '../constants/providerUploadPurgeSweepConstants.js'

import ProviderUploadedFile from '../../sequelize/models/ProviderUploadedFile.js'

import {
  env,
  rootPath,
} from '../globals/_.js'

const {
  PROVIDER_UPLOAD_PURGE_SWEEP,
} = PROVIDER_UPLOAD_PURGE_SWEEP_CONSTANT_HASH

const UNRECORDABLE_INSTANT_MESSAGE = 'refused an instant that is not an instant'
const UNREACHABLE_PROVIDER_MESSAGE = 'left a file where it is because this service has no driver for its provider'
const FAILED_DELETE_MESSAGE = 'left a file where it is because the provider could not be reached'

/*
 * The same log file the two run purges write to, and for the reason `BaseAiRunPurgeJobWorker`
 * gives: the question an operator brings to it is one question - "is retention keeping up?" - and
 * it is answered by reading all three sweeps together. A third file would let a provider that has
 * been refusing every delete for a week read as silence in whichever file somebody opened.
 */
const LOG_FILE_PATH = rootPath.to('logs/ai-run-purge-')

const UNREACHABLE_PROVIDER_TAGS = [
  'ProviderUploadPurge',
  'UnreachableProvider',
]

const FAILED_DELETE_TAGS = [
  'ProviderUploadPurge',
  'FailedDelete',
]

const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * Asks each provider to delete the files this service handed it that are past their time, and
 * records the ones it confirmed gone.
 *
 * **It is the third row of §19's background-jobs table and the only one that leaves the machine.**
 * The two run purges write to columns of this service's own database and nothing else can fail
 * halfway; this one makes an outbound call per row, to somebody else, and then writes down what
 * that call established. Almost every decision below follows from that difference.
 *
 * ---
 *
 * **Which files are ripe: the ones their provider has said are past, plus the ones no provider
 * dated at all.** The condition is `provider_purged_at IS NULL` and either `expires_at` is behind
 * `now`, or `expires_at` is null and the file left this machine before the unstated-expiry horizon.
 * Three arguments hold it up, and it is worth stating why the two obvious alternatives are wrong.
 *
 * *Not "everything not yet taken back".* A copy whose stated expiry is still ahead is one the
 * vendor has told us it is holding and one a run may still be reading — the upload and the model
 * call are the same step, but a redelivered job or a retried run makes "still in use" a state this
 * table cannot see. There is no need to race the vendor's own clock: the file becomes ripe the day
 * after the vendor said it would go, and the set drains either way.
 *
 * *Not "only what is still there".* Selecting files whose expiry is still ahead — deleting early,
 * so that every call is one the vendor can carry out — would leave every row whose expiry had
 * passed unstamped for ever. `provider_purged_at` would stay null on precisely the copies that are
 * gone, and the egress record would go on asserting that a copy exists when it does not.
 *
 * *And "a call that can only fail" is not what asking about an expired file is.* The vendor states
 * an expiry; it does not report having acted on it. Asking is the only way this service learns that
 * the copy is actually gone, and being told the handle is unknown is an answer rather than a
 * failure — it turns an assumption into something recorded. It is also the one call that catches
 * the case that matters most: a vendor that lengthened its window, or a file it kept past what it
 * said. §19's third purge is "deleting from a provider what was uploaded to it", and this is the
 * condition under which that sentence is true of every row rather than of the convenient ones.
 *
 * *The null-expiry rows are the reason a clock of ours exists at all.* A vendor that stated no
 * expiry will never remove the copy, and `generateProviderFileExpiresAt()` answers null for a
 * timestamp this service could not read as well — so null means "nothing at the far end is going to
 * do this". `UnstatedExpiryHorizonCalculator` is the wait before asking, and
 * `providerUploadedFileRetentionConstants.cjs` argues the figure against §7's 300-second cap on a
 * run.
 *
 * ---
 *
 * **What a failed delete does, which is the decision this class exists to get right.** Only two
 * things may happen to a row. Its copy is confirmed gone — the vendor deleted it, or the vendor
 * says it knows no such handle — and the row is stamped. Or nothing is established, and the row is
 * left exactly as it was for the next sweep to try again. There is deliberately no third path, and
 * in particular no path that stamps on the strength of the row's own `expires_at`: a stamp saying a
 * copy of somebody's personal data was deleted, written without that having been established, is
 * the false record §4's deferral refused to build, and it would be indistinguishable afterwards
 * from one that was earned.
 *
 * Which failure means "gone" is not decided here. It cannot be: it rests on a vendor's error
 * vocabulary, and this class must not learn one.
 * `BaseAiModelProcessor#deleteProviderUploadedFile()` states the contract in terms a driver can
 * answer — return means the copy no longer exists, raise means its state is unknown — and each
 * driver draws the line from its own vendor's answers.
 *
 * **One row's failure does not abandon the batch.** Every row is attempted; a raise is caught,
 * logged and left behind, and the sweep goes on to the next. A vendor that is briefly unwell, a
 * single handle that is malformed, a provider this installation has no driver for — none of them
 * should stop the other ninety-nine files of a batch from being taken back.
 *
 * ---
 *
 * **How the sweep ends, which differs from the two run purges and is not an oversight.** Their
 * stamp is written for every row of every batch, so the set always shrinks and an empty batch is
 * the only exit that matters. Here a row whose provider could not be reached stays in the set, so a
 * sweep that only looked for an empty batch would ask the same hundred rows over and over until its
 * batch bound was spent — twenty thousand pointless calls to a vendor that is already failing. So
 * there are three exits: an empty batch means the set is clear and the sweep finished; a spent batch
 * bound means it stopped with work still there; and **a batch in which nothing at all could be
 * confirmed gone** stops it too, reported as unfinished. That third exit is what turns a provider
 * outage into one wasted batch instead of two hundred, and it is honest — nothing was established,
 * so the sweep did not finish.
 *
 * Nothing is remembered between sweeps either way. The stamp is the leading column of the condition
 * every batch selects by, so a file already taken back leaves the set by having been taken back;
 * tomorrow's sweep asks the same question, and the rows this one failed on are simply asked about
 * again — which is the retry, and the reason none is built here.
 *
 * ---
 *
 * **Why there is no transaction, where the two run purges have one.** Theirs write across two and
 * four tables and need the batch to land as a unit. This writes one column of one table, for the
 * ids whose copies were confirmed gone, in a single statement — already a unit. What could not have
 * been made atomic is the part that matters: no transaction spans a vendor's HTTP call and this
 * service's database. That is exactly why the stamp is written after the calls and only for the
 * rows they settled, rather than optimistically before them.
 *
 * ---
 *
 * **An open question, written here so the next reader has it rather than having to notice it: should
 * a run's own content purge also take the provider copy back?** As things stand the two clocks never
 * meet. `AiRunContentPurger` empties a run's content at thirty days and touches this table not at
 * all — §18 keeps the egress record independently of whether the run's content still exists, and
 * that is right, because "which file left, to whom, and when" has to stay answerable months
 * afterwards. What it means in practice is that a copy at a provider is taken back on the provider's
 * expiry plus a day, long before the run's own content goes, so the copy is already gone by the time
 * the content purge runs and there would be nothing for it to do. The case where they would meet is
 * the one this job cannot settle: a copy the provider refused to confirm gone, sweep after sweep,
 * still sitting there when the run it belonged to is purged. Whether a content purge reaching such a
 * run should escalate — ask again, or report that a copy outlived its own run's content — is a
 * design question, not a defect, and it is deliberately not answered here: it would put one class in
 * possession of two clocks, which is the shape §7's "two separate settings, never one" exists to
 * prevent. It belongs in the specification before it belongs in code.
 *
 * ---
 *
 * **The instant is handed in and checked before anything is read**, for the reasons
 * `AiRunContentPurger` states: one sweep has one instant, shared by the horizon it selects against
 * and the stamp it writes, and Sequelize would settle a `now` that is not a time as the literal text
 * `Invalid date` in `provider_purged_at` — a row both unfindable by the next sweep and
 * indistinguishable from a purge that worked.
 */
export default class ProviderUploadedFilePurger {
  /**
   * Constructor.
   *
   * @param {ProviderUploadedFilePurgerParams} params - Parameters.
   */
  constructor ({
    unstatedExpiryHorizonCalculator,
    aiRunInstantInspector,
    aiProviderModelProcessorFinder,
    providerUploadedFileCountPerBatch,
    maximumBatchCount,
  }) {
    this.unstatedExpiryHorizonCalculator = unstatedExpiryHorizonCalculator
    this.aiRunInstantInspector = aiRunInstantInspector
    this.aiProviderModelProcessorFinder = aiProviderModelProcessorFinder
    this.providerUploadedFileCountPerBatch = providerUploadedFileCountPerBatch
    this.maximumBatchCount = maximumBatchCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof ProviderUploadedFilePurger ? X : never} T, X
   * @param {ProviderUploadedFilePurgerFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    unstatedExpiryHorizonCalculator = this.createUnstatedExpiryHorizonCalculator(),
    aiRunInstantInspector = this.createAiRunInstantInspector(),
    aiProviderModelProcessorFinder = this.createAiProviderModelProcessorFinder(),
    providerUploadedFileCountPerBatch = PROVIDER_UPLOAD_PURGE_SWEEP.PROVIDER_UPLOADED_FILE_COUNT_PER_BATCH,
    maximumBatchCount = PROVIDER_UPLOAD_PURGE_SWEEP.MAXIMUM_BATCH_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        unstatedExpiryHorizonCalculator,
        aiRunInstantInspector,
        aiProviderModelProcessorFinder,
        providerUploadedFileCountPerBatch,
        maximumBatchCount,
      })
    )
  }

  /**
   * get: the egress record model — a seam so tests can substitute it.
   *
   * @returns {typeof ProviderUploadedFile} Model.
   */
  static get ProviderUploadedFileCtor () {
    return ProviderUploadedFile
  }

  /**
   * get: the query operators a `where` states its conditions with.
   *
   * @returns {typeof Op} Operators.
   */
  static get sequelizeOperators () {
    return Op
  }

  /**
   * get: the one logger client the three retention sweeps write through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * Create the calculator answering how long a copy nobody dated may sit at a provider.
   *
   * @returns {UnstatedExpiryHorizonCalculator} Calculator.
   */
  static createUnstatedExpiryHorizonCalculator () {
    return UnstatedExpiryHorizonCalculator.create()
  }

  /**
   * Create the inspector answering whether a value is an instant this service may record.
   *
   * @returns {AiRunInstantInspector} Inspector.
   */
  static createAiRunInstantInspector () {
    return AiRunInstantInspector.create()
  }

  /**
   * Create the finder answering which driver speaks to a given provider.
   *
   * @returns {AiProviderModelProcessorFinder} Finder.
   */
  static createAiProviderModelProcessorFinder () {
    return AiProviderModelProcessorFinder.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof ProviderUploadedFilePurger} The class.
   */
  get Ctor () {
    return /** @type {typeof ProviderUploadedFilePurger} */ (this.constructor)
  }

  /**
   * Take back every file past its time at the provider that holds it, in bounded batches.
   *
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<ProviderUploadPurgeSweepOutcome>} What the sweep did, and whether it
   * finished.
   * @throws {Error} When the instant handed in is not an instant.
   * @public
   */
  async purgeExpiredProviderUploadedFiles ({
    now,
  }) {
    if (
      !this.aiRunInstantInspector.isRecordableInstant({
        instant: now,
      })
    ) {
      throw new Error(`${this.Ctor.name}#purgeExpiredProviderUploadedFiles() ${UNRECORDABLE_INSTANT_MESSAGE}: field now`)
    }

    const unstatedExpiryHorizon = this.unstatedExpiryHorizonCalculator.calculateUnstatedExpiryHorizon({
      now,
    })

    return this.sweepExpiredProviderUploadedFiles({
      now,
      unstatedExpiryHorizon,
      purgedAt: now,
      remainingBatchCount: this.maximumBatchCount,
      purgedFileCount: 0,
      batchCount: 0,
    })
  }

  /**
   * Take back one batch, then the next, until the set empties, the batch bound is reached, or a
   * whole batch settles nothing.
   *
   * It recurses rather than loops because the exit is the batch's own answer, and because the batch
   * bound is then a number that visibly decreases rather than a condition a reader has to trust.
   * Depth is `maximumBatchCount` and nothing else can raise it.
   *
   * The three exits say different things and the caller needs all of them. An empty batch means the
   * set is clear. A spent batch bound means the backlog is larger than one sweep, which is a fact
   * about its size rather than a failure. A batch that confirmed nothing means the providers in it
   * could not be reached at all, and going on would be twenty thousand calls to somebody who is
   * already refusing — so the sweep stops, and says it did not finish.
   *
   * @param {SweepExpiredProviderUploadedFilesParams} params - Parameters.
   * @returns {Promise<ProviderUploadPurgeSweepOutcome>} What the sweep did, and whether it
   * finished.
   * @public
   */
  async sweepExpiredProviderUploadedFiles ({
    now,
    unstatedExpiryHorizon,
    purgedAt,
    remainingBatchCount,
    purgedFileCount,
    batchCount,
  }) {
    if (remainingBatchCount <= 0) {
      return this.buildSweepOutcome({
        purgedFileCount,
        batchCount,
        isSweepExhausted: false,
      })
    }

    const providerUploadedFiles = await this.findExpiredProviderUploadedFiles({
      now,
      unstatedExpiryHorizon,
    })

    if (providerUploadedFiles.length === 0) {
      return this.buildSweepOutcome({
        purgedFileCount,
        batchCount,
        isSweepExhausted: true,
      })
    }

    const batchPurgedFileCount = await this.savePurgedProviderUploadedFiles({
      providerUploadedFiles,
      purgedAt,
    })

    if (batchPurgedFileCount === 0) {
      return this.buildSweepOutcome({
        purgedFileCount,
        batchCount: batchCount + 1,
        isSweepExhausted: false,
      })
    }

    return this.sweepExpiredProviderUploadedFiles({
      now,
      unstatedExpiryHorizon,
      purgedAt,
      remainingBatchCount: remainingBatchCount - 1,
      purgedFileCount: purgedFileCount + batchPurgedFileCount,
      batchCount: batchCount + 1,
    })
  }

  /**
   * Build what the sweep answers with.
   *
   * Two numbers and a boolean on purpose: a worker's return value is stored in Redis, so the
   * handles this sweep asked about are deliberately not among them. A vendor's handle names a file
   * that carried somebody's photographs, and this job exists to stop copies of those lying around.
   *
   * @param {ProviderUploadPurgeSweepOutcome} params - Parameters.
   * @returns {ProviderUploadPurgeSweepOutcome} The outcome.
   * @public
   */
  buildSweepOutcome ({
    purgedFileCount,
    batchCount,
    isSweepExhausted,
  }) {
    return {
      purgedFileCount,
      batchCount,
      isSweepExhausted,
    }
  }

  /**
   * Find one batch of the egress rows whose copies are past their time.
   *
   * **The condition leads with the stamp, and so does the index checkpoint 3 built for it**
   * (`provider_purged_at`, `expires_at`): a null stamp is the equality half and the expiry is the
   * range half, which is the order an index can serve. Without the stamp leading, every file that
   * ever expired would be returned rather than the ones nobody has dealt with yet — and this table
   * gains some twelve thousand rows a day.
   *
   * Three attributes are read and no more. The handle is what the vendor is asked about, the
   * provider id is what decides which vendor is asked, and the id is what the stamp is written by.
   * Nothing else on the row has any part in the question, and the row is the egress record that
   * outlives everything it names.
   *
   * Oldest first, by when the file left this machine: the copy that has been sitting at a provider
   * longest is the one a retention promise has a reason to prefer.
   *
   * @param {{
   *   now: Date
   *   unstatedExpiryHorizon: Date
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The rows, oldest first.
   * @public
   */
  async findExpiredProviderUploadedFiles ({
    now,
    unstatedExpiryHorizon,
  }) {
    return /** @type {*} */ (
      this.Ctor.ProviderUploadedFileCtor.findAll({
        where: {
          providerPurgedAt: null,
          [this.Ctor.sequelizeOperators.or]: [
            {
              expiresAt: {
                [this.Ctor.sequelizeOperators.lt]: now,
              },
            },
            {
              expiresAt: null,
              uploadedAt: {
                [this.Ctor.sequelizeOperators.lt]: unstatedExpiryHorizon,
              },
            },
          ],
        },
        attributes: [
          'id',
          'AiProviderId',
          'providerFileName',
        ],
        order: [
          ['uploadedAt', 'ASC'],
        ],
        limit: this.providerUploadedFileCountPerBatch,
      })
    )
  }

  /**
   * Ask each provider about one batch's files, and stamp the ones it confirmed gone.
   *
   * The stamp is written once, for the whole batch, after every call in it has been made — so a
   * sweep interrupted part-way through a batch has written nothing about that batch, and the next
   * sweep asks about all of it again. Asking a vendor twice about a file it no longer holds costs
   * one call and settles the same answer.
   *
   * @param {{
   *   providerUploadedFiles: Array<*>
   *   purgedAt: Date
   * }} params - Parameters.
   * @returns {Promise<number>} How many of the batch's copies were confirmed gone.
   * @public
   */
  async savePurgedProviderUploadedFiles ({
    providerUploadedFiles,
    purgedAt,
  }) {
    const aiModelProcessorHash = await this.buildAiModelProcessorHash({
      providerUploadedFiles,
    })

    const goneProviderUploadedFileIds = await this.collectGoneProviderUploadedFileIds({
      providerUploadedFiles,
      aiModelProcessorHash,
    })

    if (goneProviderUploadedFileIds.length === 0) {
      return 0
    }

    await this.saveProviderPurgeStamp({
      providerUploadedFileIds: goneProviderUploadedFileIds,
      purgedAt,
    })

    return goneProviderUploadedFileIds.length
  }

  /**
   * Build the driver each provider named in a batch is reached through.
   *
   * Resolved once per provider rather than once per row: the lookup reads `ai_models` and a batch
   * of a hundred files handed to one vendor would otherwise be a hundred identical queries. A
   * provider this installation has no driver for is held as null, so the rows naming it are
   * recognised below rather than faulting.
   *
   * @param {{
   *   providerUploadedFiles: Array<*>
   * }} params - Parameters.
   * @returns {Promise<Record<string, *>>} Provider id to driver, null where there is none.
   * @public
   */
  async buildAiModelProcessorHash ({
    providerUploadedFiles,
  }) {
    const aiProviderIds = this.extractAiProviderIds({
      providerUploadedFiles,
    })

    return aiProviderIds.reduce(
      async (aiModelProcessorHashPromise, aiProviderId) => {
        const aiModelProcessorHash = await aiModelProcessorHashPromise

        const aiModelProcessor = await this.aiProviderModelProcessorFinder.findAiModelProcessor({
          aiProviderId,
        })

        return {
          ...aiModelProcessorHash,
          [aiProviderId]: aiModelProcessor,
        }
      },
      Promise.resolve({})
    )
  }

  /**
   * Extract the providers a batch names, each once.
   *
   * @param {{
   *   providerUploadedFiles: Array<*>
   * }} params - Parameters.
   * @returns {Array<number>} The provider ids.
   * @public
   */
  extractAiProviderIds ({
    providerUploadedFiles,
  }) {
    const aiProviderIds = providerUploadedFiles.map(it => it.AiProviderId)

    return [
      ...new Set(aiProviderIds),
    ]
  }

  /**
   * Ask about every file of a batch, one at a time, and collect the ids whose copies are gone.
   *
   * **One at a time rather than all at once**, through the accumulator this project uses in place
   * of a loop. A hundred concurrent deletes is a rate limit at the far end, and a vendor answering
   * 429 to a retention sweep would leave rows unstamped for a reason that has nothing to do with
   * whether the copies are there.
   *
   * @param {{
   *   providerUploadedFiles: Array<*>
   *   aiModelProcessorHash: Record<string, *>
   * }} params - Parameters.
   * @returns {Promise<Array<number>>} The ids of the rows whose copies were confirmed gone.
   * @public
   */
  async collectGoneProviderUploadedFileIds ({
    providerUploadedFiles,
    aiModelProcessorHash,
  }) {
    return providerUploadedFiles.reduce(
      async (goneProviderUploadedFileIdsPromise, providerUploadedFile) => {
        const goneProviderUploadedFileIds = await goneProviderUploadedFileIdsPromise

        const aiModelProcessor = aiModelProcessorHash[providerUploadedFile.AiProviderId]

        const goneProviderUploadedFileId = await this.deleteProviderCopy({
          providerUploadedFile,
          aiModelProcessor,
        })

        return this.appendGoneProviderUploadedFileId({
          goneProviderUploadedFileIds,
          goneProviderUploadedFileId,
        })
      },
      Promise.resolve([])
    )
  }

  /**
   * Ask one provider to delete one file, and answer the row's id only if the copy is gone.
   *
   * **A raise is caught here and answers null, which leaves the row exactly as it was.** That is
   * the whole of this job's recovery story: nothing is stamped that was not established, the row
   * stays in the set, and tomorrow's sweep asks again. It is logged rather than swallowed, because
   * a provider refusing every delete for a week is invisible in a green queue and is precisely what
   * somebody needs to be told.
   *
   * **The handle is written into the log line and the run is not.** A handle names a file at a
   * vendor and is what the next person has to quote when asking the vendor about it; it is also the
   * only thing that identifies which row to look at. Nothing about the run it belonged to, or what
   * the file showed, goes anywhere near this line.
   *
   * @param {{
   *   providerUploadedFile: *
   *   aiModelProcessor: *
   * }} params - Parameters.
   * @returns {Promise<number | null>} The row's id when the copy is gone, null otherwise.
   * @public
   */
  async deleteProviderCopy ({
    providerUploadedFile,
    aiModelProcessor,
  }) {
    if (!aiModelProcessor) {
      this.Ctor.mentsuLogger.error({
        message: `${this.Ctor.name} ${UNREACHABLE_PROVIDER_MESSAGE}: AiProviderId ${providerUploadedFile.AiProviderId}, providerFileName ${providerUploadedFile.providerFileName}`,
        tags: UNREACHABLE_PROVIDER_TAGS,
      })

      return null
    }

    try {
      await aiModelProcessor.deleteProviderUploadedFile({
        providerFileName: providerUploadedFile.providerFileName,
      })

      return providerUploadedFile.id
    } catch (error) {
      this.Ctor.mentsuLogger.error({
        message: `${this.Ctor.name} ${FAILED_DELETE_MESSAGE}: AiProviderId ${providerUploadedFile.AiProviderId}, providerFileName ${providerUploadedFile.providerFileName}, ${error.message}`,
        tags: FAILED_DELETE_TAGS,
      })

      return null
    }
  }

  /**
   * Append one settled id to those collected so far, leaving an unsettled row out.
   *
   * Answers a new array rather than touching the one handed in, so the accumulator above keeps no
   * state of its own.
   *
   * @param {{
   *   goneProviderUploadedFileIds: Array<number>
   *   goneProviderUploadedFileId: number | null
   * }} params - Parameters.
   * @returns {Array<number>} The ids, with the settled one in it.
   * @public
   */
  appendGoneProviderUploadedFileId ({
    goneProviderUploadedFileIds,
    goneProviderUploadedFileId,
  }) {
    if (goneProviderUploadedFileId === null) {
      return goneProviderUploadedFileIds
    }

    return [
      ...goneProviderUploadedFileIds,
      goneProviderUploadedFileId,
    ]
  }

  /**
   * Stamp the rows whose copies are confirmed gone.
   *
   * One column of one table, so one statement is already one unit and there is nothing for a
   * transaction to hold together. The row itself stays where it is: §18 keeps the egress record
   * independently of whether the run's content still exists, so what is written here is the date
   * the copy stopped existing, beside the date it started.
   *
   * @param {{
   *   providerUploadedFileIds: Array<number>
   *   purgedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} What the write moved.
   * @public
   */
  async saveProviderPurgeStamp ({
    providerUploadedFileIds,
    purgedAt,
  }) {
    return this.Ctor.ProviderUploadedFileCtor.update(
      {
        providerPurgedAt: purgedAt,
      },
      {
        where: {
          id: {
            [this.Ctor.sequelizeOperators.in]: providerUploadedFileIds,
          },
        },
      }
    )
  }
}

/**
 * @typedef {{
 *   unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator
 *   aiRunInstantInspector: AiRunInstantInspector
 *   aiProviderModelProcessorFinder: AiProviderModelProcessorFinder
 *   providerUploadedFileCountPerBatch: number
 *   maximumBatchCount: number
 * }} ProviderUploadedFilePurgerParams
 */

/**
 * @typedef {Partial<ProviderUploadedFilePurgerParams>} ProviderUploadedFilePurgerFactoryParams
 */

/**
 * @typedef {{
 *   now: Date
 *   unstatedExpiryHorizon: Date
 *   purgedAt: Date
 *   remainingBatchCount: number
 *   purgedFileCount: number
 *   batchCount: number
 * }} SweepExpiredProviderUploadedFilesParams
 */

/**
 * @typedef {{
 *   purgedFileCount: number
 *   batchCount: number
 *   isSweepExhausted: boolean
 * }} ProviderUploadPurgeSweepOutcome
 */
