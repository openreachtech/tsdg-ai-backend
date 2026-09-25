import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiRunStep model
 *
 * @class AiRunStep
 * @extends {BaseAppRenchanModel}
 */
export default class AiRunStep extends BaseAppRenchanModel {
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
      AiRunStepCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // The order the step ran in, counted within its own run.
      stepIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stepName: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      outcomeCode: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      // What this step dropped, and why: the field path, the reason code, and figures
      // such as a length or an agreement count. Never the value itself - this row
      // outlives the content by two years, and a value kept here would survive the
      // purge meant to remove it.
      rejections: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      reasonCode: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.DATE(3),
        allowNull: false,
      },
      // Null while the step is still running.
      finishedAt: {
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

    this.belongsTo(this._.AiRun)
    this.belongsTo(this._.AiRunStepCategory)

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

    // noop
  }
}
