import BaseAiRunPurgeJobDispatcher from '../../aiRunRetention/jobs/BaseAiRunPurgeJobDispatcher.js'

import AppJobEngine from '../../queue/AppJobEngine.js'

import PurgeExpiredRunContentJobManifest from './PurgeExpiredRunContentJobManifest.js'

/**
 * Dispatches the job that empties the content of every run past the thirty-day horizon.
 *
 * **Nothing calls this — not the request path, and not the schedule either.** The queue it
 * configures is fed by `PurgeExpiredRunContentCronJobScheduler`, which upserts a repeatable job
 * against it through a `Queue` of its own; §19's whole reason for the purge being a job at all is
 * that "nothing requests it, and it reads far more rows than any request does". What this class
 * contributes is the producer-side default for a direct dispatch that does not exist yet — the
 * attempt count, the backoff and how many finished sweeps stay readable, as `QueueOptions`. A
 * schedule's template does **not** inherit them: `BaseAiRunPurgeCronJobScheduler` carries the same
 * four figures in the template itself, and that copy is the one every nightly firing reads. The
 * note on `BaseAiRunPurgeJobDispatcher.optionHash` has the chain.
 *
 * **The engine is named here.** One engine configures both of this repository's processes, so
 * naming it is how this queue reaches the same Redis as the daemon that consumes it and the
 * registration script that writes the schedule.
 */
export default class PurgeExpiredRunContentJobDispatcher extends BaseAiRunPurgeJobDispatcher {
  /**
   * get: the engine this dispatcher's queue is configured from.
   *
   * @override
   * @returns {typeof AppJobEngine} - The engine.
   */
  static get EngineCtor () {
    return AppJobEngine
  }

  /**
   * get: the manifest naming this dispatcher's queue and body shape.
   *
   * @override
   * @returns {typeof PurgeExpiredRunContentJobManifest} - The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredRunContentJobManifest
  }
}
