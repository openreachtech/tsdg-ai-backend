import AiRunKeyInspector from './AiRunKeyInspector.js'

import AiRun from '../../sequelize/models/AiRun.js'

const UNREADABLE_KEY_MESSAGE = 'refused a key that is not an id'

/**
 * Answers whether a run has been asked to stop.
 *
 * **The question is the database's to answer, and that is the whole reason this class reads a
 * row.** A cancellation is recorded by an HTTP request in the API process and honored by a worker
 * in another process entirely, so nothing the worker holds in memory can learn that a client
 * asked. `ai_runs.cancel_requested_at` is the one channel between the two, and this class is the
 * one place it is read on the honoring side — `AiRunCancellationRegistrar` is the one place it is
 * written on the asking side.
 *
 * **It asks whether somebody asked, not whether the run stopped.** `cancel_requested_at` is the
 * instant a client asked and `canceled_at` is the instant the run actually stopped; §15's third
 * use case measures the gap between them. A class that answered off the status would be answering
 * after the fact — the status only moves once the run has already stopped, which is the moment
 * nothing needs telling any more.
 *
 * **Two columns and never the stored bodies.** `request_body` and `result_body` are `MEDIUMTEXT`,
 * and this question is asked once per run at the pick-up and again on every tick of
 * `AiRunCancellationWatcher`. Reading the row whole would pull a megabyte across the wire once a
 * second to answer whether one nullable instant is set.
 *
 * **A run that is not there has not been asked to stop.** The read answers null and this answers
 * false, which is the same answer it gives a run nobody asked about — and it is the right one for
 * the caller either way: there is nothing to stop. Telling the two apart is `BaseAiRunJobWorker`'s
 * job, which refuses a body naming no run before this class is ever reached.
 *
 * **An id that is no id is refused by throwing, before any query.** That follows
 * `AiRunStatusRecorder`, which holds the same inspector and refuses the same shape on the writing
 * side, so the reader and the writer of this column agree on what an id is. It is refused rather
 * than answered false because false would say a run had not been asked to stop, which is a claim
 * about a run this call cannot name; and it is refused before the query because the watcher asks
 * once per interval for as long as a run lives, so a malformed id would otherwise be a wasted
 * round trip every second for the length of the run's time limit.
 */
export default class AiRunCancellationInspector {
  /**
   * Constructor.
   *
   * @param {AiRunCancellationInspectorParams} params - Parameters.
   */
  constructor ({
    aiRunKeyInspector,
  }) {
    this.aiRunKeyInspector = aiRunKeyInspector
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunCancellationInspector ? X : never} T, X
   * @param {AiRunCancellationInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunKeyInspector = this.createAiRunKeyInspector(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunKeyInspector,
      })
    )
  }

  /**
   * get: the run model — a seam so tests can substitute it.
   *
   * @returns {typeof AiRun} Model.
   */
  static get AiRunCtor () {
    return AiRun
  }

  /**
   * Create the inspector answering whether a value is an id at all.
   *
   * @returns {AiRunKeyInspector} Inspector.
   */
  static createAiRunKeyInspector () {
    return AiRunKeyInspector.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCancellationInspector} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCancellationInspector} */ (this.constructor)
  }

  /**
   * Check whether a client has asked for this run to be canceled.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether a cancellation has been asked for.
   * @throws {Error} When the id handed in is not an id.
   * @public
   */
  async hasAiRunCancelRequest ({
    aiRunId,
  }) {
    if (
      !this.aiRunKeyInspector.isRecordableKey({
        key: aiRunId,
      })
    ) {
      throw new Error(`${this.Ctor.name}#hasAiRunCancelRequest() ${UNREADABLE_KEY_MESSAGE}: field aiRunId`)
    }

    const aiRun = await this.findAiRun({
      aiRunId,
    })

    if (aiRun === null) {
      return false
    }

    return aiRun.cancelRequestedAt !== null
  }

  /**
   * Find the run one delivery is about, reading only what the question needs.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The run, or null when no row carries the id.
   * @public
   */
  async findAiRun ({
    aiRunId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunCtor.findOne({
        where: {
          id: aiRunId,
        },
        attributes: [
          'id',
          'cancelRequestedAt',
        ],
      })
    )
  }
}

/**
 * @typedef {{
 *   aiRunKeyInspector: AiRunKeyInspector
 * }} AiRunCancellationInspectorParams
 */

/**
 * @typedef {Partial<AiRunCancellationInspectorParams>} AiRunCancellationInspectorFactoryParams
 */
