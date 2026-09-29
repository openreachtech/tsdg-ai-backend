'use strict'

/*
 * Reason codes a failed run is recorded under, in `ai_runs.failure_reason_code`.
 *
 * These are the seven `.hora/contracts/1.0.0/client-api.md` fixes for `failure.reasonCode`, and
 * the column is rendered to the client as that field — so a code that is not one of these is a
 * code the client system has no wording for. The contract states the set closed, and this module
 * is where the set is written down once so nothing retypes it.
 *
 * They are values of a column and not rows of a master table, because the service returns no
 * display wording for them: the client system builds the sentence people read, and a row carrying
 * a name nobody displays would only be a second place for the vocabulary to drift.
 *
 * Nothing enforces the set at the write. `AiRunStatusRecorder#saveFailedAiRun()` accepts any
 * non-blank string on purpose, so a caller that meets a failure this version did not foresee can
 * still record it rather than lose it. Pinning the vocabulary and constraining the column are two
 * separate decisions, and only the first of them has been made.
 *
 * The key and the value are the same word. The code is the whole of what a reason carries, so
 * there is nothing else for the key to be — and reading one through this module is what makes a
 * misspelling fail at import instead of at a reviewer's eye.
 */
module.exports = {
  AI_RUN_FAILURE_REASON_CODE: {
    MEDIA_FETCH_FAILED: 'MEDIA_FETCH_FAILED',
    MEDIA_LIMIT_EXCEEDED: 'MEDIA_LIMIT_EXCEEDED',
    MEDIA_UNSUPPORTED: 'MEDIA_UNSUPPORTED',
    MEDIA_UNREADABLE: 'MEDIA_UNREADABLE',
    PROVIDER_CALL_FAILED: 'PROVIDER_CALL_FAILED',
    OUTPUT_INVALID: 'OUTPUT_INVALID',
    TIME_LIMIT_EXCEEDED: 'TIME_LIMIT_EXCEEDED',
  },
}
