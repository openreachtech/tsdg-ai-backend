'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_run_field_outcomes'
const COLUMN_NAME = {
  AI_RUN_ID: 'ai_run_id',
  AI_RUN_STEP_ID: 'ai_run_step_id',
  FIELD_PATH: 'field_path',
  AI_RUN_FIELD_STATUS_ID: 'ai_run_field_status_id',
  AI_RUN_EVIDENCE_CATEGORY_ID: 'ai_run_evidence_category_id',
  SUGGESTION_CONFIDENCE: 'suggestion_confidence',
  AGREED_READING_COUNT: 'agreed_reading_count',
  TOTAL_READING_COUNT: 'total_reading_count',
  CONFIDENCE_METHOD_VERSION: 'confidence_method_version',
  SETTLED_AT: 'settled_at',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    // How a settled field was scored. Part of the decision trace, so every column here is a
    // decision and none of them holds a value read out of a medium: the content purge leaves
    // this table untouched, and a run can still answer for itself once its content is gone.
    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      AiRunId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_RUN_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      // The step that settled this field. NOT NULL deliberately: no field outcome exists
      // outside a step, and this link is what makes the step's reason code reachable from
      // the field.
      AiRunStepId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_RUN_STEP_ID,
        allowNull: false,
      },
      fieldPath: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.FIELD_PATH,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiRunFieldStatusId: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AI_RUN_FIELD_STATUS_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      // What the majority reading rested on. NULL when nothing was settled.
      AiRunEvidenceCategoryId: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AI_RUN_EVIDENCE_CATEGORY_ID,
        allowNull: true,
      },
      // The score as computed, a number from 0 to 1. NULL when nothing was settled.
      suggestionConfidence: {
        type: Sequelize.DECIMAL(5, 4),
        field: COLUMN_NAME.SUGGESTION_CONFIDENCE,
        allowNull: true,
      },
      agreedReadingCount: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AGREED_READING_COUNT,
        allowNull: false,
      },
      totalReadingCount: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.TOTAL_READING_COUNT,
        allowNull: false,
      },
      // Which version of the formula scored it, so recalibrating is a new version rather
      // than a change to any run already recorded.
      confidenceMethodVersion: {
        type: Sequelize.STRING(32),
        field: COLUMN_NAME.CONFIDENCE_METHOD_VERSION,
        allowNull: false,
      },
      settledAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.SETTLED_AT,
        allowNull: false,
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
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_RUN_STEP_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_RUN_STEP_ID,
          'index',
        ].join('_'),
      }),
      // One run settles a field path once, and no second time.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_RUN_ID,
        COLUMN_NAME.FIELD_PATH,
      ], {
        unique: true,
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_RUN_ID,
          COLUMN_NAME.FIELD_PATH,
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
