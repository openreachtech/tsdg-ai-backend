'use strict'

/*
 * Add the stamp that says a provider's own copy of an uploaded file is gone, and the index the
 * third purge scans by (specs/1.0.0, #retention).
 *
 * **Why the egress record needs a stamp of its own.** Section 19's third job "calls a provider to
 * delete what was uploaded", on a schedule of its own, and the criterion it answers is "files
 * uploaded to a provider are expired on a schedule of their own". A row records that a file left
 * this machine; nothing on it records that the copy at the far end no longer exists. Without that,
 * the job has no work set that shrinks: every row whose expiry has passed is picked again the next
 * day and the day after, for as long as the row is kept - and the row is kept, because section 18
 * keeps the egress record "independently of whether the run's content still exists". The stamp is
 * the same distinguishability `content_purged_at` gives a run, asked of a file: it answers "this
 * went, and it has since been taken back" apart from "this went".
 *
 * **What it does not do.** It removes nothing from this table. "Which file was handed to which
 * provider and when" is section 18's second use case and it is answered months later, so the row
 * outlives the copy it describes. This column is the date the copy stopped existing, beside the
 * date it started.
 *
 * **Why the index leads with the stamp.** The scan is "not yet taken back, and past its expiry".
 * A run carries up to 12 media and the foreseen volume is ~1,000 runs a day, so this table gains
 * some 12,000 rows a day and holds millions within the trace horizon - of which, in steady state,
 * one day's worth is the job's work. An index on the expiry alone would return every file that
 * ever expired; leading with the stamp returns the ones nobody has dealt with yet.
 *
 * **What the call that writes it looks like is not this migration's.** No provider-delete call
 * exists yet - the only driver this version ships is the stub, which uploads nothing - and whether
 * that criterion can be met on the stub at all is a question for the checkpoint that builds the
 * job. This is the column it would write, added now so that job is not also a schema change.
 */

const TABLE_NAME = 'provider_uploaded_files'
const COLUMN_NAME = {
  EXPIRES_AT: 'expires_at',
  PROVIDER_PURGED_AT: 'provider_purged_at',
}

const PROVIDER_PURGE_SCAN_INDEX_NAME = [
  TABLE_NAME,
  COLUMN_NAME.PROVIDER_PURGED_AT,
  COLUMN_NAME.EXPIRES_AT,
  'index',
].join('_')

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    // Null while the provider still holds the copy, which is every row until the job reaches it.
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_NAME.PROVIDER_PURGED_AT,
      {
        type: Sequelize.DATE(3),
        allowNull: true,
      }
    )

    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.PROVIDER_PURGED_AT,
      COLUMN_NAME.EXPIRES_AT,
    ], {
      name: PROVIDER_PURGE_SCAN_INDEX_NAME,
    })

    return Promise.resolve()
  },

  async down (
    queryInterface,
    Sequelize
  ) {
    await queryInterface.removeIndex(TABLE_NAME, PROVIDER_PURGE_SCAN_INDEX_NAME)

    await queryInterface.sequelize.query(
      `ALTER TABLE \`${TABLE_NAME}\` DROP COLUMN \`${COLUMN_NAME.PROVIDER_PURGED_AT}\``
    )

    return Promise.resolve()
  },
}
