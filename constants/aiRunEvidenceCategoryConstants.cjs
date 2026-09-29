'use strict'

/*
 * Rows of the `ai_run_evidence_categories` master table.
 *
 * An evidence category names what a reading rested on. `NAME` is the system key the application
 * binds to; `DISPLAY_NAME` is free to be reworded without touching logic.
 *
 * The three the spec describes, in the order a reading is worth less: something visible in the
 * medium, an estimate made from it, and a prior drawn from the category the subject belongs to.
 * The confidence scorer weights by this, which is why the set is a table rather than a branch
 * in code — a later weighting adds a row here, never a column.
 *
 * The `DISPLAY_ORDER` values step by ten so a later kind can be slotted between two existing
 * ones without renumbering.
 */
module.exports = {
  AI_RUN_EVIDENCE_CATEGORY: {
    VISIBLE_TEXT: {
      ID: 1,
      NAME: 'visible-text',
      DISPLAY_NAME: 'Visible text',
      DISPLAY_ORDER: 10,
      IS_ACTIVE: true,
    },
    VISUAL_ESTIMATE: {
      ID: 2,
      NAME: 'visual-estimate',
      DISPLAY_NAME: 'Visual estimate',
      DISPLAY_ORDER: 20,
      IS_ACTIVE: true,
    },
    CATEGORY_PRIOR: {
      ID: 3,
      NAME: 'category-prior',
      DISPLAY_NAME: 'Category prior',
      DISPLAY_ORDER: 30,
      IS_ACTIVE: true,
    },
  },
}
