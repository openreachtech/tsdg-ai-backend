import ApiClientRegistrationCommandLauncher from '../../../../app/apiClient/ApiClientRegistrationCommandLauncher.js'

import ApiClientRegistrar from '../../../../app/apiClient/ApiClientRegistrar.js'

/*
 * The launcher's deciding and reporting members. `#startCommandProcess()` bootstraps Sequelize and
 * ends the process, so it is not called here; what it rests on is each tested on its own.
 */

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#sink', () => {
        const cases = [
          {
            params: {
              processClerk: {
                process: {
                  argv: [],
                },
                exit: () => null,
              },
              registrar: {
                registerApiClient: async () => null,
              },
              sink: {
                write: () => 'sink-0001',
              },
            },
          },
          {
            params: {
              processClerk: {
                process: {
                  argv: [],
                },
                exit: () => null,
              },
              registrar: {
                registerApiClient: async () => null,
              },
              sink: {
                write: () => 'sink-0002',
              },
            },
          },
        ]

        test.each(cases)('write: $params.sink.write', ({
          params,
        }) => {
          const launcher = new ApiClientRegistrationCommandLauncher(params)

          expect(launcher)
            .toHaveProperty('sink', params.sink)
        })
      })
    })
  })
})

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('.create()', () => {
    describe('should use default values', () => {
      test('should build the real registrar and write to standard output', () => {
        const expected = process.stdout

        const received = ApiClientRegistrationCommandLauncher.create()

        expect(received.registrar)
          .toBeInstanceOf(ApiClientRegistrar)
        expect(received)
          .toHaveProperty('sink', expected)
      })
    })
  })
})

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('#extractArgumentValues()', () => {
    /*
     * The Node binary and the script path occupy the first two positions, so a command's own
     * parameters begin at the third.
     */
    describe('should take the two parameters an operator typed', () => {
      const cases = [
        {
          factoryParams: {
            processClerk: {
              process: {
                argv: [
                  '/usr/bin/node',
                  'scripts/registerApiClient.js',
                  'Example client alpha',
                  'https://alpha.example.com/callbacks/',
                ],
              },
              exit: () => null,
            },
            registrar: {
              registerApiClient: async () => null,
            },
            sink: {
              write: () => null,
            },
          },
          expected: [
            'Example client alpha',
            'https://alpha.example.com/callbacks/',
          ],
        },
        {
          factoryParams: {
            processClerk: {
              process: {
                argv: [
                  '/usr/bin/node',
                  'scripts/registerApiClient.js',
                  'Example client beta',
                  'https://beta.example.com/hooks/',
                  'an argument nobody asked for',
                ],
              },
              exit: () => null,
            },
            registrar: {
              registerApiClient: async () => null,
            },
            sink: {
              write: () => null,
            },
          },
          expected: [
            'Example client beta',
            'https://beta.example.com/hooks/',
          ],
        },
      ]

      test.each(cases)('argv: $factoryParams.processClerk.process.argv', ({
        factoryParams,
        expected,
      }) => {
        const launcher = ApiClientRegistrationCommandLauncher.create(factoryParams)

        const received = launcher.extractArgumentValues()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('#generateRefusal()', () => {
    describe('should refuse what cannot be registered', () => {
      const cases = [
        {
          params: {
            name: 'Example client',
            callbackUrlPrefix: 'https://example.com/callbacks',
          },
          expected: 'the callback URL prefix must be an absolute http(s) URL ending with a slash',
        },
        {
          params: {
            name: 'Example client',
            callbackUrlPrefix: '/callbacks/',
          },
          expected: 'the callback URL prefix must be an absolute http(s) URL ending with a slash',
        },
        {
          params: {
            name: 'Example client',
            callbackUrlPrefix: 'ftp://example.com/callbacks/',
          },
          expected: 'the callback URL prefix must be an absolute http(s) URL ending with a slash',
        },
        {
          params: {
            name: '',
            callbackUrlPrefix: 'https://example.com/callbacks/',
          },
          expected: 'both a name and a callback URL prefix are required',
        },
      ]

      test.each(cases)('callbackUrlPrefix: $params.callbackUrlPrefix', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientRegistrationCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          registrar: {
            registerApiClient: async () => null,
          },
          sink: {
            write: () => null,
          },
        })

        const received = launcher.generateRefusal(params)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('#generateRefusal()', () => {
    describe('should accept what can be registered', () => {
      const cases = [
        {
          params: {
            name: 'Example client alpha',
            callbackUrlPrefix: 'https://alpha.example.com/callbacks/',
          },
        },
        {
          params: {
            name: 'Example client beta',
            callbackUrlPrefix: 'http://beta.example.com/deep/path/',
          },
        },
      ]

      test.each(cases)('callbackUrlPrefix: $params.callbackUrlPrefix', ({
        params,
      }) => {
        const launcher = ApiClientRegistrationCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          registrar: {
            registerApiClient: async () => null,
          },
          sink: {
            write: () => null,
          },
        })

        const received = launcher.generateRefusal(params)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('#buildReport()', () => {
    /*
     * The report is the client's only copy of its secret, so both issued values have to appear in
     * it. A report that printed the key alone would read as success and hand over half of what a
     * caller needs.
     */
    describe('should carry both issued values', () => {
      const cases = [
        {
          params: {
            name: 'Example client alpha',
            callbackUrlPrefix: 'https://alpha.example.com/callbacks/',
            issued: {
              clientKey: 'client-key-0031',
              secret: 'secret-0031',
            },
          },
          expected: expect.stringContaining('client-key-0031'),
        },
        {
          params: {
            name: 'Example client beta',
            callbackUrlPrefix: 'https://beta.example.com/callbacks/',
            issued: {
              clientKey: 'client-key-0032',
              secret: 'secret-0032',
            },
          },
          expected: expect.stringContaining('secret-0032'),
        },
      ]

      test.each(cases)('clientKey: $params.issued.clientKey', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientRegistrationCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          registrar: {
            registerApiClient: async () => null,
          },
          sink: {
            write: () => null,
          },
        })

        const received = launcher.buildReport(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('#writeLine()', () => {
    describe('should write the text and end the line', () => {
      const cases = [
        {
          params: {
            text: 'a line of the report 0041',
          },
          expected: 'a line of the report 0041\n',
        },
        {
          params: {
            text: 'a line of the report 0042',
          },
          expected: 'a line of the report 0042\n',
        },
      ]

      test.each(cases)('text: $params.text', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientRegistrationCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          registrar: {
            registerApiClient: async () => null,
          },
          sink: {
            write: () => null,
          },
        })
        const writeSpy = jest.spyOn(launcher.sink, 'write')

        launcher.writeLine(params)

        expect(writeSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('#startCommandProcess()', () => {
    /*
     * A refusal has to reach the caller as an exit code and not only as printed text. The clerk
     * reads `exitCode` and defaults it to 0, so a call that names the field anything else prints
     * the refusal and then reports success - which is the one failure shape a script must not have,
     * because a pipeline reads the code and never the text.
     */
    describe('should end with a failing code when it refuses', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/registerApiClient.js',
              'Example client',
              'https://example.com/callbacks',
            ],
          },
          expected: {
            exitCode: 1,
          },
        },
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/registerApiClient.js',
            ],
          },
          expected: {
            exitCode: 1,
          },
        },
      ]

      test.each(cases)('argv: $factoryParams.argv', async ({
        factoryParams,
        expected,
      }) => {
        const launcher = ApiClientRegistrationCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          registrar: {
            registerApiClient: async () => null,
          },
          sink: {
            write: () => null,
          },
        })
        const exitSpy = jest.spyOn(launcher.processClerk, 'exit')

        await launcher.startCommandProcess()

        expect(exitSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ApiClientRegistrationCommandLauncher', () => {
  describe('#startCommandProcess()', () => {
    describe('should register nothing when it refuses', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/registerApiClient.js',
              'Example client',
              'ftp://example.com/callbacks/',
            ],
          },
        },
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/registerApiClient.js',
              '',
              'https://example.com/callbacks/',
            ],
          },
        },
      ]

      test.each(cases)('argv: $factoryParams.argv', async ({
        factoryParams,
      }) => {
        const launcher = ApiClientRegistrationCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          registrar: {
            registerApiClient: async () => null,
          },
          sink: {
            write: () => null,
          },
        })
        const registerSpy = jest.spyOn(launcher.registrar, 'registerApiClient')

        await launcher.startCommandProcess()

        expect(registerSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
