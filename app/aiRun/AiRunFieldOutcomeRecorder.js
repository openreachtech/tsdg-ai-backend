import AI_RUN_FIELD_STATUS_CONSTANT_HASH from '../constants/aiRunFieldStatusConstants.js'

import AiRunFieldOutcome from '../../sequelize/models/AiRunFieldOutcome.js'

const {
  AI_RUN_FIELD_STATUS,
} = AI_RUN_FIELD_STATUS_CONSTANT_HASH

const DEFAULT_MISSING_AI_RUN_FIELD_STATUS_ID = AI_RUN_FIELD_STATUS.MISSING.ID

/*
 * A dotted path into the schema, and nothing that is not one.
 *
 * A segment is an identifier of ASCII letters, digits and underscores. The first segment may not
 * open with a digit, so a bare number is no path; a later segment may, so an index into a repeated
 * field is. The leading bound holds the whole path to the width of `field_path`, which MySQL would
 * enforce and SQLite would not.
 *
 * What it rejects: whitespace of any kind, so a sentence can never be a path; a newline; every
 * punctuation mark but the separating dot, the underscore and the hyphen — the colon, the comma and
 * the slash among them; the empty path; a leading, trailing or doubled dot; and anything at all past
 * 191 characters.
 *
 * **The hyphen is allowed on purpose, and it was excluded once.** What keeps a sentence out of this
 * column is the ban on whitespace and the width bound, not the size of the alphabet: a hyphen
 * smuggles no more than the underscore beside it already does. What excluding it cost was a whole
 * row — a path is refused by answering null, and the `NOT NULL` column then refuses the record of a
 * decision. The caller is a worker writing down a key a model produced; it cannot rename that key,
 * so its only answers would have been to drop the field or to fail the run, over a naming style.
 * `field-path-outside-schema` is in this feature's own step trace precisely because a model may
 * invent a key.
 */
const FIELD_PATH_PATTERN = /^(?=.{1,191}$)[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*$/u

/*
 * A version label, of the shape `confidence-v1.0.0` this feature already writes.
 *
 * ASCII letters and digits, the dot, the underscore and the hyphen, opening on a letter or a digit,
 * bounded to the width of `confidence_method_version`.
 *
 * What it rejects: whitespace, so a sentence can never be a version; a newline; the colon, the
 * comma, the slash, the quote and every other punctuation mark; the empty label; and anything at
 * all past 32 characters.
 */
const CONFIDENCE_METHOD_VERSION_PATTERN = /^(?=.{1,32}$)[A-Za-z0-9][A-Za-z0-9._-]*$/u

/*
 * A score, as `DECIMAL(5, 4)` spells one: zero, one, or a decimal between them.
 *
 * The test runs against the score's own text, so one rule covers both renderings a DECIMAL comes
 * back as — the number SQLite hands over and the string MariaDB does — without converting either
 * into the other. Digits after the point are not counted, because how far the column rounds a score
 * is the column's business and not this class's.
 *
 * What it rejects: text that is no number at all; a sign; a value above one or below zero; exponent
 * notation; leading or trailing whitespace; and the empty string.
 */
const SUGGESTION_CONFIDENCE_PATTERN = /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/u

/*
 * A row id of `ai_run_field_statuses` written as text: digits alone, opening on a non-zero digit.
 *
 * What it rejects: a sign, a decimal point, whitespace and every other character, so `'4 '` and
 * `'4abc'` name no state rather than naming state four.
 */
const AI_RUN_FIELD_STATUS_ID_PATTERN = /^[1-9]\d*$/u

/**
 * Writes one `ai_run_field_outcomes` row for each field a run settled.
 *
 * **Why the record is a class of its own.** What a field came out as, what the majority reading
 * rested on, how many readings agreed out of how many and which version of the formula scored it
 * are the same facts whichever service ran and whichever step settled them, so they are written in
 * one place rather than once per service. Keeping it here leaves each step holding only its own
 * work, and leaves the record reachable from a job or a script that never ran a step at all.
 *
 * **The columns are decisions. The parameters are checked before they become one.** Every column of
 * this table is a decision, and none of them holds a value read out of a medium: not the
 * confidence, not the agreement counts, not the version of the formula, and above all not the value
 * the field was settled to. That is what lets the table live on the seven-hundred-and-thirty-day
 * clock beside the step trace while the result body is purged at thirty. What a clean column set
 * cannot settle is what a caller puts in it, and three parameters here would take a read value
 * whole: `field_path` and `confidence_method_version` are free text, and `suggestion_confidence` is
 * refused by a strict-mode MySQL but taken by the SQLite a developer runs. `field_path` is the
 * widest of the three and the likeliest, because a path can be produced by a model rather than
 * bounded by a schema — the step trace carries `field-path-outside-schema` for exactly that — and a
 * key name invented out of what was read is content that nobody calls a value. So each of the three
 * is checked against a stated shape before it is written, and what does not fit is not written:
 * `#generateSettledFieldPath()`, `#generateSettledConfidenceMethodVersion()` and
 * `#isRecordableScore()` apply the shapes, and the constant above each one says what it rejects.
 *
 * **A path that is not a path is refused, not repaired.** Stripping a malformed path down to the
 * characters a path may hold would leave a row naming a field nobody settled, kept for two years
 * and read as though it were the real one — and stripping is a guess, which is the one thing this
 * class does not make. Both text columns are `NOT NULL`, so answering null refuses the whole row,
 * the way an omitted step does and the way `AiRunStepRecorder` refuses a step whose category it
 * could not derive. The score is the one exception: `suggestion_confidence` is nullable and already
 * means "no score", so a value that is not a score records as no score rather than costing the
 * trace an otherwise sound row.
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
 * **Which state a field came out as is read as a number, whatever form it arrived in.** `'4'` and
 * `4` name one state, and a status id that reached here through a query string or a JSON body is
 * ordinarily the former. Compared as they arrive, the two differ, `missing` stops matching itself,
 * and the row that says the field settled nothing carries a confidence and an evidence category
 * anyway — the self-contradiction the paragraph above promises cannot happen, recorded against the
 * very question the second use case asks. So both sides of the comparison go through
 * `#generateComparableAiRunFieldStatusId()`, and a value naming no state at all settles nothing
 * rather than settling everything.
 *
 * **The instant is handed in, and this class never reads a clock.** `settledAt` arrives on the
 * call, following `AiModelCallRecorder` and `RequestTimestampWindowInspector`: one settlement then
 * has exactly one instant, shared by everything that judges it, and a test states it rather than
 * mocking global time.
 *
 * **A value that could not be derived is never substituted.** A confidence that is a score is
 * passed through exactly as the scorer computed it and is neither rounded, re-scaled nor normalized
 * here — which environment renders a `DECIMAL(5, 4)` as a string and which as a number is not this
 * class's question to answer, and answering it here would put one reading of the value ahead of the
 * feature that first consumes it. That is why the shape test is run against the score's text: it
 * judges the value without converting it.
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
    const settledFieldPath = this.generateSettledFieldPath({
      fieldPath,
    })

    const settledEvidenceCategoryId = this.generateSettledEvidenceCategoryId({
      aiRunFieldStatusId,
      aiRunEvidenceCategoryId,
    })

    const settledSuggestionConfidence = this.generateSettledSuggestionConfidence({
      aiRunFieldStatusId,
      suggestionConfidence,
    })

    const settledConfidenceMethodVersion = this.generateSettledConfidenceMethodVersion({
      confidenceMethodVersion,
    })

    return /** @type {*} */ (
      this.Ctor.AiRunFieldOutcomeCtor.create({
        AiRunId: aiRunId,
        AiRunStepId: aiRunStepId,
        fieldPath: settledFieldPath,
        AiRunFieldStatusId: aiRunFieldStatusId,
        AiRunEvidenceCategoryId: settledEvidenceCategoryId,
        suggestionConfidence: settledSuggestionConfidence,
        agreedReadingCount,
        totalReadingCount,
        confidenceMethodVersion: settledConfidenceMethodVersion,
        settledAt,
      })
    )
  }

  /**
   * Generate the field path recorded against the outcome.
   *
   * Which field was settled is a dotted path into the schema, and `FIELD_PATH_PATTERN` above says
   * what that is and what it is not. A path that does not fit answers null, and `field_path` being
   * `NOT NULL` refuses the row rather than keeping whatever arrived on the two-year clock.
   *
   * @param {{
   *   fieldPath: *
   * }} params - Parameters.
   * @returns {string | null} The path, or null when what arrived is not one.
   */
  generateSettledFieldPath ({
    fieldPath,
  }) {
    if (typeof fieldPath !== 'string') {
      return null
    }

    if (!FIELD_PATH_PATTERN.test(fieldPath)) {
      return null
    }

    return fieldPath
  }

  /**
   * Generate the evidence category recorded against the field.
   *
   * What the majority reading rested on only exists where there was a majority reading. A field
   * that settled nothing has none, so it records none, whatever category the caller was still
   * holding from a reading that did not win.
   *
   * @param {{
   *   aiRunFieldStatusId: *
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
   * says so with null. A settled field records the score exactly as the scorer computed it, in
   * whichever of the two renderings a `DECIMAL(5, 4)` reached here as — but only where what arrived
   * is a score at all. A value outside the closed range, or text that is no number, is likewise no
   * score: the column is nullable and already carries that meaning, so the rest of the row stands.
   *
   * @param {{
   *   aiRunFieldStatusId: *
   *   suggestionConfidence: *
   * }} params - Parameters.
   * @returns {string | number | null} The score, or null when no score is recordable.
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

    if (
      !this.isRecordableScore({
        suggestionConfidence,
      })
    ) {
      return null
    }

    return suggestionConfidence
  }

  /**
   * Whether a value is a score this column may hold.
   *
   * The value is judged as text, so that the number SQLite hands a DECIMAL back as and the string
   * MariaDB does are judged by one rule and neither is converted into the other. Only a number and
   * a string are read at all: anything else renders to text that could pass for a score it never
   * was.
   *
   * @param {{
   *   suggestionConfidence: *
   * }} params - Parameters.
   * @returns {boolean} true when the value is a number in the closed range from zero to one.
   */
  isRecordableScore ({
    suggestionConfidence,
  }) {
    if (
      typeof suggestionConfidence !== 'number'
      && typeof suggestionConfidence !== 'string'
    ) {
      return false
    }

    return SUGGESTION_CONFIDENCE_PATTERN.test(String(suggestionConfidence))
  }

  /**
   * Generate the version of the formula recorded against the field.
   *
   * Which version scored the field is a label, and `CONFIDENCE_METHOD_VERSION_PATTERN` above says
   * what that is and what it is not. A label that does not fit answers null, and
   * `confidence_method_version` being `NOT NULL` refuses the row.
   *
   * @param {{
   *   confidenceMethodVersion: *
   * }} params - Parameters.
   * @returns {string | null} The version, or null when what arrived is not one.
   */
  generateSettledConfidenceMethodVersion ({
    confidenceMethodVersion,
  }) {
    if (typeof confidenceMethodVersion !== 'string') {
      return null
    }

    if (!CONFIDENCE_METHOD_VERSION_PATTERN.test(confidenceMethodVersion)) {
      return null
    }

    return confidenceMethodVersion
  }

  /**
   * Whether the state a field came out as settled anything at all.
   *
   * Every state but `missing` settled a value; `missing` is the one that says the field was
   * considered and not answered. Both sides are read as numbers first, so the form a status id
   * arrived in never decides the answer, and a value naming no state settles nothing — which is the
   * side that records no confidence and no evidence category.
   *
   * @param {{
   *   aiRunFieldStatusId: *
   * }} params - Parameters.
   * @returns {boolean} true when the state settled a value.
   */
  settlesField ({
    aiRunFieldStatusId,
  }) {
    const comparableAiRunFieldStatusId = this.generateComparableAiRunFieldStatusId({
      aiRunFieldStatusId,
    })

    if (comparableAiRunFieldStatusId === null) {
      return false
    }

    const comparableMissingAiRunFieldStatusId = this.generateComparableAiRunFieldStatusId({
      aiRunFieldStatusId: this.missingAiRunFieldStatusId,
    })

    if (comparableMissingAiRunFieldStatusId === null) {
      return false
    }

    return comparableAiRunFieldStatusId !== comparableMissingAiRunFieldStatusId
  }

  /**
   * Generate the number a status id names, so that two of them can be compared.
   *
   * The status the caller hands in and the status this recorder holds as `missing` go through the
   * same conversion, which is why the value arrives as an argument rather than being read off
   * `this`: one rule applied to both sides is what keeps the two from drifting into a comparison
   * that only looks like one.
   *
   * @param {{
   *   aiRunFieldStatusId: *
   * }} params - Parameters.
   * @returns {number | null} The id as a number, or null when the value names no state.
   */
  generateComparableAiRunFieldStatusId ({
    aiRunFieldStatusId,
  }) {
    if (Number.isInteger(aiRunFieldStatusId)) {
      return /** @type {number} */ (aiRunFieldStatusId)
    }

    if (typeof aiRunFieldStatusId !== 'string') {
      return null
    }

    if (!AI_RUN_FIELD_STATUS_ID_PATTERN.test(aiRunFieldStatusId)) {
      return null
    }

    return Number(aiRunFieldStatusId)
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
