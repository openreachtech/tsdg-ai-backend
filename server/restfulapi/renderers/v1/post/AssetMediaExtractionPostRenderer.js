import AiRunRateLimitInspector from '../../../../../app/aiRun/AiRunRateLimitInspector.js'
import AI_RUN_CATEGORY_CONSTANT_HASH from '../../../../../app/constants/aiRunCategoryConstants.js'

import RunAssetMediaExtractionJobDispatcher from '../../../../../app/jobs/run-asset-media-extraction/RunAssetMediaExtractionJobDispatcher.js'

import BaseAiRunPostRenderer from '../../BaseAiRunPostRenderer.js'

const {
  AI_RUN_CATEGORY,
} = AI_RUN_CATEGORY_CONSTANT_HASH

const RATE_LIMIT_STATUS_CODE = 429

/**
 * Renderer: `POST /v1/asset-media-extractions`.
 *
 * **It is a live route the moment the engine boots.** The framework registers every renderer under
 * `renderers/v1/`, so this class answers the contract's one POST from the next start — behind the
 * engine's own `401` and `403`, because `get:passesFilter` is left at its inherited `false`.
 *
 * **What it does is accept, and the reading is the job's.** The idempotency pair, the request-body
 * digest, the transaction, the run key and the dispatch registered off the commit are all
 * `BaseAiRunPostRenderer`'s accept path, unaltered. A run leaves here `queued`, which is what the
 * contract fixes for the request that created one, and it is what the run actually is: nothing has
 * read a photo, and nothing in this file can.
 *
 * **The queue this route's runs go to is named in `get:JobDispatcherCtor`, and nowhere else.** The
 * abstract member stood unanswered for two checkpoints, with `#ensureJobDispatcher()` overridden to
 * hand the base a dispatcher that sent nothing, because naming a queue that did not exist would
 * have said it did. `run-asset-media-extraction` exists, so the constant and the override are gone
 * and the member is filled — which is the removal condition that override wrote down, met as
 * written rather than in part.
 *
 * **What the stub that stood here before that left behind.** It settled the run inside the request,
 * with a result body drawn from a digest of the request, because no worker existed to settle it and
 * §20's fourth use case wanted a whole suggestion screen demonstrable without one. That settling is
 * gone, and with it every `*Stub*` constant and member. A run accepted here is `queued`, and what
 * moves it is the job: the client's route to the answer is the terminal callback, or reading the
 * run back by its key.
 *
 * **[[Q123]]'s province stays read as a human-readable name, and the reading now shows nowhere.**
 * The stub wrote it into each field's `reason` line precisely so a client sending a code would see
 * the mismatch on its own demo screen. Nothing in this file writes a reason any more — the reason
 * is written where the reading happens, which is the job — so the obligation to keep that reading
 * loud travels with it rather than ending here. It has arrived there and is still unmet: the job
 * asks a model for the reason line, and nothing in this service inspects what came back for a
 * province that was sent as a code.
 *
 * **The rate limit is asked here, and it is asked first.** specs/1.0.0 §7 limits the run-creating
 * request per client, and §20's last criterion fixes what the limit has to be true of: the caller
 * is refused, "and no run is created and no model is called". This asks before the base has read
 * anything, written anything or reached for a queue, so both halves hold by construction —
 * `AiRunRateLimitInspector` counts the runs the client has already had accepted in the window, and
 * a caller over its figure is answered `429` with nothing else having happened.
 *
 * **What asking first costs, stated rather than left to be met.** A repeat of an idempotency key is
 * refused too while its client is over the limit, instead of being answered with the run that key
 * already named. §7's own sentence points the other way — the limit exists for "a thousand
 * different ones", not for a repeat — and the right place for the question is between the base's
 * idempotency lookup and its acceptance, where a repeat has already been answered. There is no hook
 * there, and the base is shared by every AI service's renderer; adding one is reported rather than
 * taken. The gap it leaves is narrow: the figure is roughly eighty times the busiest rate this
 * version foresees, so a caller retrying a request it never saw answered is not a caller near it.
 *
 * **`429` is not in the contract's refusal table.** That table fixes `401`, `403`, `404`, `409` and
 * `422`, and was written before this criterion had an implementation to describe. The status is the
 * one every client library already understands for this, and nothing else in the table means "come
 * back later"; reported as drift rather than resolved here, because the contract is the client's as
 * much as it is this service's.
 *
 * @extends {BaseAiRunPostRenderer}
 */
export default class AssetMediaExtractionPostRenderer extends BaseAiRunPostRenderer {
  /**
   * get: the route this renderer answers, under the engine's `/v1` prefix.
   *
   * @override
   * @returns {string} Route path.
   */
  static get routePath () {
    return '/asset-media-extractions'
  }

  /**
   * get: which AI service this renderer is.
   *
   * @override
   * @returns {{
   *   ID: number
   *   NAME: string
   *   DISPLAY_NAME: string
   *   DISPLAY_ORDER: number
   *   IS_ACTIVE: boolean
   * }} Run category.
   */
  static get aiRunCategory () {
    return AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION
  }

  /**
   * get: every refusal this route can answer with.
   *
   * The base's are every refusal a run-creating request shares; the one added here is this route's
   * own, because the criterion that asks for it is this feature's and this is the only route that
   * creates a run this version. A second AI service wanting the same limit declares it the same way
   * rather than finding it inherited from a service it has nothing to do with.
   *
   * @override
   * @returns {Record<string, RestfulApiType.ErrorResponseEnvelope>} Error structure hash.
   */
  static get errorStructureHash () {
    return {
      ...super.errorStructureHash,

      RateLimitExceeded: {
        statusCode: RATE_LIMIT_STATUS_CODE,
        errorMessage: 'Rate limit exceeded',
      },
    }
  }

  /**
   * get: the dispatcher of this service's own queue.
   *
   * **This is the member the whole worker checkpoint comes down to.** The base obtains the
   * dispatcher this names before it opens the run's transaction, builds the registrar from it and
   * hangs the dispatch off that transaction's commit - so naming the class here is the entirety of
   * the wiring between an accepted run and the queue that carries it out. Until
   * `run-asset-media-extraction` existed this was deliberately left inherited and unanswered, with
   * `#ensureJobDispatcher()` overridden so nothing ever asked it; both of those are gone, which is
   * the removal condition that override stated.
   *
   * @override
   * @returns {typeof RunAssetMediaExtractionJobDispatcher} Job dispatcher class.
   */
  static get JobDispatcherCtor () {
    return RunAssetMediaExtractionJobDispatcher
  }

  /**
   * Create the inspector answering whether a client may have another run accepted.
   *
   * @returns {AiRunRateLimitInspector} Inspector.
   */
  static createAiRunRateLimitInspector () {
    return AiRunRateLimitInspector.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof AssetMediaExtractionPostRenderer} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetMediaExtractionPostRenderer} */ (this.constructor)
  }

  /**
   * Answer the request, once the client is known to be within its rate limit.
   *
   * The limit is asked before anything of the base's runs, so a refused caller leaves no row, holds
   * no transaction and opens no queue connection. Everything after it is the base's accept path as
   * it stands.
   *
   * @override
   * @param {RestfulApiType.RenderInput<*, *>} params - Parameters.
   * @returns {Promise<RestfulApiType.RenderResponse>} Response.
   * @public
   */
  async render ({
    body,
    context,
    request,
  }) {
    const isWithinRateLimit = await this.isWithinRateLimit({
      context,
    })

    if (!isWithinRateLimit) {
      return this.errorResponseHash
        .RateLimitExceeded
        .createAsError()
    }

    return super.render({
      body,
      context,
      request,
    })
  }

  /**
   * Check whether the client this request resolved to may have another run accepted.
   *
   * The instant asked against is the request's own, so every question this request asks is asked at
   * one time — the same instant the run would be accepted at if it is.
   *
   * @param {{
   *   context: *
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether the client is within its limit.
   * @public
   */
  async isWithinRateLimit ({
    context,
  }) {
    const aiRunRateLimitInspector = this.Ctor.createAiRunRateLimitInspector()

    return aiRunRateLimitInspector.isWithinRateLimit({
      apiClientId: context.apiClientId,
      now: context.now,
    })
  }
}
