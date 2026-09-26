import timersPromises from 'node:timers/promises'

import {
  BaseJobWorker,
  ConcreteMemberNotFoundJobError,
} from '@openreachtech/renchan-job-bullmq'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunStatusRecorder from '../AiRunStatusRecorder.js'

import AiRunMediaWorkspace from '../../aiRunMedia/AiRunMediaWorkspace.js'

import AiRunTerminalCallbackRaiser from '../../aiRunCallback/AiRunTerminalCallbackRaiser.js'

import DeliverRunCallbackJobDispatcher from '../../jobs/deliver-run-callback/DeliverRunCallbackJobDispatcher.js'

import AI_RUN_FAILURE_REASON_CONSTANT_HASH from '../../constants/aiRunFailureReasonConstants.js'

import {
  env,
  rootPath,
} from '../../globals/_.js'

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

/*
 * The name this worker's dispatcher hash holds the terminal-callback dispatcher under.
 *
 * Named once because two members read it — the declaration the framework builds the hash from, and
 * the construction that takes the built dispatcher back out of it — and a hash whose two ends
 * disagreed would hand the raiser nothing at all. That failure is silent by construction: the
 * raiser swallows a dispatch it could not make, so every settled run would go without its callback
 * and no run would look any different for it.
 */
const TERMINAL_CALLBACK_DISPATCHER_NAME = 'aiRunTerminalCallback'

const REFUSED_JOB_BODY_MESSAGE = 'refused a job body its own schema does not hold'
const UNREADABLE_AI_RUN_ID_MESSAGE = 'refused a job body naming no run'

const FAILED_AI_RUN_WORK_MESSAGE = 'the work of a run threw'
const FAILED_DELIVERY_MESSAGE = 'a delivery failed'
const COMPLETED_DELIVERY_MESSAGE = 'a delivery completed'
const WORKER_ERROR_MESSAGE = 'the worker errored'
const FAILED_WORKSPACE_REMOVAL_MESSAGE = 'a run ended with its fetched files still on disk'

/*
 * What a failure is reported as when it came back as something carrying no class of its own - a
 * thrown string, a thrown null, an object with a null prototype.
 *
 * Nothing in this file throws one. `#executeAiRunWork()` is written by another service against
 * this class's own contract, and `throw null` there is a line somebody may write - so the fallback
 * is not a courtesy to a hypothetical thrower but the thing that keeps a run from ending with no
 * terminal state at all. A `throw` raised inside a `catch` is not caught by that `catch`'s own
 * `try`: reading `.constructor.name` off null there would raise a `TypeError` out through the
 * outcome builder, past the terminal write, and out of `#executeJob()`, leaving the row at
 * `running` until the retention sweep and the client waiting on a callback that never comes. The
 * sibling `MediaFetchClient` already guards the same expression; this file did not.
 */
const UNNAMED_ERROR_NAME = 'Error'

const FAILED_AI_RUN_WORK_TAGS = [
  'AiRunJob',
  'FailedAiRunWork',
]

const FAILED_WORKSPACE_REMOVAL_TAGS = [
  'AiRunJob',
  'FailedWorkspaceRemoval',
]

const FAILED_DELIVERY_TAGS = [
  'AiRunJob',
  'FailedDelivery',
]

const COMPLETED_DELIVERY_TAGS = [
  'AiRunJob',
  'CompletedDelivery',
]

const WORKER_ERROR_TAGS = [
  'AiRunJob',
  'WorkerError',
]

const LOG_FILE_PATH = rootPath.to('logs/ai-run-job-')

/*
 * One logger client per process, rather than one per line, exactly as `AiRunStatusRecorder` holds
 * its own.
 *
 * The client owns a rotating file, and a daemon runs one of these workers per queue for the life
 * of the process. `@openreachtech/mentsu-logger` writes only under `NODE_ENV=production`, so under
 * the test and development environments this client is built and then never asked to write.
 */
const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

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
 * database, starting from the record rather than from a copy of it.
 *
 * **The queue is a boundary, and what crosses it is held to the schema here.** The framework hands
 * `executeJob` whatever `jobModel.normalizeBody()` made of the job's stored data and never asks
 * the body whether its schema is satisfied, so nothing upstream of this class has checked it: the
 * dispatcher's check ran in another process, against what that process was about to enqueue, and a
 * body can also arrive from a hand-written `Queue.add` against the same Redis. So `#executeJob()`
 * asks `JobBody#isValid()` first and refuses a body that fails, and then hands the concrete job a
 * body **rebuilt from the schema's declared fields** rather than the one that arrived — a
 * normalized body keeps every undeclared key it was given, and `#executeAiRunWork()` is written by
 * a service reading the sentence below. What that sentence promises has to be made true here
 * rather than assumed.
 *
 * **What the concrete job receives is the schema's fields and nothing else**, which for this
 * manifest is the run's id alone. That is not a description of what callers send; it is what
 * `#buildDeclaredJobBody()` constructs, so a body carrying a callback URL or a result beside the
 * id arrives at the work with those keys gone.
 *
 * **Every line this class writes goes through `MentsuLogger`, and none of them repeats a message
 * it did not compose.** The two halves are one decision. `this.timber` is the engine's console
 * wrapper and it is replaced by no-ops under `NODE_ENV=production`, which is the one environment
 * where a stalled or failing worker has to leave a trace — and it is the environment
 * `AiRunStatusRecorder`'s logger writes in, so a worker on `timber` and a recorder on
 * `MentsuLogger` would record one feature's failures in mutually exclusive environments. The
 * bound-message rule comes with it: a thrown error's `message` is text this class did not write,
 * and at a job that fetches media or calls a provider it can carry a URL, a file name or a
 * fragment of the medium itself. So a failure line names the run, the reason code and the error's
 * class, each of which this service already holds, and the message is left where it was thrown.
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
 * **The work is told, through a signal of this class's own making.** The third use case asks for a
 * run that stops "instead of holding a worker indefinitely", and a work with no way of hearing
 * that its run is over cannot stop: it keeps the worker slot it was given, and the daemon's
 * concurrency is one lower for as long as it lives. So an `AbortController` is built for each
 * race, its signal is handed to `#executeAiRunWork()`, and it is raised where and only where the
 * limit won. This is not the queue's signal adopted after all — that sentence above stands
 * unchanged; it is a second signal, this service's, whose firing condition this file states.
 *
 * **What it buys, stated as narrowly as it is true.** Nothing here can make a concrete work honour
 * a signal. A work that ignores it runs on and holds its slot exactly as before — but it then does
 * so by its own choice, where until now there was no choice to make. Cooperative stopping is
 * possible; it is not guaranteed, and this class is in no position to guarantee it.
 *
 * **A run that ends removes the temporary copies it fetched, and this class is the only place that
 * knows a run has ended.** Section 18's fifth acceptance criterion is "the temporary copy of a
 * fetched file is deleted when the run ends", and its sixth is that no fetched file is kept in
 * long-term storage; `AiRunMediaWorkspace` answers the sixth by putting the copies under the
 * machine's own temporary directory, and the fifth is this class calling `#removeWorkspace()`.
 * **The call sits in a `finally` and not after the terminal write**, because "when the run ends" is
 * not "when the run succeeded": a work that threw, a run that went past its limit and a terminal
 * write that itself threw are all ways a run ends, and only a `finally` is on all of them at once.
 * It is asked for every run rather than only for a run that fetched something, because a directory
 * that was never created is removed without complaining — so this class needs to know that a run
 * *might* have a workspace and never which runs do, and no job in this version fetches anything
 * yet.
 *
 * **A removal that failed does not change how the run ended.** A run that succeeded and then could
 * not delete a directory has still succeeded, and a `finally` that threw would replace both the
 * result and any exception already on its way out. So the removal logs and swallows, which is this
 * repository's rule for a boundary — and `#executeJob()` is one, being what the framework calls and
 * what the run's terminal state is written inside. The line it writes is the operator's evidence
 * that a fetched file outlived its run.
 *
 * **Two ways a run can end do not pass through that `finally`, stated rather than implied.** A
 * delivery whose *process* is killed between the fetch and the removal runs no `finally` at all,
 * and nothing in this service sweeps a directory a dead process left — `AiRunMediaWorkspace` says
 * so in its own words, and the machine's temporary directory is the mitigation. And on the
 * time-limit path the work itself is still running when the removal happens, so a work that writes
 * another copy afterwards recreates the directory this delivery just removed. **That one is now
 * answerable rather than answered**: the signal raised when the limit won is what a work asks
 * before it writes into its workspace, so the work that closes it is the concrete
 * `#executeAiRunWork()` honouring the signal, not anything in this file. A work that does not ask
 * still recreates the directory.
 *
 * **A run this delivery settled raises its terminal callback, and a run it did not settle raises
 * nothing.** Section 12's first acceptance criterion is that every run reaching succeeded, failed
 * or canceled produces **one** terminal callback, and the word doing the work in that sentence is
 * "one": the delivery path is built and connected, so what is left to decide is who calls it and
 * how often. The answer both halves need is the same one the whole lifecycle is built on — the
 * writer whose conditional write was accepted owns the run. That writer raises the callback, and a
 * delivery told the run had already settled, whether at the claim or at the terminal write, raises
 * nothing: the run is terminal either way, and the writer that made it so has already called.
 *
 * **Raising cannot fail this delivery**, by `AiRunTerminalCallbackRaiser`'s own design rather than
 * by anything guarding it here: a queue that cannot be reached is logged there and swallowed, so a
 * run that succeeded is never turned into a job that failed by the callback for it. Wrapping the
 * call in a second guard here would only hide that the raiser already promises it.
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
   * get: the workspace holding one run's fetched files.
   *
   * @returns {typeof AiRunMediaWorkspace} - The class.
   */
  static get AiRunMediaWorkspaceCtor () {
    return AiRunMediaWorkspace
  }

  /**
   * get: the raiser of a settled run's terminal callback.
   *
   * @returns {typeof AiRunTerminalCallbackRaiser} - The class.
   */
  static get AiRunTerminalCallbackRaiserCtor () {
    return AiRunTerminalCallbackRaiser
  }

  /**
   * get: the promise-shaped timers the run time limit is measured with.
   *
   * Reached through a getter rather than named inside the method that waits, so the one place this
   * class touches the clock is named once and a test can stand something else in its place.
   *
   * @returns {typeof timersPromises} - The module.
   */
  static get timersPromises () {
    return timersPromises
  }

  /**
   * get: the controller a cancellation signal is raised through.
   *
   * The sibling `MediaFetchClient` reaches `AbortSignal` the same way against the same problem —
   * the standard library's own class, named in one place — so nothing below imports it and a test
   * can stand something else in its place.
   *
   * @returns {typeof AbortController} - The class.
   */
  static get AbortControllerCtor () {
    return AbortController
  }

  /**
   * get: the one logger client this process writes through.
   *
   * @returns {MentsuLogger} - Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
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
   * Collect the dispatchers this worker's own deliveries send jobs through.
   *
   * **One dispatcher, and it is here rather than built where it is used.** The framework builds
   * what this declares once, when the worker boots, and wraps each one in
   * `#declareReusableDispatcher()` — the wrapper that dispatches with `keepsConnection: true`, so
   * the Redis connection is opened once for the process rather than once per settled run. A
   * dispatcher built inside a delivery would open and close a connection on every run in the
   * queue, and there is one of these per run.
   *
   * It is the callback queue's own dispatcher and deliberately not this service's AI run one: the
   * callback is the one job in the service that retries, which is what
   * `DeliverRunCallbackJobDispatcher` says in its own words.
   *
   * @override
   * @returns {Record<string, typeof DeliverRunCallbackJobDispatcher>} - The dispatcher classes.
   * @public
   */
  static collectAdditionalDispatcherCtorHash () {
    return {
      [TERMINAL_CALLBACK_DISPATCHER_NAME]: DeliverRunCallbackJobDispatcher,
    }
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
   * The body is held to its schema first, and what the work is handed afterwards is built from the
   * schema's fields rather than passed through. The run is claimed next and settled last, and
   * between the two nothing but the concrete job's own work runs. A claim that is refused means
   * another writer has already settled the run — a re-delivery of a job whose run finished — and
   * this delivery stops there rather than doing the work a second time and writing over a terminal
   * state.
   *
   * The returned value is stored in Redis by the framework, so it carries three small fields and
   * never the run's result: the result belongs in `ai_runs`, where the callback and the read-back
   * by run key both find it.
   *
   * **Whatever the run settles on, the temporary copies it fetched are removed on the way out**,
   * which is section 18's fifth acceptance criterion. The `finally` is what makes that true of a
   * work that threw and of a terminal write that threw, and not only of a run that succeeded.
   *
   * **The removal begins where the claim succeeded, and a delivery told the run had already settled
   * removes nothing.** Such a delivery fetched nothing of its own — its work never ran — so the
   * only directory it could remove is one another delivery made, and that other delivery may still
   * be working inside it. The run it was told about was settled by a writer that ran this same
   * `finally`.
   *
   * `return await` inside the `try` is load-bearing rather than noise: a bare `return` inside a
   * `try` completes the statement before the promise settles, so the `finally` would remove the
   * workspace while the work was still using it.
   *
   * @override
   * @param {{
   *   body: Record<string, *> | null
   *   context: InstanceType<ContextCtor>
   *   parcel: InstanceType<WorkerParcelCtor>
   * }} params - Parameters.
   * @returns {Promise<AiRunJobResult>} What this delivery did.
   * @throws {Error} When the body fails its schema, or when it names no run.
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

    const declaredBody = this.buildDeclaredJobBody({
      body,
    })

    const aiRunId = this.extractAiRunId({
      body: declaredBody,
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

    try {
      return await this.settleAiRun({
        aiRunId,
        body: declaredBody,
        context,
        parcel,
      })
    } finally {
      await this.removeAiRunMediaWorkspace({
        aiRunId,
      })
    }
  }

  /**
   * Check whether a job body satisfies the schema its manifest declares.
   *
   * The framework builds the body and never asks this question, so it is asked here, of the
   * framework's own value object rather than of a rule restated in this file — the schema is the
   * manifest's, and a second reading of it here would be a second thing to keep in step.
   *
   * What it rules out is a body that is not an object at all and a declared field holding a value
   * of the wrong kind. What it does not rule out is a declared field being absent, or an id being
   * zero or negative: the schema states the kind of a field and not whether it is required, and
   * `#executeJob()` refuses an absent id by name for exactly that reason.
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
   * Build the body the concrete job's work is handed, out of the schema's declared fields.
   *
   * **A body that satisfied its schema is not a body carrying only what the schema declares.** The
   * framework's normalization keeps every key it was given, so a body dispatched with a callback
   * URL or a result beside the run's id arrives here carrying them, and handing that on would make
   * `#executeAiRunWork()` — written by another service, against this class's own sentence about
   * what a body carries — an entry point for fields nobody declared. What is built here carries
   * the declared fields the body actually holds, and nothing else, which is that sentence made
   * true rather than assumed.
   *
   * It is asked after the gate above, so what reaches it is an object.
   *
   * @param {{
   *   body: Record<string, *>
   * }} params - Parameters.
   * @returns {Record<string, *>} The body the work is handed.
   * @public
   */
  buildDeclaredJobBody ({
    body,
  }) {
    const declaredFieldNames = Object.keys(this.manifest.bodySchema)

    return declaredFieldNames
      .filter(it => Object.hasOwn(body, it))
      .reduce(
        (declaredBody, fieldName) => ({
          ...declaredBody,
          [fieldName]: body[fieldName],
        }),
        {}
      )
  }

  /**
   * Extract the run a delivery is about, out of the job body.
   *
   * **What it answers null for is a body that does not carry the field**, which the schema does
   * not rule out: `{ aiRunId: Integer }` states what the field holds when it is there and not that
   * it has to be, so `{}` and a body carrying some other key both satisfy the schema and both name
   * no run. The caller above refuses by name rather than letting a property read fault somewhere
   * deeper.
   *
   * **A number that is no id, and an id no row carries, are both answered rather than refused
   * here**, and they part company one call later. `AiRunStatusRecorder` holds every key it is
   * given to `AiRunKeyInspector`'s rule — a positive integer of at most nineteen digits, which
   * spells back the number it reads as — so a
   * zero or a negative is raised there as a defect in the call, named as the field it arrived in.
   * A well-formed id that no row carries is not a defect: it is answered false, telling the
   * delivery there is nothing to do, which is the same answer a re-delivery of a settled run gets
   * and the answer the at-least-once lifecycle is built on. Neither judgement is restated here,
   * because a second copy of the id rule is a second thing to keep in step with the first.
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
   * Run the work, record the one terminal state it settles on, and call the run's client back.
   *
   * **The callback is raised here, once, below the branch rather than inside either arm of it.**
   * Section 12's first acceptance criterion covers succeeded and failed alike, and the two arms
   * below are exactly those two states — a raise written into each arm would be the same sentence
   * twice, and the next terminal state added to this class would be the one that forgot it. Below
   * the branch there is one place, and every run that reaches a terminal state through this worker
   * passes through it.
   *
   * **Nothing above the branch reaches it, which is the other half of "one".** A delivery whose
   * claim was refused never reaches this method at all — `#executeJob()` returns before calling it
   * — and that delivery must not call back: its run was settled by whoever won the claim, and that
   * writer raised the callback from here. Two deliveries of one job would otherwise call the
   * client twice about one run.
   *
   * @param {{
   *   aiRunId: number
   *   body: Record<string, *>
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

    const result = await this.recordTerminalAiRunState({
      aiRunId,
      outcome,
    })

    await this.raiseAiRunTerminalCallback({
      aiRunId,
      hasSettled: result.hasSettled,
    })

    return result
  }

  /**
   * Race the concrete job's work against the run's time limit.
   *
   * Both sides resolve rather than reject, so the race answers with an outcome instead of with an
   * exception whose origin would then have to be told apart. The loser is left to settle on its
   * own: `Promise.race` subscribes to both, so a work promise that rejects after the limit has
   * already answered is a handled rejection and not a crash of the daemon.
   *
   * **The work is handed a signal of this class's own, raised when the time limit wins.** It is
   * the only channel a work has for learning that the run it is doing is over — the row is already
   * settled by then, and nothing a work does afterwards can reach it. What the signal makes
   * possible is that the work can stop; what it cannot do is make it stop, which
   * `#executeAiRunWork()` says in the words an implementer reads.
   *
   * **Two controllers, because the two cancellations run opposite ways round.** The work's
   * terminator is raised only where the limit won, so a work that answered inside its limit never
   * finds it raised. The alarm's terminator is raised whichever way the race ended, and that is
   * what stops a timer nobody is waiting on any more: left running, it would raise the work's
   * terminator minutes after that work had answered, handing a finished work a signal about a run
   * that ended well. Aborting the alarm makes its wait reject, and the race has already attached a
   * handler to that promise, so the rejection is answered rather than left unhandled — which is
   * how `JobDispatcherProvider` cancels the loser of its own race.
   *
   * `return await` inside the `try` is load-bearing for the same reason it is in `#executeJob()`:
   * a bare `return` would complete the statement before the race settled, and the `finally` would
   * then cancel the alarm while the limit was still being measured.
   *
   * @param {{
   *   body: Record<string, *>
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
    const aiRunWorkTerminator = this.createAbortController()
    const timeLimitAlarmTerminator = this.createAbortController()

    try {
      return await Promise.race([
        this.buildAiRunWorkOutcome({
          body,
          context,
          parcel,
          signal: aiRunWorkTerminator.signal,
        }),
        this.buildTimeLimitOutcome({
          aiRunWorkTerminator,
          timeLimitAlarmSignal: timeLimitAlarmTerminator.signal,
        }),
      ])
    } finally {
      timeLimitAlarmTerminator.abort()
    }
  }

  /**
   * Create the controller one cancellation signal is raised through.
   *
   * A worker is one long-lived instance per queue, so the controller is built per race and never
   * held as a property: a signal raised for one delivery's run must not be the signal another
   * delivery's work is watching.
   *
   * @returns {AbortController} The controller.
   * @public
   */
  createAbortController () {
    return new this.Ctor.AbortControllerCtor()
  }

  /**
   * Build the outcome of the concrete job's own work.
   *
   * A work that threw is an outcome rather than an exception, because this class has to record the
   * failure before anything else sees it — a run whose worker threw and wrote nothing would sit at
   * running until its retention sweep, and the client system would wait on a callback that never
   * comes. A line naming the run and the reason code is written where the failure happened, so the
   * reason code in the row can be read back to the delivery it came from.
   *
   * The signal is passed through untouched. It is raised by the other side of the race and never
   * here, and a work that ignores it reaches this `catch` or this `return` exactly as it did
   * before the signal existed.
   *
   * @param {AiRunWorkParams} params - Parameters.
   * @returns {Promise<AiRunWorkOutcome>} The outcome.
   * @public
   */
  async buildAiRunWorkOutcome ({
    body,
    context,
    parcel,
    signal,
  }) {
    try {
      const resultBody = await this.executeAiRunWork({
        body,
        context,
        parcel,
        signal,
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

      const failureParameters = this.extractAiRunFailureParameters({
        error,
      })

      const aiRunId = this.extractAiRunId({
        body,
      })

      this.logFailedAiRunWork({
        aiRunId,
        failureReasonCode,
        error,
      })

      return {
        resultBody: null,
        failureReasonCode,
        failureParameters,
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
   * **The body it is handed carries the manifest's declared fields and nothing else**, which for
   * `BaseAiRunJobManifest` is the run's id alone. That is guaranteed by `#buildDeclaredJobBody()`
   * rather than by what callers happen to enqueue, so an implementation may read the declared
   * fields without checking them and will find nothing else there to read.
   *
   * **`signal` is raised when the run went past its time limit, and an implementation is expected
   * to stop when it is.** It is an `AbortSignal` of this class's own making — not
   * `parcel.signal`, which is BullMQ's and is unused here for the reason the class docblock gives.
   * An implementation honours it in the two ways a signal is honoured: handing it to whatever it
   * calls that takes one — `fetch`, a provider client, a promise-shaped timer — and asking
   * `signal.aborted` at the points between them where it could stop.
   *
   * **Nothing here can make an implementation honour it.** A work that ignores the signal runs on,
   * holding the worker slot it was given for as long as it lives; what changes is that it now does
   * so by its own choice, where before there was no choice to make. The run's row is already
   * settled by the time the signal is raised, so an implementation has nothing to record and
   * nothing to answer: the only useful thing left to do is stop.
   *
   * **Ask it before writing into the run's workspace.** A run that went past its limit has had its
   * temporary directory removed on the way out of `#executeJob()`, so a work that writes a fetched
   * file afterwards recreates a directory nothing will remove again. The signal is what tells a
   * work that this is where it stands.
   *
   * @abstract
   * @param {AiRunWorkParams} params - Parameters.
   * @returns {Promise<string | null>} The result the run settled.
   * @throws {ConcreteMemberNotFoundJobError} When the concrete job has not filled it in.
   * @public
   */
  async executeAiRunWork ({
    body,
    context,
    parcel,
    signal,
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
   * is handed in for exactly that. It is typed as anything rather than as an `Error`, because what
   * `#executeAiRunWork()` threw is whatever the service that wrote it threw - an override reading
   * a property off it has to reckon with that, as this file's own `#extractErrorName()` does.
   *
   * @param {{
   *   error: *
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
   * Extract the parameters recorded beside a thrown failure's reason code.
   *
   * **It answers null here, and that is the honest default rather than a placeholder.** A code
   * whose contract entry names no parameters has none to carry, and six of the seven are written
   * that way; only `MEDIA_LIMIT_EXCEEDED` says `parameters` carries the limit. A base class that
   * invented an object for the rest would put a shape into `ai_runs.failure_parameters` that no
   * client has been told how to read.
   *
   * It sits beside `#extractAiRunFailureReasonCode()` because the two answer one question between
   * them: what a failed row says happened. A job that classifies its own failures overrides both,
   * and one that classifies neither is still recorded under a code a reader can act on.
   *
   * The error is typed as anything for the reason its sibling states: what `#executeAiRunWork()`
   * threw is whatever the service that wrote it threw, so an override reading a property off it
   * has to reckon with that.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The parameters, or null when the code carries none.
   * @public
   */
  extractAiRunFailureParameters ({
    error,
  }) {
    return null
  }

  /**
   * Write the line a work that threw leaves behind.
   *
   * **The message the error carries is deliberately not repeated.** It is text this class did not
   * compose, and at a job fetching media or calling a provider it is built from the very thing the
   * run was about — a URL, a file name, a fragment of a medium — so repeating it would put the
   * payload into a file kept for operators. What is written instead is the run's id, the reason
   * code the row now carries and the error's own class, each of which this service already holds;
   * the three together are what tie a row to the delivery that failed it, and none of them is text
   * a caller chose.
   *
   * @param {{
   *   aiRunId: number | null
   *   failureReasonCode: string
   *   error: *
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logFailedAiRunWork ({
    aiRunId,
    failureReasonCode,
    error,
  }) {
    const errorName = this.extractErrorName({
      error,
    })

    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${FAILED_AI_RUN_WORK_MESSAGE}: AiRunId ${aiRunId}, ${failureReasonCode}, ${errorName}`,
      tags: FAILED_AI_RUN_WORK_TAGS,
    })
  }

  /**
   * Extract the name of the class a failure came back as.
   *
   * **The optional chaining is the whole method.** `error.constructor.name` was written at four
   * sites in this file, and a `throw null` or a `throw 'text'` makes every one of them raise a
   * `TypeError` from inside a `catch` or an event handler - which no `try` in this file catches,
   * because a `throw` inside a `catch` escapes the `try` that `catch` belongs to. At the first of
   * those sites that costs the run its terminal state, which is the one thing this class exists to
   * guarantee; at the site inside the workspace removal it would replace the delivery's own result
   * or an exception already on its way out, which is what the `finally` is there to prevent. One
   * method, asked by all four, so the guard cannot be kept at three of them.
   *
   * It is the class name and never the message, for the reason `#logFailedAiRunWork()` gives.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {string} The class name of the failure.
   * @public
   */
  extractErrorName ({
    error,
  }) {
    return error?.constructor?.name
      ?? UNNAMED_ERROR_NAME
  }

  /**
   * Build the outcome of a run that went past its time limit.
   *
   * **The work is told before the outcome is answered, and that order is the whole point.** The
   * caller writes the terminal state out of what this returns, so raising the signal first is what
   * puts the work's notice ahead of the row being settled rather than behind it.
   *
   * It reaches here only where the limit actually passed: the wait rejects when the alarm is
   * cancelled, which is what the race does the moment the work wins, so this line is not reached
   * for a run that ended well.
   *
   * @param {{
   *   aiRunWorkTerminator: AbortController
   *   timeLimitAlarmSignal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<AiRunWorkOutcome>} The outcome.
   * @public
   */
  async buildTimeLimitOutcome ({
    aiRunWorkTerminator,
    timeLimitAlarmSignal,
  }) {
    await this.waitOutRunTimeLimit({
      signal: timeLimitAlarmSignal,
    })

    this.abortAiRunWork({
      aiRunWorkTerminator,
    })

    return {
      resultBody: null,
      failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
      failureParameters: null,
    }
  }

  /**
   * Wait out the run's time limit.
   *
   * **The wait is cancellable, and that is what the signal is for.** A limit nobody is waiting on
   * any more is a timer that would still fire, and firing is not harmless here: it is what raises
   * the work's own signal, so a limit left running would tell a work that answered in time that
   * its run was over. Cancelling makes this reject rather than resolve, and the race that asked
   * for it has a handler on it already.
   *
   * The timer is unreferenced as well, so a wait that somehow outlives its cancellation holds
   * nothing open. The two are not one guard twice: cancelling is what keeps the alarm from firing,
   * and unreferencing is what keeps an alarm that was never cancelled from keeping the process
   * alive.
   *
   * The limit itself is what the wait resolves with — the second argument is what the promise
   * settles on — so the wait answers something a caller and a test can both read, rather than the
   * nothing a bare resolution would give them.
   *
   * @param {{
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<number>} The limit, once it has passed.
   * @throws {Error} When the alarm is cancelled before the limit passed.
   * @public
   */
  async waitOutRunTimeLimit ({
    signal,
  }) {
    return this.Ctor.timersPromises.setTimeout(
      this.runTimeLimitMilliseconds,
      this.runTimeLimitMilliseconds,
      {
        ref: false,
        signal,
      }
    )
  }

  /**
   * Raise the signal that tells a run's work the run is over.
   *
   * One line, in a member of its own, because it is the only place in this service where that
   * signal is raised — a reader asking "what can abort the work?" is answered by this method and
   * its single caller, and a test can state the raising without waiting out a limit.
   *
   * @param {{
   *   aiRunWorkTerminator: AbortController
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  abortAiRunWork ({
    aiRunWorkTerminator,
  }) {
    aiRunWorkTerminator.abort()
  }

  /**
   * Record the one terminal state the outcome names, and report what this delivery did.
   *
   * The branch the outcome decides, held in a member of its own so that its caller has one place
   * below it where both arms have already answered — which is where the terminal callback is
   * raised. The reason code is what tells the two apart: an outcome carrying one is a failure,
   * whichever side of the race produced it, and an outcome carrying none is a success even when
   * the run settled nothing, which is section 10's second criterion.
   *
   * @param {{
   *   aiRunId: number
   *   outcome: AiRunWorkOutcome
   * }} params - Parameters.
   * @returns {Promise<AiRunJobResult>} What this delivery did.
   * @public
   */
  async recordTerminalAiRunState ({
    aiRunId,
    outcome,
  }) {
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
   * Raise the terminal callback of a run this delivery settled.
   *
   * **The write is what decides, not the work.** `hasSettled` is the recorder's answer to the
   * conditional terminal write, and it is false for a delivery whose run settled between its claim
   * and its own write — the race `#executeJob()` already reports as a terminal write another
   * writer won. That delivery computed a result nothing accepted, so calling the client back from
   * here would be the second call about a run that has one writer, and the criterion this method
   * exists for says one. The writer that was accepted is the one that calls.
   *
   * **Nothing that happens inside the raiser reaches this delivery.** A queue it could not be
   * enqueued on is written down and swallowed there rather than raised, which is deliberate in
   * that class and stated in its own words: the run is already terminal, a terminal state is never
   * rewritten, and a retried delivery could not settle it again. So there is no `try` here — one
   * would catch nothing, and would suggest to a reader that the promise made there might not hold.
   *
   * @param {{
   *   aiRunId: number
   *   hasSettled: boolean
   * }} params - Parameters.
   * @returns {Promise<*>} What the raiser answered, or null when this delivery settled nothing.
   * @public
   */
  async raiseAiRunTerminalCallback ({
    aiRunId,
    hasSettled,
  }) {
    if (!hasSettled) {
      return null
    }

    const aiRunTerminalCallbackRaiser = this.createAiRunTerminalCallbackRaiser()

    return aiRunTerminalCallbackRaiser.raiseTerminalCallback({
      aiRunId,
    })
  }

  /**
   * Create the raiser of a settled run's terminal callback.
   *
   * The dispatcher is taken out of the hash the framework built at boot rather than created here,
   * because it holds a Redis connection that outlives every delivery — which is what the
   * declaration in `.collectAdditionalDispatcherCtorHash()` asks the framework for, and what the
   * raiser's own factory says it will not build for itself.
   *
   * @returns {AiRunTerminalCallbackRaiser} The raiser.
   * @public
   */
  createAiRunTerminalCallbackRaiser () {
    return this.Ctor.AiRunTerminalCallbackRaiserCtor.create({
      jobDispatcher: this.dispatcherHash[TERMINAL_CALLBACK_DISPATCHER_NAME],
    })
  }

  /**
   * Remove the temporary copies of the files this run fetched.
   *
   * **This is where section 18's fifth acceptance criterion is kept.** The criterion asks for the
   * deletion and says nothing about how the run ended, and the caller's `finally` is what puts this
   * method on every ending at once.
   *
   * **It is asked of every run, including every run that fetched nothing.** No job in this version
   * fetches a file — the step that will is section 20's second — and a run that fetched nothing has
   * no directory to remove. `AiRunMediaWorkspace#removeWorkspace()` removes an absent directory
   * without complaining, which is what lets this class know that a run *might* have a workspace and
   * never which runs do. A hook, not a use of one.
   *
   * **A removal that failed is written down and swallowed, and that is deliberate.** The run's
   * terminal state is already in the row by the time this runs, and a run that succeeded and then
   * could not delete a directory has still succeeded — the repository's rule is that a boundary
   * logs and swallows, and `#executeJob()` is the boundary the framework calls. Rethrowing would do
   * worse than report it: the call sits in a `finally`, so a throw from here would replace the
   * result the delivery was returning, or the exception it was already raising, with one about a
   * directory. The line it writes is the operator's evidence that a fetched file outlived its run,
   * and the null it answers is how a caller and a test tell the two outcomes apart.
   *
   * The workspace is built inside the `try` rather than above it for that same reason: what this
   * method promises its caller is that nothing leaves it, and a construction sitting outside would
   * make that true of part of the method instead of all of it.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<string | null>} The path removed, or null when the removal failed.
   * @public
   */
  async removeAiRunMediaWorkspace ({
    aiRunId,
  }) {
    try {
      const aiRunMediaWorkspace = this.createAiRunMediaWorkspace({
        aiRunId,
      })

      return await aiRunMediaWorkspace.removeWorkspace()
    } catch (error) {
      this.logFailedWorkspaceRemoval({
        aiRunId,
        error,
      })

      return null
    }
  }

  /**
   * Create the workspace holding one run's fetched files.
   *
   * The run is handed in rather than read from a property, because a worker is one long-lived
   * instance per queue and the run is what one delivery is about.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {AiRunMediaWorkspace} The workspace.
   * @public
   */
  createAiRunMediaWorkspace ({
    aiRunId,
  }) {
    return this.Ctor.AiRunMediaWorkspaceCtor.create({
      aiRunId,
    })
  }

  /**
   * Write the line a removal that failed leaves behind.
   *
   * The error's own message is not repeated, for the reason `#logFailedAiRunWork()` gives. What is
   * written is the run and the error's class, which are this service's own words, and together they
   * say which machine directory an operator has to go and look at.
   *
   * @param {{
   *   aiRunId: number
   *   error: *
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logFailedWorkspaceRemoval ({
    aiRunId,
    error,
  }) {
    const errorName = this.extractErrorName({
      error,
    })

    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${FAILED_WORKSPACE_REMOVAL_MESSAGE}: AiRunId ${aiRunId}, ${errorName}`,
      tags: FAILED_WORKSPACE_REMOVAL_TAGS,
    })
  }

  /**
   * Handle the queue reporting a delivery completed.
   *
   * Nothing is recorded against the run here. It reached its terminal state inside
   * `#executeJob()`, where the conditional write decided whether this delivery was the one that
   * settled it; a second write from an event handler could only undo that decision. The line this
   * writes is the queue's own event, carrying the status the delivery came from and nothing of
   * what the delivery answered.
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
   * The error's message is left where it was thrown, for the reason `#logFailedAiRunWork()` gives:
   * it is text this class did not compose, and a job that fetches media or calls a provider throws
   * with the payload in it. The status the delivery came from and the error's class are the
   * queue's own vocabulary and this service's, so they are what the line carries.
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
   * This is the queue connection failing rather than a run failing, so no run is named and there
   * is nothing to name one with. What is written is the error's class, on the same bound-message
   * rule the rest of this file keeps.
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
 * What one run's work is handed, and the whole of it.
 *
 * `signal` is this class's own, raised when the run went past its time limit. It is not
 * `parcel.signal`, which stays unused for the reason the class docblock gives.
 *
 * @typedef {{
 *   body: Record<string, *>
 *   context: InstanceType<ContextCtor>
 *   parcel: InstanceType<WorkerParcelCtor>
 *   signal: AbortSignal
 * }} AiRunWorkParams
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
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').JobBody} JobBodyCtor
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').WorkerParcel} WorkerParcelCtor
 */
