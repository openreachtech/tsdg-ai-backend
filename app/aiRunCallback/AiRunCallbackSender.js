import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import {
  env,
  rootPath,
} from '../globals/_.js'

const REQUEST_METHOD = 'POST'

const CONTENT_TYPE_HEADER_NAME = 'content-type'
const JSON_CONTENT_TYPE = 'application/json'

/*
 * How long one callback may take before it is given up as an attempt that never completed.
 *
 * Ten seconds. The body is one run's result and the far side has only to accept it, so a client
 * that has not answered a small POST in ten seconds is not about to. The callback is retried, so a
 * shorter limit reaches the next attempt sooner rather than losing anything — which is the
 * opposite of a media fetch, where giving up early loses a file the run needs and the limit is
 * three times this one.
 */
const DEFAULT_REQUEST_TIMEOUT_MILLISECONDS = 10000

const LOG_FILE_PATH = rootPath.to('logs/ai-run-callback-')

/*
 * What a failure is reported as when it came back as something with no class of its own — a thrown
 * string, or a thrown null. Nothing in `fetch` does that today; the fallback is here so that the
 * line is still written rather than the logging itself faulting inside a catch.
 */
const UNNAMED_ERROR_NAME = 'Error'

const FAILED_AI_RUN_CALLBACK_TAGS = [
  'AiRunCallback',
  'FailedSend',
]

/*
 * One logger client per process rather than one per failure: the client owns a rotating file, and
 * a client whose service is down fails the callback of every run it owns at once, which is exactly
 * when these lines are written.
 */
const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * Posts one terminal callback to a client's registered URL.
 *
 * **It is the whole of the outbound request, and it decides nothing.** Whether the URL may be
 * posted to at all is `AiRunCallbackUrlInspector`'s, what the headers are is
 * `AiRunCallbackSigner`'s, and what the body is is `AiRunResponseBuilder`'s. This class takes the
 * three and performs the request, so that substituting the network in a test is substituting one
 * member of one class.
 *
 * **The outcome is a status code, or null when the request never completed.** That is exactly what
 * `ai_run_callback_deliveries.http_status_code` holds, and it is the shape for the same reason:
 * "the request was refused with a 503" and "there was nothing on the other end" are two different
 * facts about an attempt that was made either way. A status is answered whatever it is — a `4xx`
 * is an answer, and whether it is worth retrying is the job's question and not this class's.
 *
 * **A failure is answered, never thrown.** Every way the call can fail — a connection refused, a
 * host that does not resolve, a timeout — is the null this returns, so the caller writes one
 * branch and meets no exception raised inside `fetch`.
 *
 * **What the line written on a failure carries, and what it does not.** The durable record of an
 * attempt is the row, not the line: the row says an attempt was made and that nothing answered.
 * What the row cannot say is *which* way it failed, so the line carries the error's own class name
 * and the run key, and neither the callback URL nor the message the error composed out of it —
 * a callback URL is the client's own and is content under section 7's personal-data row, and an
 * error message quotes it back.
 *
 * **No response body is read.** Section 12 is explicit that a delivery record says whether the
 * callback arrived and not what came back, so nothing here reads one: a body read would be a
 * client's payload held in this process for no purpose the record has a column for.
 */
export default class AiRunCallbackSender {
  /**
   * Constructor.
   *
   * @param {AiRunCallbackSenderParams} params - Parameters.
   */
  constructor ({
    requestTimeoutMilliseconds,
  }) {
    this.requestTimeoutMilliseconds = requestTimeoutMilliseconds
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunCallbackSender ? X : never} T, X
   * @param {AiRunCallbackSenderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    requestTimeoutMilliseconds = DEFAULT_REQUEST_TIMEOUT_MILLISECONDS,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        requestTimeoutMilliseconds,
      })
    )
  }

  /**
   * get: the function that performs the outbound request.
   *
   * It is reached through this getter and never as the global directly, so a test substitutes the
   * network by overriding one member instead of reaching for a module mock.
   *
   * @returns {typeof globalThis.fetch} The fetch function.
   */
  static get fetchClient () {
    return globalThis.fetch
  }

  /**
   * get: the signal class the request's time limit is built from.
   *
   * @returns {typeof AbortSignal} The class.
   */
  static get AbortSignalCtor () {
    return AbortSignal
  }

  /**
   * get: the logger client this process writes failed callbacks through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCallbackSender} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCallbackSender} */ (this.constructor)
  }

  /**
   * Post one terminal callback, and answer what came of it.
   *
   * @param {SendAiRunCallbackParams} params - Parameters.
   * @returns {Promise<AiRunCallbackSendOutcome>} The status the far side answered with, or null
   * when the request never completed.
   * @public
   */
  async sendAiRunCallback ({
    callbackUrl,
    headerHash,
    rawBody,
    runKey,
  }) {
    const requestOptions = this.buildRequestOptions({
      headerHash,
      rawBody,
    })

    try {
      const response = await this.Ctor.fetchClient(callbackUrl, requestOptions)

      return {
        httpStatusCode: response.status,
      }
    } catch (error) {
      this.logFailedAiRunCallback({
        runKey,
        error,
      })

      return {
        httpStatusCode: null,
      }
    }
  }

  /**
   * Build the options the outbound request is made with.
   *
   * The content type is added here rather than by the signer, because it describes the body this
   * class sends and is no part of the signed protocol — the signature is computed over the bytes,
   * and a header naming their type is not among what a client verifies.
   *
   * @param {{
   *   headerHash: Record<string, string>
   *   rawBody: string
   * }} params - Parameters.
   * @returns {RequestInit} Request options.
   * @public
   */
  buildRequestOptions ({
    headerHash,
    rawBody,
  }) {
    const headers = {
      ...headerHash,
      [CONTENT_TYPE_HEADER_NAME]: JSON_CONTENT_TYPE,
    }

    const signal = this.Ctor.AbortSignalCtor.timeout(this.requestTimeoutMilliseconds)

    return {
      method: REQUEST_METHOD,
      headers,
      body: rawBody,
      signal,
    }
  }

  /**
   * Write the line naming how one callback failed to complete.
   *
   * @param {{
   *   runKey: string
   *   error: *
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logFailedAiRunCallback ({
    runKey,
    error,
  }) {
    const errorName = this.extractErrorName({
      error,
    })

    this.Ctor.mentsuLogger.error({
      message: `AiRunCallbackSender#sendAiRunCallback() did not complete: runKey ${runKey}, error ${errorName}`,
      tags: FAILED_AI_RUN_CALLBACK_TAGS,
    })
  }

  /**
   * Extract the class name of whatever the request failed with.
   *
   * The name alone is what is written. An error's message quotes the URL it was composed from, and
   * the URL is the client's own.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {string} The error's class name.
   * @public
   */
  extractErrorName ({
    error,
  }) {
    return error?.name
      ?? UNNAMED_ERROR_NAME
  }
}

/**
 * @typedef {{
 *   requestTimeoutMilliseconds: number
 * }} AiRunCallbackSenderParams
 */

/**
 * @typedef {Partial<AiRunCallbackSenderParams>} AiRunCallbackSenderFactoryParams
 */

/**
 * @typedef {{
 *   callbackUrl: string
 *   headerHash: Record<string, string>
 *   rawBody: string
 *   runKey: string
 * }} SendAiRunCallbackParams
 */

/**
 * What one attempt came to. The status is null when the request never completed.
 *
 * @typedef {{
 *   httpStatusCode: number | null
 * }} AiRunCallbackSendOutcome
 */
