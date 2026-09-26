import AssetFieldConfidenceScorer from '../../../../app/assetMediaExtraction/AssetFieldConfidenceScorer.js'

/*
 * Step 6 of specs/1.0.0 §20, and three of its acceptance criteria:
 *
 *   - "confidence is computed from the observed agreement and the evidence kind, and never read
 *     from anything the model returned"
 *   - "the confidence formula carries a version, and every run records which version scored it"
 *   - "every field returned carries a field state, a confidence, a one-line reason and the photos
 *     it came from"
 *
 * The first is checked by handing the scorer a field carrying a `suggestionConfidence` of its own
 * and asserting the computed score comes back instead. That case would pass on a class that read
 * the model's number only if the two happened to agree, so the planted value is deliberately one
 * the formula can never produce for that agreement.
 *
 * Both axes of the formula are driven independently and against each other - three evidence kinds
 * against several agreements - because a single pairing would pass on a class that ignored one of
 * them.
 */

describe('AssetFieldConfidenceScorer', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#confidenceMethodVersion', () => {
        const cases = [
          {
            params: {
              evidenceScoringHash: {},
              confidenceMethodVersion: 'confidence-v1.0.0',
              confidenceDecimalPlaceCount: 4,
            },
            expected: 'confidence-v1.0.0',
          },
          {
            params: {
              evidenceScoringHash: {},
              confidenceMethodVersion: 'confidence-v2.1.0',
              confidenceDecimalPlaceCount: 2,
            },
            expected: 'confidence-v2.1.0',
          },
        ]

        test.each(cases)('version: $params.confidenceMethodVersion', ({
          params,
          expected,
        }) => {
          const scorer = new AssetFieldConfidenceScorer(params)

          expect(scorer)
            .toHaveProperty('confidenceMethodVersion', expected)
        })
      })

      describe('#confidenceDecimalPlaceCount', () => {
        const cases = [
          {
            params: {
              evidenceScoringHash: {},
              confidenceMethodVersion: 'confidence-v1.0.0',
              confidenceDecimalPlaceCount: 4,
            },
            expected: 4,
          },
          {
            params: {
              evidenceScoringHash: {},
              confidenceMethodVersion: 'confidence-v2.1.0',
              confidenceDecimalPlaceCount: 2,
            },
            expected: 2,
          },
        ]

        test.each(cases)('places: $params.confidenceDecimalPlaceCount', ({
          params,
          expected,
        }) => {
          const scorer = new AssetFieldConfidenceScorer(params)

          expect(scorer)
            .toHaveProperty('confidenceDecimalPlaceCount', expected)
        })
      })

      describe('#evidenceScoringHash', () => {
        const cases = [
          {
            params: {
              evidenceScoringHash: {
                'visible-text': {
                  aiRunEvidenceCategoryId: 1,
                  aiRunFieldStatusId: 1,
                  fieldStateName: 'extracted',
                  confidenceWeight: 1,
                },
              },
              confidenceMethodVersion: 'confidence-v1.0.0',
              confidenceDecimalPlaceCount: 4,
            },
            expected: {
              'visible-text': {
                aiRunEvidenceCategoryId: 1,
                aiRunFieldStatusId: 1,
                fieldStateName: 'extracted',
                confidenceWeight: 1,
              },
            },
          },
          {
            params: {
              evidenceScoringHash: {
                alpha: {
                  aiRunEvidenceCategoryId: 3,
                  aiRunFieldStatusId: 3,
                  fieldStateName: 'suggested',
                  confidenceWeight: 0.25,
                },
              },
              confidenceMethodVersion: 'confidence-v1.0.0',
              confidenceDecimalPlaceCount: 4,
            },
            expected: {
              alpha: {
                aiRunEvidenceCategoryId: 3,
                aiRunFieldStatusId: 3,
                fieldStateName: 'suggested',
                confidenceWeight: 0.25,
              },
            },
          },
        ]

        test.each(cases)('kinds: $params.evidenceScoringHash', ({
          params,
          expected,
        }) => {
          const scorer = new AssetFieldConfidenceScorer(params)

          expect(scorer)
            .toHaveProperty('evidenceScoringHash', expected)
        })
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            confidenceMethodVersion: 'confidence-v1.0.0',
          },
        },
        {
          params: {
            confidenceMethodVersion: 'confidence-v9.9.9',
          },
        },
      ]

      test.each(cases)('version: $params.confidenceMethodVersion', ({
        params,
      }) => {
        const actual = AssetFieldConfidenceScorer.create(params)

        expect(actual)
          .toBeInstanceOf(AssetFieldConfidenceScorer)
      })
    })

    /*
     * The version every run is scored under, asserted at the one place it is decided. A change to
     * it is a change to what every field outcome written from today on says about itself, which is
     * exactly why the criterion asks for a version at all - so this case is meant to fail on a
     * silent bump.
     */
    describe('should fill default value', () => {
      const cases = [
        {
          params: {
            confidenceMethodVersion: 'confidence-v9.9.9',
            confidenceDecimalPlaceCount: 2,
          },
          expected: {
            evidenceScoringHash: {
              'visible-text': {
                aiRunEvidenceCategoryId: 1,
                aiRunFieldStatusId: 1,
                fieldStateName: 'extracted',
                confidenceWeight: 1,
              },
              'visual-estimate': {
                aiRunEvidenceCategoryId: 2,
                aiRunFieldStatusId: 2,
                fieldStateName: 'derived',
                confidenceWeight: 0.75,
              },
              'category-prior': {
                aiRunEvidenceCategoryId: 3,
                aiRunFieldStatusId: 3,
                fieldStateName: 'suggested',
                confidenceWeight: 0.5,
              },
            },
            confidenceMethodVersion: 'confidence-v9.9.9',
            confidenceDecimalPlaceCount: 2,
          },
        },
        {
          // input: {} — every argument omitted, so every default is filled
          params: {},
          expected: {
            evidenceScoringHash: {
              'visible-text': {
                aiRunEvidenceCategoryId: 1,
                aiRunFieldStatusId: 1,
                fieldStateName: 'extracted',
                confidenceWeight: 1,
              },
              'visual-estimate': {
                aiRunEvidenceCategoryId: 2,
                aiRunFieldStatusId: 2,
                fieldStateName: 'derived',
                confidenceWeight: 0.75,
              },
              'category-prior': {
                aiRunEvidenceCategoryId: 3,
                aiRunFieldStatusId: 3,
                fieldStateName: 'suggested',
                confidenceWeight: 0.5,
              },
            },
            confidenceMethodVersion: 'confidence-v1.0.0',
            confidenceDecimalPlaceCount: 4,
          },
        },
      ]

      test.each(cases)('version: $expected.confidenceMethodVersion', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AssetFieldConfidenceScorer)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('#generateAgreementRatio()', () => {
    describe('with valid values', () => {
      const cases = [
        {
          params: {
            agreedReadingCount: 3,
            totalReadingCount: 3,
          },
          expected: 1,
        },
        {
          params: {
            agreedReadingCount: 2,
            totalReadingCount: 4,
          },
          expected: 0.5,
        },
        {
          params: {
            agreedReadingCount: 4,
            totalReadingCount: 5,
          },
          expected: 0.8,
        },
        {
          params: {
            agreedReadingCount: 0,
            totalReadingCount: 2,
          },
          expected: 0,
        },
      ]

      test.each(cases)('agreed: $params.agreedReadingCount', ({
        params,
        expected,
      }) => {
        const scorer = AssetFieldConfidenceScorer.create()

        const actual = scorer.generateAgreementRatio(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('with invalid values', () => {
      const cases = [
        {
          params: {
            agreedReadingCount: 2,
            totalReadingCount: 0,
          },
        },
        {
          params: {
            agreedReadingCount: 3,
            totalReadingCount: -1,
          },
        },
        {
          params: {
            agreedReadingCount: 4,
            totalReadingCount: Number.NaN,
          },
        },
        {
          params: {
            agreedReadingCount: Number.POSITIVE_INFINITY,
            totalReadingCount: 3,
          },
        },
      ]

      test.each(cases)('agreed: $params.agreedReadingCount', ({
        params,
      }) => {
        const scorer = AssetFieldConfidenceScorer.create()

        const actual = scorer.generateAgreementRatio(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('#generateSuggestionConfidence()', () => {
    /*
     * Both axes, independently: the same agreement under three weights, and three agreements under
     * one weight. A class that dropped either factor passes one of these groups and fails the
     * other.
     *
     * Nothing produced here leaves nothing-to-one, which is what [[Q123]] settles the range as and
     * what `DECIMAL(5, 4)` holds.
     */
    describe('should multiply the agreement by what the evidence is worth', () => {
      const cases = [
        {
          label: '3 of 3 at full weight',
          params: {
            agreedReadingCount: 3,
            totalReadingCount: 3,
            confidenceWeight: 1,
          },
          expected: 1,
        },
        {
          label: '3 of 4 at full weight',
          params: {
            agreedReadingCount: 3,
            totalReadingCount: 4,
            confidenceWeight: 1,
          },
          expected: 0.75,
        },
        {
          label: '2 of 3 at full weight',
          params: {
            agreedReadingCount: 2,
            totalReadingCount: 3,
            confidenceWeight: 1,
          },
          expected: 0.6667, // rounded to the four places DECIMAL(5, 4) holds
        },
        {
          label: '2 of 3 at three quarters',
          params: {
            agreedReadingCount: 2,
            totalReadingCount: 3,
            confidenceWeight: 0.75,
          },
          expected: 0.5,
        },
        {
          label: '2 of 3 at half',
          params: {
            agreedReadingCount: 2,
            totalReadingCount: 3,
            confidenceWeight: 0.5,
          },
          expected: 0.3333, // rounded to the four places DECIMAL(5, 4) holds
        },
        {
          label: '4 of 5 at half',
          params: {
            agreedReadingCount: 4,
            totalReadingCount: 5,
            confidenceWeight: 0.5,
          },
          expected: 0.4,
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const scorer = AssetFieldConfidenceScorer.create()

        const actual = scorer.generateSuggestionConfidence(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('#extractEvidenceScoring()', () => {
    describe('should be null', () => {
      const cases = [
        {
          params: {
            evidenceKindName: 'gut-feeling',
          },
        },
        {
          // a member of Object.prototype must answer no differently from a kind nobody seeded
          params: {
            evidenceKindName: 'constructor',
          },
        },
        {
          params: {
            evidenceKindName: 'toString',
          },
        },
        {
          params: {
            evidenceKindName: null,
          },
        },
      ]

      test.each(cases)('evidenceKindName: $params.evidenceKindName', ({
        params,
      }) => {
        const scorer = AssetFieldConfidenceScorer.create()

        const actual = scorer.extractEvidenceScoring(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('#scoreSettledField()', () => {
    /*
     * The whole of step 6 over one field, and the third criterion above: every field returned
     * carries a state, a confidence, a reason and the photographs it came from - plus the two
     * master-row ids and the version the trace records.
     *
     * Each case plants a `suggestionConfidence` the model supposedly returned, and each planted
     * value is one the formula cannot produce for that agreement. A class that passed the model's
     * number through fails here rather than coincidentally agreeing.
     */
    describe('should compute the score and never read the one the model sent', () => {
      const cases = [
        {
          params: {
            settledField: {
              path: 'attributes.floorArea',
              value: 86.4,
              evidenceKindName: 'visible-text',
              reason: 'Printed on the floor plan.',
              sourceMediaKeys: [
                'media-key-10610201',
              ],
              agreedReadingCount: 3,
              totalReadingCount: 3,
              suggestionConfidence: 0.1234, // what the model claimed, which is never read
            },
          },
          expected: {
            path: 'attributes.floorArea',
            value: 86.4,
            fieldStateName: 'extracted',
            suggestionConfidence: 1,
            reason: 'Printed on the floor plan.',
            sourceMediaKeys: [
              'media-key-10610201',
            ],
            agreement: {
              agreedReadingCount: 3,
              totalReadingCount: 3,
            },
            aiRunFieldStatusId: 1,
            aiRunEvidenceCategoryId: 1,
            confidenceMethodVersion: 'confidence-v1.0.0',
          },
        },
        {
          params: {
            settledField: {
              path: 'attributes.facadeWidth',
              value: 4.2,
              evidenceKindName: 'visual-estimate',
              reason: 'Judged against the door beside it.',
              sourceMediaKeys: [
                'media-key-10610202',
                'media-key-10610203',
              ],
              agreedReadingCount: 2,
              totalReadingCount: 3,
              suggestionConfidence: 0.95, // what the model claimed, which is never read
            },
          },
          expected: {
            path: 'attributes.facadeWidth',
            value: 4.2,
            fieldStateName: 'derived',
            suggestionConfidence: 0.5,
            reason: 'Judged against the door beside it.',
            sourceMediaKeys: [
              'media-key-10610202',
              'media-key-10610203',
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
        {
          params: {
            settledField: {
              path: 'attributes.legalStatusSlug',
              value: 'pending-title',
              evidenceKindName: 'category-prior',
              reason: 'Usual for a house of this kind in this province.',
              sourceMediaKeys: [
                'media-key-10610204',
              ],
              agreedReadingCount: 4,
              totalReadingCount: 5,
              suggestionConfidence: 0.02, // what the model claimed, which is never read
            },
          },
          expected: {
            path: 'attributes.legalStatusSlug',
            value: 'pending-title',
            fieldStateName: 'suggested',
            suggestionConfidence: 0.4,
            reason: 'Usual for a house of this kind in this province.',
            sourceMediaKeys: [
              'media-key-10610204',
            ],
            agreement: {
              agreedReadingCount: 4,
              totalReadingCount: 5,
            },
            aiRunFieldStatusId: 3,
            aiRunEvidenceCategoryId: 3,
            confidenceMethodVersion: 'confidence-v1.0.0',
          },
        },
      ]

      test.each(cases)('path: $params.settledField.path', ({
        params,
        expected,
      }) => {
        const scorer = AssetFieldConfidenceScorer.create()

        const actual = scorer.scoreSettledField(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('#scoreSettledField()', () => {
    describe('should throw error', () => {
      const cases = [
        {
          params: {
            settledField: {
              path: 'attributes.wallMaterial',
              value: 'brick',
              evidenceKindName: 'gut-feeling',
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [
                'media-key-10610211',
              ],
              agreedReadingCount: 2,
              totalReadingCount: 3,
            },
          },
          expected: 'AssetFieldConfidenceScorer#scoreSettledField() refused a field resting on an evidence kind naming no master row: field attributes.wallMaterial, evidence kind gut-feeling',
        },
        {
          params: {
            settledField: {
              path: 'attributes.roofMaterial',
              value: 'tiled',
              evidenceKindName: 'visible-text',
              reason: 'Visible from above.',
              sourceMediaKeys: [
                'media-key-10610212',
              ],
              agreedReadingCount: 0,
              totalReadingCount: 0,
            },
          },
          expected: 'AssetFieldConfidenceScorer#scoreSettledField() refused a field settled by no readings at all: field attributes.roofMaterial, 0 of 0',
        },
      ]

      test.each(cases)('path: $params.settledField.path', ({
        params,
        expected,
      }) => {
        const scorer = AssetFieldConfidenceScorer.create()

        const actual = () => scorer.scoreSettledField(params)

        expect(actual)
          .toThrow(expected)
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('#scoreSettledFields()', () => {
    describe('should score every field it was handed', () => {
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
                  'media-key-10610221',
                ],
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
              {
                path: 'attributes.roadWidth',
                value: 6,
                evidenceKindName: 'visual-estimate',
                reason: 'Judged against the car beside it.',
                sourceMediaKeys: [
                  'media-key-10610222',
                ],
                agreedReadingCount: 3,
                totalReadingCount: 3,
              },
            ],
          },
          expected: [
            {
              path: 'attributes.wallMaterial',
              value: 'brick',
              fieldStateName: 'extracted',
              suggestionConfidence: 0.6667,
              reason: 'Visible on the front wall.',
              sourceMediaKeys: [
                'media-key-10610221',
              ],
              agreement: {
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
              aiRunFieldStatusId: 1,
              aiRunEvidenceCategoryId: 1,
              confidenceMethodVersion: 'confidence-v1.0.0',
            },
            {
              path: 'attributes.roadWidth',
              value: 6,
              fieldStateName: 'derived',
              suggestionConfidence: 0.75,
              reason: 'Judged against the car beside it.',
              sourceMediaKeys: [
                'media-key-10610222',
              ],
              agreement: {
                agreedReadingCount: 3,
                totalReadingCount: 3,
              },
              aiRunFieldStatusId: 2,
              aiRunEvidenceCategoryId: 2,
              confidenceMethodVersion: 'confidence-v1.0.0',
            },
          ],
        },
        {
          params: {
            settledFields: [
              {
                path: 'attributes.bedroomCount',
                value: 3,
                evidenceKindName: 'category-prior',
                reason: 'Usual for a house of this size.',
                sourceMediaKeys: [
                  'media-key-10610223',
                ],
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
            ],
          },
          expected: [
            {
              path: 'attributes.bedroomCount',
              value: 3,
              fieldStateName: 'suggested',
              suggestionConfidence: 0.3333,
              reason: 'Usual for a house of this size.',
              sourceMediaKeys: [
                'media-key-10610223',
              ],
              agreement: {
                agreedReadingCount: 2,
                totalReadingCount: 3,
              },
              aiRunFieldStatusId: 3,
              aiRunEvidenceCategoryId: 3,
              confidenceMethodVersion: 'confidence-v1.0.0',
            },
          ],
        },
      ]

      test.each(cases)('first path: $params.settledFields.0.path', ({
        params,
        expected,
      }) => {
        const scorer = AssetFieldConfidenceScorer.create()

        const actual = scorer.scoreSettledFields(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('#scoreSettledFields()', () => {
    describe('should be empty', () => {
      const cases = [
        {
          label: 'a run that settled no field',
          params: {
            settledFields: [],
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const scorer = AssetFieldConfidenceScorer.create()

        const actual = scorer.scoreSettledFields(params)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('AssetFieldConfidenceScorer', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          ScorerCtor: AssetFieldConfidenceScorer,
        },
      },
      {
        params: {
          ScorerCtor: class ExtendedAssetFieldConfidenceScorer extends AssetFieldConfidenceScorer {},
        },
      },
    ]

    test.each(cases)('class: $params.ScorerCtor.name', ({
      params,
    }) => {
      const scorer = params.ScorerCtor.create()

      const actual = scorer.Ctor

      expect(actual)
        .toBe(params.ScorerCtor) // same reference
    })
  })
})
