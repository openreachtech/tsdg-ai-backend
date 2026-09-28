import BulkAiModelProcessorsLoader from '../tools/BulkAiModelProcessorsLoader.js'

import AiModel from '../../sequelize/models/AiModel.js'

/**
 * Answers which driver speaks to a given provider.
 *
 * **Why this question exists at all, when the run path never asks it.** Everything that calls a
 * provider during a run starts from an agent: `AiAgentModelBindingFinder` walks agent to bound
 * model to provider, and the driver falls out of the model's name on the way. §19's purge of
 * provider uploads starts from the other end entirely — a row of `provider_uploaded_files` that
 * says a file was handed to `AiProviderId` 11100001 and nothing else. It has no agent, no model
 * and no run; it has a vendor and a handle. So the walk has to run in the direction nothing else
 * needed, and that is the whole of what this class is.
 *
 * **Why it is not `AiAgentModelBindingFinder` with another method on it.** That class answers one
 * question — "which agent, which model, which driver" — and every part of its answer is about a
 * run being served. A purge asking it would have to invent an agent name to get in, and would be
 * handed back an agent and a model id it has no use for. What the two genuinely share is the last
 * step, `BulkAiModelProcessorsLoader#resolveProcessor()`, and that is shared by both calling it.
 *
 * **Why a row is deleted through its own provider's driver and through no other.** The egress row
 * names the vendor that received the file, and a handle only means anything to the vendor that
 * issued it. Reaching for whichever driver happens to be the default would call the wrong vendor
 * about a handle it never issued — and on a default installation that driver is the stub, which
 * sends nothing anywhere and would answer for a file it has never seen. §4's deferral is precisely
 * that objection: a job that stamped "the copy was deleted" without a copy having been deleted
 * records a false fact about personal data. Routing by the row's own `AiProviderId` is what makes
 * the stamp mean something.
 *
 * **Any of a provider's models answers equally, and the order is fixed anyway.** Deleting a file
 * is a property of the vendor rather than of the model: `#deleteProviderUploadedFile()` is
 * implemented once per vendor, on that vendor's provider base, and every concrete driver under it
 * inherits the same call. So which of a provider's models is used to reach the driver cannot change
 * the outcome. It is still ordered rather than left to the database, so that a failure is
 * reproducible and a reader can say which driver was asked.
 *
 * **A model taken out of service is not skipped**, and that is deliberate. `is_active` says whether
 * a model may be asked to answer a request; it says nothing about whether its vendor still holds
 * files this service uploaded. Filtering by it would strand every copy handed to a provider whose
 * models were later deactivated — exactly the rows most in need of being taken back.
 *
 * **Every miss answers null and nothing raises.** A provider with no model rows, or whose model
 * names no driver claims, is an ordinary runtime condition: the caller learns it has no way to
 * reach that vendor and leaves the rows unstamped, which is the truthful outcome.
 * `BulkAiModelProcessorsLoader#resolveProcessor()` answers null for the same reason and this does
 * not turn it into an exception on the way past.
 *
 * **The driver scan happens once per process and what is held is the promise of it.** Building a
 * loader reads a directory and imports every file in it, which that class states is a start-up step
 * rather than something a call being served does. A sweep builds a finder once and asks it per
 * provider, so the scan is pooled against the class rather than carried by the instance — the
 * pattern `AiAgentModelBindingFinder` and `JobDispatcherProvider` already hold. Pooling the promise
 * unawaited is what makes two finders built in the same tick share one scan instead of starting
 * two; a process that builds both finders pays for two scans, which is one directory read at
 * start-up and the argument against the coupling that would remove it is above.
 */
export default class AiProviderModelProcessorFinder {
  /**
   * The one driver scan this class makes, kept against the class that makes it.
   *
   * A `WeakMap` rather than a field, for the reason `AiAgentModelBindingFinder`'s own pool is one:
   * the key is a class, a subclass naming a different loader gets its own entry, and nothing here
   * keeps a class alive that the rest of the process has let go of.
   *
   * @type {WeakMap<*, Promise<BulkAiModelProcessorsLoader>>}
   */
  static bulkAiModelProcessorsLoaderPromisePool = new WeakMap()

  /**
   * Constructor.
   *
   * @param {AiProviderModelProcessorFinderParams} params - Parameters.
   */
  constructor ({
    bulkAiModelProcessorsLoaderPromise,
  }) {
    this.bulkAiModelProcessorsLoaderPromise = bulkAiModelProcessorsLoaderPromise
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiProviderModelProcessorFinder ? X : never} T, X
   * @param {AiProviderModelProcessorFinderFactoryParams} [params] - Parameters for the factory
   * method.
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
   * Obtain this class's one driver scan, starting it where it has not been started.
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
   * @returns {typeof AiProviderModelProcessorFinder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiProviderModelProcessorFinder} */ (this.constructor)
  }

  /**
   * Find the driver that speaks to one provider.
   *
   * @param {{
   *   aiProviderId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The driver, or null when this service has no way to reach the provider.
   * @public
   */
  async findAiModelProcessor ({
    aiProviderId,
  }) {
    const aiModels = await this.findAiModels({
      aiProviderId,
    })

    const aiModelProcessors = await this.resolveAiModelProcessors({
      aiModels,
    })

    return this.extractFirstAiModelProcessor({
      aiModelProcessors,
    })
  }

  /**
   * Find every catalog row naming one provider, in a fixed order.
   *
   * Only the name is read, because the name is the whole of what the driver lookup takes — and a
   * provider's catalog rows carry nothing else this question needs.
   *
   * @param {{
   *   aiProviderId: number
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The rows, in display order and then by id.
   * @public
   */
  async findAiModels ({
    aiProviderId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiModelCtor.findAll({
        where: {
          AiProviderId: aiProviderId,
        },
        attributes: [
          'id',
          'name',
        ],
        order: [
          ['displayOrder', 'ASC'],
          ['id', 'ASC'],
        ],
      })
    )
  }

  /**
   * Resolve the driver each of a provider's model names is served by.
   *
   * Answers one entry per model row, null included, so that the order is the order the rows were
   * read in and the choice below is made over a list a reader can line up against them.
   *
   * @param {{
   *   aiModels: Array<*>
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The drivers, null where a model name is served by none.
   * @public
   */
  async resolveAiModelProcessors ({
    aiModels,
  }) {
    const bulkAiModelProcessorsLoader = await this.bulkAiModelProcessorsLoaderPromise

    return aiModels.map(it =>
      bulkAiModelProcessorsLoader.resolveProcessor({
        aiModelName: it.name,
      })
    )
  }

  /**
   * Extract the first driver that answered.
   *
   * @param {{
   *   aiModelProcessors: Array<*>
   * }} params - Parameters.
   * @returns {*} The driver, or null when none of the provider's models is served by one.
   * @public
   */
  extractFirstAiModelProcessor ({
    aiModelProcessors,
  }) {
    return aiModelProcessors.find(it => it !== null)
      ?? null
  }
}

/**
 * @typedef {{
 *   bulkAiModelProcessorsLoaderPromise: Promise<BulkAiModelProcessorsLoader>
 * }} AiProviderModelProcessorFinderParams
 */

/**
 * @typedef {Partial<AiProviderModelProcessorFinderParams>}
 *   AiProviderModelProcessorFinderFactoryParams
 */
