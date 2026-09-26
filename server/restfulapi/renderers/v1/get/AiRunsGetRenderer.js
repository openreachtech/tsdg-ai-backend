import {
  BaseGetRenderer,
  RestfulApiResponse,
} from '@openreachtech/renchan'

import AiRunsQueryInputAdapter from '../../../../../app/adapter/forRenderer/AiRunsQueryInputAdapter.js'
import AiRunPageResponseBuilder from '../../../../../app/aiRun/AiRunPageResponseBuilder.js'
import AiRunsQueryInputValidator from '../../../../../app/validator/forRenderer/AiRunsQueryInputValidator.js'

const SUCCESS_STATUS_CODE = 200

const UNPROCESSABLE_STATUS_CODE = 422

/**
 * Renderer: `GET /v1/ai-runs`.
 *
 * **It assembles no row of the page it answers with.** `#operator-cli` requires that a row the
 * CLI prints carries the same facts a list row carries, so the row is built by
 * `AiRunPageResponseBuilder` — a class with no HTTP in it, which a terminal can reach as easily
 * as a request can. A row assembled in here would have made the CLI write a second one.
 *
 * **The scope is bound from the signature, and no parameter widens it.** The client id this route
 * reads is `context.apiClientId`, which `AppRestfulApiContext` resolved from the verified
 * signature before this class was reached. There is no query parameter for a client, and the
 * builder takes the id into the `where` of its own read rather than filtering rows it already
 * loaded — so a run of another client is never loaded at all, whatever the request asked for.
 *
 * **Six refusals, one per parameter, and all of them `422`.** The contract's `422` line is a
 * field carrying a value the schema does not accept, and each parameter is refused under its own
 * name so that a caller is told which one it got wrong. A status name this service does not have
 * is among them: answering an empty page to `?statusName=runing` would tell a client it has no
 * runs in a state that does not exist, and the two are not the same answer.
 *
 * **A cursor is refused under one name whether it was fabricated or borrowed.** A text that does
 * not decode is refused by the validator; a text that decodes to a run key this client has no run
 * under is refused here, once the builder has looked. They answer identically on purpose — a
 * refusal that told the two apart would confirm that another client's run exists, which is the
 * same thing `GET /v1/ai-runs/:runKey` answers `404` rather than `403` to avoid.
 *
 * **It declares no `401` and no `403`.** `get:passesFilter` stays at its inherited `false`, so a
 * caller that is not who it claims meets the engine's `401`, and a client whose record is
 * switched off meets its `403`, both before this class is reached.
 *
 * @extends {BaseGetRenderer<*>}
 */
export default class AiRunsGetRenderer extends BaseGetRenderer {
  /**
   * get: the route this renderer answers, under the engine's `/v1` prefix.
   *
   * @override
   * @returns {string} Route path.
   */
  static get routePath () {
    return '/ai-runs'
  }

  /**
   * get: every refusal this renderer can answer with.
   *
   * One per parameter the request may carry, because the one thing a refusal is for is telling
   * the caller which of the six it got wrong. They share a status because they are one kind of
   * mistake: a value the schema does not accept.
   *
   * @override
   * @returns {Record<string, RestfulApiType.ErrorResponseEnvelope>} Error structure hash.
   */
  static get errorStructureHash () {
    return {
      ...super.errorStructureHash,

      InvalidStatusName: {
        statusCode: UNPROCESSABLE_STATUS_CODE,
        errorMessage: 'Invalid status name',
      },
      InvalidRunCategoryName: {
        statusCode: UNPROCESSABLE_STATUS_CODE,
        errorMessage: 'Invalid run category name',
      },
      InvalidCorrelationId: {
        statusCode: UNPROCESSABLE_STATUS_CODE,
        errorMessage: 'Invalid correlation id',
      },
      InvalidStalledForSeconds: {
        statusCode: UNPROCESSABLE_STATUS_CODE,
        errorMessage: 'Invalid stalled for seconds',
      },
      InvalidLimit: {
        statusCode: UNPROCESSABLE_STATUS_CODE,
        errorMessage: 'Invalid limit',
      },
      InvalidCursor: {
        statusCode: UNPROCESSABLE_STATUS_CODE,
        errorMessage: 'Invalid cursor',
      },
    }
  }

  /**
   * get: the builder of the page, and of the row a CLI shares with it.
   *
   * @returns {typeof AiRunPageResponseBuilder} The class.
   */
  static get AiRunPageResponseBuilderCtor () {
    return AiRunPageResponseBuilder
  }

  /**
   * Create the builder of the page this route answers with.
   *
   * @returns {AiRunPageResponseBuilder} Builder.
   */
  static createAiRunPageResponseBuilder () {
    return this.AiRunPageResponseBuilderCtor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof AiRunsGetRenderer} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunsGetRenderer} */ (this.constructor)
  }

  /**
   * Render one page of the calling client's own runs.
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
      now,
    },
  }) {
    const inputAdapter = this.createInputAdapter({
      query,
    })

    const input = inputAdapter.buildInput()

    const refusal = this.validateInput({
      input,
    })

    if (refusal) {
      return refusal
    }

    const aiRunPageResponseBuilder = this.Ctor.createAiRunPageResponseBuilder()

    const content = await aiRunPageResponseBuilder.buildAiRunsResponse({
      apiClientId,
      input,
      now,
    })

    if (content === null) {
      return this.errorResponseHash
        .InvalidCursor
        .createAsError()
    }

    return RestfulApiResponse.create({
      statusCode: SUCCESS_STATUS_CODE,
      content,
    })
  }

  /**
   * Create the adapter reading this request's query string.
   *
   * @param {{
   *   query: *
   * }} params - Parameters.
   * @returns {AiRunsQueryInputAdapter} Adapter.
   * @public
   */
  createInputAdapter ({
    query,
  }) {
    return AiRunsQueryInputAdapter.create({
      query,
    })
  }

  /**
   * Judge the request, and answer with the refusal the first failing rule names.
   *
   * @param {{
   *   input: restfulapi.v1.AiRunsQueryInput
   * }} params - Parameters.
   * @returns {RestfulApiType.RenderResponse | null} Refusal, or null when every rule passed.
   * @public
   */
  validateInput ({
    input,
  }) {
    const validator = this.createInputValidator({
      input,
    })

    const ErrorResponseCtor = validator.validateInput()

    if (!ErrorResponseCtor) {
      return null
    }

    return ErrorResponseCtor.createAsError()
  }

  /**
   * Create the validator the input is judged by.
   *
   * @param {{
   *   input: restfulapi.v1.AiRunsQueryInput
   * }} params - Parameters.
   * @returns {AiRunsQueryInputValidator} Validator.
   * @public
   */
  createInputValidator ({
    input,
  }) {
    return AiRunsQueryInputValidator.create({
      input,
      errorHash: this.errorResponseHash,
    })
  }
}
