/*
 * The field of the request body the media travel in, and the fields of one entry this class reads.
 *
 * `.hora/contracts/1.0.0/client-api.md` fixes them: `media[]` carries `mediaKey`,
 * `mediaCategoryName`, `url`, `mimeType` and `byteSize`. Only the first three are read here - the
 * other two are recorded on `ai_run_media` when the run is accepted, and reading them again from
 * the body would be a second answer to a question the row already answers.
 */
const DEFAULT_MEDIA_FIELD_NAME = 'media'
const MEDIA_KEY_FIELD_NAME = 'mediaKey'
const MEDIA_URL_FIELD_NAME = 'url'

/**
 * Extracts the media a request declared out of the body it was accepted with.
 *
 * **Why the URL is read rather than looked up.** `ai_run_media` has no `url` column, deliberately:
 * the contract carries the URL in the request's `media[]`, section 18 declares no such column, and
 * a column here would be a second home for the same fact. So the URL is read from
 * `ai_runs.request_body` at fetch time and never re-stored, and this is the class that reads it.
 * The row and the entry are paired by `media_key` - the caller's own id for the file, echoed back
 * and never interpreted, which is the only identifier the two sides share.
 *
 * **The body is text, and may be nothing.** `request_body` is `TEXT('medium')` and nullable, and it
 * is emptied by the retention purge thirty days after the run - so a run whose content has been
 * purged has media rows and no URLs, and asking for one answers null rather than faulting. A body
 * that is not valid JSON answers the same way: this class reads what is there and invents nothing.
 *
 * **It accepts the parsed body as well as the text.** The request path holds the body as an object
 * before it is ever stored, and a class that took only text would make that caller serialize what
 * it already had in order to read one field back out of it.
 *
 * **What is answered is a count and a URL, and never the whole entry.** The count is what the
 * twelve-file limit is checked against; the URL is what a fetch needs. Everything else about a
 * medium - its kind, its declared size, its media type - is on the row, checked against the row,
 * and is not read back out of the body by anything here.
 */
export default class AiRunMediaDescriptorExtractor {
  /**
   * Constructor.
   *
   * @param {AiRunMediaDescriptorExtractorParams} params - Parameters.
   */
  constructor ({
    mediaFieldName,
  }) {
    this.mediaFieldName = mediaFieldName
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunMediaDescriptorExtractor ? X : never} T, X
   * @param {AiRunMediaDescriptorExtractorFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    mediaFieldName = DEFAULT_MEDIA_FIELD_NAME,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        mediaFieldName,
      })
    )
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunMediaDescriptorExtractor} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunMediaDescriptorExtractor} */ (this.constructor)
  }

  /**
   * Extract the media entries a request body declares.
   *
   * An entry that is not an object at all is dropped rather than counted, because it declares no
   * medium - and counting it would refuse a request for carrying thirteen files when it carried
   * twelve and a stray value.
   *
   * @param {{
   *   requestBody: *
   * }} params - Parameters.
   * @returns {Array<Record<string, *>>} The entries, empty when the body declares none.
   * @public
   */
  extractMediaDescriptors ({
    requestBody,
  }) {
    const parsedRequestBody = this.buildParsedRequestBody({
      requestBody,
    })

    if (parsedRequestBody === null) {
      return []
    }

    const declaredMedia = parsedRequestBody[this.mediaFieldName]

    if (!Array.isArray(declaredMedia)) {
      return []
    }

    return declaredMedia.filter(it => this.isReadableObject({
      value: it,
    }))
  }

  /**
   * Extract the URL one medium is fetched from.
   *
   * @param {{
   *   requestBody: *
   *   mediaKey: *
   * }} params - Parameters.
   * @returns {string | null} The URL, or null when the body declares none for that key.
   * @public
   */
  extractMediaUrl ({
    requestBody,
    mediaKey,
  }) {
    const descriptor = this.extractMediaDescriptor({
      requestBody,
      mediaKey,
    })

    if (descriptor === null) {
      return null
    }

    const url = descriptor[MEDIA_URL_FIELD_NAME]

    if (typeof url !== 'string') {
      return null
    }

    return url
  }

  /**
   * Extract the entry a media key names.
   *
   * @param {{
   *   requestBody: *
   *   mediaKey: *
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The entry, or null when the body declares none for that
   * key.
   * @public
   */
  extractMediaDescriptor ({
    requestBody,
    mediaKey,
  }) {
    if (typeof mediaKey !== 'string') {
      return null
    }

    return this.extractMediaDescriptors({
      requestBody,
    })
      .find(it => it[MEDIA_KEY_FIELD_NAME] === mediaKey)
      ?? null
  }

  /**
   * Check whether a value is an object something can be read off.
   *
   * It is asked of a media entry and of the body itself, because the two questions are one: an
   * array, a string and null all answer false, and what passes is something with named fields.
   *
   * @param {{
   *   value: *
   * }} params - Parameters.
   * @returns {boolean} Whether fields can be read off it.
   * @public
   */
  isReadableObject ({
    value,
  }) {
    if (!value) {
      return false
    }

    if (typeof value !== 'object') {
      return false
    }

    return !Array.isArray(value)
  }

  /**
   * Build the parsed form of a request body.
   *
   * @param {{
   *   requestBody: *
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The parsed body, or null when there is none to read.
   * @public
   */
  buildParsedRequestBody ({
    requestBody,
  }) {
    if (typeof requestBody === 'string') {
      return this.buildParsedRequestBodyText({
        requestBodyText: requestBody,
      })
    }

    if (
      !this.isReadableObject({
        value: requestBody,
      })
    ) {
      return null
    }

    return requestBody
  }

  /**
   * Build the parsed form of a request body that arrived as the text it is stored as.
   *
   * @param {{
   *   requestBodyText: string
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The parsed body, or null when the text is not a body.
   * @public
   */
  buildParsedRequestBodyText ({
    requestBodyText,
  }) {
    try {
      const parsedRequestBody = JSON.parse(requestBodyText)

      return this.isReadableObject({
        value: parsedRequestBody,
      })
        ? parsedRequestBody
        : null
    } catch (error) {
      return null
    }
  }
}

/**
 * @typedef {{
 *   mediaFieldName: string
 * }} AiRunMediaDescriptorExtractorParams
 */

/**
 * @typedef {Partial<AiRunMediaDescriptorExtractorParams>} AiRunMediaDescriptorExtractorFactoryParams
 */
