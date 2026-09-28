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
  }) {
    const config = this.buildGenerateContentConfig({
      maxOutputTokens,
      tools,
      toolConfig,
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
   * @param {{
   *   maxOutputTokens: number
   *   tools: Array<Record<string, *>> | null
   *   toolConfig: Record<string, *> | null
   * }} params - Parameters.
   * @returns {Record<string, *>} The config.
   * @public
   */
  buildGenerateContentConfig ({
    maxOutputTokens,
    tools,
    toolConfig,
  }) {
    const toolEntries = this.buildToolEntries({
      tools,
      toolConfig,
    })

    return {
      maxOutputTokens,
      ...toolEntries,
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
 * }} SendMessageToGeminiParams
 */

/**
 * @typedef {{
 *   filePath: string
 *   displayName: string | null
 *   mimeType: string
 * }} UploadFileToGeminiParams
 */
