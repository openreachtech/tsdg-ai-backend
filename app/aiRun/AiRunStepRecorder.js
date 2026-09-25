import AI_RUN_STEP_CATEGORY_CONSTANT_HASH from '../constants/aiRunStepCategoryConstants.js'

import AiRunStep from '../../sequelize/models/AiRunStep.js'
import AiRunStepCategory from '../../sequelize/models/AiRunStepCategory.js'

const {
  AI_RUN_STEP_CATEGORY,
} = AI_RUN_STEP_CATEGORY_CONSTANT_HASH

/*
 * A dotted path into the schema, and nothing that is not one.
 *
 * A segment is an identifier of ASCII letters, digits and underscores. The first segment may not
 * open with a digit, so a bare number is no path; a later segment may, so an index into a repeated
 * field is. The leading bound holds the whole path to 191 characters — which nothing here enforces
 * of its own accord, `rejections` being JSON and JSON having no width, and which is borrowed from
 * the column that does for the reason below.
 *
 * What it rejects: whitespace of any kind, so a sentence can never be a path; a newline; every
 * punctuation mark but the separating dot, the underscore and the hyphen — the colon, the comma and
 * the slash among them; the empty path; a leading, trailing or doubled dot; and anything at all past
 * 191 characters.
 *
 * **This repeats the shape `AiRunFieldOutcomeRecorder` states for `field_path`, rather than reaching
 * for it, and the repetition is deliberate.** The two are the same word and the same risk, so they
 * have to say the same thing — that is the whole reason this one exists. They are not the same rule:
 * a path refused there is a `NOT NULL` column turning away a whole decision row, and a path refused
 * here drops one entry off a step that still records. One constant over two consequences would read
 * as one decision nobody made, and whichever of the two moved first would move the other with it —
 * which is why `AI_RUN_FIELD_STATUS_ID_PATTERN` and `AI_RUN_ID_PATTERN` are stated twice over there
 * for the same reason, word for word identical. What the repetition costs is that the two can drift
 * apart and neither file would say so, and that cost is real: a shared home for this one shape is
 * worth having, and is a third file neither recorder owns.
 */
const REJECTION_FIELD_PATH_PATTERN = /^(?=.{1,191}$)[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*$/u

/*
 * A reason code: a lookup key, not a sentence.
 *
 * `#run-record`'s glossary makes a reason code "a code plus JSON parameters returned in place of a
 * human sentence", which the client system turns into the wording people read. So nothing here is
 * ever read as it stands by the person it is about, and a code carrying prose is a code nobody
 * asked for and nobody would display. ASCII letters and digits, the dot, the underscore and the
 * hyphen, opening on a letter so that a bare number is no code, bounded to 64 characters — the
 * width of `ai_run_steps.reason_code`, which is this same kind of value on this same row, one key
 * holding the step's own reason where this one holds a dropped field's.
 *
 * What it rejects: whitespace, so a sentence can never be a code; a newline; the colon, the comma,
 * the slash, the quote and every other punctuation mark; the empty code; and anything at all past 64
 * characters. All three casings this service already writes pass — `below_agreement_threshold`,
 * `value-over-max-length` and `MEDIA_UNREADABLE` — because which of them a caller reaches for is a
 * naming style, and a naming style is not what this stands in the way of.
 */
const REJECTION_REASON_CODE_PATTERN = /^(?=.{1,64}$)[A-Za-z][A-Za-z0-9._-]*$/u

/*
 * The name of a figure: what was counted, not what was read.
 *
 * A figure's value was held to being a finite number from the first pass, and a number is the one
 * thing that cannot carry a name, an address or a diagnosis. Its name was held to nothing at all,
 * and a name is where a security audit put a person's medical status, with a bare `1` beside it as
 * the count. So the name is now a name: ASCII letters and digits, the underscore and the hyphen,
 * opening on a letter or an underscore, bounded to 64 characters — the width every short name on
 * this row is held to, `step_name` and `outcome_code` and `reason_code` alike.
 *
 * The dot is excluded here, where the field path above allows it. `figures` is one level deep by
 * construction, so a dotted name would be a path flattened into a key: a shape this column does not
 * hold, and one more way for something structured to arrive wearing a label's clothes.
 *
 * What it rejects: whitespace, so a sentence can never be a figure name; a newline; the colon, the
 * comma, the slash and every other punctuation mark; the empty name; and anything at all past 64
 * characters.
 */
const REJECTION_FIGURE_NAME_PATTERN = /^(?=.{1,64}$)[A-Za-z_][A-Za-z0-9_-]*$/u

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
 * **`rejections` never holds a value read out of a medium, and the shape is built here rather than
 * asked for.** It holds the field path, the reason code and figures such as a length or an
 * agreement count, and nothing else. This row is part of the decision trace, so it is kept on the
 * long clock and is never purged with content — a value copied into it would outlive the content
 * purge meant to remove it by two years, and no later reader could tell that it had. A caller that
 * hands this class anything else is not refused: the row is written from the closed shape below,
 * built key by key out of what arrived, and whatever fell outside it never reaches the column.
 * Between a worker and a store of personal data kept for two years, a paragraph asking the worker
 * not to was the only thing standing here before.
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
   * What the caller says the step dropped is not what is stored. It is shaped first, down to the
   * three keys this column is for, so that nothing a worker attached alongside them can reach a row
   * that outlives the content purge by two years. See `#buildRecordableRejections()`.
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

    const recordableRejections = this.buildRecordableRejections({
      rejections,
    })

    return /** @type {*} */ (
      this.Ctor.AiRunStepCtor.create({
        AiRunId: aiRunId,
        AiRunStepCategoryId: aiRunStepCategoryId,
        stepIndex,
        stepName,
        outcomeCode,
        rejections: recordableRejections,
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
   * Build the rejections this row may carry, out of whatever the caller handed over.
   *
   * The shape is closed: a rejection is a field path, a reason code and figures, and a figure is a
   * number. That is the whole of what `#run-record` gives this column, and it is built here rather
   * than trusted, because the column is read two years after the content it describes has been
   * purged — so a value that reached it would outlive the purge meant to remove it, silently.
   *
   * What falls outside the shape is dropped rather than refused. A step that ran is a fact of the
   * run, and losing its whole trace because a worker attached a debug field beside the reason code
   * would cost the record more than the field was worth. The step is recorded, minus the field.
   *
   * Anything that is not an array of rejections carries no rejection to keep — a bare string is the
   * case that was actually reached — so it answers null, which is what this nullable column already
   * says when a step dropped nothing. An array that keeps no entry answers null for the same
   * reason, rather than leaving two ways of writing "nothing" in one column.
   *
   * @param {{
   *   rejections: *
   * }} params - Parameters.
   * @returns {Array<AiRunStepRejection> | null} The rejections to store, or null when none is left.
   */
  buildRecordableRejections ({
    rejections,
  }) {
    if (!Array.isArray(rejections)) {
      return null
    }

    const recordableRejections = rejections
      .map(it =>
        this.buildRecordableRejection({
          rejection: it,
        })
      )
      .filter(it => it !== null)

    if (recordableRejections.length === 0) {
      return null
    }

    return recordableRejections
  }

  /**
   * Build one rejection this row may carry, out of one entry the caller handed over.
   *
   * The three keys are read off the entry one at a time and written into an object of this method's
   * own, so a fourth key that came with it — the value that was actually seen, or anything else —
   * has nowhere to travel. The entry is read one level deep and never followed further, so how
   * deeply the caller nested what it sent changes nothing about what is built, and nothing here
   * walks a structure whose depth the caller chose.
   *
   * An entry naming no field, or giving no reason, is dropped whole rather than kept as a husk. A
   * rejection is the pairing of the two, and neither half alone records a decision anybody can read
   * two years from now.
   *
   * @param {{
   *   rejection: *
   * }} params - Parameters.
   * @returns {AiRunStepRejection | null} The rejection to store, or null when the entry is not one.
   */
  buildRecordableRejection ({
    rejection,
  }) {
    if (typeof rejection?.fieldPath !== 'string') {
      return null
    }

    if (!REJECTION_FIELD_PATH_PATTERN.test(rejection.fieldPath)) {
      return null
    }

    if (typeof rejection.reasonCode !== 'string') {
      return null
    }

    if (!REJECTION_REASON_CODE_PATTERN.test(rejection.reasonCode)) {
      return null
    }

    const figures = this.buildRecordableFigures({
      figures: rejection.figures,
    })

    return {
      fieldPath: rejection.fieldPath,
      reasonCode: rejection.reasonCode,
      figures,
    }
  }

  /**
   * Build the figures a rejection may carry, out of whatever the caller attached to it.
   *
   * A figure is a number — a length, a count — and a number is the one thing that cannot carry a
   * name, an address or a sentence read out of a medium. So a figure that is not a finite number is
   * dropped while the rejection around it is kept: the field path and the reason code are the
   * decision this trace exists to hold, and losing them to remove one stray figure would take away
   * more than it protects.
   *
   * **The name is held to a shape as well, and that half was missing.** A security audit put a
   * person's medical status in a figure's *name*, with a bare `1` beside it as the value — so the
   * sentence above was true of the value and false of the key, and the key is the wider channel of
   * the two. A name that is not an identifier is dropped the same way a value that is not a number
   * is.
   *
   * `Infinity` and `NaN` are dropped with the rest, because neither survives JSON as itself — each
   * would land in the column as a null nobody derived, which is the substitution this class refuses
   * everywhere else.
   *
   * @param {{
   *   figures: *
   * }} params - Parameters.
   * @returns {Record<string, number> | null} The figures to store, or null when none is left.
   */
  buildRecordableFigures ({
    figures,
  }) {
    if (figures === null) {
      return null
    }

    if (typeof figures !== 'object') {
      return null
    }

    if (Array.isArray(figures)) {
      return null
    }

    const recordableFigureNames = Object.keys(figures)
      .filter(it => REJECTION_FIGURE_NAME_PATTERN.test(it))
      .filter(it => Number.isFinite(figures[it]))

    if (recordableFigureNames.length === 0) {
      return null
    }

    const recordableFigureEntries = recordableFigureNames
      .map(it => [
        it,
        figures[it],
      ])

    return Object.fromEntries(recordableFigureEntries)
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
