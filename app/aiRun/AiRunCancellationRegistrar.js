import AiRunStatusRecorder from './AiRunStatusRecorder.js'
import AiRunTerminalStatusInspector from './AiRunTerminalStatusInspector.js'

import AiRun from '../../sequelize/models/AiRun.js'
import AiRunStatus from '../../sequelize/models/AiRunStatus.js'

/**
 * Registers a client's request to cancel one of its own runs, and answers the state that holds.
 *
 * **A cancellation is a resource that is created, not a field that is set** (specs/1.0.0, §15).
 * That sentence is the whole design, and this class is where it is spelled out: asking a second
 * time creates nothing, and both asks are answered with the state that already holds. Every
 * branch below is a reading of it rather than a special case bolted on, which is why the fifth
 * acceptance criterion — a run that has already reached a terminal state answers that state and
 * not an error — needs no code of its own. A run that has settled is simply a run there is
 * nothing to create against; it is answered, not refused.
 *
 * **What this class does not do is stop a run.** It writes `cancel_requested_at`, which is when
 * somebody asked, and nothing else: the run goes on until the step loop reaches a boundary and
 * honors the request, and `canceled_at` is written there by whatever honors it. The two instants
 * are a pair because §15's third use case measures the gap between them — "ORT measures how long
 * canceling actually takes" — and a class that collapsed them into one write would have removed
 * the measurement while appearing to do more.
 *
 * **The client is in the `where` of the read, so another client's run is never loaded.** That is
 * the eighth acceptance criterion, and putting it in the query rather than in a check after the
 * row came back is what makes both halves of it hold at once: the run answers as though it did
 * not exist, and it is left unchanged because nothing here ever held it. It also leaves this
 * class with one absent answer rather than two, so it cannot tell a foreign run from an unknown
 * key even if a later caller wanted it to. `AiRunGetRenderer` refuses on exactly the same
 * footing, which is why both routes answer `404` and neither answers `403`.
 *
 * **Three columns and the status name, and never the stored bodies.** `request_body` and
 * `result_body` are `MEDIUMTEXT`; a cancellation needs to know which run, whether it has settled
 * and whether it has already been asked about, so those are the columns named. Reading the row
 * whole would pull a megabyte of content across to answer a question about whether work should
 * stop.
 *
 * **Asking twice is settled before the write and not by it.** `#shouldSaveAiRunCancelRequest()`
 * reads the instant already on the row, so a second request writes nothing and the first
 * instant — the one the measurement is anchored on — is never overwritten by a later one. What
 * that leaves open is two requests arriving together, both reading the column empty: the second
 * then overwrites the first by the width of one request, the run is canceled either way, and the
 * measurement moves by milliseconds. Closing it would mean a second writer on a column
 * `AiRunStatusRecorder` owns, stating a condition that class's own `where` does not carry, and
 * that is a worse trade than the milliseconds.
 *
 * **The write goes through `AiRunStatusRecorder`, and through its answering spelling.**
 * `#saveAiRunCancelRequest()` is that class's declared home for this column, and its throwing
 * spelling refuses a run that settled between this class's read and the write. For a client
 * asking to cancel, that refusal is the wrong shape: the run reaching a terminal state a
 * millisecond early is not an error the caller made, and it is exactly the case the fifth
 * criterion says to answer rather than refuse. `#saveAiRunOnce()` is the recorder's own
 * transition-agnostic wrapper — its docblock states that nothing about which transition it is
 * reaches it — so the race comes back as `false` with a line written down, and the caller is
 * answered with the state it read.
 */
export default class AiRunCancellationRegistrar {
  /**
   * Constructor.
   *
   * @param {AiRunCancellationRegistrarParams} params - Parameters.
   */
  constructor ({
    aiRunTerminalStatusInspector,
    aiRunStatusRecorder,
  }) {
    this.aiRunTerminalStatusInspector = aiRunTerminalStatusInspector
    this.aiRunStatusRecorder = aiRunStatusRecorder
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunCancellationRegistrar ? X : never} T, X
   * @param {AiRunCancellationRegistrarFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunTerminalStatusInspector = this.createAiRunTerminalStatusInspector(),
    aiRunStatusRecorder = this.createAiRunStatusRecorder(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunTerminalStatusInspector,
        aiRunStatusRecorder,
      })
    )
  }

  /**
   * get: the run model.
   *
   * @returns {typeof AiRun} Model.
   */
  static get AiRunCtor () {
    return AiRun
  }

  /**
   * get: the run status master model.
   *
   * @returns {typeof AiRunStatus} Model.
   */
  static get AiRunStatusCtor () {
    return AiRunStatus
  }

  /**
   * Create the inspector answering whether a run has already settled.
   *
   * @returns {AiRunTerminalStatusInspector} Inspector.
   */
  static createAiRunTerminalStatusInspector () {
    return AiRunTerminalStatusInspector.create()
  }

  /**
   * Create the recorder that writes the instant a cancellation was asked for.
   *
   * @returns {AiRunStatusRecorder} Recorder.
   */
  static createAiRunStatusRecorder () {
    return AiRunStatusRecorder.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCancellationRegistrar} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCancellationRegistrar} */ (this.constructor)
  }

  /**
   * Register a client's request to cancel its own run, and answer the state that holds.
   *
   * The answer is the same whether this request was the one that recorded the cancellation or
   * whether it found one already recorded, and that sameness is the whole of what "asking twice
   * creates nothing the second time" means on the wire. A caller cannot tell the first ask from
   * the fifth, and has no reason to want to: what it asked for is true either way.
   *
   * @param {{
   *   runKey: string | null
   *   apiClientId: number
   *   cancelRequestedAt: Date
   * }} params - Parameters.
   * @returns {Promise<restfulapi.v1.AiRunCancellationResponse | null>} The body, or null when
   * this client has no run under that key.
   * @public
   */
  async registerAiRunCancellation ({
    runKey,
    apiClientId,
    cancelRequestedAt,
  }) {
    const aiRun = await this.findAiRun({
      runKey,
      apiClientId,
    })

    if (aiRun === null) {
      return null
    }

    await this.saveRequestedAiRunCancellation({
      aiRun,
      cancelRequestedAt,
    })

    return this.buildAiRunCancellationResponse({
      aiRun,
    })
  }

  /**
   * Find the run a key names, scoped to the client that asked after it.
   *
   * The client is a condition of the read and not a check made afterwards, so a run belonging to
   * somebody else is never loaded and comes back as the same null an unknown key does.
   *
   * @param {{
   *   runKey: string | null
   *   apiClientId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The run, or null when this client has no run under that key.
   * @public
   */
  async findAiRun ({
    runKey,
    apiClientId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunCtor.findOne({
        where: {
          runKey,
          ApiClientId: apiClientId,
        },
        attributes: [
          'id',
          'AiRunStatusId',
          'cancelRequestedAt',
        ],
        include: [
          {
            model: this.Ctor.AiRunStatusCtor,
            attributes: [
              'id',
              'name',
            ],
          },
        ],
      })
    )
  }

  /**
   * Save the instant this cancellation was asked for, where there is one to save.
   *
   * @param {{
   *   aiRun: *
   *   cancelRequestedAt: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether this request was the one that recorded the cancellation.
   * @public
   */
  async saveRequestedAiRunCancellation ({
    aiRun,
    cancelRequestedAt,
  }) {
    if (
      !this.shouldSaveAiRunCancelRequest({
        aiRun,
      })
    ) {
      return false
    }

    const saveAiRun = () => this.aiRunStatusRecorder.saveAiRunCancelRequest({
      aiRunId: aiRun.id,
      cancelRequestedAt,
    })

    return this.aiRunStatusRecorder.saveAiRunOnce({
      saveAiRun,
    })
  }

  /**
   * Check whether there is a cancellation left to create against this run.
   *
   * Two runs have none, for two different reasons stated as two branches. A run that has settled
   * is past being stopped — nothing later can reach it, and the request is answered with the
   * state it settled in. A run already carrying the instant somebody asked has had its
   * cancellation created already, and writing a second instant over the first would move the one
   * end of the measurement §15 exists to make.
   *
   * @param {{
   *   aiRun: *
   * }} params - Parameters.
   * @returns {boolean} Whether the instant should be written.
   * @public
   */
  shouldSaveAiRunCancelRequest ({
    aiRun,
  }) {
    if (
      this.aiRunTerminalStatusInspector.isTerminalAiRunStatus({
        aiRunStatusId: aiRun.AiRunStatusId,
      })
    ) {
      return false
    }

    return aiRun.cancelRequestedAt === null
  }

  /**
   * Build the body a cancellation is answered with.
   *
   * The status is the one read off the run, and the read happened before the write — which states
   * nothing false, because the write this class makes moves no status. A run still queued answers
   * `queued` and a run still running answers `running`: the request is recorded and the run stops
   * at its next boundary, so a body claiming `canceled` here would be claiming something that has
   * not happened.
   *
   * @param {{
   *   aiRun: *
   * }} params - Parameters.
   * @returns {restfulapi.v1.AiRunCancellationResponse} The body.
   * @public
   */
  buildAiRunCancellationResponse ({
    aiRun,
  }) {
    return {
      statusName: aiRun.AiRunStatus.name,
    }
  }
}

/**
 * @typedef {{
 *   aiRunTerminalStatusInspector: AiRunTerminalStatusInspector
 *   aiRunStatusRecorder: AiRunStatusRecorder
 * }} AiRunCancellationRegistrarParams
 */

/**
 * @typedef {Partial<AiRunCancellationRegistrarParams>} AiRunCancellationRegistrarFactoryParams
 */
