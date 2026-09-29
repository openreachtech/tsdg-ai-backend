import BaseAiRunPurgeCronJobScheduler from '../../aiRunRetention/jobs/BaseAiRunPurgeCronJobScheduler.js'

import AppJobEngine from '../../queue/AppJobEngine.js'

import PurgeExpiredRunContentJobManifest from './PurgeExpiredRunContentJobManifest.js'

/*
 * The identity BullMQ stores this schedule under, and the one the registration script starts and
 * stops it by.
 *
 * It is the queue's own name because a schedule and a queue are one-to-one here — one repeatable
 * job feeding one queue — and because a second vocabulary would be a second thing to keep in step.
 * It is also, and less obviously, a value that must not be edited casually: BullMQ keys the
 * repeatable job by it, so changing this string does not rename the schedule. It registers a
 * second one, and leaves the first firing forever under a name the stop script no longer knows.
 */
const SCHEDULER_ID = 'purge-expired-run-content'

/*
 * When the content purge fires: 03:00, every day.
 *
 * **Daily is §19's own word**, and the reason it is not negotiable is §7: the content clock is
 * thirty days, and all four of the things §7 names as personal data are content — the asset's
 * field values, the media URLs, the suggested values and the subject label. The gap between a
 * run's thirtieth day and the sweep that reaches it is the amount by which this service over-keeps
 * personal data beyond what it promised, so it is a day, and a day is the coarsest a cron
 * expression can make it while still being called daily.
 *
 * **03:00 rather than midnight.** Midnight is where everything else in a system ends up — a day
 * boundary attracts aggregations, rotations and reports — and this job's cost lands on the same
 * database every other query uses. 03:00 is clear of that and of the evening the service is built
 * for; the non-functional section's volume is around a thousand runs a day, so a night's expiry is
 * around a thousand runs, comfortably inside the ten thousand one sweep can reach.
 *
 * The hour is a statement about the machine rather than about a country's night: see
 * `BaseAiRunPurgeCronJobScheduler` on `CronSchedule` carrying no timezone. Nothing rests on it —
 * the horizon is computed from the instant the sweep starts, not from the expression.
 */
const CRON_EXPRESSION = '0 3 * * *'

/**
 * Registers the repeatable job that fires the content purge nightly.
 *
 * **This class is the whole of what "a daily schedule" means in §19's table**, and without it the
 * worker beside it is a queue nobody ever posts to. The daemon's folder scan registers *workers*;
 * a schedule is written into Redis once, by `scripts/startJobSchedulers.js`, and survives restarts
 * of both processes because it lives in Redis rather than in either of them.
 *
 * **Why cron and not an interval.** "A daily schedule" is a calendar statement, and an interval is
 * not one: twenty-four hours after the last firing drifts against the clock every time the daemon
 * restarts, until the nightly purge is running in the middle of the afternoon. See
 * `BaseAiRunPurgeCronJobScheduler` for the rest of that argument.
 */
export default class PurgeExpiredRunContentCronJobScheduler extends BaseAiRunPurgeCronJobScheduler {
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
   * @returns {typeof PurgeExpiredRunContentJobManifest} The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredRunContentJobManifest
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
