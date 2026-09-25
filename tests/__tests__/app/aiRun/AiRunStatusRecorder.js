import AiRunStatusRecorder from '../../../../app/aiRun/AiRunStatusRecorder.js'

import AiRunTerminalStatusInspector from '../../../../app/aiRun/AiRunTerminalStatusInspector.js'
import AiRun from '../../../../sequelize/models/AiRun.js'

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
        }

        SpyClass.create()

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
              failureReasonCode: 'run.failure.model.unavailable',
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
              failureReasonCode: 'run.failure.model.unavailable',
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
              failureReasonCode: 'run.failure.medium.unreadable',
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
