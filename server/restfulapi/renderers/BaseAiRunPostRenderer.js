import {
  BasePostRenderer,
  RestfulApiResponse,
} from '@openreachtech/renchan'

import AiRunCommonFieldsInputAdapter from '../../../app/adapter/forRenderer/AiRunCommonFieldsInputAdapter.js'
import AiRunAcceptor from '../../../app/aiRun/AiRunAcceptor.js'
import AI_RUN_REFUSAL_CONSTANT_HASH from '../../../app/constants/aiRunRefusalConstants.js'
import AI_RUN_STATUS_CONSTANT_HASH from '../../../app/constants/aiRunStatusConstants.js'
import AiRunCommonFieldsInputValidator from '../../../app/validator/forRenderer/AiRunCommonFieldsInputValidator.js'

const {
  AI_RUN_REFUSAL_ENVELOPE,
} = AI_RUN_REFUSAL_CONSTANT_HASH

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

const ACCEPTED_STATUS_CODE = 202

/**
 * Base POST renderer every AI service's run-creating route extends.
 *
 * **It sits outside `renderers/v1/`, and that is load-bearing.** The framework turns every class
 * under the engine's `renderersPath` into a route, so a base placed in that tree would answer a
 * request of its own. This feature declares no route: the service that does places its file under
 * `renderers/v1/post/`, and fills in the run category left abstract here.
 *
 * **Idempotency is the pair of client and request key, and nothing else.** A key arriving a second
 * time under the same body answers with the run created the first time, carrying that run's status
 * as it now stands rather than the one it was accepted with; the same key under a different body is
 * refused `409` and the first run is left as it was. Neither path writes a second row.
 *
 * @abstract
 * @extends {BasePostRenderer<*, *>}
 */
export default class BaseAiRunPostRenderer extends BasePostRenderer {
  /**
   * get: every refusal this renderer can answer with.
   *
   * @override
   * @returns {Record<string, RestfulApiType.ErrorResponseEnvelope>} Error structure hash.
   */
  static get errorStructureHash () {
    return {
      ...super.errorStructureHash,
      ...AI_RUN_REFUSAL_ENVELOPE,
    }
  }

  /**
   * get: which AI service this renderer is, as the run category constants name it.
   *
   * @abstract
   * @returns {{
   *   ID: number
   *   NAME: string
   * }} Run category.
   * @throws {Error} When a subclass has not named its run category.
   */
  static get aiRunCategory () {
    throw new Error(`${this.name}.get:aiRunCategory must be inherited`)
  }

  /**
   * Create the reader and writer of the run row.
   *
   * @returns {AiRunAcceptor} Acceptor.
   */
  static createAiRunAcceptor () {
    return AiRunAcceptor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof BaseAiRunPostRenderer} The class.
   */
  get Ctor () {
    return /** @type {typeof BaseAiRunPostRenderer} */ (this.constructor)
  }

  /**
   * Render the answer to a run-creating request.
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
    const inputAdapter = this.createInputAdapter({
      body,
      request,
    })
    const input = inputAdapter.buildInput()
    const rawBody = inputAdapter.extractRawBody()
    const requestBodyHash = inputAdapter.generateRequestBodyHash()

    const refusal = this.validateInput({
      input,
      requestBodyHash,
    })

    if (refusal) {
      return refusal
    }

    return this.renderAcceptedRun({
      context,
      input,
      rawBody,
      requestBodyHash,
    })
  }

  /**
   * Create the adapter reading this request.
   *
   * @param {{
   *   body: *
   *   request: *
   * }} params - Parameters.
   * @returns {AiRunCommonFieldsInputAdapter} Adapter.
   */
  createInputAdapter ({
    body,
    request,
  }) {
    return AiRunCommonFieldsInputAdapter.create({
      body,
      request,
    })
  }

  /**
   * Judge the request, and answer with the refusal the first failing rule names.
   *
   * A request the engine parsed no body from digests to null, leaving no signed content for a
   * repeat of this key to be compared against — so it is refused rather than stored.
   *
   * @param {{
   *   input: *
   *   requestBodyHash: string | null
   * }} params - Parameters.
   * @returns {RestfulApiType.RenderResponse | null} Refusal, or null when every rule passed.
   */
  validateInput ({
    input,
    requestBodyHash,
  }) {
    const validator = this.createInputValidator({
      input,
    })

    const ErrorResponseCtor = validator.validateInput()

    if (ErrorResponseCtor) {
      return ErrorResponseCtor.createAsError()
    }

    if (requestBodyHash) {
      return null
    }

    return this.errorResponseHash
      .InvalidRequestBody
      .createAsError()
  }

  /**
   * Create the validator the input is judged by. A service overrides this to add its own rules.
   *
   * @param {{
   *   input: *
   * }} params - Parameters.
   * @returns {AiRunCommonFieldsInputValidator} Validator.
   */
  createInputValidator ({
    input,
  }) {
    return AiRunCommonFieldsInputValidator.create({
      input,
      errorHash: this.errorResponseHash,
    })
  }

  /**
   * Answer with the run this request names — the one it already created, or the one it creates now.
   *
   * @param {RenderAcceptedRunParams} params - Parameters.
   * @returns {Promise<RestfulApiType.RenderResponse>} Response.
   */
  async renderAcceptedRun ({
    context,
    input,
    rawBody,
    requestBodyHash,
  }) {
    const aiRunAcceptor = this.Ctor.createAiRunAcceptor()

    const savedAiRun = await aiRunAcceptor.findAiRun({
      apiClientId: context.apiClientId,
      requestKey: input.requestKey,
    })

    if (savedAiRun) {
      return this.buildRepeatedRunResponse({
        aiRun: savedAiRun,
        requestBodyHash,
      })
    }

    const aiRun = await aiRunAcceptor.saveAiRun({
      apiClientId: context.apiClientId,
      aiRunCategoryId: this.Ctor.aiRunCategory.ID,
      input,
      rawBody,
      requestBodyHash,
      acceptedAt: context.now,
    })

    return this.buildAcceptedResponse({
      aiRun,
      statusName: AI_RUN_STATUS.QUEUED.NAME,
    })
  }

  /**
   * Build the answer to an idempotency key that has been seen before.
   *
   * @param {{
   *   aiRun: *
   *   requestBodyHash: string
   * }} params - Parameters.
   * @returns {RestfulApiType.RenderResponse} Response.
   */
  buildRepeatedRunResponse ({
    aiRun,
    requestBodyHash,
  }) {
    if (aiRun.requestBodyHash !== requestBodyHash) {
      return this.errorResponseHash
        .RequestBodyMismatch
        .createAsError()
    }

    const statusName = aiRun.AiRunStatus.name

    return this.buildAcceptedResponse({
      aiRun,
      statusName,
    })
  }

  /**
   * Build the answer a caller receives for an accepted run, and nothing else.
   *
   * @param {{
   *   aiRun: *
   *   statusName: string
   * }} params - Parameters.
   * @returns {RestfulApiType.RenderResponse} Response.
   */
  buildAcceptedResponse ({
    aiRun,
    statusName,
  }) {
    const runCategoryName = this.Ctor.aiRunCategory.NAME

    return RestfulApiResponse.create({
      statusCode: ACCEPTED_STATUS_CODE,
      content: {
        runKey: aiRun.runKey,
        runCategoryName,
        statusName,
        acceptedAt: aiRun.acceptedAt,
      },
    })
  }
}

/**
 * @typedef {{
 *   context: *
 *   input: *
 *   rawBody: string
 *   requestBodyHash: string
 * }} RenderAcceptedRunParams
 */
