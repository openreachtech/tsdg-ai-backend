import AI_RUN_RATE_LIMIT_CONSTANT_HASH from '../../../../app/constants/aiRunRateLimitConstants.js'

const {
  AI_RUN_RATE_LIMIT,
} = AI_RUN_RATE_LIMIT_CONSTANT_HASH

/*
 * The two figures the rate-limiting row of the non-functional section resolves to, read through the
 * ESM bridge the application imports - so the bridge resolving the CommonJS master is asserted by
 * the same test that asserts the values.
 *
 * They are written out as literals. The specification states neither figure, so there is no
 * arithmetic to repeat here and nothing to derive them from: what pins them is that a change to
 * either is a change somebody made on purpose, and shows up as a failing line naming the number
 * that moved.
 */

describe('aiRunRateLimitConstants', () => {
  describe('AI_RUN_RATE_LIMIT', () => {
    describe('should hold each figure the limit is applied with', () => {
      const cases = [
        {
          input: {
            key: 'MAXIMUM_ACCEPTED_AI_RUN_COUNT',
          },
          expected: 60,
        },
        {
          input: {
            key: 'WINDOW_SECOND_COUNT',
          },
          expected: 60,
        },
      ]

      test.each(cases)('key: $input.key', ({
        input,
        expected,
      }) => {
        const received = AI_RUN_RATE_LIMIT

        expect(received)
          .toHaveProperty(input.key, expected)
      })
    })
  })
})

describe('aiRunRateLimitConstants', () => {
  describe('AI_RUN_RATE_LIMIT', () => {
    /*
     * A third figure arriving here would be a rule nothing in the specification states, so the
     * whole hash is compared in one go.
     */
    describe('should declare the two figures and no other', () => {
      test('should be fixed value', () => {
        const expected = {
          MAXIMUM_ACCEPTED_AI_RUN_COUNT: 60,
          WINDOW_SECOND_COUNT: 60,
        }

        const received = AI_RUN_RATE_LIMIT

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
