import {
  BaseRestfulApiContext,
} from '@openreachtech/renchan'

import ApiClientSecretCipher from '../../../app/apiClient/ApiClientSecretCipher.js'
import ApiClientSignatureVerifier from '../../../app/apiClient/ApiClientSignatureVerifier.js'
import RequestTimestampWindowInspector from '../../../app/apiClient/RequestTimestampWindowInspector.js'

import ApiClient from '../../../sequelize/models/ApiClient.js'

const CLIENT_ID_HEADER_NAME = 'x-ort-client-id'
const TIMESTAMP_HEADER_NAME = 'x-ort-timestamp'
const SIGNATURE_HEADER_NAME = 'x-ort-signature'
const RAW_BODY_PROPERTY_NAME = 'rawBody'

/**
 * App RESTful API context.
 *
 * **Who the caller is, is decided here and nowhere else.** This API has no login and no access
 * token: a caller names itself with `x-ort-client-id` and proves it with `x-ort-signature`, the
 * hex HMAC-SHA256 over `x-ort-timestamp + "." + rawBody` under a secret only it and this service
 * hold. `.findUser()` is the framework's one hook for turning a request into a caller, so the
 * whole of that resolution sits in it, and every renderer downstream reads an already-resolved
 * client rather than repeating the check.
 *
 * **Why the collaborators arrive through static seams.** `BaseRestfulApiContext.createAsync()`
 * calls `.findUser()` statically, handing it the express request, the access token and
 * `requestedAt` — no engine, and so no Share. A per-process container is therefore out of reach
 * from here, and each collaborator is built through a `create~` static of this class instead. The
 * three are cheap and hold no connection, so nothing is lost by building them per request; what
 * is gained is one seam per collaborator that a test overrides.
 *
 * **Why the server's own clock arrives as an argument.** `requestedAt` is the instant the
 * framework stamped the request with, and the freshness window is measured against it. Reading
 * the clock again inside the check would give one request two instants, and would leave a test
 * mocking global time to say what it means.
 *
 * **Why a switched-off client is still returned.** The contract tells `401` and `403` apart: the
 * first says the caller is not who it claims, the second says it is and may not. The engine's
 * filter answers `401` when `#hasAuthenticated()` is false and `403` when `#hasAuthorized()` is
 * false, and `#hasAuthenticated()` is `userEntity !== null`. Returning `null` for a client whose
 * record is switched off would therefore make every refusal a `401` and leave `403` unreachable
 * — so the switched-off client is resolved like any other, and `is_active` is read by the
 * engine's `hasAuthorized` visa issuer.
 *
 * @extends {BaseRestfulApiContext}
 */
export default class AppRestfulApiContext extends BaseRestfulApiContext {
  /**
   * get: ApiClient model — a seam so tests can substitute it.
   *
   * @returns {typeof ApiClient} - The model.
   */
  static get ApiClientModel () {
    return ApiClient
  }

  /**
   * get: ApiClientSecretCipher class — a seam so tests can substitute it.
   *
   * @returns {typeof ApiClientSecretCipher} - The class.
   */
  static get ApiClientSecretCipherCtor () {
    return ApiClientSecretCipher
  }

  /**
   * get: ApiClientSignatureVerifier class — a seam so tests can substitute it.
   *
   * @returns {typeof ApiClientSignatureVerifier} - The class.
   */
  static get ApiClientSignatureVerifierCtor () {
    return ApiClientSignatureVerifier
  }

  /**
   * get: RequestTimestampWindowInspector class — a seam so tests can substitute it.
   *
   * @returns {typeof RequestTimestampWindowInspector} - The class.
   */
  static get RequestTimestampWindowInspectorCtor () {
    return RequestTimestampWindowInspector
  }

  /**
   * Find the API client a signed request resolves to.
   *
   * A client is resolved only when the request names one that exists, presents a timestamp the
   * window accepts, and presents a signature computed under one of that client's secrets. Any of
   * the three failing resolves nobody, which the engine's filter answers as `401`.
   *
   * The access token the framework extracted is not read: this API authenticates by signature.
   *
   * @override
   * @param {{
   *   expressRequest: ExpressType.Request
   *   accessToken: string | null
   *   requestedAt?: Date
   * }} params - Parameters.
   * @returns {Promise<renchan.UserEntity | null>} - The API client, or null when the request
   * resolves to none.
   */
  static async findUser ({
    expressRequest,
    accessToken,
    requestedAt = new Date(),
  }) {
    const clientKey = this.extractClientKey({
      expressRequest,
    })

    if (clientKey === null) {
      return null
    }

    const apiClient = await this.findApiClient({
      clientKey,
    })

    if (apiClient === null) {
      return null
    }

    const isAcceptable = this.isAcceptableRequest({
      expressRequest,
      apiClient,
      requestedAt,
    })

    if (!isAcceptable) {
      return null
    }

    return apiClient
  }

  /**
   * Extract the client key a request names itself with.
   *
   * A header that was absent, or that arrived as the array a duplicated header becomes, names no
   * client, and is reported as null rather than handed to a query as some value it never stated.
   *
   * @param {{
   *   expressRequest: ExpressType.Request
   * }} params - Parameters.
   * @returns {string | null} - Client key, or null when the request names none.
   */
  static extractClientKey ({
    expressRequest,
  }) {
    const headerValue = this.extractHeaderValue({
      expressRequest,
      headerName: CLIENT_ID_HEADER_NAME,
    })

    if (typeof headerValue !== 'string') {
      return null
    }

    if (headerValue === '') {
      return null
    }

    return headerValue
  }

  /**
   * Extract the value of one request header, as the request presented it.
   *
   * @param {{
   *   expressRequest: ExpressType.Request
   *   headerName: string
   * }} params - Parameters.
   * @returns {*} - Header value, or null when the header is absent.
   */
  static extractHeaderValue ({
    expressRequest,
    headerName,
  }) {
    return expressRequest
      ?.headers
      ?.[headerName]
      ?? null
  }

  /**
   * Find the registered client a client key names.
   *
   * @param {{
   *   clientKey: string
   * }} params - Parameters.
   * @returns {Promise<model.ApiClient | null>} - The API client, or null when no row carries
   * that client key.
   */
  static async findApiClient ({
    clientKey,
  }) {
    return /** @type {*} */ (
      this.ApiClientModel.findOne({
        where: {
          clientKey,
        },
      })
    )
  }

  /**
   * Check whether a request is one the named client may be held to have sent.
   *
   * Freshness is settled before the signature, so a request outside the window never reaches the
   * client's secrets at all.
   *
   * @param {{
   *   expressRequest: ExpressType.Request
   *   apiClient: model.ApiClient
   *   requestedAt: Date
   * }} params - Parameters.
   * @returns {boolean} - True when the request is fresh and signed.
   */
  static isAcceptableRequest ({
    expressRequest,
    apiClient,
    requestedAt,
  }) {
    const isFresh = this.isFreshRequest({
      expressRequest,
      requestedAt,
    })

    if (!isFresh) {
      return false
    }

    return this.isSignedRequest({
      expressRequest,
      apiClient,
    })
  }

  /**
   * Check whether the timestamp a request presents sits inside the freshness window.
   *
   * @param {{
   *   expressRequest: ExpressType.Request
   *   requestedAt: Date
   * }} params - Parameters.
   * @returns {boolean} - True when the timestamp is acceptable.
   */
  static isFreshRequest ({
    expressRequest,
    requestedAt,
  }) {
    const timestampHeaderValue = this.extractHeaderValue({
      expressRequest,
      headerName: TIMESTAMP_HEADER_NAME,
    })

    const inspector = this.createRequestTimestampWindowInspector()

    return inspector.isAcceptableTimestamp({
      timestampHeaderValue,
      now: requestedAt,
    })
  }

  /**
   * Create the inspector that judges a timestamp against the freshness window.
   *
   * @returns {RequestTimestampWindowInspector} - The inspector.
   */
  static createRequestTimestampWindowInspector () {
    return this.RequestTimestampWindowInspectorCtor.create()
  }

  /**
   * Check whether a request carries a signature computed under one of the client's secrets.
   *
   * @param {{
   *   expressRequest: ExpressType.Request
   *   apiClient: model.ApiClient
   * }} params - Parameters.
   * @returns {boolean} - True when the signature verifies.
   */
  static isSignedRequest ({
    expressRequest,
    apiClient,
  }) {
    const currentSecret = this.decryptSecret({
      envelope: apiClient.secretCiphertext,
    })

    const previousSecret = this.decryptSecret({
      envelope: apiClient.previousSecretCiphertext,
    })

    const verifier = this.createApiClientSignatureVerifier({
      currentSecret,
      previousSecret,
    })

    const signatureHeaderValue = this.extractHeaderValue({
      expressRequest,
      headerName: SIGNATURE_HEADER_NAME,
    })

    const timestampHeaderValue = this.extractHeaderValue({
      expressRequest,
      headerName: TIMESTAMP_HEADER_NAME,
    })

    const rawBody = this.extractRawBody({
      expressRequest,
    })

    return verifier.isAcceptableSignature({
      signatureHeaderValue,
      timestampHeaderValue,
      rawBody,
    })
  }

  /**
   * Decrypt one stored secret envelope back into the secret it holds.
   *
   * @param {{
   *   envelope: string | null
   * }} params - Parameters.
   * @returns {string | null} - Secret, or null when the envelope holds none.
   */
  static decryptSecret ({
    envelope,
  }) {
    const cipher = this.createApiClientSecretCipher()

    return cipher.decryptSecret({
      envelope,
    })
  }

  /**
   * Create the cipher that opens a stored secret envelope.
   *
   * @returns {ApiClientSecretCipher} - The cipher.
   */
  static createApiClientSecretCipher () {
    return this.ApiClientSecretCipherCtor.create()
  }

  /**
   * Create the verifier that holds a client's secrets.
   *
   * @param {{
   *   currentSecret: string | null
   *   previousSecret: string | null
   * }} params - Parameters.
   * @returns {ApiClientSignatureVerifier} - The verifier.
   */
  static createApiClientSignatureVerifier ({
    currentSecret,
    previousSecret,
  }) {
    return this.ApiClientSignatureVerifierCtor.create({
      currentSecret: /** @type {*} */ (currentSecret),
      previousSecret,
    })
  }

  /**
   * Extract the bytes of the request body exactly as they arrived.
   *
   * `AppRestfulApiServerEngine#defineKeepRawBodyCallback()` sets this from the body parsers'
   * `verify` hook, so a request the engine parsed no body for carries none. Absent is reported as
   * null and never as an empty body, which is a string somebody could have signed.
   *
   * @param {{
   *   expressRequest: ExpressType.Request
   * }} params - Parameters.
   * @returns {*} - Raw body, or null when the request carries none.
   */
  static extractRawBody ({
    expressRequest,
  }) {
    return expressRequest
      ?.[RAW_BODY_PROPERTY_NAME]
      ?? null
  }

  /**
   * get: API client entity.
   * Note: This is an alias of #userEntity
   *
   * @returns {renchan.UserEntity | null} - API client entity.
   * @example
   * ```js
   * async render ({ context }) {
   *   const apiClientEntity = context.apiClient
   * }
   * ```
   */
  get apiClient () {
    return this.userEntity
  }

  /**
   * get: API client id.
   *
   * @returns {number | null} - API client id.
   * @example
   * ```js
   * async render ({ context }) {
   *   const id = context.apiClientId
   * }
   * ```
   */
  get apiClientId () {
    return this.userId
  }
}
