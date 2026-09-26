import BaseAiRunJobManifest from '../../aiRun/jobs/BaseAiRunJobManifest.js'

/*
 * The queue this job's deliveries are taken from.
 *
 * Section 20 names it: the background-jobs table gives the queue as `run-asset-media-extraction`,
 * and says why it is a queue of its own — "this is the heaviest operation the version has, and it
 * holds a queue of its own so it can be scaled alone". The directory holding this file carries the
 * same name, which is what the framework's own convention asks — one queue is one job directory —
 * and it is the name the daemon logs on the line saying it is listening.
 */
const JOB_NAME = 'run-asset-media-extraction'

/**
 * The manifest of the job that carries out an asset-media-extraction run.
 *
 * **The body shape is inherited and not restated.** Section 11 fixes a run job's payload as
 * `{ aiRunId }` and section 20's own table repeats it, for the reason `BaseAiRunJobManifest` gives:
 * everything the worker needs is re-read from the database, so a body can never disagree with the
 * record. The field schema, the media list and the caller's signature are all columns of the run
 * this job names; a copy of any of them in the body would go stale between the enqueue and the
 * execution, and would sit in Redis besides.
 *
 * **The queue name is the only thing this class adds**, because it is the only thing about a
 * manifest that a service decides for itself.
 */
export default class RunAssetMediaExtractionJobManifest extends BaseAiRunJobManifest {
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
