'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'api_clients'
const COLUMN_NAME = {
  NAME: 'name',
  CLIENT_KEY: 'client_key',
  SECRET_CIPHERTEXT: 'secret_ciphertext',
  PREVIOUS_SECRET_CIPHERTEXT: 'previous_secret_ciphertext',
  CALLBACK_URL_PREFIX: 'callback_url_prefix',
  IS_ACTIVE: 'is_active',
  REGISTERED_AT: 'registered_at',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      name: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.NAME,
        allowNull: false,
      },
      clientKey: {
        type: Sequelize.STRING(64),
        field: COLUMN_NAME.CLIENT_KEY,
        allowNull: false,
      },
      // The ciphertext has no reliable length bound, so it is TEXT rather than STRING(n).
      secretCiphertext: {
        type: Sequelize.TEXT,
        field: COLUMN_NAME.SECRET_CIPHERTEXT,
        allowNull: false,
      },
      // Held only while a rotation is under way, so it is nullable.
      previousSecretCiphertext: {
        type: Sequelize.TEXT,
        field: COLUMN_NAME.PREVIOUS_SECRET_CIPHERTEXT,
        allowNull: true,
      },
      // A URL has no reliable length bound, so it is TEXT rather than STRING(n).
      callbackUrlPrefix: {
        type: Sequelize.TEXT,
        field: COLUMN_NAME.CALLBACK_URL_PREFIX,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        field: COLUMN_NAME.IS_ACTIVE,
        allowNull: false,
      },
      registeredAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.REGISTERED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // The client key is the natural key every signed request is resolved by.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.CLIENT_KEY,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        COLUMN_NAME.CLIENT_KEY,
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
