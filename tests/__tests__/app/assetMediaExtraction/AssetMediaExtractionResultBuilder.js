import AssetMediaExtractionResultBuilder from '../../../../app/assetMediaExtraction/AssetMediaExtractionResultBuilder.js'

/*
 * The body an asset-media-extraction run settles, and two acceptance criteria of specs/1.0.0 §20:
 *
 *   - "every field returned carries a field state, a confidence, a one-line reason and the photos
 *     it came from"
 *   - "the service writes nothing back to the caller's record: the result is a proposal, and the
 *     response carries no field by which anything could be approved"
 *
 * The second is checked by handing the builder a scored field carrying the things a client must
 * never be given - the two master-row ids, the formula version, and an invented approval flag - and
 * asserting the whole returned object equals the seven fields the contract declares. One `toEqual`
 * over the whole shape is what makes that an assertion about what is *absent*.
 */

describe('AssetMediaExtractionResultBuilder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#mediaSignature', () => {
        const cases = [
          {
            params: {
              mediaSignature: 'media-signature-10610301',
            },
            expected: 'media-signature-10610301',
          },
          {
            params: {
              mediaSignature: 'media-signature-10610302',
            },
            expected: 'media-signature-10610302',
          },
        ]

        test.each(cases)('mediaSignature: $params.mediaSignature', ({
          params,
          expected,
        }) => {
          const builder = new AssetMediaExtractionResultBuilder(params)

          expect(builder)
            .toHaveProperty('mediaSignature', expected)
        })
      })
    })
  })
})

describe('AssetMediaExtractionResultBuilder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            mediaSignature: 'media-signature-10610303',
          },
        },
        {
          params: {
            mediaSignature: 'media-signature-10610304',
          },
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
      }) => {
        const actual = AssetMediaExtractionResultBuilder.create(params)

        expect(actual)
          .toBeInstanceOf(AssetMediaExtractionResultBuilder)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            mediaSignature: 'media-signature-10610305',
          },
          expected: {
            mediaSignature: 'media-signature-10610305',
          },
        },
        {
          // a request that carried no signature echoes null rather than looking like an answer
          params: {
            mediaSignature: null,
          },
          expected: {
            mediaSignature: null,
          },
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AssetMediaExtractionResultBuilder)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AssetMediaExtractionResultBuilder', () => {
  describe('.generateEchoableMediaSignature()', () => {
    describe('with valid values', () => {
      const cases = [
        {
          params: {
            mediaSignature: 'media-signature-10610311',
          },
          expected: 'media-signature-10610311',
        },
        {
          params: {
            mediaSignature: 'media-signature-10610312',
          },
          expected: 'media-signature-10610312',
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
        expected,
      }) => {
        const actual = AssetMediaExtractionResultBuilder.generateEchoableMediaSignature(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('with invalid values', () => {
      const cases = [
        {
          params: {
            mediaSignature: null,
          },
        },
        {
          params: {
            mediaSignature: 10610313,
          },
        },
        {
          params: {
            mediaSignature: [
              'media-signature-10610314',
            ],
          },
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
      }) => {
        const actual = AssetMediaExtractionResultBuilder.generateEchoableMediaSignature(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AssetMediaExtractionResultBuilder', () => {
  describe('#buildFieldResult()', () => {
    describe('should carry the seven fields the contract declares, and nothing beside them', () => {
      const cases = [
        {
          factoryParams: {
            mediaSignature: 'media-signature-10610321',
          },
          params: {
            scoredField: {
              path: 'attributes.wallMaterial',
              value: 'brick',
              fieldStateName: 'extracted',
              suggestionConfidence: 0.6667,
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [
                'media-key-10610321',
              ],
              agreement: {
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
              aiRunFieldStatusId: 1,
              aiRunEvidenceCategoryId: 1,
              confidenceMethodVersion: 'confidence-v1.0.0',
              isApproved: true, // nothing by which a record could be approved may travel
            },
          },
          expected: {
            path: 'attributes.wallMaterial',
            value: 'brick',
            fieldStateName: 'extracted',
            suggestionConfidence: 0.6667,
            reason: 'Visible on the front wall.',
            sourceMediaKeys: [
              'media-key-10610321',
            ],
            agreement: {
              agreedReadingCount: 2,
              totalReadingCount: 3,
            },
          },
        },
        {
          factoryParams: {
            mediaSignature: 'media-signature-10610322',
          },
          params: {
            scoredField: {
              path: 'attributes.floorArea',
              value: 86.4,
              fieldStateName: 'derived',
              suggestionConfidence: 0.5,
              reason: 'Judged against the door beside it.',
              sourceMediaKeys: [
                'media-key-10610322',
                'media-key-10610323',
              ],
              agreement: {
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
              aiRunFieldStatusId: 2,
              aiRunEvidenceCategoryId: 2,
              confidenceMethodVersion: 'confidence-v1.0.0',
            },
          },
          expected: {
            path: 'attributes.floorArea',
            value: 86.4,
            fieldStateName: 'derived',
            suggestionConfidence: 0.5,
            reason: 'Judged against the door beside it.',
            sourceMediaKeys: [
              'media-key-10610322',
              'media-key-10610323',
            ],
            agreement: {
              agreedReadingCount: 2,
              totalReadingCount: 3,
            },
          },
        },
      ]

      test.each(cases)('path: $params.scoredField.path', ({
        factoryParams,
        params,
        expected,
      }) => {
        const builder = AssetMediaExtractionResultBuilder.create(factoryParams)

        const actual = builder.buildFieldResult(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetMediaExtractionResultBuilder', () => {
  describe('#buildResult()', () => {
    /*
     * "Never a guess, never a zero." The missing path travels as a path and the settled fields
     * carry no entry for it, which is what a whole-object comparison shows and a per-field one
     * would not.
     */
    describe('should build the four fields the result carries', () => {
      const cases = [
        {
          factoryParams: {
            mediaSignature: 'media-signature-10610331',
          },
          params: {
            scoredFields: [
              {
                path: 'attributes.wallMaterial',
                value: 'brick',
                fieldStateName: 'extracted',
                suggestionConfidence: 0.6667,
                reason: 'Visible on the front wall.',
                sourceMediaKeys: [
                  'media-key-10610331',
                ],
                agreement: {
                  agreedReadingCount: 2,
                  totalReadingCount: 3,
                },
                aiRunFieldStatusId: 1,
                aiRunEvidenceCategoryId: 1,
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
            ],
            missingFieldPaths: [
              'attributes.floorArea',
            ],
            unreadableMediaKeys: [
              'media-key-10610332',
            ],
          },
          expected: {
            fields: [
              {
                path: 'attributes.wallMaterial',
                value: 'brick',
                fieldStateName: 'extracted',
                suggestionConfidence: 0.6667,
                reason: 'Visible on the front wall.',
                sourceMediaKeys: [
                  'media-key-10610331',
                ],
                agreement: {
                  agreedReadingCount: 2,
                  totalReadingCount: 3,
                },
              },
            ],
            missingFieldPaths: [
              'attributes.floorArea',
            ],
            unreadableMediaKeys: [
              'media-key-10610332',
            ],
            mediaSignature: 'media-signature-10610331',
          },
        },
        {
          // the first acceptance criterion's answer: a run that settled nothing at all
          factoryParams: {
            mediaSignature: 'media-signature-10610333',
          },
          params: {
            scoredFields: [],
            missingFieldPaths: [],
            unreadableMediaKeys: [],
          },
          expected: {
            fields: [],
            missingFieldPaths: [],
            unreadableMediaKeys: [],
            mediaSignature: 'media-signature-10610333',
          },
        },
      ]

      test.each(cases)('mediaSignature: $factoryParams.mediaSignature', ({
        factoryParams,
        params,
        expected,
      }) => {
        const builder = AssetMediaExtractionResultBuilder.create(factoryParams)

        const actual = builder.buildResult(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetMediaExtractionResultBuilder', () => {
  describe('#generateResultBody()', () => {
    describe('should render the result as the text the run is settled with', () => {
      const cases = [
        {
          factoryParams: {
            mediaSignature: 'media-signature-10610341',
          },
          params: {
            scoredFields: [],
            missingFieldPaths: [
              'attributes.floorArea',
            ],
            unreadableMediaKeys: [],
          },
          expected: '{"fields":[],"missingFieldPaths":["attributes.floorArea"],"unreadableMediaKeys":[],"mediaSignature":"media-signature-10610341"}',
        },
        {
          factoryParams: {
            mediaSignature: 'media-signature-10610342',
          },
          params: {
            scoredFields: [],
            missingFieldPaths: [],
            unreadableMediaKeys: [
              'media-key-10610342',
            ],
          },
          expected: '{"fields":[],"missingFieldPaths":[],"unreadableMediaKeys":["media-key-10610342"],"mediaSignature":"media-signature-10610342"}',
        },
      ]

      test.each(cases)('mediaSignature: $factoryParams.mediaSignature', ({
        factoryParams,
        params,
        expected,
      }) => {
        const builder = AssetMediaExtractionResultBuilder.create(factoryParams)

        const actual = builder.generateResultBody(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetMediaExtractionResultBuilder', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          BuilderCtor: AssetMediaExtractionResultBuilder,
          mediaSignature: 'media-signature-10610351',
        },
      },
      {
        params: {
          BuilderCtor: class ExtendedAssetMediaExtractionResultBuilder extends AssetMediaExtractionResultBuilder {},
          mediaSignature: 'media-signature-10610352',
        },
      },
    ]

    test.each(cases)('mediaSignature: $params.mediaSignature', ({
      params,
    }) => {
      const builder = params.BuilderCtor.create({
        mediaSignature: params.mediaSignature,
      })

      const actual = builder.Ctor

      expect(actual)
        .toBe(params.BuilderCtor) // same reference
    })
  })
})
