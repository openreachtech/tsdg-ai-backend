import AppRestfulApiServerEngine from '../../../../server/restfulapi/AppRestfulApiServerEngine.js'

import {
  BaseRestfulApiServerEngine,
} from '@openreachtech/renchan'

import AppRestfulApiShare from '../../../../server/restfulapi/contexts/AppRestfulApiShare.js'
import AppRestfulApiContext from '../../../../server/restfulapi/contexts/AppRestfulApiContext.js'

import ApiClientAuthenticationLogger from '../../../../app/apiClient/ApiClientAuthenticationLogger.js'

import rootPath from '../../../../app/globals/root-path.js'

describe('AppRestfulApiServerEngine', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AppRestfulApiServerEngine.prototype

      expect(received)
        .toBeInstanceOf(BaseRestfulApiServerEngine)
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('.get:config', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {
          pathPrefix: '/v1',
          renderersPath: rootPath.to('server/restfulapi/renderers/v1/'),
          staticPath: rootPath.to('public/'),
        }

        const received = AppRestfulApiServerEngine.config

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('.get:Share', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AppRestfulApiServerEngine.Share

        expect(received)
          .toBe(AppRestfulApiShare) // same reference
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('.get:Context', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AppRestfulApiServerEngine.Context

        expect(received)
          .toBe(AppRestfulApiContext) // same reference
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('.get:standardErrorEnvelopHash', () => {
    describe('when called as is', () => {
      /*
       * Every status the client-API contract's refusal table names, plus the three the framework
       * requires for its own cross-cutting failures.
       */
      test('should be fixed value', () => {
        const expected = {
          Unknown: {
            statusCode: 500,
            errorMessage: 'Unknown error',
          },
          ConcreteMemberNotFound: {
            statusCode: 500,
            errorMessage: 'Unknown error',
          },
          Unauthenticated: {
            statusCode: 401,
            errorMessage: 'Unauthenticated',
          },
          Unauthorized: {
            statusCode: 403,
            errorMessage: 'Unauthorized',
          },
          Database: {
            statusCode: 500,
            errorMessage: 'Database error',
          },
        }

        const received = AppRestfulApiServerEngine.standardErrorEnvelopHash

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#isActiveApiClient()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100001,
              clientKey: 'client-key-0001',
              isActive: true,
            }),
          },
        },
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100002,
              clientKey: 'client-key-0002',
              isActive: 1, // the value a dialect without a boolean type answers with
            }),
          },
        },
      ]

      test.each(cases)('userEntity: $input.userEntity', ({
        input,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })

        const received = engine.isActiveApiClient(input)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#isActiveApiClient()', () => {
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100003,
              clientKey: 'client-key-0003',
              isActive: false,
            }),
          },
        },
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100004,
              clientKey: 'client-key-0004',
              isActive: 0, // the value a dialect without a boolean type answers with
            }),
          },
        },
        {
          input: {
            userEntity: null, // no client was resolved at all
          },
        },
      ]

      test.each(cases)('userEntity: $input.userEntity', ({
        input,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })

        const received = engine.isActiveApiClient(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#get:visaIssuers', () => {
    describe('should answer hasAuthenticated() truthy for a resolved client', () => {
      const cases = [
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100001,
              clientKey: 'client-key-0001',
              isActive: true,
            }),
          },
        },
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100003,
              clientKey: 'client-key-0003',
              isActive: false, // a switched off client is still who it claims to be
            }),
          },
        },
      ]

      test.each(cases)('userEntity: $input.userEntity', async ({
        input,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const issuers = engine.visaIssuers
        const args = {
          expressRequest: /** @type {*} */ ({}),
          userEntity: input.userEntity,
          engine,
        }

        const received = await issuers.hasAuthenticated(args)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#get:visaIssuers', () => {
    describe('should answer hasAuthenticated() falsy when no client was resolved', () => {
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

      test.each(cases)('headers: $input.expressRequest.headers', async ({
        input,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const issuers = engine.visaIssuers
        const args = {
          expressRequest: input.expressRequest,
          userEntity: null,
          engine,
        }

        const received = await issuers.hasAuthenticated(args)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#get:visaIssuers', () => {
    describe('should answer hasAuthorized() truthy for a client whose record is switched on', () => {
      const cases = [
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100001,
              clientKey: 'client-key-0001',
              isActive: true,
            }),
          },
        },
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100002,
              clientKey: 'client-key-0002',
              isActive: true,
            }),
          },
        },
      ]

      test.each(cases)('userEntity: $input.userEntity', async ({
        input,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const issuers = engine.visaIssuers
        const args = {
          expressRequest: /** @type {*} */ ({}),
          userEntity: input.userEntity,
          engine,
        }

        const received = await issuers.hasAuthorized(args)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#get:visaIssuers', () => {
    describe('should answer hasAuthorized() falsy for a client whose record is switched off', () => {
      const cases = [
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100003,
              clientKey: 'client-key-0003',
              isActive: false,
            }),
          },
        },
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100004,
              clientKey: 'client-key-0004',
              isActive: false,
            }),
          },
        },
      ]

      test.each(cases)('userEntity: $input.userEntity', async ({
        input,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const issuers = engine.visaIssuers
        const args = {
          expressRequest: /** @type {*} */ ({}),
          userEntity: input.userEntity,
          engine,
        }

        const received = await issuers.hasAuthorized(args)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#get:visaIssuers', () => {
    describe('should answer hasPathPermission() truthy, no path being reserved this version', () => {
      const cases = [
        {
          input: {
            userEntity: /** @type {*} */ ({
              id: 100001,
              clientKey: 'client-key-0001',
              isActive: true,
            }),
          },
        },
        {
          input: {
            userEntity: null,
          },
        },
      ]

      test.each(cases)('userEntity: $input.userEntity', async ({
        input,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const issuers = engine.visaIssuers
        const args = {
          expressRequest: /** @type {*} */ ({}),
          userEntity: input.userEntity,
          engine,
        }

        const received = await issuers.hasPathPermission(args)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    /*
     * The visa the context carries is what the handler reads, so each case states the three
     * answers the issuers gave and nothing else about the request.
     */
    describe('should answer the 401 envelope when the caller is not who it claims', () => {
      const cases = [
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: false,
              hasAuthorized: false,
              hasPathPermission: false,
            }),
          },
          expected: 401,
        },
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: false,
              hasAuthorized: true,
              hasPathPermission: true,
            }),
          },
          expected: 401,
        },
      ]

      test.each(cases)('visa: $input.visa', async ({
        input,
        expected,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const context = new AppRestfulApiContext({
          expressRequest: /** @type {*} */ ({}),
          engine,
          userEntity: null,
          visa: input.visa,
          requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          uuid: '98765432-abcd-0000-1234-000000000001',
        })
        const handler = engine.generateFilterHandler()
        const args = {
          body: null,
          query: null,
          context,
          request: /** @type {*} */ (null),
        }

        const received = await handler(args)

        expect(received)
          .toHaveProperty('statusCode', expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    describe('should answer the 403 envelope when the caller is who it claims and may not', () => {
      const cases = [
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: true,
              hasAuthorized: false,
              hasPathPermission: true,
            }),
          },
          expected: 403,
        },
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: true,
              hasAuthorized: false,
              hasPathPermission: false,
            }),
          },
          expected: 403,
        },
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: true,
              hasAuthorized: true,
              hasPathPermission: false,
            }),
          },
          expected: 403,
        },
      ]

      test.each(cases)('visa: $input.visa', async ({
        input,
        expected,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const context = new AppRestfulApiContext({
          expressRequest: /** @type {*} */ ({}),
          engine,
          userEntity: /** @type {*} */ ({
            id: 100003,
            clientKey: 'client-key-0003',
            isActive: false,
          }),
          visa: input.visa,
          requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          uuid: '98765432-abcd-0000-1234-000000000002',
        })
        const handler = engine.generateFilterHandler()
        const args = {
          body: null,
          query: null,
          context,
          request: /** @type {*} */ (null),
        }

        const received = await handler(args)

        expect(received)
          .toHaveProperty('statusCode', expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    describe('should answer null when the caller may render', () => {
      /*
       * One case only: every visa answering true is the single combination that refuses nothing.
       */
      const cases = [
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: true,
              hasAuthorized: true,
              hasPathPermission: true,
            }),
          },
        },
      ]

      test.each(cases)('visa: $input.visa', async ({
        input,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const context = new AppRestfulApiContext({
          expressRequest: /** @type {*} */ ({}),
          engine,
          userEntity: /** @type {*} */ ({
            id: 100001,
            clientKey: 'client-key-0001',
            isActive: true,
          }),
          visa: input.visa,
          requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          uuid: '98765432-abcd-0000-1234-000000000003',
        })
        const handler = engine.generateFilterHandler()
        const args = {
          body: null,
          query: null,
          context,
          request: /** @type {*} */ (null),
        }

        const received = await handler(args)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#collectMiddleware()', () => {
    describe('should answer the four middleware the request path needs', () => {
      const cases = [
        {
          input: {
            share: /** @type {*} */ (null),
          },
          expected: 4,
        },
        {
          input: {
            share: /** @type {*} */ ({
              env: {},
            }),
          },
          expected: 4,
        },
      ]

      test.each(cases)('share: $input.share', ({
        input,
        expected,
      }) => {
        const engine = AppRestfulApiServerEngine.create(input)

        const received = engine.collectMiddleware()

        expect(received)
          .toHaveLength(expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#defineKeepRawBodyCallback()', () => {
    describe('should keep the body bytes a signature is computed over', () => {
      const cases = [
        {
          input: {
            rawBodyText: '{"externalRef":"external-ref-0001"}',
          },
          expected: '{"externalRef":"external-ref-0001"}',
        },
        {
          input: {
            rawBodyText: '{"externalRef":"external-ref-0002"}',
          },
          expected: '{"externalRef":"external-ref-0002"}',
        },
        {
          input: {
            rawBodyText: '', // an empty body is signable, so it is kept as an empty string
          },
          expected: '',
        },
      ]

      test.each(cases)('rawBodyText: $input.rawBodyText', ({
        input,
        expected,
      }) => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const keepRawBody = engine.defineKeepRawBodyCallback()
        const expressRequest = /** @type {*} */ ({})
        const buffer = Buffer.from(input.rawBodyText)

        keepRawBody(expressRequest, null, buffer, 'utf8')
        const received = expressRequest['rawBody']

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('.get:ApiClientAuthenticationLoggerCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AppRestfulApiServerEngine.ApiClientAuthenticationLoggerCtor

        expect(received)
          .toBe(ApiClientAuthenticationLogger) // same reference
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#createApiClientAuthenticationLogger()', () => {
    describe('when called as is', () => {
      test('should be an instance of ApiClientAuthenticationLogger', () => {
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })

        const received = engine.createApiClientAuthenticationLogger()

        expect(received)
          .toBeInstanceOf(ApiClientAuthenticationLogger)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#logRefusedAuthentication()', () => {
    describe('should name the switched-off client and the reason it was refused', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000003,
          },
          expected: {
            reasonCode: 'INACTIVE_CLIENT',
            apiClientId: 10000003,
          },
        },
        {
          input: {
            apiClientId: 10000004,
          },
          expected: {
            reasonCode: 'INACTIVE_CLIENT',
            apiClientId: 10000004,
          },
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', ({
        input,
        expected,
      }) => {
        const logSpy = jest.spyOn(
          ApiClientAuthenticationLogger.prototype,
          'logRefusedAuthentication'
        )
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const args = {
          context: /** @type {*} */ ({
            apiClientId: input.apiClientId,
          }),
        }

        engine.logRefusedAuthentication(args)

        expect(logSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    /*
     * The `403` is the one refusal the engine decides on its own — it is the only one a client
     * that signed correctly can meet — so it is the one the engine logs. The `401`s are written
     * by `AppRestfulApiContext.findUser()`, which knows which of its four checks refused.
     */
    describe('should log the refusal when the caller is who it claims and may not', () => {
      const cases = [
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: true,
              hasAuthorized: false,
              hasPathPermission: true,
            }),
            userId: 10000003,
          },
          expected: {
            reasonCode: 'INACTIVE_CLIENT',
            apiClientId: 10000003,
          },
        },
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: true,
              hasAuthorized: false,
              hasPathPermission: false,
            }),
            userId: 10000005,
          },
          expected: {
            reasonCode: 'INACTIVE_CLIENT',
            apiClientId: 10000005,
          },
        },
      ]

      test.each(cases)('userId: $input.userId', async ({
        input,
        expected,
      }) => {
        const logSpy = jest.spyOn(
          ApiClientAuthenticationLogger.prototype,
          'logRefusedAuthentication'
        )
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const context = new AppRestfulApiContext({
          expressRequest: /** @type {*} */ ({}),
          engine,
          userEntity: /** @type {*} */ ({
            id: input.userId,
          }),
          visa: input.visa,
          requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          uuid: '98765432-abcd-0000-1234-000000000002',
        })
        const handler = engine.generateFilterHandler()
        const args = {
          body: null,
          query: null,
          context,
          request: /** @type {*} */ (null),
        }

        await handler(args)

        expect(logSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    describe('should log nothing when the caller is who it claims and may', () => {
      const cases = [
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: true,
              hasAuthorized: true,
              hasPathPermission: true,
            }),
            userId: 10000001,
          },
        },
        {
          input: {
            visa: /** @type {*} */ ({
              hasAuthenticated: true,
              hasAuthorized: true,
              hasPathPermission: true,
            }),
            userId: 10000002,
          },
        },
      ]

      test.each(cases)('userId: $input.userId', async ({
        input,
      }) => {
        const logSpy = jest.spyOn(
          ApiClientAuthenticationLogger.prototype,
          'logRefusedAuthentication'
        )
        const engine = AppRestfulApiServerEngine.create({
          share: /** @type {*} */ (null),
        })
        const context = new AppRestfulApiContext({
          expressRequest: /** @type {*} */ ({}),
          engine,
          userEntity: /** @type {*} */ ({
            id: input.userId,
          }),
          visa: input.visa,
          requestedAt: new Date('2026-09-23T10:00:00.000Z'),
          uuid: '98765432-abcd-0000-1234-000000000003',
        })
        const handler = engine.generateFilterHandler()
        const args = {
          body: null,
          query: null,
          context,
          request: /** @type {*} */ (null),
        }

        await handler(args)

        expect(logSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
