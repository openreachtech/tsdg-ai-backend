'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_CALLBACK_DELIVERY_CATEGORY,
} = require('../../../constants/aiRunCallbackDeliveryCategoryConstants.cjs')

/*
 * Development fixtures: the attempts made at posting a run's terminal callback (specs/1.0.0,
 * #run-delivery, `ai_run_callback_deliveries`).
 *
 * The eighth acceptance criterion of #run-delivery is that a callback which fails to deliver is
 * retried, though a model call in the same run is not. "Was it retried" is a count of rows, and a
 * count is not readable from an empty table — nor from a table holding one attempt per run, which
 * would look correct against an implementation that never retried at all. So five of the six runs
 * below carry more than one attempt, and the attempt indexes run 1, 2, 3 rather than staying at 1.
 *
 * The runs are the ones #run-contract seeded (`20260923100004-000002-ai_runs.cjs`). This file
 * seeds no run of its own: a second writer for `ai_runs` would give that table two sources of
 * truth, and a reference writes nothing and collides with nothing. Only the six runs that reached
 * succeeded, failed or canceled appear here — a terminal callback is raised by a terminal
 * transition, so a queued or running run having one would be a fixture stating something the
 * domain does not allow.
 *
 * What each trace is here to carry:
 *
 *   - 10010004 landed on the first try, which is the shape a reader would wrongly take for the
 *              only one if it were the only trace here.
 *   - 10010003 was refused twice and landed on the third try, so the count of attempts is a
 *              number greater than two and an implementation that stopped after one fails.
 *   - 10010005 never completed either attempt — no connection, then no answer — so
 *              `http_status_code` is read NULL rather than assumed to always carry a number.
 *   - 10010006 was turned away once and landed next, mixing a refusal and a success on one run.
 *   - 10010009 was refused twice and has not landed, so a trace that is still failing is on the
 *              record too.
 *   - 10010010 never completed its first attempt and landed on the second, so a NULL and a status
 *              sit on one run.
 *
 * `http_status_code` is the whole of what the far side said: no response body is stored anywhere
 * in this table, because a client's own payload kept here would outlive the purge that removes it
 * everywhere else (#retention).
 *
 * `ai_run_id`, `ai_run_callback_delivery_category_id` and `attempt_index` are categorical, so a
 * value does repeat across rows — one run really does make several attempts, and a per-row-unique
 * attempt index would be a lie about the domain. Identity is the triple, which the table holds
 * unique. Every non-categorical value — every id and every instant — is distinct across the whole
 * file, and the status codes are chosen distinct wherever the case allows, so a column read in
 * place of another fails loudly.
 */

const TABLE_NAME = 'ai_run_callback_deliveries'

const aiRunCallbackDeliverySeeds = [
  {
    // landed on the first try
    id: 10510001,
    ai_run_id: 10010004,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 1,
    http_status_code: 200,
    attempted_at: new Date('2026-09-13T01:01:01.101Z'),
  },
  {
    // refused while the client's own service was unavailable
    id: 10510002,
    ai_run_id: 10010003,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 1,
    http_status_code: 503,
    attempted_at: new Date('2026-09-13T02:02:02.202Z'),
  },
  {
    // and again, on the far side's own error
    id: 10510003,
    ai_run_id: 10010003,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 2,
    http_status_code: 500,
    attempted_at: new Date('2026-09-13T02:02:12.302Z'),
  },
  {
    // landed on the third try, which is what makes "it was retried" a count rather than a guess
    id: 10510004,
    ai_run_id: 10010003,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 3,
    http_status_code: 204,
    attempted_at: new Date('2026-09-13T02:02:32.402Z'),
  },
  {
    // the connection was refused, so there was no status to record
    id: 10510005,
    ai_run_id: 10010005,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 1,
    http_status_code: null,
    attempted_at: new Date('2026-09-13T03:03:03.503Z'),
  },
  {
    // and the second attempt timed out, so the run still has no status on either try
    id: 10510006,
    ai_run_id: 10010005,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 2,
    http_status_code: null,
    attempted_at: new Date('2026-09-13T03:03:23.603Z'),
  },
  {
    // turned away by the far side's own rate limit
    id: 10510007,
    ai_run_id: 10010006,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 1,
    http_status_code: 429,
    attempted_at: new Date('2026-09-13T04:04:04.704Z'),
  },
  {
    // and accepted next, so a refusal and a success sit on one run
    id: 10510008,
    ai_run_id: 10010006,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 2,
    http_status_code: 202,
    attempted_at: new Date('2026-09-13T04:04:24.804Z'),
  },
  {
    // refused by whatever sits in front of the client's service
    id: 10510009,
    ai_run_id: 10010009,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 1,
    http_status_code: 502,
    attempted_at: new Date('2026-09-13T05:05:05.905Z'),
  },
  {
    // and again — a trace that is still failing, and has landed on nothing
    id: 10510010,
    ai_run_id: 10010009,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 2,
    http_status_code: 504,
    attempted_at: new Date('2026-09-13T05:05:35.015Z'),
  },
  {
    // the host never answered, so a NULL and a status sit on one run
    id: 10510011,
    ai_run_id: 10010010,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 1,
    http_status_code: null,
    attempted_at: new Date('2026-09-13T06:06:06.116Z'),
  },
  {
    // and the second attempt was accepted
    id: 10510012,
    ai_run_id: 10010010,
    ai_run_callback_delivery_category_id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    attempt_index: 2,
    http_status_code: 201,
    attempted_at: new Date('2026-09-13T06:06:36.216Z'),
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(aiRunCallbackDeliverySeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: aiRunCallbackDeliverySeeds.map(it => it.id) })
  },
}
