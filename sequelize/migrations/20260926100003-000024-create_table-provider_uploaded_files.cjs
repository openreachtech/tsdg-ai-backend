'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'provider_uploaded_files'
const COLUMN_NAME = {
  AI_RUN_MEDIA_ID: 'ai_run_media_id',
  AI_PROVIDER_ID: 'ai_provider_id',
  PROVIDER_FILE_NAME: 'provider_file_name',
  UPLOADED_AT: 'uploaded_at',
  EXPIRES_AT: 'expires_at',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    // The egress record: which file left this machine, to whom, and when. It is kept
    // independently of whether the run's content still exists, so nothing here holds content
    // and the content purge leaves this table untouched - a row still answers for itself
    // months after the medium it names has been emptied.
    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      // Which file left.
      AiRunMediaId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_RUN_MEDIA_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      // Who received it.
      AiProviderId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.AI_PROVIDER_ID,
        allowNull: false,
      },
      // What the provider calls it. TEXT because the shape of the handle is the provider's to
      // choose and no vendor bounds it for us.
      providerFileName: {
        type: Sequelize.TEXT,
        field: COLUMN_NAME.PROVIDER_FILE_NAME,
        allowNull: false,
      },
      uploadedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.UPLOADED_AT,
        allowNull: false,
      },
      // Null when the provider states none.
      expiresAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.EXPIRES_AT,
        allowNull: true,
      },

      ...factory.TIMESTAMPS,
    })

    await Promise.all([
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_RUN_MEDIA_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_RUN_MEDIA_ID,
          'index',
        ].join('_'),
      }),

      // Asking what one vendor was handed is the other direction the egress record is read
      // in, and the purge of expired provider uploads calls one vendor at a time.
      queryInterface.addIndex(TABLE_NAME, [
        COLUMN_NAME.AI_PROVIDER_ID,
      ], {
        name: [
          TABLE_NAME,
          COLUMN_NAME.AI_PROVIDER_ID,
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
