import BulkAiModelProcessorsLoader from '../tools/BulkAiModelProcessorsLoader.js'

import AiAgent from '../../sequelize/models/AiAgent.js'
import AiAgentDefaultModel from '../../sequelize/models/AiAgentDefaultModel.js'
import AiModel from '../../sequelize/models/AiModel.js'

/**
 * Answers which agent an AI service runs as, which model that agent is bound to, and which driver
 * serves that model.
 *
 * **The three are one question, which is why they are one class.** A service holds an agent name
 * and nothing else: the model is a row bound to the agent (`ai_agent_default_models`), the
 * provider is a column of the model, and the driver is whatever `BulkAiModelProcessorsLoader`
 * answers for the model's name. A caller that asked the three separately would have to know the
 * order to ask them in and what a missing answer at each step meant - and would name a vendor
 * somewhere along the way, which is the one thing the provider layer exists to prevent.
 *
 * **Every miss answers null, and none of them raises.** An agent nobody seeded, an agent with no
 * model bound to it, a model row whose name no driver claims: all three are ordinary runtime
 * conditions rather than programming errors, and the caller decides what a run does about them.
 * `BulkAiModelProcessorsLoader#resolveProcessor()` answers null for the same reason and says so in
 * its own words; this class does not turn that into an exception on the way past.
 *
 * **The driver scan happens once per process, and what is held is the promise of it.** Building a
 * loader reads a directory and imports every file in it, which that class states is a start-up
 * step rather than something a call being served does. A finder is built per run - it is the
 * cheapest thing in a run that calls a provider three times - so the scan is pooled against the
 * loader class rather than carried by the instance, exactly as `JobDispatcherProvider` pools the
 * queue connection it must not open twice. What the instance holds is the promise: pooling it
 * unawaited is what makes two finders built in the same tick share one scan instead of starting
 * two.
 */
export default class AiAgentModelBindingFinder {
  /**
   * The one driver scan this process makes, kept against the class that makes it.
   *
   * A `WeakMap` rather than a field, for the reason `JobDispatcherProvider`'s own pool is one: the
   * key is a class, a subclass naming a different loader gets its own entry, and nothing here
   * keeps a class alive that the rest of the process has let go of.
   *
   * @type {WeakMap<*, Promise<BulkAiModelProcessorsLoader>>}
   */
  static bulkAiModelProcessorsLoaderPromisePool = new WeakMap()

  /**
   * Constructor.
   *
   * @param {AiAgentModelBindingFinderParams} params - Parameters.
   */
  constructor ({
    bulkAiModelProcessorsLoaderPromise,
  }) {
    this.bulkAiModelProcessorsLoaderPromise = bulkAiModelProcessorsLoaderPromise
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiAgentModelBindingFinder ? X : never} T, X
   * @param {AiAgentModelBindingFinderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    bulkAiModelProcessorsLoaderPromise = this.ensureBulkAiModelProcessorsLoaderPromise(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        bulkAiModelProcessorsLoaderPromise,
      })
    )
  }

  /**
   * Obtain this process's one driver scan, starting it where it has not been started.
   *
   * @returns {Promise<BulkAiModelProcessorsLoader>} The loader, once the scan has answered.
   * @public
   */
  static ensureBulkAiModelProcessorsLoaderPromise () {
    if (!this.bulkAiModelProcessorsLoaderPromisePool.has(this.BulkAiModelProcessorsLoaderCtor)) {
      this.bulkAiModelProcessorsLoaderPromisePool.set(
        this.BulkAiModelProcessorsLoaderCtor,
        this.BulkAiModelProcessorsLoaderCtor.createAsync()
      )
    }

    return this.bulkAiModelProcessorsLoaderPromisePool.get(this.BulkAiModelProcessorsLoaderCtor)
  }

  /**
   * get: the class that discovers which driver serves which model.
   *
   * @returns {typeof BulkAiModelProcessorsLoader} The class.
   */
  static get BulkAiModelProcessorsLoaderCtor () {
    return BulkAiModelProcessorsLoader
  }

  /**
   * get: the agent model.
   *
   * @returns {typeof AiAgent} Model.
   */
  static get AiAgentCtor () {
    return AiAgent
  }

  /**
   * get: the agent-to-model binding model.
   *
   * @returns {typeof AiAgentDefaultModel} Model.
   */
  static get AiAgentDefaultModelCtor () {
    return AiAgentDefaultModel
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
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiAgentModelBindingFinder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiAgentModelBindingFinder} */ (this.constructor)
  }

  /**
   * Find the agent a service runs as, with the model and the driver that answer for it.
   *
   * @param {{
   *   aiAgentName: string
   * }} params - Parameters.
   * @returns {Promise<AiAgentModelBinding | null>} The binding, or null when any of its three
   * parts is missing.
   * @public
   */
  async findAiAgentModelBinding ({
    aiAgentName,
  }) {
    const aiAgent = await this.findAiAgent({
      aiAgentName,
    })

    if (!aiAgent) {
      return null
    }

    const aiModel = this.extractAiModel({
      aiAgent,
    })

    if (!aiModel) {
      return null
    }

    const aiModelProcessor = await this.resolveAiModelProcessor({
      aiModel,
    })

    if (!aiModelProcessor) {
      return null
    }

    return this.buildAiAgentModelBinding({
      aiAgent,
      aiModel,
      aiModelProcessor,
    })
  }

  /**
   * Find the agent row a name carries, with its bound model loaded beside it.
   *
   * The binding and the model are eager-loaded rather than read in two more queries: a run asks
   * this once and then calls a provider, so the three rows are one fact about the run and there is
   * nothing to gain by learning them one at a time.
   *
   * @param {{
   *   aiAgentName: string
   * }} params - Parameters.
   * @returns {Promise<*>} The agent row, or null when no agent carries the name.
   * @public
   */
  async findAiAgent ({
    aiAgentName,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiAgentCtor.findOne({
        where: {
          name: aiAgentName,
        },
        include: [
          {
            model: this.Ctor.AiAgentDefaultModelCtor,
            include: [
              this.Ctor.AiModelCtor,
            ],
          },
        ],
      })
    )
  }

  /**
   * Extract the model row bound to an agent.
   *
   * @param {{
   *   aiAgent: *
   * }} params - Parameters.
   * @returns {*} The model row, or null when the agent has none bound to it.
   * @public
   */
  extractAiModel ({
    aiAgent,
  }) {
    return aiAgent.AiAgentDefaultModel
      ?.AiModel
      ?? null
  }

  /**
   * Resolve the driver serving a model.
   *
   * The lookup key is the application's own `ai_models.name`, never the vendor's model id: the
   * vendor revises its id without this application caring, and the application keeps selecting by
   * a name it chose.
   *
   * @param {{
   *   aiModel: *
   * }} params - Parameters.
   * @returns {Promise<*>} The driver, or null when no driver claims the model's name.
   * @public
   */
  async resolveAiModelProcessor ({
    aiModel,
  }) {
    const bulkAiModelProcessorsLoader = await this.bulkAiModelProcessorsLoaderPromise

    return bulkAiModelProcessorsLoader.resolveProcessor({
      aiModelName: aiModel.name,
    })
  }

  /**
   * Build what a caller is handed once all three parts answered.
   *
   * The provider's id is lifted out of the model row rather than left for a caller to reach for,
   * because it is what the egress record of a file handed to that provider is written against -
   * and reaching it through two association hops at every call site is how one of them ends up
   * reading a different column.
   *
   * @param {{
   *   aiAgent: *
   *   aiModel: *
   *   aiModelProcessor: *
   * }} params - Parameters.
   * @returns {AiAgentModelBinding} The binding.
   * @public
   */
  buildAiAgentModelBinding ({
    aiAgent,
    aiModel,
    aiModelProcessor,
  }) {
    const aiModelId = aiModel.id
    const aiProviderId = aiModel.AiProviderId

    return {
      aiAgent,
      aiModelId,
      aiProviderId,
      aiModelProcessor,
    }
  }
}

/**
 * @typedef {{
 *   bulkAiModelProcessorsLoaderPromise: Promise<BulkAiModelProcessorsLoader>
 * }} AiAgentModelBindingFinderParams
 */

/**
 * @typedef {Partial<AiAgentModelBindingFinderParams>} AiAgentModelBindingFinderFactoryParams
 */

/**
 * @typedef {{
 *   aiAgent: *
 *   aiModelId: number
 *   aiProviderId: number
 *   aiModelProcessor: *
 * }} AiAgentModelBinding
 */
