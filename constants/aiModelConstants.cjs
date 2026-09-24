'use strict'

const {
  AI_PROVIDER,
} = require('./aiProviderConstants.cjs')

/*
 * Rows of the `ai_models` master table.
 *
 * A model row is what a processor is resolved by. `NAME` is the key this application selects a
 * model with — the value a processor answers for itself; `TARGET_MODEL_NAME` is the vendor's own
 * model id, sent verbatim in the payload. The two are separate values because they change for
 * different reasons: a vendor revises its model id without the application caring, and the
 * application keeps selecting by a name it chose.
 *
 * `STUB` is the only row a default installation has, and it is the default one — which is how
 * "no key is read and no outbound connection is opened" is expressed as data rather than as a
 * branch. Turning a real provider on is adding a row and moving `IS_DEFAULT`.
 *
 * Adding a model is a row here, never a column, and never a change to a service that uses one.
 *
 * The `DISPLAY_ORDER` values step by ten so a later model can be slotted between two existing
 * ones without renumbering.
 */
module.exports = {
  AI_MODEL: {
    STUB: {
      ID: 10110001,
      AI_PROVIDER_ID: AI_PROVIDER.STUB.ID,
      NAME: 'stub',
      TARGET_MODEL_NAME: 'stub-deterministic',
      IS_DEFAULT: true,
      IS_ACTIVE: true,
      DISPLAY_ORDER: 10,
    },
  },
}
