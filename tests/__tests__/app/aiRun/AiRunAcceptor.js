import AiRunAcceptor from '../../../../app/aiRun/AiRunAcceptor.js'

import RunKeyGenerator from '../../../../app/aiRun/RunKeyGenerator.js'
import AiRun from '../../../../sequelize/models/AiRun.js'
import AiRunStatus from '../../../../sequelize/models/AiRunStatus.js'

describe('AiRunAcceptor', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#runKeyGenerator', () => {
        const cases = [
          {
            input: {
              runKeyGenerator: {
                runKeyByteSize: 100016,
              },
            },
            expected: {
              runKeyByteSize: 100016,
            },
          },
          {
            input: {
              runKeyGenerator: {
                runKeyByteSize: 100032,
              },
            },
            expected: {
              runKeyByteSize: 100032,
            },
          },
        ]

        test.each(cases)('runKeyByteSize: $input.runKeyGenerator.runKeyByteSize', ({
          input,
          expected,
        }) => {
          const acceptor = new AiRunAcceptor(input)

          expect(acceptor)
            .toHaveProperty('runKeyGenerator', expected)
        })
      })
    })
  })
})

describe('AiRunAcceptor', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            runKeyGenerator: {
              runKeyByteSize: 100016,
            },
          },
        },
        {
          input: {
            runKeyGenerator: {
              runKeyByteSize: 100032,
            },
          },
        },
      ]

      test.each(cases)('runKeyByteSize: $input.runKeyGenerator.runKeyByteSize', ({
        input,
      }) => {
        const received = AiRunAcceptor.create(input)

        expect(received)
          .toBeInstanceOf(AiRunAcceptor)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            runKeyGenerator: {
              runKeyByteSize: 100016,
            },
          },
          expected: {
            runKeyGenerator: {
              runKeyByteSize: 100016,
            },
          },
        },
        {
          input: {
            runKeyGenerator: {
              runKeyByteSize: 100032,
            },
          },
          expected: {
            runKeyGenerator: {
              runKeyByteSize: 100032,
            },
          },
        },
      ]

      test.each(cases)('runKeyByteSize: $input.runKeyGenerator.runKeyByteSize', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunAcceptor)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default runKeyGenerator', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunAcceptor)
        const expected = {
          runKeyGenerator: expect.any(RunKeyGenerator),
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunAcceptor', () => {
  describe('.get:AiRunCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunAcceptor.AiRunCtor

        expect(received)
          .toBe(AiRun) // same reference
      })
    })
  })
})

describe('AiRunAcceptor', () => {
  describe('.get:AiRunStatusCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunAcceptor.AiRunStatusCtor

        expect(received)
          .toBe(AiRunStatus) // same reference
      })
    })
  })
})

describe('AiRunAcceptor', () => {
  describe('.createRunKeyGenerator()', () => {
    test('should be an instance of RunKeyGenerator', () => {
      const received = AiRunAcceptor.createRunKeyGenerator()

      expect(received)
        .toBeInstanceOf(RunKeyGenerator)
    })
  })
})

describe('AiRunAcceptor', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunAcceptor,
      },
      {
        tally: class AlphaAiRunAcceptor extends AiRunAcceptor {},
      },
      {
        tally: class BetaAiRunAcceptor extends AiRunAcceptor {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const acceptor = tally.create()

      const received = acceptor.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('AiRunAcceptor', () => {
  describe('#findAiRun()', () => {
    describe('when the client already used the key', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            requestKey: 'request-key-repeat-10010001',
          },
          expected: expect.objectContaining({
            id: 10010001,
            runKey: 'run-key-10010001',
            externalRef: 'external-ref-10010001',
            AiRunStatus: expect.objectContaining({
              name: 'running',
            }),
          }),
        },
        {
          input: {
            apiClientId: 10000001,
            requestKey: 'request-key-mismatch-10010002',
          },
          expected: expect.objectContaining({
            id: 10010002,
            runKey: 'run-key-10010002',
            externalRef: 'external-ref-10010002',
            AiRunStatus: expect.objectContaining({
              name: 'queued',
            }),
          }),
        },
      ]

      test.each(cases)('requestKey: $input.requestKey', async ({
        input,
        expected,
      }) => {
        const acceptor = AiRunAcceptor.create()

        const received = await acceptor.findAiRun(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when another client used the same key', () => {
      const cases = [
        {
          // Idempotency is the pair of client and key, so the other client's run is a different row
          input: {
            apiClientId: 10000002,
            requestKey: 'request-key-repeat-10010001',
          },
          expected: expect.objectContaining({
            id: 10010003,
            runKey: 'run-key-10010003',
            externalRef: 'external-ref-10010003',
            AiRunStatus: expect.objectContaining({
              name: 'succeeded',
            }),
          }),
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', async ({
        input,
        expected,
      }) => {
        const acceptor = AiRunAcceptor.create()

        const received = await acceptor.findAiRun(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the key is arriving for the first time', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            requestKey: 'request-key-never-used-0001',
          },
        },
        {
          input: {
            // A key another client used, which this client has not
            apiClientId: 10000003,
            requestKey: 'request-key-repeat-10010001',
          },
        },
      ]

      test.each(cases)('requestKey: $input.requestKey', async ({
        input,
      }) => {
        const acceptor = AiRunAcceptor.create()

        const received = await acceptor.findAiRun(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
