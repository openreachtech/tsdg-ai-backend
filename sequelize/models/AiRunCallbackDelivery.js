import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiRunCallbackDelivery model
 *
 * One row per attempt at posting a callback to the client's registered URL. A row says whether
 * the request arrived and never what came back: no response body is stored, so a client's own
 * payload cannot reach this table and outlive the purge that removes it everywhere else.
 *
 * A callback is retried where a model call is not, so attempts are counted here rather than
 * collapsed into one row per run.
 *
 * @class AiRunCallbackDelivery
 * @extends {BaseAppRenchanModel}
 */
export default class AiRunCallbackDelivery extends BaseAppRenchanModel {
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
      // Which callback this attempt was for. One kind this version, and a second one is a row of
      // the master rather than a column here.
      AiRunCallbackDeliveryCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Which try this was, counted within its own run and callback kind.
      attemptIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Null when the request never completed - a connection refused, a timeout, a host that
      // never answered. The attempt happened and is recorded; there was no status to record.
      httpStatusCode: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      attemptedAt: {
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
    this.belongsTo(this._.AiRunCallbackDeliveryCategory)
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
