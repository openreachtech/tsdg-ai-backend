'use strict'

/*
 * How much work one scheduled purge of provider uploads does before it stops (specs/1.0.0,
 * #retention, "purge expired provider uploads").
 *
 * **Why this job does not share `aiRunPurgeSweepConstants.cjs`, which the other two purges do.**
 * That file's two figures are sized to a statement: two hundred runs a batch keeps one
 * transaction to a few thousand rows, and fifty batches clears ten thousand runs. A batch here is
 * not a statement. Every row in it is one outbound call to a vendor, made one at a time, and the
 * write at the end of the batch is a single `UPDATE` over the ids whose copies came back confirmed
 * gone. The two jobs are bounded by different costs — one by how long a transaction holds locks,
 * the other by how long a queue slot spends waiting on somebody else's HTTP — so one pair of
 * figures could only be right for one of them.
 *
 * **The batch size is a hundred, and what it bounds is the re-read.** A batch is the run of rows
 * asked about between two reads of the work set, and the ids of one batch are what one `UPDATE`
 * stamps. Smaller batches stamp sooner, which matters because a sweep interrupted mid-way keeps
 * everything already stamped and loses only the batch in flight; larger ones ask the database less
 * often, which is not the cost that bounds this job. A hundred is well inside what one `IN` clause
 * handles comfortably and is about twenty seconds of vendor calls.
 *
 * **The batch count is two hundred, and it is sized to a day's arrivals rather than chosen.** The
 * non-functional section is built for ~1,000 runs a day carrying up to 12 media each, so this
 * table can gain some 12,000 rows a day and a day's expiry is the same order. Twenty thousand in
 * one sweep leaves about sixty per cent headroom over that, so a night that ran long, or a sweep
 * missed entirely, is caught up by the next one rather than compounding. The two figures of the
 * run purges would have given ten thousand, which is less than one day's arrivals — a bound that
 * would never have caught up at all, and would have reported `isSweepExhausted: false` every night
 * for ever.
 *
 * **What twenty thousand sequential vendor calls means in wall-clock time, stated plainly.** At a
 * couple of hundred milliseconds a call this is upwards of an hour, and that is accepted rather
 * than overlooked: the job runs overnight, on a queue nothing else uses, and nobody waits on it.
 * The calls are made one at a time on purpose — a hundred at once is a rate limit at the far end,
 * and a vendor answering 429 to a retention sweep would leave rows unstamped for a reason that has
 * nothing to do with whether the copies are there.
 *
 * **What happens when the bound is spent is the same as for the other two purges, and nothing has
 * to be remembered.** The stamp this job writes is the leading column of the condition every batch
 * selects by, so a file already taken back is no longer in the set: there is no cursor to persist,
 * the next sweep asks the same question and gets the rows this one did not reach, and a job
 * redelivered by the queue re-deletes nothing.
 *
 * They are constants rather than environment keys for the reason the run purges' bounds are: a
 * development machine sweeping in different-sized batches from a live one would make the batching
 * untestable where it is written.
 */
module.exports = {
  PROVIDER_UPLOAD_PURGE_SWEEP: {
    PROVIDER_UPLOADED_FILE_COUNT_PER_BATCH: 100,
    MAXIMUM_BATCH_COUNT: 200,
  },
}
