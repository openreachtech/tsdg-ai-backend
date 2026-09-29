'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_PROVIDER,
} = require('../../../constants/aiProviderConstants.cjs')

/*
 * Master: the vendors the provider layer can speak to (specs/1.0.0, #provider-layer, `ai_providers`).
 *
 * One row this version, for the stub. The stub is seeded as an ordinary vendor rather than left
 * out of the catalog, because a default installation answers on it: the whole path — the job, the
 * steps, the record, the callback — has to resolve a real provider row on a machine with no key.
 *
 * Every value is read from `constants/aiProviderConstants.cjs` rather than retyped, because the
 * application binds to the same hash: the id an `ai_models` row carries has to be the one seeded,
 * and a second copy of it here would be free to drift.
 */

const TABLE_NAME = 'ai_providers'

const seeds = [
  {
    id: AI_PROVIDER.STUB.ID,
    name: AI_PROVIDER.STUB.NAME,
    display_name: AI_PROVIDER.STUB.DISPLAY_NAME,
    display_order: AI_PROVIDER.STUB.DISPLAY_ORDER,
    is_active: AI_PROVIDER.STUB.IS_ACTIVE,
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
