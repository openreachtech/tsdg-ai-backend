import AiRunKeyInspector from '../aiRun/AiRunKeyInspector.js'

import AI_RUN_MEDIA_CATEGORY_CONSTANT_HASH from '../constants/aiRunMediaCategoryConstants.js'

const {
  AI_RUN_MEDIA_CATEGORY,
} = AI_RUN_MEDIA_CATEGORY_CONSTANT_HASH

/*
 * The rows of `ai_run_media_categories`, read from the constants the master seeder seeds from.
 *
 * Reading the table instead would be a query per medium on a master of three rows that changes
 * when a version does, and `AiRunFieldOutcomeRecorder` already settled the same question the same
 * way: a master row that is not in the hash was never seeded, so the hash and the table cannot
 * disagree without the seeder being wrong.
 */
const DEFAULT_AI_RUN_MEDIA_CATEGORIES = Object.values(AI_RUN_MEDIA_CATEGORY)

/**
 * Answers whether a medium is of a kind this version handles, and what that kind is called.
 *
 * **The answer is the flag on the row, never the word `image`.** `ai_run_media_categories` carries
 * `is_active` - true for image, false for video and audio - precisely so that "a kind this version
 * does not handle is refused by name" is a data fact rather than a branch. Turning video on later
 * is then a flag flipped on an existing row, and a fourth kind is a new row; neither is a change to
 * this class. A class that compared against the name `image` would have to be edited for both, and
 * the flag would be sitting there saying something nothing read.
 *
 * **Refused by name is the whole point of the other two rows being seeded at all.** A request
 * naming `video` resolves to a row, and the run fails under `MEDIA_UNSUPPORTED` naming the kind -
 * where a request naming `hologram` resolves to nothing and is a different refusal. This class
 * tells those two apart, which is what `#extractAiRunMediaCategoryName()` is for: a kind that
 * resolves has a name to be refused by, and a kind that does not resolve answers null.
 *
 * **An id that arrived as text is compared as a number.** `AiRunMediaCategoryId` reaches here as a
 * number from SQLite and may reach here as text from MariaDB or from a job payload that crossed a
 * queue as JSON, so both spellings go through `AiRunKeyInspector` rather than being compared in the
 * form they arrived in.
 */
export default class AiRunMediaCategoryInspector {
  /**
   * Constructor.
   *
   * @param {AiRunMediaCategoryInspectorParams} params - Parameters.
   */
  constructor ({
    aiRunMediaCategories,
    aiRunKeyInspector,
  }) {
    this.aiRunMediaCategories = aiRunMediaCategories
    this.aiRunKeyInspector = aiRunKeyInspector
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunMediaCategoryInspector ? X : never} T, X
   * @param {AiRunMediaCategoryInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunMediaCategories = DEFAULT_AI_RUN_MEDIA_CATEGORIES,
    aiRunKeyInspector = this.createAiRunKeyInspector(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunMediaCategories,
        aiRunKeyInspector,
      })
    )
  }

  /**
   * Create the inspector answering whether a value is a key of this feature.
   *
   * @returns {AiRunKeyInspector} Inspector.
   */
  static createAiRunKeyInspector () {
    return AiRunKeyInspector.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunMediaCategoryInspector} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunMediaCategoryInspector} */ (this.constructor)
  }

  /**
   * Check whether a medium of this kind is one this version handles.
   *
   * @param {{
   *   aiRunMediaCategoryId: *
   * }} params - Parameters.
   * @returns {boolean} Whether this version handles the kind.
   * @public
   */
  isHandledAiRunMediaCategoryId ({
    aiRunMediaCategoryId,
  }) {
    const aiRunMediaCategory = this.extractAiRunMediaCategoryById({
      aiRunMediaCategoryId,
    })

    if (aiRunMediaCategory === null) {
      return false
    }

    return aiRunMediaCategory.IS_ACTIVE
  }

  /**
   * Check whether a kind a request named is one this version handles.
   *
   * @param {{
   *   mediaCategoryName: *
   * }} params - Parameters.
   * @returns {boolean} Whether this version handles the kind.
   * @public
   */
  isHandledMediaCategoryName ({
    mediaCategoryName,
  }) {
    const aiRunMediaCategory = this.extractAiRunMediaCategoryByName({
      mediaCategoryName,
    })

    if (aiRunMediaCategory === null) {
      return false
    }

    return aiRunMediaCategory.IS_ACTIVE
  }

  /**
   * Extract the name a kind is refused by.
   *
   * @param {{
   *   aiRunMediaCategoryId: *
   * }} params - Parameters.
   * @returns {string | null} The name of the kind, or null when the id names no kind at all.
   * @public
   */
  extractAiRunMediaCategoryName ({
    aiRunMediaCategoryId,
  }) {
    const aiRunMediaCategory = this.extractAiRunMediaCategoryById({
      aiRunMediaCategoryId,
    })

    if (aiRunMediaCategory === null) {
      return null
    }

    return aiRunMediaCategory.NAME
  }

  /**
   * Extract the id of the kind a request named, so a medium can be recorded under it.
   *
   * A kind this version does not handle still resolves to its id, because the row is recorded
   * before it is refused - that is what lets the refusal name the kind.
   *
   * @param {{
   *   mediaCategoryName: *
   * }} params - Parameters.
   * @returns {number | null} The id of the kind, or null when the name names no kind.
   * @public
   */
  extractAiRunMediaCategoryId ({
    mediaCategoryName,
  }) {
    const aiRunMediaCategory = this.extractAiRunMediaCategoryByName({
      mediaCategoryName,
    })

    if (aiRunMediaCategory === null) {
      return null
    }

    return aiRunMediaCategory.ID
  }

  /**
   * Extract the master row an id names.
   *
   * @param {{
   *   aiRunMediaCategoryId: *
   * }} params - Parameters.
   * @returns {AiRunMediaCategoryRecord | null} The row, or null when the id names none.
   * @public
   */
  extractAiRunMediaCategoryById ({
    aiRunMediaCategoryId,
  }) {
    const comparableId = this.aiRunKeyInspector.generateComparableKey({
      key: aiRunMediaCategoryId,
    })

    if (comparableId === null) {
      return null
    }

    return this.aiRunMediaCategories
      .find(it => it.ID === comparableId)
      ?? null
  }

  /**
   * Extract the master row a name names.
   *
   * @param {{
   *   mediaCategoryName: *
   * }} params - Parameters.
   * @returns {AiRunMediaCategoryRecord | null} The row, or null when the name names none.
   * @public
   */
  extractAiRunMediaCategoryByName ({
    mediaCategoryName,
  }) {
    if (typeof mediaCategoryName !== 'string') {
      return null
    }

    return this.aiRunMediaCategories
      .find(it => it.NAME === mediaCategoryName)
      ?? null
  }
}

/**
 * @typedef {{
 *   aiRunMediaCategories: Array<AiRunMediaCategoryRecord>
 *   aiRunKeyInspector: AiRunKeyInspector
 * }} AiRunMediaCategoryInspectorParams
 */

/**
 * @typedef {Partial<AiRunMediaCategoryInspectorParams>} AiRunMediaCategoryInspectorFactoryParams
 */

/**
 * @typedef {{
 *   ID: number
 *   NAME: string
 *   DISPLAY_NAME: string
 *   DISPLAY_ORDER: number
 *   IS_ACTIVE: boolean
 * }} AiRunMediaCategoryRecord
 */
