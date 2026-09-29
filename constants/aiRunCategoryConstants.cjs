'use strict'

/*
 * Rows of the `ai_run_categories` master table.
 *
 * A run category names the AI service that produced a run. `NAME` is the system key the
 * application binds to and the value the API echoes back as `runCategoryName`; `DISPLAY_NAME`
 * is free to be reworded without touching logic.
 *
 * Each later AI service adds an entry here and a row to the table — never a column. The
 * `DISPLAY_ORDER` values step by ten so a later service can be slotted between two existing
 * ones without renumbering.
 */
module.exports = {
  AI_RUN_CATEGORY: {
    ASSET_MEDIA_EXTRACTION: {
      ID: 1,
      NAME: 'asset-media-extraction',
      DISPLAY_NAME: 'Asset media extraction',
      DISPLAY_ORDER: 10,
      IS_ACTIVE: true,
    },
  },
}
