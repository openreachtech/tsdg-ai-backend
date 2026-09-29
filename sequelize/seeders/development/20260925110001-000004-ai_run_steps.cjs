'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_STEP_CATEGORY,
} = require('../../../constants/aiRunStepCategoryConstants.cjs')

/*
 * Development fixtures: the step trace of runs that already exist (specs/1.0.0, #run-record,
 * `ai_run_steps`).
 *
 * The first use case of #run-record is an operator reading a run back with its steps in the order
 * they ran, each saying what it was and how long it took. None of that is readable from an empty
 * table, and none of it is readable from one run either - a reader that ignored the run it was
 * handed, or that answered in insertion order rather than in `step_index` order, would look
 * correct against a single trace.
 *
 * The runs are the ones #run-contract seeded (`20260923100004-000002-ai_runs.cjs`). This file
 * seeds no run of its own: a second writer for `ai_runs` would give that table two sources of
 * truth, and a reference writes nothing and collides with nothing.
 *
 * The traces, and what each is here to carry:
 *
 *   - 10010004 succeeded, and holds the whole run as #asset-media-extraction describes it: seven
 *              steps, one of them a model call and the last one the asset owner's own. Reading it
 *              back is the first use case, and all three step categories are on it.
 *   - 10010003 succeeded under a different client, in six steps. Its field paths and its timings
 *              are its own, so a reader that filtered by run sees a different answer than it sees
 *              for 10010004 rather than the same one twice.
 *   - 10010005 failed at the media step, and carries a reason code the successful runs do not.
 *   - 10010001 is still running: its third step has no `finished_at`, which is the state the
 *              column is nullable for.
 *   - 10010006 was canceled part-way, so a trace that simply stops is on the record too.
 *
 * `rejections` sits only on the two steps that drop something - the schema check and the majority
 * settle. It holds a field path, a reason code and figures, and never a value read out of a
 * medium: this row outlives the content by two years, so a value kept here would survive the purge
 * meant to remove it (#run-record, #retention). The entries of step 10240005 and step 10240012 say
 * the same thing the `missing` rows of `ai_run_field_outcomes` say, on purpose - the counts have
 * to agree between the step that decided and the field that records the decision.
 *
 * `step_name`, `outcome_code` and `reason_code` are three disjoint vocabularies: no word appears
 * in two of them, so one column read in place of another fails loudly. They are categorical
 * columns, so a value does repeat across runs - two runs really do run the same step, and a
 * per-row-unique step name would be a lie about the domain. Identity is the pair of run and step
 * index, which the table holds unique. Every non-categorical value - every id and every instant -
 * is distinct across the whole file.
 */

const TABLE_NAME = 'ai_run_steps'

/*
 * What the schema check of run 10010004 dropped. A path outside the schema, a select value that
 * was not among the options sent, a number outside the range sent and a value over the stated
 * maximum are four of the drops #asset-media-extraction names, and each is recorded by its path,
 * its reason and its figures alone.
 */
const REJECTIONS_OF_STEP_10240004 = JSON.stringify([
  {
    fieldPath: 'attributes.balconyDirectionSlug',
    reasonCode: 'select-option-not-offered',
    readingIndex: 1,
  },
  {
    fieldPath: 'attributes.buildYear',
    reasonCode: 'number-out-of-range',
    readingIndex: 2,
  },
  {
    fieldPath: 'attributes.ownerNote',
    reasonCode: 'field-path-outside-schema',
    readingIndex: 3,
  },
  {
    fieldPath: 'attributes.summaryText',
    reasonCode: 'value-over-max-length',
    readingIndex: 2,
    valueLength: 512,
    maxLength: 200,
  },
])

/*
 * What the majority settle of run 10010004 left unsettled. The two entries are the two `missing`
 * rows 10250007 and 10250008 record, and the counts are written in both places because a reader
 * traces from the field back to the step that decided it.
 */
const REJECTIONS_OF_STEP_10240005 = JSON.stringify([
  {
    fieldPath: 'attributes.balconyDirectionSlug',
    reasonCode: 'no-absolute-majority',
    agreedReadingCount: 1,
    totalReadingCount: 3,
  },
  {
    fieldPath: 'attributes.buildYear',
    reasonCode: 'no-absolute-majority',
    agreedReadingCount: 2,
    totalReadingCount: 5,
  },
])

/*
 * What the schema check of run 10010003 dropped - a different pair of reasons from 10240004's, so
 * the two payloads cannot be mistaken for one another.
 */
const REJECTIONS_OF_STEP_10240011 = JSON.stringify([
  {
    fieldPath: 'attributes.alleyWidth',
    reasonCode: 'number-failed-expected-form',
    readingIndex: 2,
  },
  {
    fieldPath: 'attributes.sourceUrl',
    reasonCode: 'field-path-outside-schema',
    readingIndex: 1,
  },
])

/*
 * What the majority settle of run 10010003 left unsettled. The one entry is the `missing` row
 * 10250012 records.
 */
const REJECTIONS_OF_STEP_10240012 = JSON.stringify([
  {
    fieldPath: 'attributes.alleyWidth',
    reasonCode: 'no-absolute-majority',
    agreedReadingCount: 1,
    totalReadingCount: 4,
  },
])

const aiRunStepSeeds = [
  {
    // run 10010004, succeeded - the whole trace, step 1 of 7
    id: 10240001,
    ai_run_id: 10010004,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 1,
    step_name: 'filter-suggestible-fields',
    outcome_code: 'fields-kept',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T01:01:01.001Z'),
    finished_at: new Date('2026-09-12T01:01:01.101Z'),
  },
  {
    id: 10240002,
    ai_run_id: 10010004,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 2,
    step_name: 'fetch-media',
    outcome_code: 'media-fetched',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T01:01:02.002Z'),
    finished_at: new Date('2026-09-12T01:01:04.202Z'),
  },
  {
    // the one model call of the run, and the only `ai` step it has
    id: 10240003,
    ai_run_id: 10010004,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.AI.ID,
    step_index: 3,
    step_name: 'read-media',
    outcome_code: 'readings-returned',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T01:01:05.005Z'),
    finished_at: new Date('2026-09-12T01:01:11.305Z'),
  },
  {
    // dropped four readings, and says of each only its path, its reason and its figures
    id: 10240004,
    ai_run_id: 10010004,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 4,
    step_name: 'drop-disallowed-readings',
    outcome_code: 'readings-dropped',
    rejections: REJECTIONS_OF_STEP_10240004,
    reason_code: 'schema-check-dropped-readings',
    started_at: new Date('2026-09-12T01:01:12.012Z'),
    finished_at: new Date('2026-09-12T01:01:12.412Z'),
  },
  {
    // two fields reached no absolute majority, and are recorded missing rather than guessed at
    id: 10240005,
    ai_run_id: 10010004,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 5,
    step_name: 'settle-by-majority',
    outcome_code: 'fields-settled',
    rejections: REJECTIONS_OF_STEP_10240005,
    reason_code: 'majority-not-reached-for-some-fields',
    started_at: new Date('2026-09-12T01:01:13.013Z'),
    finished_at: new Date('2026-09-12T01:01:13.513Z'),
  },
  {
    id: 10240006,
    ai_run_id: 10010004,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 6,
    step_name: 'score-confidence',
    outcome_code: 'confidence-scored',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T01:01:14.014Z'),
    finished_at: new Date('2026-09-12T01:01:14.614Z'),
  },
  {
    // not this service's step, and written down so the responsibility boundary is on the record
    id: 10240007,
    ai_run_id: 10010004,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.HUMAN.ID,
    step_index: 7,
    step_name: 'await-owner-decision',
    outcome_code: 'decision-recorded',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T01:01:15.015Z'),
    finished_at: new Date('2026-09-12T01:01:45.715Z'),
  },
  {
    // run 10010003, succeeded under the rotating client - a second trace, with its own timings
    id: 10240008,
    ai_run_id: 10010003,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 1,
    step_name: 'filter-suggestible-fields',
    outcome_code: 'fields-kept',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T02:02:01.001Z'),
    finished_at: new Date('2026-09-12T02:02:01.201Z'),
  },
  {
    id: 10240009,
    ai_run_id: 10010003,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 2,
    step_name: 'fetch-media',
    outcome_code: 'media-fetched',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T02:02:02.002Z'),
    finished_at: new Date('2026-09-12T02:02:03.802Z'),
  },
  {
    id: 10240010,
    ai_run_id: 10010003,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.AI.ID,
    step_index: 3,
    step_name: 'read-media',
    outcome_code: 'readings-returned',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T02:02:04.004Z'),
    finished_at: new Date('2026-09-12T02:02:09.504Z'),
  },
  {
    id: 10240011,
    ai_run_id: 10010003,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 4,
    step_name: 'drop-disallowed-readings',
    outcome_code: 'readings-dropped',
    rejections: REJECTIONS_OF_STEP_10240011,
    reason_code: 'schema-check-dropped-readings',
    started_at: new Date('2026-09-12T02:02:10.010Z'),
    finished_at: new Date('2026-09-12T02:02:10.310Z'),
  },
  {
    id: 10240012,
    ai_run_id: 10010003,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 5,
    step_name: 'settle-by-majority',
    outcome_code: 'fields-settled',
    rejections: REJECTIONS_OF_STEP_10240012,
    reason_code: 'majority-not-reached-for-some-fields',
    started_at: new Date('2026-09-12T02:02:11.011Z'),
    finished_at: new Date('2026-09-12T02:02:11.411Z'),
  },
  {
    id: 10240013,
    ai_run_id: 10010003,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 6,
    step_name: 'score-confidence',
    outcome_code: 'confidence-scored',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T02:02:12.012Z'),
    finished_at: new Date('2026-09-12T02:02:12.712Z'),
  },
  {
    // run 10010005, failed - step 1 went through
    id: 10240014,
    ai_run_id: 10010005,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 1,
    step_name: 'filter-suggestible-fields',
    outcome_code: 'fields-kept',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T03:03:01.001Z'),
    finished_at: new Date('2026-09-12T03:03:01.301Z'),
  },
  {
    // the step the run failed on, and the only reason code the failed run carries
    id: 10240015,
    ai_run_id: 10010005,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 2,
    step_name: 'fetch-media',
    outcome_code: 'media-fetch-failed',
    rejections: null,
    reason_code: 'media-unreadable',
    started_at: new Date('2026-09-12T03:03:02.002Z'),
    finished_at: new Date('2026-09-12T03:03:05.902Z'),
  },
  {
    // run 10010001, running - the first two steps are behind it
    id: 10240016,
    ai_run_id: 10010001,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 1,
    step_name: 'filter-suggestible-fields',
    outcome_code: 'fields-kept',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T04:04:01.001Z'),
    finished_at: new Date('2026-09-12T04:04:01.401Z'),
  },
  {
    id: 10240017,
    ai_run_id: 10010001,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 2,
    step_name: 'fetch-media',
    outcome_code: 'media-fetched',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T04:04:02.002Z'),
    finished_at: new Date('2026-09-12T04:04:04.702Z'),
  },
  {
    // still running - `finished_at` is null, which is the state the column is nullable for
    id: 10240018,
    ai_run_id: 10010001,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.AI.ID,
    step_index: 3,
    step_name: 'read-media',
    outcome_code: 'in-progress',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T04:04:05.005Z'),
    finished_at: null,
  },
  {
    // run 10010006, canceled - step 1 went through
    id: 10240019,
    ai_run_id: 10010006,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 1,
    step_name: 'filter-suggestible-fields',
    outcome_code: 'fields-kept',
    rejections: null,
    reason_code: null,
    started_at: new Date('2026-09-12T05:05:01.001Z'),
    finished_at: new Date('2026-09-12T05:05:01.501Z'),
  },
  {
    // the step cancellation took effect on, so a trace that simply stops is on the record
    id: 10240020,
    ai_run_id: 10010006,
    ai_run_step_category_id: AI_RUN_STEP_CATEGORY.CODE.ID,
    step_index: 2,
    step_name: 'fetch-media',
    outcome_code: 'step-canceled',
    rejections: null,
    reason_code: 'canceled-before-completion',
    started_at: new Date('2026-09-12T05:05:02.002Z'),
    finished_at: new Date('2026-09-12T05:05:03.902Z'),
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(aiRunStepSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: aiRunStepSeeds.map(it => it.id) })
  },
}
