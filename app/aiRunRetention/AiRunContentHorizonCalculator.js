import AI_RUN_CONTENT_RETENTION_CONSTANT_HASH from '../constants/aiRunContentRetentionConstants.js'

const {
  AI_RUN_CONTENT_RETENTION,
} = AI_RUN_CONTENT_RETENTION_CONSTANT_HASH

const MILLISECOND_COUNT_PER_DAY = 86400000

/**
 * Answers the instant a run must have been accepted before for its content to be past its clock.
 *
 * **Why the arithmetic is a class rather than a line inside the purge.** The horizon is the whole
 * of what "thirty days" means in code, and it is the one part of the content purge that can be
 * settled without a database: it takes an instant and answers an instant. Keeping it apart is what
 * lets the figure be asserted against dates a reader can check by hand - a leap day, a month end,
 * the turn of a year - rather than only through rows that happen to fall either side of it.
 *
 * **It names one clock and holds one figure, and there is deliberately no class that holds both.**
 * §7 says of the two horizons "two separate settings, never one", and `aiRunContentRetention` and
 * `aiRunTraceRetention` are two constants files for that reason. A base class parameterized by a
 * day count would put the two clocks back into one module - a caller could reach it holding
 * neither figure, and an edit to how a horizon is computed would move both at once. The trace's
 * twin is `AiRunTraceHorizonCalculator`, and the four lines they have in common are cheaper than
 * the coupling that would remove them.
 *
 * **What the clock runs from is the caller's `now`, never the class's own.** A sweep has one
 * instant, shared by the horizon it selects against and the stamp it writes, and a class reading
 * the wall clock of its own accord would let those two drift apart across a long sweep. It is also
 * what lets a test state the day rather than wait for one - the rule `AiModelCallRecorder` and
 * `AiRunInstantInspector`'s callers already hold.
 *
 * **What it does not do is judge the instant it is handed.** A `now` that is not a time makes an
 * unusable horizon, and the caller that has to refuse it is the one that would otherwise write it
 * into a `datetime(3)` column - so the guard lives in the purge beside the write, and this answers
 * arithmetic.
 */
export default class AiRunContentHorizonCalculator {
  /**
   * Constructor.
   *
   * @param {AiRunContentHorizonCalculatorParams} params - Parameters.
   */
  constructor ({
    dayCount,
  }) {
    this.dayCount = dayCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunContentHorizonCalculator ? X : never} T, X
   * @param {AiRunContentHorizonCalculatorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    dayCount = AI_RUN_CONTENT_RETENTION.DAY_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        dayCount,
      })
    )
  }

  /**
   * Calculate the instant a run accepted before which has content past the content clock.
   *
   * The boundary is exclusive at the caller's end: the purge selects runs accepted strictly before
   * this instant, so a run accepted exactly thirty days ago to the millisecond is kept one more
   * sweep rather than purged a moment early.
   *
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Date} The content horizon.
   * @public
   */
  calculateContentHorizon ({
    now,
  }) {
    const horizonMillisecondCount = now.getTime()
      - (this.dayCount * MILLISECOND_COUNT_PER_DAY)

    return new Date(horizonMillisecondCount)
  }
}

/**
 * @typedef {{
 *   dayCount: number
 * }} AiRunContentHorizonCalculatorParams
 */

/**
 * @typedef {Partial<AiRunContentHorizonCalculatorParams>} AiRunContentHorizonCalculatorFactoryParams
 */
