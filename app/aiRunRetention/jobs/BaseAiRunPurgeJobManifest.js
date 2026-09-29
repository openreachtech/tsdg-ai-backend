import {
  BaseJobManifest,
} from '@openreachtech/renchan-job-bullmq'

/**
 * The body every scheduled purge is dispatched with, which is nothing.
 *
 * **It extends the framework's manifest rather than `BaseAiRunJobManifest`, and the two are not
 * interchangeable.** That class exists to state one thing: a job body is `{ aiRunId }`, because a
 * run's worker re-reads everything it needs from the row rather than carrying a copy of it. A
 * purge is not about a run. It is about every run past a horizon, and §19's background-jobs table
 * gives the payload of both purge rows as **none**. A manifest inheriting `{ aiRunId: Integer }`
 * would declare a field neither purge has any use for, and the first reader to meet it would
 * reasonably conclude a purge is dispatched per run — which is the opposite of what it is: one
 * sweep, selecting its own set from a horizon.
 *
 * **Why the empty schema is a written decision and not an omission.** `bodySchema` is abstract on
 * `BaseJobManifest`, so something had to be answered here. What `{}` buys is a real check rather
 * than a formality: `JobBody.as({})` accepts `{}` and **rejects `null`**, which matters because
 * `BaseJobSchedulerService.resolveScheduleInput()` substitutes `body: null` for a scheduler whose
 * id it finds no input for — so a schedule registered without a body is refused by this schema
 * instead of reaching the queue as a job carrying one. What `{}` deliberately does not buy is a
 * closed shape: the framework's normalization keeps undeclared keys, so a body dispatched with
 * extra fields still satisfies it. Nothing downstream reads one — `BaseAiRunPurgeJobWorker` takes
 * its instant from the clock and its horizon from the purger, and reads no field of the body at
 * all — so there is nothing for an extra key to reach.
 *
 * **Why the sweep's instant is not in the body, which is the trap this file exists to close.** A
 * repeatable job's template is written **once**, at registration, and every firing from then on
 * carries that same template. An instant put in the body would therefore be frozen at the moment
 * somebody ran the registration script, and every nightly sweep afterwards would select against a
 * horizon that never moved: the purge would clear the backlog once and then silently stop purging
 * anything, with the job still firing on time and still reporting success. The worker reads the
 * clock per execution for exactly this reason.
 *
 * **The queue name stays abstract.** One queue is one job directory, and §19 gives the two purges
 * two queues so that the daily sweep and the weekly one neither share a backlog nor scale
 * together. A concrete manifest names its queue; this class names only what both carry.
 *
 * Being abstract is also why this file sits outside `app/jobs/`: the daemon boots every worker it
 * finds there, and the scheduler service loads every scheduler, so the directory holds concrete
 * classes and nothing above them.
 *
 * @abstract
 */
export default class BaseAiRunPurgeJobManifest extends BaseJobManifest {
  /**
   * get: the schema the dispatched body is held to.
   *
   * @override
   * @returns {Record<string, *>} - The body schema.
   */
  static get bodySchema () {
    return {}
  }
}
