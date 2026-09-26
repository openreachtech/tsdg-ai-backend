import ApiClientSignatureVerifier from '../apiClient/ApiClientSignatureVerifier.js'

import SIGNED_REQUEST_HEADER_CONSTANT_HASH from '../constants/signedRequestHeaderConstants.js'

const {
  SIGNED_REQUEST_HEADER_NAME,
} = SIGNED_REQUEST_HEADER_CONSTANT_HASH

const SIGNATURE_ENCODING = 'hex'

const MILLISECONDS_PER_SECOND = 1000

/**
 * Signs the terminal callback this service posts to a client.
 *
 * **A callback is signed the same way a request is, and additionally carries the run key in a
 * header** (specs/1.0.0, #run-delivery, the third acceptance criterion). "The same way" is meant
 * literally: the signature is the hex HMAC-SHA256 over `timestamp + "." + rawBody` under the
 * client's secret, which is the payload `#run-contract` verifies an inbound request against.
 *
 * **So this class computes nothing of its own — it turns `ApiClientSignatureVerifier` around.**
 * The payload is built by that class's `#generateSignedPayload()` and the digest by its
 * `#buildExpectedSignatureBuffer()`, because one of the two sides deciding the delimiter, the
 * algorithm or the encoding for itself is how a client ends up able to verify a request it sent
 * and unable to verify the callback it gets back. A second implementation would not be caught by
 * either side's tests: each would be self-consistent. Changing the scheme now moves both sides
 * together, or moves neither.
 *
 * **The client's secret arrives in the clear, and is never logged.** It is stored encrypted and is
 * decrypted by `ApiClientSecretCipher`; this class receives the plaintext and uses it as an HMAC
 * key. Nothing here writes a log line, so there is no path by which the key reaches one.
 *
 * **A secret that cannot key an HMAC answers null rather than signing with it.** An empty string
 * is a usable key as far as `node:crypto` is concerned, so a client whose secret failed to decrypt
 * would otherwise be sent a callback bearing a signature nothing could verify — which looks signed
 * to everything that handles it, and is the one failure a signature exists to make impossible. The
 * caller reads the null and does not deliver.
 *
 * **The timestamp is the text that is signed and the text that is sent.** The two are the same
 * value, taken from one instant the caller supplies rather than from a clock read twice, because a
 * signature computed over one second and presented with another verifies against nothing.
 */
export default class AiRunCallbackSigner {
  /**
   * Constructor.
   *
   * @param {AiRunCallbackSignerParams} params - Parameters.
   */
  constructor ({
    signatureVerifierFactory,
  }) {
    this.signatureVerifierFactory = signatureVerifierFactory
  }

  /**
   * Factory method.
   *
   * The verifier class is injected rather than reached for, because one is built per secret and
   * the building is what a test substitutes.
   *
   * @template {X extends typeof AiRunCallbackSigner ? X : never} T, X
   * @param {AiRunCallbackSignerFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    signatureVerifierFactory = ApiClientSignatureVerifier,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        signatureVerifierFactory,
      })
    )
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCallbackSigner} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCallbackSigner} */ (this.constructor)
  }

  /**
   * Build the headers the terminal callback is posted with.
   *
   * @param {BuildAiRunCallbackHeaderHashParams} params - Parameters.
   * @returns {Record<string, string> | null} The headers, or null when the secret cannot key an
   * HMAC and the callback must not be sent.
   * @public
   */
  buildCallbackHeaderHash ({
    clientKey,
    secret,
    runKey,
    rawBody,
    attemptedAt,
  }) {
    const timestampSeconds = this.generateTimestampSeconds({
      attemptedAt,
    })

    const signature = this.generateSignature({
      secret,
      rawBody,
      timestampSeconds,
    })

    if (signature === null) {
      return null
    }

    return {
      [SIGNED_REQUEST_HEADER_NAME.CLIENT_ID]: clientKey,
      [SIGNED_REQUEST_HEADER_NAME.TIMESTAMP]: timestampSeconds,
      [SIGNED_REQUEST_HEADER_NAME.SIGNATURE]: signature,
      [SIGNED_REQUEST_HEADER_NAME.RUN_KEY]: runKey,
    }
  }

  /**
   * Generate the epoch seconds the signature is computed with.
   *
   * The instant arrives on the call rather than being read off a clock here, so one attempt has
   * exactly one timestamp — the one the row records, the one that is signed and the one that is
   * sent — and a test states it rather than mocking global time.
   *
   * The seconds are floored, because the contract's window is stated in whole epoch seconds and a
   * fractional one is not a value a client's own clock comparison can be written against.
   *
   * @param {{
   *   attemptedAt: Date
   * }} params - Parameters.
   * @returns {string} Epoch seconds, as the text that travels in the header.
   * @public
   */
  generateTimestampSeconds ({
    attemptedAt,
  }) {
    const epochSeconds = Math.floor(attemptedAt.getTime() / MILLISECONDS_PER_SECOND)

    return String(epochSeconds)
  }

  /**
   * Generate the signature of one callback.
   *
   * @param {{
   *   secret: *
   *   rawBody: string
   *   timestampSeconds: string
   * }} params - Parameters.
   * @returns {string | null} The hex digest, or null when the secret cannot key an HMAC.
   * @public
   */
  generateSignature ({
    secret,
    rawBody,
    timestampSeconds,
  }) {
    if (typeof secret !== 'string') {
      return null
    }

    if (secret === '') {
      return null
    }

    const signatureVerifier = this.createSignatureVerifier({
      secret,
    })

    const signedPayload = signatureVerifier.generateSignedPayload({
      timestampHeaderValue: timestampSeconds,
      rawBody,
    })

    const signatureBuffer = signatureVerifier.buildExpectedSignatureBuffer({
      secret,
      signedPayload,
    })

    return signatureBuffer.toString(SIGNATURE_ENCODING)
  }

  /**
   * Create the verifier whose payload and digest this callback borrows.
   *
   * @param {{
   *   secret: string
   * }} params - Parameters.
   * @returns {ApiClientSignatureVerifier} Verifier.
   * @public
   */
  createSignatureVerifier ({
    secret,
  }) {
    return this.signatureVerifierFactory.create({
      currentSecret: secret,
    })
  }
}

/**
 * @typedef {{
 *   signatureVerifierFactory: typeof ApiClientSignatureVerifier
 * }} AiRunCallbackSignerParams
 */

/**
 * @typedef {Partial<AiRunCallbackSignerParams>} AiRunCallbackSignerFactoryParams
 */

/**
 * @typedef {{
 *   clientKey: string
 *   secret: *
 *   runKey: string
 *   rawBody: string
 *   attemptedAt: Date
 * }} BuildAiRunCallbackHeaderHashParams
 */
