import AiRunInstantInspector from '../aiRun/AiRunInstantInspector.js'

import AI_RUN_CALLBACK_DELIVERY_CATEGORY_CONSTANT_HASH from '../constants/aiRunCallbackDeliveryCategoryConstants.js'

import AiRunCallbackDelivery from '../../sequelize/models/AiRunCallbackDelivery.js'

const {
  AI_RUN_CALLBACK_DELIVERY_CATEGORY,
} = AI_RUN_CALLBACK_DELIVERY_CATEGORY_CONSTANT_HASH

const UNRECORDABLE_ATTEMPTED_AT_MESSAGE = 'refused an attempted_at carrying something that is not an instant'

/**
 * Writes one `ai_run_callback_deliveries` row per attempt at posting a callback, and reads a run's
 * attempts back in the order they were made.
 *
 * **One row per attempt is what makes "it was retried" a count rather than a claim.** Section 12's
 * eighth acceptance criterion is that a callback which fails to deliver is retried, though a model
 * call in the same run is not — and the only way that is checkable after the fact is that the
 * attempts are countable. A row per attempt, with the attempt's own index on it, gives that count
 * one answer.
 *
 * **The attempt index arrives on the call and is never derived here.** Deriving it — counting the
 * rows already written and adding one — reads and writes in two steps, and two workers retrying
 * one run would each read the same count and write the same index, which the table's unique triple
 * would then refuse. The queue already knows which attempt it is on, so the number comes from
 * there, where it is a fact rather than a guess.
 *
 * **No response body is stored, and this class offers no way to store one.** Section 12 says a
 * delivery record says whether the callback arrived and not what came back. The status code is the
 * whole of what the far side contributes, and a client's own payload kept here would outlive by
 * two years the purge meant to remove it everywhere else.
 *
 * **A null status code is a recorded fact, not a missing one.** It says the attempt was made and
 * the request never completed — a connection refused, a timeout, a host that never answered. So
 * nothing here substitutes a number for it, and the column is nullable for exactly this.
 *
 * **`attempted_at` is refused rather than dropped when it is not an instant.** The column is
 * `NOT NULL`, so there is nothing to drop to, and a value that is present and is not a time
 * coerces to the literal text `Invalid date` — which reads as though an attempt had been timed.
 * This is what `AiRunStepRecorder` does with the two instants that bound a step, for the same
 * reason.
 */
export default class AiRunCallbackDeliveryRecorder {
  /**
   * Constructor.
   *
   * @param {AiRunCallbackDeliveryRecorderParams} params - Parameters.
   */
  constructor ({
    aiRunCallbackDeliveryCategoryIdHash,
    aiRunInstantInspector,
  }) {
    this.aiRunCallbackDeliveryCategoryIdHash = aiRunCallbackDeliveryCategoryIdHash
    this.aiRunInstantInspector = aiRunInstantInspector
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunCallbackDeliveryRecorder ? X : never} T, X
   * @param {AiRunCallbackDeliveryRecorderFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunCallbackDeliveryCategoryIdHash = this.buildAiRunCallbackDeliveryCategoryIdHash(),
    aiRunInstantInspector = this.createAiRunInstantInspector(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunCallbackDeliveryCategoryIdHash,
        aiRunInstantInspector,
      })
    )
  }

  /**
   * Create the inspector answering whether a value is an instant this service may record.
   *
   * @returns {AiRunInstantInspector} Inspector.
   */
  static createAiRunInstantInspector () {
    return AiRunInstantInspector.create()
  }

  /**
   * Build the lookup answering a callback kind's id from the name of that kind.
   *
   * One kind this version. The deferred progress callback is a row of the master and a line here,
   * never a column of `ai_run_callback_deliveries`.
   *
   * @returns {Record<string, number>} Category id by category name.
   */
  static buildAiRunCallbackDeliveryCategoryIdHash () {
    return {
      [AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.NAME]: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    }
  }

  /**
   * get: the callback delivery model.
   *
   * @returns {typeof AiRunCallbackDelivery} Model.
   */
  static get AiRunCallbackDeliveryCtor () {
    return AiRunCallbackDelivery
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCallbackDeliveryRecorder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCallbackDeliveryRecorder} */ (this.constructor)
  }

  /**
   * Save the record of one attempt at posting a callback.
   *
   * @param {SaveAiRunCallbackDeliveryParams} params - Parameters.
   * @returns {Promise<*>} The saved delivery record.
   * @throws {Error} When the instant the attempt was made at is not one.
   * @public
   */
  async saveAiRunCallbackDelivery ({
    aiRunId,
    callbackDeliveryCategoryName,
    attemptIndex,
    httpStatusCode,
    attemptedAt,
  }) {
    if (
      !this.aiRunInstantInspector.isRecordableInstant({
        instant: attemptedAt,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveAiRunCallbackDelivery() ${UNRECORDABLE_ATTEMPTED_AT_MESSAGE}: AiRunId ${aiRunId}, attemptIndex ${attemptIndex}`)
    }

    const aiRunCallbackDeliveryCategoryId = this.generateAiRunCallbackDeliveryCategoryId({
      callbackDeliveryCategoryName,
    })

    return /** @type {*} */ (
      this.Ctor.AiRunCallbackDeliveryCtor.create({
        AiRunId: aiRunId,
        AiRunCallbackDeliveryCategoryId: aiRunCallbackDeliveryCategoryId,
        attemptIndex,
        httpStatusCode,
        attemptedAt,
      })
    )
  }

  /**
   * Generate the id of the callback kind an attempt was for, from the name of that kind.
   *
   * Nothing here guesses. A name the lookup does not carry as its own key answers null rather than
   * a nearby id or whatever the prototype chain happens to hold under that name, and the
   * `NOT NULL` column then refuses the row — an attempt filed under the wrong kind would count
   * towards a retry total it never belonged to.
   *
   * @param {{
   *   callbackDeliveryCategoryName: *
   * }} params - Parameters.
   * @returns {number | null} The category id, or null when the name names no kind.
   * @public
   */
  generateAiRunCallbackDeliveryCategoryId ({
    callbackDeliveryCategoryName,
  }) {
    if (!Object.hasOwn(this.aiRunCallbackDeliveryCategoryIdHash, callbackDeliveryCategoryName)) {
      return null
    }

    return this.aiRunCallbackDeliveryCategoryIdHash[callbackDeliveryCategoryName]
  }

  /**
   * Find every attempt made at one run's callback of one kind, in the order they were made.
   *
   * The order is the one the attempts claim for themselves in `attempt_index`, not the order the
   * rows were written in, so an attempt recorded late still reads back in its own place.
   *
   * The kind is part of the condition because a run's attempts at two different callbacks are two
   * separate counts — there is one kind this version, and a reader that left it out would start
   * mixing them the day a second one is seeded rather than the day somebody noticed.
   *
   * @param {{
   *   aiRunId: number
   *   callbackDeliveryCategoryName: string
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The attempts, earliest first.
   * @public
   */
  async findAiRunCallbackDeliveries ({
    aiRunId,
    callbackDeliveryCategoryName,
  }) {
    const aiRunCallbackDeliveryCategoryId = this.generateAiRunCallbackDeliveryCategoryId({
      callbackDeliveryCategoryName,
    })

    return /** @type {*} */ (
      this.Ctor.AiRunCallbackDeliveryCtor.findAll({
        where: {
          AiRunId: aiRunId,
          AiRunCallbackDeliveryCategoryId: aiRunCallbackDeliveryCategoryId,
        },
        order: [
          [
            'attemptIndex',
            'ASC',
          ],
        ],
      })
    )
  }
}

/**
 * @typedef {{
 *   aiRunCallbackDeliveryCategoryIdHash: Record<string, number>
 *   aiRunInstantInspector: AiRunInstantInspector
 * }} AiRunCallbackDeliveryRecorderParams
 */

/**
 * @typedef {Partial<AiRunCallbackDeliveryRecorderParams>} AiRunCallbackDeliveryRecorderFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   callbackDeliveryCategoryName: string
 *   attemptIndex: number
 *   httpStatusCode: number | null
 *   attemptedAt: Date
 * }} SaveAiRunCallbackDeliveryParams
 */
