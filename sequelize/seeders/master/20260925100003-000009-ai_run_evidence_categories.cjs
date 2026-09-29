'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_EVIDENCE_CATEGORY,
} = require('../../../constants/aiRunEvidenceCategoryConstants.cjs')

/*
 * Master: the kinds of evidence a reading can rest on (specs/1.0.0, #run-record,
 * `ai_run_evidence_categories`).
 *
 * Three rows — something visible in the medium, an estimate made from it, and a prior drawn
 * from the category the subject belongs to. The confidence scorer weights by this, so a later
 * weighting adds a row here and never a column.
 *
 * Every value is read from `constants/aiRunEvidenceCategoryConstants.cjs` rather than retyped,
 * because the application binds to the same hash: the id an `ai_run_field_outcomes` row carries
 * has to be the one seeded, and a second copy of it here would be free to drift.
 *
 * Master ids are the small, meaningful ones the constants declare, so this file is exempt from
 * the 10,000-wide id blocks that fixture data uses.
 */

const TABLE_NAME = 'ai_run_evidence_categories'

const seeds = [
  {
    id: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID,
    name: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.NAME,
    display_name: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.DISPLAY_NAME,
    display_order: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.DISPLAY_ORDER,
    is_active: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.IS_ACTIVE,
  },
  {
    id: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.ID,
    name: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.NAME,
    display_name: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.DISPLAY_NAME,
    display_order: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.DISPLAY_ORDER,
    is_active: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.IS_ACTIVE,
  },
  {
    id: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.ID,
    name: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.NAME,
    display_name: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.DISPLAY_NAME,
    display_order: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.DISPLAY_ORDER,
    is_active: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.IS_ACTIVE,
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
