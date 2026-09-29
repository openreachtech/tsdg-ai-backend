import PROVIDER_UPLOADED_FILE_RETENTION_CONSTANT_HASH from '../../../../app/constants/providerUploadedFileRetentionConstants.js'

const {
  PROVIDER_UPLOADED_FILE_RETENTION,
} = PROVIDER_UPLOADED_FILE_RETENTION_CONSTANT_HASH

/*
 * The wait before a copy nobody dated is asked about, read through the ESM bridge the application
 * imports - so the bridge resolving the CommonJS master is asserted by the same test that asserts
 * the value.
 *
 * The figure is written out as the literal rather than derived from anything: a change to it is a
 * change somebody made on purpose, and shows up as a failing line naming the number that moved.
 * What bounds it below is section 7's 300-second cap on a whole run, so a value under an hour
 * would put the purge in a position to delete a copy out from under a live request; what bounds it
 * above is that a provider stating no expiry will never remove the copy on its own.
 */

describe('providerUploadedFileRetentionConstants', () => {
  describe('PROVIDER_UPLOADED_FILE_RETENTION', () => {
    describe('should hold the wait for a provider that dated nothing', () => {
      const cases = [
        {
          input: {
            key: 'UNSTATED_EXPIRY_DAY_COUNT',
          },
          expected: 1,
        },
      ]

      test.each(cases)('key: $input.key', ({
        input,
        expected,
      }) => {
        const received = PROVIDER_UPLOADED_FILE_RETENTION

        expect(received)
          .toHaveProperty(input.key, expected)
      })
    })
  })
})

describe('providerUploadedFileRetentionConstants', () => {
  describe('PROVIDER_UPLOADED_FILE_RETENTION', () => {
    /*
     * Compared whole, because the hazard here is a second key arriving rather than this one
     * changing. A figure named for the ordinary case - "how long a provider may hold a copy" -
     * would read as a retention promise of this service's, and section 7 has exactly two of those.
     * Nothing in this file may grow into a third.
     */
    describe('should declare the one figure and no other', () => {
      test('should be fixed value', () => {
        const expected = {
          UNSTATED_EXPIRY_DAY_COUNT: 1,
        }

        const received = PROVIDER_UPLOADED_FILE_RETENTION

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('providerUploadedFileRetentionConstants', () => {
  describe('the module it bridges', () => {
    describe('should declare the one category and no other', () => {
      test('should be fixed value', () => {
        const expected = [
          'PROVIDER_UPLOADED_FILE_RETENTION',
        ]

        const received = Object.keys(PROVIDER_UPLOADED_FILE_RETENTION_CONSTANT_HASH)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
