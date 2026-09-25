'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_FIELD_STATUS,
} = require('../../../constants/aiRunFieldStatusConstants.cjs')

/*
 * Master: the states a field a run settled can come out as (specs/1.0.0, #run-record,
 * `ai_run_field_statuses`).
 *
 * Four rows — extracted, derived, suggested and missing. Missing is recorded rather than left
 * absent, so a required field no absolute majority settled reads as considered and unanswered.
 *
 * Every value is read from `constants/aiRunFieldStatusConstants.cjs` rather than retyped,
 * because the application binds to the same hash: the id an `ai_run_field_outcomes` row carries
 * and the `name` the API echoes back have to be the ones seeded, and a second copy of them here
 * would be free to drift.
 *
 * Master ids are the small, meaningful ones the constants declare, so this file is exempt from
 * the 10,000-wide id blocks that fixture data uses.
 */

const TABLE_NAME = 'ai_run_field_statuses'

const seeds = [
  {
    id: AI_RUN_FIELD_STATUS.EXTRACTED.ID,
    name: AI_RUN_FIELD_STATUS.EXTRACTED.NAME,
    display_name: AI_RUN_FIELD_STATUS.EXTRACTED.DISPLAY_NAME,
    display_order: AI_RUN_FIELD_STATUS.EXTRACTED.DISPLAY_ORDER,
    is_active: AI_RUN_FIELD_STATUS.EXTRACTED.IS_ACTIVE,
  },
  {
    id: AI_RUN_FIELD_STATUS.DERIVED.ID,
    name: AI_RUN_FIELD_STATUS.DERIVED.NAME,
    display_name: AI_RUN_FIELD_STATUS.DERIVED.DISPLAY_NAME,
    display_order: AI_RUN_FIELD_STATUS.DERIVED.DISPLAY_ORDER,
    is_active: AI_RUN_FIELD_STATUS.DERIVED.IS_ACTIVE,
  },
  {
    id: AI_RUN_FIELD_STATUS.SUGGESTED.ID,
    name: AI_RUN_FIELD_STATUS.SUGGESTED.NAME,
    display_name: AI_RUN_FIELD_STATUS.SUGGESTED.DISPLAY_NAME,
    display_order: AI_RUN_FIELD_STATUS.SUGGESTED.DISPLAY_ORDER,
    is_active: AI_RUN_FIELD_STATUS.SUGGESTED.IS_ACTIVE,
  },
  {
    id: AI_RUN_FIELD_STATUS.MISSING.ID,
    name: AI_RUN_FIELD_STATUS.MISSING.NAME,
    display_name: AI_RUN_FIELD_STATUS.MISSING.DISPLAY_NAME,
    display_order: AI_RUN_FIELD_STATUS.MISSING.DISPLAY_ORDER,
    is_active: AI_RUN_FIELD_STATUS.MISSING.IS_ACTIVE,
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
