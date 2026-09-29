import BaseAiRunJobDispatcher from '../../aiRun/jobs/BaseAiRunJobDispatcher.js'

import AppJobEngine from '../../queue/AppJobEngine.js'

import RunAssetMediaExtractionJobManifest from './RunAssetMediaExtractionJobManifest.js'

/**
 * Dispatches the job that carries out an asset-media-extraction run.
 *
 * **It extends this service's AI run dispatcher, and that is the whole of its retry policy.**
 * `BaseAiRunJobDispatcher` sets `attempts: 1` so that a model call is never retried automatically
 * — section 11's third acceptance criterion, which section 20 repeats in its own words: "the job
 * is not retried: a failed model call is reported, and the caller resubmits under a new
 * idempotency key". Restating the option here would be a second place for that rule to be changed
 * in, and the terminal-callback dispatcher — the one job in this service that must do the opposite
 * — says in its own words why it does not extend this class.
 *
 * **The engine is named here.** One engine configures both of this repository's processes — the
 * API server that enqueues and the daemon that consumes — so naming it is how this dispatcher
 * reaches the same Redis as the worker that answers it.
 *
 * **This class is what `AssetMediaExtractionPostRenderer.get:JobDispatcherCtor` answers with**, and
 * that is the whole of the wiring between the route and the queue: the renderer names the
 * dispatcher, `BaseAiRunPostRenderer` obtains it before it opens the run's transaction and hangs
 * the dispatch off that transaction's commit, so nothing leaves the process until the row the job
 * names is readable.
 */
export default class RunAssetMediaExtractionJobDispatcher extends BaseAiRunJobDispatcher {
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
   * @returns {typeof RunAssetMediaExtractionJobManifest} - The manifest.
   */
  static get ManifestCtor () {
    return RunAssetMediaExtractionJobManifest
  }
}
