'use strict'

/*
 * The bounds one page of `GET /v1/ai-runs` is held to (specs/1.0.0, #run-list).
 *
 * **Why a page has a ceiling at all.** The route answers one row per run, and each row carries
 * facts read from two further tables — the steps that completed and the model calls that were
 * made. Those two reads are bounded by the page, not by the client's patience, so the page is
 * what has to be bounded. A hundred runs is a hundred rows, up to six hundred step rows and up
 * to three hundred model-call rows: three queries a database answers without noticing. A page
 * of ten thousand would be the same three queries and a different kind of event.
 *
 * **Why the default is twenty rather than the maximum.** A client that states no `limit` is a
 * client that has not thought about the size of the answer, and the honest default for that is
 * a screenful rather than everything this route will part with. A client that wants more says
 * so, and the cursor is how it says "and the rest".
 *
 * **Why the stall threshold has a ceiling too.** `stalledForSeconds` is subtracted from the
 * request's own instant to get the moment a run must have been waiting since, and a number
 * large enough overflows what a `Date` can represent — past which the condition is not a wide
 * filter but an invalid one, and the failure would surface as a database error rather than as
 * a refusal. A year is already far past any threshold an operator would ask about: a run this
 * service stops at 300 seconds cannot honestly be said to have stalled for longer than the
 * decision trace behind it is kept.
 *
 * They are constants rather than environment keys for the reason the rate limit's two figures
 * are: the numbers are properties of the product rather than of a deployment, and a development
 * machine paginating differently from a live one would make the refusal untestable where it is
 * written.
 */
module.exports = {
  AI_RUN_PAGE: {
    DEFAULT_RUN_COUNT: 20,
    MAXIMUM_RUN_COUNT: 100,
    MAXIMUM_STALLED_SECOND_COUNT: 31536000, // 365 days
  },
}
