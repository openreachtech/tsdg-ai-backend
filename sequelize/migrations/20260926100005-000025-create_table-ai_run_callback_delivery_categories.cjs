'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_run_callback_delivery_categories'
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

    // Master: which callback a delivery attempt was for (specs/1.0.0, #run-delivery).
    //
    // One row is seeded this version, for the terminal callback. The deferred progress callback
    // is a second row of this table and never a second column of `ai_run_callback_deliveries` -
    // which is the whole reason the kind is a table at all rather than a boolean on the delivery.
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
