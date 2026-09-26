import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * ProviderUploadedFile model
 *
 * The egress record: which file left this machine, to whom, and when. It is kept independently of
 * whether the run's content still exists, so nothing here holds content and a row still answers
 * for itself months after the medium it names has been emptied.
 *
 * @class ProviderUploadedFile
 * @extends {BaseAppRenchanModel}
 */
export default class ProviderUploadedFile extends BaseAppRenchanModel {
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
      // Which file left.
      AiRunMediaId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      // Who received it.
      AiProviderId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // What the provider calls it. TEXT because the shape of the handle is the provider's to
      // choose and no vendor bounds it for us.
      providerFileName: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      uploadedAt: {
        type: DataTypes.DATE(3),
        allowNull: false,
      },
      // Null when the provider states none.
      expiresAt: {
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

    // Both options are stated because the inference is wrong here, not as a restatement of it.
    // Sequelize builds the key and the loaded property name from the singular of the target
    // model name, and the singular of `AiRunMedia` is `AiRunMedium` - so the default would look
    // for a `AiRunMediumId` column no table has, and would load the medium under a name this
    // project uses nowhere else. An include of this association names the alias:
    // `include: [{ model: AiRunMedia, as: 'AiRunMedia' }]`.
    this.belongsTo(this._.AiRunMedia, {
      foreignKey: 'AiRunMediaId',
      as: 'AiRunMedia',
    })
    this.belongsTo(this._.AiProvider)
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
