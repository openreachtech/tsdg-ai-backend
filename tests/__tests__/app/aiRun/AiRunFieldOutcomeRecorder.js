import AiRunFieldOutcomeRecorder from '../../../../app/aiRun/AiRunFieldOutcomeRecorder.js'

import AiRunFieldOutcome from '../../../../sequelize/models/AiRunFieldOutcome.js'

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
  })
})
