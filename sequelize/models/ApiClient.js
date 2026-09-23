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
   * **The two secret envelopes do not travel by default, and that is deliberate.** A client's
   * secret is read for exactly one purpose — recomputing the HMAC a request signature is checked
   * against — and that happens in one method of one class. Every other read of this model reaches
   * a renderer as `context.apiClient`, so a plain `findOne()` used to hand the ciphertext of both
   * the live secret and the one being rotated out to every renderer this project will ever write.
   * The envelope is encrypted and the key is not in the database, so nothing leaked; what was
   * missing was the guard that keeps it that way.
   *
   * **Why `defaultScope` rather than an `attributes` list at the call site.** An `attributes` list
   * guards the one query somebody remembered to write it on, and a query added next year starts
   * carrying the secrets again with nothing saying so. A default scope reverses the default for
   * every reader at once.
   *
   * **What the scope guarantees, and what it does not.** A read that names no `attributes` of its
   * own comes back without either envelope — that is every read in this project but one, and it is
   * what makes an accidental leak impossible rather than merely unlikely. It is not a lock: a query
   * that names its own `attributes` replaces the scope's list instead of narrowing it, so
   * `findOne({ attributes: ['id', 'secretCiphertext'] })` reaches the ciphertext with no
   * `unscoped()` anywhere in sight. The guarantee is therefore about intent, not permission — a
   * secret arrives only where somebody wrote the column's name.
   * `AppRestfulApiContext.findSecretBearingApiClient()` is the one read that does, and it says
   * `unscoped()` beside it so a reader sees what it is for without working out which of the two
   * `attributes` wins.
   *
   * @param {import('sequelize').Sequelize} sequelizeClient - Sequelize instance
   * @returns {object} Model options
   */
  static createOptions (sequelizeClient) {
    return {
      ...super.createOptions(sequelizeClient),

      defaultScope: {
        attributes: {
          exclude: [
            'secretCiphertext',
            'previousSecretCiphertext',
          ],
        },
      },
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
