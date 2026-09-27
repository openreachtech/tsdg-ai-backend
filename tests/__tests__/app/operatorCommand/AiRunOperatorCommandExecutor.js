import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunOperatorCommandExecutor from '../../../../app/operatorCommand/AiRunOperatorCommandExecutor.js'

import AiRunOperatorCommandInputAdapter from '../../../../app/operatorCommand/AiRunOperatorCommandInputAdapter.js'
import AiRunOperatorCommandInputValidator from '../../../../app/operatorCommand/AiRunOperatorCommandInputValidator.js'
import AiRunOperatorFinder from '../../../../app/operatorCommand/AiRunOperatorFinder.js'
import AiRunOperatorReporter from '../../../../app/operatorCommand/AiRunOperatorReporter.js'

import CorrelationAiRunOperatorCommandSuite from '../../../../app/operatorCommand/suites/CorrelationAiRunOperatorCommandSuite.js'
import FailedSinceAiRunOperatorCommandSuite from '../../../../app/operatorCommand/suites/FailedSinceAiRunOperatorCommandSuite.js'
import RunKeyAiRunOperatorCommandSuite from '../../../../app/operatorCommand/suites/RunKeyAiRunOperatorCommandSuite.js'
import StalledAiRunOperatorCommandSuite from '../../../../app/operatorCommand/suites/StalledAiRunOperatorCommandSuite.js'

import AiRunPageResponseBuilder from '../../../../app/aiRun/AiRunPageResponseBuilder.js'

/*
 * The whole of one operator command, from the arguments to the exit code.
 *
 * The finder, the reporter and the row builder are stubs, because each of them is a seam this
 * class holds and not work it does: the finder opens a database, the reporter writes to a
 * terminal, and the row builder is exercised for real by its own tests. What is left, and what
 * every case below is about, is this class's own share — which command a word names, which rule
 * its parameter is held to, which code comes back, and whether an answer of no runs reaches the
 * sentence rather than an empty table.
 *
 * The command suites are real. Which finder method a command reaches is the thing being asserted,
 * and substituting the class that decides it would assert the substitute.
 */

describe('AiRunOperatorCommandExecutor', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunOperatorFinder', () => {
        const cases = [
          {
            input: {
              aiRunOperatorFinder: AiRunOperatorFinder.create(),
            },
          },
          {
            input: {
              aiRunOperatorFinder: AiRunOperatorFinder.create({
                aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
              }),
            },
          },
        ]

        test.each(cases)('$#', ({
          input,
        }) => {
          const executor = new AiRunOperatorCommandExecutor({
            aiRunOperatorFinder: input.aiRunOperatorFinder,
            aiRunOperatorReporter: AiRunOperatorReporter.create(), // Fill the unrelated required argument with a neutral value
            aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
            now: new Date('2026-09-28T00:00:00.000Z'),
          })

          expect(executor)
            .toHaveProperty('aiRunOperatorFinder', input.aiRunOperatorFinder)
        })
      })

      describe('#aiRunOperatorReporter', () => {
        const cases = [
          {
            input: {
              aiRunOperatorReporter: AiRunOperatorReporter.create(),
            },
          },
          {
            input: {
              aiRunOperatorReporter: AiRunOperatorReporter.create({
                sink: process.stderr,
              }),
            },
          },
        ]

        test.each(cases)('$#', ({
          input,
        }) => {
          const executor = new AiRunOperatorCommandExecutor({
            aiRunOperatorFinder: AiRunOperatorFinder.create(), // Fill the unrelated required argument with a neutral value
            aiRunOperatorReporter: input.aiRunOperatorReporter,
            aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
            now: new Date('2026-09-28T00:00:00.000Z'),
          })

          expect(executor)
            .toHaveProperty('aiRunOperatorReporter', input.aiRunOperatorReporter)
        })
      })

      describe('#aiRunPageResponseBuilder', () => {
        const cases = [
          {
            input: {
              aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
            },
          },
          {
            input: {
              aiRunPageResponseBuilder: AiRunPageResponseBuilder.create({}),
            },
          },
        ]

        test.each(cases)('$#', ({
          input,
        }) => {
          const executor = new AiRunOperatorCommandExecutor({
            aiRunOperatorFinder: AiRunOperatorFinder.create(), // Fill the unrelated required argument with a neutral value
            aiRunOperatorReporter: AiRunOperatorReporter.create(),
            aiRunPageResponseBuilder: input.aiRunPageResponseBuilder,
            now: new Date('2026-09-28T00:00:00.000Z'),
          })

          expect(executor)
            .toHaveProperty('aiRunPageResponseBuilder', input.aiRunPageResponseBuilder)
        })
      })

      describe('#now', () => {
        const cases = [
          {
            input: {
              now: new Date('2026-09-28T00:00:00.000Z'),
            },
          },
          {
            input: {
              now: new Date('2026-01-31T09:15:00.000Z'),
            },
          },
        ]

        test.each(cases)('now: $input.now', ({
          input,
        }) => {
          const executor = new AiRunOperatorCommandExecutor({
            aiRunOperatorFinder: AiRunOperatorFinder.create(), // Fill the unrelated required argument with a neutral value
            aiRunOperatorReporter: AiRunOperatorReporter.create(),
            aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
            now: input.now,
          })

          expect(executor)
            .toHaveProperty('now', input.now)
        })
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            now: new Date('2026-09-28T00:00:00.000Z'),
          },
        },
        {
          input: {
            now: new Date('2026-01-31T09:15:00.000Z'),
          },
        },
      ]

      test.each(cases)('now: $input.now', ({
        input,
      }) => {
        const received = AiRunOperatorCommandExecutor.create(input)

        expect(received)
          .toBeInstanceOf(AiRunOperatorCommandExecutor)
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            aiRunOperatorFinder: AiRunOperatorFinder.create(),
            aiRunOperatorReporter: AiRunOperatorReporter.create(),
            aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
            now: new Date('2026-09-28T00:00:00.000Z'),
          },
        },
        {
          input: {
            aiRunOperatorFinder: AiRunOperatorFinder.create(),
            aiRunOperatorReporter: AiRunOperatorReporter.create(),
            aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
            now: new Date('2026-01-31T09:15:00.000Z'),
          },
        },
      ]

      test.each(cases)('now: $input.now', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunOperatorCommandExecutor)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.create()', () => {
    describe('should use default now value', () => {
      const cases = [
        {
          override: {
            now: new Date('2026-09-28T00:00:00.000Z'),
          },
        },
        {
          override: {
            now: new Date('2026-01-31T09:15:00.000Z'),
          },
        },
      ]

      test.each(cases)('now: $override.now', ({
        override,
      }) => {
        const generateCurrentInstantSpy = jest.spyOn(AiRunOperatorCommandExecutor, 'generateCurrentInstant')
          .mockReturnValue(override.now)

        const executor = AiRunOperatorCommandExecutor.create()

        expect(executor)
          .toHaveProperty('now', override.now)
        expect(generateCurrentInstantSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.create()', () => {
    describe('should use default collaborator values', () => {
      const cases = [
        {
          input: {
            propertyName: 'aiRunOperatorFinder',
          },
          expected: AiRunOperatorFinder,
        },
        {
          input: {
            propertyName: 'aiRunOperatorReporter',
          },
          expected: AiRunOperatorReporter,
        },
        {
          input: {
            propertyName: 'aiRunPageResponseBuilder',
          },
          expected: AiRunPageResponseBuilder,
        },
      ]

      test.each(cases)('propertyName: $input.propertyName', ({
        input,
        expected,
      }) => {
        const executor = AiRunOperatorCommandExecutor.create()

        expect(executor)
          .toHaveProperty(input.propertyName, expect.any(expected))
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.get:commandSuiteCtors', () => {
    test('should hold every command this version offers', () => {
      const expected = [
        StalledAiRunOperatorCommandSuite,
        FailedSinceAiRunOperatorCommandSuite,
        RunKeyAiRunOperatorCommandSuite,
        CorrelationAiRunOperatorCommandSuite,
      ]

      const received = AiRunOperatorCommandExecutor.commandSuiteCtors

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.get:mentsuLogger', () => {
    test('should be a logger client', () => {
      const received = AiRunOperatorCommandExecutor.mentsuLogger

      expect(received)
        .toBeInstanceOf(MentsuLogger)
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.createAiRunOperatorFinder()', () => {
    test('should be an instance of the finder', () => {
      const received = AiRunOperatorCommandExecutor.createAiRunOperatorFinder()

      expect(received)
        .toBeInstanceOf(AiRunOperatorFinder)
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.createAiRunOperatorReporter()', () => {
    test('should be an instance of the reporter', () => {
      const received = AiRunOperatorCommandExecutor.createAiRunOperatorReporter()

      expect(received)
        .toBeInstanceOf(AiRunOperatorReporter)
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.createAiRunPageResponseBuilder()', () => {
    test('should be an instance of the row builder', () => {
      const received = AiRunOperatorCommandExecutor.createAiRunPageResponseBuilder()

      expect(received)
        .toBeInstanceOf(AiRunPageResponseBuilder)
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.generateCurrentInstant()', () => {
    test('should be an instant', () => {
      const received = AiRunOperatorCommandExecutor.generateCurrentInstant()

      expect(received)
        .toBeInstanceOf(Date)
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('.extractCommandSuiteCtor()', () => {
    describe('with a word a command answers to', () => {
      const cases = [
        {
          input: {
            commandName: 'stalled',
          },
          expected: StalledAiRunOperatorCommandSuite,
        },
        {
          input: {
            commandName: 'failed-since',
          },
          expected: FailedSinceAiRunOperatorCommandSuite,
        },
        {
          input: {
            commandName: 'run',
          },
          expected: RunKeyAiRunOperatorCommandSuite,
        },
        {
          input: {
            commandName: 'correlation',
          },
          expected: CorrelationAiRunOperatorCommandSuite,
        },
      ]

      test.each(cases)('commandName: $input.commandName', ({
        input,
        expected,
      }) => {
        const received = AiRunOperatorCommandExecutor.extractCommandSuiteCtor(input)

        expect(received)
          .toBe(expected) // same reference
      })
    })

    describe('with a word no command answers to', () => {
      const cases = [
        {
          input: {
            commandName: 'stall',
          },
        },
        {
          input: {
            commandName: 'cancel',
          },
        },
        {
          input: {
            commandName: null,
          },
        },
      ]

      test.each(cases)('commandName: $input.commandName', ({
        input,
      }) => {
        const received = AiRunOperatorCommandExecutor.extractCommandSuiteCtor(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          now: new Date('2026-09-28T00:00:00.000Z'),
        },
      },
      {
        input: {
          now: new Date('2026-01-31T09:15:00.000Z'),
        },
      },
    ]

    test.each(cases)('now: $input.now', ({
      input,
    }) => {
      const executor = AiRunOperatorCommandExecutor.create(input)

      const received = executor.Ctor

      expect(received)
        .toBe(AiRunOperatorCommandExecutor) // same reference
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('#createInputAdapter()', () => {
    const cases = [
      {
        input: {
          argumentTexts: [
            'stalled',
            '300',
          ],
        },
      },
      {
        input: {
          argumentTexts: [
            'run',
            'run-key-10900001',
          ],
        },
      },
    ]

    test.each(cases)('argumentTexts[0]: $input.argumentTexts.0', ({
      input,
    }) => {
      const executor = AiRunOperatorCommandExecutor.create({
        now: new Date('2026-09-28T00:00:00.000Z'),
      })

      const received = executor.createInputAdapter(input)

      expect(received)
        .toBeInstanceOf(AiRunOperatorCommandInputAdapter)
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('#createInputValidator()', () => {
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
            parameterText: 'run-key-10900002',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      },
    ]

    test.each(cases)('commandName: $input.input.commandName', ({
      input,
    }) => {
      const executor = AiRunOperatorCommandExecutor.create({
        now: new Date('2026-09-28T00:00:00.000Z'),
      })

      const received = executor.createInputValidator(input)

      expect(received)
        .toBeInstanceOf(AiRunOperatorCommandInputValidator)
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('#buildAiRunRows()', () => {
    describe('should ask the builder for a row per run', () => {
      const cases = [
        {
          input: {
            answer: {
              aiRuns: [
                {
                  id: 10900001,
                },
                {
                  id: 10900002,
                },
              ],
              aiRunSteps: [],
              aiModelCalls: [],
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
          },
          expected: [
            [
              {
                aiRun: {
                  id: 10900001,
                },
                aiRunSteps: [],
                aiModelCalls: [],
                now: new Date('2026-09-28T00:00:00.000Z'),
              },
            ],
            [
              {
                aiRun: {
                  id: 10900002,
                },
                aiRunSteps: [],
                aiModelCalls: [],
                now: new Date('2026-09-28T00:00:00.000Z'),
              },
            ],
          ],
        },
        {
          input: {
            answer: {
              aiRuns: [
                {
                  id: 10900003,
                },
                {
                  id: 10900004,
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
                  inputTokenCount: 13,
                },
              ],
            },
            now: new Date('2026-01-31T09:15:00.000Z'),
          },
          expected: [
            [
              {
                aiRun: {
                  id: 10900003,
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
                    inputTokenCount: 13,
                  },
                ],
                now: new Date('2026-01-31T09:15:00.000Z'),
              },
            ],
            [
              {
                aiRun: {
                  id: 10900004,
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
                    inputTokenCount: 13,
                  },
                ],
                now: new Date('2026-01-31T09:15:00.000Z'),
              },
            ],
          ],
        },
      ]

      test.each(cases)('now: $input.now', ({
        input,
        expected,
      }) => {
        const aiRunPageResponseBuilder = {
          /**
           * @returns {*} The row.
           */
          buildAiRunRowResponse: () => ({
            runKey: 'run-key-10900001',
          }),
        }
        const buildAiRunRowResponseSpy = jest.spyOn(aiRunPageResponseBuilder, 'buildAiRunRowResponse')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunPageResponseBuilder,
          now: input.now,
        })

        executor.buildAiRunRows({
          answer: input.answer,
        })

        const [
          firstCall,
          secondCall,
        ] = expected

        expect(buildAiRunRowResponseSpy)
          .toHaveBeenNthCalledWith(1, ...firstCall)
        expect(buildAiRunRowResponseSpy)
          .toHaveBeenNthCalledWith(2, ...secondCall)
      })
    })

    describe('with no run at all', () => {
      const cases = [
        {
          input: {
            answer: {
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            },
            now: new Date('2026-09-28T00:00:00.000Z'),
          },
        },
        {
          input: {
            answer: {
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            },
            now: new Date('2026-01-31T09:15:00.000Z'),
          },
        },
      ]

      test.each(cases)('now: $input.now', ({
        input,
      }) => {
        const executor = AiRunOperatorCommandExecutor.create({
          aiRunPageResponseBuilder: {
            /**
             * @returns {*} The row.
             */
            buildAiRunRowResponse: () => ({
              runKey: 'run-key-10900001',
            }),
          },
          now: input.now,
        })

        const received = executor.buildAiRunRows({
          answer: input.answer,
        })

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('#reportAnswer()', () => {
    describe('with rows the command found', () => {
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
                AiRunId: 10900002,
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
        const aiRunOperatorReporter = {
          /**
           * @returns {void}
           */
          reportAiRunRows: () => {},

          /**
           * @returns {void}
           */
          reportNothingFound: () => {},
        }
        const reportAiRunRowsSpy = jest.spyOn(aiRunOperatorReporter, 'reportAiRunRows')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorReporter,
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        executor.reportAnswer({
          commandSuite: StalledAiRunOperatorCommandSuite.create({
            input: {
              commandName: 'stalled',
              parameterText: '300',
              stalledForSeconds: 300,
              failedSince: null,
            },
          }),
          rows: input.rows,
          aiRunSteps: input.aiRunSteps,
        })

        expect(reportAiRunRowsSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('with no row at all', () => {
      const cases = [
        {
          input: {
            commandSuiteCtor: StalledAiRunOperatorCommandSuite,
          },
          expected: {
            label: 'stalled',
          },
        },
        {
          input: {
            commandSuiteCtor: CorrelationAiRunOperatorCommandSuite,
          },
          expected: {
            label: 'correlation',
          },
        },
      ]

      test.each(cases)('commandSuiteCtor: $input.commandSuiteCtor.name', ({
        input,
        expected,
      }) => {
        const aiRunOperatorReporter = {
          /**
           * @returns {void}
           */
          reportAiRunRows: () => {},

          /**
           * @returns {void}
           */
          reportNothingFound: () => {},
        }
        const reportNothingFoundSpy = jest.spyOn(aiRunOperatorReporter, 'reportNothingFound')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorReporter,
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        executor.reportAnswer({
          commandSuite: input.commandSuiteCtor.create({
            input: {
              commandName: null, // Fill the unrelated required argument with a neutral value
              parameterText: null,
              stalledForSeconds: null,
              failedSince: null,
            },
          }),
          rows: [],
          aiRunSteps: [],
        })

        expect(reportNothingFoundSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('with no row at all, should draw no table', () => {
      const cases = [
        {
          input: {
            commandSuiteCtor: StalledAiRunOperatorCommandSuite,
          },
        },
        {
          input: {
            commandSuiteCtor: FailedSinceAiRunOperatorCommandSuite,
          },
        },
      ]

      test.each(cases)('commandSuiteCtor: $input.commandSuiteCtor.name', ({
        input,
      }) => {
        const aiRunOperatorReporter = {
          /**
           * @returns {void}
           */
          reportAiRunRows: () => {},

          /**
           * @returns {void}
           */
          reportNothingFound: () => {},
        }
        const reportAiRunRowsSpy = jest.spyOn(aiRunOperatorReporter, 'reportAiRunRows')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorReporter,
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        executor.reportAnswer({
          commandSuite: input.commandSuiteCtor.create({
            input: {
              commandName: null, // Fill the unrelated required argument with a neutral value
              parameterText: null,
              stalledForSeconds: null,
              failedSince: null,
            },
          }),
          rows: [],
          aiRunSteps: [],
        })

        expect(reportAiRunRowsSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('#reportFailure()', () => {
    describe('should write the line that says a command could not answer', () => {
      const cases = [
        {
          input: {
            commandSuiteCtor: StalledAiRunOperatorCommandSuite,
            error: new Error('the database would not open'),
          },
          expected: {
            message: 'AiRunOperatorCommandExecutor#executeCommand() could not answer stalled: the database would not open',
            tags: [
              'AiRunOperatorCommand',
              'UnansweredCommand',
            ],
          },
        },
        {
          input: {
            commandSuiteCtor: RunKeyAiRunOperatorCommandSuite,
            error: new Error('the read timed out'),
          },
          expected: {
            message: 'AiRunOperatorCommandExecutor#executeCommand() could not answer run: the read timed out',
            tags: [
              'AiRunOperatorCommand',
              'UnansweredCommand',
            ],
          },
        },
      ]

      test.each(cases)('commandSuiteCtor: $input.commandSuiteCtor.name', ({
        input,
        expected,
      }) => {
        const errorSpy = jest.spyOn(AiRunOperatorCommandExecutor.mentsuLogger, 'error')
          .mockReturnValue(null)

        const executor = AiRunOperatorCommandExecutor.create({
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        executor.reportFailure({
          commandSuite: input.commandSuiteCtor.create({
            input: {
              commandName: null, // Fill the unrelated required argument with a neutral value
              parameterText: null,
              stalledForSeconds: null,
              failedSince: null,
            },
          }),
          error: input.error,
        })

        expect(errorSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('#answerCommand()', () => {
    describe('when the read answered', () => {
      const cases = [
        {
          input: {
            parameterText: '300',
            stalledForSeconds: 300,
          },
          expected: 0,
        },
        {
          input: {
            parameterText: '900',
            stalledForSeconds: 900,
          },
          expected: 0,
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', async ({
        input,
        expected,
      }) => {
        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findStalledAiRuns: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        const received = await executor.answerCommand({
          commandSuite: StalledAiRunOperatorCommandSuite.create({
            input: {
              commandName: 'stalled',
              parameterText: input.parameterText,
              stalledForSeconds: input.stalledForSeconds,
              failedSince: null,
            },
          }),
        })

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the read threw', () => {
      const cases = [
        {
          input: {
            error: new Error('the database would not open'),
          },
          expected: 1,
        },
        {
          input: {
            error: new Error('the read timed out'),
          },
          expected: 1,
        },
      ]

      test.each(cases)('error.message: $input.error.message', async ({
        input,
        expected,
      }) => {
        jest.spyOn(AiRunOperatorCommandExecutor.mentsuLogger, 'error')
          .mockReturnValue(null)

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findStalledAiRuns: async () => {
              throw input.error
            },
          },
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        const received = await executor.answerCommand({
          commandSuite: StalledAiRunOperatorCommandSuite.create({
            input: {
              commandName: 'stalled',
              parameterText: '300',
              stalledForSeconds: 300,
              failedSince: null,
            },
          }),
        })

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunOperatorCommandExecutor', () => {
  describe('#executeCommand()', () => {
    describe('should dispatch the stalled command', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
              '300',
            ],
            now: new Date('2026-09-28T00:00:00.000Z'),
          },
          expected: {
            stalledForSeconds: 300,
            now: new Date('2026-09-28T00:00:00.000Z'),
            limit: 100,
          },
        },
        {
          input: {
            argumentTexts: [
              'stalled',
              '900',
            ],
            now: new Date('2026-01-31T09:15:00.000Z'),
          },
          expected: {
            stalledForSeconds: 900,
            now: new Date('2026-01-31T09:15:00.000Z'),
            limit: 100,
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', async ({
        input,
        expected,
      }) => {
        const aiRunOperatorFinder = {
          /**
           * @returns {Promise<*>} The answer.
           */
          findStalledAiRuns: async () => ({
            aiRuns: [],
            aiRunSteps: [],
            aiModelCalls: [],
          }),
        }
        const findStalledAiRunsSpy = jest.spyOn(aiRunOperatorFinder, 'findStalledAiRuns')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder,
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: input.now,
        })

        await executor.executeCommand({
          argumentTexts: input.argumentTexts,
        })

        expect(findStalledAiRunsSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should dispatch the failed-since command', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'failed-since',
              '2026-09-28T00:00:00.000Z',
            ],
            now: new Date('2026-09-28T10:00:00.000Z'),
          },
          expected: {
            failedSince: new Date('2026-09-28T00:00:00.000Z'),
            limit: 100,
          },
        },
        {
          input: {
            argumentTexts: [
              'failed-since',
              '2026-01-31T09:15:00.000Z',
            ],
            now: new Date('2026-02-01T00:00:00.000Z'),
          },
          expected: {
            failedSince: new Date('2026-01-31T09:15:00.000Z'),
            limit: 100,
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', async ({
        input,
        expected,
      }) => {
        const aiRunOperatorFinder = {
          /**
           * @returns {Promise<*>} The answer.
           */
          findFailedAiRuns: async () => ({
            aiRuns: [],
            aiRunSteps: [],
            aiModelCalls: [],
          }),
        }
        const findFailedAiRunsSpy = jest.spyOn(aiRunOperatorFinder, 'findFailedAiRuns')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder,
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: input.now,
        })

        await executor.executeCommand({
          argumentTexts: input.argumentTexts,
        })

        expect(findFailedAiRunsSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should dispatch the run command', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'run',
              'run-key-10900001',
            ],
            now: new Date('2026-09-28T00:00:00.000Z'),
          },
          expected: {
            runKey: 'run-key-10900001',
          },
        },
        {
          input: {
            argumentTexts: [
              'run',
              'run-key-10900002',
            ],
            now: new Date('2026-01-31T09:15:00.000Z'),
          },
          expected: {
            runKey: 'run-key-10900002',
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', async ({
        input,
        expected,
      }) => {
        const aiRunOperatorFinder = {
          /**
           * @returns {Promise<*>} The answer.
           */
          findAiRunByRunKey: async () => ({
            aiRun: null,
            aiRunSteps: [],
            aiModelCalls: [],
          }),
        }
        const findAiRunByRunKeySpy = jest.spyOn(aiRunOperatorFinder, 'findAiRunByRunKey')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder,
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: input.now,
        })

        await executor.executeCommand({
          argumentTexts: input.argumentTexts,
        })

        expect(findAiRunByRunKeySpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should dispatch the correlation command', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'correlation',
              'correlation-id-10900001',
            ],
            now: new Date('2026-09-28T00:00:00.000Z'),
          },
          expected: {
            correlationId: 'correlation-id-10900001',
            limit: 100,
          },
        },
        {
          input: {
            argumentTexts: [
              'correlation',
              'correlation-id-10900002',
            ],
            now: new Date('2026-01-31T09:15:00.000Z'),
          },
          expected: {
            correlationId: 'correlation-id-10900002',
            limit: 100,
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', async ({
        input,
        expected,
      }) => {
        const aiRunOperatorFinder = {
          /**
           * @returns {Promise<*>} The answer.
           */
          findAiRunsByCorrelationId: async () => ({
            aiRuns: [],
            aiRunSteps: [],
            aiModelCalls: [],
          }),
        }
        const findAiRunsByCorrelationIdSpy = jest.spyOn(aiRunOperatorFinder, 'findAiRunsByCorrelationId')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder,
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: input.now,
        })

        await executor.executeCommand({
          argumentTexts: input.argumentTexts,
        })

        expect(findAiRunsByCorrelationIdSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should answer with the successful exit code', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
              '300',
            ],
          },
          expected: 0,
        },
        {
          input: {
            argumentTexts: [
              'failed-since',
              '2026-09-28T00:00:00.000Z',
            ],
          },
          expected: 0,
        },
        {
          input: {
            argumentTexts: [
              'run',
              'run-key-10900001',
            ],
          },
          expected: 0,
        },
        {
          input: {
            argumentTexts: [
              'correlation',
              'correlation-id-10900001',
            ],
          },
          expected: 0,
        },
      ]

      test.each(cases)('argumentTexts[0]: $input.argumentTexts.0', async ({
        input,
        expected,
      }) => {
        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findStalledAiRuns: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),

            /**
             * @returns {Promise<*>} The answer.
             */
            findFailedAiRuns: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),

            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunsByCorrelationId: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),

            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunByRunKey: async () => ({
              aiRun: null,
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        const received = await executor.executeCommand(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer with the malformed-argument exit code', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stall',
              '300',
            ],
          },
          expected: 2,
        },
        {
          input: {
            argumentTexts: [],
          },
          expected: 2,
        },
        {
          input: {
            argumentTexts: [
              'stalled',
            ],
          },
          expected: 2,
        },
        {
          input: {
            argumentTexts: [
              'stalled',
              'three-hundred',
            ],
          },
          expected: 2,
        },
        {
          input: {
            argumentTexts: [
              'failed-since',
              'yesterday',
            ],
          },
          expected: 2,
        },
        {
          input: {
            argumentTexts: [
              'run',
              'a run key with spaces',
            ],
          },
          expected: 2,
        },
        {
          input: {
            argumentTexts: [
              'correlation',
              '',
            ],
          },
          expected: 2,
        },
      ]

      test.each(cases)('argumentTexts: $input.argumentTexts', async ({
        input,
        expected,
      }) => {
        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findStalledAiRuns: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),

            /**
             * @returns {Promise<*>} The answer.
             */
            findFailedAiRuns: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),

            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunsByCorrelationId: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),

            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunByRunKey: async () => ({
              aiRun: null,
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        const received = await executor.executeCommand(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('should read nothing when the arguments are malformed', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stall',
              '300',
            ],
          },
        },
        {
          input: {
            argumentTexts: [
              'stalled',
            ],
          },
        },
        {
          input: {
            argumentTexts: [
              'stalled',
              'three-hundred',
            ],
          },
        },
      ]

      test.each(cases)('argumentTexts: $input.argumentTexts', async ({
        input,
      }) => {
        const aiRunOperatorFinder = {
          /**
           * @returns {Promise<*>} The answer.
           */
          findStalledAiRuns: async () => ({
            aiRuns: [],
            aiRunSteps: [],
            aiModelCalls: [],
          }),
        }
        const findStalledAiRunsSpy = jest.spyOn(aiRunOperatorFinder, 'findStalledAiRuns')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder,
          aiRunOperatorReporter: {
            /**
             * @returns {void}
             */
            reportNothingFound: () => {},
          },
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        await executor.executeCommand(input)

        expect(findStalledAiRunsSpy)
          .not
          .toHaveBeenCalled()
      })
    })

    describe('should say nothing was found rather than draw an empty table', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
              '300',
            ],
          },
          expected: {
            label: 'stalled',
          },
        },
        {
          input: {
            argumentTexts: [
              'run',
              'run-key-10900001',
            ],
          },
          expected: {
            label: 'run',
          },
        },
      ]

      test.each(cases)('argumentTexts[0]: $input.argumentTexts.0', async ({
        input,
        expected,
      }) => {
        const aiRunOperatorReporter = {
          /**
           * @returns {void}
           */
          reportAiRunRows: () => {},

          /**
           * @returns {void}
           */
          reportAiRunDetail: () => {},

          /**
           * @returns {void}
           */
          reportNothingFound: () => {},
        }
        const reportNothingFoundSpy = jest.spyOn(aiRunOperatorReporter, 'reportNothingFound')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findStalledAiRuns: async () => ({
              aiRuns: [],
              aiRunSteps: [],
              aiModelCalls: [],
            }),

            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunByRunKey: async () => ({
              aiRun: null,
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          aiRunOperatorReporter,
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        await executor.executeCommand(input)

        expect(reportNothingFoundSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should report the one run it found as a detail', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'run',
              'run-key-10900001',
            ],
            aiRunSteps: [
              {
                AiRunId: 10900001,
                stepIndex: 1,
              },
            ],
          },
          expected: {
            row: {
              runKey: 'run-key-10900001',
            },
            steps: [
              {
                AiRunId: 10900001,
                stepIndex: 1,
              },
            ],
          },
        },
        {
          input: {
            argumentTexts: [
              'run',
              'run-key-10900002',
            ],
            aiRunSteps: [],
          },
          expected: {
            row: {
              runKey: 'run-key-10900001',
            },
            steps: [],
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', async ({
        input,
        expected,
      }) => {
        const aiRunOperatorReporter = {
          /**
           * @returns {void}
           */
          reportAiRunDetail: () => {},

          /**
           * @returns {void}
           */
          reportNothingFound: () => {},
        }
        const reportAiRunDetailSpy = jest.spyOn(aiRunOperatorReporter, 'reportAiRunDetail')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findAiRunByRunKey: async () => ({
              aiRun: {
                id: 10900001,
              },
              aiRunSteps: input.aiRunSteps,
              aiModelCalls: [],
            }),
          },
          aiRunOperatorReporter,
          aiRunPageResponseBuilder: {
            /**
             * @returns {*} The row.
             */
            buildAiRunRowResponse: () => ({
              runKey: 'run-key-10900001',
            }),
          },
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        await executor.executeCommand({
          argumentTexts: input.argumentTexts,
        })

        expect(reportAiRunDetailSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should draw the table of the runs it found', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
              '300',
            ],
            aiRuns: [
              {
                id: 10900001,
              },
            ],
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
            argumentTexts: [
              'stalled',
              '900',
            ],
            aiRuns: [
              {
                id: 10900002,
              },
              {
                id: 10900003,
              },
            ],
          },
          expected: {
            rows: [
              {
                runKey: 'run-key-10900001',
              },
              {
                runKey: 'run-key-10900001',
              },
            ],
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', async ({
        input,
        expected,
      }) => {
        const aiRunOperatorReporter = {
          /**
           * @returns {void}
           */
          reportAiRunRows: () => {},

          /**
           * @returns {void}
           */
          reportNothingFound: () => {},
        }
        const reportAiRunRowsSpy = jest.spyOn(aiRunOperatorReporter, 'reportAiRunRows')

        const executor = AiRunOperatorCommandExecutor.create({
          aiRunOperatorFinder: {
            /**
             * @returns {Promise<*>} The answer.
             */
            findStalledAiRuns: async () => ({
              aiRuns: input.aiRuns,
              aiRunSteps: [],
              aiModelCalls: [],
            }),
          },
          aiRunOperatorReporter,
          aiRunPageResponseBuilder: {
            /**
             * @returns {*} The row.
             */
            buildAiRunRowResponse: () => ({
              runKey: 'run-key-10900001',
            }),
          },
          now: new Date('2026-09-28T12:00:00.000Z'),
        })

        await executor.executeCommand({
          argumentTexts: input.argumentTexts,
        })

        expect(reportAiRunRowsSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
