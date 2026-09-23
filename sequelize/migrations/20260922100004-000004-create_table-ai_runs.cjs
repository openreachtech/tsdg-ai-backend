'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_runs'
const COLUMN_NAME = {
  API_CLIENT_ID: 'api_client_id',
  AI_RUN_CATEGORY_ID: 'ai_run_category_id',
  AI_RUN_STATUS_ID: 'ai_run_status_id',
  RUN_KEY: 'run_key',
  REQUEST_KEY: 'request_key',
  REQUEST_BODY_HASH: 'request_body_hash',
  EXTERNAL_REF: 'external_ref',
  SUBJECT_LABEL: 'subject_label',
  CORRELATION_ID: 'correlation_id',
  CALLBACK_URL: 'callback_url',
  REQUEST_BODY: 'request_body',
  RESULT_BODY: 'result_body',
  FAILURE_REASON_CODE: 'failure_reason_code',
  FAILURE_PARAMETERS: 'failure_parameters',
  ENGINE_LABEL: 'engine_label',
  ACCEPTED_AT: 'accepted_at',
  STARTED_AT: 'started_at',
  FINISHED_AT: 'finished_at',
  CANCEL_REQUESTED_AT: 'cancel_requested_at',
  CANCELED_AT: 'canceled_at',
  CONTENT_PURGED_AT: 'content_purged_at',
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
      ApiClientId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.API_CLIENT_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiRunCategoryId: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AI_RUN_CATEGORY_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiRunStatusId: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AI_RUN_STATUS_ID,
        allowNull: false,
      },
      runKey: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.RUN_KEY,
        allowNull: false,
      },
      requestKey: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.REQUEST_KEY,
        allowNull: false,
      },
      requestBodyHash: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.REQUEST_BODY_HASH,
        allowNull: false,
      },
      externalRef: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.EXTERNAL_REF,
        allowNull: false,
      },
      subjectLabel: {
        type: Sequelize.TEXT,
        field: COLUMN_NAME.SUBJECT_LABEL,
        allowNull: false,
      },
      correlationId: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.CORRELATION_ID,
        allowNull: false,
      },
      callbackUrl: {
        type: Sequelize.TEXT,
        field: COLUMN_NAME.CALLBACK_URL,
        allowNull: false,
      },
      requestBody: {
        type: Sequelize.TEXT('medium'),
        field: COLUMN_NAME.REQUEST_BODY,
        allowNull: true,
      },
      resultBody: {
        type: Sequelize.TEXT('medium'),
        field: COLUMN_NAME.RESULT_BODY,
        allowNull: true,
      },
      failureReasonCode: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.FAILURE_REASON_CODE,
        allowNull: true,
      },
      failureParameters: {
        type: Sequelize.JSON,
        field: COLUMN_NAME.FAILURE_PARAMETERS,
        allowNull: true,
      },
      engineLabel: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.ENGINE_LABEL,
        allowNull: true,
      },
      acceptedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.ACCEPTED_AT,
        allowNull: false,
      },
      startedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.STARTED_AT,
        allowNull: true,
      },
      finishedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.FINISHED_AT,
        allowNull: true,
      },
      cancelRequestedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.CANCEL_REQUESTED_AT,
        allowNull: true,
      },
      canceledAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.CANCELED_AT,
        allowNull: true,
      },
      contentPurgedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.CONTENT_PURGED_AT,
        allowNull: true,
      },

      ...factory.TIMESTAMPS,
    })

    await Promise.all([
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.API_CLIENT_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.API_CLIENT_ID,
          'index',
        ].join('_'),
      }),
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.RUN_KEY,
      ], {
        unique: true,
        name: [
          TABLE_NAME,
          COLUMN_NAME.RUN_KEY,
          'unique',
        ].join('_'),
      }),
      // Idempotency: one request key may produce one run per client, and no second one.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.API_CLIENT_ID,
        COLUMN_NAME.REQUEST_KEY,
      ], {
        unique: true,
        name: [
          TABLE_NAME,
          COLUMN_NAME.API_CLIENT_ID,
          COLUMN_NAME.REQUEST_KEY,
          'unique',
        ].join('_'),
      }),
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.CORRELATION_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.CORRELATION_ID,
          'index',
        ].join('_'),
      }),
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_RUN_STATUS_ID,
        COLUMN_NAME.STARTED_AT,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_RUN_STATUS_ID,
          COLUMN_NAME.STARTED_AT,
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
