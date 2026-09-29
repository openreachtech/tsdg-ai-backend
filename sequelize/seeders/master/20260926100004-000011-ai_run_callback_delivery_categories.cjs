'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_CALLBACK_DELIVERY_CATEGORY,
} = require('../../../constants/aiRunCallbackDeliveryCategoryConstants.cjs')

/*
 * Master: which callback a delivery attempt was for (specs/1.0.0, #run-delivery,
 * `ai_run_callback_delivery_categories`).
 *
 * One row this version, for the callback raised when a run reaches succeeded, failed or canceled.
 * The deferred progress callback is a second row of this file and never a second column of
 * `ai_run_callback_deliveries` — the kind is a table so that adding one is data rather than a
 * migration.
 *
 * Every value is read from `constants/aiRunCallbackDeliveryCategoryConstants.cjs` rather than
 * retyped, because the application binds to the same hash: the id an `ai_run_callback_deliveries`
 * row carries has to be the one seeded, and a second copy of it here would be free to drift.
 *
 * Master ids are the small, meaningful ones the constants declare, so this file is exempt from
 * the 10,000-wide id blocks that fixture data uses.
 */

const TABLE_NAME = 'ai_run_callback_delivery_categories'

const seeds = [
  {
    id: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID,
    name: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.NAME,
    display_name: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.DISPLAY_NAME,
    display_order: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.DISPLAY_ORDER,
    is_active: AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.IS_ACTIVE,
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
