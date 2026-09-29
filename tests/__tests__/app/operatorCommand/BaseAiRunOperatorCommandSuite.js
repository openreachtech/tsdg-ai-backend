import BaseAiRunOperatorCommandSuite from '../../../../app/operatorCommand/BaseAiRunOperatorCommandSuite.js'

/*
 * The contract every operator command is held to.
 *
 * Each of the four members below throws until a subclass fills it in, and that is the whole point
 * of the class: a fifth command that forgot to name its command word, its rule, its read or its
 * answer fails loudly at the first thing it is asked rather than dispatching to nothing.
 */

describe('BaseAiRunOperatorCommandSuite', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#input', () => {
        const cases = [
          {
            input: {
              input: {
                commandName: 'stalled',
                parameterText: '300',
                stalledForSeconds: 300,
                failedSince: null,
              },
            },
          },
          {
            input: {
              input: {
                commandName: 'run',
                parameterText: 'run-key-10900001',
                stalledForSeconds: Number.NaN,
                failedSince: null,
              },
            },
          },
        ]

        test.each(cases)('commandName: $input.input.commandName', ({
          input,
        }) => {
          const suite = new BaseAiRunOperatorCommandSuite(input)

          expect(suite)
            .toHaveProperty('input', input.input)
        })
      })
    })
  })
})

describe('BaseAiRunOperatorCommandSuite', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            input: {
              commandName: 'correlation',
              parameterText: 'correlation-id-10900002',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
          },
        },
        {
          input: {
            input: {
              commandName: 'failed-since',
              parameterText: '2026-09-28T00:00:00.000Z',
              stalledForSeconds: Number.NaN,
              failedSince: new Date('2026-09-28T00:00:00.000Z'),
            },
          },
        },
      ]

      test.each(cases)('commandName: $input.input.commandName', ({
        input,
      }) => {
        const received = BaseAiRunOperatorCommandSuite.create(input)

        expect(received)
          .toBeInstanceOf(BaseAiRunOperatorCommandSuite)
      })
    })
  })
})

describe('BaseAiRunOperatorCommandSuite', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            input: {
              commandName: 'stalled',
              parameterText: '60',
              stalledForSeconds: 60,
              failedSince: null,
            },
          },
        },
        {
          input: {
            input: {
              commandName: 'run',
              parameterText: 'run-key-10900003',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
          },
        },
      ]

      test.each(cases)('commandName: $input.input.commandName', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(BaseAiRunOperatorCommandSuite)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('BaseAiRunOperatorCommandSuite', () => {
  describe('.get:commandName', () => {
    test('should throw when not inherited', () => {
      expect(() => BaseAiRunOperatorCommandSuite.commandName)
        .toThrow('BaseAiRunOperatorCommandSuite.get:commandName must be inherited')
    })
  })
})

describe('BaseAiRunOperatorCommandSuite', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          input: {
            commandName: 'stalled',
            parameterText: '300',
            stalledForSeconds: 300,
            failedSince: null,
          },
        },
      },
      {
        input: {
          input: {
            commandName: 'correlation',
            parameterText: 'correlation-id-10900004',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      },
    ]

    test.each(cases)('commandName: $input.input.commandName', ({
      input,
    }) => {
      const suite = BaseAiRunOperatorCommandSuite.create(input)

      const received = suite.Ctor

      expect(received)
        .toBe(BaseAiRunOperatorCommandSuite) // same reference
    })
  })
})

describe('BaseAiRunOperatorCommandSuite', () => {
  describe('#isValidParameter()', () => {
    const cases = [
      {
        input: {
          validator: {
            /**
             * @returns {boolean} Whether the threshold is valid.
             */
            isValidStalledForSeconds: () => true,
          },
        },
      },
      {
        input: {
          validator: {
            /**
             * @returns {boolean} Whether the run key is valid.
             */
            isValidRunKey: () => true,
          },
        },
      },
    ]

    test.each(cases)('validator: $input.validator', ({
      input,
    }) => {
      const suite = BaseAiRunOperatorCommandSuite.create({
        input: {
          commandName: null, // Fill the unrelated required argument with a neutral value
          parameterText: null,
          stalledForSeconds: null,
          failedSince: null,
        },
      })

      expect(() => suite.isValidParameter(input))
        .toThrow('BaseAiRunOperatorCommandSuite#isValidParameter() must be inherited')
    })
  })
})

describe('BaseAiRunOperatorCommandSuite', () => {
  describe('#findAiRunAnswer()', () => {
    const cases = [
      {
        input: {
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
          now: new Date('2026-09-28T00:00:00.000Z'),
          runCount: 100,
        },
      },
      {
        input: {
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
          now: new Date('2026-01-31T09:15:00.000Z'),
          runCount: 20,
        },
      },
    ]

    test.each(cases)('now: $input.now', async ({
      input,
    }) => {
      const suite = BaseAiRunOperatorCommandSuite.create({
        input: {
          commandName: null, // Fill the unrelated required argument with a neutral value
          parameterText: null,
          stalledForSeconds: null,
          failedSince: null,
        },
      })

      await expect(() => suite.findAiRunAnswer(input))
        .rejects
        .toThrow('BaseAiRunOperatorCommandSuite#findAiRunAnswer() must be inherited')
    })
  })
})

describe('BaseAiRunOperatorCommandSuite', () => {
  describe('#reportAnswer()', () => {
    const cases = [
      {
        input: {
          reporter: {
            /**
             * @returns {void}
             */
            reportAiRunRows: () => {},
          },
          rows: [
            {
              runKey: 'run-key-10900005',
            },
          ],
          aiRunSteps: [],
        },
      },
      {
        input: {
          reporter: {
            /**
             * @returns {void}
             */
            reportAiRunDetail: () => {},
          },
          rows: [
            {
              runKey: 'run-key-10900006',
            },
          ],
          aiRunSteps: [
            {
              stepIndex: 1,
            },
          ],
        },
      },
    ]

    test.each(cases)('rows[0].runKey: $input.rows.0.runKey', ({
      input,
    }) => {
      const suite = BaseAiRunOperatorCommandSuite.create({
        input: {
          commandName: null, // Fill the unrelated required argument with a neutral value
          parameterText: null,
          stalledForSeconds: null,
          failedSince: null,
        },
      })

      expect(() => suite.reportAnswer(input))
        .toThrow('BaseAiRunOperatorCommandSuite#reportAnswer() must be inherited')
    })
  })
})
