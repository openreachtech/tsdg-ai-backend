'use strict'

/*
 * How long a run's decision trace is kept, from the non-functional section of specs/1.0.0:
 * "content 30 days; the decision trace 730 days. Two separate settings, never one".
 *
 * **What the trace is.** The rows of `ai_run_steps`, `ai_model_calls` and `ai_run_field_outcomes`:
 * step names, outcome and reason codes, rejections, agreement counts, confidence, the version of
 * the formula that scored it, the model that answered and the prompt version it used. None of it
 * is content, and #run-record says so of each table in turn - `ai_run_steps.rejections` records
 * the field path, the reason code and figures, "never the value itself", and
 * `AiRunStepRecorder.buildRecordableRejection()` is where that is made true rather than promised.
 *
 * **Why this is a file of its own, holding one figure.** See the same paragraph in
 * `aiRunContentRetentionConstants.cjs`. Nothing imports "the retention settings": a caller names
 * the clock it means, and the two cannot be edited as one.
 *
 * **Why it is the longer of the two.** The second use case of #retention is an operator answering
 * a dispute raised long after the auction closed, reading why a run decided what it did "even
 * though the content itself is long gone". Two years is what makes that answerable, and it is also
 * what makes the deferred recalibration of the confidence formula reachable - it reads two years
 * of `ai_run_field_outcomes` rows.
 *
 * **What the clock runs from.** `ai_runs.accepted_at`, the same column the content clock runs
 * from, so the two horizons are two distances from one instant rather than two instants a reader
 * has to reconcile.
 */
module.exports = {
  AI_RUN_TRACE_RETENTION: {
    DAY_COUNT: 730,
  },
}
