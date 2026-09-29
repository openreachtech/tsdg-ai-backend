import StalledAiRunOperatorCommandSuite from '../../../../../app/operatorCommand/suites/StalledAiRunOperatorCommandSuite.js'

import BaseAiRunOperatorCommandSuite from '../../../../../app/operatorCommand/BaseAiRunOperatorCommandSuite.js'
import AiRunOperatorCommandInputValidator from '../../../../../app/operatorCommand/AiRunOperatorCommandInputValidator.js'

/*
 * The command answering which runs have been running longer than a threshold.
 *
 * The validator is the real one: which of its rules this command asks is the whole of what
 * `#isValidParameter()` decides, and a case whose parameter passes another rule and fails this one
 * is what tells a right answer from an accident. The finder is a stub, because the real one opens
 * a database and this command's own job ends at handing it a threshold.
 */

describe('StalledAiRunOperatorCommandSuite', () => {
  describe('super class', () => {
    test('to be instance of BaseAiRunOperatorCommandSuite', () => {
      const received = StalledAiRunOperatorCommandSuite.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunOperatorCommandSuite)
    })
  })
})

describe('StalledAiRunOperatorCommandSuite', () => {
  describe('.get:commandName', () => {
    test('should be the word an operator types', () => {
      const received = StalledAiRunOperatorCommandSuite.commandName

      expect(received)
        .toBe('stalled')
    })
  })
})

describe('StalledAiRunOperatorCommandSuite', () => {
  describe('#isValidParameter()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'stalled',
            parameterText: '1',
            stalledForSeconds: 1,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: '300',
            stalledForSeconds: 300,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', ({
        input,
      }) => {
        const suite = StalledAiRunOperatorCommandSuite.create({
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
            commandName: 'stalled',
            parameterText: '0',
            stalledForSeconds: 0,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: 'run-key-10900001', // passes the run-key rule; this command asks another
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const suite = StalledAiRunOperatorCommandSuite.create({
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

describe('StalledAiRunOperatorCommandSuite', () => {
  describe('#findAiRunAnswer()', () => {
    describe('should ask the finder for the stalled runs', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'stalled',
              parameterText: '300',
              stalledForSeconds: 300,
              failedSince: null,
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
            runCount: 100,
          },
          expected: {
            stalledForSeconds: 300,
            now: new Date('2026-09-28T00:00:00.000Z'),
            limit: 100,
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'stalled',
              parameterText: '60',
              stalledForSeconds: 60,
              failedSince: null,
            },
            now: new Date('2026-01-31T09:15:00.000Z'),
            runCount: 20,
          },
          expected: {
            stalledForSeconds: 60,
            now: new Date('2026-01-31T09:15:00.000Z'),
            limit: 20,
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.commandInput.stalledForSeconds', async ({
        input,
        expected,
      }) => {
        const suite = StalledAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findStalledAiRuns: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          now: input.now,
          runCount: input.runCount,
        }
        const findStalledAiRunsSpy = jest.spyOn(findAiRunAnswerArgs.finder, 'findStalledAiRuns')

        await suite.findAiRunAnswer(findAiRunAnswerArgs)

        expect(findStalledAiRunsSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should answer with what the finder found', () => {
      const cases = [
        {
          input: {
            commandInput: {
              commandName: 'stalled',
              parameterText: '300',
              stalledForSeconds: 300,
              failedSince: null,
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
            runCount: 100,
          },
          tally: {
            aiRuns: [
              {
                id: 10900001,
                runKey: 'run-key-10900001',
              },
            ],
            aiRunSteps: [],
            aiModelCalls: [],
          },
        },
        {
          input: {
            commandInput: {
              commandName: 'stalled',
              parameterText: '900',
              stalledForSeconds: 900,
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

      test.each(cases)('stalledForSeconds: $input.commandInput.stalledForSeconds', async ({
        input,
        tally,
      }) => {
        const suite = StalledAiRunOperatorCommandSuite.create({
          input: input.commandInput,
        })

        const findAiRunAnswerArgs = {
          finder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findStalledAiRuns: async () => tally,
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

describe('StalledAiRunOperatorCommandSuite', () => {
  describe('#reportAnswer()', () => {
    describe('should hand the rows to the reporter', () => {
      const cases = [
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10900001',
              },
            ],
            aiRunSteps: [],
          },
          expected: {
            rows: [
              {
                runKey: 'run-key-10900001',
              },
            ],
          },
        },
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10900002',
              },
              {
                runKey: 'run-key-10900003',
              },
            ],
            aiRunSteps: [
              {
                stepIndex: 1,
              },
            ],
          },
          expected: {
            rows: [
              {
                runKey: 'run-key-10900002',
              },
              {
                runKey: 'run-key-10900003',
              },
            ],
          },
        },
      ]

      test.each(cases)('rows[0].runKey: $input.rows.0.runKey', ({
        input,
        expected,
      }) => {
        const suite = StalledAiRunOperatorCommandSuite.create({
          input: {
            commandName: 'stalled', // Fill the unrelated required argument with a neutral value
            parameterText: '300',
            stalledForSeconds: 300,
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
