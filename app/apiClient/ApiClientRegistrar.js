import crypto from 'node:crypto'

import ApiClient from '../../sequelize/models/ApiClient.js'

import ApiClientSecretCipher from './ApiClientSecretCipher.js'

/*
 * 24 bytes as hex is 48 characters, inside the column's 64, and wide enough that a key cannot be
 * guessed. It is an identifier rather than a credential - it travels in a header on every request -
 * so its only job is to be unique and to carry nothing about the client it names.
 */
const CLIENT_KEY_BYTE_SIZE = 24
const CLIENT_KEY_ENCODING = 'hex'

/*
 * 32 bytes is the block an HMAC-SHA256 key is measured in, and base64url survives being pasted into
 * a configuration file, an environment variable and a shell argument without escaping.
 */
const SECRET_BYTE_SIZE = 32
const SECRET_ENCODING = 'base64url'

/**
 * Registers a caller this service will accept signed requests from.
 *
 * **This is the only way a client exists in production, and until one does the service answers
 * nothing.** Every route runs the signature filter, which resolves the `x-ort-client-id` header to
 * a row here and recomputes the request's HMAC under that row's secret; with no row there is
 * nothing to resolve to, and a correctly built request is refused like any other.
 *
 * **The secret is returned to the caller and never stored in the clear.** `ApiClientSecretCipher`
 * encrypts it under a key that lives outside the database, so a dump of the table hands nobody a
 * working secret. Nothing in this repository can print a stored secret back - the model's default
 * scope excludes the column - so the value this method returns is the only time it exists in a
 * readable form, and a caller that loses it is issued a new one rather than shown the old.
 *
 * **The callback prefix is a control and not a convenience.** A run's terminal callback is posted
 * only to a URL beginning with it; anything else is refused as `unregistered-callback-url` and
 * never sent. So a prefix that is wider than it needs to be is a wider place a result can be sent.
 */
export default class ApiClientRegistrar {
  /**
   * Constructor.
   *
   * @param {ApiClientRegistrarParams} params - Parameters.
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
   * @template {X extends typeof ApiClientRegistrar ? X : never} T, X
   * @param {ApiClientRegistrarFactoryParams} [params] - Parameters.
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
   * @returns {typeof ApiClientRegistrar} This class.
   * @public
   */
  get Ctor () {
    return /** @type {typeof ApiClientRegistrar} */ (this.constructor)
  }

  /**
   * Register one client, and answer the two values it needs to call.
   *
   * @param {{
   *   name: string
   *   callbackUrlPrefix: string
   *   registeredAt: Date
   * }} params - Parameters.
   * @returns {Promise<{
   *   clientKey: string
   *   secret: string
   * }>} What the client is given, and the only time the secret is readable.
   * @public
   */
  async registerApiClient ({
    name,
    callbackUrlPrefix,
    registeredAt,
  }) {
    const clientKey = this.generateClientKey()
    const secret = this.generateSecret()

    const registrableValues = this.buildRegistrableValues({
      name,
      clientKey,
      callbackUrlPrefix,
      secret,
      registeredAt,
    })

    await this.saveApiClient({
      registrableValues,
    })

    return {
      clientKey,
      secret,
    }
  }

  /**
   * Generate the identifier a request carries in its header.
   *
   * @returns {string} Client key.
   * @public
   */
  generateClientKey () {
    return this.Ctor.crypto
      .randomBytes(CLIENT_KEY_BYTE_SIZE)
      .toString(CLIENT_KEY_ENCODING)
  }

  /**
   * Generate the secret a request signature is computed under.
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
   * Build the row, with the secret already encrypted.
   *
   * **`previousSecretCiphertext` is left null on purpose.** That column holds a secret being
   * rotated out, and a client being registered for the first time has none. A rotation writes it
   * later, which is a different operation than this one.
   *
   * @param {{
   *   name: string
   *   clientKey: string
   *   callbackUrlPrefix: string
   *   secret: string
   *   registeredAt: Date
   * }} params - Parameters.
   * @returns {{[key: string]: *}} Values to save.
   * @public
   */
  buildRegistrableValues ({
    name,
    clientKey,
    callbackUrlPrefix,
    secret,
    registeredAt,
  }) {
    const secretCiphertext = this.secretCipher.encryptSecret({
      secret,
    })

    return {
      name,
      clientKey,
      secretCiphertext,
      previousSecretCiphertext: null,
      callbackUrlPrefix,
      isActive: true,
      registeredAt,
    }
  }

  /**
   * Save the row.
   *
   * @param {{
   *   registrableValues: {[key: string]: *}
   * }} params - Parameters.
   * @returns {Promise<*>} The created row.
   * @public
   */
  async saveApiClient ({
    registrableValues,
  }) {
    return /** @type {*} */ (
      this.apiClientModel.create(registrableValues)
    )
  }
}

/**
 * @typedef {{
 *   secretCipher: ApiClientSecretCipher
 *   apiClientModel: typeof ApiClient
 * }} ApiClientRegistrarParams
 */

/**
 * @typedef {{
 *   secretCipher?: ApiClientSecretCipher
 *   apiClientModel?: typeof ApiClient
 * }} ApiClientRegistrarFactoryParams
 */
