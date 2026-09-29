'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_agent_role_instructions_bk'
const COLUMN_NAME = {
  AI_AGENT_ID: 'ai_agent_id',
  ROLE: 'role',
  SAVED_AT: 'saved_at',
}

// The index name over both columns runs past the length worth carrying, so both are shortened.
const SHORT_COLUMN_NAME = {
  AI_AGENT_ID: 'aai',
  SAVED_AT: 'sa',
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
      savedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.SAVED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    /*
     * The write-once sink holds every generation a role has ever had, so the pair of agent and
     * generation marker is what addresses one of them.
     *
     * It is UNIQUE rather than plain because a model call records that marker as the version of the
     * prompt it sent. Two rows sharing one marker would leave that record pointing at two texts,
     * and the reader months later with no way to tell which was sent — so a second save under an
     * unchanged marker is refused here rather than discovered then.
     */
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.AI_AGENT_ID,
      COLUMN_NAME.SAVED_AT,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.AI_AGENT_ID,
        SHORT_COLUMN_NAME.SAVED_AT,
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
