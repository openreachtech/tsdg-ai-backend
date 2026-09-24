'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_model_calls'
const COLUMN_NAME = {
  AI_RUN_ID: 'ai_run_id',
  AI_MODEL_ID: 'ai_model_id',
  ACTION_NAME: 'action_name',
  READING_INDEX: 'reading_index',
  PROMPT_VERSION: 'prompt_version',
  LATENCY_MILLISECONDS: 'latency_milliseconds',
  INPUT_TOKEN_COUNT: 'input_token_count',
  OUTPUT_TOKEN_COUNT: 'output_token_count',
  RESPONSE_BODY: 'response_body',
  CALLED_AT: 'called_at',
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
      AiRunId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_RUN_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiModelId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_MODEL_ID,
        allowNull: false,
      },
      actionName: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.ACTION_NAME,
        allowNull: false,
      },
      readingIndex: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.READING_INDEX,
        allowNull: false,
      },
      // Addresses one history row: the `saved_at` of the instruction in force, as an
      // ISO 8601 UTC string keeping the millisecond digits of that DATE(3) value.
      promptVersion: {
        type: Sequelize.STRING(32),
        field: COLUMN_NAME.PROMPT_VERSION,
        allowNull: false,
      },
      latencyMilliseconds: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.LATENCY_MILLISECONDS,
        allowNull: false,
      },
      inputTokenCount: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.INPUT_TOKEN_COUNT,
        allowNull: false,
      },
      outputTokenCount: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.OUTPUT_TOKEN_COUNT,
        allowNull: false,
      },
      // The only content in this table, and the only column the content purge empties.
      responseBody: {
        type: Sequelize.TEXT('medium'),
        field: COLUMN_NAME.RESPONSE_BODY,
        allowNull: true,
      },
      calledAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.CALLED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.AI_RUN_ID,
    ], {
      name: [
        TABLE_NAME,
        COLUMN_NAME.AI_RUN_ID,
        'index',
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
