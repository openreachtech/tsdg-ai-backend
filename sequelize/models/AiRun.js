import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

import AiRunTerminalStatusInspector from '../../app/aiRun/AiRunTerminalStatusInspector.js'

const AI_RUN_STATUS_ATTRIBUTE_NAME = 'AiRunStatusId'

const REFUSED_SETTLED_TRANSITION_MESSAGE = 'AiRun refuses a move out of a status a run never leaves'

const REFUSED_BULK_STATUS_UPDATE_MESSAGE = 'AiRun.update() is refused when it writes AiRunStatusId. Load the run and move it through AiRunStatusRecorder.'

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
 * `instance.save()`, by `instance.update()` — the path `AiRunStatusRecorder` itself writes through —
 * and by `Model.update()` when the caller passes `individualHooks`. `Model.update()` on its own
 * reaches `beforeBulkUpdate` only (`sequelize/lib/model.js`, `update()`: `individualHooks` defaults
 * to false and the per-row hooks live inside that branch), and at that point no row has been read,
 * so nothing there can tell a legal move from an illegal one. So a bulk update that writes
 * `AiRunStatusId` at all is refused by name rather than half-judged, and a bulk update that writes
 * anything else still runs — it cannot move a status it does not write.
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
 * deliberate act by a caller rather than something reached by accident. **The point of the list is
 * that it is exhaustive and true**, so a reader can tell what the guard is worth: one entry of it
 * was neither, and a reader who trusted that sentence would not have looked twice at an
 * `increment`.
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
   * Check whether a bulk update writes the run status.
   *
   * `beforeBulkUpdate` is handed the options rather than a row, and `options.attributes` holds the
   * values the caller passed, keyed by attribute name. No row has been read at that point, so a
   * status arriving here cannot be judged against the one it would replace.
   *
   * @param {{
   *   options: *
   * }} params - Parameters.
   * @returns {boolean} Whether the run status is among the values being written.
   */
  static writesAiRunStatusInBulk ({
    options,
  }) {
    return Object.keys(options.attributes ?? {})
      .includes(AI_RUN_STATUS_ATTRIBUTE_NAME)
  }
}
