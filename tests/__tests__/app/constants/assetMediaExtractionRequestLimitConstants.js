import ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT_CONSTANT_HASH from '../../../../app/constants/assetMediaExtractionRequestLimitConstants.js'

const {
  ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT,
} = ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT_CONSTANT_HASH

/*
 * The two figures the asset-media-extraction request's own two unbounded fields are held to, read
 * through the ESM bridge the application imports - so the bridge resolving the CommonJS master is
 * asserted by the same test that asserts the values.
 *
 * They are written out as literals rather than recomputed. `MAXIMUM_MEDIA_SIGNATURE_LENGTH` does
 * have arithmetic behind it - twelve photographs at one hundred and ninety-one characters of key
 * apiece, plus a separator each - but repeating that arithmetic here would make this file agree
 * with a wrong master as readily as with a right one. What pins both figures is that a change to
 * either is a change somebody made on purpose, and shows up as a failing line naming the number
 * that moved.
 */

describe('assetMediaExtractionRequestLimitConstants', () => {
  describe('ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT', () => {
    describe('should hold each figure a request is bounded by', () => {
      const cases = [
        {
          input: {
            key: 'MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT',
          },
          expected: 200,
        },
        {
          input: {
            key: 'MAXIMUM_MEDIA_SIGNATURE_LENGTH',
          },
          expected: 2304,
        },
      ]

      test.each(cases)('key: $input.key', ({
        input,
        expected,
      }) => {
        const received = ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT

        expect(received)
          .toHaveProperty(input.key, expected)
      })
    })
  })
})

describe('assetMediaExtractionRequestLimitConstants', () => {
  describe('ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT', () => {
    /*
     * A third figure arriving here would be a rule the request is held to that nothing above
     * derived, so the whole hash is compared in one go.
     */
    describe('should declare the two figures and no other', () => {
      test('should be fixed value', () => {
        const expected = {
          MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT: 200,
          MAXIMUM_MEDIA_SIGNATURE_LENGTH: 2304,
        }

        const received = ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
