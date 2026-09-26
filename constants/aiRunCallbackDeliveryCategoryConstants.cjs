'use strict'

/*
 * Rows of the `ai_run_callback_delivery_categories` master table.
 *
 * A callback delivery category names which callback a delivery attempt was for. `NAME` is the
 * system key the application binds to; `DISPLAY_NAME` is free to be reworded without touching
 * logic.
 *
 * One row this version, for the callback raised when a run reaches succeeded, failed or canceled.
 * The deferred progress callback is a second row here, never a second column of
 * `ai_run_callback_deliveries` — which is why the kind is a table rather than a boolean.
 *
 * The `DISPLAY_ORDER` values step by ten so a later kind can be slotted between two existing ones
 * without renumbering.
 */
module.exports = {
  AI_RUN_CALLBACK_DELIVERY_CATEGORY: {
    TERMINAL: {
      ID: 1,
      NAME: 'terminal',
      DISPLAY_NAME: 'Terminal',
      DISPLAY_ORDER: 10,
      IS_ACTIVE: true,
    },
  },
}
