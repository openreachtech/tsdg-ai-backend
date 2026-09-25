import AI_RUN_FIELD_STATUS_CONSTANT_HASH from '../constants/aiRunFieldStatusConstants.js'

import AiRunFieldOutcome from '../../sequelize/models/AiRunFieldOutcome.js'

const {
  AI_RUN_FIELD_STATUS,
} = AI_RUN_FIELD_STATUS_CONSTANT_HASH

const DEFAULT_MISSING_AI_RUN_FIELD_STATUS_ID = AI_RUN_FIELD_STATUS.MISSING.ID

/**
 * Writes one `ai_run_field_outcomes` row for each field a run settled.
 *
 * **Why the record is a class of its own.** What a field came out as, what the majority reading
 * rested on, how many readings agreed out of how many and which version of the formula scored it
 * are the same facts whichever service ran and whichever step settled them, so they are written in
 * one place rather than once per service. Keeping it here leaves each step holding only its own
 * work, and leaves the record reachable from a job or a script that never ran a step at all.
 *
 * **Nothing this class writes is content.** Every column of this table is a decision, and none of
 * them holds a value read out of a medium: not the confidence, not the agreement counts, not the
 * version of the formula, and above all not the value the field was settled to. That is what lets
 * the table live on the seven-hundred-and-thirty-day clock beside the step trace while the result
 * body is purged at thirty. A column carrying a read value would survive the purge meant to remove
 * it, so this class is given no parameter that could carry one, and copies nothing out of one.
 *
 * **No field outcome exists outside a step.** `AiRunStepId` is `NOT NULL`, because a field's
 * agreement counts live on this row while the reason code for how it was settled lives on the
 * step, and the two are only one answer when they are joined. The step is therefore an ordinary
 * required parameter of the save with no default behind it: a caller that omits it has the row
 * refused by the column, which is the intended outcome. Nothing here invents a step to hang an
 * outcome off.
 *
 * **A field that settled nothing is recorded, not skipped.** `missing` is a state like any other,
 * and the row saying a field was considered and not answered is the one the second use case of
 * `#run-record` reads. Such a field rested on no majority reading and carries no score, so this
 * class answers null for both columns whatever was handed to it — a stale confidence left over
 * from a reading that lost cannot be recorded against a field nothing settled. The reading counts
 * are written as they were counted, including the counts of a field whose readings never reached a
 * majority: they are the figures that say why it came out missing.
 *
 * **The instant is handed in, and this class never reads a clock.** `settledAt` arrives on the
 * call, following `AiModelCallRecorder` and `RequestTimestampWindowInspector`: one settlement then
 * has exactly one instant, shared by everything that judges it, and a test states it rather than
 * mocking global time.
 *
 * **A value that could not be derived is never substituted.** The confidence is passed through
 * exactly as the scorer computed it and is neither rounded, re-scaled nor normalized here — which
 * environment renders a `DECIMAL(5, 4)` as a string and which as a number is not this class's
 * question to answer, and answering it here would put one reading of the value ahead of the
 * feature that first consumes it.
 */
export default class AiRunFieldOutcomeRecorder {
  /**
   * Constructor.
   *
   * @param {AiRunFieldOutcomeRecorderParams} params - Parameters.
   */
  constructor ({
    missingAiRunFieldStatusId,
  }) {
    this.missingAiRunFieldStatusId = missingAiRunFieldStatusId
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunFieldOutcomeRecorder ? X : never} T, X
   * @param {AiRunFieldOutcomeRecorderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    missingAiRunFieldStatusId = DEFAULT_MISSING_AI_RUN_FIELD_STATUS_ID,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        missingAiRunFieldStatusId,
      })
    )
  }

  /**
   * get: the field-outcome model.
   *
   * @returns {typeof AiRunFieldOutcome} Model.
   */
  static get AiRunFieldOutcomeCtor () {
    return AiRunFieldOutcome
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunFieldOutcomeRecorder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunFieldOutcomeRecorder} */ (this.constructor)
  }

  /**
   * Save the record of one field a run settled.
   *
   * @param {SaveAiRunFieldOutcomeParams} params - Parameters.
   * @returns {Promise<*>} The saved field outcome.
   * @public
   */
  async saveAiRunFieldOutcome ({
    aiRunId,
    aiRunStepId,
    fieldPath,
    aiRunFieldStatusId,
    aiRunEvidenceCategoryId,
    suggestionConfidence,
    agreedReadingCount,
    totalReadingCount,
    confidenceMethodVersion,
    settledAt,
  }) {
    const settledEvidenceCategoryId = this.generateSettledEvidenceCategoryId({
      aiRunFieldStatusId,
      aiRunEvidenceCategoryId,
    })

    const settledSuggestionConfidence = this.generateSettledSuggestionConfidence({
      aiRunFieldStatusId,
      suggestionConfidence,
    })

    return /** @type {*} */ (
      this.Ctor.AiRunFieldOutcomeCtor.create({
        AiRunId: aiRunId,
        AiRunStepId: aiRunStepId,
        fieldPath,
        AiRunFieldStatusId: aiRunFieldStatusId,
        AiRunEvidenceCategoryId: settledEvidenceCategoryId,
        suggestionConfidence: settledSuggestionConfidence,
        agreedReadingCount,
        totalReadingCount,
        confidenceMethodVersion,
        settledAt,
      })
    )
  }

  /**
   * Generate the evidence category recorded against the field.
   *
   * What the majority reading rested on only exists where there was a majority reading. A field
   * that settled nothing has none, so it records none, whatever category the caller was still
   * holding from a reading that did not win.
   *
   * @param {{
   *   aiRunFieldStatusId: number
   *   aiRunEvidenceCategoryId: number | null
   * }} params - Parameters.
   * @returns {number | null} Evidence category id, or null when nothing was settled.
   */
  generateSettledEvidenceCategoryId ({
    aiRunFieldStatusId,
    aiRunEvidenceCategoryId,
  }) {
    if (
      !this.settlesField({
        aiRunFieldStatusId,
      })
    ) {
      return null
    }

    return aiRunEvidenceCategoryId
  }

  /**
   * Generate the confidence recorded against the field.
   *
   * The score of a field that settled nothing is not a low score, it is no score, and the column
   * says so with null. A settled field records the score exactly as the scorer computed it.
   *
   * @param {{
   *   aiRunFieldStatusId: number
   *   suggestionConfidence: string | number | null
   * }} params - Parameters.
   * @returns {string | number | null} The score, or null when nothing was settled.
   */
  generateSettledSuggestionConfidence ({
    aiRunFieldStatusId,
    suggestionConfidence,
  }) {
    if (
      !this.settlesField({
        aiRunFieldStatusId,
      })
    ) {
      return null
    }

    return suggestionConfidence
  }

  /**
   * Whether the state a field came out as settled anything at all.
   *
   * Every state but `missing` settled a value; `missing` is the one that says the field was
   * considered and not answered.
   *
   * @param {{
   *   aiRunFieldStatusId: number
   * }} params - Parameters.
   * @returns {boolean} true when the state settled a value.
   */
  settlesField ({
    aiRunFieldStatusId,
  }) {
    return aiRunFieldStatusId !== this.missingAiRunFieldStatusId
  }
}

/**
 * @typedef {{
 *   missingAiRunFieldStatusId: number
 * }} AiRunFieldOutcomeRecorderParams
 */

/**
 * @typedef {Partial<AiRunFieldOutcomeRecorderParams>} AiRunFieldOutcomeRecorderFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiRunStepId: number
 *   fieldPath: string
 *   aiRunFieldStatusId: number
 *   aiRunEvidenceCategoryId: number | null
 *   suggestionConfidence: string | number | null
 *   agreedReadingCount: number
 *   totalReadingCount: number
 *   confidenceMethodVersion: string
 *   settledAt: Date
 * }} SaveAiRunFieldOutcomeParams
 */
