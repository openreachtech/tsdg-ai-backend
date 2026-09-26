import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * AiRunMedia model
 *
 * One medium a run was handed. The model name is the plural noun `media` already, and it
 * pluralizes to itself, so the inferred physical name is `ai_run_media` and no `tableName` is
 * stated.
 *
 * The table holds no file bytes. The temporary copy of a fetched file lives on the worker's disk
 * for the length of the run and is deleted when the run ends, so a row says what the file was and
 * never what was in it.
 *
 * @class AiRunMedia
 * @extends {BaseAppRenchanModel}
 */
export default class AiRunMedia extends BaseAppRenchanModel {
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
      // The caller's own id for this file. Echoed back, never interpreted - so it is stored
      // exactly as it arrived and nothing here reads meaning into it.
      mediaKey: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      // What the caller said this file is. It is the caller's claim and not a finding of
      // this service, which is why it is recorded rather than derived.
      AiRunMediaCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Borrowed verbatim from the standard, which is why the word `type` stands here and
      // nowhere else in this schema.
      mimeType: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      // What the caller declared the file weighs. The cap is checked against this before
      // anything is sent to a provider; no column here enforces it.
      byteSize: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // False when it was fetched but could not be read. A medium starts out false and turns
      // true only once something has been read from it, so a row that was never fetched and
      // a row that was fetched and failed both read as not readable.
      isReadable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      // Null until it is fetched.
      fetchedAt: {
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
    this.belongsTo(this._.AiRunMediaCategory)

    // `foreignKey` is stated because the inference is wrong here, not as a restatement of it.
    // Sequelize builds the key from the singular of the source model name, and the singular of
    // `AiRunMedia` is `AiRunMedium` - so the default would look for `AiRunMediumId`, a column
    // no table has.
    this.hasMany(this._.ProviderUploadedFile, {
      foreignKey: 'AiRunMediaId',
    })
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
