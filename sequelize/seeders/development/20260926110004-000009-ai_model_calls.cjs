'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_MODEL,
} = require('../../../constants/aiModelConstants.cjs')

/*
 * Development fixtures: the model calls each run made (specs/1.0.0, #provider-layer,
 * `ai_model_calls`).
 *
 * The table had no development seeder at all, and the fifth and seventh acceptance criteria of
 * #run-delivery both read it: a run's body reports `usage` — how many model calls it made and the
 * tokens they spent — and a canceled run reports what was spent up to the stop. Against an empty
 * table every run reports three zeros, so a builder that had never summed anything, or that summed
 * the wrong column, would answer correctly for every run in the fixture set. These rows are what
 * makes that answer a read.
 *
 * The runs are the ones #run-contract seeded (`20260923100004-000002-ai_runs.cjs`). This file
 * seeds no run of its own: a second writer for `ai_runs` would give that table two sources of
 * truth, and a reference writes nothing and collides with nothing.
 *
 * What each run's calls are here to carry:
 *
 *   - 10010004 succeeded after three readings, which is the configured reading count. Its three
 *              rows are what a sum over more than one row is read from.
 *   - 10010003 succeeded after two readings on a different run, so filtering by run answers a
 *              different total rather than the same one twice.
 *   - 10010006 was canceled with two readings already spent, which is the criterion that a
 *              canceled run reports what it spent up to the stop rather than nothing.
 *   - 10010010 was canceled after a single reading, so "up to the stop" is read at two different
 *              stops rather than at one.
 *   - 10010001 is still running and has one reading behind it, so a run with no terminal state
 *              still reports what it has spent.
 *   - 10010009 failed on its provider, and the call that errored is still a call it made — a
 *              failed run reports what it spent rather than nothing. Its own medium was fetched
 *              and read (`20260926110001-000006-ai_run_media.cjs`), so the run really had
 *              something to send before the call it failed on ([[Q114]]).
 *   - 10010008 belongs to the rotating client and spends over two readings, so the totals are not
 *              all one client's.
 *   - 10010005 failed on its media before any reading, and is here by being absent: it has no row,
 *              and neither do the two queued runs nor 10010011, which was refused for the size of
 *              its medium before a provider was reached at all. So four of the eleven runs report
 *              three zeros, and a builder that answered zeros for everything is caught by the
 *              other seven.
 *
 * Every `input_token_count` and `output_token_count` is distinct across the whole file, and no two
 * of them share a value with a `latency_milliseconds` either, so a column read in place of another
 * fails loudly rather than summing to a number that happens to look right.
 *
 * `reading_index` is categorical and repeats across runs, as it must: every run's readings are
 * numbered from one. `action_name` likewise names the step, not the row.
 *
 * `response_body` is the only content in this table, and is the only column #retention's purge
 * empties. It is written here as an obviously-fake one line per row so that a purge test has
 * something to remove and a reader can never mistake it for a real model answer.
 */

const TABLE_NAME = 'ai_model_calls'

/*
 * The step a reading belongs to. Written once because every row of this file is the same step —
 * step 3 of section 20, the only one that asks a model anything.
 */
const READ_MEDIA_ACTION_NAME = 'read-media'

const aiModelCallSeeds = [
  {
    // run 10010004, reading 1 of 3
    id: 10520001,
    ai_run_id: 10010004,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 1,
    prompt_version: '2026-09-11T00:00:01.001Z',
    latency_milliseconds: 1310,
    input_token_count: 4801,
    output_token_count: 311,
    response_body: '{"stub":"reading 1 of run 10010004"}',
    called_at: new Date('2026-09-12T01:01:05.105Z'),
  },
  {
    // run 10010004, reading 2 of 3
    id: 10520002,
    ai_run_id: 10010004,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 2,
    prompt_version: '2026-09-11T00:00:01.001Z',
    latency_milliseconds: 1420,
    input_token_count: 4802,
    output_token_count: 322,
    response_body: '{"stub":"reading 2 of run 10010004"}',
    called_at: new Date('2026-09-12T01:01:07.207Z'),
  },
  {
    // run 10010004, reading 3 of 3
    id: 10520003,
    ai_run_id: 10010004,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 3,
    prompt_version: '2026-09-11T00:00:01.001Z',
    latency_milliseconds: 1530,
    input_token_count: 4803,
    output_token_count: 333,
    response_body: '{"stub":"reading 3 of run 10010004"}',
    called_at: new Date('2026-09-12T01:01:09.309Z'),
  },
  {
    // run 10010003, reading 1 of 2
    id: 10520004,
    ai_run_id: 10010003,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 1,
    prompt_version: '2026-09-11T00:00:02.002Z',
    latency_milliseconds: 1640,
    input_token_count: 3904,
    output_token_count: 244,
    response_body: '{"stub":"reading 1 of run 10010003"}',
    called_at: new Date('2026-09-12T02:02:05.105Z'),
  },
  {
    // run 10010003, reading 2 of 2
    id: 10520005,
    ai_run_id: 10010003,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 2,
    prompt_version: '2026-09-11T00:00:02.002Z',
    latency_milliseconds: 1750,
    input_token_count: 3905,
    output_token_count: 255,
    response_body: '{"stub":"reading 2 of run 10010003"}',
    called_at: new Date('2026-09-12T02:02:07.207Z'),
  },
  {
    // run 10010006, canceled — reading 1 of the two it spent before the stop
    id: 10520006,
    ai_run_id: 10010006,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 1,
    prompt_version: '2026-09-11T00:00:03.003Z',
    latency_milliseconds: 1860,
    input_token_count: 2706,
    output_token_count: 166,
    response_body: '{"stub":"reading 1 of run 10010006"}',
    called_at: new Date('2026-09-12T05:05:02.502Z'),
  },
  {
    // run 10010006, canceled — reading 2, the last thing it spent
    id: 10520007,
    ai_run_id: 10010006,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 2,
    prompt_version: '2026-09-11T00:00:03.003Z',
    latency_milliseconds: 1970,
    input_token_count: 2707,
    output_token_count: 177,
    response_body: '{"stub":"reading 2 of run 10010006"}',
    called_at: new Date('2026-09-12T05:05:03.603Z'),
  },
  {
    // run 10010010, canceled after a single reading — a second stop, spent differently
    id: 10520008,
    ai_run_id: 10010010,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 1,
    prompt_version: '2026-09-11T00:00:04.004Z',
    latency_milliseconds: 2080,
    input_token_count: 1508,
    output_token_count: 188,
    response_body: '{"stub":"reading 1 of run 10010010"}',
    called_at: new Date('2026-09-12T06:06:02.602Z'),
  },
  {
    // run 10010001, still running — one reading behind it and no terminal state
    id: 10520009,
    ai_run_id: 10010001,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 1,
    prompt_version: '2026-09-11T00:00:05.005Z',
    latency_milliseconds: 2190,
    input_token_count: 1609,
    output_token_count: 199,
    response_body: '{"stub":"reading 1 of run 10010001"}',
    called_at: new Date('2026-09-12T04:04:05.505Z'),
  },
  {
    // run 10010009, failed on its provider — the call that errored is still a call it made
    id: 10520010,
    ai_run_id: 10010009,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 1,
    prompt_version: '2026-09-11T00:00:06.006Z',
    latency_milliseconds: 2210,
    input_token_count: 1710,
    output_token_count: 210,
    response_body: '{"stub":"reading 1 of run 10010009"}',
    called_at: new Date('2026-09-12T09:09:10.510Z'),
  },
  {
    // run 10010008, still running under the rotating client — a second client spends too
    id: 10520011,
    ai_run_id: 10010008,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 1,
    prompt_version: '2026-09-11T00:00:07.007Z',
    latency_milliseconds: 2320,
    input_token_count: 1811,
    output_token_count: 221,
    response_body: '{"stub":"reading 1 of run 10010008"}',
    called_at: new Date('2026-09-12T08:08:10.510Z'),
  },
  {
    // run 10010008, reading 2 — so the rotating client's run sums over more than one row as well
    id: 10520012,
    ai_run_id: 10010008,
    ai_model_id: AI_MODEL.STUB.ID,
    action_name: READ_MEDIA_ACTION_NAME,
    reading_index: 2,
    prompt_version: '2026-09-11T00:00:07.007Z',
    latency_milliseconds: 2430,
    input_token_count: 1812,
    output_token_count: 232,
    response_body: '{"stub":"reading 2 of run 10010008"}',
    called_at: new Date('2026-09-12T08:08:12.512Z'),
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(aiModelCallSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: aiModelCallSeeds.map(it => it.id) })
  },
}
