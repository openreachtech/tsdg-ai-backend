'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_PROVIDER,
} = require('../../../constants/aiProviderConstants.cjs')

/*
 * Master: the first real vendor the provider layer can speak to
 * (specs/1.0.0, #provider-layer, `ai_providers`).
 *
 * One row, added rather than folded into the seeder beside it, because that one has already run
 * everywhere it is going to run. A vendor is added by adding a row - never by editing a seeder that
 * is already applied, and never by a column.
 *
 * `is_active` is true and that is not the same as "is used". A provider is reached only through the
 * `ai_models` row naming it, and the model row added alongside this one carries `is_default` false.
 * A default installation therefore still answers on the stub and still calls nobody.
 *
 * Every value is read from `constants/aiProviderConstants.cjs` rather than retyped, because the
 * application binds to the same hash: the id the `ai_models` row carries has to be the one seeded
 * here, and a second copy of it would be free to drift.
 */

const TABLE_NAME = 'ai_providers'

const seeds = [
  {
    id: AI_PROVIDER.GEMINI.ID,
    name: AI_PROVIDER.GEMINI.NAME,
    display_name: AI_PROVIDER.GEMINI.DISPLAY_NAME,
    display_order: AI_PROVIDER.GEMINI.DISPLAY_ORDER,
    is_active: AI_PROVIDER.GEMINI.IS_ACTIVE,
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
