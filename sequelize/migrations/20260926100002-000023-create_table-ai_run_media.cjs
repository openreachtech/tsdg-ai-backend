'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'ai_run_media'
const COLUMN_NAME = {
  AI_RUN_ID: 'ai_run_id',
  MEDIA_KEY: 'media_key',
  AI_RUN_MEDIA_CATEGORY_ID: 'ai_run_media_category_id',
  MIME_TYPE: 'mime_type',
  BYTE_SIZE: 'byte_size',
  IS_READABLE: 'is_readable',
  FETCHED_AT: 'fetched_at',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    // One medium a run was handed. No file bytes are stored here: the temporary copy of a
    // fetched file lives on the worker's disk for the length of the run and is deleted when
    // the run ends, so this table says what the file was and never what was in it.
    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      AiRunId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_RUN_ID,
        allowNull: false,
      },
      // The caller's own id for this file. Echoed back, never interpreted - so it is stored
      // exactly as it arrived and nothing here reads meaning into it.
      mediaKey: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.MEDIA_KEY,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      // What the caller said this file is. It is the caller's claim and not a finding of
      // this service, which is why it is recorded rather than derived.
      AiRunMediaCategoryId: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AI_RUN_MEDIA_CATEGORY_ID,
        allowNull: false,
      },
      // Borrowed verbatim from the standard, which is why the word `type` stands here and
      // nowhere else in this schema.
      mimeType: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.MIME_TYPE,
        allowNull: false,
      },
      // What the caller declared the file weighs. The cap is checked against this before
      // anything is sent to a provider; no column here enforces it.
      byteSize: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.BYTE_SIZE,
        allowNull: false,
      },
      // False when it was fetched but could not be read. A medium starts out false and turns
      // true only once something has been read from it, so a row that was never fetched and
      // a row that was fetched and failed both read as not readable.
      isReadable: {
        type: Sequelize.BOOLEAN,
        field: COLUMN_NAME.IS_READABLE,
        allowNull: false,
      },
      // Null until it is fetched.
      fetchedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.FETCHED_AT,
        allowNull: true,
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
