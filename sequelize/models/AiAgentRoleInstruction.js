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
 * version of the prompt it sent — which is why writing this row is always `.save()` and never
 * `.update()`: `.update()` can pass the row through without the hook, and the generation would be
 * lost rather than merely unrecorded.
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

    // noop
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
