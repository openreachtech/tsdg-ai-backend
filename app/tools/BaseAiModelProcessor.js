import AiModel from '../../sequelize/models/AiModel.js'
import AiModelCapability from '../../sequelize/models/AiModelCapability.js'

/**
 * Base class of a model processor — the one shape every driver in the provider set plugs into.
 *
 * **What a subclass declares, and what this holds.** A subclass names the model it answers for
 * (`#get:aiModel`) and implements the two request members. This class holds the members every
 * driver shares: the catalog read that turns a model name into its row, and the pass-through that
 * a driver overrides only when its vendor wants files uploaded ahead of the request. A caller
 * therefore never branches on which vendor answered — it resolves a processor by model name and
 * calls the same member on whatever it got back.
 *
 * **Why the factory takes nothing.** Nothing about constructing a driver may presume a vendor key.
 * The driver a default installation runs has none, and it is an ordinary member of this set rather
 * than a test double, so a base that demanded a key would put that driver outside its own
 * abstraction. A key, where a driver has one, is that driver's own business and is read by that
 * driver's client — never here.
 *
 * **Why the model's own detail is not in the class.** The vendor's model id and the token limits a
 * payload is built against live in `ai_models` and `ai_model_capabilities`. Adding a model is one
 * file naming it plus rows, never an edit here.
 */
/*
 * Why the rule is turned off for this one class.
 *
 * The selector behind `Do not declare static class` fires on a root class carrying no constructor,
 * which is what a Template-Pattern base looks like — and the class convention states the exception
 * in as many words: an abstract base class that holds no state itself, while its derived classes
 * hold the properties, is not a class without state. The selector cannot express that exception, so
 * it reports this class every time.
 *
 * There is no state to add to make it stop. `.create()` has to take no argument, because the loader
 * that discovers a processor calls it bare — and that is exactly the property letting a driver with
 * no vendor key be an ordinary member of this set rather than a special case. A key, where a driver
 * has one, is that driver's own business.
 */
// eslint-disable-next-line no-restricted-syntax -- Template-Pattern base class; see the comment above.
export default class BaseAiModelProcessor {
  /**
   * Factory method.
   *
   * @template {X extends typeof BaseAiModelProcessor ? X : never} T, X
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create () {
    return /** @type {InstanceType<T>} */ (
      new this()
    )
  }

  /**
   * get: the model catalog model.
   *
   * @returns {typeof AiModel} Model.
   */
  static get AiModelCtor () {
    return AiModel
  }

  /**
   * get: the model capability model.
   *
   * @returns {typeof AiModelCapability} Model.
   */
  static get AiModelCapabilityCtor () {
    return AiModelCapability
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof BaseAiModelProcessor} The class.
   */
  get Ctor () {
    return /** @type {typeof BaseAiModelProcessor} */ (this.constructor)
  }

  /**
   * get: the model name this processor answers for.
   *
   * @abstract
   * @returns {string} The `ai_models.name` value a caller resolves this processor by.
   * @throws {Error} When a subclass has not named the model it answers for.
   */
  get aiModel () {
    throw new Error(`${this.constructor.name}#get:aiModel must be inherited`)
  }

  /**
   * Send one request to the model and answer with the normalized response.
   *
   * @abstract
   * @param {SendRequestToAiParams} params - Parameters.
   * @returns {Promise<import('./AiModelResponse.js').default>} The normalized response.
   * @throws {Error} When a subclass has not implemented the request.
   * @public
   */
  async sendRequestToAi ({
    aiAgent,
    instruction,
    documents,
    fileUrls,
    historyMessages = [],
    tools = [],
    toolChoices = [],
    isAutoHandleFunctionCall = true,
    extraToolOptions = {},
  }) {
    throw new Error(`${this.constructor.name}#sendRequestToAi() must be inherited`)
  }

  /**
   * Send one request to the model and answer with the normalized response, streaming as it lands.
   *
   * @abstract
   * @param {SendStreamRequestToAiParams} params - Parameters.
   * @returns {Promise<import('./AiModelResponse.js').default>} The normalized response.
   * @throws {Error} When a subclass has not implemented the streaming request.
   * @public
   */
  async sendStreamRequestToAi ({
    aiAgent,
    instruction,
    documents,
    fileUrls,
    historyMessages = [],
    tools = [],
    toolChoices = [],
    isAutoHandleFunctionCall = true,
    extraToolOptions = {},
    onText,
    onComplete,
  }) {
    throw new Error(`${this.constructor.name}#sendStreamRequestToAi() must be inherited`)
  }

  /**
   * Prepare the files attached to a request before the payload is built.
   *
   * A driver whose vendor wants files uploaded ahead of the request overrides this and answers with
   * the files that carry what the vendor calls them. The default hands them back untouched, so a
   * driver that sends nothing outward needs no override and no branch.
   *
   * @param {{
   *   fileUrls: Array<AttachedFile>
   * }} params - Parameters.
   * @returns {Promise<Array<AttachedFile>>} The files as the payload should carry them.
   * @public
   */
  async prepareAttachedFiles ({
    fileUrls,
  }) {
    return fileUrls
  }

  /**
   * Find the catalog row of a model, with the limits a payload is built against.
   *
   * @param {{
   *   aiModelName: string
   * }} params - Parameters.
   * @returns {Promise<*>} The model row with its capability, or null when no model carries the name.
   * @public
   */
  async findAiModelByName ({
    aiModelName,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiModelCtor.findOne({
        where: {
          name: aiModelName,
        },
        include: [
          this.Ctor.AiModelCapabilityCtor,
        ],
      })
    )
  }
}

/**
 * @typedef {{
 *   aiAgent: model.AiAgent
 *   instruction: string
 *   documents: Array<Record<string, *>>
 *   fileUrls: Array<AttachedFile>
 *   historyMessages?: Array<Record<string, *>>
 *   tools?: Array<Record<string, *>>
 *   toolChoices?: Array<Record<string, *>>
 *   isAutoHandleFunctionCall?: boolean
 *   extraToolOptions?: Record<string, *>
 * }} SendRequestToAiParams
 */

/**
 * @typedef {{
 *   aiAgent: model.AiAgent
 *   instruction: string
 *   documents: Array<Record<string, *>>
 *   fileUrls: Array<AttachedFile>
 *   historyMessages?: Array<Record<string, *>>
 *   tools?: Array<Record<string, *>>
 *   toolChoices?: Array<Record<string, *>>
 *   isAutoHandleFunctionCall?: boolean
 *   extraToolOptions?: Record<string, *>
 *   onText: (text: string) => void
 *   onComplete: (message: Record<string, *>) => void
 * }} SendStreamRequestToAiParams
 */

/**
 * @typedef {{
 *   id?: number
 *   fileName?: string
 *   fileUrl: string
 *   fileType: string
 *   providerFileName?: string
 * }} AttachedFile
 */
