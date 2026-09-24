'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_agents'
const COLUMN_NAME = {
  NAME: 'name',
  DESCRIPTION: 'description',
  REGISTERED_AT: 'registered_at',
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
        type: Sequelize.TEXT,
        field: COLUMN_NAME.DESCRIPTION,
        allowNull: false,
      },
      registeredAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.REGISTERED_AT,
        allowNull: false,
      },
      savedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.SAVED_AT,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },

      ...factory.TIMESTAMPS,
    })

    // One agent per AI service, so its name is the key of the set and cannot repeat.
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
