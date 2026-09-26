import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AI_RUN_FAILURE_REASON_CONSTANT_HASH from '../constants/aiRunFailureReasonConstants.js'
import AI_RUN_MEDIA_LIMIT_CONSTANT_HASH from '../constants/aiRunMediaLimitConstants.js'

import {
  env,
  rootPath,
} from '../globals/_.js'

const {
  AI_RUN_FAILURE_REASON_CODE,
} = AI_RUN_FAILURE_REASON_CONSTANT_HASH

const {
  AI_RUN_MEDIA_LIMIT,
} = AI_RUN_MEDIA_LIMIT_CONSTANT_HASH

/*
 * How the allow-list is written in the environment: hosts separated by commas.
 *
 * A host is a bare hostname - `files.client.example` - with no scheme, no port and no path. The
 * scheme is decided by the rule below rather than by the key, and a port is deliberately not part
 * of the entry: see the class comment on what that leaves open.
 */
const ALLOWED_HOST_DELIMITER = ','

/*
 * The schemes a medium may be fetched over.
 *
 * Everything else is refused before the host is even looked at, and the ones that matter are not
 * exotic: `file:` would read this machine's own disk, `data:` would carry bytes the caller wrote
 * inside the URL itself, and neither is a fetch from the client's storage at all. The allow-list
 * cannot refuse them, because neither has a host for it to compare.
 *
 * `http:` is here beside `https:` because development fetches from a local or fake host, and the
 * key is what decides which hosts exist in an environment. A deployment that lists a live host
 * reachable over plaintext has made that choice in the key; this constant does not make it for it.
 */
const FETCHABLE_URL_PROTOCOLS = [
  'http:',
  'https:',
]

/*
 * How long one fetch may take before it is given up as a failure.
 *
 * The run's own limit is 300 seconds for everything a run does - up to twelve fetches, an upload
 * and three readings - so a single file holding the connection open until the run's clock ran out
 * would fail the run under `TIME_LIMIT_EXCEEDED` and say nothing about which file did it. Thirty
 * seconds is short enough that twelve of them cannot consume the run's budget between them, and
 * long enough for a photo of the size the cap allows.
 */
const DEFAULT_REQUEST_TIMEOUT_MILLISECONDS = 30000

/*
 * The statuses that name another URL to read the file from.
 *
 * Written out rather than expressed as a range, because `304` sits inside the same range and names
 * no new URL at all. These five are the ones a storage host answers a moved or pre-signed object
 * with.
 */
const REDIRECT_STATUS_CODES = [
  301,
  302,
  303,
  307,
  308,
]

/*
 * How many times one fetch may be sent somewhere else before it is given up.
 *
 * A pre-signed URL fronting a redirector is one hop, and a host that has moved an object behind a
 * second one is two; three leaves room for that and stops well short of the twenty `fetch` follows
 * on its own. Every hop is a request made inside the one thirty-second budget, so the number is
 * also what bounds how much of that budget a chain of them can spend.
 */
const DEFAULT_MAXIMUM_REDIRECT_COUNT = 3

/*
 * How many bytes this client will hold in memory for one file.
 *
 * It is the per-file cap from the non-functional section, borrowed as a bound on the read rather
 * than applied as the rule - the rule is `AiRunMediaLimitInspector`'s, and the class comment says
 * which of the two this is. A body is stopped one byte past it, so nothing larger than the largest
 * file this service would accept is ever assembled.
 */
const DEFAULT_MAXIMUM_READ_BYTE_SIZE = AI_RUN_MEDIA_LIMIT.MAXIMUM_BYTE_SIZE

/*
 * How many pieces this client will assemble one file out of.
 *
 * The bound above is on the bytes, and the bytes are not what a body arriving in a hundred
 * thousand frames costs. Each piece is an object of its own, costing far more than the byte it may
 * carry, and each is a frame the event loop is woken for - so ten megabytes delivered one byte at
 * a time is ten million objects and ten million wake-ups inside a bound that sees ten megabytes
 * and is content.
 *
 * Sixty-five thousand five hundred and thirty-six pieces spread over the ten-megabyte cap is an
 * average frame of a hundred and sixty bytes. A host serving a photograph sends kilobytes at a
 * time, so this sits roughly an order of magnitude below the chattiest honest one and refuses only
 * the body that is framed to be expensive.
 */
const DEFAULT_MAXIMUM_READ_CHUNK_COUNT = 65536

/*
 * The scheme a hop may not be moved off.
 *
 * A redirect arriving on this one may only go on over this one - see the class comment on why a
 * downgrade to plaintext is refused, and on what a chain that began on `http:` is entitled to.
 */
const SECURE_URL_PROTOCOL = 'https:'

const LOG_FILE_PATH = rootPath.to('logs/media-fetch-')

/*
 * What a failure is reported as when it came back as something with no class of its own - a thrown
 * string, or a thrown null. Nothing in `fetch` does that today; the fallback is here so that the
 * line is still written rather than the logging itself faulting inside a catch.
 */
const UNNAMED_ERROR_NAME = 'Error'

const FAILED_MEDIA_FETCH_TAGS = [
  'MediaFetch',
  'FailedFetch',
]

/*
 * One logger client per process rather than one per failure, for the reason `AiRunStatusRecorder`
 * holds one: the client owns a rotating file, and a storage outage fails every medium of every run
 * at once, which is exactly when these lines are written.
 */
const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * Fetches one medium from the client's storage, and refuses a URL pointing anywhere else.
 *
 * **The allow-list lives here, and it is an environment key.** `MEDIA_FETCH_ALLOWED_HOSTS` holds
 * the hosts this service may fetch a file from, separated by commas. Section 18 declares its three
 * tables exhaustively and none of them is an allow-list, and the value cannot be a constant either:
 * development fetches from a local or fake host and live fetches from the client's own storage, so
 * it is a deployment fact by definition and adding a host is a deployment change rather than a
 * migration. See [[Q91]] - the spec defines the term and never says where the set is held, so this
 * is a reading rather than something it states.
 *
 * **An undeclared key refuses everything, and that is the intended direction of failure.** The
 * environment facade answers `null` for a key nobody declared, which builds an empty allow-list,
 * which refuses every URL. An allow-list that let everything through while nobody had configured it
 * would be a service fetching arbitrary hosts on a caller's say-so - the one thing the first
 * acceptance criterion exists to prevent - and it would look exactly like a working deployment.
 *
 * **Nothing is fetched when the host is refused.** The guard runs before the request is built, so
 * a refused URL never reaches the network: no connection, no DNS lookup, no line in anybody's
 * access log. That is what the criterion asks for, and it is why the check is inside this class
 * rather than beside it - a caller that forgot to ask would otherwise fetch first and refuse after.
 * It is asked of every hop and not only of the caller's own URL, which the paragraph below is
 * about.
 *
 * **A redirect is followed by hand, and every hop is asked the same question as the first.** This
 * is the decision, stated so that nobody has to infer it: `redirect: 'manual'` is sent, so `fetch`
 * hands back the `3xx` itself and follows nothing; the `location` is resolved against the URL it
 * came from, put through the same allow-list check, and only then fetched, at most three times by
 * default. A hop the allow-list refuses, and a chain longer than that, both end the fetch under
 * `MEDIA_FETCH_FAILED`.
 *
 * Refusing redirects outright would have been the simpler half of the choice and it was not taken.
 * A pre-signed URL fronting a redirector is how object storage ordinarily serves a private object,
 * so `redirect: 'error'` would refuse a deployment doing nothing wrong and would say only
 * `MEDIA_FETCH_FAILED` about it. What made the hand-written follow necessary at all is that the
 * allow-listed host is the caller's own storage: an object store lets an object carry redirect
 * metadata, so a caller can upload a `302` to a cloud metadata endpoint, to an internal service or
 * to a loopback port, hand over its own storage URL, and have the worker fetch it. Under
 * `redirect: 'follow'` - which is what `fetch` does when nobody says otherwise, for up to twenty
 * hops - only the first URL was ever asked about, and every hop after it was fetched unexamined.
 *
 * What the per-hop check is *not* is a defense against the listed host itself. A host on the list
 * redirecting to another path on the same host is followed, as it should be; what the list bounds
 * is where a file may come from, which is the same boundary the first hop has.
 *
 * **A redirect may not move the fetch from `https:` to `http:`.** An entry on the list is a bare
 * hostname, so the key cannot say "this host over TLS only", and a listed host answering `302` to
 * `http://` on a listed host would otherwise be followed - which hands the caller who controls the
 * object's redirect metadata a way to move a photograph onto plaintext, where a network between
 * here and the host reads it and writes over it. So a hop that arrived on `https:` may only go on
 * over `https:`. A first URL that is already `http:` is untouched and its chain stays plaintext
 * throughout: the key is what decides which hosts exist, and development fetches over plaintext by
 * design. What the refusal costs is a deployment whose listed host really does redirect from TLS
 * to plaintext - that one now fails under `MEDIA_FETCH_FAILED` with nothing in a log naming the
 * scheme, for the same reason every other refusal here writes no line.
 *
 * **Every response this class decides not to read is disposed of before it is let go.** A `3xx`
 * arrives with a body like any other response, and asking for the hop by hand is what made that
 * body this class's: under `redirect: 'follow'` the client drained a redirect internally, and
 * under `redirect: 'manual'` nobody does. A body neither read nor cancelled is a connection the
 * client cannot release - one leaked per hop, held for as long as a worker daemon runs - and the
 * body of a `3xx` is the caller's to make as large as it likes, because the object redirecting
 * from is theirs. So it is cancelled on every branch that leaves a response behind: a hop that is
 * followed, a chain out of hops, a hop the list refuses, a hop that would downgrade the transport,
 * a status the server answered with, and a size declared past the bound. That is disposal and not
 * tidiness - the file descriptor does not come back without it - and it is now a duty of every
 * branch anybody adds to `#fetchMedium()` or `#sendFetchRequestHop()` after this, which nothing but
 * this paragraph enforces.
 *
 * **The host is the parsed URL's own `hostname`, never a piece of the text.** A URL may carry
 * credentials before its host (`https://files.client.example@somewhere.else/photo.jpg`), and the
 * host of that one is `somewhere.else`. Comparing text rather than the parsed hostname is how an
 * allow-list is walked past, so the comparison is made against what `URL` resolved and against
 * nothing else. The comparison is case-insensitive, because a hostname is.
 *
 * **What the two failure codes mean here.** `MEDIA_FETCH_FAILED` is a file that could not be
 * fetched at all - a refused host, a refused or exhausted redirect, a URL that is no URL, a
 * connection that failed or timed out, a status the server answered with. `MEDIA_UNREADABLE` is a
 * file that was fetched and that this service has nothing readable from - a body that threw while
 * being read, one of zero bytes, and one this service stopped reading at the bound below. The
 * fourth acceptance criterion of section 18 asks for exactly that distinction, and it is drawn here
 * because this is the only place that can see which of the two happened.
 *
 * **A failure is answered, never thrown.** Every path returns an outcome carrying a reason code, so
 * a caller writes one branch and meets no exception raised inside `fetch`. That follows the
 * external-client convention's rule that failure is decided from the returned value rather than
 * from a `try`/`catch` around the call.
 *
 * **Nothing about the URL reaches a log.** The media URLs are content under the non-functional
 * section's personal-data row, so the line written when a fetch fails carries the reason code and
 * the error's own class name and neither the URL nor the message the error composed out of it.
 *
 * **The size rule is not applied here; the bound on the read is.** `AiRunMediaLimitInspector` holds
 * both limits, and the caller checks the size the request declared against it before a fetch is
 * asked for at all - that is what the second acceptance criterion means by "before anything reaches
 * a provider". What this class adds is the size that was actually read, on `byteSize` of the
 * outcome, so the same rule can be asked again of what arrived: a declared size and a real one need
 * not agree, and only the second of them is a fact.
 *
 * Which leaves the question of how the second one is arrived at without trusting the first.
 * `response.arrayBuffer()` buffers whatever the host sends, so a caller declaring one byte against
 * a host streaming sixty-four megabytes had the whole of it in memory before anything could judge
 * it - and twelve of those inside one run is a worker that runs out of memory rather than a run
 * that fails. So the body is read as a stream, a chunk at a time, and abandoned the moment what has
 * been read passes the per-file cap; a `content-length` larger than the cap is refused before a
 * byte of body is read at all. Either way the outcome is `MEDIA_UNREADABLE`: the file was fetched,
 * and this service declined to read it whole. That wording is deliberate - nothing here judged the
 * file too large, it stopped reading - and the caller that declared an honest size over the cap was
 * already refused with `MEDIA_LIMIT_EXCEEDED` before the fetch.
 *
 * **The pieces are counted as well as the bytes, and the accumulator is appended to rather than
 * rebuilt.** Assembling a body out of n pieces by building a fresh array of every piece so far
 * costs n squared copies, and that is a cost neither bound above can see: a host framing its body
 * one byte at a time spent the whole thirty-second budget on array copies before it had read a
 * hundred kilobytes, and spent it synchronously, on the event loop the worker publishes its
 * heartbeat from - which is a stalled job redelivered rather than a slow file. So the pieces are
 * appended to the one array, which makes the read linear in them. The count is then bounded as
 * well, because the byte bound does not bound it either: ten megabytes arriving in one-byte frames
 * is ten million objects, each costing far more than the byte it carries, and a body framed that
 * way is not one this service has any reason to accept.
 *
 * What the second bound costs is stated where it falls: `MEDIA_UNREADABLE` does not say which of
 * the two bounds stopped the read, so an operator holding a refused file cannot tell a body too
 * large from one too finely framed, and a host that genuinely frames small is refused with nothing
 * naming the reason. Telling them apart would mean a reason code section 18 does not define, which
 * is the spec's to add rather than this class's.
 *
 * **What stays open, stated rather than claimed closed.** An entry is a hostname, so the allow-list
 * bounds *where* a file comes from and not which port, path or object on that host - a host on the
 * list serving something it should not is not a case this class can see, and that now includes a
 * listed host redirecting to another object on itself. Nor does it resolve the host: a listed name
 * that resolves to a loopback or link-local address is fetched, so an environment that lists a host
 * it does not control has not been protected from that host - and a redirect to a *name* that
 * resolves that way is refused only if the name itself is off the list, never by what it resolves
 * to. Both are properties of the key's value, which is why the key is a deployment decision.
 *
 * The scheme is no longer one of them, and the paragraph above says exactly how far that goes: a
 * chain is refused for being moved off `https:` and never for having begun off it, so a key
 * listing a host reachable over plaintext still fetches over plaintext from end to end, and what
 * made that choice is the key.
 *
 * The declared media type is the server's claim and is carried as one. Nothing here reads the first
 * bytes of the file to see whether they agree with it, so a body declared `image/jpeg` that is an
 * archive, an SVG or a polyglot reaches the caller declared as a photograph. Section 18 asks for no
 * such check and names no set of formats to check against, so adding one would be choosing which
 * files this service refuses - a decision for the spec rather than for this class - and this says
 * plainly that it has not been made.
 *
 * A refused hop, a size declared past the cap and a body abandoned at it write no line - the same
 * as the refused host above them, which has never written one either. None of the four is an
 * exception with a class to name, and the failure reason the caller records is the evidence they
 * leave; a line telling one of them from another would need something about the URL in it to be
 * worth reading, and the media URLs are content.
 */
export default class MediaFetchClient {
  /**
   * Constructor.
   *
   * @param {MediaFetchClientParams} params - Parameters.
   */
  constructor ({
    allowedHosts,
    requestTimeoutMilliseconds,
    maximumRedirectCount,
    maximumReadByteSize,
    maximumReadChunkCount,
  }) {
    this.allowedHosts = allowedHosts
    this.requestTimeoutMilliseconds = requestTimeoutMilliseconds
    this.maximumRedirectCount = maximumRedirectCount
    this.maximumReadByteSize = maximumReadByteSize
    this.maximumReadChunkCount = maximumReadChunkCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof MediaFetchClient ? X : never} T, X
   * @param {MediaFetchClientFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    allowedHosts = this.buildAllowedHosts(),
    requestTimeoutMilliseconds = DEFAULT_REQUEST_TIMEOUT_MILLISECONDS,
    maximumRedirectCount = DEFAULT_MAXIMUM_REDIRECT_COUNT,
    maximumReadByteSize = DEFAULT_MAXIMUM_READ_BYTE_SIZE,
    maximumReadChunkCount = DEFAULT_MAXIMUM_READ_CHUNK_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        allowedHosts,
        requestTimeoutMilliseconds,
        maximumRedirectCount,
        maximumReadByteSize,
        maximumReadChunkCount,
      })
    )
  }

  /**
   * get: the URL class, which parses a URL and answers its parts.
   *
   * @returns {typeof URL} The class.
   */
  static get UrlCtor () {
    return URL
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
   * get: environment variables.
   *
   * @returns {typeof env} Environment facade.
   */
  static get env () {
    return env
  }

  /**
   * get: the function that performs the network read.
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
   * get: the logger client this process writes failed fetches through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * Build the allow-list the environment declares.
   *
   * A key nobody declared, and a key declared empty, both build an empty allow-list - which refuses
   * every URL. Blank entries are dropped so that a trailing comma is not a host, and every entry is
   * lower-cased so the comparison can be made against a lower-cased hostname without either side
   * deciding the case of the other.
   *
   * @returns {Array<string>} The hosts this service may fetch a file from.
   */
  static buildAllowedHosts () {
    const declaredHosts = this.env.MEDIA_FETCH_ALLOWED_HOSTS

    if (typeof declaredHosts !== 'string') {
      return []
    }

    return declaredHosts.split(ALLOWED_HOST_DELIMITER)
      .map(it => it.trim()
        .toLowerCase())
      .filter(it => it !== '')
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof MediaFetchClient} The class.
   */
  get Ctor () {
    return /** @type {typeof MediaFetchClient} */ (this.constructor)
  }

  /**
   * Fetch one medium, and answer what came of it.
   *
   * @param {{
   *   url: *
   * }} params - Parameters.
   * @returns {Promise<MediaFetchOutcome>} What the fetch produced, or the reason code it failed
   * under.
   * @public
   */
  async fetchMedium ({
    url,
  }) {
    if (
      !this.isFetchableUrl({
        url,
      })
    ) {
      return this.buildFailedFetchOutcome({
        failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_FETCH_FAILED,
      })
    }

    const response = await this.sendFetchRequest({
      url,
    })

    if (
      !this.hasFetchedResponse({
        response,
      })
    ) {
      return this.abandonFetchedResponse({
        response,
        failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_FETCH_FAILED,
      })
    }

    if (
      !this.isReadableResponseSize({
        response,
      })
    ) {
      return this.abandonFetchedResponse({
        response,
        failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_UNREADABLE,
      })
    }

    const bytes = await this.readResponseBytes({
      response,
    })

    if (
      !this.hasReadableBytes({
        bytes,
      })
    ) {
      return this.buildFailedFetchOutcome({
        failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_UNREADABLE,
      })
    }

    const mimeType = this.extractResponseMimeType({
      response,
    })

    return this.buildFetchedOutcome({
      bytes,
      mimeType,
    })
  }

  /**
   * Check whether a URL may be fetched at all.
   *
   * @param {{
   *   url: *
   * }} params - Parameters.
   * @returns {boolean} Whether it may be fetched.
   * @public
   */
  isFetchableUrl ({
    url,
  }) {
    const host = this.extractFetchableHost({
      url,
    })

    if (host === null) {
      return false
    }

    return this.allowedHosts.includes(host)
  }

  /**
   * Extract the host a URL would be fetched from, when the URL is one that may be fetched.
   *
   * The hostname is the parsed URL's own, which is what makes credentials written before the host
   * unable to stand in for it.
   *
   * @param {{
   *   url: *
   * }} params - Parameters.
   * @returns {string | null} The lower-cased host, or null when the value names none.
   * @public
   */
  extractFetchableHost ({
    url,
  }) {
    const parsedUrl = this.buildParsedUrl({
      url,
    })

    if (parsedUrl === null) {
      return null
    }

    if (!FETCHABLE_URL_PROTOCOLS.includes(parsedUrl.protocol)) {
      return null
    }

    return parsedUrl.hostname.toLowerCase()
  }

  /**
   * Build the parsed form of a URL.
   *
   * @param {{
   *   url: *
   * }} params - Parameters.
   * @returns {URL | null} The parsed URL, or null when the value is not one.
   * @public
   */
  buildParsedUrl ({
    url,
  }) {
    if (typeof url !== 'string') {
      return null
    }

    try {
      return new this.Ctor.UrlCtor(url)
    } catch (error) {
      return null
    }
  }

  /**
   * Send the request that reads the file, following a redirect only to a host the list holds.
   *
   * The options are built once and carried through every hop, so the time limit is the chain's
   * rather than each hop's - twelve files redirecting three times each would otherwise be entitled
   * to twelve times the budget the run has.
   *
   * **The response this answers with carries a body nobody has read, and disposing of it is the
   * caller's.** Every response left behind on the way here has been cancelled already; the one
   * handed back has not, and cannot be - reading it is the point of asking. A caller that answers
   * away from it without reading it must cancel it, which is what `#fetchMedium()` does on each of
   * its own refusals.
   *
   * @param {{
   *   url: string
   * }} params - Parameters.
   * @returns {Promise<Response | null>} The response, or null when the request failed or was
   * refused on the way.
   * @public
   */
  async sendFetchRequest ({
    url,
  }) {
    const fetchOptions = this.buildFetchOptions()

    return this.sendFetchRequestHop({
      url,
      fetchOptions,
      remainingRedirectCount: this.maximumRedirectCount,
    })
  }

  /**
   * Send one hop of a request, and answer either its response or the next hop's.
   *
   * **This is where the allow-list is asked of a hop that is not the first.** The check runs before
   * the hop is sent, exactly as it does for the caller's own URL, so a host off the list is refused
   * with nothing fetched from it. Three things end the chain with nothing: a hop the list refuses,
   * a hop that would move the fetch off `https:`, and a chain that has used up its hops. All three
   * are a file that could not be fetched.
   *
   * **The `3xx` is disposed of on every one of those branches and on the one that recurses.** Its
   * body was never read, and a body neither read nor cancelled holds the connection it arrived on
   * for good - see the class comment, which says why that is disposal rather than tidiness and why
   * asking for `redirect: 'manual'` is what made it this method's to do. The only branch that does
   * not cancel is the one answering the response itself, because that one hands the body on to a
   * caller who will read it or abandon it in turn.
   *
   * It recurses rather than loops because there is no loop form this repository permits, and
   * because the hop count is what the recursion carries - three frames at most.
   *
   * @param {{
   *   url: string
   *   fetchOptions: MediaFetchRequestOptions
   *   remainingRedirectCount: number
   * }} params - Parameters.
   * @returns {Promise<Response | null>} The response, or null when the request failed or was
   * refused on the way.
   * @public
   */
  async sendFetchRequestHop ({
    url,
    fetchOptions,
    remainingRedirectCount,
  }) {
    const response = await this.sendSingleFetchRequest({
      url,
      fetchOptions,
    })

    if (response === null) {
      return null
    }

    const redirectedUrl = this.extractRedirectedUrl({
      response,
      url,
    })

    if (redirectedUrl === null) {
      return response
    }

    if (remainingRedirectCount < 1) {
      return this.cancelUnreadResponseBody({
        response,
      })
    }

    if (
      this.downgradesTransportSecurity({
        url,
        redirectedUrl,
      })
    ) {
      return this.cancelUnreadResponseBody({
        response,
      })
    }

    if (
      !this.isFetchableUrl({
        url: redirectedUrl,
      })
    ) {
      return this.cancelUnreadResponseBody({
        response,
      })
    }

    await this.cancelUnreadResponseBody({
      response,
    })

    const nextRedirectCount = remainingRedirectCount - 1

    return this.sendFetchRequestHop({
      url: redirectedUrl,
      fetchOptions,
      remainingRedirectCount: nextRedirectCount,
    })
  }

  /**
   * Send one request, and answer the response it came back with.
   *
   * The failure is caught here rather than raised, because every way this call can fail - a
   * connection refused, a host that does not resolve, a timeout - is one of the cases the outcome's
   * reason code already states. The line written names neither the URL nor the message the error
   * composed out of it.
   *
   * @param {{
   *   url: string
   *   fetchOptions: MediaFetchRequestOptions
   * }} params - Parameters.
   * @returns {Promise<Response | null>} The response, or null when the request failed.
   * @public
   */
  async sendSingleFetchRequest ({
    url,
    fetchOptions,
  }) {
    try {
      return await this.Ctor.fetchClient(url, fetchOptions)
    } catch (error) {
      this.logFailedMediaFetch({
        failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_FETCH_FAILED,
        error,
      })

      return null
    }
  }

  /**
   * Extract the URL a response sends the fetch on to, when it sends it anywhere.
   *
   * A `location` is allowed to be relative - `/objects/1234` is an ordinary answer - so it is
   * resolved against the URL of the hop it arrived on, which is also what makes the host the
   * allow-list is then asked about the host the request would really go to.
   *
   * @param {{
   *   response: Response
   *   url: string
   * }} params - Parameters.
   * @returns {string | null} The URL of the next hop, or null when there is none.
   * @public
   */
  extractRedirectedUrl ({
    response,
    url,
  }) {
    if (!REDIRECT_STATUS_CODES.includes(response.status)) {
      return null
    }

    const location = response.headers.get('location')

    if (location === null) {
      return null
    }

    return this.buildResolvedUrlText({
      location,
      url,
    })
  }

  /**
   * Build the absolute form of a location a response named.
   *
   * @param {{
   *   location: string
   *   url: string
   * }} params - Parameters.
   * @returns {string | null} The absolute URL, or null when the location resolves to none.
   * @public
   */
  buildResolvedUrlText ({
    location,
    url,
  }) {
    try {
      const resolvedUrl = new this.Ctor.UrlCtor(location, url)

      return resolvedUrl.href
    } catch (error) {
      return null
    }
  }

  /**
   * Check whether a redirect would move the fetch off the transport it arrived on.
   *
   * The allow-list is hostnames, so nothing in the key can say "this host over TLS only", and a
   * listed host answering `302` to plaintext on a listed host would pass every other check made
   * here. A hop that arrived over TLS may therefore only go on over TLS. A hop that arrived over
   * plaintext is not held to anything, because a chain that began there was never protecting
   * anything to begin with and that was the key's decision.
   *
   * @param {{
   *   url: string
   *   redirectedUrl: string
   * }} params - Parameters.
   * @returns {boolean} Whether the redirect would leave the transport weaker than it arrived.
   * @public
   */
  downgradesTransportSecurity ({
    url,
    redirectedUrl,
  }) {
    const hopProtocol = this.extractUrlProtocol({
      url,
    })

    if (hopProtocol !== SECURE_URL_PROTOCOL) {
      return false
    }

    const redirectedProtocol = this.extractUrlProtocol({
      url: redirectedUrl,
    })

    return redirectedProtocol !== SECURE_URL_PROTOCOL
  }

  /**
   * Extract the scheme a URL names.
   *
   * @param {{
   *   url: *
   * }} params - Parameters.
   * @returns {string | null} The scheme, with its colon, or null when the value is no URL.
   * @public
   */
  extractUrlProtocol ({
    url,
  }) {
    const parsedUrl = this.buildParsedUrl({
      url,
    })

    return parsedUrl?.protocol
      ?? null
  }

  /**
   * Build the options one fetch is sent under.
   *
   * The time limit is a signal rather than a setting on the request, because that is the only form
   * `fetch` takes one in.
   *
   * `redirect: 'manual'` is the half that is load-bearing. Left unsaid, `fetch` follows up to
   * twenty hops on its own and answers with the last of them, and the allow-list would have been
   * asked about the first URL alone. Asked for manually, the `3xx` comes back unfollowed and the
   * hop is this class's to examine.
   *
   * @returns {MediaFetchRequestOptions} The options.
   * @public
   */
  buildFetchOptions () {
    const signal = this.Ctor.AbortSignalCtor.timeout(this.requestTimeoutMilliseconds)

    return {
      signal,
      redirect: 'manual',
    }
  }

  /**
   * Write the line a failed fetch leaves behind.
   *
   * @param {{
   *   failureReasonCode: string
   *   error: *
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logFailedMediaFetch ({
    failureReasonCode,
    error,
  }) {
    const errorName = this.extractErrorName({
      error,
    })

    const message = `${this.Ctor.name} ${failureReasonCode}: ${errorName}`

    this.Ctor.mentsuLogger.error({
      message,
      tags: FAILED_MEDIA_FETCH_TAGS,
    })
  }

  /**
   * Extract the name of the class a failure came back as.
   *
   * It is the class name and never the message: a message raised by `fetch` is composed out of the
   * URL it was given, and the media URLs are content.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {string} The class name of the failure.
   * @public
   */
  extractErrorName ({
    error,
  }) {
    return error?.constructor?.name
      ?? UNNAMED_ERROR_NAME
  }

  /**
   * Check whether a response is one the file was actually fetched in.
   *
   * A status the server answered with is a file that could not be fetched, not one that could not
   * be read: nothing of the file arrived, and a `404` page is not an unreadable photo.
   *
   * @param {{
   *   response: Response | null
   * }} params - Parameters.
   * @returns {boolean} Whether the file was fetched.
   * @public
   */
  hasFetchedResponse ({
    response,
  }) {
    if (!response) {
      return false
    }

    return response.ok
  }

  /**
   * Check whether a response declares a size this client will read.
   *
   * A `content-length` is the host's claim and is treated as one - a host may under-declare it or
   * send none at all, which is why the read below is bounded too. What it is good for is the case
   * where the host is honest: sixty-four megabytes declared is sixty-four megabytes not read.
   *
   * A response declaring nothing is answered yes, because "we do not know yet" is not "too large",
   * and the bound on the read is what decides that one.
   *
   * @param {{
   *   response: Response
   * }} params - Parameters.
   * @returns {boolean} Whether the declared size is one this client will read.
   * @public
   */
  isReadableResponseSize ({
    response,
  }) {
    const declaredByteSize = this.extractResponseContentLength({
      response,
    })

    if (declaredByteSize === null) {
      return true
    }

    return declaredByteSize <= this.maximumReadByteSize
  }

  /**
   * Extract the size a response declared for its body.
   *
   * @param {{
   *   response: Response
   * }} params - Parameters.
   * @returns {number | null} The declared size, or null when the response declared none this
   * client can read as a size.
   * @public
   */
  extractResponseContentLength ({
    response,
  }) {
    const headerValue = response.headers.get('content-length')

    if (headerValue === null) {
      return null
    }

    const declaredByteSize = Number(headerValue)

    if (!Number.isInteger(declaredByteSize)) {
      return null
    }

    return declaredByteSize >= 0
      ? declaredByteSize
      : null
  }

  /**
   * Read the bytes of a fetched file, and stop at the most this client will hold.
   *
   * **The body is streamed rather than buffered whole, and that is the point of the method.**
   * `response.arrayBuffer()` reads whatever the host sends before anything can judge its size, so
   * a host that answers with far more than it declared was held in memory in full. Here the
   * chunks are taken one at a time and the read is abandoned - the reader cancelled, so the
   * connection is not left draining - the moment what has been read goes past the bound.
   *
   * @param {{
   *   response: Response
   * }} params - Parameters.
   * @returns {Promise<Buffer | null>} The bytes, or null when the body could not be read or went
   * past the bound.
   * @public
   */
  async readResponseBytes ({
    response,
  }) {
    const bodyStream = response.body

    if (!bodyStream) {
      return null
    }

    const reader = bodyStream.getReader()

    try {
      return await this.readBoundedStreamBytes({
        reader,
        chunks: [],
        readByteSize: 0,
      })
    } catch (error) {
      this.logFailedMediaFetch({
        failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_UNREADABLE,
        error,
      })

      return null
    }
  }

  /**
   * Read one chunk of a body, and answer either the whole of it or nothing.
   *
   * It recurses rather than loops for the reason `#sendFetchRequestHop()` gives, and it carries
   * the chunks and the size read so far rather than holding either as state - a client is one
   * instance and a run reads twelve files through it.
   *
   * **The array handed in is appended to, and is not rebuilt per chunk.** Spreading it into a new
   * array each time reads as the tidier of the two and costs n squared copies in the number of
   * chunks, which no bound on the bytes can see: a host framing its body one byte at a time spent
   * fifteen seconds of processor time and the whole request budget assembling eighty-six
   * kilobytes, synchronously, on the loop a worker's heartbeat shares. So the accumulator is one
   * array from the first chunk to the last. What that asks of a caller is stated rather than
   * assumed: the array passed in is written to, so nothing may hand this method an array it still
   * means to read, and `#readResponseBytes()` passes a fresh one for exactly that reason.
   *
   * **The chunks are counted as well as measured.** Ten megabytes is a bound the byte count keeps;
   * ten million one-byte frames is ten million objects and ten million wake-ups inside it. A body
   * arriving in more pieces than the bound allows is abandoned exactly as one arriving in too many
   * bytes is, and answers the same `MEDIA_UNREADABLE` - the class comment says what that costs an
   * operator reading the code back.
   *
   * @param {{
   *   reader: ReadableStreamDefaultReader<Uint8Array>
   *   chunks: Array<Buffer>
   *   readByteSize: number
   * }} params - Parameters.
   * @returns {Promise<Buffer | null>} The bytes, or null when the body went past either bound.
   * @public
   */
  async readBoundedStreamBytes ({
    reader,
    chunks,
    readByteSize,
  }) {
    const chunk = await reader.read()

    if (chunk.done) {
      return Buffer.concat(chunks)
    }

    const nextReadByteSize = readByteSize + chunk.value.length

    if (nextReadByteSize > this.maximumReadByteSize) {
      return this.cancelBoundedStreamRead({
        reader,
      })
    }

    if (chunks.length >= this.maximumReadChunkCount) {
      return this.cancelBoundedStreamRead({
        reader,
      })
    }

    chunks.push(Buffer.from(chunk.value))

    return this.readBoundedStreamBytes({
      reader,
      chunks,
      readByteSize: nextReadByteSize,
    })
  }

  /**
   * Stop reading a body that went past the bound, and answer nothing readable.
   *
   * Its own method rather than two lines inside the `if` above, because `no-restricted-syntax`
   * refuses an `await` anywhere inside an `if` statement -- the rule's selector is a descendant
   * one, so its message about a condition is narrower than what it matches.
   *
   * Cancelling the reader is what releases the socket. Without it the rest of an over-long body
   * keeps arriving into a stream nobody reads, which is the cost this bound exists to avoid.
   *
   * @param {{
   *   reader: ReadableStreamDefaultReader<Uint8Array>
   * }} params - Parameters.
   * @returns {Promise<null>} Nothing readable.
   * @public
   */
  async cancelBoundedStreamRead ({
    reader,
  }) {
    await reader.cancel()

    return null
  }

  /**
   * Check whether what was read carries anything to read.
   *
   * A body of zero bytes is counted as unreadable rather than as an empty file, because a photo of
   * no bytes is not a photo - it is what an interrupted transfer and a truncated object both leave
   * behind, and the run has nothing to hand a provider either way.
   *
   * @param {{
   *   bytes: Buffer | null
   * }} params - Parameters.
   * @returns {boolean} Whether there is something to read.
   * @public
   */
  hasReadableBytes ({
    bytes,
  }) {
    if (!bytes) {
      return false
    }

    return bytes.length > 0
  }

  /**
   * Extract the media type the response declared.
   *
   * It is the server's claim and not a finding of this service, which is why it is answered as it
   * arrived and compared with nothing. What the caller said the file is already sits on the row.
   *
   * @param {{
   *   response: Response
   * }} params - Parameters.
   * @returns {string | null} The declared media type, or null when the response declared none.
   * @public
   */
  extractResponseMimeType ({
    response,
  }) {
    return response.headers.get('content-type')
      ?? null
  }

  /**
   * Build the outcome of a fetch that produced a file.
   *
   * @param {{
   *   bytes: Buffer
   *   mimeType: string | null
   * }} params - Parameters.
   * @returns {MediaFetchOutcome} The outcome.
   * @public
   */
  buildFetchedOutcome ({
    bytes,
    mimeType,
  }) {
    const byteSize = bytes.length

    return {
      bytes,
      byteSize,
      mimeType,
      failureReasonCode: null,
    }
  }

  /**
   * Stop reading a response this client will not read, and answer the outcome it failed under.
   *
   * The two halves are one step and are written as one method because leaving them apart is what
   * the audit found: a response answered away from without its body disposed of is a connection
   * the client never gets back, and the branch that returns the outcome is the branch that knows
   * the response is being let go.
   *
   * @param {{
   *   response: Response | null
   *   failureReasonCode: string
   * }} params - Parameters.
   * @returns {Promise<MediaFetchOutcome>} The outcome.
   * @public
   */
  async abandonFetchedResponse ({
    response,
    failureReasonCode,
  }) {
    await this.cancelUnreadResponseBody({
      response,
    })

    return this.buildFailedFetchOutcome({
      failureReasonCode,
    })
  }

  /**
   * Release the connection a response arrived on, when its body was never read.
   *
   * **This is what returns the socket, and it is not housekeeping.** A body that was neither read
   * to its end nor cancelled leaves the client unable to release the connection it came on, so a
   * response answered away from is a file descriptor and a pool slot held for the life of the
   * process. The class comment names the branches that leave one behind and says why the `3xx` of
   * them is caller-controlled.
   *
   * It answers nothing readable, so a branch with nothing to answer returns it directly - the same
   * shape `#cancelBoundedStreamRead()` has, and for the same reason: `no-restricted-syntax`
   * refuses an `await` anywhere inside an `if` statement.
   *
   * A cancel that throws is answered rather than raised, and writes no line. There is one way it
   * can: a body already read, already cancelled or already errored, and each of those is a body
   * holding nothing - so the failure says the work was done, not that it failed.
   *
   * @param {{
   *   response: Response | null
   * }} params - Parameters.
   * @returns {Promise<null>} Nothing readable.
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
    } catch (error) {
      return null
    }
  }

  /**
   * Build the outcome of a fetch that produced nothing.
   *
   * @param {{
   *   failureReasonCode: string
   * }} params - Parameters.
   * @returns {MediaFetchOutcome} The outcome.
   * @public
   */
  buildFailedFetchOutcome ({
    failureReasonCode,
  }) {
    return {
      bytes: null,
      byteSize: null,
      mimeType: null,
      failureReasonCode,
    }
  }
}

/**
 * @typedef {{
 *   allowedHosts: Array<string>
 *   requestTimeoutMilliseconds: number
 *   maximumRedirectCount: number
 *   maximumReadByteSize: number
 *   maximumReadChunkCount: number
 * }} MediaFetchClientParams
 */

/**
 * @typedef {Partial<MediaFetchClientParams>} MediaFetchClientFactoryParams
 */

/**
 * @typedef {{
 *   signal: AbortSignal
 *   redirect: RequestRedirect
 * }} MediaFetchRequestOptions
 */

/**
 * @typedef {{
 *   bytes: Buffer | null
 *   byteSize: number | null
 *   mimeType: string | null
 *   failureReasonCode: string | null
 * }} MediaFetchOutcome
 */
