import AiRunStepRecorder from './AiRunStepRecorder.js'

import AiModelCall from '../../sequelize/models/AiModelCall.js'
import AiRun from '../../sequelize/models/AiRun.js'
import AiRunCategory from '../../sequelize/models/AiRunCategory.js'
import AiRunFieldOutcome from '../../sequelize/models/AiRunFieldOutcome.js'
import AiRunStatus from '../../sequelize/models/AiRunStatus.js'

/**
 * Builds the one body a run is answered with, wherever it is answered.
 *
 * **One builder, two callers.** `GET /v1/ai-runs/:runKey` and the terminal callback posted to the
 * client's registered URL carry the same body — that is the whole of why a reconciliation path
 * exists, and two shapes for one answer is what it exists to avoid (specs/1.0.0, #run-delivery).
 * So the shape is built here, once, and neither caller assembles a field of its own.
 * `types/restfulapi/aiRunGet.d.ts` declares that body, for the same reason and in the same spirit.
 *
 * **A run of another client is answered as though it did not exist.** `#findAiRun()` takes the
 * client the request was resolved to and scopes the read by it, so a run key belonging to somebody
 * else answers `null` — indistinguishable from a run key naming nothing at all. The scope is bound
 * from the signature by the caller and never from a request parameter; the ninth acceptance
 * criterion is that the refusal says nothing about whether the run exists, and a read that found
 * the row and then refused it would already have said so to anything timing the two.
 *
 * **`result` is the stored body, parsed, and is never re-derived from the decision tables.** The
 * contract makes `result` "per service", and `types/restfulapi/aiRunGet.d.ts` deliberately
 * declares it no narrower than `Record<string, unknown>` so that a second AI service writes its
 * own shape rather than editing that one. A `#run-delivery` class that composed asset-media
 * extraction's `fields[]` out of `ai_run_field_outcomes` would bind this shared surface to one
 * service's field list, and the next service would have to change it. The service that ran the
 * category renders its own result and `AiRunStatusRecorder#saveSucceededAiRun()` stores it; this
 * class hands it back.
 *
 * **What that settles about a decimal on the wire ([[Q98]]).** `suggestion_confidence` is a
 * `DECIMAL`, and Sequelize hands a `DECIMAL` back as a string on MariaDB and as a number on the
 * SQLite the local suite runs on — so a suite that is green locally settles nothing about the
 * live dialect. The wire type of a confidence is a **JSON number**: a `DECIMAL(5, 4)` is exact in
 * a double, JSON has one number type, and the client's own screen compares it against a percentage
 * it already holds as a number. That decision binds whoever writes `result_body` — the service's
 * own worker, section 20 — because this class reads no `DECIMAL` column: the only column it takes
 * off `ai_run_field_outcomes` is `confidence_method_version`, which is a string in every dialect.
 * Stated here rather than only in a report, because this is the file a reader looking for the
 * answer opens.
 *
 * **`steps` is absent unless it was asked for, and carries seven fields when it is ([[Q93]]).**
 * The spread of an empty object is what makes the absence total — a request that asked for nothing
 * contributes no key, rather than a key holding null, and the two are different answers to "was a
 * trace asked for". `rejections` is not among the seven: section 10 is emphatic that the trace
 * holds figures and never values, the column outlives the content purge by two years, and the
 * contract never names it. A client that needs it is a spec change, not a field added here.
 */
export default class AiRunResponseBuilder {
  /**
   * Constructor.
   *
   * @param {AiRunResponseBuilderParams} params - Parameters.
   */
  constructor ({
    aiRunStepRecorder,
  }) {
    this.aiRunStepRecorder = aiRunStepRecorder
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunResponseBuilder ? X : never} T, X
   * @param {AiRunResponseBuilderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunStepRecorder = this.createAiRunStepRecorder(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunStepRecorder,
      })
    )
  }

  /**
   * Create the recorder the step trace is read back through.
   *
   * The trace is read through `#run-record`'s own recorder rather than through a second query
   * written here, so the order the steps claim in `step_index` and the category loaded beside each
   * of them are decided in one place.
   *
   * @returns {AiRunStepRecorder} Recorder.
   */
  static createAiRunStepRecorder () {
    return AiRunStepRecorder.create()
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
   * get: the run category master model.
   *
   * @returns {typeof AiRunCategory} Model.
   */
  static get AiRunCategoryCtor () {
    return AiRunCategory
  }

  /**
   * get: the settled field model.
   *
   * @returns {typeof AiRunFieldOutcome} Model.
   */
  static get AiRunFieldOutcomeCtor () {
    return AiRunFieldOutcome
  }

  /**
   * get: the model call model.
   *
   * @returns {typeof AiModelCall} Model.
   */
  static get AiModelCallCtor () {
    return AiModelCall
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunResponseBuilder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunResponseBuilder} */ (this.constructor)
  }

  /**
   * Build the body one run is answered with.
   *
   * @param {{
   *   runKey: string
   *   apiClientId: number
   *   expandsSteps: boolean
   * }} params - Parameters.
   * @returns {Promise<restfulapi.v1.AiRunResponse | null>} The body, or null when this client has
   * no run under that key.
   * @public
   */
  async buildAiRunResponse ({
    runKey,
    apiClientId,
    expandsSteps,
  }) {
    const aiRun = await this.findAiRun({
      runKey,
      apiClientId,
    })

    if (aiRun === null) {
      return null
    }

    return this.buildFoundAiRunResponse({
      aiRun,
      expandsSteps,
    })
  }

  /**
   * Find the run a client is asking about, scoped to that client.
   *
   * The client id is part of the condition rather than something checked after the row came back,
   * so a run of another client is never loaded at all. The two masters are loaded with it because
   * the body names a status and a category by name, and the name is the system key those tables
   * hold.
   *
   * @param {{
   *   runKey: string
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
        include: [
          this.Ctor.AiRunStatusCtor,
          this.Ctor.AiRunCategoryCtor,
        ],
      })
    )
  }

  /**
   * Build the body of a run that was found.
   *
   * The three reads are independent of one another, so they are issued together rather than one
   * after the next: none of them needs a value another produced.
   *
   * @param {{
   *   aiRun: *
   *   expandsSteps: boolean
   * }} params - Parameters.
   * @returns {Promise<restfulapi.v1.AiRunResponse>} The body.
   * @public
   */
  async buildFoundAiRunResponse ({
    aiRun,
    expandsSteps,
  }) {
    const [
      aiRunFieldOutcomes,
      aiModelCalls,
      stepsExpansion,
    ] = await Promise.all([
      this.findAiRunFieldOutcomes({
        aiRunId: aiRun.id,
      }),
      this.findAiModelCalls({
        aiRunId: aiRun.id,
      }),
      this.buildStepsExpansion({
        aiRunId: aiRun.id,
        expandsSteps,
      }),
    ])

    const engine = this.buildEngine({
      aiRun,
      aiRunFieldOutcomes,
    })

    const usage = this.buildUsage({
      aiModelCalls,
    })

    const result = this.buildResult({
      aiRun,
    })

    const failure = this.buildFailure({
      aiRun,
    })

    return {
      runKey: aiRun.runKey,
      runCategoryName: aiRun.AiRunCategory.name,
      externalRef: aiRun.externalRef,
      subjectLabel: aiRun.subjectLabel,
      correlationId: aiRun.correlationId,
      statusName: aiRun.AiRunStatus.name,
      engine,
      usage,
      result,
      failure,
      ...stepsExpansion,
    }
  }

  /**
   * Find every field this run settled.
   *
   * Only the version of the formula is read off the rows, because that is the only thing the body
   * takes from this table — the figures each row holds are the decision trace, and the result the
   * service rendered is what the body answers with.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The settled fields.
   * @public
   */
  async findAiRunFieldOutcomes ({
    aiRunId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunFieldOutcomeCtor.findAll({
        where: {
          AiRunId: aiRunId,
        },
        attributes: [
          'confidenceMethodVersion',
        ],
      })
    )
  }

  /**
   * Find every model call this run made.
   *
   * A canceled run's calls are the ones it made before it stopped, which is what makes "what was
   * spent up to the stop" a read rather than a calculation: nothing was recorded after the stop,
   * so nothing has to be excluded here.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The model calls.
   * @public
   */
  async findAiModelCalls ({
    aiRunId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiModelCallCtor.findAll({
        where: {
          AiRunId: aiRunId,
        },
        attributes: [
          'inputTokenCount',
          'outputTokenCount',
        ],
      })
    )
  }

  /**
   * Build the fields the step trace adds to the body, which is nothing unless it was asked for.
   *
   * The read is not issued at all for a request that asked for no trace, so `?expand=steps` is the
   * difference between one query and two rather than between one body and another built from the
   * same rows.
   *
   * @param {{
   *   aiRunId: number
   *   expandsSteps: boolean
   * }} params - Parameters.
   * @returns {Promise<{
   *   steps?: Array<restfulapi.v1.AiRunStepResponse>
   * }>} The expanded fields.
   * @public
   */
  async buildStepsExpansion ({
    aiRunId,
    expandsSteps,
  }) {
    if (!expandsSteps) {
      return {}
    }

    const aiRunSteps = await this.aiRunStepRecorder.findAiRunSteps({
      aiRunId,
    })

    const steps = aiRunSteps.map(it =>
      this.buildAiRunStepResponse({
        aiRunStep: it,
      })
    )

    return {
      steps,
    }
  }

  /**
   * Build one entry of the step trace.
   *
   * The seven fields are written out one at a time rather than spread off the row, so that a
   * column added to `ai_run_steps` later reaches this surface only when somebody puts it here.
   * `rejections` is the column that makes the difference: it holds what a step dropped, it
   * outlives the content purge, and it is not the client's to read.
   *
   * @param {{
   *   aiRunStep: *
   * }} params - Parameters.
   * @returns {restfulapi.v1.AiRunStepResponse} One step.
   * @public
   */
  buildAiRunStepResponse ({
    aiRunStep,
  }) {
    return {
      stepIndex: aiRunStep.stepIndex,
      stepName: aiRunStep.stepName,
      stepCategoryName: aiRunStep.AiRunStepCategory.name,
      outcomeCode: aiRunStep.outcomeCode,
      reasonCode: aiRunStep.reasonCode,
      startedAt: aiRunStep.startedAt,
      finishedAt: aiRunStep.finishedAt,
    }
  }

  /**
   * Build what produced the result: the loop and model, and the formula that scored it.
   *
   * @param {{
   *   aiRun: *
   *   aiRunFieldOutcomes: Array<*>
   * }} params - Parameters.
   * @returns {restfulapi.v1.AiRunEngineResponse} The engine.
   * @public
   */
  buildEngine ({
    aiRun,
    aiRunFieldOutcomes,
  }) {
    const confidenceMethodVersion = this.extractConfidenceMethodVersion({
      aiRunFieldOutcomes,
    })

    return {
      label: aiRun.engineLabel,
      confidenceMethodVersion,
    }
  }

  /**
   * Extract the one version of the confidence formula this run was scored under.
   *
   * **The two facts `engine` carries are held at two different grains ([[Q92]]).**
   * `ai_runs.engine_label` is one string per run. `confidence_method_version` is per settled field,
   * so one run can carry several — and the body has one place to put it. What a run with two
   * differing versions answers is decided here:
   *
   * **the version every settled field shares, and null when they do not share one.** A run has one
   * engine, and section 20's criterion says "the confidence formula carries a version, and every
   * run records which version scored it" — singular. So two versions on one run is a defect in
   * whatever scored it, not a state the client is meant to reconcile. Answering the newest of them
   * would name a version that scored only part of the run and make the run look uniform; answering
   * the oldest would do the same in the other direction. Null says what is true — that no single
   * version scored this run — and it is already the value this field carries for a run that never
   * reached a worker, so it introduces no third shape for a client to handle.
   *
   * **The rows themselves stay authoritative per field.** Nothing is lost by the null: an operator
   * asking which version scored a given field reads `ai_run_field_outcomes`, which is where that
   * question is answerable and where recalibration will read it from two years out.
   *
   * A run that settled no field has no version to report, and answers null for that reason rather
   * than for this one.
   *
   * @param {{
   *   aiRunFieldOutcomes: Array<*>
   * }} params - Parameters.
   * @returns {string | null} The version, or null when the run has no single one.
   * @public
   */
  extractConfidenceMethodVersion ({
    aiRunFieldOutcomes,
  }) {
    const confidenceMethodVersions = aiRunFieldOutcomes
      .map(it => it.confidenceMethodVersion)

    const distinctVersions = [
      ...new Set(confidenceMethodVersions),
    ]

    if (distinctVersions.length !== 1) {
      return null
    }

    return distinctVersions[0]
  }

  /**
   * Build what the run spent.
   *
   * @param {{
   *   aiModelCalls: Array<*>
   * }} params - Parameters.
   * @returns {restfulapi.v1.AiRunUsageResponse} What was spent.
   * @public
   */
  buildUsage ({
    aiModelCalls,
  }) {
    const emptyUsage = this.buildEmptyUsage()

    return aiModelCalls.reduce(
      (accumulatedUsage, aiModelCall) => ({
        modelCallCount: accumulatedUsage.modelCallCount + 1,
        inputTokenCount: accumulatedUsage.inputTokenCount + aiModelCall.inputTokenCount,
        outputTokenCount: accumulatedUsage.outputTokenCount + aiModelCall.outputTokenCount,
      }),
      emptyUsage
    )
  }

  /**
   * Build what a run that has spent nothing reports.
   *
   * A run reports what it spent rather than what it planned, so a run no worker has reached
   * reports three zeros and not three nulls. Zero model calls is a fact about the run; a null
   * would say the figure is unknown, and it is not.
   *
   * It is built per call rather than held as one shared literal, so that nothing a caller does to
   * the answer it was given reaches the next caller's.
   *
   * @returns {restfulapi.v1.AiRunUsageResponse} What a run that spent nothing reports.
   * @public
   */
  buildEmptyUsage () {
    return {
      modelCallCount: 0,
      inputTokenCount: 0,
      outputTokenCount: 0,
    }
  }

  /**
   * Build the result the run produced.
   *
   * The stored body is the service's own rendering, so it is parsed and handed back rather than
   * rebuilt. Three cases answer null, and they are one rule rather than three: the column holds no
   * object. A run that has not succeeded has written none; a run past the content purge has had
   * its own removed; and a body that does not parse into a plain object is not a result whatever
   * else it is. The client reads which of the three it met from `statusName`, which is answered
   * either way — a body it could not parse takes one field off the answer rather than the answer.
   *
   * @param {{
   *   aiRun: *
   * }} params - Parameters.
   * @returns {Record<string, unknown> | null} The result, or null when the run carries none.
   * @public
   */
  buildResult ({
    aiRun,
  }) {
    if (typeof aiRun.resultBody !== 'string') {
      return null
    }

    const parsedResult = this.parseResultBody({
      resultBody: aiRun.resultBody,
    })

    if (parsedResult === null) {
      return null
    }

    if (typeof parsedResult !== 'object') {
      return null
    }

    if (Array.isArray(parsedResult)) {
      return null
    }

    return parsedResult
  }

  /**
   * Parse the stored result body.
   *
   * @param {{
   *   resultBody: string
   * }} params - Parameters.
   * @returns {*} Whatever the body parsed into, or null when it parsed into nothing.
   * @public
   */
  parseResultBody ({
    resultBody,
  }) {
    try {
      return JSON.parse(resultBody)
    } catch (parseFailure) {
      return null
    }
  }

  /**
   * Build why the run failed, where it did.
   *
   * A failed run records a reason code and a succeeded run records none, so the code is what
   * decides whether this field carries anything — never the status, which would be a second way of
   * asking the same question and a second thing to keep in step.
   *
   * @param {{
   *   aiRun: *
   * }} params - Parameters.
   * @returns {restfulapi.v1.AiRunFailureResponse | null} The failure, or null when there was none.
   * @public
   */
  buildFailure ({
    aiRun,
  }) {
    if (typeof aiRun.failureReasonCode !== 'string') {
      return null
    }

    const parameters = aiRun.failureParameters
      ?? null

    return {
      reasonCode: aiRun.failureReasonCode,
      parameters,
    }
  }
}

/**
 * @typedef {{
 *   aiRunStepRecorder: AiRunStepRecorder
 * }} AiRunResponseBuilderParams
 */

/**
 * @typedef {Partial<AiRunResponseBuilderParams>} AiRunResponseBuilderFactoryParams
 */
