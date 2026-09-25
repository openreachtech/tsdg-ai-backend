import activate from '../sequelize/_.js'

import {
  JobWorkersDaemon,
} from '@openreachtech/renchan-job-bullmq'

import AppJobEngine from '../app/queue/AppJobEngine.js'

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
 * **There is no registration step, and `app/jobs/` being empty is not a mistake.** The scan is the
 * registration: a service that adds a job directory under that path is picked up with no file
 * edited here. No service has added one yet — the concrete job of a service belongs to that
 * service — so this daemon starts, listens on nothing, and is ready for the first one.
 */

await activate()

const daemon = await JobWorkersDaemon.createAsync({
  EngineCtor: AppJobEngine,
})

await daemon.startDaemon()
