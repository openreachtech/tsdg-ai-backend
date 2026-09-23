'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_STATUS,
} = require('../../../constants/aiRunStatusConstants.cjs')

/*
 * Master: the states a run can be in (specs/1.0.0, #run-contract, `ai_run_statuses`).
 *
 * Five rows — queued, running, succeeded, failed, canceled. The last three are terminal, a rule
 * the run's own transitions enforce and no column here carries.
 *
 * Every value is read from `constants/aiRunStatusConstants.cjs` rather than retyped, because the
 * application binds to the same hash: the id an `ai_runs` row carries and the `name` the API
 * echoes back have to be the ones seeded, and a second copy of them here would be free to drift.
 *
 * Master ids are the small, meaningful ones the constants declare, so this file is exempt from the
 * 10,000-wide id blocks that fixture data uses.
 */

const TABLE_NAME = 'ai_run_statuses'

const seeds = [
  {
    id: AI_RUN_STATUS.QUEUED.ID,
    name: AI_RUN_STATUS.QUEUED.NAME,
    display_name: AI_RUN_STATUS.QUEUED.DISPLAY_NAME,
    display_order: AI_RUN_STATUS.QUEUED.DISPLAY_ORDER,
    is_active: AI_RUN_STATUS.QUEUED.IS_ACTIVE,
  },
  {
    id: AI_RUN_STATUS.RUNNING.ID,
    name: AI_RUN_STATUS.RUNNING.NAME,
    display_name: AI_RUN_STATUS.RUNNING.DISPLAY_NAME,
    display_order: AI_RUN_STATUS.RUNNING.DISPLAY_ORDER,
    is_active: AI_RUN_STATUS.RUNNING.IS_ACTIVE,
  },
  {
    id: AI_RUN_STATUS.SUCCEEDED.ID,
    name: AI_RUN_STATUS.SUCCEEDED.NAME,
    display_name: AI_RUN_STATUS.SUCCEEDED.DISPLAY_NAME,
    display_order: AI_RUN_STATUS.SUCCEEDED.DISPLAY_ORDER,
    is_active: AI_RUN_STATUS.SUCCEEDED.IS_ACTIVE,
  },
  {
    id: AI_RUN_STATUS.FAILED.ID,
    name: AI_RUN_STATUS.FAILED.NAME,
    display_name: AI_RUN_STATUS.FAILED.DISPLAY_NAME,
    display_order: AI_RUN_STATUS.FAILED.DISPLAY_ORDER,
    is_active: AI_RUN_STATUS.FAILED.IS_ACTIVE,
  },
  {
    id: AI_RUN_STATUS.CANCELED.ID,
    name: AI_RUN_STATUS.CANCELED.NAME,
    display_name: AI_RUN_STATUS.CANCELED.DISPLAY_NAME,
    display_order: AI_RUN_STATUS.CANCELED.DISPLAY_ORDER,
    is_active: AI_RUN_STATUS.CANCELED.IS_ACTIVE,
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
