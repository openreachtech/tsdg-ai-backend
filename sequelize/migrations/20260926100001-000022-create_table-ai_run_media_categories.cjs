'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_run_media_categories'
const COLUMN_NAME = {
  NAME: 'name',
  DISPLAY_NAME: 'display_name',
  DISPLAY_ORDER: 'display_order',
  IS_ACTIVE: 'is_active',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    // Master table naming the kinds of file a request may hand over. Every kind the contract
    // allows a caller to name has a row here, handled or not: a kind this version does not
    // handle is refused by its own name rather than ignored, and `is_active` is what says
    // which of them this version handles.
    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_INTEGER,

      name: {
        type: Sequelize.STRING(32),
        field: COLUMN_NAME.NAME,
        allowNull: false,
      },
      displayName: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.DISPLAY_NAME,
        allowNull: false,
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.DISPLAY_ORDER,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        field: COLUMN_NAME.IS_ACTIVE,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // The system key is the real key of a master set, so it is enforced by a UNIQUE index.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.NAME,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        COLUMN_NAME.NAME,
        'unique',
      ].join('_'),
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
