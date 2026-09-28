import {
  GoogleGenAI,
} from '@google/genai'

/**
 * The one place an outbound connection to Google is opened.
 *
 * **Why the vendor SDK is wrapped rather than called where it is needed.** Section 17 holds that
 * only the client modules open an outbound connection, so the driver above this never names
 * `GoogleGenAI` and never holds a key. What it holds is this class, and what this class holds is
 * one configured SDK instance - which is also what lets a test hand the driver a client that
 * answers without a network.
 *
 * **Why the key arrives on the factory rather than being read here.** A default installation runs
 * the stub driver and must read no key at all, boot included. This class is therefore never built
 * unless a request has already resolved to a Gemini model by name, and the value it is built with
 * is read at that moment by the driver, from `app/globals/_.js`. Nothing at module scope touches
 * the environment.
 *
 * **Why there is no streaming member.** This service never streams: a run is asynchronous and its
 * result is posted back on a callback, so there is no reader waiting on a token at a time. The
 * vendor offers `generateContentStream()` and it is deliberately not wrapped - an unused member
 * calling a vendor is a path nothing exercises.
 */
export default class GeminiApiClient {
  /**
   * Constructor.
   *
   * @param {GeminiApiClientParams} params - Parameters.
   */
  constructor ({
    geminiClient,
  }) {
    this.geminiClient = geminiClient
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof GeminiApiClient ? X : never} T, X
   * @param {GeminiApiClientParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    geminiClient,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        geminiClient,
      })
    )
  }

  /**
   * Factory method building the vendor SDK instance from a key.
   *
   * @template {X extends typeof GeminiApiClient ? X : never} T, X
   * @param {{
   *   apiKey: string
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static createWithApiKey ({
    apiKey,
  }) {
    const geminiClient = this.createGoogleGenAi({
      apiKey,
    })

    return this.create({
      geminiClient,
    })
  }

  /**
   * get: the vendor SDK class, reached through a getter so a test may stand in for it.
   *
   * @returns {typeof GoogleGenAI} The class.
   */
  static get GoogleGenAiCtor () {
    return GoogleGenAI
  }

  /**
   * Create the vendor SDK instance.
   *
   * @param {{
   *   apiKey: string
   * }} params - Parameters.
   * @returns {GoogleGenAI} The SDK instance.
   */
  static createGoogleGenAi ({
    apiKey,
  }) {
    return new this.GoogleGenAiCtor({
      apiKey,
    })
  }

  /**
   * Send one request to the model and answer with the vendor's own response.
   *
   * Answers whatever the SDK answers, untouched. Reading it is the capsule's, so the one member
   * that talks to Google does nothing but talk to Google.
   *
   * @param {SendMessageToGeminiParams} params - Parameters.
   * @returns {Promise<import('@google/genai').GenerateContentResponse>} The vendor response.
   * @public
   */
  async sendMessageToGemini ({
    model,
    contents,
    maxOutputTokens,
    tools,
    toolConfig,
    abortSignal = null,
  }) {
    const config = this.buildGenerateContentConfig({
      maxOutputTokens,
      tools,
      toolConfig,
      abortSignal,
    })

    return this.geminiClient.models.generateContent({
      model,
      contents,
      config,
    })
  }

  /**
   * Build the config one request is sent under.
   *
   * @param {BuildGenerateContentConfigParams} params - Parameters.
   * @returns {Record<string, *>} The config.
   * @public
   */
  buildGenerateContentConfig ({
    maxOutputTokens,
    tools,
    toolConfig,
    abortSignal = null,
  }) {
    const toolEntries = this.buildToolEntries({
      tools,
      toolConfig,
    })
    const abortSignalEntry = this.buildAbortSignalEntry({
      abortSignal,
    })

    return {
      maxOutputTokens,
      ...toolEntries,
      ...abortSignalEntry,
    }
  }

  /**
   * Build the tool half of a request config.
   *
   * A call offering no tool carries neither key at all. Declaring an empty tool set is not the
   * same thing as declaring none, and the vendor reads the two differently - so the absence is
   * expressed by the keys not being there rather than by a null sitting in them.
   *
   * @param {{
   *   tools: Array<Record<string, *>> | null
   *   toolConfig: Record<string, *> | null
   * }} params - Parameters.
   * @returns {Record<string, *>} The entries, empty when no tool is offered.
   * @public
   */
  buildToolEntries ({
    tools,
    toolConfig,
  }) {
    if (tools === null) {
      return {}
    }

    return {
      tools,
      toolConfig,
    }
  }

  /**
   * Build the abort half of a request config.
   *
   * A call carrying no signal carries no key at all, for the reason the tool entries above carry
   * none: `abortSignal` is declared optional on the vendor's config, and a null sitting in an
   * optional field is a value the vendor has to decide what to do with rather than an absence.
   *
   * **What the vendor does with the signal, in its own words.** Its declaration of this field
   * reads: "AbortSignal is a client-only operation. Using it to cancel an operation will not
   * cancel the request in the service. You will still be charged usage for any applicable
   * operations." So what this key buys is that this service stops waiting — not that the work
   * stops and not that the charge stops. A call abandoned this way reports no usage figure, so
   * the `ai_model_calls` row it produces carries zero tokens against a charge that was really
   * made, and an operator reconciling an invoice against those counts will find the difference
   * there rather than in a fault.
   *
   * @param {{
   *   abortSignal: AbortSignal | null
   * }} params - Parameters.
   * @returns {Record<string, *>} The entry, empty when the caller handed no signal.
   * @public
   */
  buildAbortSignalEntry ({
    abortSignal,
  }) {
    if (!abortSignal) {
      return {}
    }

    return {
      abortSignal,
    }
  }

  /**
   * Hand one file to the Files API and answer with the vendor's own record of it.
   *
   * The file is named by a path on this machine, which is what the SDK's `file` argument takes
   * besides a `Blob`. That is deliberate rather than convenient: what this service hands over is
   * the copy it fetched into the run's workspace under its own allow-list, never a URL a caller
   * wrote, so no provider is ever pointed back at a client's storage.
   *
   * @param {UploadFileToGeminiParams} params - Parameters.
   * @returns {Promise<import('@google/genai').File>} The vendor record of the uploaded file.
   * @public
   */
  async uploadFileToGemini ({
    filePath,
    displayName,
    mimeType,
  }) {
    return this.geminiClient.files.upload({
      file: filePath,
      config: {
        mimeType,
        displayName,
      },
    })
  }

  /**
   * Ask the Files API to delete one file, and answer with the vendor's own response.
   *
   * **The file is named by the handle the upload answered with** — `files/<something>`, which is
   * what `provider_uploaded_files.provider_file_name` carries. Not the uri: that is what a
   * generate-content request points a file part at, and the two are separate members on the upload
   * capsule for exactly this reason.
   *
   * **This member is how a deletion becomes this service's.** Google removes its own copy after
   * about forty-eight hours whether or not anybody asks, so what calling it buys is not that the
   * copy eventually goes — it is that it goes on a schedule this service chose, at an instant this
   * service can record. A vendor that quietly changed that window, or a file it kept longer than it
   * said, is reached by this call and by nothing else.
   *
   * Answers whatever the SDK answers, untouched; reading it is the capsule's, so the one member
   * that talks to Google does nothing but talk to Google. A file the vendor no longer holds raises
   * here rather than answering — the SDK's `ApiError` carries the HTTP status, and
   * `DeleteFileFromGeminiCapsule` is what reads it.
   *
   * @param {{
   *   providerFileName: string
   * }} params - Parameters.
   * @returns {Promise<import('@google/genai').DeleteFileResponse>} The vendor response.
   * @public
   */
  async deleteFileFromGemini ({
    providerFileName,
  }) {
    return this.geminiClient.files.delete({
      name: providerFileName,
    })
  }
}

/**
 * @typedef {{
 *   geminiClient: import('@google/genai').GoogleGenAI
 * }} GeminiApiClientParams
 */

/**
 * @typedef {{
 *   model: string
 *   contents: Array<Record<string, *>>
 *   maxOutputTokens: number
 *   tools: Array<Record<string, *>> | null
 *   toolConfig: Record<string, *> | null
 *   abortSignal?: AbortSignal | null
 * }} SendMessageToGeminiParams
 */

/**
 * @typedef {{
 *   maxOutputTokens: number
 *   tools: Array<Record<string, *>> | null
 *   toolConfig: Record<string, *> | null
 *   abortSignal?: AbortSignal | null
 * }} BuildGenerateContentConfigParams
 */

/**
 * @typedef {{
 *   filePath: string
 *   displayName: string | null
 *   mimeType: string
 * }} UploadFileToGeminiParams
 */
