'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_MODEL,
} = require('../../../constants/aiModelConstants.cjs')

/*
 * Master: the models a service can be answered by (specs/1.0.0, #provider-layer, `ai_models`).
 *
 * One row this version, for the stub, and it is the default one. A default installation therefore
 * selects a model by the same `is_default` / `is_active` mechanism every vendor is selected by —
 * there is no column saying "this one is the stub", and no branch anywhere reading one.
 *
 * `name` is the key the application selects by; `target_model_name` is what the driver sends on.
 * They are distinct values here on purpose: a seeder in which the two matched would be the one
 * place the split this feature turns on could be mixed up without anything noticing.
 *
 * Every value is read from `constants/aiModelConstants.cjs` rather than retyped, because the
 * application binds to the same hash.
 */

const TABLE_NAME = 'ai_models'

const seeds = [
  {
    id: AI_MODEL.STUB.ID,
    ai_provider_id: AI_MODEL.STUB.AI_PROVIDER_ID,
    name: AI_MODEL.STUB.NAME,
    target_model_name: AI_MODEL.STUB.TARGET_MODEL_NAME,
    is_default: AI_MODEL.STUB.IS_DEFAULT,
    is_active: AI_MODEL.STUB.IS_ACTIVE,
    display_order: AI_MODEL.STUB.DISPLAY_ORDER,
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
