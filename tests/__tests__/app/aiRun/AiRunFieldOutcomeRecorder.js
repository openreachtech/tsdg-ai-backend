import AiRunFieldOutcomeRecorder from '../../../../app/aiRun/AiRunFieldOutcomeRecorder.js'

import AiRunFieldOutcome from '../../../../sequelize/models/AiRunFieldOutcome.js'
import AiRunStep from '../../../../sequelize/models/AiRunStep.js'

describe('AiRunFieldOutcomeRecorder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#missingAiRunFieldStatusId', () => {
        const cases = [
          {
            input: {
              missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            },
            expected: 4,
          },
          {
            input: {
              missingAiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            },
            expected: 1,
          },
        ]

        test.each(cases)('missingAiRunFieldStatusId: $input.missingAiRunFieldStatusId', ({
          input,
          expected,
        }) => {
          const recorder = new AiRunFieldOutcomeRecorder(input)

          expect(recorder)
            .toHaveProperty('missingAiRunFieldStatusId', expected)
        })
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
          },
        },
        {
          input: {
            missingAiRunFieldStatusId: 2, // AI_RUN_FIELD_STATUS.DERIVED.ID
          },
        },
      ]

      test.each(cases)('missingAiRunFieldStatusId: $input.missingAiRunFieldStatusId', ({
        input,
      }) => {
        const received = AiRunFieldOutcomeRecorder.create(input)

        expect(received)
          .toBeInstanceOf(AiRunFieldOutcomeRecorder)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
          },
          expected: {
            missingAiRunFieldStatusId: 4,
          },
        },
        {
          input: {
            missingAiRunFieldStatusId: 2, // AI_RUN_FIELD_STATUS.DERIVED.ID
          },
          expected: {
            missingAiRunFieldStatusId: 2,
          },
        },
      ]

      test.each(cases)('missingAiRunFieldStatusId: $input.missingAiRunFieldStatusId', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunFieldOutcomeRecorder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default missingAiRunFieldStatusId', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunFieldOutcomeRecorder)
        const expected = {
          missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('.get:AiRunFieldOutcomeCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunFieldOutcomeRecorder.AiRunFieldOutcomeCtor

        expect(received)
          .toBe(AiRunFieldOutcome) // same reference
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunFieldOutcomeRecorder,
      },
      {
        tally: class AlphaAiRunFieldOutcomeRecorder extends AiRunFieldOutcomeRecorder {},
      },
      {
        tally: class BetaAiRunFieldOutcomeRecorder extends AiRunFieldOutcomeRecorder {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const recorder = tally.create()

      const received = recorder.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#settlesField()', () => {
    /*
     * The four states of `ai_run_field_statuses` are a set small enough to enumerate, so every one
     * of them is driven rather than sampled. Which of them means "nothing was settled" is the
     * instance's own property, so the second outer describe binds it to a different state and runs
     * the same enumeration again: an implementation that had hard-coded the seeded `missing` id
     * would answer the first describe correctly and the second one backwards.
     */
    describe('when #missingAiRunFieldStatusId:4', () => {
      describe('should be truthy', () => {
        const cases = [
          {
            input: {
              aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            },
          },
          {
            input: {
              aiRunFieldStatusId: 2, // AI_RUN_FIELD_STATUS.DERIVED.ID
            },
          },
          {
            input: {
              aiRunFieldStatusId: 3, // AI_RUN_FIELD_STATUS.SUGGESTED.ID
            },
          },
        ]

        test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
          input,
        }) => {
          const constructorArgs = {
            missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
          }
          const recorder = AiRunFieldOutcomeRecorder.create(constructorArgs)

          const received = recorder.settlesField(input)

          expect(received)
            .toBeTruthy()
        })
      })

      // Only the one state bound as `missing` can be falsy, so this holds a single case.
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            },
          },
        ]

        test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
          input,
        }) => {
          const constructorArgs = {
            missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
          }
          const recorder = AiRunFieldOutcomeRecorder.create(constructorArgs)

          const received = recorder.settlesField(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })

    describe('when #missingAiRunFieldStatusId:1', () => {
      describe('should be truthy', () => {
        const cases = [
          {
            input: {
              aiRunFieldStatusId: 2, // AI_RUN_FIELD_STATUS.DERIVED.ID
            },
          },
          {
            input: {
              aiRunFieldStatusId: 3, // AI_RUN_FIELD_STATUS.SUGGESTED.ID
            },
          },
          {
            input: {
              aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            },
          },
        ]

        test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
          input,
        }) => {
          const constructorArgs = {
            missingAiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
          }
          const recorder = AiRunFieldOutcomeRecorder.create(constructorArgs)

          const received = recorder.settlesField(input)

          expect(received)
            .toBeTruthy()
        })
      })

      // Only the one state bound as `missing` can be falsy, so this holds a single case.
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            },
          },
        ]

        test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
          input,
        }) => {
          const constructorArgs = {
            missingAiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
          }
          const recorder = AiRunFieldOutcomeRecorder.create(constructorArgs)

          const received = recorder.settlesField(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#generateSettledEvidenceCategoryId()', () => {
    /*
     * A field that settled something rests on whatever the majority reading rested on, and the
     * three evidence categories are enumerated so a category silently swapped for another would
     * show. The state and the category are driven together rather than held constant, because an
     * implementation keying the answer off the state alone would still pass a run of cases that
     * all carried the same category.
     */
    describe('when the field was settled', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            aiRunEvidenceCategoryId: 3, // AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.ID
          },
          expected: 3,
        },
        {
          input: {
            aiRunFieldStatusId: 2, // AI_RUN_FIELD_STATUS.DERIVED.ID
            aiRunEvidenceCategoryId: 1, // AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID
          },
          expected: 1,
        },
        {
          input: {
            aiRunFieldStatusId: 3, // AI_RUN_FIELD_STATUS.SUGGESTED.ID
            aiRunEvidenceCategoryId: 2, // AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.ID
          },
          expected: 2,
        },
      ]

      test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledEvidenceCategoryId(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * A field that settled nothing rested on no majority reading, so it records no category — and
     * that holds however the caller arrived. The first three cases carry a category left over from
     * a reading that did not win: recording it would say the field rested on evidence it never
     * settled by, so it is dropped rather than carried through.
     */
    describe('when the field settled nothing', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            aiRunEvidenceCategoryId: 1, // AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID
          },
        },
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            aiRunEvidenceCategoryId: 2, // AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.ID
          },
        },
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            aiRunEvidenceCategoryId: 3, // AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.ID
          },
        },
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            aiRunEvidenceCategoryId: null,
          },
        },
      ]

      test.each(cases)('aiRunEvidenceCategoryId: $input.aiRunEvidenceCategoryId', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledEvidenceCategoryId(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#generateSettledSuggestionConfidence()', () => {
    /*
     * The score of a settled field is recorded exactly as the scorer computed it.
     *
     * `suggestion_confidence` is `DECIMAL(5, 4)`, and Sequelize hands a DECIMAL back as a string on
     * MariaDB — `staging` and `live` — and as a number on SQLite, which every Jest run uses. Which
     * of the two a reader will meet is not this class's question, so the cases carry both
     * renderings and each is expected back unchanged: a class that normalized one into the other
     * would fail whichever case it converted. The two ends of the range are driven as well, so a
     * rounding or a re-scaling that only shows at a boundary is not left uncovered.
     */
    describe('when the field was settled', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            suggestionConfidence: 0.9125, // as SQLite hands a DECIMAL back
          },
          expected: 0.9125,
        },
        {
          input: {
            aiRunFieldStatusId: 2, // AI_RUN_FIELD_STATUS.DERIVED.ID
            suggestionConfidence: '0.4250', // as MariaDB hands a DECIMAL back
          },
          expected: '0.4250',
        },
        {
          input: {
            aiRunFieldStatusId: 3, // AI_RUN_FIELD_STATUS.SUGGESTED.ID
            suggestionConfidence: 1, // the top of the range
          },
          expected: 1,
        },
        {
          input: {
            aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            suggestionConfidence: 0, // the bottom of the range, and not an absence
          },
          expected: 0,
        },
      ]

      test.each(cases)('suggestionConfidence: $input.suggestionConfidence', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledSuggestionConfidence(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * The score of a field that settled nothing is not a low score, it is no score. A confidence
     * the caller was still holding from a reading that did not win is dropped rather than recorded
     * against a field nothing settled — including a zero, which a column would otherwise keep as a
     * score somebody computed.
     */
    describe('when the field settled nothing', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            suggestionConfidence: 0.9125, // as SQLite hands a DECIMAL back
          },
        },
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            suggestionConfidence: '0.4250', // as MariaDB hands a DECIMAL back
          },
        },
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            suggestionConfidence: 0,
          },
        },
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
            suggestionConfidence: null,
          },
        },
      ]

      test.each(cases)('suggestionConfidence: $input.suggestionConfidence', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledSuggestionConfidence(input)

        expect(received)
          .toBeNull()
      })
    })

    /*
     * A value that is no score at all is no score either, and for the same reason: recording it
     * would put text into a column that means "how sure the run was", on the two-year clock. The
     * first case is the one the audit put through — under SQLite a `DECIMAL(5, 4)` takes a string
     * whole, where a strict-mode MySQL would have refused it, so the channel is open exactly where
     * nobody is watching. The rest drive the closed range and the renderings that are not decimals.
     */
    describe('when the value is not a score', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            suggestionConfidence: 'read from the medium: the owner is a sample person',
          },
        },
        {
          input: {
            aiRunFieldStatusId: 2, // AI_RUN_FIELD_STATUS.DERIVED.ID
            suggestionConfidence: '1.5', // above the top of the range
          },
        },
        {
          input: {
            aiRunFieldStatusId: 3, // AI_RUN_FIELD_STATUS.SUGGESTED.ID
            suggestionConfidence: -0.5, // below the bottom of the range
          },
        },
        {
          input: {
            aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            suggestionConfidence: '1e-3', // a number, but not as a decimal column spells one
          },
        },
      ]

      test.each(cases)('suggestionConfidence: $input.suggestionConfidence', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledSuggestionConfidence(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#generateSettledFieldPath()', () => {
    /*
     * `field_path` is the widest way a value read out of a medium reaches a column kept for seven
     * hundred and thirty days: a path can be produced by a model rather than bounded by a schema —
     * the step trace carries `field-path-outside-schema` for exactly that — and a key name invented
     * out of what was read is content that nobody calls a value.
     *
     * So the shape is stated, and both sides of it are driven. The paths below are the ones this
     * feature writes today: a two-segment path, an index into a repeated field, a leading
     * underscore, and a single segment with no separator at all.
     *
     * The hyphenated key is here rather than among the refusals, and the choice is written above
     * `FIELD_PATH_PATTERN`: what keeps a sentence out is the ban on whitespace, not a narrow
     * alphabet, and refusing a hyphen would have cost a whole decision row over a naming style a
     * model is free to pick.
     */
    describe('when the value is a dotted path', () => {
      const cases = [
        {
          input: {
            fieldPath: 'owner-note', // a hyphen, which a model is free to pick
          },
          expected: 'owner-note',
        },
        {
          input: {
            fieldPath: 'attributes.floorArea',
          },
          expected: 'attributes.floorArea',
        },
        {
          input: {
            fieldPath: 'attributes.balconyDirectionSlug',
          },
          expected: 'attributes.balconyDirectionSlug',
        },
        {
          input: {
            fieldPath: 'items.0.name', // an index into a repeated field
          },
          expected: 'items.0.name',
        },
        {
          input: {
            fieldPath: '_private.value',
          },
          expected: '_private.value',
        },
        {
          input: {
            fieldPath: 'summaryText', // one segment, no separator
          },
          expected: 'summaryText',
        },
      ]

      test.each(cases)('fieldPath: $input.fieldPath', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledFieldPath(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * What the shape rejects, case by case, so that widening it later is a deliberate act rather
     * than an unnoticed one. The first case is the payload the audit put through: a sentence is a
     * path only because nothing was checking, and a sentence is where a read value fits.
     *
     * The hyphen is rejected on purpose and is driven here to say so: every path this feature has
     * ever written is a chain of camelCase keys, and the narrower the alphabet the less room a
     * sentence has. A key that genuinely needs one refuses its row loudly rather than passing
     * quietly, which is the direction that error should point.
     */
    describe('when the value is not a dotted path', () => {
      const cases = [
        {
          input: {
            fieldPath: 'the owner note says sample person, born 1984, phone 090-0000-0000',
          },
        },
        {
          input: {
            fieldPath: 'attributes.floor area', // a space inside a segment
          },
        },
        {
          input: {
            fieldPath: 'attributes/floorArea', // a separator that is not the dot
          },
        },
        {
          input: {
            fieldPath: '.leadingDot',
          },
        },
        {
          input: {
            fieldPath: 'trailingDot.',
          },
        },
        {
          input: {
            fieldPath: 'double..dot',
          },
        },
        {
          input: {
            fieldPath: '0startsWithDigit',
          },
        },
        {
          input: {
            fieldPath: '', // no path at all
          },
        },
        {
          input: {
            fieldPath: null,
          },
        },
        {
          input: {
            fieldPath: 123,
          },
        },
      ]

      test.each(cases)('fieldPath: $input.fieldPath', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledFieldPath(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#generateSettledFieldPath()', () => {
    /*
     * The width of `field_path` is part of its shape, because length is a channel of its own: MySQL
     * would refuse a path past 191 characters and SQLite would store the whole of it, so a check
     * that only judged the alphabet would leave a developer's machine taking a paragraph of
     * underscore-joined text. The boundary is driven from both sides, one character apart.
     *
     * These two cases are stated by length rather than by their text, so they are the one place in
     * this file a label reads better than the value.
     */
    describe('when the path is as wide as the column', () => {
      const cases = [
        {
          label: 'a path of 191 characters',
          input: {
            fieldPath: 'a'.repeat(191),
          },
          expected: 'a'.repeat(191),
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledFieldPath(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the path is wider than the column', () => {
      const cases = [
        {
          label: 'a path of 192 characters, one past the column',
          input: {
            fieldPath: 'a'.repeat(192),
          },
        },
        {
          label: 'a path of forty segments',
          input: {
            fieldPath: Array(40)
              .fill('attributes')
              .join('.'),
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledFieldPath(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#generateSettledConfidenceMethodVersion()', () => {
    /*
     * `confidence_method_version` is free text on the same two-year clock, so it is checked the
     * same way. The labels below are the ones this feature writes — the seeder's `confidence-v1.0.0`
     * and the tests' `confidence-method-0001` — plus the smallest label that is still one.
     */
    describe('when the value is a version label', () => {
      const cases = [
        {
          input: {
            confidenceMethodVersion: 'confidence-v1.0.0',
          },
          expected: 'confidence-v1.0.0',
        },
        {
          input: {
            confidenceMethodVersion: 'confidence-method-0001',
          },
          expected: 'confidence-method-0001',
        },
        {
          input: {
            confidenceMethodVersion: 'confidence_v2',
          },
          expected: 'confidence_v2',
        },
        {
          input: {
            confidenceMethodVersion: '1.0.0',
          },
          expected: '1.0.0',
        },
        {
          input: {
            confidenceMethodVersion: 'v1',
          },
          expected: 'v1',
        },
      ]

      test.each(cases)('confidenceMethodVersion: $input.confidenceMethodVersion', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledConfidenceMethodVersion(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * The first case is the payload the audit put through. A colon and a space are all a sentence
     * needs, so both are outside the alphabet; the rest drive the remaining edges.
     */
    describe('when the value is not a version label', () => {
      const cases = [
        {
          input: {
            confidenceMethodVersion: 'read from the medium: the owner is a sample person',
          },
        },
        {
          input: {
            confidenceMethodVersion: 'confidence v1', // a space
          },
        },
        {
          input: {
            confidenceMethodVersion: 'confidence/v1', // a slash
          },
        },
        {
          input: {
            confidenceMethodVersion: '-leadsWithHyphen',
          },
        },
        {
          input: {
            confidenceMethodVersion: '', // no version at all
          },
        },
        {
          input: {
            confidenceMethodVersion: null,
          },
        },
        {
          input: {
            confidenceMethodVersion: 100,
          },
        },
      ]

      test.each(cases)('confidenceMethodVersion: $input.confidenceMethodVersion', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledConfidenceMethodVersion(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#generateSettledConfidenceMethodVersion()', () => {
    /*
     * The width of `confidence_method_version` is thirty-two characters, and it is driven from both
     * sides for the reason the field path's width is: SQLite enforces neither, so the check has to.
     */
    describe('when the label is as wide as the column', () => {
      const cases = [
        {
          label: 'a label of 32 characters',
          input: {
            confidenceMethodVersion: 'v'.repeat(32),
          },
          expected: 'v'.repeat(32),
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledConfidenceMethodVersion(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the label is wider than the column', () => {
      const cases = [
        {
          label: 'a label of 33 characters, one past the column',
          input: {
            confidenceMethodVersion: 'v'.repeat(33),
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateSettledConfidenceMethodVersion(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#isRecordableScore()', () => {
    /*
     * A score is judged as text, so that the number SQLite hands a `DECIMAL(5, 4)` back as and the
     * string MariaDB does are judged by one rule and neither is turned into the other. Both
     * renderings are driven here, alongside the two ends of the range and a score carrying more
     * digits than the column keeps — how far the column rounds is the column's business, so a fifth
     * decimal is still a score.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            suggestionConfidence: 0.9125, // as SQLite hands a DECIMAL back
          },
        },
        {
          input: {
            suggestionConfidence: '0.4250', // as MariaDB hands a DECIMAL back
          },
        },
        {
          input: {
            suggestionConfidence: '1.0000', // the top of the range, as text
          },
        },
        {
          input: {
            suggestionConfidence: 1, // the top of the range
          },
        },
        {
          input: {
            suggestionConfidence: 0, // the bottom of the range, and not an absence
          },
        },
        {
          input: {
            suggestionConfidence: 0.91253, // finer than the column keeps, and still a score
          },
        },
      ]

      test.each(cases)('suggestionConfidence: $input.suggestionConfidence', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.isRecordableScore(input)

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * The first case is the payload the audit put through a `DECIMAL` column under SQLite. The rest
     * are the near misses: outside the closed range, a sign, exponent notation, and a decimal with
     * whitespace around it that a looser reading would have coerced.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            suggestionConfidence: 'read from the medium: 090-0000-0000',
          },
        },
        {
          input: {
            suggestionConfidence: '1.5', // above the top of the range
          },
        },
        {
          input: {
            suggestionConfidence: '2',
          },
        },
        {
          input: {
            suggestionConfidence: -0.5, // below the bottom of the range
          },
        },
        {
          input: {
            suggestionConfidence: '1e-3', // a number, but not as a decimal column spells one
          },
        },
        {
          input: {
            suggestionConfidence: ' 0.5', // a decimal with whitespace around it
          },
        },
        {
          input: {
            suggestionConfidence: '', // no score at all
          },
        },
      ]

      test.each(cases)('suggestionConfidence: $input.suggestionConfidence', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.isRecordableScore(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#isRecordableScore()', () => {
    /*
     * Only a number and a string are read as scores at all. Everything else is refused before its
     * text is looked at, because a one-element array of a score renders to exactly the text of that
     * score and would otherwise pass for one. These cases are stated by what kind of value they are
     * rather than by their text, which is what a label is for.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          label: 'an array holding one score',
          input: {
            suggestionConfidence: [
              0.5,
            ],
          },
        },
        {
          label: 'a boolean',
          input: {
            suggestionConfidence: true,
          },
        },
        {
          label: 'no value at all',
          input: {
            suggestionConfidence: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.isRecordableScore(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#settlesField()', () => {
    /*
     * A status id that reached here through a query string or a JSON body arrives as text, and `'4'`
     * and `4` name one state. Compared as they arrive, the two differ, `missing` stops matching
     * itself, and the row saying the field settled nothing carries a confidence and an evidence
     * category anyway. So the text form of every state is driven against the same binding the
     * numeric describes above use.
     */
    describe('when the state arrived as text', () => {
      describe('should be truthy', () => {
        const cases = [
          {
            input: {
              aiRunFieldStatusId: '1', // AI_RUN_FIELD_STATUS.EXTRACTED.ID
            },
          },
          {
            input: {
              aiRunFieldStatusId: '2', // AI_RUN_FIELD_STATUS.DERIVED.ID
            },
          },
          {
            input: {
              aiRunFieldStatusId: '3', // AI_RUN_FIELD_STATUS.SUGGESTED.ID
            },
          },
        ]

        test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
          input,
        }) => {
          const constructorArgs = {
            missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
          }
          const recorder = AiRunFieldOutcomeRecorder.create(constructorArgs)

          const received = recorder.settlesField(input)

          expect(received)
            .toBeTruthy()
        })
      })

      // Only the one state bound as `missing` can be falsy, so this holds a single case.
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunFieldStatusId: '4', // AI_RUN_FIELD_STATUS.MISSING.ID
            },
          },
        ]

        test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
          input,
        }) => {
          const constructorArgs = {
            missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
          }
          const recorder = AiRunFieldOutcomeRecorder.create(constructorArgs)

          const received = recorder.settlesField(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })

    /*
     * A value naming no state settles nothing rather than settling everything. That is the
     * conservative side of the answer: a field whose state nobody can read records no confidence
     * and no evidence category, and the state column refuses the row on its own account.
     */
    describe('when the value names no state', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunFieldStatusId: '04', // an id is written without a leading zero
            },
          },
          {
            input: {
              aiRunFieldStatusId: '4 ', // trailing whitespace
            },
          },
          {
            input: {
              aiRunFieldStatusId: '4abc',
            },
          },
          {
            input: {
              aiRunFieldStatusId: 'missing', // the name of the state, not its id
            },
          },
          {
            input: {
              aiRunFieldStatusId: '',
            },
          },
          {
            input: {
              aiRunFieldStatusId: 4.5, // an id is a whole number
            },
          },
          {
            input: {
              aiRunFieldStatusId: null,
            },
          },
          {
            input: {
              aiRunFieldStatusId: true,
            },
          },
        ]

        test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
          input,
        }) => {
          const constructorArgs = {
            missingAiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
          }
          const recorder = AiRunFieldOutcomeRecorder.create(constructorArgs)

          const received = recorder.settlesField(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#generateComparableAiRunFieldStatusId()', () => {
    /*
     * The conversion both sides of the comparison go through. Every state is enumerated in each
     * form, because a conversion that only answered for the state this feature happens to call
     * `missing` would pass a run of cases that all carried that one id.
     */
    describe('when the id is a number', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
          },
          expected: 1,
        },
        {
          input: {
            aiRunFieldStatusId: 2, // AI_RUN_FIELD_STATUS.DERIVED.ID
          },
          expected: 2,
        },
        {
          input: {
            aiRunFieldStatusId: 3, // AI_RUN_FIELD_STATUS.SUGGESTED.ID
          },
          expected: 3,
        },
        {
          input: {
            aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
          },
          expected: 4,
        },
        {
          input: {
            aiRunFieldStatusId: 10, // a state this service does not know yet
          },
          expected: 10,
        },
      ]

      test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateComparableAiRunFieldStatusId(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the id arrived as text', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: '1', // AI_RUN_FIELD_STATUS.EXTRACTED.ID
          },
          expected: 1,
        },
        {
          input: {
            aiRunFieldStatusId: '2', // AI_RUN_FIELD_STATUS.DERIVED.ID
          },
          expected: 2,
        },
        {
          input: {
            aiRunFieldStatusId: '3', // AI_RUN_FIELD_STATUS.SUGGESTED.ID
          },
          expected: 3,
        },
        {
          input: {
            aiRunFieldStatusId: '4', // AI_RUN_FIELD_STATUS.MISSING.ID
          },
          expected: 4,
        },
        {
          input: {
            aiRunFieldStatusId: '12', // more than one digit
          },
          expected: 12,
        },
      ]

      test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateComparableAiRunFieldStatusId(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the value names no state', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: '04', // an id is written without a leading zero
          },
        },
        {
          input: {
            aiRunFieldStatusId: '4 ', // trailing whitespace
          },
        },
        {
          input: {
            aiRunFieldStatusId: '4abc',
          },
        },
        {
          input: {
            aiRunFieldStatusId: '-4', // an id is not signed
          },
        },
        {
          input: {
            aiRunFieldStatusId: '4.0', // an id is not a decimal
          },
        },
        {
          input: {
            aiRunFieldStatusId: 'missing', // the name of the state, not its id
          },
        },
        {
          input: {
            aiRunFieldStatusId: '',
          },
        },
        {
          input: {
            aiRunFieldStatusId: 4.5, // an id is a whole number
          },
        },
        {
          input: {
            aiRunFieldStatusId: null,
          },
        },
        {
          input: {
            aiRunFieldStatusId: true,
          },
        },
      ]

      test.each(cases)('aiRunFieldStatusId: $input.aiRunFieldStatusId', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateComparableAiRunFieldStatusId(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('.get:AiRunStepCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunFieldOutcomeRecorder.AiRunStepCtor

        expect(received)
          .toBe(AiRunStep) // same reference
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#findAiRunStep()', () => {
    /*
     * The run the guard compares against comes from here, so the row this answers with has to
     * carry the run the step actually belongs to. The two steps read are on two different runs and
     * carry two different step names, so a read that ignored the id it was handed would answer
     * with the wrong run rather than with a row that happens to look right either way.
     */
    describe('when a step carries the id', () => {
      const cases = [
        {
          input: {
            aiRunStepId: 10240004,
          },
          expected: expect.objectContaining({
            id: 10240004,
            AiRunId: 10010004,
            stepIndex: 4,
            stepName: 'drop-disallowed-readings',
          }),
        },
        {
          input: {
            aiRunStepId: 10240010,
          },
          expected: expect.objectContaining({
            id: 10240010,
            AiRunId: 10010003,
            stepIndex: 3,
            stepName: 'read-media',
          }),
        },
      ]

      test.each(cases)('aiRunStepId: $input.aiRunStepId', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = await recorder.findAiRunStep(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * A step id naming nothing is the second half of what the guard has to tell apart, and it is
     * reachable: `ai_run_field_outcomes.ai_run_step_id` carries no database foreign key, so
     * nothing but this read stands between an id that was never a step and a row hung off it.
     */
    describe('when no step carries the id', () => {
      const cases = [
        {
          // Reserved inside this feature's own id block as a step that is never created
          input: {
            aiRunStepId: 10229003,
          },
        },
        {
          input: {
            aiRunStepId: 10229004,
          },
        },
      ]

      test.each(cases)('aiRunStepId: $input.aiRunStepId', async ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = await recorder.findAiRunStep(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#belongsToAiRun()', () => {
    /*
     * The step arrives as a literal rather than as a row read back, because the reading that has
     * to be covered is the one no SQLite read can produce: Sequelize hands a `BIGINT` back as a
     * number here and as text on MariaDB, and the id the caller states may itself have come
     * through a query string. A pair that matches has to keep matching in every one of those
     * combinations, or the guard would refuse calls that are correct.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            aiRunStep: {
              AiRunId: 10010004,
            },
            aiRunId: 10010004,
          },
        },
        {
          input: {
            aiRunStep: {
              AiRunId: '10010003', // as MariaDB hands a BIGINT back
            },
            aiRunId: 10010003,
          },
        },
        {
          input: {
            aiRunStep: {
              AiRunId: 10010005,
            },
            aiRunId: '10010005', // as a request hands one in
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.belongsToAiRun(input)

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * The crossed pair is the first two cases: a step that exists, a run that exists, and the step
     * belonging to the other one. The last three are the pairs that cannot be compared at all — a
     * run stated as nothing, a run stated in a form that names no run, and a step carrying no run
     * — and each is refused rather than let through, because a comparison that could not be made
     * is not a comparison that succeeded.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            aiRunStep: {
              AiRunId: 10010004,
            },
            aiRunId: 10010003, // the step is a step of the other run
          },
        },
        {
          input: {
            aiRunStep: {
              AiRunId: 10010006,
            },
            aiRunId: 10010001, // the step is a step of the other run
          },
        },
        {
          input: {
            aiRunStep: {
              AiRunId: 10010005,
            },
            aiRunId: null,
          },
        },
        {
          input: {
            aiRunStep: {
              AiRunId: 10010002,
            },
            aiRunId: '10010002 ', // trailing whitespace names no run
          },
        },
        {
          input: {
            aiRunStep: {
              AiRunId: null,
            },
            aiRunId: 10010004,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.belongsToAiRun(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#generateComparableAiRunId()', () => {
    describe('when the id is a number', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010004,
          },
          expected: 10010004,
        },
        {
          input: {
            aiRunId: 1,
          },
          expected: 1,
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateComparableAiRunId(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * A `BIGINT` reaches here as text from MariaDB and from a request alike, and it names the same
     * run either way.
     */
    describe('when the id arrived as text', () => {
      const cases = [
        {
          input: {
            aiRunId: '10010003',
          },
          expected: 10010003,
        },
        {
          input: {
            aiRunId: '7',
          },
          expected: 7,
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateComparableAiRunId(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the value names no run', () => {
      const cases = [
        {
          input: {
            aiRunId: '010010004', // an id is written without a leading zero
          },
        },
        {
          input: {
            aiRunId: '10010004 ', // trailing whitespace
          },
        },
        {
          input: {
            aiRunId: '10010004abc',
          },
        },
        {
          input: {
            aiRunId: '-10010004', // an id is not signed
          },
        },
        {
          input: {
            aiRunId: '10010004.0', // an id is not a decimal
          },
        },
        {
          input: {
            aiRunId: '0', // no row carries id zero
          },
        },
        {
          input: {
            aiRunId: 'run-key-10010004', // the key of the run, not its id
          },
        },
        {
          input: {
            aiRunId: '',
          },
        },
        {
          input: {
            aiRunId: 10010004.5, // an id is a whole number
          },
        },
        {
          input: {
            aiRunId: null,
          },
        },
        {
          input: {
            aiRunId: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = recorder.generateComparableAiRunId(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
