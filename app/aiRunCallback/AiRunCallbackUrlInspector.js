/*
 * The schemes a callback may be posted over.
 *
 * Everything else is refused before the prefix is compared at all. A prefix a client registered
 * is an `https://…` text, so a `javascript:` or a `file:` URL could not start with one anyway —
 * the list is here because the comparison below is made against a *normalized* URL, and
 * normalizing is exactly the step that can turn a text that did not look like a match into one
 * that does. Deciding the scheme first leaves nothing for that step to decide.
 *
 * `http:` sits beside `https:` because development posts to a local or fake host, and which hosts
 * exist is a deployment's own fact — the registered prefix is what says whether a plaintext
 * callback is allowed, and it says so per client.
 */
const DELIVERABLE_URL_PROTOCOLS = [
  'http:',
  'https:',
]

/**
 * Decides whether a run's callback URL is one this service may post to.
 *
 * **A URL that does not match the client's registered prefix is not called at all** (specs/1.0.0,
 * #run-delivery, the second acceptance criterion). `api_clients.callback_url_prefix` is the
 * registered prefix, and it is `NOT NULL`, so every client has one — but a client whose prefix is
 * empty text would otherwise match every URL in existence, which is the one direction this check
 * must never fail in. An unusable prefix therefore refuses everything.
 *
 * **The comparison is made against the parsed URL's own `href`, never against the text that
 * arrived.** `new URL()` resolves `.` and `..` segments, decides the default port and lower-cases
 * the scheme and the host, so `https://client.example/callbacks/../../elsewhere` normalizes to
 * `https://client.example/elsewhere` and stops matching a prefix of
 * `https://client.example/callbacks/` — while a raw `startsWith` on the text would have matched it
 * and posted the run's whole result to a path the client never registered. Comparing what a
 * request would actually be sent to is the only comparison that means anything.
 *
 * **The prefix is normalized the same way, and for the same reason.** Both sides go through one
 * parse, so neither side's spelling decides the other's: a prefix registered as
 * `HTTPS://Client.Example/callbacks/` and a URL sent as `https://client.example/callbacks/7` are
 * the same host either way, and a prefix that is not a URL at all refuses everything rather than
 * being compared as text.
 *
 * **A URL a redirect names is put through this class too, and it is asked the same question.**
 * This class is handed one URL at a time and knows nothing of chains; `AiRunCallbackSender` is
 * what asks it of the URL a `3xx` named, before anything is posted there, so a hop is held to
 * exactly the rule the first URL was held to and to no stricter one. Two things that caller leans
 * on follow from the comparison being made over the whole normalized `href`, and neither is a
 * rule written here: the scheme is part of what is compared, so no hop can move a callback from
 * `https:` to `http:` or back, and the host is part of it, so no hop can leave the origin the
 * client registered. They are what comparing the normalized text happens to mean — which is why
 * loosening this comparison to anything less than the whole `href` would reopen both at once,
 * with nothing in the sender left to refuse them.
 *
 * **What stays open, stated rather than claimed closed.** A prefix is a URL prefix and not a path
 * boundary, so a registered `https://client.example/cb` matches `https://client.example/cb-other`
 * as well as `https://client.example/cb/7`. That is what "starts with this" means in the contract,
 * and narrowing it here would refuse callbacks a client registered in good faith; what closes it
 * is a client registering a prefix that ends at a separator. The same latitude is a hop's: a
 * client redirecting from one path under its own prefix to another is followed, exactly as a first
 * URL under it is posted to. Nor is the host resolved: a prefix naming a host that later resolves
 * somewhere else is posted to, because the prefix is the client's own registration and this
 * service does not own their DNS — so what a hop is bounded to is whose URL it is, and never where
 * that URL points.
 */
export default class AiRunCallbackUrlInspector {
  /**
   * Constructor.
   *
   * @param {AiRunCallbackUrlInspectorParams} params - Parameters.
   */
  constructor ({
    normalizedCallbackUrlPrefix,
  }) {
    this.normalizedCallbackUrlPrefix = normalizedCallbackUrlPrefix
  }

  /**
   * Factory method.
   *
   * The prefix is normalized once, here, because one inspector answers for one client and the
   * prefix does not change between two URLs of that client. A prefix that is not a URL this
   * service may post over normalizes to null, and an inspector holding null refuses everything.
   *
   * @template {X extends typeof AiRunCallbackUrlInspector ? X : never} T, X
   * @param {{
   *   callbackUrlPrefix: *
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    callbackUrlPrefix,
  }) {
    const normalizedCallbackUrlPrefix = this.generateNormalizedUrl({
      url: callbackUrlPrefix,
    })

    return /** @type {InstanceType<T>} */ (
      new this({
        normalizedCallbackUrlPrefix,
      })
    )
  }

  /**
   * get: the URL class, which parses a URL and answers its normalized form.
   *
   * @returns {typeof URL} The class.
   */
  static get UrlCtor () {
    return URL
  }

  /**
   * Generate the normalized form of a URL this service may post over.
   *
   * @param {{
   *   url: *
   * }} params - Parameters.
   * @returns {string | null} The normalized URL, or null when the value names none this service
   * may post over.
   * @public
   */
  static generateNormalizedUrl ({
    url,
  }) {
    if (typeof url !== 'string') {
      return null
    }

    const parsedUrl = this.buildParsedUrl({
      url,
    })

    if (parsedUrl === null) {
      return null
    }

    if (!DELIVERABLE_URL_PROTOCOLS.includes(parsedUrl.protocol)) {
      return null
    }

    return parsedUrl.href
  }

  /**
   * Build the parsed form of a URL.
   *
   * @param {{
   *   url: string
   * }} params - Parameters.
   * @returns {URL | null} The parsed URL, or null when the text is not one.
   * @public
   */
  static buildParsedUrl ({
    url,
  }) {
    try {
      return new this.UrlCtor(url)
    } catch (urlParseFailure) {
      return null
    }
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCallbackUrlInspector} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCallbackUrlInspector} */ (this.constructor)
  }

  /**
   * Check whether a callback URL may be posted to.
   *
   * @param {{
   *   callbackUrl: *
   * }} params - Parameters.
   * @returns {boolean} Whether it may be posted to.
   * @public
   */
  isDeliverableCallbackUrl ({
    callbackUrl,
  }) {
    if (this.normalizedCallbackUrlPrefix === null) {
      return false
    }

    const normalizedCallbackUrl = this.Ctor.generateNormalizedUrl({
      url: callbackUrl,
    })

    if (normalizedCallbackUrl === null) {
      return false
    }

    return normalizedCallbackUrl.startsWith(this.normalizedCallbackUrlPrefix)
  }
}

/**
 * @typedef {{
 *   normalizedCallbackUrlPrefix: string | null
 * }} AiRunCallbackUrlInspectorParams
 */
