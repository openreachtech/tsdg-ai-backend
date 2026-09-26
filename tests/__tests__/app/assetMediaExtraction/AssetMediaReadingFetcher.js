import AssetMediaReadingFetcher from '../../../../app/assetMediaExtraction/AssetMediaReadingFetcher.js'
import StubAssetFieldReadingSupplier from '../../../../app/assetMediaExtraction/StubAssetFieldReadingSupplier.js'

import AiModelCallRecorder from '../../../../app/aiRun/AiModelCallRecorder.js'

/*
 * The members of step 3 that write nothing: the fork between the driver that answers for itself and
 * the keyless one whose findings this service supplies, and the two collaborators the factory fills
 * in behind it. What the step reads, records and settles is exercised where it writes, in
 * `tests/_orders/AiRun/AssetMediaReadingFetcher.js`.
 *
 * specs/1.0.0 §20's fourth use case is what the fork exists for - a whole suggestion screen
 * demonstrable before any API key exists - and the two halves are asserted apart here: a driver
 * named as the keyless one is answered from the fixture, and every other driver is answered by
 * itself.
 */

describe('AssetMediaReadingFetcher', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#stubAssetFieldReadingSupplier', () => {
        const cases = [
          {
            params: {
              aiModelCallRecorder: AiModelCallRecorder.create(),
              stubAssetFieldReadingSupplier: StubAssetFieldReadingSupplier.create({
                evidenceKindNames: [
                  'visible-text',
                ],
              }),
              readingCount: 3,
              toolName: 'record_field_readings',
              actionName: 'read-media',
              stubAiModelName: 'stub',
            },
          },
          {
            params: {
              aiModelCallRecorder: AiModelCallRecorder.create(),
              stubAssetFieldReadingSupplier: StubAssetFieldReadingSupplier.create({
                evidenceKindNames: [
                  'category-prior',
                ],
              }),
              readingCount: 5,
              toolName: 'record_field_readings',
              actionName: 'read-media',
              stubAiModelName: 'stub',
            },
          },
        ]

        test.each(cases)('readingCount: $params.readingCount', ({
          params,
        }) => {
          const fetcher = new AssetMediaReadingFetcher(params)

          expect(fetcher)
            .toHaveProperty('stubAssetFieldReadingSupplier', params.stubAssetFieldReadingSupplier)
        })
      })

      describe('#stubAiModelName', () => {
        const cases = [
          {
            params: {
              aiModelCallRecorder: AiModelCallRecorder.create(),
              stubAssetFieldReadingSupplier: StubAssetFieldReadingSupplier.create(),
              readingCount: 3,
              toolName: 'record_field_readings',
              actionName: 'read-media',
              stubAiModelName: 'stub',
            },
          },
          {
            params: {
              aiModelCallRecorder: AiModelCallRecorder.create(),
              stubAssetFieldReadingSupplier: StubAssetFieldReadingSupplier.create(),
              readingCount: 3,
              toolName: 'record_field_readings',
              actionName: 'read-media',
              stubAiModelName: 'another-keyless-model',
            },
          },
        ]

        test.each(cases)('stubAiModelName: $params.stubAiModelName', ({
          params,
        }) => {
          const fetcher = new AssetMediaReadingFetcher(params)

          expect(fetcher)
            .toHaveProperty('stubAiModelName', params.stubAiModelName)
        })
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('.create()', () => {
    describe('should fill default stubAssetFieldReadingSupplier', () => {
      test('with no arguments', () => {
        const actual = AssetMediaReadingFetcher.create()

        expect(actual.stubAssetFieldReadingSupplier)
          .toBeInstanceOf(StubAssetFieldReadingSupplier)
      })
    })

    describe('should fill default stubAiModelName', () => {
      test('with no arguments', () => {
        const expected = 'stub' // AI_MODEL.STUB.NAME

        const actual = AssetMediaReadingFetcher.create()

        expect(actual.stubAiModelName)
          .toBe(expected)
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('.createStubAssetFieldReadingSupplier()', () => {
    test('should create the supplier', () => {
      const actual = AssetMediaReadingFetcher.createStubAssetFieldReadingSupplier()

      expect(actual)
        .toBeInstanceOf(StubAssetFieldReadingSupplier)
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#suppliesFixtureReadings()', () => {
    describe('should answer that the findings are this service to supply', () => {
      const cases = [
        {
          factoryParams: {
            stubAiModelName: 'stub',
          },
          params: {
            aiModelProcessor: {
              aiModel: 'stub',
            },
          },
        },
        {
          factoryParams: {
            stubAiModelName: 'another-keyless-model',
          },
          params: {
            aiModelProcessor: {
              aiModel: 'another-keyless-model',
            },
          },
        },
      ]

      test.each(cases)('aiModel: $params.aiModelProcessor.aiModel', ({
        factoryParams,
        params,
      }) => {
        const fetcher = AssetMediaReadingFetcher.create(factoryParams)

        const actual = fetcher.suppliesFixtureReadings(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * The last case carries no driver at all, which no field path can name - hence the label.
     */
    describe('should answer that the driver speaks for itself', () => {
      const cases = [
        {
          label: 'a vendor driver',
          factoryParams: {
            stubAiModelName: 'stub',
          },
          params: {
            aiModelProcessor: {
              aiModel: 'some-vendor-model',
            },
          },
        },
        {
          label: 'another vendor driver',
          factoryParams: {
            stubAiModelName: 'stub',
          },
          params: {
            aiModelProcessor: {
              aiModel: 'another-vendor-model',
            },
          },
        },
        {
          label: 'no driver at all',
          factoryParams: {
            stubAiModelName: 'stub',
          },
          params: {
            aiModelProcessor: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const fetcher = AssetMediaReadingFetcher.create(factoryParams)

        const actual = fetcher.suppliesFixtureReadings(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#buildSuppliedFunctionCalls()', () => {
    /*
     * The call is built in the shape the forced tool call arrives in, under the tool's own name, so
     * the reading is read back out of it by exactly the same member that reads a vendor's.
     */
    describe('should build the call this service stands in with', () => {
      const cases = [
        {
          params: {
            aiModelProcessor: {
              aiModel: 'stub',
            },
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                valueKind: 'select',
                options: [
                  'brick',
                  'concrete',
                  'timber',
                ],
              },
            ],
            mediaSignature: 'media-signature-10610981',
            readableMediaKeys: [
              'media-key-10610981',
            ],
          },
          expected: [
            {
              name: 'record_field_readings',
              arguments: {
                readings: [
                  {
                    path: 'attributes.wallMaterial',
                    value: 'brick',
                    evidenceKindName: 'visible-text',
                    reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
                    sourceMediaKeys: [
                      'media-key-10610981',
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          params: {
            aiModelProcessor: {
              aiModel: 'stub',
            },
            fieldSchema: [],
            mediaSignature: 'media-signature-10610982',
            readableMediaKeys: [
              'media-key-10610982',
            ],
          },
          expected: [
            {
              name: 'record_field_readings',
              arguments: {
                readings: [],
              },
            },
          ],
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
        expected,
      }) => {
        const fetcher = AssetMediaReadingFetcher.create()

        const actual = fetcher.buildSuppliedFunctionCalls(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should stand in for nothing where the driver answers for itself', () => {
      const cases = [
        {
          params: {
            aiModelProcessor: {
              aiModel: 'some-vendor-model',
            },
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                valueKind: 'select',
                options: [
                  'brick',
                ],
              },
            ],
            mediaSignature: 'media-signature-10610983',
            readableMediaKeys: [
              'media-key-10610983',
            ],
          },
        },
        {
          params: {
            aiModelProcessor: {
              aiModel: 'another-vendor-model',
            },
            fieldSchema: [
              {
                path: 'attributes.frontageNote',
                valueKind: 'text',
              },
            ],
            mediaSignature: 'media-signature-10610984',
            readableMediaKeys: [
              'media-key-10610984',
            ],
          },
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
      }) => {
        const fetcher = AssetMediaReadingFetcher.create()

        const actual = fetcher.buildSuppliedFunctionCalls(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#buildReadingFunctionCalls()', () => {
    /*
     * What tells these cases apart is what the response answers when it is asked, which is a
     * function rather than a field - hence the label.
     */
    describe('should answer the calls the driver made', () => {
      const cases = [
        {
          label: 'a wall material read off a plate',
          params: {
            aiModelResponse: {
              hasError: () => false,
              extractFunctionCalls: () => [
                {
                  name: 'record_field_readings',
                  arguments: {
                    readings: [
                      {
                        path: 'attributes.wallMaterial',
                        value: 'timber',
                        evidenceKindName: 'visible-text',
                        reason: 'Written on the plate beside the door.',
                        sourceMediaKeys: [
                          'media-key-10610985',
                        ],
                      },
                    ],
                  },
                },
              ],
            },
            suppliedFunctionCalls: null,
          },
          expected: [
            {
              name: 'record_field_readings',
              arguments: {
                readings: [
                  {
                    path: 'attributes.wallMaterial',
                    value: 'timber',
                    evidenceKindName: 'visible-text',
                    reason: 'Written on the plate beside the door.',
                    sourceMediaKeys: [
                      'media-key-10610985',
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          label: 'a frontage note judged from a doorway',
          params: {
            aiModelResponse: {
              hasError: () => false,
              extractFunctionCalls: () => [
                {
                  name: 'record_field_readings',
                  arguments: {
                    readings: [
                      {
                        path: 'attributes.frontageNote',
                        value: 'Two metres of frontage on the lane.',
                        evidenceKindName: 'visual-estimate',
                        reason: 'Judged against the doorway beside it.',
                        sourceMediaKeys: [
                          'media-key-10610986',
                        ],
                      },
                    ],
                  },
                },
              ],
            },
            suppliedFunctionCalls: null,
          },
          expected: [
            {
              name: 'record_field_readings',
              arguments: {
                readings: [
                  {
                    path: 'attributes.frontageNote',
                    value: 'Two metres of frontage on the lane.',
                    evidenceKindName: 'visual-estimate',
                    reason: 'Judged against the doorway beside it.',
                    sourceMediaKeys: [
                      'media-key-10610986',
                    ],
                  },
                ],
              },
            },
          ],
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const fetcher = AssetMediaReadingFetcher.create()

        const actual = fetcher.buildReadingFunctionCalls(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should answer the calls this service stood in with', () => {
      const cases = [
        {
          label: 'one field the photographs were demonstrated for',
          params: {
            aiModelResponse: {
              hasError: () => false,
              extractFunctionCalls: () => [
                {
                  name: 'record_field_readings',
                  arguments: {},
                },
              ],
            },
            suppliedFunctionCalls: [
              {
                name: 'record_field_readings',
                arguments: {
                  readings: [
                    {
                      path: 'attributes.wallMaterial',
                      value: 'timber',
                      evidenceKindName: 'category-prior',
                      reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
                      sourceMediaKeys: [
                        'media-key-10610987',
                      ],
                    },
                  ],
                },
              },
            ],
          },
          expected: [
            {
              name: 'record_field_readings',
              arguments: {
                readings: [
                  {
                    path: 'attributes.wallMaterial',
                    value: 'timber',
                    evidenceKindName: 'category-prior',
                    reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
                    sourceMediaKeys: [
                      'media-key-10610987',
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          label: 'no field the schema could be bounded for',
          params: {
            aiModelResponse: {
              hasError: () => false,
              extractFunctionCalls: () => [
                {
                  name: 'record_field_readings',
                  arguments: {},
                },
              ],
            },
            suppliedFunctionCalls: [
              {
                name: 'record_field_readings',
                arguments: {
                  readings: [],
                },
              },
            ],
          },
          expected: [
            {
              name: 'record_field_readings',
              arguments: {
                readings: [],
              },
            },
          ],
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const fetcher = AssetMediaReadingFetcher.create()

        const actual = fetcher.buildReadingFunctionCalls(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * A reading whose call failed has nothing to stand in for: no request reached a model, so a
     * fixture put there would turn a recorded provider failure into a field a client is offered.
     */
    describe('should stand in for nothing where the call failed', () => {
      const cases = [
        {
          params: {
            aiModelResponse: {
              hasError: () => true,
              extractFunctionCalls: () => [],
            },
            suppliedFunctionCalls: [
              {
                name: 'record_field_readings',
                arguments: {
                  readings: [
                    {
                      path: 'attributes.wallMaterial',
                      value: 'timber',
                      evidenceKindName: 'category-prior',
                      reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
                      sourceMediaKeys: [
                        'media-key-10610988',
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          params: {
            aiModelResponse: {
              hasError: () => true,
              extractFunctionCalls: () => [],
            },
            suppliedFunctionCalls: [
              {
                name: 'record_field_readings',
                arguments: {
                  readings: [
                    {
                      path: 'attributes.frontageNote',
                      value: 'stub-value-430108842',
                      evidenceKindName: 'visible-text',
                      reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
                      sourceMediaKeys: [
                        'media-key-10610989',
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      ]

      test.each(cases)('path: $params.suppliedFunctionCalls.0.arguments.readings.0.path', ({
        params,
      }) => {
        const fetcher = AssetMediaReadingFetcher.create()

        const actual = fetcher.buildReadingFunctionCalls(params)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})
