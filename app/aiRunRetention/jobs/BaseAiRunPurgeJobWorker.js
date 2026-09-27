import {
  BaseJobWorker,
  ConcreteMemberNotFoundJobError,
} from '@openreachtech/renchan-job-bullmq'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import {
  env,
  rootPath,
} from '../../globals/_.js'

const UNEXHAUSTED_SWEEP_MESSAGE = 'a scheduled purge stopped with runs still past its horizon'
const COMPLETED_SWEEP_MESSAGE = 'a sweep completed'
const FAILED_SWEEP_MESSAGE = 'a sweep failed'
const WORKER_ERROR_MESSAGE = 'the worker errored'

/*
 * What a failure is reported as when it came back carrying no class of its own — a thrown string,
 * a thrown null. Nothing in this hierarchy throws one; the fallback is here so that the line is
 * still written rather than the logging faulting inside a catch.
 */
const UNNAMED_ERROR_NAME = 'Error'

/*
 * A prefix rather than a file name: `@openreachtech/mentsu-logger` appends the date and the
 * extension to whatever it is given.
 *
 * **One file for both purges, deliberately.** The two sweeps run on two clocks against two
 * horizons, but the question an operator brings to this log is one question — "is retention
 * keeping up?" — and it is answered by reading the content sweeps and the trace sweeps together.
 * Split across two files, a trace backlog building behind a healthy content purge reads as silence
 * in the file somebody happened to open.
 */
const LOG_FILE_PATH = rootPath.to('logs/ai-run-purge-')

const UNEXHAUSTED_SWEEP_TAGS = [
  'AiRunPurgeJob',
  'UnexhaustedSweep',
]

const COMPLETED_SWEEP_TAGS = [
  'AiRunPurgeJob',
  'CompletedSweep',
]

const FAILED_SWEEP_TAGS = [
  'AiRunPurgeJob',
  'FailedSweep',
]

const WORKER_ERROR_TAGS = [
  'AiRunPurgeJob',
  'WorkerError',
]

const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * What both of §19's scheduled purges do, minus which set they sweep.
 *
 * **It extends `BaseJobWorker` directly, and not `BaseAiRunJobWorker`.** That class owns a *run's*
 * lifecycle: it claims one run running, races its work against §7's 300-second limit, and writes
 * exactly one terminal state for it. A purge is none of those things. It is about no run in
 * particular — it selects every run past a horizon — so there is nothing to claim and no status to
 * write; §10's first criterion is that a run never leaves a terminal state, and a purge that
 * claimed one running would be trying to undo it. It carries no per-run time limit either: what
 * bounds a sweep is `aiRunPurgeSweepConstants.cjs`'s two figures, fifty batches of two hundred
 * runs, and that bound is the purger's rather than a worker's. Inheriting the run lifecycle would
 * have meant overriding the whole of `#executeJob()` to escape it while still carrying a claim, a
 * race and a status recorder that could never run.
 *
 * **What a concrete purge job adds is one method.** `#sweepExpiredAiRuns()` — which purger to ask,
 * and by which name. The two purgers deliberately do not share a method name (`AiRunContentPurger`
 * answers `purgeExpiredAiRunContent`, `AiRunTracePurger` answers `purgeExpiredAiRunTraces`), for
 * the same reason §7 gives for the two horizons living in two constant files: nobody should be
 * able to reach for "the purge". So the shared piece stops one call short of the purger, and the
 * concrete class makes it.
 *
 * **The instant is read here, once per execution, and never comes off the body.** A repeatable
 * job's template is written once at registration and replayed on every firing, so an instant
 * carried in the body would be frozen at the moment somebody ran the registration script — the
 * purge would clear the backlog once and then silently stop purging, still firing on time and
 * still reporting success. Reading the clock per execution also gives the sweep the one property
 * §19 needs of it: the horizon it selects against and the stamp it writes are the same instant,
 * so they cannot drift apart across a long sweep.
 *
 * **A sweep that did not finish is reported and does not throw, which is the decision this class
 * exists to make.** `isSweepExhausted: false` means the batch bound was spent with runs still past
 * the horizon. That is a fact about the size of the backlog, not a failure: nothing went wrong,
 * nothing needs rolling back, and the next firing continues from the same condition because the
 * stamps this one wrote took those runs out of the set. Throwing would be wrong twice over — it
 * would spend the retry budget re-running a sweep that would stop at the same bound, and it would
 * file a healthy overnight batch under the same signal as a database outage, so that the signal
 * stops meaning anything. But "the job did not throw" is also not a report: an operator who needs
 * to know the backlog is outgrowing one night's sweep cannot learn it from a green queue. So the
 * fact goes to two places, deliberately. It is **logged as a warning** the moment it is known,
 * which is the durable copy and the one an alert can be built on; and it is **returned in the
 * job's result**, which BullMQ stores against the completed job, which is why the schedule's own
 * job template — `BaseAiRunPurgeCronJobScheduler`'s `optionHash`, the only options a firing reads
 * — bounds how many completed jobs are kept rather than leaving BullMQ's unbounded default.
 * Reading a run of the last ninety sweeps answers "is the backlog draining or growing", which no
 * single firing can.
 *
 * **Why that fact goes to two places and not just to the log, concretely.**
 * `@openreachtech/mentsu-logger`'s `shouldSkipLogging()` reads
 * `!['production'].includes(this.env.NODE_ENV)`, so every level this class writes through is
 * **silent in every environment except production** — the opposite of what the method's own
 * `skipTargets` array reads as. Nothing in this repository can fix that without owning somebody
 * else's package, and every logging call in this service is already subject to it. What it means
 * here is that an operator on staging, or a developer checking whether the nightly sweep is
 * keeping up locally, would get nothing at all from the log file. The result returned to the
 * queue is not subject to it, which is why the backlog fact is carried on both routes rather than
 * on the more obvious one alone. If the package is ever corrected, this stays as it is: the two
 * routes answer different questions — one firing, and the last ninety.
 *
 * **What it returns is stored in Redis**, so it carries four small numbers and nothing else — no
 * run ids, no content, nothing that was purged. The content is gone; the point of the job is that
 * nothing keeps a copy of it, least of all the queue that ran the purge.
 *
 * Being abstract is why this file sits outside `app/jobs/`: the daemon boots every `BaseJobWorker`
 * subclass it finds there and binds each to its manifest's queue, and a worker with no manifest
 * has no queue to bind to, so one left there stops the daemon at boot.
 *
 * @abstract
 */
export default class BaseAiRunPurgeJobWorker extends BaseJobWorker {
  /**
   * Constructor.
   *
   * @param {BaseAiRunPurgeJobWorkerParams} params - Parameters.
   */
  constructor ({
    engine,
    config,
    manifest,
    dispatcherHash,
    errorHash,
    aiRunPurger,
  }) {
    super({
      engine,
      config,
      manifest,
      dispatcherHash,
      errorHash,
    })

    this.aiRunPurger = aiRunPurger
  }

  /**
   * Factory method.
   *
   * The one value this hierarchy adds is decided here rather than in the constructor, which is
   * what lets a test hand in a purger of its own. The four the framework decides are rebuilt
   * through the framework's own static builders, so nothing about how a config or an error hash is
   * put together is restated here.
   *
   * @template {X extends typeof BaseAiRunPurgeJobWorker ? X : never} T, X
   * @override
   * @param {BaseAiRunPurgeJobWorkerFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    engine,
    manifest = this.createManifest(),
    dispatcherHash = {},
    errorCodeHash = this.errorCodeHash,
    aiRunPurger = this.createAiRunPurger(),
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
        aiRunPurger,
      })
    )
  }

  /**
   * get: the class that sweeps this job's set.
   *
   * @abstract
   * @returns {AiRunPurgerCtor} The class.
   * @throws {ConcreteMemberNotFoundJobError} When the concrete job has not filled it in.
   */
  static get AiRunPurgerCtor () {
    throw ConcreteMemberNotFoundJobError.create({
      value: {
        memberName: `${this.name}.get:AiRunPurgerCtor`,
      },
    })
  }

  /**
   * get: the one logger client both purges write through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * Create the purger that sweeps this job's set.
   *
   * @returns {InstanceType<AiRunPurgerCtor>} The purger.
   */
  static createAiRunPurger () {
    return this.AiRunPurgerCtor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof BaseAiRunPurgeJobWorker} The class.
   */
  get Ctor () {
    return /** @type {typeof BaseAiRunPurgeJobWorker} */ (this.constructor)
  }

  /**
   * Run one scheduled sweep.
   *
   * The clock is read first and handed down, so the horizon selected against and the stamp written
   * are one instant. The body is not read at all: §19 gives both purges a payload of none, and the
   * sweep's set comes from the horizon rather than from anything a dispatch could have said.
   *
   * A sweep that stopped on its batch bound is reported and returned rather than thrown — see the
   * class note; that case is the backlog being larger than one firing, which is neither a failure
   * nor something a green queue tells anybody.
   *
   * @override
   * @param {{
   *   body: Record<string, *> | null
   *   context: InstanceType<ContextCtor>
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {Promise<AiRunPurgeJobResult>} What the sweep did.
   * @public
   */
  async executeJob ({
    body,
    context,
    parcel,
  }) {
    const now = this.buildCurrentInstant()

    const outcome = await this.sweepExpiredAiRuns({
      now,
    })

    if (!outcome.isSweepExhausted) {
      this.reportUnexhaustedSweep({
        outcome,
      })
    }

    return this.buildAiRunPurgeJobResult({
      now,
      outcome,
    })
  }

  /**
   * Build the instant this sweep selects and stamps by.
   *
   * Read through a method rather than inline so a test can substitute it, and read once per
   * execution rather than per batch so that a sweep long enough to cross midnight still stamps
   * every run it purged with the instant it started.
   *
   * @returns {Date} The instant.
   * @public
   */
  buildCurrentInstant () {
    return new Date()
  }

  /**
   * Sweep this job's set, up to the bound the purger carries.
   *
   * @abstract
   * @param {{
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<AiRunPurgeSweepOutcome>} What the sweep did, and whether it finished.
   * @throws {ConcreteMemberNotFoundJobError} When the concrete job has not filled it in.
   * @public
   */
  async sweepExpiredAiRuns ({
    now,
  }) {
    throw ConcreteMemberNotFoundJobError.create({
      value: {
        memberName: `${this.Ctor.name}#sweepExpiredAiRuns()`,
      },
    })
  }

  /**
   * Report that a sweep stopped with runs still past its horizon.
   *
   * A warning rather than an error, and the distinction is the whole of what this line is for: an
   * error in this file means a sweep did not run, and a warning means a sweep ran and could not
   * reach the end of its set. An operator paged for the second every night the backlog is large
   * stops reading the first.
   *
   * The counts are written and nothing else is. A run id here would name a row whose content this
   * job has just removed, in a file that outlives it.
   *
   * @param {{
   *   outcome: AiRunPurgeSweepOutcome
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  reportUnexhaustedSweep ({
    outcome,
  }) {
    this.Ctor.mentsuLogger.warn({
      message: `${this.Ctor.name} ${UNEXHAUSTED_SWEEP_MESSAGE}: purgedAiRunCount ${outcome.purgedAiRunCount}, batchCount ${outcome.batchCount}`,
      tags: UNEXHAUSTED_SWEEP_TAGS,
    })

    return null
  }

  /**
   * Build what this sweep reports back to the queue.
   *
   * Four small values, and the queue keeps a bounded run of them, so that "has the backlog been
   * draining?" is answerable from the last ninety firings rather than from the one in front of
   * whoever is looking.
   *
   * The instant is written as text because it is going into Redis, where a `Date` would arrive
   * back as whatever the serializer made of it.
   *
   * @param {{
   *   now: Date
   *   outcome: AiRunPurgeSweepOutcome
   * }} params - Parameters.
   * @returns {AiRunPurgeJobResult} The result.
   * @public
   */
  buildAiRunPurgeJobResult ({
    now,
    outcome,
  }) {
    const sweptAt = now.toISOString()

    return {
      sweptAt,
      purgedAiRunCount: outcome.purgedAiRunCount,
      batchCount: outcome.batchCount,
      isSweepExhausted: outcome.isSweepExhausted,
    }
  }

  /**
   * Handle the queue reporting a sweep completed.
   *
   * Every finished sweep writes one line, including one that stopped on its bound — that case has
   * already written its warning, and this line is what makes the ordinary night visible so that
   * the absence of one is readable too.
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
      message: `${this.Ctor.name} ${COMPLETED_SWEEP_MESSAGE}: ${previousStatus}`,
      tags: COMPLETED_SWEEP_TAGS,
    })

    return null
  }

  /**
   * Handle the queue reporting a sweep failed.
   *
   * The error's message is left where it was thrown and only its class name is written: a message
   * composed deeper down can quote a row, and the rows this job touches are the ones whose content
   * it is removing.
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
      message: `${this.Ctor.name} ${FAILED_SWEEP_MESSAGE}: ${previousStatus}, ${errorName}`,
      tags: FAILED_SWEEP_TAGS,
    })

    return null
  }

  /**
   * Extract the class name of whatever a sweep failed with.
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
   * Handle the queue reporting a sweep's progress.
   *
   * A sweep publishes none. Nothing subscribes to this service's queues, and the fact a sweep has
   * to report — whether it reached the end of its set — is known only when it stops.
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
   * This is the queue connection failing rather than a sweep failing, so no sweep is named and
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
 *   aiRunPurger: InstanceType<AiRunPurgerCtor>
 * }} BaseAiRunPurgeJobWorkerParams
 */

/**
 * @typedef {{
 *   engine: InstanceType<EngineCtor>
 *   manifest?: InstanceType<ManifestCtor>
 *   dispatcherHash?: Record<string, *>
 *   errorCodeHash?: Record<string, string>
 *   aiRunPurger?: InstanceType<AiRunPurgerCtor>
 * }} BaseAiRunPurgeJobWorkerFactoryParams
 */

/**
 * @typedef {{
 *   purgedAiRunCount: number
 *   batchCount: number
 *   isSweepExhausted: boolean
 * }} AiRunPurgeSweepOutcome
 */

/**
 * @typedef {{
 *   sweptAt: string
 *   purgedAiRunCount: number
 *   batchCount: number
 *   isSweepExhausted: boolean
 * }} AiRunPurgeJobResult
 */

/**
 * @typedef {typeof import('../AiRunContentPurger.js').default
 *   | typeof import('../AiRunTracePurger.js').default} AiRunPurgerCtor
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
