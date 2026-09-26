import AI_RUN_MEDIA_HANDLING_CONSTANT_HASH from '../../../../app/constants/aiRunMediaHandlingConstants.js'

const {
  AI_RUN_MEDIA_HANDLING,
} = AI_RUN_MEDIA_HANDLING_CONSTANT_HASH

/*
 * What this version does with a medium, read through the ESM bridge the application imports — so
 * the bridge resolving the CommonJS master is asserted by the same test that asserts the values.
 *
 * The values are written out as literals rather than read back from anywhere, because everything
 * that binds to them reads this same hash: the media-kind constants carry one of them per kind,
 * the master seeder writes that into `ai_run_media_categories.handling_name`, and
 * `AiRunMediaCategoryInspector` compares against it. An expectation derived from the module under
 * test would agree with whatever the module happened to hold.
 *
 * All three are pinned, and the third is why the module exists. `refuse` and `ignore` are the two
 * endings §20 asks for separately — a video URL refused "rather than being silently skipped", and
 * audio ignored — and a hash that held only a handled-or-not pair would look correct right up
 * until a caller sent a clip.
 */

describe('aiRunMediaHandlingConstants', () => {
  describe('AI_RUN_MEDIA_HANDLING', () => {
    describe('should hold the value of each ending a kind may have', () => {
      const cases = [
        {
          params: {
            key: 'HANDLE',
          },
          expected: 'handle',
        },
        {
          params: {
            key: 'REFUSE',
          },
          expected: 'refuse',
        },
        {
          params: {
            key: 'IGNORE',
          },
          expected: 'ignore',
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
        expected,
      }) => {
        const actual = AI_RUN_MEDIA_HANDLING // Act

        expect(actual) // Assert
          .toHaveProperty(params.key, expected)
      })
    })
  })
})

describe('aiRunMediaHandlingConstants', () => {
  describe('AI_RUN_MEDIA_HANDLING', () => {
    /*
     * A fourth ending arriving here would be a word a kind could be seeded under and no code
     * could carry out, so the whole hash is compared in one go.
     */
    describe('should declare the three endings this version implements, and no other', () => {
      test('should be fixed value', () => {
        const expected = { // Arrange
          HANDLE: 'handle',
          REFUSE: 'refuse',
          IGNORE: 'ignore',
        }

        const actual = AI_RUN_MEDIA_HANDLING // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})
