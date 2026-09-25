import timers from 'node:timers'

import {
  BaseJobWorker,
  ConcreteMemberNotFoundJobError,
} from '@openreachtech/renchan-job-bullmq'

import AiRunStatusRecorder from '../AiRunStatusRecorder.js'

import AI_RUN_FAILURE_REASON_CONSTANT_HASH from '../../constants/aiRunFailureReasonConstants.js'

const {
  AI_RUN_FAILURE_REASON_CODE,
} = AI_RUN_FAILURE_REASON_CONSTANT_HASH

/*
 * The run time limit, in milliseconds, because that is the unit every timer in Node takes.
 *
 * 300 seconds, from the non-functional section: "Run time limit | 300 seconds. A run still going
 * past it ends as failed". It is the default of the factory method rather than a literal inside a
 * method, so a test can state a limit of a few milliseconds instead of waiting five minutes, and
 * so a job whose work is known to be shorter can be given a tighter one without editing this file.
 */
const DEFAULT_RUN_TIME_LIMIT_MILLISECONDS = 300000

const UNREADABLE_AI_RUN_ID_MESSAGE = 'refused a job body naming no run'

/**
 * The worker every AI run job extends, holding the run's whole lifecycle.
 *
 * **What a concrete job supplies is the body of work, and nothing else.** Section 11 says the
 * concrete job of a service belongs to that service, and that this feature delivers the worker
 * process and the run's time limit. The reading that makes both sentences true is this one: the
 * service fills in `#executeAiRunWork()`, and everything around it — moving the run from queued to
 * running, enforcing the time limit, recording exactly one terminal state, recording a failure —
 * is held here once. The fifth acceptance criterion says a run's status moves from queued to
 * running to exactly one terminal state, and nothing but a common base is in a position to promise
 * that for every job at once.
 *
 * **This class is not under the daemon's `workersPath`, and must never be moved there.** The
 * daemon boots every `BaseJobWorker` subclass it finds under that path and binds each to its
 * manifest's queue name. This one has no manifest, so a boot that found it would crash before any
 * queue was listening. Concrete workers live under the daemon's path; this base lives beside the
 * run's own modules.
 *
 * **The lifecycle is written for at-least-once delivery.** BullMQ re-delivers a job whose worker
 * stalled, so the same run can reach two executions, and the framework's own note is that
 * `executeJob` must be idempotent. Two devices carry that here. The first is that the start write
 * and both terminal writes are conditional: `AiRunStatusRecorder` performs them only while the run
 * has not already settled, and answers whether this writer was the one that wrote. A delivery that
 * is told no stops without writing anything further, so a second execution can never produce a
 * second terminal state. The second is that the body of work re-reads everything it needs from the
 * database — the job body carries an id and nothing else — so a re-execution starts from the record
 * rather than from a copy of it.
 *
 * **The time limit is a race this class runs, not a setting it asks the queue for.** Nothing in
 * `@openreachtech/renchan-job-bullmq` provides a per-job time limit under any name, and BullMQ's
 * own `lockDuration` and stalled-job handling answer a different question — whether a worker is
 * still alive — not whether a run has gone on too long. So the work is raced against a timer, and
 * whichever finishes first decides the terminal state. `parcel.signal` is deliberately not used:
 * it is BullMQ's abort signal, and the framework's own documentation states neither when it fires
 * nor how a duration is given to it, so a limit built on it would be a limit nobody could state
 * the behavior of.
 *
 * **A run that loses the race is recorded failed, carrying `TIME_LIMIT_EXCEEDED`.** That is the
 * fourth acceptance criterion, and the reason code is one of the seven the client contract fixes.
 * The work itself is left to settle or reject on its own afterwards; it writes no status, because
 * the status is this class's to write, so nothing it does later can reach the row.
 *
 * @abstract
 */
export default class BaseAiRunJobWorker extends BaseJobWorker {
  /**
   * Constructor.
   *
   * @param {BaseAiRunJobWorkerParams} params - Parameters.
   */
  constructor ({
    engine,
    config,
    manifest,
    dispatcherHash,
    errorHash,
    runTimeLimitMilliseconds,
    aiRunStatusRecorder,
  }) {
    super({
      engine,
      config,
      manifest,
      dispatcherHash,
      errorHash,
    })

    this.runTimeLimitMilliseconds = runTimeLimitMilliseconds
    this.aiRunStatusRecorder = aiRunStatusRecorder
  }

  /**
   * Factory method.
   *
   * The two values this class adds are decided here rather than in the constructor, which is what
   * lets a test state a limit of a few milliseconds and hand in a recorder of its own. The three
   * the framework decides are rebuilt through the framework's own static builders, so nothing
   * about how a config or an error hash is put together is restated here.
   *
   * @template {X extends typeof BaseAiRunJobWorker ? X : never} T, X
   * @override
   * @param {BaseAiRunJobWorkerFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    engine,
    manifest = this.createManifest(),
    dispatcherHash = {},
    errorCodeHash = this.errorCodeHash,
    runTimeLimitMilliseconds = DEFAULT_RUN_TIME_LIMIT_MILLISECONDS,
    aiRunStatusRecorder = this.createAiRunStatusRecorder(),
  }) {
    const config = this.buildConfig({
      engine,
    })

    const errorHash = this.buildErrorHash({
      errorCodeHash,
      engine,
    })

    return /** @type {InstanceType<T>} */ (
      new this({
        engine,
        config,
        manifest,
        dispatcherHash,
        errorHash,
        runTimeLimitMilliseconds,
        aiRunStatusRecorder,
      })
    )
  }

  /**
   * get: the recorder that moves a run between statuses.
   *
   * @returns {typeof AiRunStatusRecorder} - The class.
   */
  static get AiRunStatusRecorderCtor () {
    return AiRunStatusRecorder
  }

  /**
   * get: the timer module the run time limit is measured with.
   *
   * @returns {typeof timers} - The module.
   */
  static get timers () {
    return timers
  }

  /**
   * Create the recorder that moves a run between statuses.
   *
   * @returns {AiRunStatusRecorder} - The recorder.
   */
  static createAiRunStatusRecorder () {
    return this.AiRunStatusRecorderCtor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof BaseAiRunJobWorker} - The class.
   */
  get Ctor () {
    return /** @type {typeof BaseAiRunJobWorker} */ (this.constructor)
  }

  /**
   * Execute one delivery of an AI run job.
   *
   * The run is claimed first and settled last, and between the two nothing but the concrete job's
   * own work runs. A claim that is refused means another writer has already settled the run — a
   * re-delivery of a job whose run finished — and this delivery stops there rather than doing the
   * work a second time and writing over a terminal state.
   *
   * The returned value is stored in Redis by the framework, so it carries three small fields and
   * never the run's result: the result belongs in `ai_runs`, where the callback and the read-back
   * by run key both find it.
   *
   * @override
   * @param {{
   *   body: Record<string, *> | null
   *   context: InstanceType<ContextCtor>
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {Promise<AiRunJobResult>} What this delivery did.
   * @throws {Error} When the job body names no run.
   * @public
   */
  async executeJob ({
    body,
    context,
    parcel,
  }) {
    const aiRunId = this.extractAiRunId({
      body,
    })

    if (aiRunId === null) {
      throw new Error(`${this.Ctor.name}#executeJob() ${UNREADABLE_AI_RUN_ID_MESSAGE}`)
    }

    const startedAt = this.buildCurrentInstant()

    const hasStarted = await this.saveRunningAiRun({
      aiRunId,
      startedAt,
    })

    if (!hasStarted) {
      return this.buildAiRunJobResult({
        aiRunId,
        failureReasonCode: null,
        hasSettled: false,
      })
    }

    return this.settleAiRun({
      aiRunId,
      body,
      context,
      parcel,
    })
  }

  /**
   * Extract the run a delivery is about, out of the job body.
   *
   * A body that failed its schema arrives as null, and a body that carries no run is the same
   * defect from this class's side — both answer null, and the caller above refuses by name rather
   * than letting a property read fault somewhere deeper.
   *
   * @param {{
   *   body: Record<string, *> | null
   * }} params - Parameters.
   * @returns {number | null} The run's id, or null when the body names none.
   * @public
   */
  extractAiRunId ({
    body,
  }) {
    return body?.aiRunId
      ?? null
  }

  /**
   * Build the instant a transition is recorded at.
   *
   * `AiRunStatusRecorder` reads no clock — every instant it records arrives on the call — so the
   * clock is read here, once per transition, through a method a test can substitute.
   *
   * @returns {Date} The instant.
   * @public
   */
  buildCurrentInstant () {
    return new Date()
  }

  /**
   * Save the run as running, and answer whether this delivery is the one that owns it.
   *
   * @param {{
   *   aiRunId: number
   *   startedAt: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether this writer performed the write.
   * @public
   */
  async saveRunningAiRun ({
    aiRunId,
    startedAt,
  }) {
    return this.aiRunStatusRecorder.saveRunningAiRunOnce({
      aiRunId,
      startedAt,
    })
  }

  /**
   * Build what this delivery reports back to the queue.
   *
   * @param {AiRunJobResult} params - Parameters.
   * @returns {AiRunJobResult} The result.
   * @public
   */
  buildAiRunJobResult ({
    aiRunId,
    failureReasonCode,
    hasSettled,
  }) {
    return {
      aiRunId,
      failureReasonCode,
      hasSettled,
    }
  }

  /**
   * Run the work and record the one terminal state it settles on.
   *
   * @param {{
   *   aiRunId: number
   *   body: Record<string, *> | null
   *   context: InstanceType<ContextCtor>
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {Promise<AiRunJobResult>} What this delivery did.
   * @public
   */
  async settleAiRun ({
    aiRunId,
    body,
    context,
    parcel,
  }) {
    const outcome = await this.raceAiRunWorkAgainstTimeLimit({
      body,
      context,
      parcel,
    })

    if (outcome.failureReasonCode !== null) {
      return this.settleFailedAiRun({
        aiRunId,
        outcome,
      })
    }

    return this.settleSucceededAiRun({
      aiRunId,
      outcome,
    })
  }

  /**
   * Race the concrete job's work against the run's time limit.
   *
   * Both sides resolve rather than reject, so the race answers with an outcome instead of with an
   * exception whose origin would then have to be told apart. The loser is left to settle on its
   * own: `Promise.race` subscribes to both, so a work promise that rejects after the limit has
   * already answered is a handled rejection and not a crash of the daemon.
   *
   * @param {{
   *   body: Record<string, *> | null
   *   context: InstanceType<ContextCtor>
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {Promise<AiRunWorkOutcome>} The outcome that won the race.
   * @public
   */
  async raceAiRunWorkAgainstTimeLimit ({
    body,
    context,
    parcel,
  }) {
    return Promise.race([
      this.buildAiRunWorkOutcome({
        body,
        context,
        parcel,
      }),
      this.buildTimeLimitOutcome(),
    ])
  }

  /**
   * Build the outcome of the concrete job's own work.
   *
   * A work that threw is an outcome rather than an exception, because this class has to record the
   * failure before anything else sees it — a run whose worker threw and wrote nothing would sit at
   * running until its retention sweep, and the client system would wait on a callback that never
   * comes. The error is logged where it happened, so the reason code in the row can be read back
   * to a stack trace.
   *
   * @param {{
   *   body: Record<string, *> | null
   *   context: InstanceType<ContextCtor>
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {Promise<AiRunWorkOutcome>} The outcome.
   * @public
   */
  async buildAiRunWorkOutcome ({
    body,
    context,
    parcel,
  }) {
    try {
      const resultBody = await this.executeAiRunWork({
        body,
        context,
        parcel,
      })

      return {
        resultBody,
        failureReasonCode: null,
        failureParameters: null,
      }
    } catch (error) {
      const failureReasonCode = this.extractAiRunFailureReasonCode({
        error,
      })

      this.timber.error(`[${this.Ctor.name}] the work of a run threw`, {
        failureReasonCode,
        message: error.message,
      })

      return {
        resultBody: null,
        failureReasonCode,
        failureParameters: null,
      }
    }
  }

  /**
   * Do the work of one run, and answer the result it settled.
   *
   * This is the one member a concrete job fills in, and the whole of what section 11 leaves to the
   * service. It writes no status and reads no clock: a run's statuses are this class's to record,
   * so a job that wrote one could produce the second terminal state the fifth criterion rules out.
   *
   * The answer is written to `ai_runs.result_body` as it arrives. A run that legitimately settled
   * nothing answers null and is a success, which is the rule `AiRunStatusRecorder` already holds.
   *
   * @abstract
   * @param {{
   *   body: Record<string, *> | null
   *   context: InstanceType<ContextCtor>
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {Promise<string | null>} The result the run settled.
   * @throws {ConcreteMemberNotFoundJobError} When the concrete job has not filled it in.
   * @public
   */
  async executeAiRunWork ({
    body,
    context,
    parcel,
  }) {
    throw ConcreteMemberNotFoundJobError.create({
      value: {
        memberName: `${this.Ctor.name}#executeAiRunWork()`,
      },
    })
  }

  /**
   * Extract the reason code a thrown failure is recorded under.
   *
   * **It is overridable and not abstract, and that is a decision rather than an omission.** Every
   * failed run must carry one of the seven codes the client contract fixes — the client system
   * builds the wording people read out of it, and `AiRunStatusRecorder` refuses a failed run that
   * names none — so a job that has not classified its own failures still has to leave something a
   * reader can act on. `PROVIDER_CALL_FAILED` is that answer because every run in this service is
   * a call to a model, and it is the only one of the seven broad enough to be true of a failure
   * nobody has classified.
   *
   * A job that can tell a media fetch from a provider call overrides this and says so; the error
   * is handed in for exactly that.
   *
   * @param {{
   *   error: Error
   * }} params - Parameters.
   * @returns {string} The reason code.
   * @public
   */
  extractAiRunFailureReasonCode ({
    error,
  }) {
    return AI_RUN_FAILURE_REASON_CODE.PROVIDER_CALL_FAILED
  }

  /**
   * Build the outcome of a run that went past its time limit.
   *
   * @returns {Promise<AiRunWorkOutcome>} The outcome.
   * @public
   */
  async buildTimeLimitOutcome () {
    await this.waitOutRunTimeLimit()

    return {
      resultBody: null,
      failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
      failureParameters: null,
    }
  }

  /**
   * Wait out the run's time limit.
   *
   * The timer is unreferenced, so the work finishing first leaves nothing holding the process open
   * for the rest of the limit. It is not cleared, because clearing it would mean holding the
   * handle as state, and a timer that has been unreferenced costs a pending entry and nothing else.
   *
   * The limit itself is what the wait resolves with — the third argument of `setTimeout` is handed
   * to the callback — so the wait answers something a caller and a test can both read, rather than
   * the nothing a bare `resolve` would give them.
   *
   * @returns {Promise<number>} The limit, once it has passed.
   * @public
   */
  async waitOutRunTimeLimit () {
    return new Promise(resolve => {
      const timeLimitAlarm = this.Ctor.timers.setTimeout(
        resolve,
        this.runTimeLimitMilliseconds,
        this.runTimeLimitMilliseconds
      )

      timeLimitAlarm.unref()
    })
  }

  /**
   * Record the run as failed, with the reason its outcome carries.
   *
   * @param {{
   *   aiRunId: number
   *   outcome: AiRunWorkOutcome
   * }} params - Parameters.
   * @returns {Promise<AiRunJobResult>} What this delivery did.
   * @public
   */
  async settleFailedAiRun ({
    aiRunId,
    outcome,
  }) {
    const finishedAt = this.buildCurrentInstant()

    const hasSettled = await this.saveFailedAiRun({
      aiRunId,
      failureReasonCode: outcome.failureReasonCode,
      failureParameters: outcome.failureParameters,
      finishedAt,
    })

    return this.buildAiRunJobResult({
      aiRunId,
      failureReasonCode: outcome.failureReasonCode,
      hasSettled,
    })
  }

  /**
   * Save the run as failed, and answer whether this delivery is the one that settled it.
   *
   * @param {SaveFailedAiRunParams} params - Parameters.
   * @returns {Promise<boolean>} Whether this writer performed the write.
   * @public
   */
  async saveFailedAiRun ({
    aiRunId,
    failureReasonCode,
    failureParameters,
    finishedAt,
  }) {
    return this.aiRunStatusRecorder.saveFailedAiRunOnce({
      aiRunId,
      failureReasonCode,
      failureParameters,
      finishedAt,
    })
  }

  /**
   * Record the run as succeeded, with the result its outcome carries.
   *
   * @param {{
   *   aiRunId: number
   *   outcome: AiRunWorkOutcome
   * }} params - Parameters.
   * @returns {Promise<AiRunJobResult>} What this delivery did.
   * @public
   */
  async settleSucceededAiRun ({
    aiRunId,
    outcome,
  }) {
    const finishedAt = this.buildCurrentInstant()

    const hasSettled = await this.saveSucceededAiRun({
      aiRunId,
      resultBody: outcome.resultBody,
      finishedAt,
    })

    return this.buildAiRunJobResult({
      aiRunId,
      failureReasonCode: null,
      hasSettled,
    })
  }

  /**
   * Save the run as succeeded, and answer whether this delivery is the one that settled it.
   *
   * @param {{
   *   aiRunId: number
   *   resultBody: string | null
   *   finishedAt: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether this writer performed the write.
   * @public
   */
  async saveSucceededAiRun ({
    aiRunId,
    resultBody,
    finishedAt,
  }) {
    return this.aiRunStatusRecorder.saveSucceededAiRunOnce({
      aiRunId,
      resultBody,
      finishedAt,
    })
  }

  /**
   * Handle the queue reporting a delivery completed.
   *
   * Nothing is recorded here. The run reached its terminal state inside `#executeJob()`, where the
   * conditional write decided whether this delivery was the one that settled it; a second write
   * from an event handler could only undo that decision.
   *
   * @override
   * @param {{
   *   jobModel: InstanceType<JobModelCtor>
   *   result: *
   *   previousStatus: string
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  onJobCompleted ({
    jobModel,
    result,
    previousStatus,
  }) {
    this.timber.log(`[${this.Ctor.name}] a delivery completed`, {
      previousStatus,
    })

    return null
  }

  /**
   * Handle the queue reporting a delivery failed.
   *
   * @override
   * @param {{
   *   jobModel: InstanceType<JobModelCtor>
   *   error: Error
   *   previousStatus: string
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  onJobFailed ({
    jobModel,
    error,
    previousStatus,
  }) {
    this.timber.error(`[${this.Ctor.name}] a delivery failed`, {
      previousStatus,
      message: error.message,
    })

    return null
  }

  /**
   * Handle the queue reporting a delivery's progress.
   *
   * This service publishes no progress: a caller is answered with a run key and reads the run back
   * by that key, so there is no subscriber for a progress event to reach.
   *
   * @override
   * @param {{
   *   jobModel: InstanceType<JobModelCtor>
   *   progress: string | boolean | number | object
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  onJobProgress ({
    jobModel,
    progress,
  }) {
    return null
  }

  /**
   * Handle the worker itself erroring.
   *
   * @override
   * @param {{
   *   error: Error
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  onWorkerError ({
    error,
  }) {
    this.timber.error(`[${this.Ctor.name}] the worker errored`, {
      message: error.message,
    })

    return null
  }
}

/**
 * @typedef {{
 *   engine: InstanceType<EngineCtor>
 *   config: Record<string, *>
 *   manifest: InstanceType<ManifestCtor>
 *   dispatcherHash: Record<string, *>
 *   errorHash: Record<string, *>
 *   runTimeLimitMilliseconds: number
 *   aiRunStatusRecorder: AiRunStatusRecorder
 * }} BaseAiRunJobWorkerParams
 */

/**
 * @typedef {{
 *   engine: InstanceType<EngineCtor>
 *   manifest?: InstanceType<ManifestCtor>
 *   dispatcherHash?: Record<string, *>
 *   errorCodeHash?: Record<string, string>
 *   runTimeLimitMilliseconds?: number
 *   aiRunStatusRecorder?: AiRunStatusRecorder
 * }} BaseAiRunJobWorkerFactoryParams
 */

/**
 * @typedef {{
 *   resultBody: string | null
 *   failureReasonCode: string | null
 *   failureParameters: Record<string, *> | null
 * }} AiRunWorkOutcome
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   failureReasonCode: string | null
 *   hasSettled: boolean
 * }} AiRunJobResult
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   failureReasonCode: string
 *   failureParameters: Record<string, *> | null
 *   finishedAt: Date
 * }} SaveFailedAiRunParams
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').BaseJobEngine} EngineCtor
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').BaseJobManifest} ManifestCtor
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').BaseJobContext} ContextCtor
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').JobModel} JobModelCtor
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').WorkerParcel} WorkerParcelCtor
 */
