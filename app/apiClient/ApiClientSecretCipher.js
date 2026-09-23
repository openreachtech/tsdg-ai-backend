import crypto from 'node:crypto'

import {
  env,
} from '../globals/_.js'

const ENCRYPTION_ALGORITHM_NAME = 'aes-256-gcm'
const ENCRYPTION_KEY_ENCODING = 'hex'
// 64 hex characters, which are the 32 bytes AES-256 takes and nothing either side of them.
const ENCRYPTION_KEY_PATTERN = /^[0-9a-f]{64}$/iu
const UNUSABLE_ENCRYPTION_KEY_MESSAGE = 'API_CLIENT_SECRET_ENCRYPTION_KEY must be 64 hex characters, the 32 bytes AES-256-GCM takes'
const INITIALIZATION_VECTOR_BYTE_SIZE = 12
const ENVELOPE_DELIMITER = ':'
const ENVELOPE_PART_COUNT = 3
const ENVELOPE_ENCODING = 'hex'
const SECRET_ENCODING = 'utf8'

/**
 * Encrypts an API client's shared secret for storage, and decrypts it back.
 *
 * **Why encryption and not a digest.** The secret is the key a request signature is computed
 * under, so verifying a signature means recomputing the HMAC with that very secret. The
 * plaintext has to come back, which rules out the one-way hash a password would be stored as.
 * Encryption at rest is what the column buys instead: a database dump alone hands nobody a
 * working secret, because the key that opens it is not in the database.
 *
 * **Why AES-256-GCM.** GCM authenticates what it encrypts. A row edited by hand, a truncated
 * copy, or a value encrypted under a different key fails on the authentication tag and is
 * reported as a failure. The same bytes under CBC would decrypt into plausible garbage and be
 * used as a secret with nothing saying otherwise.
 *
 * **Why a fresh initialization vector every time.** One is generated per encryption from
 * `crypto.randomBytes()`, 12 bytes, the size GCM is specified around. Reusing a vector across
 * two encryptions under one key breaks GCM outright, so no fixed vector exists in this class.
 *
 * **The envelope.** The initialization vector and the authentication tag are not secret, but
 * decryption is impossible without them, and the schema gives this one `TEXT` column. All
 * three travel in it as lower case hex, joined by a colon, in a fixed order:
 *
 * ```
 * <initializationVectorHex>:<authenticationTagHex>:<ciphertextHex>
 * ```
 *
 * Hex has no colon in its alphabet, so the parts come back apart by splitting alone. Whoever
 * writes `api_clients.secret_ciphertext` — a seeder, an operator rotating a secret — produces
 * that string through `#encryptSecret()` rather than assembling one by hand.
 *
 * **How a failure is reported.** `#decryptSecret()` answers `null` for every envelope it
 * cannot open: a malformed string, a tampered ciphertext, a value encrypted under another
 * key. A caller verifying a signature therefore has one branch to write and never meets an
 * exception raised inside `node:crypto`. `#encryptSecret()` hides nothing by contrast — an
 * unusable encryption key is an operator error, and it throws.
 *
 * **The key** is read from `env.API_CLIENT_SECRET_ENCRYPTION_KEY`, which holds the 32 bytes of
 * an AES-256 key written as 64 hex characters. Anything else — absent, empty, short, or not hex
 * — is refused at construction rather than carried into a cipher, because a key that cannot open
 * an envelope would otherwise turn every client in the deployment away as though each of their
 * signatures were wrong. See `.buildEncryptionKey()`.
 */
export default class ApiClientSecretCipher {
  /**
   * Constructor.
   *
   * @param {ApiClientSecretCipherParams} params - Parameters.
   */
  constructor ({
    encryptionKey,
  }) {
    this.encryptionKey = encryptionKey
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof ApiClientSecretCipher ? X : never} T, X
   * @param {ApiClientSecretCipherFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    encryptionKey = this.buildEncryptionKey(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        encryptionKey,
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
   * Environment variables.
   *
   * @returns {typeof env} Environment facade.
   */
  static get env () {
    return env
  }

  /**
   * Build the encryption key the environment declares.
   *
   * **A key that is not an AES-256 key stops this class here, at construction.** Until it did,
   * nothing checked: an empty variable — which is what `.env.live` ships — produced a zero-byte
   * buffer, `createDecipheriv()` threw on it, `#decryptSecret()` caught that and answered `null`
   * as it does for any envelope it cannot open, and every client in the deployment was refused
   * `401` with nothing anywhere saying the key was the reason. A variable nobody declared at all
   * threw a `TypeError` out of the request instead, and every request became a `500`.
   *
   * **Why construction rather than a boot-time check.** A boot step would have to live in
   * `server/index.js`, which guards the API server alone — and the other consumer of this class is
   * the seeder that encrypts a development client's secret, which is run by the Sequelize CLI and
   * never loads that file. Checking where the key is built guards every consumer, and there is no
   * second place to keep in step with the first.
   *
   * **It refuses more than it used to, never less.** The throw replaces a path that already
   * refused everything, so no request that was turned away before is let through now; what changes
   * is that the operator is told why, at the first use rather than never.
   *
   * **Where being told actually happens.** Throwing is the whole of this method's part in it. On
   * the request path the exception becomes a `500` answering `Unknown Error` and prints nothing in
   * production, so `AppRestfulApiContext.createApiClientSecretCipher()` writes the line that names
   * the variable before letting the exception through. A consumer that runs in a terminal — the
   * seeder that encrypts a development client's secret — is told by the throw itself and needs no
   * line.
   *
   * @returns {Buffer} AES-256 key, as its 32 raw bytes.
   * @throws {Error} When the environment declares no usable key.
   */
  static buildEncryptionKey () {
    const encryptionKeyText = this.env.API_CLIENT_SECRET_ENCRYPTION_KEY

    if (!ENCRYPTION_KEY_PATTERN.test(encryptionKeyText)) {
      throw new Error(UNUSABLE_ENCRYPTION_KEY_MESSAGE)
    }

    return Buffer.from(
      encryptionKeyText,
      ENCRYPTION_KEY_ENCODING
    )
  }

  /**
   * Constructor of this instance.
   *
   * @returns {typeof ApiClientSecretCipher} Constructor.
   */
  get Ctor () {
    return /** @type {typeof ApiClientSecretCipher} */ (this.constructor)
  }

  /**
   * Encrypt a secret into the envelope that is stored.
   *
   * @param {{
   *   secret: string
   * }} params - Parameters.
   * @returns {string} Envelope to store, in the form this class documents.
   * @public
   */
  encryptSecret ({
    secret,
  }) {
    const initializationVector = this.Ctor.crypto.randomBytes(INITIALIZATION_VECTOR_BYTE_SIZE)

    const cipher = this.createCipher({
      initializationVector,
    })

    const ciphertext = Buffer.concat([
      cipher.update(secret, SECRET_ENCODING),
      cipher.final(),
    ])

    const authenticationTag = cipher.getAuthTag()

    return this.generateEnvelope({
      initializationVector,
      authenticationTag,
      ciphertext,
    })
  }

  /**
   * Create the cipher that encrypts.
   *
   * @param {{
   *   initializationVector: Buffer
   * }} params - Parameters.
   * @returns {import('node:crypto').CipherGCM} Cipher.
   */
  createCipher ({
    initializationVector,
  }) {
    return this.Ctor.crypto.createCipheriv(
      ENCRYPTION_ALGORITHM_NAME,
      this.encryptionKey,
      initializationVector
    )
  }

  /**
   * Generate the envelope that carries the three parts as one string.
   *
   * @param {ApiClientSecretEnvelopeParts} params - Parameters.
   * @returns {string} Envelope, in the form this class documents.
   */
  generateEnvelope ({
    initializationVector,
    authenticationTag,
    ciphertext,
  }) {
    return [
      initializationVector.toString(ENVELOPE_ENCODING),
      authenticationTag.toString(ENVELOPE_ENCODING),
      ciphertext.toString(ENVELOPE_ENCODING),
    ].join(ENVELOPE_DELIMITER)
  }

  /**
   * Decrypt a stored envelope back into the secret.
   *
   * @param {{
   *   envelope: string | null
   * }} params - Parameters.
   * @returns {string | null} Secret, or null when the envelope is malformed, was tampered
   * with, or was encrypted under another key.
   * @public
   */
  decryptSecret ({
    envelope,
  }) {
    const envelopeParts = this.extractEnvelopeParts({
      envelope,
    })

    if (envelopeParts === null) {
      return null
    }

    try {
      return this.decryptEnvelopeParts({
        initializationVector: envelopeParts.initializationVector,
        authenticationTag: envelopeParts.authenticationTag,
        ciphertext: envelopeParts.ciphertext,
      })
    } catch (decryptionFailure) {
      return null
    }
  }

  /**
   * Extract the three parts an envelope carries.
   *
   * `Buffer.from(value, 'hex')` truncates a malformed hex string instead of rejecting it, so
   * what this returns is only as well formed as the string was. Whether the bytes decrypt is
   * settled by the authentication tag, not here.
   *
   * @param {{
   *   envelope: string | null
   * }} params - Parameters.
   * @returns {ApiClientSecretEnvelopeParts | null} Parts, or null when the envelope is not a
   * string of the documented three parts.
   */
  extractEnvelopeParts ({
    envelope,
  }) {
    if (typeof envelope !== 'string') {
      return null
    }

    const encodedParts = envelope.split(ENVELOPE_DELIMITER)

    if (encodedParts.length !== ENVELOPE_PART_COUNT) {
      return null
    }

    const [
      encodedInitializationVector,
      encodedAuthenticationTag,
      encodedCiphertext,
    ] = encodedParts

    return {
      initializationVector: Buffer.from(encodedInitializationVector, ENVELOPE_ENCODING),
      authenticationTag: Buffer.from(encodedAuthenticationTag, ENVELOPE_ENCODING),
      ciphertext: Buffer.from(encodedCiphertext, ENVELOPE_ENCODING),
    }
  }

  /**
   * Decrypt the parts an envelope was taken apart into.
   *
   * @param {ApiClientSecretEnvelopeParts} params - Parameters.
   * @returns {string} Secret.
   * @throws {Error} When the parts do not authenticate under this key.
   */
  decryptEnvelopeParts ({
    initializationVector,
    authenticationTag,
    ciphertext,
  }) {
    const decipher = this.createDecipher({
      initializationVector,
      authenticationTag,
    })

    const secret = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])

    return secret.toString(SECRET_ENCODING)
  }

  /**
   * Create the decipher that decrypts, carrying the authentication tag to check against.
   *
   * @param {{
   *   initializationVector: Buffer
   *   authenticationTag: Buffer
   * }} params - Parameters.
   * @returns {import('node:crypto').DecipherGCM} Decipher.
   */
  createDecipher ({
    initializationVector,
    authenticationTag,
  }) {
    const decipher = this.Ctor.crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM_NAME,
      this.encryptionKey,
      initializationVector
    )

    decipher.setAuthTag(authenticationTag)

    return decipher
  }
}

/**
 * @typedef {{
 *   encryptionKey: Buffer
 * }} ApiClientSecretCipherParams
 */

/**
 * @typedef {Partial<ApiClientSecretCipherParams>} ApiClientSecretCipherFactoryParams
 */

/**
 * @typedef {{
 *   initializationVector: Buffer
 *   authenticationTag: Buffer
 *   ciphertext: Buffer
 * }} ApiClientSecretEnvelopeParts
 */
