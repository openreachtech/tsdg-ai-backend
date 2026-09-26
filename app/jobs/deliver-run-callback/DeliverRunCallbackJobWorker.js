import {
  BaseJobWorker,
} from '@openreachtech/renchan-job-bullmq'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunTerminalCallbackDeliverer from '../../aiRunCallback/AiRunTerminalCallbackDeliverer.js'

import DeliverRunCallbackJobManifest from './DeliverRunCallbackJobManifest.js'

import {
  env,
  rootPath,
} from '../../globals/_.js'

/*
 * The number the first attempt at a callback carries.
 *
 * One, because `ai_run_callback_deliveries.attempt_index` is one-based — the development fixtures
 * count 1, 2, 3 — and because BullMQ's own counter is too: the queue increments `attemptsStarted`
 * as it moves a job to active, so the number is already 1 while the first attempt is running.
 * The two agreeing is what lets the index be taken from the queue rather than computed here.
 */
const FIRST_ATTEMPT_INDEX = 1

const REFUSED_JOB_BODY_MESSAGE = 'refused a job body its own schema does not hold'
const UNREADABLE_AI_RUN_ID_MESSAGE = 'refused a job body naming no run'
const UNREADABLE_ATTEMPT_INDEX_MESSAGE = 'refused a delivery whose attempt the queue did not number'
const UNDELIVERED_CALLBACK_MESSAGE = 'a terminal callback did not land'

const FAILED_DELIVERY_MESSAGE = 'a delivery failed'
const COMPLETED_DELIVERY_MESSAGE = 'a delivery completed'
const WORKER_ERROR_MESSAGE = 'the worker errored'

/*
 * What a failure is reported as when it came back as something carrying no class of its own — a
 * thrown string, a thrown null. Nothing in this file throws one; the fallback is here so that the
 * line is still written rather than the logging faulting inside a catch.
 */
const UNNAMED_ERROR_NAME = 'Error'

const LOG_FILE_PATH = rootPath.to('logs/ai-run-callback-')

const COMPLETED_DELIVERY_TAGS = [
  'DeliverRunCallbackJob',
  'CompletedDelivery',
]

const FAILED_DELIVERY_TAGS = [
  'DeliverRunCallbackJob',
  'FailedDelivery',
]

const WORKER_ERROR_TAGS = [
  'DeliverRunCallbackJob',
  'WorkerError',
]

const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * The worker that posts a run's terminal callback.
 *
 * **It does not extend `BaseAiRunJobWorker`, and that is the decision this file exists to state.**
 * That class owns a *run's* lifecycle: it claims the run running, races the work against the
 * 300-second limit, and writes exactly one terminal state. A callback delivery is none of those
 * things. It writes no run status — the run it is about is already settled, and section 10's first
 * criterion is that a run never leaves a terminal state, so a delivery that claimed one running
 * would be trying to undo it. It has no time limit of its own; what bounds it is the request
 * timeout the sender holds. And it is **retried**, which is the one behavior that class is built
 * to prevent. Inheriting it would have meant overriding `#executeJob()` — its entire body — to
 * escape the lifecycle, while still inheriting a claim, a race and a recorder none of which would
 * ever run. What is genuinely shared with a run's job is the body schema, and that is inherited:
 * `DeliverRunCallbackJobManifest` extends `BaseAiRunJobManifest`.
 *
 * **The retry is the eighth acceptance criterion, and this worker is one half of it.** The other
 * half is `DeliverRunCallbackJobDispatcher`, which states the attempt count; this class is what
 * makes an attempt count for anything, by **throwing when the callback did not land**. A worker
 * that answered normally after a `503` would leave BullMQ believing the job had succeeded, and the
 * attempt count would never be reached however generous it was. So the shape is deliberate: an
 * attempt that failed raises, and the queue brings the job back.
 *
 * **A refusal does not raise.** A callback URL outside the client's registered prefix, a client
 * whose secret will not decrypt, a run that no longer exists: none of them will read differently
 * in a minute's time, and each raising would spend the whole attempt budget on a request that was
 * never made. The deliverer answers such a case as "not attempted", and this worker returns.
 *
 * **The attempt's number comes from the queue.** `parcel.jobModel.job.attemptsStarted` is
 * incremented by BullMQ's own `prepareJobForProcessing` as the job moves to active, so it names
 * the attempt while the attempt is running. Deriving the index instead — counting the rows already
 * written and adding one — would read and write in two steps, and two workers retrying one run
 * would each read the same count and claim the same index, which the table's unique triple would
 * then refuse. A delivery whose attempt the queue did not number raises rather than guessing: a
 * guessed index corrupts the very count the retry criterion is read from.
 *
 * **What this worker returns is stored in Redis by the framework**, so it carries four small
 * fields and never the body that was posted. The body belongs in `ai_runs`, where the read-back by
 * run key finds it; the attempt belongs in `ai_run_callback_deliveries`.
 *
 * **Being under `app/jobs/` is what makes it run.** The daemon loads every `BaseJobWorker` subclass
 * it finds there and binds each to its manifest's queue, with no registration step anywhere — so
 * this file is live from the daemon's next start.
 */
export default class DeliverRunCallbackJobWorker extends BaseJobWorker {
  /**
   * Constructor.
   *
   * @param {DeliverRunCallbackJobWorkerParams} params - Parameters.
   */
  constructor ({
    engine,
    config,
    manifest,
    dispatcherHash,
    errorHash,
    aiRunTerminalCallbackDeliverer,
  }) {
    super({
      engine,
      config,
      manifest,
      dispatcherHash,
      errorHash,
    })

    this.aiRunTerminalCallbackDeliverer = aiRunTerminalCallbackDeliverer
  }

  /**
   * Factory method.
   *
   * The one value this class adds is decided here rather than in the constructor, which is what
   * lets a test hand in a deliverer of its own. The four the framework decides are rebuilt through
   * the framework's own static builders, so nothing about how a config or an error hash is put
   * together is restated here.
   *
   * @template {X extends typeof DeliverRunCallbackJobWorker ? X : never} T, X
   * @override
   * @param {DeliverRunCallbackJobWorkerFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    engine,
    manifest = this.createManifest(),
    dispatcherHash = {},
    errorCodeHash = this.errorCodeHash,
    aiRunTerminalCallbackDeliverer = this.createAiRunTerminalCallbackDeliverer(),
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
        aiRunTerminalCallbackDeliverer,
      })
    )
  }

  /**
   * get: the manifest naming this worker's queue and body shape.
   *
   * @override
   * @returns {typeof DeliverRunCallbackJobManifest} The manifest.
   */
  static get ManifestCtor () {
    return DeliverRunCallbackJobManifest
  }

  /**
   * get: the class that performs one attempt at a callback.
   *
   * @returns {typeof AiRunTerminalCallbackDeliverer} The class.
   */
  static get AiRunTerminalCallbackDelivererCtor () {
    return AiRunTerminalCallbackDeliverer
  }

  /**
   * get: the one logger client this worker writes through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * Create the deliverer that performs one attempt at a callback.
   *
   * @returns {AiRunTerminalCallbackDeliverer} The deliverer.
   */
  static createAiRunTerminalCallbackDeliverer () {
    return this.AiRunTerminalCallbackDelivererCtor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof DeliverRunCallbackJobWorker} The class.
   */
  get Ctor () {
    return /** @type {typeof DeliverRunCallbackJobWorker} */ (this.constructor)
  }

  /**
   * Execute one attempt at a run's terminal callback.
   *
   * The body is held to its schema first, and the one field that schema declares is the only field
   * read out of it — which is what keeps a body dispatched with extra keys from reaching anything
   * below. The attempt's number is taken from the queue next, and the work is the deliverer's.
   *
   * A callback that did not land raises, because raising is how a job is retried. Everything else
   * — a delivery that landed, and a refusal that will read the same next time — answers.
   *
   * @override
   * @param {{
   *   body: Record<string, *> | null
   *   context: InstanceType<ContextCtor>
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {Promise<AiRunCallbackJobResult>} What this attempt did.
   * @throws {Error} When the body fails its schema, when it names no run, when the queue numbered
   * no attempt, or when the callback did not land.
   * @public
   */
  async executeJob ({
    body,
    context,
    parcel,
  }) {
    if (
      !this.isValidJobBody({
        body,
      })
    ) {
      throw new Error(`${this.Ctor.name}#executeJob() ${REFUSED_JOB_BODY_MESSAGE}`)
    }

    const aiRunId = this.extractAiRunId({
      body,
    })

    if (aiRunId === null) {
      throw new Error(`${this.Ctor.name}#executeJob() ${UNREADABLE_AI_RUN_ID_MESSAGE}`)
    }

    const attemptIndex = this.extractAttemptIndex({
      parcel,
    })

    if (attemptIndex === null) {
      throw new Error(`${this.Ctor.name}#executeJob() ${UNREADABLE_ATTEMPT_INDEX_MESSAGE}: AiRunId ${aiRunId}`)
    }

    const outcome = await this.aiRunTerminalCallbackDeliverer.deliverTerminalCallback({
      aiRunId,
      attemptIndex,
    })

    if (
      this.shouldRetryTerminalCallback({
        outcome,
      })
    ) {
      throw new Error(`${this.Ctor.name}#executeJob() ${UNDELIVERED_CALLBACK_MESSAGE}: AiRunId ${aiRunId}, attemptIndex ${attemptIndex}, httpStatusCode ${outcome.httpStatusCode}`)
    }

    return this.buildAiRunCallbackJobResult({
      aiRunId,
      attemptIndex,
      outcome,
    })
  }

  /**
   * Check whether a job body satisfies the schema its manifest declares.
   *
   * The framework builds the body and never asks this question, so it is asked here, of the
   * framework's own value object rather than of a rule restated in this file — the schema is the
   * manifest's, and a second reading of it here would be a second thing to keep in step.
   *
   * What it rules out is a body that is not an object at all, and a declared field holding a value
   * of the wrong kind. What it does not rule out is a declared field being absent, which is why
   * `#executeJob()` refuses an absent id by name.
   *
   * @param {{
   *   body: Record<string, *> | null
   * }} params - Parameters.
   * @returns {boolean} Whether the body satisfies the schema.
   * @public
   */
  isValidJobBody ({
    body,
  }) {
    const jobBody = this.createJobBody({
      body,
    })

    return jobBody.isValid()
  }

  /**
   * Create the value object a job body is held to its schema by.
   *
   * @param {{
   *   body: Record<string, *> | null
   * }} params - Parameters.
   * @returns {InstanceType<JobBodyCtor>} The value object.
   * @public
   */
  createJobBody ({
    body,
  }) {
    const BoundJobBodyCtor = this.Ctor.JobBodyCtor.as(this.manifest.bodySchema)

    return BoundJobBodyCtor.create({
      normalizedBody: body,
    })
  }

  /**
   * Extract the run a callback is about, out of the job body.
   *
   * **What it answers null for is a body that does not carry the field**, which the schema does not
   * rule out: `{ aiRunId: Integer }` states what the field holds when it is there and not that it
   * has to be, so `{}` and a body carrying some other key both satisfy the schema and both name no
   * run. The caller refuses by name rather than letting a property read fault somewhere deeper.
   *
   * **A well-formed id that no row carries is not refused here.** It reaches the deliverer, which
   * answers that there is nothing to send — the same answer a re-delivery of a purged run gets.
   *
   * @param {{
   *   body: Record<string, *> | null
   * }} params - Parameters.
   * @returns {number | null} The run's id, or null when the body carries none.
   * @public
   */
  extractAiRunId ({
    body,
  }) {
    return body?.aiRunId
      ?? null
  }

  /**
   * Extract which attempt at this callback the queue is on.
   *
   * `attemptsStarted` is BullMQ's own counter, raised as the job is moved to active, so the first
   * attempt reads 1. `attemptsMade` is deliberately not read: it is raised when an attempt
   * *finishes*, so it reads 0 throughout the first attempt and would file every first attempt
   * under an index the column's own fixtures do not use.
   *
   * A value that is not a counted attempt answers null, and the caller raises. There is no safe
   * number to substitute: a repeated index collides with the row already written under it, and a
   * zero claims an attempt the fixtures say cannot exist.
   *
   * @param {{
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {number | null} The attempt's index, or null when the queue numbered none.
   * @public
   */
  extractAttemptIndex ({
    parcel,
  }) {
    const attemptsStarted = parcel?.jobModel?.job?.attemptsStarted
      ?? null

    if (!Number.isInteger(attemptsStarted)) {
      return null
    }

    if (attemptsStarted < FIRST_ATTEMPT_INDEX) {
      return null
    }

    return attemptsStarted
  }

  /**
   * Check whether this attempt should bring the job back.
   *
   * Two facts, and both are needed. An attempt that landed is done with. An attempt that was never
   * made — a URL outside the registered prefix, a secret that will not decrypt — would read the
   * same on every retry, so retrying it only spends the budget. What is left is an attempt that was
   * made and did not land, which is the case section 12's eighth criterion is about.
   *
   * @param {{
   *   outcome: import('../../aiRunCallback/AiRunTerminalCallbackDeliverer.js').AiRunTerminalCallbackOutcome
   * }} params - Parameters.
   * @returns {boolean} Whether the job should be retried.
   * @public
   */
  shouldRetryTerminalCallback ({
    outcome,
  }) {
    return outcome.hasAttempted
      && !outcome.hasDelivered
  }

  /**
   * Build what this delivery reports back to the queue.
   *
   * Four small fields. The body that was posted is not among them: it is the client's own result,
   * and the queue's store is not where it belongs.
   *
   * @param {{
   *   aiRunId: number
   *   attemptIndex: number
   *   outcome: import('../../aiRunCallback/AiRunTerminalCallbackDeliverer.js').AiRunTerminalCallbackOutcome
   * }} params - Parameters.
   * @returns {AiRunCallbackJobResult} The result.
   * @public
   */
  buildAiRunCallbackJobResult ({
    aiRunId,
    attemptIndex,
    outcome,
  }) {
    return {
      aiRunId,
      attemptIndex,
      httpStatusCode: outcome.httpStatusCode,
      refusalReasonCode: outcome.refusalReasonCode,
    }
  }

  /**
   * Handle the queue reporting a delivery completed.
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
    this.Ctor.mentsuLogger.log({
      message: `${this.Ctor.name} ${COMPLETED_DELIVERY_MESSAGE}: ${previousStatus}`,
      tags: COMPLETED_DELIVERY_TAGS,
    })

    return null
  }

  /**
   * Handle the queue reporting a delivery failed.
   *
   * A callback that did not land arrives here on every attempt, which is what an operator counts
   * when a client's endpoint is down. The error's message is left where it was thrown and only its
   * class name is written: a message composed elsewhere can quote a callback URL, which is the
   * client's own.
   *
   * @override
   * @param {{
   *   jobModel: InstanceType<JobModelCtor>
   *   error: *
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
    const errorName = this.extractErrorName({
      error,
    })

    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${FAILED_DELIVERY_MESSAGE}: ${previousStatus}, ${errorName}`,
      tags: FAILED_DELIVERY_TAGS,
    })

    return null
  }

  /**
   * Extract the class name of whatever a delivery failed with.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {string} The error's class name.
   * @public
   */
  extractErrorName ({
    error,
  }) {
    return error?.name
      ?? UNNAMED_ERROR_NAME
  }

  /**
   * Handle the queue reporting a delivery's progress.
   *
   * A callback is one request. There is nothing to report between its start and its end, and
   * nothing subscribes to this service's queues.
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
   * This is the queue connection failing rather than a callback failing, so no run is named and
   * there is nothing to name one with.
   *
   * @override
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  onWorkerError ({
    error,
  }) {
    const errorName = this.extractErrorName({
      error,
    })

    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${WORKER_ERROR_MESSAGE}: ${errorName}`,
      tags: WORKER_ERROR_TAGS,
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
 *   aiRunTerminalCallbackDeliverer: AiRunTerminalCallbackDeliverer
 * }} DeliverRunCallbackJobWorkerParams
 */

/**
 * @typedef {{
 *   engine: InstanceType<EngineCtor>
 *   manifest?: InstanceType<ManifestCtor>
 *   dispatcherHash?: Record<string, *>
 *   errorCodeHash?: Record<string, string>
 *   aiRunTerminalCallbackDeliverer?: AiRunTerminalCallbackDeliverer
 * }} DeliverRunCallbackJobWorkerFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   attemptIndex: number
 *   httpStatusCode: number | null
 *   refusalReasonCode: string | null
 * }} AiRunCallbackJobResult
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
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').JobBody} JobBodyCtor
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').WorkerParcel} WorkerParcelCtor
 */
