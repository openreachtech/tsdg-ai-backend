import AI_RUN_PURGE_SWEEP_CONSTANT_HASH from '../../../../app/constants/aiRunPurgeSweepConstants.js'

const {
  AI_RUN_PURGE_SWEEP,
} = AI_RUN_PURGE_SWEEP_CONSTANT_HASH

/*
 * The two figures bounding one scheduled purge, read through the ESM bridge the application
 * imports - so the bridge resolving the CommonJS master is asserted by the same test that asserts
 * the values.
 *
 * They are written out as literals, for the reason the page bounds are: section 19 states neither
 * of them, so there is no arithmetic to repeat here. What pins them is that a change to either is
 * a change somebody made on purpose, and shows up as a failing line naming the number that moved.
 */

describe('aiRunPurgeSweepConstants', () => {
  describe('AI_RUN_PURGE_SWEEP', () => {
    describe('should hold each figure one sweep is bounded by', () => {
      const cases = [
        {
          input: {
            key: 'AI_RUN_COUNT_PER_BATCH',
          },
          expected: 200,
        },
        {
          input: {
            key: 'MAXIMUM_BATCH_COUNT',
          },
          expected: 50,
        },
      ]

      test.each(cases)('key: $input.key', ({
        input,
        expected,
      }) => {
        expect(AI_RUN_PURGE_SWEEP)
          .toHaveProperty(input.key, expected)
      })
    })
  })
})
