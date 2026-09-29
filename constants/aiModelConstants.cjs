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

    /*
     * The first model that really calls a vendor.
     *
     * `IS_DEFAULT` is false, and that is the whole of what keeps §17's first use case and §22's
     * second version criterion true: a default installation answers on the stub because the stub
     * is the row carrying `is_default`, and this row is reached only by a request naming
     * `gemini-2-5-flash`. Moving the default onto this row would make a machine with no key call
     * Google on its first request.
     *
     * `NAME` and `TARGET_MODEL_NAME` differ the way the stub's do: the first is the key this
     * application selects by and the processor answers for, the second is the vendor's own model
     * id sent verbatim. Google revising the second is a change to this line and to nothing else.
     */
    GEMINI_2_5_FLASH: {
      ID: 11110001,
      AI_PROVIDER_ID: AI_PROVIDER.GEMINI.ID,
      NAME: 'gemini-2-5-flash',
      TARGET_MODEL_NAME: 'gemini-2.5-flash',
      IS_DEFAULT: false,
      IS_ACTIVE: true,
      DISPLAY_ORDER: 20,
    },
  },
}
