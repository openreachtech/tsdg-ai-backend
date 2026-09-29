import ApiClientSignatureVerifier from '../../../../app/apiClient/ApiClientSignatureVerifier.js'

import crypto from 'node:crypto'

import {
  env,
} from '../../../../app/globals/_.js'

describe('ApiClientSignatureVerifier', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#secrets', () => {
        const cases = [
          {
            tally: [
              'secret-0001',
            ],
          },
          {
            tally: [
              'secret-0002',
              'secret-0003',
            ],
          },
          {
            tally: [], // a client left with no usable secret at all
          },
        ]

        test.each(cases)('secrets: $tally', ({
          tally,
        }) => {
          const verifier = new ApiClientSignatureVerifier({
            secrets: tally,
          })

          expect(verifier)
            .toHaveProperty('secrets', tally)
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            currentSecret: 'secret-0004',
            previousSecret: 'secret-0005',
          },
        },
        {
          input: {
            currentSecret: 'secret-0006',
            previousSecret: 'secret-0007',
          },
        },
      ]

      test.each(cases)('currentSecret: $input.currentSecret', ({
        input,
      }) => {
        const received = ApiClientSignatureVerifier.create(input)

        expect(received)
          .toBeInstanceOf(ApiClientSignatureVerifier)
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('.create()', () => {
    /*
     * The factory gathers the two secrets into the one list the constructor holds, so what reaches
     * the constructor is the derived list and not the arguments as they were given.
     */
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            currentSecret: 'secret-0008',
            previousSecret: 'secret-0009',
          },
          expected: {
            secrets: [
              'secret-0008',
              'secret-0009',
            ],
          },
        },
        {
          input: {
            currentSecret: 'secret-0010',
            previousSecret: 'secret-0011',
          },
          expected: {
            secrets: [
              'secret-0010',
              'secret-0011',
            ],
          },
        },
      ]

      test.each(cases)('currentSecret: $input.currentSecret', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(ApiClientSignatureVerifier)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('.create()', () => {
    /*
     * An absent previous secret means no rotation is under way, and an empty one would otherwise
     * be a usable HMAC key — a key anybody can guess, accepted for every client that shipped
     * without one. A secret that is not a non-empty string is therefore dropped rather than held.
     */
    describe('should drop a secret that is not usable', () => {
      /** @type {Array<{ input: { currentSecret: *, previousSecret: * }, expected: { secrets: Array<string> } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            currentSecret: 'secret-0012',
            previousSecret: null, // no rotation under way
          },
          expected: {
            secrets: [
              'secret-0012',
            ],
          },
        },
        {
          input: {
            currentSecret: 'secret-0013',
            previousSecret: '',
          },
          expected: {
            secrets: [
              'secret-0013',
            ],
          },
        },
        {
          input: {
            currentSecret: 'secret-0014',
            previousSecret: 100001,
          },
          expected: {
            secrets: [
              'secret-0014',
            ],
          },
        },
        {
          input: {
            currentSecret: '',
            previousSecret: 'secret-0015',
          },
          expected: {
            secrets: [
              'secret-0015',
            ],
          },
        },
        {
          input: {
            currentSecret: null,
            previousSecret: [
              'secret-0016',
            ],
          },
          expected: {
            secrets: [],
          },
        },
      ])

      test.each(cases)('previousSecret: $input.previousSecret', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(ApiClientSignatureVerifier)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('.create()', () => {
    describe('should fill default previousSecret', () => {
      const cases = [
        {
          input: {
            currentSecret: 'secret-0017',
            // previousSecret: omitted → default null
          },
          expected: {
            secrets: [
              'secret-0017',
            ],
          },
        },
        {
          input: {
            currentSecret: 'secret-0018',
            // previousSecret: omitted → default null
          },
          expected: {
            secrets: [
              'secret-0018',
            ],
          },
        },
      ]

      test.each(cases)('currentSecret: $input.currentSecret', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(ApiClientSignatureVerifier)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('.get:crypto', () => {
    describe('when called as is', () => {
      test('should be the node crypto module', () => {
        const received = ApiClientSignatureVerifier.crypto

        expect(received)
          .toBe(crypto) // same reference
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: ApiClientSignatureVerifier,
      },
      {
        tally: class AlphaApiClientSignatureVerifier extends ApiClientSignatureVerifier {},
      },
      {
        tally: class BetaApiClientSignatureVerifier extends ApiClientSignatureVerifier {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const verifier = tally.create({
        currentSecret: 'secret-0019', // the secret plays no part in which constructor answers
      })

      const received = verifier.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * Every signature in this file was derived offline as the hex HMAC-SHA256 of the payload named
     * in its comment, under the secret `.env.development` declares for the client named beside it —
     * `printf '%s' <payload> | openssl dgst -sha256 -hmac <secret>`. The seeded clients in
     * `sequelize/seeders/development/20260923100003-000001-api_clients.cjs` store those same
     * secrets encrypted, so these are the secrets a development caller really signs with.
     */
    describe('should be truthy', () => {
      describe('when the honest pair is presented', () => {
        const cases = [
          {
            input: {
              currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
              // of `1790140897.{"rate":"1.5"}`
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
              // of `1790140898.{"amount":"2.50"}`
              signatureHeaderValue: 'da39baf185cd6bad3e353fbfe01387d399158628932dd0fbe1ba1940ed671a92',
              timestampHeaderValue: '1790140898',
              rawBody: '{"amount":"2.50"}',
            },
          },
        ]

        test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
          input,
        }) => {
          const createArgs = {
            currentSecret: input.currentSecret,
          }
          const isAcceptableSignatureArgs = {
            signatureHeaderValue: input.signatureHeaderValue,
            timestampHeaderValue: input.timestampHeaderValue,
            rawBody: input.rawBody,
          }

          const verifier = ApiClientSignatureVerifier.create(createArgs)

          const received = verifier.isAcceptableSignature(isAcceptableSignatureArgs)

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * While a rotation is under way the client holds a current secret and a previous one, and a
     * request signed under either verifies — so rotating a secret is not an outage.
     */
    describe('should be truthy', () => {
      describe('when a rotation is under way', () => {
        const cases = [
          {
            input: {
              // of `1790140897.{"rate":"1.5"}`, under the rotating client's current secret
              signatureHeaderValue: '53bd1a5c53f2743a3ea6a7589636c6c34d495876e7ba4d3767ad9d6e37638c6d',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              // of `1790140897.{"rate":"1.5"}`, under the secret being rotated out
              signatureHeaderValue: '24d2a4954b1b06c1085decfb2ff047b745559edfbfde81014b722d6acdd6bb2d',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              // of `1790140898.{"amount":"2.50"}`, under the current secret
              signatureHeaderValue: '517612896db366e0ae2b18600aba48ae3a808818eb4a2ebb0c1c2948d94c3be1',
              timestampHeaderValue: '1790140898',
              rawBody: '{"amount":"2.50"}',
            },
          },
          {
            input: {
              // of `1790140898.{"amount":"2.50"}`, under the secret being rotated out
              signatureHeaderValue: '18ae682fb4af2627fe84ebb8639109fbcffc4ba842a026671de44f7068822709',
              timestampHeaderValue: '1790140898',
              rawBody: '{"amount":"2.50"}',
            },
          },
        ]

        test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
          input,
        }) => {
          const createArgs = {
            currentSecret: env.DEVELOPMENT_ROTATING_API_CLIENT_SECRET,
            previousSecret: env.DEVELOPMENT_ROTATING_API_CLIENT_PREVIOUS_SECRET,
          }
          const isAcceptableSignatureArgs = {
            signatureHeaderValue: input.signatureHeaderValue,
            timestampHeaderValue: input.timestampHeaderValue,
            rawBody: input.rawBody,
          }

          const verifier = ApiClientSignatureVerifier.create(createArgs)

          const received = verifier.isAcceptableSignature(isAcceptableSignatureArgs)

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * A body the engine parsed and found empty arrives as `''`, and it is a body somebody signed —
     * the payload is the timestamp and the delimiter and nothing after it. The kind of the value
     * decides whether there is material to verify, never its length.
     */
    describe('should be truthy', () => {
      describe('when the body that was signed is empty', () => {
        const cases = [
          {
            input: {
              signatureHeaderValue: 'c70bd742ba3c6c78aab256b84f52a722d22eb1748e5dd4abd18aa1e0e43fc2a9', // of `1790140897.`
              timestampHeaderValue: '1790140897',
              rawBody: '',
            },
          },
          {
            input: {
              signatureHeaderValue: '46ffada616423710f4c4df1dc062cac45f233f6e09ce99a3a40876328fc5c8a9', // of `1790140898.`
              timestampHeaderValue: '1790140898',
              rawBody: '',
            },
          },
        ]

        test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
          })

          const received = verifier.isAcceptableSignature(input)

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * The signed payload is `timestamp + "." + rawBody`, and a body carries `.` as freely as any
     * other character. Under the signing client's secret, the timestamp `1790140897` and the body
     * `{"rate":"1.5"}` sign the payload `1790140897.{"rate":"1.5"}` — the pair accepted above.
     *
     * Splitting that same payload at its other `.` yields the timestamp `1790140897.{"rate":"1`
     * and the body `5"}`: a different body, the same payload byte for byte, and therefore the
     * same signature. A caller presenting the honest signature with that pair is presenting a
     * signature for a body nobody signed, and must be refused — a signature binds to the one pair
     * it was computed over, not to every pair the delimiter could carve out of the payload.
     *
     * Requiring the timestamp to be a run of digits is what refuses it: no re-split can put digits
     * alone on the left of the delimiter once the honest timestamp already ends there. Each
     * signature below is accepted under its honest pair in `when the honest pair is presented`, so
     * these cases can fail for the re-split and for nothing else.
     */
    describe('should be falsy', () => {
      describe('when the payload is re-split between the timestamp and the body', () => {
        const cases = [
          {
            input: {
              // of `1790140897.{"rate":"1.5"}`
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897.{"rate":"1',
              rawBody: '5"}',
            },
          },
          {
            input: {
              // of `1790140898.{"amount":"2.50"}`
              signatureHeaderValue: 'da39baf185cd6bad3e353fbfe01387d399158628932dd0fbe1ba1940ed671a92',
              timestampHeaderValue: '1790140898.{"amount":"2',
              rawBody: '50"}',
            },
          },
        ]

        test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
          })

          const received = verifier.isAcceptableSignature(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    describe('should be falsy', () => {
      describe('when the body differs from the one that was signed', () => {
        const cases = [
          {
            input: {
              // of `1790140897.{"rate":"1.5"}`
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.6"}', // one byte of the signed body altered
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"} ', // one byte appended to the signed body
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"', // one byte removed from the signed body
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897',
              rawBody: '', // the body emptied altogether
            },
          },
        ]

        test.each(cases)('rawBody: $input.rawBody', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
          })

          const received = verifier.isAcceptableSignature(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * The verifier below holds the signing client's secret and the rotating client's previous one.
     * Each signature is over the honest payload, under a secret this client does not hold.
     */
    describe('should be falsy', () => {
      describe('when a secret the client does not hold signed the request', () => {
        const cases = [
          {
            input: {
              // of `1790140897.{"rate":"1.5"}`, under the switched off client's secret
              signatureHeaderValue: '02cef44b7a1273780e47095f41688a033e22b4f1bd8d555a165b65ae0ca1b68e',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              // of `1790140898.{"amount":"2.50"}`, under the switched off client's secret
              signatureHeaderValue: '0c9debf528cdbd9256d14c9f770fbbc76c7a329fdf16b369f55ab5b25512a63e',
              timestampHeaderValue: '1790140898',
              rawBody: '{"amount":"2.50"}',
            },
          },
          {
            input: {
              // of `1790140897.{"rate":"1.5"}`, under the rotating client's current secret
              signatureHeaderValue: '53bd1a5c53f2743a3ea6a7589636c6c34d495876e7ba4d3767ad9d6e37638c6d',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
        ]

        test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
          input,
        }) => {
          const createArgs = {
            currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
            previousSecret: env.DEVELOPMENT_ROTATING_API_CLIENT_PREVIOUS_SECRET,
          }

          const verifier = ApiClientSignatureVerifier.create(createArgs)

          const received = verifier.isAcceptableSignature(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * Each signature below is the honest one for `1790140897.{"rate":"1.5"}`, so the timestamp's
     * shape is the only thing standing between the request and acceptance.
     */
    describe('should be falsy', () => {
      describe('when the timestamp is not a run of digits', () => {
        /** @type {Array<{ input: { signatureHeaderValue: string, timestampHeaderValue: *, rawBody: string } }>} */
        const cases = /** @type {Array<*>} */ ([
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897 ', // a trailing space
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: ' 1790140897', // a leading space
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '+1790140897', // a leading sign
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897.0', // fractional seconds
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '', // a header declared with no value
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: 'the-time-it-is', // not a number at all
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: undefined, // a header nobody sent
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: null,
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: 1790140897, // the seconds as a number, not as the text signed
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: [ // what a header sent twice arrives as
                '1790140897',
                '1790140898',
              ],
              rawBody: '{"rate":"1.5"}',
            },
          },
        ])

        test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
          })

          const received = verifier.isAcceptableSignature(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * `Buffer.from(value, 'hex')` truncates a malformed hex string rather than rejecting it, and
     * `crypto.timingSafeEqual()` raises a RangeError on buffers of differing length. Each case
     * below is refused before a buffer is built from it, so a malformed signature is a failed
     * verification and never an error handed to the caller.
     */
    describe('should be falsy', () => {
      describe('when the signature is malformed', () => {
        /** @type {Array<{ input: { signatureHeaderValue: *, timestampHeaderValue: string, rawBody: string } }>} */
        const cases = /** @type {Array<*>} */ ([
          {
            input: {
              // the honest signature with its last character dropped
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              // the honest signature with one character appended
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e99',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              // the right length, but the last character is not hex
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664eg',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: '', // a header declared with no value
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: undefined, // a header nobody sent
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: null,
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: [ // what a header sent twice arrives as
                '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
                '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              ],
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: 100002,
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
        ])

        test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
          })

          const received = verifier.isAcceptableSignature(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * Every signature below is the honest one for `1790140897.` — the payload of an empty body. A
     * request the engine parsed no body for carries no `rawBody` at all, and reading that absence
     * as the empty string would hand the holder of this signature every unparsed request there is.
     * The empty body itself is accepted in `when the body that was signed is empty`; these are
     * refused, which is what tells an absent body apart from an empty one.
     */
    describe('should be falsy', () => {
      describe('when the raw body is not a string', () => {
        /** @type {Array<{ input: { signatureHeaderValue: string, timestampHeaderValue: string, rawBody: * } }>} */
        const cases = /** @type {Array<*>} */ ([
          {
            input: {
              signatureHeaderValue: 'c70bd742ba3c6c78aab256b84f52a722d22eb1748e5dd4abd18aa1e0e43fc2a9',
              timestampHeaderValue: '1790140897',
              rawBody: undefined, // a request the engine parsed no body for
            },
          },
          {
            input: {
              signatureHeaderValue: 'c70bd742ba3c6c78aab256b84f52a722d22eb1748e5dd4abd18aa1e0e43fc2a9',
              timestampHeaderValue: '1790140897',
              rawBody: null,
            },
          },
          {
            input: {
              signatureHeaderValue: 'c70bd742ba3c6c78aab256b84f52a722d22eb1748e5dd4abd18aa1e0e43fc2a9',
              timestampHeaderValue: '1790140897',
              rawBody: 100003,
            },
          },
          {
            input: {
              signatureHeaderValue: 'c70bd742ba3c6c78aab256b84f52a722d22eb1748e5dd4abd18aa1e0e43fc2a9',
              timestampHeaderValue: '1790140897',
              rawBody: { // the parsed body, in place of the raw one
                rate: '1.5',
              },
            },
          },
          {
            input: {
              signatureHeaderValue: 'c70bd742ba3c6c78aab256b84f52a722d22eb1748e5dd4abd18aa1e0e43fc2a9',
              timestampHeaderValue: '1790140897',
              rawBody: Buffer.from(''), // the bytes, before the engine made text of them
            },
          },
        ])

        test.each(cases)('rawBody: $input.rawBody', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: env.DEVELOPMENT_API_CLIENT_SECRET,
          })

          const received = verifier.isAcceptableSignature(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isAcceptableSignature()', () => {
    /*
     * A client left with no usable secret verifies nothing — there is no key to digest under, so
     * no signature can match, honest or otherwise.
     */
    describe('should be falsy', () => {
      describe('when the client has no usable secret', () => {
        const cases = [
          {
            input: {
              signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              timestampHeaderValue: '1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              signatureHeaderValue: 'da39baf185cd6bad3e353fbfe01387d399158628932dd0fbe1ba1940ed671a92',
              timestampHeaderValue: '1790140898',
              rawBody: '{"amount":"2.50"}',
            },
          },
        ]

        test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: '', // nothing usable, so `secrets` comes out empty
          })

          const received = verifier.isAcceptableSignature(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#hasSignatureMaterial()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            timestampHeaderValue: '1790140897',
            rawBody: '{"rate":"1.5"}',
          },
        },
        {
          input: {
            timestampHeaderValue: '0', // the epoch itself
            rawBody: '', // an empty body is a body
          },
        },
        {
          input: {
            timestampHeaderValue: '9007199254740991', // Number.MAX_SAFE_INTEGER
            rawBody: 'omega',
          },
        },
      ]

      test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
        input,
      }) => {
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: 'secret-0020', // the secret plays no part in whether the material is there
        })

        const received = verifier.hasSignatureMaterial(input)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#hasSignatureMaterial()', () => {
    /*
     * The delimiter has to divide the payload unambiguously, and only a run of digits on the left
     * of it can. Anything else leaves one payload readable as more than one pair — material this
     * class cannot verify rather than material it verifies loosely.
     */
    describe('should be falsy', () => {
      describe('when the timestamp is not a run of digits', () => {
        /** @type {Array<{ input: { timestampHeaderValue: *, rawBody: string } }>} */
        const cases = /** @type {Array<*>} */ ([
          {
            input: {
              timestampHeaderValue: '1790140897.{"rate":"1', // the left side of a re-split payload
              rawBody: '5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: '1790140897 ', // a trailing space
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: ' 1790140897', // a leading space
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: '+1790140897', // a leading sign
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: '-1790140897',
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: '1790140897.0', // fractional seconds
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: '', // a header declared with no value
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: 'the-time-it-is', // not a number at all
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: undefined, // a header nobody sent
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: null,
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: 1790140897, // the seconds as a number, not as the text signed
              rawBody: '{"rate":"1.5"}',
            },
          },
          {
            input: {
              timestampHeaderValue: [ // what a header sent twice arrives as
                '1790140897',
                '1790140898',
              ],
              rawBody: '{"rate":"1.5"}',
            },
          },
        ])

        test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: 'secret-0021',
          })

          const received = verifier.hasSignatureMaterial(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#hasSignatureMaterial()', () => {
    describe('should be falsy', () => {
      describe('when the raw body is not a string', () => {
        /** @type {Array<{ input: { timestampHeaderValue: string, rawBody: * } }>} */
        const cases = /** @type {Array<*>} */ ([
          {
            input: {
              timestampHeaderValue: '1790140897',
              rawBody: undefined, // a request the engine parsed no body for
            },
          },
          {
            input: {
              timestampHeaderValue: '1790140897',
              rawBody: null,
            },
          },
          {
            input: {
              timestampHeaderValue: '1790140897',
              rawBody: 100004,
            },
          },
          {
            input: {
              timestampHeaderValue: '1790140897',
              rawBody: { // the parsed body, in place of the raw one
                rate: '1.5',
              },
            },
          },
          {
            input: {
              timestampHeaderValue: '1790140897',
              rawBody: Buffer.from('{"rate":"1.5"}'), // the bytes, before the engine made text of them
            },
          },
          {
            input: {
              timestampHeaderValue: '1790140897',
              rawBody: [
                '{"rate":"1.5"}',
              ],
            },
          },
        ])

        test.each(cases)('rawBody: $input.rawBody', ({
          input,
        }) => {
          const verifier = ApiClientSignatureVerifier.create({
            currentSecret: 'secret-0022',
          })

          const received = verifier.hasSignatureMaterial(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isWellFormedSignature()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
          },
        },
        {
          input: {
            // the same digest written in upper case
            signatureHeaderValue: '40896DD50804A301DA9F021EC0227D93A7D1EF001A7405C2091DE1E4F37664E9',
          },
        },
        {
          input: {
            // the same digest written in mixed case
            signatureHeaderValue: '40896dd50804A301da9f021EC0227d93a7d1ef001A7405c2091de1e4F37664e9',
          },
        },
        {
          input: {
            signatureHeaderValue: '0000000000000000000000000000000000000000000000000000000000000000',
          },
        },
      ]

      test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
        input,
      }) => {
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: 'secret-0023',
        })

        const received = verifier.isWellFormedSignature(input)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#isWellFormedSignature()', () => {
    describe('should be falsy', () => {
      /** @type {Array<{ input: { signatureHeaderValue: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            // one character short of a SHA-256 digest
            signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e',
          },
        },
        {
          input: {
            // one character past a SHA-256 digest
            signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e99',
          },
        },
        {
          input: {
            // the right length, but the last character is not hex
            signatureHeaderValue: '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664eg',
          },
        },
        {
          input: {
            // the right length, but a space sits in the middle
            signatureHeaderValue: '40896dd50804a301da9f021ec0227d93 a7d1ef001a7405c2091de1e4f37664e',
          },
        },
        {
          input: {
            signatureHeaderValue: '', // a header declared with no value
          },
        },
        {
          input: {
            signatureHeaderValue: undefined, // a header nobody sent
          },
        },
        {
          input: {
            signatureHeaderValue: null,
          },
        },
        {
          input: {
            signatureHeaderValue: 100005,
          },
        },
        {
          input: {
            signatureHeaderValue: [ // what a header sent twice arrives as
              '40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9',
              'da39baf185cd6bad3e353fbfe01387d399158628932dd0fbe1ba1940ed671a92',
            ],
          },
        },
      ])

      test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
        input,
      }) => {
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: 'secret-0024',
        })

        const received = verifier.isWellFormedSignature(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#generateSignedPayload()', () => {
    /*
     * The timestamp is joined to the body by a single `.`, and the body is taken as it is — a body
     * that itself carries `.` is not escaped, which is the whole reason the timestamp's shape is
     * checked before this is built.
     */
    describe('should join the timestamp to the body', () => {
      const cases = [
        {
          input: {
            timestampHeaderValue: '1790140897',
            rawBody: '{"rate":"1.5"}',
          },
          expected: '1790140897.{"rate":"1.5"}',
        },
        {
          input: {
            timestampHeaderValue: '1790140898',
            rawBody: '{"amount":"2.50"}',
          },
          expected: '1790140898.{"amount":"2.50"}',
        },
        {
          input: {
            timestampHeaderValue: '1790140899',
            rawBody: '', // an empty body still leaves the delimiter standing
          },
          expected: '1790140899.',
        },
        {
          input: {
            timestampHeaderValue: '1790140900',
            rawBody: '.', // a body that is nothing but the delimiter
          },
          expected: '1790140900..',
        },
      ]

      test.each(cases)('rawBody: $input.rawBody', ({
        input,
        expected,
      }) => {
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: 'secret-0025',
        })

        const received = verifier.generateSignedPayload(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#buildSignatureBuffer()', () => {
    describe('should read the hex as bytes', () => {
      const cases = [
        {
          input: {
            signatureHeaderValue: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          },
          expected: Buffer.from([
            0x01,
            0x23,
            0x45,
            0x67,
            0x89,
            0xAB,
            0xCD,
            0xEF,
            0x01,
            0x23,
            0x45,
            0x67,
            0x89,
            0xAB,
            0xCD,
            0xEF,
            0x01,
            0x23,
            0x45,
            0x67,
            0x89,
            0xAB,
            0xCD,
            0xEF,
            0x01,
            0x23,
            0x45,
            0x67,
            0x89,
            0xAB,
            0xCD,
            0xEF,
          ]),
        },
        {
          input: {
            // the same bytes written in upper case
            signatureHeaderValue: 'FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210',
          },
          expected: Buffer.from([
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
          ]),
        },
      ]

      test.each(cases)('signatureHeaderValue: $input.signatureHeaderValue', ({
        input,
        expected,
      }) => {
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: 'secret-0026',
        })

        const received = verifier.buildSignatureBuffer(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#buildExpectedSignatureBuffer()', () => {
    /*
     * The digest is taken under the secret the argument names, not under the instance's own — the
     * instance below holds a secret that appears in none of the expectations.
     *
     * Each expectation is the offline HMAC-SHA256 of the payload, rendered from its hex.
     */
    describe('should digest the payload under the given secret', () => {
      const cases = [
        {
          input: {
            secret: env.DEVELOPMENT_API_CLIENT_SECRET,
          },
          signedPayloadCases: [
            {
              signedPayload: '1790140897.{"rate":"1.5"}',
              expected: Buffer.from('40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9', 'hex'),
            },
            {
              signedPayload: '1790140898.{"amount":"2.50"}',
              expected: Buffer.from('da39baf185cd6bad3e353fbfe01387d399158628932dd0fbe1ba1940ed671a92', 'hex'),
            },
            {
              signedPayload: '1790140897.',
              expected: Buffer.from('c70bd742ba3c6c78aab256b84f52a722d22eb1748e5dd4abd18aa1e0e43fc2a9', 'hex'),
            },
          ],
        },
        {
          input: {
            secret: env.DEVELOPMENT_ROTATING_API_CLIENT_SECRET,
          },
          signedPayloadCases: [
            {
              signedPayload: '1790140897.{"rate":"1.5"}',
              expected: Buffer.from('53bd1a5c53f2743a3ea6a7589636c6c34d495876e7ba4d3767ad9d6e37638c6d', 'hex'),
            },
            {
              signedPayload: '1790140898.{"amount":"2.50"}',
              expected: Buffer.from('517612896db366e0ae2b18600aba48ae3a808818eb4a2ebb0c1c2948d94c3be1', 'hex'),
            },
            {
              signedPayload: '1790140897.',
              expected: Buffer.from('014d349f086fa746bd3a888b5b9cfe1fce152e5138dc31d85bae1d7e80ecbce3', 'hex'),
            },
          ],
        },
      ]

      describe.each(cases)('secret: $input.secret', ({
        input,
        signedPayloadCases,
      }) => {
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: 'secret-0027',
        })

        test.each(signedPayloadCases)('signedPayload: $signedPayload', ({
          signedPayload,
          expected,
        }) => {
          const args = {
            secret: input.secret,
            signedPayload,
          }

          const received = verifier.buildExpectedSignatureBuffer(args)

          expect(received)
            .toEqual(expected)
        })
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#matchesSignatureBuffer()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            expectedBuffer: Buffer.from([
              0x01,
              0x23,
            ]),
            actualBuffer: Buffer.from([
              0x01,
              0x23,
            ]),
          },
        },
        {
          input: {
            expectedBuffer: Buffer.from([
              0x45,
              0x67,
              0x89,
              0xAB,
            ]),
            actualBuffer: Buffer.from([
              0x45,
              0x67,
              0x89,
              0xAB,
            ]),
          },
        },
        {
          input: {
            // two digests of the length a SHA-256 signature really has
            expectedBuffer: Buffer.from('40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9', 'hex'),
            actualBuffer: Buffer.from('40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9', 'hex'),
          },
        },
      ]

      test.each(cases)('expectedBuffer.length: $input.expectedBuffer.length', ({
        input,
      }) => {
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: 'secret-0028',
        })

        const received = verifier.matchesSignatureBuffer(input)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('ApiClientSignatureVerifier', () => {
  describe('#matchesSignatureBuffer()', () => {
    /*
     * `crypto.timingSafeEqual()` raises a RangeError when the two buffers differ in length, so the
     * differing-length cases below are answers rather than errors — which is what lets a truncated
     * signature be refused the way a wrong one is.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            // same length, one byte apart
            expectedBuffer: Buffer.from([
              0x01,
              0x23,
            ]),
            actualBuffer: Buffer.from([
              0x01,
              0x24,
            ]),
          },
        },
        {
          input: {
            // the presented buffer is one byte short
            expectedBuffer: Buffer.from([
              0x45,
              0x67,
              0x89,
              0xAB,
            ]),
            actualBuffer: Buffer.from([
              0x45,
              0x67,
              0x89,
            ]),
          },
        },
        {
          input: {
            // the presented buffer is empty
            expectedBuffer: Buffer.from('40896dd50804a301da9f021ec0227d93a7d1ef001a7405c2091de1e4f37664e9', 'hex'),
            actualBuffer: Buffer.from([]),
          },
        },
        {
          input: {
            // nothing was expected, and something was presented
            expectedBuffer: Buffer.from([]),
            actualBuffer: Buffer.from([
              0xCD,
              0xEF,
              0x01,
              0x23,
              0x45,
            ]),
          },
        },
      ]

      test.each(cases)('expectedBuffer.length: $input.expectedBuffer.length', ({
        input,
      }) => {
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: 'secret-0029',
        })

        const received = verifier.matchesSignatureBuffer(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})
