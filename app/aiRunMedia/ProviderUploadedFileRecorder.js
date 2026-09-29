import AiRunInstantInspector from '../aiRun/AiRunInstantInspector.js'
import AiRunKeyInspector from '../aiRun/AiRunKeyInspector.js'

import AiProvider from '../../sequelize/models/AiProvider.js'
import AiRunMedia from '../../sequelize/models/AiRunMedia.js'
import ProviderUploadedFile from '../../sequelize/models/ProviderUploadedFile.js'

/*
 * What the provider calls the file: one line of printable characters, and nothing longer than a
 * handle could reasonably be.
 *
 * The column is `TEXT` because the shape of the handle is the provider's to choose and no vendor
 * bounds it for us - which leaves this class as the only place anything is asked of it. What is
 * refused is a control character, a newline among them, and a value past the bound: this row is the
 * egress record, kept independently of whether the run's content still exists, so whatever lands in
 * it is read by an operator years later and must be one line they can search for.
 */
const PROVIDER_FILE_NAME_PATTERN = /^[^\p{Cc}]{1,1024}$/u

const UNREADABLE_KEY_MESSAGE = 'refused a key that is not an id'
const UNKNOWN_AI_RUN_MEDIA_MESSAGE = 'refused a medium that does not exist'
const UNKNOWN_AI_PROVIDER_MESSAGE = 'refused a provider that does not exist'
const UNRECORDABLE_PROVIDER_FILE_NAME_MESSAGE = 'refused a provider file name the record cannot carry'
const UNRECORDABLE_UPLOADED_AT_MESSAGE = 'refused an upload instant that is not an instant'
const UNRECORDABLE_EXPIRES_AT_MESSAGE = 'refused an expiry that is not an instant'
const IMPOSSIBLE_EXPIRES_AT_MESSAGE = 'refused an expiry falling before the upload it belongs to'

/**
 * Writes one `provider_uploaded_files` row for each file handed to a provider.
 *
 * **Why the record is a class of its own.** Section 18's third acceptance criterion says every file
 * handed to a provider is recorded, with which provider received it and when - and the step that
 * does the handing is not this feature's. It is the upload step of the asset-media-extraction run,
 * and a later service that hands a file to a provider will be another one. The record is therefore
 * written in one place, by whatever is doing the handing, rather than once per service.
 *
 * **The row outlives what it describes, which is what it is for.** Section 18: the egress record is
 * kept independently of whether the run's content still exists. Thirty days after the run its
 * request body and result body are emptied, and this row still answers "which file left this
 * machine, to whom, and when" - so every column is a fact about the transfer and none of them holds
 * anything read out of the file.
 *
 * **Both ends are read before the row is written.** `provider_uploaded_files` declares no database
 * foreign key, by the rule that referential integrity is enforced in application code, so nothing
 * but this class stops a row naming a medium or a provider that does not exist. Either one would
 * answer the second use case - which file went where, months later - with a row that points at
 * nothing, and the point of keeping the record at all is that it can still be joined when
 * everything else has been purged.
 *
 * **The medium is read through the association's stated alias.** `singularize('AiRunMedia')` is
 * `AiRunMedium`, so Sequelize's own inference resolves to a column no table has; the model states
 * `foreignKey: 'AiRunMediaId'` and `as: 'AiRunMedia'` for that reason, and an include of it must
 * name the alias. This class reads the medium by its own primary key rather than through the
 * association, which sidesteps the question - it is written down here because the next reader will
 * reach for an include.
 *
 * **A refusal throws rather than answering null.** Every one of them is a defect in the call - an
 * id that is no id, a name the column cannot carry, an instant that is not one, an end that falls
 * before its beginning - and a second delivery of the same call would carry exactly the same
 * defect. `AiRunStatusRecorder` and `AiRunFieldOutcomeRecorder` both raise for this class of defect,
 * and a caller answered with a quiet null would carry on believing the file's departure had been
 * recorded. That belief is the one thing this table exists to prevent anybody holding.
 *
 * **Nothing here reads a clock.** The upload instant arrives on the call, following
 * `AiModelCallRecorder`: the instant a provider was handed the file is known by whatever handed it
 * over, and a clock read here would record when the row was written instead.
 */
export default class ProviderUploadedFileRecorder {
  /**
   * Constructor.
   *
   * @param {ProviderUploadedFileRecorderParams} params - Parameters.
   */
  constructor ({
    aiRunInstantInspector,
    aiRunKeyInspector,
  }) {
    this.aiRunInstantInspector = aiRunInstantInspector
    this.aiRunKeyInspector = aiRunKeyInspector
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof ProviderUploadedFileRecorder ? X : never} T, X
   * @param {ProviderUploadedFileRecorderFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunInstantInspector = this.createAiRunInstantInspector(),
    aiRunKeyInspector = this.createAiRunKeyInspector(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunInstantInspector,
        aiRunKeyInspector,
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
   * Create the inspector answering whether a value is a key of this feature.
   *
   * @returns {AiRunKeyInspector} Inspector.
   */
  static createAiRunKeyInspector () {
    return AiRunKeyInspector.create()
  }

  /**
   * get: the egress record model.
   *
   * @returns {typeof ProviderUploadedFile} Model.
   */
  static get ProviderUploadedFileCtor () {
    return ProviderUploadedFile
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
   * get: the provider model.
   *
   * @returns {typeof AiProvider} Model.
   */
  static get AiProviderCtor () {
    return AiProvider
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof ProviderUploadedFileRecorder} The class.
   */
  get Ctor () {
    return /** @type {typeof ProviderUploadedFileRecorder} */ (this.constructor)
  }

  /**
   * Save the record of one file handed to a provider.
   *
   * @param {SaveProviderUploadedFileParams} params - Parameters.
   * @returns {Promise<*>} The saved egress record.
   * @throws {Error} When the call names no medium or provider, or carries an unholdable value.
   * @public
   */
  async saveProviderUploadedFile ({
    aiRunMediaId,
    aiProviderId,
    providerFileName,
    uploadedAt,
    expiresAt,
  }) {
    const unreadableKeyFieldName = this.extractUnreadableKeyFieldName({
      aiRunMediaId,
      aiProviderId,
    })

    if (unreadableKeyFieldName) {
      throw new Error(`${this.Ctor.name}#saveProviderUploadedFile() ${UNREADABLE_KEY_MESSAGE}: field ${unreadableKeyFieldName}`)
    }

    const refusedInstantMessage = this.extractRefusedInstantMessage({
      uploadedAt,
      expiresAt,
    })

    if (refusedInstantMessage) {
      throw new Error(`${this.Ctor.name}#saveProviderUploadedFile() ${refusedInstantMessage}: AiRunMediaId ${aiRunMediaId}, AiProviderId ${aiProviderId}`)
    }

    if (
      !this.isRecordableProviderFileName({
        providerFileName,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveProviderUploadedFile() ${UNRECORDABLE_PROVIDER_FILE_NAME_MESSAGE}: AiRunMediaId ${aiRunMediaId}, AiProviderId ${aiProviderId}`)
    }

    const aiRunMedia = await this.findAiRunMedia({
      aiRunMediaId,
    })

    if (!aiRunMedia) {
      throw new Error(`${this.Ctor.name}#saveProviderUploadedFile() ${UNKNOWN_AI_RUN_MEDIA_MESSAGE}: AiRunMediaId ${aiRunMediaId}`)
    }

    const aiProvider = await this.findAiProvider({
      aiProviderId,
    })

    if (!aiProvider) {
      throw new Error(`${this.Ctor.name}#saveProviderUploadedFile() ${UNKNOWN_AI_PROVIDER_MESSAGE}: AiProviderId ${aiProviderId}`)
    }

    const recordableValues = this.buildRecordableValues({
      aiRunMediaId,
      aiProviderId,
      providerFileName,
      uploadedAt,
      expiresAt,
    })

    return this.Ctor.ProviderUploadedFileCtor.create(recordableValues)
  }

  /**
   * Extract the name of the first key field carrying something that is not an id.
   *
   * @param {{
   *   aiRunMediaId: *
   *   aiProviderId: *
   * }} params - Parameters.
   * @returns {string | null} The field name, or null when both are ids.
   * @public
   */
  extractUnreadableKeyFieldName ({
    aiRunMediaId,
    aiProviderId,
  }) {
    const keyEntries = [
      ['AiRunMediaId', aiRunMediaId],
      ['AiProviderId', aiProviderId],
    ]

    const unreadableEntry = keyEntries
      .find(([, key]) => !this.aiRunKeyInspector.isRecordableKey({
        key,
      }))

    if (!unreadableEntry) {
      return null
    }

    const [unreadableFieldName] = unreadableEntry

    return unreadableFieldName
  }

  /**
   * Extract the message an instant of the call is refused under.
   *
   * @param {{
   *   uploadedAt: *
   *   expiresAt: *
   * }} params - Parameters.
   * @returns {string | null} The message, or null when both instants are recordable.
   * @public
   */
  extractRefusedInstantMessage ({
    uploadedAt,
    expiresAt,
  }) {
    if (
      !this.aiRunInstantInspector.isRecordableInstant({
        instant: uploadedAt,
      })
    ) {
      return UNRECORDABLE_UPLOADED_AT_MESSAGE
    }

    if (
      !this.isRecordableExpiresAt({
        expiresAt,
      })
    ) {
      return UNRECORDABLE_EXPIRES_AT_MESSAGE
    }

    if (
      !this.expiresAfterUpload({
        uploadedAt,
        expiresAt,
      })
    ) {
      return IMPOSSIBLE_EXPIRES_AT_MESSAGE
    }

    return null
  }

  /**
   * Check whether an expiry is one the record can carry.
   *
   * Null is what a provider stating no expiry leaves, and the column is nullable for exactly that -
   * so null passes, and anything else must be an instant.
   *
   * @param {{
   *   expiresAt: *
   * }} params - Parameters.
   * @returns {boolean} Whether it can be recorded.
   * @public
   */
  isRecordableExpiresAt ({
    expiresAt,
  }) {
    if (expiresAt === null) {
      return true
    }

    return this.aiRunInstantInspector.isRecordableInstant({
      instant: expiresAt,
    })
  }

  /**
   * Check whether an expiry falls after the upload it belongs to.
   *
   * A handle that expired before it was issued is not a fact about any transfer, and the row would
   * answer "when could this still have been fetched" with a span of negative length.
   *
   * @param {{
   *   uploadedAt: Date
   *   expiresAt: Date | null
   * }} params - Parameters.
   * @returns {boolean} Whether the pair reads as a span.
   * @public
   */
  expiresAfterUpload ({
    uploadedAt,
    expiresAt,
  }) {
    if (expiresAt === null) {
      return true
    }

    return expiresAt.getTime() > uploadedAt.getTime()
  }

  /**
   * Check whether a provider file name is one the record can carry.
   *
   * @param {{
   *   providerFileName: *
   * }} params - Parameters.
   * @returns {boolean} Whether it can be recorded.
   * @public
   */
  isRecordableProviderFileName ({
    providerFileName,
  }) {
    if (typeof providerFileName !== 'string') {
      return false
    }

    if (providerFileName.trim() === '') {
      return false
    }

    return PROVIDER_FILE_NAME_PATTERN.test(providerFileName)
  }

  /**
   * Build the values one egress record is written with.
   *
   * @param {SaveProviderUploadedFileParams} params - Parameters.
   * @returns {{
   *   AiRunMediaId: *
   *   AiProviderId: *
   *   providerFileName: string
   *   uploadedAt: Date
   *   expiresAt: Date | null
   * }} The values.
   * @public
   */
  buildRecordableValues ({
    aiRunMediaId,
    aiProviderId,
    providerFileName,
    uploadedAt,
    expiresAt,
  }) {
    return {
      AiRunMediaId: aiRunMediaId,
      AiProviderId: aiProviderId,
      providerFileName,
      uploadedAt,
      expiresAt,
    }
  }

  /**
   * Find the medium a record is about.
   *
   * @param {{
   *   aiRunMediaId: *
   * }} params - Parameters.
   * @returns {Promise<*>} The medium, or null when none carries the id.
   * @public
   */
  async findAiRunMedia ({
    aiRunMediaId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunMediaCtor.findOne({
        where: {
          id: aiRunMediaId,
        },
      })
    )
  }

  /**
   * Find the provider a record names.
   *
   * @param {{
   *   aiProviderId: *
   * }} params - Parameters.
   * @returns {Promise<*>} The provider, or null when none carries the id.
   * @public
   */
  async findAiProvider ({
    aiProviderId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiProviderCtor.findOne({
        where: {
          id: aiProviderId,
        },
      })
    )
  }
}

/**
 * @typedef {{
 *   aiRunInstantInspector: AiRunInstantInspector
 *   aiRunKeyInspector: AiRunKeyInspector
 * }} ProviderUploadedFileRecorderParams
 */

/**
 * @typedef {Partial<ProviderUploadedFileRecorderParams>} ProviderUploadedFileRecorderFactoryParams
 */

/**
 * @typedef {{
 *   aiRunMediaId: number | string
 *   aiProviderId: number | string
 *   providerFileName: string
 *   uploadedAt: Date
 *   expiresAt: Date | null
 * }} SaveProviderUploadedFileParams
 */
