import AiRunWorkFailure from '../../aiRun/AiRunWorkFailure.js'

import BaseAiRunJobWorker from '../../aiRun/jobs/BaseAiRunJobWorker.js'

import AssetMediaExtractionRunner from '../../assetMediaExtraction/AssetMediaExtractionRunner.js'

import RunAssetMediaExtractionJobManifest from './RunAssetMediaExtractionJobManifest.js'

/**
 * The worker that carries out an asset-media-extraction run.
 *
 * **What it adds to the run's lifecycle is the work, and nothing else.**
 * `BaseAiRunJobWorker` claims the run running, races it against the 300-second limit, records
 * exactly one terminal state, raises the terminal callback and removes the run's workspace on the
 * way out. §11 leaves the body of work to the service, and this class is where this service fills
 * it in: `#executeAiRunWork()` hands the run to `AssetMediaExtractionRunner` and answers with the
 * body it settled.
 *
 * **Being under `app/jobs/` is what makes it run.** The daemon loads every `BaseJobWorker`
 * subclass it finds under the engine's `workersPath` and binds each to its manifest's queue, with
 * no registration step anywhere — so this file is live from the daemon's next start, listening on
 * `run-asset-media-extraction`.
 *
 * **The runner is built per delivery and this class adds no state of its own.** A worker is one
 * long-lived instance per queue, so anything it held would be shared by every run in the queue at
 * once; a runner built for one delivery is one run's worth of collaborators and nothing else. What
 * must not happen per run - the scan of the driver directory - is pooled against the process by
 * `AiAgentModelBindingFinder`, which says so in its own words, so building a runner costs nothing
 * a run would notice.
 *
 * **A failure the run knew the reason for is read back off the failure it raised.** The base asks
 * `#extractAiRunFailureReasonCode()` what to record a thrown failure as, and answers
 * `PROVIDER_CALL_FAILED` for a job that has not classified its own — which is the truthful answer
 * for a driver that threw, and the wrong one for a run refused by its media step. An
 * `AiRunWorkFailure` carries the code that step already decided, and this class reads it; anything
 * else thrown falls through to the base's answer, which is what that member is documented for.
 *
 * **The run's own work honours the cancellation signal at two boundaries and neither of them is
 * here.** The media fetch stops between media and the readings stop between readings, each saying
 * so in its own words. This class passes the signal down untouched.
 */
export default class RunAssetMediaExtractionJobWorker extends BaseAiRunJobWorker {
  /**
   * get: the manifest naming this worker's queue and body shape.
   *
   * @override
   * @returns {typeof RunAssetMediaExtractionJobManifest} - The manifest.
   */
  static get ManifestCtor () {
    return RunAssetMediaExtractionJobManifest
  }

  /**
   * get: the class that runs the six steps of one run.
   *
   * @returns {typeof AssetMediaExtractionRunner} - The class.
   */
  static get AssetMediaExtractionRunnerCtor () {
    return AssetMediaExtractionRunner
  }

  /**
   * get: the class an `AiRunWorkFailure` is recognized by.
   *
   * Reached through a getter rather than named inside the member that tests for it, so that the
   * one place this worker asks what a failure is is named once and a test can state something else
   * in its place.
   *
   * @returns {typeof AiRunWorkFailure} - The class.
   */
  static get AiRunWorkFailureCtor () {
    return AiRunWorkFailure
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof RunAssetMediaExtractionJobWorker} - The class.
   */
  get Ctor () {
    return /** @type {typeof RunAssetMediaExtractionJobWorker} */ (this.constructor)
  }

  /**
   * Do the work of one run, and answer the body it settled.
   *
   * The body it is handed carries the manifest's declared fields and nothing else, which for this
   * job is the run's id alone — guaranteed by the base rather than by what a caller happened to
   * enqueue. Everything else the run needs is read from the row the id names.
   *
   * No status is written here and no clock is read for one: the run's statuses are the base's, and
   * a job that wrote one could produce the second terminal state §11's fifth criterion rules out.
   *
   * @override
   * @param {import('../../aiRun/jobs/BaseAiRunJobWorker.js').AiRunWorkParams} params - Parameters.
   * @returns {Promise<string>} The body the run settled.
   * @public
   */
  async executeAiRunWork ({
    body,
    context,
    parcel,
    signal,
  }) {
    const aiRunId = this.extractAiRunId({
      body,
    })

    const assetMediaExtractionRunner = this.createAssetMediaExtractionRunner()

    return assetMediaExtractionRunner.runAssetMediaExtraction({
      aiRunId,
      signal,
    })
  }

  /**
   * Create the runner of the six steps of one run.
   *
   * @returns {AssetMediaExtractionRunner} The runner.
   * @public
   */
  createAssetMediaExtractionRunner () {
    return this.Ctor.AssetMediaExtractionRunnerCtor.create()
  }

  /**
   * Extract the reason code a thrown failure is recorded under.
   *
   * A run refused by one of its own steps already carries the code that step decided — the media
   * step answers a refusal with one of `MEDIA_LIMIT_EXCEEDED`, `MEDIA_UNSUPPORTED`,
   * `MEDIA_UNREADABLE` or `MEDIA_FETCH_FAILED`, and the run raises an `AiRunWorkFailure` carrying
   * it. Reading it back here is what makes those four of §20's acceptance criteria true of a run
   * end to end, without this class deciding any of them a second time.
   *
   * Anything else thrown is a failure nobody classified — a driver that raised, a row that could
   * not be read — and falls through to the base's `PROVIDER_CALL_FAILED`, which is what that member
   * is documented to be for.
   *
   * @override
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {string} The reason code.
   * @public
   */
  extractAiRunFailureReasonCode ({
    error,
  }) {
    if (!this.isAiRunWorkFailure({
      error,
    })) {
      return super.extractAiRunFailureReasonCode({
        error,
      })
    }

    return error.failureReasonCode
  }

  /**
   * Extract the parameters the reason code names.
   *
   * §20's fifteenth acceptance criterion is that a request carrying more photos than the limit is
   * refused "with the limit named in the reason's parameters", and `MEDIA_LIMIT_EXCEEDED` is the
   * one of the seven codes the client contract says carries parameters at all. The step that
   * refuses already builds them; this is where they are read back off the failure it raised.
   *
   * **`BaseAiRunJobWorker#buildAiRunWorkOutcome()` asks this**, and the field is plumbed from
   * there to `AiRunStatusRecorder#saveFailedAiRunOnce()`, so what this answers is what the row
   * records. The base wrote `failureParameters: null` with no hook to answer otherwise until
   * `#extractAiRunFailureParameters()` was added beside the reason-code hook; its own default
   * still answers null, which is correct for the six codes whose contract entry names none.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The parameters, or null when the failure names none.
   * @public
   */
  extractAiRunFailureParameters ({
    error,
  }) {
    if (!this.isAiRunWorkFailure({
      error,
    })) {
      return null
    }

    return error.failureParameters
  }

  /**
   * Check whether a thrown failure is one this service raised knowing why.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {boolean} Whether the failure carries a reason of its own.
   * @public
   */
  isAiRunWorkFailure ({
    error,
  }) {
    return error instanceof this.Ctor.AiRunWorkFailureCtor
  }
}
