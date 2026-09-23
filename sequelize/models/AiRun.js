import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiRun model
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
