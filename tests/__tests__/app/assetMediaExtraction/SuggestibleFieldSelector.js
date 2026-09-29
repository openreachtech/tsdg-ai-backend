import SuggestibleFieldSelector from '../../../../app/assetMediaExtraction/SuggestibleFieldSelector.js'

/*
 * Step 1 of specs/1.0.0 §20, and the first acceptance criterion behind it: "an asset type with no
 * suggestible field returns a successful run with no fields and no model call". What this class
 * guarantees of that criterion is the empty answer; that nothing is then asked of a model is the
 * caller's, and is checked where the caller is.
 *
 * The kinds are a finite set of three, so every one of them is enumerated rather than sampled, and
 * the unsuggestible side carries the kinds a caller's own schema really does declare - a date, a
 * file, a boolean - rather than invented words.
 */

describe('SuggestibleFieldSelector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#suggestibleValueKindHash', () => {
        const cases = [
          {
            params: {
              suggestibleValueKindHash: {
                text: true,
                number: true,
                select: true,
              },
            },
            expected: {
              text: true,
              number: true,
              select: true,
            },
          },
          {
            params: {
              suggestibleValueKindHash: {
                alpha: true,
              },
            },
            expected: {
              alpha: true,
            },
          },
        ]

        test.each(cases)('kinds: $params.suggestibleValueKindHash', ({
          params,
          expected,
        }) => {
          const selector = new SuggestibleFieldSelector(params)

          expect(selector)
            .toHaveProperty('suggestibleValueKindHash', expected)
        })
      })
    })
  })
})

describe('SuggestibleFieldSelector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            suggestibleValueKindHash: {
              text: true,
            },
          },
        },
        {
          params: {
            suggestibleValueKindHash: {
              number: true,
            },
          },
        },
      ]

      test.each(cases)('kinds: $params.suggestibleValueKindHash', ({
        params,
      }) => {
        const actual = SuggestibleFieldSelector.create(params)

        expect(actual)
          .toBeInstanceOf(SuggestibleFieldSelector)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            suggestibleValueKindHash: {
              text: true,
            },
          },
          expected: {
            suggestibleValueKindHash: {
              text: true,
            },
          },
        },
        {
          params: {
            suggestibleValueKindHash: {
              number: true,
            },
          },
          expected: {
            suggestibleValueKindHash: {
              number: true,
            },
          },
        },
      ]

      test.each(cases)('kinds: $params.suggestibleValueKindHash', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(SuggestibleFieldSelector)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default suggestibleValueKindHash', () => {
      test('with no arguments', () => {
        const expected = {
          suggestibleValueKindHash: {
            text: true,
            number: true,
            select: true,
          },
        }

        const SpyClass = constructorSpy.spyOn(SuggestibleFieldSelector)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('SuggestibleFieldSelector', () => {
  describe('#isSuggestibleValueKind()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          params: {
            valueKind: 'text',
          },
        },
        {
          params: {
            valueKind: 'number',
          },
        },
        {
          params: {
            valueKind: 'select',
          },
        },
      ]

      test.each(cases)('valueKind: $params.valueKind', ({
        params,
      }) => {
        const selector = SuggestibleFieldSelector.create()

        const actual = selector.isSuggestibleValueKind(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          params: {
            valueKind: 'date',
          },
        },
        {
          params: {
            valueKind: 'file',
          },
        },
        {
          params: {
            valueKind: 'boolean',
          },
        },
        {
          // a member of Object.prototype must answer no differently from a kind nobody declared
          params: {
            valueKind: 'constructor',
          },
        },
        {
          params: {
            valueKind: 'toString',
          },
        },
        {
          params: {
            valueKind: '',
          },
        },
        {
          params: {
            valueKind: null,
          },
        },
      ]

      test.each(cases)('valueKind: $params.valueKind', ({
        params,
      }) => {
        const selector = SuggestibleFieldSelector.create()

        const actual = selector.isSuggestibleValueKind(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('SuggestibleFieldSelector', () => {
  describe('#isSuggestibleFieldSchemaEntry()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
          },
        },
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.floorArea',
              label: 'Floor area',
              valueKind: 'number',
              isRequired: false,
              unit: 'm2',
            },
          },
        },
      ]

      test.each(cases)('path: $params.fieldSchemaEntry.path', ({
        params,
      }) => {
        const selector = SuggestibleFieldSelector.create()

        const actual = selector.isSuggestibleFieldSchemaEntry(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          params: {
            fieldSchemaEntry: {
              path: 'attributes.handedOverOn',
              label: 'Handed over on',
              valueKind: 'date',
              isRequired: true,
            },
          },
        },
        {
          // a kept kind is not enough: an entry bounding no field cannot be settled against
          params: {
            fieldSchemaEntry: {
              path: null,
              label: 'Nameless',
              valueKind: 'text',
              isRequired: true,
            },
          },
        },
        {
          params: {
            fieldSchemaEntry: {
              path: '',
              label: 'Empty path',
              valueKind: 'select',
              isRequired: false,
              options: [
                'alpha',
                'beta',
              ],
            },
          },
        },
        {
          params: {
            fieldSchemaEntry: null,
          },
        },
      ]

      test.each(cases)('path: $params.fieldSchemaEntry.path', ({
        params,
      }) => {
        const selector = SuggestibleFieldSelector.create()

        const actual = selector.isSuggestibleFieldSchemaEntry(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('SuggestibleFieldSelector', () => {
  describe('#extractSuggestibleFieldSchema()', () => {
    describe('should keep the entries a photograph could answer', () => {
      const cases = [
        {
          params: {
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                label: 'Wall material',
                valueKind: 'text',
                isRequired: true,
              },
              {
                path: 'attributes.handedOverOn',
                label: 'Handed over on',
                valueKind: 'date',
                isRequired: true,
              },
              {
                path: 'attributes.floorArea',
                label: 'Floor area',
                valueKind: 'number',
                isRequired: false,
                unit: 'm2',
              },
            ],
          },
          expected: [
            {
              path: 'attributes.wallMaterial',
              label: 'Wall material',
              valueKind: 'text',
              isRequired: true,
            },
            {
              path: 'attributes.floorArea',
              label: 'Floor area',
              valueKind: 'number',
              isRequired: false,
              unit: 'm2',
            },
          ],
        },
        {
          params: {
            fieldSchema: [
              {
                path: 'attributes.legalStatusSlug',
                label: 'Legal status',
                valueKind: 'select',
                isRequired: true,
                options: [
                  'full-title',
                  'pending-title',
                ],
              },
            ],
          },
          expected: [
            {
              path: 'attributes.legalStatusSlug',
              label: 'Legal status',
              valueKind: 'select',
              isRequired: true,
              options: [
                'full-title',
                'pending-title',
              ],
            },
          ],
        },
      ]

      test.each(cases)('first path: $params.fieldSchema.0.path', ({
        params,
        expected,
      }) => {
        const selector = SuggestibleFieldSelector.create()

        const actual = selector.extractSuggestibleFieldSchema(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SuggestibleFieldSelector', () => {
  describe('#extractSuggestibleFieldSchema()', () => {
    /*
     * The first acceptance criterion. An asset type whose every field is a date, a file or an
     * attachment leaves nothing for a model to be asked about - and so does a request that sent no
     * schema at all, or one whose schema is not a schema.
     */
    describe('should be empty', () => {
      const cases = [
        {
          label: 'a schema of a date and a file',
          params: {
            fieldSchema: [
              {
                path: 'attributes.handedOverOn',
                label: 'Handed over on',
                valueKind: 'date',
                isRequired: true,
              },
              {
                path: 'attributes.ownershipCertificate',
                label: 'Ownership certificate',
                valueKind: 'file',
                isRequired: true,
              },
            ],
          },
        },
        {
          label: 'a schema declaring no field',
          params: {
            fieldSchema: [],
          },
        },
        {
          label: 'no schema at all',
          params: {
            fieldSchema: null,
          },
        },
        {
          label: 'a schema that is not an array',
          params: {
            fieldSchema: 'omega',
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const selector = SuggestibleFieldSelector.create()

        const actual = selector.extractSuggestibleFieldSchema(params)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('SuggestibleFieldSelector', () => {
  describe('#extractRequiredFieldPaths()', () => {
    describe('should keep the paths the caller marked required', () => {
      const cases = [
        {
          params: {
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                valueKind: 'text',
                isRequired: true,
              },
              {
                path: 'attributes.floorArea',
                valueKind: 'number',
                isRequired: false,
              },
              {
                path: 'attributes.legalStatusSlug',
                valueKind: 'select',
                isRequired: true,
              },
            ],
          },
          expected: [
            'attributes.wallMaterial',
            'attributes.legalStatusSlug',
          ],
        },
        {
          // a required flag written as text is not a required flag
          params: {
            fieldSchema: [
              {
                path: 'attributes.roofMaterial',
                valueKind: 'text',
                isRequired: 'true',
              },
              {
                path: 'attributes.roadWidth',
                valueKind: 'number',
                isRequired: 1,
              },
              {
                path: 'attributes.facadeWidth',
                valueKind: 'number',
                isRequired: true,
              },
            ],
          },
          expected: [
            'attributes.facadeWidth',
          ],
        },
      ]

      test.each(cases)('first path: $params.fieldSchema.0.path', ({
        params,
        expected,
      }) => {
        const selector = SuggestibleFieldSelector.create()

        const actual = selector.extractRequiredFieldPaths(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SuggestibleFieldSelector', () => {
  describe('#extractRequiredFieldPaths()', () => {
    describe('should be empty', () => {
      const cases = [
        {
          label: 'a schema whose one field is optional',
          params: {
            fieldSchema: [
              {
                path: 'attributes.balconyDirectionSlug',
                valueKind: 'select',
                isRequired: false,
              },
            ],
          },
        },
        {
          label: 'a schema declaring no field',
          params: {
            fieldSchema: [],
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const selector = SuggestibleFieldSelector.create()

        const actual = selector.extractRequiredFieldPaths(params)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('SuggestibleFieldSelector', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          SelectorCtor: SuggestibleFieldSelector,
        },
      },
      {
        params: {
          SelectorCtor: class ExtendedSuggestibleFieldSelector extends SuggestibleFieldSelector {},
        },
      },
    ]

    test.each(cases)('class: $params.SelectorCtor.name', ({
      params,
    }) => {
      const selector = params.SelectorCtor.create()

      const actual = selector.Ctor

      expect(actual)
        .toBe(params.SelectorCtor) // same reference
    })
  })
})
