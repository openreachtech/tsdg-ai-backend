'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_run_steps'
const COLUMN_NAME = {
  AI_RUN_ID: 'ai_run_id',
  AI_RUN_STEP_CATEGORY_ID: 'ai_run_step_category_id',
  STEP_INDEX: 'step_index',
  STEP_NAME: 'step_name',
  OUTCOME_CODE: 'outcome_code',
  REJECTIONS: 'rejections',
  REASON_CODE: 'reason_code',
  STARTED_AT: 'started_at',
  FINISHED_AT: 'finished_at',
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
      AiRunStepCategoryId: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AI_RUN_STEP_CATEGORY_ID,
        allowNull: false,
      },
      // The order the step ran in, counted within its own run.
      stepIndex: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.STEP_INDEX,
        allowNull: false,
      },
      stepName: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.STEP_NAME,
        allowNull: false,
      },
      outcomeCode: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.OUTCOME_CODE,
        allowNull: false,
      },
      // What this step dropped, and why: the field path, the reason code, and figures
      // such as a length or an agreement count. Never the value itself - this row
      // outlives the content by two years, and a value kept here would survive the
      // purge meant to remove it.
      rejections: {
        type: Sequelize.JSON,
        field: COLUMN_NAME.REJECTIONS,
        allowNull: true,
      },
      reasonCode: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.REASON_CODE,
        allowNull: true,
      },
      startedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.STARTED_AT,
        allowNull: false,
      },
      // Null while the step is still running.
      finishedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.FINISHED_AT,
        allowNull: true,
      },

      ...factory.TIMESTAMPS,
    })

    await Promise.all([
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_RUN_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_RUN_ID,
          'index',
        ].join('_'),
      }),

      // The pair is UNIQUE: one run counts each position once, so reading the steps
      // back in the order they ran cannot land on two rows claiming the same place.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_RUN_ID,
        COLUMN_NAME.STEP_INDEX,
      ], {
        unique: true,
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_RUN_ID,
          COLUMN_NAME.STEP_INDEX,
          'unique',
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
