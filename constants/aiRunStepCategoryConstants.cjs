'use strict'

/*
 * Rows of the `ai_run_step_categories` master table.
 *
 * A step category names what kind of actor carried a step out. `NAME` is the system key the
 * application binds to; `DISPLAY_NAME` is free to be reworded without touching logic.
 *
 * `HUMAN` is on the record for a step this service does not run — the asset owner pressing Use
 * or Dismiss in the client system. Recording it keeps the responsibility boundary visible in
 * the trace rather than only in prose.
 *
 * The `DISPLAY_ORDER` values step by ten so a later category can be slotted between two
 * existing ones without renumbering.
 */
module.exports = {
  AI_RUN_STEP_CATEGORY: {
    CODE: {
      ID: 1,
      NAME: 'code',
      DISPLAY_NAME: 'Code',
      DISPLAY_ORDER: 10,
      IS_ACTIVE: true,
    },
    AI: {
      ID: 2,
      NAME: 'ai',
      DISPLAY_NAME: 'AI',
      DISPLAY_ORDER: 20,
      IS_ACTIVE: true,
    },
    HUMAN: {
      ID: 3,
      NAME: 'human',
      DISPLAY_NAME: 'Human',
      DISPLAY_ORDER: 30,
      IS_ACTIVE: true,
    },
  },
}
