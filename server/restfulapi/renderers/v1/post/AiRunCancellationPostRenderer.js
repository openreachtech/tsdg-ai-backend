import {
  BasePostRenderer,
  RestfulApiResponse,
} from '@openreachtech/renchan'

import AiRunCancellationRegistrar from '../../../../../app/aiRun/AiRunCancellationRegistrar.js'

const ACCEPTED_STATUS_CODE = 202

const NOT_FOUND_STATUS_CODE = 404

/**
 * Renderer: `POST /v1/ai-runs/:runKey/cancellations`.
 *
 * **It creates a cancellation, and it does not create a run** — which is why it extends
 * `BasePostRenderer` and not `BaseAiRunPostRenderer`. That base is the accept path every AI
 * service's run-creating route shares: an idempotency pair, a request-body digest, a run category,
 * a queue to dispatch into and a transaction to hang the dispatch off. This route has none of
 * those. It reads a run key out of the path, and the contract says its body is empty — so
 * inheriting an accept path would mean inheriting refusals this route cannot raise (a missing
 * `Idempotency-Key`, a body mismatch) and abstract members it has no honest answer for.
 *
 * **Which is also why it asks for no `Idempotency-Key`.** The contract requires that header on
 * "every POST that creates a run", and this POST creates none. What would have been the header's
 * job is done by the shape of the resource instead: asking twice creates nothing the second time,
 * because the run either has a cancellation recorded against it or does not.
 *
 * **`202` on every answer this route accepts, first ask or fifth.** Nothing has been created that
 * the caller can go and fetch — there is no cancellation resource to read back — and what the
 * caller asked for does not take effect at the moment of asking: a run stops at its next step
 * boundary. That is the same reading the contract already wrote down for the run-creating route,
 * `202` "rather than `201`", and its second line settles the repeat: a repeat "is not `200`",
 * because a caller cannot tell from a status whether this was the first request or the fifth and
 * does not need to. A run that had already reached a terminal state is answered the same way, for
 * the same reason — §15's fifth criterion asks for that run's state back "rather than an error it
 * has to handle", and the state travels in `statusName`, where the caller reads it.
 *
 * **One refusal, and it is the same one `GET /v1/ai-runs/:runKey` makes.** A run key naming no run
 * of this client is `404` whether the key names nothing at all or names somebody else's run. The
 * registrar takes the client into the `where` of its own read, so this class cannot tell those two
 * apart, and `403` is deliberately not answered: a refusal that admitted the run existed would
 * confirm another client's data. That run is also left untouched, because it was never loaded.
 *
 * **It declares nothing about who may call it.** `get:passesFilter` stays at its inherited
 * `false`, so a caller that is not who it claims meets the engine's `401` and a client whose
 * record is switched off meets its `403`, both before this class is reached. What is left for this
 * route to enforce is ownership, and that is the registrar's `where`.
 *
 * @extends {BasePostRenderer<*, *>}
 */
export default class AiRunCancellationPostRenderer extends BasePostRenderer {
  /**
   * get: the route this renderer answers, under the engine's `/v1` prefix.
   *
   * @override
   * @returns {string} Route path.
   */
  static get routePath () {
    return '/ai-runs/:runKey/cancellations'
  }

  /**
   * get: every refusal this renderer can answer with.
   *
   * There is one, and it is the whole of the vocabulary. A second entry would be a second thing a
   * caller could tell apart, and the eighth acceptance criterion of §15 is that a foreign run
   * answers exactly as an unknown one does.
   *
   * @override
   * @returns {Record<string, RestfulApiType.ErrorResponseEnvelope>} Error structure hash.
   */
  static get errorStructureHash () {
    return {
      ...super.errorStructureHash,

      AiRunNotFound: {
        statusCode: NOT_FOUND_STATUS_CODE,
        errorMessage: 'AI run not found',
      },
    }
  }

  /**
   * get: the registrar that records the cancellation and answers the state.
   *
   * @returns {typeof AiRunCancellationRegistrar} The class.
   */
  static get AiRunCancellationRegistrarCtor () {
    return AiRunCancellationRegistrar
  }

  /**
   * Create the registrar that records the cancellation and answers the state.
   *
   * @returns {AiRunCancellationRegistrar} Registrar.
   */
  static createAiRunCancellationRegistrar () {
    return this.AiRunCancellationRegistrarCtor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof AiRunCancellationPostRenderer} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCancellationPostRenderer} */ (this.constructor)
  }

  /**
   * Render the cancellation of the run the path names.
   *
   * The instant recorded is the request's own, so the gap §15 measures is anchored on when the
   * client asked rather than on when this process got round to writing it.
   *
   * @override
   * @param {RestfulApiType.RenderInput<*, *>} params - Parameters.
   * @returns {Promise<RestfulApiType.RenderResponse>} Response.
   * @public
   */
  async render ({
    context: {
      apiClientId,
      now,
    },
    request,
  }) {
    const runKey = this.extractRunKey({
      request,
    })

    const aiRunCancellationRegistrar = this.Ctor.createAiRunCancellationRegistrar()

    const content = await aiRunCancellationRegistrar.registerAiRunCancellation({
      runKey,
      apiClientId,
      cancelRequestedAt: now,
    })

    if (content === null) {
      return this.errorResponseHash
        .AiRunNotFound
        .createAsError()
    }

    return RestfulApiResponse.create({
      statusCode: ACCEPTED_STATUS_CODE,
      content,
    })
  }

  /**
   * Extract the run key the path carries.
   *
   * The hash is the framework's proxy, which answers null for a key the path did not carry — so a
   * request that named no run asks after no run, rather than after one called `null` spelled some
   * other way.
   *
   * @param {{
   *   request: *
   * }} params - Parameters.
   * @returns {string | null} Run key, or null when the path carried none.
   * @public
   */
  extractRunKey ({
    request,
  }) {
    return request.pathParameterHash
      .runKey
  }
}
