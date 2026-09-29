import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiModelCall model
 *
 * @class AiModelCall
 * @extends {BaseAppRenchanModel}
 */
export default class AiModelCall extends BaseAppRenchanModel {
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
      AiRunId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiModelId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      actionName: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      readingIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Addresses one history row: the `savedAt` of the instruction in force, as an
      // ISO 8601 UTC string keeping the millisecond digits of that DATE(3) value.
      promptVersion: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      latencyMilliseconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      inputTokenCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      outputTokenCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // The only content in this table, and the only attribute the content purge empties.
      responseBody: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
      },
      calledAt: {
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

    this.belongsTo(this._.AiRun)
    this.belongsTo(this._.AiModel)
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
