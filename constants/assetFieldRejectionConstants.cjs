'use strict'

/*
 * Why a reading of a field was dropped before it could be settled, and why a field was left
 * unsettled after it.
 *
 * **The first five are the five rules of step 4**, which specs/1.0.0 §20 names one at a time
 * rather than as "the schema check": a path outside the schema, a select value not among the
 * options sent, a number failing the form, a number outside the range sent, and a value over the
 * stated maximum. Each is a separate acceptance criterion, so each has a code of its own and none
 * of them collapses into a neighbour.
 *
 * `SOURCE_MEDIUM_NOT_SENT` is the sixth drop of step 4 - a reading citing a photograph that was
 * not among the media sent. §20 lists it beside the other five; it has no code in the development
 * seeder because the seeded trace did not happen to carry one.
 *
 * **The last two of step 4 are the tool schema's own `required` list, enforced in code.** §20 says
 * step 4 drops "whatever the schema does not allow", and the schema a reading comes back under
 * requires an evidence kind out of three named words and a one-line reason. A vendor answering a
 * tool call is not held to the schema it was offered, so a reading carrying neither is dropped here
 * rather than allowed to reach a field outcome whose evidence kind names no master row.
 *
 * `NO_ABSOLUTE_MAJORITY` is step 5's and not step 4's. It is here rather than in a file of its own
 * because the two steps write into one column - `ai_run_steps.rejections` - and a reader tracing a
 * field from its outcome back to the step that dropped it reads one vocabulary, not two.
 *
 * **Every value is also written in `sequelize/seeders/development/*-ai_run_steps.cjs`**, which
 * fixed them before this file existed. The words are that seeder's; this file is where code reads
 * them from, so a rename lands in one place and the seeder is what disagrees loudly.
 */
module.exports = {
  ASSET_FIELD_REJECTION_REASON_CODE: {
    FIELD_PATH_OUTSIDE_SCHEMA: 'field-path-outside-schema',
    SELECT_OPTION_NOT_OFFERED: 'select-option-not-offered',
    NUMBER_FAILED_EXPECTED_FORM: 'number-failed-expected-form',
    NUMBER_OUT_OF_RANGE: 'number-out-of-range',
    VALUE_OVER_MAX_LENGTH: 'value-over-max-length',
    SOURCE_MEDIUM_NOT_SENT: 'source-medium-not-sent',
    EVIDENCE_KIND_OUTSIDE_SCHEMA: 'evidence-kind-outside-schema',
    REASON_ABSENT: 'reason-absent',
    NO_ABSOLUTE_MAJORITY: 'no-absolute-majority',
  },
}
