import StubAssetFieldReadingSupplier from '../../../../app/assetMediaExtraction/StubAssetFieldReadingSupplier.js'

import StubAnswerDigester from '../../../../app/stubAiModel/StubAnswerDigester.js'

/*
 * specs/1.0.0 §20's fourth use case: "the client system builds and demonstrates its whole
 * suggestion screen before any API key exists, because the stub answers deterministically from the
 * media the request names". This class is where those answers come from - the keyless driver fills
 * in no findings by design, and this service supplies them.
 *
 * **Every expected value here is written out rather than recomputed**, which is what makes this file
 * the determinism check as well as the behavior check. A digest that moved, a key order that
 * changed, a clock or a counter smuggled into the draw - any of them fails every case below. Two
 * describes exist for nothing else: one varies the photographs and holds the signature still, the
 * other varies the signature and holds the photographs still, and the answers differ across both.
 *
 * The reason is deliberately neither Vietnamese nor display wording: a demonstration value reaches
 * the same screen a model's answer reaches, and the marker at the front of the line is the one thing
 * that keeps the two apart. It is asserted as an exact string for that reason.
 */

describe('StubAssetFieldReadingSupplier', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#answerDigester', () => {
        const cases = [
          {
            params: {
              answerDigester: StubAnswerDigester.create({
                hashAlgorithm: 'sha256',
              }),
              evidenceKindNames: [
                'visible-text',
              ],
            },
          },
          {
            params: {
              answerDigester: StubAnswerDigester.create({
                hashAlgorithm: 'sha512',
              }),
              evidenceKindNames: [
                'visual-estimate',
              ],
            },
          },
        ]

        test.each(cases)('hashAlgorithm: $params.answerDigester.hashAlgorithm', ({
          params,
        }) => {
          const supplier = new StubAssetFieldReadingSupplier(params)

          expect(supplier)
            .toHaveProperty('answerDigester', params.answerDigester)
        })
      })

      describe('#evidenceKindNames', () => {
        const cases = [
          {
            params: {
              answerDigester: StubAnswerDigester.create(),
              evidenceKindNames: [
                'visible-text',
                'visual-estimate',
                'category-prior',
              ],
            },
          },
          {
            params: {
              answerDigester: StubAnswerDigester.create(),
              evidenceKindNames: [
                'category-prior',
              ],
            },
          },
        ]

        test.each(cases)('evidenceKindNames[0]: $params.evidenceKindNames.0', ({
          params,
        }) => {
          const supplier = new StubAssetFieldReadingSupplier(params)

          expect(supplier)
            .toHaveProperty('evidenceKindNames', params.evidenceKindNames)
        })
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            answerDigester: StubAnswerDigester.create(),
            evidenceKindNames: [
              'visible-text',
            ],
          },
        },
        {
          params: {
            answerDigester: StubAnswerDigester.create(),
            evidenceKindNames: [
              'category-prior',
            ],
          },
        },
      ]

      test.each(cases)('evidenceKindNames[0]: $params.evidenceKindNames.0', ({
        params,
      }) => {
        const actual = StubAssetFieldReadingSupplier.create(params)

        expect(actual)
          .toBeInstanceOf(StubAssetFieldReadingSupplier)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            answerDigester: StubAnswerDigester.create(),
            evidenceKindNames: [
              'visible-text',
            ],
          },
        },
        {
          params: {
            answerDigester: StubAnswerDigester.create(),
            evidenceKindNames: [
              'visual-estimate',
            ],
          },
        },
      ]

      test.each(cases)('evidenceKindNames[0]: $params.evidenceKindNames.0', ({
        params,
      }) => {
        const SpyClass = constructorSpy.spyOn(StubAssetFieldReadingSupplier)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })

    describe('should fill default answerDigester', () => {
      test('with no arguments', () => {
        const actual = StubAssetFieldReadingSupplier.create()

        expect(actual.answerDigester)
          .toBeInstanceOf(StubAnswerDigester)
      })
    })

    describe('should fill default evidenceKindNames', () => {
      test('with no arguments', () => {
        const expected = [
          'visible-text',
          'visual-estimate',
          'category-prior',
        ]

        const actual = StubAssetFieldReadingSupplier.create()

        expect(actual.evidenceKindNames)
          .toEqual(expected)
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('.get:StubAnswerDigesterCtor', () => {
    test('should be the digester the keyless driver answers from', () => {
      const expected = StubAnswerDigester

      const actual = StubAssetFieldReadingSupplier.StubAnswerDigesterCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('.createStubAnswerDigester()', () => {
    test('should create the digester', () => {
      const actual = StubAssetFieldReadingSupplier.createStubAnswerDigester()

      expect(actual)
        .toBeInstanceOf(StubAnswerDigester)
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          SupplierCtor: StubAssetFieldReadingSupplier,
        },
      },
      {
        params: {
          SupplierCtor: class ExtendedStubAssetFieldReadingSupplier extends StubAssetFieldReadingSupplier {},
        },
      },
    ]

    test.each(cases)('class: $params.SupplierCtor.name', ({
      params,
    }) => {
      const supplier = params.SupplierCtor.create()

      const actual = supplier.Ctor

      expect(actual)
        .toBe(params.SupplierCtor) // same reference
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#buildFieldReadings()', () => {
    /*
     * The signature is one string across both cases and only the photographs move, so a value that
     * came back the same would mean the photographs are not in the draw - which is the half of
     * "deterministically from the media the request names" a caller's own signature cannot supply.
     */
    describe('should answer differently for different photographs', () => {
      const cases = [
        {
          params: {
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
              {
                path: 'attributes.frontageNote',
                valueKind: 'text',
              },
            ],
            mediaSignature: 'media-signature-10620001',
            readableMediaKeys: [
              'media-key-10620011',
            ],
          },
          expected: [
            {
              path: 'attributes.wallMaterial',
              value: 'timber',
              evidenceKindName: 'category-prior',
              reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620011',
              ],
            },
            {
              path: 'attributes.frontageNote',
              value: 'stub-value-4175472933',
              evidenceKindName: 'visible-text',
              reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620011',
              ],
            },
          ],
        },
        {
          params: {
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
              {
                path: 'attributes.frontageNote',
                valueKind: 'text',
              },
            ],
            mediaSignature: 'media-signature-10620001',
            readableMediaKeys: [
              'media-key-10620012',
            ],
          },
          expected: [
            {
              path: 'attributes.wallMaterial',
              value: 'brick',
              evidenceKindName: 'visible-text',
              reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620012',
              ],
            },
            {
              path: 'attributes.frontageNote',
              value: 'stub-value-1953544865',
              evidenceKindName: 'category-prior',
              reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620012',
              ],
            },
          ],
        },
      ]

      test.each(cases)('readableMediaKeys[0]: $params.readableMediaKeys.0', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.buildFieldReadings(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * The mirror of the case above: one set of photographs, two signatures. The text field moves
     * across them, which is what the signature being in the draw looks like.
     */
    describe('should answer differently for different media signatures', () => {
      const cases = [
        {
          params: {
            fieldSchema: [
              {
                path: 'attributes.frontageNote',
                valueKind: 'text',
              },
            ],
            mediaSignature: 'media-signature-10620002',
            readableMediaKeys: [
              'media-key-10620021',
            ],
          },
          expected: [
            {
              path: 'attributes.frontageNote',
              value: 'stub-value-2591828422',
              evidenceKindName: 'visual-estimate',
              reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620021',
              ],
            },
          ],
        },
        {
          params: {
            fieldSchema: [
              {
                path: 'attributes.frontageNote',
                valueKind: 'text',
              },
            ],
            mediaSignature: 'media-signature-10620003',
            readableMediaKeys: [
              'media-key-10620021',
            ],
          },
          expected: [
            {
              path: 'attributes.frontageNote',
              value: 'stub-value-1102660191',
              evidenceKindName: 'visible-text',
              reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620021',
              ],
            },
          ],
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.buildFieldReadings(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * All three kinds a photograph can be read for, in one schema, over two photographs: a select
     * answers one of the caller's own options, a number answers a number inside the range sent, and
     * a text answers a marked string. Different fields cite different photographs, which is what a
     * screen showing "the photos this came from" per field is built against.
     */
    describe('should answer every kind a photograph can be read for', () => {
      const cases = [
        {
          params: {
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
              {
                path: 'attributes.balconyCount',
                valueKind: 'number',
                minimum: 0,
                maximum: 4,
              },
              {
                path: 'attributes.frontageNote',
                valueKind: 'text',
                maxLength: 64,
              },
            ],
            mediaSignature: 'media-signature-10620004',
            readableMediaKeys: [
              'media-key-10620031',
              'media-key-10620032',
            ],
          },
          expected: [
            {
              path: 'attributes.wallMaterial',
              value: 'brick',
              evidenceKindName: 'visible-text',
              reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620031',
              ],
            },
            {
              path: 'attributes.balconyCount',
              value: 2,
              evidenceKindName: 'visible-text',
              reason: '[stub] demonstration value for attributes.balconyCount, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620032',
              ],
            },
            {
              path: 'attributes.frontageNote',
              value: 'stub-value-4161982087',
              evidenceKindName: 'visual-estimate',
              reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620032',
              ],
            },
          ],
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.buildFieldReadings(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * A select whose options the caller did not send bounds the field to nothing, and a kind no
     * photograph can be read for bounds it to nothing either. Both are left out rather than answered
     * with something step 4 would drop.
     */
    describe('should leave out a field the schema bounds to nothing', () => {
      const cases = [
        {
          params: {
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                valueKind: 'select',
                options: [
                  'brick',
                  'concrete',
                ],
              },
              {
                path: 'attributes.roofMaterial',
                valueKind: 'select',
              },
              {
                path: 'attributes.handoverDate',
                valueKind: 'date',
              },
            ],
            mediaSignature: 'media-signature-10620005',
            readableMediaKeys: [
              'media-key-10620041',
            ],
          },
          expected: [
            {
              path: 'attributes.wallMaterial',
              value: 'concrete',
              evidenceKindName: 'category-prior',
              reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
              sourceMediaKeys: [
                'media-key-10620041',
              ],
            },
          ],
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.buildFieldReadings(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should answer nothing at all', () => {
      const cases = [
        {
          params: {
            fieldSchema: [
              {
                path: 'attributes.frontageNote',
                valueKind: 'text',
              },
            ],
            mediaSignature: 'media-signature-10620006',
            readableMediaKeys: [],
          },
        },
        {
          params: {
            fieldSchema: [
              {
                path: 'attributes.frontageNote',
                valueKind: 'text',
              },
            ],
            mediaSignature: 'media-signature-10620007',
            readableMediaKeys: null,
          },
        },
        {
          params: {
            fieldSchema: null,
            mediaSignature: 'media-signature-10620008',
            readableMediaKeys: [
              'media-key-10620061',
            ],
          },
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.buildFieldReadings(params)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#hasReadableMedia()', () => {
    describe('should answer that a photograph was read', () => {
      const cases = [
        {
          params: {
            readableMediaKeys: [
              'media-key-10620071',
            ],
          },
        },
        {
          params: {
            readableMediaKeys: [
              'media-key-10620072',
              'media-key-10620073',
            ],
          },
        },
      ]

      test.each(cases)('readableMediaKeys[0]: $params.readableMediaKeys.0', ({
        params,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.hasReadableMedia(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should answer that none was', () => {
      const cases = [
        {
          params: {
            readableMediaKeys: [],
          },
        },
        {
          params: {
            readableMediaKeys: null,
          },
        },
        {
          params: {
            readableMediaKeys: 'media-key-10620074',
          },
        },
      ]

      test.each(cases)('readableMediaKeys: $params.readableMediaKeys', ({
        params,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.hasReadableMedia(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#buildFieldReading()', () => {
    describe('should answer what one field was read as', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              valueKind: 'select',
              options: [
                'brick',
                'concrete',
                'timber',
              ],
            },
            mediaSignature: 'media-signature-10620001',
            readableMediaKeys: [
              'media-key-10620011',
            ],
          },
          expected: {
            path: 'attributes.wallMaterial',
            value: 'timber',
            evidenceKindName: 'category-prior',
            reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
            sourceMediaKeys: [
              'media-key-10620011',
            ],
          },
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontageNote',
              valueKind: 'text',
            },
            mediaSignature: 'media-signature-10620001',
            readableMediaKeys: [
              'media-key-10620011',
            ],
          },
          expected: {
            path: 'attributes.frontageNote',
            value: 'stub-value-4175472933',
            evidenceKindName: 'visible-text',
            reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
            sourceMediaKeys: [
              'media-key-10620011',
            ],
          },
        },
      ]

      test.each(cases)('path: $params.fieldSchemaEntry.path', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.buildFieldReading(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should answer nothing for a field bounded to nothing', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.roofMaterial',
              valueKind: 'select',
            },
            mediaSignature: 'media-signature-10620009',
            readableMediaKeys: [
              'media-key-10620081',
            ],
          },
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.handoverDate',
              valueKind: 'date',
            },
            mediaSignature: 'media-signature-10620009',
            readableMediaKeys: [
              'media-key-10620081',
            ],
          },
        },
      ]

      test.each(cases)('path: $params.fieldSchemaEntry.path', ({
        params,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.buildFieldReading(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#generateDrawnNumber()', () => {
    describe('should draw a different number for each field', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              valueKind: 'select',
            },
            mediaSignature: 'media-signature-10620006',
            readableMediaKeys: [
              'media-key-10620051',
            ],
          },
          expected: 46362532,
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontageNote',
              valueKind: 'text',
            },
            mediaSignature: 'media-signature-10620006',
            readableMediaKeys: [
              'media-key-10620051',
            ],
          },
          expected: 1516660246,
        },
      ]

      test.each(cases)('path: $params.fieldSchemaEntry.path', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.generateDrawnNumber(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should draw a different number for each media signature', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              valueKind: 'select',
            },
            mediaSignature: 'media-signature-10620006',
            readableMediaKeys: [
              'media-key-10620051',
            ],
          },
          expected: 46362532,
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              valueKind: 'select',
            },
            mediaSignature: 'media-signature-10620007',
            readableMediaKeys: [
              'media-key-10620051',
            ],
          },
          expected: 1115991863,
        },
      ]

      test.each(cases)('mediaSignature: $params.mediaSignature', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.generateDrawnNumber(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#generateFieldValue()', () => {
    describe('should answer the value a kind this service reads is bounded to', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontageNote',
              valueKind: 'text',
            },
            drawnNumber: 12,
          },
          expected: 'stub-value-12',
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.balconyCount',
              valueKind: 'number',
            },
            drawnNumber: 12,
          },
          expected: 13,
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              valueKind: 'select',
              options: [
                'brick',
                'concrete',
              ],
            },
            drawnNumber: 3,
          },
          expected: 'concrete',
        },
      ]

      test.each(cases)('valueKind: $params.fieldSchemaEntry.valueKind', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.generateFieldValue(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer nothing for a kind no photograph is read for', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.handoverDate',
              valueKind: 'date',
            },
            drawnNumber: 3,
          },
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.blueprintFile',
              valueKind: 'file',
            },
            drawnNumber: 4,
          },
        },
      ]

      test.each(cases)('valueKind: $params.fieldSchemaEntry.valueKind', ({
        params,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.generateFieldValue(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#buildValueKindEntries()', () => {
    const cases = [
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.frontageNote',
            valueKind: 'text',
          },
          drawnNumber: 12,
        },
        expected: [
          {
            valueKind: 'text',
            generateValue: expect.any(Function),
          },
          {
            valueKind: 'number',
            generateValue: expect.any(Function),
          },
          {
            valueKind: 'select',
            generateValue: expect.any(Function),
          },
        ],
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.balconyCount',
            valueKind: 'number',
          },
          drawnNumber: 13,
        },
        expected: [
          {
            valueKind: 'text',
            generateValue: expect.any(Function),
          },
          {
            valueKind: 'number',
            generateValue: expect.any(Function),
          },
          {
            valueKind: 'select',
            generateValue: expect.any(Function),
          },
        ],
      },
    ]

    test.each(cases)('valueKind: $params.fieldSchemaEntry.valueKind', ({
      params,
      expected,
    }) => {
      const supplier = StubAssetFieldReadingSupplier.create()

      const actual = supplier.buildValueKindEntries(params)

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#generateTextValue()', () => {
    describe('should hold the value inside the maximum length stated', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontageNote',
              valueKind: 'text',
              maxLength: 64,
            },
            drawnNumber: 12,
          },
          expected: 'stub-value-12',
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontageNote',
              valueKind: 'text',
              maxLength: 14,
            },
            drawnNumber: 4175472933,
          },
          expected: 'stub-value-417',
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontageNote',
              valueKind: 'text',
              maxLength: 11,
            },
            drawnNumber: 4175472933,
          },
          expected: 'stub-value-',
        },
      ]

      test.each(cases)('maxLength: $params.fieldSchemaEntry.maxLength', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.generateTextValue(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer the whole value where no maximum length bounds it', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontageNote',
              valueKind: 'text',
            },
            drawnNumber: 4175472933,
          },
          expected: 'stub-value-4175472933',
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontageNote',
              valueKind: 'text',
              maxLength: 'sixty-four',
            },
            drawnNumber: 7,
          },
          expected: 'stub-value-7',
        },
      ]

      test.each(cases)('drawnNumber: $params.drawnNumber', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.generateTextValue(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#generateNumberValue()', () => {
    const cases = [
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.balconyCount',
            valueKind: 'number',
            minimum: 0,
            maximum: 4,
          },
          drawnNumber: 12,
        },
        expected: 2,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.floorArea',
            valueKind: 'number',
          },
          drawnNumber: 12,
        },
        expected: 13,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.frontageMeters',
            valueKind: 'number',
            minimum: 10,
          },
          drawnNumber: 7,
        },
        expected: 17,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.storeyCount',
            valueKind: 'number',
            maximum: 5,
          },
          drawnNumber: 7,
        },
        expected: 3,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.basementCount',
            valueKind: 'number',
            maximum: 0,
          },
          drawnNumber: 7,
        },
        expected: 0,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.ceilingHeight',
            valueKind: 'number',
            minimum: 2.3,
            maximum: 7.8,
          },
          drawnNumber: 9,
        },
        expected: 7,
      },
    ]

    test.each(cases)('path: $params.fieldSchemaEntry.path', ({
      params,
      expected,
    }) => {
      const supplier = StubAssetFieldReadingSupplier.create()

      const actual = supplier.generateNumberValue(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#extractMinimumNumber()', () => {
    const cases = [
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.frontageMeters',
            minimum: 5,
          },
        },
        expected: 5,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.ceilingHeight',
            minimum: 2.3,
          },
        },
        expected: 3,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.floorArea',
          },
        },
        expected: 1,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.groundOffset',
            maximum: -4,
          },
        },
        expected: -4,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.storeyCount',
            minimum: 'two',
          },
        },
        expected: 1,
      },
    ]

    test.each(cases)('path: $params.fieldSchemaEntry.path', ({
      params,
      expected,
    }) => {
      const supplier = StubAssetFieldReadingSupplier.create()

      const actual = supplier.extractMinimumNumber(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#extractDefaultMinimumNumber()', () => {
    const cases = [
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.floorArea',
          },
        },
        expected: 1,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.basementCount',
            maximum: 0,
          },
        },
        expected: 0,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.storeyCount',
            maximum: 9,
          },
        },
        expected: 1,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.groundOffset',
            maximum: -2.5,
          },
        },
        expected: -3,
      },
    ]

    test.each(cases)('path: $params.fieldSchemaEntry.path', ({
      params,
      expected,
    }) => {
      const supplier = StubAssetFieldReadingSupplier.create()

      const actual = supplier.extractDefaultMinimumNumber(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#extractMaximumNumber()', () => {
    const cases = [
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.floorArea',
          },
          minimumNumber: 1,
        },
        expected: 100,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.balconyCount',
            maximum: 40,
          },
          minimumNumber: 1,
        },
        expected: 40,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.storeyCount',
            maximum: 2,
          },
          minimumNumber: 5,
        },
        expected: 5,
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.ceilingHeight',
            maximum: 7.9,
          },
          minimumNumber: 1,
        },
        expected: 7,
      },
    ]

    test.each(cases)('path: $params.fieldSchemaEntry.path', ({
      params,
      expected,
    }) => {
      const supplier = StubAssetFieldReadingSupplier.create()

      const actual = supplier.extractMaximumNumber(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#generateSelectValue()', () => {
    describe('should answer one of the options the caller sent', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              options: [
                'brick',
                'concrete',
                'timber',
              ],
            },
            drawnNumber: 7,
          },
          expected: 'concrete',
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.roofMaterial',
              options: [
                'tile',
                'metal',
                'thatch',
              ],
            },
            drawnNumber: 3,
          },
          expected: 'tile',
        },
      ]

      test.each(cases)('path: $params.fieldSchemaEntry.path', ({
        params,
        expected,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.generateSelectValue(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer nothing where the caller offered no option', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.frontDirection',
              options: [],
            },
            drawnNumber: 3,
          },
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.gateKind',
            },
            drawnNumber: 3,
          },
        },
      ]

      test.each(cases)('path: $params.fieldSchemaEntry.path', ({
        params,
      }) => {
        const supplier = StubAssetFieldReadingSupplier.create()

        const actual = supplier.generateSelectValue(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#extractEvidenceKindName()', () => {
    const cases = [
      {
        params: {
          drawnNumber: 0,
        },
        expected: 'visible-text',
      },
      {
        params: {
          drawnNumber: 4,
        },
        expected: 'visual-estimate',
      },
      {
        params: {
          drawnNumber: 5,
        },
        expected: 'category-prior',
      },
      {
        params: {
          drawnNumber: 4175472933,
        },
        expected: 'visible-text',
      },
    ]

    test.each(cases)('drawnNumber: $params.drawnNumber', ({
      params,
      expected,
    }) => {
      const supplier = StubAssetFieldReadingSupplier.create()

      const actual = supplier.extractEvidenceKindName(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#generateReason()', () => {
    const cases = [
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.wallMaterial',
          },
        },
        expected: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
      },
      {
        params: {
          fieldSchemaEntry: {
            path: 'attributes.balconyCount',
          },
        },
        expected: '[stub] demonstration value for attributes.balconyCount, supplied without a model call.',
      },
    ]

    test.each(cases)('path: $params.fieldSchemaEntry.path', ({
      params,
      expected,
    }) => {
      const supplier = StubAssetFieldReadingSupplier.create()

      const actual = supplier.generateReason(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('StubAssetFieldReadingSupplier', () => {
  describe('#extractSourceMediaKeys()', () => {
    const cases = [
      {
        params: {
          readableMediaKeys: [
            'media-key-10620091',
            'media-key-10620092',
          ],
          drawnNumber: 5,
        },
        expected: [
          'media-key-10620092',
        ],
      },
      {
        params: {
          readableMediaKeys: [
            'media-key-10620091',
            'media-key-10620092',
          ],
          drawnNumber: 4,
        },
        expected: [
          'media-key-10620091',
        ],
      },
      {
        params: {
          readableMediaKeys: [
            'media-key-10620093',
          ],
          drawnNumber: 7,
        },
        expected: [
          'media-key-10620093',
        ],
      },
    ]

    test.each(cases)('drawnNumber: $params.drawnNumber', ({
      params,
      expected,
    }) => {
      const supplier = StubAssetFieldReadingSupplier.create()

      const actual = supplier.extractSourceMediaKeys(params)

      expect(actual)
        .toEqual(expected)
    })
  })
})
