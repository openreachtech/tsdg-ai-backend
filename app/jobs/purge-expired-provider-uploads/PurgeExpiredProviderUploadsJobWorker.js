import BaseAiRunPurgeJobWorker from '../../aiRunRetention/jobs/BaseAiRunPurgeJobWorker.js'

import ProviderUploadedFilePurger from '../../aiRunRetention/ProviderUploadedFilePurger.js'

import PurgeExpiredProviderUploadsJobManifest from './PurgeExpiredProviderUploadsJobManifest.js'

const UNEXHAUSTED_SWEEP_MESSAGE = 'a scheduled purge stopped with files still at their provider'

const UNEXHAUSTED_SWEEP_TAGS = [
  'AiRunPurgeJob',
  'UnexhaustedSweep',
]

/**
 * The worker that asks each provider to delete the files this service handed it.
 *
 * **It is the third row of §19's background-jobs table and it shares the other two's worker base**,
 * because what a scheduled purge does is the same job in all three: read the clock once per
 * execution and hand that one instant down, ask the purger for a bounded sweep, say something when
 * the sweep did not reach the end of its set, put a few small numbers into the result the queue
 * keeps, and write the four queue hooks to the one log file an operator reads retention out of. The
 * argument for each of those is in `BaseAiRunPurgeJobWorker` and is not restated here.
 *
 * **What it overrides, and why exactly those two members.** The base counts a sweep in runs —
 * `purgedAiRunCount` — because the two purges it was written for select rows of `ai_runs`. This one
 * selects rows of `provider_uploaded_files`, and its outcome is counted in files. So the two
 * members that name that count are answered again here, and nothing else is. That the base's own
 * names still say "AiRun" is a seam worth being honest about rather than papering over: the
 * property holding the purger is `aiRunPurger` and the hook is `#sweepExpiredAiRuns()`, and neither
 * reads truthfully for this job. Renaming them is an edit to a class two other jobs derive from,
 * which is not this job's to make.
 *
 * **What the purge itself does is not restated here.** `ProviderUploadedFilePurger` decides which
 * files are ripe, routes each row to its own provider's driver, stamps only the copies it confirmed
 * gone, and stops early when a whole batch settled nothing. This file's whole contribution is that
 * the sweep happens nightly and outside the request path.
 *
 * **Being under `app/jobs/` is what makes it run.** The daemon loads every `BaseJobWorker` subclass
 * it finds there and binds each to its manifest's queue, with no registration step anywhere — so
 * this file is live from the daemon's next start. What is *not* automatic is the schedule: nothing
 * fires this queue until `scripts/startJobSchedulers.js` has been run once against the same Redis,
 * and the scheduler beside this file is registered only because
 * `AppJobSchedulerService.collectScheduleInputs()` names it.
 */
export default class PurgeExpiredProviderUploadsJobWorker extends BaseAiRunPurgeJobWorker {
  /**
   * get: the manifest naming this worker's queue and body shape.
   *
   * @override
   * @returns {typeof PurgeExpiredProviderUploadsJobManifest} The manifest.
   */
  static get ManifestCtor () {
    return PurgeExpiredProviderUploadsJobManifest
  }

  /**
   * get: the class that sweeps this job's set.
   *
   * @override
   * @returns {typeof ProviderUploadedFilePurger} The class.
   */
  static get AiRunPurgerCtor () {
    return ProviderUploadedFilePurger
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof PurgeExpiredProviderUploadsJobWorker} The class.
   */
  get Ctor () {
    return /** @type {typeof PurgeExpiredProviderUploadsJobWorker} */ (this.constructor)
  }

  /**
   * Sweep every file whose time at its provider is up.
   *
   * The base's hook is named for a run because the two purges it was written for sweep runs; what
   * this job sweeps is the egress record, and the purger it reaches is named accordingly. One call,
   * and the instant the base read is the one handed down.
   *
   * @override
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<import(
   *   '../../aiRunRetention/ProviderUploadedFilePurger.js'
   * ).ProviderUploadPurgeSweepOutcome>} What the sweep did, and whether it finished.
   * @public
   */
  async sweepExpiredAiRuns ({
    now,
  }) {
    return this.aiRunPurger.purgeExpiredProviderUploadedFiles({
      now,
    })
  }

  /**
   * Report that a sweep stopped with files still sitting at their provider.
   *
   * A warning rather than an error, for the reason the base gives: an error in this file means a
   * sweep did not run, and a warning means a sweep ran and could not reach the end of its set. Here
   * it carries one extra meaning the other two purges have no equivalent of — a sweep also stops
   * when a whole batch settled nothing, which is what a provider that cannot be reached at all
   * looks like from up here. Both arrive as this line, and the per-row reason is already in the
   * same log file, written by the purger as it happened.
   *
   * The counts are written and nothing else is. A vendor's handle here would name a file in a log
   * that outlives the job that took it back.
   *
   * @override
   * @param {{
   *   outcome: import(
   *     '../../aiRunRetention/ProviderUploadedFilePurger.js'
   *   ).ProviderUploadPurgeSweepOutcome
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  reportUnexhaustedSweep ({
    outcome,
  }) {
    this.Ctor.mentsuLogger.warn({
      message: `${this.Ctor.name} ${UNEXHAUSTED_SWEEP_MESSAGE}: purgedFileCount ${outcome.purgedFileCount}, batchCount ${outcome.batchCount}`,
      tags: UNEXHAUSTED_SWEEP_TAGS,
    })

    return null
  }

  /**
   * Build what this sweep reports back to the queue.
   *
   * Four small values, and the queue keeps a bounded run of them, so that "has the backlog been
   * draining?" is answerable from the last ninety firings rather than from the one in front of
   * whoever is looking. For this job the run of ninety answers one more question the other two
   * cannot pose: a provider that has been refusing every delete shows up as ninety nights of
   * `purgedFileCount: 0`.
   *
   * The instant is written as text because it is going into Redis, where a `Date` would arrive back
   * as whatever the serializer made of it.
   *
   * @override
   * @param {{
   *   now: Date
   *   outcome: import(
   *     '../../aiRunRetention/ProviderUploadedFilePurger.js'
   *   ).ProviderUploadPurgeSweepOutcome
   * }} params - Parameters.
   * @returns {ProviderUploadPurgeJobResult} The result.
   * @public
   */
  buildAiRunPurgeJobResult ({
    now,
    outcome,
  }) {
    const sweptAt = now.toISOString()

    return {
      sweptAt,
      purgedFileCount: outcome.purgedFileCount,
      batchCount: outcome.batchCount,
      isSweepExhausted: outcome.isSweepExhausted,
    }
  }
}

/**
 * @typedef {{
 *   sweptAt: string
 *   purgedFileCount: number
 *   batchCount: number
 *   isSweepExhausted: boolean
 * }} ProviderUploadPurgeJobResult
 */
