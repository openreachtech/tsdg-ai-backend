import AppRestfulApiContext from '../../../../../server/restfulapi/contexts/AppRestfulApiContext.js'

import {
  BaseRestfulApiContext,
} from '@openreachtech/renchan'

import ApiClientAuthenticationLogger from '../../../../../app/apiClient/ApiClientAuthenticationLogger.js'
import ApiClientSecretCipher from '../../../../../app/apiClient/ApiClientSecretCipher.js'
import ApiClientSignatureVerifier from '../../../../../app/apiClient/ApiClientSignatureVerifier.js'
import RequestTimestampWindowInspector from '../../../../../app/apiClient/RequestTimestampWindowInspector.js'

import ApiClient from '../../../../../sequelize/models/ApiClient.js'

const UNUSABLE_ENCRYPTION_KEY_MESSAGE = 'API_CLIENT_SECRET_ENCRYPTION_KEY must be 64 hex characters, the 32 bytes AES-256-GCM takes'

describe('AppRestfulApiContext', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AppRestfulApiContext.prototype

      expect(received)
        .toBeInstanceOf(BaseRestfulApiContext)
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.get:ApiClientModel', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AppRestfulApiContext.ApiClientModel

        expect(received)
          .toBe(ApiClient) // same reference
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.get:ApiClientSecretCipherCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AppRestfulApiContext.ApiClientSecretCipherCtor

        expect(received)
          .toBe(ApiClientSecretCipher) // same reference
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.get:ApiClientSignatureVerifierCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AppRestfulApiContext.ApiClientSignatureVerifierCtor

        expect(received)
          .toBe(ApiClientSignatureVerifier) // same reference
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.get:RequestTimestampWindowInspectorCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AppRestfulApiContext.RequestTimestampWindowInspectorCtor

        expect(received)
          .toBe(RequestTimestampWindowInspector) // same reference
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.createApiClientSecretCipher()', () => {
    describe('when called as is', () => {
      test('should be an instance of ApiClientSecretCipher', () => {
        const received = AppRestfulApiContext.createApiClientSecretCipher()

        expect(received)
          .toBeInstanceOf(ApiClientSecretCipher)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.createApiClientSecretCipher()', () => {
    /*
     * An unusable key refuses every client in the deployment, and the framework answers the throw
     * with a `500` saying `Unknown Error` and prints nothing in production — so the line is the
     * operator's only account of why. Both halves are pinned in one test on purpose: a line
     * written instead of the exception would leave the request answered as though nothing were
     * wrong, and an exception with no line is the state this replaces.
     */
    describe('should write one line saying why, and let the exception through', () => {
      /** @type {Array<{ label: string, input: { encryptionKeyText: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          label: 'a variable declared with an empty value',
          input: {
            encryptionKeyText: '', // what .env.live ships
          },
        },
        {
          label: 'a key one character short of AES-256',
          input: {
            encryptionKeyText: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde',
          },
        },
        {
          label: 'a passphrase somebody typed in place of a key',
          input: {
            encryptionKeyText: 'change-me-before-going-live',
          },
        },
      ])

      test.each(cases)('label: $label', ({
        input,
      }) => {
        jest.spyOn(ApiClientSecretCipher, 'env', 'get')
          .mockReturnValue(/** @type {*} */ ({
            API_CLIENT_SECRET_ENCRYPTION_KEY: input.encryptionKeyText,
          }))
        const logSpy = jest.spyOn(
          ApiClientAuthenticationLogger.prototype,
          'logUnusableEncryptionKey'
        )

        const received = () => AppRestfulApiContext.createApiClientSecretCipher()

        expect(received)
          .toThrow(UNUSABLE_ENCRYPTION_KEY_MESSAGE)
        expect(logSpy)
          .toHaveBeenCalledWith() // no argument at all, so no key can reach the line
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.logUnusableEncryptionKey()', () => {
    /*
     * The context holds no wording of its own for this line — it asks the logger, which is the one
     * class that knows what such a line may never carry.
     */
    describe('when called as is', () => {
      test('should hand the line to the logger, carrying nothing', () => {
        const logSpy = jest.spyOn(
          ApiClientAuthenticationLogger.prototype,
          'logUnusableEncryptionKey'
        )

        AppRestfulApiContext.logUnusableEncryptionKey()

        expect(logSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.createRequestTimestampWindowInspector()', () => {
    describe('when called as is', () => {
      test('should be an instance of RequestTimestampWindowInspector', () => {
        const received = AppRestfulApiContext.createRequestTimestampWindowInspector()

        expect(received)
          .toBeInstanceOf(RequestTimestampWindowInspector)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.createRequestTimestampWindowInspector()', () => {
    describe('when called as is', () => {
      test('should hold the 300 second window the contract states', () => {
        const received = AppRestfulApiContext.createRequestTimestampWindowInspector()

        expect(received)
          .toHaveProperty('allowedDeviationSeconds', 300)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.createApiClientSignatureVerifier()', () => {
    describe('should be an instance of ApiClientSignatureVerifier', () => {
      const cases = [
        {
          input: {
            currentSecret: 'secret-0001',
            previousSecret: 'secret-0002',
          },
        },
        {
          input: {
            currentSecret: 'secret-0003',
            previousSecret: null, // no rotation is under way
          },
        },
      ]

      test.each(cases)('currentSecret: $input.currentSecret', ({
        input,
      }) => {
        const received = AppRestfulApiContext.createApiClientSignatureVerifier(input)

        expect(received)
          .toBeInstanceOf(ApiClientSignatureVerifier)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.createApiClientSignatureVerifier()', () => {
    describe('should hold the secrets handed in', () => {
      const cases = [
        {
          input: {
            currentSecret: 'secret-0001',
            previousSecret: 'secret-0002',
          },
          expected: [
            'secret-0001',
            'secret-0002',
          ],
        },
        {
          input: {
            currentSecret: 'secret-0003',
            previousSecret: null, // no rotation is under way
          },
          expected: [
            'secret-0003',
          ],
        },
        {
          input: {
            currentSecret: null, // neither envelope could be opened
            previousSecret: null,
          },
          expected: [],
        },
      ]

      test.each(cases)('currentSecret: $input.currentSecret', ({
        input,
        expected,
      }) => {
        const received = AppRestfulApiContext.createApiClientSignatureVerifier(input)

        expect(received)
          .toHaveProperty('secrets', expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.extractHeaderValue()', () => {
    describe('should answer the value the header carried', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-0001',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': 'signature-0001',
              },
            }),
            headerName: 'x-ort-client-id',
          },
          expected: 'client-key-0001',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-0002',
                'x-ort-timestamp': '1790157601',
                'x-ort-signature': 'signature-0002',
              },
            }),
            headerName: 'x-ort-timestamp',
          },
          expected: '1790157601',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-0003',
                'x-ort-timestamp': '1790157602',
                'x-ort-signature': 'signature-0003',
              },
            }),
            headerName: 'x-ort-signature',
          },
          expected: 'signature-0003',
        },
      ]

      test.each(cases)('headerName: $input.headerName', ({
        input,
        expected,
      }) => {
        const received = AppRestfulApiContext.extractHeaderValue(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.extractHeaderValue()', () => {
    describe('when the header is absent', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-0004',
              },
            }),
            headerName: 'x-ort-signature',
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({}), // a request carrying no headers at all
            headerName: 'x-ort-client-id',
          },
        },
      ]

      test.each(cases)('headerName: $input.headerName', ({
        input,
      }) => {
        const received = AppRestfulApiContext.extractHeaderValue(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.extractClientKey()', () => {
    describe('should answer the client key the request names', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-0001',
              },
            }),
          },
          expected: 'client-key-0001',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-0002',
              },
            }),
          },
          expected: 'client-key-0002',
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', ({
        input,
        expected,
      }) => {
        const received = AppRestfulApiContext.extractClientKey(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.extractClientKey()', () => {
    describe('when the request names no client', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-timestamp': '1790157600',
              },
            }),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': '',
              },
            }),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // the array a duplicated header arrives as
                'x-ort-client-id': [
                  'client-key-0003',
                  'client-key-0004',
                ],
              },
            }),
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', ({
        input,
      }) => {
        const received = AppRestfulApiContext.extractClientKey(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.extractRawBody()', () => {
    describe('should answer the bytes the body arrived as', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
          },
          expected: '{"externalRef":"external-ref-0001"}',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              rawBody: '{"externalRef":"external-ref-0002"}',
            }),
          },
          expected: '{"externalRef":"external-ref-0002"}',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              rawBody: '', // an empty body the server did parse, and which a client can sign
            }),
          },
          expected: '',
        },
      ]

      test.each(cases)('rawBody: $input.expressRequest.rawBody', ({
        input,
        expected,
      }) => {
        const received = AppRestfulApiContext.extractRawBody(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.extractRawBody()', () => {
    describe('when the server parsed no body', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-0005',
              },
            }),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-0006',
              },
            }),
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', ({
        input,
      }) => {
        const received = AppRestfulApiContext.extractRawBody(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.decryptSecret()', () => {
    /*
     * Every envelope below was produced by `ApiClientSecretCipher#encryptSecret()` under the
     * `API_CLIENT_SECRET_ENCRYPTION_KEY` that `.env.development` declares, in the form
     * `<initializationVectorHex>:<authenticationTagHex>:<ciphertextHex>`.
     */
    describe('should answer the secret the envelope holds', () => {
      const cases = [
        {
          input: {
            envelope: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
          },
          expected: 'secret-0001',
        },
        {
          input: {
            envelope: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
          },
          expected: 'secret-0002',
        },
      ]

      test.each(cases)('envelope: $input.envelope', ({
        input,
        expected,
      }) => {
        const received = AppRestfulApiContext.decryptSecret(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.decryptSecret()', () => {
    describe('when the envelope holds no secret', () => {
      const cases = [
        {
          input: {
            envelope: null, // the column a client with no rotation under way leaves empty
          },
        },
        {
          input: {
            envelope: 'not-an-envelope',
          },
        },
        {
          // the first envelope above with its last ciphertext byte altered
          input: {
            envelope: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9821',
          },
        },
      ]

      test.each(cases)('envelope: $input.envelope', ({
        input,
      }) => {
        const received = AppRestfulApiContext.decryptSecret(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findApiClient()', () => {
    describe('should answer the client the key names', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-signing-10000001',
          },
          expected: 'Development signing client',
        },
        {
          input: {
            clientKey: 'client-key-rotating-10000002',
          },
          expected: 'Development rotating client',
        },
        {
          input: {
            clientKey: 'client-key-switched-off-10000003',
          },
          expected: 'Development switched off client',
        },
      ]

      test.each(cases)('clientKey: $input.clientKey', async ({
        input,
        expected,
      }) => {
        const received = await AppRestfulApiContext.findApiClient(input)

        expect(received)
          .toHaveProperty('name', expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findApiClient()', () => {
    describe('when no row carries the key', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-unregistered-0001',
          },
        },
        {
          input: {
            clientKey: 'client-key-unregistered-0002',
          },
        },
      ]

      test.each(cases)('clientKey: $input.clientKey', async ({
        input,
      }) => {
        const received = await AppRestfulApiContext.findApiClient(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isFreshRequest()', () => {
    /*
     * The presented timestamp stays fixed at 1790157600 — 2026-09-23T10:00:00.000Z as epoch
     * seconds — and the server's own clock is what moves, because the window is measured
     * between the two and either side can be the one that drifted.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-timestamp': '1790157600',
              },
            }),
            requestedAt: new Date('2026-09-23T10:00:00.000Z'), // the same instant
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-timestamp': '1790157600',
              },
            }),
            requestedAt: new Date('2026-09-23T10:05:00.000Z'), // 300 seconds behind, the edge
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-timestamp': '1790157600',
              },
            }),
            requestedAt: new Date('2026-09-23T09:55:00.000Z'), // 300 seconds ahead, the edge
          },
        },
      ]

      test.each(cases)('requestedAt: $input.requestedAt', ({
        input,
      }) => {
        const received = AppRestfulApiContext.isFreshRequest(input)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isFreshRequest()', () => {
    describe('should be falsy', () => {
      describe('when the clock stands outside the window', () => {
        const cases = [
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-timestamp': '1790157600',
                },
              }),
              requestedAt: new Date('2026-09-23T10:05:01.000Z'), // 301 seconds behind
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-timestamp': '1790157600',
                },
              }),
              requestedAt: new Date('2026-09-23T09:54:59.000Z'), // 301 seconds ahead
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-timestamp': '1790157600',
                },
              }),
              requestedAt: new Date('2026-09-24T10:00:00.000Z'), // a whole day behind
            },
          },
        ]

        test.each(cases)('requestedAt: $input.requestedAt', ({
          input,
        }) => {
          const received = AppRestfulApiContext.isFreshRequest(input)

          expect(received)
            .toBeFalsy()
        })
      })

      describe('when the header carries no epoch seconds', () => {
        const cases = [
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-client-id': 'client-key-0001',
                  // 'x-ort-timestamp': absent
                },
              }),
              requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-timestamp': '1790157600.5', // fractional seconds
                },
              }),
              requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-timestamp': 'the-time-it-is', // not a number at all
                },
              }),
              requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('headers: $input.expressRequest.headers', ({
          input,
        }) => {
          const received = AppRestfulApiContext.isFreshRequest(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isSignedRequest()', () => {
    /*
     * The client below holds `secret-0001` as its current secret and `secret-0002` as the one
     * being rotated out, each stored as an envelope `ApiClientSecretCipher#encryptSecret()`
     * produced under the development encryption key. Every signature is the hex HMAC-SHA256 of
     * `1790157600.{"externalRef":"external-ref-0001"}` under the secret each case names.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // computed under secret-0001, the current secret
                'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // computed under secret-0002, the secret being rotated out
                'x-ort-signature': '1145c145c9a45ebac65a1d94b2155ab7e5bef061e21824a7257c1659b0629bdd',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', ({
        input,
      }) => {
        const received = AppRestfulApiContext.isSignedRequest(input)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isSignedRequest()', () => {
    describe('should be falsy', () => {
      describe('when the body differs from the one that was signed', () => {
        const cases = [
          {
            input: {
              expressRequest: /** @type {*} */ ({
                // the signature of `{"externalRef":"external-ref-0001"}` under secret-0001
                headers: {
                  'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                  'x-ort-timestamp': '1790157600',
                },
                // one byte of the signed body altered
                rawBody: '{"externalRef":"external-ref-0002"}',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                  'x-ort-timestamp': '1790157600',
                },
                // one byte appended to the signed body
                rawBody: '{"externalRef":"external-ref-0001"} ',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
            },
          },
        ]

        test.each(cases)('rawBody: $input.expressRequest.rawBody', ({
          input,
        }) => {
          const received = AppRestfulApiContext.isSignedRequest(input)

          expect(received)
            .toBeFalsy()
        })
      })

      describe('when the signature was computed under a secret this client does not hold', () => {
        const cases = [
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  // computed under secret-0003
                  'x-ort-signature': 'bac66d147046d2a5ebfa06c11bb09b84b99306be4f26e7b6b33183763f3794b8',
                  'x-ort-timestamp': '1790157600',
                },
                rawBody: '{"externalRef":"external-ref-0001"}',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  // computed under secret-0002, which this client no longer holds
                  'x-ort-signature': '1145c145c9a45ebac65a1d94b2155ab7e5bef061e21824a7257c1659b0629bdd',
                  'x-ort-timestamp': '1790157600',
                },
                rawBody: '{"externalRef":"external-ref-0001"}',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: null, // no rotation is under way
              }),
            },
          },
        ]

        test.each(cases)('headers: $input.expressRequest.headers', ({
          input,
        }) => {
          const received = AppRestfulApiContext.isSignedRequest(input)

          expect(received)
            .toBeFalsy()
        })
      })

      describe('when the request presents no signature material', () => {
        const cases = [
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                  'x-ort-timestamp': '1790157600',
                },
                // rawBody: absent, because the server parsed no body
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  // 'x-ort-signature': absent
                  'x-ort-timestamp': '1790157600',
                },
                rawBody: '{"externalRef":"external-ref-0001"}',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
            },
          },
        ]

        test.each(cases)('headers: $input.expressRequest.headers', ({
          input,
        }) => {
          const received = AppRestfulApiContext.isSignedRequest(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isAcceptableRequest()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // computed under secret-0001, the current secret
                'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // computed under secret-0002, the secret being rotated out
                'x-ort-signature': '1145c145c9a45ebac65a1d94b2155ab7e5bef061e21824a7257c1659b0629bdd',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
            requestedAt: new Date('2026-09-23T10:04:00.000Z'),
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', ({
        input,
      }) => {
        const received = AppRestfulApiContext.isAcceptableRequest(input)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isAcceptableRequest()', () => {
    describe('should be falsy', () => {
      describe('when the clock stands outside the window', () => {
        const cases = [
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                  'x-ort-timestamp': '1790157600',
                },
                rawBody: '{"externalRef":"external-ref-0001"}',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
              requestedAt: new Date('2026-09-23T10:05:01.000Z'), // 301 seconds behind
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                  'x-ort-timestamp': '1790157600',
                },
                rawBody: '{"externalRef":"external-ref-0001"}',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
              requestedAt: new Date('2026-09-23T09:54:59.000Z'), // 301 seconds ahead
            },
          },
        ]

        test.each(cases)('requestedAt: $input.requestedAt', ({
          input,
        }) => {
          const received = AppRestfulApiContext.isAcceptableRequest(input)

          expect(received)
            .toBeFalsy()
        })
      })

      describe('when the signature does not verify', () => {
        const cases = [
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  // computed under secret-0003
                  'x-ort-signature': 'bac66d147046d2a5ebfa06c11bb09b84b99306be4f26e7b6b33183763f3794b8',
                  'x-ort-timestamp': '1790157600',
                },
                rawBody: '{"externalRef":"external-ref-0001"}',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
              requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              expressRequest: /** @type {*} */ ({
                headers: {
                  // the signature of `{"externalRef":"external-ref-0001"}`, presented with a body
                  // one byte different
                  'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                  'x-ort-timestamp': '1790157600',
                },
                rawBody: '{"externalRef":"external-ref-0002"}',
              }),
              apiClient: /** @type {*} */ ({
                secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
                previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
              }),
              requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('rawBody: $input.expressRequest.rawBody', ({
          input,
        }) => {
          const received = AppRestfulApiContext.isAcceptableRequest(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    /*
     * Every signature below is the hex HMAC-SHA256 of
     * `1790157600.{"externalRef":"external-ref-0001"}` under one of the secrets
     * `.env.development` declares, and each seeded client in
     * `sequelize/seeders/development/20260923100003-000001-api_clients.cjs` stores that same
     * secret encrypted.
     */
    describe('should answer the client that signed the request', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                // under DEVELOPMENT_API_CLIENT_SECRET
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
          expected: 'Development signing client',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-rotating-10000002',
                'x-ort-timestamp': '1790157600',
                // under DEVELOPMENT_ROTATING_API_CLIENT_SECRET
                'x-ort-signature': '66dd08b8495569a5634903543ed9ce59ebefab4e5e22858dcfba8d5641b58a15',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
          expected: 'Development rotating client',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-rotating-10000002',
                'x-ort-timestamp': '1790157600',
                // under DEVELOPMENT_ROTATING_API_CLIENT_PREVIOUS_SECRET, so a rotation under way
                // is not an outage
                'x-ort-signature': '8504e949beb7f1a99141df1f198cded988a7af61df15394402a52a035871b337',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
          expected: 'Development rotating client',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-switched-off-10000003',
                'x-ort-timestamp': '1790157600',
                // under DEVELOPMENT_INACTIVE_API_CLIENT_SECRET. The client is resolved even
                // though its record is switched off, so that the engine can answer 403 and not
                // 401 — see the class description
                'x-ort-signature': 'd30b467a2ac00d036ae7bad97355ab00eafa628bf4225f37d108ec526c28295c',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
          expected: 'Development switched off client',
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', async ({
        input,
        expected,
      }) => {
        const received = await AppRestfulApiContext.findUser(input)

        expect(received)
          .toHaveProperty('name', expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    describe('when the clock stands at the edge of the window', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:05:00.000Z'), // 300 seconds behind
          },
          expected: 'Development signing client',
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T09:55:00.000Z'), // 300 seconds ahead
          },
          expected: 'Development signing client',
        },
      ]

      test.each(cases)('requestedAt: $input.requestedAt', async ({
        input,
        expected,
      }) => {
        const received = await AppRestfulApiContext.findUser(input)

        expect(received)
          .toHaveProperty('name', expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    describe('when the body differs from the one that was signed', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                // the signature of `{"externalRef":"external-ref-0001"}`
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              // one byte of the signed body altered
              rawBody: '{"externalRef":"external-ref-0002"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              // one byte appended to the signed body
              rawBody: '{"externalRef":"external-ref-0001"} ',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('rawBody: $input.expressRequest.rawBody', async ({
        input,
      }) => {
        const received = await AppRestfulApiContext.findUser(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    describe('when the clock stands more than 300 seconds from the timestamp', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:05:01.000Z'), // 301 seconds behind
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T09:54:59.000Z'), // 301 seconds ahead
          },
        },
      ]

      test.each(cases)('requestedAt: $input.requestedAt', async ({
        input,
      }) => {
        const received = await AppRestfulApiContext.findUser(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    describe('when the signature belongs to another client', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                // the rotating client's signature, presented as the signing client
                'x-ort-signature': '66dd08b8495569a5634903543ed9ce59ebefab4e5e22858dcfba8d5641b58a15',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-rotating-10000002',
                'x-ort-timestamp': '1790157600',
                // the signing client's signature, presented as the rotating client
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', async ({
        input,
      }) => {
        const received = await AppRestfulApiContext.findUser(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    describe('when the request names no registered client', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-unregistered-0001',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // 'x-ort-client-id': absent
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', async ({
        input,
      }) => {
        const received = await AppRestfulApiContext.findUser(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    describe('when the request presents no signature at all', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                // 'x-ort-signature': absent
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-rotating-10000002',
                'x-ort-timestamp': '1790157600',
                // 'x-ort-signature': absent
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', async ({
        input,
      }) => {
        const received = await AppRestfulApiContext.findUser(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('#get:apiClient', () => {
    describe('should answer the resolved client', () => {
      const signingApiClient = /** @type {*} */ ({
        id: 100001,
        clientKey: 'client-key-0001',
      })
      const rotatingApiClient = /** @type {*} */ ({
        id: 100002,
        clientKey: 'client-key-0002',
      })

      const cases = [
        {
          input: {
            userEntity: signingApiClient,
          },
          expected: signingApiClient,
        },
        {
          input: {
            userEntity: rotatingApiClient,
          },
          expected: rotatingApiClient,
        },
      ]

      test.each(cases)('userEntity: $input.userEntity', ({
        input,
        expected,
      }) => {
        const args = {
          expressRequest: /** @type {*} */ ({}),
          engine: /** @type {*} */ ({}),
          userEntity: input.userEntity,
          visa: /** @type {*} */ ({}),
          requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          uuid: '98765432-abcd-0000-1234-000000000001',
        }
        const context = new AppRestfulApiContext(args)

        const received = context.apiClient

        expect(received)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('#get:apiClient', () => {
    describe('when no client was resolved', () => {
      const cases = [
        {
          input: {
            requestedAt: new Date('2026-09-23T10:00:00.001Z'),
            uuid: '98765432-abcd-0000-1234-000000000001',
          },
        },
        {
          input: {
            requestedAt: new Date('2026-09-23T10:00:00.002Z'),
            uuid: '98765432-abcd-0000-1234-000000000002',
          },
        },
      ]

      test.each(cases)('requestedAt: $input.requestedAt', ({
        input,
      }) => {
        const args = {
          expressRequest: /** @type {*} */ ({}),
          engine: /** @type {*} */ ({}),
          userEntity: null,
          visa: /** @type {*} */ ({}),
          requestedAt: input.requestedAt,
          uuid: input.uuid,
        }
        const context = new AppRestfulApiContext(args)

        const received = context.apiClient

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('#get:apiClientId', () => {
    describe('should answer the resolved client id', () => {
      const cases = [
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100001,
              clientKey: 'client-key-0001',
            }),
          },
          expected: 100001,
        },
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100002,
              clientKey: 'client-key-0002',
            }),
          },
          expected: 100002,
        },
      ]

      test.each(cases)('userEntity: $input.userEntity', ({
        input,
        expected,
      }) => {
        const args = {
          expressRequest: /** @type {*} */ ({}),
          engine: /** @type {*} */ ({}),
          userEntity: input.userEntity,
          visa: /** @type {*} */ ({}),
          requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          uuid: '98765432-abcd-0000-1234-000000000003',
        }
        const context = new AppRestfulApiContext(args)

        const received = context.apiClientId

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('#get:apiClientId', () => {
    describe('when no client was resolved', () => {
      const cases = [
        {
          input: {
            requestedAt: new Date('2026-09-23T10:00:00.003Z'),
            uuid: '98765432-abcd-0000-1234-000000000004',
          },
        },
        {
          input: {
            requestedAt: new Date('2026-09-23T10:00:00.004Z'),
            uuid: '98765432-abcd-0000-1234-000000000005',
          },
        },
      ]

      test.each(cases)('requestedAt: $input.requestedAt', ({
        input,
      }) => {
        const args = {
          expressRequest: /** @type {*} */ ({}),
          engine: /** @type {*} */ ({}),
          userEntity: null,
          visa: /** @type {*} */ ({}),
          requestedAt: input.requestedAt,
          uuid: input.uuid,
        }
        const context = new AppRestfulApiContext(args)

        const received = context.apiClientId

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.get:ApiClientAuthenticationLoggerCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AppRestfulApiContext.ApiClientAuthenticationLoggerCtor

        expect(received)
          .toBe(ApiClientAuthenticationLogger) // same reference
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.createApiClientAuthenticationLogger()', () => {
    describe('when called as is', () => {
      test('should be an instance of ApiClientAuthenticationLogger', () => {
        const received = AppRestfulApiContext.createApiClientAuthenticationLogger()

        expect(received)
          .toBeInstanceOf(ApiClientAuthenticationLogger)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.logRefusedAuthentication()', () => {
    describe('should hand the refusal to the logger unchanged', () => {
      const cases = [
        {
          tally: {
            reasonCode: 'UNKNOWN_CLIENT_KEY',
            apiClientId: null,
          },
        },
        {
          tally: {
            reasonCode: 'SIGNATURE_MISMATCH',
            apiClientId: 10000001,
          },
        },
      ]

      test.each(cases)('reasonCode: $tally.reasonCode', ({
        tally,
      }) => {
        const logSpy = jest.spyOn(
          ApiClientAuthenticationLogger.prototype,
          'logRefusedAuthentication'
        )

        AppRestfulApiContext.logRefusedAuthentication(tally)

        expect(logSpy)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findApiClient()', () => {
    /*
     * The row this answers with becomes `context.userEntity`, which every renderer can read, so
     * neither secret envelope may be on it. `dataValues` is what the read actually brought back —
     * the model declares a getter for every attribute either way.
     */
    describe('should carry no client secret', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-signing-10000001',
          },
        },
        {
          input: {
            clientKey: 'client-key-rotating-10000002',
          },
        },
        {
          input: {
            clientKey: 'client-key-switched-off-10000003',
          },
        },
      ]

      test.each(cases)('clientKey: $input.clientKey', async ({
        input,
      }) => {
        const apiClient = await AppRestfulApiContext.findApiClient(input)
        const received = apiClient.dataValues

        expect(received)
          .not
          .toHaveProperty('secretCiphertext')
        expect(received)
          .not
          .toHaveProperty('previousSecretCiphertext')
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findApiClient()', () => {
    describe('should still carry what a renderer reads', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-signing-10000001',
          },
          expected: 10000001,
        },
        {
          input: {
            clientKey: 'client-key-rotating-10000002',
          },
          expected: 10000002,
        },
        {
          input: {
            clientKey: 'client-key-switched-off-10000003',
          },
          expected: 10000003,
        },
      ]

      test.each(cases)('clientKey: $input.clientKey', async ({
        input,
        expected,
      }) => {
        const apiClient = await AppRestfulApiContext.findApiClient(input)
        const received = apiClient.id

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findSecretBearingApiClient()', () => {
    /*
     * The whole of `dataValues` is pinned, because the point of this read is that it brings back
     * the two envelopes and nothing else of the row. The envelopes themselves carry a fresh
     * initialization vector per encryption, so there is no fixed value to write for them.
     */
    describe('should carry the secret envelopes and nothing else', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-signing-10000001',
          },
          expected: {
            secretCiphertext: expect.any(String),
            previousSecretCiphertext: null, // no rotation is under way
          },
        },
        {
          input: {
            clientKey: 'client-key-rotating-10000002',
          },
          expected: {
            secretCiphertext: expect.any(String),
            previousSecretCiphertext: expect.any(String),
          },
        },
        {
          input: {
            clientKey: 'client-key-switched-off-10000003',
          },
          expected: {
            secretCiphertext: expect.any(String),
            previousSecretCiphertext: null, // no rotation is under way
          },
        },
      ]

      test.each(cases)('clientKey: $input.clientKey', async ({
        input,
        expected,
      }) => {
        const apiClient = await AppRestfulApiContext.findSecretBearingApiClient(input)
        const received = apiClient.dataValues

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findSecretBearingApiClient()', () => {
    describe('when no row carries the key', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-unregistered-0003',
          },
        },
        {
          input: {
            clientKey: 'client-key-unregistered-0004',
          },
        },
      ]

      test.each(cases)('clientKey: $input.clientKey', async ({
        input,
      }) => {
        const received = await AppRestfulApiContext.findSecretBearingApiClient(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    /*
     * A request naming no client key is the one refusal reachable with no credential at all, so a
     * line per such request is a disk write anyone can drive as fast as the service answers. What
     * is pinned is that the logger is not reached at all — not that it is reached with a different
     * reason code — because any line on this path grows with the request stream.
     */
    describe('should write no line when the request names no client', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {},
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': '',
              },
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': [
                  'client-key-signing-10000001',
                  'client-key-rotating-10000002',
                ], // what a duplicated header arrives as, which names no one client
              },
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', async ({
        input,
      }) => {
        const logSpy = jest.spyOn(AppRestfulApiContext, 'logRefusedAuthentication')

        await AppRestfulApiContext.findUser(input)

        expect(logSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.findUser()', () => {
    describe('should log a refusal when the client key names no row', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-unregistered-0005',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
          expected: {
            reasonCode: 'UNKNOWN_CLIENT_KEY',
            apiClientId: null,
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-client-id': 'client-key-unregistered-0006',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': '83e5ebe4db10e738036474dfa7898dd4b45836c5b9ed11d2728eaa6d8491286a',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            accessToken: null,
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
          expected: {
            reasonCode: 'UNKNOWN_CLIENT_KEY',
            apiClientId: null,
          },
        },
      ]

      test.each(cases)('headers: $input.expressRequest.headers', async ({
        input,
        expected,
      }) => {
        const logSpy = jest.spyOn(AppRestfulApiContext, 'logRefusedAuthentication')

        await AppRestfulApiContext.findUser(input)

        expect(logSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isAcceptableRequest()', () => {
    describe('should log a refusal when the clock stands outside the window', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
            requestedAt: new Date('2026-09-23T10:05:01.000Z'), // 301 seconds behind
            apiClientId: 10000001,
          },
          expected: {
            reasonCode: 'STALE_TIMESTAMP',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
            requestedAt: new Date('2026-09-23T09:54:59.000Z'), // 301 seconds ahead
            apiClientId: 10000002,
          },
          expected: {
            reasonCode: 'STALE_TIMESTAMP',
            apiClientId: 10000002,
          },
        },
      ]

      test.each(cases)('requestedAt: $input.requestedAt', ({
        input,
        expected,
      }) => {
        const logSpy = jest.spyOn(AppRestfulApiContext, 'logRefusedAuthentication')

        AppRestfulApiContext.isAcceptableRequest(input)

        expect(logSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isAcceptableRequest()', () => {
    describe('should log a refusal when the signature does not verify', () => {
      const cases = [
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // computed under secret-0003, which is neither of this client's secrets
                'x-ort-signature': 'bac66d147046d2a5ebfa06c11bb09b84b99306be4f26e7b6b33183763f3794b8',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            apiClientId: 10000001,
          },
          expected: {
            reasonCode: 'SIGNATURE_MISMATCH',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // the signature of `{"externalRef":"external-ref-0001"}`, presented with another
                // body
                'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0002"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            apiClientId: 10000002,
          },
          expected: {
            reasonCode: 'SIGNATURE_MISMATCH',
            apiClientId: 10000002,
          },
        },
      ]

      test.each(cases)('rawBody: $input.expressRequest.rawBody', ({
        input,
        expected,
      }) => {
        const logSpy = jest.spyOn(AppRestfulApiContext, 'logRefusedAuthentication')

        AppRestfulApiContext.isAcceptableRequest(input)

        expect(logSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AppRestfulApiContext', () => {
  describe('.isAcceptableRequest()', () => {
    describe('should log nothing when the request is fresh and signed', () => {
      const cases = [
        {
          label: 'a request signed with the current secret',
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // computed under secret-0001, the current secret
                'x-ort-signature': 'e93656e71a8792c2a3aedcdd9060a4a654d869e3f48fea4f8ed4daa92e9c2aae',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            apiClientId: 10000001,
          },
        },
        {
          label: 'a request signed with the secret being rotated out',
          input: {
            expressRequest: /** @type {*} */ ({
              headers: {
                // computed under secret-0002, the secret being rotated out
                'x-ort-signature': '1145c145c9a45ebac65a1d94b2155ab7e5bef061e21824a7257c1659b0629bdd',
                'x-ort-timestamp': '1790157600',
              },
              rawBody: '{"externalRef":"external-ref-0001"}',
            }),
            apiClient: /** @type {*} */ ({
              secretCiphertext: 'fa2e6f6dfcb333d268a389e2:29d5191aa14aa6518ed67920dea538a8:b5fa82754e4b83894e9820',
              previousSecretCiphertext: '702ce6ad393fd1ac8f968545:589c00b5c7f12488b57f810d90226dda:029fc48126af6398b7b8f5',
            }),
            requestedAt: new Date('2026-09-23T10:00:00.000Z'),
            apiClientId: 10000002,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const logSpy = jest.spyOn(AppRestfulApiContext, 'logRefusedAuthentication')

        AppRestfulApiContext.isAcceptableRequest(input)

        expect(logSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
