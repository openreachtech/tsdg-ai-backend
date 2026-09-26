import http from 'node:http'
import timersPromises from 'node:timers/promises'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunCallbackSender from '../../../../app/aiRunCallback/AiRunCallbackSender.js'
import AiRunCallbackUrlInspector from '../../../../app/aiRunCallback/AiRunCallbackUrlInspector.js'

/*
 * The outbound half of the first acceptance criterion of section 12: every run reaching succeeded,
 * failed or canceled produces one terminal callback to the client's registered callback URL.
 *
 * The network is mocked in most of this file, and it is mocked in the success cases as well as the
 * failing ones: a test suite that posted to somebody's server would be a test suite that posts to
 * somebody's server. It is reached through `.get:fetchClient`, so substituting it is overriding
 * one member rather than mocking a module.
 *
 * The URLs of those describes are the development clients' registered prefixes, under the reserved
 * `.invalid` domain — so a request escaping the mock reaches nothing.
 *
 * **Six describes use a real network instead, over loopback, and say so where they sit.** A
 * stubbed `fetch` follows nothing, so it could not have shown the thing those six are about: left
 * to itself `fetch` follows up to twenty hops, re-posting this body and its signature to every one
 * of them, and answers with the last. Nor has a stubbed `fetch` a socket, which is the only thing
 * the two release describes can observe. Measured against the options shape this file was written
 * for — the four keys with no `redirect` among them — a `307` naming a second loopback server had
 * the whole body and a valid `x-ort-signature` delivered there, and the `200` that server answered
 * recorded as the attempt's status.
 *
 * **The two release describes hold on to the `Response` they were handed, and that is not
 * tidiness.** Undici releases a connection on the cancel this class makes, and also, separately,
 * when the unread `Response` is finalized — which is garbage collection, and lands wherever it
 * lands. Each therefore wraps `fetchClient` around the real `globalThis.fetch` — a pass-through,
 * so the socket, the body and the headers all stay real — purely to keep a reference to every
 * `Response` alive for the length of the test. What is left to release the socket is then the
 * cancel and nothing else. Measured over this shape: released at 5 ms and at 22 ms with the
 * cancel, and not at all inside two seconds with the cancel taken out.
 *
 * That last sentence is a claim about undici rather than about this class, and the canary that
 * guards it is not written twice: `tests/__tests__/app/aiRunMedia/MediaFetchClient.js` holds one —
 * a describe that takes the cancel out on purpose and asserts the socket is **not** released.
 * Its red is the signal for these two describes as much as for its own six, because both rest on
 * the same property of the same package.
 *
 * Each describe using a server closes it before it asserts, not after. A failing assertion ends
 * the test body where it stands, so a `close()` written below the assertions is a listening handle
 * left behind by exactly the run that failed — which is the run under `--detectOpenHandles`.
 */

/*
 * The body a response carries in the describes that watch a connection be released.
 *
 * The size is load-bearing. An empty body arrives complete, so undici can release its connection
 * whether anybody cancelled it or not, and a describe built on one would pass against the defect
 * it exists to catch. A quarter of a megabyte does not fit the buffers between here and there, so
 * the connection is only released by the cancel.
 *
 * It is the body of a `3xx` in one of them and of a `200` in the other, because both are a
 * response this class answers away from without reading — and the size of either is the client's
 * endpoint's own choice.
 */
const LEAKY_RESPONSE_BODY_BYTE_SIZE = 262144

/*
 * How long those describes wait for the server to see its socket go.
 *
 * The wait is bounded rather than open-ended so that a regression fails on the assertion, naming a
 * socket still alive, instead of on a suite timeout naming nothing. With the cancel in place the
 * wait ends in single-figure to low-double-figure milliseconds and this figure is never reached.
 */
const SOCKET_RELEASE_WAIT_MILLISECONDS = 2000

/*
 * What a loopback server answers a request its case did not plan for.
 *
 * The servers below answer from a list of planned answers, one per expected request, which is what
 * lets a chain be described without branching inside a handler. A request past the end of that
 * list is a hop this class should not have made, and answering it with a status no case expects is
 * what turns that into a named failure rather than a handler raising inside the server.
 */
const UNEXPECTED_REQUEST_ANSWER = {
  status: 599,
  headers: {},
  body: 'this request was not planned for',
}

describe('AiRunCallbackSender', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#requestTimeoutMilliseconds', () => {
        const cases = [
          {
            input: {
              requestTimeoutMilliseconds: 10000,
              maximumRedirectCount: 3,
            },
            expected: 10000,
          },
          {
            input: {
              requestTimeoutMilliseconds: 250,
              maximumRedirectCount: 0,
            },
            expected: 250,
          },
        ]

        test.each(cases)('requestTimeoutMilliseconds: $input.requestTimeoutMilliseconds', ({
          input,
          expected,
        }) => {
          const sender = new AiRunCallbackSender(input)

          expect(sender)
            .toHaveProperty('requestTimeoutMilliseconds', expected)
        })
      })

      describe('#maximumRedirectCount', () => {
        const cases = [
          {
            input: {
              requestTimeoutMilliseconds: 10000,
              maximumRedirectCount: 3,
            },
            expected: 3,
          },
          {
            input: {
              requestTimeoutMilliseconds: 250,
              maximumRedirectCount: 0,
            },
            expected: 0,
          },
        ]

        test.each(cases)('maximumRedirectCount: $input.maximumRedirectCount', ({
          input,
          expected,
        }) => {
          const sender = new AiRunCallbackSender(input)

          expect(sender)
            .toHaveProperty('maximumRedirectCount', expected)
        })
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          input: {
            requestTimeoutMilliseconds: 10000,
            maximumRedirectCount: 3,
          },
        },
        {
          input: {
            requestTimeoutMilliseconds: 250,
            maximumRedirectCount: 0,
          },
        },
      ]

      test.each(cases)('requestTimeoutMilliseconds: $input.requestTimeoutMilliseconds', ({
        input,
      }) => {
        const actual = AiRunCallbackSender.create(input)

        expect(actual)
          .toBeInstanceOf(AiRunCallbackSender)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            requestTimeoutMilliseconds: 10000,
            maximumRedirectCount: 3,
          },
        },
        {
          input: {
            requestTimeoutMilliseconds: 250,
            maximumRedirectCount: 0,
          },
        },
      ]

      test.each(cases)('requestTimeoutMilliseconds: $input.requestTimeoutMilliseconds', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCallbackSender)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('.create()', () => {
    /*
     * Ten seconds, stated as a literal rather than read off the class: a limit that moved would
     * otherwise move this test with it and nothing would have noticed.
     */
    describe('should use default requestTimeoutMilliseconds value', () => {
      test('with no arguments', () => {
        const sender = AiRunCallbackSender.create()

        expect(sender)
          .toHaveProperty('requestTimeoutMilliseconds', 10000)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('.create()', () => {
    /*
     * Three hops, stated as a literal for the same reason. It is what bounds a chain of redirects
     * a client's endpoint answers with — the twenty `fetch` would follow on its own are what this
     * number exists to refuse.
     */
    describe('should use default maximumRedirectCount value', () => {
      test('with no arguments', () => {
        const sender = AiRunCallbackSender.create()

        expect(sender)
          .toHaveProperty('maximumRedirectCount', 3)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('.get:fetchClient', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunCallbackSender.fetchClient

        expect(actual)
          .toBe(globalThis.fetch) // same reference
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('.get:AbortSignalCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunCallbackSender.AbortSignalCtor

        expect(actual)
          .toBe(AbortSignal) // same reference
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('.get:UrlCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunCallbackSender.UrlCtor

        expect(actual)
          .toBe(URL) // same reference
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('.get:mentsuLogger', () => {
    describe('when called as is', () => {
      test('should be a MentsuLogger', () => {
        const actual = AiRunCallbackSender.mentsuLogger

        expect(actual)
          .toBeInstanceOf(MentsuLogger)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#get:Ctor', () => {
    describe('should answer own constructor', () => {
      const cases = [
        {
          input: {
            requestTimeoutMilliseconds: 10000,
            maximumRedirectCount: 3,
          },
        },
        {
          input: {
            requestTimeoutMilliseconds: 250,
            maximumRedirectCount: 0,
          },
        },
      ]

      test.each(cases)('requestTimeoutMilliseconds: $input.requestTimeoutMilliseconds', ({
        input,
      }) => {
        const sender = AiRunCallbackSender.create(input)

        const actual = sender.Ctor

        expect(actual)
          .toBe(AiRunCallbackSender) // same reference
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#buildRequestOptions()', () => {
    /*
     * The content type is added here and is not one of the signed headers, so a request whose four
     * protocol headers are correct still declares what its body is. The signed headers pass
     * through untouched: a header rewritten on the way out would be a signature computed over one
     * request and presented with another.
     *
     * `redirect: 'manual'` is asserted as one of the five keys rather than waved at, because its
     * absence is the whole of the defect this shape was changed for: without it `fetch` follows up
     * to twenty hops itself, carrying the body and the signature to every one of them and
     * answering with the last. The expected object is written out in full for that reason — a
     * matcher that only checked the keys it names would go green on the shape that leaked.
     */
    describe('should answer the options one callback is posted under', () => {
      const cases = [
        {
          factoryParams: {
            requestTimeoutMilliseconds: 10000,
          },
          input: {
            headerHash: {
              'x-ort-client-id': 'client-key-signing-10000001',
              'x-ort-timestamp': '1790157600',
              'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
              'x-ort-run-key': 'run-key-10010004',
            },
            rawBody: '{"runKey":"run-key-10010004"}',
          },
          expected: {
            method: 'POST',
            headers: {
              'x-ort-client-id': 'client-key-signing-10000001',
              'x-ort-timestamp': '1790157600',
              'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
              'x-ort-run-key': 'run-key-10010004',
              'content-type': 'application/json',
            },
            body: '{"runKey":"run-key-10010004"}',
            signal: expect.any(AbortSignal),
            redirect: 'manual',
          },
        },
        {
          factoryParams: {
            requestTimeoutMilliseconds: 250,
          },
          input: {
            headerHash: {
              'x-ort-client-id': 'client-key-rotating-10000002',
              'x-ort-timestamp': '1790157601',
              'x-ort-signature': 'ce3bf8dff4e9f13604ee3d0f564f9d47a497724bea96e3bfc20a66e4bbb8e33d',
              'x-ort-run-key': 'run-key-10010003',
            },
            rawBody: '{"runKey":"run-key-10010003"}',
          },
          expected: {
            method: 'POST',
            headers: {
              'x-ort-client-id': 'client-key-rotating-10000002',
              'x-ort-timestamp': '1790157601',
              'x-ort-signature': 'ce3bf8dff4e9f13604ee3d0f564f9d47a497724bea96e3bfc20a66e4bbb8e33d',
              'x-ort-run-key': 'run-key-10010003',
              'content-type': 'application/json',
            },
            body: '{"runKey":"run-key-10010003"}',
            signal: expect.any(AbortSignal),
            redirect: 'manual',
          },
        },
      ]

      test.each(cases)('rawBody: $input.rawBody', ({
        factoryParams,
        input,
        expected,
      }) => {
        const sender = AiRunCallbackSender.create(factoryParams)

        const actual = sender.buildRequestOptions(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#extractErrorName()', () => {
    describe('should answer the class name of what the request failed with', () => {
      const cases = [
        {
          input: {
            error: new TypeError('fetch failed'),
          },
          expected: 'TypeError',
        },
        {
          input: {
            error: new Error('socket hang up'),
          },
          expected: 'Error',
        },
        {
          // the shape a timed-out `fetch` raises
          input: {
            error: new DOMException('The operation was aborted', 'TimeoutError'),
          },
          expected: 'TimeoutError',
        },
        {
          // a thrown value with no class of its own
          input: {
            error: 'a thrown string',
          },
          expected: 'Error',
        },
        {
          input: {
            error: null,
          },
          expected: 'Error',
        },
      ]

      test.each(cases)('error: $input.error', ({
        input,
        expected,
      }) => {
        const sender = AiRunCallbackSender.create()

        const actual = sender.extractErrorName(input)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#logFailedAiRunCallback()', () => {
    /*
     * The line names the run and the error's class, and neither the callback URL nor the message
     * the error composed out of it — a callback URL is the client's own, and an error message
     * quotes it back.
     */
    describe('should write a line naming the run and the error class', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010004',
            error: new TypeError('fetch failed for https://signing.client.development.invalid/callbacks/10010004'),
          },
          expected: {
            message: 'AiRunCallbackSender#sendAiRunCallback() did not complete: runKey run-key-10010004, error TypeError',
            tags: [
              'AiRunCallback',
              'FailedSend',
            ],
          },
        },
        {
          input: {
            runKey: 'run-key-10010003',
            error: new DOMException('The operation was aborted', 'TimeoutError'),
          },
          expected: {
            message: 'AiRunCallbackSender#sendAiRunCallback() did not complete: runKey run-key-10010003, error TimeoutError',
            tags: [
              'AiRunCallback',
              'FailedSend',
            ],
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', ({
        input,
        expected,
      }) => {
        const errorLogSpy = jest.spyOn(AiRunCallbackSender.mentsuLogger, 'error')
          .mockReturnValue(null)

        const sender = AiRunCallbackSender.create()

        sender.logFailedAiRunCallback(input)

        expect(errorLogSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#buildIncompleteOutcome()', () => {
    /*
     * The null the column is nullable for, built by the one method that answers it. It is the
     * shape a request that never completed comes back as, and it is deliberately not the shape a
     * refused redirect comes back as — that one carries the status the far side really gave.
     */
    describe('should answer a null status', () => {
      const cases = [
        {
          factoryParams: {
            requestTimeoutMilliseconds: 10000,
            maximumRedirectCount: 3,
          },
          expected: {
            httpStatusCode: null,
          },
        },
        {
          factoryParams: {
            requestTimeoutMilliseconds: 250,
            maximumRedirectCount: 0,
          },
          expected: {
            httpStatusCode: null,
          },
        },
      ]

      test.each(cases)('requestTimeoutMilliseconds: $factoryParams.requestTimeoutMilliseconds', ({
        factoryParams,
        expected,
      }) => {
        const sender = AiRunCallbackSender.create(factoryParams)

        const actual = sender.buildIncompleteOutcome()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#extractRedirectedUrl()', () => {
    /*
     * A `location` is resolved against the URL of the hop it arrived on, so a relative one names
     * the URL a request would really go to — which is the URL the inspector is then asked about,
     * and the reason the resolution happens here rather than being left to whoever compares the
     * text.
     */
    describe('should answer the URL the response names', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseStatus: 307,
          mockResponseLocation: 'https://elsewhere.client.development.invalid/internal/metadata',
          expected: 'https://elsewhere.client.development.invalid/internal/metadata',
        },
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseStatus: 308,
          mockResponseLocation: '/callbacks/10010004/moved',
          expected: 'https://signing.client.development.invalid/callbacks/10010004/moved',
        },
        {
          // a protocol-relative location keeps the scheme and changes the host
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseStatus: 302,
          mockResponseLocation: '//elsewhere.client.development.invalid/loot',
          expected: 'https://elsewhere.client.development.invalid/loot',
        },
        {
          // the segments a comparison on the raw text would have missed
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseStatus: 303,
          mockResponseLocation: '../../elsewhere',
          expected: 'https://signing.client.development.invalid/elsewhere',
        },
      ]

      test.each(cases)('mockResponseLocation: $mockResponseLocation', ({
        input,
        mockResponseStatus,
        mockResponseLocation,
        expected,
      }) => {
        const sender = AiRunCallbackSender.create()
        const response = new Response('moved', {
          status: mockResponseStatus,
          headers: {
            location: mockResponseLocation,
          },
        })

        const actual = sender.extractRedirectedUrl({
          response,
          callbackUrl: input.callbackUrl,
        })

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * A status naming no redirect, `304` among them: it sits inside the same range and names no
     * new URL at all, which is why the statuses are written out rather than expressed as a range.
     */
    describe('should be null when the status names no redirect', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseStatus: 200,
        },
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseStatus: 304,
        },
      ]

      test.each(cases)('mockResponseStatus: $mockResponseStatus', ({
        input,
        mockResponseStatus,
      }) => {
        const sender = AiRunCallbackSender.create()
        const response = new Response(null, {
          status: mockResponseStatus,
          headers: {
            location: 'https://elsewhere.client.development.invalid/loot',
          },
        })

        const actual = sender.extractRedirectedUrl({
          response,
          callbackUrl: input.callbackUrl,
        })

        expect(actual)
          .toBeNull()
      })
    })

    describe('should be null when the redirect names nowhere to go', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseStatus: 307,
        },
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010005',
          },
          mockResponseStatus: 302,
        },
      ]

      test.each(cases)('mockResponseStatus: $mockResponseStatus', ({
        input,
        mockResponseStatus,
      }) => {
        const sender = AiRunCallbackSender.create()
        const response = new Response('moved nowhere', {
          status: mockResponseStatus,
        })

        const actual = sender.extractRedirectedUrl({
          response,
          callbackUrl: input.callbackUrl,
        })

        expect(actual)
          .toBeNull()
      })
    })

    describe('should be null when the location resolves to no URL', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseLocation: 'http://[not a host]/loot',
        },
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010005',
          },
          mockResponseLocation: 'https://',
        },
      ]

      test.each(cases)('mockResponseLocation: $mockResponseLocation', ({
        input,
        mockResponseLocation,
      }) => {
        const sender = AiRunCallbackSender.create()
        const response = new Response('moved somewhere unreadable', {
          status: 307,
          headers: {
            location: mockResponseLocation,
          },
        })

        const actual = sender.extractRedirectedUrl({
          response,
          callbackUrl: input.callbackUrl,
        })

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#buildResolvedUrlText()', () => {
    describe('should answer the absolute form of the location', () => {
      const cases = [
        {
          input: {
            location: 'https://elsewhere.client.development.invalid/loot',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          expected: 'https://elsewhere.client.development.invalid/loot',
        },
        {
          input: {
            location: '/callbacks/10010004/',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          expected: 'https://signing.client.development.invalid/callbacks/10010004/',
        },
        {
          input: {
            location: 'moved',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          expected: 'https://signing.client.development.invalid/callbacks/moved',
        },
      ]

      test.each(cases)('location: $input.location', ({
        input,
        expected,
      }) => {
        const sender = AiRunCallbackSender.create()

        const actual = sender.buildResolvedUrlText(input)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should be null', () => {
      const cases = [
        {
          input: {
            location: 'http://[not a host]/loot',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
        },
        {
          input: {
            location: '/loot',
            callbackUrl: 'not a URL at all',
          },
        },
      ]

      test.each(cases)('location: $input.location', ({
        input,
      }) => {
        const sender = AiRunCallbackSender.create()

        const actual = sender.buildResolvedUrlText(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#abandonCallbackResponse()', () => {
    /*
     * The status a response carried, answered by the method that lets the response go. Both the
     * response ending a chain and the `3xx` of a redirect this class would not follow come through
     * here, which is why a `307` sits beside a `200` in the cases.
     */
    describe('should answer the status the response carried', () => {
      const cases = [
        {
          mockResponseStatus: 200,
          expected: {
            httpStatusCode: 200,
          },
        },
        {
          mockResponseStatus: 307,
          expected: {
            httpStatusCode: 307,
          },
        },
        {
          mockResponseStatus: 503,
          expected: {
            httpStatusCode: 503,
          },
        },
      ]

      test.each(cases)('mockResponseStatus: $mockResponseStatus', async ({
        mockResponseStatus,
        expected,
      }) => {
        const sender = AiRunCallbackSender.create()
        const response = new Response('a body nobody read', {
          status: mockResponseStatus,
        })

        const actual = await sender.abandonCallbackResponse({
          response,
        })

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * The other half of the same call, and the half the audit asked for: the body is disposed of
     * and not merely left unread. A cancelled body reads back as used, which is the only thing a
     * `Response` says about itself here — the socket is the connection's business, and the two
     * loopback describes below are where that is observed.
     */
    describe('should mark the body of the response it let go as used', () => {
      const cases = [
        {
          mockResponseStatus: 200,
        },
        {
          mockResponseStatus: 307,
        },
      ]

      test.each(cases)('mockResponseStatus: $mockResponseStatus', async ({
        mockResponseStatus,
      }) => {
        const sender = AiRunCallbackSender.create()
        const response = new Response('a body nobody read', {
          status: mockResponseStatus,
        })

        await sender.abandonCallbackResponse({
          response,
        })

        expect(response.bodyUsed)
          .toBeTruthy()
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#cancelUnreadResponseBody()', () => {
    describe('should mark the body it cancelled as used', () => {
      const cases = [
        {
          mockResponseBody: 'an answer nobody read',
        },
        {
          mockResponseBody: 'a redirect nobody read',
        },
      ]

      test.each(cases)('mockResponseBody: $mockResponseBody', async ({
        mockResponseBody,
      }) => {
        const sender = AiRunCallbackSender.create()
        const response = new Response(mockResponseBody, {
          status: 302,
        })

        await sender.cancelUnreadResponseBody({
          response,
        })

        expect(response.bodyUsed)
          .toBeTruthy()
      })
    })

    /*
     * A response carrying a body, and one carrying none. Neither raises, and neither answers
     * anything to read: a cancel rejects only on a body already read, already cancelled or already
     * errored, and each of those is a body holding nothing — so the failure would say the work was
     * done rather than that it failed.
     */
    describe('should answer nothing to read', () => {
      const cases = [
        {
          mockResponseBody: 'an answer nobody read',
          label: 'a response carrying a body',
        },
        {
          mockResponseBody: null,
          label: 'a response carrying none',
        },
      ]

      test.each(cases)('label: $label', async ({
        mockResponseBody,
      }) => {
        const sender = AiRunCallbackSender.create()

        const actual = await sender.cancelUnreadResponseBody({
          response: new Response(mockResponseBody, {
            status: 200,
          }),
        })

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * A status is answered whatever it is. A `2xx` and a `4xx` are both answers from the far side,
     * and whether one is worth retrying is the job's question rather than this class's — a sender
     * that turned a `410` into a null would lose the difference between "they refused it" and
     * "nobody was there".
     */
    describe('should answer the status the far side gave', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            headerHash: {
              'x-ort-run-key': 'run-key-10010004',
            },
            rawBody: '{"runKey":"run-key-10010004"}',
            runKey: 'run-key-10010004',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
          mockResponseStatus: 200,
          expected: {
            httpStatusCode: 200,
          },
        },
        {
          input: {
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            headerHash: {
              'x-ort-run-key': 'run-key-10010003',
            },
            rawBody: '{"runKey":"run-key-10010003"}',
            runKey: 'run-key-10010003',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
            }),
          },
          mockResponseStatus: 204,
          expected: {
            httpStatusCode: 204,
          },
        },
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010005',
            headerHash: {
              'x-ort-run-key': 'run-key-10010005',
            },
            rawBody: '{"runKey":"run-key-10010005"}',
            runKey: 'run-key-10010005',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
          mockResponseStatus: 429,
          expected: {
            httpStatusCode: 429,
          },
        },
        {
          input: {
            callbackUrl: 'https://switched-off.client.development.invalid/callbacks/10010009',
            headerHash: {
              'x-ort-run-key': 'run-key-10010009',
            },
            rawBody: '{"runKey":"run-key-10010009"}',
            runKey: 'run-key-10010009',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://switched-off.client.development.invalid/callbacks/',
            }),
          },
          mockResponseStatus: 503,
          expected: {
            httpStatusCode: 503,
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.callbackUrl', async ({
        input,
        mockResponseStatus,
        expected,
      }) => {
        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: mockResponseStatus,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * The null the column is nullable for: the attempt was made and the request never completed,
     * so there was no status to record. A failure is answered and never thrown, so a caller writes
     * one branch and meets no exception raised inside `fetch`.
     */
    describe('should answer a null status when the request never completed', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010005',
            headerHash: {
              'x-ort-run-key': 'run-key-10010005',
            },
            rawBody: '{"runKey":"run-key-10010005"}',
            runKey: 'run-key-10010005',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
          mockFetchFailure: new TypeError('fetch failed'),
          expected: {
            httpStatusCode: null,
          },
        },
        {
          input: {
            callbackUrl: 'https://switched-off.client.development.invalid/callbacks/10010010',
            headerHash: {
              'x-ort-run-key': 'run-key-10010010',
            },
            rawBody: '{"runKey":"run-key-10010010"}',
            runKey: 'run-key-10010010',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://switched-off.client.development.invalid/callbacks/',
            }),
          },
          mockFetchFailure: new DOMException('The operation was aborted', 'TimeoutError'),
          expected: {
            httpStatusCode: null,
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.callbackUrl', async ({
        input,
        mockFetchFailure,
        expected,
      }) => {
        jest.spyOn(AiRunCallbackSender.mentsuLogger, 'error')
          .mockReturnValue(null)

        const fetchFunction = jest.fn()
          .mockRejectedValue(mockFetchFailure)

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * The request really is a POST to the URL it was handed, carrying the signed headers and the
     * body. Without this the describes above would pass against a class that posted the body
     * anywhere at all.
     */
    describe('should post the body and the signed headers to the callback URL', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            headerHash: {
              'x-ort-client-id': 'client-key-signing-10000001',
              'x-ort-timestamp': '1790157600',
              'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
              'x-ort-run-key': 'run-key-10010004',
            },
            rawBody: '{"runKey":"run-key-10010004"}',
            runKey: 'run-key-10010004',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
          expected: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            requestOptions: {
              method: 'POST',
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': '1790157600',
                'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
                'x-ort-run-key': 'run-key-10010004',
                'content-type': 'application/json',
              },
              body: '{"runKey":"run-key-10010004"}',
              signal: expect.any(AbortSignal),
              redirect: 'manual',
            },
          },
        },
        {
          input: {
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            headerHash: {
              'x-ort-client-id': 'client-key-rotating-10000002',
              'x-ort-timestamp': '1790157601',
              'x-ort-signature': 'ce3bf8dff4e9f13604ee3d0f564f9d47a497724bea96e3bfc20a66e4bbb8e33d',
              'x-ort-run-key': 'run-key-10010003',
            },
            rawBody: '{"runKey":"run-key-10010003"}',
            runKey: 'run-key-10010003',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
            }),
          },
          expected: {
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            requestOptions: {
              method: 'POST',
              headers: {
                'x-ort-client-id': 'client-key-rotating-10000002',
                'x-ort-timestamp': '1790157601',
                'x-ort-signature': 'ce3bf8dff4e9f13604ee3d0f564f9d47a497724bea96e3bfc20a66e4bbb8e33d',
                'x-ort-run-key': 'run-key-10010003',
                'content-type': 'application/json',
              },
              body: '{"runKey":"run-key-10010003"}',
              signal: expect.any(AbortSignal),
              redirect: 'manual',
            },
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.callbackUrl', async ({
        input,
        expected,
      }) => {
        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: 200,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const sender = AiRunCallbackSender.create()

        await sender.sendAiRunCallback(input)

        expect(fetchFunction)
          .toHaveBeenCalledWith(expected.callbackUrl, expected.requestOptions)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * Section 12's second acceptance criterion, asked of a hop that is not the first.
     *
     * The network is real here and the redirect is a real one, because the thing being tested is
     * partly `fetch`'s own behavior: left to itself it follows up to twenty hops, re-posting this
     * body to every one of them, and answers with the last. Two loopback servers stand in for the
     * two services — one on the port the client registered its prefix under, one on another port,
     * which is a second origin and so outside that prefix however the paths line up. That is the
     * shape the finding described: a metadata endpoint or an internal service the worker can
     * reach, named by a `307` the client's own endpoint answered with.
     *
     * **The count is the assertion that matters.** An outcome carrying the right status says
     * nothing about whether the body reached the second service on the way to it, and what a
     * redirect carries is the whole of this request's value: the run's result in the body, and a
     * valid HMAC over that body in a header undici does not strip when the origin changes.
     * Measured against the options shape before this fix — the four keys with no `redirect` among
     * them — `secondServiceRequests` held one entry, its `signature` the valid one, and the
     * outcome read `200`.
     *
     * The second server is listening on a port of its own and would answer, which is what makes
     * an empty request list mean a refusal rather than an unreachable address.
     */
    describe('should not post to a redirect naming an origin outside the registered prefix', () => {
      const cases = [
        {
          mockRedirectPath: '/internal/metadata',
          expected: {
            httpStatusCode: 307,
          },
        },
        {
          mockRedirectPath: '/v1/credentials',
          expected: {
            httpStatusCode: 307,
          },
        },
      ]

      test.each(cases)('mockRedirectPath: $mockRedirectPath', async ({
        mockRedirectPath,
        expected,
      }) => {
        const secondServiceRequests = []

        const secondServiceServer = http.createServer((request, response) => {
          secondServiceRequests.push({
            url: request.url,
            carriesSignature: Object.hasOwn(request.headers, 'x-ort-signature'),
          })

          response.writeHead(200)
          response.end('taken')
        })

        await new Promise(resolve => {
          secondServiceServer.listen(0, '127.0.0.1', resolve)
        })

        const redirectingServer = http.createServer((request, response) => {
          response.writeHead(307, {
            location: `http://127.0.0.1:${secondServiceServer.address().port}${mockRedirectPath}`,
          })
          response.end('moved')
        })

        await new Promise(resolve => {
          redirectingServer.listen(0, '127.0.0.1', resolve)
        })

        const callbackUrlPrefix = `http://127.0.0.1:${redirectingServer.address().port}/callbacks/`

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback({
          callbackUrl: `${callbackUrlPrefix}10010004`,
          headerHash: {
            'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
            'x-ort-run-key': 'run-key-10010004',
          },
          rawBody: '{"runKey":"run-key-10010004","result":{"exterior.wallMaterial":"brick"}}',
          runKey: 'run-key-10010004',
          aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
            callbackUrlPrefix,
          }),
        })

        redirectingServer.closeAllConnections()
        redirectingServer.close()
        secondServiceServer.closeAllConnections()
        secondServiceServer.close()

        expect(actual)
          .toEqual(expected)
        expect(secondServiceRequests)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * The same refusal where the origin is the client's own and the path is not. A registered
     * prefix bounds the path as well as the origin, and the second case is the one a comparison
     * made on the text as it arrived would have let through: the segments normalize the URL out of
     * the registered path before anything is compared.
     *
     * One server serves both roles here, answering from a list of planned answers — so a hop this
     * class should not have made is both counted and answered with a status no case expects.
     */
    describe('should not post to a redirect leaving the registered path', () => {
      const cases = [
        {
          mockRedirectLocation: '/internal/metadata',
          expected: {
            httpStatusCode: 307,
          },
        },
        {
          mockRedirectLocation: '/callbacks/../internal/metadata',
          expected: {
            httpStatusCode: 307,
          },
        },
      ]

      test.each(cases)('mockRedirectLocation: $mockRedirectLocation', async ({
        mockRedirectLocation,
        expected,
      }) => {
        const requestPaths = []

        const plannedAnswers = [
          {
            status: 307,
            headers: {
              location: mockRedirectLocation,
            },
            body: 'moved',
          },
        ]

        const redirectingServer = http.createServer((request, response) => {
          requestPaths.push(request.url)

          /*
           * Spreading the shifted answer over the sentinel keeps exactly what `??` did here — a
           * request beyond the planned list is answered 599 rather than raising inside the
           * handler — without a conditional, which a test body may not carry. Spreading
           * `undefined` is a no-op, so an empty queue leaves the sentinel standing.
           */
          const answer = {
            ...UNEXPECTED_REQUEST_ANSWER,
            ...plannedAnswers.shift(),
          }

          response.writeHead(answer.status, answer.headers)
          response.end(answer.body)
        })

        await new Promise(resolve => {
          redirectingServer.listen(0, '127.0.0.1', resolve)
        })

        const callbackUrlPrefix = `http://127.0.0.1:${redirectingServer.address().port}/callbacks/`

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback({
          callbackUrl: `${callbackUrlPrefix}10010004`,
          headerHash: {
            'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
            'x-ort-run-key': 'run-key-10010004',
          },
          rawBody: '{"runKey":"run-key-10010004","result":{"exterior.wallMaterial":"brick"}}',
          runKey: 'run-key-10010004',
          aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
            callbackUrlPrefix,
          }),
        })

        redirectingServer.closeAllConnections()
        redirectingServer.close()

        expect(actual)
          .toEqual(expected)
        expect(requestPaths)
          .toHaveLength(1)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * This class carries no scheme guard of its own, unlike its sibling in `app/aiRunMedia/`, and
     * this describe is the whole of what holds that decision up.
     *
     * The reason there is none: `AiRunCallbackUrlInspector` compares the whole normalized `href`,
     * so the scheme is inside what it compares, and a hop that changed scheme is already a URL
     * outside the prefix. A guard here could never fire — and a guard that cannot fire is a
     * docblock pretending to be code.
     *
     * The reason this describe exists: that argument is a dependency on another class's
     * strictness, and nothing mechanical held it. Loosen the inspector to compare a host, a
     * case-folded form or anything short of the full `href`, leave this class alone, and both the
     * downgrade and the climb re-open with no test anywhere going red. Now one does, and it goes
     * red **here**, where the dependency lives rather than where it is honoured.
     *
     * No certificate is needed and none is stood up: the point is that the second URL is never
     * connected to. If the inspector were loosened the sender would try, the plaintext server
     * would fail the handshake, and the outcome would be a null status instead of the `307` —
     * which is what these cases assert.
     */
    describe('should not post to a redirect that changes the scheme', () => {
      const cases = [
        {
          label: 'https, where the prefix is plaintext',
          mockRedirectProtocol: 'https',
          expected: {
            httpStatusCode: 307,
          },
        },
        {
          label: 'https on a path the prefix holds',
          mockRedirectProtocol: 'https',
          expected: {
            httpStatusCode: 307,
          },
        },
      ]

      test.each(cases)('label: $label', async ({
        mockRedirectProtocol,
        expected,
      }) => {
        const requestPaths = []

        const redirectingServer = http.createServer((request, response) => {
          requestPaths.push(request.url)

          response.writeHead(307, {
            location: `${mockRedirectProtocol}://127.0.0.1:${redirectingServer.address().port}/callbacks/10010004`,
          })
          response.end('moved')
        })

        await new Promise(resolve => {
          redirectingServer.listen(0, '127.0.0.1', resolve)
        })

        const callbackUrlPrefix = `http://127.0.0.1:${redirectingServer.address().port}/callbacks/`

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback({
          callbackUrl: `${callbackUrlPrefix}10010004`,
          headerHash: {
            'x-ort-signature': 'bd41cf90a8e7550b2e3d1a6c4f8927bb15ac6e3d02f4718c9d5b6a2e1c0f3847',
            'x-ort-run-key': 'run-key-10010004',
          },
          rawBody: '{"runKey":"run-key-10010004","result":{"exterior.wallMaterial":"brick"}}',
          runKey: 'run-key-10010004',
          aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
            callbackUrlPrefix,
          }),
        })

        redirectingServer.closeAllConnections()
        redirectingServer.close()

        expect(actual)
          .toEqual(expected)
        expect(requestPaths)
          .toHaveLength(1)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * The other half of the decision: a redirect to a URL the client's own prefix holds is
     * followed, because a client's endpoint answering `308` to the same path with a trailing
     * slash, or moving it behind a gateway of its own, is doing nothing wrong. Refusing every
     * redirect would have been simpler and would have failed a delivery registered in good faith.
     *
     * Two hops are spent of the three the default allows, so this is also what says the count is
     * spent rather than merely held. And every hop is asserted to be a POST: `fetch` left to
     * follow turns a `301`, `302` or `303` into a GET and drops the body, so a class that leaned
     * on it would have recorded a delivery that delivered nothing.
     */
    describe('should follow a redirect to a URL the registered prefix holds', () => {
      const cases = [
        {
          mockRedirectLocation: '/callbacks/10010004/moved',
          expected: {
            httpStatusCode: 202,
          },
        },
        {
          mockRedirectLocation: '/callbacks/10010004/',
          expected: {
            httpStatusCode: 202,
          },
        },
      ]

      test.each(cases)('mockRedirectLocation: $mockRedirectLocation', async ({
        mockRedirectLocation,
        expected,
      }) => {
        const requestPaths = []
        const requestMethods = []

        const plannedAnswers = [
          {
            status: 308,
            headers: {
              location: mockRedirectLocation,
            },
            body: 'moved once',
          },
          {
            status: 307,
            headers: {
              location: '/callbacks/10010004/final',
            },
            body: 'moved twice',
          },
          {
            status: 202,
            headers: {},
            body: 'accepted',
          },
        ]

        const movingServer = http.createServer((request, response) => {
          requestPaths.push(request.url)
          requestMethods.push(request.method)

          /*
           * Spreading the shifted answer over the sentinel keeps exactly what `??` did here — a
           * request beyond the planned list is answered 599 rather than raising inside the
           * handler — without a conditional, which a test body may not carry. Spreading
           * `undefined` is a no-op, so an empty queue leaves the sentinel standing.
           */
          const answer = {
            ...UNEXPECTED_REQUEST_ANSWER,
            ...plannedAnswers.shift(),
          }

          response.writeHead(answer.status, answer.headers)
          response.end(answer.body)
        })

        await new Promise(resolve => {
          movingServer.listen(0, '127.0.0.1', resolve)
        })

        const callbackUrlPrefix = `http://127.0.0.1:${movingServer.address().port}/callbacks/`

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback({
          callbackUrl: `${callbackUrlPrefix}10010004`,
          headerHash: {
            'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
            'x-ort-run-key': 'run-key-10010004',
          },
          rawBody: '{"runKey":"run-key-10010004","result":{"exterior.wallMaterial":"brick"}}',
          runKey: 'run-key-10010004',
          aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
            callbackUrlPrefix,
          }),
        })

        movingServer.closeAllConnections()
        movingServer.close()

        expect(actual)
          .toEqual(expected)
        expect(requestPaths)
          .toHaveLength(3)
        expect(requestMethods)
          .toEqual([
            'POST',
            'POST',
            'POST',
          ])
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * A client's endpoint redirecting to itself for ever is refused by the hop count, and the
     * `3xx` it was refused on is what the attempt is recorded as. No hops are allowed at all here,
     * so the server sees exactly one request — which is the assertion that says the bound is a
     * bound rather than a number carried around. The describe above spends two hops under the
     * default of three, so the pair of them says the count is both honored and finite.
     *
     * Both locations stay inside the registered prefix, so nothing but the count could have
     * refused them.
     */
    describe('should give up a chain longer than the hops allowed', () => {
      const cases = [
        {
          factoryParams: {
            maximumRedirectCount: 0,
          },
          mockRedirectLocation: '/callbacks/10010004/again',
          expected: {
            httpStatusCode: 308,
          },
        },
        {
          factoryParams: {
            maximumRedirectCount: 0,
          },
          mockRedirectLocation: '/callbacks/10010004',
          expected: {
            httpStatusCode: 308,
          },
        },
      ]

      test.each(cases)('mockRedirectLocation: $mockRedirectLocation', async ({
        factoryParams,
        mockRedirectLocation,
        expected,
      }) => {
        const requestPaths = []

        const loopingServer = http.createServer((request, response) => {
          requestPaths.push(request.url)

          response.writeHead(308, {
            location: mockRedirectLocation,
          })
          response.end('moved again')
        })

        await new Promise(resolve => {
          loopingServer.listen(0, '127.0.0.1', resolve)
        })

        const callbackUrlPrefix = `http://127.0.0.1:${loopingServer.address().port}/callbacks/`

        const sender = AiRunCallbackSender.create(factoryParams)

        const actual = await sender.sendAiRunCallback({
          callbackUrl: `${callbackUrlPrefix}10010004`,
          headerHash: {
            'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
            'x-ort-run-key': 'run-key-10010004',
          },
          rawBody: '{"runKey":"run-key-10010004","result":{"exterior.wallMaterial":"brick"}}',
          runKey: 'run-key-10010004',
          aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
            callbackUrlPrefix,
          }),
        })

        loopingServer.closeAllConnections()
        loopingServer.close()

        expect(actual)
          .toEqual(expected)
        expect(requestPaths)
          .toHaveLength(1)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * The connection of a callback that was answered, released rather than leaked.
     *
     * Nothing here reads the response body, and that is right — section 12 says a delivery record
     * says whether the callback arrived and not what came back. What the audit found is that not
     * reading a body and disposing of it are different things: a body neither read nor cancelled
     * leaves undici unable to release the connection, one per attempt, held for as long as the
     * worker daemon runs, and the size of what is left behind is the client's endpoint's choice.
     * Measured before the fix with twelve sequential posts against a two-megabyte answer: eleven
     * sockets still open after 1.5 seconds, against none with the body cancelled.
     *
     * The network is real because a socket is the only thing that can show it, and the answer
     * carries a quarter of a megabyte because an empty body arrives complete and leaks nothing.
     * Measured against this shape: released at 5 ms with the cancel, and not at all inside the two
     * seconds waited for with the cancel taken out.
     */
    describe('should release the connection a callback that was answered arrived on', () => {
      const cases = [
        {
          mockResponseStatus: 200,
          expected: {
            httpStatusCode: 200,
          },
        },
        {
          mockResponseStatus: 503,
          expected: {
            httpStatusCode: 503,
          },
        },
      ]

      test.each(cases)('mockResponseStatus: $mockResponseStatus', async ({
        mockResponseStatus,
        expected,
      }) => {
        const releasedSockets = []
        const fetchedResponses = []

        const answeringServer = http.createServer((request, response) => {
          response.writeHead(mockResponseStatus, {
            'content-length': String(LEAKY_RESPONSE_BODY_BYTE_SIZE),
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x61))
        })

        answeringServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const answeringSocketReleased = new Promise(resolve => {
          answeringServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          answeringServer.listen(0, '127.0.0.1', resolve)
        })

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, requestOptions) => {
            const response = await globalThis.fetch(requestedUrl, requestOptions)

            fetchedResponses.push(response)

            return response
          })

        const callbackUrlPrefix = `http://127.0.0.1:${answeringServer.address().port}/callbacks/`

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback({
          callbackUrl: `${callbackUrlPrefix}10010004`,
          headerHash: {
            'x-ort-run-key': 'run-key-10010004',
          },
          rawBody: '{"runKey":"run-key-10010004"}',
          runKey: 'run-key-10010004',
          aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
            callbackUrlPrefix,
          }),
        })

        await Promise.race([
          answeringSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        answeringServer.closeAllConnections()
        answeringServer.close()

        expect(actual)
          .toEqual(expected)
        expect(fetchedResponses)
          .toHaveLength(1)
        expect(releasedSockets)
          .toHaveLength(1)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * The same release on the branch that refuses a chain instead of ending one. Asking for the
     * hop by hand is what made the `3xx`'s body this class's to dispose of: under
     * `redirect: 'follow'` undici drained a redirect internally, and under `redirect: 'manual'`
     * nobody does — while the body of a `3xx` is the client's endpoint's to make as large as it
     * likes.
     *
     * The redirect names a second origin, so the branch driven is the inspector's refusal, and the
     * connection watched is the one the unread `3xx` came in on. Measured against this shape:
     * released at 22 ms with the cancel, and not at all inside the two seconds waited for with the
     * cancel taken out.
     */
    describe('should release the connection a refused redirect arrived on', () => {
      const cases = [
        {
          mockRedirectPath: '/internal/metadata',
          expected: {
            httpStatusCode: 302,
          },
        },
        {
          mockRedirectPath: '/v1/credentials',
          expected: {
            httpStatusCode: 302,
          },
        },
      ]

      test.each(cases)('mockRedirectPath: $mockRedirectPath', async ({
        mockRedirectPath,
        expected,
      }) => {
        const releasedSockets = []
        const fetchedResponses = []
        const secondServiceRequests = []

        const secondServiceServer = http.createServer((request, response) => {
          secondServiceRequests.push(request.url)

          response.writeHead(200)
          response.end('taken')
        })

        secondServiceServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        await new Promise(resolve => {
          secondServiceServer.listen(0, '127.0.0.1', resolve)
        })

        const redirectingServer = http.createServer((request, response) => {
          response.writeHead(302, {
            location: `http://127.0.0.1:${secondServiceServer.address().port}${mockRedirectPath}`,
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x61))
        })

        redirectingServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const redirectSocketReleased = new Promise(resolve => {
          redirectingServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          redirectingServer.listen(0, '127.0.0.1', resolve)
        })

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, requestOptions) => {
            const response = await globalThis.fetch(requestedUrl, requestOptions)

            fetchedResponses.push(response)

            return response
          })

        const callbackUrlPrefix = `http://127.0.0.1:${redirectingServer.address().port}/callbacks/`

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback({
          callbackUrl: `${callbackUrlPrefix}10010004`,
          headerHash: {
            'x-ort-run-key': 'run-key-10010004',
          },
          rawBody: '{"runKey":"run-key-10010004"}',
          runKey: 'run-key-10010004',
          aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
            callbackUrlPrefix,
          }),
        })

        await Promise.race([
          redirectSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        redirectingServer.closeAllConnections()
        redirectingServer.close()
        secondServiceServer.closeAllConnections()
        secondServiceServer.close()

        expect(actual)
          .toEqual(expected)
        expect(fetchedResponses)
          .toHaveLength(1)
        expect(secondServiceRequests)
          .toHaveLength(0)
        expect(releasedSockets)
          .toHaveLength(1)
      })
    })
  })
})
