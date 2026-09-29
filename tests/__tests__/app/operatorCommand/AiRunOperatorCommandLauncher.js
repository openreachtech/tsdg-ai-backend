import {
  ProcessClerk,
} from '@openreachtech/renchan-job-bullmq'

import {
  SequelizeActivator,
} from '@openreachtech/renchan-sequelize'

import AiRunOperatorCommandLauncher from '../../../../app/operatorCommand/AiRunOperatorCommandLauncher.js'

import AiRunOperatorCommandExecutor from '../../../../app/operatorCommand/AiRunOperatorCommandExecutor.js'
import AiRunOperatorCommandInputAdapter from '../../../../app/operatorCommand/AiRunOperatorCommandInputAdapter.js'
import AiRunOperatorReporter from '../../../../app/operatorCommand/AiRunOperatorReporter.js'

import AiRun from '../../../../sequelize/models/AiRun.js'
import AiRunStep from '../../../../sequelize/models/AiRunStep.js'

/*
 * The span between the database opening and the database closing, and nothing inside it.
 *
 * AiRunOperatorCommandExecutor has its own tests and this file does not repeat them: which command
 * a word names, and which code that command comes back with, are settled there. What is asserted
 * here is the three things only this class can get wrong — that the code it ends the process under
 * is the executor's own and not one it invented, that the database is closed on the answering
 * path, on the refusing path and when the executor throws, and that this class adds no character
 * of its own to what the operator sees.
 *
 * #activateSequelize() is steered rather than run, and that is a deliberate exception to running a
 * collaborator for real. Activating a second time rebinds every model class in this worker's
 * module cache to a new client — SequelizeActivator.activateModels() calls
 * initWithSequelizeClient() on each — so a test that activated and then closed would leave the
 * shared models pointing at a closed connection and take the rest of the file down with it. The
 * real activator this suite already holds is used instead, with only its close() intercepted.
 */

describe('AiRunOperatorCommandLauncher', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#processClerk', () => {
        const cases = [
          {
            input: {
              processClerk: ProcessClerk.create(),
            },
          },
          {
            input: {
              processClerk: ProcessClerk.create({
                rawProcess: /** @type {*} */ ({
                  argv: [
                    '/usr/bin/node',
                    '/app/scripts/readAiRuns.js',
                  ],
                }),
              }),
            },
          },
        ]

        test.each(cases)('$#', ({
          input,
        }) => {
          const launcher = new AiRunOperatorCommandLauncher({
            processClerk: input.processClerk,
            AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor, // Fill the unrelated required argument with a neutral value
          })

          expect(launcher)
            .toHaveProperty('processClerk', input.processClerk)
        })
      })

      describe('#AiRunOperatorCommandExecutorCtor', () => {
        const cases = [
          {
            input: {
              AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor,
            },
          },
          {
            input: {
              AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandInputAdapter, // Any class proves the assignment; this one is only a second distinct value
            },
          },
        ]

        test.each(cases)('AiRunOperatorCommandExecutorCtor: $input.AiRunOperatorCommandExecutorCtor.name', ({
          input,
        }) => {
          const launcher = new AiRunOperatorCommandLauncher({
            processClerk: ProcessClerk.create(), // Fill the unrelated required argument with a neutral value
            AiRunOperatorCommandExecutorCtor: /** @type {*} */ (input.AiRunOperatorCommandExecutorCtor),
          })

          expect(launcher)
            .toHaveProperty('AiRunOperatorCommandExecutorCtor', input.AiRunOperatorCommandExecutorCtor)
        })
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            processClerk: ProcessClerk.create(),
            AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor,
          },
        },
        {
          input: {
            processClerk: ProcessClerk.create({
              rawProcess: /** @type {*} */ ({
                argv: [
                  '/usr/bin/node',
                  '/app/scripts/readAiRuns.js',
                  'stalled',
                ],
              }),
            }),
            AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor,
          },
        },
      ]

      test.each(cases)('$#', ({
        input,
      }) => {
        const received = AiRunOperatorCommandLauncher.create(input)

        expect(received)
          .toBeInstanceOf(AiRunOperatorCommandLauncher)
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            processClerk: ProcessClerk.create(),
            AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor,
          },
        },
        {
          input: {
            processClerk: ProcessClerk.create({
              rawProcess: /** @type {*} */ ({
                argv: [
                  '/usr/bin/node',
                  '/app/scripts/readAiRuns.js',
                  'correlation',
                ],
              }),
            }),
            AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor,
          },
        },
      ]

      test.each(cases)('$#', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunOperatorCommandLauncher)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('.create()', () => {
    describe('should use default processClerk value', () => {
      test('with no arguments', () => {
        const processClerk = ProcessClerk.create()
        const createProcessClerkSpy = jest.spyOn(AiRunOperatorCommandLauncher, 'createProcessClerk')
          .mockReturnValue(processClerk)

        const launcher = AiRunOperatorCommandLauncher.create()

        expect(launcher)
          .toHaveProperty('processClerk', processClerk)
        expect(createProcessClerkSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('.create()', () => {
    describe('should use default AiRunOperatorCommandExecutorCtor value', () => {
      test('with no arguments', () => {
        const expected = AiRunOperatorCommandExecutor

        const launcher = AiRunOperatorCommandLauncher.create()

        expect(launcher)
          .toHaveProperty('AiRunOperatorCommandExecutorCtor', expected)
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('.createProcessClerk()', () => {
    describe('when called as is', () => {
      test('should be a ProcessClerk', () => {
        const received = AiRunOperatorCommandLauncher.createProcessClerk()

        expect(received)
          .toBeInstanceOf(ProcessClerk)
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          processClerk: ProcessClerk.create(),
          AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor,
        },
      },
      {
        input: {
          processClerk: ProcessClerk.create({
            rawProcess: /** @type {*} */ ({
              argv: [
                '/usr/bin/node',
                '/app/scripts/readAiRuns.js',
                'run',
              ],
            }),
          }),
          AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor,
        },
      },
    ]

    test.each(cases)('$#', ({
      input,
    }) => {
      const launcher = AiRunOperatorCommandLauncher.create(input)

      const received = launcher.Ctor

      expect(received)
        .toBe(AiRunOperatorCommandLauncher) // same reference
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#extractArgumentTexts()', () => {
    describe('with a command and its parameter', () => {
      const cases = [
        {
          input: {
            argv: [
              '/usr/bin/node',
              '/app/scripts/readAiRuns.js',
              'stalled',
              '300',
            ],
          },
          expected: [
            'stalled',
            '300',
          ],
        },
        {
          input: {
            argv: [
              '/usr/local/bin/node',
              '/srv/scripts/readAiRuns.js',
              'correlation',
              'correlation-0001',
            ],
          },
          expected: [
            'correlation',
            'correlation-0001',
          ],
        },
        {
          input: {
            argv: [
              '/usr/bin/node',
              '/app/scripts/readAiRuns.js',
              'failed-since',
              '2026-09-27T00:00:00.000Z',
            ],
          },
          expected: [
            'failed-since',
            '2026-09-27T00:00:00.000Z',
          ],
        },
      ]

      test.each(cases)('argv[2]: $input.argv.2', ({
        input,
        expected,
      }) => {
        const launcher = AiRunOperatorCommandLauncher.create({
          processClerk: ProcessClerk.create({
            rawProcess: /** @type {*} */ ({
              argv: input.argv,
            }),
          }),
        })

        const received = launcher.extractArgumentTexts()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with nothing after the script path', () => {
      const cases = [
        {
          input: {
            argv: [
              '/usr/bin/node',
              '/app/scripts/readAiRuns.js',
            ],
          },
        },
        {
          input: {
            argv: [
              '/usr/local/bin/node',
              '/srv/scripts/readAiRuns.js',
            ],
          },
        },
      ]

      test.each(cases)('argv[1]: $input.argv.1', ({
        input,
      }) => {
        const launcher = AiRunOperatorCommandLauncher.create({
          processClerk: ProcessClerk.create({
            rawProcess: /** @type {*} */ ({
              argv: input.argv,
            }),
          }),
        })

        const received = launcher.extractArgumentTexts()

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#generateCommandExitCode()', () => {
    describe('should answer with the code the executor returned', () => {
      const cases = [
        {
          tally: 0, // answered
        },
        {
          tally: 1, // could not answer
        },
        {
          tally: 2, // the arguments were not a command
        },
      ]

      test.each(cases)('tally: $tally', async ({
        tally,
      }) => {
        const launcher = AiRunOperatorCommandLauncher.create()
        const executor = AiRunOperatorCommandExecutor.create()

        jest.spyOn(executor, 'executeCommand')
          .mockResolvedValue(tally)
        jest.spyOn(launcher, 'createAiRunOperatorCommandExecutor')
          .mockReturnValue(executor)
        jest.spyOn(launcher, 'activateSequelize')
          .mockResolvedValue(globalThis.sequelizeActivator)
        jest.spyOn(launcher, 'closeSequelize')
          .mockResolvedValue(null)

        const args = {
          argumentTexts: [
            'stalled',
            '300',
          ],
        }

        const received = await launcher.generateCommandExitCode(args)

        expect(received)
          .toBe(tally)
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#generateCommandExitCode()', () => {
    describe('should close the database', () => {
      const cases = [
        {
          input: {
            exitCode: 0, // the answering path
          },
        },
        {
          input: {
            exitCode: 1, // the read could not answer
          },
        },
        {
          input: {
            exitCode: 2, // the refusing path
          },
        },
      ]

      test.each(cases)('exitCode: $input.exitCode', async ({
        input,
      }) => {
        const activator = globalThis.sequelizeActivator
        const launcher = AiRunOperatorCommandLauncher.create()
        const executor = AiRunOperatorCommandExecutor.create()

        jest.spyOn(executor, 'executeCommand')
          .mockResolvedValue(input.exitCode)
        jest.spyOn(launcher, 'createAiRunOperatorCommandExecutor')
          .mockReturnValue(executor)
        jest.spyOn(launcher, 'activateSequelize')
          .mockResolvedValue(activator)

        const closeSequelizeSpy = jest.spyOn(launcher, 'closeSequelize')
          .mockResolvedValue(null)

        const args = {
          argumentTexts: [
            'stalled',
            '300',
          ],
        }

        await launcher.generateCommandExitCode(args)

        expect(closeSequelizeSpy)
          .toHaveBeenCalledWith({
            activator,
          })
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#generateCommandExitCode()', () => {
    describe('when the executor throws', () => {
      describe('should close the database', () => {
        const cases = [
          {
            input: {
              errorMessage: 'the database would not answer',
            },
          },
          {
            input: {
              errorMessage: 'the read was interrupted',
            },
          },
        ]

        test.each(cases)('errorMessage: $input.errorMessage', async ({
          input,
        }) => {
          const activator = globalThis.sequelizeActivator
          const launcher = AiRunOperatorCommandLauncher.create()
          const executor = AiRunOperatorCommandExecutor.create()

          jest.spyOn(executor, 'executeCommand')
            .mockRejectedValue(new Error(input.errorMessage))
          jest.spyOn(launcher, 'createAiRunOperatorCommandExecutor')
            .mockReturnValue(executor)
          jest.spyOn(launcher, 'activateSequelize')
            .mockResolvedValue(activator)

          const closeSequelizeSpy = jest.spyOn(launcher, 'closeSequelize')
            .mockResolvedValue(null)

          const args = {
            argumentTexts: [
              'stalled',
              '300',
            ],
          }

          const received = () => launcher.generateCommandExitCode(args)

          await expect(received)
            .rejects
            .toThrow(input.errorMessage)
          expect(closeSequelizeSpy)
            .toHaveBeenCalledWith({
              activator,
            })
        })
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#generateCommandExitCode()', () => {
    describe('should print nothing itself', () => {
      const cases = [
        {
          input: {
            sink: process.stdout,
          },
        },
        {
          input: {
            sink: process.stderr,
          },
        },
      ]

      test.each(cases)('sink.fd: $input.sink.fd', async ({
        input,
      }) => {
        const launcher = AiRunOperatorCommandLauncher.create()
        const executor = AiRunOperatorCommandExecutor.create()

        jest.spyOn(executor, 'executeCommand')
          .mockResolvedValue(0)
        jest.spyOn(launcher, 'createAiRunOperatorCommandExecutor')
          .mockReturnValue(executor)
        jest.spyOn(launcher, 'activateSequelize')
          .mockResolvedValue(globalThis.sequelizeActivator)
        jest.spyOn(launcher, 'closeSequelize')
          .mockResolvedValue(null)

        const args = {
          argumentTexts: [
            'stalled',
            '300',
          ],
        }
        const writeSpy = jest.spyOn(input.sink, 'write')
          .mockReturnValue(true)

        await launcher.generateCommandExitCode(args)

        expect(writeSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#createAiRunOperatorCommandExecutor()', () => {
    describe('should be an instance of the injected class', () => {
      /*
       * The second case injects a class this launcher would never really be given. It is what
       * makes the assertion mean anything: with the real executor in both cases, a method that
       * ignored the injected class and reached for the import would pass.
       */
      const cases = [
        {
          input: {
            AiRunOperatorCommandExecutorCtor: AiRunOperatorCommandExecutor,
          },
        },
        {
          input: {
            AiRunOperatorCommandExecutorCtor: AiRunOperatorReporter, // Only a second class whose create() takes no argument
          },
        },
      ]

      test.each(cases)('AiRunOperatorCommandExecutorCtor: $input.AiRunOperatorCommandExecutorCtor.name', ({
        input,
      }) => {
        const launcher = AiRunOperatorCommandLauncher.create(/** @type {*} */ (input))

        const received = launcher.createAiRunOperatorCommandExecutor()

        expect(received)
          .toBeInstanceOf(input.AiRunOperatorCommandExecutorCtor)
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#closeSequelize()', () => {
    describe('should close the client the activator holds', () => {
      const cases = [
        {
          input: {
            models: [
              AiRun,
            ],
          },
        },
        {
          input: {
            models: [
              AiRunStep,
            ],
          },
        },
      ]

      test.each(cases)('models[0].name: $input.models.0.name', async ({
        input,
      }) => {
        const activator = SequelizeActivator.create({
          sequelizeClient: globalThis.sequelizeActivator.sequelize,
          models: input.models,
        })
        const launcher = AiRunOperatorCommandLauncher.create()

        const closeSpy = jest.spyOn(activator.sequelize, 'close')
          .mockResolvedValue(null)

        const args = {
          activator,
        }

        await launcher.closeSequelize(args)

        expect(closeSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#startCommandProcess()', () => {
    describe('should end the process under the code the command answered with', () => {
      const cases = [
        {
          tally: 0, // answered
        },
        {
          tally: 1, // could not answer
        },
        {
          tally: 2, // the arguments were not a command
        },
      ]

      test.each(cases)('tally: $tally', async ({
        tally,
      }) => {
        const processClerk = ProcessClerk.create({
          rawProcess: /** @type {*} */ ({
            argv: [
              '/usr/bin/node',
              '/app/scripts/readAiRuns.js',
              'stalled',
              '300',
            ],
          }),
        })
        const launcher = AiRunOperatorCommandLauncher.create({
          processClerk,
        })

        const exitSpy = jest.spyOn(processClerk, 'exit')
          .mockReturnValue(null)

        jest.spyOn(launcher, 'generateCommandExitCode')
          .mockResolvedValue(tally)

        await launcher.startCommandProcess()

        expect(exitSpy)
          .toHaveBeenCalledWith({
            exitCode: tally,
          })
      })
    })
  })
})

describe('AiRunOperatorCommandLauncher', () => {
  describe('#startCommandProcess()', () => {
    describe('should hand the operator arguments to the command', () => {
      const cases = [
        {
          input: {
            argv: [
              '/usr/bin/node',
              '/app/scripts/readAiRuns.js',
              'stalled',
              '300',
            ],
          },
          expected: {
            argumentTexts: [
              'stalled',
              '300',
            ],
          },
        },
        {
          input: {
            argv: [
              '/usr/bin/node',
              '/app/scripts/readAiRuns.js',
              'run',
              'run-key-0001',
            ],
          },
          expected: {
            argumentTexts: [
              'run',
              'run-key-0001',
            ],
          },
        },
      ]

      test.each(cases)('argv[2]: $input.argv.2', async ({
        input,
        expected,
      }) => {
        const processClerk = ProcessClerk.create({
          rawProcess: /** @type {*} */ ({
            argv: input.argv,
          }),
        })
        const launcher = AiRunOperatorCommandLauncher.create({
          processClerk,
        })

        jest.spyOn(processClerk, 'exit')
          .mockReturnValue(null)

        const generateCommandExitCodeSpy = jest.spyOn(launcher, 'generateCommandExitCode')
          .mockResolvedValue(0)

        await launcher.startCommandProcess()

        expect(generateCommandExitCodeSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
