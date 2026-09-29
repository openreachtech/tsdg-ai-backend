'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_MODEL,
} = require('../../../constants/aiModelConstants.cjs')

/*
 * Master: the first model that really calls a vendor
 * (specs/1.0.0, #provider-layer, `ai_models`).
 *
 * **`is_default` is false, and that is the load-bearing value in this file.** §17's first use case
 * is that the service answers on a machine with no key and no outbound access, and §22's second
 * version criterion is that the whole pass is demonstrable with no key and no provider call. Both
 * hold exactly while `is_default` belongs to the stub row. This row is reached only by a request
 * naming `gemini-2-5-flash`; nothing selects it otherwise, because
 * `BulkAiModelProcessorsLoader#resolveProcessor()` answers null for a name nothing claims and never
 * falls back to the default.
 *
 * **`is_active` true means the model may be asked for.** It does not mean anything asks for it. The
 * two are separate on purpose: turning the model off later is this value, and it is a data change.
 *
 * `name` is the key the application selects by and the processor answers for;
 * `target_model_name` is what the driver sends on. They are distinct values here, as the stub's
 * are, so that the split cannot be mixed up unnoticed.
 *
 * Every value is read from `constants/aiModelConstants.cjs` rather than retyped, because the
 * application binds to the same hash.
 */

const TABLE_NAME = 'ai_models'

const seeds = [
  {
    id: AI_MODEL.GEMINI_2_5_FLASH.ID,
    ai_provider_id: AI_MODEL.GEMINI_2_5_FLASH.AI_PROVIDER_ID,
    name: AI_MODEL.GEMINI_2_5_FLASH.NAME,
    target_model_name: AI_MODEL.GEMINI_2_5_FLASH.TARGET_MODEL_NAME,
    is_default: AI_MODEL.GEMINI_2_5_FLASH.IS_DEFAULT,
    is_active: AI_MODEL.GEMINI_2_5_FLASH.IS_ACTIVE,
    display_order: AI_MODEL.GEMINI_2_5_FLASH.DISPLAY_ORDER,
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
