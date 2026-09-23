const DEFAULT_ALLOWED_DEVIATION_SECONDS = 300
const EPOCH_SECONDS_PATTERN = /^\d+$/u
const MILLISECONDS_PER_SECOND = 1000

/**
 * Judges whether the `x-ort-timestamp` a request presents sits close enough to the server's clock
 * to be accepted. The header carries epoch seconds, and the judgment is the whole of what this
 * class does: it reports acceptable or not, and decides nothing about what the caller then answers.
 *
 * **Why a window at all, and why it is symmetric.** A signature proves who wrote a body, not when.
 * Without a window, one captured request stays replayable for as long as the client's secret lives.
 * The window bounds that: a captured request is worth something for the length of the window and
 * nothing after it. It is applied in either direction because a timestamp ahead of the server is
 * no more trustworthy than one behind it — a clock that far out of step is not evidence of
 * freshness, whichever way it leans.
 *
 * **Why the tolerance is what the instance holds.** The 300 seconds the contract states is a
 * deployment's tolerance for clock skew between itself and its clients, not a fact about the
 * comparison, so it arrives as a property defaulted in `create()` — a deployment narrows or widens
 * it there, and the comparison is never edited to say a different number.
 *
 * **How the current instant reaches it.** `now` is a `Date` handed in on the call; this class never
 * reads the clock itself. That follows `app/session/SessionClerk.js`, where every method needing
 * the instant takes `now` from its caller. One request then has exactly one instant, shared by
 * everything that judges it, and a test states the instant it wants rather than mocking global time
 * or waiting for a real clock to move.
 *
 * **Why a malformed header is a failed check, not a throw.** Absent, duplicated, signed, fractional
 * or non-numeric — each is a caller that did not present a timestamp this window can be applied to,
 * which is the same outcome as one presented too far out. Reporting them alike keeps the refusal
 * decision, and the status that carries it, in the one place that owns it: the caller.
 */
export default class RequestTimestampWindowInspector {
  /**
   * Constructor.
   *
   * @param {RequestTimestampWindowInspectorParams} params - Parameters.
   */
  constructor ({
    allowedDeviationSeconds,
  }) {
    this.allowedDeviationSeconds = allowedDeviationSeconds
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof RequestTimestampWindowInspector ? X : never} T, X
   * @param {RequestTimestampWindowInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    allowedDeviationSeconds = DEFAULT_ALLOWED_DEVIATION_SECONDS,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        allowedDeviationSeconds,
      })
    )
  }

  /**
   * Check whether a presented timestamp header is acceptable — well formed, and inside the window.
   *
   * @param {{
   *   timestampHeaderValue: *
   *   now: Date
   * }} params - Parameters.
   * @returns {boolean} True when the header is acceptable.
   * @public
   */
  isAcceptableTimestamp ({
    timestampHeaderValue,
    now,
  }) {
    const timestampSeconds = this.extractTimestampSeconds({
      timestampHeaderValue,
    })

    if (timestampSeconds === null) {
      return false
    }

    return this.isWithinAllowedWindow({
      timestampSeconds,
      now,
    })
  }

  /**
   * Extract the epoch seconds a timestamp header carries.
   *
   * Only a run of digits qualifies. Anything else — an absent header, the array a duplicated header
   * arrives as, a sign, a decimal point, surrounding spaces, or any other text — carries no epoch
   * seconds to compare, and is reported as null rather than as some number it never stated.
   *
   * @param {{
   *   timestampHeaderValue: *
   * }} params - Parameters.
   * @returns {number | null} Epoch seconds, or null when the header carries none.
   */
  extractTimestampSeconds ({
    timestampHeaderValue,
  }) {
    if (typeof timestampHeaderValue !== 'string') {
      return null
    }

    if (!EPOCH_SECONDS_PATTERN.test(timestampHeaderValue)) {
      return null
    }

    return Number(timestampHeaderValue)
  }

  /**
   * Check whether epoch seconds sit inside the window, counting both directions alike.
   *
   * @param {{
   *   timestampSeconds: number
   *   now: Date
   * }} params - Parameters.
   * @returns {boolean} True when the deviation is within the allowed seconds.
   */
  isWithinAllowedWindow ({
    timestampSeconds,
    now,
  }) {
    const deviationSeconds = this.generateDeviationSeconds({
      timestampSeconds,
      now,
    })

    return deviationSeconds <= this.allowedDeviationSeconds
  }

  /**
   * Generate how far epoch seconds stand from the server's clock, as a count that never goes below
   * zero — one side of the clock is measured the same as the other.
   *
   * @param {{
   *   timestampSeconds: number
   *   now: Date
   * }} params - Parameters.
   * @returns {number} Seconds between the presented timestamp and the server's clock.
   */
  generateDeviationSeconds ({
    timestampSeconds,
    now,
  }) {
    const serverSeconds = now.getTime() / MILLISECONDS_PER_SECOND

    return Math.abs(serverSeconds - timestampSeconds)
  }
}

/**
 * @typedef {{
 *   allowedDeviationSeconds: number
 * }} RequestTimestampWindowInspectorParams
 */

/**
 * @typedef {Partial<RequestTimestampWindowInspectorParams>} RequestTimestampWindowInspectorFactoryParams
 */
