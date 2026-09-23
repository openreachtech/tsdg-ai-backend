import crypto from 'node:crypto'

const DEFAULT_HASH_ALGORITHM = 'sha256'

/**
 * Digests the body of a run-creating request, for `ai_runs.request_body_hash`.
 *
 * **What the digest decides.** Idempotency is the unique pair of client and request key. Keeping
 * the digest of the body beside that pair is what lets the second arrival of one key be told
 * apart: the same body is a true retry, and answers with the run created the first time; a
 * different body is a different request wearing a used key, and is refused with `409` while the
 * first run stays as it was.
 *
 * **Why the raw bytes, and never a re-serialized object.** Two JSON bodies differing only in key
 * order or in whitespace parse to the same object and are different bytes. The signature is
 * verified over the raw bytes of the body, so if this digested a re-serialized form the two would
 * disagree about what "the body" is — and a body whose signature was rejected could still be
 * accepted here as an idempotent retry of the one that was signed. The raw body is therefore
 * digested exactly as it arrived: the engines set `rawBody` to the text of the parsed buffer, and
 * that string is read as UTF-8 with nothing done to it first.
 *
 * **How a refusal is reported.** A request the engine parsed no body for carries no `rawBody` at
 * all, and anything that is not a string is not a body this class can digest. Each answers `null`,
 * the way `ApiClientSignatureVerifier` refuses the same inputs, rather than raising out of
 * `node:crypto` — so the decision belongs to the caller whether it digests before verifying or
 * after. A `null` says no digest was taken; it never says the body digested to nothing.
 */
export default class RequestBodyDigester {
  /**
   * Constructor.
   *
   * @param {RequestBodyDigesterParams} params - Parameters.
   */
  constructor ({
    hashAlgorithm,
  }) {
    this.hashAlgorithm = hashAlgorithm
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof RequestBodyDigester ? X : never} T, X
   * @param {RequestBodyDigesterFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    hashAlgorithm = DEFAULT_HASH_ALGORITHM,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        hashAlgorithm,
      })
    )
  }

  /**
   * get: crypto module — a seam so tests can substitute it.
   *
   * @returns {typeof crypto} The crypto module.
   */
  static get crypto () {
    return crypto
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof RequestBodyDigester} The class.
   */
  get Ctor () {
    return /** @type {typeof RequestBodyDigester} */ (this.constructor)
  }

  /**
   * Digest the raw bytes of a request body, as they arrived.
   *
   * The body arrives as the request presented it — an absent one included — so what it is, is
   * judged here rather than ahead of here. Only a string is a body to digest; anything else is
   * refused with null, and a refusal means no digest was taken.
   *
   * @param {{
   *   rawBody: *
   * }} params - Parameters.
   * @returns {string | null} Digest as lower case hex, or null when the body is not a string.
   * @public
   */
  digestRequestBody ({
    rawBody,
  }) {
    if (typeof rawBody !== 'string') {
      return null
    }

    return this.Ctor.crypto.createHash(this.hashAlgorithm)
      .update(rawBody)
      .digest('hex')
  }
}

/**
 * @typedef {{
 *   hashAlgorithm: string
 * }} RequestBodyDigesterParams
 */

/**
 * @typedef {Partial<RequestBodyDigesterParams>} RequestBodyDigesterFactoryParams
 */
