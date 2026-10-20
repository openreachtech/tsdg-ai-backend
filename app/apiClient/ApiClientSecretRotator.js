import crypto from 'node:crypto'

import ApiClient from '../../sequelize/models/ApiClient.js'

import API_CLIENT_SECRET_ROTATION_CONSTANT_HASH from '../constants/apiClientSecretRotationConstants.js'

import ApiClientSecretCipher from './ApiClientSecretCipher.js'

const {
  API_CLIENT_SECRET_ROTATION_OUTCOME,
} = API_CLIENT_SECRET_ROTATION_CONSTANT_HASH

/*
 * The same 32 bytes as base64url that `ApiClientRegistrar` issues a new client with, declared
 * again here rather than reached for there.
 *
 * **The duplication is deliberate and it is the lesser of two risks.** Sharing it would mean
 * editing a class that is the only way a client comes to exist, whose `generateSecret()` and
 * `crypto` getter are both covered by tests, and whose failure mode is a deployment that can
 * register nobody. What the duplication costs is that a change to the rule has to be made twice;
 * what it buys is that this file cannot break registration. If the rule ever does change, these
 * two constants and the two in `ApiClientRegistrar` are the whole of what has to move together.
 */
const SECRET_BYTE_SIZE = 32
const SECRET_ENCODING = 'base64url'

/*
 * The row this class reads, which the model's default scope would otherwise withhold.
 *
 * `id` travels with the two envelopes because the instance is updated through, and an instance
 * read without its primary key has nothing to write back to.
 */
const SECRET_BEARING_FIELD_NAMES = [
  'id',
  'secretCiphertext',
  'previousSecretCiphertext',
]

/**
 * Rotates the secret a registered caller signs its requests with.
 *
 * **Rotation is the capability the contract already promises and nothing could perform.**
 * `ApiClientSignatureVerifier` accepts either of two secrets, `api_clients` carries the second
 * column, and the development fixtures seed a client mid-rotation - but `ApiClientRegistrar`
 * writes `previousSecretCiphertext: null` and says in its own docblock that "a rotation writes it
 * later, which is a different operation than this one". This class is that operation.
 *
 * **Nothing here decrypts anything.** Rotating moves the live envelope into the previous column
 * exactly as it was stored and writes a freshly encrypted one in its place, so the plaintext of
 * the outgoing secret is never produced - it is not needed, and a credential nobody decrypts is a
 * credential that cannot leak from this path. The new secret exists in the clear only as the value
 * this class returns, which is the single moment it is readable, the same guarantee registration
 * already gives.
 *
 * **Both operations answer an outcome rather than throwing.** A client key naming no row, and a
 * rotation asked for twice, are both things an operator does at a terminal rather than faults in
 * the service; an exception would print a stack trace where a sentence is what is wanted. What
 * does throw is the cipher, when the encryption key is unusable - that is a deployment that cannot
 * store a secret at all, and it should stop loudly.
 */
export default class ApiClientSecretRotator {
  /**
   * Constructor.
   *
   * @param {ApiClientSecretRotatorParams} params - Parameters.
   */
  constructor ({
    secretCipher,
    apiClientModel,
  }) {
    this.secretCipher = secretCipher
    this.apiClientModel = apiClientModel
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof ApiClientSecretRotator ? X : never} T, X
   * @param {ApiClientSecretRotatorFactoryParams} [params] - Parameters.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   */
  static create ({
    secretCipher = this.createSecretCipher(),
    apiClientModel = ApiClient,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        secretCipher,
        apiClientModel,
      })
    )
  }

  /**
   * Create the cipher a stored secret is encrypted by.
   *
   * @returns {ApiClientSecretCipher} Cipher.
   * @public
   */
  static createSecretCipher () {
    return ApiClientSecretCipher.create()
  }

  /**
   * get: the randomness source, reachable as a member so a test can stub it.
   *
   * @returns {typeof crypto} Node's crypto module.
   * @public
   */
  static get crypto () {
    return crypto
  }

  /**
   * get: own constructor, so an instance method reaches this class's statics.
   *
   * @returns {typeof ApiClientSecretRotator} This class.
   * @public
   */
  get Ctor () {
    return /** @type {typeof ApiClientSecretRotator} */ (this.constructor)
  }

  /**
   * Issue one client a new secret, keeping the one it is replacing acceptable.
   *
   * The client goes on signing with the secret it already holds until it is changed, because the
   * verifier accepts both while the previous column is filled. Nothing is refused by this call.
   *
   * @param {{
   *   clientKey: string
   * }} params - Parameters.
   * @returns {Promise<ApiClientSecretRotationOutcome>} What the rotation came to, carrying the new
   * secret in the one case it produced one.
   * @public
   */
  async rotateApiClientSecret ({
    clientKey,
  }) {
    const apiClient = await this.findSecretBearingApiClient({
      clientKey,
    })

    if (apiClient === null) {
      return this.buildOutcome({
        outcomeName: API_CLIENT_SECRET_ROTATION_OUTCOME.CLIENT_NOT_FOUND,
      })
    }

    if (
      this.hasRotationUnderWay({
        apiClient,
      })
    ) {
      return this.buildOutcome({
        outcomeName: API_CLIENT_SECRET_ROTATION_OUTCOME.ROTATION_ALREADY_UNDER_WAY,
      })
    }

    const secret = this.generateSecret()

    const rotatableValues = this.buildRotatableValues({
      apiClient,
      secret,
    })

    await this.saveApiClientValues({
      apiClient,
      values: rotatableValues,
    })

    return this.buildOutcome({
      outcomeName: API_CLIENT_SECRET_ROTATION_OUTCOME.ROTATED,
      secret,
    })
  }

  /**
   * Stop accepting the secret a rotation left behind.
   *
   * **This is the half that makes a rotation mean something.** Until it runs, the secret that was
   * rotated out still signs an acceptable request, so the client has two working credentials and
   * the one it was meant to stop using is as live as the one it took.
   *
   * @param {{
   *   clientKey: string
   * }} params - Parameters.
   * @returns {Promise<ApiClientSecretRotationOutcome>} What the retirement came to.
   * @public
   */
  async retirePreviousApiClientSecret ({
    clientKey,
  }) {
    const apiClient = await this.findSecretBearingApiClient({
      clientKey,
    })

    if (apiClient === null) {
      return this.buildOutcome({
        outcomeName: API_CLIENT_SECRET_ROTATION_OUTCOME.CLIENT_NOT_FOUND,
      })
    }

    if (
      !this.hasRotationUnderWay({
        apiClient,
      })
    ) {
      return this.buildOutcome({
        outcomeName: API_CLIENT_SECRET_ROTATION_OUTCOME.NOTHING_TO_RETIRE,
      })
    }

    await this.saveApiClientValues({
      apiClient,
      values: this.buildRetirableValues(),
    })

    return this.buildOutcome({
      outcomeName: API_CLIENT_SECRET_ROTATION_OUTCOME.RETIRED,
    })
  }

  /**
   * Find the row a client key names, carrying the two envelopes the default scope withholds.
   *
   * `unscoped()` is said here rather than relied on through `attributes` alone, so a reader sees
   * what the read is for without working out which of the two declarations wins.
   *
   * @param {{
   *   clientKey: string
   * }} params - Parameters.
   * @returns {Promise<*>} The row, or null when the key names none.
   * @public
   */
  async findSecretBearingApiClient ({
    clientKey,
  }) {
    return /** @type {*} */ (
      this.apiClientModel
        .unscoped()
        .findOne({
          where: {
            clientKey,
          },
          attributes: SECRET_BEARING_FIELD_NAMES,
        })
    )
  }

  /**
   * Check whether this client already holds a secret being rotated out.
   *
   * @param {{
   *   apiClient: *
   * }} params - Parameters.
   * @returns {boolean} Whether a rotation is under way.
   * @public
   */
  hasRotationUnderWay ({
    apiClient,
  }) {
    return apiClient.previousSecretCiphertext !== null
  }

  /**
   * Generate the secret a request signature will be computed under.
   *
   * @returns {string} Secret.
   * @public
   */
  generateSecret () {
    return this.Ctor.crypto
      .randomBytes(SECRET_BYTE_SIZE)
      .toString(SECRET_ENCODING)
  }

  /**
   * Build the two columns a rotation writes.
   *
   * The envelope already stored moves across as it stands. Decrypting it to re-encrypt it would
   * produce the outgoing secret in the clear for no purpose the rotation has.
   *
   * @param {{
   *   apiClient: *
   *   secret: string
   * }} params - Parameters.
   * @returns {{[key: string]: *}} Values to save.
   * @public
   */
  buildRotatableValues ({
    apiClient,
    secret,
  }) {
    const secretCiphertext = this.secretCipher.encryptSecret({
      secret,
    })

    return {
      secretCiphertext,
      previousSecretCiphertext: apiClient.secretCiphertext,
    }
  }

  /**
   * Build the one column a retirement writes.
   *
   * @returns {{[key: string]: *}} Values to save.
   * @public
   */
  buildRetirableValues () {
    return {
      previousSecretCiphertext: null,
    }
  }

  /**
   * Save the changed columns of one row.
   *
   * @param {{
   *   apiClient: *
   *   values: {[key: string]: *}
   * }} params - Parameters.
   * @returns {Promise<*>} The updated row.
   * @public
   */
  async saveApiClientValues ({
    apiClient,
    values,
  }) {
    return /** @type {*} */ (
      apiClient.update(values)
    )
  }

  /**
   * Build what one command answers with.
   *
   * @param {{
   *   outcomeName: string
   *   secret?: string | null
   * }} params - Parameters.
   * @returns {ApiClientSecretRotationOutcome} Outcome.
   * @public
   */
  buildOutcome ({
    outcomeName,
    secret = null,
  }) {
    return {
      outcomeName,
      secret,
    }
  }
}

/**
 * @typedef {{
 *   secretCipher: ApiClientSecretCipher
 *   apiClientModel: typeof ApiClient
 * }} ApiClientSecretRotatorParams
 */

/**
 * @typedef {{
 *   secretCipher?: ApiClientSecretCipher
 *   apiClientModel?: typeof ApiClient
 * }} ApiClientSecretRotatorFactoryParams
 */

/**
 * @typedef {{
 *   outcomeName: string
 *   secret: string | null
 * }} ApiClientSecretRotationOutcome
 */
