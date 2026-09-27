import BaseAiRunPurgeJobManifest from '../../aiRunRetention/jobs/BaseAiRunPurgeJobManifest.js'

/*
 * The queue this purge is taken from.
 *
 * §19 names it: the trace purge's row of the background-jobs table gives the queue as
 * `purge-expired-run-traces` — plural, where the content row is singular, and both are copied
 * exactly. The directory holding this file carries the same name, which is what the framework's
 * own convention asks, and it is the name the daemon logs on the line saying it is listening.
 */
const JOB_NAME = 'purge-expired-run-traces'

/**
 * The manifest of the job that deletes the decision trace of every run past the two-year horizon.
 *
 * It names its queue and nothing else. The empty body schema, and the argument for why a purge
 * carries no payload and in particular carries no instant, is `BaseAiRunPurgeJobManifest`'s.
 *
 * **Why this queue is not the content purge's.** §19 gives the two purges two queues, and a shared
 * one would couple them in the two ways that matter: a trace backlog would delay the nightly
 * content purge, which is the one bounded by a promise about personal data, and the two could not
 * be scaled or paused apart. Their batches are not comparable either — a trace batch deletes a
 * run's steps, its model calls and a field outcome per settled field, where a content batch writes
 * four columns.
 */
export default class PurgeExpiredRunTracesJobManifest extends BaseAiRunPurgeJobManifest {
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
