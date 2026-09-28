/*
 * The HTTP status the Files API answers when the handle names no file it holds.
 *
 * **This one number decides whether a stamp is written**, so it is worth being plain about what it
 * is and what it is not. `ApiError` in `@google/genai` declares `status: number` and carries the
 * HTTP status of the failed call, which is read from the package's own type declaration. That a
 * handle the vendor has already expired comes back as 404 rather than as some other status is the
 * documented meaning of NOT_FOUND and is what this reads — but it has not been observed against
 * the live service from this repository, and a reader should treat it as the one assumption here.
 *
 * **Nothing else is treated as "gone", and the exclusion is the point.** 403 in particular is left
 * out: a vendor answers it both for a file that is not yours and for a key that is not valid, and
 * a key that stopped working would otherwise stamp every row of every batch as purged in a single
 * night. A status this service cannot tell apart is a failure, and a failure leaves the row alone.
 */
const GONE_FILE_HTTP_STATUS = 404

/**
 * What the Files API answered when this service asked it to delete one file.
 *
 * **Why a failure is read here rather than at the call.** The one question the purge needs settled
 * is not "did the call succeed" but "is the copy gone", and those are different questions with the
 * same answer in two different cases: the vendor deleted it now, or the vendor had already dropped
 * it and says it knows no such handle. Both mean the copy no longer exists, which is what
 * `provider_uploaded_files.provider_purged_at` records. Every other failure — a connection that
 * did not open, a key that stopped working, a quota, a fault at the far end — means the copy's
 * state is unknown, and the row has to be left for the next sweep.
 *
 * **Why that judgement lives in a Gemini class.** It rests on this vendor's error shape and on
 * this vendor's status codes, and no layer above a driver could make it without naming a vendor.
 * `BaseAiModelProcessor#deleteProviderUploadedFile()` states the contract in terms of raising and
 * not raising precisely so that each driver can answer it from its own vendor's vocabulary.
 *
 * **It has no member answering what was deleted**, and that is deliberate rather than an omission.
 * `DeleteFileResponse` carries the raw HTTP response and nothing identifying, so there is nothing
 * to read; and a class serving a retention job should not be the place a file's name is lifted back
 * out of a vendor's answer.
 */
export default class DeleteFileFromGeminiCapsule {
  /**
   * Constructor.
   *
   * @param {DeleteFileFromGeminiCapsuleParams} params - Parameters.
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
   * @template {X extends typeof DeleteFileFromGeminiCapsule ? X : never} T, X
   * @param {DeleteFileFromGeminiCapsuleParams} params - Parameters for the factory method.
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
   * Factory method for a delete the vendor carried out.
   *
   * @template {X extends typeof DeleteFileFromGeminiCapsule ? X : never} T, X
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
   * Factory method for a delete that raised.
   *
   * @template {X extends typeof DeleteFileFromGeminiCapsule ? X : never} T, X
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
   * get: the status the vendor answers when it holds no file under the handle.
   *
   * @returns {number} The HTTP status.
   */
  static get goneFileHttpStatus () {
    return GONE_FILE_HTTP_STATUS
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof DeleteFileFromGeminiCapsule} The class.
   */
  get Ctor () {
    return /** @type {typeof DeleteFileFromGeminiCapsule} */ (this.constructor)
  }

  /**
   * Check whether the delete failed.
   *
   * @returns {boolean} True when the delete raised.
   * @public
   */
  hasError () {
    return this.error !== null
  }

  /**
   * Check whether the provider no longer holds the file, however that came about.
   *
   * True for a delete the vendor carried out, and true for a vendor that answers that it knows no
   * such handle — the ordinary case for a file whose stated expiry has already passed, since the
   * vendor drops its own copy on its own clock and this service learns of it only by asking.
   *
   * False for every other failure, including one where the copy may well be gone: an answer this
   * service cannot tell apart from an unreachable vendor is not an answer it may stamp.
   *
   * @returns {boolean} True when the copy no longer exists at the provider.
   * @public
   */
  isFileGone () {
    if (!this.hasError()) {
      return true
    }

    return this.extractErrorHttpStatus() === this.Ctor.goneFileHttpStatus
  }

  /**
   * Extract the HTTP status the failure carries.
   *
   * @returns {number | null} The status, or null when the failure carries none.
   * @public
   */
  extractErrorHttpStatus () {
    return this.error?.status
      ?? null
  }

  /**
   * Extract the message of the failure the delete answered with.
   *
   * @returns {string | null} The failure message, or null when the delete did not raise.
   * @public
   */
  extractErrorMessage () {
    return this.error?.message
      ?? null
  }
}

/**
 * @typedef {{
 *   response: *
 *   error: (Error & { status?: number }) | null
 * }} DeleteFileFromGeminiCapsuleParams
 */
