'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_MEDIA_CATEGORY,
} = require('../../../constants/aiRunMediaCategoryConstants.cjs')

/*
 * Development fixtures: the media of runs that already exist (specs/1.0.0, #media-fetch,
 * `ai_run_media`).
 *
 * The runs are the ones #run-contract seeded (`20260923100004-000002-ai_runs.cjs`). This file
 * seeds no run of its own: a second writer for `ai_runs` would give that table two sources of
 * truth, and a reference writes nothing and collides with nothing.
 *
 * Every state the three columns that carry an outcome can be in is on the table, because none of
 * them is readable from a table holding only files that worked:
 *
 *   - fetched and readable         `fetched_at` set, `is_readable` true. The ordinary case.
 *   - fetched and unreadable       `fetched_at` set, `is_readable` false. This is the medium a
 *                                  run reports under `unreadableMediaKeys`, and the state
 *                                  `MEDIA_UNREADABLE` is recorded for - distinct from a medium
 *                                  that was never fetched at all, which is `MEDIA_FETCH_FAILED`.
 *   - never fetched                `fetched_at` null, `is_readable` false. A run that was refused
 *                                  before fetching, one that failed earlier, and one still queued
 *                                  all leave rows in this state.
 *   - over the byte cap            `byte_size` past 10 MB, never fetched. The cap is checked
 *                                  against the declared size before anything is sent, so the row
 *                                  records what was declared and nothing was fetched for it.
 *   - a kind this version does not handle
 *                                  a video row and an audio row, neither fetched. They are here
 *                                  because the refusal names the kind, and a reader that ignored
 *                                  `ai_run_media_category_id` would look correct against a table
 *                                  holding images alone.
 *
 * `ai_run_media_category_id` and `mime_type` are categorical columns, so a value does repeat
 * across rows - two runs really are handed a JPEG. Every non-categorical value is distinct across
 * the whole file: no id, no media key, no byte size and no instant appears twice, and none of them
 * shares a value with a column of its own row.
 *
 * No file bytes are anywhere in this file, and none belong in the table it fills.
 */

const TABLE_NAME = 'ai_run_media'

const aiRunMediaSeeds = [
  {
    // run 10010004, succeeded - four images, all fetched and all read
    id: 10410001,
    ai_run_id: 10010004,
    media_key: 'media-key-front-elevation',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/jpeg',
    byte_size: 204811,
    is_readable: true,
    fetched_at: new Date('2026-09-12T01:01:02.111Z'),
  },
  {
    id: 10410002,
    ai_run_id: 10010004,
    media_key: 'media-key-living-room',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/png',
    byte_size: 512322,
    is_readable: true,
    fetched_at: new Date('2026-09-12T01:01:02.222Z'),
  },
  {
    id: 10410003,
    ai_run_id: 10010004,
    media_key: 'media-key-floor-plan',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/webp',
    byte_size: 98733,
    is_readable: true,
    fetched_at: new Date('2026-09-12T01:01:02.333Z'),
  },
  {
    id: 10410004,
    ai_run_id: 10010004,
    media_key: 'media-key-balcony-view',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/jpeg',
    byte_size: 761244,
    is_readable: true,
    fetched_at: new Date('2026-09-12T01:01:03.444Z'),
  },
  {
    // run 10010003, succeeded under the rotating client - its own media, so a reader that
    // filtered by run sees a different answer here than it sees for 10010004
    id: 10410005,
    ai_run_id: 10010003,
    media_key: 'media-key-entrance-hall',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/jpeg',
    byte_size: 333455,
    is_readable: true,
    fetched_at: new Date('2026-09-12T02:02:02.555Z'),
  },
  {
    id: 10410006,
    ai_run_id: 10010003,
    media_key: 'media-key-kitchen-counter',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/png',
    byte_size: 445566,
    is_readable: true,
    fetched_at: new Date('2026-09-12T02:02:02.666Z'),
  },
  {
    // fetched, and nothing could be read from it. The run still succeeded on the rest, and
    // this is the key it reports back under `unreadableMediaKeys`
    id: 10410007,
    ai_run_id: 10010003,
    media_key: 'media-key-corrupt-thumbnail',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/jpeg',
    byte_size: 1277,
    is_readable: false,
    fetched_at: new Date('2026-09-12T02:02:03.777Z'),
  },
  {
    // run 10010005, failed at the media step - the medium it failed on was fetched, and
    // unreadable. That is `MEDIA_UNREADABLE`, and the row below is the other reason code
    id: 10410008,
    ai_run_id: 10010005,
    media_key: 'media-key-broken-jpeg-payload',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/jpeg',
    byte_size: 617288,
    is_readable: false,
    fetched_at: new Date('2026-09-12T03:03:03.888Z'),
  },
  {
    // never fetched at all, because the run had already failed. `fetched_at` null with
    // `is_readable` false is the state a fetch that never happened leaves
    id: 10410009,
    ai_run_id: 10010005,
    media_key: 'media-key-never-reached',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/png',
    byte_size: 729399,
    is_readable: false,
    fetched_at: null,
  },
  {
    // run 10010009, failed - over the 10 MB cap, so nothing was fetched and nothing was sent.
    // The size is the caller's declared one, which is what the cap is checked against
    id: 10410010,
    ai_run_id: 10010009,
    media_key: 'media-key-oversized-panorama',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/jpeg',
    byte_size: 20971521,
    is_readable: false,
    fetched_at: null,
  },
  {
    // run 10010007, queued - a kind this version does not handle, named rather than ignored
    id: 10410011,
    ai_run_id: 10010007,
    media_key: 'media-key-walkthrough-clip',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.VIDEO.ID,
    mime_type: 'video/mp4',
    byte_size: 31457300,
    is_readable: false,
    fetched_at: null,
  },
  {
    // the third kind, on the same run, so the refusal has to name which one it means
    id: 10410012,
    ai_run_id: 10010007,
    media_key: 'media-key-agent-voice-note',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.AUDIO.ID,
    mime_type: 'audio/mpeg',
    byte_size: 2621444,
    is_readable: false,
    fetched_at: null,
  },
  {
    // run 10010001, still running - fetched, read, and the run has not finished with it yet
    id: 10410013,
    ai_run_id: 10010001,
    media_key: 'media-key-rooftop-terrace',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/webp',
    byte_size: 154877,
    is_readable: true,
    fetched_at: new Date('2026-09-12T04:04:03.999Z'),
  },
  {
    // run 10010006, canceled before its fetch step completed
    id: 10410014,
    ai_run_id: 10010006,
    media_key: 'media-key-canceled-before-fetch',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/png',
    byte_size: 268433,
    is_readable: false,
    fetched_at: null,
  },
  {
    // run 10010002, queued - accepted, and nothing has been fetched for it yet
    id: 10410015,
    ai_run_id: 10010002,
    media_key: 'media-key-awaiting-fetch',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/jpeg',
    byte_size: 391011,
    is_readable: false,
    fetched_at: null,
  },
  {
    // run 10010008, still running under the rotating client
    id: 10410016,
    ai_run_id: 10010008,
    media_key: 'media-key-storage-room',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/jpeg',
    byte_size: 187655,
    is_readable: true,
    fetched_at: new Date('2026-09-12T06:06:02.101Z'),
  },
  {
    // run 10010010, canceled after its media had already been fetched and handed over. The
    // egress record of it outlives the cancellation, which is the point of keeping the two apart
    id: 10410017,
    ai_run_id: 10010010,
    media_key: 'media-key-parking-space',
    ai_run_media_category_id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    mime_type: 'image/png',
    byte_size: 240066,
    is_readable: true,
    fetched_at: new Date('2026-09-12T07:07:02.202Z'),
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(aiRunMediaSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: aiRunMediaSeeds.map(it => it.id) })
  },
}
