import {
  Op,
} from 'sequelize'

import AiRunInstantInspector from '../aiRun/AiRunInstantInspector.js'
import AiRunContentHorizonCalculator from './AiRunContentHorizonCalculator.js'

import AI_RUN_PURGE_SWEEP_CONSTANT_HASH from '../constants/aiRunPurgeSweepConstants.js'

import AiModelCall from '../../sequelize/models/AiModelCall.js'
import AiRun from '../../sequelize/models/AiRun.js'

const {
  AI_RUN_PURGE_SWEEP,
} = AI_RUN_PURGE_SWEEP_CONSTANT_HASH

const UNRECORDABLE_INSTANT_MESSAGE = 'refused an instant that is not an instant'

/*
 * What an emptied subject label is, written once so that the value and the reason sit together.
 *
 * `ai_runs.subject_label` is NOT NULL and §9 says it stays so, because the column is what every
 * read of a run shows an operator and a null there would have to be handled by each of them. §7
 * counts it as content all the same - the caller writes the line and it may name a place or a
 * person - so the purge empties it where it nulls the other three. This is the one content column
 * whose purged value is not null, and it is the one a purge is likeliest to miss: a run whose label
 * survived still shows that line in every list row, with every criterion of §19 reading as met.
 */
const EMPTIED_SUBJECT_LABEL = ''

/**
 * Empties the four things §7 counts as content, on the shorter of the two retention clocks.
 *
 * **What it writes, and where the fourth thing lives.** §7 names four: the asset's field values and
 * the media URLs, which arrive inside `ai_runs.request_body`; the suggested values in
 * `ai_runs.result_body`; the raw model output, which is `ai_model_calls.response_body`; and the
 * subject label. Three of them are columns of `ai_runs` and the fourth is a column of another
 * table entirely - so a purge that wrote only to the run would leave every answer a provider gave
 * sitting in `ai_model_calls`, and §19's criteria would all still read as met. Both tables are
 * written inside one transaction, and the stamp goes last.
 *
 * **The stamp is what the purge is for as much as the emptying is.** §19's third criterion is that
 * "a run whose content has been purged is distinguishable from one that never carried any", and a
 * failed run that never produced a result body is exactly that second run. So `content_purged_at`
 * is written for every run the sweep reaches, including one where three of the four columns were
 * already empty.
 *
 * **What it does not touch is the decision trace.** The step rows, the field outcomes and every
 * column of `ai_model_calls` other than the response body stay exactly where they are - that is
 * §19's second criterion, and it is kept here by writing four things and nothing else rather than
 * by anything downstream remembering to preserve them. The trace has a clock of its own, two years
 * out, and `AiRunTracePurger` is what runs it.
 *
 * **Why it sweeps in batches rather than issuing one statement.** A purge is bounded by a horizon
 * and not by a caller, so the first run against a store that has been accumulating since launch
 * selects every run ever accepted. `aiRunPurgeSweepConstants.cjs` holds the two figures and the
 * argument for them; what matters here is that the sweep needs no cursor. The stamp it writes is
 * the leading column of the condition the next batch selects by, so a purged run leaves the set by
 * being purged - an interrupted sweep loses nothing, tomorrow's picks up the rest, and a job
 * redelivered by the queue re-purges nothing.
 *
 * **The instant is handed in and checked before anything is read.** One sweep has one instant,
 * shared by the horizon it selects against and the stamp it writes; a class reading the wall clock
 * of its own accord would let the two drift apart across a long sweep, and would leave a test
 * waiting for real days to pass. It is checked because Sequelize coerces whatever it is handed into
 * `datetime(3)`: a `now` that is not a time would settle as the literal text `Invalid date` in
 * `content_purged_at`, and a run stamped that way is both unfindable by the next sweep and
 * indistinguishable from a purge that worked.
 */
export default class AiRunContentPurger {
  /**
   * Constructor.
   *
   * @param {AiRunContentPurgerParams} params - Parameters.
   */
  constructor ({
    aiRunContentHorizonCalculator,
    aiRunInstantInspector,
    aiRunCountPerBatch,
    maximumBatchCount,
  }) {
    this.aiRunContentHorizonCalculator = aiRunContentHorizonCalculator
    this.aiRunInstantInspector = aiRunInstantInspector
    this.aiRunCountPerBatch = aiRunCountPerBatch
    this.maximumBatchCount = maximumBatchCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunContentPurger ? X : never} T, X
   * @param {AiRunContentPurgerFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunContentHorizonCalculator = this.createAiRunContentHorizonCalculator(),
    aiRunInstantInspector = this.createAiRunInstantInspector(),
    aiRunCountPerBatch = AI_RUN_PURGE_SWEEP.AI_RUN_COUNT_PER_BATCH,
    maximumBatchCount = AI_RUN_PURGE_SWEEP.MAXIMUM_BATCH_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunContentHorizonCalculator,
        aiRunInstantInspector,
        aiRunCountPerBatch,
        maximumBatchCount,
      })
    )
  }

  /**
   * get: the run model — a seam so tests can substitute it.
   *
   * @returns {typeof AiRun} Model.
   */
  static get AiRunCtor () {
    return AiRun
  }

  /**
   * get: the model-call model, which holds the fourth content column.
   *
   * @returns {typeof AiModelCall} Model.
   */
  static get AiModelCallCtor () {
    return AiModelCall
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
   * Create the calculator answering where the content clock's horizon falls.
   *
   * @returns {AiRunContentHorizonCalculator} Calculator.
   */
  static createAiRunContentHorizonCalculator () {
    return AiRunContentHorizonCalculator.create()
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
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunContentPurger} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunContentPurger} */ (this.constructor)
  }

  /**
   * Empty the content of every run past the content horizon, in bounded batches.
   *
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<AiRunPurgeSweepOutcome>} What the sweep did, and whether it finished.
   * @throws {Error} When the instant handed in is not an instant.
   * @public
   */
  async purgeExpiredAiRunContent ({
    now,
  }) {
    if (
      !this.aiRunInstantInspector.isRecordableInstant({
        instant: now,
      })
    ) {
      throw new Error(`${this.Ctor.name}#purgeExpiredAiRunContent() ${UNRECORDABLE_INSTANT_MESSAGE}: field now`)
    }

    const contentHorizon = this.aiRunContentHorizonCalculator.calculateContentHorizon({
      now,
    })

    return this.sweepExpiredAiRunContent({
      contentHorizon,
      purgedAt: now,
      remainingBatchCount: this.maximumBatchCount,
      purgedAiRunCount: 0,
      batchCount: 0,
    })
  }

  /**
   * Purge one batch, then the next, until the set empties or the sweep's batch bound is reached.
   *
   * **It recurses rather than loops because the exit is the query's answer**, and because the batch
   * bound is then a number that visibly decreases rather than a condition a reader has to trust.
   * Depth is `maximumBatchCount` and nothing else can raise it.
   *
   * **The two exits say different things and the caller needs both.** An empty batch means the set
   * is clear and the sweep finished; a spent batch bound means it stopped with work still there,
   * which is a fact about the size of the backlog rather than a failure, and tomorrow's sweep
   * continues from the same condition because the stamps written here took these runs out of it.
   *
   * @param {SweepExpiredAiRunContentParams} params - Parameters.
   * @returns {Promise<AiRunPurgeSweepOutcome>} What the sweep did, and whether it finished.
   * @public
   */
  async sweepExpiredAiRunContent ({
    contentHorizon,
    purgedAt,
    remainingBatchCount,
    purgedAiRunCount,
    batchCount,
  }) {
    if (remainingBatchCount <= 0) {
      return this.buildSweepOutcome({
        purgedAiRunCount,
        batchCount,
        isSweepExhausted: false,
      })
    }

    const aiRunIds = await this.findExpiredAiRunIds({
      contentHorizon,
    })

    if (aiRunIds.length === 0) {
      return this.buildSweepOutcome({
        purgedAiRunCount,
        batchCount,
        isSweepExhausted: true,
      })
    }

    await this.saveAiRunContentPurge({
      aiRunIds,
      purgedAt,
    })

    return this.sweepExpiredAiRunContent({
      contentHorizon,
      purgedAt,
      remainingBatchCount: remainingBatchCount - 1,
      purgedAiRunCount: purgedAiRunCount + aiRunIds.length,
      batchCount: batchCount + 1,
    })
  }

  /**
   * Build what the sweep answers with.
   *
   * It is three numbers and a boolean on purpose: a worker's return value is stored in Redis, so
   * the ids this sweep touched are deliberately not among them.
   *
   * @param {AiRunPurgeSweepOutcome} params - Parameters.
   * @returns {AiRunPurgeSweepOutcome} The outcome.
   * @public
   */
  buildSweepOutcome ({
    purgedAiRunCount,
    batchCount,
    isSweepExhausted,
  }) {
    return {
      purgedAiRunCount,
      batchCount,
      isSweepExhausted,
    }
  }

  /**
   * Find the ids of one batch of runs whose content is past the horizon.
   *
   * **The condition leads with the stamp, and so does the index checkpoint 3 built for it**
   * (`content_purged_at`, `accepted_at`): a null stamp is the equality half and the horizon is the
   * range half, which is the order an index can serve. Ordering by `accepted_at` ascending is the
   * order that index already yields, so the batch costs no sort - and it means the oldest content
   * goes first, which is the one ordering a retention promise has a reason to prefer.
   *
   * **Only the id is read.** `request_body` and `result_body` are `MEDIUMTEXT`; selecting two
   * hundred rows whole would pull the very content this method exists to remove across the wire in
   * order to decide to remove it.
   *
   * @param {{
   *   contentHorizon: Date
   * }} params - Parameters.
   * @returns {Promise<Array<number>>} The ids, oldest first.
   * @public
   */
  async findExpiredAiRunIds ({
    contentHorizon,
  }) {
    const aiRuns = await /** @type {*} */ (
      this.Ctor.AiRunCtor.findAll({
        where: {
          contentPurgedAt: null,
          acceptedAt: {
            [this.Ctor.sequelizeOperators.lt]: contentHorizon,
          },
        },
        attributes: [
          'id',
        ],
        order: [
          ['acceptedAt', 'ASC'],
        ],
        limit: this.aiRunCountPerBatch,
      })
    )

    return aiRuns.map(it => it.id)
  }

  /**
   * Write one batch's purge across both tables, as one unit.
   *
   * **The stamp is written last inside the transaction**, so that no ordering of the two statements
   * can leave a run reading as purged while a provider's answer is still in `ai_model_calls`.
   * Both are inside one transaction, so a failure of either leaves the batch untouched and the
   * next sweep selects it again - which is the whole of this job's recovery story.
   *
   * @param {{
   *   aiRunIds: Array<number>
   *   purgedAt: Date
   * }} params - Parameters.
   * @returns {Promise<number>} How many runs the batch purged.
   * @public
   */
  async saveAiRunContentPurge ({
    aiRunIds,
    purgedAt,
  }) {
    return this.Ctor.AiRunCtor.beginTransaction(async transaction => {
      await this.saveEmptiedAiModelCallResponseBodies({
        aiRunIds,
        transaction,
      })

      await this.saveEmptiedAiRunContent({
        aiRunIds,
        purgedAt,
        transaction,
      })

      return aiRunIds.length
    })
  }

  /**
   * Empty the raw model output of every call the batch's runs made.
   *
   * The row itself stays: which model answered, which prompt version asked, how many tokens it
   * took and how long it waited are the decision trace, kept on the two-year clock. Only the
   * answer's text goes.
   *
   * @param {{
   *   aiRunIds: Array<number>
   *   transaction: *
   * }} params - Parameters.
   * @returns {Promise<*>} What the write moved.
   * @public
   */
  async saveEmptiedAiModelCallResponseBodies ({
    aiRunIds,
    transaction,
  }) {
    return this.Ctor.AiModelCallCtor.update(
      {
        responseBody: null,
      },
      {
        where: {
          AiRunId: {
            [this.Ctor.sequelizeOperators.in]: aiRunIds,
          },
        },
        transaction,
      }
    )
  }

  /**
   * Empty the run's own three content columns and stamp it purged.
   *
   * **This write meets `AiRun`'s own `beforeBulkUpdate` guard first.** It names four keys, every
   * one of them an attribute the model declares, and none of them the run status - so it is neither
   * of the two things that guard refuses, and it passes without the guard rewriting its `where`.
   * A key the model declares no attribute for would be refused here rather than silently written
   * into the `SET` clause, which is why `tests/_orders/AiRun/AiRun.js` pins this exact shape.
   *
   * @param {{
   *   aiRunIds: Array<number>
   *   purgedAt: Date
   *   transaction: *
   * }} params - Parameters.
   * @returns {Promise<*>} What the write moved.
   * @public
   */
  async saveEmptiedAiRunContent ({
    aiRunIds,
    purgedAt,
    transaction,
  }) {
    return this.Ctor.AiRunCtor.update(
      {
        requestBody: null,
        resultBody: null,
        subjectLabel: EMPTIED_SUBJECT_LABEL,
        contentPurgedAt: purgedAt,
      },
      {
        where: {
          id: {
            [this.Ctor.sequelizeOperators.in]: aiRunIds,
          },
        },
        transaction,
      }
    )
  }
}

/**
 * @typedef {{
 *   aiRunContentHorizonCalculator: AiRunContentHorizonCalculator
 *   aiRunInstantInspector: AiRunInstantInspector
 *   aiRunCountPerBatch: number
 *   maximumBatchCount: number
 * }} AiRunContentPurgerParams
 */

/**
 * @typedef {Partial<AiRunContentPurgerParams>} AiRunContentPurgerFactoryParams
 */

/**
 * @typedef {{
 *   contentHorizon: Date
 *   purgedAt: Date
 *   remainingBatchCount: number
 *   purgedAiRunCount: number
 *   batchCount: number
 * }} SweepExpiredAiRunContentParams
 */

/**
 * @typedef {{
 *   purgedAiRunCount: number
 *   batchCount: number
 *   isSweepExhausted: boolean
 * }} AiRunPurgeSweepOutcome
 */
