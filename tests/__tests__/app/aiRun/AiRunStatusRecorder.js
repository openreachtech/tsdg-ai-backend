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
