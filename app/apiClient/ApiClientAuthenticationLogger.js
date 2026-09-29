import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import {
  env,
  rootPath,
} from '../globals/_.js'

const LOG_FILE_PATH = rootPath.to('logs/api-client-authentication-')
const REFUSAL_MESSAGE = 'API client authentication refused'
const LOGGER_TAG = 'ApiClientAuthentication'

/*
 * The message names the environment variable and never what it holds. It is a fixed literal for
 * that reason, and `#logUnusableEncryptionKey()` takes no argument at all: a line nothing can be
 * handed a value for is a line that cannot carry the key, whether the live one or the one a
 * rotation is bringing in.
 */
const UNUSABLE_ENCRYPTION_KEY_MESSAGE = 'API client secret encryption key is unusable: API_CLIENT_SECRET_ENCRYPTION_KEY does not hold the 64 hex characters AES-256 takes, so every client is being refused'
const UNUSABLE_ENCRYPTION_KEY_TAG = 'UnusableEncryptionKey'

/*
 * One logger client per process, rather than one per refusal.
 *
 * The client owns a rotating file, so building one per refused request would open a handle each
 * time a request is refused — which is precisely the moment a service is being probed and is
 * receiving many. `@openreachtech/mentsu-logger` writes only under `NODE_ENV=production`, so under
 * the test and development environments this client is built and then never asked to write.
 */
const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * Writes the one line a refused authentication leaves behind.
 *
 * **Why refusals are logged at all.** Nothing else records them. A wrong signature, a client key
 * naming no row, and a request against a client somebody switched off are each answered with a
 * bare status and, until this class, left no trace — so key probing and a brute-force run against
 * one client's signature were both invisible, and an operator had nothing to count.
 *
 * **Why one class rather than a log line at each site.** The refusals are decided in three places
 * — the context that resolves a client, the freshness-and-signature check, and the engine's filter
 * that answers `403`. Gathering the writing here is what makes "a secret is never logged" a rule
 * held in one readable place instead of a habit repeated at every site.
 *
 * **What a line carries, and what it may never carry.** An API client id, when one was resolved,
 * and the reason code naming which check refused. Nothing else: not the secret in either its live
 * or its rotating form, not the signature computed under it, not the request body, and not the
 * client key the request presented — an unresolved key is a string somebody else chose, and a
 * resolved one is already named by the id. Section 7 of the spec fixes that list.
 *
 * **Why the unusable-key line is written here too.** It refuses no single request — it says the
 * deployment's secret encryption key cannot open any envelope, so every client is being turned
 * away at once — but it is the one other line this area writes, and it is the line under the most
 * pressure to carry the very thing that may never be logged. Keeping it in the class that holds
 * that rule is what lets the rule be read in one place rather than trusted at two.
 */
export default class ApiClientAuthenticationLogger {
  /**
   * Constructor.
   *
   * @param {ApiClientAuthenticationLoggerParams} params - Parameters.
   */
  constructor ({
    logger,
  }) {
    this.logger = logger
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof ApiClientAuthenticationLogger ? X : never} T, X
   * @param {ApiClientAuthenticationLoggerFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    logger = this.mentsuLogger,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        logger,
      })
    )
  }

  /**
   * get: the one logger client this process writes through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * Write the line a refused authentication leaves behind.
   *
   * The reason code and the API client id travel as tags rather than inside the message, so that
   * every line reads the same and a count per reason code is a search rather than a parse.
   *
   * @param {{
   *   reasonCode: string
   *   apiClientId: number | null
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logRefusedAuthentication ({
    reasonCode,
    apiClientId,
  }) {
    this.logger.warn({
      message: REFUSAL_MESSAGE,
      tags: this.buildRefusalTags({
        reasonCode,
        apiClientId,
      }),
    })
  }

  /**
   * Build the tags one refusal is found by.
   *
   * @param {{
   *   reasonCode: string
   *   apiClientId: number | null
   * }} params - Parameters.
   * @returns {Array<string>} Tags.
   */
  buildRefusalTags ({
    reasonCode,
    apiClientId,
  }) {
    return [
      LOGGER_TAG,
      `reasonCode:${reasonCode}`,
      `apiClientId:${apiClientId}`,
    ]
  }

  /**
   * Write the line an unusable secret encryption key leaves behind.
   *
   * **Why this line exists at all.** A key that is not an AES-256 key stops `ApiClientSecretCipher`
   * at construction, and the framework turns that exception into a `500` answering `Unknown Error`
   * — which tells an operator nothing, and in production is the only thing they would ever see.
   * The throw reaches the caller unchanged; this line is what says why, on the one host where the
   * stack trace does not.
   *
   * **Why `error` rather than `warn`.** A refused request is one caller's problem; an unusable key
   * refuses every client in the deployment until somebody fixes the environment, so it belongs on
   * the level an operator watches.
   *
   * @returns {void}
   * @public
   */
  logUnusableEncryptionKey () {
    this.logger.error({
      message: UNUSABLE_ENCRYPTION_KEY_MESSAGE,
      tags: this.buildUnusableEncryptionKeyTags(),
    })
  }

  /**
   * Build the tags an unusable secret encryption key is found by.
   *
   * @returns {Array<string>} Tags.
   */
  buildUnusableEncryptionKeyTags () {
    return [
      LOGGER_TAG,
      UNUSABLE_ENCRYPTION_KEY_TAG,
    ]
  }
}

/**
 * @typedef {{
 *   logger: MentsuLogger
 * }} ApiClientAuthenticationLoggerParams
 */

/**
 * @typedef {Partial<ApiClientAuthenticationLoggerParams>} ApiClientAuthenticationLoggerFactoryParams
 */
