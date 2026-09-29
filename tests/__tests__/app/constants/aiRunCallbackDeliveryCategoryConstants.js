import AI_RUN_CALLBACK_DELIVERY_CATEGORY_CONSTANT_HASH from '../../../../app/constants/aiRunCallbackDeliveryCategoryConstants.js'

const {
  AI_RUN_CALLBACK_DELIVERY_CATEGORY,
} = AI_RUN_CALLBACK_DELIVERY_CATEGORY_CONSTANT_HASH

/*
 * The rows of `ai_run_callback_delivery_categories`, read through the ESM bridge the application
 * imports — so the bridge resolving the CommonJS master is asserted by the same test that asserts
 * the values.
 *
 * The whole hash is compared in one go rather than field by field, because the thing worth
 * catching is a row appearing that this version does not seed: #run-delivery declares one kind,
 * and the deferred progress callback is a second row of the master seeded by the version that
 * builds it, never a row that arrives here early.
 */

describe('aiRunCallbackDeliveryCategoryConstants', () => {
  describe('AI_RUN_CALLBACK_DELIVERY_CATEGORY', () => {
    describe('should declare the one kind this version seeds, and no other', () => {
      test('to be the whole hash', () => {
        const expected = { // Arrange
          TERMINAL: {
            ID: 1,
            NAME: 'terminal',
            DISPLAY_NAME: 'Terminal',
            DISPLAY_ORDER: 10,
            IS_ACTIVE: true,
          },
        }

        const actual = AI_RUN_CALLBACK_DELIVERY_CATEGORY // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})
