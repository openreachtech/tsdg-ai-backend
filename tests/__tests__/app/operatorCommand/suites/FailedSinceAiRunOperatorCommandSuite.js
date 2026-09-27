import FailedSinceAiRunOperatorCommandSuite from '../../../../../app/operatorCommand/suites/FailedSinceAiRunOperatorCommandSuite.js'

import BaseAiRunOperatorCommandSuite from '../../../../../app/operatorCommand/BaseAiRunOperatorCommandSuite.js'
import AiRunOperatorCommandInputValidator from '../../../../../app/operatorCommand/AiRunOperatorCommandInputValidator.js'

/*
 * The command answering which runs failed since an instant.
 *
 * The falsy cases include a parameter another rule would pass, because which rule this command
 * asks is the whole of what `#isValidParameter()` decides.
 */

describe('FailedSinceAiRunOperatorCommandSuite', () => {
  describe('super class', () => {
    test('to be instance of BaseAiRunOperatorCommandSuite', () => {
      const received = FailedSinceAiRunOperatorCommandSuite.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunOperatorCommandSuite)
    })
  })
})

describe('FailedSinceAiRunOperatorCommandSuite', () => {
  describe('.get:commandName', () => {
    test('should be the word an operator types', () => {
      const received = FailedSinceAiRunOperatorCommandSuite.commandName

      expect(received)
        .toBe('failed-since')
    })
  })
})

describe('FailedSinceAiRunOperatorCommandSuite', () => {
  describe('#isValidParameter()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'failed-since',
            parameterText: '2026-09-28T00:00:00.000Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('2026-09-28T00:00:00.000Z'),
          },
        },
        {
          input: {
            commandName: 'failed-since',
            parameterText: '2024-02-29T12:34:56.789Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('2024-02-29T12:34:56.789Z'),
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const suite = FailedSinceAiRunOperatorCommandSuite.create({
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
            commandName: 'failed-since',
            parameterText: 'yesterday',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('yesterday'),
          },
        },
        {
          input: {
            commandName: 'failed-since',
            parameterText: 'correlation-id-10900002', // passes the correlation rule; this command asks another
            stalledForSeconds: Number.NaN,
            failedSince: new Date('correlation-id-10900002'),
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const suite = FailedSinceAiRunOperatorCommandSuite.create({
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

describe('FailedSinceAiRunOperatorCommandSuite', () => {
  describe('#findAiRunAnswer()', () => {
    describe('should ask the finder for the failed runs', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'failed-since',
              parameterText: '2026-09-28T00:00:00.000Z',
              stalledForSeconds: Number.NaN,
              failedSince: new Date('2026-09-28T00:00:00.000Z'),
            },
            now: new Date('2026-09-28T10:00:00.000Z'),
            runCount: 100,
          },
          expected: {
            failedSince: new Date('2026-09-28T00:00:00.000Z'),
            limit: 100,
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'failed-since',
              parameterText: '2026-01-31T09:15:00.000Z',
              stalledForSeconds: Number.NaN,
              failedSince: new Date('2026-01-31T09:15:00.000Z'),
            },
            now: new Date('2026-02-01T00:00:00.000Z'),
            runCount: 20,
          },
          expected: {
            failedSince: new Date('2026-01-31T09:15:00.000Z'),
            limit: 20,
          },
        },
      ]

      test.each(cases)('failedSince: $input.commandInput.failedSince', async ({
        input,
        expected,
      }) => {
        const suite = FailedSinceAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findFailedAiRuns: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          now: input.now,
          runCount: input.runCount,
        }
        const findFailedAiRunsSpy = jest.spyOn(findAiRunAnswerArgs.finder, 'findFailedAiRuns')

        await suite.findAiRunAnswer(findAiRunAnswerArgs)

        expect(findFailedAiRunsSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should answer with what the finder found', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'failed-since',
              parameterText: '2026-09-28T00:00:00.000Z',
              stalledForSeconds: Number.NaN,
              failedSince: new Date('2026-09-28T00:00:00.000Z'),
            },
            now: new Date('2026-09-28T10:00:00.000Z'),
            runCount: 100,
          },
          tally: {
            aiRuns: [
              {
                id: 10900002,
                runKey: 'run-key-10900002',
              },
            ],
            aiRunSteps: [],
            aiModelCalls: [],
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'failed-since',
              parameterText: '2026-01-31T09:15:00.000Z',
              stalledForSeconds: Number.NaN,
              failedSince: new Date('2026-01-31T09:15:00.000Z'),
            },
            now: new Date('2026-02-01T00:00:00.000Z'),
            runCount: 20,
          },
          tally: {
            aiRuns: [],
            aiRunSteps: [],
            aiModelCalls: [],
          },
        },
      ]

      test.each(cases)('failedSince: $input.commandInput.failedSince', async ({
        input,
        tally,
      }) => {
        const suite = FailedSinceAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findFailedAiRuns: async () => tally,
          },
          now: input.now,
          runCount: input.runCount,
        }

        const received = await suite.findAiRunAnswer(findAiRunAnswerArgs)

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})

describe('FailedSinceAiRunOperatorCommandSuite', () => {
  describe('#reportAnswer()', () => {
    describe('should hand the rows to the reporter', () => {
      const cases = [
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10900004',
              },
            ],
            aiRunSteps: [],
          },
          expected: {
            rows: [
              {
                runKey: 'run-key-10900004',
              },
            ],
          },
        },
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10900005',
              },
              {
                runKey: 'run-key-10900006',
              },
            ],
            aiRunSteps: [
              {
                stepIndex: 2,
              },
            ],
          },
          expected: {
            rows: [
              {
                runKey: 'run-key-10900005',
              },
              {
                runKey: 'run-key-10900006',
              },
            ],
          },
        },
      ]

      test.each(cases)('rows[0].runKey: $input.rows.0.runKey', ({
        input,
        expected,
      }) => {
        const suite = FailedSinceAiRunOperatorCommandSuite.create({
          input: {
            commandName: 'failed-since', // Fill the unrelated required argument with a neutral value
            parameterText: '2026-09-28T00:00:00.000Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('2026-09-28T00:00:00.000Z'),
          },
        })

        const reportAnswerArgs = {
          reporter: {
            /**
             * @returns {void}
             */
            reportAiRunRows: () => {},
          },
          rows: input.rows,
          aiRunSteps: input.aiRunSteps,
        }
        const reportAiRunRowsSpy = jest.spyOn(reportAnswerArgs.reporter, 'reportAiRunRows')

        suite.reportAnswer(reportAnswerArgs)

        expect(reportAiRunRowsSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
