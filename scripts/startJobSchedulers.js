import AppJobEngine from '../app/queue/AppJobEngine.js'
import AppJobSchedulerService from '../app/queue/AppJobSchedulerService.js'

/*
 * The one-shot script that writes this repository's repeatable jobs into Redis.
 *
 * **Why a script and not a third long-lived process.** A schedule is a record in Redis, not a
 * running thing: `queue.upsertJobScheduler()` writes it once, and BullMQ produces a job from it at
 * each firing for as long as the record exists. It therefore survives restarts of both of this
 * repository's processes — the API server and the job daemon — and needs neither of them to be up
 * in order to be written. `pm2.config.cjs` runs the two processes that have to stay up, and
 * deliberately does not run this.
 *
 * **How it is reached, and where that is written down.** `npm run schedulers:start`, with
 * `npm run schedulers:stop` as its pair; the README's command table lists both, and its note under
 * that table is what tells a deployer the step exists at all. Nothing else names this file — not
 * `pm2.config.cjs`, deliberately, because a schedule is a record rather than a process — so a
 * script added here that is named in neither place is a step nobody outside the source can know
 * to take.
 *
 * **When to run it.** Once at deployment, and again after any change to a scheduler's cron
 * expression. `upsertJobScheduler` is an upsert keyed by `schedulerId`, so re-running is safe and
 * is how a changed expression is applied — but only for an id that has not itself changed. Editing
 * a `schedulerId` registers a *second* schedule and orphans the first, which then fires forever
 * under a name nothing knows. `stopJobSchedulers.js` is the way back, and it has to be run under
 * the old id, before the rename.
 *
 * **Sequelize is deliberately not activated.** Nothing here reaches the database: this script
 * talks to Redis and exits. The workers it registers schedules for do reach it, and
 * `scripts/startJobDaemon.js` activates Sequelize for them.
 *
 * **The framework does not throw when a schedule fails to register, which is why this script
 * inspects every response rather than trusting that it returned.** A scheduler whose id
 * `AppJobSchedulerService.collectScheduleInputs()` supplies no input for is given a substituted
 * `{ schedule: null, body: null }`, which fails validation, and `startSchedule()` then returns a
 * response carrying neither a job nor an error. Left unexamined, that reads exactly like success:
 * the script would exit 0 having registered nothing, and the omission would surface weeks later as
 * a purge that had never once run. So every response that carries no job is collected, whether it
 * was refused before it was sent or failed after, and the script ends by throwing them.
 *
 * **A failure is thrown, and success says nothing.** Neither of the two obvious ways to report an
 * outcome is open here: this repository's structured logger writes to a dated file under `logs/`
 * and — see `BaseAiRunPurgeJobWorker` — is silent outside production, which is exactly the
 * environment a deployer runs this from; and `console` is banned by the lint configuration, along
 * with any local exception to it. What is left is the mechanism the runtime already gives a
 * script: an uncaught error goes to stderr and exits non-zero. So the schedules that did not
 * register go into the thrown message, and a silent exit 0 means every one of them did.
 *
 * **That asymmetry is the right way round rather than a concession.** The fact worth carrying is
 * which schedule is missing, and it only exists on the failing path; a list printed on success is
 * read once and then never again, while the silence is what makes the failure legible.
 */

const service = await AppJobSchedulerService.createAsync({
  EngineCtor: AppJobEngine,
})

const responses = await service.startAllSchedulers()

const unregisteredSchedules = responses
  .filter(response => !response.hasResponse())
  .map(response => ({
    schedulerId: response.request.schedulerId,
    isAborted: response.isAborted(),
    errorMessage: response.errorMessage,
  }))

if (unregisteredSchedules.length > 0) {
  throw new Error(
    `Job schedulers not registered: ${JSON.stringify(unregisteredSchedules)}`
  )
}
