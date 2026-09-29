import activate from '../sequelize/_.js'

import {
  JobWorkersDaemon,
} from '@openreachtech/renchan-job-bullmq'

import AppJobEngine from '../app/queue/AppJobEngine.js'
import JobScheduleRegistrationInspector from '../app/queue/JobScheduleRegistrationInspector.js'

/*
 * The second of this service's two long-lived processes, and the one that does the work.
 *
 * The API server accepts a run, writes it, and enqueues its job once the writing transaction has
 * committed; this process consumes that queue. They are separate processes so that a run calling a
 * model — which the non-functional section gives 300 seconds — cannot hold a request open, and so
 * that the consumers can be scaled without scaling the API. `pm2.config.cjs` runs both, and both
 * read one Redis through `AppJobEngine`.
 *
 * **Sequelize is activated first, and that ordering is load-bearing.** A worker's whole lifecycle
 * is database writes — claiming the run running, recording its one terminal state — so the models
 * have to be usable before a queue is listening, not merely before the first job arrives.
 *
 * **`createAsync({ EngineCtor })` is the boot path, and it is the one the installed package has.**
 * It builds the engine, scans the engine's `workersPath` for every `BaseJobWorker` subclass, and
 * hands them to the daemon; `startDaemon()` then opens each worker's queue, waits until it is
 * ready, and attaches the SIGINT/SIGTERM handlers that tear every worker down again. The other
 * boot path described in the equipped skill — building a `SubscriptionBroker` and passing it to
 * `Engine.createAsync({ subscriptionBroker })` — does not exist in `@openreachtech/renchan-job-bullmq`
 * 1.1.3 (recorded as Q87), and would be the wrong shape here regardless: nothing in this service
 * subscribes, because a run reports its outcome by posting a callback rather than by publishing
 * progress.
 *
 * **There is no registration step for a worker.** The scan is the registration: a service that
 * adds a job directory under that path is picked up with no file edited here. Four have done so —
 * `deliver-run-callback`, `run-asset-media-extraction` and retention's two purges — and none
 * required a line in this file, which is the whole of what the scan buys. The concrete job of a
 * service belongs to that service, so this file names none of them and stays correct as more
 * arrive.
 *
 * **A schedule is not covered by that, and the difference shows up at deployment.** Retention's
 * two purges are started by a clock rather than by a request, and a repeatable job lives in Redis
 * rather than in either process. The scan here binds their workers to their queues, so this daemon
 * reports itself listening on both — but nothing will ever post to them until
 * `scripts/startJobSchedulers.js` has been run once against the same Redis. A daemon listening on
 * a purge queue has never been evidence that the purge is running, and until the check below
 * existed nothing else was either: the queues read green and empty whether the schedule is there
 * or not, and the purge log is silent both when a sweep is working and when no sweep has ever
 * run. For §7's two retention horizons that is the worst shape a gap can take — personal data
 * kept indefinitely while every visible signal reads healthy.
 *
 * **So this process now asks Redis what it holds, and names the declared schedules it does not.**
 * `JobScheduleRegistrationInspector` runs once, after the workers are up, and compares
 * `AppJobSchedulerService.collectScheduleInputs()` — the same list the registration script
 * registers from, held to the folder scan by a test — against the schedules read back off each
 * scheduler's queue. It reports by scheduler id and returns. It throws nothing, on any path: a
 * Redis that refuses the read or never answers is reported too, because this process also serves
 * callback delivery and asset media extraction, and a missing purge schedule is no reason to take
 * those down. **It is a production control and not a development one** — `@openreachtech/mentsu-logger`
 * writes nothing when `NODE_ENV` is anything but `production`, so booting this daemon locally with
 * no schedules registered still shows nothing. `npm run schedulers:start` is still the step that
 * registers them; what changed is that skipping it is now visible rather than silent.
 *
 * **The other half of that sentence: the path is the only thing between a file and being run at
 * boot.** Every `BaseJobWorker` subclass the scan finds under `workersPath` is instantiated and
 * bound to a queue, with nothing asking whether it was meant to be — no allow-list, no naming
 * rule, no per-file opt-in. What makes that safe here is only that the directory is part of this
 * repository and arrives through review like any other source: a `.js` file landing in it by any
 * other route — a build step writing there, a dependency installing into it, a deployment
 * unpacking an archive over it — is a file this process will execute. That is the framework's
 * design and this note is not a complaint about it; it is what a reader has to know before
 * treating `app/jobs/` as an ordinary directory.
 */

await activate()

const daemon = await JobWorkersDaemon.createAsync({
  EngineCtor: AppJobEngine,
})

await daemon.startDaemon()

const jobScheduleRegistrationInspector = JobScheduleRegistrationInspector.create({
  engine: daemon.engine,
})

await jobScheduleRegistrationInspector.inspectRegisteredSchedules()
