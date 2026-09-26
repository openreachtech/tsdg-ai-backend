'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_MEDIA_CATEGORY,
} = require('../../../constants/aiRunMediaCategoryConstants.cjs')

/*
 * Master: the kinds of file a request may hand over (specs/1.0.0, #media-fetch,
 * `ai_run_media_categories`).
 *
 * Three rows — image, video and audio. Only image is read this version, and the other two are
 * seeded all the same: a request naming video has to resolve to a row here so the refusal can name
 * the kind, which is what tells a caller what to change. A kind with no row would be refused as an
 * unrecognized value instead, and the caller would be told nothing.
 *
 * `handling_name` carries what this version does with each of the three, and the three answers are
 * different: image is handled, video is refused under `MEDIA_UNSUPPORTED`, and audio is ignored.
 * Turning video on later is a value changed on an existing row and a fourth kind is a new row.
 * Neither is a change to a column.
 *
 * Every value is read from `constants/aiRunMediaCategoryConstants.cjs` rather than retyped, because
 * the application binds to the same hash: the id an `ai_run_media` row carries and the `name` the
 * contract carries as `mediaCategoryName` have to be the ones seeded, and a second copy of them
 * here would be free to drift.
 *
 * Master ids are the small, meaningful ones the constants declare, so this file is exempt from the
 * id blocks that fixture data uses.
 */

const TABLE_NAME = 'ai_run_media_categories'

const seeds = [
  {
    id: AI_RUN_MEDIA_CATEGORY.IMAGE.ID,
    name: AI_RUN_MEDIA_CATEGORY.IMAGE.NAME,
    display_name: AI_RUN_MEDIA_CATEGORY.IMAGE.DISPLAY_NAME,
    display_order: AI_RUN_MEDIA_CATEGORY.IMAGE.DISPLAY_ORDER,
    handling_name: AI_RUN_MEDIA_CATEGORY.IMAGE.HANDLING_NAME,
  },
  {
    id: AI_RUN_MEDIA_CATEGORY.VIDEO.ID,
    name: AI_RUN_MEDIA_CATEGORY.VIDEO.NAME,
    display_name: AI_RUN_MEDIA_CATEGORY.VIDEO.DISPLAY_NAME,
    display_order: AI_RUN_MEDIA_CATEGORY.VIDEO.DISPLAY_ORDER,
    handling_name: AI_RUN_MEDIA_CATEGORY.VIDEO.HANDLING_NAME,
  },
  {
    id: AI_RUN_MEDIA_CATEGORY.AUDIO.ID,
    name: AI_RUN_MEDIA_CATEGORY.AUDIO.NAME,
    display_name: AI_RUN_MEDIA_CATEGORY.AUDIO.DISPLAY_NAME,
    display_order: AI_RUN_MEDIA_CATEGORY.AUDIO.DISPLAY_ORDER,
    handling_name: AI_RUN_MEDIA_CATEGORY.AUDIO.HANDLING_NAME,
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
