import ApiClientRegistrar from '../../../../app/apiClient/ApiClientRegistrar.js'

import ApiClientSecretCipher from '../../../../app/apiClient/ApiClientSecretCipher.js'

import ApiClient from '../../../../sequelize/models/ApiClient.js'

/*
 * The members of the registrar that decide but write nothing. `#registerApiClient()` writes a row,
 * so it is pinned in `tests/_orders/ApiClient/`, beside the table it writes to.
 *
 * The generated values are asserted by shape rather than by value, because they are random by
 * design: an assertion on a fixed string would be an assertion that the randomness is not random.
 */

describe('ApiClientRegistrar', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#secretCipher', () => {
        const cases = [
          {
            params: {
              secretCipher: {
                encryptSecret: () => 'envelope-0001',
              },
              apiClientModel: ApiClient,
            },
          },
          {
            params: {
              secretCipher: {
                encryptSecret: () => 'envelope-0002',
              },
              apiClientModel: ApiClient,
            },
          },
        ]

        test.each(cases)('encryptSecret: $params.secretCipher.encryptSecret', ({
          params,
        }) => {
          const registrar = new ApiClientRegistrar(params)

          expect(registrar)
            .toHaveProperty('secretCipher', params.secretCipher)
        })
      })

      describe('#apiClientModel', () => {
        const cases = [
          {
            params: {
              secretCipher: {
                encryptSecret: () => 'envelope-0003',
              },
              apiClientModel: ApiClient,
            },
          },
          {
            params: {
              secretCipher: {
                encryptSecret: () => 'envelope-0004',
              },
              apiClientModel: ApiClient,
            },
          },
        ]

        test.each(cases)('encryptSecret: $params.secretCipher.encryptSecret', ({
          params,
        }) => {
          const registrar = new ApiClientRegistrar(params)

          expect(registrar)
            .toHaveProperty('apiClientModel', params.apiClientModel)
        })
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          params: {
            secretCipher: {
              encryptSecret: () => 'envelope-0005',
            },
            apiClientModel: ApiClient,
          },
        },
        {
          params: {
            secretCipher: {
              encryptSecret: () => 'envelope-0006',
            },
            apiClientModel: ApiClient,
          },
        },
      ]

      test.each(cases)('encryptSecret: $params.secretCipher.encryptSecret', ({
        params,
      }) => {
        const received = ApiClientRegistrar.create(params)

        expect(received)
          .toBeInstanceOf(ApiClientRegistrar)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('.create()', () => {
    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            secretCipher: {
              encryptSecret: () => 'envelope-0007',
            },
            apiClientModel: ApiClient,
          },
        },
        {
          params: {
            secretCipher: {
              encryptSecret: () => 'envelope-0008',
            },
            apiClientModel: ApiClient,
          },
        },
      ]

      test.each(cases)('encryptSecret: $params.secretCipher.encryptSecret', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(ApiClientRegistrar)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('.create()', () => {
    /*
     * Both parameters carry a default, and a caller that passes neither is the ordinary one: the
     * script constructs the registrar with no arguments at all.
     */
    describe('should use default values', () => {
      test('should build the real cipher and bind the real model', () => {
        const expected = ApiClient

        const received = ApiClientRegistrar.create()

        expect(received.secretCipher)
          .toBeInstanceOf(ApiClientSecretCipher)
        expect(received)
          .toHaveProperty('apiClientModel', expected)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('.createSecretCipher()', () => {
    test('should create the cipher the stored secret is encrypted by', () => {
      const received = ApiClientRegistrar.createSecretCipher()

      expect(received)
        .toBeInstanceOf(ApiClientSecretCipher)
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('.get:crypto', () => {
    test('should expose a randomness source', () => {
      const received = ApiClientRegistrar.crypto

      expect(received)
        .toHaveProperty('randomBytes', expect.any(Function))
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        factoryParams: {
          secretCipher: {
            encryptSecret: () => 'envelope-0009',
          },
          apiClientModel: ApiClient,
        },
      },
      {
        factoryParams: {
          secretCipher: {
            encryptSecret: () => 'envelope-0010',
          },
          apiClientModel: ApiClient,
        },
      },
    ]

    test.each(cases)('encryptSecret: $factoryParams.secretCipher.encryptSecret', ({
      factoryParams,
    }) => {
      const expected = ApiClientRegistrar

      const registrar = ApiClientRegistrar.create(factoryParams)

      const received = registrar.Ctor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('#generateClientKey()', () => {
    /*
     * 24 bytes rendered as hex, which is 48 characters inside the column's 64.
     */
    describe('should generate an opaque identifier of the declared shape', () => {
      const cases = [
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0011',
            },
            apiClientModel: ApiClient,
          },
          expectedPattern: /^[0-9a-f]{48}$/u,
          expectedTotalLength: 48,
        },
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0012',
            },
            apiClientModel: ApiClient,
          },
          expectedPattern: /^[0-9a-f]{48}$/u,
          expectedTotalLength: 48,
        },
      ]

      test.each(cases)('encryptSecret: $factoryParams.secretCipher.encryptSecret', ({
        factoryParams,
        expectedPattern,
        expectedTotalLength,
      }) => {
        const registrar = ApiClientRegistrar.create(factoryParams)

        const received = registrar.generateClientKey()

        expect(received)
          .toMatch(expectedPattern)
        expect(received)
          .toHaveLength(expectedTotalLength)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('#generateClientKey()', () => {
    /*
     * Two keys generated in a row must differ. A method that answered a constant would satisfy the
     * shape assertion above and collide on the column's unique index the second time it was used.
     */
    describe('should not repeat itself', () => {
      const cases = [
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0013',
            },
            apiClientModel: ApiClient,
          },
        },
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0014',
            },
            apiClientModel: ApiClient,
          },
        },
      ]

      test.each(cases)('encryptSecret: $factoryParams.secretCipher.encryptSecret', ({
        factoryParams,
      }) => {
        const registrar = ApiClientRegistrar.create(factoryParams)
        const first = registrar.generateClientKey()

        const received = registrar.generateClientKey()

        expect(received)
          .not
          .toBe(first)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('#generateSecret()', () => {
    /*
     * 32 bytes rendered as base64url, which is 43 characters and carries none of the three
     * characters that would need escaping in a shell argument or a configuration file.
     */
    describe('should generate a secret of the declared shape', () => {
      const cases = [
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0015',
            },
            apiClientModel: ApiClient,
          },
          expectedPattern: /^[A-Za-z0-9_-]{43}$/u,
          expectedTotalLength: 43,
        },
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0016',
            },
            apiClientModel: ApiClient,
          },
          expectedPattern: /^[A-Za-z0-9_-]{43}$/u,
          expectedTotalLength: 43,
        },
      ]

      test.each(cases)('encryptSecret: $factoryParams.secretCipher.encryptSecret', ({
        factoryParams,
        expectedPattern,
        expectedTotalLength,
      }) => {
        const registrar = ApiClientRegistrar.create(factoryParams)

        const received = registrar.generateSecret()

        expect(received)
          .toMatch(expectedPattern)
        expect(received)
          .toHaveLength(expectedTotalLength)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('#buildRegistrableValues()', () => {
    describe('should encrypt the secret and carry nothing of it in the clear', () => {
      const cases = [
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-of-secret-0017',
            },
            apiClientModel: ApiClient,
          },
          params: {
            name: 'Example client alpha',
            clientKey: 'client-key-0017',
            callbackUrlPrefix: 'https://alpha.example.com/callbacks/',
            secret: 'secret-in-the-clear-0017',
            registeredAt: new Date('2026-03-04T05:06:07.008Z'),
          },
          expected: {
            name: 'Example client alpha',
            clientKey: 'client-key-0017',
            secretCiphertext: 'envelope-of-secret-0017',
            previousSecretCiphertext: null,
            callbackUrlPrefix: 'https://alpha.example.com/callbacks/',
            isActive: true,
            registeredAt: new Date('2026-03-04T05:06:07.008Z'),
          },
        },
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-of-secret-0018',
            },
            apiClientModel: ApiClient,
          },
          params: {
            name: 'Example client beta',
            clientKey: 'client-key-0018',
            callbackUrlPrefix: 'https://beta.example.com/hooks/',
            secret: 'secret-in-the-clear-0018',
            registeredAt: new Date('2026-07-08T09:10:11.012Z'),
          },
          expected: {
            name: 'Example client beta',
            clientKey: 'client-key-0018',
            secretCiphertext: 'envelope-of-secret-0018',
            previousSecretCiphertext: null,
            callbackUrlPrefix: 'https://beta.example.com/hooks/',
            isActive: true,
            registeredAt: new Date('2026-07-08T09:10:11.012Z'),
          },
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', ({
        factoryParams,
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create(factoryParams)

        const received = registrar.buildRegistrableValues(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('#buildRegistrableValues()', () => {
    /*
     * The cipher is handed the secret it was given, and not something derived from it. A method
     * that encrypted the client key instead would still produce a row that looks correct.
     */
    describe('should hand the cipher the secret it was given', () => {
      const cases = [
        {
          params: {
            name: 'Example client gamma',
            clientKey: 'client-key-0019',
            callbackUrlPrefix: 'https://gamma.example.com/callbacks/',
            secret: 'secret-in-the-clear-0019',
            registeredAt: new Date('2026-01-02T03:04:05.006Z'),
          },
          expected: {
            secret: 'secret-in-the-clear-0019',
          },
        },
        {
          params: {
            name: 'Example client delta',
            clientKey: 'client-key-0020',
            callbackUrlPrefix: 'https://delta.example.com/callbacks/',
            secret: 'secret-in-the-clear-0020',
            registeredAt: new Date('2026-02-03T04:05:06.007Z'),
          },
          expected: {
            secret: 'secret-in-the-clear-0020',
          },
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', ({
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create({
          secretCipher: {
            encryptSecret: () => 'envelope-0021',
          },
          apiClientModel: ApiClient,
        })
        const encryptSpy = jest.spyOn(registrar.secretCipher, 'encryptSecret')

        registrar.buildRegistrableValues(params)

        expect(encryptSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
