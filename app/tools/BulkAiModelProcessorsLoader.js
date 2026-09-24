import BaseAiModelProcessor from './BaseAiModelProcessor.js'
import FileUrlDeepBulkClassLoader from './FileUrlDeepBulkClassLoader.js'

import {
  rootPath,
} from '../globals/_.js'

/*
 * The directory is the registry. A model is added by dropping one processor file in here, and
 * nothing else has to be told about it — which is what "ORT adds a model without touching the
 * services that use one" comes down to in code.
 */
const PROCESSOR_POOL_PATH = rootPath.to('app/tools/AiModelProcessor/')

/**
 * Answers which processor serves a given AI model name.
 *
 * **Callers never name a vendor.** A caller holds an `ai_models.name` — the app-facing key, which
 * for a default installation is the seeded `stub` row — and asks this for the processor that serves
 * it. That is what keeps `if (provider === 'anthropic')` out of the jobs, the renderers and the
 * engine: a branch that, written once, tends to get written in four more places.
 *
 * **Where the lookup key comes from.** Each processor declares its own, through `#get:aiModel`, and
 * this class never holds a list of names. The alternative — a registry file naming every processor —
 * is a second place that has to be edited in step with the first, and the whole point of discovering
 * the classes from the filesystem is that no such place exists.
 *
 * A processor that declares no key does **not** go silently missing from the hash: the key is read
 * from every discovered processor while the hash is being built, so the abstract getter on
 * `BaseAiModelProcessor` throws at start-up, naming the class that forgot. Two processors claiming
 * one name fail the same way, rather than one of them quietly never running again. Both are
 * programming errors in the processor set, and both are meant to stop the process before it serves
 * anything.
 *
 * **What a miss answers.** `#resolveProcessor()` answers `null` for a name nothing claims, and never
 * falls back to the default model. A name nobody serves is an ordinary runtime condition — a model
 * row pointing at a processor that was never written, or a misspelled name — not a programming
 * error, so it is reported as a value the caller decides about, following the generation-returns-null
 * rule. Falling back to the default would be the genuinely dangerous answer: a run would quietly be
 * answered by a model nobody asked for, and the record would say so only in hindsight.
 *
 * **When the scan runs.** `.createAsync()` reads the filesystem and imports every file it finds —
 * sequentially, with no recursion limit and no cycle detection. It is therefore a start-up step, run
 * once, and the loader is held from then on. `#resolveProcessor()` touches neither the filesystem nor
 * the database; it is a hash lookup, safe on the path of every call.
 */
export default class BulkAiModelProcessorsLoader {
  /**
   * Constructor.
   *
   * @param {BulkAiModelProcessorsLoaderParams} params - Parameters.
   */
  constructor ({
    processorHash,
  }) {
    this.processorHash = processorHash
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof BulkAiModelProcessorsLoader ? X : never} T, X
   * @param {BulkAiModelProcessorsLoaderParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    processorHash,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        processorHash,
      })
    )
  }

  /**
   * Factory method that discovers the processors on disk.
   *
   * Reads a directory and imports what it finds, so this belongs to start-up — never to a call being
   * served.
   *
   * @template {X extends typeof BulkAiModelProcessorsLoader ? X : never} T, X
   * @param {{
   *   poolPath?: string
   * }} [params] - Parameters for the factory method.
   * @returns {Promise<InstanceType<T>>} Instance of this class.
   * @this {T}
   * @public
   */
  static async createAsync ({
    poolPath = PROCESSOR_POOL_PATH,
  } = {}) {
    const processorCtors = await this.loadProcessorCtors({
      poolPath,
    })

    const processors = processorCtors.map(ProcessorCtor => ProcessorCtor.create())

    const processorHash = this.buildProcessorHash({
      processors,
    })

    return this.create({
      processorHash,
    })
  }

  /**
   * Deep bulk class loader class.
   *
   * The framework's own walk hands back raw filesystem paths, which the ESM loader refuses to
   * import on Windows. The subclass named here hands back file URLs instead; see its own
   * documentation for what it works around.
   *
   * @returns {typeof FileUrlDeepBulkClassLoader} The class that walks the pool directory.
   */
  static get DeepBulkClassLoaderCtor () {
    return FileUrlDeepBulkClassLoader
  }

  /**
   * The base class a discovered class has to derive from to count as a processor.
   *
   * @returns {typeof BaseAiModelProcessor} The abstract model processor.
   */
  static get BaseAiModelProcessorCtor () {
    return BaseAiModelProcessor
  }

  /**
   * Load every processor class the pool directory holds.
   *
   * @param {{
   *   poolPath: string
   * }} params - Parameters.
   * @returns {Promise<Array<typeof BaseAiModelProcessor>>} The discovered processor classes.
   * @public
   */
  static async loadProcessorCtors ({
    poolPath,
  }) {
    const classLoader = this.createDeepBulkClassLoader({
      poolPath,
    })

    return /** @type {*} */ (
      classLoader.loadClasses({
        filterFunc: Ctor => this.isProcessorCtor({
          Ctor,
        }),
      })
    )
  }

  /**
   * Create the deep bulk class loader for a pool directory.
   *
   * @param {{
   *   poolPath: string
   * }} params - Parameters.
   * @returns {FileUrlDeepBulkClassLoader} The class loader.
   */
  static createDeepBulkClassLoader ({
    poolPath,
  }) {
    return this.DeepBulkClassLoaderCtor.create({
      poolPath,
    })
  }

  /**
   * Check whether a discovered class is a model processor.
   *
   * The pool directory is allowed to hold something that is not a processor; only what derives from
   * the abstract processor is instantiated and asked for a model name.
   *
   * @param {{
   *   Ctor: Function
   * }} params - Parameters.
   * @returns {boolean} True when the class derives from the abstract model processor.
   */
  static isProcessorCtor ({
    Ctor,
  }) {
    return Ctor.prototype instanceof this.BaseAiModelProcessorCtor
  }

  /**
   * Build the hash that maps an AI model name to the processor serving it.
   *
   * Every processor is asked for its key here, at start-up, so a processor that declares none stops
   * the process instead of being absent from the hash without a word.
   *
   * The names are collected first and the duplicate is looked for before anything is folded, so the
   * check that stops start-up stands on its own rather than inside the fold's callback.
   *
   * @param {{
   *   processors: Array<BaseAiModelProcessor>
   * }} params - Parameters.
   * @returns {Record<string, BaseAiModelProcessor>} AI model name to processor.
   * @throws {Error} When two processors claim one AI model name.
   */
  static buildProcessorHash ({
    processors,
  }) {
    const aiModelNames = processors.map(processor =>
      this.extractAiModelName({
        processor,
      })
    )

    const duplicatedAiModelName = this.extractDuplicatedAiModelName({
      aiModelNames,
    })

    if (duplicatedAiModelName !== null) {
      throw new Error(`${this.name}.buildProcessorHash() found two processors claiming the AI model name: ${duplicatedAiModelName}`)
    }

    return processors.reduce(
      (processorHash, processor) =>
        this.appendProcessorToHash({
          processorHash,
          processor,
        }),
      {}
    )
  }

  /**
   * Extract the AI model name a processor declares for itself.
   *
   * The one place the key is read. A processor exposes it as `#get:aiModel`, matching the app-facing
   * `ai_models.name` — never the vendor's own `target_model_name`.
   *
   * @param {{
   *   processor: BaseAiModelProcessor
   * }} params - Parameters.
   * @returns {string} The AI model name the processor serves.
   */
  static extractAiModelName ({
    processor,
  }) {
    return processor.aiModel
  }

  /**
   * Extract the first AI model name that more than one processor claims.
   *
   * A name is a duplicate when it already stands earlier in the array, so the name answered is the
   * one of the second processor claiming it — the processor that would otherwise have overwritten
   * an entry already made.
   *
   * @param {{
   *   aiModelNames: Array<string>
   * }} params - Parameters.
   * @returns {string | null} The duplicated name, or null when every name is claimed once.
   */
  static extractDuplicatedAiModelName ({
    aiModelNames,
  }) {
    const duplicatedAiModelNames = aiModelNames.filter((aiModelName, index) =>
      aiModelNames.indexOf(aiModelName) !== index
    )

    return duplicatedAiModelNames[0]
      ?? null
  }

  /**
   * Append one processor to the hash under the name it declares.
   *
   * Answers a new hash rather than touching the one handed in, so the fold this serves keeps no
   * state of its own.
   *
   * @param {{
   *   processorHash: Record<string, BaseAiModelProcessor>
   *   processor: BaseAiModelProcessor
   * }} params - Parameters.
   * @returns {Record<string, BaseAiModelProcessor>} The hash with the processor in it.
   */
  static appendProcessorToHash ({
    processorHash,
    processor,
  }) {
    const aiModelName = this.extractAiModelName({
      processor,
    })

    return {
      ...processorHash,
      [aiModelName]: processor,
    }
  }

  /**
   * Resolve the processor serving an AI model name.
   *
   * Answers null when nothing claims the name, rather than falling back to the default model.
   *
   * The membership check is `Object.hasOwn()` rather than a lookup falling back to null, because a
   * plain hash answers `constructor`, `toString` and the rest of `Object.prototype` with something
   * that is not a processor — an answer worse than no answer.
   *
   * @param {{
   *   aiModelName: string
   * }} params - Parameters.
   * @returns {BaseAiModelProcessor | null} The processor, or null when the name is served by none.
   * @public
   */
  resolveProcessor ({
    aiModelName,
  }) {
    if (!Object.hasOwn(this.processorHash, aiModelName)) {
      return null
    }

    return this.processorHash[aiModelName]
  }
}

/**
 * @typedef {{
 *   processorHash: Record<string, BaseAiModelProcessor>
 * }} BulkAiModelProcessorsLoaderParams
 */
