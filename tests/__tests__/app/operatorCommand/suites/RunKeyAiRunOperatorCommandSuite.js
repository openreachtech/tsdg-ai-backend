import RunKeyAiRunOperatorCommandSuite from '../../../../../app/operatorCommand/suites/RunKeyAiRunOperatorCommandSuite.js'

import BaseAiRunOperatorCommandSuite from '../../../../../app/operatorCommand/BaseAiRunOperatorCommandSuite.js'
import AiRunOperatorCommandInputValidator from '../../../../../app/operatorCommand/AiRunOperatorCommandInputValidator.js'

/*
 * The command answering with one run and the steps it took.
 *
 * It is the only one of the four that normalizes what the finder hands back, and the only one that
 * reports a detail rather than a table — so both of those are pinned here rather than inferred.
 */

describe('RunKeyAiRunOperatorCommandSuite', () => {
  describe('super class', () => {
    test('to be instance of BaseAiRunOperatorCommandSuite', () => {
      const received = RunKeyAiRunOperatorCommandSuite.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunOperatorCommandSuite)
    })
  })
})

describe('RunKeyAiRunOperatorCommandSuite', () => {
  describe('.get:commandName', () => {
    test('should be the word an operator types', () => {
      const received = RunKeyAiRunOperatorCommandSuite.commandName

      expect(received)
        .toBe('run')
    })
  })
})

describe('RunKeyAiRunOperatorCommandSuite', () => {
  describe('#isValidParameter()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'run',
            parameterText: 'run-key-10900001',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'run',
            parameterText: 'a1b2c3d4e5f60718a1b2c3d4e5f60718a1b2c3d4e5f60718a1b2c3d4e5f60718', // 64 characters -- the width of the column
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const suite = RunKeyAiRunOperatorCommandSuite.create({
          input,
        })

        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = suite.isValidParameter({
          validator,
        })

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            commandName: 'run',
            parameterText: '',
            stalledForSeconds: 0,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'run',
            parameterText: 'a run key with spaces', // passes the correlation rule; this command asks another
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const suite = RunKeyAiRunOperatorCommandSuite.create({
          input,
        })

        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = suite.isValidParameter({
          validator,
        })

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('RunKeyAiRunOperatorCommandSuite', () => {
  describe('#findAiRunAnswer()', () => {
    describe('should ask the finder for the one run', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'run',
              parameterText: 'run-key-10900001',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
            runCount: 100,
          },
          expected: {
            runKey: 'run-key-10900001',
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'run',
              parameterText: 'run-key-10900002',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-01-31T09:15:00.000Z'),
            runCount: 20,
          },
          expected: {
            runKey: 'run-key-10900002',
          },
        },
      ]

      test.each(cases)('parameterText: $input.commandInput.parameterText', async ({
        input,
        expected,
      }) => {
        const suite = RunKeyAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunByRunKey: async () => ({
              aiRun: null,
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          now: input.now,
          runCount: input.runCount,
        }
        const findAiRunByRunKeySpy = jest.spyOn(findAiRunAnswerArgs.finder, 'findAiRunByRunKey')

        await suite.findAiRunAnswer(findAiRunAnswerArgs)

        expect(findAiRunByRunKeySpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('with a run key naming a run', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'run',
              parameterText: 'run-key-10900003',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
            runCount: 100,
            foundAnswer: {
              aiRun: {
                id: 10900003,
                runKey: 'run-key-10900003',
              },
              aiRunSteps: [
                {
                  AiRunId: 10900003,
                  stepIndex: 1,
                },
              ],
              aiModelCalls: [
                {
                  AiRunId: 10900003,
                  inputTokenCount: 11,
                },
              ],
            },
          },
          expected: {
            aiRuns: [
              {
                id: 10900003,
                runKey: 'run-key-10900003',
              },
            ],
            aiRunSteps: [
              {
                AiRunId: 10900003,
                stepIndex: 1,
              },
            ],
            aiModelCalls: [
              {
                AiRunId: 10900003,
                inputTokenCount: 11,
              },
            ],
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'run',
              parameterText: 'run-key-10900004',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-01-31T09:15:00.000Z'),
            runCount: 20,
            foundAnswer: {
              aiRun: {
                id: 10900004,
                runKey: 'run-key-10900004',
              },
              aiRunSteps: [],
              aiModelCalls: [],
            },
          },
          expected: {
            aiRuns: [
              {
                id: 10900004,
                runKey: 'run-key-10900004',
              },
            ],
            aiRunSteps: [],
            aiModelCalls: [],
          },
        },
      ]

      test.each(cases)('parameterText: $input.commandInput.parameterText', async ({
        input,
        expected,
      }) => {
        const suite = RunKeyAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunByRunKey: async () => input.foundAnswer,
          },
          now: input.now,
          runCount: input.runCount,
        }

        const received = await suite.findAiRunAnswer(findAiRunAnswerArgs)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with a run key naming no run', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'run',
              parameterText: 'run-key-10900005',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
            runCount: 100,
          },
          expected: {
            aiRuns: [],
            aiRunSteps: [],
            aiModelCalls: [],
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'run',
              parameterText: 'run-key-10900006',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-01-31T09:15:00.000Z'),
            runCount: 20,
          },
          expected: {
            aiRuns: [],
            aiRunSteps: [],
            aiModelCalls: [],
          },
        },
      ]

      test.each(cases)('parameterText: $input.commandInput.parameterText', async ({
        input,
        expected,
      }) => {
        const suite = RunKeyAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunByRunKey: async () => ({
              aiRun: null,
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          now: input.now,
          runCount: input.runCount,
        }

        const received = await suite.findAiRunAnswer(findAiRunAnswerArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('RunKeyAiRunOperatorCommandSuite', () => {
  describe('#extractFoundAiRuns()', () => {
    describe('with a run', () => {
      const cases = [
        {
          input: {
            aiRun: {
              id: 10900007,
              runKey: 'run-key-10900007',
            },
          },
          expected: [
            {
              id: 10900007,
              runKey: 'run-key-10900007',
            },
          ],
        },
        {
          input: {
            aiRun: {
              id: 10900008,
              runKey: 'run-key-10900008',
            },
          },
          expected: [
            {
              id: 10900008,
              runKey: 'run-key-10900008',
            },
          ],
        },
      ]

      test.each(cases)('aiRun.runKey: $input.aiRun.runKey', ({
        input,
        expected,
      }) => {
        const suite = RunKeyAiRunOperatorCommandSuite.create({
          input: {
            commandName: 'run', // Fill the unrelated required argument with a neutral value
            parameterText: 'run-key-10900009',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        })

        const received = suite.extractFoundAiRuns(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with no run', () => {
      const cases = [
        {
          input: {
            aiRun: null,
          },
        },
      ]

      test.each(cases)('aiRun: $input.aiRun', ({
        input,
      }) => {
        const suite = RunKeyAiRunOperatorCommandSuite.create({
          input: {
            commandName: 'run', // Fill the unrelated required argument with a neutral value
            parameterText: 'run-key-10900010',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        })

        const received = suite.extractFoundAiRuns(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('RunKeyAiRunOperatorCommandSuite', () => {
  describe('#reportAnswer()', () => {
    describe('should hand the one run and its steps to the reporter', () => {
      const cases = [
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10900011',
              },
            ],
            aiRunSteps: [
              {
                AiRunId: 10900011,
                stepIndex: 1,
              },
            ],
          },
          expected: {
            row: {
              runKey: 'run-key-10900011',
            },
            steps: [
              {
                AiRunId: 10900011,
                stepIndex: 1,
              },
            ],
          },
        },
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10900012',
              },
            ],
            aiRunSteps: [],
          },
          expected: {
            row: {
              runKey: 'run-key-10900012',
            },
            steps: [],
          },
        },
      ]

      test.each(cases)('rows[0].runKey: $input.rows.0.runKey', ({
        input,
        expected,
      }) => {
        const suite = RunKeyAiRunOperatorCommandSuite.create({
          input: {
            commandName: 'run', // Fill the unrelated required argument with a neutral value
            parameterText: 'run-key-10900013',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        })

        const reportAnswerArgs = {
          reporter: {
            /**
             * @returns {void}
             */
            reportAiRunDetail: () => {},
          },
          rows: input.rows,
          aiRunSteps: input.aiRunSteps,
        }
        const reportAiRunDetailSpy = jest.spyOn(reportAnswerArgs.reporter, 'reportAiRunDetail')

        suite.reportAnswer(reportAnswerArgs)

        expect(reportAiRunDetailSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
