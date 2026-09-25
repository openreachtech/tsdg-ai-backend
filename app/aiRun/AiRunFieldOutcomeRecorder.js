import AiRunInstantInspector from './AiRunInstantInspector.js'

import AI_RUN_EVIDENCE_CATEGORY_CONSTANT_HASH from '../constants/aiRunEvidenceCategoryConstants.js'
import AI_RUN_FIELD_STATUS_CONSTANT_HASH from '../constants/aiRunFieldStatusConstants.js'

import AiRunFieldOutcome from '../../sequelize/models/AiRunFieldOutcome.js'
import AiRunStep from '../../sequelize/models/AiRunStep.js'

const {
  AI_RUN_FIELD_STATUS,
} = AI_RUN_FIELD_STATUS_CONSTANT_HASH

const {
  AI_RUN_EVIDENCE_CATEGORY,
} = AI_RUN_EVIDENCE_CATEGORY_CONSTANT_HASH

const DEFAULT_MISSING_AI_RUN_FIELD_STATUS_ID = AI_RUN_FIELD_STATUS.MISSING.ID

/*
 * The ids each master actually carries, read from the constants the seeders seed from.
 *
 * This table declares no database foreign key, by the rule that integrity is enforced in application
 * code, so a field state or an evidence kind naming no master row is written unless something here
 * turns it away. Reading the two masters would be two queries per field settled, on a table a run
 * writes once per field; reading the constant hashes the seeders themselves are built from costs
 * nothing and is exact, because a master row that is not in the hash was never seeded.
 */
const AI_RUN_FIELD_STATUS_IDS = Object.values(AI_RUN_FIELD_STATUS)
  .map(it => it.ID)

const AI_RUN_EVIDENCE_CATEGORY_IDS = Object.values(AI_RUN_EVIDENCE_CATEGORY)
  .map(it => it.ID)

/*
 * A whole number of readings, written without a leading zero and without a sign.
 *
 * `0` on its own is a count; `007` and `+3` are not, for the same reason an id is not written with
 * a leading zero — a value shaped that way came from somewhere that was not counting.
 */
const READING_COUNT_PATTERN = /^(?:0|[1-9]\d*)$/u

/*
 * The largest count the column can hold. `INTEGER` is what the migration declares, so a figure
 * above this is not a figure this row could carry: SQLite stores it and a strict MariaDB rejects or
 * clamps it, which is a development-and-production divergence on a row kept for two years. The
 * floor was already stated — zero readings can agree, fewer than none cannot — and this is its
 * other end, bounded by the column exactly as the field path and the method version are bounded by
 * theirs.
 */
const MAXIMUM_READING_COUNT = 2147483647

const UNRECORDABLE_SETTLED_AT_MESSAGE = 'refused a settled instant that is not an instant'

const UNREADABLE_KEY_MESSAGE = 'refused a key that is not an id'
const UNKNOWN_AI_RUN_STEP_MESSAGE = 'refused a step that does not exist'
const FOREIGN_AI_RUN_STEP_MESSAGE = 'refused a step belonging to another run'
const UNREADABLE_FIELD_STATUS_MESSAGE = 'refused a field state that is not an id'
const UNKNOWN_FIELD_STATUS_MESSAGE = 'refused a field state naming no master row'
const UNKNOWN_EVIDENCE_CATEGORY_MESSAGE = 'refused an evidence kind naming no master row'
const ABSENT_SETTLED_RECORD_MESSAGE = 'refused a settled field carrying none of what settling it records'
const UNREADABLE_READING_COUNT_MESSAGE = 'refused a reading count that is not a whole number'
const MISSPELLED_READING_COUNT_MESSAGE = 'refused a reading count written in a shape no count is written in'
const UNRECORDABLE_SCORE_MESSAGE = 'refused a score the column cannot record'
const OUT_OF_RANGE_READING_COUNT_MESSAGE = 'refused a reading count outside the range a count can hold'
const IMPOSSIBLE_READING_COUNT_MESSAGE = 'refused more readings agreeing than there were readings'

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

/*
 * A row id of `ai_runs` written as text: digits alone, opening on a non-zero digit.
 *
 * It is stated separately from the status-id shape above, and not shared with it, because the two
 * answer different questions of different columns: one says which of five states a field came out
 * as, the other says which run a row belongs to. Reading the same constant for both would tie a
 * `BIGINT` key to a small enumeration's rule, and whichever of the two moved first would move the
 * other with it.
 *
 * What it rejects: a sign, a decimal point, whitespace and every other character, so `'7 '` and
 * `'7abc'` name no run rather than naming run seven.
 */
const AI_RUN_ID_PATTERN = /^[1-9]\d*$/u

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
 * could not derive. **The score is refused the same way, and used not to be.** It is nullable, and
 * for four rounds that was read as licence to write the no-score marker whenever what arrived was
 * not a score — until section 10 was read on the point: the column is NULL **when nothing was
 * settled**, so writing that marker against a field that settled made a dropped score
 * indistinguishable from a field nothing scored, on the one row an operator reads to ask why a
 * field returned no value. A settled field whose score the column cannot take costs the row now.
 *
 * **A refusal names the field, never the value — except where the value is an identity.** The
 * whole purpose of these shapes is keeping something read out of a medium off a row kept for two
 * years, and a message that then reproduces it in full has moved it into a log instead, where no
 * purge clock is stated at all. So `field AiRunFieldStatusId` rather than the text that arrived in
 * it. `AiRunId` and `AiRunStepId` stay written out, because they are not values under judgement —
 * they are how an operator finds the row the message is about.
 *
 * **No field outcome exists outside a step.** `AiRunStepId` is `NOT NULL`, because a field's
 * agreement counts live on this row while the reason code for how it was settled lives on the
 * step, and the two are only one answer when they are joined. The step is therefore an ordinary
 * required parameter of the save with no default behind it: a caller that omits it has the row
 * refused by the column, which is the intended outcome. Nothing here invents a step to hang an
 * outcome off.
 *
 * **The step must be a step of the run, and that is checked here or nowhere.** `NOT NULL` is the
 * whole of what the table asks of `AiRunStepId`: there is no database foreign key on it, because
 * referential integrity in this service is enforced in application code. So a caller holding a run
 * and a step id that came from two different runs has the row taken, and the row then says the
 * field was settled by a step of somebody else's run. The column was added for one reason — the
 * reason code for how a field was settled lives on the step, and this is what makes it reachable
 * from the field — so a mis-wired pair answers an operator asking why their field returned no
 * value with another run's reason code, silently, with nothing on the row to show for it. That is
 * the single wrong answer the column exists to prevent, so the step is read and the pair is checked
 * before anything is written. The comparison goes through
 * `#generateComparableAiRunId()` on both sides, for the reason the status id does: a `BIGINT` key
 * reaches here as a number from SQLite and may reach here as text from MariaDB or from a request,
 * and a run compared in the form it arrived in would refuse pairs that match.
 *
 * **Why this refusal throws, where the rest of the class answers null.** The `generate~` members
 * answer null because the value asked of them could not be derived — a path that is not a path, a
 * label that is not a label — and a `NOT NULL` column then turns the row away. Nothing is
 * underivable here. Both ids arrived, both are well formed, and each names a real row; what is
 * wrong is that they name two different runs, which makes the call malformed rather than a value
 * absent. Answering null for the step would refuse the same row while reporting the wrong thing:
 * the caller would read that the step cannot be null and go looking for a step it plainly had,
 * and the two ids that contradict each other — the only two facts worth having — would appear
 * nowhere. So this follows `AiRunStatusRecorder`, which throws for the same class of defect and
 * for the same reason, and names both ids in the message.
 *
 * **A step that is not there and a step of another run are two refusals, not one.** They are one
 * read and one branch, but they are two different defects in the caller: a step id naming nothing
 * is an id that was never a step or whose step never saved, and a step id naming another run's
 * step is two live runs crossed. Each names itself in the message, so the log says which happened
 * without the reader having to go and look — the same reason `AiRunStatusRecorder` separates a run
 * that does not exist from a run that has settled.
 *
 * **What the guard costs.** It is one primary-key read for every field outcome written, and a run
 * settles many fields against the one step that settled them — so the same row is read once per
 * field rather than once per step. One indexed lookup beside the insert it guards is not what makes
 * a settle slow, and a wrong answer that cannot be detected is worth more than that. The read would
 * go away entirely if the caller handed in the step it already holds instead of its id, leaving the
 * guard a property comparison; whether the call takes the step or the id is the caller's shape to
 * settle, and nothing calls this yet.
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
    aiRunInstantInspector,
  }) {
    this.missingAiRunFieldStatusId = missingAiRunFieldStatusId
    this.aiRunInstantInspector = aiRunInstantInspector
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
    aiRunInstantInspector = this.createAiRunInstantInspector(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        missingAiRunFieldStatusId,
        aiRunInstantInspector,
      })
    )
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
   * get: the field-outcome model.
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
   * The step is read and checked against the run before anything is written: a field outcome
   * naming a step of another run would hand the second use case of `#run-record` somebody else's
   * reason code, and nothing on the row would say so.
   *
   * @param {SaveAiRunFieldOutcomeParams} params - Parameters.
   * @returns {Promise<*>} The saved field outcome.
   * @throws {Error} When no step carries the id, or when the step belongs to another run.
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
    const unreadableKeyFieldName = this.extractUnreadableKeyFieldName({
      aiRunId,
      aiRunStepId,
    })

    if (unreadableKeyFieldName) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${UNREADABLE_KEY_MESSAGE}: field ${unreadableKeyFieldName}`)
    }

    const aiRunStep = await this.findAiRunStep({
      aiRunStepId,
    })

    if (!aiRunStep) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${UNKNOWN_AI_RUN_STEP_MESSAGE}: AiRunId ${aiRunId}, AiRunStepId ${aiRunStepId}`)
    }

    if (
      !this.belongsToAiRun({
        aiRunStep,
        aiRunId,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${FOREIGN_AI_RUN_STEP_MESSAGE}: AiRunId ${aiRunId}, AiRunStepId ${aiRunStepId}, AiRunId of the step ${aiRunStep.AiRunId}`)
    }

    const comparableAiRunFieldStatusId = this.generateComparableAiRunFieldStatusId({
      aiRunFieldStatusId,
    })

    const refusedFieldStatusMessage = this.extractRefusedFieldStatusMessage({
      comparableAiRunFieldStatusId,
    })

    if (refusedFieldStatusMessage) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${refusedFieldStatusMessage}: AiRunId ${aiRunId}, field AiRunFieldStatusId`)
    }

    const comparableAgreedReadingCount = this.generateComparableReadingCount({
      readingCount: agreedReadingCount,
    })

    const comparableTotalReadingCount = this.generateComparableReadingCount({
      readingCount: totalReadingCount,
    })

    const refusedAgreedReadingCountMessage = this.extractRefusedReadingCountMessage({
      readingCount: agreedReadingCount,
    })

    if (refusedAgreedReadingCountMessage) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${refusedAgreedReadingCountMessage}: AiRunId ${aiRunId}, field agreedReadingCount`)
    }

    const refusedTotalReadingCountMessage = this.extractRefusedReadingCountMessage({
      readingCount: totalReadingCount,
    })

    if (refusedTotalReadingCountMessage) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${refusedTotalReadingCountMessage}: AiRunId ${aiRunId}, field totalReadingCount`)
    }

    if (comparableAgreedReadingCount > comparableTotalReadingCount) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${IMPOSSIBLE_READING_COUNT_MESSAGE}: AiRunId ${aiRunId}, ${comparableAgreedReadingCount} of ${comparableTotalReadingCount}`)
    }

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

    const absentSettledFieldName = this.extractAbsentSettledFieldName({
      aiRunFieldStatusId,
      settledEvidenceCategoryId,
      settledSuggestionConfidence,
    })

    if (absentSettledFieldName) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${ABSENT_SETTLED_RECORD_MESSAGE}: AiRunId ${aiRunId}, field ${absentSettledFieldName}`)
    }

    if (
      this.carriesUnrecordableScore({
        aiRunFieldStatusId,
        settledSuggestionConfidence,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${UNRECORDABLE_SCORE_MESSAGE}: AiRunId ${aiRunId}, field suggestionConfidence`)
    }

    if (
      this.carriesUnknownEvidenceKind({
        settledEvidenceCategoryId,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${UNKNOWN_EVIDENCE_CATEGORY_MESSAGE}: AiRunId ${aiRunId}, field AiRunEvidenceCategoryId`)
    }

    const settledConfidenceMethodVersion = this.generateSettledConfidenceMethodVersion({
      confidenceMethodVersion,
    })

    if (
      !this.aiRunInstantInspector.isRecordableInstant({
        instant: settledAt,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveAiRunFieldOutcome() ${UNRECORDABLE_SETTLED_AT_MESSAGE}: AiRunId ${aiRunId}, field settledAt`)
    }

    return /** @type {*} */ (
      this.Ctor.AiRunFieldOutcomeCtor.create({
        AiRunId: aiRunId,
        AiRunStepId: aiRunStepId,
        fieldPath: settledFieldPath,
        AiRunFieldStatusId: comparableAiRunFieldStatusId,
        AiRunEvidenceCategoryId: settledEvidenceCategoryId,
        suggestionConfidence: settledSuggestionConfidence,
        agreedReadingCount: comparableAgreedReadingCount,
        totalReadingCount: comparableTotalReadingCount,
        confidenceMethodVersion: settledConfidenceMethodVersion,
        settledAt,
      })
    )
  }

  /**
   * Find the step a field outcome is recorded against.
   *
   * It reads the step and nothing else: whether that step is the run's is the next method's
   * question, and whether it may be written against is the save's.
   *
   * @param {{
   *   aiRunStepId: *
   * }} params - Parameters.
   * @returns {Promise<*>} The step, or null when no step carries the id.
   * @public
   */
  async findAiRunStep ({
    aiRunStepId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunStepCtor.findOne({
        where: {
          id: aiRunStepId,
        },
      })
    )
  }

  /**
   * Whether a step is a step of the run the field outcome is being recorded against.
   *
   * Both sides go through the same conversion, so the form a run id arrived in never decides the
   * answer: the step hands its `AiRunId` back as a number on SQLite and may hand it back as text
   * on MariaDB, and the id the caller states may itself have come through a query string. A value
   * naming no run at all is not the run in question, whichever side it is on — the pair is refused
   * rather than let through on a comparison that only looks like one.
   *
   * @param {{
   *   aiRunStep: *
   *   aiRunId: *
   * }} params - Parameters.
   * @returns {boolean} true when the step belongs to the run.
   * @public
   */
  belongsToAiRun ({
    aiRunStep,
    aiRunId,
  }) {
    const comparableAiRunId = this.generateComparableAiRunId({
      aiRunId,
    })

    if (comparableAiRunId === null) {
      return false
    }

    const comparableAiRunIdOfStep = this.generateComparableAiRunId({
      aiRunId: aiRunStep.AiRunId,
    })

    if (comparableAiRunIdOfStep === null) {
      return false
    }

    return comparableAiRunId === comparableAiRunIdOfStep
  }

  /**
   * Extract the name of the first key handed in that is no id.
   *
   * **This is what lets the two messages below write a key out in full.** The class states that a
   * refusal names the field and never the value, except where the value is an identity that locates
   * the row — and for one commit that carve-out was applied to `aiRunId` and `aiRunStepId` on
   * branches where neither was an identity yet. A step that does not exist is reported with the
   * step id that found nothing; a step belonging to another run is reported after this class has
   * already judged the run id and found it names no run. Either way the text reproduced was a value
   * under judgement, unbounded in length, and `aiRunStepId` had no shape check anywhere in the
   * class at all.
   *
   * Asked here, both are digits by the time either is written into a message, so the carve-out says
   * what it always meant: an identity is echoed, and a value being judged is named.
   *
   * @param {{
   *   aiRunId: *
   *   aiRunStepId: *
   * }} params - Parameters.
   * @returns {string | null} The parameter name, or null when both are ids.
   * @public
   */
  extractUnreadableKeyFieldName ({
    aiRunId,
    aiRunStepId,
  }) {
    if (
      this.generateComparableKey({
        key: aiRunId,
      }) === null
    ) {
      return 'aiRunId'
    }

    return this.generateComparableKey({
      key: aiRunStepId,
    }) === null
      ? 'aiRunStepId'
      : null
  }

  /**
   * Generate the number a key names, so that two of them can be compared.
   *
   * Every `BIGINT` key of this feature has the same shape and the same hazard: it may reach here as
   * text, from MariaDB or from a request, and a key compared in the form it arrived in would refuse
   * pairs that match. One rule, asked of whichever key is in hand — and one rule for both
   * spellings, which `#namesRow()` below is what enforces.
   *
   * @param {{
   *   key: *
   * }} params - Parameters.
   * @returns {number | null} The key as a number, or null when the value names no key.
   * @public
   */
  generateComparableKey ({
    key,
  }) {
    if (typeof key === 'number') {
      return this.namesRow({
        key,
      })
        ? key
        : null
    }

    if (typeof key !== 'string') {
      return null
    }

    return AI_RUN_ID_PATTERN.test(key)
      ? Number(key)
      : null
  }

  /**
   * Check whether a number names a row at all.
   *
   * **The two spellings have to agree, and for one commit they did not.** The text form was held to
   * `AI_RUN_ID_PATTERN`, which is a positive integer with no leading zero, while the number form
   * took any integer at all — so `'-1'` named no row and `-1` named one, and which answer a caller
   * got depended on whether its id had crossed a queue or a query string. A test written from the
   * boundary rather than from the examples is what found it.
   *
   * @param {{
   *   key: number
   * }} params - Parameters.
   * @returns {boolean} Whether the number names a row.
   * @public
   */
  namesRow ({
    key,
  }) {
    if (!Number.isInteger(key)) {
      return false
    }

    return key >= 1
  }

  /**
   * Generate the number a run id names, so that two of them can be compared.
   *
   * The run the caller states and the run the step carries go through this same method, which is
   * why the value arrives as an argument rather than being read off either of them.
   *
   * @param {{
   *   aiRunId: *
   * }} params - Parameters.
   * @returns {number | null} The id as a number, or null when the value names no run.
   * @public
   */
  generateComparableAiRunId ({
    aiRunId,
  }) {
    return this.generateComparableKey({
      key: aiRunId,
    })
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
   * Extract the name of the first thing a settled field must record and this call does not carry.
   *
   * Section 10 declares both columns NULL **when nothing was settled**, so on a field that did
   * settle a null is the marker for the opposite state. Two ways of writing it reached the row: an
   * omitted evidence kind, and a score this class could not read, which was quietly turned into the
   * no-score marker and written. Either reads back — on a row kept 730 days, feeding the very use
   * case about why a field returned no value — as a field whose majority reading rested on nothing
   * and was scored by nothing. The column has one meaning and it is spoken for.
   *
   * A field that settled nothing reaches none of this: it is the state the markers are for.
   *
   * @param {{
   *   aiRunFieldStatusId: *
   *   settledEvidenceCategoryId: *
   *   settledSuggestionConfidence: *
   * }} params - Parameters.
   * @returns {string | null} The field name, or null when a settled field carries both.
   * @public
   */
  extractAbsentSettledFieldName ({
    aiRunFieldStatusId,
    settledEvidenceCategoryId,
    settledSuggestionConfidence,
  }) {
    if (
      !this.settlesField({
        aiRunFieldStatusId,
      })
    ) {
      return null
    }

    if (
      !this.carriesSettledEvidenceKind({
        settledEvidenceCategoryId,
      })
    ) {
      return 'AiRunEvidenceCategoryId'
    }

    if (settledSuggestionConfidence === null) {
      return 'suggestionConfidence'
    }

    return typeof settledSuggestionConfidence === 'undefined'
      ? 'suggestionConfidence'
      : null
  }

  /**
   * Check whether an evidence kind names no row of the master.
   *
   * A null passes, and means the field settled nothing — by the time this is asked, a settled field
   * with no evidence kind has already been refused above.
   *
   * @param {{
   *   settledEvidenceCategoryId: *
   * }} params - Parameters.
   * @returns {boolean} Whether the evidence kind names no master row.
   * @public
   */
  carriesUnknownEvidenceKind ({
    settledEvidenceCategoryId,
  }) {
    if (settledEvidenceCategoryId === null) {
      return false
    }

    return !AI_RUN_EVIDENCE_CATEGORY_IDS.includes(settledEvidenceCategoryId)
  }

  /**
   * Check whether a settled field carries a score the column cannot record.
   *
   * Absence is the question above, and it is a different question with a different answer. A score
   * that is **there** and is not one the column can take — text, a value outside the closed range,
   * or a number JavaScript renders in exponent form, which `DECIMAL(5, 4)` has no room for below
   * its fourth place — is a caller defect rather than the section 10 marker collision, and saying so
   * is the whole of the difference. For one commit both answered the same message, which told a
   * caller that had stated a score that it had carried none of what settling a field records.
   *
   * It still costs the row. The alternative is what this class did for four rounds: quietly write
   * the no-score marker, which is the collision, and hand the caller a settled field that reads as
   * having been scored by nothing.
   *
   * @param {{
   *   aiRunFieldStatusId: *
   *   settledSuggestionConfidence: *
   * }} params - Parameters.
   * @returns {boolean} Whether a settled field's score cannot be recorded.
   * @public
   */
  carriesUnrecordableScore ({
    aiRunFieldStatusId,
    settledSuggestionConfidence,
  }) {
    if (
      !this.settlesField({
        aiRunFieldStatusId,
      })
    ) {
      return false
    }

    return !this.isRecordableScore({
      suggestionConfidence: settledSuggestionConfidence,
    })
  }

  /**
   * Check whether an evidence kind was stated at all.
   *
   * Omitted and null are one state with two spellings, and for one commit they behaved differently
   * — the first threw and the second wrote.
   *
   * @param {{
   *   settledEvidenceCategoryId: *
   * }} params - Parameters.
   * @returns {boolean} Whether an evidence kind was stated.
   * @public
   */
  carriesSettledEvidenceKind ({
    settledEvidenceCategoryId,
  }) {
    if (typeof settledEvidenceCategoryId === 'undefined') {
      return false
    }

    return settledEvidenceCategoryId !== null
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
   * whichever of the two renderings a `DECIMAL(5, 4)` reached here as — **untouched, and unjudged.**
   *
   * This method used to judge it too, and answer null for a value that was no score. That was the
   * defect rather than the guard: the null it wrote is section 10's marker for a field that settled
   * nothing, so a dropped score read back as one that never existed and the caller was told
   * neither. Whether a score can be recorded is asked by `#carriesUnrecordableScore()`, above the
   * write, where it refuses the row instead of quietly rewriting it.
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
   * Generate a reading count that can be compared and recorded, out of what the caller handed in.
   *
   * A count is a whole number of readings, so it answers the number for an integer or an
   * integer-shaped string and null for anything else — a decimal, a sign, text, or a value of
   * another kind.
   *
   * **Whether the number is one a count could be is a different question, and it is asked
   * separately.** For one commit this method answered null for both, and the save path had one
   * message for both, so a caller handing `2147483648` was told its value was not a whole number
   * when it plainly was. Two defects reported as one is how an operator is sent looking in the
   * wrong place, and it is the same shape as the message this class was corrected for one round
   * earlier. The range is `#fallsWithinRecordableReadingRange()`, and it covers the floor as well —
   * `-1` is a whole number too, and is out of range rather than unreadable.
   *
   * It exists because the columns are `INTEGER` and would coerce quietly: a security audit stored a
   * person's name and telephone number in `agreed_reading_count` and the row was written, while the
   * class documentation said in as many words that none of these columns holds a value read out of
   * a medium. A guarantee nothing enforces is the defect this class was already corrected for once.
   *
   * @param {{
   *   readingCount: *
   * }} params - Parameters.
   * @returns {number | null} The count, or null when the value names none.
   */
  generateComparableReadingCount ({
    readingCount,
  }) {
    if (Number.isInteger(readingCount)) {
      return /** @type {number} */ (readingCount)
    }

    if (typeof readingCount !== 'string') {
      return null
    }

    return READING_COUNT_PATTERN.test(readingCount)
      ? Number(readingCount)
      : null
  }

  /**
   * Extract the message naming why a field state cannot be recorded.
   *
   * Two defects, two messages, and the field is named rather than the value in both — a state that
   * is not an id may carry anything at all, and a state that is an id naming no master row is a
   * number the reader can find from the field name alone.
   *
   * @param {{
   *   comparableAiRunFieldStatusId: number | null
   * }} params - Parameters.
   * @returns {string | null} The message, or null when the state is recordable.
   * @public
   */
  extractRefusedFieldStatusMessage ({
    comparableAiRunFieldStatusId,
  }) {
    if (comparableAiRunFieldStatusId === null) {
      return UNREADABLE_FIELD_STATUS_MESSAGE
    }

    return AI_RUN_FIELD_STATUS_IDS.includes(comparableAiRunFieldStatusId)
      ? null
      : UNKNOWN_FIELD_STATUS_MESSAGE
  }

  /**
   * Extract the message naming why a reading count cannot be recorded, out of what arrived.
   *
   * Three defects, three messages, because for four rounds this class reported them as one and an
   * operator was sent to the wrong place each time. `'Jane Doe'`, `''` and `'   '` name no number
   * at all; `'007'`, `'+3'`, `'3.0'` and `' 3'` are whole numbers written in shapes a count is not
   * written in — the constant above says exactly why, that a value shaped that way came from
   * somewhere that was not counting — and `2147483648` and `'-1'` are properly named whole numbers
   * the column cannot hold. Telling all three that they are not whole numbers is false of the last
   * two.
   *
   * Text is sorted by `#extractRefusedReadingTextMessage()`, which judges the number the text names
   * before it judges how the text was written. A pattern alone cannot: it rejects `'007'` and
   * `'-1'` alike, and they are not the same defect.
   *
   * @param {{
   *   readingCount: *
   * }} params - Parameters.
   * @returns {string | null} The message, or null when the count is recordable.
   * @public
   */
  extractRefusedReadingCountMessage ({
    readingCount,
  }) {
    if (typeof readingCount !== 'string') {
      return this.extractRefusedReadingNumberMessage({
        readingCount,
      })
    }

    return this.extractRefusedReadingTextMessage({
      readingCount,
    })
  }

  /**
   * Extract the message naming why text is no reading count.
   *
   * **The number the text names is judged before its spelling is**, which is the fix for a
   * discriminator that asked `Number.isNaN(Number(x))` and called that "whether the text names a
   * number at all". It is not the same predicate: `Number('')` and `Number('   ')` are both `0`, so
   * text naming nothing was sorted as a number badly written. Worse, `'-1'` was told its spelling
   * was wrong while the number form of the same value was correctly told it was out of range — one
   * value, two answers, and the docblock beside them says outright that a negative count is out of
   * range rather than unreadable.
   *
   * So the order is: text that names nothing is unreadable; then whatever number it does name faces
   * the same two questions a number faces; and only a text naming a sound, in-range count is left
   * to be judged on how it was written.
   *
   * @param {{
   *   readingCount: string
   * }} params - Parameters.
   * @returns {string | null} The message, or null when the text is a recordable count.
   * @public
   */
  extractRefusedReadingTextMessage ({
    readingCount,
  }) {
    if (readingCount.trim() === '') {
      return UNREADABLE_READING_COUNT_MESSAGE
    }

    const refusedNumberMessage = this.extractRefusedReadingNumberMessage({
      readingCount: Number(readingCount),
    })

    if (refusedNumberMessage) {
      return refusedNumberMessage
    }

    return READING_COUNT_PATTERN.test(readingCount)
      ? null
      : MISSPELLED_READING_COUNT_MESSAGE
  }

  /**
   * Extract the message naming why a number is no reading count.
   *
   * @param {{
   *   readingCount: number
   * }} params - Parameters.
   * @returns {string | null} The message, or null when the number is a recordable count.
   * @public
   */
  extractRefusedReadingNumberMessage ({
    readingCount,
  }) {
    if (!Number.isInteger(readingCount)) {
      return UNREADABLE_READING_COUNT_MESSAGE
    }

    return this.fallsWithinRecordableReadingRange({
      readingCount,
    })
      ? null
      : OUT_OF_RANGE_READING_COUNT_MESSAGE
  }

  /**
   * Check whether a count falls within the range a count can hold.
   *
   * Both ends, and both for the same reason — a figure outside them is not a figure this row could
   * carry. Below zero there is no way to agree fewer than no times; above `INTEGER`'s own maximum
   * SQLite stores the value and a strict MariaDB rejects or clamps it, which would put development
   * and production on different rows for two years.
   *
   * @param {{
   *   readingCount: number
   * }} params - Parameters.
   * @returns {boolean} Whether it falls within the range.
   * @public
   */
  fallsWithinRecordableReadingRange ({
    readingCount,
  }) {
    if (readingCount < 0) {
      return false
    }

    return readingCount <= MAXIMUM_READING_COUNT
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
 *   aiRunInstantInspector: AiRunInstantInspector
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
