'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_agent_default_models'
const COLUMN_NAME = {
  AI_AGENT_ID: 'ai_agent_id',
  AI_MODEL_ID: 'ai_model_id',
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

      // ForeignKey must start with upper case.
      AiAgentId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_AGENT_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiModelId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_MODEL_ID,
        allowNull: false,
      },
      // When the binding was last written, so which model an agent used is answerable
      // after the fact rather than only as of now.
      savedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.SAVED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    await Promise.all([
      // A 1:1 relation is enforced by a UNIQUE index (no DB FK).
      // An agent runs on one model, so the binding is one row and swapping the model is
      // an update of that row rather than a second row nothing chooses between.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_AGENT_ID,
      ], {
        unique: true,
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_AGENT_ID,
          'unique',
        ].join('_'),
      }),
      // Reading the binding from the model's side answers which agents a model change
      // reaches, which is what makes adding or retiring a model a data change.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_MODEL_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_MODEL_ID,
          'index',
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
