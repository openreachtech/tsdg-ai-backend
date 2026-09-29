import {
  Op,
} from 'sequelize'

import AI_RUN_RATE_LIMIT_CONSTANT_HASH from '../constants/aiRunRateLimitConstants.js'

import AiRun from '../../sequelize/models/AiRun.js'

const {
  AI_RUN_RATE_LIMIT,
} = AI_RUN_RATE_LIMIT_CONSTANT_HASH

const DEFAULT_MAXIMUM_ACCEPTED_AI_RUN_COUNT = AI_RUN_RATE_LIMIT.MAXIMUM_ACCEPTED_AI_RUN_COUNT
const DEFAULT_WINDOW_SECOND_COUNT = AI_RUN_RATE_LIMIT.WINDOW_SECOND_COUNT

const MILLISECOND_COUNT_PER_SECOND = 1000

/**
 * Answers whether one client may have another run accepted, or has had its fill of the window.
 *
 * **The count is of runs already accepted, and the table is the counter.** There is no tally held
 * in memory and no store beside the database: the rows a client's runs left behind are the record
 * of how many it has had, so the answer is the same from every API process, survives a restart,
 * and needs no second thing to be running. `ai_runs` is indexed on the client, and a version whose
 * heaviest day is a thousand runs is not one where counting them costs anything worth saving.
 *
 * **It answers before a run exists, which is the whole of what the criterion asks.** specs/1.0.0
 * §20: "a client that has exceeded its rate limit is refused, and no run is created and no model is
 * called." That rules out asking inside the job - by then the run is a row and the readings are
 * scheduled - and places the question at the request, which is where the one caller of this class
 * asks it.
 *
 * **The window has two ends and both are stated.** A run counts when it was accepted at or after
 * the window opened and at or before the instant the asking request carries. The upper end is what
 * keeps a row accepted ahead of the asking request's own clock out of the count: a machine whose
 * clock ran forward once would otherwise go on refusing that client for a whole window afterwards,
 * for runs that had not happened yet by the request's own reckoning.
 *
 * **What it does not know is what a refusal is answered with.** This class returns a boolean; the
 * status, the wording and the decision of where in the accept path to ask belong to the renderer.
 */
export default class AiRunRateLimitInspector {
  /**
   * Constructor.
   *
   * @param {AiRunRateLimitInspectorParams} params - Parameters.
   */
  constructor ({
    maximumAcceptedAiRunCount,
    windowSecondCount,
  }) {
    this.maximumAcceptedAiRunCount = maximumAcceptedAiRunCount
    this.windowSecondCount = windowSecondCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunRateLimitInspector ? X : never} T, X
   * @param {AiRunRateLimitInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    maximumAcceptedAiRunCount = DEFAULT_MAXIMUM_ACCEPTED_AI_RUN_COUNT,
    windowSecondCount = DEFAULT_WINDOW_SECOND_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        maximumAcceptedAiRunCount,
        windowSecondCount,
      })
    )
  }

  /**
   * get: the run model — a seam so tests can substitute it.
   *
   * @returns {typeof AiRun} Model.
   */
  static get AiRunCtor () {
    return AiRun
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunRateLimitInspector} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunRateLimitInspector} */ (this.constructor)
  }

  /**
   * Check whether this client may have one more run accepted.
   *
   * The comparison is against the runs already accepted, so a client holding exactly the limit is
   * refused the next one rather than allowed it: the limit is what a client may have in a window,
   * not what it may have before the window is remarked upon.
   *
   * @param {{
   *   apiClientId: number
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether the client is within its limit.
   * @public
   */
  async isWithinRateLimit ({
    apiClientId,
    now,
  }) {
    const windowOpenedAt = this.buildWindowOpenedAt({
      now,
    })

    const acceptedAiRunCount = await this.findAcceptedAiRunCount({
      apiClientId,
      windowOpenedAt,
      windowClosedAt: now,
    })

    return acceptedAiRunCount < this.maximumAcceptedAiRunCount
  }

  /**
   * Build the instant the window an asking request stands in was opened at.
   *
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Date} The instant.
   * @public
   */
  buildWindowOpenedAt ({
    now,
  }) {
    const windowMillisecondCount = this.windowSecondCount * MILLISECOND_COUNT_PER_SECOND

    return new Date(now.getTime() - windowMillisecondCount)
  }

  /**
   * Find how many runs this client has had accepted inside the window.
   *
   * @param {{
   *   apiClientId: number
   *   windowOpenedAt: Date
   *   windowClosedAt: Date
   * }} params - Parameters.
   * @returns {Promise<number>} The count.
   * @public
   */
  async findAcceptedAiRunCount ({
    apiClientId,
    windowOpenedAt,
    windowClosedAt,
  }) {
    return this.Ctor.AiRunCtor.count({
      where: {
        ApiClientId: apiClientId,
        acceptedAt: {
          [Op.gte]: windowOpenedAt,
          [Op.lte]: windowClosedAt,
        },
      },
    })
  }
}

/**
 * @typedef {{
 *   maximumAcceptedAiRunCount: number
 *   windowSecondCount: number
 * }} AiRunRateLimitInspectorParams
 */

/**
 * @typedef {Partial<AiRunRateLimitInspectorParams>} AiRunRateLimitInspectorFactoryParams
 */
