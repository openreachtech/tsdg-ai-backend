import AssetFieldReadingInspector from '../../../../app/assetMediaExtraction/AssetFieldReadingInspector.js'

/*
 * Step 4 of specs/1.0.0 §20, and five of its seventeen acceptance criteria - the section names each
 * drop separately, so each has a describe of its own here:
 *
 *   - "no field path outside the schema that was sent is ever returned"
 *   - "a select value that is not one of the options sent is dropped, never corrected to a nearby
 *     one"
 *   - "a number that does not match the expected form, or falls outside the range sent, is dropped"
 *   - "a value longer than the stated maximum is dropped rather than truncated"
 *   - "the source photos returned for a field are always a subset of the media that was sent"
 *
 * The two emphatic ones are checked for what they forbid rather than only for what they drop: the
 * select case sends a value one edit away from a real option and asserts nothing of it survives,
 * and the length case sends a value over the maximum and asserts the item is gone rather than
 * present and shorter.
 *
 * The reason codes are the words `sequelize/seeders/development/*-ai_run_steps.cjs` already
 * carries, so a trace written by this class and a trace written by the fixtures read as one
 * vocabulary.
 */

describe('AssetFieldReadingInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#evidenceKindNames', () => {
        const cases = [
          {
            params: {
              evidenceKindNames: [
                'visible-text',
                'visual-estimate',
                'category-prior',
              ],
            },
            expected: [
              'visible-text',
              'visual-estimate',
              'category-prior',
            ],
          },
          {
            params: {
              evidenceKindNames: [
                'alpha',
              ],
            },
            expected: [
              'alpha',
            ],
          },
        ]

        test.each(cases)('first kind: $params.evidenceKindNames.0', ({
          params,
          expected,
        }) => {
          const inspector = new AssetFieldReadingInspector(params)

          expect(inspector)
            .toHaveProperty('evidenceKindNames', expected)
        })
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            evidenceKindNames: [
              'alpha',
            ],
          },
        },
        {
          params: {
            evidenceKindNames: [
              'beta',
            ],
          },
        },
      ]

      test.each(cases)('first kind: $params.evidenceKindNames.0', ({
        params,
      }) => {
        const actual = AssetFieldReadingInspector.create(params)

        expect(actual)
          .toBeInstanceOf(AssetFieldReadingInspector)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            evidenceKindNames: [
              'alpha',
            ],
          },
          expected: {
            evidenceKindNames: [
              'alpha',
            ],
          },
        },
        {
          params: {
            evidenceKindNames: [
              'beta',
            ],
          },
          expected: {
            evidenceKindNames: [
              'beta',
            ],
          },
        },
      ]

      test.each(cases)('first kind: $params.evidenceKindNames.0', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AssetFieldReadingInspector)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default evidenceKindNames', () => {
      test('with no arguments', () => {
        const expected = {
          evidenceKindNames: [
            'visible-text',
            'visual-estimate',
            'category-prior',
          ],
        }

        const SpyClass = constructorSpy.spyOn(AssetFieldReadingInspector)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#extractRejectionReasonCode()', () => {
    /*
     * "No field path outside the schema that was sent is ever returned." A path the caller never
     * sent, and a reading item carrying no path at all, are one answer: neither names a field of
     * this request.
     */
    describe('should drop a path outside the schema', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.ownerNote',
              value: 'omega',
              evidenceKindName: 'visible-text',
              reason: 'Written on the wall.',
              sourceMediaKeys: [
                'media-key-10610001',
              ],
            },
            fieldSchemaEntry: null,
            sentMediaKeys: [
              'media-key-10610001',
            ],
          },
          expected: 'field-path-outside-schema',
        },
        {
          params: {
            fieldReading: {
              path: null,
              value: 'alpha',
              evidenceKindName: 'visible-text',
              reason: 'Read from the photograph.',
              sourceMediaKeys: [
                'media-key-10610002',
              ],
            },
            fieldSchemaEntry: null,
            sentMediaKeys: [
              'media-key-10610002',
            ],
          },
          expected: 'field-path-outside-schema',
        },
      ]

      test.each(cases)('path: $params.fieldReading.path', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.extractRejectionReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#extractRejectionReasonCode()', () => {
    /*
     * "A select value that is not one of the options sent is dropped, never corrected to a nearby
     * one." The first case sends `full-titel`, one transposition away from a real option, which is
     * exactly the value a class willing to correct would correct.
     */
    describe('should drop a select value that was not offered', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.legalStatusSlug',
              value: 'full-titel',
              evidenceKindName: 'visible-text',
              reason: 'The certificate is visible in the photograph.',
              sourceMediaKeys: [
                'media-key-10610003',
              ],
            },
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
            sentMediaKeys: [
              'media-key-10610003',
            ],
          },
          expected: 'select-option-not-offered',
        },
        {
          // a select whose caller sent no options bounds the field to nothing
          params: {
            fieldReading: {
              path: 'attributes.balconyDirectionSlug',
              value: 'south',
              evidenceKindName: 'visual-estimate',
              reason: 'The balcony faces the sun in the photograph.',
              sourceMediaKeys: [
                'media-key-10610004',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.balconyDirectionSlug',
              label: 'Balcony direction',
              valueKind: 'select',
              isRequired: false,
            },
            sentMediaKeys: [
              'media-key-10610004',
            ],
          },
          expected: 'select-option-not-offered',
        },
      ]

      test.each(cases)('value: $params.fieldReading.value', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.extractRejectionReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#extractRejectionReasonCode()', () => {
    /*
     * "A number that does not match the expected form ... is dropped." The values are the shapes a
     * model really answers a measurement in - a unit tacked on, a thousands separator, a range and
     * a hedge - rather than invented rubbish.
     */
    describe('should drop a number written in no number form', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.floorArea',
              value: '120 m2',
              evidenceKindName: 'visible-text',
              reason: 'Printed on the floor plan.',
              sourceMediaKeys: [
                'media-key-10610005',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.floorArea',
              label: 'Floor area',
              valueKind: 'number',
              isRequired: true,
              unit: 'm2',
            },
            sentMediaKeys: [
              'media-key-10610005',
            ],
          },
          expected: 'number-failed-expected-form',
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.floorArea',
              value: '1,200',
              evidenceKindName: 'visible-text',
              reason: 'Printed on the floor plan.',
              sourceMediaKeys: [
                'media-key-10610006',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.floorArea',
              label: 'Floor area',
              valueKind: 'number',
              isRequired: true,
              unit: 'm2',
            },
            sentMediaKeys: [
              'media-key-10610006',
            ],
          },
          expected: 'number-failed-expected-form',
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.roadWidth',
              value: '80-90',
              evidenceKindName: 'visual-estimate',
              reason: 'Judged against the car beside it.',
              sourceMediaKeys: [
                'media-key-10610007',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.roadWidth',
              label: 'Road width',
              valueKind: 'number',
              isRequired: false,
              unit: 'm',
            },
            sentMediaKeys: [
              'media-key-10610007',
            ],
          },
          expected: 'number-failed-expected-form',
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.roadWidth',
              value: 'about 90',
              evidenceKindName: 'visual-estimate',
              reason: 'Judged against the car beside it.',
              sourceMediaKeys: [
                'media-key-10610008',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.roadWidth',
              label: 'Road width',
              valueKind: 'number',
              isRequired: false,
              unit: 'm',
            },
            sentMediaKeys: [
              'media-key-10610008',
            ],
          },
          expected: 'number-failed-expected-form',
        },
      ]

      test.each(cases)('value: $params.fieldReading.value', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.extractRejectionReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#extractRejectionReasonCode()', () => {
    /*
     * "... or falls outside the range sent, is dropped." Both bounds are exercised, one from each
     * side, and the range is read from `minimum` / `maximum` on the schema entry - two names the
     * contract does not declare, which is reported as a gap rather than hidden here.
     */
    describe('should drop a number outside the range sent', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.buildYear',
              value: '1742',
              evidenceKindName: 'visible-text',
              reason: 'Carved above the door.',
              sourceMediaKeys: [
                'media-key-10610009',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.buildYear',
              label: 'Build year',
              valueKind: 'number',
              isRequired: false,
              minimum: 1900,
              maximum: 2026,
            },
            sentMediaKeys: [
              'media-key-10610009',
            ],
          },
          expected: 'number-out-of-range',
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.buildYear',
              value: '2099',
              evidenceKindName: 'visible-text',
              reason: 'Carved above the door.',
              sourceMediaKeys: [
                'media-key-10610010',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.buildYear',
              label: 'Build year',
              valueKind: 'number',
              isRequired: false,
              minimum: 1900,
              maximum: 2026,
            },
            sentMediaKeys: [
              'media-key-10610010',
            ],
          },
          expected: 'number-out-of-range',
        },
      ]

      test.each(cases)('value: $params.fieldReading.value', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.extractRejectionReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#extractRejectionReasonCode()', () => {
    /*
     * "A value longer than the stated maximum is dropped rather than truncated." One character over
     * is the case that separates `<` from `<=`, and the other is a value far over.
     */
    describe('should drop a value over the stated maximum', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.wallMaterial',
              value: 'abcdefghijk', // eleven characters against a maximum of ten
              evidenceKindName: 'visible-text',
              reason: 'Written on the builder board.',
              sourceMediaKeys: [
                'media-key-10610011',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
              maxLength: 10,
            },
            sentMediaKeys: [
              'media-key-10610011',
            ],
          },
          expected: 'value-over-max-length',
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.summaryText',
              value: 'A long sentence about the property that nobody asked for',
              evidenceKindName: 'visual-estimate',
              reason: 'Described from the photographs.',
              sourceMediaKeys: [
                'media-key-10610012',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.summaryText',
              label: 'Summary',
              valueKind: 'text',
              isRequired: false,
              maxLength: 20,
            },
            sentMediaKeys: [
              'media-key-10610012',
            ],
          },
          expected: 'value-over-max-length',
        },
      ]

      test.each(cases)('value: $params.fieldReading.value', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.extractRejectionReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#extractRejectionReasonCode()', () => {
    /*
     * "The source photos returned for a field are always a subset of the media that was sent." The
     * first case cites one photograph that was sent and one that was not, which is the case a class
     * willing to drop the stray key alone would let through.
     */
    describe('should drop a reading citing a photograph nobody sent', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.wallMaterial',
              value: 'brick',
              evidenceKindName: 'visible-text',
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [
                'media-key-10610013',
                'media-key-10619001-never-sent',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            sentMediaKeys: [
              'media-key-10610013',
            ],
          },
          expected: 'source-medium-not-sent',
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.wallMaterial',
              value: 'concrete',
              evidenceKindName: 'visible-text',
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [],
            },
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            sentMediaKeys: [
              'media-key-10610014',
            ],
          },
          expected: 'source-medium-not-sent',
        },
      ]

      test.each(cases)('value: $params.fieldReading.value', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.extractRejectionReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#extractRejectionReasonCode()', () => {
    /*
     * The tool schema's own `required` list, enforced in code: a vendor answering a tool call is
     * not held to the schema it was offered.
     */
    describe('should drop a reading the tool schema would not have allowed', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.wallMaterial',
              value: 'brick',
              evidenceKindName: 'gut-feeling',
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [
                'media-key-10610015',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            sentMediaKeys: [
              'media-key-10610015',
            ],
          },
          expected: 'evidence-kind-outside-schema',
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.wallMaterial',
              value: 'tiled',
              evidenceKindName: 'visible-text',
              reason: '   ',
              sourceMediaKeys: [
                'media-key-10610016',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            sentMediaKeys: [
              'media-key-10610016',
            ],
          },
          expected: 'reason-absent',
        },
      ]

      test.each(cases)('value: $params.fieldReading.value', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.extractRejectionReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#extractRejectionReasonCode()', () => {
    describe('should be null', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.wallMaterial',
              value: 'brick',
              evidenceKindName: 'visible-text',
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [
                'media-key-10610017',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
              maxLength: 10,
            },
            sentMediaKeys: [
              'media-key-10610017',
              'media-key-10610018',
            ],
          },
        },
        {
          // exactly at the maximum, which separates `<` from `<=`
          params: {
            fieldReading: {
              path: 'attributes.roofMaterial',
              value: 'abcdefghij',
              evidenceKindName: 'visual-estimate',
              reason: 'Judged from the aerial photograph.',
              sourceMediaKeys: [
                'media-key-10610019',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.roofMaterial',
              label: 'Roof material',
              valueKind: 'text',
              isRequired: false,
              maxLength: 10,
            },
            sentMediaKeys: [
              'media-key-10610019',
            ],
          },
        },
        {
          // exactly at both bounds of the range
          params: {
            fieldReading: {
              path: 'attributes.buildYear',
              value: '1900',
              evidenceKindName: 'visible-text',
              reason: 'Carved above the door.',
              sourceMediaKeys: [
                'media-key-10610020',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.buildYear',
              label: 'Build year',
              valueKind: 'number',
              isRequired: false,
              minimum: 1900,
              maximum: 2026,
            },
            sentMediaKeys: [
              'media-key-10610020',
            ],
          },
        },
        {
          // a number field whose caller stated no range at all
          params: {
            fieldReading: {
              path: 'attributes.floorArea',
              value: 120.5,
              evidenceKindName: 'visible-text',
              reason: 'Printed on the floor plan.',
              sourceMediaKeys: [
                'media-key-10610021',
              ],
            },
            fieldSchemaEntry: {
              path: 'attributes.floorArea',
              label: 'Floor area',
              valueKind: 'number',
              isRequired: true,
              unit: 'm2',
            },
            sentMediaKeys: [
              'media-key-10610021',
            ],
          },
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.legalStatusSlug',
              value: 'pending-title',
              evidenceKindName: 'category-prior',
              reason: 'Usual for a house of this kind in this province.',
              sourceMediaKeys: [
                'media-key-10610022',
              ],
            },
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
            sentMediaKeys: [
              'media-key-10610022',
            ],
          },
        },
      ]

      test.each(cases)('value: $params.fieldReading.value', ({
        params,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.extractRejectionReasonCode(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#generateComparableNumber()', () => {
    describe('with valid values', () => {
      const cases = [
        {
          params: {
            value: 120,
          },
          expected: 120,
        },
        {
          params: {
            value: '1900',
          },
          expected: 1900,
        },
        {
          params: {
            value: '0',
          },
          expected: 0,
        },
        {
          params: {
            value: '-12.5',
          },
          expected: -12.5,
        },
        {
          params: {
            value: '9007199254740991', // Number.MAX_SAFE_INTEGER
          },
          expected: 9007199254740991, // Number.MAX_SAFE_INTEGER
        },
      ]

      test.each(cases)('value: $params.value', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.generateComparableNumber(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('with invalid values', () => {
      const cases = [
        {
          params: {
            value: '007',
          },
        },
        {
          params: {
            value: '+3',
          },
        },
        {
          params: {
            value: '1e3',
          },
        },
        {
          params: {
            value: ' 12 ',
          },
        },
        {
          params: {
            value: '',
          },
        },
        {
          params: {
            value: Number.POSITIVE_INFINITY,
          },
        },
        {
          params: {
            value: Number.NaN,
          },
        },
        {
          params: {
            value: null,
          },
        },
        {
          params: {
            value: true,
          },
        },
      ]

      test.each(cases)('value: $params.value', ({
        params,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.generateComparableNumber(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#inspectReading()', () => {
    /*
     * The whole of step 4 over one reading: what survives, and what is written down about what did
     * not. The rejection carries the field path, the reason code and figures - and no value read
     * out of a medium, which is why the over-length case records the two lengths and not the text
     * that was too long.
     */
    describe('should keep what the schema allows and record what it dropped', () => {
      const cases = [
        {
          params: {
            fieldReadings: [
              {
                path: 'attributes.wallMaterial',
                value: 'brick',
                evidenceKindName: 'visible-text',
                reason: 'Visible on the front wall.',
                sourceMediaKeys: [
                  'media-key-10610031',
                ],
              },
              {
                path: 'attributes.ownerNote',
                value: 'Nothing the schema asked for',
                evidenceKindName: 'visible-text',
                reason: 'Written on a sign.',
                sourceMediaKeys: [
                  'media-key-10610031',
                ],
              },
              {
                path: 'attributes.summaryText',
                value: 'A description far longer than the caller allowed',
                evidenceKindName: 'visual-estimate',
                reason: 'Described from the photographs.',
                sourceMediaKeys: [
                  'media-key-10610031',
                ],
              },
            ],
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                label: 'Wall material',
                valueKind: 'text',
                isRequired: true,
              },
              {
                path: 'attributes.summaryText',
                label: 'Summary',
                valueKind: 'text',
                isRequired: false,
                maxLength: 12,
              },
            ],
            sentMediaKeys: [
              'media-key-10610031',
            ],
            readingIndex: 2,
          },
          expected: {
            allowedFieldReadings: [
              {
                path: 'attributes.wallMaterial',
                value: 'brick',
                evidenceKindName: 'visible-text',
                reason: 'Visible on the front wall.',
                sourceMediaKeys: [
                  'media-key-10610031',
                ],
              },
            ],
            rejections: [
              {
                fieldPath: 'attributes.ownerNote',
                reasonCode: 'field-path-outside-schema',
                figures: {
                  readingIndex: 2,
                },
              },
              {
                fieldPath: 'attributes.summaryText',
                reasonCode: 'value-over-max-length',
                figures: {
                  readingIndex: 2,
                  valueLength: 48,
                  maxLength: 12,
                },
              },
            ],
          },
        },
        {
          params: {
            fieldReadings: [
              {
                path: 'attributes.floorArea',
                value: '86.4',
                evidenceKindName: 'visible-text',
                reason: 'Printed on the floor plan.',
                sourceMediaKeys: [
                  'media-key-10610032',
                  'media-key-10610033',
                ],
              },
            ],
            fieldSchema: [
              {
                path: 'attributes.floorArea',
                label: 'Floor area',
                valueKind: 'number',
                isRequired: true,
                unit: 'm2',
              },
            ],
            sentMediaKeys: [
              'media-key-10610032',
              'media-key-10610033',
            ],
            readingIndex: 1,
          },
          expected: {
            allowedFieldReadings: [
              {
                path: 'attributes.floorArea',
                value: 86.4, // normalized out of the text a tool call carried it in
                evidenceKindName: 'visible-text',
                reason: 'Printed on the floor plan.',
                sourceMediaKeys: [
                  'media-key-10610032',
                  'media-key-10610033',
                ],
              },
            ],
            rejections: [],
          },
        },
      ]

      test.each(cases)('readingIndex: $params.readingIndex', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.inspectReading(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#buildAllowedFieldReading()', () => {
    /*
     * Nothing a model attached beside the five fields travels. A `suggestionConfidence` the model
     * volunteered is the one that matters: the ninth acceptance criterion says the score is never
     * read from anything the model returned, and this is the first of the two places that holds -
     * a value with nowhere to travel cannot be read later by accident.
     */
    describe('should carry the five fields a reading has, and nothing beside them', () => {
      const cases = [
        {
          params: {
            fieldReading: {
              path: 'attributes.wallMaterial',
              value: 'brick',
              evidenceKindName: 'visible-text',
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [
                'media-key-10610041',
              ],
              suggestionConfidence: 0.99,
              modelNote: 'I am very sure about this',
            },
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
          },
          expected: {
            path: 'attributes.wallMaterial',
            value: 'brick',
            evidenceKindName: 'visible-text',
            reason: 'Visible on the front wall.',
            sourceMediaKeys: [
              'media-key-10610041',
            ],
          },
        },
        {
          params: {
            fieldReading: {
              path: 'attributes.buildYear',
              value: '1998',
              evidenceKindName: 'category-prior',
              reason: 'Usual for a house of this kind.',
              sourceMediaKeys: [
                'media-key-10610042',
              ],
              suggestionConfidence: 1,
            },
            fieldSchemaEntry: {
              path: 'attributes.buildYear',
              label: 'Build year',
              valueKind: 'number',
              isRequired: false,
            },
          },
          expected: {
            path: 'attributes.buildYear',
            value: 1998,
            evidenceKindName: 'category-prior',
            reason: 'Usual for a house of this kind.',
            sourceMediaKeys: [
              'media-key-10610042',
            ],
          },
        },
      ]

      test.each(cases)('path: $params.fieldReading.path', ({
        params,
        expected,
      }) => {
        const inspector = AssetFieldReadingInspector.create()

        const actual = inspector.buildAllowedFieldReading(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetFieldReadingInspector', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          InspectorCtor: AssetFieldReadingInspector,
        },
      },
      {
        params: {
          InspectorCtor: class ExtendedAssetFieldReadingInspector extends AssetFieldReadingInspector {},
        },
      },
    ]

    test.each(cases)('class: $params.InspectorCtor.name', ({
      params,
    }) => {
      const inspector = params.InspectorCtor.create()

      const actual = inspector.Ctor

      expect(actual)
        .toBe(params.InspectorCtor) // same reference
    })
  })
})
