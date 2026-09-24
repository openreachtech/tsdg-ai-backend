'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_model_capabilities'
const COLUMN_NAME = {
  AI_MODEL_ID: 'ai_model_id',
  CONTEXT_WINDOW_TOKEN: 'context_window_token',
  MAX_OUTPUT_TOKEN: 'max_output_token',
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
      AiModelId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_MODEL_ID,
        allowNull: false,
      },
      contextWindowToken: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.CONTEXT_WINDOW_TOKEN,
        allowNull: false,
      },
      maxOutputToken: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.MAX_OUTPUT_TOKEN,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // A 1:1 relation is enforced by a UNIQUE index (no DB FK).
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.AI_MODEL_ID,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        COLUMN_NAME.AI_MODEL_ID,
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
