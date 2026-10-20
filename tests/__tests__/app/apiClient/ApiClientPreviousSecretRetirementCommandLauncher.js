import ApiClientPreviousSecretRetirementCommandLauncher from '../../../../app/apiClient/ApiClientPreviousSecretRetirementCommandLauncher.js'

import ApiClientSecretRotator from '../../../../app/apiClient/ApiClientSecretRotator.js'

/*
 * The launcher's deciding and reporting members, plus the one path of `#startCommandProcess()` that
 * returns before it bootstraps Sequelize.
 *
 * The exit codes are the point of this file. This command has three outcomes and only one of them
 * is a failure: a client with nothing to retire is already in the state the command was asked to
 * produce, so it succeeds. A hash that mapped it to 1 would make a correct retirement stop a
 * pipeline every second time it ran.
 */

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#processClerk', () => {
        const cases = [
          {
            params: {
              processClerk: {
                process: {
                  argv: [
                    '/usr/bin/node',
                    'scripts/retireApiClientPreviousSecret.js',
                    'client-key-0001',
                  ],
                },
                exit: () => null,
              },
              rotator: {
                retirePreviousApiClientSecret: async () => null,
              },
              sink: {
                write: () => null,
              },
            },
          },
          {
            params: {
              processClerk: {
                process: {
                  argv: [
                    '/usr/bin/node',
                    'scripts/retireApiClientPreviousSecret.js',
                    'client-key-0002',
                  ],
                },
                exit: () => null,
              },
              rotator: {
                retirePreviousApiClientSecret: async () => null,
              },
              sink: {
                write: () => null,
              },
            },
          },
        ]

        test.each(cases)('argv: $params.processClerk.process.argv', ({
          params,
        }) => {
          const launcher = new ApiClientPreviousSecretRetirementCommandLauncher(params)

          expect(launcher)
            .toHaveProperty('processClerk', params.processClerk)
        })
      })

      describe('#rotator', () => {
        const cases = [
          {
            params: {
              processClerk: {
                process: {
                  argv: [
                    '/usr/bin/node',
                    'scripts/retireApiClientPreviousSecret.js',
                    'client-key-0003',
                  ],
                },
                exit: () => null,
              },
              rotator: {
                retirePreviousApiClientSecret: async () => null,
              },
              sink: {
                write: () => null,
              },
            },
          },
          {
            params: {
              processClerk: {
                process: {
                  argv: [
                    '/usr/bin/node',
                    'scripts/retireApiClientPreviousSecret.js',
                    'client-key-0004',
                  ],
                },
                exit: () => null,
              },
              rotator: {
                retirePreviousApiClientSecret: async () => null,
              },
              sink: {
                write: () => null,
              },
            },
          },
        ]

        test.each(cases)('argv: $params.processClerk.process.argv', ({
          params,
        }) => {
          const launcher = new ApiClientPreviousSecretRetirementCommandLauncher(params)

          expect(launcher)
            .toHaveProperty('rotator', params.rotator)
        })
      })

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
              rotator: {
                retirePreviousApiClientSecret: async () => null,
              },
              sink: {
                write: () => 'sink-0005',
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
              rotator: {
                retirePreviousApiClientSecret: async () => null,
              },
              sink: {
                write: () => 'sink-0006',
              },
            },
          },
        ]

        test.each(cases)('write: $params.sink.write', ({
          params,
        }) => {
          const launcher = new ApiClientPreviousSecretRetirementCommandLauncher(params)

          expect(launcher)
            .toHaveProperty('sink', params.sink)
        })
      })
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          params: {
            processClerk: {
              process: {
                argv: [],
              },
              exit: () => null,
            },
            rotator: {
              retirePreviousApiClientSecret: async () => null,
            },
            sink: {
              write: () => 'sink-0007',
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
            rotator: {
              retirePreviousApiClientSecret: async () => null,
            },
            sink: {
              write: () => 'sink-0008',
            },
          },
        },
      ]

      test.each(cases)('write: $params.sink.write', ({
        params,
      }) => {
        const received = ApiClientPreviousSecretRetirementCommandLauncher.create(params)

        expect(received)
          .toBeInstanceOf(ApiClientPreviousSecretRetirementCommandLauncher)
      })
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('.create()', () => {
    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            processClerk: {
              process: {
                argv: [],
              },
              exit: () => null,
            },
            rotator: {
              retirePreviousApiClientSecret: async () => null,
            },
            sink: {
              write: () => 'sink-0009',
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
            rotator: {
              retirePreviousApiClientSecret: async () => null,
            },
            sink: {
              write: () => 'sink-0010',
            },
          },
        },
      ]

      test.each(cases)('write: $params.sink.write', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy
          .spyOn(ApiClientPreviousSecretRetirementCommandLauncher)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('.create()', () => {
    describe('should use default values', () => {
      test('should build the real rotator and write to stdout', () => {
        const expected = process.stdout

        const received = ApiClientPreviousSecretRetirementCommandLauncher.create()

        expect(received.rotator)
          .toBeInstanceOf(ApiClientSecretRotator)
        expect(received)
          .toHaveProperty('sink', expected)
      })
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('.createRotator()', () => {
    test('should create the rotator that does the work', () => {
      const received = ApiClientPreviousSecretRetirementCommandLauncher.createRotator()

      expect(received)
        .toBeInstanceOf(ApiClientSecretRotator)
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('.get:defaultSink', () => {
    test('should expose something a line can be written to', () => {
      const received = ApiClientPreviousSecretRetirementCommandLauncher.defaultSink

      expect(received)
        .toHaveProperty('write', expect.any(Function))
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        factoryParams: {
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
          },
          sink: {
            write: () => 'sink-0011',
          },
        },
      },
      {
        factoryParams: {
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
          },
          sink: {
            write: () => 'sink-0012',
          },
        },
      },
    ]

    test.each(cases)('write: $factoryParams.sink.write', ({
      factoryParams,
    }) => {
      const expected = ApiClientPreviousSecretRetirementCommandLauncher

      const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create(factoryParams)

      const received = launcher.Ctor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#extractClientKey()', () => {
    describe('should take the third entry of argv', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/retireApiClientPreviousSecret.js',
              'client-key-0013',
            ],
          },
          expected: 'client-key-0013',
        },
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/retireApiClientPreviousSecret.js',
              'client-key-0014',
              'an extra word nobody reads',
            ],
          },
          expected: 'client-key-0014',
        },
      ]

      test.each(cases)('argv: $factoryParams.argv', ({
        factoryParams,
        expected,
      }) => {
        const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
          },
          sink: {
            write: () => null,
          },
        })

        const received = launcher.extractClientKey()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#extractClientKey()', () => {
    describe('should answer empty text when no key was typed', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/retireApiClientPreviousSecret.js',
            ],
          },
          expected: '',
        },
        {
          factoryParams: {
            argv: [],
          },
          expected: '',
        },
      ]

      test.each(cases)('argv: $factoryParams.argv', ({
        factoryParams,
        expected,
      }) => {
        const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
          },
          sink: {
            write: () => null,
          },
        })

        const received = launcher.extractClientKey()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#buildReport()', () => {
    /*
     * Three outcomes, three sentences, and the two that are not failures must not read like one.
     * An operator told "nothing to retire" in the wording of a refusal goes looking for a fault
     * that is not there.
     */
    describe('should carry what each outcome has to say', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-0015',
            outcome: {
              outcomeName: 'retired',
              secret: null,
            },
          },
          expected: expect.stringContaining('refused from now on'),
        },
        {
          params: {
            clientKey: 'client-key-0016',
            outcome: {
              outcomeName: 'nothing-to-retire',
              secret: null,
            },
          },
          expected: expect.stringContaining('Nothing to retire'),
        },
        {
          params: {
            clientKey: 'client-key-0017',
            outcome: {
              outcomeName: 'client-not-found',
              secret: null,
            },
          },
          expected: expect.stringContaining('no client holds that key'),
        },
      ]

      test.each(cases)('outcomeName: $params.outcome.outcomeName', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
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

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#buildReport()', () => {
    /*
     * This command prints no secret, because it produces none. A report that carried one would be
     * a credential in an output somebody keeps, from the one command whose output is safe to keep.
     */
    describe('should name the client and print no secret', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-0018',
            outcome: {
              outcomeName: 'retired',
              secret: 'secret-that-must-not-be-printed-0018',
            },
          },
          expected: 'secret-that-must-not-be-printed-0018',
        },
        {
          params: {
            clientKey: 'client-key-0019',
            outcome: {
              outcomeName: 'nothing-to-retire',
              secret: 'secret-that-must-not-be-printed-0019',
            },
          },
          expected: 'secret-that-must-not-be-printed-0019',
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
          },
          sink: {
            write: () => null,
          },
        })

        const received = launcher.buildReport(params)

        expect(received)
          .not
          .toMatch(expected)
      })
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#buildReportHash()', () => {
    describe('should hold a report for every outcome a retirement can answer', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-0020',
          },
          expected: {
            retired: expect.any(String),
            'nothing-to-retire': expect.any(String),
            'client-not-found': expect.any(String),
          },
        },
        {
          params: {
            clientKey: 'client-key-0021',
          },
          expected: {
            retired: expect.any(String),
            'nothing-to-retire': expect.any(String),
            'client-not-found': expect.any(String),
          },
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
          },
          sink: {
            write: () => null,
          },
        })

        const received = launcher.buildReportHash(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#writeLine()', () => {
    describe('should write the text and end the line', () => {
      const cases = [
        {
          params: {
            text: 'a line of the report 0022',
          },
          expected: 'a line of the report 0022\n',
        },
        {
          params: {
            text: 'a line of the report 0023',
          },
          expected: 'a line of the report 0023\n',
        },
      ]

      test.each(cases)('text: $params.text', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
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

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#startCommandProcess()', () => {
    describe('should end with a failing code when no client key was typed', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/retireApiClientPreviousSecret.js',
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
              'scripts/retireApiClientPreviousSecret.js',
              '',
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
        const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
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

describe('ApiClientPreviousSecretRetirementCommandLauncher', () => {
  describe('#startCommandProcess()', () => {
    describe('should retire nothing when no client key was typed', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/retireApiClientPreviousSecret.js',
            ],
          },
        },
        {
          factoryParams: {
            argv: [],
          },
        },
      ]

      test.each(cases)('argv: $factoryParams.argv', async ({
        factoryParams,
      }) => {
        const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          rotator: {
            retirePreviousApiClientSecret: async () => null,
          },
          sink: {
            write: () => null,
          },
        })
        const retireSpy = jest.spyOn(launcher.rotator, 'retirePreviousApiClientSecret')

        await launcher.startCommandProcess()

        expect(retireSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
