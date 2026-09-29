'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_MODEL,
} = require('../../../constants/aiModelConstants.cjs')

/*
 * Master: the limits the Gemini 2.5 Flash payload is built against
 * (specs/1.0.0, #provider-layer, `ai_model_capabilities`).
 *
 * The two figures are the vendor's own published limits for this model, not figures this service
 * chose: 1,048,576 input tokens and 65,536 output tokens. They are data rather than code precisely
 * so that Google revising either is this row and nothing else - the driver reads `max_output_token`
 * at call time and sends it as the request's ceiling, and holds no number of its own.
 *
 * The row's own id is a plain literal: a capability row has no application-facing identity, so
 * nothing outside this file names it. The model it belongs to is read from the constant hash,
 * because that id is named in two places and must be the same in both.
 */

const TABLE_NAME = 'ai_model_capabilities'

const seeds = [
  {
    id: 11120001,
    ai_model_id: AI_MODEL.GEMINI_2_5_FLASH.ID,
    context_window_token: 1048576,
    max_output_token: 65536,
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
