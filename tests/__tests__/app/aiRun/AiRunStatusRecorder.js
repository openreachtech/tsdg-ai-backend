import {
  Op,
} from 'sequelize'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunStatusRecorder from '../../../../app/aiRun/AiRunStatusRecorder.js'

import AiRunInstantInspector from '../../../../app/aiRun/AiRunInstantInspector.js'
import AiRunKeyInspector from '../../../../app/aiRun/AiRunKeyInspector.js'
import AiRunTerminalStatusInspector from '../../../../app/aiRun/AiRunTerminalStatusInspector.js'
import AI_RUN_FAILURE_REASON_CONSTANT_HASH from '../../../../app/constants/aiRunFailureReasonConstants.js'
import AiRun from '../../../../sequelize/models/AiRun.js'

const {
  AI_RUN_FAILURE_REASON_CODE,
} = AI_RUN_FAILURE_REASON_CONSTANT_HASH

describe('AiRunStatusRecorder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunTerminalStatusInspector', () => {
        const cases = [
          {
            input: {
              aiRunTerminalStatusInspector: {
                terminalAiRunStatusIds: [
                  3, // AI_RUN_STATUS.SUCCEEDED.ID
                  4, // AI_RUN_STATUS.FAILED.ID
                  5, // AI_RUN_STATUS.CANCELED.ID
                ],
              },
            },
            expected: {
              terminalAiRunStatusIds: [
                3,
                4,
                5,
              ],
            },
          },
          {
            input: {
              aiRunTerminalStatusInspector: {
                terminalAiRunStatusIds: [
                  1, // AI_RUN_STATUS.QUEUED.ID
                  2, // AI_RUN_STATUS.RUNNING.ID
                ],
              },
            },
            expected: {
              terminalAiRunStatusIds: [
                1,
                2,
              ],
            },
          },
        ]

        test.each(cases)('terminalAiRunStatusIds: $input.aiRunTerminalStatusInspector.terminalAiRunStatusIds', ({
          input,
          expected,
        }) => {
          const recorder = new AiRunStatusRecorder(input)

          expect(recorder)
            .toHaveProperty('aiRunTerminalStatusInspector', expected)
        })
      })

      describe('#aiRunInstantInspector', () => {
        const cases = [
          {
            input: {
              aiRunInstantInspector: {
                earliestRecordableInstant: new Date('1000-01-01T00:00:00.000Z'),
                latestRecordableInstant: new Date('9999-12-31T23:59:59.999Z'),
              },
            },
            expected: {
              earliestRecordableInstant: new Date('1000-01-01T00:00:00.000Z'),
              latestRecordableInstant: new Date('9999-12-31T23:59:59.999Z'),
            },
          },
          {
            input: {
              aiRunInstantInspector: {
                earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
                latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
              },
            },
            expected: {
              earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
              latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
            },
          },
        ]

        test.each(cases)('earliestRecordableInstant: $input.aiRunInstantInspector.earliestRecordableInstant', ({
          input,
          expected,
        }) => {
          const recorder = new AiRunStatusRecorder(input)

          expect(recorder)
            .toHaveProperty('aiRunInstantInspector', expected)
        })
      })

      describe('#aiRunKeyInspector', () => {
        const cases = [
          {
            input: {
              aiRunKeyInspector: {
                keyPattern: /^(?=.{1,19}$)[1-9]\d*$/u,
              },
            },
            expected: {
              keyPattern: /^(?=.{1,19}$)[1-9]\d*$/u,
            },
          },
          {
            input: {
              aiRunKeyInspector: {
                keyPattern: /^[1-9]$/u,
              },
            },
            expected: {
              keyPattern: /^[1-9]$/u,
            },
          },
        ]

        test.each(cases)('keyPattern: $input.aiRunKeyInspector.keyPattern', ({
          input,
          expected,
        }) => {
          const recorder = new AiRunStatusRecorder(input)

          expect(recorder)
            .toHaveProperty('aiRunKeyInspector', expected)
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            aiRunTerminalStatusInspector: {
              terminalAiRunStatusIds: [
                3, // AI_RUN_STATUS.SUCCEEDED.ID
                4, // AI_RUN_STATUS.FAILED.ID
                5, // AI_RUN_STATUS.CANCELED.ID
              ],
            },
          },
        },
        {
          input: {
            aiRunTerminalStatusInspector: {
              terminalAiRunStatusIds: [
                1, // AI_RUN_STATUS.QUEUED.ID
                2, // AI_RUN_STATUS.RUNNING.ID
              ],
            },
          },
        },
      ]

      test.each(cases)('terminalAiRunStatusIds: $input.aiRunTerminalStatusInspector.terminalAiRunStatusIds', ({
        input,
      }) => {
        const received = AiRunStatusRecorder.create(input)

        expect(received)
          .toBeInstanceOf(AiRunStatusRecorder)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            aiRunTerminalStatusInspector: {
              terminalAiRunStatusIds: [
                3, // AI_RUN_STATUS.SUCCEEDED.ID
                4, // AI_RUN_STATUS.FAILED.ID
                5, // AI_RUN_STATUS.CANCELED.ID
              ],
            },
          },
          expected: {
            aiRunTerminalStatusInspector: {
              terminalAiRunStatusIds: [
                3,
                4,
                5,
              ],
            },
            aiRunInstantInspector: expect.any(AiRunInstantInspector),
            aiRunKeyInspector: expect.any(AiRunKeyInspector),
          },
        },
        {
          input: {
            aiRunTerminalStatusInspector: {
              terminalAiRunStatusIds: [
                1, // AI_RUN_STATUS.QUEUED.ID
                2, // AI_RUN_STATUS.RUNNING.ID
              ],
            },
          },
          expected: {
            aiRunTerminalStatusInspector: {
              terminalAiRunStatusIds: [
                1,
                2,
              ],
            },
            aiRunInstantInspector: expect.any(AiRunInstantInspector),
            aiRunKeyInspector: expect.any(AiRunKeyInspector),
          },
        },
      ]

      test.each(cases)('terminalAiRunStatusIds: $input.aiRunTerminalStatusInspector.terminalAiRunStatusIds', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunStatusRecorder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default aiRunTerminalStatusInspector', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunStatusRecorder)
        const expected = {
          aiRunTerminalStatusInspector: expect.any(AiRunTerminalStatusInspector),
          aiRunInstantInspector: expect.any(AiRunInstantInspector),
          aiRunKeyInspector: expect.any(AiRunKeyInspector),
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default aiRunInstantInspector', () => {
      test('with the other collaborator stated', () => {
        const SpyClass = constructorSpy.spyOn(AiRunStatusRecorder)
        const input = {
          aiRunTerminalStatusInspector: {
            terminalAiRunStatusIds: [
              3, // AI_RUN_STATUS.SUCCEEDED.ID
              4, // AI_RUN_STATUS.FAILED.ID
              5, // AI_RUN_STATUS.CANCELED.ID
            ],
          },
        }
        const expected = {
          aiRunTerminalStatusInspector: {
            terminalAiRunStatusIds: [
              3,
              4,
              5,
            ],
          },
          aiRunInstantInspector: expect.any(AiRunInstantInspector),
          aiRunKeyInspector: expect.any(AiRunKeyInspector),
        }

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('.get:AiRunCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunStatusRecorder.AiRunCtor

        expect(received)
          .toBe(AiRun) // same reference
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('.createAiRunTerminalStatusInspector()', () => {
    test('should be an instance of AiRunTerminalStatusInspector', () => {
      const received = AiRunStatusRecorder.createAiRunTerminalStatusInspector()

      expect(received)
        .toBeInstanceOf(AiRunTerminalStatusInspector)
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunStatusRecorder,
      },
      {
        tally: class AlphaAiRunStatusRecorder extends AiRunStatusRecorder {},
      },
      {
        tally: class BetaAiRunStatusRecorder extends AiRunStatusRecorder {},
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

describe('AiRunStatusRecorder', () => {
  describe('#findAiRun()', () => {
    /*
     * The status the guard reads comes from here, so the row this answers with has to carry the
     * status the row actually holds. Both runs read here are seeded in a terminal status, which is
     * the one thing nothing in this service may move them out of — so what they answer with stays
     * true however many runs have been transitioned by the time this runs.
     */
    describe('when a run carries the id', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010004,
          },
          expected: expect.objectContaining({
            id: 10010004,
            runKey: 'run-key-10010004',
            externalRef: 'external-ref-10010004',
            AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
          }),
        },
        {
          input: {
            aiRunId: 10010006,
          },
          expected: expect.objectContaining({
            id: 10010006,
            runKey: 'run-key-10010006',
            externalRef: 'external-ref-10010006',
            AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = await recorder.findAiRun(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when no run carries the id', () => {
      const cases = [
        {
          // Reserved inside this feature's own id block as a run that is never created
          input: {
            aiRunId: 10239001,
          },
        },
        {
          input: {
            aiRunId: 10239002,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = await recorder.findAiRun(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#extractRefusedAiRunFieldName()', () => {
    /*
     * Which fields a transition is allowed to write, asked without a run.
     *
     * The first field the caller named that no transition writes is answered by name, because a
     * refusal that said only "some field" would leave the caller reading its own call to find out
     * which. The three below are the three that cost something: the callback URL decides where a
     * run's result is delivered, the purge marker decides whether the retention sweep still has
     * work to do, and the request body is what the run was accepted with.
     */
    describe('when the call names a field no transition writes', () => {
      const cases = [
        {
          input: {
            values: {
              callbackUrl: 'https://another.client.development.invalid/collect',
            },
          },
          expected: 'callbackUrl',
        },
        {
          input: {
            values: {
              contentPurgedAt: new Date('2000-01-01T00:00:00.000Z'),
            },
          },
          expected: 'contentPurgedAt',
        },
        {
          input: {
            values: {
              requestBody: '{"asset":"a body the run was never accepted with"}',
            },
          },
          expected: 'requestBody',
        },
        {
          input: {
            values: {
              ApiClientId: 10000002,
            },
          },
          expected: 'ApiClientId',
        },
        {
          input: {
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: '{"fields":[]}',
              finishedAt: new Date('2026-09-28T09:09:09.009Z'),
              runKey: 'a run key the caller chose for itself',
            },
          },
          expected: 'runKey',
        },
      ]

      test.each(cases)('values: $input.values', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = recorder.extractRefusedAiRunFieldName(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * The five public methods' own values, one case each, so a list that stopped covering one of
     * them fails here rather than at that method. The last case is the guard's own describe in
     * `tests/_orders`, which writes an engine label through this method directly.
     */
    describe('when every field named is a transition to write', () => {
      const cases = [
        {
          input: {
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              startedAt: new Date('2026-09-28T10:10:01.001Z'),
            },
          },
        },
        {
          input: {
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: '{"fields":[{"path":"subject.title"}]}',
              finishedAt: new Date('2026-09-28T11:11:01.001Z'),
            },
          },
        },
        {
          input: {
            values: {
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.PROVIDER_CALL_FAILED,
              failureParameters: {
                attemptCount: 3,
              },
              finishedAt: new Date('2026-09-28T12:12:01.001Z'),
            },
          },
        },
        {
          input: {
            values: {
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              canceledAt: new Date('2026-09-28T13:13:01.001Z'),
              finishedAt: new Date('2026-09-28T13:13:02.002Z'),
            },
          },
        },
        {
          input: {
            values: {
              cancelRequestedAt: new Date('2026-09-28T14:14:01.001Z'),
            },
          },
        },
        {
          input: {
            values: {
              engineLabel: 'engine-label-of-the-loop-that-answered',
            },
          },
        },
      ]

      test.each(cases)('values: $input.values', ({
        input,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = recorder.extractRefusedAiRunFieldName(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#extractAbsentAiRunEvidenceFieldName()', () => {
    /*
     * What each destination status is evidenced by, asked of the call rather than of the row.
     *
     * A status arriving without the columns it is evidenced by is the shape the five methods above
     * exist to make impossible — a run reading succeeded with no instant it finished at and no
     * result, or failed with no reason code. The check reads whether the field was named, not what
     * its value is: a result that settled nothing is still a success, so `resultBody: null` names
     * the field and passes, and it is the call that omits the field entirely that is turned away.
     */
    describe('when the status it moves to is not evidenced', () => {
      const cases = [
        {
          input: {
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            },
          },
          expected: 'startedAt',
        },
        {
          input: {
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              finishedAt: new Date('2026-09-28T15:15:01.001Z'),
            },
          },
          expected: 'resultBody',
        },
        {
          input: {
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: '{"fields":[]}',
            },
          },
          expected: 'finishedAt',
        },
        {
          input: {
            values: {
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.PROVIDER_CALL_FAILED,
              finishedAt: new Date('2026-09-28T16:16:01.001Z'),
            },
          },
          expected: 'failureParameters',
        },
        {
          input: {
            values: {
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              finishedAt: new Date('2026-09-28T17:17:01.001Z'),
            },
          },
          expected: 'canceledAt',
        },
      ]

      test.each(cases)('values: $input.values', ({
        input,
        expected,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = recorder.extractAbsentAiRunEvidenceFieldName(input)

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * The four evidenced moves, each with the columns its own method writes and a null value where
     * the caller legitimately has none — and two calls that name no status at all, which move the
     * run nowhere and are evidenced by nothing.
     */
    describe('when the status it moves to is evidenced', () => {
      const cases = [
        {
          input: {
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              startedAt: new Date('2026-09-28T18:18:01.001Z'),
            },
          },
        },
        {
          input: {
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: null, // a run that legitimately settled nothing
              finishedAt: new Date('2026-09-28T19:19:01.001Z'),
            },
          },
        },
        {
          input: {
            values: {
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_UNREADABLE,
              failureParameters: null,
              finishedAt: new Date('2026-09-28T20:20:01.001Z'),
            },
          },
        },
        {
          input: {
            values: {
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              canceledAt: new Date('2026-09-28T21:21:01.001Z'),
              finishedAt: new Date('2026-09-28T21:21:02.002Z'),
            },
          },
        },
        {
          input: {
            values: {
              cancelRequestedAt: new Date('2026-09-28T22:22:01.001Z'),
            },
          },
        },
        {
          input: {
            values: {
              engineLabel: 'engine-label-of-a-run-still-under-way',
            },
          },
        },
      ]

      test.each(cases)('values: $input.values', ({
        input,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = recorder.extractAbsentAiRunEvidenceFieldName(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('.get:sequelizeOperators', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunStatusRecorder.sequelizeOperators

        expect(received)
          .toBe(Op) // same reference
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#buildUnsettledAiRunCondition()', () => {
    /*
     * The condition the transition write is made under, and where its statuses come from.
     *
     * The second case injects an inspector holding statuses no run of this application carries. If
     * the condition were built out of literals it would answer the same three ids to both cases and
     * that case would fail — which is the whole point of asking it twice. The third names a single
     * terminal status, so a class that had hard-coded the count rather than the ids is caught too.
     */
    const cases = [
      {
        factoryParams: {
          aiRunTerminalStatusInspector: AiRunTerminalStatusInspector.create(),
        },
        input: {
          aiRunId: 10300091,
        },
        expected: {
          id: 10300091,
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
        factoryParams: {
          aiRunTerminalStatusInspector: AiRunTerminalStatusInspector.create({
            terminalAiRunStatusIds: [
              71,
              72,
            ],
          }),
        },
        input: {
          aiRunId: 10300092,
        },
        expected: {
          id: 10300092,
          AiRunStatusId: {
            [Op.notIn]: [
              71,
              72,
            ],
          },
        },
      },
      {
        factoryParams: {
          aiRunTerminalStatusInspector: AiRunTerminalStatusInspector.create({
            terminalAiRunStatusIds: [
              83,
            ],
          }),
        },
        input: {
          aiRunId: 10300093,
        },
        expected: {
          id: 10300093,
          AiRunStatusId: {
            [Op.notIn]: [
              83,
            ],
          },
        },
      },
    ]

    test.each(cases)('aiRunId: $input.aiRunId', ({
      factoryParams,
      input,
      expected,
    }) => {
      const recorder = AiRunStatusRecorder.create(factoryParams) // Arrange

      const received = recorder.buildUnsettledAiRunCondition(input) // Act

      expect(received) // Assert
        .toEqual(expected)
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#isUnwritableAiRunRefusal()', () => {
    /*
     * The three refusals the boolean spelling answers with false, and everything it still raises.
     *
     * One case per cause, because they are three sentences built in three places and a predicate
     * that had only ever been extended for two would pass a describe that only asked about two.
     * The absent run is the one that matters most: it is what covers a job dispatched by a
     * transaction whose COMMIT failed (Q86), and a predicate that missed it would fail every such
     * delivery in the queue.
     *
     * Each is asked with a second class name as well, so a predicate matching a whole message
     * rather than the sentence inside it fails here.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            error: new Error('AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10320041, AiRunStatusId 3'),
          },
        },
        {
          input: {
            error: new Error('AlphaAiRunStatusRecorder#saveOngoingAiRun() refused a run that does not exist: AiRunId 10320042'),
          },
        },
        {
          input: {
            error: new Error('AiRunStatusRecorder#saveAiRunTransition() refused a run that had settled or gone by the time the write reached it: AiRunId 10320043'),
          },
        },
        {
          input: {
            error: new Error('BetaAiRunStatusRecorder#saveAiRunTransition() refused a run that had settled or gone by the time the write reached it: AiRunId 10320044'),
          },
        },
      ]

      test.each(cases)('message: $input.error.message', ({
        input,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = recorder.isUnwritableAiRunRefusal(input)

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * Every refusal that names a defect in the call, which a second delivery would carry unchanged.
     * Answering any of them false would tell a worker there was nothing to do, when what there is
     * to do is fix the call.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            error: new Error('AiRunStatusRecorder#saveFailedAiRun() refused a failed run carrying no reason code: AiRunId 10320051'),
          },
        },
        {
          input: {
            error: new Error('AiRunStatusRecorder#saveOngoingAiRun() refused a key that is not an id: field aiRunId'),
          },
        },
        {
          input: {
            error: new Error('AiRunStatusRecorder#saveOngoingAiRun() refused a status naming no master row: AiRunId 10320052, field AiRunStatusId'),
          },
        },
        {
          input: {
            error: new Error('AiRunStatusRecorder#saveOngoingAiRun() refused an instant field carrying something that is not an instant: AiRunId 10320053, field finishedAt'),
          },
        },
        {
          input: {
            error: new Error('AiRunStatusRecorder#saveOngoingAiRun() refused a field no transition of this class writes: AiRunId 10320054, field callbackUrl'),
          },
        },
        {
          input: {
            error: new Error('SQLITE_BUSY: database is locked'),
          },
        },
        {
          input: {
            error: 'a refusal thrown as text rather than as an error',
          },
        },
        {
          input: {
            error: null,
          },
        },
      ]

      test.each(cases)('error: $input.error', ({
        input,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = recorder.isUnwritableAiRunRefusal(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('.get:mentsuLogger', () => {
    describe('when called as is', () => {
      test('should be a MentsuLogger', () => {
        const received = AiRunStatusRecorder.mentsuLogger

        expect(received)
          .toBeInstanceOf(MentsuLogger)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#logUnwritableAiRunRefusal()', () => {
    /*
     * What the line carries is the refusal's own message, which is the only thing that still says
     * which of the three causes it was — the caller is handed a boolean and cannot tell. The level
     * is the ordinary one, because a queue redelivering a finished run is an ordinary event and a
     * warning per duplicate would bury the lines an operator watches for.
     */
    const cases = [
      {
        input: {
          error: new Error('AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10320071, AiRunStatusId 3'),
        },
        expected: {
          message: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10320071, AiRunStatusId 3',
          tags: [
            'AiRunTransition',
            'UnwritableAiRun',
          ],
        },
      },
      {
        input: {
          error: new Error('AiRunStatusRecorder#saveOngoingAiRun() refused a run that does not exist: AiRunId 10320072'),
        },
        expected: {
          message: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run that does not exist: AiRunId 10320072',
          tags: [
            'AiRunTransition',
            'UnwritableAiRun',
          ],
        },
      },
    ]

    test.each(cases)('message: $input.error.message', ({
      input,
      expected,
    }) => {
      const recorder = AiRunStatusRecorder.create()
      const logSpy = jest.spyOn(AiRunStatusRecorder.mentsuLogger, 'log')

      recorder.logUnwritableAiRunRefusal(input)

      expect(logSpy)
        .toHaveBeenCalledWith(expected)
    })
  })
})
