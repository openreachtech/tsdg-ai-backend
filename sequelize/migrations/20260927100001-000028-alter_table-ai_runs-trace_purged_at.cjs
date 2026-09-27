'use strict'

/*
 * Add the second purge stamp to `ai_runs`, and the two indexes the purges scan by (specs/1.0.0,
 * #retention).
 *
 * **Why the trace purge stamps at all.** Section 19's sentence - "Purging content sets the content
 * columns to null and stamps the run as purged, so a run whose content is gone stays
 * distinguishable from one that never carried any" - is written about content, because content is
 * what that paragraph is describing. The principle underneath it is not about content: a purge
 * that leaves no mark cannot be told from work that was never there. The trace is rows rather than
 * columns - `ai_run_steps`, `ai_model_calls`, `ai_run_field_outcomes` - so purging it deletes them,
 * and a run with no steps is exactly what a run canceled while still queued looks like. Without
 * this column those two runs are the same row to every reader, and section 19's fourth criterion -
 * "a run past the content horizon but inside the trace horizon still answers why a value was or
 * was not produced" - could not be told from a run past both.
 *
 * **What it does not mean.** The stamp says the trace rows were removed. It is not a soft delete
 * of the run: the run row itself survives both horizons, carrying its key, its client, its status
 * and its timeline, because `provider_uploaded_files` hangs off it through `ai_run_media` and
 * section 18 keeps that egress record "independently of whether the run's content still exists".
 * Nothing in the specification says a run record disappears, and this migration invents no third
 * clock under which it would.
 *
 * **Why two indexes rather than one on `accepted_at`.** Each purge scans for rows past its own
 * horizon that it has not already done: `content_purged_at IS NULL AND accepted_at < x`, and the
 * same with `trace_purged_at`. At the foreseen volume - ~1,000 runs a day - the table holds some
 * 730,000 rows by the time the longer horizon first fires, of which a day's scan wants about a
 * thousand. A single index on `accepted_at` alone would hand the job every row older than its
 * horizon, every day, and let it discard the ones it purged yesterday; leading with the stamp
 * makes the day's work the only thing read. They are two indexes because they are two clocks,
 * which is the same reason the two horizons are two files.
 */

const TABLE_NAME = 'ai_runs'
const COLUMN_NAME = {
  ACCEPTED_AT: 'accepted_at',
  CONTENT_PURGED_AT: 'content_purged_at',
  TRACE_PURGED_AT: 'trace_purged_at',
}

const CONTENT_PURGE_SCAN_INDEX_NAME = [
  TABLE_NAME,
  COLUMN_NAME.CONTENT_PURGED_AT,
  COLUMN_NAME.ACCEPTED_AT,
  'index',
].join('_')

const TRACE_PURGE_SCAN_INDEX_NAME = [
  TABLE_NAME,
  COLUMN_NAME.TRACE_PURGED_AT,
  COLUMN_NAME.ACCEPTED_AT,
  'index',
].join('_')

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    // Null for a run whose trace is still there, which is every run until the longer horizon
    // reaches it - so the column is nullable and carries no default, exactly as
    // `content_purged_at` does beside it.
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_NAME.TRACE_PURGED_AT,
      {
        type: Sequelize.DATE(3),
        allowNull: true,
      }
    )

    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.CONTENT_PURGED_AT,
      COLUMN_NAME.ACCEPTED_AT,
    ], {
      name: CONTENT_PURGE_SCAN_INDEX_NAME,
    })

    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.TRACE_PURGED_AT,
      COLUMN_NAME.ACCEPTED_AT,
    ], {
      name: TRACE_PURGE_SCAN_INDEX_NAME,
    })

    return Promise.resolve()
  },

  async down (
    queryInterface,
    Sequelize
  ) {
    await queryInterface.removeIndex(TABLE_NAME, TRACE_PURGE_SCAN_INDEX_NAME)

    await queryInterface.removeIndex(TABLE_NAME, CONTENT_PURGE_SCAN_INDEX_NAME)

    await queryInterface.sequelize.query(
      `ALTER TABLE \`${TABLE_NAME}\` DROP COLUMN \`${COLUMN_NAME.TRACE_PURGED_AT}\``
    )

    return Promise.resolve()
  },
}
