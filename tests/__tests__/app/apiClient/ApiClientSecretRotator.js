import ApiClientSecretRotator from '../../../../app/apiClient/ApiClientSecretRotator.js'

import ApiClientSecretCipher from '../../../../app/apiClient/ApiClientSecretCipher.js'

import ApiClient from '../../../../sequelize/models/ApiClient.js'

/*
 * The members of the rotator that decide, build or read. The three that write a row —
 * `#rotateApiClientSecret()`, `#retirePreviousApiClientSecret()` and `#saveApiClientValues()` —
 * are pinned in `tests/_orders/ApiClient/`, beside the table they write to.
 *
 * `#findSecretBearingApiClient()` is here because it only reads, and it reads the seeded rows
 * rather than rows of its own: the development fixtures already seed one client with no rotation
 * under way and one with a rotation under way, which are exactly the two states every other member
 * of this class branches on.
 *
 * The generated secret is asserted by shape rather than by value, because it is random by design:
 * an assertion on a fixed string would be an assertion that the randomness is not random.
 */

describe('ApiClientSecretRotator', () => {
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
          const rotator = new ApiClientSecretRotator(params)

          expect(rotator)
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
          const rotator = new ApiClientSecretRotator(params)

          expect(rotator)
            .toHaveProperty('apiClientModel', params.apiClientModel)
        })
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
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
        const received = ApiClientSecretRotator.create(params)

        expect(received)
          .toBeInstanceOf(ApiClientSecretRotator)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
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
        const SpyClass = globalThis.constructorSpy.spyOn(ApiClientSecretRotator)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('.create()', () => {
    /*
     * Both parameters carry a default, and a caller that passes neither is the ordinary one: the
     * launcher constructs the rotator with no arguments at all.
     */
    describe('should use default values', () => {
      test('should build the real cipher and bind the real model', () => {
        const expected = ApiClient

        const received = ApiClientSecretRotator.create()

        expect(received.secretCipher)
          .toBeInstanceOf(ApiClientSecretCipher)
        expect(received)
          .toHaveProperty('apiClientModel', expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('.createSecretCipher()', () => {
    test('should create the cipher the stored secret is encrypted by', () => {
      const received = ApiClientSecretRotator.createSecretCipher()

      expect(received)
        .toBeInstanceOf(ApiClientSecretCipher)
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('.get:crypto', () => {
    test('should expose a randomness source', () => {
      const received = ApiClientSecretRotator.crypto

      expect(received)
        .toHaveProperty('randomBytes', expect.any(Function))
    })
  })
})

describe('ApiClientSecretRotator', () => {
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
      const expected = ApiClientSecretRotator

      const rotator = ApiClientSecretRotator.create(factoryParams)

      const received = rotator.Ctor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#hasRotationUnderWay()', () => {
    /*
     * The filled column is the whole of what "mid-rotation" means, and it is the question both
     * commands ask before they do anything: a rotation refuses when it answers true, and a
     * retirement has work to do only when it does.
     */
    describe('should be true when a previous secret is held', () => {
      const cases = [
        {
          params: {
            apiClient: {
              previousSecretCiphertext: 'envelope-rotating-0011',
            },
          },
        },
        {
          params: {
            apiClient: {
              previousSecretCiphertext: 'envelope-rotating-0012',
            },
          },
        },
      ]

      test.each(cases)('previousSecretCiphertext: $params.apiClient.previousSecretCiphertext', ({
        params,
      }) => {
        const rotator = ApiClientSecretRotator.create()

        const received = rotator.hasRotationUnderWay(params)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#hasRotationUnderWay()', () => {
    describe('should be false when none is held', () => {
      const cases = [
        {
          label: 'null',
          params: {
            apiClient: {
              previousSecretCiphertext: null,
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const rotator = ApiClientSecretRotator.create()

        const received = rotator.hasRotationUnderWay(params)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#generateSecret()', () => {
    /*
     * 32 bytes rendered as base64url, which is 43 characters and carries none of the three
     * characters that would need escaping in a shell argument or a configuration file. The same
     * shape registration issues, because the verifier cannot tell the two apart and must not.
     */
    describe('should generate a secret of the declared shape', () => {
      const cases = [
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0013',
            },
            apiClientModel: ApiClient,
          },
          expectedPattern: /^[A-Za-z0-9_-]{43}$/u,
          expectedTotalLength: 43,
        },
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0014',
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
        const rotator = ApiClientSecretRotator.create(factoryParams)

        const received = rotator.generateSecret()

        expect(received)
          .toMatch(expectedPattern)
        expect(received)
          .toHaveLength(expectedTotalLength)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#generateSecret()', () => {
    /*
     * Two secrets generated in a row must differ. A method that answered a constant would satisfy
     * the shape assertion above and hand every rotation the secret it was meant to replace, which
     * is a rotation that rotates nothing while reporting that it did.
     */
    describe('should not repeat itself', () => {
      const cases = [
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0015',
            },
            apiClientModel: ApiClient,
          },
        },
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-0016',
            },
            apiClientModel: ApiClient,
          },
        },
      ]

      test.each(cases)('encryptSecret: $factoryParams.secretCipher.encryptSecret', ({
        factoryParams,
      }) => {
        const rotator = ApiClientSecretRotator.create(factoryParams)
        const first = rotator.generateSecret()

        const received = rotator.generateSecret()

        expect(received)
          .not
          .toBe(first)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#buildRotatableValues()', () => {
    /*
     * The envelope already stored moves across as it stands, and the new one is whatever the
     * cipher made of the new secret. The stub returns a value that could not have come from the
     * row, so a method that wrote the wrong envelope into the wrong column cannot pass.
     */
    describe('should move the stored envelope across and encrypt the new secret', () => {
      const cases = [
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-new-0017',
            },
            apiClientModel: ApiClient,
          },
          params: {
            apiClient: {
              secretCiphertext: 'envelope-live-0017',
            },
            secret: 'secret-0017',
          },
          expected: {
            secretCiphertext: 'envelope-new-0017',
            previousSecretCiphertext: 'envelope-live-0017',
          },
        },
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-new-0018',
            },
            apiClientModel: ApiClient,
          },
          params: {
            apiClient: {
              secretCiphertext: 'envelope-live-0018',
            },
            secret: 'secret-0018',
          },
          expected: {
            secretCiphertext: 'envelope-new-0018',
            previousSecretCiphertext: 'envelope-live-0018',
          },
        },
      ]

      test.each(cases)('secret: $params.secret', ({
        factoryParams,
        params,
        expected,
      }) => {
        const rotator = ApiClientSecretRotator.create(factoryParams)

        const received = rotator.buildRotatableValues(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#buildRotatableValues()', () => {
    /*
     * The secret the caller asked to store is the one handed to the cipher. A method that encrypted
     * anything else would store an envelope nobody can sign with, and the column would still be
     * filled.
     */
    describe('should encrypt the secret it was given', () => {
      const cases = [
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-new-0019',
            },
            apiClientModel: ApiClient,
          },
          params: {
            apiClient: {
              secretCiphertext: 'envelope-live-0019',
            },
            secret: 'secret-0019',
          },
          expected: {
            secret: 'secret-0019',
          },
        },
        {
          factoryParams: {
            secretCipher: {
              encryptSecret: () => 'envelope-new-0020',
            },
            apiClientModel: ApiClient,
          },
          params: {
            apiClient: {
              secretCiphertext: 'envelope-live-0020',
            },
            secret: 'secret-0020',
          },
          expected: {
            secret: 'secret-0020',
          },
        },
      ]

      test.each(cases)('secret: $params.secret', ({
        factoryParams,
        params,
        expected,
      }) => {
        const rotator = ApiClientSecretRotator.create(factoryParams)
        const encryptSpy = jest.spyOn(rotator.secretCipher, 'encryptSecret')

        rotator.buildRotatableValues(params)

        expect(encryptSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#buildRetirableValues()', () => {
    /*
     * One column, cleared, and nothing else. A retirement that also touched `secretCiphertext`
     * would refuse the client it was meant to leave working.
     */
    test('should clear the previous envelope and name no other column', () => {
      const expected = {
        previousSecretCiphertext: null,
      }

      const rotator = ApiClientSecretRotator.create()

      const received = rotator.buildRetirableValues()

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#buildOutcome()', () => {
    describe('should carry the outcome name and the secret it was given', () => {
      const cases = [
        {
          params: {
            outcomeName: 'rotated',
            secret: 'secret-0021',
          },
          expected: {
            outcomeName: 'rotated',
            secret: 'secret-0021',
          },
        },
        {
          params: {
            outcomeName: 'retired',
            secret: 'secret-0022',
          },
          expected: {
            outcomeName: 'retired',
            secret: 'secret-0022',
          },
        },
      ]

      test.each(cases)('outcomeName: $params.outcomeName', ({
        params,
        expected,
      }) => {
        const rotator = ApiClientSecretRotator.create()

        const received = rotator.buildOutcome(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#buildOutcome()', () => {
    /*
     * Every outcome but one carries no secret, and the field is still present. A launcher reading
     * `outcome.secret` on a refusal must find null rather than an absent key, because the absent
     * key prints the word `undefined` where a sentence about a credential belongs.
     */
    describe('should default the secret to null', () => {
      const cases = [
        {
          params: {
            outcomeName: 'client-not-found',
          },
          expected: {
            outcomeName: 'client-not-found',
            secret: null,
          },
        },
        {
          params: {
            outcomeName: 'nothing-to-retire',
          },
          expected: {
            outcomeName: 'nothing-to-retire',
            secret: null,
          },
        },
      ]

      test.each(cases)('outcomeName: $params.outcomeName', ({
        params,
        expected,
      }) => {
        const rotator = ApiClientSecretRotator.create()

        const received = rotator.buildOutcome(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#findSecretBearingApiClient()', () => {
    /*
     * The read has to reach past the model's default scope, which excludes both envelope columns.
     * A read that did not would answer a row whose `previousSecretCiphertext` is absent, and every
     * caller would then read the client as holding no rotation.
     */
    describe('should answer the seeded row with both envelopes', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-signing-10000001',
          },
          expected: {
            id: 10000001,
            secretCiphertext: expect.any(String),
            previousSecretCiphertext: null,
          },
        },
        {
          params: {
            clientKey: 'client-key-rotating-10000002',
          },
          expected: {
            id: 10000002,
            secretCiphertext: expect.any(String),
            previousSecretCiphertext: expect.any(String),
          },
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', async ({
        params,
        expected,
      }) => {
        const rotator = ApiClientSecretRotator.create()

        const received = await rotator.findSecretBearingApiClient(params)

        expect(received)
          .toEqual(expect.objectContaining(expected))
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#findSecretBearingApiClient()', () => {
    describe('should answer null when the key names no row', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-that-was-never-issued-0023',
          },
        },
        {
          params: {
            clientKey: 'client-key-that-was-never-issued-0024',
          },
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', async ({
        params,
      }) => {
        const rotator = ApiClientSecretRotator.create()

        const received = await rotator.findSecretBearingApiClient(params)

        expect(received)
          .toBeNull()
      })
    })
  })
})
