import AI_RUN_CONTENT_RETENTION_CONSTANT_HASH from '../../../../app/constants/aiRunContentRetentionConstants.js'
import AI_RUN_TRACE_RETENTION_CONSTANT_HASH from '../../../../app/constants/aiRunTraceRetentionConstants.js'

const {
  AI_RUN_TRACE_RETENTION,
} = AI_RUN_TRACE_RETENTION_CONSTANT_HASH

/*
 * The one figure the trace clock is held to, read through the ESM bridge the application imports.
 *
 * This is the only file that reads both clocks, and it does so on purpose: the relation between
 * them - the trace outliving the content - is a property no single module can state, because the
 * requirement is that no single module holds both. A test is where such a relation is asserted;
 * application code naming both would be the combined setting section 7 forbids.
 */

describe('aiRunTraceRetentionConstants', () => {
  describe('AI_RUN_TRACE_RETENTION', () => {
    describe('should hold the figure section 7 states for the decision trace', () => {
      const cases = [
        {
          input: {
            key: 'DAY_COUNT',
          },
          expected: 730,
        },
      ]

      test.each(cases)('key: $input.key', ({
        input,
        expected,
      }) => {
        const received = AI_RUN_TRACE_RETENTION

        expect(received)
          .toHaveProperty(input.key, expected)
      })
    })
  })
})

describe('aiRunTraceRetentionConstants', () => {
  describe('AI_RUN_TRACE_RETENTION', () => {
    describe('should declare the one figure and no other', () => {
      test('should be fixed value', () => {
        const expected = {
          DAY_COUNT: 730,
        }

        const received = AI_RUN_TRACE_RETENTION

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('aiRunTraceRetentionConstants', () => {
  describe('the module it bridges', () => {
    describe('should declare the one category and no other', () => {
      test('should be fixed value', () => {
        const expected = [
          'AI_RUN_TRACE_RETENTION',
        ]

        const received = Object.keys(AI_RUN_TRACE_RETENTION_CONSTANT_HASH)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('aiRunTraceRetentionConstants', () => {
  /*
   * The trace has to outlive the content, and not merely differ from it. A trace removed while the
   * content it explains is still readable would leave a run answering what it produced and unable
   * to say why - which is the reverse of the second use case of section 19, and the one ordering of
   * the two figures that no reading of the requirement permits.
   */
  describe('the two clocks', () => {
    describe('should keep the trace beyond the content', () => {
      test('should be fixed value', () => {
        const expected = AI_RUN_CONTENT_RETENTION_CONSTANT_HASH.AI_RUN_CONTENT_RETENTION.DAY_COUNT

        const received = AI_RUN_TRACE_RETENTION.DAY_COUNT

        expect(received)
          .toBeGreaterThan(expected)
      })
    })
  })
})
