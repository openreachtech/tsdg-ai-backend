import AI_RUN_MEDIA_LIMIT_CONSTANT_HASH from '../../../../app/constants/aiRunMediaLimitConstants.js'

const {
  AI_RUN_MEDIA_LIMIT,
} = AI_RUN_MEDIA_LIMIT_CONSTANT_HASH

/*
 * The two figures of the non-functional section's media-limits row, read through the ESM bridge the
 * application imports - so the bridge resolving the CommonJS master is asserted by the same test
 * that asserts the values.
 *
 * They are written out as literals rather than computed here. Ten megabytes as `10 * 1024 * 1024`
 * is exactly the arithmetic the module under test performs, and an expectation that repeated it
 * would agree with whatever the module happened to hold - including a module that had quietly
 * switched to the decimal reading of the unit.
 */

describe('aiRunMediaLimitConstants', () => {
  describe('AI_RUN_MEDIA_LIMIT', () => {
    describe('should hold each limit a request is held to', () => {
      const cases = [
        {
          params: {
            key: 'MAXIMUM_BYTE_SIZE',
          },
          expected: 10485760,
        },
        {
          params: {
            key: 'MAXIMUM_MEDIA_COUNT',
          },
          expected: 12,
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
        expected,
      }) => {
        const actual = AI_RUN_MEDIA_LIMIT

        expect(actual)
          .toHaveProperty(params.key, expected)
      })
    })
  })
})

describe('aiRunMediaLimitConstants', () => {
  describe('AI_RUN_MEDIA_LIMIT', () => {
    /*
     * A third figure arriving here would be a limit nothing in the specification states, so the
     * whole hash is compared in one go.
     */
    describe('should declare the two limits and no other', () => {
      test('should be fixed value', () => {
        const expected = {
          MAXIMUM_BYTE_SIZE: 10485760,
          MAXIMUM_MEDIA_COUNT: 12,
        }

        const actual = AI_RUN_MEDIA_LIMIT

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
