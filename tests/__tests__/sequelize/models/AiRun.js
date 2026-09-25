import {
  Op,
} from 'sequelize'

import AiRun from '../../../../sequelize/models/AiRun.js'

/*
 * The bulk-update guard asked without a row and without a write.
 *
 * `.writesAiRunStatusInBulk()` is handed the options `beforeBulkUpdate` is handed, so it can be
 * asked here with an options object stated in full — which is what lets every shape of `where` be
 * covered, including the ones no caller in this application writes today. The runs named in the
 * conditions below are never created: the method reads the condition and never the table.
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
     * The one shape that is accepted while writing the status: a `where` naming every terminal
     * status as one the matched rows do not carry. Such an update matches no settled run, so it
     * cannot move a run out of a status a run never leaves, whatever status it writes.
     *
     * The three cases differ in the order the statuses are stated and in what else the condition
     * carries, because none of that is what makes the proof — an implementation comparing the two
     * arrays for equality, or reading only the first entry, passes the first case and fails the
     * others.
     */
    describe('when the condition excludes every terminal status', () => {
      const cases = [
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                resultBody: '{"fields":[{"fieldPath":"subject.alpha"}]}',
                finishedAt: new Date('2026-10-02T01:01:01.001Z'),
              },
              where: {
                id: 10320001,
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
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
                startedAt: new Date('2026-10-02T02:02:02.002Z'),
              },
              where: {
                id: 10320002,
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
        },
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
                finishedAt: new Date('2026-10-02T03:03:03.003Z'),
              },
              where: {
                id: 10320003,
                AiRunStatusId: {
                  [Op.notIn]: [
                    1, // AI_RUN_STATUS.QUEUED.ID — excluded on top of the three
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

      test.each(cases)('where.id: $input.options.where.id', ({
        input,
      }) => {
        const received = AiRun.writesAiRunStatusInBulk(input)

        expect(received)
          .toBeFalsy()
      })
    })

    /*
     * An update that names no status is not this rule's to refuse, however its `where` is written.
     * The retention sweep is the reason: it stamps `content_purged_at` on runs that finished long
     * ago, so by definition every row it matches is settled, and a guard that refused it would
     * turn the retention promise into an error.
     */
    describe('when the update writes no status', () => {
      const cases = [
        {
          input: {
            options: {
              attributes: {
                requestBody: null,
                resultBody: null,
                contentPurgedAt: new Date('2026-11-02T04:04:04.004Z'),
              },
              where: {
                id: 10320004,
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                engineLabel: 'engine-label-of-the-loop-that-answered',
              },
              where: {
                id: 10320005,
                AiRunStatusId: {
                  [Op.notIn]: [
                    3, // AI_RUN_STATUS.SUCCEEDED.ID
                  ],
                },
              },
            },
          },
        },
        {
          input: {
            options: {
              // attributes: the options of a call that named no values at all
              where: {
                id: 10320006,
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
          .toBeFalsy()
      })
    })

    /*
     * Everything short of the proof, which is the refusal that stood here before.
     *
     * A `where` excluding one or two of the three still matches a run settled in the third, and
     * moving that run is the same forbidden move under another name. A `where` that merely mentions
     * the column proves nothing at all — `Op.in` and a bare value both narrow the rows to statuses
     * rather than away from them. And a `where` naming no status leaves every settled run in range.
     */
    describe('when the condition does not exclude every terminal status', () => {
      const cases = [
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
                startedAt: new Date('2026-10-02T05:05:05.005Z'),
              },
              where: {
                id: 10320011,
                AiRunStatusId: {
                  [Op.notIn]: [
                    3, // AI_RUN_STATUS.SUCCEEDED.ID — failed and canceled are left in range
                  ],
                },
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
                startedAt: new Date('2026-10-02T06:06:06.006Z'),
              },
              where: {
                id: 10320012,
                AiRunStatusId: {
                  [Op.notIn]: [
                    3, // AI_RUN_STATUS.SUCCEEDED.ID
                    4, // AI_RUN_STATUS.FAILED.ID — canceled is left in range
                  ],
                },
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                resultBody: '{"fields":[{"fieldPath":"subject.beta"}]}',
                finishedAt: new Date('2026-10-02T07:07:07.007Z'),
              },
              where: {
                id: 10320013,
                AiRunStatusId: {
                  [Op.in]: [
                    1, // AI_RUN_STATUS.QUEUED.ID
                    2, // AI_RUN_STATUS.RUNNING.ID
                  ],
                },
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                resultBody: '{"fields":[{"fieldPath":"subject.gamma"}]}',
                finishedAt: new Date('2026-10-02T08:08:08.008Z'),
              },
              where: {
                id: 10320014,
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — a bare value, not an exclusion
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                resultBody: '{"fields":[{"fieldPath":"subject.delta"}]}',
                finishedAt: new Date('2026-10-02T09:09:09.009Z'),
              },
              where: {
                id: 10320015,
                AiRunStatusId: {
                  [Op.notIn]: 3, // AI_RUN_STATUS.SUCCEEDED.ID — stated without the array
                },
              },
            },
          },
        },
        {
          input: {
            options: {
              attributes: {
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                resultBody: '{"fields":[{"fieldPath":"subject.epsilon"}]}',
                finishedAt: new Date('2026-10-02T10:10:10.010Z'),
              },
              where: {
                id: 10320016,
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
  })
})

describe('AiRun', () => {
  describe('.excludesEveryTerminalAiRunStatus()', () => {
    /*
     * The proof itself, asked without the update that would rest on it.
     *
     * Which statuses have to be excluded is read from `AiRunTerminalStatusInspector`, so the three
     * accepted conditions below are the three it answers with and nothing narrower.
     */
    describe('when every terminal status is stated as excluded', () => {
      const cases = [
        {
          input: {
            where: {
              id: 10320021,
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
          input: {
            where: {
              id: 10320022,
              AiRunStatusId: {
                [Op.notIn]: [
                  2, // AI_RUN_STATUS.RUNNING.ID — a non-terminal status excluded as well
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
      ]

      test.each(cases)('where.id: $input.where.id', ({
        input,
      }) => {
        const received = AiRun.excludesEveryTerminalAiRunStatus(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('when a terminal status is left in range', () => {
      const cases = [
        {
          input: {
            where: {
              id: 10320023,
              AiRunStatusId: {
                [Op.notIn]: [
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
        },
        {
          input: {
            where: {
              id: 10320024,
              AiRunStatusId: {
                [Op.notIn]: [
                  1, // AI_RUN_STATUS.QUEUED.ID
                  2, // AI_RUN_STATUS.RUNNING.ID
                ],
              },
            },
          },
        },
        {
          input: {
            where: {
              id: 10320025,
            },
          },
        },
      ]

      test.each(cases)('where.id: $input.where.id', ({
        input,
      }) => {
        const received = AiRun.excludesEveryTerminalAiRunStatus(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRun', () => {
  describe('.extractExcludedAiRunStatusIds()', () => {
    /*
     * The one spelling this class reads: the status column stated as `Op.notIn` over an array.
     * What it answers is the array as the caller stated it, unsorted and unfiltered, because what
     * is done with it is a question for the caller above.
     */
    describe('when the condition states the statuses it excludes', () => {
      const cases = [
        {
          input: {
            where: {
              id: 10320031,
              AiRunStatusId: {
                [Op.notIn]: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
          },
          expected: [
            3,
            4,
            5,
          ],
        },
        {
          input: {
            where: {
              id: 10320032,
              AiRunStatusId: {
                [Op.notIn]: [
                  1, // AI_RUN_STATUS.QUEUED.ID
                ],
              },
            },
          },
          expected: [
            1,
          ],
        },
      ]

      test.each(cases)('where.id: $input.where.id', ({
        input,
        expected,
      }) => {
        const received = AiRun.extractExcludedAiRunStatusIds(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * Every other spelling answers that nothing is excluded, which is what turns into the refusal
     * one method up. A proof this class cannot read is not a proof, and reading it wrong would be
     * worse than not reading it at all.
     */
    describe('when the condition states nothing this class can read', () => {
      const cases = [
        {
          input: {
            where: {
              id: 10320033,
            },
          },
        },
        {
          input: {
            where: {
              id: 10320034,
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — a bare value
            },
          },
        },
        {
          input: {
            where: {
              id: 10320035,
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
          input: {
            where: {
              id: 10320036,
              AiRunStatusId: {
                [Op.notIn]: 5, // AI_RUN_STATUS.CANCELED.ID — stated without the array
              },
            },
          },
        },
        {
          input: {
            where: {
              id: 10320037,
              AiRunStatusId: null,
            },
          },
        },
      ]

      test.each(cases)('where.id: $input.where.id', ({
        input,
      }) => {
        const received = AiRun.extractExcludedAiRunStatusIds(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})
