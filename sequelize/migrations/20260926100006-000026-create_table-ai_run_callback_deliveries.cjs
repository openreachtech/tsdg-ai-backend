'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_run_callback_deliveries'
const COLUMN_NAME = {
  AI_RUN_ID: 'ai_run_id',
  AI_RUN_CALLBACK_DELIVERY_CATEGORY_ID: 'ai_run_callback_delivery_category_id',
  ATTEMPT_INDEX: 'attempt_index',
  HTTP_STATUS_CODE: 'http_status_code',
  ATTEMPTED_AT: 'attempted_at',
}

// Define an initialism only for a column whose index name would run long.
const SHORT_COLUMN_NAME = {
  AI_RUN_ID: 'ari',
  AI_RUN_CALLBACK_DELIVERY_CATEGORY_ID: 'arcdci',
  ATTEMPT_INDEX: 'ati',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    // One row per attempt at posting a callback to the client's registered URL (specs/1.0.0,
    // #run-delivery).
    //
    // A row says whether the request arrived, and never what came back: no response body is
    // stored, so a client's own payload cannot reach this table and survive the content purge
    // that removes it everywhere else (#retention). `http_status_code` is the whole of what the
    // far side said.
    //
    // A callback is retried where a model call is not, so the table counts attempts rather than
    // holding one row per run - which is what makes "it was retried" a readable fact rather than
    // an inference.
    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      AiRunId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_RUN_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      // Which callback this attempt was for. One kind this version, and a second one is a row of
      // the master rather than a column here.
      AiRunCallbackDeliveryCategoryId: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AI_RUN_CALLBACK_DELIVERY_CATEGORY_ID,
        allowNull: false,
      },
      // Which try this was, counted within its own run and callback kind.
      attemptIndex: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.ATTEMPT_INDEX,
        allowNull: false,
      },
      // NULL when the request never completed - a connection refused, a timeout, a host that
      // never answered. The attempt happened and is recorded; there was no status to record.
      httpStatusCode: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.HTTP_STATUS_CODE,
        allowNull: true,
      },
      attemptedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.ATTEMPTED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    await Promise.all([
      // Reading a run's delivery attempts back is how the record answers whether the callback
      // landed, so the run is the way in.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_RUN_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_RUN_ID,
          'index',
        ].join('_'),
      }),

      // The triple is UNIQUE: one run counts each try of each callback kind once. A second row
      // claiming the same place would leave "how many times was this retried" with two answers
      // and no rule for which of them is the count.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_RUN_ID,
        COLUMN_NAME.AI_RUN_CALLBACK_DELIVERY_CATEGORY_ID,
        COLUMN_NAME.ATTEMPT_INDEX,
      ], {
        unique: true,
        name: [
          TABLE_NAME,
          SHORT_COLUMN_NAME.AI_RUN_ID,
          SHORT_COLUMN_NAME.AI_RUN_CALLBACK_DELIVERY_CATEGORY_ID,
          SHORT_COLUMN_NAME.ATTEMPT_INDEX,
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
