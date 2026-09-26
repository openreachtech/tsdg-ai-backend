'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_PROVIDER,
} = require('../../../constants/aiProviderConstants.cjs')

/*
 * Development fixtures: what left this machine, and to whom (specs/1.0.0, #media-fetch,
 * `provider_uploaded_files`).
 *
 * The media are the ones `20260926110001-000006-ai_run_media.cjs` seeded and the provider is the
 * one #provider-layer seeded. This file seeds neither of them: a second writer for either table
 * would give it two sources of truth, and a reference writes nothing and collides with nothing.
 *
 * Only a medium that was actually fetched has a row here, because only a fetched file can be
 * handed over. Media that were refused, never reached, or of a kind this version does not handle
 * are deliberately absent - a reader that answered "everything the run was given" rather than
 * "everything that left" would look correct against a table where the two sets were the same.
 *
 * What the rows are here to carry:
 *
 *   - runs 10010004 and 10010003 succeeded, and their uploads are the ordinary case
 *   - medium 10410007 was uploaded and then could not be read. The upload happened all the same,
 *     so the egress record has to hold it - what left is a separate question from what came back
 *   - medium 10410008 belongs to a run that failed. Same reasoning, and the row outlives the run's
 *     content by design
 *   - medium 10410013 belongs to a run still going, and medium 10410017 to one that was canceled
 *     after the upload. Neither outcome removes what already left
 *   - medium 10410018 belongs to the run that failed on its provider. The file left and the call
 *     that used it errored, which is what `PROVIDER_CALL_FAILED` names - a run refused for the
 *     size of a file never reaches this table at all ([[Q114]])
 *
 * `expires_at` is on the table in all three of its states: already past, still ahead, and null for
 * a provider that stated none. The purge of expired provider uploads reads exactly this column, so
 * a table holding one state would let a job that ignored it pass.
 *
 * `ai_provider_id` is the same value on every row because one vendor is seeded this version; it is
 * a reference to a master row, not a per-row value. Every other value is distinct across the whole
 * file: no id, no medium, no provider file name and no instant appears twice.
 */

const TABLE_NAME = 'provider_uploaded_files'

const providerUploadedFileSeeds = [
  {
    // run 10010004 - already expired, so the purge job has something to reach
    id: 10420001,
    ai_run_media_id: 10410001,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-b7c1d0e2',
    uploaded_at: new Date('2026-09-12T01:01:05.011Z'),
    expires_at: new Date('2026-09-14T01:01:05.011Z'),
  },
  {
    // still ahead of its expiry
    id: 10420002,
    ai_run_media_id: 10410002,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-c8d2e1f3',
    uploaded_at: new Date('2026-09-12T01:01:05.022Z'),
    expires_at: new Date('2027-03-14T01:01:05.022Z'),
  },
  {
    // the provider stated no expiry, so nothing here claims one
    id: 10420003,
    ai_run_media_id: 10410003,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-d9e3f2a4',
    uploaded_at: new Date('2026-09-12T01:01:05.033Z'),
    expires_at: null,
  },
  {
    id: 10420004,
    ai_run_media_id: 10410004,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-e0f4a3b5',
    uploaded_at: new Date('2026-09-12T01:01:05.044Z'),
    expires_at: new Date('2027-03-15T01:01:05.044Z'),
  },
  {
    // run 10010003
    id: 10420005,
    ai_run_media_id: 10410005,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-f1a5b4c6',
    uploaded_at: new Date('2026-09-12T02:02:04.055Z'),
    expires_at: new Date('2027-03-16T02:02:04.055Z'),
  },
  {
    id: 10420006,
    ai_run_media_id: 10410006,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-a2b6c5d7',
    uploaded_at: new Date('2026-09-12T02:02:04.066Z'),
    expires_at: null,
  },
  {
    // uploaded, and then nothing could be read from it. The upload still happened
    id: 10420007,
    ai_run_media_id: 10410007,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-b3c7d6e8',
    uploaded_at: new Date('2026-09-12T02:02:04.077Z'),
    expires_at: new Date('2026-09-15T02:02:04.077Z'),
  },
  {
    // run 10010005 failed on this medium, and what left is still on the record
    id: 10420008,
    ai_run_media_id: 10410008,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-c4d8e7f9',
    uploaded_at: new Date('2026-09-12T03:03:04.088Z'),
    expires_at: new Date('2026-09-13T03:03:04.088Z'),
  },
  {
    // run 10010001 is still going, and this file has already left
    id: 10420009,
    ai_run_media_id: 10410013,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-d5e9f8a0',
    uploaded_at: new Date('2026-09-12T04:04:05.099Z'),
    expires_at: new Date('2027-03-17T04:04:05.099Z'),
  },
  {
    // run 10010008, still going under the rotating client
    id: 10420010,
    ai_run_media_id: 10410016,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-e6f0a9b1',
    uploaded_at: new Date('2026-09-12T06:06:04.110Z'),
    expires_at: null,
  },
  {
    // run 10010010 was canceled after this upload. The cancellation removes neither the row
    // nor the fact it records
    id: 10420011,
    ai_run_media_id: 10410017,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-f7a1b0c2',
    uploaded_at: new Date('2026-09-12T07:07:04.121Z'),
    expires_at: new Date('2026-09-13T07:07:04.121Z'),
  },
  {
    // run 10010009 failed on the call that used this file, and the file left all the same -
    // which is what makes `PROVIDER_CALL_FAILED` a failure of the call rather than of the fetch
    id: 10420012,
    ai_run_media_id: 10410018,
    ai_provider_id: AI_PROVIDER.STUB.ID,
    provider_file_name: 'stub-file-a8b2c1d3',
    uploaded_at: new Date('2026-09-12T09:09:10.132Z'),
    expires_at: new Date('2027-03-18T09:09:10.132Z'),
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(providerUploadedFileSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: providerUploadedFileSeeds.map(it => it.id) })
  },
}
