import BaseAiRunJobManifest from '../../aiRun/jobs/BaseAiRunJobManifest.js'

/*
 * The queue this job's deliveries are taken from.
 *
 * Section 12 names it: the terminal callback's row of the background-jobs table gives the queue as
 * `deliver-run-callback`. The directory holding this file carries the same name, which is what the
 * framework's own convention asks — one queue is one job directory — and it is the name the daemon
 * logs on the line saying it is listening.
 */
const JOB_NAME = 'deliver-run-callback'

/**
 * The manifest of the job that posts a run's terminal callback.
 *
 * **It extends the AI run manifest, and that is a decision rather than a habit.** A manifest
 * carries two things: the queue's name and the shape of the body. Nothing about a retry, a time
 * limit or a run's lifecycle passes through it — those live in the dispatcher and in the worker,
 * which this job deliberately does not inherit from the AI run hierarchy. What is left is the body
 * shape, and this job's body is `{ aiRunId }` for exactly the reason section 11 gives for a run's:
 * everything the worker needs is re-read from the database, so a body can never disagree with the
 * record. A copy of that schema here would be a second place for it to be changed in.
 *
 * **What the body must not grow into.** The client's callback URL, its secret, the run's result:
 * each is a column this worker reads for itself, and each put in a body would be a value that goes
 * stale between the enqueue and the attempt — and would then sit in Redis, where a client's result
 * has no business being. The base's own test pins the schema at one field.
 */
export default class DeliverRunCallbackJobManifest extends BaseAiRunJobManifest {
  /**
   * get: the name of the queue this job is taken from.
   *
   * @override
   * @returns {string} - The queue name.
   */
  static get jobName () {
    return JOB_NAME
  }
}
