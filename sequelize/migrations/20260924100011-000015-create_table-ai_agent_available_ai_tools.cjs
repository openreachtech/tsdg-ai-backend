'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_agent_available_ai_tools'
const COLUMN_NAME = {
  AI_AGENT_ID: 'ai_agent_id',
  AI_TOOL_ID: 'ai_tool_id',
  IS_ENABLED: 'is_enabled',
  IS_DEFAULT: 'is_default',
  SAVED_AT: 'saved_at',
}

// Define an initialism only for a column whose index name would run long.
const SHORT_COLUMN_NAME = {
  AI_AGENT_ID: 'aai',
  AI_TOOL_ID: 'ati',
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
      AiToolId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_TOOL_ID,
        allowNull: false,
      },
      // Whether the agent may use the tool at all. A tool is withdrawn by turning this
      // off, which keeps the row that says the agent once had it.
      isEnabled: {
        type: Sequelize.BOOLEAN,
        field: COLUMN_NAME.IS_ENABLED,
        allowNull: false,
      },
      // Whether the tool is offered to the model without the step asking for it.
      isDefault: {
        type: Sequelize.BOOLEAN,
        field: COLUMN_NAME.IS_DEFAULT,
        allowNull: false,
      },
      savedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.SAVED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // The pair is UNIQUE: one agent says one thing about one tool. A second row for the
    // same pair would leave `is_enabled` and `is_default` with two answers and no rule
    // for which of them the agent runs on.
    await Promise.all([
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_AGENT_ID,
        COLUMN_NAME.AI_TOOL_ID,
      ], {
        unique: true,
        name: [
          TABLE_NAME,
          SHORT_COLUMN_NAME.AI_AGENT_ID,
          SHORT_COLUMN_NAME.AI_TOOL_ID,
          'unique',
        ].join('_'),
      }),

      // Reading from the tool's side answers which agents a tool-schema change reaches,
      // which is what an operator needs before rewriting or retiring one.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_TOOL_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_TOOL_ID,
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
