import AiRunMediaCategoryInspector from '../../../../app/aiRunMedia/AiRunMediaCategoryInspector.js'

import AiRunKeyInspector from '../../../../app/aiRun/AiRunKeyInspector.js'

/*
 * The constraint this feature carries: "a medium's kind is a value the request already carries, so
 * a kind this version does not handle is refused by name rather than ignored, and adding one later
 * is a row".
 *
 * Every case below asks the flag. The two cases whose factory turns video on are the ones that
 * matter most: they prove the answer comes from `IS_ACTIVE` and not from the word `image`, which is
 * the whole reason the column exists. They hand in a media-kind set of their own rather than
 * editing the constants the application reads, because what is under test is the reading of the
 * flag and not the value the master happens to carry today.
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
                  IS_ACTIVE: true,
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
                IS_ACTIVE: true,
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
                  IS_ACTIVE: false,
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
                IS_ACTIVE: false,
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
            IS_ACTIVE: true,
          },
          {
            ID: 2,
            NAME: 'video',
            DISPLAY_NAME: 'Video',
            DISPLAY_ORDER: 20,
            IS_ACTIVE: false,
          },
          {
            ID: 3,
            NAME: 'audio',
            DISPLAY_NAME: 'Audio',
            DISPLAY_ORDER: 30,
            IS_ACTIVE: false,
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
    describe('should accept a kind whose flag says this version handles it', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                IS_ACTIVE: true,
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                IS_ACTIVE: false,
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 1,
          },
          label: 'the kind this version handles',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                IS_ACTIVE: true,
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                IS_ACTIVE: false,
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
                IS_ACTIVE: true,
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 2,
          },
          label: 'video, once its flag has been turned on - which is the whole point of the flag',
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

    describe('should refuse a kind whose flag says this version does not handle it', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                IS_ACTIVE: true,
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                IS_ACTIVE: false,
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                IS_ACTIVE: false,
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 2,
          },
          label: 'video, which is seeded and not handled',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                IS_ACTIVE: true,
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                IS_ACTIVE: false,
              },
            ],
          },
          params: {
            aiRunMediaCategoryId: 3,
          },
          label: 'audio',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                IS_ACTIVE: true,
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
                IS_ACTIVE: true,
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
                IS_ACTIVE: true,
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
  describe('#isHandledMediaCategoryName()', () => {
    describe('should accept a name whose flag says this version handles it', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                IS_ACTIVE: true,
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
                IS_ACTIVE: true,
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

    describe('should refuse a name this version does not handle', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                IS_ACTIVE: true,
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                IS_ACTIVE: false,
              },
            ],
          },
          params: {
            mediaCategoryName: 'video',
          },
          label: 'a kind that resolves to a row and is not handled',
        },
        {
          factoryParams: {
            aiRunMediaCategories: [
              {
                ID: 1,
                NAME: 'image',
                DISPLAY_NAME: 'Image',
                DISPLAY_ORDER: 10,
                IS_ACTIVE: true,
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
                IS_ACTIVE: true,
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
                IS_ACTIVE: true,
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
  describe('#extractAiRunMediaCategoryName()', () => {
    /*
     * This is what "refused by name" is made of: a kind this version does not handle still has a
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
                IS_ACTIVE: false,
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                IS_ACTIVE: false,
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
                IS_ACTIVE: false,
              },
              {
                ID: 3,
                NAME: 'audio',
                DISPLAY_NAME: 'Audio',
                DISPLAY_ORDER: 30,
                IS_ACTIVE: false,
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
                IS_ACTIVE: true,
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
                IS_ACTIVE: true,
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
                IS_ACTIVE: true,
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                IS_ACTIVE: false,
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
                IS_ACTIVE: true,
              },
              {
                ID: 2,
                NAME: 'video',
                DISPLAY_NAME: 'Video',
                DISPLAY_ORDER: 20,
                IS_ACTIVE: false,
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
                IS_ACTIVE: true,
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
                IS_ACTIVE: true,
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
