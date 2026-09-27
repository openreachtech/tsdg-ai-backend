import CorrelationAiRunOperatorCommandSuite from '../../../../../app/operatorCommand/suites/CorrelationAiRunOperatorCommandSuite.js'

import BaseAiRunOperatorCommandSuite from '../../../../../app/operatorCommand/BaseAiRunOperatorCommandSuite.js'
import AiRunOperatorCommandInputValidator from '../../../../../app/operatorCommand/AiRunOperatorCommandInputValidator.js'

/*
 * The command answering which runs belong to one correlation chain.
 *
 * The correlation id is the one parameter of the four the adapter converts nothing of, so the
 * value handed to the finder is the text the operator typed and the case can pin it as such.
 */

describe('CorrelationAiRunOperatorCommandSuite', () => {
  describe('super class', () => {
    test('to be instance of BaseAiRunOperatorCommandSuite', () => {
      const received = CorrelationAiRunOperatorCommandSuite.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunOperatorCommandSuite)
    })
  })
})

describe('CorrelationAiRunOperatorCommandSuite', () => {
  describe('.get:commandName', () => {
    test('should be the word an operator types', () => {
      const received = CorrelationAiRunOperatorCommandSuite.commandName

      expect(received)
        .toBe('correlation')
    })
  })
})

describe('CorrelationAiRunOperatorCommandSuite', () => {
  describe('#isValidParameter()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'correlation',
            parameterText: 'correlation-id-10900001',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'correlation',
            parameterText: 'an order reference with spaces', // text this service reads no meaning into
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const suite = CorrelationAiRunOperatorCommandSuite.create({
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
            commandName: 'correlation',
            parameterText: '',
            stalledForSeconds: 0,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'correlation',
            parameterText: 'correlation-id-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', // 192 characters -- one past the column
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const suite = CorrelationAiRunOperatorCommandSuite.create({
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

describe('CorrelationAiRunOperatorCommandSuite', () => {
  describe('#findAiRunAnswer()', () => {
    describe('should ask the finder for the chain', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'correlation',
              parameterText: 'correlation-id-10900001',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
            runCount: 100,
          },
          expected: {
            correlationId: 'correlation-id-10900001',
            limit: 100,
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'correlation',
              parameterText: 'correlation-id-10900002',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-01-31T09:15:00.000Z'),
            runCount: 20,
          },
          expected: {
            correlationId: 'correlation-id-10900002',
            limit: 20,
          },
        },
      ]

      test.each(cases)('parameterText: $input.commandInput.parameterText', async ({
        input,
        expected,
      }) => {
        const suite = CorrelationAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunsByCorrelationId: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          now: input.now,
          runCount: input.runCount,
        }
        const findAiRunsByCorrelationIdSpy = jest.spyOn(findAiRunAnswerArgs.finder, 'findAiRunsByCorrelationId')

        await suite.findAiRunAnswer(findAiRunAnswerArgs)

        expect(findAiRunsByCorrelationIdSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should answer with what the finder found', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'correlation',
              parameterText: 'correlation-id-10900003',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
            runCount: 100,
          },
          tally: {
            aiRuns: [
              {
                id: 10900003,
                runKey: 'run-key-10900003',
              },
            ],
            aiRunSteps: [],
            aiModelCalls: [],
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'correlation',
              parameterText: 'correlation-id-10900004',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            now: new Date('2026-01-31T09:15:00.000Z'),
            runCount: 20,
          },
          tally: {
            aiRuns: [],
            aiRunSteps: [],
            aiModelCalls: [],
          },
        },
      ]

      test.each(cases)('parameterText: $input.commandInput.parameterText', async ({
        input,
        tally,
      }) => {
        const suite = CorrelationAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunsByCorrelationId: async () => tally,
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

describe('CorrelationAiRunOperatorCommandSuite', () => {
  describe('#reportAnswer()', () => {
    describe('should hand the rows to the reporter', () => {
      const cases = [
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10900007',
              },
            ],
            aiRunSteps: [],
          },
          expected: {
            rows: [
              {
                runKey: 'run-key-10900007',
              },
            ],
          },
        },
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10900008',
              },
              {
                runKey: 'run-key-10900009',
              },
            ],
            aiRunSteps: [
              {
                stepIndex: 3,
              },
            ],
          },
          expected: {
            rows: [
              {
                runKey: 'run-key-10900008',
              },
              {
                runKey: 'run-key-10900009',
              },
            ],
          },
        },
      ]

      test.each(cases)('rows[0].runKey: $input.rows.0.runKey', ({
        input,
        expected,
      }) => {
        const suite = CorrelationAiRunOperatorCommandSuite.create({
          input: {
            commandName: 'correlation', // Fill the unrelated required argument with a neutral value
            parameterText: 'correlation-id-10900005',
            stalledForSeconds: Number.NaN,
            failedSince: null,
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
