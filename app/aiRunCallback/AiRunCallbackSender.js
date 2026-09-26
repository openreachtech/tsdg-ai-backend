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

const LOCATION_HEADER_NAME = 'location'

/*
 * How long one callback may take before it is given up as an attempt that never completed.
 *
 * Ten seconds. The body is one run's result and the far side has only to accept it, so a client
 * that has not answered a small POST in ten seconds is not about to. The callback is retried, so a
 * shorter limit reaches the next attempt sooner rather than losing anything — which is the
 * opposite of a media fetch, where giving up early loses a file the run needs and the limit is
 * three times this one.
 *
 * It is the whole chain's limit and not each hop's: the options are built once and carried through
 * every hop, so a client redirecting three times is entitled to ten seconds and not to thirty.
 */
const DEFAULT_REQUEST_TIMEOUT_MILLISECONDS = 10000

/*
 * The statuses that name another URL to post to.
 *
 * Written out rather than expressed as a range, because `304` sits inside the same range and names
 * no new URL at all. The five here are the ones a client's endpoint moves a callback with.
 */
const REDIRECT_STATUS_CODES = [
  301,
  302,
  303,
  307,
  308,
]

/*
 * How many times one callback may be sent somewhere else before it is given up.
 *
 * A client's endpoint answering with a trailing slash is one hop, and one sitting behind a gateway
 * that moves it again is two; three leaves room for that and stops well short of the twenty
 * `fetch` follows on its own. Every hop is a request made inside the one ten-second budget, so the
 * number also bounds how much of that budget a chain can spend.
 */
const DEFAULT_MAXIMUM_REDIRECT_COUNT = 3

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
 * **It is the whole of the outbound request, and it decides nothing about where a callback may
 * go.** Whether a URL may be posted to at all is `AiRunCallbackUrlInspector`'s — of the first URL,
 * which the caller asks before handing it over, and of every URL a redirect names after it, which
 * this class asks by handing the caller's own inspector the next hop. What the headers are is
 * `AiRunCallbackSigner`'s, and what the body is is `AiRunResponseBuilder`'s. This class takes the
 * three and performs the request, so that substituting the network in a test is substituting one
 * member of one class.
 *
 * **A redirect is followed by hand, and every hop is asked the same question as the first.** This
 * is the decision, stated so that nobody has to infer it: `redirect: 'manual'` is sent, so `fetch`
 * hands back the `3xx` itself and follows nothing; the `location` is resolved against the URL it
 * came from, put to the client's own inspector, and only then posted to, at most three times by
 * default.
 *
 * What made the hand-written follow necessary is that a redirect carries this request's whole
 * value with it. The body is the run's result, read out of the client's photographs; the headers
 * carry a **valid HMAC signature over that body**, and a header of this protocol's own is not
 * among the ones undici drops when the origin changes — measured over loopback, a second service
 * on another port received the body and `x-ort-signature` intact. Under
 * `redirect: 'follow'`, which is what `fetch` does when nobody says otherwise and for up to twenty
 * hops, a client registering `https://client.example/callbacks/` and answering `307` to a cloud
 * metadata endpoint, an internal service or a loopback port had the whole signed body posted
 * there, with only the *first* URL ever examined and the last hop's status recorded as the
 * attempt's.
 *
 * Refusing redirects outright would have been the simpler half of the choice and it was not taken:
 * a client's endpoint answering `308` to the same path with a trailing slash, or moving it behind
 * a gateway of its own, is doing nothing wrong, and refusing it would fail a delivery a client had
 * registered in good faith. What the per-hop check bounds is *whose* URL the body reaches, which
 * is the same boundary the first hop has.
 *
 * What the per-hop check is **not** is a defense against the registered prefix itself. A client
 * redirecting from one path under its own prefix to another is followed, as it should be, and a
 * prefix is a text prefix rather than a path boundary — `AiRunCallbackUrlInspector` says what that
 * leaves open, and a hop is held to exactly the same rule and no stricter one.
 *
 * **Every hop is posted as a POST, carrying the same body and the same signature.** That is
 * deliberately not what `fetch` does on its own: left to follow, it turns a `301`, `302` or `303`
 * into a GET and drops the body, so a callback recorded as delivered would have delivered nothing.
 * A hop is only reached here once the client's own inspector has answered for it, so re-posting
 * the body there is posting it where the client registered it.
 *
 * **There is no scheme guard here, and the sibling `MediaFetchClient` has one.** The difference is
 * the question each of them asks of a hop. That class asks an allow-list of bare hostnames, which
 * says nothing about a scheme, so a listed host answering `302` to `http://` on itself passes
 * every other check it makes and needs a rule of its own to refuse. The question here is a
 * registered prefix, and the scheme is part of the text compared: a client registering
 * `https://client.example/callbacks/` and answering `302` to the plaintext form of the same path
 * names a URL that does not start with the prefix, so it is refused as a URL outside the prefix,
 * by the check already there. The climb closes the same way — a client whose prefix is plaintext
 * cannot be sent up to `https:` either, because that URL does not start with an `http://` prefix.
 *
 * So every hop of a chain carries the prefix's own scheme, and a rule comparing one hop's scheme
 * with the next's could not have changed an outcome. One was written and then taken out again for
 * exactly that reason: a guard that cannot fire is a guard whose comment is the only thing anybody
 * will ever read, and this file is the wrong place to keep a sentence nothing can falsify.
 *
 * What the scheme rests on instead is stated where it can be checked: it holds only for as long as
 * the prefix comparison is made over the normalized `href`, scheme included. Loosen
 * `AiRunCallbackUrlInspector` to compare anything less than that — a host, a suffix, a
 * case-folded fragment — and a plaintext hop becomes deliverable with nothing in this class to
 * refuse it.
 *
 * **The outcome is a status code, or null when the request never completed.** That is exactly what
 * `ai_run_callback_deliveries.http_status_code` holds, and it is the shape for the same reason:
 * "the request was refused with a 503" and "there was nothing on the other end" are two different
 * facts about an attempt that was made either way. A status is answered whatever it is — a `4xx`
 * is an answer, and whether it is worth retrying is the job's question and not this class's.
 *
 * **A redirect this class refused to follow is answered as the `3xx` it was.** A chain out of
 * hops and a hop the inspector refuses both answer the status of the response that named it,
 * rather than null: something did answer, and it answered `307`. Null is kept for the case it
 * means — nothing on the other end. The row then carries a real status, the
 * attempt counts as an attempt, and `AiRunTerminalCallbackDeliverer` reads a `3xx` as undelivered
 * through the range it already had, so the queue retries. What that costs is stated rather than
 * hidden: a client that redirects its callback somewhere this service will not follow is retried
 * the full attempt count and never told why, and nothing separates that row from one written for a
 * client that simply answered `307` and named nowhere to go.
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
 * error message quotes it back. A hop refused by the inspector or by the hop count writes no line
 * at all, for the same reason: naming it would mean naming the URL to be worth reading.
 *
 * **No response body is read, and every response is disposed of.** Section 12 is explicit that a
 * delivery record says whether the callback arrived and not what came back, so nothing here reads
 * one: a body read would be a client's payload held in this process for no purpose the record has
 * a column for. Not reading a body and disposing of it are different things, though — a body
 * neither read nor cancelled is a connection undici cannot release, one per attempt and one per
 * hop, held for as long as the worker daemon runs, and the size of it is the client's endpoint's
 * to choose. So every response this class answers away from goes through
 * `#abandonCallbackResponse()`, and the one hop that continues cancels before it recurses. That is
 * disposal and not tidiness: the file descriptor does not come back without it.
 *
 * Two describes drive that over loopback sockets and watch the server's connection close — the
 * response a callback was answered with, and the `3xx` of a redirect that was refused — so taking
 * the cancel out of either is red rather than green. What has no guard is a branch added later that
 * answers away from a response without going through that method; nothing but this paragraph will
 * say so until somebody writes its describe.
 *
 * **What stays open, stated rather than claimed closed.** The first URL is the caller's to have
 * asked about, not this class's: `AiRunTerminalCallbackDeliverer` asks the inspector before it
 * builds anything, because section 12's second criterion wants a refusal that records no attempt,
 * and a sender that asked again could only answer it as a status. A future caller that forgot
 * would post the first URL unexamined and be refused only from the second hop on. Nor is any host
 * resolved: a prefix naming a host that resolves to a loopback or link-local address is posted to,
 * because the prefix is the client's own registration and this service does not own their DNS —
 * which is what makes the per-hop check a bound on whose URL is reached rather than on where that
 * URL points.
 */
export default class AiRunCallbackSender {
  /**
   * Constructor.
   *
   * @param {AiRunCallbackSenderParams} params - Parameters.
   */
  constructor ({
    requestTimeoutMilliseconds,
    maximumRedirectCount,
  }) {
    this.requestTimeoutMilliseconds = requestTimeoutMilliseconds
    this.maximumRedirectCount = maximumRedirectCount
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
    maximumRedirectCount = DEFAULT_MAXIMUM_REDIRECT_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        requestTimeoutMilliseconds,
        maximumRedirectCount,
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
   * get: the URL class, which parses a URL and resolves a location against it.
   *
   * @returns {typeof URL} The class.
   */
  static get UrlCtor () {
    return URL
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
   * The inspector arrives on the call rather than on the instance, because it answers for one
   * client's registered prefix and one sender serves every client. It is the caller's own — the
   * same object that judged the first URL — so a hop is held to exactly the rule the first URL was
   * held to, and this class never builds one of its own.
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
    aiRunCallbackUrlInspector,
  }) {
    const requestOptions = this.buildRequestOptions({
      headerHash,
      rawBody,
    })

    return this.sendAiRunCallbackHop({
      callbackUrl,
      requestOptions,
      runKey,
      aiRunCallbackUrlInspector,
      remainingRedirectCount: this.maximumRedirectCount,
    })
  }

  /**
   * Build the options the outbound request is made with.
   *
   * The content type is added here rather than by the signer, because it describes the body this
   * class sends and is no part of the signed protocol — the signature is computed over the bytes,
   * and a header naming their type is not among what a client verifies.
   *
   * `redirect: 'manual'` is the half that is load-bearing. Left unsaid, `fetch` follows up to
   * twenty hops on its own, carrying the signed body to every one of them, and the client's prefix
   * would have been asked about the first URL alone. Asked for manually, the `3xx` comes back
   * unfollowed and the hop is this class's to examine.
   *
   * The options are built once and carried through every hop, so the signal is the chain's time
   * limit rather than each hop's.
   *
   * @param {{
   *   headerHash: Record<string, string>
   *   rawBody: string
   * }} params - Parameters.
   * @returns {AiRunCallbackRequestOptions} Request options.
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
      redirect: 'manual',
    }
  }

  /**
   * Post one hop of a callback, and answer either what it came back with or what the next hop did.
   *
   * **This is where the client's prefix is asked of a hop that is not the first.** The check runs
   * before the hop is posted, so a URL outside the prefix is never sent the body: no connection,
   * no signature, nothing in anybody's access log. Two things decided here end the chain with the
   * `3xx` they were decided on: a hop the inspector refuses, and a chain that has used up its
   * hops. A third ends it without this method deciding anything — a request that failed, which
   * `#sendSingleAiRunCallbackRequest()` has already answered null for.
   *
   * **Every branch leaving a response behind disposes of its body.** The two refusals and the
   * response that is answered all go through `#abandonCallbackResponse()`, and the one branch that
   * recurses cancels before it does. A body neither read nor cancelled is a connection undici
   * cannot release — see the class comment, which says why that is disposal rather than tidiness.
   *
   * It recurses rather than loops because there is no loop form this repository permits, and
   * because the hop count is what the recursion carries — three frames at most.
   *
   * @param {SendAiRunCallbackHopParams} params - Parameters.
   * @returns {Promise<AiRunCallbackSendOutcome>} The status the chain ended on, or null when the
   * request never completed.
   * @public
   */
  async sendAiRunCallbackHop ({
    callbackUrl,
    requestOptions,
    runKey,
    aiRunCallbackUrlInspector,
    remainingRedirectCount,
  }) {
    const response = await this.sendSingleAiRunCallbackRequest({
      callbackUrl,
      requestOptions,
      runKey,
    })

    if (response === null) {
      return this.buildIncompleteOutcome()
    }

    const redirectedUrl = this.extractRedirectedUrl({
      response,
      callbackUrl,
    })

    if (redirectedUrl === null) {
      return this.abandonCallbackResponse({
        response,
      })
    }

    if (remainingRedirectCount < 1) {
      return this.abandonCallbackResponse({
        response,
      })
    }

    if (
      !aiRunCallbackUrlInspector.isDeliverableCallbackUrl({
        callbackUrl: redirectedUrl,
      })
    ) {
      return this.abandonCallbackResponse({
        response,
      })
    }

    await this.cancelUnreadResponseBody({
      response,
    })

    const nextRedirectCount = remainingRedirectCount - 1

    return this.sendAiRunCallbackHop({
      callbackUrl: redirectedUrl,
      requestOptions,
      runKey,
      aiRunCallbackUrlInspector,
      remainingRedirectCount: nextRedirectCount,
    })
  }

  /**
   * Post one request, and answer the response it came back with.
   *
   * The failure is caught here rather than raised, because every way this call can fail — a
   * connection refused, a host that does not resolve, a timeout — is the null the outcome already
   * states. The line written names neither the URL nor the message the error composed out of it.
   *
   * @param {{
   *   callbackUrl: string
   *   requestOptions: AiRunCallbackRequestOptions
   *   runKey: string
   * }} params - Parameters.
   * @returns {Promise<Response | null>} The response, or null when the request never completed.
   * @public
   */
  async sendSingleAiRunCallbackRequest ({
    callbackUrl,
    requestOptions,
    runKey,
  }) {
    try {
      return await this.Ctor.fetchClient(callbackUrl, requestOptions)
    } catch (error) {
      this.logFailedAiRunCallback({
        runKey,
        error,
      })

      return null
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

  /**
   * Build the outcome of a request that never completed.
   *
   * @returns {AiRunCallbackSendOutcome} The outcome.
   * @public
   */
  buildIncompleteOutcome () {
    return {
      httpStatusCode: null,
    }
  }

  /**
   * Extract the URL a response sends the callback on to, when it sends it anywhere.
   *
   * A `location` is allowed to be relative — `/callbacks/7/` is an ordinary answer — so it is
   * resolved against the URL of the hop it arrived on, which is also what makes the URL the
   * inspector is then asked about the URL the body would really be posted to.
   *
   * @param {{
   *   response: Response
   *   callbackUrl: string
   * }} params - Parameters.
   * @returns {string | null} The URL of the next hop, or null when there is none.
   * @public
   */
  extractRedirectedUrl ({
    response,
    callbackUrl,
  }) {
    if (!REDIRECT_STATUS_CODES.includes(response.status)) {
      return null
    }

    const location = response.headers.get(LOCATION_HEADER_NAME)

    if (location === null) {
      return null
    }

    return this.buildResolvedUrlText({
      location,
      callbackUrl,
    })
  }

  /**
   * Build the absolute form of a location a response named.
   *
   * @param {{
   *   location: string
   *   callbackUrl: string
   * }} params - Parameters.
   * @returns {string | null} The absolute URL, or null when the location resolves to none.
   * @public
   */
  buildResolvedUrlText ({
    location,
    callbackUrl,
  }) {
    try {
      const resolvedUrl = new this.Ctor.UrlCtor(location, callbackUrl)

      return resolvedUrl.href
    } catch (urlResolveFailure) {
      return null
    }
  }

  /**
   * Let go of a response this class will not read, and answer the status it carried.
   *
   * The two halves are one step and are written as one method for the reason the audit that asked
   * for it gave: a response answered away from without its body disposed of is a connection undici
   * never gets back, and the branch that returns the outcome is the branch that knows the response
   * is being let go. Both the response that ends a chain and the `3xx` of a redirect this class
   * refused to follow come through here, so there is one shape for a later branch to copy.
   *
   * @param {{
   *   response: Response
   * }} params - Parameters.
   * @returns {Promise<AiRunCallbackSendOutcome>} The outcome.
   * @public
   */
  async abandonCallbackResponse ({
    response,
  }) {
    const httpStatusCode = response.status

    await this.cancelUnreadResponseBody({
      response,
    })

    return {
      httpStatusCode,
    }
  }

  /**
   * Release the connection a response arrived on, when its body was never read.
   *
   * **This is what returns the socket, and it is not housekeeping.** A body that was neither read
   * to its end nor cancelled leaves undici unable to release the connection it came on, so a
   * response answered away from is a file descriptor and a pool slot held for the life of the
   * process — one per attempt, and the size of what is left unread is the client's endpoint's own
   * choice.
   *
   * A cancel that throws is answered rather than raised, and writes no line. There is one way it
   * can: a body already read, already cancelled or already errored, and each of those is a body
   * holding nothing — so the failure says the work was done, not that it failed.
   *
   * @param {{
   *   response: Response
   * }} params - Parameters.
   * @returns {Promise<null>} Nothing to read.
   * @public
   */
  async cancelUnreadResponseBody ({
    response,
  }) {
    const bodyStream = response?.body

    if (!bodyStream) {
      return null
    }

    try {
      await bodyStream.cancel()

      return null
    } catch (bodyCancelFailure) {
      return null
    }
  }
}

/**
 * @typedef {{
 *   requestTimeoutMilliseconds: number
 *   maximumRedirectCount: number
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
 *   aiRunCallbackUrlInspector: import('./AiRunCallbackUrlInspector.js').default
 * }} SendAiRunCallbackParams
 */

/**
 * @typedef {{
 *   callbackUrl: string
 *   requestOptions: AiRunCallbackRequestOptions
 *   runKey: string
 *   aiRunCallbackUrlInspector: import('./AiRunCallbackUrlInspector.js').default
 *   remainingRedirectCount: number
 * }} SendAiRunCallbackHopParams
 */

/**
 * @typedef {{
 *   method: string
 *   headers: Record<string, string>
 *   body: string
 *   signal: AbortSignal
 *   redirect: RequestRedirect
 * }} AiRunCallbackRequestOptions
 */

/**
 * What one attempt came to. The status is null when the request never completed.
 *
 * @typedef {{
 *   httpStatusCode: number | null
 * }} AiRunCallbackSendOutcome
 */
