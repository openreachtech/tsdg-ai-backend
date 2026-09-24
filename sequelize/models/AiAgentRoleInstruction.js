import {
  BackupMixinModel,
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiAgentRoleInstruction model
 *
 * The system prompt the agent is sent under, held as a row so that rewording it is a database
 * write rather than a deployment.
 *
 * The backup mixin appends the values of every save to `AiAgentRoleInstructionBk`, so the live row
 * holds the current text while the sink holds every text there has ever been, current one
 * included. `savedAt` is what tells those generations apart, and a model call records it as the
 * version of the prompt it sent.
 *
 * `savedAt` is stamped by `setupHooks()` on every save and is not the writer's to supply: a value
 * the caller sets is overwritten, so no wording can be filed under a generation that already holds
 * different text. `.update()` and `.bulkCreate()` are overridden to force `individualHooks` on, so
 * those two are stamped and appended exactly as `.save()` is; no call site has to remember to
 * prefer one write method over another.
 *
 * Three ways of writing this table still reach neither the stamp nor the sink. `queryInterface` and
 * raw SQL reach no model hook at all, and the seeders depend on that — they insert their own sink
 * row beside the live one. `.upsert()` reaches no per-row hook either: Sequelize gives it
 * `beforeUpsert` / `afterUpsert` only, and no `individualHooks` option to turn into one, so it
 * cannot be closed the way the other two were. Nothing in this application upserts these rows.
 *
 * @class AiAgentRoleInstruction
 * @extends {BaseAppRenchanModel}
 */
export default class AiAgentRoleInstruction extends BaseAppRenchanModel {
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
      AiAgentId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
      },
      role: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      savedAt: {
        type: DataTypes.DATE(3),
        allowNull: false,
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

    this.belongsTo(this._.AiAgent)
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

    /*
     * The generation marker is the server's to assign, and never the writer's.
     *
     * A model call records this instant as the version of the prompt it sent, and resolves that
     * record back to one row of the write-once sink. A writer free to choose the instant could hand
     * a new wording the one an older generation already carries, and every call recorded under it
     * would then resolve to text that was never sent. Stamping it here puts the value out of the
     * writer's reach on every path that reaches a model hook, after whatever the caller set and
     * before the row and the sink row the backup mixin appends are written.
     *
     * The stamp is derived from the row rather than from the clock alone. Two wordings saved inside
     * one millisecond would otherwise carry one instant, and the marker would stop telling those
     * generations apart; a clock that went backwards would file a new wording under an instant an
     * older one already holds. Reading the row's own previous marker covers both, and covers a
     * second process that loaded the row after the first committed — which a process-local counter
     * would not.
     *
     * What it does not cover: two writers that loaded the same row and save within one millisecond,
     * `queryInterface` and raw SQL, `save({ hooks: false })`, and a transaction that spans the live
     * write and the sink append. The class comment names the ones that matter.
     */
    this.beforeSave(entity => {
      const previousSavedAt = new Date(entity.previous('savedAt') ?? 0)
      const currentAt = new Date()

      const savedAt = currentAt > previousSavedAt
        ? currentAt
        : new Date(previousSavedAt.getTime() + 1)

      entity.set('savedAt', savedAt)
    })
  }

  /**
   * Update rows, with the per-row hooks forced on.
   *
   * Sequelize skips `beforeUpdate` / `afterUpdate` on a multi-row update unless `individualHooks`
   * is set, which would let a caller reword a row without stamping `savedAt` and without appending
   * to the sink. Forcing it here rather than asking every call site to pass it is what makes it
   * unbypassable.
   *
   * @override
   * @param {object} values - Values to set
   * @param {object} options - Update options
   * @returns {Promise<*>} Update result
   */
  static async update (
    values,
    options
  ) {
    return super.update(
      values,
      {
        ...options,
        individualHooks: true,
      }
    )
  }

  /**
   * Create rows in bulk, with the per-row hooks forced on.
   *
   * Same reasoning as `.update()` above: without `individualHooks`, `bulkCreate` writes the rows
   * through `beforeBulkCreate` alone and reaches neither the stamp nor the sink.
   *
   * @override
   * @param {Array<object>} records - Records to create
   * @param {object} [options] - Create options
   * @returns {Promise<*>} Created entities
   */
  static async bulkCreate (
    records,
    options = {}
  ) {
    return super.bulkCreate(
      records,
      {
        ...options,
        individualHooks: true,
      }
    )
  }

  /**
   * get: Mixin models to apply
   *
   * @returns {Array<Function>} Mixin models
   */
  static get Mixins () {
    return [
      BackupMixinModel,
    ]
  }

  /**
   * get: Backup model for BackupMixinModel
   *
   * @returns {typeof import('./AiAgentRoleInstructionBk.js').default} Backup model declaration
   */
  static get BackupModel () {
    return this._.AiAgentRoleInstructionBk
  }
}
