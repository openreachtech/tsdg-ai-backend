'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_tools'
const COLUMN_NAME = {
  NAME: 'name',
  DESCRIPTION: 'description',
  PAYLOAD: 'payload',
  DISPLAY_ORDER: 'display_order',
  IS_VISIBLE: 'is_visible',
  SAVED_AT: 'saved_at',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      name: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.NAME,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.DESCRIPTION,
        allowNull: false,
      },
      // The tool schema is held as a stringified JSON schema, so the exact bytes an
      // operator wrote are what a provider is handed. It is parsed at read time.
      payload: {
        type: Sequelize.TEXT,
        field: COLUMN_NAME.PAYLOAD,
        allowNull: false,
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.DISPLAY_ORDER,
        allowNull: false,
        defaultValue: 0,
      },
      // An internal forced tool is seeded invisible, so only offered tools are listed.
      isVisible: {
        type: Sequelize.BOOLEAN,
        field: COLUMN_NAME.IS_VISIBLE,
        allowNull: false,
        defaultValue: true,
      },
      savedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.SAVED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    return Promise.resolve()
  },

  async down (
    queryInterface,
    Sequelize
  ) {
    return queryInterface.dropTable(TABLE_NAME)
  },
}
