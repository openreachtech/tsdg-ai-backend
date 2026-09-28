/**
 * What the Files API answered about one file this service handed over.
 *
 * **Every member answers what the vendor stated, or null.** Nothing here derives a value, defaults
 * one, or fills a gap. The egress record written from this is the answer to "which file left this
 * machine, to whom, and when" months after the run's content has been emptied, and the retention
 * job that later asks the provider to delete the copy decides when to ask by reading the expiry
 * this carries. A value invented here would make both of them state something nobody can check -
 * so an absent field is reported absent, and the caller decides what to do about it.
 *
 * **Why the name and the uri are separate members rather than one.** They are two different facts
 * and the record wants different ones. `name` is the handle the Files API itself uses - `files/xyz`
 * - which is what a later delete call names and what `provider_uploaded_files.provider_file_name`
 * is for. `uri` is what a generate-content request points a `fileData` part at. Collapsing them
 * would put whichever one happened to be chosen into a column meaning the other.
 *
 * **The expiry is a string here, not a `Date`.** The vendor states an RFC 3339 timestamp and this
 * hands it on as it came. Turning it into a `Date` is the recorder's, which already refuses a value
 * that is not an instant - parsing it twice would make this the second place a malformed timestamp
 * could be quietly turned into `Invalid Date`.
 */
export default class UploadFileToGeminiCapsule {
  /**
   * Constructor.
   *
   * @param {UploadFileToGeminiCapsuleParams} params - Parameters.
   */
  constructor ({
    response,
    error,
  }) {
    this.response = response
    this.error = error
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof UploadFileToGeminiCapsule ? X : never} T, X
   * @param {UploadFileToGeminiCapsuleParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    response,
    error,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        response,
        error,
      })
    )
  }

  /**
   * Factory method for an upload the vendor accepted.
   *
   * @template {X extends typeof UploadFileToGeminiCapsule ? X : never} T, X
   * @param {{
   *   response: *
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static createWithResponse ({
    response,
  }) {
    return this.create({
      response,
      error: null,
    })
  }

  /**
   * Factory method for an upload that raised.
   *
   * @template {X extends typeof UploadFileToGeminiCapsule ? X : never} T, X
   * @param {{
   *   error: Error
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static createWithError ({
    error,
  }) {
    return this.create({
      response: null,
      error,
    })
  }

  /**
   * Check whether the upload failed.
   *
   * @returns {boolean} True when the upload raised.
   * @public
   */
  hasError () {
    return this.error !== null
  }

  /**
   * Extract the message of the failure the upload answered with.
   *
   * @returns {string | null} The failure message, or null when the upload did not raise.
   * @public
   */
  extractErrorMessage () {
    return this.error?.message
      ?? null
  }

  /**
   * Extract the handle the Files API calls the file by.
   *
   * This is what `provider_uploaded_files.provider_file_name` carries, and what a later delete call
   * names.
   *
   * @returns {string | null} The handle, or null when the vendor stated none.
   * @public
   */
  extractUploadedFileName () {
    return this.response?.name
      ?? null
  }

  /**
   * Extract the uri a request points a file part at.
   *
   * @returns {string | null} The uri, or null when the vendor stated none.
   * @public
   */
  extractUploadedFileUri () {
    return this.response?.uri
      ?? null
  }

  /**
   * Extract the mime type the vendor recorded for the file.
   *
   * @returns {string | null} The mime type, or null when the vendor stated none.
   * @public
   */
  extractUploadedFileMimeType () {
    return this.response?.mimeType
      ?? null
  }

  /**
   * Extract when the vendor says it will delete the file.
   *
   * @returns {string | null} The RFC 3339 timestamp as the vendor stated it, or null where the
   * file is not scheduled to expire.
   * @public
   */
  extractUploadedFileExpirationTime () {
    return this.response?.expirationTime
      ?? null
  }

  /**
   * Extract when the vendor says it took the file.
   *
   * @returns {string | null} The RFC 3339 timestamp as the vendor stated it, or null when the
   * vendor stated none.
   * @public
   */
  extractUploadedFileCreateTime () {
    return this.response?.createTime
      ?? null
  }
}

/**
 * @typedef {{
 *   response: *
 *   error: Error | null
 * }} UploadFileToGeminiCapsuleParams
 */
