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
 *
 * `10350001` upward is the third audit round's block, and it is spoken for here the same way: the
 * ids below name runs nothing creates. What that round found is the half of the guard that had
 * never been asked — which of the values name the status — so the members added to this file read
 * `options.attributes` rather than the `where`, and the key spellings are what vary across their
 * cases. `10350101` upward is the same round's block in
 * `tests/_orders/AiRun/AiRunStatusRecorder.js`, where the rows do exist.
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
     * The same question asked of the other name the column answers to, which is the spelling that
     * walked a canceled run back to running.
     *
     * `Model.update()` hands this hook the caller's own keys and maps attribute names to column
     * names afterwards, so `ai_run_status_id` reaches here unconverted and reaches the `SET`
     * clause unconverted too. A member comparing keys against the string `'AiRunStatusId'`
     * answered false to every case below and let the whole guard be skipped.
     */
    describe('should be truthy when the values spell the status as its column name', () => {
      const cases = [
        {
          input: {
            options: {
              attributes: {
                ai_run_status_id: 2, // AI_RUN_STATUS.RUNNING.ID
                started_at: new Date('2026-10-09T06:06:06.006Z'),
              },
              where: {
                id: 10350001,
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                ai_run_status_id: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              },
              where: {
                id: 10350002,
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

      test.each(cases)('ai_run_status_id: $input.options.attributes.ai_run_status_id', ({
        input,
      }) => {
        const received = AiRun.writesAiRunStatusInBulk(input)

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * Both names at once, which is the shape a caller reaches for when one spelling was refused.
     *
     * Either key alone is the status, so carrying both is the status twice over. The cases are
     * here because an implementation answering on the first key it recognizes, or on the last,
     * would still answer right for one of them and wrong for the other.
     */
    describe('should be truthy when the values carry both names of the status', () => {
      const cases = [
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
                ai_run_status_id: 4, // AI_RUN_STATUS.FAILED.ID, under the other name
              },
              where: {
                id: 10350011,
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                ai_run_status_id: 5, // AI_RUN_STATUS.CANCELED.ID — stated first this time
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
                canceled_at: new Date('2026-10-09T06:06:07.007Z'),
              },
              where: {
                id: 10350012,
              },
            },
          },
        },
      ]

      test.each(cases)('where.id: $input.options.where.id', ({
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
     *
     * The last two cases are the other half of the column-name question: a field name that is not
     * the status resolves to an attribute that is not the status, and a key that resolves to no
     * attribute at all is not the status either — it is refused a step earlier, by
     * `.writesUnrecognizedFieldInBulk()`, and this member is not what refuses it.
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
        {
          label: 'field names, none of them the status',
          input: {
            options: {
              attributes: {
                engine_label: 'engine-label-of-the-loop-that-answered',
                finished_at: new Date('2026-10-09T06:06:08.008Z'),
              },
              where: {
                id: 10350021,
              },
            },
          },
        },
        {
          label: 'a key this model declares no attribute for',
          input: {
            options: {
              attributes: {
                ai_run_status: 2, // AI_RUN_STATUS.RUNNING.ID, under a name no column carries
              },
              where: {
                id: 10350022,
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
  describe('.writesUnrecognizedFieldInBulk()', () => {
    /*
     * The question asked before the status is asked about.
     *
     * A key this model declares no attribute for is one no guard reading this model's attributes
     * can judge: `Utils.mapValueFieldNames()` passes it into the `SET` clause exactly as the
     * caller wrote it, so whatever it spells is asked of the database unexamined. The refusal that
     * follows from true is raised for any such key, and not only for one that looks like a status.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          label: 'a key naming no column of this table',
          input: {
            options: {
              attributes: {
                not_a_field_at_all: 1,
              },
              where: {
                id: 10350031,
              },
            },
          },
        },
        {
          label: 'a near-miss of the status column',
          input: {
            options: {
              attributes: {
                ai_run_status: 2, // AI_RUN_STATUS.RUNNING.ID
              },
              where: {
                id: 10350032,
              },
            },
          },
        },
        {
          label: 'one unknown key beside two this model declares',
          input: {
            options: {
              attributes: {
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                finished_at: new Date('2026-10-09T06:06:09.009Z'),
                ai_runs_status_id: 3, // AI_RUN_STATUS.SUCCEEDED.ID, under a misspelled name
              },
              where: {
                id: 10350033,
              },
            },
          },
        },
        {
          label: 'a name carried by Object.prototype rather than by this model',
          input: {
            options: {
              attributes: {
                constructor: 'the name a plain property read would have answered',
              },
              where: {
                id: 10350034,
              },
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRun.writesUnrecognizedFieldInBulk(input)

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * Both names of a column are names this model declares, so neither is refused here — the
     * status is refused by the member above, under its own rule, and every other attribute is
     * written. The timestamp is the case that proves the question is not merely about the
     * attributes this file's own tests write: `Model.update()` adds `updatedAt` to the values
     * before the hook runs, so a member answering true for it would refuse every bulk update this
     * service makes.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          label: 'attribute names',
          input: {
            options: {
              attributes: {
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
                startedAt: new Date('2026-10-09T06:06:10.010Z'),
              },
              where: {
                id: 10350041,
              },
            },
          },
        },
        {
          label: 'field names',
          input: {
            options: {
              attributes: {
                ai_run_status_id: 2, // AI_RUN_STATUS.RUNNING.ID
                started_at: new Date('2026-10-09T06:06:11.011Z'),
              },
              where: {
                id: 10350042,
              },
            },
          },
        },
        {
          label: 'the timestamp Sequelize adds to every bulk update',
          input: {
            options: {
              attributes: {
                contentPurgedAt: new Date('2026-11-09T06:06:12.012Z'),
                updatedAt: new Date('2026-11-09T06:06:12.012Z'),
              },
              where: {
                id: 10350043,
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
                id: 10350044,
              },
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRun.writesUnrecognizedFieldInBulk(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRun', () => {
  describe('.extractWrittenFieldNames()', () => {
    /*
     * The keys as the caller wrote them, which is the only form they exist in at this point.
     *
     * Nothing is converted here on purpose: converting would decide the question the two members
     * above ask, and each of them asks it of `rawAttributes` instead. Options carrying no values
     * answer none, which is a call that writes nothing.
     */
    describe('should answer the keys the values carry', () => {
      const cases = [
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
                startedAt: new Date('2026-10-09T06:06:13.013Z'),
              },
              where: {
                id: 10350051,
              },
            },
          },
          expected: [
            'AiRunStatusId',
            'startedAt',
          ],
        },
        {
          input: {
            options: {
              attributes: {
                ai_run_status_id: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                not_a_field_at_all: 1,
              },
              where: {
                id: 10350052,
              },
            },
          },
          expected: [
            'ai_run_status_id',
            'not_a_field_at_all',
          ],
        },
      ]

      test.each(cases)('where.id: $input.options.where.id', ({
        input,
        expected,
      }) => {
        const received = AiRun.extractWrittenFieldNames(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the options name no values at all', () => {
      const cases = [
        {
          label: 'attributes absent',
          input: {
            options: {
              // attributes: the options of a call that named no values
              where: {
                id: 10350053,
              },
            },
          },
        },
        {
          label: 'attributes carrying nothing',
          input: {
            options: {
              attributes: {},
              where: {
                id: 10350054,
              },
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRun.extractWrittenFieldNames(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRun', () => {
  describe('.extractAiRunAttributeName()', () => {
    /*
     * The two names a column answers to, put to the model rather than to a string.
     *
     * An attribute's own name answers itself, and the `field` it maps to answers the attribute.
     * The timestamps are included because `Model.update()` adds one of them to the values before
     * the hook runs, so they are names a caller never wrote and the guard still has to place.
     */
    describe('should answer the attribute the key names', () => {
      const cases = [
        {
          input: {
            fieldName: 'AiRunStatusId',
          },
          expected: 'AiRunStatusId',
        },
        {
          input: {
            fieldName: 'ai_run_status_id',
          },
          expected: 'AiRunStatusId',
        },
        {
          input: {
            fieldName: 'engine_label',
          },
          expected: 'engineLabel',
        },
        {
          input: {
            fieldName: 'contentPurgedAt',
          },
          expected: 'contentPurgedAt',
        },
        {
          input: {
            fieldName: 'content_purged_at',
          },
          expected: 'contentPurgedAt',
        },
        {
          input: {
            fieldName: 'id',
          },
          expected: 'id',
        },
        {
          input: {
            fieldName: 'updated_at',
          },
          expected: 'updatedAt',
        },
      ]

      test.each(cases)('fieldName: $input.fieldName', ({
        input,
        expected,
      }) => {
        const received = AiRun.extractAiRunAttributeName(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * Anything else answers null, and null is what the caller above turns into a refusal.
     *
     * The last two are the reason the own-key test is there rather than a plain property read:
     * every object carries `constructor` and `toString` through `Object.prototype`, so a key
     * spelling one of them would have resolved to something that is no attribute of this table.
     */
    describe('when the key names no attribute', () => {
      const cases = [
        {
          input: {
            fieldName: 'not_a_field_at_all',
          },
        },
        {
          input: {
            fieldName: 'ai_run_status',
          },
        },
        {
          input: {
            fieldName: 'airunstatusid',
          },
        },
        {
          input: {
            fieldName: 'constructor',
          },
        },
        {
          input: {
            fieldName: 'toString',
          },
        },
      ]

      test.each(cases)('fieldName: $input.fieldName', ({
        input,
      }) => {
        const received = AiRun.extractAiRunAttributeName(input)

        expect(received)
          .toBeNull()
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
