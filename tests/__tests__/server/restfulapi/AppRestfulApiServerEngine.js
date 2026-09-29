import {
  createHmac,
} from 'node:crypto'

import AppRestfulApiServerEngine from '../../../../server/restfulapi/AppRestfulApiServerEngine.js'

import {
  BaseRestfulApiServerEngine,
  RestfulApiServerBuilder,
} from '@openreachtech/renchan'

import {
  env,
} from '../../../../app/globals/_.js'

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

/*
 * The two read-back operations, driven over real HTTP against a real server this test builds.
 *
 * **Every other test in this repository reaches a renderer, a context or a verifier directly.**
 * That is why a request sent the way clients send a `GET` was refused by this service for the whole
 * of 1.0.0 without one test failing: the signature verifier wants the request's raw bytes, the body
 * parser only sets them when it parses a body, and nothing exercised the two together. The unit
 * tests beside this one pin what `.extractRawBody()` answers for a request object somebody wrote;
 * only a socket says what Express hands it for a request nobody wrote.
 *
 * So these drive `fetch` with no body at all - the one shape the Fetch specification allows for a
 * `GET`, and therefore the only shape a browser or Fetch client can ever send.
 */

/**
 * Build the service on a port the operating system picks, drive one request at it, and take the
 * server down again.
 *
 * @param {{
 *   path: string
 *   headers: Record<string, string>
 * }} params - Parameters.
 * @returns {Promise<{
 *   status: number
 *   body: string
 * }>} What the service answered.
 */
async function requestOverHttp ({
  path,
  headers,
}) {
  const builder = await RestfulApiServerBuilder.createAsync({
    Engine: AppRestfulApiServerEngine,
  })

  const server = builder.buildHttpServer()

  /*
   * The listening callback is awaited as an event, not passed to `listen()`.
   * `RestfulApiServerBuilder#buildListenProxyServer()` appends a callback of its own after
   * whatever it was handed, so a callback passed here lands in `http.Server#listen()`'s
   * `backlog` position and is never called - which hangs the await rather than failing it.
   */
  const listening = new Promise(resolve => {
    server.once('listening', resolve)
  })

  server.listen(0, '127.0.0.1')

  await listening

  const { port } = /** @type {*} */ (server.address())

  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'GET',
    headers,
  })

  const body = await response.text()

  await new Promise(resolve => {
    server.close(resolve)
  })

  return {
    status: response.status,
    body,
  }
}

/**
 * Sign a request that carries no body, the way a client library does.
 *
 * @param {{
 *   clientKey: string
 *   secret: string
 * }} params - Parameters.
 * @returns {Record<string, string>} The three signed-request headers.
 */
function buildSignedHeaders ({
  clientKey,
  secret,
}) {
  const timestamp = String(Math.floor(Date.now() / 1000))

  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .digest('hex')

  return {
    'x-ort-client-id': clientKey,
    'x-ort-timestamp': timestamp,
    'x-ort-signature': signature,
  }
}

describe('AppRestfulApiServerEngine', () => {
  describe('over HTTP, a signed request carrying no body', () => {
    describe('should be authenticated on every read-back route', () => {
      const cases = [
        {
          input: {
            path: '/v1/ai-runs/run-key-10010001',
          },
        },
        {
          input: {
            path: '/v1/ai-runs',
          },
        },
      ]

      test.each(cases)('path: $input.path', async ({
        input,
      }) => {
        const expected = 200

        const received = await requestOverHttp({
          path: input.path,
          headers: buildSignedHeaders({
            clientKey: 'client-key-signing-10000001',
            secret: env.DEVELOPMENT_API_CLIENT_SECRET,
          }),
        })

        expect(received.status)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('over HTTP, a request carrying no body and no signature', () => {
    /*
     * The other half, and the reason the describe above proves anything: without it, a route that
     * authenticated nobody would pass it just as well.
     */
    describe('should be refused on every read-back route', () => {
      const cases = [
        {
          input: {
            path: '/v1/ai-runs/run-key-10010001',
          },
        },
        {
          input: {
            path: '/v1/ai-runs',
          },
        },
      ]

      test.each(cases)('path: $input.path', async ({
        input,
      }) => {
        const expected = 401

        const received = await requestOverHttp({
          path: input.path,
          headers: {
            'x-ort-client-id': 'client-key-signing-10000001',
          },
        })

        expect(received.status)
          .toBe(expected)
      })
    })
  })
})

describe('AppRestfulApiServerEngine', () => {
  describe('over HTTP, a signed request for another client\'s run', () => {
    /*
     * `run-key-10010003` belongs to a different seeded client. Section 16 says such a run answers
     * as though it did not exist, so this is 404 rather than 403 - and this route now being
     * reachable at all is what makes that assertion possible for the first time.
     */
    describe('should answer as though the run did not exist', () => {
      const cases = [
        {
          input: {
            path: '/v1/ai-runs/run-key-10010003',
          },
        },
        {
          input: {
            path: '/v1/ai-runs/run-key-there-is-no-such-run',
          },
        },
      ]

      test.each(cases)('path: $input.path', async ({
        input,
      }) => {
        const expected = 404

        const received = await requestOverHttp({
          path: input.path,
          headers: buildSignedHeaders({
            clientKey: 'client-key-signing-10000001',
            secret: env.DEVELOPMENT_API_CLIENT_SECRET,
          }),
        })

        expect(received.status)
          .toBe(expected)
      })
    })
  })
})
