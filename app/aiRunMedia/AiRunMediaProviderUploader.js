import ProviderUploadedFileRecorder from './ProviderUploadedFileRecorder.js'

/**
 * The second half of step 2: hands the fetched files to the provider, and records what left.
 *
 * **What is handed over is the file in the run's workspace, never the caller's URL.** The vendor is
 * given a path on this machine to a copy this service fetched under its own allow-list, so a
 * provider never reaches into a client's storage on this service's credential and a URL the caller
 * wrote never travels outward.
 *
 * **Preparing is the driver's, and every driver answers it.** `BaseAiModelProcessor` hands the
 * files back untouched by default and a driver whose vendor wants them uploaded ahead of the
 * request overrides it - so this class calls the one member and branches on no vendor. The files it
 * gets back are the ones the request is built with, whatever the driver made of them.
 *
 * **An egress row is written for a file the driver says it uploaded, and for no other.** The
 * record is "what left the machine, to whom, when" (§18), and `provider_file_name` is what a
 * driver that sent something answers with. A driver that sends nothing - the one a keyless
 * installation runs - leaves no rows behind, and that is the truth about it rather than a gap: no
 * file left the machine, so the table that says which files left has nothing to say. Writing a row
 * anyway would put this service's own workspace path in a column meaning a vendor's handle.
 *
 * **The instant is handed in.** One upload has one instant, shared by every row it writes, and a
 * test states it rather than mocking global time - the same rule `AiModelCallRecorder` and
 * `RequestTimestampWindowInspector` already hold.
 */
export default class AiRunMediaProviderUploader {
  /**
   * Constructor.
   *
   * @param {AiRunMediaProviderUploaderParams} params - Parameters.
   */
  constructor ({
    providerUploadedFileRecorder,
  }) {
    this.providerUploadedFileRecorder = providerUploadedFileRecorder
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunMediaProviderUploader ? X : never} T, X
   * @param {AiRunMediaProviderUploaderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    providerUploadedFileRecorder = this.createProviderUploadedFileRecorder(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        providerUploadedFileRecorder,
      })
    )
  }

  /**
   * Create the writer recording what left the machine.
   *
   * @returns {ProviderUploadedFileRecorder} Recorder.
   */
  static createProviderUploadedFileRecorder () {
    return ProviderUploadedFileRecorder.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunMediaProviderUploader} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunMediaProviderUploader} */ (this.constructor)
  }

  /**
   * Hand the run's readable media to the provider, and record what left.
   *
   * @param {UploadAiRunMediaParams} params - Parameters.
   * @returns {Promise<Array<Record<string, *>>>} The files as the request should carry them.
   * @public
   */
  async uploadAiRunMedia ({
    aiModelProcessor,
    aiProviderId,
    readableMedia,
    uploadedAt,
  }) {
    const fileUrls = this.buildAttachedFiles({
      readableMedia,
    })

    const attachedFiles = await aiModelProcessor.prepareAttachedFiles({
      fileUrls,
    })

    await this.saveProviderUploadedFiles({
      attachedFiles,
      aiProviderId,
      uploadedAt,
    })

    return attachedFiles
  }

  /**
   * Build the files a request attaches, out of the media the run managed to fetch.
   *
   * The medium's own row id travels as the file's `id`, which is what pairs a file the driver hands
   * back to the row its egress is recorded against. The media key is deliberately not used for it:
   * the key is the caller's own string and this is a join between two of this service's rows.
   *
   * @param {{
   *   readableMedia: Array<import('./AiRunMediaCollector.js').AiRunMediumOutcome>
   * }} params - Parameters.
   * @returns {Array<Record<string, *>>} The files.
   * @public
   */
  buildAttachedFiles ({
    readableMedia,
  }) {
    return readableMedia.map(it =>
      this.buildAttachedFile({
        mediumOutcome: it,
      })
    )
  }

  /**
   * Build the file one fetched medium is attached as.
   *
   * @param {{
   *   mediumOutcome: import('./AiRunMediaCollector.js').AiRunMediumOutcome
   * }} params - Parameters.
   * @returns {Record<string, *>} The file.
   * @public
   */
  buildAttachedFile ({
    mediumOutcome,
  }) {
    const {
      aiRunMediaId,
      filePath,
      mimeType,
    } = mediumOutcome

    return {
      id: aiRunMediaId,
      fileUrl: filePath,
      fileType: mimeType,
    }
  }

  /**
   * Save the record of every file that actually left the machine.
   *
   * @param {{
   *   attachedFiles: Array<Record<string, *>>
   *   aiProviderId: number
   *   uploadedAt: Date
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The egress records that were written.
   * @public
   */
  async saveProviderUploadedFiles ({
    attachedFiles,
    aiProviderId,
    uploadedAt,
  }) {
    const uploadedFiles = this.extractUploadedFiles({
      attachedFiles,
    })

    return Promise.all(
      uploadedFiles.map(it =>
        this.providerUploadedFileRecorder.saveProviderUploadedFile({
          aiRunMediaId: it.id,
          aiProviderId,
          providerFileName: it.providerFileName,
          uploadedAt,
          expiresAt: null,
        })
      )
    )
  }

  /**
   * Extract the files the driver says it uploaded.
   *
   * @param {{
   *   attachedFiles: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {Array<Record<string, *>>} The files that left the machine.
   * @public
   */
  extractUploadedFiles ({
    attachedFiles,
  }) {
    return attachedFiles.filter(it =>
      this.hasLeftTheMachine({
        attachedFile: it,
      })
    )
  }

  /**
   * Check whether one attached file was sent somewhere.
   *
   * @param {{
   *   attachedFile: Record<string, *>
   * }} params - Parameters.
   * @returns {boolean} Whether the driver named it at the provider.
   * @public
   */
  hasLeftTheMachine ({
    attachedFile,
  }) {
    if (typeof attachedFile?.providerFileName !== 'string') {
      return false
    }

    return attachedFile.providerFileName !== ''
  }
}

/**
 * @typedef {{
 *   providerUploadedFileRecorder: ProviderUploadedFileRecorder
 * }} AiRunMediaProviderUploaderParams
 */

/**
 * @typedef {Partial<AiRunMediaProviderUploaderParams>} AiRunMediaProviderUploaderFactoryParams
 */

/**
 * @typedef {{
 *   aiModelProcessor: *
 *   aiProviderId: number
 *   readableMedia: Array<import('./AiRunMediaCollector.js').AiRunMediumOutcome>
 *   uploadedAt: Date
 * }} UploadAiRunMediaParams
 */
