import PROVIDER_UPLOADED_FILE_RETENTION_CONSTANT_HASH from '../constants/providerUploadedFileRetentionConstants.js'

const {
  PROVIDER_UPLOADED_FILE_RETENTION,
} = PROVIDER_UPLOADED_FILE_RETENTION_CONSTANT_HASH

const MILLISECOND_COUNT_PER_DAY = 86400000

/**
 * Answers the instant a file must have left before for a provider that stated no expiry to be
 * asked to delete it.
 *
 * **What it stands in for.** `provider_uploaded_files.expires_at` normally decides when a copy is
 * ripe, because it is the instant the vendor itself named. It is nullable, and null means one of
 * two things: the vendor stated no expiry at all, or it stated a timestamp this service could not
 * read — `BaseGeminiAiModelProcessor#generateProviderFileExpiresAt()` answers null rather than an
 * invalid date, deliberately, so that this job is never handed a date nobody can check. Either way
 * there is no vendor clock, and this is the clock used instead.
 *
 * **Why it runs from `uploaded_at` rather than from the row's own `created_at`.** The question is
 * how long the copy has existed at the far end, and the instant it left this machine is the
 * answer. `created_at` is the row's bookkeeping — the same reasoning
 * `aiRunContentRetentionConstants.cjs` gives for running the content clock from `accepted_at`.
 *
 * **Why it is a class rather than a line inside the purge.** It is the whole of what "wait a day
 * before asking about a copy nobody dated" means in code, and it is the one part of this purge
 * that can be settled without a database or a vendor: it takes an instant and answers an instant.
 * Apart from the purge, the figure can be asserted against dates a reader checks by hand — a month
 * end, a leap day, the turn of a year — rather than only through rows that happen to fall either
 * side of it.
 *
 * **What the clock runs from is the caller's `now`, never the class's own.** One sweep has one
 * instant, shared by the horizon it selects against and the stamp it writes; a class reading the
 * wall clock of its own accord would let the two drift apart across a long sweep, and would leave
 * a test waiting for a real day to pass.
 */
export default class UnstatedExpiryHorizonCalculator {
  /**
   * Constructor.
   *
   * @param {UnstatedExpiryHorizonCalculatorParams} params - Parameters.
   */
  constructor ({
    dayCount,
  }) {
    this.dayCount = dayCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof UnstatedExpiryHorizonCalculator ? X : never} T, X
   * @param {UnstatedExpiryHorizonCalculatorFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    dayCount = PROVIDER_UPLOADED_FILE_RETENTION.UNSTATED_EXPIRY_DAY_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        dayCount,
      })
    )
  }

  /**
   * Calculate the instant a file uploaded before which is ripe though its provider dated nothing.
   *
   * The boundary is exclusive at the caller's end: the purge selects files uploaded strictly
   * before this instant, so a file handed over exactly a day ago to the millisecond waits one more
   * sweep rather than being asked about a moment early.
   *
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Date} The horizon.
   * @public
   */
  calculateUnstatedExpiryHorizon ({
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
 * }} UnstatedExpiryHorizonCalculatorParams
 */

/**
 * @typedef {Partial<UnstatedExpiryHorizonCalculatorParams>}
 *   UnstatedExpiryHorizonCalculatorFactoryParams
 */
