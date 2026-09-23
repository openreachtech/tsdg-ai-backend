'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_CATEGORY,
} = require('../../../constants/aiRunCategoryConstants.cjs')

/*
 * Master: the AI services a run can belong to (specs/1.0.0, #run-contract, `ai_run_categories`).
 *
 * One row this version, for asset media extraction. Each later service adds an entry to
 * `constants/aiRunCategoryConstants.cjs` and a row here — never a column.
 *
 * Every value is read from that constant hash rather than retyped, because the application binds
 * to the same hash: the id an `ai_runs` row carries and the `name` the API echoes back have to be
 * the ones seeded, and a second copy of them here would be free to drift.
 *
 * Master ids are the small, meaningful ones the constants declare, so this file is exempt from the
 * 10,000-wide id blocks that fixture data uses.
 */

const TABLE_NAME = 'ai_run_categories'

const seeds = [
  {
    id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    name: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.NAME,
    display_name: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.DISPLAY_NAME,
    display_order: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.DISPLAY_ORDER,
    is_active: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.IS_ACTIVE,
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
