import AiRunMediaCategoryInspector from '../../../../app/aiRunMedia/AiRunMediaCategoryInspector.js'

import AiRunKeyInspector from '../../../../app/aiRun/AiRunKeyInspector.js'

/*
 * The constraint this feature carries: "a medium's kind is a value the request already carries, so
 * a kind this version does not handle is refused by name rather than ignored, and adding one later
 * is a row" - and the one §20 adds on top of it, that refusing and ignoring are two endings and
 * not one.
 *
 * Every case below asks the row what happens to the kind. The cases whose factory hands video the
 * handling `handle` are the ones that matter most: they prove the answer comes from
 * `HANDLING_NAME` and not from the word `image`, which is the whole reason the column exists. They
 * hand in a media-kind set of their own rather than editing the constants the application reads,
 * because what is under test is the reading of the row and not the value the master happens to
 * carry today.
 *
 * The cases that separate `refuse` from `ignore` are the second half of the same proof. A boolean
 * answered one word for video and audio, so nothing could carry out §20's two different endings;
 * a set whose video says `refuse` and whose audio says `ignore` is answered with two different
 * words, and a class that collapsed them again would fail here.
 */

describe('AiRunMediaCategoryInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunMediaCategories', () => {
        const cases = [
          {
            params: {
              aiRunMediaCategories: [
                {
                  ID: 1,
                  NAME: 'image',
                  DISPLAY_NAME: 'Image',
                  DISPLAY_ORDER: 10,
                  HANDLING_NAME: 'handle',
                },
              ],
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            expected: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          {
            params: {
              aiRunMediaCategories: [
                {
                  ID: 2,
                  NAME: 'video',
                  DISPLAY_NAME: 'Video',
                  DISPLAY_ORDER: 20,
                  HANDLING_NAME: 'refuse',
                },
              ],
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            expected: [
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
            ],
          },
        ]

        test.each(cases)('aiRunMediaCategories[0].NAME: $params.aiRunMediaCategories.0.NAME', ({
          params,
          expected,
        }) => {
          const inspector = new AiRunMediaCategoryInspector(params)

          expect(inspector)
            .toHaveProperty('aiRunMediaCategories', expected)
        })
      })

      describe('#aiRunKeyInspector', () => {
        const cases = [
          {
            params: {
              aiRunMediaCategories: [],
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            label: 'the inspector of this feature',
          },
        ]

        test.each(cases)('label: $label', ({
          params,
        }) => {
          const inspector = new AiRunMediaCategoryInspector(params)

          expect(inspector)
            .toHaveProperty('aiRunKeyInspector', params.aiRunKeyInspector)
        })
      })
    })
  })
})

describe('AiRunMediaCategoryInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            aiRunMediaCategories: [],
            aiRunKeyInspector: AiRunKeyInspector.create(),
          },
          label: 'a kind set of its own',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const actual = AiRunMediaCategoryInspector.create(params)

        expect(actual)
          .toBeInstanceOf(AiRunMediaCategoryInspector)
      })
    })

    describe('should use the seeded kinds by default', () => {
      test('with no arguments', () => {
        const expected = [
          {
            ID: 1,
            NAME: 'image',
            DISPLAY_NAME: 'Image',
            DISPLAY_ORDER: 10,
            HANDLING_NAME: 'handle',
          },
          {
            ID: 2,
            NAME: 'video',
            DISPLAY_NAME: 'Video',
            DISPLAY_ORDER: 20,
            HANDLING_NAME: 'refuse',
          },
          {
            ID: 3,
            NAME: 'audio',
            DISPLAY_NAME: 'Audio',
            DISPLAY_ORDER: 30,
            HANDLING_NAME: 'ignore',
          },
        ]

        const inspector = AiRunMediaCategoryInspector.create()

        expect(inspector)
          .toHaveProperty('aiRunMediaCategories', expected)
      })
    })

    describe('should use default aiRunKeyInspector value', () => {
      test('with no arguments', () => {
        const createAiRunKeyInspectorSpy = jest.spyOn(AiRunMediaCategoryInspector, 'createAiRunKeyInspector')

        const inspector = AiRunMediaCategoryInspector.create()

        expect(inspector.aiRunKeyInspector)
          .toBeInstanceOf(AiRunKeyInspector)
        expect(createAiRunKeyInspectorSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunMediaCategoryInspector', () => {
  describe('.createAiRunKeyInspector()', () => {
    test('should create the inspector of this feature', () => {
      const actual = AiRunMediaCategoryInspector.createAiRunKeyInspector()

      expect(actual)
        .toBeInstanceOf(AiRunKeyInspector)
    })
  })
})

describe('AiRunMediaCategoryInspector', () => {
  describe('#isHandledAiRunMediaCategoryId()', () => {
    describe('should accept a kind whose row says this version reads it', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 1,
          },
          label: 'the kind this version reads',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: '1',
          },
          label: 'the same kind named by an id that arrived as text',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 2,
          },
          label: 'video, once its row says handle - which is the whole point of the column',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.isHandledAiRunMediaCategoryId(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse a kind whose row says this version does not read it', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 2,
          },
          label: 'video, which is seeded and refused',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 3,
          },
          label: 'audio, which is seeded and ignored',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 9,
          },
          label: 'an id naming no kind at all',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: null,
          },
          label: 'no id at all',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 'image',
          },
          label: 'the name where the id belongs',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.isHandledAiRunMediaCategoryId(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunMediaCategoryInspector', () => {
  describe('#extractAiRunMediaHandlingNameById()', () => {
    /*
     * This is where §20's two endings are told apart. Video answers one word and audio answers
     * another, off the same set, through the same call - so a run can refuse the first by name and
     * drop the second without saying anything.
     */
    describe('should extract what this version does with the kind', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 1,
          },
          expected: 'handle',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 2,
          },
          expected: 'refuse',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: '3',
          },
          expected: 'ignore',
        },
      ]

      test.each(cases)('aiRunMediaCategoryId: $params.aiRunMediaCategoryId', ({
        factoryParams,
        params,
        expected,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.extractAiRunMediaHandlingNameById(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null when the id names no kind', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 9,
          },
          label: 'an id no kind carries',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: null,
          },
          label: 'no id at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.extractAiRunMediaHandlingNameById(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaCategoryInspector', () => {
  describe('#isHandledMediaCategoryName()', () => {
    describe('should accept a name whose row says this version reads it', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            mediaCategoryName: 'image',
          },
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            mediaCategoryName: 'video',
          },
        },
      ]

      test.each(cases)('mediaCategoryName: $params.mediaCategoryName', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.isHandledMediaCategoryName(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse a name this version does not read', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
            ],
          },
          params: {
            mediaCategoryName: 'video',
          },
          label: 'a kind that resolves to a row and is refused by name',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            mediaCategoryName: 'audio',
          },
          label: 'a kind that resolves to a row and is ignored',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            mediaCategoryName: 'hologram',
          },
          label: 'a kind that resolves to nothing',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            mediaCategoryName: 'Image',
          },
          label: 'the name in another case, which the contract fixes exactly',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            mediaCategoryName: null,
          },
          label: 'no name at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.isHandledMediaCategoryName(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunMediaCategoryInspector', () => {
  describe('#extractAiRunMediaHandlingNameByName()', () => {
    /*
     * The name is what a request carries, so this is the call step 2 makes per medium. The three
     * kinds answer three different words off one set, and that is the whole of §20's difference
     * between a video and a clip of sound.
     */
    describe('should extract what this version does with the kind a request named', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            mediaCategoryName: 'image',
          },
          expected: 'handle',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            mediaCategoryName: 'video',
          },
          expected: 'refuse',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            mediaCategoryName: 'audio',
          },
          expected: 'ignore',
        },
      ]

      test.each(cases)('mediaCategoryName: $params.mediaCategoryName', ({
        factoryParams,
        params,
        expected,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.extractAiRunMediaHandlingNameByName(params)

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * A kind that resolves to nothing has no ending at all, and must not be read as the one that
     * is quietly dropped: the first is a name this service does not know and the second is a name
     * it knows and ignores.
     */
    describe('should answer null when the name names no kind', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            mediaCategoryName: 'hologram',
          },
          label: 'a kind nothing seeds, beside one that is ignored',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            mediaCategoryName: 1,
          },
          label: 'the id where the name belongs',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.extractAiRunMediaHandlingNameByName(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaCategoryInspector', () => {
  describe('#extractAiRunMediaCategoryName()', () => {
    /*
     * This is what "refused by name" is made of: a kind this version does not read still has a
     * name, and the refusal carries it. A kind that resolves to nothing has none, and is a
     * different refusal.
     */
    describe('should extract the name a kind is refused by', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 2,
          },
          expected: 'video',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                HANDLING_NAME: 'ignore',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: '3',
          },
          expected: 'audio',
        },
      ]

      test.each(cases)('aiRunMediaCategoryId: $params.aiRunMediaCategoryId', ({
        factoryParams,
        params,
        expected,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.extractAiRunMediaCategoryName(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null when the id names no kind', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 9,
          },
          label: 'an id no kind carries',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 0,
          },
          label: 'zero, which names no row anywhere',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.extractAiRunMediaCategoryName(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaCategoryInspector', () => {
  describe('#extractAiRunMediaCategoryId()', () => {
    describe('should extract the id a request names its kind by', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
            ],
          },
          params: {
            mediaCategoryName: 'image',
          },
          expected: 1,
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                HANDLING_NAME: 'refuse',
              },
            ],
          },
          params: {
            mediaCategoryName: 'video',
          },
          expected: 2,
        },
      ]

      test.each(cases)('mediaCategoryName: $params.mediaCategoryName', ({
        factoryParams,
        params,
        expected,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.extractAiRunMediaCategoryId(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null when the name names no kind', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            mediaCategoryName: 'hologram',
          },
          label: 'a kind nothing seeds',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                HANDLING_NAME: 'handle',
              },
            ],
          },
          params: {
            mediaCategoryName: 1,
          },
          label: 'the id where the name belongs',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaCategoryInspector.create(factoryParams)

        const actual = inspector.extractAiRunMediaCategoryId(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})
