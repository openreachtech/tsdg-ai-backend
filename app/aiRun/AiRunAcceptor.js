import RunKeyGenerator from './RunKeyGenerator.js'

import AI_RUN_STATUS_CONSTANT_HASH from '../constants/aiRunStatusConstants.js'

import AiRun from '../../sequelize/models/AiRun.js'
import AiRunStatus from '../../sequelize/models/AiRunStatus.js'

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

/**
 * Reads and writes the run row a run-creating request resolves to.
 *
 * **Why the database side is a class of its own.** A renderer answers in HTTP; which row a request
 * already has, and which row it creates, is the same question whichever AI service asked it and
 * whichever surface asked. Keeping it here leaves the renderer holding only the envelope, and
 * leaves this reachable from a job or a script that never had a request at all.
 *
 * **The status arrives with the run.** A repeated request answers with the run's status as it now
 * stands, so the lookup loads the status row with it rather than leaving the caller to ask a second
 * time. A run this class creates is queued by definition, and needs no such read.
 */
export default class AiRunAcceptor {
  /**
   * Constructor.
   *
   * @param {AiRunAcceptorParams} params - Parameters.
   */
  constructor ({
    runKeyGenerator,
  }) {
    this.runKeyGenerator = runKeyGenerator
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunAcceptor ? X : never} T, X
   * @param {AiRunAcceptorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    runKeyGenerator = this.createRunKeyGenerator(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        runKeyGenerator,
      })
    )
  }

  /**
   * get: the run model.
   *
   * @returns {typeof AiRun} Model.
   */
  static get AiRunCtor () {
    return AiRun
  }

  /**
   * get: the run status master model.
   *
   * @returns {typeof AiRunStatus} Model.
   */
  static get AiRunStatusCtor () {
    return AiRunStatus
  }

  /**
   * Create the generator minting the key a caller holds a run by.
   *
   * @returns {RunKeyGenerator} Generator.
   */
  static createRunKeyGenerator () {
    return RunKeyGenerator.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunAcceptor} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunAcceptor} */ (this.constructor)
  }

  /**
   * Find the run this client already created under this idempotency key.
   *
   * @param {{
   *   apiClientId: number
   *   requestKey: string
   * }} params - Parameters.
   * @returns {Promise<*>} The run with its status, or null when the key is arriving for the first
   * time.
   * @public
   */
  async findAiRun ({
    apiClientId,
    requestKey,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunCtor.findOne({
        where: {
          ApiClientId: apiClientId,
          requestKey,
        },
        include: [
          this.Ctor.AiRunStatusCtor,
        ],
      })
    )
  }

  /**
   * Save the run a request creates, queued and not yet started.
   *
   * @param {SaveAiRunParams} params - Parameters.
   * @returns {Promise<*>} The saved run.
   * @public
   */
  async saveAiRun ({
    apiClientId,
    aiRunCategoryId,
    input,
    rawBody,
    requestBodyHash,
    acceptedAt,
  }) {
    const runKey = this.runKeyGenerator.generateRunKey()

    return /** @type {*} */ (
      this.Ctor.AiRunCtor.create({
        ApiClientId: apiClientId,
        AiRunCategoryId: aiRunCategoryId,
        AiRunStatusId: AI_RUN_STATUS.QUEUED.ID,
        runKey,
        requestKey: input.requestKey,
        requestBodyHash,
        externalRef: input.externalRef,
        subjectLabel: input.subjectLabel,
        correlationId: input.correlationId,
        callbackUrl: input.callbackUrl,
        requestBody: rawBody,
        acceptedAt,
      })
    )
  }
}

/**
 * @typedef {{
 *   runKeyGenerator: RunKeyGenerator
 * }} AiRunAcceptorParams
 */

/**
 * @typedef {Partial<AiRunAcceptorParams>} AiRunAcceptorFactoryParams
 */

/**
 * @typedef {{
 *   apiClientId: number
 *   aiRunCategoryId: number
 *   input: AiRunCommonFieldsInput
 *   rawBody: string
 *   requestBodyHash: string
 *   acceptedAt: Date
 * }} SaveAiRunParams
 */

/**
 * @typedef {{
 *   requestKey: string
 *   externalRef: string
 *   subjectLabel: string
 *   correlationId: string
 *   callbackUrl: string
 * }} AiRunCommonFieldsInput
 */
