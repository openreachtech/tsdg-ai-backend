'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_agent_role_instructions'
const COLUMN_NAME = {
  AI_AGENT_ID: 'ai_agent_id',
  ROLE: 'role',
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
      role: {
        type: Sequelize.TEXT,
        field: COLUMN_NAME.ROLE,
        allowNull: false,
      },
      // The generation marker. It is NOT NULL and millisecond-precision because a model call
      // records it as the version of the prompt it sent, and resolves that call back to the text
      // through the matching row of `ai_agent_role_instructions_bk`.
      savedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.SAVED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // A 1:1 relation is enforced by a UNIQUE index (no DB FK).
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.AI_AGENT_ID,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        COLUMN_NAME.AI_AGENT_ID,
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
