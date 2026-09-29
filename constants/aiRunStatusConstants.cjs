'use strict'

/*
 * Rows of the `ai_run_statuses` master table.
 *
 * A run status names the state a run is in. `NAME` is the system key the application binds to
 * and the value the API echoes back as `statusName`; `DISPLAY_NAME` is free to be reworded
 * without touching logic.
 *
 * `SUCCEEDED`, `FAILED` and `CANCELED` are the three terminal states — a run never leaves one
 * once it is there. That is a rule the run's own transitions enforce, so it is stated here for
 * a reader and carried by no column.
 *
 * The `DISPLAY_ORDER` values step by ten so a later state can be slotted between two existing
 * ones without renumbering.
 */
module.exports = {
  AI_RUN_STATUS: {
    QUEUED: {
      ID: 1,
      NAME: 'queued',
      DISPLAY_NAME: 'Queued',
      DISPLAY_ORDER: 10,
      IS_ACTIVE: true,
    },
    RUNNING: {
      ID: 2,
      NAME: 'running',
      DISPLAY_NAME: 'Running',
      DISPLAY_ORDER: 20,
      IS_ACTIVE: true,
    },
    SUCCEEDED: {
      ID: 3,
      NAME: 'succeeded',
      DISPLAY_NAME: 'Succeeded',
      DISPLAY_ORDER: 30,
      IS_ACTIVE: true,
    },
    FAILED: {
      ID: 4,
      NAME: 'failed',
      DISPLAY_NAME: 'Failed',
      DISPLAY_ORDER: 40,
      IS_ACTIVE: true,
    },
    CANCELED: {
      ID: 5,
      NAME: 'canceled',
      DISPLAY_NAME: 'Canceled',
      DISPLAY_ORDER: 50,
      IS_ACTIVE: true,
    },
  },
}
