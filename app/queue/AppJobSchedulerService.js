import {
  BaseJobSchedulerService,
} from '@openreachtech/renchan-job-bullmq'

import PurgeExpiredRunContentCronJobScheduler from '../jobs/purge-expired-run-content/PurgeExpiredRunContentCronJobScheduler.js'
import PurgeExpiredRunTracesCronJobScheduler from '../jobs/purge-expired-run-traces/PurgeExpiredRunTracesCronJobScheduler.js'

/**
 * The one scheduler service this repository registers repeatable jobs through.
 *
 * **Why this file exists at all, when workers need no equivalent.** The daemon's folder scan is a
 * complete registration for a worker: a class found under `workersPath` is bound to its manifest's
 * queue and that is the whole of it. A schedule needs one thing a scan cannot supply — *when* —
 * and the framework asks for it here, through `collectScheduleInputs()`, which is abstract on
 * `BaseJobSchedulerService` and has to be answered by the application.
 *
 * **The schedulers themselves are still discovered, not listed.** `BaseJobSchedulerService` scans
 * the engine's `schedulersPath` for every `BaseJobScheduler` subclass and matches each against
 * this method's answer **by `schedulerId`**. So what is listed below is not "which schedulers
 * exist" — that is the scan's job — but "what each one's schedule is", and even that is only
 * relayed: each scheduler builds its own input, so a cron expression lives in the same file as the
 * scheduler it belongs to and a reader asking when the trace purge runs is not sent here.
 *
 * **What goes wrong when a scheduler is added and this method is not, which is the reason the
 * paragraph above matters.** The framework does not treat a missing input as an error.
 * `resolveScheduleInput()` substitutes `{ schedule: null, body: null, optionHash: null }`, and
 * `BaseJobScheduler#startSchedule()` then finds the request invalid and returns a response with no
 * job in it — throwing nothing, logging nothing. The registration script would finish, report
 * every scheduler started, and the new one would simply never fire. So: **a scheduler added under
 * `app/jobs/` must also be added here.** There is no scan that will catch the omission, and
 * `scripts/startJobSchedulers.js` inspects each response precisely so that this failure is visible
 * when it happens anyway: a response carrying no job is collected and thrown, because throwing is
 * the one reporting route a script has that neither the production-only logger nor the banned
 * `console` takes away.
 *
 * **It is not a second engine.** The engine is passed in by whichever script created the service;
 * this class holds only the schedule inputs.
 */
export default class AppJobSchedulerService extends BaseJobSchedulerService {
  /**
   * Collect what each of this repository's schedules is to be registered with.
   *
   * Each scheduler assembles its own input, so this method names the schedulers and relays their
   * answers rather than restating any cron expression.
   *
   * @override
   * @returns {Promise<Array<import(
   *   '../aiRunRetention/jobs/BaseAiRunPurgeCronJobScheduler.js'
   * ).AiRunPurgeScheduleInput>>} The schedule inputs.
   * @public
   */
  static async collectScheduleInputs () {
    const purgeExpiredRunContentInput = PurgeExpiredRunContentCronJobScheduler.buildScheduleInput()
    const purgeExpiredRunTracesInput = PurgeExpiredRunTracesCronJobScheduler.buildScheduleInput()

    return [
      purgeExpiredRunContentInput,
      purgeExpiredRunTracesInput,
    ]
  }
}
