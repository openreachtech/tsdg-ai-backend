import {
  BaseRestfulApiContext,
} from '@openreachtech/renchan'

import ApiClientAuthenticationLogger from '../../../app/apiClient/ApiClientAuthenticationLogger.js'
import ApiClientSecretCipher from '../../../app/apiClient/ApiClientSecretCipher.js'
import ApiClientSignatureVerifier from '../../../app/apiClient/ApiClientSignatureVerifier.js'
import RequestTimestampWindowInspector from '../../../app/apiClient/RequestTimestampWindowInspector.js'

import API_CLIENT_AUTHENTICATION_CONSTANT_HASH from '../../../app/constants/apiClientAuthenticationConstants.js'

import ApiClient from '../../../sequelize/models/ApiClient.js'

const {
  API_CLIENT_AUTHENTICATION_REFUSAL_REASON,
} = API_CLIENT_AUTHENTICATION_CONSTANT_HASH

const CLIENT_ID_HEADER_NAME = 'x-ort-client-id'
const TIMESTAMP_HEADER_NAME = 'x-ort-timestamp'
const SIGNATURE_HEADER_NAME = 'x-ort-signature'
const RAW_BODY_PROPERTY_NAME = 'rawBody'
const SECRET_ENVELOPE_FIELD_NAMES = [
  'secretCiphertext',
  'previousSecretCiphertext',
]

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
 * **Why the client is read twice.** `ApiClient` excludes its two secret envelopes by default, so
 * the row `.findApiClient()` answers with — the row that goes on to be `context.userEntity` and is
 * reachable from every renderer — carries no secret at all. Verifying a signature does need them,
 * so `.findSecretBearingApiClient()` asks for those two fields alone, by an `unscoped()` read that
 * says out loud what it is for, and the row it answers with is handed to the signature check and
 * dropped there. One extra read per request buys a client secret that no renderer can reach even
 * by accident.
 *
 * **Why a refusal is written to the log.** A refused request is answered with a bare status and is
 * told nothing more, which is right for the caller and useless for the operator: until it was
 * logged, a client key naming no row and a signature that did not verify looked identical from
 * outside and left nothing to count. A refusal that names a client key writes one line saying
 * which check refused, through `ApiClientAuthenticationLogger`, which is also the class that holds
 * what such a line may never carry.
 *
 * **Why a request naming no client key writes nothing.** That is the one refusal reachable without
 * a credential of any kind: a caller that sends no `x-ort-client-id` at all is refused before a
 * row is read, so anyone who can reach this service can drive that path as fast as it answers. One
 * line per such request is one disk write per request, and the rotated files those writes fill are
 * pruned by nothing this project owns. The line would also say nothing: no client was named, so
 * there is no id to record, and the reason is the same every time — it would carry no more than
 * "a request arrived", which the access log already says. The lines that are kept are the ones a
 * caller had to know a valid client key to produce — a wrong signature, a timestamp outside the
 * window, a switched-off client — because each of those says somebody is working on one
 * particular client, which is worth counting.
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
   * get: ApiClientAuthenticationLogger class — a seam so tests can substitute it.
   *
   * @returns {typeof ApiClientAuthenticationLogger} - The class.
   */
  static get ApiClientAuthenticationLoggerCtor () {
    return ApiClientAuthenticationLogger
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
      this.logRefusedAuthentication({
        reasonCode: API_CLIENT_AUTHENTICATION_REFUSAL_REASON.UNKNOWN_CLIENT_KEY,
        apiClientId: null,
      })

      return null
    }

    const secretBearingApiClient = await this.findSecretBearingApiClient({
      clientKey,
    })

    if (secretBearingApiClient === null) {
      this.logRefusedAuthentication({
        reasonCode: API_CLIENT_AUTHENTICATION_REFUSAL_REASON.UNKNOWN_CLIENT_KEY,
        apiClientId: apiClient.id,
      })

      return null
    }

    const isAcceptable = this.isAcceptableRequest({
      expressRequest,
      apiClient: secretBearingApiClient,
      requestedAt,
      apiClientId: apiClient.id,
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
   * Write the line a refused authentication leaves behind.
   *
   * @param {{
   *   reasonCode: string
   *   apiClientId: number | null
   * }} params - Parameters.
   * @returns {void}
   */
  static logRefusedAuthentication ({
    reasonCode,
    apiClientId,
  }) {
    const logger = this.createApiClientAuthenticationLogger()

    logger.logRefusedAuthentication({
      reasonCode,
      apiClientId,
    })
  }

  /**
   * Create the logger a refused authentication is written through.
   *
   * @returns {ApiClientAuthenticationLogger} - The logger.
   */
  static createApiClientAuthenticationLogger () {
    return this.ApiClientAuthenticationLoggerCtor.create()
  }

  /**
   * Find the registered client a client key names.
   *
   * The row this answers with is the one that becomes `context.userEntity`, so it carries no
   * secret: `ApiClient`'s default scope leaves both envelopes out, and this read does not ask for
   * them back.
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
   * Find the two secret envelopes a client key's row holds, and nothing else of it.
   *
   * This is the one read in the application that asks for a client secret, which is why it is the
   * one place `unscoped()` is written: the word at this call site is what tells a reader the
   * omission everywhere else is deliberate. The row is handed to the signature check and dropped
   * there — it never becomes `context.userEntity` and never reaches a renderer.
   *
   * @param {{
   *   clientKey: string
   * }} params - Parameters.
   * @returns {Promise<model.ApiClient | null>} - The API client carrying its secret envelopes, or
   * null when no row carries that client key.
   */
  static async findSecretBearingApiClient ({
    clientKey,
  }) {
    return /** @type {*} */ (
      this.ApiClientModel
        .unscoped()
        .findOne({
          where: {
            clientKey,
          },
          attributes: SECRET_ENVELOPE_FIELD_NAMES,
        })
    )
  }

  /**
   * Check whether a request is one the named client may be held to have sent.
   *
   * Freshness is settled before the signature, so a request outside the window never reaches the
   * client's secrets at all.
   *
   * This is also the only place that knows which of the two checks refused, so it is where the
   * two reason codes they are logged under are written. `apiClientId` is carried in for that line
   * alone — the row handed in holds the secret envelopes and nothing that names the client.
   *
   * @param {IsAcceptableRequestParams} params - Parameters.
   * @returns {boolean} - True when the request is fresh and signed.
   */
  static isAcceptableRequest ({
    expressRequest,
    apiClient,
    requestedAt,
    apiClientId,
  }) {
    const isFresh = this.isFreshRequest({
      expressRequest,
      requestedAt,
    })

    if (!isFresh) {
      this.logRefusedAuthentication({
        reasonCode: API_CLIENT_AUTHENTICATION_REFUSAL_REASON.STALE_TIMESTAMP,
        apiClientId,
      })

      return false
    }

    const isSigned = this.isSignedRequest({
      expressRequest,
      apiClient,
    })

    if (isSigned) {
      return true
    }

    this.logRefusedAuthentication({
      reasonCode: API_CLIENT_AUTHENTICATION_REFUSAL_REASON.SIGNATURE_MISMATCH,
      apiClientId,
    })

    return false
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
   * **Why the failure is logged here rather than inside the cipher.** The cipher refuses an
   * encryption key that is not an AES-256 key, and refusing is all it should do — it is reached
   * from a seeder as well as from a request, and only one of those two ends in a framework that
   * swallows the reason. This is that one: the exception leaves here, the engine turns it into a
   * `500` answering `Unknown Error`, and in production no stack trace is printed anywhere. Logging
   * at the construction site is what gives the operator the sentence the caller never gets, and it
   * leaves the seeder's operator the terminal output they already had.
   *
   * **Log, then rethrow.** The caller still meets the exception unchanged — nothing is swallowed,
   * so a deployment with an unusable key goes on refusing every request exactly as it did.
   *
   * @returns {ApiClientSecretCipher} - The cipher.
   * @throws {Error} When the environment declares no usable encryption key.
   */
  static createApiClientSecretCipher () {
    try {
      return this.ApiClientSecretCipherCtor.create()
    } catch (unusableEncryptionKeyFailure) {
      this.logUnusableEncryptionKey()

      throw unusableEncryptionKeyFailure
    }
  }

  /**
   * Write the line an unusable secret encryption key leaves behind.
   *
   * The line names the environment variable and carries nothing of what it holds — the logger's
   * method takes no argument, so there is nothing here that could pass one.
   *
   * @returns {void}
   */
  static logUnusableEncryptionKey () {
    const logger = this.createApiClientAuthenticationLogger()

    logger.logUnusableEncryptionKey()
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

/**
 * @typedef {{
 *   expressRequest: ExpressType.Request
 *   apiClient: model.ApiClient
 *   requestedAt: Date
 *   apiClientId: number | null
 * }} IsAcceptableRequestParams
 */
