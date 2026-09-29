'use strict'

/*
 * Rows of the `ai_run_field_statuses` master table.
 *
 * A field status names what a field a run settled came out as. `NAME` is the system key the
 * application binds to and the value the API echoes back as `fieldStateName`; `DISPLAY_NAME`
 * is free to be reworded without touching logic.
 *
 * `MISSING` is a state like any other here: a required field no absolute majority settled is
 * recorded as missing rather than guessed at, so the record says the field was considered and
 * not answered.
 *
 * The `DISPLAY_ORDER` values step by ten so a later state can be slotted between two existing
 * ones without renumbering.
 */
module.exports = {
  AI_RUN_FIELD_STATUS: {
    EXTRACTED: {
      ID: 1,
      NAME: 'extracted',
      DISPLAY_NAME: 'Extracted',
      DISPLAY_ORDER: 10,
      IS_ACTIVE: true,
    },
    DERIVED: {
      ID: 2,
      NAME: 'derived',
      DISPLAY_NAME: 'Derived',
      DISPLAY_ORDER: 20,
      IS_ACTIVE: true,
    },
    SUGGESTED: {
      ID: 3,
      NAME: 'suggested',
      DISPLAY_NAME: 'Suggested',
      DISPLAY_ORDER: 30,
      IS_ACTIVE: true,
    },
    MISSING: {
      ID: 4,
      NAME: 'missing',
      DISPLAY_NAME: 'Missing',
      DISPLAY_ORDER: 40,
      IS_ACTIVE: true,
    },
  },
}
