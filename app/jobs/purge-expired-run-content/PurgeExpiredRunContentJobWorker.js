import BaseAiRunPurgeJobWorker from '../../aiRunRetention/jobs/BaseAiRunPurgeJobWorker.js'

import AiRunContentPurger from '../../aiRunRetention/AiRunContentPurger.js'

import PurgeExpiredRunContentJobManifest from './PurgeExpiredRunContentJobManifest.js'

/**
 * The worker that empties the content of every run past the thirty-day horizon.
 *
 * **It adds one method to the shared purge worker: which purger, and by which name.**
 * `AiRunContentPurger` answers `purgeExpiredAiRunContent()`, and the trace purger deliberately
 * answers something else — §7 asks for "two separate settings, never one", and two method names is
 * how that holds at the call site as well as in the constants. So the base stops one call short of
 * the purger and this class makes it.
 *
 * **What the purge itself does is not restated here.** `AiRunContentPurger` empties the four
 * things §7 counts as content across two tables, stamps `content_purged_at` last and inside the
 * same transaction, and sweeps in bounded batches with no cursor to carry. This file's whole
 * contribution is that the sweep happens nightly and outside the request path.
 *
 * **Being under `app/jobs/` is what makes it run.** The daemon loads every `BaseJobWorker`
 * subclass it finds there and binds each to its manifest's queue, with no registration step
 * anywhere — so this file is live from the daemon's next start. What is *not* automatic is the
 * schedule: nothing fires this queue until `scripts/startJobSchedulers.js` has been run once
 * against the same Redis.
 */
export default class PurgeExpiredRunContentJobWorker extends BaseAiRunPurgeJobWorker {
  /**
   * get: the manifest naming this worker's queue and body shape.
   *
   * @override
   * @returns {typeof PurgeExpiredRunContentJobManifest} The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredRunContentJobManifest
  }

  /**
   * get: the class that sweeps this job's set.
   *
   * @override
   * @returns {typeof AiRunContentPurger} The class.
   */
  static get AiRunPurgerCtor () {
    return AiRunContentPurger
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof PurgeExpiredRunContentJobWorker} The class.
   */
  get Ctor () {
    return /** @type {typeof PurgeExpiredRunContentJobWorker} */ (this.constructor)
  }

  /**
   * Sweep every run whose content has passed the thirty-day horizon.
   *
   * @override
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<import('../../aiRunRetention/AiRunContentPurger.js').AiRunPurgeSweepOutcome>}
   * What the sweep did, and whether it finished.
   * @public
   */
  async sweepExpiredAiRuns ({
    now,
  }) {
    return this.aiRunPurger.purgeExpiredAiRunContent({
      now,
    })
  }
}
