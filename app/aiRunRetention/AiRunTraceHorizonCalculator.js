import AI_RUN_TRACE_RETENTION_CONSTANT_HASH from '../constants/aiRunTraceRetentionConstants.js'

const {
  AI_RUN_TRACE_RETENTION,
} = AI_RUN_TRACE_RETENTION_CONSTANT_HASH

const MILLISECOND_COUNT_PER_DAY = 86400000

/**
 * Answers the instant a run must have been accepted before for its decision trace to be past its
 * clock.
 *
 * **Why this is a twin rather than a second method on one class.** See the same paragraph in
 * `AiRunContentHorizonCalculator`. §7 says of the two horizons "two separate settings, never one";
 * a single calculator answering both, or a base class the two derive from, would be the module
 * that answers for retention in general - and the third use case of #retention is precisely that
 * ORT changes one horizon without changing the other. Two classes, each naming one constants file,
 * is what makes combining them the harder of the two ways to write a job.
 *
 * **Two years is the longer clock and the reason it exists.** The second use case is an operator
 * answering a dispute raised long after the auction closed, reading why a run decided what it did
 * "even though the content itself is long gone" - so this horizon has to be far enough out that a
 * run whose content went at thirty days still answers for itself. It is also what makes the
 * deferred recalibration of the confidence formula reachable: it reads two years of
 * `ai_run_field_outcomes` rows.
 *
 * **The clock runs from `ai_runs.accepted_at`, the same column the content clock runs from**, so
 * the two horizons are two distances from one instant rather than two instants a reader has to
 * reconcile - and a run that never finished, whose `finished_at` is null forever, is reachable by
 * both purges rather than by neither.
 */
export default class AiRunTraceHorizonCalculator {
  /**
   * Constructor.
   *
   * @param {AiRunTraceHorizonCalculatorParams} params - Parameters.
   */
  constructor ({
    dayCount,
  }) {
    this.dayCount = dayCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunTraceHorizonCalculator ? X : never} T, X
   * @param {AiRunTraceHorizonCalculatorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    dayCount = AI_RUN_TRACE_RETENTION.DAY_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        dayCount,
      })
    )
  }

  /**
   * Calculate the instant a run accepted before which has a trace past the trace clock.
   *
   * Exclusive at the caller's end, for the reason its twin states: a run accepted exactly on the
   * boundary is kept one more sweep rather than purged a moment early.
   *
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Date} The trace horizon.
   * @public
   */
  calculateTraceHorizon ({
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
 * }} AiRunTraceHorizonCalculatorParams
 */

/**
 * @typedef {Partial<AiRunTraceHorizonCalculatorParams>} AiRunTraceHorizonCalculatorFactoryParams
 */
