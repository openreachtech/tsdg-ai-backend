import BaseAiRunPurgeJobDispatcher from '../../aiRunRetention/jobs/BaseAiRunPurgeJobDispatcher.js'

import AppJobEngine from '../../queue/AppJobEngine.js'

import PurgeExpiredProviderUploadsJobManifest from './PurgeExpiredProviderUploadsJobManifest.js'

/**
 * Dispatches the job that asks each provider to delete the files it was handed.
 *
 * **Nothing calls this — not the request path, and not the schedule either.** The queue it
 * configures is fed by `PurgeExpiredProviderUploadsCronJobScheduler`, which upserts a repeatable
 * job against it through a `Queue` of its own; §19's reason for this purge being a job at all is
 * that "it calls a provider to delete what was uploaded, which is an outbound call nobody is
 * waiting on". What this class contributes is the producer-side default for a direct dispatch that
 * does not exist yet — the attempt count, the backoff and how many finished sweeps stay readable,
 * as `QueueOptions`. A schedule's template does **not** inherit them:
 * `BaseAiRunPurgeCronJobScheduler` carries the same four figures in the template itself, and that
 * copy is the one every firing reads. The note on `BaseAiRunPurgeJobDispatcher.optionHash` has the
 * chain.
 *
 * **Retrying this sweep is as safe as retrying the other two, and for one more reason.** The stamp
 * it writes is the leading column of the condition every batch selects by, so a second attempt
 * re-asks about nothing already taken back; and asking a vendor to delete a handle it no longer
 * holds settles the same answer as the first time rather than doing anything a second time.
 *
 * **The engine is named here.** One engine configures both of this repository's processes, so
 * naming it is how this queue reaches the same Redis as the daemon that consumes it and the
 * registration script that writes the schedule.
 */
export default class PurgeExpiredProviderUploadsJobDispatcher extends BaseAiRunPurgeJobDispatcher {
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
   * @returns {typeof PurgeExpiredProviderUploadsJobManifest} - The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredProviderUploadsJobManifest
  }
}
