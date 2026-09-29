'use strict'

/*
 * How much work one scheduled purge does before it stops, from #retention's own reason for putting
 * these jobs outside the request path: "it reads far more rows than any request does".
 *
 * **Why a purge needs a bound at all, when a request does not.** Every other read in this service
 * is bounded by what a caller asked for - one run by its key, one page of at most a hundred. A
 * purge is bounded by nothing of the sort: it asks for every run past a horizon, and the first
 * time either job runs against a store that has been accumulating since launch that is every run
 * ever accepted. A single statement over that set holds one transaction open across it, and on
 * MariaDB takes locks on every row it touches for as long as it runs. So the set is taken in
 * batches, and the number of batches one scheduled run takes is capped.
 *
 * **What happens when a sweep stops with work still left, and why nothing has to be remembered.**
 * The purge's own write is what advances it: a purged run carries its stamp, and the stamp is the
 * leading column of the condition every batch is selected by, so a run that has been purged is no
 * longer in the set. There is no cursor to persist and no offset to carry - the next batch, in this
 * sweep or in tomorrow's, asks the same question and gets the rows this one did not reach. That is
 * also what makes a redelivered job harmless: BullMQ re-running a sweep re-purges nothing, because
 * there is nothing left in the set that it already wrote.
 *
 * **The two figures, derived from §7's volume rather than chosen.** ~1,000 runs a day is what the
 * version is built for, so a day's expiry is ~1,000 runs on either clock. Two hundred runs a batch
 * keeps one transaction to a few thousand rows on the trace purge - each run carries up to six
 * steps, three model calls and a field outcome per settled field - and fifty batches lets one
 * nightly sweep clear ten thousand runs, ten days' worth of arrivals. A backlog drains instead of
 * growing, and a sweep that meets a very large one still ends in bounded time and says it did not
 * finish.
 *
 * **Why the two clocks share this file when their horizons deliberately do not.** §7 says of the
 * horizons "two separate settings, never one", and `aiRunContentRetentionConstants.cjs` and
 * `aiRunTraceRetentionConstants.cjs` are two files so that no caller can reach for "the retention
 * setting". Nothing here is a retention setting: these figures say how much work one scheduled run
 * does, not how long anything is kept, and changing either of them moves no horizon and tells no
 * client anything different. A sweep bound shared by both jobs is one operational decision about
 * this machine, which is what a single file is for.
 *
 * They are constants rather than environment keys for the reason the page bounds and the rate
 * limit's figures are: a development machine sweeping in different-sized batches from a live one
 * would make the batching untestable where it is written.
 */
module.exports = {
  AI_RUN_PURGE_SWEEP: {
    AI_RUN_COUNT_PER_BATCH: 200,
    MAXIMUM_BATCH_COUNT: 50,
  },
}
