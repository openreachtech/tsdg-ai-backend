import {
  Op,
} from 'sequelize'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunInstantInspector from './AiRunInstantInspector.js'
import AiRunKeyInspector from './AiRunKeyInspector.js'
import AiRunTerminalStatusInspector from './AiRunTerminalStatusInspector.js'

import AI_RUN_STATUS_CONSTANT_HASH from '../constants/aiRunStatusConstants.js'

import {
  env,
  rootPath,
} from '../globals/_.js'

import AiRun from '../../sequelize/models/AiRun.js'

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

const UNKNOWN_AI_RUN_MESSAGE = 'refused a run that does not exist'
const SETTLED_AI_RUN_MESSAGE = 'refused a run already settled, which a run never leaves'
const OUTRACED_AI_RUN_MESSAGE = 'refused a run that had settled or gone by the time the write reached it'
const ABSENT_FAILURE_REASON_CODE_MESSAGE = 'refused a failed run carrying no reason code'
const REFUSED_AI_RUN_FIELD_MESSAGE = 'refused a field no transition of this class writes'
const ABSENT_AI_RUN_EVIDENCE_MESSAGE = 'refused a status the call carries no evidence for'
const INHERITED_AI_RUN_FIELD_MESSAGE = 'refused values carrying fields it did not state as its own'
const UNREADABLE_AI_RUN_VALUES_MESSAGE = 'refused values that are not a plain object'
const UNREADABLE_KEY_MESSAGE = 'refused a key that is not an id'

/*
 * What a field name looks like, so that a refusal can repeat one.
 *
 * A refused field name is the one thing this class reports that the caller chose the text of — the
 * keys of `values` are whatever the caller put there. Reporting it is worth keeping, because it is
 * how an operator knows which field to remove; reporting it unconditionally would mean a key built
 * out of something read from a medium reaching a log in full, which is the channel this class's own
 * rule about messages exists to close. So a name shaped like a field is repeated, and anything else
 * is reported by where it sat.
 */
const AI_RUN_FIELD_NAME_PATTERN = /^(?=.{1,64}$)[A-Za-z_][A-Za-z0-9_]*$/u
const UNKNOWN_AI_RUN_STATUS_MESSAGE = 'refused a status naming no master row'
const EMPTY_AI_RUN_EVIDENCE_MESSAGE = 'refused a status whose evidence field carries nothing'
const UNRECORDABLE_AI_RUN_INSTANT_MESSAGE = 'refused an instant field carrying something that is not an instant'

/*
 * The three refusals that say there is nothing left for a writer to do, whichever of them it was.
 *
 * They are one answer under three causes. The run had settled before the guard read it; it settled
 * between the read and the write; or there is no row at all. In every one of them the write this
 * writer asked for cannot be made now and cannot be made later either, which is what the boolean
 * spelling of a transition answers false for — see `#saveAiRunOnce()`.
 *
 * The third is here for a defect nobody in this application can close. A transaction whose COMMIT
 * fails still fires its `afterCommit` hooks, because Sequelize 6.37.8 runs them from a `finally`
 * after its `catch` has decided to re-throw — so a run whose commit failed still has its job
 * enqueued, and the worker that picks that job up finds no row. Nothing at the hook can tell that
 * case apart, so the agreed mitigation is the worker doing nothing about it, which it can only do
 * if this class answers rather than refuses. See Q86.
 *
 * Every other refusal this class raises is a defect in the call — an absent reason code, an id
 * that is no id, a status naming no master row, a value that is no instant — and a second delivery
 * of the same call would carry exactly the same defect. Those are raised, as they always were.
 */
const UNWRITABLE_AI_RUN_MESSAGES = [
  UNKNOWN_AI_RUN_MESSAGE,
  SETTLED_AI_RUN_MESSAGE,
  OUTRACED_AI_RUN_MESSAGE,
]

const UNWRITABLE_AI_RUN_REFUSAL_TAGS = [
  'AiRunTransition',
  'UnwritableAiRun',
]

const LOG_FILE_PATH = rootPath.to('logs/ai-run-transition-')

/*
 * One logger client per process, rather than one per refusal.
 *
 * The client owns a rotating file, and a queue redelivering a stalled job redelivers many at once —
 * which is exactly when this line is written. `@openreachtech/mentsu-logger` writes only under
 * `NODE_ENV=production`, so under the test and development environments this client is built and
 * then never asked to write.
 */
const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/*
 * The ids the status master actually carries, read from the constants the seeder seeds from.
 *
 * A status outside the five reaches no entry of the evidence hash below, so before this it needed
 * no evidence at all and was written straight through — a run could be moved to a status no master
 * row carries, and every read that joins the two would then find nothing.
 */
const AI_RUN_STATUS_IDS = Object.values(AI_RUN_STATUS)
  .map(it => it.ID)

/*
 * The evidence fields that are evidence by being stated, whatever they hold.
 *
 * `resultBody` is the reason this list exists: section 10's second criterion says a run whose
 * result is legitimately empty is a success, so a caller stating `resultBody: null` is recording a
 * run that settled nothing and must not be turned away. `failureParameters` is the same shape — the
 * contract gives only one of its seven reason codes any parameters at all, so null is the ordinary
 * case.
 *
 * Every other evidence field is evidence by carrying something. That distinction was missing, and
 * the justification written for `resultBody` had been silently extended to all of them: a failed
 * run reached the row with `failureReasonCode: null`, which is the very state the seeded record was
 * corrected for one commit earlier, and a succeeded run reached it with `finishedAt: null`, which
 * makes the cancellation gap the fifth criterion promises unmeasurable.
 */
const STATED_AI_RUN_EVIDENCE_FIELD_NAMES = [
  'resultBody',
  'failureParameters',
]

/*
 * The only fields a transition writes. Everything a run was accepted with — the client it belongs
 * to, its keys, its callback URL, its subject and its request body — is written once by
 * `AiRunAcceptor` and is not a transition's to reword; `content_purged_at` belongs to the retention
 * sweep, which is not a transition either.
 */
const WRITABLE_AI_RUN_FIELD_NAMES = [
  'AiRunStatusId',
  'startedAt',
  'finishedAt',
  'resultBody',
  'failureReasonCode',
  'failureParameters',
  'canceledAt',
  'cancelRequestedAt',
  'engineLabel',
]

/*
 * Which of the writable fields are instants, and therefore have a kind to be held to.
 *
 * The evidence rule below already refuses a missing instant wherever one is the evidence of a
 * status. What it cannot see is a value that is present and is not a time: Sequelize coerces
 * whatever it is handed into `datetime(3)`, so `'whenever'`, `{}` and `false` all settle as the
 * literal text `Invalid date` — and on a run that has just reached a terminal status, nothing may
 * ever write over it. `cancel_requested_at` is listed beside the other three although no status is
 * evidenced by it, because the fifth criterion measures the gap between it and `canceled_at`, and
 * a gap needs both of its ends.
 */
const AI_RUN_INSTANT_FIELD_NAMES = [
  'startedAt',
  'finishedAt',
  'canceledAt',
  'cancelRequestedAt',
]

/*
 * What each destination status is evidenced by, which is the whole reason there is one method per
 * status rather than one method taking a status. A sixth status is a sixth entry beside a sixth
 * method, and nothing already written changes. Queued is absent because a run is created queued and
 * is never moved there.
 */
const AI_RUN_STATUS_EVIDENCE_FIELD_NAMES_HASH = {
  [AI_RUN_STATUS.RUNNING.ID]: [
    'startedAt',
  ],
  [AI_RUN_STATUS.SUCCEEDED.ID]: [
    'resultBody',
    'finishedAt',
  ],
  [AI_RUN_STATUS.FAILED.ID]: [
    'failureReasonCode',
    'failureParameters',
    'finishedAt',
  ],
  [AI_RUN_STATUS.CANCELED.ID]: [
    'canceledAt',
    'finishedAt',
  ],
}

/**
 * Moves a run from one status to the next, and records what the move is evidenced by.
 *
 * **Why the transition is a class of its own.** `AiRunAcceptor` creates a run queued and writes
 * nothing about it afterwards; every later state a run reaches — running, succeeded, failed,
 * canceled — is reached from somewhere else entirely: a worker starting the job, the same worker
 * finishing it, a cancellation arriving over the API, the step loop honoring that cancellation.
 * Each of them is moving the same row under the same rule, so the rule is held here rather than
 * restated at four call sites that have nothing else in common.
 *
 * **A run never leaves succeeded, failed or canceled.** That rule is what `#saveOngoingAiRun()`
 * exists for: every public method here goes through it, it asks `AiRunTerminalStatusInspector`
 * whether the run has already settled, and it refuses the write when the answer is yes. The refusal
 * is an exception rather than a quiet no-op, because a caller that asked to record a failure and
 * was answered with nothing would carry on believing the failure was recorded. The two refusals —
 * a run that does not exist, and a run that has settled — each name themselves in the message, so
 * the caller's log says which one happened without the caller having to go and look.
 *
 * **The same rule is also carried by the row, and the two are not the same guard.** `AiRun`'s own
 * `setupHooks()` refuses a status move out of a terminal status, so a caller that never came
 * through this class cannot undo the rule with one line of `Model.update()`. That guard defends the
 * status and nothing else, because a settled run is still written to for reasons that are not
 * transitions — the content purge is one. This class is the stricter of the two: it refuses **any**
 * write against a settled run, because a caller that reached it was asking to record a transition.
 * Neither makes the other redundant, and the model's own comment names the paths it does not close.
 *
 * **What this class will write is bounded by name, not by what the caller passes.**
 * `#saveOngoingAiRun()` is reachable by anything holding a recorder, and the fields a transition
 * writes are few and known — so the ones that are not are refused by name rather than trusted.
 * A run's identity, its callback URL and its request body are written once, when the run is
 * accepted; the purge marker belongs to the retention sweep. A terminal status handed in without
 * the columns it is evidenced by is refused for the same reason: it is what the five methods below
 * are for, and a back door that wrote a bare status would defeat the one-method-per-status design
 * while leaving the row saying a run succeeded and nothing about when or with what.
 *
 * **One method per destination status, rather than one method taking a status.** What a status is
 * evidenced by differs per status: running is evidenced by the instant it started, succeeded by the
 * instant it finished and the result it settled, failed by that instant and a reason code, canceled
 * by the instant the cancellation took effect. A single method taking a status id would have to
 * take every one of those columns and decide which of them to write, and a sixth status later would
 * mean editing that decision. Here a sixth status is a sixth method, and nothing already written
 * changes.
 *
 * **What a succeeded run records, and what it does not.** `#saveSucceededAiRun()` writes no failure
 * reason and no failure parameters — not as an erasure, but because it never writes those columns
 * at all. A run reaching succeeded came from queued or running, and neither carries a reason code,
 * since the only status that records one is itself terminal and cannot be left. Nothing here looks
 * at the result either: a run that legitimately settled nothing succeeded, and a class that
 * measured the result to decide the status would turn an empty answer into a failure.
 *
 * **What a failed run must carry, and where that is refused.** The other half of the same rule is
 * that a failed run records a reason code, and `#saveFailedAiRun()` refuses a call that hands it
 * none. `failure_reason_code` is nullable on `ai_runs`, because the four other statuses reach the
 * row without one, so the column cannot be the thing that refuses here — where `AiRunStepRecorder`
 * answers null and lets a `NOT NULL` column turn the row away, the same principle has no column to
 * lean on and the refusal has to be in this class or nowhere. A failed run with no reason is a
 * failure nobody can act on: the client system builds the wording people read out of that code, and
 * a row without one says a run failed and refuses to say why, forever. The refusal is checked
 * before the run is read, because it is the call that is malformed rather than the row.
 *
 * **Cancellation is two instants, written by two callers at two moments.** `cancel_requested_at` is
 * when somebody asked, and it changes no status — the run goes on until the step loop reaches a
 * boundary. `canceled_at` is when it actually took effect, and that is the write that settles the
 * run. They are recorded by `#saveAiRunCancelRequest()` and `#saveCanceledAiRun()` respectively,
 * and neither writes the other's column, because the gap between the two is the measurement the
 * pair exists to make.
 *
 * **This class never reads a clock.** Every instant it records arrives on the call, which follows
 * `AiModelCallRecorder`: one transition then has exactly one instant, shared by everything that
 * judges it, and a test states both ends of a gap rather than mocking global time. A value that
 * could not be derived is never substituted here either — nothing is defaulted to "now" to fill a
 * column whose instant the caller did not have.
 *
 * **The guard reads the run and then writes it, which is two statements and not one — so the write
 * carries the rule as well.** A cancellation taking effect at the same instant a worker records
 * success could pass the guard on the stale status it read. `#run-record` left that window open and
 * named the feature that would have to close it: whichever of `#run-execution` and `#run-cancel`
 * first put two writers on one run. `#run-execution` is that feature — the queue delivers
 * at-least-once, so a worker whose job stalls has it re-queued and a second worker picks up a run
 * the first is still finishing. The terminal statuses are therefore in the `WHERE` of the
 * transition write itself, and the row decides: one affected row means this writer moved the run,
 * none means the run had settled or gone between the read and the write.
 * `#saveAiRunTransition()` is where that count is interpreted, and
 * `#buildUnsettledAiRunCondition()` is where the condition is stated, read from
 * `AiRunTerminalStatusInspector` so that the `WHERE` and the guard can never come to disagree about
 * which statuses are terminal.
 *
 * **A writer with nothing left to do is answered rather than refused, which is the second spelling
 * of the same three transitions.** `#run-execution` puts a queue in front of this class, and the
 * queue delivers at-least-once: a job whose worker stalled is re-delivered, so one delivery can
 * arrive at a run another delivery finished minutes ago, and two deliveries can be finishing the
 * same run at once. For that caller a refusal is the wrong shape — every duplicate delivery would
 * be marked failed and retried for as long as the queue keeps retrying it — so
 * `#saveRunningAiRunOnce()`, `#saveSucceededAiRunOnce()` and `#saveFailedAiRunOnce()` answer those
 * three transitions with a boolean instead. The throwing spelling stays for every caller that
 * wants a refusal naming itself.
 *
 * **False means one thing under three causes: there is nothing for this writer to do, and no later
 * attempt will change that.** The run had already settled when the guard read it; it settled
 * between the read and the write; or no run carries the id at all. A caller's action is the same
 * in all three — stop, and write nothing further — so it is told the one thing it acts on rather
 * than a cause to branch on. What differs is only what should be written down, and that is written
 * here, where the cause is still known, by `#logUnwritableAiRunRefusal()`.
 *
 * **The third cause is a mitigation and not a convenience.** Sequelize 6.37.8 runs a transaction's
 * `afterCommit` hooks from a `finally`, so a COMMIT that failed still dispatches the job it
 * registered — and the worker that picks that job up finds no row. Nothing at the hook can tell
 * that case apart, so what covers it is the worker doing nothing about it, which it can only do if
 * an absent run is answered rather than refused. See Q86.
 *
 * **The two spellings are one guard chain, because the second is written on top of the first.**
 * Each `~Once` method calls its throwing sibling, so every refusal — an unreadable key, a field no
 * transition writes, a status naming no master row, a status nothing evidences, an instant that is
 * not one, an absent failure reason — is raised by the same code, in the same order, and reported
 * in the same words whichever spelling the caller used. Each of those is a defect in the call, and
 * a second delivery of the same call would carry it unchanged, which is exactly why it is raised
 * rather than answered.
 *
 * **The read-then-write guard stays in front of it, and neither half makes the other redundant.**
 * The guard is what lets a refusal name itself and name the status the run had settled in, which an
 * affected-row count of zero cannot say — a caller answered with a bare zero could not tell a
 * settled run from a deleted one from a write it had made twice. The condition closes the one
 * instant between the two statements, which no guard reading a row beforehand can close. Both
 * answer by throwing, because a caller that asked for a transition to be recorded and was handed
 * back nothing would carry on believing the record exists.
 */
export default class AiRunStatusRecorder {
  /**
   * Constructor.
   *
   * @param {AiRunStatusRecorderParams} params - Parameters.
   */
  constructor ({
    aiRunTerminalStatusInspector,
    aiRunInstantInspector,
    aiRunKeyInspector,
  }) {
    this.aiRunTerminalStatusInspector = aiRunTerminalStatusInspector
    this.aiRunInstantInspector = aiRunInstantInspector
    this.aiRunKeyInspector = aiRunKeyInspector
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunStatusRecorder ? X : never} T, X
   * @param {AiRunStatusRecorderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunTerminalStatusInspector = this.createAiRunTerminalStatusInspector(),
    aiRunInstantInspector = this.createAiRunInstantInspector(),
    aiRunKeyInspector = this.createAiRunKeyInspector(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunTerminalStatusInspector,
        aiRunInstantInspector,
        aiRunKeyInspector,
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
   * get: the query operators the conditional write is stated with.
   *
   * Reached through a getter rather than referred to inside the method that needs it, so that the
   * one place this class touches Sequelize's own vocabulary is named, and a test can stand
   * something else in its place without reaching into the module registry.
   *
   * @returns {typeof Op} Operators.
   */
  static get sequelizeOperators () {
    return Op
  }

  /**
   * get: the one logger client this process writes through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
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
   * Create the inspector answering whether a value is an instant this service may record.
   *
   * @returns {AiRunInstantInspector} Inspector.
   */
  static createAiRunInstantInspector () {
    return AiRunInstantInspector.create()
  }

  /**
   * Create the inspector answering whether a value is a key of this feature.
   *
   * @returns {AiRunKeyInspector} Inspector.
   */
  static createAiRunKeyInspector () {
    return AiRunKeyInspector.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunStatusRecorder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunStatusRecorder} */ (this.constructor)
  }

  /**
   * Save a run as running, and answer whether this writer was the one that moved it.
   *
   * The spelling a queue worker claims a run with. A delivery answered false has nothing left to
   * do — the run has settled, or there is no run — and the queue's at-least-once delivery makes
   * that an ordinary event rather than a fault: the delivery stops there, and nothing it does
   * afterwards can reach the row.
   *
   * @param {{
   *   aiRunId: number
   *   startedAt: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether this writer moved the run: false when there is nothing for
   * it to do, and no later attempt will change that.
   * @throws {Error} When the call is malformed: an id that is no id, or an instant that is no
   * instant.
   * @public
   */
  async saveRunningAiRunOnce ({
    aiRunId,
    startedAt,
  }) {
    const saveAiRun = () => this.saveRunningAiRun({
      aiRunId,
      startedAt,
    })

    return this.saveAiRunOnce({
      saveAiRun,
    })
  }

  /**
   * Save a run as succeeded, and answer whether this writer was the one that settled it.
   *
   * @param {{
   *   aiRunId: number
   *   resultBody: string | null
   *   finishedAt: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether this writer settled the run: false when there is nothing
   * for it to do, and no later attempt will change that.
   * @throws {Error} When the call is malformed: an id that is no id, or an instant that is no
   * instant.
   * @public
   */
  async saveSucceededAiRunOnce ({
    aiRunId,
    resultBody,
    finishedAt,
  }) {
    const saveAiRun = () => this.saveSucceededAiRun({
      aiRunId,
      resultBody,
      finishedAt,
    })

    return this.saveAiRunOnce({
      saveAiRun,
    })
  }

  /**
   * Save a run as failed, and answer whether this writer was the one that settled it.
   *
   * A call carrying no reason code is refused here exactly as it is in the throwing spelling. It
   * is the call that is malformed rather than the row, and a second delivery of it would carry the
   * same defect — where answering false would say there was nothing to do, which is the one thing
   * that is not true of it.
   *
   * @param {SaveFailedAiRunParams} params - Parameters.
   * @returns {Promise<boolean>} Whether this writer settled the run: false when there is nothing
   * for it to do, and no later attempt will change that.
   * @throws {Error} When the call is malformed: an absent reason code, an id that is no id, or an
   * instant that is no instant.
   * @public
   */
  async saveFailedAiRunOnce ({
    aiRunId,
    failureReasonCode,
    failureParameters,
    finishedAt,
  }) {
    const saveAiRun = () => this.saveFailedAiRun({
      aiRunId,
      failureReasonCode,
      failureParameters,
      finishedAt,
    })

    return this.saveAiRunOnce({
      saveAiRun,
    })
  }

  /**
   * Record a transition through the spelling that refuses, and answer false where the refusal says
   * there was nothing to record.
   *
   * **The transition arrives as something to call rather than as a status to act on**, which is
   * what lets the two spellings share one guard chain instead of restating it. What runs here is
   * the public method the caller asked for, whole: its own argument checks, the guards of
   * `#saveOngoingAiRun()` in their own order, and the conditional write. Nothing about which
   * transition it is reaches this method, so a sixth transition needs nothing added to it.
   *
   * **Nothing is swallowed.** A refusal naming a defect in the call is rethrown as the transition
   * raised it, carrying the message that says which rule turned the call away. A refusal saying
   * the run cannot be written now or later is not discarded either: the caller is told the one
   * thing it acts on, and the cause — which only this method still knows — is written down before
   * it is dropped.
   *
   * @param {{
   *   saveAiRun: () => Promise<*>
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether the transition was recorded by this writer.
   * @throws {Error} Every refusal naming a defect in the call, as the transition itself raised it.
   * @public
   */
  async saveAiRunOnce ({
    saveAiRun,
  }) {
    try {
      await saveAiRun()

      return true
    } catch (error) {
      if (
        !this.isUnwritableAiRunRefusal({
          error,
        })
      ) {
        throw error
      }

      this.logUnwritableAiRunRefusal({
        error,
      })

      return false
    }
  }

  /**
   * Check whether a refusal says the run cannot be written by this writer now or by any writer
   * later.
   *
   * Three refusals say it: the run had already settled when the guard read it, it settled between
   * the read and the write, or no run carries the id. They are one answer to a caller and are
   * recognized together here, which is why this asks about the group rather than about any one of
   * them.
   *
   * **They are recognized by the sentences they were built from, and those sentences are constants
   * of this module rather than copies of them.** This class raises plain errors throughout, so
   * there is no class to ask about; asking for the same constants the messages are built out of is
   * what keeps the two from drifting into meaning different things, the way the `WHERE` and the
   * guard are kept together by reading their statuses from one inspector.
   *
   * **No other refusal of this class can be made to read as one of these.** Nothing a caller
   * supplies reaches a message here as free text: a run id is refused outright unless it reads as
   * an id, and a field name is repeated only when it is shaped like a field name. So each sentence
   * appears in exactly one message, built in exactly one place, and none of the three is a
   * substring of any other message this class raises.
   *
   * Anything that is not an error carrying a message is none of the three, and is rethrown by the
   * caller above under the same rule as everything else it does not recognize.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {boolean} Whether the refusal leaves nothing for a writer to do.
   * @public
   */
  isUnwritableAiRunRefusal ({
    error,
  }) {
    if (typeof error?.message !== 'string') {
      return false
    }

    return UNWRITABLE_AI_RUN_MESSAGES
      .some(it => error.message.includes(it))
  }

  /**
   * Write the line a refusal answered with false leaves behind.
   *
   * **The cause is known here and nowhere after here.** The caller is handed a boolean, because
   * its action is the same whichever of the three it was; the refusal's own message is what says
   * which, so it is written down at the one point that still holds it rather than thrown away with
   * the exception.
   *
   * **It is written at the level an ordinary event belongs on.** A queue that delivers
   * at-least-once redelivers a job whose run finished as a matter of course, so a warning per
   * duplicate would bury the lines an operator is actually watching for.
   *
   * The message is the refusal's own, which carries a run id and a status id and nothing else —
   * both already held to being ids before they reached it, so no text a caller chose is repeated
   * here.
   *
   * @param {{
   *   error: Error
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  logUnwritableAiRunRefusal ({
    error,
  }) {
    this.Ctor.mentsuLogger.log({
      message: error.message,
      tags: UNWRITABLE_AI_RUN_REFUSAL_TAGS,
    })
  }

  /**
   * Save a run as running, from the instant its work began.
   *
   * @param {{
   *   aiRunId: number
   *   startedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run.
   * @throws {Error} When no run carries the id, or when the run has already settled.
   * @public
   */
  async saveRunningAiRun ({
    aiRunId,
    startedAt,
  }) {
    return this.saveOngoingAiRun({
      aiRunId,
      values: {
        AiRunStatusId: AI_RUN_STATUS.RUNNING.ID,
        startedAt,
      },
    })
  }

  /**
   * Save a run as succeeded, with the result it settled.
   *
   * A result that settled nothing is still a success. The result arrives as the caller rendered it
   * and is written as it arrives — nothing here reads its size, so an empty one records a succeeded
   * run rather than a failed one. No failure reason is written, because a succeeded run has none.
   *
   * @param {{
   *   aiRunId: number
   *   resultBody: string | null
   *   finishedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run.
   * @throws {Error} When no run carries the id, or when the run has already settled.
   * @public
   */
  async saveSucceededAiRun ({
    aiRunId,
    resultBody,
    finishedAt,
  }) {
    return this.saveOngoingAiRun({
      aiRunId,
      values: {
        AiRunStatusId: AI_RUN_STATUS.SUCCEEDED.ID,
        resultBody,
        finishedAt,
      },
    })
  }

  /**
   * Save a run as failed, with the reason it failed for.
   *
   * The reason code and its parameters arrive from the caller, which is the only thing that knows
   * why the run ended the way it did. Neither is derived here, and neither is substituted when the
   * caller has none to give.
   *
   * A call carrying no reason code is refused rather than recorded, because a failed run that says
   * nothing about why it failed is the one thing this status exists to avoid. Absent means anything
   * that names no reason: null, nothing passed at all, the empty string, and a string holding only
   * whitespace — the code is a lookup key the client system turns into wording, and a key of blanks
   * looks present at the column while naming no reason any reader can resolve.
   *
   * @param {SaveFailedAiRunParams} params - Parameters.
   * @returns {Promise<*>} The saved run.
   * @throws {Error} When the reason code is absent, when no run carries the id, or when it settled.
   * @public
   */
  async saveFailedAiRun ({
    aiRunId,
    failureReasonCode,
    failureParameters,
    finishedAt,
  }) {
    if (
      !this.aiRunKeyInspector.isRecordableKey({
        key: aiRunId,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveFailedAiRun() ${UNREADABLE_KEY_MESSAGE}: field aiRunId`)
    }

    if (
      typeof failureReasonCode !== 'string'
      || failureReasonCode.trim() === ''
    ) {
      throw new Error(`${this.Ctor.name}#saveFailedAiRun() ${ABSENT_FAILURE_REASON_CODE_MESSAGE}: AiRunId ${aiRunId}`)
    }

    return this.saveOngoingAiRun({
      aiRunId,
      values: {
        AiRunStatusId: AI_RUN_STATUS.FAILED.ID,
        failureReasonCode,
        failureParameters,
        finishedAt,
      },
    })
  }

  /**
   * Save a run as canceled, from the instant the cancellation took effect.
   *
   * `canceledAt` is that instant, and `finishedAt` is when the run stopped doing work. Both arrive
   * on the call rather than one being copied from the other, because whether they coincide is the
   * caller's to state and not this class's to assume. Neither of them is the instant the
   * cancellation was asked for — that one is `#saveAiRunCancelRequest()`'s, and the gap between the
   * two is what the pair is recorded separately to measure.
   *
   * @param {{
   *   aiRunId: number
   *   canceledAt: Date
   *   finishedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run.
   * @throws {Error} When no run carries the id, or when the run has already settled.
   * @public
   */
  async saveCanceledAiRun ({
    aiRunId,
    canceledAt,
    finishedAt,
  }) {
    return this.saveOngoingAiRun({
      aiRunId,
      values: {
        AiRunStatusId: AI_RUN_STATUS.CANCELED.ID,
        canceledAt,
        finishedAt,
      },
    })
  }

  /**
   * Save the instant a cancellation was asked for, leaving the run's status where it is.
   *
   * Asking is not the same event as stopping. The run goes on until the step loop reaches a
   * boundary and honors the request, so this writes `cancel_requested_at` and no status at all; the
   * status moves when `#saveCanceledAiRun()` records the instant it took effect.
   *
   * @param {{
   *   aiRunId: number
   *   cancelRequestedAt: Date
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run.
   * @throws {Error} When no run carries the id, or when the run has already settled.
   * @public
   */
  async saveAiRunCancelRequest ({
    aiRunId,
    cancelRequestedAt,
  }) {
    return this.saveOngoingAiRun({
      aiRunId,
      values: {
        cancelRequestedAt,
      },
    })
  }

  /**
   * Save values against a run, on the condition that the run has not already settled.
   *
   * This is where the rule that a run never leaves succeeded, failed or canceled is enforced, and
   * it is enforced once for every caller above rather than per caller. A run that has settled, and
   * a run that is not there at all, are both refused by throwing: the caller asked for something to
   * be recorded, and a silent no-op would leave it believing the record exists.
   *
   * **What it will write, and what it refuses to.** The method is reachable by anything holding a
   * recorder, and what it was handed went to the row as it arrived — so a single call could reword
   * a run's callback URL, backdate its purge marker, or write a terminal status with none of the
   * columns that status is evidenced by. Two checks bound it. The first refuses a field no
   * transition writes, by name: a run's identity and its callback URL are written once when the run
   * is accepted, and the purge marker belongs to the retention sweep. The second refuses a status
   * the call carries no evidence for — a succeeded run that names no finished instant and no result
   * is the shape `#saveSucceededAiRun()` exists to make impossible, and a caller reaching this
   * method directly must carry the same columns that method does.
   *
   * Both are refused by throwing and before the run is read, for the same reason the absent reason
   * code is: it is the call that is malformed rather than the row, and a call that quietly wrote
   * some of what it was handed would leave a false record behind while answering as if it had not.
   * The evidence check reads whether the field was named, not whether its value is plausible — a
   * caller stating `resultBody: null` is recording a run that settled nothing, which is a success.
   *
   * @param {{
   *   aiRunId: number
   *   values: Record<string, *>
   * }} params - Parameters.
   * @returns {Promise<*>} The saved run.
   * **The guard in here is the first of two halves, and the write is the second.** What this
   * method reads is the run as it stood a statement ago; what `#saveAiRunTransition()` writes is
   * conditional on the run still standing that way. See the class docblock for why both are kept.
   * @throws {Error} When a field is not a transition's, when the status it moves to is not
   * evidenced, when no run carries the id, when the run has already settled, or when it settled or
   * went between the read and the write.
   * @public
   */
  async saveOngoingAiRun ({
    aiRunId,
    values,
  }) {
    if (
      !this.aiRunKeyInspector.isRecordableKey({
        key: aiRunId,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${UNREADABLE_KEY_MESSAGE}: field aiRunId`)
    }

    if (
      !this.isReadableAiRunValues({
        values,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${UNREADABLE_AI_RUN_VALUES_MESSAGE}: AiRunId ${aiRunId}`)
    }

    if (
      !this.isRecordableAiRunValues({
        values,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${INHERITED_AI_RUN_FIELD_MESSAGE}: AiRunId ${aiRunId}`)
    }

    if (
      Object.hasOwn(values, 'AiRunStatusId')
      && !AI_RUN_STATUS_IDS.includes(values.AiRunStatusId)
    ) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${UNKNOWN_AI_RUN_STATUS_MESSAGE}: AiRunId ${aiRunId}, field AiRunStatusId`)
    }

    const refusedAiRunFieldName = this.extractRefusedAiRunFieldName({
      values,
    })

    if (refusedAiRunFieldName) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${REFUSED_AI_RUN_FIELD_MESSAGE}: AiRunId ${aiRunId}, field ${refusedAiRunFieldName}`)
    }

    const absentAiRunEvidenceFieldName = this.extractAbsentAiRunEvidenceFieldName({
      values,
    })

    if (absentAiRunEvidenceFieldName) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${ABSENT_AI_RUN_EVIDENCE_MESSAGE}: AiRunId ${aiRunId}, AiRunStatusId ${values.AiRunStatusId}, field ${absentAiRunEvidenceFieldName}`)
    }

    const emptyAiRunEvidenceFieldName = this.extractEmptyAiRunEvidenceFieldName({
      values,
    })

    if (emptyAiRunEvidenceFieldName) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${EMPTY_AI_RUN_EVIDENCE_MESSAGE}: AiRunId ${aiRunId}, AiRunStatusId ${values.AiRunStatusId}, field ${emptyAiRunEvidenceFieldName}`)
    }

    const unrecordableAiRunInstantFieldName = this.extractUnrecordableAiRunInstantFieldName({
      values,
    })

    if (unrecordableAiRunInstantFieldName) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${UNRECORDABLE_AI_RUN_INSTANT_MESSAGE}: AiRunId ${aiRunId}, field ${unrecordableAiRunInstantFieldName}`)
    }

    const aiRun = await this.findAiRun({
      aiRunId,
    })

    if (!aiRun) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${UNKNOWN_AI_RUN_MESSAGE}: AiRunId ${aiRunId}`)
    }

    if (
      this.aiRunTerminalStatusInspector.isTerminalAiRunStatus({
        aiRunStatusId: aiRun.AiRunStatusId,
      })
    ) {
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${SETTLED_AI_RUN_MESSAGE}: AiRunId ${aiRunId}, AiRunStatusId ${aiRun.AiRunStatusId}`)
    }

    const recordableValues = this.buildRecordableAiRunValues({
      values,
    })

    return this.saveAiRunTransition({
      aiRunId,
      values: recordableValues,
    })
  }

  /**
   * Check whether the values handed in are a plain object at all.
   *
   * `null`, the argument left unstated, a string, a number, a boolean, a function. None of them is
   * an object whose fields can be read as a record, so none of them is the defect the refusal below
   * describes — and for one commit all of them reported it anyway, which is the same misstatement
   * this class was corrected for twice already.
   *
   * An earlier wording here said none of them carries a field. That is false of a function, which
   * carries `name` and `length` and whatever was assigned to it, and of a string, which carries
   * `length` — and a docblock stating something untrue is the family this whole sequence of rounds
   * has been about.
   *
   * **Only `null` and the unstated argument would have faulted**, which an earlier wording here
   * overstated: `Object.getPrototypeOf()` has coerced primitives since ES2015, so a string answers
   * `String.prototype` rather than throwing. The two that do throw are reason enough to ask first,
   * and the rest are here because the answer is the same for all of them — this is not an object
   * whose fields can be read.
   *
   * @param {{
   *   values: *
   * }} params - Parameters.
   * @returns {boolean} Whether the values are a plain object.
   * @public
   */
  isReadableAiRunValues ({
    values,
  }) {
    if (values === null) {
      return false
    }

    return typeof values === 'object'
  }

  /**
   * Check whether the values handed in state every field they carry as their own.
   *
   * What it turns away is state this class cannot see: a prototype carrying fields, because
   * Sequelize's own setter walks the chain while the allow-list is read from own keys, and the two
   * disagreeing about what a field is was how a run's callback URL once reached the column.
   *
   * **A null prototype passes, and for one commit it did not.** `Object.create(null)` has no chain
   * at all, so every field it carries is its own — it is the one shape that cannot hold the hazard,
   * and refusing it under a message saying it carried inherited fields stated the exact opposite of
   * what was true.
   *
   * @param {{
   *   values: object
   * }} params - Parameters.
   * @returns {boolean} Whether the values are recordable.
   * @public
   */
  isRecordableAiRunValues ({
    values,
  }) {
    const prototype = Object.getPrototypeOf(values)

    if (prototype === null) {
      return true
    }

    return prototype === Object.prototype
  }

  /**
   * Extract the name of the first field the caller handed that no transition writes.
   *
   * @param {{
   *   values: Record<string, *>
   * }} params - Parameters.
   * @returns {string | null} The field name, or null when every field is a transition's to write.
   * @public
   */
  extractRefusedAiRunFieldName ({
    values,
  }) {
    const fieldNames = Object.keys(values)

    const refusedIndex = fieldNames
      .findIndex(it => !WRITABLE_AI_RUN_FIELD_NAMES.includes(it))

    if (refusedIndex < 0) {
      return null
    }

    return this.generateReportableFieldName({
      fieldName: fieldNames[refusedIndex],
      index: refusedIndex,
    })
  }

  /**
   * Generate the way a refused field is named in a message.
   *
   * A name shaped like a field is repeated, because that is what tells an operator which field to
   * remove. Anything else is a key the caller built out of something this class cannot vouch for,
   * so it is reported by where it sat instead — the position is enough to find it, and the text
   * does not reach a log.
   *
   * @param {{
   *   fieldName: string
   *   index: number
   * }} params - Parameters.
   * @returns {string} The name to report.
   * @public
   */
  generateReportableFieldName ({
    fieldName,
    index,
  }) {
    return AI_RUN_FIELD_NAME_PATTERN.test(fieldName)
      ? fieldName
      : `the field at position ${index + 1}`
  }

  /**
   * Build the values this class will write, out of the fields it states it writes.
   *
   * The allow-list above says what may be written; this says what *is* written, and the two are not
   * the same guarantee. The list is read with `Object.keys`, which sees a caller's own fields;
   * Sequelize's own setter walks the prototype chain, so a `values` carrying an inherited
   * `callbackUrl` passed the list and reached the column — a security audit redirected a run's
   * callback to another host that way, through the public method, after the list was already in
   * place.
   *
   * A prototype-bearing `values` is refused outright before this runs, so nothing is dropped
   * silently; this exists so that a guard and a write can never disagree about what a field is
   * again, whatever a later caller hands over.
   *
   * **No test can reach it while the refusal stands in front, and the two halves are not the equals
   * an earlier wording here made them out to be.** Replacing this with the caller's own object
   * survives every test in the suite, which is what "behind a refusal" means and not a gap in the
   * tests. What that earlier wording had backwards is which half carries the guarantee: this one
   * does. With the build in place every key that reaches `aiRun.update()` comes off the allow-list
   * by construction, so no prototype, no non-enumerable property and no symbol can put a field
   * through it — whereas the refusal in front only turns away the one shape that was found. The
   * refusal is the redundant half, kept because a caller reaching past what it stated is worth
   * saying out loud rather than silently dropping; this is the half that would still hold if a
   * later hand softened it.
   *
   * @param {{
   *   values: Record<string, *>
   * }} params - Parameters.
   * @returns {Record<string, *>} The values to write.
   */
  buildRecordableAiRunValues ({
    values,
  }) {
    const recordableEntries = WRITABLE_AI_RUN_FIELD_NAMES
      .filter(it => Object.hasOwn(values, it))
      .map(it => [it, values[it]])

    return Object.fromEntries(recordableEntries)
  }

  /**
   * Extract the name of the first evidence field that was stated and carries nothing.
   *
   * Being named is evidence only for the two fields whose emptiness is itself a statement — a
   * result that settled nothing, and a reason that takes no parameters. For every other, a null or
   * a blank is the absence the status was supposed to be evidenced against.
   *
   * @param {{
   *   values: Record<string, *>
   * }} params - Parameters.
   * @returns {string | null} The field name, or null when each carries something.
   */
  extractEmptyAiRunEvidenceFieldName ({
    values,
  }) {
    const evidenceFieldNames = AI_RUN_STATUS_EVIDENCE_FIELD_NAMES_HASH[values.AiRunStatusId]
      ?? []

    return evidenceFieldNames
      .filter(it => !STATED_AI_RUN_EVIDENCE_FIELD_NAMES.includes(it))
      .find(it => !this.carriesAiRunEvidence({
        evidence: values[it],
      }))
      ?? null
  }

  /**
   * Check whether a value stands as evidence of the status it was handed with.
   *
   * @param {{
   *   evidence: *
   * }} params - Parameters.
   * @returns {boolean} Whether it carries something.
   */
  carriesAiRunEvidence ({
    evidence,
  }) {
    if (evidence === null) {
      return false
    }

    if (typeof evidence === 'undefined') {
      return false
    }

    return typeof evidence === 'string'
      ? evidence.trim() !== ''
      : true
  }

  /**
   * Extract the name of the first instant field the call states with something that is not an instant.
   *
   * A field stated as `null` is not read here. Absence is the evidence rule's question, and it
   * answers it per status — refusing a missing `finished_at` on a run that just succeeded, allowing
   * one on a run that is only starting. This asks the other question, of whatever is present: a
   * value that is not a time coerces to the text `Invalid date` on the way into the column, where it
   * is both wrong and invisible to a search for the absence it should have been.
   *
   * @param {{
   *   values: Record<string, *>
   * }} params - Parameters.
   * @returns {string | null} The field name, or null when every stated instant is one.
   * @public
   */
  extractUnrecordableAiRunInstantFieldName ({
    values,
  }) {
    return AI_RUN_INSTANT_FIELD_NAMES
      .filter(it => Object.hasOwn(values, it))
      .filter(it => values[it] !== null)
      .find(it => !this.aiRunInstantInspector.isRecordableInstant({
        instant: values[it],
      }))
      ?? null
  }

  /**
   * Extract the name of the first field the status being written is evidenced by and the call omits.
   *
   * A status this class knows nothing about is evidenced by nothing, and a call naming no status is
   * moving the run nowhere — both answer null, and the run's status is left where it stands.
   *
   * @param {{
   *   values: Record<string, *>
   * }} params - Parameters.
   * @returns {string | null} The field name, or null when the status is evidenced.
   * @public
   */
  extractAbsentAiRunEvidenceFieldName ({
    values,
  }) {
    const evidenceFieldNames = AI_RUN_STATUS_EVIDENCE_FIELD_NAMES_HASH[values.AiRunStatusId]
      ?? []

    const namedFieldNames = Object.keys(values)

    return evidenceFieldNames
      .find(it => !namedFieldNames.includes(it))
      ?? null
  }

  /**
   * Save a transition against a run, on the condition that the row still admits one.
   *
   * The guard above read the run and found it unsettled. This writes on the condition that it is
   * still unsettled at the instant the write lands, so the two statements cannot be pulled apart by
   * a second writer arriving between them. The row answers with a count rather than with a status:
   * one row moved means this writer is the one that moved it, and none means the run no longer
   * matched the condition it was written under — it had settled, or it was no longer there.
   *
   * **Zero is refused rather than returned**, for the reason every other refusal in this class is:
   * the caller asked for a transition to be recorded, and nothing was. A worker answered with the
   * run as it stands would read the terminal status another worker wrote and take it for its own.
   * The message says what is true of every call that reaches it — the run had settled or gone —
   * rather than naming a cause the count cannot distinguish.
   *
   * **A call that writes no column is not a lost race, and is not reported as one.** Nothing this
   * class writes was named, so no row could match a write of no columns however the run stands, and
   * a count of zero there says nothing about a second writer. Such a call moves the run nowhere and
   * is answered with the run as it stands, which is what the write it asked for would have left.
   *
   * @param {{
   *   aiRunId: number
   *   values: Record<string, *>
   * }} params - Parameters.
   * @returns {Promise<*>} The run as the row now stands.
   * @throws {Error} When the run had settled or gone by the time the write reached it.
   * @public
   */
  async saveAiRunTransition ({
    aiRunId,
    values,
  }) {
    const writtenFieldNames = Object.keys(values)

    if (writtenFieldNames.length === 0) {
      return this.findAiRun({
        aiRunId,
      })
    }

    const affectedAiRunCount = await this.saveUnsettledAiRunValues({
      aiRunId,
      values,
    })

    if (affectedAiRunCount === 0) {
      throw new Error(`${this.Ctor.name}#saveAiRunTransition() ${OUTRACED_AI_RUN_MESSAGE}: AiRunId ${aiRunId}`)
    }

    return this.findAiRun({
      aiRunId,
    })
  }

  /**
   * Save values against a run while it carries a status it can still leave, and answer how many
   * rows that matched.
   *
   * **Why this is a write with a `where` rather than a write through the loaded instance.** An
   * instance write addresses the row by its key alone, so the rule about terminal statuses can only
   * be applied by something that read the row first — which is the gap this exists to close. Naming
   * the rule in the `WHERE` hands it to the database, where the read and the write are one
   * statement.
   *
   * **The model's own guard stays on, and the condition is what satisfies it.** `AiRun`'s
   * `beforeBulkUpdate` refuses a `Model.update()` that writes `AiRunStatusId` unless the `where`
   * the caller stated compiles to the condition the model itself builds for one unsettled run —
   * an update that cannot match a settled run cannot move one out of a status a run never leaves,
   * whatever status it writes. That is exactly the condition `#buildUnsettledAiRunCondition()`
   * builds, so this write goes through the hook rather than around it with `hooks: false`, and
   * the model then makes the write under its own copy of it rather than under the object handed
   * over here. The two are built from one inspector's ids, which is what keeps them the same
   * condition; were they to drift apart, this write would start being refused rather than
   * quietly widening. What is given up is the row-level
   * `beforeUpdate` guard, which the instance write this replaced did reach — and which could never
   * have fired on this path, because the guard in front refuses a settled run before anything is
   * written. What replaces it is the stricter rule of the two: `beforeUpdate` refuses a status move
   * out of a terminal status, and this condition refuses **any** write to a run that has reached
   * one, in the same statement that performs it.
   *
   * **The condition is what carries the guarantee, so it is never softened.** Take the status out
   * of the `WHERE` and this becomes an unconditional bulk write — which `AiRun`'s hook refuses
   * outright, so the line that would undo the rule does not reach the table at all. Restate the
   * same exclusion in any other words and the hook refuses that too: what it accepts is one
   * rendering, and this is the class that writes it.
   *
   * @param {{
   *   aiRunId: number
   *   values: Record<string, *>
   * }} params - Parameters.
   * @returns {Promise<number>} Rows the condition matched: one when this writer moved the run, zero
   * when it no longer stood as it was read.
   * @public
   */
  async saveUnsettledAiRunValues ({
    aiRunId,
    values,
  }) {
    const unsettledAiRunCondition = this.buildUnsettledAiRunCondition({
      aiRunId,
    })

    const [affectedAiRunCount] = /** @type {*} */ (
      await this.Ctor.AiRunCtor.update(
        values,
        {
          where: unsettledAiRunCondition,
        }
      )
    )

    return affectedAiRunCount
  }

  /**
   * Build the condition a transition write is made under.
   *
   * The run is located by its id, and the terminal statuses are stated as the ones it must not
   * already carry. Which statuses those are is read from `AiRunTerminalStatusInspector`, the same
   * answer the guard above asks for — written here as literals, the `WHERE` and the guard would
   * agree right up until a sixth status was added to one of them.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Record<string, *>} The condition.
   * @public
   */
  buildUnsettledAiRunCondition ({
    aiRunId,
  }) {
    const { terminalAiRunStatusIds } = this.aiRunTerminalStatusInspector
    const notInOperator = this.Ctor.sequelizeOperators.notIn

    return {
      id: aiRunId,
      AiRunStatusId: {
        [notInOperator]: terminalAiRunStatusIds,
      },
    }
  }

  /**
   * Find the run a transition is about.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The run, or null when no run carries the id.
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
      })
    )
  }
}

/**
 * @typedef {{
 *   aiRunTerminalStatusInspector: AiRunTerminalStatusInspector
 *   aiRunInstantInspector: AiRunInstantInspector
 *   aiRunKeyInspector: AiRunKeyInspector
 * }} AiRunStatusRecorderParams
 */

/**
 * @typedef {Partial<AiRunStatusRecorderParams>} AiRunStatusRecorderFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   failureReasonCode: string
 *   failureParameters: Record<string, *> | null
 *   finishedAt: Date
 * }} SaveFailedAiRunParams
 */
