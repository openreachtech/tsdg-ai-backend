import FieldConsensusResolver from '../../../../app/assetMediaExtraction/FieldConsensusResolver.js'

/*
 * Step 5 of specs/1.0.0 §20, and its own acceptance criterion: "a value without an absolute
 * majority across the readings is not returned, and a required field without one is reported as
 * missing".
 *
 * Both halves are checked, and so is the half §20 states in prose rather than in a criterion -
 * "never a guess, never a zero". A missing field is a path and nothing else: there is no entry for
 * it among the settled fields, so a test asserting the settled set catches a class that answered a
 * field with an empty value rather than leaving it out.
 *
 * The denominator is the readings the run set out to take and not the readings that answered, so
 * `totalReadingCount` is passed in. The case where one reading of three failed is exactly what that
 * distinction is for: one surviving reading is not unanimous.
 */

describe('FieldConsensusResolver', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#absoluteMajorityMultiplier', () => {
        const cases = [
          {
            params: {
              absoluteMajorityMultiplier: 2,
            },
            expected: 2,
          },
          {
            params: {
              absoluteMajorityMultiplier: 3,
            },
            expected: 3,
          },
        ]

        test.each(cases)('multiplier: $params.absoluteMajorityMultiplier', ({
          params,
          expected,
        }) => {
          const resolver = new FieldConsensusResolver(params)

          expect(resolver)
            .toHaveProperty('absoluteMajorityMultiplier', expected)
        })
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            absoluteMajorityMultiplier: 2,
          },
        },
        {
          params: {
            absoluteMajorityMultiplier: 4,
          },
        },
      ]

      test.each(cases)('multiplier: $params.absoluteMajorityMultiplier', ({
        params,
      }) => {
        const actual = FieldConsensusResolver.create(params)

        expect(actual)
          .toBeInstanceOf(FieldConsensusResolver)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            absoluteMajorityMultiplier: 2,
          },
          expected: {
            absoluteMajorityMultiplier: 2,
          },
        },
        {
          params: {
            absoluteMajorityMultiplier: 5,
          },
          expected: {
            absoluteMajorityMultiplier: 5,
          },
        },
      ]

      test.each(cases)('multiplier: $params.absoluteMajorityMultiplier', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(FieldConsensusResolver)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default absoluteMajorityMultiplier', () => {
      test('with no arguments', () => {
        const expected = {
          absoluteMajorityMultiplier: 2,
        }

        const SpyClass = constructorSpy.spyOn(FieldConsensusResolver)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#isAbsoluteMajority()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          params: {
            agreedReadingCount: 2,
            totalReadingCount: 3,
          },
        },
        {
          params: {
            agreedReadingCount: 3,
            totalReadingCount: 3,
          },
        },
        {
          params: {
            agreedReadingCount: 4,
            totalReadingCount: 5,
          },
        },
        {
          params: {
            agreedReadingCount: 1,
            totalReadingCount: 1,
          },
        },
      ]

      test.each(cases)('agreed: $params.agreedReadingCount', ({
        params,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.isAbsoluteMajority(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          // exactly half is not more than half, which is what "absolute" means
          params: {
            agreedReadingCount: 2,
            totalReadingCount: 4,
          },
        },
        {
          params: {
            agreedReadingCount: 1,
            totalReadingCount: 3,
          },
        },
        {
          params: {
            agreedReadingCount: 0,
            totalReadingCount: 3,
          },
        },
        {
          params: {
            agreedReadingCount: 4,
            totalReadingCount: 0,
          },
        },
      ]

      test.each(cases)('agreed: $params.agreedReadingCount', ({
        params,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.isAbsoluteMajority(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#resolveFieldConsensus()', () => {
    /*
     * Two readings of three agree on the wall material and none of the three agrees on the floor
     * area, so one field is settled and the other is not returned at all. The floor area is
     * required, so it is reported missing - never as a zero, and never as an entry carrying an
     * empty value.
     */
    describe('should settle a field a majority agreed on', () => {
      const cases = [
        {
          params: {
            readings: [
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610101',
                  ],
                },
                {
                  path: 'attributes.floorArea',
                  value: 86.4,
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged against the door.',
                  sourceMediaKeys: [
                    'media-key-10610101',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged from the texture.',
                  sourceMediaKeys: [
                    'media-key-10610102',
                  ],
                },
                {
                  path: 'attributes.floorArea',
                  value: 91.2,
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged against the door.',
                  sourceMediaKeys: [
                    'media-key-10610102',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'concrete',
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged from the texture.',
                  sourceMediaKeys: [
                    'media-key-10610103',
                  ],
                },
                {
                  path: 'attributes.floorArea',
                  value: 78.9,
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged against the door.',
                  sourceMediaKeys: [
                    'media-key-10610103',
                  ],
                },
              ],
            ],
            requiredFieldPaths: [
              'attributes.wallMaterial',
              'attributes.floorArea',
            ],
            totalReadingCount: 3,
          },
          expected: {
            settledFields: [
              {
                path: 'attributes.wallMaterial',
                value: 'brick',
                evidenceKindName: 'visible-text', // the first agreeing reading's
                reason: 'Visible on the front wall.',
                sourceMediaKeys: [
                  'media-key-10610101',
                  'media-key-10610102',
                ],
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
            ],
            missingFieldPaths: [
              'attributes.floorArea',
            ],
            rejections: [
              {
                fieldPath: 'attributes.floorArea',
                reasonCode: 'no-absolute-majority',
                figures: {
                  agreedReadingCount: 1,
                  totalReadingCount: 3,
                },
              },
            ],
          },
        },
        {
          // one reading of three failed outright, so its answer is absent and still counted against
          params: {
            readings: [
              [
                {
                  path: 'attributes.legalStatusSlug',
                  value: 'full-title',
                  evidenceKindName: 'visible-text',
                  reason: 'The certificate is in the photograph.',
                  sourceMediaKeys: [
                    'media-key-10610104',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.legalStatusSlug',
                  value: 'full-title',
                  evidenceKindName: 'category-prior',
                  reason: 'Usual for a house of this kind.',
                  sourceMediaKeys: [
                    'media-key-10610104',
                    'media-key-10610105',
                  ],
                },
              ],
            ],
            requiredFieldPaths: [
              'attributes.legalStatusSlug',
            ],
            totalReadingCount: 3,
          },
          expected: {
            settledFields: [
              {
                path: 'attributes.legalStatusSlug',
                value: 'full-title',
                evidenceKindName: 'visible-text',
                reason: 'The certificate is in the photograph.',
                sourceMediaKeys: [
                  'media-key-10610104',
                  'media-key-10610105',
                ],
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
            ],
            missingFieldPaths: [],
            rejections: [],
          },
        },
      ]

      test.each(cases)('totalReadingCount: $params.totalReadingCount', ({
        params,
        expected,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.resolveFieldConsensus(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#resolveFieldConsensus()', () => {
    /*
     * "A required field without an absolute majority is reported as missing." Three shapes of that
     * one sentence: readings that split evenly, a single surviving reading out of three, and a
     * required field no reading mentioned at all - which had no majority in the plainest way there
     * is.
     */
    describe('should report a required field no majority settled as missing', () => {
      const cases = [
        {
          params: {
            readings: [
              [
                {
                  path: 'attributes.roofMaterial',
                  value: 'tiled',
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged from the aerial photograph.',
                  sourceMediaKeys: [
                    'media-key-10610111',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.roofMaterial',
                  value: 'metal',
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged from the aerial photograph.',
                  sourceMediaKeys: [
                    'media-key-10610111',
                  ],
                },
              ],
            ],
            requiredFieldPaths: [
              'attributes.roofMaterial',
            ],
            totalReadingCount: 2,
          },
          expected: [
            'attributes.roofMaterial',
          ],
        },
        {
          params: {
            readings: [
              [
                {
                  path: 'attributes.facadeWidth',
                  value: 4.2,
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged against the door.',
                  sourceMediaKeys: [
                    'media-key-10610112',
                  ],
                },
              ],
            ],
            requiredFieldPaths: [
              'attributes.facadeWidth',
            ],
            totalReadingCount: 3,
          },
          expected: [
            'attributes.facadeWidth',
          ],
        },
        {
          params: {
            readings: [
              [],
              [],
              [],
            ],
            requiredFieldPaths: [
              'attributes.alleyWidth',
            ],
            totalReadingCount: 3,
          },
          expected: [
            'attributes.alleyWidth',
          ],
        },
      ]

      test.each(cases)('first required: $params.requiredFieldPaths.0', ({
        params,
        expected,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const resolvedConsensus = resolver.resolveFieldConsensus(params)
        const actual = resolvedConsensus.missingFieldPaths

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#resolveFieldConsensus()', () => {
    /*
     * "Never a guess, never a zero." A field no majority settled has no entry among the settled
     * fields at all - not an entry carrying zero, an empty string or a null - which is what this
     * asserts by asserting the set is empty rather than by asserting one field's value.
     */
    describe('should settle nothing', () => {
      const cases = [
        {
          params: {
            readings: [
              [
                {
                  path: 'attributes.bedroomCount',
                  value: 2,
                  evidenceKindName: 'visible-text',
                  reason: 'Counted from the floor plan.',
                  sourceMediaKeys: [
                    'media-key-10610121',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.bedroomCount',
                  value: 3,
                  evidenceKindName: 'visible-text',
                  reason: 'Counted from the floor plan.',
                  sourceMediaKeys: [
                    'media-key-10610121',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.bedroomCount',
                  value: 4,
                  evidenceKindName: 'visible-text',
                  reason: 'Counted from the floor plan.',
                  sourceMediaKeys: [
                    'media-key-10610121',
                  ],
                },
              ],
            ],
            requiredFieldPaths: [
              'attributes.bedroomCount',
            ],
            totalReadingCount: 3,
          },
        },
        {
          params: {
            readings: [],
            requiredFieldPaths: [
              'attributes.wallMaterial',
            ],
            totalReadingCount: 3,
          },
        },
      ]

      test.each(cases)('first required: $params.requiredFieldPaths.0', ({
        params,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const resolvedConsensus = resolver.resolveFieldConsensus(params)
        const actual = resolvedConsensus.settledFields

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#buildOneReadingVotes()', () => {
    /*
     * One reading is one vote however many times it wrote the field down: a reading that answered
     * the same path twice must not out-vote the other two by repeating itself. Which of the two it
     * votes with is the first, and this is the member that decides it - the second answer is the
     * one thrown away, whatever it said.
     */
    describe('should keep the first answer a reading gave for a path', () => {
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
                  'media-key-10610131',
                ],
              },
              {
                path: 'attributes.wallMaterial',
                value: 'concrete',
                evidenceKindName: 'visual-estimate',
                reason: 'Said twice by one reading.',
                sourceMediaKeys: [
                  'media-key-10610131',
                ],
              },
            ],
          },
          expected: new Map([
            [
              'attributes.wallMaterial',
              {
                path: 'attributes.wallMaterial',
                value: 'brick',
                evidenceKindName: 'visible-text',
                reason: 'Visible on the front wall.',
                sourceMediaKeys: [
                  'media-key-10610131',
                ],
              },
            ],
          ]),
        },
        {
          params: {
            fieldReadings: [
              {
                path: 'attributes.roofMaterial',
                value: 'tiled',
                evidenceKindName: 'visual-estimate',
                reason: 'Another field entirely.',
                sourceMediaKeys: [
                  'media-key-10610132',
                ],
              },
              {
                path: 'attributes.floorArea',
                value: 86.4,
                evidenceKindName: 'visible-text',
                reason: 'Printed on the floor plan.',
                sourceMediaKeys: [
                  'media-key-10610133',
                ],
              },
            ],
          },
          expected: new Map([
            [
              'attributes.roofMaterial',
              {
                path: 'attributes.roofMaterial',
                value: 'tiled',
                evidenceKindName: 'visual-estimate',
                reason: 'Another field entirely.',
                sourceMediaKeys: [
                  'media-key-10610132',
                ],
              },
            ],
            [
              'attributes.floorArea',
              {
                path: 'attributes.floorArea',
                value: 86.4,
                evidenceKindName: 'visible-text',
                reason: 'Printed on the floor plan.',
                sourceMediaKeys: [
                  'media-key-10610133',
                ],
              },
            ],
          ]),
        },
      ]

      test.each(cases)('fieldReadings[0].path: $params.fieldReadings.0.path', ({
        params,
        expected,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.buildOneReadingVotes(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#buildReadingVotes()', () => {
    describe('should key every reading, in reading order', () => {
      const cases = [
        {
          params: {
            readings: [
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610141',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.roofMaterial',
                  value: 'tiled',
                  evidenceKindName: 'visual-estimate',
                  reason: 'Another field entirely.',
                  sourceMediaKeys: [
                    'media-key-10610142',
                  ],
                },
              ],
            ],
          },
          expected: [
            new Map([
              [
                'attributes.wallMaterial',
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610141',
                  ],
                },
              ],
            ]),
            new Map([
              [
                'attributes.roofMaterial',
                {
                  path: 'attributes.roofMaterial',
                  value: 'tiled',
                  evidenceKindName: 'visual-estimate',
                  reason: 'Another field entirely.',
                  sourceMediaKeys: [
                    'media-key-10610142',
                  ],
                },
              ],
            ]),
          ],
        },
        {
          params: {
            readings: [
              [
                {
                  path: 'attributes.floorArea',
                  value: 86.4,
                  evidenceKindName: 'visible-text',
                  reason: 'Printed on the floor plan.',
                  sourceMediaKeys: [
                    'media-key-10610143',
                  ],
                },
              ],
            ],
          },
          expected: [
            new Map([
              [
                'attributes.floorArea',
                {
                  path: 'attributes.floorArea',
                  value: 86.4,
                  evidenceKindName: 'visible-text',
                  reason: 'Printed on the floor plan.',
                  sourceMediaKeys: [
                    'media-key-10610143',
                  ],
                },
              ],
            ]),
          ],
        },
      ]

      test.each(cases)('readings[0][0].path: $params.readings.0.0.path', ({
        params,
        expected,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.buildReadingVotes(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#extractFieldVotes()', () => {
    /*
     * A reading that answered nothing about the path casts no vote, and the votes that are cast
     * come back in reading order. The one-vote-per-reading rule is settled before this member sees
     * the readings - see `#buildOneReadingVotes()` - so what it is asked for here is one answer per
     * reading and the order they arrive in.
     */
    describe('should take one vote per reading that answered the field', () => {
      const cases = [
        {
          params: {
            fieldPath: 'attributes.wallMaterial',
            readingVotes: [
              new Map([
                [
                  'attributes.wallMaterial',
                  {
                    path: 'attributes.wallMaterial',
                    value: 'brick',
                    evidenceKindName: 'visible-text',
                    reason: 'Visible on the front wall.',
                    sourceMediaKeys: [
                      'media-key-10610131',
                    ],
                  },
                ],
              ]),
              new Map([
                [
                  'attributes.roofMaterial',
                  {
                    path: 'attributes.roofMaterial',
                    value: 'tiled',
                    evidenceKindName: 'visual-estimate',
                    reason: 'Another field entirely.',
                    sourceMediaKeys: [
                      'media-key-10610132',
                    ],
                  },
                ],
              ]),
            ],
          },
          expected: [
            {
              path: 'attributes.wallMaterial',
              value: 'brick',
              evidenceKindName: 'visible-text',
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [
                'media-key-10610131',
              ],
            },
          ],
        },
        {
          params: {
            fieldPath: 'attributes.floorArea',
            readingVotes: [
              new Map([
                [
                  'attributes.floorArea',
                  {
                    path: 'attributes.floorArea',
                    value: 86.4,
                    evidenceKindName: 'visible-text',
                    reason: 'Printed on the floor plan.',
                    sourceMediaKeys: [
                      'media-key-10610133',
                    ],
                  },
                ],
              ]),
              new Map([
                [
                  'attributes.floorArea',
                  {
                    path: 'attributes.floorArea',
                    value: 86.4,
                    evidenceKindName: 'visible-text',
                    reason: 'Printed on the floor plan.',
                    sourceMediaKeys: [
                      'media-key-10610134',
                    ],
                  },
                ],
              ]),
            ],
          },
          expected: [
            {
              path: 'attributes.floorArea',
              value: 86.4,
              evidenceKindName: 'visible-text',
              reason: 'Printed on the floor plan.',
              sourceMediaKeys: [
                'media-key-10610133',
              ],
            },
            {
              path: 'attributes.floorArea',
              value: 86.4,
              evidenceKindName: 'visible-text',
              reason: 'Printed on the floor plan.',
              sourceMediaKeys: [
                'media-key-10610134',
              ],
            },
          ],
        },
      ]

      test.each(cases)('fieldPath: $params.fieldPath', ({
        params,
        expected,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.extractFieldVotes(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#buildSettledFieldPaths()', () => {
    describe('should carry the path of every field a majority settled', () => {
      const cases = [
        {
          params: {
            settledFields: [
              {
                path: 'attributes.wallMaterial',
                value: 'brick',
                evidenceKindName: 'visible-text',
                reason: 'Visible on the front wall.',
                sourceMediaKeys: [
                  'media-key-10610151',
                ],
                agreedReadingCount: 3,
                totalReadingCount: 3,
              },
              {
                path: 'attributes.roofMaterial',
                value: 'tiled',
                evidenceKindName: 'visual-estimate',
                reason: 'Judged from the roof line.',
                sourceMediaKeys: [
                  'media-key-10610152',
                ],
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
            ],
          },
          expected: new Set([
            'attributes.wallMaterial',
            'attributes.roofMaterial',
          ]),
        },
        {
          params: {
            settledFields: [
              {
                path: 'attributes.floorArea',
                value: 86.4,
                evidenceKindName: 'visible-text',
                reason: 'Printed on the floor plan.',
                sourceMediaKeys: [
                  'media-key-10610153',
                ],
                agreedReadingCount: 3,
                totalReadingCount: 3,
              },
            ],
          },
          expected: new Set([
            'attributes.floorArea',
          ]),
        },
      ]

      test.each(cases)('settledFields[0].path: $params.settledFields.0.path', ({
        params,
        expected,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.buildSettledFieldPaths(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should carry nothing where no field was settled', () => {
      const cases = [
        {
          label: 'no settled field at all',
          params: {
            settledFields: [],
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.buildSettledFieldPaths(params)

        expect(actual.size)
          .toBe(0)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#buildAgreedReadingCounts()', () => {
    describe('should carry how many readings agreed on each field', () => {
      const cases = [
        {
          params: {
            fieldConsensuses: [
              {
                fieldPath: 'attributes.wallMaterial',
                agreedReadingCount: 3,
                settledField: null,
              },
              {
                fieldPath: 'attributes.roofMaterial',
                agreedReadingCount: 1,
                settledField: null,
              },
            ],
          },
          expected: new Map([
            [
              'attributes.wallMaterial',
              3,
            ],
            [
              'attributes.roofMaterial',
              1,
            ],
          ]),
        },
        {
          params: {
            fieldConsensuses: [
              {
                fieldPath: 'attributes.floorArea',
                agreedReadingCount: 2,
                settledField: null,
              },
            ],
          },
          expected: new Map([
            [
              'attributes.floorArea',
              2,
            ],
          ]),
        },
      ]

      test.each(cases)('fieldConsensuses[0].fieldPath: $params.fieldConsensuses.0.fieldPath', ({
        params,
        expected,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.buildAgreedReadingCounts(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#extractAgreedSourceMediaKeys()', () => {
    describe('should carry every photograph an agreeing reading rested on, each once', () => {
      const cases = [
        {
          params: {
            largestVoteGroup: {
              valueText: 'brick',
              votes: [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610141',
                    'media-key-10610142',
                  ],
                },
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visual-estimate',
                  reason: 'Judged from the texture.',
                  sourceMediaKeys: [
                    'media-key-10610142',
                    'media-key-10610143',
                  ],
                },
              ],
            },
          },
          expected: [
            'media-key-10610141',
            'media-key-10610142',
            'media-key-10610143',
          ],
        },
        {
          params: {
            largestVoteGroup: {
              valueText: 'concrete',
              votes: [
                {
                  path: 'attributes.wallMaterial',
                  value: 'concrete',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610144',
                  ],
                },
              ],
            },
          },
          expected: [
            'media-key-10610144',
          ],
        },
      ]

      test.each(cases)('valueText: $params.largestVoteGroup.valueText', ({
        params,
        expected,
      }) => {
        const resolver = FieldConsensusResolver.create()

        const actual = resolver.extractAgreedSourceMediaKeys(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('FieldConsensusResolver', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          ResolverCtor: FieldConsensusResolver,
        },
      },
      {
        params: {
          ResolverCtor: class ExtendedFieldConsensusResolver extends FieldConsensusResolver {},
        },
      },
    ]

    test.each(cases)('class: $params.ResolverCtor.name', ({
      params,
    }) => {
      const resolver = params.ResolverCtor.create()

      const actual = resolver.Ctor

      expect(actual)
        .toBe(params.ResolverCtor) // same reference
    })
  })
})
