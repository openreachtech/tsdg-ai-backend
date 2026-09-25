import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiRunFieldOutcome model
 *
 * How a settled field was scored. Part of the decision trace, so every attribute here is a
 * decision and none of them holds a value read out of a medium: the content purge leaves this
 * table untouched, and a run can still answer for itself once its content is gone.
 *
 * @class AiRunFieldOutcome
 * @extends {BaseAppRenchanModel}
 */
export default class AiRunFieldOutcome extends BaseAppRenchanModel {
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
      // The step that settled this field. NOT NULL deliberately: no field outcome exists
      // outside a step, and this link is what makes the step's reason code reachable from
      // the field.
      AiRunStepId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      fieldPath: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiRunFieldStatusId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      // What the majority reading rested on. NULL when nothing was settled.
      AiRunEvidenceCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // The score as computed, a number from 0 to 1. NULL when nothing was settled.
      suggestionConfidence: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true,
      },
      agreedReadingCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalReadingCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Which version of the formula scored it, so recalibrating is a new version rather
      // than a change to any run already recorded.
      confidenceMethodVersion: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      settledAt: {
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
    this.belongsTo(this._.AiRunStep)
    this.belongsTo(this._.AiRunFieldStatus)
    this.belongsTo(this._.AiRunEvidenceCategory)
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
