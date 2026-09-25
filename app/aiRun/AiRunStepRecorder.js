import AI_RUN_STEP_CATEGORY_CONSTANT_HASH from '../constants/aiRunStepCategoryConstants.js'

import AiRunStep from '../../sequelize/models/AiRunStep.js'
import AiRunStepCategory from '../../sequelize/models/AiRunStepCategory.js'

const {
  AI_RUN_STEP_CATEGORY,
} = AI_RUN_STEP_CATEGORY_CONSTANT_HASH

/**
 * Writes one `ai_run_steps` row for each step a run executes, and reads a run's steps back in the
 * order they ran.
 *
 * **Why the record is a class of its own.** What a step was, where it came in the run and how it
 * ended are the same facts whichever service ran it and whichever kind of actor carried it out, so
 * they are written in one place rather than once per worker. Keeping it here leaves each worker
 * holding only the work the step does, and leaves the trace reachable from a job or a script that
 * never ran a step at all.
 *
 * **The row is written once, when the step closes.** A step is opened when it starts and closed
 * when it ends, but `outcome_code` is `NOT NULL` and how a step ended is not known while it is
 * still running — so a row written at the opening could only carry an outcome nobody had derived
 * yet, which is the one thing this class refuses to do. One call therefore records the whole step,
 * and `finished_at` is left null for a step that was cut short rather than for a step in flight.
 *
 * **This class never reads a clock.** Both instants arrive on the call — the moment the step
 * started and the moment it finished — which follows `AiModelCallRecorder`: one step then has
 * exactly one pair of instants, shared by everything that judges it, and a test states both ends
 * rather than mocking global time or waiting for a real clock to move.
 *
 * **A value that could not be derived is never substituted.** The step category is derived here,
 * from the name the caller gives the kind of actor that carried the step out, and a name that names
 * no category answers null. The column is `NOT NULL`, so a null refuses the row instead of
 * recording a guess against it — a step filed under the wrong category would misreport, forever,
 * whether the run thought for itself or called a model.
 *
 * **`rejections` never holds a value read out of a medium.** It holds the field path, the reason
 * code and figures such as a length or an agreement count, and nothing else. This row is part of
 * the decision trace, so it is kept on the long clock and is never purged with content — a value
 * copied into it would outlive the content purge meant to remove it by two years. Nothing here
 * reads a medium, and nothing here may be handed one.
 */
export default class AiRunStepRecorder {
  /**
   * Constructor.
   *
   * @param {AiRunStepRecorderParams} params - Parameters.
   */
  constructor ({
    aiRunStepCategoryIdHash,
  }) {
    this.aiRunStepCategoryIdHash = aiRunStepCategoryIdHash
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunStepRecorder ? X : never} T, X
   * @param {AiRunStepRecorderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunStepCategoryIdHash = this.buildAiRunStepCategoryIdHash(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunStepCategoryIdHash,
      })
    )
  }

  /**
   * get: the run step model.
   *
   * @returns {typeof AiRunStep} Model.
   */
  static get AiRunStepCtor () {
    return AiRunStep
  }

  /**
   * get: the run step category master model.
   *
   * @returns {typeof AiRunStepCategory} Model.
   */
  static get AiRunStepCategoryCtor () {
    return AiRunStepCategory
  }

  /**
   * Build the lookup answering a step category's id from the name of that category.
   *
   * The name is what a caller can state without reaching for the master table, and the id is what
   * the column holds. Keeping the pairing here, rather than at each call site, leaves one place to
   * read when a category is added.
   *
   * @returns {Record<string, number>} Category id by category name.
   */
  static buildAiRunStepCategoryIdHash () {
    return {
      [AI_RUN_STEP_CATEGORY.CODE.NAME]: AI_RUN_STEP_CATEGORY.CODE.ID,
      [AI_RUN_STEP_CATEGORY.AI.NAME]: AI_RUN_STEP_CATEGORY.AI.ID,
      [AI_RUN_STEP_CATEGORY.HUMAN.NAME]: AI_RUN_STEP_CATEGORY.HUMAN.ID,
    }
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunStepRecorder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunStepRecorder} */ (this.constructor)
  }

  /**
   * Save the record of one step a run executed.
   *
   * @param {SaveAiRunStepParams} params - Parameters.
   * @returns {Promise<*>} The saved run step.
   * @public
   */
  async saveAiRunStep ({
    aiRunId,
    stepIndex,
    stepName,
    stepCategoryName,
    outcomeCode,
    rejections,
    reasonCode,
    startedAt,
    finishedAt,
  }) {
    const aiRunStepCategoryId = this.generateAiRunStepCategoryId({
      stepCategoryName,
    })

    return /** @type {*} */ (
      this.Ctor.AiRunStepCtor.create({
        AiRunId: aiRunId,
        AiRunStepCategoryId: aiRunStepCategoryId,
        stepIndex,
        stepName,
        outcomeCode,
        rejections,
        reasonCode,
        startedAt,
        finishedAt,
      })
    )
  }

  /**
   * Generate the id of the category a step belongs to, from the name of that category.
   *
   * Nothing here guesses. A name the lookup does not carry as its own key answers null rather than
   * a nearby id or whatever the prototype chain happens to hold under that name, and the `NOT NULL`
   * column then refuses the row.
   *
   * @param {{
   *   stepCategoryName: *
   * }} params - Parameters.
   * @returns {number | null} The category id, or null when the name names no category.
   */
  generateAiRunStepCategoryId ({
    stepCategoryName,
  }) {
    if (!Object.hasOwn(this.aiRunStepCategoryIdHash, stepCategoryName)) {
      return null
    }

    return this.aiRunStepCategoryIdHash[stepCategoryName]
  }

  /**
   * Find every step a run executed, in the order it ran them.
   *
   * The order is the one the steps claim for themselves in `step_index`, not the order they were
   * written in, so a step recorded late still reads back in its own place. The category comes with
   * each row, so a reader learns what carried the step out without asking the master a second time.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The run's steps, earliest first.
   * @public
   */
  async findAiRunSteps ({
    aiRunId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunStepCtor.findAll({
        where: {
          AiRunId: aiRunId,
        },
        include: [
          this.Ctor.AiRunStepCategoryCtor,
        ],
        order: [
          [
            'stepIndex',
            'ASC',
          ],
        ],
      })
    )
  }
}

/**
 * @typedef {{
 *   aiRunStepCategoryIdHash: Record<string, number>
 * }} AiRunStepRecorderParams
 */

/**
 * @typedef {Partial<AiRunStepRecorderParams>} AiRunStepRecorderFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   stepIndex: number
 *   stepName: string
 *   stepCategoryName: string
 *   outcomeCode: string
 *   rejections: Array<AiRunStepRejection> | null
 *   reasonCode: string | null
 *   startedAt: Date
 *   finishedAt: Date | null
 * }} SaveAiRunStepParams
 */

/**
 * What a step dropped, and why. Never the value itself.
 *
 * @typedef {{
 *   fieldPath: string
 *   reasonCode: string
 *   figures: Record<string, number> | null
 * }} AiRunStepRejection
 */
