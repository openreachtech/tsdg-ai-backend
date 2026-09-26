import {
  Op,
} from 'sequelize'

import AiRun from '../../../../sequelize/models/AiRun.js'

import AiRunKeyInspector from '../../../../app/aiRun/AiRunKeyInspector.js'

/*
 * The bulk-update guard asked without a row and without a write.
 *
 * Every member below is handed what `beforeBulkUpdate` is handed — the options, or the `where`
 * inside them — so each shape of condition can be stated in full here, including the ones no
 * caller in this application writes. The runs named in the conditions are never created: these
 * members compile a condition and read no table. What the guard does to a settled row is asked
 * separately, in `tests/_orders/AiRun/AiRunStatusRecorder.js`, because that question needs the row.
 *
 * The emitted predicates asserted below are written out as text rather than derived, and they are
 * the same text under both dialects this repository runs on: `sequelize@6.37.8` renders this
 * condition identically for `sqlite` and for `mariadb`.
 */

describe('AiRun', () => {
  describe('.get:sequelizeOperators', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRun.sequelizeOperators

        expect(received)
          .toBe(Op) // same reference
      })
    })
  })
})

describe('AiRun', () => {
  describe('.writesAiRunStatusInBulk()', () => {
    /*
     * The one question this member answers: do the values name the status.
     *
     * It reads `options.attributes` and nothing else, which is why every case below carries a
     * `where` that proves nothing — an implementation consulting the condition would answer the
     * wrong thing for all three.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
                startedAt: new Date('2026-10-09T01:01:01.001Z'),
              },
              where: {
                id: 10340001,
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                resultBody: '{"fields":[{"fieldPath":"subject.alpha"}]}',
                finishedAt: new Date('2026-10-09T02:02:02.002Z'),
              },
              where: {
                id: 10340002,
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              },
              where: {
                id: 10340003,
                AiRunStatusId: {
                  [Op.notIn]: [
                    3, // AI_RUN_STATUS.SUCCEEDED.ID
                    4, // AI_RUN_STATUS.FAILED.ID
                    5, // AI_RUN_STATUS.CANCELED.ID
                  ],
                },
              },
            },
          },
        },
      ]

      test.each(cases)('AiRunStatusId: $input.options.attributes.AiRunStatusId', ({
        input,
      }) => {
        const received = AiRun.writesAiRunStatusInBulk(input)

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * A write that names no status moves no status, whatever its condition says. The retention
     * sweep is the caller that depends on this: it stamps `content_purged_at` on runs that
     * finished long ago, so every row it matches is settled by definition.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          label: 'the retention sweep, naming no status',
          input: {
            options: {
              attributes: {
                requestBody: null,
                resultBody: null,
                contentPurgedAt: new Date('2026-11-09T04:04:04.004Z'),
              },
              where: {
                id: 10340004,
              },
            },
          },
        },
        {
          label: 'one field that is no status',
          input: {
            options: {
              attributes: {
                engineLabel: 'engine-label-of-the-loop-that-answered',
              },
              where: {
                id: 10340005,
              },
            },
          },
        },
        {
          label: 'options naming no values at all',
          input: {
            options: {
              // attributes: the options of a call that named no values
              where: {
                id: 10340006,
              },
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRun.writesAiRunStatusInBulk(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRun', () => {
  describe('.buildProvenUnsettledAiRunCondition()', () => {
    /*
     * The condition a bulk status write is made under, which is this model's own object and never
     * the caller's.
     *
     * What is compared is the text the query generator emits for the two, so the answer is the
     * built condition when the caller stated that same condition — which is what
     * `AiRunStatusRecorder#buildUnsettledAiRunCondition()` states.
     */
    describe('when the condition is the one this model builds', () => {
      const cases = [
        {
          input: {
            where: {
              id: 10340011,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
          expected: {
            id: 10340011,
            AiRunStatusId: {
              [Op.notIn]: [
                3, // AI_RUN_STATUS.SUCCEEDED.ID
                4, // AI_RUN_STATUS.FAILED.ID
                5, // AI_RUN_STATUS.CANCELED.ID
              ],
            },
          },
        },
        {
          input: {
            where: {
              id: '10340012', // the id as a medium carrying no numbers hands it over
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
          expected: {
            id: '10340012',
            AiRunStatusId: {
              [Op.notIn]: [
                3, // AI_RUN_STATUS.SUCCEEDED.ID
                4, // AI_RUN_STATUS.FAILED.ID
                5, // AI_RUN_STATUS.CANCELED.ID
              ],
            },
          },
        },
      ]

      test.each(cases)('where.id: $input.where.id', ({
        input,
        expected,
      }) => {
        const received = AiRun.buildProvenUnsettledAiRunCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * Everything else, which is the refusal.
     *
     * The first of them is the shape that walked a canceled run back to running after the previous
     * guard was written: the sibling `Op.and` carried on a **prototype**, which answers no own
     * symbol to a reader counting them and is compiled into the statement all the same — what the
     * database is asked narrows the status to `>= 1` and carries no `NOT IN` at all. The siblings
     * stated as own keys are here too, refused as they were before.
     *
     * Then the shapes refused although they would have been safe: the same statuses in another
     * order, a superset of them, a further condition beside the exclusion, the two keys stated the
     * other way round. Sorting those from the unsafe ones would mean predicting the query
     * compiler, which is what failed twice; the cost is a refusal naming the class to go through.
     *
     * And one that is neither: a `where` whose *value* carries the words of the exclusion. It is
     * rendered inside quotes and against the column that held it, so a comparison of whole
     * renderings never mistakes it for the exclusion itself.
     *
     * A condition object is keyed by symbols, which no test title can interpolate, so each case
     * carries a label saying what it is.
     */
    describe('when the condition states something else', () => {
      const cases = [
        {
          label: 'an Op.and carried on a prototype',
          input: {
            where: {
              id: 10340021,
              AiRunStatusId: Object.create(
                {
                  [Op.and]: [
                    {
                      [Op.gte]: 1, // AI_RUN_STATUS.QUEUED.ID — inherited, and compiled all the same
                    },
                  ],
                },
                {
                  [Op.notIn]: {
                    value: [
                      3, // AI_RUN_STATUS.SUCCEEDED.ID
                      4, // AI_RUN_STATUS.FAILED.ID
                      5, // AI_RUN_STATUS.CANCELED.ID
                    ],
                    enumerable: true,
                  },
                }
              ),
            },
          },
        },
        {
          label: 'an Op.and beside the exclusion',
          input: {
            where: {
              id: 10340022,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
                [Op.and]: [
                  {
                    [Op.gte]: 1, // AI_RUN_STATUS.QUEUED.ID
                  },
                ],
              },
            },
          },
        },
        {
          label: 'an Op.and stated before the exclusion',
          input: {
            where: {
              id: 10340023,
              AiRunStatusId: {
                [Op.and]: [
                  {
                    [Op.gte]: 1, // AI_RUN_STATUS.QUEUED.ID
                  },
                ],
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          label: 'an Op.or beside the exclusion',
          input: {
            where: {
              id: 10340024,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
                [Op.or]: [
                  {
                    [Op.gte]: 1, // AI_RUN_STATUS.QUEUED.ID
                  },
                ],
              },
            },
          },
        },
        {
          label: 'an Op.gte beside the exclusion, which Sequelize keeps',
          input: {
            where: {
              id: 10340025,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
                [Op.gte]: 1, // AI_RUN_STATUS.QUEUED.ID
              },
            },
          },
        },
        {
          label: 'a string key beside the exclusion',
          input: {
            where: {
              id: 10340026,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
                comparator: 1, // a key that is no operator at all
              },
            },
          },
        },
        {
          label: 'the same statuses in another order',
          input: {
            where: {
              id: 10340027,
              AiRunStatusId: {
                [Op.notIn]: [
                  5, // AI_RUN_STATUS.CANCELED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                ],
              },
            },
          },
        },
        {
          label: 'a status excluded on top of the three',
          input: {
            where: {
              id: 10340028,
              AiRunStatusId: {
                [Op.notIn]: [
                  1, // AI_RUN_STATUS.QUEUED.ID
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          label: 'one terminal status excluded of the three',
          input: {
            where: {
              id: 10340029,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID — failed and canceled left in range
                ],
              },
            },
          },
        },
        {
          label: 'the statuses stated as text',
          input: {
            where: {
              id: 10340030,
              AiRunStatusId: {
                [Op.notIn]: [
                  '3', // AI_RUN_STATUS.SUCCEEDED.ID — rendered quoted, and so another list
                  '4', // AI_RUN_STATUS.FAILED.ID
                  '5', // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          label: 'the exclusion on another column',
          input: {
            where: {
              id: 10340031,
              AiRunCategoryId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          label: 'a further condition beside the exclusion',
          input: {
            where: {
              id: 10340032,
              ApiClientId: 10000001,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          label: 'the two keys stated the other way round',
          input: {
            where: {
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
              id: 10340033,
            },
          },
        },
        {
          label: 'the statuses narrowed to rather than away from',
          input: {
            where: {
              id: 10340034,
              AiRunStatusId: {
                [Op.in]: [
                  1, // AI_RUN_STATUS.QUEUED.ID
                  2, // AI_RUN_STATUS.RUNNING.ID
                ],
              },
            },
          },
        },
        {
          label: 'a bare status id',
          input: {
            where: {
              id: 10340035,
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            },
          },
        },
        {
          label: 'the run addressed by its id alone',
          input: {
            where: {
              id: 10340036,
            },
          },
        },
        {
          label: 'a value carrying the words of the exclusion',
          input: {
            where: {
              id: 10340037,
              subjectLabel: 'Subject label AND `ai_runs`.`AiRunStatusId` NOT IN (3, 4, 5)',
            },
          },
        },
        {
          label: 'no run addressed by an id',
          input: {
            where: {
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          label: 'an id that is no id',
          input: {
            where: {
              id: 0,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          label: 'a condition that is no condition',
          input: {
            where: 'ai-run-omega',
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRun.buildProvenUnsettledAiRunCondition(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRun', () => {
  describe('.extractAiRunId()', () => {
    /*
     * The one value this model reads off a caller's condition, and it reads it once: the condition
     * compared and the condition written under are both built out of this answer.
     */
    describe('when the condition addresses a run by its id', () => {
      const cases = [
        {
          input: {
            where: {
              id: 10340051,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
          expected: 10340051,
        },
        {
          input: {
            where: {
              id: '10340052', // the same key, as a medium carrying no numbers hands it over
            },
          },
          expected: '10340052',
        },
      ]

      test.each(cases)('where.id: $input.where.id', ({
        input,
        expected,
      }) => {
        const received = AiRun.extractAiRunId(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * A value that is no key is answered with null, which the caller above turns into the refusal.
     * What holds it to being a key is `AiRunKeyInspector`, the same rule `AiRunStatusRecorder`
     * holds its own `aiRunId` to — so a zero, a negative, a leading zero and anything that is no
     * number at all are refused in both places by one answer.
     */
    describe('when it addresses none this model can use', () => {
      const cases = [
        {
          label: 'a condition naming no id',
          input: {
            where: {
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          label: 'an id of zero',
          input: {
            where: {
              id: 0,
            },
          },
        },
        {
          label: 'a negative id',
          input: {
            where: {
              id: -10340053,
            },
          },
        },
        {
          label: 'an id written with a leading zero',
          input: {
            where: {
              id: '010340054',
            },
          },
        },
        {
          label: 'an id that is no number',
          input: {
            where: {
              id: 'ai-run-omega',
            },
          },
        },
        {
          label: 'an id stated as an object',
          input: {
            where: {
              id: {
                [Op.gte]: 10340055,
              },
            },
          },
        },
        {
          label: 'a condition that is no condition',
          input: {
            where: 10340056,
          },
        },
        {
          label: 'no condition at all',
          input: {
            where: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRun.extractAiRunId(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRun', () => {
  describe('.createAiRunKeyInspector()', () => {
    describe('when called as is', () => {
      test('should be an instance of AiRunKeyInspector', () => {
        const received = AiRun.createAiRunKeyInspector()

        expect(received)
          .toBeInstanceOf(AiRunKeyInspector)
      })
    })
  })
})

describe('AiRun', () => {
  describe('.buildUnsettledAiRunCondition()', () => {
    /*
     * The condition this model can vouch for: the run by its id, every terminal status stated as
     * one the matched row must not carry. The statuses are read from
     * `AiRunTerminalStatusInspector`, which is also where `AiRunStatusRecorder` reads them.
     */
    describe('should build the condition of one unsettled run', () => {
      const cases = [
        {
          input: {
            aiRunId: 10340061,
          },
          expected: {
            id: 10340061,
            AiRunStatusId: {
              [Op.notIn]: [
                3, // AI_RUN_STATUS.SUCCEEDED.ID
                4, // AI_RUN_STATUS.FAILED.ID
                5, // AI_RUN_STATUS.CANCELED.ID
              ],
            },
          },
        },
        {
          input: {
            aiRunId: '10340062',
          },
          expected: {
            id: '10340062',
            AiRunStatusId: {
              [Op.notIn]: [
                3, // AI_RUN_STATUS.SUCCEEDED.ID
                4, // AI_RUN_STATUS.FAILED.ID
                5, // AI_RUN_STATUS.CANCELED.ID
              ],
            },
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
        expected,
      }) => {
        const received = AiRun.buildUnsettledAiRunCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRun', () => {
  describe('.generateEmittedWherePredicate()', () => {
    /*
     * What the query generator makes of a condition, which is the thing the guard compares.
     *
     * The first case is this model's own condition. The second is the same statuses in another
     * order, and its rendering is what says why that one is refused — the text differs, so the
     * comparison does. The third carries no status at all.
     *
     * An attribute is named as the model names it rather than as the column is named, because the
     * mapping between the two happens after this: `Model.update()` maps them on the way to the
     * statement, on whatever `where` the options carry by then.
     */
    describe('when the condition compiles', () => {
      const cases = [
        {
          input: {
            where: {
              id: 10340071,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
          expected: '`ai_runs`.`id` = 10340071 AND `ai_runs`.`AiRunStatusId` NOT IN (3, 4, 5)',
        },
        {
          input: {
            where: {
              id: 10340072,
              AiRunStatusId: {
                [Op.notIn]: [
                  5, // AI_RUN_STATUS.CANCELED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                ],
              },
            },
          },
          expected: '`ai_runs`.`id` = 10340072 AND `ai_runs`.`AiRunStatusId` NOT IN (5, 4, 3)',
        },
        {
          input: {
            where: {
              id: 10340073,
            },
          },
          expected: '`ai_runs`.`id` = 10340073',
        },
      ]

      test.each(cases)('where.id: $input.where.id', ({
        input,
        expected,
      }) => {
        const received = AiRun.generateEmittedWherePredicate(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * A condition the generator refuses to compile is answered with null rather than with an
     * exception, and null is what the caller above turns into the refusal. The exception's own
     * message is built out of the condition, which is a caller's text, and this feature keeps a
     * caller's text out of a log.
     */
    describe('when the condition cannot be compiled', () => {
      const cases = [
        {
          label: 'a condition stated as text',
          input: {
            where: 'ai-run-omega',
          },
        },
        {
          label: 'a condition stated as a boolean',
          input: {
            where: true,
          },
        },
        {
          label: 'a condition stated as an array',
          input: {
            where: [
              10340081,
              10340082,
            ],
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRun.generateEmittedWherePredicate(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
