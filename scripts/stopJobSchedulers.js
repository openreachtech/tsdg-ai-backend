import AppJobEngine from '../app/queue/AppJobEngine.js'
import AppJobSchedulerService from '../app/queue/AppJobSchedulerService.js'

/*
 * The one-shot script that removes this repository's repeatable jobs from Redis.
 *
 * **Why it exists when `startJobSchedulers.js` upserts.** An upsert covers a changed cron
 * expression and nothing else. It cannot reach a schedule whose `schedulerId` has been renamed or
 * whose scheduler class has been deleted, because BullMQ keys the record by that id and the new
 * code no longer names it — so the old schedule keeps firing, against a queue that may now have no
 * worker listening, and no amount of re-running the start script touches it. Retiring or renaming
 * a scheduler therefore means running **this** script first, while the old id is still in the
 * source, and the start script afterwards.
 *
 * **It stops the schedule and not the daemon.** Removing a repeatable job leaves the queue, its
 * worker and any job already enqueued exactly where they are; what stops is the clock producing
 * new ones. A purge that is mid-sweep when this runs finishes its sweep.
 *
 * **It stops every schedule this service knows, not a chosen one.** `BaseJobSchedulerService` also
 * offers `stopScheduler({ schedulerId })` for a single id; this script is the deployment-shaped
 * operation, and the pair it forms with the start script is the `setup` / `teardown` one. Re-run
 * the start script to bring them all back.
 *
 * **A failure is thrown, and success says nothing**, for the reason `startJobSchedulers.js` gives
 * at greater length: the application logger writes only in production, `console` is banned
 * outright, and an uncaught error is the one reporting mechanism a script is left with.
 */

const service = await AppJobSchedulerService.createAsync({
  EngineCtor: AppJobEngine,
})

const responses = await service.stopAllSchedulers()

const failedSchedules = responses
  .filter(response => response.hasError())
  .map(response => ({
    schedulerId: response.schedulerId,
    errorMessage: response.errorMessage,
  }))

if (failedSchedules.length > 0) {
  throw new Error(
    `Job schedulers not stopped: ${JSON.stringify(failedSchedules)}`
  )
}
