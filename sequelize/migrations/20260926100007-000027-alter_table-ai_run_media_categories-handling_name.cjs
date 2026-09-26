'use strict'

/*
 * Replace `is_active` on the media-kind master with `handling_name` (specs/1.0.0, §20).
 *
 * §20 asks for three endings and the boolean carries two. A video URL is refused with
 * `MEDIA_UNSUPPORTED` "rather than being silently skipped", while audio is ignored — and both
 * kinds were `is_active = false`, so nothing that read the flag could tell them apart. The new
 * column states what this version does with a kind, in the words `AI_RUN_MEDIA_HANDLING`
 * declares: `handle`, `refuse` or `ignore`.
 *
 * **The boolean is replaced rather than joined.** Two columns able to disagree — a kind marked
 * inactive and handled — would cost a reader more than the missing third state ever did, and
 * would need a rule about which of them wins. This master is also the one table whose `is_active`
 * never carried the column's usual meaning: every kind seeded here is one a caller may legitimately
 * name, video and audio included, because being namable is the whole reason their rows exist.
 *
 * The values themselves are re-supplied by the master seeder, which reads them from the constants.
 */

const TABLE_NAME = 'ai_run_media_categories'
const COLUMN_NAME = {
  HANDLING_NAME: 'handling_name',
  IS_ACTIVE: 'is_active',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    // 'refuse' is the value `AI_RUN_MEDIA_HANDLING.REFUSE` carries. A migration records what the
    // schema did at one moment, so it holds the literal rather than reading a constant that is
    // free to be reworded after this file has run. A kind whose ending nobody has stated is the
    // one that must not be read, which is why the default is the refusing one.
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_NAME.HANDLING_NAME,
      {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'refuse',
      }
    )

    await queryInterface.sequelize.query(
      `ALTER TABLE \`${TABLE_NAME}\` DROP COLUMN \`${COLUMN_NAME.IS_ACTIVE}\``
    )

    return Promise.resolve()
  },

  async down (
    queryInterface,
    Sequelize
  ) {
    // The column comes back; the values it held do not, and the master seeder is what supplied
    // them in the first place. `false` is the reverse of the default above — a kind nobody has
    // spoken for is not one to read.
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_NAME.IS_ACTIVE,
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    )

    await queryInterface.sequelize.query(
      `ALTER TABLE \`${TABLE_NAME}\` DROP COLUMN \`${COLUMN_NAME.HANDLING_NAME}\``
    )

    return Promise.resolve()
  },
}
