import ApiClientAuthenticationLogger from '../../../../app/apiClient/ApiClientAuthenticationLogger.js'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

describe('ApiClientAuthenticationLogger', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#logger', () => {
        /** @type {Array<{ tally: * }>} */
        const cases = /** @type {Array<*>} */ ([
          {
            tally: 'logger-0001', // stands in for a logger; the constructor only holds what it is handed
          },
          {
            tally: 'logger-0002',
          },
        ])

        test.each(cases)('logger: $tally', ({
          tally,
        }) => {
          const instance = new ApiClientAuthenticationLogger({
            logger: tally,
          })

          expect(instance)
            .toHaveProperty('logger', tally)
        })
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      /** @type {Array<{ input: { logger: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            logger: 'logger-0003',
          },
        },
        {
          input: {
            logger: 'logger-0004',
          },
        },
      ])

      test.each(cases)('logger: $input.logger', ({
        input,
      }) => {
        const received = ApiClientAuthenticationLogger.create(input)

        expect(received)
          .toBeInstanceOf(ApiClientAuthenticationLogger)
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      /** @type {Array<{ tally: { logger: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          tally: {
            logger: 'logger-0005',
          },
        },
        {
          tally: {
            logger: 'logger-0006',
          },
        },
      ])

      test.each(cases)('logger: $tally.logger', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(ApiClientAuthenticationLogger)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('.create()', () => {
    describe('should fill default logger', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(ApiClientAuthenticationLogger)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith({
            logger: ApiClientAuthenticationLogger.mentsuLogger,
          })
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('.get:mentsuLogger', () => {
    describe('when called as is', () => {
      test('should be a MentsuLogger', () => {
        const received = ApiClientAuthenticationLogger.mentsuLogger

        expect(received)
          .toBeInstanceOf(MentsuLogger)
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('.get:mentsuLogger', () => {
    describe('should be memoized', () => {
      test('should be the same client every time', () => {
        const firstRead = ApiClientAuthenticationLogger.mentsuLogger

        const received = ApiClientAuthenticationLogger.mentsuLogger

        expect(received)
          .toBe(firstRead) // same reference
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('#buildRefusalTags()', () => {
    describe('should name the reason and the client, and nothing else', () => {
      const cases = [
        {
          input: {
            reasonCode: 'UNKNOWN_CLIENT_KEY',
            apiClientId: null, // no client was resolved, so there is no id to name
          },
          expected: [
            'ApiClientAuthentication',
            'reasonCode:UNKNOWN_CLIENT_KEY',
            'apiClientId:null',
          ],
        },
        {
          input: {
            reasonCode: 'SIGNATURE_MISMATCH',
            apiClientId: 10000001,
          },
          expected: [
            'ApiClientAuthentication',
            'reasonCode:SIGNATURE_MISMATCH',
            'apiClientId:10000001',
          ],
        },
        {
          input: {
            reasonCode: 'INACTIVE_CLIENT',
            apiClientId: 10000003,
          },
          expected: [
            'ApiClientAuthentication',
            'reasonCode:INACTIVE_CLIENT',
            'apiClientId:10000003',
          ],
        },
      ]

      test.each(cases)('reasonCode: $input.reasonCode', ({
        input,
        expected,
      }) => {
        const logger = ApiClientAuthenticationLogger.create()

        const received = logger.buildRefusalTags(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('#logRefusedAuthentication()', () => {
    /*
     * The whole line is pinned, because what a refusal may never carry is as much the contract as
     * what it does: no client secret in either its live or its rotating form, no signature, no
     * request body. A `toEqual` of the arguments is what would fail if one were added.
     */
    describe('should write one line naming the reason and the client', () => {
      const cases = [
        {
          input: {
            reasonCode: 'UNKNOWN_CLIENT_KEY',
            apiClientId: null,
          },
          expected: {
            message: 'API client authentication refused',
            tags: [
              'ApiClientAuthentication',
              'reasonCode:UNKNOWN_CLIENT_KEY',
              'apiClientId:null',
            ],
          },
        },
        {
          input: {
            reasonCode: 'STALE_TIMESTAMP',
            apiClientId: 10000002,
          },
          expected: {
            message: 'API client authentication refused',
            tags: [
              'ApiClientAuthentication',
              'reasonCode:STALE_TIMESTAMP',
              'apiClientId:10000002',
            ],
          },
        },
      ]

      test.each(cases)('reasonCode: $input.reasonCode', ({
        input,
        expected,
      }) => {
        const warnSpy = jest.spyOn(ApiClientAuthenticationLogger.mentsuLogger, 'warn')
        const logger = ApiClientAuthenticationLogger.create()

        logger.logRefusedAuthentication(input)

        expect(warnSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('#buildUnusableEncryptionKeyTags()', () => {
    /*
     * The tags are the same whichever logger holds them — which is the point of driving the one
     * property the instance has: a line found by these two tags does not vary with where it was
     * written.
     */
    describe('should name the area and the event, and nothing else', () => {
      /** @type {Array<{ factoryParams: { logger: * }, expected: Array<string> }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          factoryParams: {
            logger: 'logger-0007', // stands in for a logger; the tags do not read it
          },
          expected: [
            'ApiClientAuthentication',
            'UnusableEncryptionKey',
          ],
        },
        {
          factoryParams: {
            logger: 'logger-0008',
          },
          expected: [
            'ApiClientAuthentication',
            'UnusableEncryptionKey',
          ],
        },
      ])

      test.each(cases)('logger: $factoryParams.logger', ({
        factoryParams,
        expected,
      }) => {
        const logger = ApiClientAuthenticationLogger.create(factoryParams)

        const received = logger.buildUnusableEncryptionKeyTags()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientAuthenticationLogger', () => {
  describe('#logUnusableEncryptionKey()', () => {
    /*
     * The whole call is pinned, because what this line may never carry is as much the contract as
     * what it does: the message names `API_CLIENT_SECRET_ENCRYPTION_KEY` and never what the
     * variable holds, in either its live or its rotating form. The method takes no argument at
     * all, so there is nothing a caller could hand it that could reach the line — a `toEqual` of
     * the arguments is what would fail if either property were given up.
     */
    describe('should write one line naming the environment variable', () => {
      /** @type {Array<{ label: string, factoryParams: { logger: * }, expected: * }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          label: 'a logger standing in for the one this process writes through',
          factoryParams: {
            logger: {
              error: jest.fn(),
            },
          },
          expected: {
            message: 'API client secret encryption key is unusable: API_CLIENT_SECRET_ENCRYPTION_KEY does not hold the 64 hex characters AES-256 takes, so every client is being refused',
            tags: [
              'ApiClientAuthentication',
              'UnusableEncryptionKey',
            ],
          },
        },
        {
          label: 'a second logger, to show the line is not the first one remembering',
          factoryParams: {
            logger: {
              error: jest.fn(),
            },
          },
          expected: {
            message: 'API client secret encryption key is unusable: API_CLIENT_SECRET_ENCRYPTION_KEY does not hold the 64 hex characters AES-256 takes, so every client is being refused',
            tags: [
              'ApiClientAuthentication',
              'UnusableEncryptionKey',
            ],
          },
        },
      ])

      test.each(cases)('label: $label', ({
        factoryParams,
        expected,
      }) => {
        const logger = ApiClientAuthenticationLogger.create(factoryParams)

        logger.logUnusableEncryptionKey()

        expect(factoryParams.logger.error)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
