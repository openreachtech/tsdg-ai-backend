import BaseAiRunPurgeJobWorker from '../../aiRunRetention/jobs/BaseAiRunPurgeJobWorker.js'

import AiRunTracePurger from '../../aiRunRetention/AiRunTracePurger.js'

import PurgeExpiredRunTracesJobManifest from './PurgeExpiredRunTracesJobManifest.js'

/**
 * The worker that deletes the decision trace of every run past the two-year horizon.
 *
 * **It adds one method to the shared purge worker: which purger, and by which name.**
 * `AiRunTracePurger` answers `purgeExpiredAiRunTraces()`, and the content purger deliberately
 * answers something else — §7 asks for "two separate settings, never one", and two method names is
 * how that holds at the call site as well as in the two constant files. A worker reaching for "the
 * purge" is exactly what neither name allows.
 *
 * **What the purge itself does is not restated here.** `AiRunTracePurger` deletes the rows §7
 * counts as the trace and stamps the run, sweeping in bounded batches with no cursor to carry.
 * This file's whole contribution is that the sweep happens weekly and outside the request path.
 *
 * **Being under `app/jobs/` is what makes it run.** The daemon loads every `BaseJobWorker`
 * subclass it finds there and binds each to its manifest's queue, with no registration step
 * anywhere. What is *not* automatic is the schedule: nothing fires this queue until
 * `scripts/startJobSchedulers.js` has been run once against the same Redis.
 */
export default class PurgeExpiredRunTracesJobWorker extends BaseAiRunPurgeJobWorker {
  /**
   * get: the manifest naming this worker's queue and body shape.
   *
   * @override
   * @returns {typeof PurgeExpiredRunTracesJobManifest} The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredRunTracesJobManifest
  }

  /**
   * get: the class that sweeps this job's set.
   *
   * @override
   * @returns {typeof AiRunTracePurger} The class.
   */
  static get AiRunPurgerCtor () {
    return AiRunTracePurger
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof PurgeExpiredRunTracesJobWorker} The class.
   */
  get Ctor () {
    return /** @type {typeof PurgeExpiredRunTracesJobWorker} */ (this.constructor)
  }

  /**
   * Sweep every run whose decision trace has passed the two-year horizon.
   *
   * @override
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<import('../../aiRunRetention/AiRunTracePurger.js').AiRunTracePurgeSweepOutcome>}
   * What the sweep did, and whether it finished.
   * @public
   */
  async sweepExpiredAiRuns ({
    now,
  }) {
    return this.aiRunPurger.purgeExpiredAiRunTraces({
      now,
    })
  }
}
