import BaseAiModelProcessor from '../BaseAiModelProcessor.js'
import AiModelResponse from '../AiModelResponse.js'

import GeminiMessagePayloadGenerator from '../AiPayloadGenerator/GeminiMessagePayloadGenerator.js'

import DeleteFileFromGeminiCapsule from '../../geminiClient/DeleteFileFromGeminiCapsule.js'
import SendMessageToGeminiCapsule from '../../geminiClient/SendMessageToGeminiCapsule.js'
import UploadFileToGeminiCapsule from '../../geminiClient/UploadFileToGeminiCapsule.js'

import {
  env,
} from '../../globals/_.js'

const MISSING_CREDENTIAL_MESSAGE = 'refused to call Gemini with neither a Vertex AI project nor an API key'
const UNKNOWN_AI_MODEL_MESSAGE = 'refused a model name the catalog does not carry'
const FAILED_UPLOAD_MESSAGE = 'failed to hand a file to Gemini'
const FAILED_DELETE_MESSAGE = 'could not establish that Gemini no longer holds a file'
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
    geminiApiClientCtor = null,
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
   * get: the capsule a delete answer is read through.
   *
   * @returns {typeof DeleteFileFromGeminiCapsule} The class.
   */
  static get DeleteFileFromGeminiCapsuleCtor () {
    return DeleteFileFromGeminiCapsule
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
   * **A run already told to stop is refused before anything is read, built or opened.** The guard
   * is the first statement rather than a check further down: a refusal after the catalog read
   * would have read a row for nobody, and a refusal after `#createGeminiApiClient()` would have
   * read the key and built an SDK instance for a call that was never going to be made. What the
   * run observes is the base's refusal capsule, which is the same object the keyless driver
   * refuses with.
   *
   * **A signal raised while the call is already in flight is a different story, and it is the
   * vendor's.** `abortSignal` travels into the request config, the SDK stops waiting, and
   * `#sendMessageToGemini()` answers a capsule carrying the vendor's own error — so the call is
   * recorded, with the zero token counts a dropped connection reports. Google is still doing the
   * work and still charging for it: its own declaration of `abortSignal` states that aborting is
   * a client-only operation, that it does not cancel the request in the service, and that the
   * usage is charged regardless. Nothing in this service can change that, and nothing in this
   * service should imply otherwise.
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
    abortSignal = null,
  }) {
    if (
      this.isAbortSignalRaised({
        abortSignal,
      })
    ) {
      return this.createAbortedAiModelResponse()
    }

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
      abortSignal,
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
   * **The signal travels beside the payload rather than inside it.** What the generator builds is
   * the message — the model, the turns, the ceiling, the tools — and how long this service is
   * willing to wait for an answer to it is not part of that message. Keeping them apart is also
   * what keeps the payload a value two identical requests share.
   *
   * **An abort lands in the `catch` and is recorded as a failed call**, which is correct: the
   * request did leave, and the provider is charging for work this service stopped waiting for.
   *
   * @param {{
   *   payload: import('../AiPayloadGenerator/GeminiMessagePayloadGenerator.js').GeminiMessagePayload
   *   abortSignal?: AbortSignal | null
   * }} params - Parameters.
   * @returns {Promise<SendMessageToGeminiCapsule>} The capsule.
   * @throws {Error} When no key is configured.
   * @public
   */
  async sendMessageToGemini ({
    payload,
    abortSignal = null,
  }) {
    const geminiApiClient = await this.createGeminiApiClient()

    try {
      const response = await geminiApiClient.sendMessageToGemini({
        ...payload,
        abortSignal,
      })

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
   * **Two ways in, and the configuration decides which — never a flag.** A deployment that states
   * a Vertex AI project and region is calling as itself, through the identity the platform already
   * gave the process, and holds no key at all. A deployment that states neither falls back to an
   * API key. Preferring Vertex where it is configured means the safer arrangement is the one that
   * wins by default, and the fallback is what has to be asked for.
   *
   * **Nothing is read before a request has resolved to this driver by name.** A default
   * installation answers on the stub, reaches none of this, and reads neither a project nor a key.
   *
   * **Configured with neither, this raises rather than calling with nothing.** An unauthenticated
   * call comes back as an ordinary provider failure, and an operator reading that would go looking
   * at Google for a fault that is in this machine's configuration.
   *
   * @returns {Promise<GeminiApiClient>} The client.
   * @throws {Error} When neither a Vertex AI project nor an API key is configured.
   * @public
   */
  async createGeminiApiClient () {
    const vertexAiClient = await this.createVertexAiGeminiApiClient()

    if (vertexAiClient) {
      return vertexAiClient
    }

    return this.createApiKeyGeminiApiClient()
  }

  /**
   * Create the client that authenticates as this process, or answer null when Vertex is not
   * configured.
   *
   * **Both values are required together**, because one without the other cannot address anything:
   * the SDK builds `https://<location>-aiplatform.googleapis.com` and asks it about a project. A
   * deployment that set only one of them has a half-finished configuration, and falling back to a
   * key would hide that rather than report it.
   *
   * @returns {Promise<GeminiApiClient | null>} The client, or null when Vertex is not configured.
   * @public
   */
  async createVertexAiGeminiApiClient () {
    const projectId = this.extractVertexAiProjectId()
    const location = this.extractVertexAiLocation()

    if (!projectId || !location) {
      return null
    }

    const geminiApiClientCtor = await this.resolveGeminiApiClientCtor()

    return geminiApiClientCtor.createWithVertexAi({
      projectId,
      location,
    })
  }

  /**
   * Create the client that authenticates with a key.
   *
   * @returns {Promise<GeminiApiClient>} The client.
   * @throws {Error} When no key is configured.
   * @public
   */
  async createApiKeyGeminiApiClient () {
    const apiKey = this.extractApiKey()

    if (!apiKey) {
      throw new Error(`${this.Ctor.name}#createGeminiApiClient() ${MISSING_CREDENTIAL_MESSAGE}: model ${this.aiModel}`)
    }

    const geminiApiClientCtor = await this.resolveGeminiApiClientCtor()

    return geminiApiClientCtor.createWithApiKey({
      apiKey,
    })
  }

  /**
   * Resolve the client class, loading the vendor SDK the first time one is actually wanted.
   *
   * **The import is deferred on purpose, and section 17's first use case is the reason.** The
   * concrete drivers sit in the directory `BulkAiModelProcessorsLoader` scans, and that scan
   * imports every file in it at boot and in every test run. Naming the client at module scope
   * would therefore pull the whole vendor SDK into a process that may never call the vendor — on
   * a machine with no key, answering on the stub, which is precisely the installation that
   * section says must load nothing of a vendor's. Deferred, the SDK is read once a request has
   * resolved to this model by name, and never otherwise.
   *
   * An injected class short-circuits it, so the seam a test uses costs no import at all.
   *
   * @returns {Promise<*>} The client class.
   * @public
   */
  async resolveGeminiApiClientCtor () {
    if (this.geminiApiClientCtor !== null) {
      return this.geminiApiClientCtor
    }

    const { default: GeminiApiClient } = await import('../../geminiClient/GeminiApiClient.js')

    return GeminiApiClient
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
   * Extract the Vertex AI project from the environment.
   *
   * @returns {string | null} The project id, or null when none is configured.
   * @public
   */
  extractVertexAiProjectId () {
    return this.Ctor.environment.VERTEX_AI_PROJECT_ID
      ?? null
  }

  /**
   * Extract the Vertex AI region from the environment.
   *
   * @returns {string | null} The region, or null when none is configured.
   * @public
   */
  extractVertexAiLocation () {
    return this.Ctor.environment.VERTEX_AI_LOCATION
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

    const geminiApiClient = await this.createGeminiApiClient()

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

    const providerFileExpiresAt = this.generateProviderFileExpiresAt({
      uploadCapsule,
    })

    return {
      ...attachedFile,
      providerFileName,
      providerFileUri,
      providerFileExpiresAt,
    }
  }

  /**
   * Generate the instant the vendor says it will delete its copy.
   *
   * **The vendor states an RFC 3339 string and the egress record takes an instant, so the crossing
   * happens here** — in the one class that knows this vendor's shape. `ProviderUploadedFileRecorder`
   * refuses anything that is not an instant, by name, which is how the mismatch was found: a real
   * upload succeeded, the string travelled, and the write that records the departure refused it.
   *
   * **A value that does not parse answers null rather than an invalid date.** The retention job
   * that later asks the vendor to delete a copy decides when to ask by reading this column, and a
   * column holding `Invalid Date` would be read as a date that has passed — so the job would ask
   * about a file the vendor may still be holding, and record that it had asked. Null says plainly
   * that the vendor stated no usable expiry, which is a fact the job can act on correctly.
   *
   * @param {{
   *   uploadCapsule: import('../../geminiClient/UploadFileToGeminiCapsule.js').default
   * }} params - Parameters.
   * @returns {Date | null} The instant, or null where the vendor stated none this service can read.
   * @public
   */
  generateProviderFileExpiresAt ({
    uploadCapsule,
  }) {
    const expirationTime = uploadCapsule.extractUploadedFileExpirationTime()

    if (expirationTime === null) {
      return null
    }

    const expiresAt = new Date(expirationTime)

    if (Number.isNaN(expiresAt.getTime())) {
      return null
    }

    return expiresAt
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

  /**
   * Ask the Files API to delete one file this service handed it, and answer once it is gone.
   *
   * **This is the member §19's third purge exists to call**, and its whole contract is in what it
   * raises. Answering normally says one thing: the copy no longer exists at Google. Raising says
   * the copy's state is unknown. The sweep writes `provider_uploaded_files.provider_purged_at` on
   * the first and leaves the row alone on the second, so anything answered loosely here becomes a
   * false record about personal data — which is the reason §4 deferred this job rather than faking
   * it on a driver that uploads nothing.
   *
   * **A vendor that says it knows no such handle is answered normally, not raised.** Google deletes
   * its own copy after about forty-eight hours whatever this service does, so by the time a daily
   * sweep reaches a file whose stated expiry has passed, "no such file" is the ordinary answer and
   * it means exactly what the stamp records. Treating it as a failure would leave every such row
   * unstamped for ever, and the egress record would go on saying a copy exists that does not.
   * `DeleteFileFromGeminiCapsule#isFileGone()` is what draws that line, from the HTTP status, and
   * it draws it narrowly on purpose.
   *
   * **What this call buys, given the vendor expires the copy anyway.** Not that the copy goes —
   * that it goes when this service said, and that an instant this service can show is written down
   * when it did. A vendor that lengthened its own window, or a file it kept past what it stated, is
   * reached by this call and by nothing else.
   *
   * **A missing key raises here as everywhere else**, through `#createGeminiApiClient()`. That is
   * the right answer for a sweep: a machine with no Gemini key cannot establish anything about a
   * copy at Google, and the alternative — carrying on and stamping — is the failure this member is
   * written to make impossible.
   *
   * @override
   * @param {{
   *   providerFileName: string
   * }} params - Parameters.
   * @returns {Promise<null>} Nothing, once the copy no longer exists at the provider.
   * @throws {Error} When no key is configured, or the vendor could not be reached.
   * @public
   */
  async deleteProviderUploadedFile ({
    providerFileName,
  }) {
    const geminiApiClient = await this.createGeminiApiClient()

    const deleteCapsule = await this.deleteFileFromGemini({
      providerFileName,
      geminiApiClient,
    })

    if (!deleteCapsule.isFileGone()) {
      throw new Error(`${this.Ctor.name}#deleteProviderUploadedFile() ${FAILED_DELETE_MESSAGE}: ${providerFileName}, ${deleteCapsule.extractErrorMessage()}`)
    }

    return null
  }

  /**
   * Ask the Files API to delete one file, and answer with the capsule whichever way it went.
   *
   * The call is separated from the judgement above it for the reason `#sendMessageToGemini()` and
   * `#uploadAttachedFile()` are: one member talks to the vendor and one decides what its answer
   * meant, so the decision can be exercised over every answer the vendor can give without a
   * network being involved in any of them.
   *
   * @param {{
   *   providerFileName: string
   *   geminiApiClient: GeminiApiClient
   * }} params - Parameters.
   * @returns {Promise<DeleteFileFromGeminiCapsule>} The capsule.
   * @public
   */
  async deleteFileFromGemini ({
    providerFileName,
    geminiApiClient,
  }) {
    try {
      const response = await geminiApiClient.deleteFileFromGemini({
        providerFileName,
      })

      return this.Ctor.DeleteFileFromGeminiCapsuleCtor.createWithResponse({
        response,
      })
    } catch (error) {
      return this.Ctor.DeleteFileFromGeminiCapsuleCtor.createWithError({
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
