import {
  BackupMixinModel,
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiAgentDefaultInstruction model
 *
 * The agent's own instruction, held as a row so that rewording it is a database write rather than
 * a deployment.
 *
 * The backup mixin appends the values of every save to `AiAgentDefaultInstructionBk`, so the live
 * row holds the current text while the sink holds every text there has ever been, current one
 * included. `savedAt` is what tells those generations apart, and a model call records it as the
 * version of the prompt it sent — which is why writing this row is always `.save()` and never
 * `.update()`: `.update()` can pass the row through without the hook, and the generation would be
 * lost rather than merely unrecorded.
 *
 * `savedAt` is stamped by `setupHooks()` on every save and is not the writer's to supply: a value
 * the caller sets is overwritten, so no wording can be filed under a generation that already holds
 * different text.
 *
 * @class AiAgentDefaultInstruction
 * @extends {BaseAppRenchanModel}
 */
export default class AiAgentDefaultInstruction extends BaseAppRenchanModel {
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
      instruction: {
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
     * The paths that reach no model hook are still the writer's: a static `.update()`, a
     * `.bulkCreate()` without `individualHooks`, `queryInterface` and raw SQL all pass the row
     * through without this hook and without the mixin's `afterSave`. Seeding relies on exactly that
     * and inserts its own sink row beside the live one; application code writes these rows with
     * `.save()`, which is why the class comment states that rule.
     */
    this.beforeSave(entity => {
      entity.set('savedAt', new Date())
    })
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
   * @returns {typeof import('./AiAgentDefaultInstructionBk.js').default} Backup model declaration
   */
  static get BackupModel () {
    return this._.AiAgentDefaultInstructionBk
  }
}
