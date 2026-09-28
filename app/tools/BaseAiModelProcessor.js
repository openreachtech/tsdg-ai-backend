import AiModel from '../../sequelize/models/AiModel.js'
import AiModelCapability from '../../sequelize/models/AiModelCapability.js'

import AiModelResponse from './AiModelResponse.js'
import AbortedAiCallCapsule from './AbortedAiCallCapsule.js'

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
   * get: the canonical response every driver answers in.
   *
   * Declared here rather than only on each driver, because the refusal below is built in this
   * class and a driver added later must get it without writing a line.
   *
   * @returns {typeof AiModelResponse} The class.
   */
  static get AiModelResponseCtor () {
    return AiModelResponse
  }

  /**
   * get: the capsule a call refused before it left is answered through.
   *
   * @returns {typeof AbortedAiCallCapsule} The class.
   */
  static get AbortedAiCallCapsuleCtor () {
    return AbortedAiCallCapsule
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
   * **`abortSignal` is the run's own signal, carried down to the call.** It is raised where the run
   * went past its time limit and again where a client asked the run to stop, and a driver that is
   * handed it is expected to do two things with it: refuse before calling where it is already
   * raised, and hand it to whatever the driver waits on so a call already in flight stops being
   * waited for. `#isAbortSignalRaised()` and `#createAbortedAiModelResponse()` below are how both
   * are said once rather than per driver.
   *
   * **It defaults to null, so a driver that ignores it is still correct.** A caller that knows
   * nothing about cancellation omits it, and a driver that has nothing to abort reads null and
   * behaves exactly as it did before. Nothing here can make a driver honour it — what a driver
   * does with it is that driver's own, and this class only names it.
   *
   * **What honouring it does not do.** Aborting stops *this service* waiting. It does not stop the
   * provider doing the work and it does not stop the provider charging for it; `@google/genai`
   * says so in the declaration of its own `abortSignal` field, in as many words. So a call
   * abandoned in flight is billed and records no tokens, and that is not a defect in the record.
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
    abortSignal = null,
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
   * Check whether the run behind this call has already been told to stop.
   *
   * Asked of the signal rather than of the run, because a driver is never given a run: what it is
   * handed is the one `AbortSignal` the whole work honours, and `aborted` is the only question
   * that signal answers about itself.
   *
   * A caller that passed none is a caller with nothing to abort, so the absence answers false
   * rather than raising — which is what makes the parameter's default safe to ignore.
   *
   * @param {{
   *   abortSignal: AbortSignal | null
   * }} params - Parameters.
   * @returns {boolean} Whether the signal has been raised.
   * @public
   */
  isAbortSignalRaised ({
    abortSignal,
  }) {
    return abortSignal?.aborted
      ?? false
  }

  /**
   * Create the answer a driver refuses a call with, because the run was already told to stop.
   *
   * Every driver refuses in these same words, and that is the point of it being here: a caller
   * cannot tell one driver from another, so the driver a keyless installation runs must answer a
   * raised signal the way a vendor driver does. A stub that quietly answered as usual would leave
   * this branch unexercised until the first key arrived.
   *
   * @returns {AiModelResponse} The refusal, in the shape every answer is read in.
   * @public
   */
  createAbortedAiModelResponse () {
    const aiResponseCapsule = this.Ctor.AbortedAiCallCapsuleCtor.create()

    return this.Ctor.AiModelResponseCtor.create({
      aiResponseCapsule,
    })
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
   * Ask the provider to delete one file this service handed it.
   *
   * **The counterpart of `#prepareAttachedFiles()`, and it is on a driver for the same reason.**
   * Only a driver knows its vendor's API: what a handle is, which call removes it, and — the part
   * nothing above this layer could decide — which failure means the copy is already gone rather
   * than that the vendor could not be reached. §19's third purge is a scheduled sweep calling this
   * one member, and it branches on no vendor.
   *
   * **The contract is stated in what it does and does not raise, because a stamp depends on it.**
   * Answering normally means one thing only: the copy no longer exists at the provider. A driver
   * that deleted it and a driver told the handle is unknown both answer normally, because the
   * question the caller is asking is about the copy and not about who removed it. Raising means
   * the state of the copy is unknown, and the caller must then leave the row alone. There is no
   * third answer: `provider_uploaded_files.provider_purged_at` records that a copy of somebody's
   * personal data is gone, and a false entry there is worse than an empty one.
   *
   * **The default raises, and says why in as many words.** A driver that hands nothing to a vendor
   * has no file at the far end to remove, so it owns no row of the egress record and this member is
   * never reached on it — the stub is exactly that driver, and it deliberately does not override
   * this. Being reached all the same means a row was recorded against a provider whose driver sends
   * nothing, which is a wiring fault rather than a file to delete; raising leaves the row unstamped
   * and puts the fault in a log, where answering "gone" would have quietly written the one false
   * fact this whole job was deferred to avoid.
   *
   * @abstract
   * @param {{
   *   providerFileName: string
   * }} params - Parameters.
   * @returns {Promise<null>} Nothing, once the copy no longer exists at the provider.
   * @throws {Error} When the driver hands nothing to a provider, so it holds nothing to delete.
   * @public
   */
  async deleteProviderUploadedFile ({
    providerFileName,
  }) {
    throw new Error(`${this.constructor.name}#deleteProviderUploadedFile() hands no file to a provider, so it holds none to delete: ${providerFileName}`)
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
 *   abortSignal?: AbortSignal | null
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
