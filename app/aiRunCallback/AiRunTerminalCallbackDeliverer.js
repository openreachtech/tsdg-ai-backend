import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunCallbackDeliveryRecorder from './AiRunCallbackDeliveryRecorder.js'
import AiRunCallbackSender from './AiRunCallbackSender.js'
import AiRunCallbackSigner from './AiRunCallbackSigner.js'
import AiRunCallbackUrlInspector from './AiRunCallbackUrlInspector.js'

import AiRunResponseBuilder from '../aiRun/AiRunResponseBuilder.js'

import ApiClientAuthenticationLogger from '../apiClient/ApiClientAuthenticationLogger.js'
import ApiClientSecretCipher from '../apiClient/ApiClientSecretCipher.js'

import AI_RUN_CALLBACK_DELIVERY_CATEGORY_CONSTANT_HASH from '../constants/aiRunCallbackDeliveryCategoryConstants.js'

import AiRun from '../../sequelize/models/AiRun.js'
import ApiClient from '../../sequelize/models/ApiClient.js'

import {
  env,
  rootPath,
} from '../globals/_.js'

const {
  AI_RUN_CALLBACK_DELIVERY_CATEGORY,
} = AI_RUN_CALLBACK_DELIVERY_CATEGORY_CONSTANT_HASH

/*
 * The fields the client's row is read for, and the whole of them.
 *
 * `secretCiphertext` is excluded from `ApiClient`'s default scope, so a read that wants it names
 * it — which is what the model's own note asks of the one other reader that does. The envelope of
 * the secret being **rotated out** is deliberately not among them: either of a client's two
 * secrets is accepted on the way *in* while a rotation is under way, because the client signed its
 * request before it was told about the new one. An outbound callback is the opposite direction and
 * has no such excuse — this service knows which secret is current, so it signs with that one and
 * never reaches for the other.
 */
const CALLBACK_TARGET_FIELD_NAMES = [
  'clientKey',
  'callbackUrlPrefix',
  'secretCiphertext',
]

/*
 * The reasons a terminal callback is not attempted at all.
 *
 * They are the vocabulary of one decision — whether a request was made — and they travel two ways:
 * into the line an operator reads, and into the job's own result. A refusal is not a failure to
 * deliver: nothing was sent, so there is no delivery row, and there is nothing a later attempt
 * would do differently, which is why the worker answers on each of them rather than retrying.
 *
 * They are held here rather than in `app/constants/` because one class produces them and no seeder
 * or migration reads them. The day a second reader needs the vocabulary, it moves.
 */
const AI_RUN_CALLBACK_REFUSAL_REASON = {
  UNKNOWN_AI_RUN: 'unknown-ai-run',
  UNKNOWN_API_CLIENT: 'unknown-api-client',
  UNREGISTERED_CALLBACK_URL: 'unregistered-callback-url',
  UNREADABLE_AI_RUN_RESPONSE: 'unreadable-ai-run-response',
  UNSIGNABLE_CLIENT_SECRET: 'unsignable-client-secret',
}

/*
 * The status codes that count as delivered.
 *
 * Any `2xx`. A redirect is not a delivery: a client answering a callback with a `301` has not
 * accepted the body, so the range stops where redirects begin.
 *
 * A `3xx` does reach here, and it did not before. `AiRunCallbackSender` sends
 * `redirect: 'manual'` and follows a hop by hand only while this client's own inspector answers
 * for it, and what it answers for a chain it refused or ran out of is the `3xx` of the hop it
 * would not follow. So a `3xx` on a row means a redirect that went unfollowed — either because
 * the client named somewhere it never registered, or because the chain was longer than three hops
 * — and the retry that follows is the same retry any other undelivered status gets.
 */
const DELIVERED_STATUS_CODE_MINIMUM = 200
const DELIVERED_STATUS_CODE_LIMIT = 300

const LOG_FILE_PATH = rootPath.to('logs/ai-run-callback-')

const REFUSED_TERMINAL_CALLBACK_TAGS = [
  'AiRunCallback',
  'RefusedDelivery',
]

/*
 * One logger client per process, beside the one `AiRunCallbackSender` holds: both write the
 * callback's own file, because a reader following one run's callback wants the refusal and the
 * failed send in the same place.
 */
const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * Posts one attempt at a run's terminal callback, and records that the attempt was made.
 *
 * **It is the orchestration section 12 is spread across, and it owns none of the steps.** The body
 * is `AiRunResponseBuilder`'s, the signature `AiRunCallbackSigner`'s, the refusal of an
 * unregistered URL `AiRunCallbackUrlInspector`'s, the request `AiRunCallbackSender`'s and the row
 * `AiRunCallbackDeliveryRecorder`'s. What is decided here is the order they run in and what stops
 * the sequence — which is why it is a class of its own rather than a method of a worker: no queue
 * is needed to run it, and no queue is needed to test the order either.
 *
 * **The URL is judged before anything is built.** Section 12's second acceptance criterion is that
 * a callback URL not matching the client's registered prefix is not called at all, and "at all" is
 * read strictly here: the run's body is not assembled, nothing is signed, and the client's secret
 * envelope is never opened. Refusing after building would be the same behavior on the wire and a
 * different behavior inside the process.
 *
 * **The envelope itself is read before the URL is judged, and that is said rather than glossed.**
 * One read answers for the client, and it asks for `callbackUrlPrefix` and `secretCiphertext`
 * together, because the prefix is what the judgement needs and the same row carries both. So a run
 * whose URL is refused had its client's envelope in this process for the length of a comparison,
 * and dropped it. What it never had is the secret: an envelope is ciphertext, the key that opens
 * it lives in the environment, and `#extractClientSecret()` — the one place that applies it — is
 * reached from `#buildCallbackHeaderHash()` alone, which `#attemptTerminalCallback()` calls once
 * the URL has passed. A describe asserts that the cipher is not asked on a refusal, so the
 * sentence above is checked rather than claimed.
 *
 * Splitting the read in two — the prefix first, the envelope only after the URL passes — was the
 * other way to make that sentence true, and it was not taken: it would buy one fewer ciphertext in
 * memory at the cost of a second query, a second not-found branch, and a refusal reason
 * indistinguishable from the first one's, which is a worse trade for an operator reading the log
 * than for an attacker reading the process.
 *
 * **A refused URL records no attempt.** `ai_run_callback_deliveries` holds one row per attempt at
 * posting, carrying the instant it was attempted at and the status the far side gave; a row for
 * something never sent would claim an attempt was made, and the retry count section 12's eighth
 * criterion is read from would count it. Nothing was attempted, so nothing is recorded — and the
 * reason is written to the log instead, where an operator asking why a client never heard back can
 * find it.
 *
 * **The body is serialized once, and the same bytes are signed and sent.** A signature is computed
 * over `timestamp + "." + rawBody`, so a body serialized twice — once to sign, once to send — is a
 * signature over bytes the client did not receive the moment any key order or number formatting
 * differs between the two calls. One `JSON.stringify`, one string, handed to both.
 *
 * **One instant, three uses.** The attempt's time is taken once and is the timestamp that is
 * signed, the timestamp that travels in the header, and the value the row records. A clock read
 * twice would put a signature computed over one second into a request presenting another.
 */
export default class AiRunTerminalCallbackDeliverer {
  /**
   * Constructor.
   *
   * @param {AiRunTerminalCallbackDelivererParams} params - Parameters.
   */
  constructor ({
    apiClientSecretCipher,
    aiRunResponseBuilder,
    aiRunCallbackSigner,
    aiRunCallbackSender,
    aiRunCallbackDeliveryRecorder,
    aiRunCallbackUrlInspectorFactory,
  }) {
    this.apiClientSecretCipher = apiClientSecretCipher
    this.aiRunResponseBuilder = aiRunResponseBuilder
    this.aiRunCallbackSigner = aiRunCallbackSigner
    this.aiRunCallbackSender = aiRunCallbackSender
    this.aiRunCallbackDeliveryRecorder = aiRunCallbackDeliveryRecorder
    this.aiRunCallbackUrlInspectorFactory = aiRunCallbackUrlInspectorFactory
  }

  /**
   * Factory method.
   *
   * The inspector arrives as a class rather than as an instance, because one inspector answers for
   * one client's registered prefix and the prefix is not known until a run has been read.
   *
   * @template {X extends typeof AiRunTerminalCallbackDeliverer ? X : never} T, X
   * @param {AiRunTerminalCallbackDelivererFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    apiClientSecretCipher = this.createApiClientSecretCipher(),
    aiRunResponseBuilder = this.createAiRunResponseBuilder(),
    aiRunCallbackSigner = this.createAiRunCallbackSigner(),
    aiRunCallbackSender = this.createAiRunCallbackSender(),
    aiRunCallbackDeliveryRecorder = this.createAiRunCallbackDeliveryRecorder(),
    aiRunCallbackUrlInspectorFactory = AiRunCallbackUrlInspector,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        apiClientSecretCipher,
        aiRunResponseBuilder,
        aiRunCallbackSigner,
        aiRunCallbackSender,
        aiRunCallbackDeliveryRecorder,
        aiRunCallbackUrlInspectorFactory,
      })
    )
  }

  /**
   * get: the run model.
   *
   * @returns {typeof AiRun} Model.
   */
  static get AiRunCtor () {
    return AiRun
  }

  /**
   * get: the registered caller model.
   *
   * @returns {typeof ApiClient} Model.
   */
  static get ApiClientCtor () {
    return ApiClient
  }

  /**
   * get: the logger client this process writes refused callbacks through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * get: the logger an unusable secret encryption key is named through.
   *
   * @returns {typeof ApiClientAuthenticationLogger} The class.
   */
  static get ApiClientAuthenticationLoggerCtor () {
    return ApiClientAuthenticationLogger
  }

  /**
   * Create the cipher a stored client secret is read back through.
   *
   * **Why the failure is logged here rather than inside the cipher.** The cipher refuses an
   * encryption key that is not an AES-256 key, and refusing is all it should do. This is the third
   * place that constructs it, and the second whose caller never sees the reason:
   * `AppRestfulApiContext` states the principle — logging at the construction site is what gives
   * the operator the sentence the caller never gets — and here the caller is a worker daemon,
   * where the exception becomes a failed job and a retry rather than anything naming the
   * environment variable.
   *
   * **Log, then rethrow.** Nothing is swallowed: a deployment with an unusable key goes on
   * refusing every callback exactly as it did, and the line is what says why.
   *
   * @returns {ApiClientSecretCipher} Cipher.
   * @throws {Error} When the environment declares no usable encryption key.
   */
  static createApiClientSecretCipher () {
    try {
      return ApiClientSecretCipher.create()
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
    const apiClientAuthenticationLogger = this.createApiClientAuthenticationLogger()

    apiClientAuthenticationLogger.logUnusableEncryptionKey()
  }

  /**
   * Create the logger an unusable secret encryption key is written through.
   *
   * @returns {ApiClientAuthenticationLogger} Logger.
   */
  static createApiClientAuthenticationLogger () {
    return this.ApiClientAuthenticationLoggerCtor.create()
  }

  /**
   * Create the builder of the one body a run is answered with.
   *
   * @returns {AiRunResponseBuilder} Builder.
   */
  static createAiRunResponseBuilder () {
    return AiRunResponseBuilder.create()
  }

  /**
   * Create the signer of the outbound callback.
   *
   * @returns {AiRunCallbackSigner} Signer.
   */
  static createAiRunCallbackSigner () {
    return AiRunCallbackSigner.create()
  }

  /**
   * Create the sender that performs the outbound request.
   *
   * @returns {AiRunCallbackSender} Sender.
   */
  static createAiRunCallbackSender () {
    return AiRunCallbackSender.create()
  }

  /**
   * Create the recorder of one attempt.
   *
   * @returns {AiRunCallbackDeliveryRecorder} Recorder.
   */
  static createAiRunCallbackDeliveryRecorder () {
    return AiRunCallbackDeliveryRecorder.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunTerminalCallbackDeliverer} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunTerminalCallbackDeliverer} */ (this.constructor)
  }

  /**
   * Deliver one attempt at a run's terminal callback.
   *
   * The attempt's number arrives on the call because the queue is what knows it. Counting the rows
   * already written and adding one would read and write in two steps, and two workers retrying one
   * run would each read the same count and claim the same index.
   *
   * @param {{
   *   aiRunId: number
   *   attemptIndex: number
   * }} params - Parameters.
   * @returns {Promise<AiRunTerminalCallbackOutcome>} What the attempt came to.
   * @public
   */
  async deliverTerminalCallback ({
    aiRunId,
    attemptIndex,
  }) {
    const aiRun = await this.findAiRun({
      aiRunId,
    })

    if (aiRun === null) {
      return this.refuseTerminalCallback({
        aiRunId,
        refusalReasonCode: AI_RUN_CALLBACK_REFUSAL_REASON.UNKNOWN_AI_RUN,
      })
    }

    const apiClient = await this.findSecretBearingApiClient({
      apiClientId: aiRun.ApiClientId,
    })

    if (apiClient === null) {
      return this.refuseTerminalCallback({
        aiRunId,
        refusalReasonCode: AI_RUN_CALLBACK_REFUSAL_REASON.UNKNOWN_API_CLIENT,
      })
    }

    if (
      !this.isDeliverableAiRunCallbackUrl({
        aiRun,
        apiClient,
      })
    ) {
      return this.refuseTerminalCallback({
        aiRunId,
        refusalReasonCode: AI_RUN_CALLBACK_REFUSAL_REASON.UNREGISTERED_CALLBACK_URL,
      })
    }

    return this.attemptTerminalCallback({
      aiRun,
      apiClient,
      attemptIndex,
    })
  }

  /**
   * Find the run a callback is about.
   *
   * The run is read by its id and not by its key, because the id is what the job body carries and
   * what a delivery row hangs off. No client scope is applied here: the client is read *from* this
   * run a line later, and the body that travels is built by `AiRunResponseBuilder`, which scopes
   * its own read by that client — so the run a client is sent is still a run of that client's.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The run, or null when no row carries that id.
   * @public
   */
  async findAiRun ({
    aiRunId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunCtor.findOne({
        where: {
          id: aiRunId,
        },
      })
    )
  }

  /**
   * Find the registered caller a callback goes to, carrying the secret it is signed under.
   *
   * This is the second read in the application that asks for a client secret, and it says
   * `unscoped()` for the reason the first one does: the word at the call site is what tells a
   * reader that its absence everywhere else is deliberate. The row signs one request and is
   * dropped here; it never becomes part of a body, a log line or a job result.
   *
   * @param {{
   *   apiClientId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The client, or null when no row carries that id.
   * @public
   */
  async findSecretBearingApiClient ({
    apiClientId,
  }) {
    return /** @type {*} */ (
      this.Ctor.ApiClientCtor
        .unscoped()
        .findOne({
          where: {
            id: apiClientId,
          },
          attributes: CALLBACK_TARGET_FIELD_NAMES,
        })
    )
  }

  /**
   * Check whether this run's callback URL is one its client registered.
   *
   * @param {{
   *   aiRun: *
   *   apiClient: *
   * }} params - Parameters.
   * @returns {boolean} Whether it may be posted to.
   * @public
   */
  isDeliverableAiRunCallbackUrl ({
    aiRun,
    apiClient,
  }) {
    const aiRunCallbackUrlInspector = this.createAiRunCallbackUrlInspector({
      callbackUrlPrefix: apiClient.callbackUrlPrefix,
    })

    return aiRunCallbackUrlInspector.isDeliverableCallbackUrl({
      callbackUrl: aiRun.callbackUrl,
    })
  }

  /**
   * Create the inspector answering for one client's registered prefix.
   *
   * @param {{
   *   callbackUrlPrefix: *
   * }} params - Parameters.
   * @returns {AiRunCallbackUrlInspector} Inspector.
   * @public
   */
  createAiRunCallbackUrlInspector ({
    callbackUrlPrefix,
  }) {
    return this.aiRunCallbackUrlInspectorFactory.create({
      callbackUrlPrefix,
    })
  }

  /**
   * Refuse to attempt a callback, and say why.
   *
   * The reason is written where an operator reads it, because nothing else records it: there is no
   * delivery row for an attempt that was never made, and the run itself is already settled and is
   * not rewritten by a callback.
   *
   * @param {{
   *   aiRunId: number
   *   refusalReasonCode: string
   * }} params - Parameters.
   * @returns {AiRunTerminalCallbackOutcome} The refusal.
   * @public
   */
  refuseTerminalCallback ({
    aiRunId,
    refusalReasonCode,
  }) {
    this.logRefusedTerminalCallback({
      aiRunId,
      refusalReasonCode,
    })

    return this.buildRefusedOutcome({
      refusalReasonCode,
    })
  }

  /**
   * Write the line naming why one callback was not attempted.
   *
   * The line carries an id and a reason code, which is what section 7 allows a log to hold. The
   * callback URL is not among them: it is the client's own and is content under that same section,
   * and it is the one value a reader would otherwise be tempted to put beside an "unregistered
   * URL" refusal.
   *
   * @param {{
   *   aiRunId: number
   *   refusalReasonCode: string
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logRefusedTerminalCallback ({
    aiRunId,
    refusalReasonCode,
  }) {
    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name}#deliverTerminalCallback() was refused: AiRunId ${aiRunId}, reason ${refusalReasonCode}`,
      tags: REFUSED_TERMINAL_CALLBACK_TAGS,
    })
  }

  /**
   * Build the outcome of a callback nothing was sent for.
   *
   * @param {{
   *   refusalReasonCode: string
   * }} params - Parameters.
   * @returns {AiRunTerminalCallbackOutcome} The outcome.
   * @public
   */
  buildRefusedOutcome ({
    refusalReasonCode,
  }) {
    return {
      hasAttempted: false,
      hasDelivered: false,
      httpStatusCode: null,
      refusalReasonCode,
    }
  }

  /**
   * Post one attempt to a callback URL already judged deliverable, and record it.
   *
   * **The inspector is built a second time here, and that is deliberate.** The one built before
   * answered a question and was let go; this one travels with the request, because the sender
   * asks it of every URL a redirect names. Building it twice is
   * two parses of one prefix, and it is what keeps each method's step to itself — the alternative
   * was threading an object through a method that has no use for it.
   *
   * **Both are built from the same `api_clients.callback_url_prefix`, and that is the whole of
   * why a hop is held to the first URL's rule.** It is a fact about these three lines and not
   * about either class: the sender checks that it was handed an inspector, never which client's
   * prefix that inspector answers for. Build the second one from another client's column and the
   * hops of this callback would be judged against that client's prefix, with nothing anywhere to
   * notice.
   *
   * **Leaving the inspector off the call raises, and raises before anything is posted.** That was
   * a real hole rather than a hypothetical one: the sender used to ask the inspector without
   * checking there was one, so a client answering `200` cost nothing and a client answering `307`
   * raised a `TypeError` from inside the redirect walk — past this method's
   * `#saveTerminalCallbackDelivery()`, so an attempt that really went out left no row behind. The
   * sender now refuses the call on its first line, where nothing has been sent and there is no
   * attempt to record. The line below is held by a test that drives a redirect through this
   * method rather than by one that supplies the inspector itself, so deleting it is red.
   *
   * @param {{
   *   aiRun: *
   *   apiClient: *
   *   attemptIndex: number
   * }} params - Parameters.
   * @returns {Promise<AiRunTerminalCallbackOutcome>} What the attempt came to.
   * @public
   */
  async attemptTerminalCallback ({
    aiRun,
    apiClient,
    attemptIndex,
  }) {
    const rawBody = await this.buildAiRunRawBody({
      aiRun,
    })

    if (rawBody === null) {
      return this.refuseTerminalCallback({
        aiRunId: aiRun.id,
        refusalReasonCode: AI_RUN_CALLBACK_REFUSAL_REASON.UNREADABLE_AI_RUN_RESPONSE,
      })
    }

    const attemptedAt = this.buildCurrentInstant()

    const headerHash = this.buildCallbackHeaderHash({
      aiRun,
      apiClient,
      rawBody,
      attemptedAt,
    })

    if (headerHash === null) {
      return this.refuseTerminalCallback({
        aiRunId: aiRun.id,
        refusalReasonCode: AI_RUN_CALLBACK_REFUSAL_REASON.UNSIGNABLE_CLIENT_SECRET,
      })
    }

    const aiRunCallbackUrlInspector = this.createAiRunCallbackUrlInspector({
      callbackUrlPrefix: apiClient.callbackUrlPrefix,
    })

    const httpStatusCode = await this.sendTerminalCallback({
      aiRun,
      headerHash,
      rawBody,
      aiRunCallbackUrlInspector,
    })

    await this.saveTerminalCallbackDelivery({
      aiRun,
      attemptIndex,
      httpStatusCode,
      attemptedAt,
    })

    return this.buildAttemptedOutcome({
      httpStatusCode,
    })
  }

  /**
   * Build the bytes of the body this callback carries.
   *
   * The step trace is not asked for. Section 12's fifth acceptance criterion is that asking for it
   * adds it and that a response which did not ask carries none, and a callback asks for nothing —
   * a client that wants the trace reads the run back with the expansion.
   *
   * Null is answered when the run cannot be built, which here means it was removed between the two
   * reads: `AiRunResponseBuilder` scopes its read by the client this run was just read to belong
   * to, so a mismatch of client is not reachable from here.
   *
   * @param {{
   *   aiRun: *
   * }} params - Parameters.
   * @returns {Promise<string | null>} The serialized body, or null when there is no run to send.
   * @public
   */
  async buildAiRunRawBody ({
    aiRun,
  }) {
    const aiRunResponse = await this.aiRunResponseBuilder.buildAiRunResponse({
      runKey: aiRun.runKey,
      apiClientId: aiRun.ApiClientId,
      expandsSteps: false,
    })

    if (aiRunResponse === null) {
      return null
    }

    return JSON.stringify(aiRunResponse)
  }

  /**
   * Build the instant this attempt is made at.
   *
   * @returns {Date} The instant.
   * @public
   */
  buildCurrentInstant () {
    return new Date()
  }

  /**
   * Build the headers this attempt is posted with.
   *
   * @param {BuildAiRunTerminalCallbackHeaderHashParams} params - Parameters.
   * @returns {Record<string, string> | null} The headers, or null when the client's secret cannot
   * key an HMAC and the callback must not be sent.
   * @public
   */
  buildCallbackHeaderHash ({
    aiRun,
    apiClient,
    rawBody,
    attemptedAt,
  }) {
    const secret = this.extractClientSecret({
      apiClient,
    })

    return this.aiRunCallbackSigner.buildCallbackHeaderHash({
      clientKey: apiClient.clientKey,
      secret,
      runKey: aiRun.runKey,
      rawBody,
      attemptedAt,
    })
  }

  /**
   * Extract the client's secret from the envelope its row stores.
   *
   * An envelope that will not decrypt answers null, and the signer refuses to sign with it — a
   * callback bearing a signature nothing can verify looks signed to everything that handles it,
   * which is the one failure a signature exists to make impossible.
   *
   * @param {{
   *   apiClient: *
   * }} params - Parameters.
   * @returns {string | null} The secret, or null when the envelope will not decrypt.
   * @public
   */
  extractClientSecret ({
    apiClient,
  }) {
    return this.apiClientSecretCipher.decryptSecret({
      envelope: apiClient.secretCiphertext,
    })
  }

  /**
   * Post this attempt, and answer what the far side said.
   *
   * **The inspector travels with the request, and that is the point of it being here.** The URL
   * the sender is handed has been judged; a URL a redirect names has not, and `fetch` left to
   * itself would have posted this body and its signature to twenty of them. So the same inspector
   * this client's prefix built goes down with the call, and the sender asks it of every hop —
   * which is why the question stays `AiRunCallbackUrlInspector`'s and the sender decides nothing.
   *
   * @param {SendAiRunTerminalCallbackParams} params - Parameters.
   * @returns {Promise<number | null>} The status the chain ended on, or null when the request
   * never completed.
   * @public
   */
  async sendTerminalCallback ({
    aiRun,
    headerHash,
    rawBody,
    aiRunCallbackUrlInspector,
  }) {
    const sendOutcome = await this.aiRunCallbackSender.sendAiRunCallback({
      callbackUrl: aiRun.callbackUrl,
      headerHash,
      rawBody,
      runKey: aiRun.runKey,
      aiRunCallbackUrlInspector,
    })

    return sendOutcome.httpStatusCode
  }

  /**
   * Record that this attempt was made.
   *
   * The row is written whatever came back, including nothing: a request that never completed is an
   * attempt that was made, and the null status is the column's own case.
   *
   * **What "whatever came back" cannot cover is something raised instead of answered**, which
   * would leave this method unreached and an attempt unrecorded. The send has one raise and it is
   * `AiRunCallbackSender`'s refusal of a call carrying no URL inspector — raised before its first
   * request, so there is no attempt behind it to have lost. Every way a request itself can fail is
   * answered as a null status and arrives here.
   *
   * @param {SaveAiRunTerminalCallbackDeliveryParams} params - Parameters.
   * @returns {Promise<*>} The saved delivery record.
   * @public
   */
  async saveTerminalCallbackDelivery ({
    aiRun,
    attemptIndex,
    httpStatusCode,
    attemptedAt,
  }) {
    return this.aiRunCallbackDeliveryRecorder.saveAiRunCallbackDelivery({
      aiRunId: aiRun.id,
      callbackDeliveryCategoryName: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.NAME,
      attemptIndex,
      httpStatusCode,
      attemptedAt,
    })
  }

  /**
   * Build the outcome of a callback that was posted.
   *
   * @param {{
   *   httpStatusCode: number | null
   * }} params - Parameters.
   * @returns {AiRunTerminalCallbackOutcome} The outcome.
   * @public
   */
  buildAttemptedOutcome ({
    httpStatusCode,
  }) {
    const hasDelivered = this.isDeliveredHttpStatusCode({
      httpStatusCode,
    })

    return {
      hasAttempted: true,
      hasDelivered,
      httpStatusCode,
      refusalReasonCode: null,
    }
  }

  /**
   * Check whether a status code says the callback landed.
   *
   * Everything that is not a `2xx` is answered false, a `4xx` included. Section 12 says the
   * callback is retried until it lands and draws no line between a client that is down and a
   * client that refused, and a service deciding on its own that a `404` is permanent would stop
   * retrying at exactly the client whose endpoint sits behind a proxy that has not come up yet.
   * What bounds the retrying is the attempt count the dispatcher states, not a judgement made
   * here.
   *
   * @param {{
   *   httpStatusCode: number | null
   * }} params - Parameters.
   * @returns {boolean} Whether it landed.
   * @public
   */
  isDeliveredHttpStatusCode ({
    httpStatusCode,
  }) {
    return httpStatusCode !== null
      && DELIVERED_STATUS_CODE_MINIMUM <= httpStatusCode
      && httpStatusCode < DELIVERED_STATUS_CODE_LIMIT
  }
}

/**
 * @typedef {{
 *   apiClientSecretCipher: ApiClientSecretCipher
 *   aiRunResponseBuilder: AiRunResponseBuilder
 *   aiRunCallbackSigner: AiRunCallbackSigner
 *   aiRunCallbackSender: AiRunCallbackSender
 *   aiRunCallbackDeliveryRecorder: AiRunCallbackDeliveryRecorder
 *   aiRunCallbackUrlInspectorFactory: typeof AiRunCallbackUrlInspector
 * }} AiRunTerminalCallbackDelivererParams
 */

/**
 * @typedef {Partial<AiRunTerminalCallbackDelivererParams>} AiRunTerminalCallbackDelivererFactoryParams
 */

/**
 * @typedef {{
 *   aiRun: *
 *   apiClient: *
 *   rawBody: string
 *   attemptedAt: Date
 * }} BuildAiRunTerminalCallbackHeaderHashParams
 */

/**
 * @typedef {{
 *   aiRun: *
 *   headerHash: Record<string, string>
 *   rawBody: string
 *   aiRunCallbackUrlInspector: AiRunCallbackUrlInspector
 * }} SendAiRunTerminalCallbackParams
 */

/**
 * @typedef {{
 *   aiRun: *
 *   attemptIndex: number
 *   httpStatusCode: number | null
 *   attemptedAt: Date
 * }} SaveAiRunTerminalCallbackDeliveryParams
 */

/**
 * What one attempt came to.
 *
 * `hasAttempted` says whether a request was made, and so whether a row was written.
 * `hasDelivered` says whether it landed. A refusal carries the reason nothing was sent; an attempt
 * carries the status the far side gave, which is null when the request never completed.
 *
 * @typedef {{
 *   hasAttempted: boolean
 *   hasDelivered: boolean
 *   httpStatusCode: number | null
 *   refusalReasonCode: string | null
 * }} AiRunTerminalCallbackOutcome
 */
