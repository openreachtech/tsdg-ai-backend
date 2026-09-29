import {
  BaseGetRenderer,
  RestfulApiResponse,
} from '@openreachtech/renchan'

import AiRunResponseBuilder from '../../../../../app/aiRun/AiRunResponseBuilder.js'

const SUCCESS_STATUS_CODE = 200

const NOT_FOUND_STATUS_CODE = 404

const EXPAND_STEPS_QUERY_VALUE = 'steps'

/**
 * Renderer: `GET /v1/ai-runs/:runKey`.
 *
 * **It assembles no field of the body it answers with.** The same body is carried by the terminal
 * callback posted to the client's registered URL, and two shapes for one answer is what the
 * reconciliation path exists to avoid (specs/1.0.0, #run-delivery) — so `AiRunResponseBuilder`
 * builds it once and both callers hand it on untouched. This class reads a run key, a client and
 * one query value, and decides only *whether* there is a body to answer with.
 *
 * **A run this client does not own answers exactly as a run key naming nothing does.** The
 * builder takes the client into the `where` of its own read, so a run belonging to somebody else
 * is never loaded and comes back as the same `null` an unknown key does; this class has one
 * refusal, not two, and cannot tell the two cases apart even if it wanted to. That is the ninth
 * acceptance criterion, and it is why the refusal is `404` and never `403`: a `403` — or a `404`
 * worded differently — would confirm that somebody else's run exists. The two paths also cost the
 * same one query, so nothing timing them learns what nothing reading them can.
 *
 * **`?expand=steps` is the only expansion this version answers to.** Any other value, a repeated
 * parameter arriving as an array, or no parameter at all, is a request for no trace — and a body
 * built for no trace carries no `steps` key at all, rather than a key holding null. "Was a trace
 * asked for" and "did the trace come back empty" are different answers, and the fifth criterion is
 * about the first of them.
 *
 * **`result` is whatever the run carries when it is read, which is not always what the callback
 * carried ([[Q108]]).** §12 says reading a run back returns the same body the terminal callback
 * carried, and §19 purges `result_body` thirty days after a run ends; past that point this route
 * answers `result: null` while the callback carried a result. The purge wins — it is the stricter
 * rule and the one a client cannot opt out of — so the promise of an identical body holds while
 * the content is retained, and a client reconciling later reads the run's state rather than its
 * content. §19 keeps a purged run distinguishable from one that never carried content on the run
 * record itself, and the contract puts no such field on this surface, so the distinction is the
 * operator's to read and not the client's. Recorded here rather than papered over: the two
 * sections are in tension, and the resolution is not this renderer's to make alone.
 *
 * **It declares one refusal and leaves the rest to the engine.** `get:passesFilter` stays at its
 * inherited `false`, so a caller that is not who it claims meets the engine's `401`, and a client
 * whose record is switched off meets its `403`, both before this class is reached.
 *
 * @extends {BaseGetRenderer<*>}
 */
export default class AiRunGetRenderer extends BaseGetRenderer {
  /**
   * get: the route this renderer answers, under the engine's `/v1` prefix.
   *
   * @override
   * @returns {string} Route path.
   */
  static get routePath () {
    return '/ai-runs/:runKey'
  }

  /**
   * get: every refusal this renderer can answer with.
   *
   * There is one, and it is deliberately the whole of the vocabulary: a run key this client has no
   * run under is the only thing this route refuses, and it refuses it in one wording whatever the
   * reason.
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
   * get: the builder of the one body a run is answered with.
   *
   * @returns {typeof AiRunResponseBuilder} The class.
   */
  static get AiRunResponseBuilderCtor () {
    return AiRunResponseBuilder
  }

  /**
   * Create the builder of the one body a run is answered with.
   *
   * @returns {AiRunResponseBuilder} Builder.
   */
  static createAiRunResponseBuilder () {
    return this.AiRunResponseBuilderCtor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof AiRunGetRenderer} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunGetRenderer} */ (this.constructor)
  }

  /**
   * Render the run the path names, as the client that asked for it may see it.
   *
   * @override
   * @param {RestfulApiType.RenderInput<null, *>} params - Parameters.
   * @returns {Promise<RestfulApiType.RenderResponse>} Response.
   * @public
   */
  async render ({
    query,
    context: {
      apiClientId,
    },
    request,
  }) {
    const runKey = this.extractRunKey({
      request,
    })

    const expandsSteps = this.extractExpandsSteps({
      query,
    })

    const aiRunResponseBuilder = this.Ctor.createAiRunResponseBuilder()

    const content = await aiRunResponseBuilder.buildAiRunResponse({
      runKey,
      apiClientId,
      expandsSteps,
    })

    if (content === null) {
      return this.errorResponseHash
        .AiRunNotFound
        .createAsError()
    }

    return RestfulApiResponse.create({
      statusCode: SUCCESS_STATUS_CODE,
      content,
    })
  }

  /**
   * Extract the run key the path carries.
   *
   * The hash is the framework's proxy, which answers null for a key the path did not carry — so a
   * request that named no run asks after no run, rather than after one called `undefined`.
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

  /**
   * Extract whether this request asked for the step trace.
   *
   * The comparison is what makes the read total: a value this version does not answer to, the
   * array a repeated query parameter arrives as, and an absent parameter are all "no trace was
   * asked for", and none of them is a case of its own.
   *
   * @param {{
   *   query: *
   * }} params - Parameters.
   * @returns {boolean} True when the step trace was asked for.
   * @public
   */
  extractExpandsSteps ({
    query,
  }) {
    return query.expand === EXPAND_STEPS_QUERY_VALUE
  }
}
