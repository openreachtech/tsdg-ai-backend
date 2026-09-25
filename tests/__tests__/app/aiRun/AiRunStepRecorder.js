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

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejections()', () => {
    /*
     * What the column is for, passing through whole.
     *
     * A shaper that answered null to everything would satisfy every case built only out of what
     * must not be stored, so what a rejection actually is - a field path, a reason code, and
     * figures that are numbers - is asserted in full here, before anything is taken away anywhere
     * below.
     */
    describe('when every entry is one the column may carry', () => {
      const cases = [
        {
          input: {
            rejections: [
              {
                fieldPath: 'subject.alpha',
                reasonCode: 'below_agreement_threshold',
                figures: {
                  agreedReadingCount: 1,
                  totalReadingCount: 3,
                },
              },
              {
                fieldPath: 'subject.beta',
                reasonCode: 'reading_too_long',
                figures: {
                  readingLength: 641,
                },
              },
            ],
          },
          expected: [
            {
              fieldPath: 'subject.alpha',
              reasonCode: 'below_agreement_threshold',
              figures: {
                agreedReadingCount: 1,
                totalReadingCount: 3,
              },
            },
            {
              fieldPath: 'subject.beta',
              reasonCode: 'reading_too_long',
              figures: {
                readingLength: 641,
              },
            },
          ],
        },
        {
          input: {
            rejections: [
              {
                fieldPath: 'subject.gamma',
                reasonCode: 'no_reading_settled',
                figures: null,
              },
            ],
          },
          expected: [
            {
              fieldPath: 'subject.gamma',
              reasonCode: 'no_reading_settled',
              figures: null,
            },
          ],
        },
      ]

      test.each(cases)('rejections[0].fieldPath: $input.rejections.0.fieldPath', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejections(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejections()', () => {
    /*
     * The first of the two payloads a security audit stored verbatim: a rejection carrying the
     * value it rejected, beside the length of that value.
     *
     * The entry is otherwise exactly what the column is for, which is what let it reach the row -
     * nothing about it reads as wrong until the value is. It is dropped and the step keeps its
     * rejection, because the field path and the reason code are the decision this trace is kept
     * two years to answer for, and the key beside them was never part of it.
     */
    describe('when an entry carries more than the column is for', () => {
      const cases = [
        {
          input: {
            rejections: [
              {
                fieldPath: 'attributes.ownerNote',
                reasonCode: 'value-over-max-length',
                value: 'Owner: Jane Doe, 090-1234-5678, jane.doe@example.com',
                figures: {
                  valueLength: 51,
                },
              },
            ],
          },
          expected: [
            {
              fieldPath: 'attributes.ownerNote',
              reasonCode: 'value-over-max-length',
              figures: {
                valueLength: 51,
              },
            },
          ],
        },
        {
          input: {
            rejections: [
              {
                fieldPath: 'attributes.contractNote',
                reasonCode: 'reading-unreadable',
                value: 'contract 7788, tenant Jane Doe',
                mediumText: 'RAW MEDIUM TEXT: contract 7788, tenant Jane Doe',
                figures: {
                  valueLength: 30,
                },
              },
              {
                fieldPath: 'attributes.tenantNote',
                reasonCode: 'below_agreement_threshold',
                readings: [
                  'Jane Doe',
                  'J. Doe',
                ],
                figures: {
                  agreedReadingCount: 1,
                  totalReadingCount: 3,
                },
              },
            ],
          },
          expected: [
            {
              fieldPath: 'attributes.contractNote',
              reasonCode: 'reading-unreadable',
              figures: {
                valueLength: 30,
              },
            },
            {
              fieldPath: 'attributes.tenantNote',
              reasonCode: 'below_agreement_threshold',
              figures: {
                agreedReadingCount: 1,
                totalReadingCount: 3,
              },
            },
          ],
        },
      ]

      test.each(cases)('rejections[0].fieldPath: $input.rejections.0.fieldPath', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejections(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejections()', () => {
    /*
     * The second of the two payloads a security audit stored verbatim: a bare string, where an
     * array of rejections is the only thing this column was ever for.
     *
     * Nothing in a string names a field or gives a reason, so there is no rejection in it to keep
     * and none is invented. The answer is the null this nullable column already carries for a step
     * that dropped nothing.
     */
    describe('when it is not an array', () => {
      /** @type {Array<{ input: { rejections: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            rejections: 'RAW MEDIUM TEXT: contract 7788, tenant Jane Doe',
          },
        },
        {
          input: {
            rejections: 'attributes.ownerNote', // a field path, alone
          },
        },
        {
          input: {
            rejections: 100001, // a count of what was dropped, in place of what was dropped
          },
        },
        {
          input: {
            rejections: true,
          },
        },
        {
          input: {
            rejections: null,
          },
        },
        {
          input: {
            // rejections: undefined
          },
        },
      ])

      test.each(cases)('rejections: $input.rejections', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejections(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejections()', () => {
    /*
     * One rejection, where an array of them was expected. It is not unwrapped and kept: the column
     * says "these are the rejections", not "this is one of them", and a caller that sent the wrong
     * container has shown no sign of knowing which of the two it meant.
     */
    describe('when it is one rejection rather than an array of them', () => {
      const cases = [
        {
          input: {
            rejections: {
              fieldPath: 'attributes.ownerNote',
              reasonCode: 'value-over-max-length',
              figures: {
                valueLength: 51,
              },
            },
          },
        },
        {
          input: {
            rejections: {
              fieldPath: 'attributes.contractNote',
              reasonCode: 'reading-unreadable',
              figures: {
                valueLength: 30,
              },
            },
          },
        },
      ]

      test.each(cases)('rejections.fieldPath: $input.rejections.fieldPath', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejections(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejections()', () => {
    /*
     * An array that held nothing the column may carry answers the same null as no array at all,
     * rather than an empty array. Two ways of writing "this step dropped nothing" into one column
     * would leave every later reader deciding which of the two it was looking at.
     */
    describe('when no entry is one the column may carry', () => {
      /** @type {Array<{ input: { rejections: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            rejections: [
              'RAW MEDIUM TEXT: contract 7788, tenant Jane Doe',
            ],
          },
        },
        {
          input: {
            rejections: [
              100002, // a count, where a rejection was expected
            ],
          },
        },
        {
          input: {
            rejections: [
              null,
            ],
          },
        },
        {
          input: {
            rejections: [],
          },
        },
      ])

      test.each(cases)('rejections[0]: $input.rejections.0', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejections(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejection()', () => {
    /*
     * One entry, carrying the three keys and nothing else, is kept as it stands - including the
     * entry that names its figures null, and the entry that names no figures at all. Both of those
     * are a step saying "I dropped this field for this reason, and there was nothing to count",
     * which is a rejection like any other.
     */
    describe('when the entry carries the three keys and nothing else', () => {
      const cases = [
        {
          input: {
            rejection: {
              fieldPath: 'subject.alpha',
              reasonCode: 'below_agreement_threshold',
              figures: {
                agreedReadingCount: 1,
                totalReadingCount: 3,
              },
            },
          },
          expected: {
            fieldPath: 'subject.alpha',
            reasonCode: 'below_agreement_threshold',
            figures: {
              agreedReadingCount: 1,
              totalReadingCount: 3,
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: 'subject.beta',
              reasonCode: 'no_reading_settled',
              figures: null,
            },
          },
          expected: {
            fieldPath: 'subject.beta',
            reasonCode: 'no_reading_settled',
            figures: null,
          },
        },
        {
          input: {
            rejection: {
              fieldPath: 'subject.gamma',
              reasonCode: 'reading_too_long',
              // figures: undefined
            },
          },
          expected: {
            fieldPath: 'subject.gamma',
            reasonCode: 'reading_too_long',
            figures: null,
          },
        },
      ]

      test.each(cases)('rejection.fieldPath: $input.rejection.fieldPath', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejection(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejection()', () => {
    /*
     * The entry a security audit got through, and the shapes around it.
     *
     * The three keys are read off one at a time into an object of this class's own, so a fourth
     * key has nowhere to travel however it is named - `value`, the medium it was read out of, the
     * readings that disagreed. None of those is a decision, all of them are content, and content
     * is purged at thirty days while this row is kept for seven hundred and thirty.
     */
    describe('when the entry carries more than the three keys', () => {
      const cases = [
        {
          input: {
            rejection: {
              fieldPath: 'attributes.ownerNote',
              reasonCode: 'value-over-max-length',
              value: 'Owner: Jane Doe, 090-1234-5678, jane.doe@example.com',
              figures: {
                valueLength: 51,
              },
            },
          },
          expected: {
            fieldPath: 'attributes.ownerNote',
            reasonCode: 'value-over-max-length',
            figures: {
              valueLength: 51,
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: 'attributes.contractNote',
              reasonCode: 'reading-unreadable',
              mediumText: 'RAW MEDIUM TEXT: contract 7788, tenant Jane Doe',
              mediumUrl: 'https://media.development.invalid/contracts/7788.pdf',
              figures: null,
            },
          },
          expected: {
            fieldPath: 'attributes.contractNote',
            reasonCode: 'reading-unreadable',
            figures: null,
          },
        },
        {
          input: {
            rejection: {
              fieldPath: 'attributes.tenantNote',
              reasonCode: 'below_agreement_threshold',
              readings: [
                'Jane Doe',
                'J. Doe',
                'Jane D.',
              ],
              figures: {
                agreedReadingCount: 1,
                totalReadingCount: 3,
              },
            },
          },
          expected: {
            fieldPath: 'attributes.tenantNote',
            reasonCode: 'below_agreement_threshold',
            figures: {
              agreedReadingCount: 1,
              totalReadingCount: 3,
            },
          },
        },
      ]

      test.each(cases)('rejection.fieldPath: $input.rejection.fieldPath', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejection(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejection()', () => {
    /*
     * An entry that names no field is dropped whole rather than kept as a husk of the rest. A
     * rejection is the pairing of a field path with a reason, and half of it records no decision
     * anybody can read two years from now.
     *
     * A field path that is not a string is the same case, and it is the one that matters most: an
     * object under `fieldPath` is a second way into the column for whatever it holds, and the
     * reason a type is checked here rather than a presence.
     */
    describe('when the entry names no field', () => {
      /** @type {Array<{ input: { rejection: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            rejection: {
              // fieldPath: undefined
              reasonCode: 'value-over-max-length',
              figures: {
                valueLength: 51,
              },
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: null,
              reasonCode: 'reading-unreadable',
              figures: null,
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: 100001, // an index of the field, in place of its path
              reasonCode: 'no_reading_settled',
              figures: null,
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: {
                ownerNote: 'Owner: Jane Doe, 090-1234-5678, jane.doe@example.com',
              },
              reasonCode: 'below_agreement_threshold',
              figures: null,
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: [
                'attributes',
                'ownerNote',
              ],
              reasonCode: 'reading_too_long',
              figures: null,
            },
          },
        },
      ])

      test.each(cases)('rejection.reasonCode: $input.rejection.reasonCode', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejection(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejection()', () => {
    /*
     * An entry that gives no reason is dropped for the same reason as one that names no field: a
     * field path alone says something was dropped without saying why, which is the half of the
     * record an operator asking why a run returned no value for a field came here to read.
     */
    describe('when the entry gives no reason', () => {
      /** @type {Array<{ input: { rejection: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            rejection: {
              fieldPath: 'attributes.ownerNote',
              // reasonCode: undefined
              figures: {
                valueLength: 51,
              },
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: 'attributes.contractNote',
              reasonCode: null,
              figures: null,
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: 'attributes.tenantNote',
              reasonCode: 100002, // a code as a number, where the column holds a string
              figures: null,
            },
          },
        },
        {
          input: {
            rejection: {
              fieldPath: 'attributes.subjectNote',
              reasonCode: {
                text: 'the model answered with the tenant name, Jane Doe',
              },
              figures: null,
            },
          },
        },
      ])

      test.each(cases)('rejection.fieldPath: $input.rejection.fieldPath', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejection(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejection()', () => {
    /*
     * An entry that is not an object at all - the bare string a security audit got through, among
     * the rest. It is read for the two keys it does not have, and dropped for not having them.
     */
    describe('when the entry is not an object', () => {
      /** @type {Array<{ input: { rejection: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            rejection: 'RAW MEDIUM TEXT: contract 7788, tenant Jane Doe',
          },
        },
        {
          input: {
            rejection: 'attributes.ownerNote', // a field path, alone
          },
        },
        {
          input: {
            rejection: 100003,
          },
        },
        {
          input: {
            rejection: true,
          },
        },
        {
          input: {
            rejection: null,
          },
        },
        {
          input: {
            // rejection: undefined
          },
        },
      ])

      test.each(cases)('rejection: $input.rejection', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejection(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejection()', () => {
    /*
     * An entry nested inside arrays of its own.
     *
     * This is the shape that reached the write as a forty-thousand-deep array and came back out of
     * it as a `RangeError` nobody could catch by name. Nothing here walks what it is given: the
     * two keys are read one level deep and the entry is dropped for not carrying them, so the
     * depth the caller chose is never a depth this class descends. The cases below are written
     * three levels deep because a test file may hold no loop to build a deeper one, and the code
     * path they take is the one a deeper array takes.
     */
    describe('when the entry is an array of its own', () => {
      /** @type {Array<{ input: { rejection: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            rejection: [
              [
                [
                  'alpha',
                ],
              ],
            ],
          },
        },
        {
          input: {
            rejection: [
              [
                [
                  'beta',
                ],
              ],
            ],
          },
        },
      ])

      test.each(cases)('rejection[0][0][0]: $input.rejection.0.0.0', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableRejection(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableFigures()', () => {
    /*
     * Figures that are numbers are kept as they stand, whatever they count.
     *
     * Zero and a negative are in the set deliberately: a figure is kept for being a number, not for
     * being a number somebody would notice, and a check written on truthiness would drop a length
     * of zero - which is exactly the figure a field rejected for being empty carries.
     */
    describe('when every figure is a number', () => {
      const cases = [
        {
          input: {
            figures: {
              valueLength: 51,
            },
          },
          expected: {
            valueLength: 51,
          },
        },
        {
          input: {
            figures: {
              valueLength: 641,
              agreedReadingCount: 1,
              totalReadingCount: 3,
            },
          },
          expected: {
            valueLength: 641,
            agreedReadingCount: 1,
            totalReadingCount: 3,
          },
        },
        {
          input: {
            figures: {
              valueLength: 0, // the field was rejected for being empty
            },
          },
          expected: {
            valueLength: 0,
          },
        },
        {
          input: {
            figures: {
              valueLength: -1, // the length could not be counted
            },
          },
          expected: {
            valueLength: -1,
          },
        },
        {
          input: {
            figures: {
              valueLength: 1.5,
            },
          },
          expected: {
            valueLength: 1.5,
          },
        },
        {
          input: {
            figures: {
              valueLength: Number.MAX_SAFE_INTEGER,
            },
          },
          expected: {
            valueLength: Number.MAX_SAFE_INTEGER,
          },
        },
      ]

      test.each(cases)('figures.valueLength: $input.figures.valueLength', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableFigures(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableFigures()', () => {
    /*
     * A figure that is not a number is dropped, and the figures around it are kept.
     *
     * This is the narrowest place the audit's payload could have travelled: the length of the value
     * was welcome, the value sat beside it under a name of the caller's choosing, and a check on
     * the keys alone would have carried it through. A number is the one thing that cannot hold a
     * name, an address or a sentence read out of a medium, so the value is what is checked.
     *
     * `NaN` and `Infinity` go with the rest because neither survives JSON as itself - each would
     * land in the column as a null nobody derived.
     */
    describe('when a figure is not a number', () => {
      /** @type {Array<{ input: { figures: * }, expected: * }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            figures: {
              valueLength: 51,
              value: 'Owner: Jane Doe, 090-1234-5678, jane.doe@example.com',
            },
          },
          expected: {
            valueLength: 51,
          },
        },
        {
          input: {
            figures: {
              valueLength: 52,
              value: {
                ownerNote: 'Owner: Jane Doe',
              },
            },
          },
          expected: {
            valueLength: 52,
          },
        },
        {
          input: {
            figures: {
              valueLength: 53,
              value: [
                'Jane Doe',
                'J. Doe',
              ],
            },
          },
          expected: {
            valueLength: 53,
          },
        },
        {
          input: {
            figures: {
              valueLength: 54,
              value: '641', // a number written as a string is still a string
            },
          },
          expected: {
            valueLength: 54,
          },
        },
        {
          input: {
            figures: {
              valueLength: 55,
              value: true,
            },
          },
          expected: {
            valueLength: 55,
          },
        },
        {
          input: {
            figures: {
              valueLength: 56,
              value: null,
            },
          },
          expected: {
            valueLength: 56,
          },
        },
        {
          input: {
            figures: {
              valueLength: 57,
              value: NaN,
            },
          },
          expected: {
            valueLength: 57,
          },
        },
        {
          input: {
            figures: {
              valueLength: 58,
              value: Infinity,
            },
          },
          expected: {
            valueLength: 58,
          },
        },
        {
          input: {
            figures: {
              valueLength: 59,
              value: -Infinity,
            },
          },
          expected: {
            valueLength: 59,
          },
        },
      ])

      test.each(cases)('figures.valueLength: $input.figures.valueLength', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableFigures(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableFigures()', () => {
    /*
     * Figures none of which is a number leave nothing to count, and answer the null the column
     * already carries for a rejection that counted nothing - rather than an empty object, which
     * would say a count was taken and came to nothing.
     */
    describe('when no figure is a number', () => {
      /** @type {Array<{ input: { figures: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            figures: {
              value: 'Owner: Jane Doe, 090-1234-5678, jane.doe@example.com',
            },
          },
        },
        {
          input: {
            figures: {
              value: 'RAW MEDIUM TEXT: contract 7788, tenant Jane Doe',
            },
          },
        },
        {
          input: {
            figures: {
              value: true,
            },
          },
        },
        {
          input: {
            figures: {
              value: null,
            },
          },
        },
        {
          input: {
            figures: {},
          },
        },
      ])

      test.each(cases)('figures.value: $input.figures.value', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableFigures(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableFigures()', () => {
    /*
     * Something that is not an object of figures carries no figure to keep. A string is the case
     * that matters: it is where a caller would put the value it counted, having counted nothing.
     */
    describe('when it is not an object of figures', () => {
      /** @type {Array<{ input: { figures: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            figures: 'Owner: Jane Doe, 090-1234-5678, jane.doe@example.com',
          },
        },
        {
          input: {
            figures: '51', // the length, written as a string
          },
        },
        {
          input: {
            figures: 100001, // a single figure, outside the object it belongs in
          },
        },
        {
          input: {
            figures: true,
          },
        },
        {
          input: {
            figures: null,
          },
        },
        {
          input: {
            // figures: undefined
          },
        },
      ])

      test.each(cases)('figures: $input.figures', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableFigures(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableFigures()', () => {
    /*
     * An array of figures is not an object of figures. It would read back as a set of figures
     * named by their position in the array, which names nothing a later reader could use - and the
     * column is read two years after whoever wrote the array has stopped being asked about it.
     */
    describe('when it is an array', () => {
      /** @type {Array<{ input: { figures: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            figures: [
              51,
            ],
          },
        },
        {
          input: {
            figures: [
              641,
              3,
            ],
          },
        },
      ])

      test.each(cases)('figures[0]: $input.figures.0', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create()

        const received = recorder.buildRecordableFigures(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejections()', () => {
    /*
     * The three channels checkpoint 8's re-audit found still open after the first shaper, and the
     * payload it got through.
     *
     * The first pass held a rejection to three keys, so a fourth had nowhere to travel. The re-audit
     * then put the original payload back through it, moved *inside* the three keys that are kept -
     * a name and an address in the field path, a sentence in the reason code, and a medical status
     * as the name of a figure whose value was a bare `1`. All three were stored verbatim in a
     * column kept seven hundred and thirty days, while the content it describes is purged at thirty.
     *
     * The tell, and the reason this exists: the feature has two `fieldPath`s - one on
     * `ai_run_field_outcomes` and one inside a rejection - and only the first had a shape. Same
     * word, same risk, one guard.
     *
     * Each case names which of the three channels it drives, because a case that failed for the
     * wrong reason would still look green.
     */
    describe('should drop an entry whose text carries what was read', () => {
      const cases = [
        {
          input: {
            rejections: [
              {
                fieldPath: 'Nguyen Van A, 09 Le Loi, phone 0912345678',
                reasonCode: 'she told the clerk her mother is Tran Thi B, born 1954',
                figures: {
                  'diagnosis: hepatitis B carrier': 1,
                },
              },
            ],
          },
          label: 'all three channels at once, the audit payload as it was written',
        },
        {
          input: {
            rejections: [
              {
                fieldPath: 'the owner note says sample person born 1984',
                reasonCode: 'value-over-max-length',
                figures: {
                  valueLength: 51,
                },
              },
            ],
          },
          label: 'the field path alone',
        },
        {
          input: {
            rejections: [
              {
                fieldPath: 'attributes.ownerNote',
                reasonCode: 'she said her phone is 0912345678',
                figures: {
                  valueLength: 51,
                },
              },
            ],
          },
          label: 'the reason code alone',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const recorder = AiRunStepRecorder.create() // Arrange

        const actual = recorder.buildRecordableRejections(input) // Act

        expect(actual) // Assert
          .toBeNull()
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#buildRecordableRejections()', () => {
    /*
     * A figure whose *name* carries what was read is dropped on its own, and the entry around it
     * stands.
     *
     * That asymmetry with the describe above is the method's stated policy rather than an accident:
     * the field path and the reason code are the decision the trace is kept to hold, so an entry
     * that cannot state either is worth nothing and goes whole - while a stray figure beside a
     * sound decision costs only itself. The second case proves the entry is not merely surviving
     * but arriving complete, with its legitimate figure intact.
     */
    describe('should drop only the figure whose name carries what was read', () => {
      const cases = [
        {
          input: {
            rejections: [
              {
                fieldPath: 'attributes.ownerNote',
                reasonCode: 'value-over-max-length',
                figures: {
                  'patient is a carrier': 1,
                  valueLength: 51,
                },
              },
            ],
          },
          expected: [
            {
              fieldPath: 'attributes.ownerNote',
              reasonCode: 'value-over-max-length',
              figures: {
                valueLength: 51,
              },
            },
          ],
          label: 'one figure named for what was read, one counted',
        },
        {
          input: {
            rejections: [
              {
                fieldPath: 'items.0.owner-note',
                reasonCode: 'MEDIA_UNREADABLE',
                figures: {
                  'she is 41 years old': 41,
                  agreedReadingCount: 1,
                  totalReadingCount: 3,
                },
              },
            ],
          },
          expected: [
            {
              fieldPath: 'items.0.owner-note',
              reasonCode: 'MEDIA_UNREADABLE',
              figures: {
                agreedReadingCount: 1,
                totalReadingCount: 3,
              },
            },
          ],
          label: 'a hyphenated path and an index, both legitimate, kept whole',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStepRecorder.create() // Arrange

        const actual = recorder.buildRecordableRejections(input) // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})
