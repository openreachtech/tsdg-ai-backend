'use strict'

/*
 * The one rate limit a run-creating request is held to, from the non-functional section of
 * specs/1.0.0: "the run-creating request is limited per client. The idempotency key stops a repeat
 * of the same request; it does nothing about a thousand different ones, and each run costs three
 * model readings".
 *
 * **What is counted is runs accepted, not requests received.** The requirement bounds the thing
 * that costs — "each run costs three model readings" — and a refusal costs nothing, so a client
 * refused for a malformed body is not held against its own limit. It also makes the figure one a
 * person can reason about: sixty runs in a minute is sixty runs of work, whatever number of
 * requests it took to ask for them.
 *
 * **One figure for every client, and the reason it is not per client.** The requirement says "per
 * client", which is how it is applied - the count is of one client's own runs and nothing else.
 * What it does not say is that the *figure* differs between clients, and `api_clients` carries no
 * column for one. A column there would reopen a table belonging to `#run-contract`, which is
 * already accepted, for a distinction the specification never draws; when a client needs its own
 * figure, that column is the change to make and this constant becomes its default.
 *
 * **Where the two numbers come from.** The volume row of the same section states ~100 runs a day
 * at launch and ~1,000 a day foreseen, which is under one a minute. Sixty in a minute is roughly
 * eighty times the foreseen rate, so no honest caller - including one retrying a request it never
 * saw answered - reaches it, while the runaway the requirement names ("a thousand different ones")
 * is stopped inside its first minute. Sixty runs in a minute is also already past what this
 * service is built to carry: each is up to twelve fetched files read three times.
 *
 * They are constants rather than environment keys for the reason the media limits are: the figure
 * is a property of the product rather than of a deployment, and a development machine refusing at
 * a different rate from a live one would make the refusal untestable where it is written.
 */
module.exports = {
  AI_RUN_RATE_LIMIT: {
    MAXIMUM_ACCEPTED_AI_RUN_COUNT: 60,
    WINDOW_SECOND_COUNT: 60,
  },
}
