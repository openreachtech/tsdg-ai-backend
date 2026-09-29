import BaseAiRunPurgeJobDispatcher from '../../aiRunRetention/jobs/BaseAiRunPurgeJobDispatcher.js'

import AppJobEngine from '../../queue/AppJobEngine.js'

import PurgeExpiredRunTracesJobManifest from './PurgeExpiredRunTracesJobManifest.js'

/**
 * Dispatches the job that deletes the decision trace of every run past the two-year horizon.
 *
 * **Nothing calls this — not the request path, and not the schedule either.** The queue it
 * configures is fed by `PurgeExpiredRunTracesCronJobScheduler`, which upserts a repeatable job
 * against it through a `Queue` of its own. What this class contributes is the producer-side
 * default for a direct dispatch that does not exist yet; a scheduled firing reads the attempt
 * count out of the schedule's own template instead, which `BaseAiRunPurgeCronJobScheduler` fills
 * in. That the weekly sweep has a retry budget at all matters more here than it does for the
 * content purge — a sweep lost to a dropped connection costs a week of not purging, where a daily
 * one costs a day — which is exactly why the budget is stated where a firing reads it and not only
 * here.
 *
 * **The engine is named here.** One engine configures both of this repository's processes, so
 * naming it is how this queue reaches the same Redis as the daemon that consumes it and the
 * registration script that writes the schedule.
 */
export default class PurgeExpiredRunTracesJobDispatcher extends BaseAiRunPurgeJobDispatcher {
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
   * @returns {typeof PurgeExpiredRunTracesJobManifest} - The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredRunTracesJobManifest
  }
}
