import AiRunTerminalStatusInspector from '../../../../app/aiRun/AiRunTerminalStatusInspector.js'

describe('AiRunTerminalStatusInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#terminalAiRunStatusIds', () => {
        const cases = [
          {
            input: {
              terminalAiRunStatusIds: [
                3, // AI_RUN_STATUS.SUCCEEDED.ID
                4, // AI_RUN_STATUS.FAILED.ID
                5, // AI_RUN_STATUS.CANCELED.ID
              ],
            },
            expected: [
              3,
              4,
              5,
            ],
          },
          {
            input: {
              terminalAiRunStatusIds: [
                1, // AI_RUN_STATUS.QUEUED.ID
                2, // AI_RUN_STATUS.RUNNING.ID
              ],
            },
            expected: [
              1,
              2,
            ],
          },
        ]

        test.each(cases)('terminalAiRunStatusIds: $input.terminalAiRunStatusIds', ({
          input,
          expected,
        }) => {
          const inspector = new AiRunTerminalStatusInspector(input)

          expect(inspector)
            .toHaveProperty('terminalAiRunStatusIds', expected)
        })
      })
    })
  })
})

describe('AiRunTerminalStatusInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            terminalAiRunStatusIds: [
              3, // AI_RUN_STATUS.SUCCEEDED.ID
              4, // AI_RUN_STATUS.FAILED.ID
              5, // AI_RUN_STATUS.CANCELED.ID
            ],
          },
        },
        {
          input: {
            terminalAiRunStatusIds: [
              1, // AI_RUN_STATUS.QUEUED.ID
              2, // AI_RUN_STATUS.RUNNING.ID
            ],
          },
        },
      ]

      test.each(cases)('terminalAiRunStatusIds: $input.terminalAiRunStatusIds', ({
        input,
      }) => {
        const received = AiRunTerminalStatusInspector.create(input)

        expect(received)
          .toBeInstanceOf(AiRunTerminalStatusInspector)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            terminalAiRunStatusIds: [
              3, // AI_RUN_STATUS.SUCCEEDED.ID
              4, // AI_RUN_STATUS.FAILED.ID
              5, // AI_RUN_STATUS.CANCELED.ID
            ],
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
            terminalAiRunStatusIds: [
              1, // AI_RUN_STATUS.QUEUED.ID
              2, // AI_RUN_STATUS.RUNNING.ID
            ],
          },
          expected: {
            terminalAiRunStatusIds: [
              1,
              2,
            ],
          },
        },
      ]

      test.each(cases)('terminalAiRunStatusIds: $input.terminalAiRunStatusIds', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunTerminalStatusInspector)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    /*
     * The three statuses a run never leaves, in the ids the master constant declares. A default
     * that lost one of them would let a run leave that status with nothing saying so, which is the
     * one thing the guard consuming this class exists to prevent.
     */
    describe('should fill default terminalAiRunStatusIds', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunTerminalStatusInspector)
        const expected = {
          terminalAiRunStatusIds: [
            3, // AI_RUN_STATUS.SUCCEEDED.ID
            4, // AI_RUN_STATUS.FAILED.ID
            5, // AI_RUN_STATUS.CANCELED.ID
          ],
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunTerminalStatusInspector', () => {
  describe('#isTerminalAiRunStatus()', () => {
    /*
     * Both axes drive the answer: which statuses the instance holds as terminal, and which status
     * is being asked about. The second outer case holds a set that is deliberately not the real
     * one, so an implementation answering from a list written into the method — rather than from
     * the property it was handed — fails here rather than passing on the real set by coincidence.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            terminalAiRunStatusIds: [
              3, // AI_RUN_STATUS.SUCCEEDED.ID
              4, // AI_RUN_STATUS.FAILED.ID
              5, // AI_RUN_STATUS.CANCELED.ID
            ],
          },
          aiRunStatusIdCases: [
            {
              aiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            },
            {
              aiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
            },
            {
              aiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
            },
          ],
        },
        {
          input: {
            terminalAiRunStatusIds: [
              1, // AI_RUN_STATUS.QUEUED.ID
              2, // AI_RUN_STATUS.RUNNING.ID
            ],
          },
          aiRunStatusIdCases: [
            {
              aiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
            },
            {
              aiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            },
          ],
        },
      ]

      describe.each(cases)('terminalAiRunStatusIds: $input.terminalAiRunStatusIds', ({
        input,
        aiRunStatusIdCases,
      }) => {
        test.each(aiRunStatusIdCases)('aiRunStatusId: $aiRunStatusId', ({
          aiRunStatusId,
        }) => {
          const inspector = AiRunTerminalStatusInspector.create(input)
          const args = {
            aiRunStatusId,
          }

          const received = inspector.isTerminalAiRunStatus(args)

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('AiRunTerminalStatusInspector', () => {
  describe('#isTerminalAiRunStatus()', () => {
    /*
     * A status outside the set is not terminal — including one this service does not know at all,
     * which names no state a run settled in and so says nothing about a run being finished.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            terminalAiRunStatusIds: [
              3, // AI_RUN_STATUS.SUCCEEDED.ID
              4, // AI_RUN_STATUS.FAILED.ID
              5, // AI_RUN_STATUS.CANCELED.ID
            ],
          },
          aiRunStatusIdCases: [
            {
              aiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
            },
            {
              aiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            },
            {
              aiRunStatusId: 999999, // a status id this service declares nowhere
            },
          ],
        },
        {
          input: {
            terminalAiRunStatusIds: [
              1, // AI_RUN_STATUS.QUEUED.ID
              2, // AI_RUN_STATUS.RUNNING.ID
            ],
          },
          aiRunStatusIdCases: [
            {
              aiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            },
            {
              aiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
            },
            {
              aiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
            },
          ],
        },
      ]

      describe.each(cases)('terminalAiRunStatusIds: $input.terminalAiRunStatusIds', ({
        input,
        aiRunStatusIdCases,
      }) => {
        test.each(aiRunStatusIdCases)('aiRunStatusId: $aiRunStatusId', ({
          aiRunStatusId,
        }) => {
          const inspector = AiRunTerminalStatusInspector.create(input)
          const args = {
            aiRunStatusId,
          }

          const received = inspector.isTerminalAiRunStatus(args)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})
