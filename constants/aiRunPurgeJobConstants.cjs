'use strict'

/*
 * What BullMQ does with one scheduled purge that does not go to plan, and how much of the history
 * it keeps.
 *
 * **Why the four figures are here rather than on either class that reads them.** They are read
 * twice, and the two readers are not interchangeable. `BaseAiRunPurgeCronJobScheduler` puts them
 * into the job template a schedule is upserted with, which is the template every firing of both
 * purges is produced from - so that is the copy that governs. `BaseAiRunPurgeJobDispatcher` puts
 * them into its queue's `defaultJobOptions`, which reach a job dispatched directly against that
 * queue and reach nothing else; no such producer exists in this repository today. Written twice,
 * the two would be two places for the weekly sweep's retry budget to be dropped from, and the copy
 * that drifted would be the one nobody tested. One file makes drift impossible for the values, and
 * leaves only the two shapes to be held together by a test.
 *
 * **ATTEMPT_COUNT is three, and the interesting number is the one it is not.**
 * `BaseAiRunJobDispatcher` sets `attempts: 1`, because §11's third criterion is that a model call
 * is never retried automatically. A purge is under no such rule, and inheriting that class would
 * have imposed it here by accident - which is why neither purge dispatcher extends it. Retrying a
 * sweep is safe in a way retrying a model call is not: a sweep is idempotent by construction,
 * because the stamp it writes is the leading column of the condition the next batch selects by, so
 * a run it already purged is no longer in the set. A second attempt re-purges nothing; it
 * continues.
 *
 * **Why retry at all, when the next firing would pick the work up anyway.** For the daily content
 * purge that argument nearly holds - a failed sweep costs a day. It does not hold for the trace
 * purge, which runs weekly: a sweep lost to a dropped connection would cost a week of not purging,
 * and the loss would be invisible, because a job that failed its only attempt leaves nothing behind
 * but a line in a log nobody is reading on a Sunday morning. Three attempts covers the failure a
 * scheduled batch actually meets, which is the database being briefly away - a restart, a failover,
 * a connection pool exhausted by something else on the machine.
 *
 * **Why not seven, as the terminal callback uses.** That budget is sized to a client's outage,
 * which the non-functional section calls tolerable up to an hour. This one is sized to a database
 * blip. A purge still trying an hour later would be holding a queue slot against a machine that has
 * a scheduled sweep of its own coming, and would be competing with it.
 *
 * **The backoff is exponential from five minutes**, so the three attempts span about a quarter of
 * an hour (five minutes, then ten). A database that is coming back is back inside that window; one
 * that is not is an outage the next scheduled firing meets on its own terms rather than one this
 * job should keep pressing against.
 *
 * **RETAINED_JOB_COUNT is where `isSweepExhausted` is read from, which is why it is bounded rather
 * than left alone.** BullMQ's default keeps every completed job forever, and a repeatable job is
 * the one shape where "forever" is a real number: a daily sweep is 365 records a year, each
 * carrying the result its worker returned. Keeping them unbounded would make the job that exists to
 * stop a store growing without limit the one thing in this service growing without limit.
 *
 * Ninety is chosen against the two cadences rather than as a round figure: it is a quarter of the
 * daily purge's firings and well over a year of the weekly one's, so in both cases an operator
 * asking "has the backlog been draining, or has every sweep come back unexhausted?" has enough
 * history in the queue to answer it without reaching for the log file. Failures are kept to the
 * same depth for the same reason.
 *
 * They are constants rather than environment keys for the reason the sweep bounds beside them are:
 * a development machine retrying on a different budget from a live one would make the budget
 * untestable where it is written.
 */
module.exports = {
  AI_RUN_PURGE_JOB: {
    ATTEMPT_COUNT: 3,
    BACKOFF_TYPE: 'exponential',
    BACKOFF_MILLISECOND_COUNT: 300000,
    RETAINED_JOB_COUNT: 90,
  },
}
