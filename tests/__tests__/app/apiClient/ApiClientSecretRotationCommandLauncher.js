import ApiClientSecretRotationCommandLauncher from '../../../../app/apiClient/ApiClientSecretRotationCommandLauncher.js'

import ApiClientSecretRotator from '../../../../app/apiClient/ApiClientSecretRotator.js'

/*
 * The launcher's deciding and reporting members, plus the one path of `#startCommandProcess()` that
 * returns before it bootstraps Sequelize. Everything past that point ends the process, so it is not
 * called here; what it rests on is each tested on its own.
 */

describe('ApiClientSecretRotationCommandLauncher', () => {
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
                    'scripts/rotateApiClientSecret.js',
                    'client-key-0001',
                  ],
                },
                exit: () => null,
              },
              rotator: {
                rotateApiClientSecret: async () => null,
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
                    'scripts/rotateApiClientSecret.js',
                    'client-key-0002',
                  ],
                },
                exit: () => null,
              },
              rotator: {
                rotateApiClientSecret: async () => null,
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
          const launcher = new ApiClientSecretRotationCommandLauncher(params)

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
                    'scripts/rotateApiClientSecret.js',
                    'client-key-0003',
                  ],
                },
                exit: () => null,
              },
              rotator: {
                rotateApiClientSecret: async () => null,
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
                    'scripts/rotateApiClientSecret.js',
                    'client-key-0004',
                  ],
                },
                exit: () => null,
              },
              rotator: {
                rotateApiClientSecret: async () => null,
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
          const launcher = new ApiClientSecretRotationCommandLauncher(params)

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
                rotateApiClientSecret: async () => null,
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
                rotateApiClientSecret: async () => null,
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
          const launcher = new ApiClientSecretRotationCommandLauncher(params)

          expect(launcher)
            .toHaveProperty('sink', params.sink)
        })
      })
    })
  })
})

describe('ApiClientSecretRotationCommandLauncher', () => {
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
              rotateApiClientSecret: async () => null,
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
              rotateApiClientSecret: async () => null,
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
        const received = ApiClientSecretRotationCommandLauncher.create(params)

        expect(received)
          .toBeInstanceOf(ApiClientSecretRotationCommandLauncher)
      })
    })
  })
})

describe('ApiClientSecretRotationCommandLauncher', () => {
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
              rotateApiClientSecret: async () => null,
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
              rotateApiClientSecret: async () => null,
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
        const SpyClass = globalThis.constructorSpy.spyOn(ApiClientSecretRotationCommandLauncher)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('.create()', () => {
    /*
     * Every parameter carries a default, and a caller that passes none is the ordinary one: the
     * script constructs the launcher with no arguments at all.
     */
    describe('should use default values', () => {
      test('should build the real rotator and write to stdout', () => {
        const expected = process.stdout

        const received = ApiClientSecretRotationCommandLauncher.create()

        expect(received.rotator)
          .toBeInstanceOf(ApiClientSecretRotator)
        expect(received)
          .toHaveProperty('sink', expected)
      })
    })
  })
})

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('.createRotator()', () => {
    test('should create the rotator that does the work', () => {
      const received = ApiClientSecretRotationCommandLauncher.createRotator()

      expect(received)
        .toBeInstanceOf(ApiClientSecretRotator)
    })
  })
})

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('.get:defaultSink', () => {
    test('should expose something a line can be written to', () => {
      const received = ApiClientSecretRotationCommandLauncher.defaultSink

      expect(received)
        .toHaveProperty('write', expect.any(Function))
    })
  })
})

describe('ApiClientSecretRotationCommandLauncher', () => {
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
            rotateApiClientSecret: async () => null,
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
            rotateApiClientSecret: async () => null,
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
      const expected = ApiClientSecretRotationCommandLauncher

      const launcher = ApiClientSecretRotationCommandLauncher.create(factoryParams)

      const received = launcher.Ctor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('#extractClientKey()', () => {
    /*
     * `process.argv` opens with the Node binary and the script path, so the operator's own word is
     * the third entry. Reading any other index would rotate the secret of a client nobody named.
     */
    describe('should take the third entry of argv', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/rotateApiClientSecret.js',
              'client-key-0013',
            ],
          },
          expected: 'client-key-0013',
        },
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/rotateApiClientSecret.js',
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
        const launcher = ApiClientSecretRotationCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          rotator: {
            rotateApiClientSecret: async () => null,
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

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('#extractClientKey()', () => {
    /*
     * An argument nobody typed is absent, and absent has to read as empty text rather than as
     * `undefined`: the guard that follows tests the value for truth, and the report that follows
     * that interpolates it.
     */
    describe('should answer empty text when no key was typed', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/rotateApiClientSecret.js',
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
        const launcher = ApiClientSecretRotationCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          rotator: {
            rotateApiClientSecret: async () => null,
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

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('#buildReport()', () => {
    /*
     * The report of a rotation is the client's only copy of its new secret, so the secret has to
     * appear in it. A report that named the key alone would read as success and hand over nothing
     * the client can sign with.
     */
    describe('should carry what each outcome has to say', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-0015',
            outcome: {
              outcomeName: 'rotated',
              secret: 'secret-0015',
            },
          },
          expected: expect.stringContaining('secret-0015'),
        },
        {
          params: {
            clientKey: 'client-key-0016',
            outcome: {
              outcomeName: 'rotation-already-under-way',
              secret: null,
            },
          },
          expected: expect.stringContaining('already mid-rotation'),
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
        const launcher = ApiClientSecretRotationCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            rotateApiClientSecret: async () => null,
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

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('#buildReport()', () => {
    /*
     * Every report names the client it is about. An operator rotating several in a row reads the
     * scrollback afterwards, and a report that named none would be a secret beside no key.
     */
    describe('should name the client each report is about', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-0018',
            outcome: {
              outcomeName: 'rotated',
              secret: 'secret-0018',
            },
          },
          expected: expect.stringContaining('client-key-0018'),
        },
        {
          params: {
            clientKey: 'client-key-0019',
            outcome: {
              outcomeName: 'rotation-already-under-way',
              secret: null,
            },
          },
          expected: expect.stringContaining('client-key-0019'),
        },
        {
          params: {
            clientKey: 'client-key-0020',
            outcome: {
              outcomeName: 'client-not-found',
              secret: null,
            },
          },
          expected: expect.stringContaining('client-key-0020'),
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientSecretRotationCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            rotateApiClientSecret: async () => null,
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

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('#buildReportHash()', () => {
    /*
     * One entry per outcome the rotator can answer with. A missing entry would print the word
     * `undefined` where a sentence about a credential belongs, and it would print it on the exit
     * code of a success.
     */
    describe('should hold a report for every outcome a rotation can answer', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-0021',
            outcome: {
              outcomeName: 'rotated',
              secret: 'secret-0021',
            },
          },
          expected: {
            rotated: expect.any(String),
            'rotation-already-under-way': expect.any(String),
            'client-not-found': expect.any(String),
          },
        },
        {
          params: {
            clientKey: 'client-key-0022',
            outcome: {
              outcomeName: 'client-not-found',
              secret: null,
            },
          },
          expected: {
            rotated: expect.any(String),
            'rotation-already-under-way': expect.any(String),
            'client-not-found': expect.any(String),
          },
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientSecretRotationCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            rotateApiClientSecret: async () => null,
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

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('#writeLine()', () => {
    describe('should write the text and end the line', () => {
      const cases = [
        {
          params: {
            text: 'a line of the report 0023',
          },
          expected: 'a line of the report 0023\n',
        },
        {
          params: {
            text: 'a line of the report 0024',
          },
          expected: 'a line of the report 0024\n',
        },
      ]

      test.each(cases)('text: $params.text', ({
        params,
        expected,
      }) => {
        const launcher = ApiClientSecretRotationCommandLauncher.create({
          processClerk: {
            process: {
              argv: [],
            },
            exit: () => null,
          },
          rotator: {
            rotateApiClientSecret: async () => null,
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

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('#startCommandProcess()', () => {
    /*
     * A refusal has to reach the caller as an exit code and not only as printed text. The clerk
     * reads `exitCode` and defaults it to 0, so a call that names the field anything else prints
     * the refusal and then reports success — which is the one failure shape a script must not have,
     * because a pipeline reads the code and never the text.
     */
    describe('should end with a failing code when no client key was typed', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/rotateApiClientSecret.js',
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
              'scripts/rotateApiClientSecret.js',
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
        const launcher = ApiClientSecretRotationCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          rotator: {
            rotateApiClientSecret: async () => null,
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

describe('ApiClientSecretRotationCommandLauncher', () => {
  describe('#startCommandProcess()', () => {
    /*
     * The refusal returns before Sequelize is bootstrapped and before the rotator is asked, so a
     * command typed without a key cannot replace anybody's secret.
     */
    describe('should rotate nothing when no client key was typed', () => {
      const cases = [
        {
          factoryParams: {
            argv: [
              '/usr/bin/node',
              'scripts/rotateApiClientSecret.js',
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
        const launcher = ApiClientSecretRotationCommandLauncher.create({
          processClerk: {
            process: {
              argv: factoryParams.argv,
            },
            exit: () => null,
          },
          rotator: {
            rotateApiClientSecret: async () => null,
          },
          sink: {
            write: () => null,
          },
        })
        const rotateSpy = jest.spyOn(launcher.rotator, 'rotateApiClientSecret')

        await launcher.startCommandProcess()

        expect(rotateSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
