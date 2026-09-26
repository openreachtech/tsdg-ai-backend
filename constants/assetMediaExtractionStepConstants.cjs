'use strict'

const {
  AI_RUN_STEP_CATEGORY,
} = require('./aiRunStepCategoryConstants.cjs')

/*
 * The six steps an asset-media-extraction run executes, and the words each one is recorded under.
 *
 * **These are values of columns, not rows of a master table**, for the reason
 * `aiRunFailureReasonConstants.cjs` gives for its own set: nothing displays them. `ai_run_steps`
 * holds `step_name`, `outcome_code` and `reason_code` as plain strings and a master table for each
 * would only be a second place for the vocabulary to drift.
 *
 * **Every word here was fixed before this file existed**, by
 * `sequelize/seeders/development/*-ai_run_steps.cjs`, which seeded the trace of a run this service
 * had not yet built. The words are that seeder's; this file is where code reads them from, so a
 * rename lands in one place and the fixture is what disagrees loudly.
 *
 * **The three vocabularies are disjoint, and that is load-bearing.** No word appears in two of
 * them, so a column read in place of another fails at a reader's first glance rather than matching
 * by accident - which is the property the seeder's own comment states and this file preserves.
 *
 * **Two words the seeder does not carry, and why each is here.** `NO_FIELDS_KEPT` is §20's first
 * acceptance criterion - a run whose asset type has no suggestible field at all, which succeeds,
 * returns nothing and calls no model. The seeded traces are all of runs that had fields, so the
 * outcome of the run that had none had nowhere to be written down, and recording it as
 * `FIELDS_KEPT` would make the two runs indistinguishable in the trace an operator reads.
 * `READINGS_KEPT` is step 4 having dropped nothing: every seeded trace happens to drop something,
 * and `READINGS_DROPPED` beside an empty `rejections` payload would read as a drop nobody can
 * name.
 *
 * **The seventh step of §20 is deliberately absent.** `await-owner-decision` is the asset owner
 * pressing Use or Dismiss in the client system - not this service's step, and nothing here runs
 * it. The seeded trace carries it because a trace may record a boundary; a service that wrote it
 * would be claiming to have done it.
 */
module.exports = {
  ASSET_MEDIA_EXTRACTION_STEP: {
    FILTER_SUGGESTIBLE_FIELDS: {
      INDEX: 1,
      NAME: 'filter-suggestible-fields',
      CATEGORY_NAME: AI_RUN_STEP_CATEGORY.CODE.NAME,
    },
    FETCH_MEDIA: {
      INDEX: 2,
      NAME: 'fetch-media',
      CATEGORY_NAME: AI_RUN_STEP_CATEGORY.CODE.NAME,
    },
    READ_MEDIA: {
      INDEX: 3,
      NAME: 'read-media',
      CATEGORY_NAME: AI_RUN_STEP_CATEGORY.AI.NAME,
    },
    DROP_DISALLOWED_READINGS: {
      INDEX: 4,
      NAME: 'drop-disallowed-readings',
      CATEGORY_NAME: AI_RUN_STEP_CATEGORY.CODE.NAME,
    },
    SETTLE_BY_MAJORITY: {
      INDEX: 5,
      NAME: 'settle-by-majority',
      CATEGORY_NAME: AI_RUN_STEP_CATEGORY.CODE.NAME,
    },
    SCORE_CONFIDENCE: {
      INDEX: 6,
      NAME: 'score-confidence',
      CATEGORY_NAME: AI_RUN_STEP_CATEGORY.CODE.NAME,
    },
  },

  ASSET_MEDIA_EXTRACTION_STEP_OUTCOME_CODE: {
    FIELDS_KEPT: 'fields-kept',
    NO_FIELDS_KEPT: 'no-fields-kept',
    MEDIA_FETCHED: 'media-fetched',
    MEDIA_FETCH_FAILED: 'media-fetch-failed',
    READINGS_RETURNED: 'readings-returned',
    READINGS_KEPT: 'readings-kept',
    READINGS_DROPPED: 'readings-dropped',
    FIELDS_SETTLED: 'fields-settled',
    CONFIDENCE_SCORED: 'confidence-scored',
  },

  ASSET_MEDIA_EXTRACTION_STEP_REASON_CODE: {
    SCHEMA_CHECK_DROPPED_READINGS: 'schema-check-dropped-readings',
    MAJORITY_NOT_REACHED_FOR_SOME_FIELDS: 'majority-not-reached-for-some-fields',
  },
}
