import AI_RUN_CONTENT_RETENTION_CONSTANT_HASH from '../../../../app/constants/aiRunContentRetentionConstants.js'

const {
  AI_RUN_CONTENT_RETENTION,
} = AI_RUN_CONTENT_RETENTION_CONSTANT_HASH

/*
 * The one figure the content clock is held to, read through the ESM bridge the application
 * imports - so the bridge resolving the CommonJS master is asserted by the same test that asserts
 * the value.
 *
 * Section 7 states the number, so it is written out as the literal it states rather than derived
 * from anything: a change to it is a change somebody made on purpose, and shows up as a failing
 * line naming the number that moved.
 */

describe('aiRunContentRetentionConstants', () => {
  describe('AI_RUN_CONTENT_RETENTION', () => {
    describe('should hold the figure section 7 states for content', () => {
      const cases = [
        {
          input: {
            key: 'DAY_COUNT',
          },
          expected: 30,
        },
      ]

      test.each(cases)('key: $input.key', ({
        input,
        expected,
      }) => {
        const received = AI_RUN_CONTENT_RETENTION

        expect(received)
          .toHaveProperty(input.key, expected)
      })
    })
  })
})

describe('aiRunContentRetentionConstants', () => {
  describe('AI_RUN_CONTENT_RETENTION', () => {
    /*
     * "Two separate settings, never one" is what the whole-hash comparison is for. A second key
     * arriving here would be the trace's figure moving in beside the content's, which is the one
     * shape section 7 forbids - and it would arrive without any line of this file failing unless
     * the hash is compared whole.
     */
    describe('should declare the one figure and no other', () => {
      test('should be fixed value', () => {
        const expected = {
          DAY_COUNT: 30,
        }

        const received = AI_RUN_CONTENT_RETENTION

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('aiRunContentRetentionConstants', () => {
  /*
   * The master answers for the content clock and for nothing else. A module that also answered for
   * the trace would be the single setting the requirement rules out, whatever the keys inside it
   * were called.
   */
  describe('the module it bridges', () => {
    describe('should declare the one category and no other', () => {
      test('should be fixed value', () => {
        const expected = [
          'AI_RUN_CONTENT_RETENTION',
        ]

        const received = Object.keys(AI_RUN_CONTENT_RETENTION_CONSTANT_HASH)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
