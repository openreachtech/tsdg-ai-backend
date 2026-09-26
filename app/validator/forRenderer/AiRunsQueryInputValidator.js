import BaseInputValidator from '../BaseInputValidator.js'

import AiRunPageCursor from '../../aiRun/AiRunPageCursor.js'

import AI_RUN_CATEGORY_CONSTANT_HASH from '../../constants/aiRunCategoryConstants.js'
import AI_RUN_PAGE_CONSTANT_HASH from '../../constants/aiRunPageConstants.js'
import AI_RUN_STATUS_CONSTANT_HASH from '../../constants/aiRunStatusConstants.js'

const {
  AI_RUN_CATEGORY,
} = AI_RUN_CATEGORY_CONSTANT_HASH

const {
  AI_RUN_PAGE,
} = AI_RUN_PAGE_CONSTANT_HASH

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

/*
 * The width `sequelize/migrations/20260922100004-000004-create_table-ai_runs.cjs` gives
 * `correlation_id` — `Sequelize.STRING(191)` — restated so that a value this class accepts is a
 * value the column can hold. A longer one could only ever match nothing, and answering an empty
 * page to a filter no row could satisfy tells a caller its object has no runs when what happened
 * is that it asked with something no run could carry.
 */
const CORRELATION_ID_MAXIMUM_LENGTH = 191

/**
 * Judges the query string `GET /v1/ai-runs` is asked with.
 *
 * **Every parameter is optional, and none of them is optional in the sense of "anything goes".**
 * A parameter the caller did not send passes every rule, because a filter nobody stated is a
 * filter this route does not apply. A parameter the caller did send is judged whole — and the
 * whole of it, for four of the six, is that it is one value rather than the array a repeated
 * query parameter arrives as.
 *
 * **A status name this service does not have is refused rather than answered with nothing.** The
 * five names are a closed vocabulary held in a constant, so a typo is knowable without reading
 * the table, and an empty page in answer to `?statusName=runing` is the failure mode that costs
 * an integrator an afternoon: the request looked accepted, the client has no runs in that state,
 * and nothing anywhere says which of the two is true. The same holds for the one category name.
 *
 * **The two counts are judged as integers and not as text.** The adapter has already read them
 * through `Number()`, so what arrives here is a number, `NaN`, or null — and `Number.isInteger()`
 * refuses the first two forms a caller gets wrong, a fraction and a word, in one rule. Each has a
 * ceiling: the page because the answer is bounded by it, the stall threshold because it is
 * subtracted from a clock and a number large enough makes that subtraction meaningless.
 *
 * **A cursor is judged decodable here and resolvable later.** This class can say whether a text is
 * one this service issued; it cannot say whether the run it names belongs to the caller, because
 * that is a row nobody has read yet. `AiRunPageResponseBuilder` answers the second half, and the
 * renderer gives both halves the same refusal — a caller that fabricated a cursor and a caller
 * that pasted somebody else's are told the same thing, which is the only answer that says nothing
 * about whether that run exists.
 *
 * @extends {BaseInputValidator}
 */
export default class AiRunsQueryInputValidator extends BaseInputValidator {
  /**
   * get: the cursor class a cursor text is read through.
   *
   * @returns {typeof AiRunPageCursor} The class.
   */
  static get AiRunPageCursorCtor () {
    return AiRunPageCursor
  }

  /**
   * Check whether a value is one of the names a master constant holds.
   *
   * @param {{
   *   value: *
   *   masterRowHash: Record<string, { NAME: string }>
   * }} params - Parameters.
   * @returns {boolean} true: the value is a string naming one of the rows.
   */
  static isMasterRowName ({
    value,
    masterRowHash,
  }) {
    if (typeof value !== 'string') {
      return false
    }

    return Object.values(masterRowHash)
      .some(masterRow => masterRow.NAME === value)
  }

  /**
   * Check whether a value is a count inside the bounds given.
   *
   * @param {{
   *   value: *
   *   minimum: number
   *   maximum: number
   * }} params - Parameters.
   * @returns {boolean} true: the value is an integer no smaller than the minimum and no larger
   * than the maximum.
   */
  static isCountWithin ({
    value,
    minimum,
    maximum,
  }) {
    if (!Number.isInteger(value)) {
      return false
    }

    if (value < minimum) {
      return false
    }

    return value <= maximum
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunsQueryInputValidator} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunsQueryInputValidator} */ (this.constructor)
  }

  /**
   * Generate the rules this input is judged by, in the order they are judged.
   *
   * They are declared in the order the contract lists the parameters, so that a reader comparing
   * the two reads them side by side rather than looking each one up. No rule depends on another
   * having passed, so the order settles which refusal a caller sees when it got two things wrong
   * at once and nothing else.
   *
   * @override
   * @returns {Array<[() => boolean, *]>} Validation entries.
   * @public
   */
  generateValidationEntries () {
    return [
      [
        () => this.isValidStatusName(),
        this.errorHash.InvalidStatusName,
      ],
      [
        () => this.isValidRunCategoryName(),
        this.errorHash.InvalidRunCategoryName,
      ],
      [
        () => this.isValidCorrelationId(),
        this.errorHash.InvalidCorrelationId,
      ],
      [
        () => this.isValidStalledForSeconds(),
        this.errorHash.InvalidStalledForSeconds,
      ],
      [
        () => this.isValidLimit(),
        this.errorHash.InvalidLimit,
      ],
      [
        () => this.isValidCursor(),
        this.errorHash.InvalidCursor,
      ],
    ]
  }

  /**
   * Check whether the status filter names a status this service has.
   *
   * @returns {boolean} true: no status was asked for, or the one asked for exists.
   * @public
   */
  isValidStatusName () {
    if (this.input.statusName === null) {
      return true
    }

    return this.Ctor.isMasterRowName({
      value: this.input.statusName,
      masterRowHash: AI_RUN_STATUS,
    })
  }

  /**
   * Check whether the category filter names a service this version answers for.
   *
   * @returns {boolean} true: no category was asked for, or the one asked for exists.
   * @public
   */
  isValidRunCategoryName () {
    if (this.input.runCategoryName === null) {
      return true
    }

    return this.Ctor.isMasterRowName({
      value: this.input.runCategoryName,
      masterRowHash: AI_RUN_CATEGORY,
    })
  }

  /**
   * Check whether the correlation filter is one value the column could hold.
   *
   * What it holds is never interpreted — the id groups a caller's own business object and this
   * service reads no meaning into it — so there is no format to check beyond being text somebody
   * filled in, short enough to have been stored.
   *
   * @returns {boolean} true: no correlation id was asked for, or the one asked for is storable
   * text.
   * @public
   */
  isValidCorrelationId () {
    if (this.input.correlationId === null) {
      return true
    }

    if (typeof this.input.correlationId !== 'string') {
      return false
    }

    if (this.input.correlationId === '') {
      return false
    }

    return this.input.correlationId.length <= CORRELATION_ID_MAXIMUM_LENGTH
  }

  /**
   * Check whether the stall threshold is a count of seconds this route can measure against.
   *
   * **Zero is refused, and the reason is what a caller most often sends by accident.** A
   * threshold of nothing is not a threshold: every run that has not settled has been unsettled
   * for zero seconds or more, so it asks for the whole of the unsettled list under a filter the
   * caller never wrote. `?stalledForSeconds=` with nothing after it reads as zero — a client
   * building its query out of optional fields emits exactly that — and silently answering it
   * with a narrowed list is the one failure nobody would think to look for. Refused, it says so,
   * and no honest caller is turned away: a threshold of one second is the same question asked in
   * a form that means something.
   *
   * @returns {boolean} true: no threshold was asked for, or the one asked for is within bounds.
   * @public
   */
  isValidStalledForSeconds () {
    if (this.input.stalledForSeconds === null) {
      return true
    }

    return this.Ctor.isCountWithin({
      value: this.input.stalledForSeconds,
      minimum: 1,
      maximum: AI_RUN_PAGE.MAXIMUM_STALLED_SECOND_COUNT,
    })
  }

  /**
   * Check whether the page size is one this route answers with.
   *
   * Zero is refused for the same reason the stall threshold refuses it, and for one of its own: a
   * page of no runs is not a question anybody asks, and a caller wanting to know whether it has
   * any runs at all asks for one and reads how many came back.
   *
   * @returns {boolean} true: no page size was asked for, or the one asked for is within bounds.
   * @public
   */
  isValidLimit () {
    if (this.input.limit === null) {
      return true
    }

    return this.Ctor.isCountWithin({
      value: this.input.limit,
      minimum: 1,
      maximum: AI_RUN_PAGE.MAXIMUM_RUN_COUNT,
    })
  }

  /**
   * Check whether the cursor is a text this service issued.
   *
   * @returns {boolean} true: no cursor was sent, or the one sent decodes to a run key.
   * @public
   */
  isValidCursor () {
    if (this.input.cursor === null) {
      return true
    }

    if (typeof this.input.cursor !== 'string') {
      return false
    }

    const runKey = this.Ctor.AiRunPageCursorCtor.extractRunKey({
      cursorText: this.input.cursor,
    })

    return runKey !== null
  }
}
