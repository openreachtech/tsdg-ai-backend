import AiRunStepRecorder from '../../../../app/aiRun/AiRunStepRecorder.js'

import AiRunStep from '../../../../sequelize/models/AiRunStep.js'
import AiRunStepCategory from '../../../../sequelize/models/AiRunStepCategory.js'

describe('AiRunStepRecorder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunStepCategoryIdHash', () => {
        const cases = [
          {
            input: {
              aiRunStepCategoryIdHash: {
                code: 100001,
                ai: 100002,
                human: 100003,
              },
            },
            expected: {
              code: 100001,
              ai: 100002,
              human: 100003,
            },
          },
          {
            input: {
              aiRunStepCategoryIdHash: {
                code: 100004,
                ai: 100005,
                human: 100006,
              },
            },
            expected: {
              code: 100004,
              ai: 100005,
              human: 100006,
            },
          },
        ]

        test.each(cases)('code: $input.aiRunStepCategoryIdHash.code', ({
          input,
          expected,
        }) => {
          const recorder = new AiRunStepRecorder(input)

          expect(recorder)
            .toHaveProperty('aiRunStepCategoryIdHash', expected)
        })
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            aiRunStepCategoryIdHash: {
              code: 100001,
              ai: 100002,
              human: 100003,
            },
          },
        },
        {
          input: {
            aiRunStepCategoryIdHash: {
              code: 100004,
              ai: 100005,
              human: 100006,
            },
          },
        },
      ]

      test.each(cases)('code: $input.aiRunStepCategoryIdHash.code', ({
        input,
      }) => {
        const received = AiRunStepRecorder.create(input)

        expect(received)
          .toBeInstanceOf(AiRunStepRecorder)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            aiRunStepCategoryIdHash: {
              code: 100001,
              ai: 100002,
              human: 100003,
            },
          },
          expected: {
            aiRunStepCategoryIdHash: {
              code: 100001,
              ai: 100002,
              human: 100003,
            },
          },
        },
        {
          input: {
            aiRunStepCategoryIdHash: {
              code: 100004,
              ai: 100005,
              human: 100006,
            },
          },
          expected: {
            aiRunStepCategoryIdHash: {
              code: 100004,
              ai: 100005,
              human: 100006,
            },
          },
        },
      ]

      test.each(cases)('code: $input.aiRunStepCategoryIdHash.code', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunStepRecorder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default aiRunStepCategoryIdHash', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunStepRecorder)
        const expected = {
          aiRunStepCategoryIdHash: {
            code: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
            ai: 2, // AI_RUN_STEP_CATEGORY.AI.ID
            human: 3, // AI_RUN_STEP_CATEGORY.HUMAN.ID
          },
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('.get:AiRunStepCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunStepRecorder.AiRunStepCtor

        expect(received)
          .toBe(AiRunStep) // same reference
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('.get:AiRunStepCategoryCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunStepRecorder.AiRunStepCategoryCtor

        expect(received)
          .toBe(AiRunStepCategory) // same reference
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('.buildAiRunStepCategoryIdHash()', () => {
    /*
     * The three categories the master seeds are the whole of the set, so they are enumerated in
     * full rather than sampled. A category the lookup forgot would leave a whole kind of step
     * unrecordable, and the ids are pinned as literals because the point of the lookup is that the
     * pairing of a name to an id is fixed.
     */
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {
          code: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
          ai: 2, // AI_RUN_STEP_CATEGORY.AI.ID
          human: 3, // AI_RUN_STEP_CATEGORY.HUMAN.ID
        }

        const received = AiRunStepRecorder.buildAiRunStepCategoryIdHash()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunStepRecorder,
      },
      {
        tally: class AlphaAiRunStepRecorder extends AiRunStepRecorder {},
      },
      {
        tally: class BetaAiRunStepRecorder extends AiRunStepRecorder {},
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

describe('AiRunStepRecorder', () => {
  describe('#generateAiRunStepCategoryId()', () => {
    /*
     * Two lookups carrying different ids under the same three names, so the answer is shown to come
     * from the lookup the instance was given rather than from a pairing fixed inside the method.
     */
    describe('with a name the lookup carries', () => {
      const cases = [
        {
          input: {
            aiRunStepCategoryIdHash: {
              code: 100001,
              ai: 100002,
              human: 100003,
            },
          },
          stepCategoryNameCases: [
            {
              stepCategoryName: 'code',
              expected: 100001,
            },
            {
              stepCategoryName: 'ai',
              expected: 100002,
            },
            {
              stepCategoryName: 'human',
              expected: 100003,
            },
          ],
        },
        {
          input: {
            aiRunStepCategoryIdHash: {
              code: 100004,
              ai: 100005,
              human: 100006,
            },
          },
          stepCategoryNameCases: [
            {
              stepCategoryName: 'code',
              expected: 100004,
            },
            {
              stepCategoryName: 'ai',
              expected: 100005,
            },
            {
              stepCategoryName: 'human',
              expected: 100006,
            },
          ],
        },
      ]

      describe.each(cases)('code: $input.aiRunStepCategoryIdHash.code', ({
        input,
        stepCategoryNameCases,
      }) => {
        test.each(stepCategoryNameCases)('stepCategoryName: $stepCategoryName', ({
          stepCategoryName,
          expected,
        }) => {
          const recorder = AiRunStepRecorder.create(input)
          const args = {
            stepCategoryName,
          }

          const received = recorder.generateAiRunStepCategoryId(args)

          expect(received)
            .toBe(expected)
        })
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#generateAiRunStepCategoryId()', () => {
    /*
     * The lookup here is the real one, so a name outside it is a name outside the production set.
     *
     * The names that matter beyond a plain unknown one: a category name in the wrong case, a near
     * miss that reads like one of the three, and the keys every object inherits from its prototype.
     * `constructor` and `toString` are the ones that would answer with a function rather than with
     * null if the lookup were read by plain property access, and a function reaching the column
     * would be a value nobody derived, which is what answering null exists to prevent.
     */
    describe('with a name the lookup does not carry', () => {
      /** @type {Array<{ input: { stepCategoryName: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            stepCategoryName: 'model', // reads like a category, and is not one
          },
        },
        {
          input: {
            stepCategoryName: 'human-review', // a near miss on the human category
          },
        },
        {
          input: {
            stepCategoryName: 'CODE', // the right name in the wrong case
          },
        },
        {
          input: {
            stepCategoryName: 'constructor', // a key every object inherits
          },
        },
        {
          input: {
            stepCategoryName: 'toString', // a key every object inherits
          },
        },
        {
          input: {
            stepCategoryName: '', // no name at all
          },
        },
        {
          input: {
            stepCategoryName: 2, // the id, in place of the name
          },
        },
        {
          input: {
            stepCategoryName: null,
          },
        },
        {
          input: {
            stepCategoryName: undefined,
          },
        },
      ])

      test.each(cases)('stepCategoryName: $input.stepCategoryName', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.generateAiRunStepCategoryId(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
