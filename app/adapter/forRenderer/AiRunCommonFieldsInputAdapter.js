import RequestBodyDigester from '../../aiRun/RequestBodyDigester.js'

/**
 * Reads a run-creating request and hands back one input, whatever the request split it across.
 *
 * **Why the reading is a class of its own.** REST input arrives in pieces — the body carries the
 * four common fields, a header carries the idempotency key, and the raw bytes sit on the Express
 * request underneath both. This is the only place that knows that. A validator downstream sees one
 * flat object and judges values; a renderer sees an answer, not a request.
 *
 * **It judges nothing.** A field the caller did not send comes back as null rather than as an
 * error, and a field the caller did send comes back untouched — not trimmed, not coerced, not
 * defaulted. Whether a null is acceptable is a rule, and rules belong to the validator.
 *
 * **The digest is read here because the bytes are.** What a repeated idempotency key is compared
 * against is the body exactly as it arrived, which is the same string the signature was verified
 * over — so the one class holding those bytes is the one that digests them, and no caller
 * downstream ever sees a chance to re-serialize them first.
 */
export default class AiRunCommonFieldsInputAdapter {
  /**
   * Constructor.
   *
   * @param {AiRunCommonFieldsInputAdapterParams} params - Parameters.
   */
  constructor ({
    body,
    request,
    requestBodyDigester,
  }) {
    this.body = body
    this.request = request
    this.requestBodyDigester = requestBodyDigester
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunCommonFieldsInputAdapter ? X : never} T, X
   * @param {AiRunCommonFieldsInputAdapterFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    body,
    request,
    requestBodyDigester = this.createRequestBodyDigester(),
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        body,
        request,
        requestBodyDigester,
      })
    )
  }

  /**
   * get: the header the idempotency key arrives in, lower cased as Express holds it.
   *
   * @returns {string} Header key.
   */
  static get IDEMPOTENCY_KEY_HEADER_KEY () {
    return 'idempotency-key'
  }

  /**
   * Create the digester taking the body of a request as it arrived.
   *
   * @returns {RequestBodyDigester} Digester.
   */
  static createRequestBodyDigester () {
    return RequestBodyDigester.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCommonFieldsInputAdapter} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCommonFieldsInputAdapter} */ (this.constructor)
  }

  /**
   * Build the one input the rules are run against.
   *
   * @returns {AiRunCommonFieldsInput} Input.
   * @public
   */
  buildInput () {
    const requestKey = this.extractRequestKey()

    return {
      requestKey,
      externalRef: this.body?.externalRef ?? null,
      subjectLabel: this.body?.subjectLabel ?? null,
      correlationId: this.body?.correlationId ?? null,
      callbackUrl: this.body?.callbackUrl ?? null,
    }
  }

  /**
   * Extract the idempotency key the caller sent.
   *
   * @returns {string | null} Idempotency key, or null when the header was not sent.
   * @public
   */
  extractRequestKey () {
    const headerHash = this.request?.expressRequest
      ?.headers
      ?? null

    return headerHash?.[this.Ctor.IDEMPOTENCY_KEY_HEADER_KEY]
      ?? null
  }

  /**
   * Extract the body as the caller sent it, which is what was signed and what is digested.
   *
   * @returns {string | null} Raw body, or null when the request carried none.
   * @public
   */
  extractRawBody () {
    return this.request?.expressRequest
      ?.rawBody
      ?? null
  }

  /**
   * Generate the digest a repeated idempotency key is told apart by.
   *
   * @returns {string | null} Digest, or null when the request carried no body to digest.
   * @public
   */
  generateRequestBodyHash () {
    const rawBody = this.extractRawBody()

    return this.requestBodyDigester.digestRequestBody({
      rawBody,
    })
  }
}

/**
 * @typedef {{
 *   body: *
 *   request: *
 *   requestBodyDigester: RequestBodyDigester
 * }} AiRunCommonFieldsInputAdapterParams
 */

/**
 * @typedef {{
 *   body: *
 *   request: *
 *   requestBodyDigester?: RequestBodyDigester
 * }} AiRunCommonFieldsInputAdapterFactoryParams
 */

/**
 * @typedef {{
 *   requestKey: string | null
 *   externalRef: string | null
 *   subjectLabel: string | null
 *   correlationId: string | null
 *   callbackUrl: string | null
 * }} AiRunCommonFieldsInput
 */
