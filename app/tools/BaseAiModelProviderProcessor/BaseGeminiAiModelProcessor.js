import BaseAiModelProcessor from '../BaseAiModelProcessor.js'
import AiModelResponse from '../AiModelResponse.js'

import GeminiMessagePayloadGenerator from '../AiPayloadGenerator/GeminiMessagePayloadGenerator.js'

import GeminiApiClient from '../../geminiClient/GeminiApiClient.js'
import SendMessageToGeminiCapsule from '../../geminiClient/SendMessageToGeminiCapsule.js'
import UploadFileToGeminiCapsule from '../../geminiClient/UploadFileToGeminiCapsule.js'

import {
  env,
} from '../../globals/_.js'

const MISSING_API_KEY_MESSAGE = 'refused to call Gemini with no API key'
const UNKNOWN_AI_MODEL_MESSAGE = 'refused a model name the catalog does not carry'
const FAILED_UPLOAD_MESSAGE = 'failed to hand a file to Gemini'
const UNNAMED_UPLOAD_MESSAGE = 'refused an upload the provider named nothing'

/**
 * Everything the Gemini drivers share: the client, the payload, the upload, the answer.
 *
 * **It lives outside `app/tools/AiModelProcessor/` deliberately.** That directory is the registry -
 * `BulkAiModelProcessorsLoader` imports every file in it, instantiates whatever derives from
 * `BaseAiModelProcessor` and asks each one for the model name it claims. An abstract base has no
 * model name to claim, so putting it there would stop start-up naming this class. The same rule
 * keeps `app/jobs/` bases out of the folder their workers are discovered from.
 *
 * **A concrete driver below this adds nothing but `#get:aiModel`.** Which vendor model is called
 * and what ceiling its payload is built against are `ai_models` and `ai_model_capabilities` rows,
 * read at call time. Adding a Gemini model is one file naming it plus master rows - never an edit
 * here, and never an edit to anything that calls a driver.
 *
 * **Nothing is read and nothing is built until a request has resolved to this driver by name.**
 * `.create()` runs at start-up, for every processor in the registry, on every installation - a
 * keyless one included. So it takes no argument, touches no environment and builds no SDK instance;
 * what it holds is the client *class*, and the key is read inside the call. A default installation
 * therefore reads no Gemini key and opens no Gemini connection, which is §17's first use case, and
 * it holds because the stub is the seeded default and nothing resolves this driver unless a model
 * is asked for by name.
 *
 * **A tool call is handed back, never carried out.** The reference this was ported from runs a
 * function-call loop: it dispatches each call through a tool-processor registry, appends the result
 * to the conversation and asks the model again. This service has no such registry and wants none -
 * `AssetMediaReadingFetcher` turns `isAutoHandleFunctionCall` off and says why in as many words:
 * the tool call *is* the answer, and a driver that executed it would hand back whatever it made of
 * the call rather than the call itself. So the flag is accepted for the contract's sake and this
 * driver never loops; the calls travel out through `AiModelResponse#extractFunctionCalls()`.
 *
 * **There is no streaming member.** A run is asynchronous and its result is posted back on a
 * callback, so nobody waits on a token at a time. `#sendStreamRequestToAi()` is therefore not
 * overridden and the abstract one above raises, naming this class - which is the honest answer to
 * a caller that asked for something this service does not do.
 *
 * @extends {BaseAiModelProcessor}
 */
export default class BaseGeminiAiModelProcessor extends BaseAiModelProcessor {
  /**
   * Constructor.
   *
   * @param {BaseGeminiAiModelProcessorParams} params - Parameters.
   */
  constructor ({
    geminiApiClientCtor,
  }) {
    super()

    this.geminiApiClientCtor = geminiApiClientCtor
  }

  /**
   * Factory method.
   *
   * Answers with no argument at all, because the directory scan that discovers a processor has none
   * to give it. What it stores is a class, not a connection: building the client here would read a
   * key at start-up on every installation, keyless ones included.
   *
   * @template {X extends typeof BaseGeminiAiModelProcessor ? X : never} T, X
   * @override
   * @param {BaseGeminiAiModelProcessorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    geminiApiClientCtor = GeminiApiClient,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        geminiApiClientCtor,
      })
    )
  }

  /**
   * get: the payload generator class.
   *
   * @returns {typeof GeminiMessagePayloadGenerator} The class.
   */
  static get GeminiMessagePayloadGeneratorCtor () {
    return GeminiMessagePayloadGenerator
  }

  /**
   * get: the capsule a model answer is read through.
   *
   * @returns {typeof SendMessageToGeminiCapsule} The class.
   */
  static get SendMessageToGeminiCapsuleCtor () {
    return SendMessageToGeminiCapsule
  }

  /**
   * get: the capsule an upload answer is read through.
   *
   * @returns {typeof UploadFileToGeminiCapsule} The class.
   */
  static get UploadFileToGeminiCapsuleCtor () {
    return UploadFileToGeminiCapsule
  }

  /**
   * get: the canonical response every driver answers in.
   *
   * @returns {typeof AiModelResponse} The class.
   */
  static get AiModelResponseCtor () {
    return AiModelResponse
  }

  /**
   * get: the environment the key is read from.
   *
   * Reached through a getter so that reading it is a call a test can watch, and so that no module
   * in this file touches the environment as it loads.
   *
   * @returns {*} The environment facade.
   */
  static get environment () {
    return env
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof BaseGeminiAiModelProcessor} The class.
   */
  get Ctor () {
    return /** @type {typeof BaseGeminiAiModelProcessor} */ (this.constructor)
  }

  /**
   * Send one request to the model and answer with the normalized response.
   *
   * The files arrive already handed over: this service uploads them in its media step, through
   * `#prepareAttachedFiles()` called by `AiRunMediaProviderUploader`, and what reaches here carries
   * the uri the vendor gave each one. Uploading again here - which is what the reference does -
   * would hand every file over twice and write the egress record twice.
   *
   * @override
   * @param {import('../BaseAiModelProcessor.js').SendRequestToAiParams} params - Parameters.
   * @returns {Promise<AiModelResponse>} The normalized response.
   * @throws {Error} When no key is configured, or the catalog carries no row for this driver.
   * @public
   */
  async sendRequestToAi ({
    aiAgent,
    instruction,
    documents,
    fileUrls,
    historyMessages = [],
    tools = [],
    toolChoices = [],
    isAutoHandleFunctionCall = true,
    extraToolOptions = {},
  }) {
    const aiModel = await this.findAiModelByName({
      aiModelName: this.aiModel,
    })

    if (!aiModel) {
      throw new Error(`${this.Ctor.name}#sendRequestToAi() ${UNKNOWN_AI_MODEL_MESSAGE}: ${this.aiModel}`)
    }

    const payloadGenerator = this.createGeminiMessagePayloadGenerator({
      aiModel,
      instruction,
      documents,
      fileUrls,
      historyMessages,
      tools,
      toolChoices,
    })

    const payload = payloadGenerator.generateGeminiMessagePayload()

    const aiResponseCapsule = await this.sendMessageToGemini({
      payload,
    })

    return this.createAiModelResponse({
      aiResponseCapsule,
    })
  }

  /**
   * Create the generator building this call's request.
   *
   * @param {CreateGeminiMessagePayloadGeneratorParams} params - Parameters.
   * @returns {GeminiMessagePayloadGenerator} The generator.
   * @public
   */
  createGeminiMessagePayloadGenerator ({
    aiModel,
    instruction,
    documents,
    fileUrls,
    historyMessages,
    tools,
    toolChoices,
  }) {
    return this.Ctor.GeminiMessagePayloadGeneratorCtor.create({
      targetModelName: aiModel.targetModelName,
      maxOutputTokens: aiModel.AiModelCapability.maxOutputToken,
      instruction,
      documents,
      fileUrls,
      historyMessages,
      tools,
      toolChoices,
    })
  }

  /**
   * Send one built request, and answer with the capsule whichever way it went.
   *
   * A failure is answered as a capsule rather than raised, because a driver hands back one shape
   * and the caller asks `#hasError()`. A raise here would make every caller of every driver wrap
   * the call in a `try`, which is the branch on the provider that this layer exists to remove.
   *
   * @param {{
   *   payload: import('../AiPayloadGenerator/GeminiMessagePayloadGenerator.js').GeminiMessagePayload
   * }} params - Parameters.
   * @returns {Promise<SendMessageToGeminiCapsule>} The capsule.
   * @throws {Error} When no key is configured.
   * @public
   */
  async sendMessageToGemini ({
    payload,
  }) {
    const geminiApiClient = this.createGeminiApiClient()

    try {
      const response = await geminiApiClient.sendMessageToGemini(payload)

      return this.Ctor.SendMessageToGeminiCapsuleCtor.createWithResponse({
        response,
      })
    } catch (error) {
      return this.Ctor.SendMessageToGeminiCapsuleCtor.createWithError({
        error,
      })
    }
  }

  /**
   * Create the client this call speaks to Google through.
   *
   * The key is read here and nowhere else, which is the moment a request has already resolved to
   * this driver by name. A missing key raises rather than calling with none: an unauthenticated
   * call would come back as an ordinary provider failure, and an operator reading that would go
   * looking at Google for a fault that is in this machine's configuration.
   *
   * @returns {GeminiApiClient} The client.
   * @throws {Error} When no key is configured.
   * @public
   */
  createGeminiApiClient () {
    const apiKey = this.extractApiKey()

    if (!apiKey) {
      throw new Error(`${this.Ctor.name}#createGeminiApiClient() ${MISSING_API_KEY_MESSAGE}: model ${this.aiModel}`)
    }

    return this.geminiApiClientCtor.createWithApiKey({
      apiKey,
    })
  }

  /**
   * Extract the key from the environment.
   *
   * @returns {string | null} The key, or null when none is configured.
   * @public
   */
  extractApiKey () {
    return this.Ctor.environment.GEMINI_API_KEY
      ?? null
  }

  /**
   * Create the normalized response wrapping a capsule.
   *
   * @param {{
   *   aiResponseCapsule: *
   * }} params - Parameters.
   * @returns {AiModelResponse} The normalized response.
   * @public
   */
  createAiModelResponse ({
    aiResponseCapsule,
  }) {
    return this.Ctor.AiModelResponseCtor.create({
      aiResponseCapsule,
    })
  }

  /**
   * Hand every attached file to the Files API, and answer them carrying what the vendor called
   * each one.
   *
   * **What leaves the machine is the copy in the run's workspace.** `fileUrl` on an attached file
   * is a path on this machine - `AiRunMediaProviderUploader` builds it from the file this service
   * fetched under its own allow-list - so a provider is never pointed back at a client's storage
   * and a URL a caller wrote never travels outward.
   *
   * **Three facts come back on each file, and all three are the vendor's own.** `providerFileName`
   * is the Files API handle, which is what `provider_uploaded_files.provider_file_name` carries and
   * what a later delete call names; `providerFileUri` is what the request points a file part at;
   * `providerFileExpiresAt` is when the vendor says it will delete its copy. None of the three is
   * derived, defaulted or guessed - the retention job that later asks Google to delete a copy
   * decides when to ask by reading the second of them, and a value invented here would make that
   * job act on a date nobody can check.
   *
   * **The egress row is written by the caller, not here.** `AiRunMediaProviderUploader` writes one
   * per file this answers with a `providerFileName`, and it is the only place that does: it is what
   * holds the provider id and the single instant every row of one upload shares, neither of which a
   * driver is given. Writing a row here as well would record every file's departure twice.
   *
   * **A failed upload raises.** The alternative - dropping the file and carrying on - would have
   * the model read fewer photographs than the run collected, and answer a judgment about an asset
   * from evidence nobody was told was missing. The media step has one failure channel and this
   * belongs in it.
   *
   * @override
   * @param {{
   *   fileUrls: Array<Record<string, *>>
   * }} params - Parameters.
   * @returns {Promise<Array<Record<string, *>>>} The files as the request should carry them.
   * @throws {Error} When no key is configured, or an upload failed or came back unnamed.
   * @public
   */
  async prepareAttachedFiles ({
    fileUrls,
  }) {
    if (fileUrls.length === 0) {
      return []
    }

    const geminiApiClient = this.createGeminiApiClient()

    return fileUrls.reduce(
      async (preparedFilesPromise, attachedFile) => {
        const preparedFiles = await preparedFilesPromise

        const preparedFile = await this.prepareAttachedFile({
          attachedFile,
          geminiApiClient,
        })

        return [
          ...preparedFiles,
          preparedFile,
        ]
      },
      Promise.resolve([])
    )
  }

  /**
   * Hand one attached file over, and answer it carrying what the vendor called it.
   *
   * @param {{
   *   attachedFile: Record<string, *>
   *   geminiApiClient: GeminiApiClient
   * }} params - Parameters.
   * @returns {Promise<Record<string, *>>} The file as the request should carry it.
   * @throws {Error} When the upload failed or came back unnamed.
   * @public
   */
  async prepareAttachedFile ({
    attachedFile,
    geminiApiClient,
  }) {
    const uploadCapsule = await this.uploadAttachedFile({
      attachedFile,
      geminiApiClient,
    })

    if (uploadCapsule.hasError()) {
      throw new Error(`${this.Ctor.name}#prepareAttachedFile() ${FAILED_UPLOAD_MESSAGE}: ${uploadCapsule.extractErrorMessage()}`)
    }

    const providerFileName = uploadCapsule.extractUploadedFileName()
    const providerFileUri = uploadCapsule.extractUploadedFileUri()

    if (!providerFileName) {
      throw new Error(`${this.Ctor.name}#prepareAttachedFile() ${UNNAMED_UPLOAD_MESSAGE}: ${attachedFile.fileUrl}`)
    }

    const providerFileExpiresAt = uploadCapsule.extractUploadedFileExpirationTime()

    return {
      ...attachedFile,
      providerFileName,
      providerFileUri,
      providerFileExpiresAt,
    }
  }

  /**
   * Hand one file to the Files API, and answer with the capsule whichever way it went.
   *
   * @param {{
   *   attachedFile: Record<string, *>
   *   geminiApiClient: GeminiApiClient
   * }} params - Parameters.
   * @returns {Promise<UploadFileToGeminiCapsule>} The capsule.
   * @public
   */
  async uploadAttachedFile ({
    attachedFile,
    geminiApiClient,
  }) {
    try {
      const response = await geminiApiClient.uploadFileToGemini({
        filePath: attachedFile.fileUrl,
        displayName: attachedFile.fileName
          ?? null,
        mimeType: attachedFile.fileType,
      })

      return this.Ctor.UploadFileToGeminiCapsuleCtor.createWithResponse({
        response,
      })
    } catch (error) {
      return this.Ctor.UploadFileToGeminiCapsuleCtor.createWithError({
        error,
      })
    }
  }
}

/**
 * @typedef {{
 *   geminiApiClientCtor: typeof GeminiApiClient
 * }} BaseGeminiAiModelProcessorParams
 */

/**
 * @typedef {Partial<BaseGeminiAiModelProcessorParams>} BaseGeminiAiModelProcessorFactoryParams
 */

/**
 * @typedef {{
 *   aiModel: *
 *   instruction: string
 *   documents: Array<Record<string, *>>
 *   fileUrls: Array<Record<string, *>>
 *   historyMessages: Array<Record<string, *>>
 *   tools: Array<Record<string, *>>
 *   toolChoices: Array<Record<string, *>>
 * }} CreateGeminiMessagePayloadGeneratorParams
 */
