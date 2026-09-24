'use strict'

/*
 * Rows of the `ai_providers` master table.
 *
 * A provider names a vendor the provider layer can speak to. `NAME` is the system key the
 * application binds to; `DISPLAY_NAME` is free to be reworded without touching logic.
 *
 * `STUB` is a vendor like any other here, not a test double: it is the driver a default
 * installation runs, so the whole path is exercised on a machine with no key. Each real vendor
 * that is turned on later adds an entry here and a row to the table — never a column.
 *
 * The `DISPLAY_ORDER` values step by ten so a later vendor can be slotted between two existing
 * ones without renumbering.
 */
module.exports = {
  AI_PROVIDER: {
    STUB: {
      ID: 10100001,
      NAME: 'stub',
      DISPLAY_NAME: 'Stub',
      DISPLAY_ORDER: 10,
      IS_ACTIVE: true,
    },
  },
}
