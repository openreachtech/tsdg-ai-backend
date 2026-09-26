import AssetMediaExtractionPostRenderer from '../../../../../../../server/restfulapi/renderers/v1/post/AssetMediaExtractionPostRenderer.js'

import BaseAiRunPostRenderer from '../../../../../../../server/restfulapi/renderers/BaseAiRunPostRenderer.js'

import AiRunStatusRecorder from '../../../../../../../app/aiRun/AiRunStatusRecorder.js'
import StubAnswerDigester from '../../../../../../../app/stubAiModel/StubAnswerDigester.js'

/*
 * The stub route section 20 declares, read as a function of the request alone.
 *
 * **Nothing here writes and nothing here is mocked.** Every member below is a pure reading of its
 * arguments, so each case states a request and the answer that request has — on this machine, on
 * any other, and in any order. The members that write the run are in the sibling `tests/_orders/`
 * file, because placement follows what a method does.
 *
 * **The expected values are literals, and that is the determinism assertion.** A test calling the
 * builder twice and comparing the two answers would prove only that one process agreed with itself;
 * a literal written down here is the same answer pinned across processes and machines, which is what
 * the fourth use case asks for. Two cases naming different media carry different literals, which is
 * the other half of it.
 */

describe('AssetMediaExtractionPostRenderer', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AssetMediaExtractionPostRenderer.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPostRenderer)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:routePath', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AssetMediaExtractionPostRenderer.routePath

        expect(received)
          .toBe('/asset-media-extractions')
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:aiRunCategory', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {
          ID: 1,
          NAME: 'asset-media-extraction',
          DISPLAY_NAME: 'Asset media extraction',
          DISPLAY_ORDER: 10,
          IS_ACTIVE: true,
        }

        const received = AssetMediaExtractionPostRenderer.aiRunCategory

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:stubJobDispatcher', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {
          dispatchJob: expect.any(Function),
        }

        const received = AssetMediaExtractionPostRenderer.stubJobDispatcher

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when its job is dispatched', () => {
      test('should send nothing', async () => {
        const jobDispatcher = AssetMediaExtractionPostRenderer.stubJobDispatcher

        const received = await jobDispatcher.dispatchJob()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:stubFieldStates', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = [
          {
            name: 'extracted',
            confidenceWeight: 1,
          },
          {
            name: 'derived',
            confidenceWeight: 0.8,
          },
          {
            name: 'suggested',
            confidenceWeight: 0.6,
          },
        ]

        const received = AssetMediaExtractionPostRenderer.stubFieldStates

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:stubTextValues', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = [
          'brick',
          'concrete',
          'weathered',
          'repainted',
          'tiled',
          'unpainted',
        ]

        const received = AssetMediaExtractionPostRenderer.stubTextValues

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.createAiRunStatusRecorder()', () => {
    describe('when called as is', () => {
      test('should be instance of AiRunStatusRecorder', () => {
        const received = AssetMediaExtractionPostRenderer.createAiRunStatusRecorder()

        expect(received)
          .toBeInstanceOf(AiRunStatusRecorder)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.createStubAnswerDigester()', () => {
    describe('when called as is', () => {
      test('should be instance of StubAnswerDigester', () => {
        const received = AssetMediaExtractionPostRenderer.createStubAnswerDigester()

        expect(received)
          .toBeInstanceOf(StubAnswerDigester)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          Ctor: AssetMediaExtractionPostRenderer,
        },
      },
      {
        input: {
          Ctor: class AlphaAssetMediaExtractionPostRenderer extends AssetMediaExtractionPostRenderer {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', ({
      input,
    }) => {
      const renderer = input.Ctor.create()

      const received = renderer.Ctor

      expect(received)
        .toBe(input.Ctor) // same reference
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#ensureJobDispatcher()', () => {
    const cases = [
      {
        input: {
          Ctor: AssetMediaExtractionPostRenderer,
        },
      },
      {
        input: {
          Ctor: class BetaAssetMediaExtractionPostRenderer extends AssetMediaExtractionPostRenderer {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', async ({
      input,
    }) => {
      const renderer = input.Ctor.create()

      const received = await renderer.ensureJobDispatcher()

      expect(received)
        .toBe(AssetMediaExtractionPostRenderer.stubJobDispatcher) // same reference
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#extractRequestBody()', () => {
    const cases = [
      {
        input: {
          rawBody: '{"mediaSignature":"media-signature-10600001"}',
        },
        expected: {
          mediaSignature: 'media-signature-10600001',
        },
      },
      {
        input: {
          rawBody: '{"asset":{"categorySlugs":["residential"],"province":"Ha Noi"},"media":[]}',
        },
        expected: {
          asset: {
            categorySlugs: [
              'residential',
            ],
            province: 'Ha Noi',
          },
          media: [],
        },
      },
    ]

    test.each(cases)('rawBody: $input.rawBody', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.extractRequestBody(input)

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#isUnreadableStubMedium()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            mediaKey: 'media-key-10600002',
          },
        },
        {
          input: {
            mediaKey: 'media-key-10600009',
          },
        },
      ]

      test.each(cases)('mediaKey: $input.mediaKey', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.isUnreadableStubMedium(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            mediaKey: 'media-key-10600001',
          },
        },
        {
          input: {
            mediaKey: 'media-key-10600003',
          },
        },
      ]

      test.each(cases)('mediaKey: $input.mediaKey', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.isUnreadableStubMedium(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#isStubSuggestibleField()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            valueKind: 'text',
          },
        },
        {
          input: {
            valueKind: 'number',
          },
        },
        {
          input: {
            valueKind: 'select',
          },
        },
      ]

      test.each(cases)('valueKind: $input.valueKind', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.isStubSuggestibleField(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            valueKind: 'photo',
          },
        },
        {
          input: {
            valueKind: 'boolean',
          },
        },
        {
          // a member of Object.prototype, which reaches no entry of the hash
          input: {
            valueKind: 'constructor',
          },
        },
        {
          input: {
            valueKind: 'toString',
          },
        },
      ]

      test.each(cases)('valueKind: $input.valueKind', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.isStubSuggestibleField(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#citesStubMedium()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            path: 'attributes.wallMaterial',
            mediaKey: 'media-key-10600001',
          },
        },
        {
          input: {
            path: 'attributes.floorCount',
            mediaKey: 'media-key-10600002',
          },
        },
      ]

      test.each(cases)('path: $input.path', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.citesStubMedium(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            path: 'attributes.legalStatusSlug',
            mediaKey: 'media-key-10600001',
          },
        },
        {
          input: {
            path: 'attributes.wallMaterial',
            mediaKey: 'media-key-10600004',
          },
        },
      ]

      test.each(cases)('mediaKey: $input.mediaKey', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.citesStubMedium(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#generateStubDigestedNumber()', () => {
    const cases = [
      {
        input: {
          value: {
            mediaKey: 'media-key-10600001',
          },
        },
        expected: 130638138,
      },
      {
        input: {
          value: {
            mediaKey: 'media-key-10600002',
          },
        },
        expected: 2219165802,
      },
      {
        input: {
          value: {
            path: 'attributes.wallMaterial',
            mediaKey: 'media-key-10600001',
          },
        },
        expected: 2974142339,
      },
      {
        input: {
          value: 'omega',
        },
        expected: 11675734,
      },
    ]

    test.each(cases)('value: $input.value', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.generateStubDigestedNumber(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#buildStubTextValue()', () => {
    const cases = [
      {
        input: {
          digestedNumber: 106002,
        },
        expected: 'brick',
      },
      {
        input: {
          digestedNumber: 106003,
        },
        expected: 'concrete',
      },
      {
        input: {
          digestedNumber: 106004,
        },
        expected: 'weathered',
      },
      {
        input: {
          digestedNumber: 106005,
        },
        expected: 'repainted',
      },
      {
        input: {
          digestedNumber: 106006,
        },
        expected: 'tiled',
      },
      {
        input: {
          digestedNumber: 106007,
        },
        expected: 'unpainted',
      },
    ]

    test.each(cases)('digestedNumber: $input.digestedNumber', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.buildStubTextValue(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#generateStubNumberValue()', () => {
    const cases = [
      {
        input: {
          digestedNumber: 106002,
        },
        expected: 82,
      },
      {
        input: {
          digestedNumber: 106003,
        },
        expected: 83,
      },
      {
        input: {
          // the floor of the band; a number field never answers zero
          digestedNumber: 0,
        },
        expected: 10,
      },
      {
        input: {
          digestedNumber: 1730174613,
        },
        expected: 43,
      },
    ]

    test.each(cases)('digestedNumber: $input.digestedNumber', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.generateStubNumberValue(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#extractStubSelectValue()', () => {
    describe('when options were sent', () => {
      const cases = [
        {
          input: {
            options: [
              'full-title',
              'pending-title',
              'no-title',
            ],
            digestedNumber: 106002,
          },
          expected: 'full-title',
        },
        {
          input: {
            options: [
              'full-title',
              'pending-title',
              'no-title',
            ],
            digestedNumber: 106003,
          },
          expected: 'pending-title',
        },
        {
          input: {
            options: [
              'full-title',
              'pending-title',
              'no-title',
            ],
            digestedNumber: 106004,
          },
          expected: 'no-title',
        },
      ]

      test.each(cases)('digestedNumber: $input.digestedNumber', ({
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.extractStubSelectValue(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when no option was sent', () => {
      const cases = [
        {
          input: {
            options: [],
            digestedNumber: 106002,
          },
        },
        {
          input: {
            // options: undefined
            digestedNumber: 106003,
          },
        },
      ]

      test.each(cases)('digestedNumber: $input.digestedNumber', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.extractStubSelectValue(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#buildStubFieldValue()', () => {
    describe('when the kind can be suggested', () => {
      const cases = [
        {
          input: {
            valueKind: 'text',
            digestedNumber: 106002,
          },
          expected: 'brick',
        },
        {
          input: {
            valueKind: 'number',
            digestedNumber: 106003,
          },
          expected: 83,
        },
        {
          input: {
            valueKind: 'select',
            options: [
              'full-title',
              'pending-title',
              'no-title',
            ],
            digestedNumber: 106004,
          },
          expected: 'no-title',
        },
      ]

      test.each(cases)('valueKind: $input.valueKind', ({
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.buildStubFieldValue(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the kind cannot be suggested', () => {
      const cases = [
        {
          input: {
            valueKind: 'photo',
            digestedNumber: 106002,
          },
        },
        {
          input: {
            // a select bounded to nothing carries no value to answer
            valueKind: 'select',
            options: [],
            digestedNumber: 106003,
          },
        },
        {
          // a member of Object.prototype, which reaches no entry of the hash
          input: {
            valueKind: 'constructor',
            digestedNumber: 106004,
          },
        },
      ]

      test.each(cases)('valueKind: $input.valueKind', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.buildStubFieldValue(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#extractStubFieldState()', () => {
    const cases = [
      {
        input: {
          digestedNumber: 106002,
        },
        expected: {
          name: 'extracted',
          confidenceWeight: 1,
        },
      },
      {
        input: {
          digestedNumber: 106003,
        },
        expected: {
          name: 'derived',
          confidenceWeight: 0.8,
        },
      },
      {
        input: {
          digestedNumber: 106004,
        },
        expected: {
          name: 'suggested',
          confidenceWeight: 0.6,
        },
      },
    ]

    test.each(cases)('digestedNumber: $input.digestedNumber', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.extractStubFieldState(input)

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#buildStubAgreement()', () => {
    const cases = [
      {
        input: {
          digestedNumber: 106002,
        },
        expected: {
          agreedReadingCount: 2,
          totalReadingCount: 3,
        },
      },
      {
        input: {
          digestedNumber: 106003,
        },
        expected: {
          agreedReadingCount: 3,
          totalReadingCount: 3,
        },
      },
      {
        input: {
          digestedNumber: 1730174613,
        },
        expected: {
          agreedReadingCount: 3,
          totalReadingCount: 3,
        },
      },
    ]

    test.each(cases)('digestedNumber: $input.digestedNumber', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.buildStubAgreement(input)

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#generateStubConfidence()', () => {
    describe('when two of three readings agreed', () => {
      const cases = [
        {
          input: {
            agreement: {
              agreedReadingCount: 2,
              totalReadingCount: 3,
            },
            confidenceWeight: 1,
          },
          expected: 0.67,
        },
        {
          input: {
            agreement: {
              agreedReadingCount: 2,
              totalReadingCount: 3,
            },
            confidenceWeight: 0.8,
          },
          expected: 0.53,
        },
        {
          input: {
            agreement: {
              agreedReadingCount: 2,
              totalReadingCount: 3,
            },
            confidenceWeight: 0.6,
          },
          expected: 0.4,
        },
      ]

      test.each(cases)('confidenceWeight: $input.confidenceWeight', ({
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.generateStubConfidence(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when every reading agreed', () => {
      const cases = [
        {
          input: {
            agreement: {
              agreedReadingCount: 3,
              totalReadingCount: 3,
            },
            confidenceWeight: 1,
          },
          expected: 1,
        },
        {
          input: {
            agreement: {
              agreedReadingCount: 3,
              totalReadingCount: 3,
            },
            confidenceWeight: 0.8,
          },
          expected: 0.8,
        },
        {
          input: {
            agreement: {
              agreedReadingCount: 3,
              totalReadingCount: 3,
            },
            confidenceWeight: 0.6,
          },
          expected: 0.6,
        },
      ]

      test.each(cases)('confidenceWeight: $input.confidenceWeight', ({
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.generateStubConfidence(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#buildStubReason()', () => {
    const cases = [
      {
        input: {
          label: 'Wall material',
          sourceMediaKeys: [
            'media-key-10600001',
            'media-key-10600003',
          ],
          province: 'Ha Noi',
        },
        expected: 'Read "Wall material" from 2 of the photos sent, for an asset in Ha Noi.',
      },
      {
        input: {
          label: 'Floor count',
          sourceMediaKeys: [
            'media-key-10600004',
          ],
          province: 'Da Nang',
        },
        expected: 'Read "Floor count" from 1 of the photos sent, for an asset in Da Nang.',
      },
      {
        // a province sent as a code rather than as a name, which the line shows the caller
        input: {
          label: 'Legal status',
          sourceMediaKeys: [
            'media-key-10600005',
            'media-key-10600006',
            'media-key-10600007',
          ],
          province: '01',
        },
        expected: 'Read "Legal status" from 3 of the photos sent, for an asset in 01.',
      },
    ]

    test.each(cases)('label: $input.label', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.buildStubReason(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#extractStubSourceMediaKeys()', () => {
    describe('when some media are cited', () => {
      const cases = [
        {
          input: {
            path: 'attributes.wallMaterial',
            readableMediaKeys: [
              'media-key-10600004',
              'media-key-10600005',
              'media-key-10600006',
            ],
          },
          expected: [
            'media-key-10600006',
          ],
        },
        {
          input: {
            path: 'attributes.floorCount',
            readableMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
          },
          expected: [
            'media-key-10600001',
            'media-key-10600003',
          ],
        },
      ]

      test.each(cases)('path: $input.path', ({
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.extractStubSourceMediaKeys(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when no medium is cited', () => {
      const cases = [
        {
          input: {
            path: 'attributes.legalStatusSlug',
            readableMediaKeys: [
              'media-key-10600001',
              'media-key-10600002',
              'media-key-10600003',
            ],
          },
        },
        {
          input: {
            path: 'attributes.wallMaterial',
            readableMediaKeys: [],
          },
        },
      ]

      test.each(cases)('path: $input.path', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.extractStubSourceMediaKeys(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#extractStubMissingFieldPaths()', () => {
    const cases = [
      {
        input: {
          fieldSchema: [
            {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            {
              path: 'attributes.floorCount',
              label: 'Floor count',
              valueKind: 'number',
              isRequired: true,
            },
          ],
          fields: [
            {
              path: 'attributes.floorCount',
            },
          ],
        },
        expected: [
          'attributes.wallMaterial',
        ],
      },
      {
        input: {
          fieldSchema: [
            {
              path: 'attributes.legalStatusSlug',
              label: 'Legal status',
              valueKind: 'select',
              isRequired: false,
            },
            {
              path: 'attributes.roofCondition',
              label: 'Roof condition',
              valueKind: 'text',
              isRequired: true,
            },
          ],
          fields: [],
        },
        expected: [
          'attributes.roofCondition',
        ],
      },
    ]

    test.each(cases)('fieldSchema[0].path: $input.fieldSchema.0.path', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.extractStubMissingFieldPaths(input)

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#buildStubField()', () => {
    describe('when the field settles', () => {
      const cases = [
        {
          input: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            readableMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
            asset: {
              categorySlugs: [
                'residential',
                'townhouse',
              ],
              province: 'Ha Noi',
            },
          },
          expected: {
            path: 'attributes.wallMaterial',
            value: 'unpainted',
            fieldStateName: 'suggested',
            suggestionConfidence: 0.6,
            reason: 'Read "Wall material" from 2 of the photos sent, for an asset in Ha Noi.',
            sourceMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
            agreement: {
              agreedReadingCount: 3,
              totalReadingCount: 3,
            },
          },
        },
        {
          input: {
            fieldSchemaEntry: {
              path: 'attributes.floorCount',
              label: 'Floor count',
              valueKind: 'number',
              isRequired: true,
              unit: 'floor',
            },
            readableMediaKeys: [
              'media-key-10600004',
              'media-key-10600005',
              'media-key-10600006',
            ],
            asset: {
              categorySlugs: [
                'residential',
                'townhouse',
              ],
              province: 'Ha Noi',
            },
          },
          expected: {
            path: 'attributes.floorCount',
            value: 43,
            fieldStateName: 'extracted',
            suggestionConfidence: 1,
            reason: 'Read "Floor count" from 2 of the photos sent, for an asset in Ha Noi.',
            sourceMediaKeys: [
              'media-key-10600004',
              'media-key-10600005',
            ],
            agreement: {
              agreedReadingCount: 3,
              totalReadingCount: 3,
            },
          },
        },
      ]

      test.each(cases)('path: $input.fieldSchemaEntry.path', ({
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.buildStubField(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The same path, the same photos and two provinces.
     *
     * The province is part of what a field is judged from, so the two answers differ — which is the
     * whole reason the reading of `asset.province` is a decision and not a detail ([[Q123]]).
     */
    describe('when the asset sits in another province', () => {
      const cases = [
        {
          input: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            readableMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
            asset: {
              categorySlugs: [
                'residential',
                'townhouse',
              ],
              province: 'Ha Noi',
            },
          },
          expected: {
            path: 'attributes.wallMaterial',
            value: 'unpainted',
            fieldStateName: 'suggested',
            suggestionConfidence: 0.6,
            reason: 'Read "Wall material" from 2 of the photos sent, for an asset in Ha Noi.',
            sourceMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
            agreement: {
              agreedReadingCount: 3,
              totalReadingCount: 3,
            },
          },
        },
        {
          input: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            readableMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
            asset: {
              categorySlugs: [
                'residential',
                'townhouse',
              ],
              province: 'Da Nang',
            },
          },
          expected: {
            path: 'attributes.wallMaterial',
            value: 'concrete',
            fieldStateName: 'derived',
            suggestionConfidence: 0.8,
            reason: 'Read "Wall material" from 2 of the photos sent, for an asset in Da Nang.',
            sourceMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
            agreement: {
              agreedReadingCount: 3,
              totalReadingCount: 3,
            },
          },
        },
      ]

      test.each(cases)('province: $input.asset.province', ({
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.buildStubField(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the field settles nothing', () => {
      const cases = [
        {
          // no readable medium cites this path
          input: {
            fieldSchemaEntry: {
              path: 'attributes.legalStatusSlug',
              label: 'Legal status',
              valueKind: 'select',
              isRequired: true,
              options: [
                'full-title',
                'pending-title',
                'no-title',
              ],
            },
            readableMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
            asset: {
              categorySlugs: [
                'residential',
              ],
              province: 'Ha Noi',
            },
          },
        },
        {
          // a kind no photo can be read for
          input: {
            fieldSchemaEntry: {
              path: 'attributes.frontPhotoKey',
              label: 'Front photo',
              valueKind: 'photo',
              isRequired: true,
            },
            readableMediaKeys: [
              'media-key-10600001',
              'media-key-10600003',
            ],
            asset: {
              categorySlugs: [
                'residential',
              ],
              province: 'Ha Noi',
            },
          },
        },
        {
          // no medium was readable at all
          input: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            readableMediaKeys: [],
            asset: {
              categorySlugs: [
                'residential',
              ],
              province: 'Ha Noi',
            },
          },
        },
      ]

      test.each(cases)('path: $input.fieldSchemaEntry.path', ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const received = renderer.buildStubField(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#buildStubResult()', () => {
    const cases = [
      {
        input: {
          requestBody: {
            asset: {
              categorySlugs: [
                'residential',
                'townhouse',
              ],
              province: 'Ha Noi',
            },
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                label: 'Wall material',
                valueKind: 'text',
                isRequired: true,
              },
              {
                path: 'attributes.floorCount',
                label: 'Floor count',
                valueKind: 'number',
                isRequired: true,
                unit: 'floor',
              },
              {
                path: 'attributes.legalStatusSlug',
                label: 'Legal status',
                valueKind: 'select',
                isRequired: true,
                options: [
                  'full-title',
                  'pending-title',
                  'no-title',
                ],
              },
              {
                path: 'attributes.frontPhotoKey',
                label: 'Front photo',
                valueKind: 'photo',
                isRequired: true,
              },
            ],
            media: [
              {
                mediaKey: 'media-key-10600001',
                mediaCategoryName: 'photo',
                url: 'https://storage.client.development.invalid/10600001.jpg',
                mimeType: 'image/jpeg',
                byteSize: 120001,
              },
              {
                mediaKey: 'media-key-10600002',
                mediaCategoryName: 'photo',
                url: 'https://storage.client.development.invalid/10600002.jpg',
                mimeType: 'image/jpeg',
                byteSize: 120002,
              },
              {
                mediaKey: 'media-key-10600003',
                mediaCategoryName: 'photo',
                url: 'https://storage.client.development.invalid/10600003.jpg',
                mimeType: 'image/jpeg',
                byteSize: 120003,
              },
            ],
            mediaSignature: 'media-signature-10600001',
          },
        },
        expected: {
          fields: [
            {
              path: 'attributes.wallMaterial',
              value: 'unpainted',
              fieldStateName: 'suggested',
              suggestionConfidence: 0.6,
              reason: 'Read "Wall material" from 2 of the photos sent, for an asset in Ha Noi.',
              sourceMediaKeys: [
                'media-key-10600001',
                'media-key-10600003',
              ],
              agreement: {
                agreedReadingCount: 3,
                totalReadingCount: 3,
              },
            },
            {
              path: 'attributes.floorCount',
              value: 43,
              fieldStateName: 'extracted',
              suggestionConfidence: 1,
              reason: 'Read "Floor count" from 2 of the photos sent, for an asset in Ha Noi.',
              sourceMediaKeys: [
                'media-key-10600001',
                'media-key-10600003',
              ],
              agreement: {
                agreedReadingCount: 3,
                totalReadingCount: 3,
              },
            },
          ],
          missingFieldPaths: [
            'attributes.legalStatusSlug',
          ],
          unreadableMediaKeys: [
            'media-key-10600002',
          ],
          mediaSignature: 'media-signature-10600001',
        },
      },
      {
        // the same schema and the same asset, naming three other photos
        input: {
          requestBody: {
            asset: {
              categorySlugs: [
                'residential',
                'townhouse',
              ],
              province: 'Ha Noi',
            },
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                label: 'Wall material',
                valueKind: 'text',
                isRequired: true,
              },
              {
                path: 'attributes.floorCount',
                label: 'Floor count',
                valueKind: 'number',
                isRequired: true,
                unit: 'floor',
              },
              {
                path: 'attributes.legalStatusSlug',
                label: 'Legal status',
                valueKind: 'select',
                isRequired: true,
                options: [
                  'full-title',
                  'pending-title',
                  'no-title',
                ],
              },
              {
                path: 'attributes.frontPhotoKey',
                label: 'Front photo',
                valueKind: 'photo',
                isRequired: true,
              },
            ],
            media: [
              {
                mediaKey: 'media-key-10600004',
                mediaCategoryName: 'photo',
                url: 'https://storage.client.development.invalid/10600004.jpg',
                mimeType: 'image/jpeg',
                byteSize: 120004,
              },
              {
                mediaKey: 'media-key-10600005',
                mediaCategoryName: 'photo',
                url: 'https://storage.client.development.invalid/10600005.jpg',
                mimeType: 'image/jpeg',
                byteSize: 120005,
              },
              {
                mediaKey: 'media-key-10600006',
                mediaCategoryName: 'photo',
                url: 'https://storage.client.development.invalid/10600006.jpg',
                mimeType: 'image/jpeg',
                byteSize: 120006,
              },
            ],
            mediaSignature: 'media-signature-10600002',
          },
        },
        expected: {
          fields: [
            {
              path: 'attributes.wallMaterial',
              value: 'unpainted',
              fieldStateName: 'suggested',
              suggestionConfidence: 0.6,
              reason: 'Read "Wall material" from 1 of the photos sent, for an asset in Ha Noi.',
              sourceMediaKeys: [
                'media-key-10600006',
              ],
              agreement: {
                agreedReadingCount: 3,
                totalReadingCount: 3,
              },
            },
            {
              path: 'attributes.floorCount',
              value: 43,
              fieldStateName: 'extracted',
              suggestionConfidence: 1,
              reason: 'Read "Floor count" from 2 of the photos sent, for an asset in Ha Noi.',
              sourceMediaKeys: [
                'media-key-10600004',
                'media-key-10600005',
              ],
              agreement: {
                agreedReadingCount: 3,
                totalReadingCount: 3,
              },
            },
            {
              path: 'attributes.legalStatusSlug',
              value: 'full-title',
              fieldStateName: 'extracted',
              suggestionConfidence: 0.67,
              reason: 'Read "Legal status" from 3 of the photos sent, for an asset in Ha Noi.',
              sourceMediaKeys: [
                'media-key-10600004',
                'media-key-10600005',
                'media-key-10600006',
              ],
              agreement: {
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
            },
          ],
          missingFieldPaths: [],
          unreadableMediaKeys: [],
          mediaSignature: 'media-signature-10600002',
        },
      },
      {
        // a request naming no medium at all settles nothing, and says so field by field
        input: {
          requestBody: {
            asset: {
              categorySlugs: [
                'residential',
                'townhouse',
              ],
              province: 'Ha Noi',
            },
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                label: 'Wall material',
                valueKind: 'text',
                isRequired: true,
              },
              {
                path: 'attributes.floorCount',
                label: 'Floor count',
                valueKind: 'number',
                isRequired: true,
                unit: 'floor',
              },
              {
                path: 'attributes.legalStatusSlug',
                label: 'Legal status',
                valueKind: 'select',
                isRequired: true,
                options: [
                  'full-title',
                  'pending-title',
                  'no-title',
                ],
              },
              {
                path: 'attributes.frontPhotoKey',
                label: 'Front photo',
                valueKind: 'photo',
                isRequired: true,
              },
            ],
            media: [],
            mediaSignature: 'media-signature-10600004',
          },
        },
        expected: {
          fields: [],
          missingFieldPaths: [
            'attributes.wallMaterial',
            'attributes.floorCount',
            'attributes.legalStatusSlug',
          ],
          unreadableMediaKeys: [],
          mediaSignature: 'media-signature-10600004',
        },
      },
      {
        // an asset type carrying no field a photo can be read for
        input: {
          requestBody: {
            asset: {
              categorySlugs: [
                'land',
              ],
              province: 'Ha Noi',
            },
            fieldSchema: [
              {
                path: 'attributes.frontPhotoKey',
                label: 'Front photo',
                valueKind: 'photo',
                isRequired: true,
              },
            ],
            media: [
              {
                mediaKey: 'media-key-10600007',
                mediaCategoryName: 'photo',
                url: 'https://storage.client.development.invalid/10600007.jpg',
                mimeType: 'image/jpeg',
                byteSize: 120007,
              },
            ],
            mediaSignature: 'media-signature-10600005',
          },
        },
        expected: {
          fields: [],
          missingFieldPaths: [],
          unreadableMediaKeys: [],
          mediaSignature: 'media-signature-10600005',
        },
      },
    ]

    test.each(cases)('mediaSignature: $input.requestBody.mediaSignature', ({
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const received = renderer.buildStubResult(input)

      expect(received)
        .toEqual(expected)
    })
  })
})
