import AI_RUN_MEDIA_CATEGORY_CONSTANT_HASH from '../../../../app/constants/aiRunMediaCategoryConstants.js'

const {
  AI_RUN_MEDIA_CATEGORY,
} = AI_RUN_MEDIA_CATEGORY_CONSTANT_HASH

/*
 * The rows of `ai_run_media_categories`, read through the ESM bridge the application imports — so
 * the bridge resolving the CommonJS master is asserted by the same test that asserts the values.
 *
 * The values are written out as literals rather than read back from anywhere, because everything
 * that binds to them reads this same hash: the master seeder fills the table from it, and the
 * contract carries `NAME` as `mediaCategoryName`. An expectation derived from the module under
 * test would agree with whatever the module happened to hold.
 *
 * Video and audio are asserted alongside image on purpose. They are the kinds this version does
 * not handle, and they exist so that a request naming one resolves to a row and is refused by that
 * name — so a hash that dropped them, and a reader that only ever saw images, would both look
 * correct until a caller sent a clip. `IS_ACTIVE` is what separates the kind this version handles
 * from the two it only recognizes, which is why every case pins it.
 */

describe('aiRunMediaCategoryConstants', () => {
  describe('AI_RUN_MEDIA_CATEGORY', () => {
    describe('should hold the value of each kind a request may name', () => {
      const cases = [
        {
          params: {
            key: 'IMAGE',
          },
          expected: {
            ID: 1,
            NAME: 'image',
            DISPLAY_NAME: 'Image',
            DISPLAY_ORDER: 10,
            IS_ACTIVE: true,
          },
        },
        {
          params: {
            key: 'VIDEO',
          },
          expected: {
            ID: 2,
            NAME: 'video',
            DISPLAY_NAME: 'Video',
            DISPLAY_ORDER: 20,
            IS_ACTIVE: false,
          },
        },
        {
          params: {
            key: 'AUDIO',
          },
          expected: {
            ID: 3,
            NAME: 'audio',
            DISPLAY_NAME: 'Audio',
            DISPLAY_ORDER: 30,
            IS_ACTIVE: false,
          },
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
        expected,
      }) => {
        const actual = AI_RUN_MEDIA_CATEGORY // Act

        expect(actual) // Assert
          .toHaveProperty(params.key, expected)
      })
    })
  })
})

describe('aiRunMediaCategoryConstants', () => {
  describe('AI_RUN_MEDIA_CATEGORY', () => {
    /*
     * A kind arriving here that the master table does not seed would be a name the application
     * could bind to and no row could answer for, so the whole hash is compared in one go.
     */
    describe('should declare the three kinds this version seeds, and no other', () => {
      test('should be fixed value', () => {
        const expected = { // Arrange
          IMAGE: {
            ID: 1,
            NAME: 'image',
            DISPLAY_NAME: 'Image',
            DISPLAY_ORDER: 10,
            IS_ACTIVE: true,
          },
          VIDEO: {
            ID: 2,
            NAME: 'video',
            DISPLAY_NAME: 'Video',
            DISPLAY_ORDER: 20,
            IS_ACTIVE: false,
          },
          AUDIO: {
            ID: 3,
            NAME: 'audio',
            DISPLAY_NAME: 'Audio',
            DISPLAY_ORDER: 30,
            IS_ACTIVE: false,
          },
        }

        const actual = AI_RUN_MEDIA_CATEGORY // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})
