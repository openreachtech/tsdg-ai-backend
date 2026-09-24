'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_MODEL,
} = require('../../../constants/aiModelConstants.cjs')

/*
 * Master: the limits each model's payload is built against
 * (specs/1.0.0, #provider-layer, `ai_model_capabilities`).
 *
 * One row this version, for the stub. The stub sends nothing and so enforces nothing, but it
 * carries a capability row like every other model, because the payload is built against these
 * numbers before a driver is ever asked to send it — and a default installation has to exercise
 * that building, not skip it. Figures a real vendor would state, so the payload the stub path
 * builds is the size of a real one.
 *
 * The row's own id is a plain literal: a capability row has no application-facing identity, so
 * nothing outside this file names it.
 */

const TABLE_NAME = 'ai_model_capabilities'

const seeds = [
  {
    id: 10120001,
    ai_model_id: AI_MODEL.STUB.ID,
    context_window_token: 200000,
    max_output_token: 8192,
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(seeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: seeds.map(it => it.id) })
  },
}
