import AiRunMediaCategoryInspector from './AiRunMediaCategoryInspector.js'

import AiRunInstantInspector from '../aiRun/AiRunInstantInspector.js'
import AiRunKeyInspector from '../aiRun/AiRunKeyInspector.js'

import AiRunMedia from '../../sequelize/models/AiRunMedia.js'

const UNREADABLE_AI_RUN_ID_MESSAGE = 'refused a run that is not an id'
const UNREADABLE_AI_RUN_MEDIA_ID_MESSAGE = 'refused a medium that is not an id'
const UNRECORDABLE_FETCHED_AT_MESSAGE = 'refused a fetch instant that is not an instant'
const UNRECORDABLE_MEDIA_KEY_MESSAGE = 'refused a medium the caller gave no key'
const UNRECORDABLE_MIME_TYPE_MESSAGE = 'refused a medium the caller gave no media type'

/**
 * Writes the `ai_run_media` rows of one run, and marks each one as it is fetched.
 *
 * **The rows are written from the request, before anything is fetched.** They are what the caller
 * declared: its own key for each file, the kind it says the file is, the media type and the size.
 * None of it is a finding of this service, which is why every column is recorded rather than
 * derived - and why the row exists before the fetch that would confirm any of it.
 *
 * **A row is written for a kind this version refuses and for one it ignores, both.** That is what
 * lets a refusal name the kind: `MEDIA_UNSUPPORTED` against a video is a refusal of something on
 * the record, where refusing before recording would leave a run whose reason code named a file
 * nothing in the database had heard of. `AiRunMediaCategoryInspector` is what decides which of the
 * three endings a kind has, and this class decides none of them - it records, and the collector
 * acts.
 *
 * **A kind naming no master row is the one medium that cannot be recorded.**
 * `AiRunMediaCategoryId` is `NOT NULL` and integrity is enforced in application code rather than by
 * the database, so a name that resolves to nothing would otherwise be written as null and refused
 * by the column with nothing saying which medium did it. It is answered by name instead, and the
 * caller refuses the run naming the key and the word the caller sent.
 *
 * **No file bytes and no URL.** The table holds neither (`#media-fetch`, §18): the bytes live in
 * the run's workspace for the length of the run, and the URL is read from `ai_runs.request_body` at
 * fetch time by `AiRunMediaDescriptorExtractor` and never re-stored.
 *
 * **`isReadable` starts false and turns true only once something has been read.** A medium that was
 * never fetched and one that was fetched and failed therefore read the same way, which is what the
 * column's own comment asks for - and `fetchedAt` is what tells those two apart.
 */
export default class AiRunMediaRecorder {
  /**
   * Constructor.
   *
   * @param {AiRunMediaRecorderParams} params - Parameters.
   */
  constructor ({
    aiRunMediaCategoryInspector,
    aiRunInstantInspector,
    aiRunKeyInspector,
  }) {
    this.aiRunMediaCategoryInspector = aiRunMediaCategoryInspector
    this.aiRunInstantInspector = aiRunInstantInspector
    this.aiRunKeyInspector = aiRunKeyInspector
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunMediaRecorder ? X : never} T, X
   * @param {AiRunMediaRecorderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunMediaCategoryInspector = this.createAiRunMediaCategoryInspector(),
    aiRunInstantInspector = this.createAiRunInstantInspector(),
    aiRunKeyInspector = this.createAiRunKeyInspector(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunMediaCategoryInspector,
        aiRunInstantInspector,
        aiRunKeyInspector,
      })
    )
  }

  /**
   * Create the inspector answering what this version does with a kind of medium.
   *
   * @returns {AiRunMediaCategoryInspector} Inspector.
   */
  static createAiRunMediaCategoryInspector () {
    return AiRunMediaCategoryInspector.create()
  }

  /**
   * Create the inspector answering whether a value is an instant a column can hold.
   *
   * @returns {AiRunInstantInspector} Inspector.
   */
  static createAiRunInstantInspector () {
    return AiRunInstantInspector.create()
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
   * get: the medium model.
   *
   * @returns {typeof AiRunMedia} Model.
   */
  static get AiRunMediaCtor () {
    return AiRunMedia
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunMediaRecorder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunMediaRecorder} */ (this.constructor)
  }

  /**
   * Save the record of every medium a run was handed.
   *
   * One insert rather than one per medium: the twelve rows are one fact about one run, and a
   * caller that wrote them one at a time would leave a half-recorded run behind the first failure.
   *
   * @param {{
   *   aiRunId: *
   *   mediaDescriptors: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The saved media, in the order the request declared them.
   * @throws {Error} When the run is not an id, or a medium cannot be recorded as declared.
   * @public
   */
  async saveAiRunMedia ({
    aiRunId,
    mediaDescriptors,
  }) {
    const comparableAiRunId = this.aiRunKeyInspector.generateComparableKey({
      key: aiRunId,
    })

    if (comparableAiRunId === null) {
      throw new Error(`${this.Ctor.name}#saveAiRunMedia() ${UNREADABLE_AI_RUN_ID_MESSAGE}: AiRunId ${aiRunId}`)
    }

    const recordableValues = mediaDescriptors.map(it =>
      this.buildRecordableValues({
        aiRunId: comparableAiRunId,
        mediaDescriptor: it,
      })
    )

    return /** @type {*} */ (
      this.Ctor.AiRunMediaCtor.bulkCreate(recordableValues)
    )
  }

  /**
   * Build the row one declared medium is recorded as.
   *
   * @param {{
   *   aiRunId: number
   *   mediaDescriptor: Record<string, *>
   * }} params - Parameters.
   * @returns {Record<string, *>} The values.
   * @throws {Error} When the medium carries no key, no media type, or a kind naming no master row.
   * @public
   */
  buildRecordableValues ({
    aiRunId,
    mediaDescriptor,
  }) {
    const {
      mediaKey,
      mediaCategoryName,
      mimeType,
      byteSize,
    } = mediaDescriptor

    if (typeof mediaKey !== 'string' || mediaKey === '') {
      throw new Error(`${this.Ctor.name}#buildRecordableValues() ${UNRECORDABLE_MEDIA_KEY_MESSAGE}: AiRunId ${aiRunId}`)
    }

    if (typeof mimeType !== 'string' || mimeType === '') {
      throw new Error(`${this.Ctor.name}#buildRecordableValues() ${UNRECORDABLE_MIME_TYPE_MESSAGE}: AiRunId ${aiRunId}, mediaKey ${mediaKey}`)
    }

    const aiRunMediaCategoryId = this.generateAiRunMediaCategoryId({
      mediaCategoryName,
    })

    return {
      AiRunId: aiRunId,
      mediaKey,
      AiRunMediaCategoryId: aiRunMediaCategoryId,
      mimeType,
      byteSize,
      isReadable: false,
      fetchedAt: null,
    }
  }

  /**
   * Generate the id of the kind a request named.
   *
   * A name naming no master row answers null here rather than being refused, because the run is
   * refused for it one step later and with more to say: the collector names both the key and the
   * word the caller sent. The `NOT NULL` column is the backstop rather than the message.
   *
   * @param {{
   *   mediaCategoryName: *
   * }} params - Parameters.
   * @returns {number | null} The id, or null when the name names no kind.
   * @public
   */
  generateAiRunMediaCategoryId ({
    mediaCategoryName,
  }) {
    return this.aiRunMediaCategoryInspector.extractAiRunMediaCategoryId({
      mediaCategoryName,
    })
  }

  /**
   * Save what became of one medium once the fetch had been attempted.
   *
   * @param {{
   *   aiRunMediaId: *
   *   isReadable: boolean
   *   fetchedAt: Date
   * }} params - Parameters.
   * @returns {Promise<number>} How many rows this write moved.
   * @throws {Error} When the medium is not an id, or the instant is not an instant.
   * @public
   */
  async saveFetchedAiRunMedia ({
    aiRunMediaId,
    isReadable,
    fetchedAt,
  }) {
    const comparableAiRunMediaId = this.aiRunKeyInspector.generateComparableKey({
      key: aiRunMediaId,
    })

    if (comparableAiRunMediaId === null) {
      throw new Error(`${this.Ctor.name}#saveFetchedAiRunMedia() ${UNREADABLE_AI_RUN_MEDIA_ID_MESSAGE}: AiRunMediaId ${aiRunMediaId}`)
    }

    if (
      !this.aiRunInstantInspector.isRecordableInstant({
        instant: fetchedAt,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveFetchedAiRunMedia() ${UNRECORDABLE_FETCHED_AT_MESSAGE}: AiRunMediaId ${aiRunMediaId}`)
    }

    const [
      movedRowCount,
    ] = await this.Ctor.AiRunMediaCtor.update(
      {
        isReadable,
        fetchedAt,
      },
      {
        where: {
          id: comparableAiRunMediaId,
        },
      }
    )

    return movedRowCount
  }

  /**
   * Find every medium a run was handed, in the order they were recorded.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The run's media.
   * @public
   */
  async findAiRunMedia ({
    aiRunId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunMediaCtor.findAll({
        where: {
          AiRunId: aiRunId,
        },
        order: [
          [
            'id',
            'ASC',
          ],
        ],
      })
    )
  }
}

/**
 * @typedef {{
 *   aiRunMediaCategoryInspector: AiRunMediaCategoryInspector
 *   aiRunInstantInspector: AiRunInstantInspector
 *   aiRunKeyInspector: AiRunKeyInspector
 * }} AiRunMediaRecorderParams
 */

/**
 * @typedef {Partial<AiRunMediaRecorderParams>} AiRunMediaRecorderFactoryParams
 */
