import AiRunInstantInspector from './AiRunInstantInspector.js'
import AiRunTerminalStatusInspector from './AiRunTerminalStatusInspector.js'

import AI_RUN_STATUS_CONSTANT_HASH from '../constants/aiRunStatusConstants.js'

import AiRun from '../../sequelize/models/AiRun.js'

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

const UNKNOWN_AI_RUN_MESSAGE = 'refused a run that does not exist'
const SETTLED_AI_RUN_MESSAGE = 'refused a run already settled, which a run never leaves'
const ABSENT_FAILURE_REASON_CODE_MESSAGE = 'refused a failed run carrying no reason code'
const REFUSED_AI_RUN_FIELD_MESSAGE = 'refused a field no transition of this class writes'
const ABSENT_AI_RUN_EVIDENCE_MESSAGE = 'refused a status the call carries no evidence for'
const INHERITED_AI_RUN_FIELD_MESSAGE = 'refused values carrying fields it did not state as its own'
const UNREADABLE_AI_RUN_VALUES_MESSAGE = 'refused values this method cannot read as an object at all'
const UNKNOWN_AI_RUN_STATUS_MESSAGE = 'refused a status naming no master row'
const EMPTY_AI_RUN_EVIDENCE_MESSAGE = 'refused a status whose evidence field carries nothing'
const UNRECORDABLE_AI_RUN_INSTANT_MESSAGE = 'refused an instant field carrying something that is not an instant'

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
 * **The guard reads the run and then writes it, which is two statements and not one.** A
 * cancellation taking effect at the same instant a worker records success could pass the guard on
 * the stale status it read. Closing that window means a conditional write — the terminal statuses
 * in the `WHERE` — and an affected-row count to interpret, neither of which this feature has a
 * caller for yet: nothing dispatches a run and nothing cancels one until `#run-execution` and
 * `#run-cancel`. Whichever of them introduces the second concurrent writer is where the window has
 * to be closed.
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
  }) {
    this.aiRunTerminalStatusInspector = aiRunTerminalStatusInspector
    this.aiRunInstantInspector = aiRunInstantInspector
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
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunTerminalStatusInspector,
        aiRunInstantInspector,
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
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunStatusRecorder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunStatusRecorder} */ (this.constructor)
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
   * @throws {Error} When a field is not a transition's, when the status it moves to is not
   * evidenced, when no run carries the id, or when the run has already settled.
   * @public
   */
  async saveOngoingAiRun ({
    aiRunId,
    values,
  }) {
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
      throw new Error(`${this.Ctor.name}#saveOngoingAiRun() ${UNKNOWN_AI_RUN_STATUS_MESSAGE}: AiRunId ${aiRunId}, AiRunStatusId ${values.AiRunStatusId}`)
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

    return aiRun.update(recordableValues)
  }

  /**
   * Check whether the values handed in are something this method can read at all.
   *
   * `null`, a string, a number, and the argument left unstated. None of them carries a field, so
   * none of them is the defect the refusal below describes — and for one commit all four reported
   * it anyway, which is the same misstatement this class was corrected for twice already. They are
   * also what `Object.getPrototypeOf()` faults on, so asking first is what lets both refusals name
   * themselves instead of one of them arriving as a bare `TypeError` naming neither the defect nor
   * the run.
   *
   * @param {{
   *   values: *
   * }} params - Parameters.
   * @returns {boolean} Whether the values can be read as an object.
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
   * A plain object, and nothing else. What it turns away is state this class cannot see: a
   * prototype, because Sequelize's own setter walks the chain while the allow-list is read from own
   * keys, and the two disagreeing about what a field is was how a run's callback URL once reached
   * the column.
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
    return Object.getPrototypeOf(values) === Object.prototype
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
    return Object.keys(values)
      .find(it => !WRITABLE_AI_RUN_FIELD_NAMES.includes(it))
      ?? null
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
