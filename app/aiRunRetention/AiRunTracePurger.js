import {
  Op,
} from 'sequelize'

import AiRunInstantInspector from '../aiRun/AiRunInstantInspector.js'
import AiRunTraceHorizonCalculator from './AiRunTraceHorizonCalculator.js'

import AI_RUN_PURGE_SWEEP_CONSTANT_HASH from '../constants/aiRunPurgeSweepConstants.js'

import AiModelCall from '../../sequelize/models/AiModelCall.js'
import AiRun from '../../sequelize/models/AiRun.js'
import AiRunFieldOutcome from '../../sequelize/models/AiRunFieldOutcome.js'
import AiRunStep from '../../sequelize/models/AiRunStep.js'

const {
  AI_RUN_PURGE_SWEEP,
} = AI_RUN_PURGE_SWEEP_CONSTANT_HASH

const UNRECORDABLE_INSTANT_MESSAGE = 'refused an instant that is not an instant'

/**
 * Removes the decision trace of a run past the longer of the two retention clocks, and stamps that
 * it did.
 *
 * **The trace is rows, not columns, which is why this class exists separately at all.** What
 * §10 calls the decision trace lives in three tables — `ai_run_field_outcomes`, `ai_run_steps` and
 * `ai_model_calls` — so purging it deletes rows rather than emptying fields. `AiRunContentPurger`
 * empties four columns and deletes nothing; this deletes and empties nothing. Neither reaches the
 * other's clock, and there is no class holding both, which is what §7's "two separate settings,
 * never one" means once it reaches code.
 *
 * **The stamp is the only thing left behind, and without it the criterion cannot be met.** A run
 * whose steps are gone looks exactly like a run canceled before it ever took one, so §19's fourth
 * criterion — a run past the content horizon but inside the trace horizon still answers why —
 * would have nothing to be read off. A run carrying `content_purged_at` alone is inside the trace
 * horizon and still answers; a run carrying both stamps is past both. Those two are the same row
 * without this write.
 *
 * **Field outcomes go before steps, and that order is stated rather than incidental.**
 * `ai_run_field_outcomes.AiRunStepId` points at the step that settled the field — §10 says that
 * link is what makes the second use case answerable — and this project holds referential integrity
 * in application code rather than in database constraints (no migration declares `references`). So
 * nothing would stop the reverse order; what it would leave, if the transaction were ever split,
 * is outcomes pointing at steps that are gone. Deleting the referrer first means every intermediate
 * state of the batch is one a reader could make sense of.
 *
 * **A run whose content purge never ran is not this class's to finish.** Deleting the model-call
 * rows takes `response_body` with them, but `request_body`, `result_body` and `subject_label` sit
 * on `ai_runs` and stay exactly as they were. That is correct rather than a gap: two clocks means
 * two jobs, and a content purge that has not run is a content purge that has not run. Emptying
 * those columns from here would be the one class that knows both horizons.
 *
 * The batching, the instant guard and the absence of a cursor are the same as
 * `AiRunContentPurger`'s and hold for the same reasons — the stamp this writes is the leading
 * column of the condition the next batch selects by.
 */
export default class AiRunTracePurger {
  /**
   * Constructor.
   *
   * @param {AiRunTracePurgerParams} params - Parameters.
   */
  constructor ({
    aiRunTraceHorizonCalculator,
    aiRunInstantInspector,
    aiRunCountPerBatch,
    maximumBatchCount,
  }) {
    this.aiRunTraceHorizonCalculator = aiRunTraceHorizonCalculator
    this.aiRunInstantInspector = aiRunInstantInspector
    this.aiRunCountPerBatch = aiRunCountPerBatch
    this.maximumBatchCount = maximumBatchCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunTracePurger ? X : never} T, X
   * @param {AiRunTracePurgerFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunTraceHorizonCalculator = this.createAiRunTraceHorizonCalculator(),
    aiRunInstantInspector = this.createAiRunInstantInspector(),
    aiRunCountPerBatch = AI_RUN_PURGE_SWEEP.AI_RUN_COUNT_PER_BATCH,
    maximumBatchCount = AI_RUN_PURGE_SWEEP.MAXIMUM_BATCH_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunTraceHorizonCalculator,
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
   * get: the field-outcome model, the first of the three trace tables to be cleared.
   *
   * @returns {typeof AiRunFieldOutcome} Model.
   */
  static get AiRunFieldOutcomeCtor () {
    return AiRunFieldOutcome
  }

  /**
   * get: the step model.
   *
   * @returns {typeof AiRunStep} Model.
   */
  static get AiRunStepCtor () {
    return AiRunStep
  }

  /**
   * get: the model-call model.
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
   * Create the calculator answering where the trace clock's horizon falls.
   *
   * @returns {AiRunTraceHorizonCalculator} Calculator.
   */
  static createAiRunTraceHorizonCalculator () {
    return AiRunTraceHorizonCalculator.create()
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
   * @returns {typeof AiRunTracePurger} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunTracePurger} */ (this.constructor)
  }

  /**
   * Remove the decision trace of every run past the trace horizon, in bounded batches.
   *
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<AiRunTracePurgeSweepOutcome>} What the sweep did, and whether it finished.
   * @throws {Error} When the instant handed in is not an instant.
   * @public
   */
  async purgeExpiredAiRunTraces ({
    now,
  }) {
    if (
      !this.aiRunInstantInspector.isRecordableInstant({
        instant: now,
      })
    ) {
      throw new Error(`${this.Ctor.name}#purgeExpiredAiRunTraces() ${UNRECORDABLE_INSTANT_MESSAGE}: field now`)
    }

    const traceHorizon = this.aiRunTraceHorizonCalculator.calculateTraceHorizon({
      now,
    })

    return this.sweepExpiredAiRunTraces({
      traceHorizon,
      purgedAt: now,
      remainingBatchCount: this.maximumBatchCount,
      purgedAiRunCount: 0,
      batchCount: 0,
    })
  }

  /**
   * Purge one batch, then the next, until the set empties or the sweep's batch bound is reached.
   *
   * Recursion rather than a loop, and two exits saying different things — the same shape
   * `AiRunContentPurger` uses, for the reasons written there. Depth is `maximumBatchCount`.
   *
   * @param {SweepExpiredAiRunTracesParams} params - Parameters.
   * @returns {Promise<AiRunTracePurgeSweepOutcome>} What the sweep did, and whether it finished.
   * @public
   */
  async sweepExpiredAiRunTraces ({
    traceHorizon,
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
      traceHorizon,
    })

    if (aiRunIds.length === 0) {
      return this.buildSweepOutcome({
        purgedAiRunCount,
        batchCount,
        isSweepExhausted: true,
      })
    }

    await this.saveAiRunTracePurge({
      aiRunIds,
      purgedAt,
    })

    return this.sweepExpiredAiRunTraces({
      traceHorizon,
      purgedAt,
      remainingBatchCount: remainingBatchCount - 1,
      purgedAiRunCount: purgedAiRunCount + aiRunIds.length,
      batchCount: batchCount + 1,
    })
  }

  /**
   * Build what the sweep answers with.
   *
   * @param {AiRunTracePurgeSweepOutcome} params - Parameters.
   * @returns {AiRunTracePurgeSweepOutcome} The outcome.
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
   * Find the ids of one batch of runs whose trace is past the horizon.
   *
   * The condition leads with `trace_purged_at`, which is the leading column of the index
   * checkpoint 3 built for it (`trace_purged_at`, `accepted_at`), and the order is the one that
   * index already yields — so the batch costs no sort and the oldest trace goes first.
   *
   * @param {{
   *   traceHorizon: Date
   * }} params - Parameters.
   * @returns {Promise<Array<number>>} The ids, oldest first.
   * @public
   */
  async findExpiredAiRunIds ({
    traceHorizon,
  }) {
    const aiRuns = await /** @type {*} */ (
      this.Ctor.AiRunCtor.findAll({
        where: {
          tracePurgedAt: null,
          acceptedAt: {
            [this.Ctor.sequelizeOperators.lt]: traceHorizon,
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
   * Delete one batch's trace across the three tables and stamp the runs, as one unit.
   *
   * The stamp goes last, so no ordering of the four statements can leave a run reading as
   * trace-purged while rows of its trace are still there. A failure of any of them leaves the batch
   * untouched, and the next sweep selects it again.
   *
   * @param {{
   *   aiRunIds: Array<number>
   *   purgedAt: Date
   * }} params - Parameters.
   * @returns {Promise<number>} How many runs the batch purged.
   * @public
   */
  async saveAiRunTracePurge ({
    aiRunIds,
    purgedAt,
  }) {
    return this.Ctor.AiRunCtor.beginTransaction(async transaction => {
      await this.deleteAiRunFieldOutcomes({
        aiRunIds,
        transaction,
      })

      await this.deleteAiRunSteps({
        aiRunIds,
        transaction,
      })

      await this.deleteAiModelCalls({
        aiRunIds,
        transaction,
      })

      await this.saveAiRunTracePurgeStamp({
        aiRunIds,
        purgedAt,
        transaction,
      })

      return aiRunIds.length
    })
  }

  /**
   * Delete the field outcomes of the batch's runs.
   *
   * First of the three, because these rows point at the steps deleted next.
   *
   * @param {{
   *   aiRunIds: Array<number>
   *   transaction: *
   * }} params - Parameters.
   * @returns {Promise<number>} How many rows went.
   * @public
   */
  async deleteAiRunFieldOutcomes ({
    aiRunIds,
    transaction,
  }) {
    return this.Ctor.AiRunFieldOutcomeCtor.destroy({
      where: {
        AiRunId: {
          [this.Ctor.sequelizeOperators.in]: aiRunIds,
        },
      },
      transaction,
    })
  }

  /**
   * Delete the steps of the batch's runs.
   *
   * @param {{
   *   aiRunIds: Array<number>
   *   transaction: *
   * }} params - Parameters.
   * @returns {Promise<number>} How many rows went.
   * @public
   */
  async deleteAiRunSteps ({
    aiRunIds,
    transaction,
  }) {
    return this.Ctor.AiRunStepCtor.destroy({
      where: {
        AiRunId: {
          [this.Ctor.sequelizeOperators.in]: aiRunIds,
        },
      },
      transaction,
    })
  }

  /**
   * Delete the model calls of the batch's runs.
   *
   * The whole row goes, `response_body` included — so a trace purge reaching a run whose content
   * purge somehow never ran still takes the raw model output with it, rather than leaving it behind
   * in a table nothing reads any more.
   *
   * @param {{
   *   aiRunIds: Array<number>
   *   transaction: *
   * }} params - Parameters.
   * @returns {Promise<number>} How many rows went.
   * @public
   */
  async deleteAiModelCalls ({
    aiRunIds,
    transaction,
  }) {
    return this.Ctor.AiModelCallCtor.destroy({
      where: {
        AiRunId: {
          [this.Ctor.sequelizeOperators.in]: aiRunIds,
        },
      },
      transaction,
    })
  }

  /**
   * Stamp the batch's runs as having had their trace removed.
   *
   * One key, an attribute the model declares, and not the run status — so `AiRun`'s
   * `beforeBulkUpdate` guard neither refuses it nor rewrites its `where`. `content_purged_at` is
   * deliberately not among the values: the two stamps are two events at two instants, and a trace
   * purge writing both would claim a content purge that never happened.
   *
   * @param {{
   *   aiRunIds: Array<number>
   *   purgedAt: Date
   *   transaction: *
   * }} params - Parameters.
   * @returns {Promise<*>} What the write moved.
   * @public
   */
  async saveAiRunTracePurgeStamp ({
    aiRunIds,
    purgedAt,
    transaction,
  }) {
    return this.Ctor.AiRunCtor.update(
      {
        tracePurgedAt: purgedAt,
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
 *   aiRunTraceHorizonCalculator: AiRunTraceHorizonCalculator
 *   aiRunInstantInspector: AiRunInstantInspector
 *   aiRunCountPerBatch: number
 *   maximumBatchCount: number
 * }} AiRunTracePurgerParams
 */

/**
 * @typedef {Partial<AiRunTracePurgerParams>} AiRunTracePurgerFactoryParams
 */

/**
 * @typedef {{
 *   traceHorizon: Date
 *   purgedAt: Date
 *   remainingBatchCount: number
 *   purgedAiRunCount: number
 *   batchCount: number
 * }} SweepExpiredAiRunTracesParams
 */

/**
 * @typedef {{
 *   purgedAiRunCount: number
 *   batchCount: number
 *   isSweepExhausted: boolean
 * }} AiRunTracePurgeSweepOutcome
 */
