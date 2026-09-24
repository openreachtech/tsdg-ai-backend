'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_models'
const COLUMN_NAME = {
  AI_PROVIDER_ID: 'ai_provider_id',
  NAME: 'name',
  TARGET_MODEL_NAME: 'target_model_name',
  IS_DEFAULT: 'is_default',
  IS_ACTIVE: 'is_active',
  DISPLAY_ORDER: 'display_order',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      AiProviderId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_PROVIDER_ID,
        allowNull: false,
      },
      // The key this application selects a model by. Never the vendor's own model id.
      name: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.NAME,
        allowNull: false,
      },
      // The vendor's own model id, sent verbatim in the payload. Its length is the vendor's to set.
      targetModelName: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.TARGET_MODEL_NAME,
        allowNull: false,
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        field: COLUMN_NAME.IS_DEFAULT,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        field: COLUMN_NAME.IS_ACTIVE,
        allowNull: false,
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.DISPLAY_ORDER,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    await Promise.all([
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_PROVIDER_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_PROVIDER_ID,
          'index',
        ].join('_'),
      }),

      // The system key is the real key of a master set, so it is enforced by a UNIQUE index.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.NAME,
      ], {
        unique: true,
        name: [
          TABLE_NAME,
          COLUMN_NAME.NAME,
          'unique',
        ].join('_'),
      }),
    ])

    return Promise.resolve()
  },

  async down (
    queryInterface,
    Sequelize
  ) {
    return queryInterface.dropTable(TABLE_NAME)
  },
}
