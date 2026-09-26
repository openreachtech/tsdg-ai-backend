import AI_RUN_PAGE_CONSTANT_HASH from '../../../../app/constants/aiRunPageConstants.js'

const {
  AI_RUN_PAGE,
} = AI_RUN_PAGE_CONSTANT_HASH

/*
 * The three figures one page of `GET /v1/ai-runs` is held to, read through the ESM bridge the
 * application imports — so the bridge resolving the CommonJS master is asserted by the same test
 * that asserts the values.
 *
 * They are written out as literals. Section 13 states none of them, so there is no arithmetic to
 * repeat here and nothing to derive them from: what pins them is that a change to any one is a
 * change somebody made on purpose, and shows up as a failing line naming the number that moved.
 */

describe('aiRunPageConstants', () => {
  describe('AI_RUN_PAGE', () => {
    describe('should hold each figure a page request is judged by', () => {
      const cases = [
        {
          input: {
            key: 'DEFAULT_RUN_COUNT',
          },
          expected: 20,
        },
        {
          input: {
            key: 'MAXIMUM_RUN_COUNT',
          },
          expected: 100,
        },
        {
          input: {
            key: 'MAXIMUM_STALLED_SECOND_COUNT',
          },
          expected: 31536000,
        },
      ]

      test.each(cases)('key: $input.key', ({
        input,
        expected,
      }) => {
        const received = AI_RUN_PAGE

        expect(received)
          .toHaveProperty(input.key, expected)
      })
    })
  })
})

describe('aiRunPageConstants', () => {
  describe('AI_RUN_PAGE', () => {
    /*
     * A fourth figure arriving here would be a bound nothing in section 13 states, so the whole
     * hash is compared in one go.
     */
    describe('should declare the three figures and no other', () => {
      test('should be fixed value', () => {
        const expected = {
          DEFAULT_RUN_COUNT: 20,
          MAXIMUM_RUN_COUNT: 100,
          MAXIMUM_STALLED_SECOND_COUNT: 31536000,
        }

        const received = AI_RUN_PAGE

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('aiRunPageConstants', () => {
  describe('AI_RUN_PAGE', () => {
    /*
     * The default has to be a page this route would answer were it asked for by name. A default
     * past the maximum would be a page nobody could ask for and every caller that asked for
     * nothing would get.
     */
    describe('should keep the default inside the maximum', () => {
      test('should be fixed value', () => {
        const expected = 100

        const received = AI_RUN_PAGE.DEFAULT_RUN_COUNT

        expect(received)
          .toBeLessThanOrEqual(expected)
      })
    })
  })
})
