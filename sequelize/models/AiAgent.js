import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiAgent model
 *
 * One agent per AI service. It holds the agent's identity only; every text the agent sends is a
 * row of its own, so that changing one is a database write and leaves the previous version behind.
 *
 * @class AiAgent
 * @extends {BaseAppRenchanModel}
 */
export default class AiAgent extends BaseAppRenchanModel {
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

      name: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      registeredAt: {
        type: DataTypes.DATE(3),
        allowNull: false,
      },
      savedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
        defaultValue: DataTypes.NOW,
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

    this.hasOne(this._.AiAgentDefaultInstruction)
    this.hasOne(this._.AiAgentRoleInstruction)
    this.hasOne(this._.AiAgentDefaultModel)

    this.hasMany(this._.AiAgentAvailableAiTool)
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
