import {
  Op,
} from 'sequelize'

import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

import AiRunTerminalStatusInspector from '../../app/aiRun/AiRunTerminalStatusInspector.js'

const AI_RUN_STATUS_ATTRIBUTE_NAME = 'AiRunStatusId'

const REFUSED_SETTLED_TRANSITION_MESSAGE = 'AiRun refuses a move out of a status a run never leaves'

/*
 * The message says the rule as it stands, not as it once stood.
 *
 * It read "refused when it writes AiRunStatusId" while that was the whole rule. It is not any
 * longer — an update whose `where` already excludes every terminal status is accepted, because it
 * can match no settled run and therefore cannot move one out of a status a run never leaves. A
 * refusal naming a rule stricter than the one it applies would send a reader looking for a defect
 * in the wrong place.
 */
const REFUSED_BULK_STATUS_UPDATE_MESSAGE = 'AiRun.update() writing AiRunStatusId is refused unless its where excludes every terminal status. Move the run through AiRunStatusRecorder.'

/**
 * AiRun model
 *
 * **A run never leaves succeeded, failed or canceled.** That is the first acceptance criterion of
 * `#run-record`, and `AiRunStatusRecorder` is where the application enforces it. `setupHooks()`
 * enforces the same rule at the row, so that a caller reaching this table without going through
 * that class cannot quietly undo it. The two are not a duplication: the recorder refuses **every**
 * write against a settled run, because a caller that reached it was asking to record a transition;
 * the model refuses only a **status move out of** a terminal status, because a settled run is still
 * written to for reasons that are not transitions — the content purge stamps `content_purged_at` on
 * runs that finished long ago, and a guard that refused that would break the retention promise
 * instead of keeping it.
 *
 * **What the two hooks each close, and why there are two.** `beforeUpdate` sees the row, so it can
 * compare the status being written against the one the row already carries; it is reached by
 * `instance.save()`, by `instance.update()`, and by `Model.update()` when the caller passes
 * `individualHooks`. `Model.update()` on its own reaches `beforeBulkUpdate` only
 * (`sequelize/lib/model.js`, `update()`: `individualHooks` defaults to false and the per-row hooks
 * live inside that branch), and at that point no row has been read, so nothing there can judge a
 * status against the one it would replace. A bulk update that writes anything but the status still
 * runs — it cannot move a status it does not write.
 *
 * **A bulk update that writes the status is refused unless its own `where` proves it cannot break
 * the rule.** What the rule forbids is a run moving **out of** a terminal status. An update whose
 * `where` states that the rows it matches carry none of the terminal statuses cannot make that
 * move, whatever status it writes. **The proof is the whole of the status condition, and not one
 * key found inside it.** Sequelize compiles a column's condition object as a unit, and an
 * `Op.notIn` standing beside a sibling key on the same column need not survive that compilation:
 * `{ [Op.notIn]: [3, 4, 5], [Op.and]: [{ [Op.gte]: 1 }] }` compiles to
 * `` (`ai_run_status_id` >= 1) `` alone, in either key order, and `Op.or` in place of `Op.and`
 * does the same. A guard reading only the `Op.notIn` key therefore read a proof the database was
 * never shown, and a canceled run was walked back to running under exactly that shape. So what is
 * accepted is the status condition being `Op.notIn` over an array and nothing else at all — the
 * one shape whose `NOT IN` is certain to reach the statement. That is what
 * `AiRunStatusRecorder#buildUnsettledAiRunCondition()` builds, which is how the recorder's own
 * transition write goes through this hook rather than around it with `hooks: false`.
 *
 * **The proof is strict, and anything short of it is the refusal.** A `where` that merely mentions
 * the status column proves nothing; one that excludes only some of the terminal statuses proves
 * nothing either; a condition stated with any operator but `Op.notIn`, or with `Op.notIn` and a
 * second key of any kind beside it, is one this class cannot read, and an unreadable proof is no
 * proof. A sibling Sequelize does keep — `Op.gte` beside `Op.notIn` emits both halves — is refused
 * with the rest, because sorting the siblings it keeps from the ones it drops would put this class
 * in the business of predicting a query compiler, and the prediction would be re-decided by every
 * Sequelize release. Each of them is refused by name exactly as every bulk status write was
 * before. Which statuses are terminal is read from `AiRunTerminalStatusInspector` — the same
 * answer `AiRunStatusRecorder` builds its `where` out of, so the proof and the thing being proved
 * can never come to disagree about what a terminal status is.
 *
 * **What neither hook closes.** `.upsert()` reaches `beforeUpsert` / `afterUpsert` and no per-row
 * hook, with no `individualHooks` option to turn into one; `.bulkCreate()` with `updateOnDuplicate`
 * is the same write spelled differently. `Model.update({ hooks: false })` and
 * `instance.save({ hooks: false })` switch the guard off by asking. `queryInterface` and raw SQL
 * reach no model hook at all, which is what the seeders depend on. `.destroy()` removes the run
 * rather than moving it, so it is not this rule's to refuse.
 *
 * Two more, and both were got wrong the first time this list was written.
 *
 * **`.increment()` and `.decrement()` do move a status**, and the earlier claim that no status is
 * reached by arithmetic was simply false — `run.increment('AiRunStatusId', { by: 1 })` emits
 * `SET ai_run_status_id = ai_run_status_id + 1` and walked a run from succeeded to failed under a
 * re-audit's probe. They reach their own hooks and neither of ours.
 *
 * **A fabricated instance passes the row-reading guard**, because `beforeUpdate` judges against
 * `entity.previous()` and an instance built by hand supplies that itself:
 * `AiRun.build({ id, AiRunStatusId: 1 }, { isNewRecord: false })`, then a save, moved a settled run.
 *
 * Nothing in this application takes any of those paths against `ai_runs` today, and each is a
 * deliberate act by a caller rather than something reached by accident.
 *
 * **Read the list as the paths known to go around the hook, and not as a bound on what can move a
 * settled run.** It has been wrong twice. Once by claiming no status is reached by arithmetic,
 * which `increment` disproved. Once by omission that no list of this kind could have covered: the
 * `Op.notIn` a sibling operator hides, above, moved a settled run without going around the hook at
 * all — it went through it, carrying something the hook read as a proof. What bounds the guard is
 * therefore the strictness of that proof rather than the length of this list, and what has
 * established it both times is a probe run against the real table.
 *
 * @class AiRun
 * @extends {BaseAppRenchanModel}
 */
export default class AiRun extends BaseAppRenchanModel {
  /**
   * Define model attributes
   *
   * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
   * @returns {object} Model attributes
   */
  static createAttributes (DataTypes) {
    const factory = ModelAttributeFactory.create(DataTypes)

    return {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      ApiClientId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiRunCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiRunStatusId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      runKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      requestKey: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      requestBodyHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      externalRef: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      subjectLabel: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      correlationId: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      callbackUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      requestBody: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
      },
      resultBody: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
      },
      failureReasonCode: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      failureParameters: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      engineLabel: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      acceptedAt: {
        type: DataTypes.DATE(3),
        allowNull: false,
      },
      startedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
      finishedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
      cancelRequestedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
      canceledAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
      contentPurgedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
    }
  }

  /**
   * Define model options
   *
   * @param {import('sequelize').Sequelize} sequelizeClient - Sequelize instance
   * @returns {object} Model options
   */
  static createOptions (sequelizeClient) {
    return {
      ...super.createOptions(sequelizeClient),
    }
  }

  /**
   * Define model associations
   */
  static associate () {
    super.associate?.()

    this.belongsTo(this._.ApiClient)
    this.belongsTo(this._.AiRunCategory)
    this.belongsTo(this._.AiRunStatus)

    this.hasMany(this._.AiRunStep)
    this.hasMany(this._.AiRunFieldOutcome)
  }

  /**
   * Define model scopes
   *
   * @param {import('sequelize').Op} Op - Sequelize operators
   */
  static defineScopes (Op) {
    super.defineScopes?.(Op)

    // noop
  }

  /**
   * Define subqueries
   */
  static defineSubqueries () {
    super.defineSubqueries?.()

    // noop
  }

  /**
   * Setup model hooks
   */
  static setupHooks () {
    super.setupHooks?.()

    this.beforeUpdate(entity => {
      if (
        !this.leavesTerminalAiRunStatus({
          entity,
        })
      ) {
        return
      }

      throw new Error(`${REFUSED_SETTLED_TRANSITION_MESSAGE}: AiRunId ${entity.id}, AiRunStatusId ${entity.previous(AI_RUN_STATUS_ATTRIBUTE_NAME)} to ${entity.AiRunStatusId}`)
    })

    this.beforeBulkUpdate(options => {
      if (
        !this.writesAiRunStatusInBulk({
          options,
        })
      ) {
        return
      }

      throw new Error(REFUSED_BULK_STATUS_UPDATE_MESSAGE)
    })
  }

  /**
   * get: the query operators a `where` states its conditions with.
   *
   * Reached through a getter rather than referred to inside the method that reads a `where`, so
   * that the one place this model touches Sequelize's own vocabulary is named, and a test can
   * stand something else in its place without reaching into the module registry.
   *
   * @returns {typeof Op} Operators.
   */
  static get sequelizeOperators () {
    return Op
  }

  /**
   * Check whether an update moves a run out of a status it never leaves.
   *
   * The comparison is against the row's own previous value rather than against the values the
   * caller passed, so a write that names no status — the content purge, an engine label — reads as
   * unchanged and passes. Only a status that differs from a terminal one is a move out of it.
   *
   * @param {{
   *   entity: *
   * }} params - Parameters.
   * @returns {boolean} Whether the run is leaving a terminal status.
   */
  static leavesTerminalAiRunStatus ({
    entity,
  }) {
    const previousAiRunStatusId = entity.previous(AI_RUN_STATUS_ATTRIBUTE_NAME)

    if (entity.AiRunStatusId === previousAiRunStatusId) {
      return false
    }

    const aiRunTerminalStatusInspector = this.createAiRunTerminalStatusInspector()

    return aiRunTerminalStatusInspector.isTerminalAiRunStatus({
      aiRunStatusId: previousAiRunStatusId,
    })
  }

  /**
   * Create the inspector answering whether a status is one a run never leaves.
   *
   * @returns {AiRunTerminalStatusInspector} Inspector.
   */
  static createAiRunTerminalStatusInspector () {
    return AiRunTerminalStatusInspector.create()
  }

  /**
   * Check whether a bulk update writes the run status without proving it may.
   *
   * `beforeBulkUpdate` is handed the options rather than a row, and `options.attributes` holds the
   * values the caller passed, keyed by attribute name. No row has been read at that point, so a
   * status arriving here cannot be judged against the one it would replace — but the `where` the
   * caller stated can be, and a `where` that excludes every terminal status matches no run that
   * has settled, so the write it guards cannot move one out of a status a run never leaves.
   *
   * An update naming no status is not this rule's to refuse, and is answered first: it moves no
   * status, so what its `where` says about statuses is beside the point.
   *
   * @param {{
   *   options: *
   * }} params - Parameters.
   * @returns {boolean} Whether the run status is being written under a condition that does not
   * rule the forbidden move out.
   */
  static writesAiRunStatusInBulk ({
    options,
  }) {
    const writtenFieldNames = Object.keys(options.attributes ?? {})

    if (!writtenFieldNames.includes(AI_RUN_STATUS_ATTRIBUTE_NAME)) {
      return false
    }

    return !this.excludesEveryTerminalAiRunStatus({
      where: options.where,
    })
  }

  /**
   * Check whether a condition states that every terminal status is one the rows it matches do not
   * carry.
   *
   * Every one of them, and not merely one or two: a `where` excluding succeeded alone still
   * matches a failed run, and moving that run is the same forbidden move under another name. Which
   * statuses those are is asked of `AiRunTerminalStatusInspector`, the same question the row guard
   * above asks, so a sixth terminal status reaches both at once.
   *
   * @param {{
   *   where: *
   * }} params - Parameters.
   * @returns {boolean} Whether the condition excludes every terminal status.
   */
  static excludesEveryTerminalAiRunStatus ({
    where,
  }) {
    const excludedAiRunStatusIds = this.extractExcludedAiRunStatusIds({
      where,
    })

    const aiRunTerminalStatusInspector = this.createAiRunTerminalStatusInspector()

    return aiRunTerminalStatusInspector.terminalAiRunStatusIds
      .every(it => excludedAiRunStatusIds.includes(it))
  }

  /**
   * Extract the statuses a condition states the rows it matches do not carry.
   *
   * Only one spelling is read: the status column stated as `Op.notIn` over an array, with nothing
   * else stated about that column in the same breath. A condition written any other way — a bare
   * value, another operator, an `Op.notIn` with a second key beside it — may well exclude the
   * terminal statuses too, and this answers that it excludes nothing at all, because a proof this
   * class cannot read is not a proof. What follows from an empty answer is the refusal that stood
   * here before, which is the safe side of the question to be wrong on.
   *
   * @param {{
   *   where: *
   * }} params - Parameters.
   * @returns {Array<*>} The statuses stated as excluded, empty when the condition states none this
   * class can read.
   */
  static extractExcludedAiRunStatusIds ({
    where,
  }) {
    const aiRunStatusCondition = where?.[AI_RUN_STATUS_ATTRIBUTE_NAME]
      ?? null

    if (aiRunStatusCondition === null) {
      return []
    }

    if (
      !this.statesOnlyNotIn({
        condition: aiRunStatusCondition,
      })
    ) {
      return []
    }

    const excludedAiRunStatusIds = aiRunStatusCondition[this.sequelizeOperators.notIn]

    if (!Array.isArray(excludedAiRunStatusIds)) {
      return []
    }

    return excludedAiRunStatusIds
  }

  /**
   * Check whether a condition on the status column states `Op.notIn` and nothing else.
   *
   * **A sibling key is what makes this question worth asking.** Sequelize compiles a column's
   * condition object as a unit, so what the caller wrote and what the database is asked are not
   * the same thing: an `Op.and` or an `Op.or` beside an `Op.notIn` replaces it outright in the
   * compiled statement, and an `Op.gte` beside it is kept. Reading the `Op.notIn` key on its own
   * would therefore accept a `where` whose `NOT IN` the database never sees.
   *
   * So both halves are asked and either one failing is the refusal: no own string key, and exactly
   * one own symbol, which must be `Op.notIn`. Between them the two halves also answer everything
   * that is no operator object to begin with — an array and a string answer their own indices to
   * `Object.keys()`, and a number, a boolean and an empty object answer no symbol.
   *
   * Refusing the siblings Sequelize keeps along with the ones it drops is deliberate: which is
   * which belongs to a query compiler's version, and a guard that tracked it would be re-deciding
   * this on every upgrade.
   *
   * @param {{
   *   condition: *
   * }} params - Parameters.
   * @returns {boolean} Whether the condition states `Op.notIn` alone.
   */
  static statesOnlyNotIn ({
    condition,
  }) {
    const ownFieldNames = Object.keys(condition)

    if (ownFieldNames.length > 0) {
      return false
    }

    const ownOperators = Object.getOwnPropertySymbols(condition)

    if (ownOperators.length !== 1) {
      return false
    }

    return ownOperators.includes(this.sequelizeOperators.notIn)
  }
}
