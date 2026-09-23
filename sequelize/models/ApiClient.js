import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * ApiClient model
 *
 * @class ApiClient
 * @extends {BaseAppRenchanModel}
 */
export default class ApiClient extends BaseAppRenchanModel {
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
      },
      clientKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      // The ciphertext has no reliable length bound, so it is TEXT rather than STRING(n).
      secretCiphertext: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // Held only while a rotation is under way, so it is nullable.
      previousSecretCiphertext: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // A URL has no reliable length bound, so it is TEXT rather than STRING(n).
      callbackUrlPrefix: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      registeredAt: {
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

    this.hasMany(this._.AiRun)
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
