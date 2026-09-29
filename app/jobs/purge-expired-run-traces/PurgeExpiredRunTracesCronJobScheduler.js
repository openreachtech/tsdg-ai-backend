import BaseAiRunPurgeCronJobScheduler from '../../aiRunRetention/jobs/BaseAiRunPurgeCronJobScheduler.js'

import AppJobEngine from '../../queue/AppJobEngine.js'

import PurgeExpiredRunTracesJobManifest from './PurgeExpiredRunTracesJobManifest.js'

/*
 * The identity BullMQ stores this schedule under, and the one the registration script starts and
 * stops it by.
 *
 * The queue's own name, for the reason its sibling gives: a schedule and a queue are one-to-one
 * here, and BullMQ keys the repeatable job by this string — so editing it does not rename the
 * schedule, it registers a second one and leaves the first firing forever under a name the stop
 * script no longer knows.
 */
const SCHEDULER_ID = 'purge-expired-run-traces'

/*
 * When the trace purge fires: 04:00 on Sunday, every week.
 *
 * **What §19's "a schedule on the longer horizon" had to be turned into, and the reasoning.** The
 * phrase is not a cron expression, and it is the one line of §19's table that needed deciding
 * rather than copying. Three readings were available.
 *
 * It cannot mean *every seven hundred and thirty days*. Cron cannot express it, and more to the
 * point it would be wrong: a run reaching its two-year horizon the day after a firing would wait
 * most of another two years to be purged, so the actual retention would be anywhere up to four
 * years against a stated two. A schedule keyed to the length of a horizon does not keep that
 * horizon; it doubles it.
 *
 * It could mean *daily*, like its sibling. That is not wrong — a daily sweep purges everything
 * past seven hundred and thirty days perfectly well — but it is not what §19 wrote. The table
 * gives the two jobs two different triggers, in the same document whose acceptance criterion is
 * that content and the trace are purged "on two separate settings, and never on one". Building
 * both as `0 3 * * *` would have made the triggers one.
 *
 * So it means *a longer cadence than daily*, and the remaining question is how much longer — which
 * `aiRunPurgeSweepConstants.cjs` answers arithmetically rather than by taste. One sweep reaches at
 * most fifty batches of two hundred runs, so ten thousand runs; §7's volume is around a thousand
 * runs a day, so around a thousand runs a day cross any horizon. **Weekly accumulates about seven
 * thousand runs between firings and clears them with room to spare. Monthly would accumulate about
 * thirty thousand and clear ten**, so the backlog would grow by twenty thousand runs every month
 * and the two-year promise would never be kept again — the job would report `isSweepExhausted:
 * false` forever and be working exactly as configured. Weekly is therefore not a preference; it is
 * the longest cadence the sweep bound actually sustains.
 *
 * **What the gap costs, and why it is affordable here but not for content.** A run can sit up to
 * seven days past the two-year horizon before a sweep reaches it. §7 is explicit that the decision
 * trace carries none of the personal data — all four of those things are content — so the trace
 * clock is a storage and operational promise rather than a promise about a person, and a week's
 * slack on it is under one percent. The content purge gets no such latitude, which is exactly why
 * it runs daily.
 *
 * **04:00 rather than 03:00, and this is the part that is easy to leave to chance.** The content
 * purge fires at 03:00 *every* day, Sundays included. Sharing the hour would mean that once a
 * week the heaviest sweep in the service starts in the same minute as the one bounded by a promise
 * about personal data — and a trace batch is the heavier of the two by a wide margin, deleting a
 * run's steps, its model calls and a field outcome per settled field where a content batch writes
 * four columns. An hour's separation is far more than a ten-thousand-run content sweep needs.
 *
 * The hour and the day are statements about the machine rather than about a country's week: see
 * `BaseAiRunPurgeCronJobScheduler` on `CronSchedule` carrying no timezone.
 */
const CRON_EXPRESSION = '0 4 * * 0'

/**
 * Registers the repeatable job that fires the trace purge weekly.
 *
 * **This class is the whole of what "a schedule on the longer horizon" means in §19's table**, and
 * the cron expression above carries the argument for the cadence. Without it the worker beside it
 * is a queue nobody ever posts to.
 *
 * **It is also half of an acceptance criterion.** "Content and the decision trace are purged on
 * two separate settings, and never on one" is kept in three independent places, and this is the
 * outermost: two constant files hold two horizons, two purgers expose two method names, and this
 * scheduler and its content sibling hold two cron expressions under two scheduler ids feeding two
 * queues. A change that collapsed any one pair would leave the other two still separate, which is
 * what makes the criterion hard to break by accident.
 */
export default class PurgeExpiredRunTracesCronJobScheduler extends BaseAiRunPurgeCronJobScheduler {
  /**
   * get: the engine this scheduler's queue is configured from.
   *
   * @override
   * @returns {typeof AppJobEngine} The engine.
   */
  static get EngineCtor () {
    return AppJobEngine
  }

  /**
   * get: the manifest naming this scheduler's queue and body shape.
   *
   * @override
   * @returns {typeof PurgeExpiredRunTracesJobManifest} The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredRunTracesJobManifest
  }

  /**
   * get: the identity BullMQ stores this schedule under.
   *
   * @override
   * @returns {string} The scheduler id.
   */
  static get schedulerId () {
    return SCHEDULER_ID
  }

  /**
   * get: the cron expression this purge fires on.
   *
   * @override
   * @returns {string} The cron expression.
   */
  static get cronExpression () {
    return CRON_EXPRESSION
  }
}
