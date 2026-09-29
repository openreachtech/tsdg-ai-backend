import PROVIDER_UPLOAD_PURGE_SWEEP_CONSTANT_HASH from '../../../../app/constants/providerUploadPurgeSweepConstants.js'

const {
  PROVIDER_UPLOAD_PURGE_SWEEP,
} = PROVIDER_UPLOAD_PURGE_SWEEP_CONSTANT_HASH

/*
 * How much work one provider-upload sweep does, read through the ESM bridge the application
 * imports.
 *
 * The product of the two is what a reader should check against the volume: a hundred files a batch
 * and two hundred batches is twenty thousand files in one nightly sweep, against the ~12,000 rows
 * a day the non-functional section is built for. The run purges' own pair would have given ten
 * thousand - less than one day's arrivals, a bound that could never catch up - which is why this
 * job has figures of its own rather than borrowing theirs.
 */

describe('providerUploadPurgeSweepConstants', () => {
  describe('PROVIDER_UPLOAD_PURGE_SWEEP', () => {
    describe('should hold the figures one sweep is bounded by', () => {
      const cases = [
        {
          input: {
            key: 'PROVIDER_UPLOADED_FILE_COUNT_PER_BATCH',
          },
          expected: 100,
        },
        {
          input: {
            key: 'MAXIMUM_BATCH_COUNT',
          },
          expected: 200,
        },
      ]

      test.each(cases)('key: $input.key', ({
        input,
        expected,
      }) => {
        const received = PROVIDER_UPLOAD_PURGE_SWEEP

        expect(received)
          .toHaveProperty(input.key, expected)
      })
    })
  })
})

describe('providerUploadPurgeSweepConstants', () => {
  describe('PROVIDER_UPLOAD_PURGE_SWEEP', () => {
    /*
     * Compared whole, because a retention horizon arriving in here is the shape to catch. This file
     * says how much work one scheduled run does; how long anything is kept is section 7's, and it
     * lives in two files of its own so that nobody can reach for "the retention setting".
     */
    describe('should declare the two figures and no other', () => {
      test('should be fixed value', () => {
        const expected = {
          PROVIDER_UPLOADED_FILE_COUNT_PER_BATCH: 100,
          MAXIMUM_BATCH_COUNT: 200,
        }

        const received = PROVIDER_UPLOAD_PURGE_SWEEP

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('providerUploadPurgeSweepConstants', () => {
  describe('the module it bridges', () => {
    describe('should declare the one category and no other', () => {
      test('should be fixed value', () => {
        const expected = [
          'PROVIDER_UPLOAD_PURGE_SWEEP',
        ]

        const received = Object.keys(PROVIDER_UPLOAD_PURGE_SWEEP_CONSTANT_HASH)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
