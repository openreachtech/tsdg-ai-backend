'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_STEP_CATEGORY,
} = require('../../../constants/aiRunStepCategoryConstants.cjs')

/*
 * Master: the kinds of actor a run step can have (specs/1.0.0, #run-record,
 * `ai_run_step_categories`).
 *
 * Three rows — code, ai and human. The human row is for a step the client system performs and
 * this service only records, so the responsibility boundary sits in the trace rather than in
 * prose alone.
 *
 * Every value is read from `constants/aiRunStepCategoryConstants.cjs` rather than retyped,
 * because the application binds to the same hash: the id an `ai_run_steps` row carries has to
 * be the one seeded, and a second copy of it here would be free to drift.
 *
 * Master ids are the small, meaningful ones the constants declare, so this file is exempt from
 * the 10,000-wide id blocks that fixture data uses.
 */

const TABLE_NAME = 'ai_run_step_categories'

const seeds = [
  {
    id: AI_RUN_STEP_CATEGORY.CODE.ID,
    name: AI_RUN_STEP_CATEGORY.CODE.NAME,
    display_name: AI_RUN_STEP_CATEGORY.CODE.DISPLAY_NAME,
    display_order: AI_RUN_STEP_CATEGORY.CODE.DISPLAY_ORDER,
    is_active: AI_RUN_STEP_CATEGORY.CODE.IS_ACTIVE,
  },
  {
    id: AI_RUN_STEP_CATEGORY.AI.ID,
    name: AI_RUN_STEP_CATEGORY.AI.NAME,
    display_name: AI_RUN_STEP_CATEGORY.AI.DISPLAY_NAME,
    display_order: AI_RUN_STEP_CATEGORY.AI.DISPLAY_ORDER,
    is_active: AI_RUN_STEP_CATEGORY.AI.IS_ACTIVE,
  },
  {
    id: AI_RUN_STEP_CATEGORY.HUMAN.ID,
    name: AI_RUN_STEP_CATEGORY.HUMAN.NAME,
    display_name: AI_RUN_STEP_CATEGORY.HUMAN.DISPLAY_NAME,
    display_order: AI_RUN_STEP_CATEGORY.HUMAN.DISPLAY_ORDER,
    is_active: AI_RUN_STEP_CATEGORY.HUMAN.IS_ACTIVE,
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
