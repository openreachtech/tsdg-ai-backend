import BaseAiRunPurgeJobManifest from '../../aiRunRetention/jobs/BaseAiRunPurgeJobManifest.js'

/*
 * The queue this purge is taken from.
 *
 * §19 names it: the content purge's row of the background-jobs table gives the queue as
 * `purge-expired-run-content`. The directory holding this file carries the same name, which is
 * what the framework's own convention asks — one queue is one job directory — and it is the name
 * the daemon logs on the line saying it is listening.
 */
const JOB_NAME = 'purge-expired-run-content'

/**
 * The manifest of the job that empties the content of every run past the thirty-day horizon.
 *
 * It names its queue and nothing else. The empty body schema, and the argument for why a purge
 * carries no payload and in particular carries no instant, is `BaseAiRunPurgeJobManifest`'s.
 *
 * **Why this queue is not the trace purge's.** §19 gives the two purges two queues, and the reason
 * shows up the first night a backlog appears: the content sweep runs daily on a thirty-day
 * horizon, the trace sweep weekly on a seven-hundred-and-thirty-day one, and their batches are not
 * remotely the same size — a trace batch deletes a run's steps, its model calls and a field
 * outcome per settled field, where a content batch writes four columns. Sharing a queue would let
 * one job's backlog delay the other's firing, and would make the two impossible to scale apart.
 */
export default class PurgeExpiredRunContentJobManifest extends BaseAiRunPurgeJobManifest {
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
