import BaseAiRunPurgeCronJobScheduler from '../../aiRunRetention/jobs/BaseAiRunPurgeCronJobScheduler.js'

import AppJobEngine from '../../queue/AppJobEngine.js'

import PurgeExpiredProviderUploadsJobManifest from './PurgeExpiredProviderUploadsJobManifest.js'

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
const SCHEDULER_ID = 'purge-expired-provider-uploads'

/*
 * When the provider-upload purge fires: 05:00, every day.
 *
 * **Daily is §19's own word for this row**, and the reason it is not looser is that the clock this
 * job acts on is mostly not ours. A file becomes ripe the moment its provider's stated expiry
 * passes; the gap between that moment and the sweep that reaches it is time a copy of somebody's
 * photographs sits at a vendor that has said it is past keeping it. A day is the coarsest that gap
 * can be while the schedule is still daily.
 *
 * **05:00 rather than 03:00 or 04:00, and the two hours before it are the reason.** The content
 * purge fires at 03:00 and the weekly trace purge at 04:00 on Sundays, and both of them are
 * database work whose cost lands on every other query. This sweep is upwards of an hour of waiting
 * on somebody else's HTTP — a different cost entirely, which is why it has a queue of its own — but
 * starting it while either of those is still running would have three retention sweeps in flight at
 * once on a Sunday morning, and would make a slow night in one of them hard to tell apart from a
 * slow night in another. 05:00 is clear of both and still well inside the quiet hours.
 *
 * The hour is a statement about the machine rather than about a country's night: see
 * `BaseAiRunPurgeCronJobScheduler` on `CronSchedule` carrying no timezone. Nothing rests on it —
 * every horizon is computed from the instant the sweep starts, not from the expression.
 */
const CRON_EXPRESSION = '0 5 * * *'

/**
 * Registers the repeatable job that fires the provider-upload purge nightly.
 *
 * **This class is the whole of what "a daily schedule" means in §19's third row**, and without it
 * the worker beside it is a queue nobody ever posts to. The daemon's folder scan registers
 * *workers*; a schedule is written into Redis once, by `scripts/startJobSchedulers.js`, and
 * survives restarts of both processes because it lives in Redis rather than in either of them.
 *
 * **It must also be added to `AppJobSchedulerService.collectScheduleInputs()`**, and a scheduler
 * missing from there registers nothing while the registration script reports success — that class
 * states the failure in full. This is the one wiring step a folder scan does not cover.
 *
 * **Why cron and not an interval.** "A daily schedule" is a calendar statement, and an interval is
 * not one: twenty-four hours after the last firing drifts against the clock every time the daemon
 * restarts, until the nightly purge is running in the middle of the afternoon. See
 * `BaseAiRunPurgeCronJobScheduler` for the rest of that argument.
 */
export default class PurgeExpiredProviderUploadsCronJobScheduler extends BaseAiRunPurgeCronJobScheduler {
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
   * @returns {typeof PurgeExpiredProviderUploadsJobManifest} The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredProviderUploadsJobManifest
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
