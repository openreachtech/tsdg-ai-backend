import crypto from 'node:crypto'

const HASH_ALGORITHM_NAME = 'sha256'
const SIGNED_PAYLOAD_DELIMITER = '.'
const SIGNATURE_HEX_PATTERN = /^[0-9a-f]{64}$/iu // 32 digest bytes, as hex
const EPOCH_SECONDS_PATTERN = /^\d+$/u

/**
 * Decides whether an inbound request carries a signature computed with one of a client's
 * valid secrets.
 *
 * The signature is the hex HMAC-SHA256 over `timestamp + "." + rawBody`, under the client's
 * shared secret, as the client API contract states it.
 *
 * **The caller supplies plaintext secrets.** A secret is stored encrypted at rest and is
 * decrypted elsewhere; this class receives the decrypted values and does nothing but compare.
 *
 * **The timestamp's shape is checked here; its freshness is not.** How far the timestamp may
 * sit from the server's clock is `RequestTimestampWindowInspector`'s question, and the caller
 * composes the two answers. That it is a run of digits is a different question, and one this
 * class has to answer for itself — see the fourth item below.
 *
 * **Both of a client's secrets are tried the same way.** While a rotation is under way the
 * client has a current secret and a previous one, and both are accepted. Every secret is
 * digested and compared — the scan never stops at the one that matched — so nothing in the
 * code path, the time taken or the answer says which secret verified, or that a second one
 * was there at all.
 *
 * Four things would otherwise let a request through that should not be, and each is closed
 * before it can happen:
 *
 * 1. `crypto.timingSafeEqual()` throws a `RangeError` when the two buffers differ in length,
 * so the lengths are compared first, and a mismatch is a failed verification rather than
 * an error handed to the caller.
 * 2. `Buffer.from(value, 'hex')` truncates a malformed hex string instead of rejecting it, so
 * a signature that is not exactly 64 hex characters is refused before a buffer is built
 * from it.
 * 3. `AppRestfulApiServerEngine#defineKeepRawBodyCallback()` sets `request.rawBody` from the
 * `verify` hook of the body parsers, so a request the engine parsed no body for carries no
 * signature material whatsoever. Such a request is refused as unsigned; an absent raw body
 * is never read as an empty body, which would be a string somebody could sign. An empty
 * body that *was* parsed arrives as `''` and is signable, so the kind of the value decides
 * this, never its length.
 * 4. A signed payload stands for the one pair it was built from only while the delimiter cannot
 * be mistaken for text the timestamp itself carried, and bodies carry `.` freely — so a
 * timestamp of arbitrary text would leave one payload readable as several `(timestamp,
 * rawBody)` pairs, and a signature would bind to that whole set rather than to the single
 * body it was computed over. The timestamp is therefore required to be a run of digits — the
 * epoch seconds the contract states it carries — before the payload is built from it; a
 * timestamp of any other shape is material this class cannot verify, and is refused the way
 * every other malformed input is.
 *
 * The timestamp is the text the header carried, and it is signed as that text, because that
 * is what the client signed; a parsed number would build a different payload than the one the
 * request was signed over.
 */
export default class ApiClientSignatureVerifier {
  /**
   * Constructor.
   *
   * @param {ApiClientSignatureVerifierParams} params - Parameters.
   */
  constructor ({
    secrets,
  }) {
    this.secrets = secrets
  }

  /**
   * Factory method.
   *
   * A secret that is not a non-empty string is dropped: an absent previous secret means no
   * rotation is under way, and an empty secret would otherwise be a usable HMAC key. A client
   * left with no secret at all verifies nothing.
   *
   * @template {X extends typeof ApiClientSignatureVerifier ? X : never} T, X
   * @param {ApiClientSignatureVerifierFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    currentSecret,
    previousSecret = null,
  }) {
    const secrets = [
      currentSecret,
      previousSecret,
    ]
      .filter(it =>
        typeof it === 'string'
        && it !== ''
      )

    return /** @type {InstanceType<T>} */ (
      new this({
        secrets,
      })
    )
  }

  /**
   * Node's crypto module.
   *
   * @returns {typeof crypto} Crypto module.
   */
  static get crypto () {
    return crypto
  }

  /**
   * Constructor of this instance.
   *
   * @returns {typeof ApiClientSignatureVerifier} Constructor.
   */
  get Ctor () {
    return /** @type {typeof ApiClientSignatureVerifier} */ (this.constructor)
  }

  /**
   * Check whether the presented signature was computed with one of this client's secrets.
   *
   * The three values arrive as the request presented them — a header that was absent, or that
   * was sent twice and arrived as an array, is judged here rather than ahead of here.
   *
   * @param {{
   *   signatureHeaderValue: *
   *   timestampHeaderValue: *
   *   rawBody: *
   * }} params - Parameters.
   * @returns {boolean} Whether the signature verifies.
   * @public
   */
  isAcceptableSignature ({
    signatureHeaderValue,
    timestampHeaderValue,
    rawBody,
  }) {
    if (
      !this.hasSignatureMaterial({
        timestampHeaderValue,
        rawBody,
      })
    ) {
      return false
    }

    if (
      !this.isWellFormedSignature({
        signatureHeaderValue,
      })
    ) {
      return false
    }

    const signedPayload = this.generateSignedPayload({
      timestampHeaderValue,
      rawBody,
    })

    const actualBuffer = this.buildSignatureBuffer({
      signatureHeaderValue,
    })

    const matchedBuffers = this.secrets
      .map(secret =>
        this.buildExpectedSignatureBuffer({
          secret,
          signedPayload,
        })
      )
      .filter(expectedBuffer =>
        this.matchesSignatureBuffer({
          expectedBuffer,
          actualBuffer,
        })
      )

    return matchedBuffers.length > 0
  }

  /**
   * Check whether the request carries the material a signature is computed over.
   *
   * A raw body the server never parsed is absent, not empty, and leaves nothing to verify.
   *
   * The timestamp has to be a run of digits, and not merely some non-empty text, because it is
   * the left side of a payload the delimiter has to divide unambiguously. A timestamp of any
   * other shape leaves the payload readable as more than one pair, so it is material this class
   * cannot verify rather than material it verifies loosely.
   *
   * @param {{
   *   timestampHeaderValue: *
   *   rawBody: *
   * }} params - Parameters.
   * @returns {boolean} Whether the raw body is present and the timestamp is epoch seconds.
   */
  hasSignatureMaterial ({
    timestampHeaderValue,
    rawBody,
  }) {
    return typeof timestampHeaderValue === 'string'
      && EPOCH_SECONDS_PATTERN.test(timestampHeaderValue)
      && typeof rawBody === 'string'
  }

  /**
   * Check whether the presented signature is hex of the length a SHA-256 digest has.
   *
   * @param {{
   *   signatureHeaderValue: *
   * }} params - Parameters.
   * @returns {boolean} Whether the signature is well formed.
   */
  isWellFormedSignature ({
    signatureHeaderValue,
  }) {
    return typeof signatureHeaderValue === 'string'
      && SIGNATURE_HEX_PATTERN.test(signatureHeaderValue)
  }

  /**
   * Generate the payload the signature is computed over.
   *
   * @param {{
   *   timestampHeaderValue: string
   *   rawBody: string
   * }} params - Parameters.
   * @returns {string} Signed payload.
   */
  generateSignedPayload ({
    timestampHeaderValue,
    rawBody,
  }) {
    return `${timestampHeaderValue}${SIGNED_PAYLOAD_DELIMITER}${rawBody}`
  }

  /**
   * Build the buffer of the presented signature.
   *
   * @param {{
   *   signatureHeaderValue: string
   * }} params - Parameters.
   * @returns {Buffer} Digest the request presented.
   */
  buildSignatureBuffer ({
    signatureHeaderValue,
  }) {
    return Buffer.from(signatureHeaderValue, 'hex')
  }

  /**
   * Build the buffer of the signature one secret produces.
   *
   * @param {{
   *   secret: string
   *   signedPayload: string
   * }} params - Parameters.
   * @returns {Buffer} Digest computed under the given secret.
   */
  buildExpectedSignatureBuffer ({
    secret,
    signedPayload,
  }) {
    return this.Ctor.crypto
      .createHmac(HASH_ALGORITHM_NAME, secret)
      .update(signedPayload)
      .digest()
  }

  /**
   * Check whether two signature buffers hold the same digest.
   *
   * @param {{
   *   expectedBuffer: Buffer
   *   actualBuffer: Buffer
   * }} params - Parameters.
   * @returns {boolean} Whether the two buffers are equal.
   */
  matchesSignatureBuffer ({
    expectedBuffer,
    actualBuffer,
  }) {
    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }

    return this.Ctor.crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  }
}

/**
 * @typedef {{
 *   secrets: Array<string>
 * }} ApiClientSignatureVerifierParams
 */

/**
 * @typedef {{
 *   currentSecret: string
 *   previousSecret?: string | null
 * }} ApiClientSignatureVerifierFactoryParams
 */
