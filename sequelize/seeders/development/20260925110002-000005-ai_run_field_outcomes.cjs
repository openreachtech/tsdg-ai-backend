'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_FIELD_STATUS,
} = require('../../../constants/aiRunFieldStatusConstants.cjs')
const {
  AI_RUN_EVIDENCE_CATEGORY,
} = require('../../../constants/aiRunEvidenceCategoryConstants.cjs')

/*
 * Development fixtures: how each field a run settled was scored (specs/1.0.0, #run-record,
 * `ai_run_field_outcomes`).
 *
 * The second use case of #run-record is an operator asked why a run returned no value for a field,
 * reading the agreement counts here and the reason code on the step that settled it. That question
 * is only answerable when a row exists that settled nothing - so the `missing` rows are the point
 * of this file, not an afterthought on it.
 *
 * Nothing here holds a value read out of a medium. Every column is a decision: what the field came
 * out as, what the majority reading rested on, the score, the counts behind it, and the version of
 * the formula. That is what lets the row stay on the two-year clock while the content it was read
 * from is purged at thirty days (#retention), and what lets a run still answer for itself
 * afterwards.
 *
 * `AiRunStepId` is NOT NULL, so every row points at a step of `20260925110001-000004-ai_run_steps`,
 * and at a step of its own run:
 *
 *   - a scored field points at that run's `score-confidence` step, because that is the step that
 *     set its state and its confidence.
 *   - a `missing` field points at that run's `settle-by-majority` step, because the majority is
 *     where it was decided and that step never reached scoring. Its reason code is the one the
 *     operator reads, and the step's `rejections` repeats the counts written here.
 *
 * The rows are spread over the two runs that succeeded - 10010004 and 10010003, seeded by
 * #run-contract - so filtering by run returns a different answer each time rather than the same
 * one twice. They also carry two different `confidence_method_version` values, because
 * recalibrating the formula makes a new version rather than a change to any run already recorded:
 * a reader that assumed one version across the table is caught here.
 *
 * `suggestion_confidence` spans the width of `DECIMAL(5, 4)` - from 1.0000 down to 0.0125 - and no
 * two rows share a score, so a test cannot pass by accident against a single value.
 *
 * Agreement is written so that `agreed_reading_count` differs from `total_reading_count` on every
 * row but 10250001, whose 3 of 3 is the deliberate unanimity case the 1.0000 score belongs to.
 * Every `missing` row is below an absolute majority of its total, which is why it is missing.
 */

const TABLE_NAME = 'ai_run_field_outcomes'

/*
 * The version each run was scored under. Written once and read on every row of that run, because
 * one run is scored by one formula, and two literals free to drift apart would make a run look
 * scored two ways at once.
 */
const CONFIDENCE_METHOD_VERSION_OF_RUN_10010004 = 'confidence-v1.0.0'
const CONFIDENCE_METHOD_VERSION_OF_RUN_10010003 = 'confidence-v1.1.0'

const aiRunFieldOutcomeSeeds = [
  {
    // extracted, unanimous, and the only row where the two counts match
    id: 10250001,
    ai_run_id: 10010004,
    ai_run_step_id: 10240006,
    field_path: 'attributes.floorArea',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.EXTRACTED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID,
    suggestion_confidence: '1.0000',
    agreed_reading_count: 3,
    total_reading_count: 3,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010004,
    settled_at: new Date('2026-09-12T01:01:14.114Z'),
  },
  {
    // extracted on a majority rather than on every reading
    id: 10250002,
    ai_run_id: 10010004,
    ai_run_step_id: 10240006,
    field_path: 'attributes.bedroomCount',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.EXTRACTED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID,
    suggestion_confidence: '0.8400',
    agreed_reading_count: 2,
    total_reading_count: 3,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010004,
    settled_at: new Date('2026-09-12T01:01:14.214Z'),
  },
  {
    // derived - the majority rested on an estimate made from the medium, not on text in it
    id: 10250003,
    ai_run_id: 10010004,
    ai_run_step_id: 10240006,
    field_path: 'attributes.facadeWidth',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.DERIVED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.ID,
    suggestion_confidence: '0.6500',
    agreed_reading_count: 4,
    total_reading_count: 5,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010004,
    settled_at: new Date('2026-09-12T01:01:14.314Z'),
  },
  {
    id: 10250004,
    ai_run_id: 10010004,
    ai_run_step_id: 10240006,
    field_path: 'attributes.roadWidth',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.DERIVED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.ID,
    suggestion_confidence: '0.5100',
    agreed_reading_count: 2,
    total_reading_count: 3,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010004,
    settled_at: new Date('2026-09-12T01:01:14.414Z'),
  },
  {
    // suggested - the majority rested on a prior drawn from the category, the weakest evidence
    id: 10250005,
    ai_run_id: 10010004,
    ai_run_step_id: 10240006,
    field_path: 'attributes.legalStatusSlug',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.SUGGESTED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.ID,
    suggestion_confidence: '0.3300',
    agreed_reading_count: 3,
    total_reading_count: 5,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010004,
    settled_at: new Date('2026-09-12T01:01:14.514Z'),
  },
  {
    // the smallest score the table holds - a bare majority on the weakest evidence
    id: 10250006,
    ai_run_id: 10010004,
    ai_run_step_id: 10240006,
    field_path: 'attributes.furnishingSlug',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.SUGGESTED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.ID,
    suggestion_confidence: '0.0125',
    agreed_reading_count: 2,
    total_reading_count: 3,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010004,
    settled_at: new Date('2026-09-12T01:01:14.564Z'),
  },
  {
    // missing - no evidence and no score, because nothing was settled. 1 of 3 is under a majority,
    // and step 10240005 records the same two counts against the same path
    id: 10250007,
    ai_run_id: 10010004,
    ai_run_step_id: 10240005,
    field_path: 'attributes.balconyDirectionSlug',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.MISSING.ID,
    ai_run_evidence_category_id: null,
    suggestion_confidence: null,
    agreed_reading_count: 1,
    total_reading_count: 3,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010004,
    settled_at: new Date('2026-09-12T01:01:13.113Z'),
  },
  {
    // missing on a wider reading count - 2 of 5 is under a majority of 5
    id: 10250008,
    ai_run_id: 10010004,
    ai_run_step_id: 10240005,
    field_path: 'attributes.buildYear',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.MISSING.ID,
    ai_run_evidence_category_id: null,
    suggestion_confidence: null,
    agreed_reading_count: 2,
    total_reading_count: 5,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010004,
    settled_at: new Date('2026-09-12T01:01:13.213Z'),
  },
  {
    // run 10010003 - the same field path as 10250001 under another run, which the unique pair of
    // run and path allows and a lookup that forgot the run would confuse
    id: 10250009,
    ai_run_id: 10010003,
    ai_run_step_id: 10240013,
    field_path: 'attributes.floorArea',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.EXTRACTED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID,
    suggestion_confidence: '0.9700',
    agreed_reading_count: 3,
    total_reading_count: 4,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010003,
    settled_at: new Date('2026-09-12T02:02:12.112Z'),
  },
  {
    id: 10250010,
    ai_run_id: 10010003,
    ai_run_step_id: 10240013,
    field_path: 'attributes.orientationSlug',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.SUGGESTED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.ID,
    suggestion_confidence: '0.2400',
    agreed_reading_count: 2,
    total_reading_count: 3,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010003,
    settled_at: new Date('2026-09-12T02:02:12.212Z'),
  },
  {
    id: 10250011,
    ai_run_id: 10010003,
    ai_run_step_id: 10240013,
    field_path: 'attributes.floorCount',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.DERIVED.ID,
    ai_run_evidence_category_id: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.ID,
    suggestion_confidence: '0.7300',
    agreed_reading_count: 3,
    total_reading_count: 4,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010003,
    settled_at: new Date('2026-09-12T02:02:12.312Z'),
  },
  {
    // the second run's missing field, settled by its own majority step 10240012
    id: 10250012,
    ai_run_id: 10010003,
    ai_run_step_id: 10240012,
    field_path: 'attributes.alleyWidth',
    ai_run_field_status_id: AI_RUN_FIELD_STATUS.MISSING.ID,
    ai_run_evidence_category_id: null,
    suggestion_confidence: null,
    agreed_reading_count: 1,
    total_reading_count: 4,
    confidence_method_version: CONFIDENCE_METHOD_VERSION_OF_RUN_10010003,
    settled_at: new Date('2026-09-12T02:02:11.111Z'),
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(aiRunFieldOutcomeSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: aiRunFieldOutcomeSeeds.map(it => it.id) })
  },
}
