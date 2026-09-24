import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiAgentDefaultInstructionBk model
 *
 * The write-once history sink of `AiAgentDefaultInstruction`. It carries no mixin and no sink of
 * its own: rows arrive here from the backup mixin on the live model and are never rewritten.
 *
 * Its physical name is the live table's with `_bk` appended, which the model name does not
 * pluralize to, so `tableName` is stated rather than inferred.
 *
 * @class AiAgentDefaultInstructionBk
 * @extends {BaseAppRenchanModel}
 */
export default class AiAgentDefaultInstructionBk extends BaseAppRenchanModel {
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

      tableName: 'ai_agent_default_instructions_bk',
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
}
