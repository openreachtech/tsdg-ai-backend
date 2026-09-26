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
 * **Eleven describes use a real network instead, over loopback, and say so where they sit.** A
 * stubbed `fetch` follows nothing, so it could not have shown the thing those eleven are about:
 * left to itself `fetch` follows up to twenty hops, re-posting this body and its signature to
 * every one of them, and answers with the last. Nor has a stubbed `fetch` a socket, which is the
 * only thing the four release describes can observe. Measured against the options shape this file
 * was written for — the four keys with no `redirect` among them — a `307` naming a second
 * loopback server had the whole body and a valid `x-ort-signature` delivered there, and the `200`
 * that server answered recorded as the attempt's status.
 *
 * The eleven are: the four that judge a hop — an origin outside the prefix, a path outside it, a
 * scheme that climbs, and one inside the prefix that is followed — the two that bound a chain,
 * no hop allowed and the default three, the one that refuses a `Location` naming nowhere, and
 * the four that watch a connection be released.
 *
 * **The counts in this paragraph are the thing this file has been wrong about before.** A fix
 * added a describe and left the number as it was; the round after it read the number rather than
 * the file. If a describe here is added or taken away, both sentences above change with it.
 *
 * **The four release describes hold on to the `Response` they were handed, and that is not
 * tidiness.** Undici releases a connection on the cancel this class makes, and also, separately,
 * when the unread `Response` is finalized — which is garbage collection, and lands wherever it
 * lands. Each therefore wraps `fetchClient` around the real `globalThis.fetch` — a pass-through,
 * so the socket, the body and the headers all stay real — purely to keep a reference to every
 * `Response` alive for the length of the test.
 *
 * **What holding the `Response` leaves is not the cancel alone, and this file said it was.** It
 * said "what is left to release the socket is then the cancel and nothing else", and two other
 * things release it, neither of them this class's:
 *
 *   1. the request's own `AbortSignal.timeout`, which destroys the connection when it fires
 *      whether or not the fetch resolved — measured at 1017 ms for a 1000 ms signal;
 *   2. the far side's own keep-alive, which closes an idle connection on its own — measured
 *      beyond the wait at Node's five-second default, and round 3 measured it closing one at
 *      around twelve seconds on a thirty-second timeout.
 *
 * Both sat beyond the wait, so the describes discriminated — for a reason no line of this file
 * stated and none of them owned. Each is now shut out by something a describe *does* rather than
 * by something it says. Every release server pins `keepAliveTimeout` to
 * `SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS`, far above the wait, so the margin is this
 * file's rather than Node's. The abort signal is captured off the options the pass-through was
 * handed and asserted **not** to have fired. Measured with the disposal removed: at a 1000 ms
 * timeout the socket is released at 1017 ms and the captured signal reads `aborted: true`, where
 * the socket assertion alone would have gone quietly green; at the 10000 ms default it reads
 * `aborted: false` and nothing is released inside the wait. Lowering a timeout under the wait —
 * which `DEFAULT_REQUEST_TIMEOUT_MILLISECONDS`' own comment in
 * `app/aiRunCallback/AiRunCallbackSender.js` argues toward, a shorter limit reaching the next
 * attempt sooner — is therefore red, and red naming the signal.
 *
 * What is left is the cancel's own promptness, asserted only as "inside the wait" and not as a
 * number: measured at 5 ms, 22 ms and 28 ms across these shapes, and a cancel that took 1900 ms
 * would still pass. Pinning a millisecond figure would be a timing assertion on a shared build
 * host, which is the trade made here knowingly.
 *
 * That the held `Response` releases nothing of its own inside the wait is a claim about undici
 * rather than about this class, and the canary that guards it is not written twice:
 * `tests/__tests__/app/aiRunMedia/MediaFetchClient.js` holds one — a describe that takes the
 * cancel out on purpose and asserts the socket is **not** released. Its red is the signal for
 * these four describes as much as for its own, because both rest on the same property of the same
 * package. The two guards above are that file's too, and were carried across from it one round
 * later than they should have been.
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
 * the body stays undelivered and the connection stays held — and the cancel is then the only
 * thing that releases it *inside the wait*, the request's abort signal and the far side's
 * keep-alive having been shut out by the two measures the head comment sets out. Without that
 * qualifier the sentence is the one round 3 found false.
 *
 * It is the body of a `3xx` in three of the four — the refused hop, the raised one and the
 * followed one — and the body of the `200`, `503` or `202` that ends a chain in two of them,
 * because every one of those is a response this class answers away from without reading, and the
 * size of any of them is the client's endpoint's own choice.
 */
const LEAKY_RESPONSE_BODY_BYTE_SIZE = 262144

/*
 * How long those describes wait for the server to see its socket go.
 *
 * The wait is bounded rather than open-ended so that a regression fails on the assertion, naming a
 * socket still alive, instead of on a suite timeout naming nothing. With the cancel in place the
 * wait ends in single-figure to low-double-figure milliseconds and this figure is never reached.
 *
 * **This figure has to sit below every path that releases the socket without the cancel, and two
 * of them are foreign to this file.** Neither is undici's own finalizer, which the held `Response`
 * already keeps out. They are:
 *
 *   1. `DEFAULT_REQUEST_TIMEOUT_MILLISECONDS` in `app/aiRunCallback/AiRunCallbackSender.js`, which
 *      becomes the request's `AbortSignal.timeout` and destroys the connection to the millisecond
 *      when it fires — measured at 1017 ms for a 1000 ms signal, whether or not the fetch
 *      resolved;
 *   2. `server.keepAliveTimeout`, Node's own, five seconds by default.
 *
 * So the coupling is:
 *
 *   2000 ms  <  SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS
 *   2000 ms  <  every release describe's own request timeout
 *
 * The first is pinned by the constant below rather than left to Node. The second cannot be pinned
 * here — it is a `.create()` parameter, and the sender's default is ten seconds — so it is
 * asserted instead: each release describe captures the signal off the options its pass-through was
 * handed and asserts it has not fired. Lowering a timeout under this wait therefore turns that
 * assertion red rather than turning a describe into one that passes with the disposal removed.
 *
 * The same two paths, the same two measures and the same reasoning live in
 * `tests/__tests__/app/aiRunMedia/MediaFetchClient.js`, which found them one round earlier. A
 * change to either of these figures belongs in both files.
 */
const SOCKET_RELEASE_WAIT_MILLISECONDS = 2000

/*
 * How long the servers in those describes hold an idle connection open before closing it on their
 * own.
 *
 * Node's default `server.keepAliveTimeout` is five seconds, and a held, uncancelled `Response` has
 * its socket closed by the server once that elapses — a release the describes above do not own and
 * would have credited to the cancel had the wait ever reached it. Pinned to a minute, the path is
 * switched off rather than merely parked beyond the wait. The figure is deliberately far larger
 * than the wait: it is not a margin to be tuned.
 */
const SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS = 60000

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
  describe('#isUsableCallbackUrlInspector()', () => {
    /*
     * What the sender asks of a call before it posts anything: that there is something to put a
     * hop to. It is a duck-typed question rather than an `instanceof` one, so a subclass answers
     * and so does a stand-in — which is what lets the describes below hand over an inspector of
     * their own.
     */
    describe('should answer that a hop can be put to it', () => {
      const cases = [
        {
          label: 'an inspector built from a registered prefix',
          input: {
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
        },
        {
          // an inspector that refuses everything is still an inspector: it answers, with a no
          label: 'an inspector whose prefix is not a URL',
          input: {
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'not a URL at all',
            }),
          },
        },
        {
          label: 'a stand-in carrying the one method',
          input: {
            aiRunCallbackUrlInspector: {
              isDeliverableCallbackUrl: () => true,
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const sender = AiRunCallbackSender.create()

        const actual = sender.isUsableCallbackUrlInspector(input)

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * The shapes a caller that never passed the argument arrives in. The first is the one that was
     * live: `#attemptTerminalCallback()` builds the inspector and hands it down, and the line that
     * does it was a line nothing held — so the argument arrived absent, and only a client
     * answering `307` ever noticed.
     */
    describe('should answer that a hop cannot be put to it', () => {
      const cases = [
        {
          label: 'nothing passed at all',
          input: {
            // aiRunCallbackUrlInspector: undefined
          },
        },
        {
          label: 'null passed',
          input: {
            aiRunCallbackUrlInspector: null,
          },
        },
        {
          label: 'an object carrying no such method',
          input: {
            aiRunCallbackUrlInspector: {},
          },
        },
        {
          label: 'the method present but not callable',
          input: {
            aiRunCallbackUrlInspector: {
              isDeliverableCallbackUrl: 'yes',
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const sender = AiRunCallbackSender.create()

        const actual = sender.isUsableCallbackUrlInspector(input)

        expect(actual)
          .toBeFalsy()
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

    /*
     * No `location` header at all.
     */
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

    /*
     * A `location` header that is present and carries no text. It reads as the same fact as the
     * header being absent, and it did not behave like it: `new URL('', hopUrl)` answers the hop
     * itself, which is inside the client's own prefix, so it passed the inspector and was posted
     * to again until the hop count ran out — four POSTs of one signed body where the client had
     * named nowhere. Measured at four requests before this guard, one after.
     *
     * Every blank spelling arrives here as `''`: the Headers layer strips leading and trailing
     * whitespace from a value, so `'   '` and a tab are `''` by the time `.get()` answers, and
     * writing them as separate cases here would be one case written twice. They are exercised
     * where they are still distinct — on `#isBlankRedirectLocation()`, which takes the text as
     * given, and over a socket in the describe that sends them on the wire.
     */
    describe('should be null when the location carries no text', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          mockResponseStatus: 307,
        },
        {
          input: {
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
          },
          mockResponseStatus: 308,
        },
      ]

      test.each(cases)('callbackUrl: $input.callbackUrl', ({
        input,
        mockResponseStatus,
      }) => {
        const sender = AiRunCallbackSender.create()
        const response = new Response('moved nowhere', {
          status: mockResponseStatus,
          headers: {
            location: '',
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
  describe('#isBlankRedirectLocation()', () => {
    /*
     * The spellings of "nowhere" a header can arrive in. Over a socket the Headers layer will have
     * trimmed most of them to `''` already; this method is what makes the answer the same either
     * way, so that the guard does not depend on which layer did the trimming.
     */
    describe('should answer that the location names nowhere', () => {
      const cases = [
        {
          label: 'empty text',
          input: {
            location: '',
          },
        },
        {
          label: 'spaces',
          input: {
            location: '   ',
          },
        },
        {
          label: 'a tab',
          input: {
            location: '\t',
          },
        },
        {
          label: 'a line break',
          input: {
            location: '\n',
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const sender = AiRunCallbackSender.create()

        const actual = sender.isBlankRedirectLocation(input)

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * A location naming somewhere is not this method's to refuse, whatever it names — an origin
     * outside the prefix included, which the inspector answers for and this does not. The
     * whitespace-padded case is the one that says the trim decides emptiness rather than trimming
     * the value that is then used.
     */
    describe('should answer that the location names somewhere', () => {
      const cases = [
        {
          input: {
            location: '/callbacks/10010004/moved',
          },
        },
        {
          input: {
            location: '  /callbacks/10010004/padded  ',
          },
        },
        {
          input: {
            location: 'https://elsewhere.client.development.invalid/loot',
          },
        },
        {
          input: {
            location: '#fragment-of-the-same-path',
          },
        },
      ]

      test.each(cases)('location: $input.location', ({
        input,
      }) => {
        const sender = AiRunCallbackSender.create()

        const actual = sender.isBlankRedirectLocation(input)

        expect(actual)
          .toBeFalsy()
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
  describe('#answerAiRunCallbackHop()', () => {
    /*
     * The branch that refuses a hop, driven directly rather than through a chain: the response is
     * answered as the `3xx` it was, and its body is disposed of on the way out. Something did
     * answer here — it answered `307` — so null would say the wrong thing, and null is kept for
     * the case where nothing was on the other end.
     *
     * The inspector is a stand-in refusing everything, because what is under test is what this
     * method does with a no rather than how the no was arrived at. Whether the real inspector says
     * no to the right URLs is `AiRunCallbackUrlInspector`'s own file, and whether this method is
     * reached with the real one is the chain describes below.
     */
    describe('should answer a refused hop as the status it was refused on', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            requestOptions: {
              method: 'POST',
              headers: {
                'x-ort-run-key': 'run-key-10010004',
              },
              body: '{"runKey":"run-key-10010004"}',
              signal: AbortSignal.timeout(10000),
              redirect: 'manual',
            },
            runKey: 'run-key-10010004',
            aiRunCallbackUrlInspector: {
              isDeliverableCallbackUrl: () => false,
            },
            remainingRedirectCount: 3,
          },
          mockResponseStatus: 307,
          expected: {
            httpStatusCode: 307,
          },
        },
        {
          input: {
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            requestOptions: {
              method: 'POST',
              headers: {
                'x-ort-run-key': 'run-key-10010003',
              },
              body: '{"runKey":"run-key-10010003"}',
              signal: AbortSignal.timeout(10000),
              redirect: 'manual',
            },
            runKey: 'run-key-10010003',
            aiRunCallbackUrlInspector: {
              isDeliverableCallbackUrl: () => false,
            },
            remainingRedirectCount: 1,
          },
          mockResponseStatus: 302,
          expected: {
            httpStatusCode: 302,
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.callbackUrl', async ({
        input,
        mockResponseStatus,
        expected,
      }) => {
        const fetchFunction = jest.fn()

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const sender = AiRunCallbackSender.create()
        const response = new Response('moved', {
          status: mockResponseStatus,
          headers: {
            location: 'https://elsewhere.client.development.invalid/loot',
          },
        })

        const actual = await sender.answerAiRunCallbackHop({
          response,
          callbackUrl: input.callbackUrl,
          requestOptions: input.requestOptions,
          runKey: input.runKey,
          aiRunCallbackUrlInspector: input.aiRunCallbackUrlInspector,
          remainingRedirectCount: input.remainingRedirectCount,
        })

        expect(actual)
          .toEqual(expected)
        expect(response.bodyUsed)
          .toBeTruthy()
        expect(fetchFunction)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * A call carrying nothing to put a hop to is refused, and refused before anything is posted.
     *
     * This is the hole round 2 found, and the shape of the fix is the argument: the sender could
     * have answered the case as a `3xx` instead, and that would have filed a caller's forgotten
     * argument as a client's own redirect — a row an operator reads as "they redirected us", a
     * retry spent, and nothing anywhere naming the real fault. Raising says whose mistake it is.
     *
     * **What makes raising safe is when it happens.** Measured on the code before this fix, with
     * no inspector and a `307` carrying a quarter of a megabyte: `TypeError` out of the middle of
     * the redirect walk, the `3xx` held with `bodyUsed` false, its socket still open 1.5 seconds
     * later, and the raise passing `AiRunTerminalCallbackDeliverer#attemptTerminalCallback()`
     * before the row was written — so an attempt that really went out left none. Measured after:
     * nothing posted at all, which is what `fetchFunction` asserts here.
     *
     * The second case is the same refusal for an argument that is present and cannot answer, which
     * is the shape a stand-in built wrong arrives in.
     */
    describe('should refuse a call carrying nothing to put a hop to', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            headerHash: {
              'x-ort-run-key': 'run-key-10010004',
            },
            rawBody: '{"runKey":"run-key-10010004"}',
            runKey: 'run-key-10010004',
            // aiRunCallbackUrlInspector: undefined
          },
          expected: 'AiRunCallbackSender#sendAiRunCallback() refused a callback handed no URL inspector: runKey run-key-10010004',
        },
        {
          input: {
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            headerHash: {
              'x-ort-run-key': 'run-key-10010003',
            },
            rawBody: '{"runKey":"run-key-10010003"}',
            runKey: 'run-key-10010003',
            aiRunCallbackUrlInspector: {},
          },
          expected: 'AiRunCallbackSender#sendAiRunCallback() refused a callback handed no URL inspector: runKey run-key-10010003',
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const fetchFunction = jest.fn()

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const sender = AiRunCallbackSender.create()

        const actual = () => sender.sendAiRunCallback(input)

        await expect(actual)
          .rejects
          .toThrow(expected)
        expect(fetchFunction)
          .not
          .toHaveBeenCalled()
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
     * this describe and the one below it are the whole of what holds that decision up.
     *
     * The reason there is none: `AiRunCallbackUrlInspector` compares the whole normalized `href`,
     * so the scheme is inside what it compares, and a hop that changed scheme is already a URL
     * outside the prefix. A guard here could never fire — and a guard that cannot fire is a
     * docblock pretending to be code.
     *
     * The reason these describes exist: that argument is a dependency on another class's
     * strictness, and nothing mechanical held it. Loosen the inspector to compare a host, a
     * case-folded form or anything short of the full `href`, leave this class alone, and the
     * climb and the downgrade re-open with no test anywhere going red. Now they do, and they go
     * red **here**, where the dependency lives rather than where it is honoured. Confirmed by
     * swapping in a loosened inspector that compares host and path and ignores the scheme: the
     * sender connects, the plaintext server fails the handshake, and the outcome reads
     * `{ httpStatusCode: null }` against the `307` expected.
     *
     * **This describe holds the climb only — a plaintext prefix sent up to `https:`.** The
     * downgrade is the direction the class comment names first and it is not here, because the
     * first hop would have to be served over TLS and no certificate is stood up in this suite. It
     * is covered instead in the describe below, where the network is stubbed and no handshake is
     * needed. Two directions, two describes; what this file must not do again is carry two cases
     * of one direction under labels that claim both.
     *
     * No certificate is needed here either: the point is that the second URL is never connected
     * to. The two cases differ in the path the `307` names, both inside the registered prefix, so
     * that the scheme is the only thing left to refuse them on.
     */
    describe('should not post to a redirect that climbs to https', () => {
      const cases = [
        {
          mockRedirectPath: '/callbacks/10010004',
          expected: {
            httpStatusCode: 307,
          },
        },
        {
          mockRedirectPath: '/callbacks/10010004/moved',
          expected: {
            httpStatusCode: 307,
          },
        },
      ]

      test.each(cases)('mockRedirectPath: $mockRedirectPath', async ({
        mockRedirectPath,
        expected,
      }) => {
        const requestPaths = []

        const redirectingServer = http.createServer((request, response) => {
          requestPaths.push(request.url)

          response.writeHead(307, {
            location: `https://127.0.0.1:${redirectingServer.address().port}${mockRedirectPath}`,
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
     * The other direction of the scheme decision, and the one the class comment names first: a
     * client whose registered prefix is `https://…` answering `307` to the plaintext form of its
     * own path. That is the downgrade a redirect-following client would take without noticing, and
     * it carries the run's whole result and a valid signature over the wire in clear.
     *
     * **The network is stubbed here, and that is the point rather than a compromise.** Driving
     * this over loopback would need the *first* hop served over TLS, which needs a certificate
     * this suite does not stand up — which is why the direction had no case at all until now, and
     * why the describe above carried two cases of the climb under labels that claimed both. What a
     * stub cannot show is that `fetch` does not follow on its own; the climb describe shows that
     * over a real socket, and this one asks the remaining question: given a `307` to `http:` under
     * an `https:` prefix, does a second request go out? Loosen `AiRunCallbackUrlInspector` to
     * anything short of the whole `href` and one does.
     *
     * The call count is the assertion that matters, for the same reason it does above: an outcome
     * of `307` would also be answered by a chain that posted the body to the plaintext URL and was
     * refused there.
     */
    describe('should not post to a redirect that steps down to plaintext', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            headerHash: {
              'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
              'x-ort-run-key': 'run-key-10010004',
            },
            rawBody: '{"runKey":"run-key-10010004","result":{"exterior.wallMaterial":"brick"}}',
            runKey: 'run-key-10010004',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
          mockRedirectLocation: 'http://signing.client.development.invalid/callbacks/10010004',
          expected: {
            httpStatusCode: 307,
          },
        },
        {
          input: {
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            headerHash: {
              'x-ort-signature': 'ce3bf8dff4e9f13604ee3d0f564f9d47a497724bea96e3bfc20a66e4bbb8e33d',
              'x-ort-run-key': 'run-key-10010003',
            },
            rawBody: '{"runKey":"run-key-10010003","result":{"exterior.wallMaterial":"tile"}}',
            runKey: 'run-key-10010003',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
            }),
          },
          mockRedirectLocation: 'http://rotating.client.development.invalid/callbacks/10010003/moved',
          expected: {
            httpStatusCode: 307,
          },
        },
      ]

      test.each(cases)('mockRedirectLocation: $mockRedirectLocation', async ({
        input,
        mockRedirectLocation,
        expected,
      }) => {
        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response('moved', {
            status: 307,
            headers: {
              location: mockRedirectLocation,
            },
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback(input)

        expect(actual)
          .toEqual(expected)
        expect(fetchFunction)
          .toHaveBeenCalledTimes(1)
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
     * bound rather than a number carried around.
     *
     * Three describes divide that between them: this one, at zero, says the count is honored at
     * its floor; the one above spends two of the default three, so the count is spent rather than
     * merely held; and the one below runs a chain past the default, so the boundary itself is
     * driven rather than read off `.create()`'s default. Before the third of them, nothing but
     * `toHaveProperty('maximumRedirectCount', 3)` stood behind the comments naming three.
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
     * The default hop count, driven to its boundary instead of read off the factory.
     *
     * Nothing carried the default before this: the describe above runs at zero and the follow
     * describe spends two of three, so the sentences in the class and in this file that say "at
     * most three times by default" rested on one `toHaveProperty` assertion about a number. Here
     * the sender is built with no factory params at all, and the chain is what says what the
     * number does.
     *
     * The server answers every request with a `308` naming the path it was asked for plus one more
     * segment, so every hop is a URL the client's prefix holds and none of them repeats — the
     * count is the only thing that can end it. Measured: four requests, the first plus the three
     * hops allowed, and the outcome the `308` the fourth answered.
     *
     * **A growing path is the one shape this measures, and the four should not be lent to
     * another.** A `Location` naming the path it arrived on, or a fragment of one, is bounded by
     * the same count by argument and by no describe in this file — the comment below and the class
     * comment both used to cite this describe's four for it.
     *
     * **Four requests is also the ceiling on what one attempt costs.** Each of them re-posts the
     * whole signed body, so a run's seven attempts are twenty-eight posts of one result at worst.
     * That is the amplification this count bounds, and this describe is where the bound is a
     * number a change would have to break.
     */
    describe('should spend the default hops and no more', () => {
      const cases = [
        {
          input: {
            callbackPath: '/callbacks/10010004',
            runKey: 'run-key-10010004',
          },
          expected: {
            httpStatusCode: 308,
          },
        },
        {
          input: {
            callbackPath: '/callbacks/10010003',
            runKey: 'run-key-10010003',
          },
          expected: {
            httpStatusCode: 308,
          },
        },
      ]

      test.each(cases)('callbackPath: $input.callbackPath', async ({
        input,
        expected,
      }) => {
        const requestPaths = []

        const movingServer = http.createServer((request, response) => {
          requestPaths.push(request.url)

          response.writeHead(308, {
            location: `${request.url}/again`,
          })
          response.end('moved again')
        })

        await new Promise(resolve => {
          movingServer.listen(0, '127.0.0.1', resolve)
        })

        const callbackUrlPrefix = `http://127.0.0.1:${movingServer.address().port}/callbacks/`

        const sender = AiRunCallbackSender.create()

        const actual = await sender.sendAiRunCallback({
          callbackUrl: `http://127.0.0.1:${movingServer.address().port}${input.callbackPath}`,
          headerHash: {
            'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
            'x-ort-run-key': input.runKey,
          },
          rawBody: '{"result":{"exterior.wallMaterial":"brick"}}',
          runKey: input.runKey,
          aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
            callbackUrlPrefix,
          }),
        })

        movingServer.closeAllConnections()
        movingServer.close()

        expect(actual)
          .toEqual(expected)
        expect(requestPaths)
          .toHaveLength(4)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * A `307` whose `Location` names nowhere is answered as the `307` it was, and costs one
     * request rather than four.
     *
     * The network is real because the header is the thing under test and the Headers layer is
     * part of how it arrives: an empty value and a whitespace-only value are both `''` by the time
     * `.get()` answers, and that is only true of a value that came off a socket the way these did.
     *
     * Measured before the guard, over exactly this shape: `location: ''` and `location: '   '`
     * each spent the whole hop count — four POSTs of one signed body, every one of them to the
     * path the request had just been made to, because `new URL('', hopUrl)` answers the hop itself
     * and the hop is inside the client's own prefix. The client named no destination and the code
     * read one out of it.
     *
     * What this does **not** cover is a `Location` that names the same path outright, or a
     * fragment of it: those name somewhere, they are followed, and the hop count is the only thing
     * that ends them — four requests under the default of three.
     *
     * **That four is the count's own bound and not a measurement of this case**, which is what
     * this paragraph said before and what the class comment said with it. The describe above
     * measures four against a server answering a *growing* path, a different URL every hop; no
     * describe in this file drives a `Location` naming the path it arrived on or a fragment of
     * one. So a same-path short-circuit added to `#extractRedirectedUrl()` later would change this
     * case and leave that describe green, with a comment claiming it had measured the case it
     * changed.
     */
    describe('should not follow a redirect whose location names nowhere', () => {
      const cases = [
        {
          label: 'an empty location header',
          mockRedirectLocation: '',
          expected: {
            httpStatusCode: 307,
          },
        },
        {
          label: 'a location header holding only spaces',
          mockRedirectLocation: '   ',
          expected: {
            httpStatusCode: 307,
          },
        },
      ]

      test.each(cases)('label: $label', async ({
        mockRedirectLocation,
        expected,
      }) => {
        const requestPaths = []

        const redirectingServer = http.createServer((request, response) => {
          requestPaths.push(request.url)

          response.writeHead(307, {
            location: mockRedirectLocation,
          })
          response.end('moved nowhere')
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
     * The connection of a callback that was answered, released rather than leaked.
     *
     * Nothing here reads the response body, and that is right — section 12 says a delivery record
     * says whether the callback arrived and not what came back. What the audit found is that not
     * reading a body and disposing of it are different things: a body neither read nor cancelled
     * leaves undici unable to release the connection, one per attempt, and the size of what is
     * left behind is the client's endpoint's choice. Measured before the fix with twelve
     * sequential posts against a two-megabyte answer: eleven sockets still open after 1.5 seconds,
     * against none with the body cancelled.
     *
     * How long one is held was written here as "for as long as the worker daemon runs", and that
     * is the overstatement round 3 named: the request's own abort signal ends it when it fires,
     * and the far side's keep-alive after that, so it is a concurrent hold for the rest of an
     * attempt's budget rather than a descriptor that never comes back. Those two are also the
     * reason this describe needs the keep-alive pinned and the signal asserted — the same fact
     * from the other side, which is why leaving the overstatement standing hid the gap.
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
        const requestSignals = []

        const answeringServer = http.createServer((request, response) => {
          response.writeHead(mockResponseStatus, {
            'content-length': String(LEAKY_RESPONSE_BODY_BYTE_SIZE),
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x61))
        })

        answeringServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

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
            requestSignals.push(requestOptions.signal)

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
        expect(requestSignals[0].aborted)
          .toBeFalsy()
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
        const requestSignals = []
        const secondServiceRequests = []

        const secondServiceServer = http.createServer((request, response) => {
          secondServiceRequests.push(request.url)

          response.writeHead(200)
          response.end('taken')
        })

        secondServiceServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

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

        redirectingServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

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
            requestSignals.push(requestOptions.signal)

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
        expect(requestSignals[0].aborted)
          .toBeFalsy()
        expect(releasedSockets)
          .toHaveLength(1)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * The third release, on the way out of an exception rather than a return.
     *
     * This is what round 2's finding cost before it was closed: the sender put a hop to the
     * inspector without checking there was one, so a caller that never passed the argument raised
     * a `TypeError` from inside the redirect walk — past the disposal, and past the row
     * `AiRunTerminalCallbackDeliverer` writes for an attempt that really went out. Measured on
     * that code, over this shape: `heldResponses: 1`, `bodyUsed: [false]`, and the socket still
     * open 1.5 seconds later.
     *
     * The missing argument itself is refused earlier now, before anything is posted, so what this
     * describe drives is what is left: an inspector the caller did hand over, which raises when it
     * is asked. That is the general case — anything raised while a response is in hand — and the
     * `finally` in `#sendAiRunCallbackHop()` is what it is held by. That was a `catch` when this
     * describe was written, and the round that turned it into a `finally` changed nothing here:
     * either shape disposes on the way out of a raise, and neither stops the exception. Take it
     * out and the exception still travels, which is why the released socket rather than the
     * exception is the assertion that discriminates.
     *
     * **The exception is re-raised, not turned into an outcome.** An inspector that raises is a
     * fault of the caller's or of its own; answering it as a `3xx` would file it as the client's
     * redirect, which is the one thing a refusal must not be mistaken for.
     *
     * The failure is caught into a value rather than asserted with `rejects.toThrow()` because the
     * server has to be closed before any assertion runs — a failing assertion ends the body where
     * it stands — and the socket cannot be waited for until the call has settled.
     */
    describe('should release the connection held when deciding a hop raised', () => {
      const cases = [
        {
          mockInspectorFailure: new Error('the inspector of the caller raised'),
          expected: 'the inspector of the caller raised',
        },
        {
          mockInspectorFailure: new TypeError('isDeliverableCallbackUrl is not a function'),
          expected: 'isDeliverableCallbackUrl is not a function',
        },
      ]

      test.each(cases)('mockInspectorFailure.message: $mockInspectorFailure.message', async ({
        mockInspectorFailure,
        expected,
      }) => {
        const releasedSockets = []
        const fetchedResponses = []
        const requestSignals = []

        const redirectingServer = http.createServer((request, response) => {
          response.writeHead(307, {
            location: '/callbacks/10010004/moved',
            'content-length': String(LEAKY_RESPONSE_BODY_BYTE_SIZE),
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x61))
        })

        redirectingServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

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
            requestSignals.push(requestOptions.signal)

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
          aiRunCallbackUrlInspector: {
            isDeliverableCallbackUrl: () => {
              throw mockInspectorFailure
            },
          },
        })
          .catch(hopDecisionFailure => hopDecisionFailure)

        await Promise.race([
          redirectSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        redirectingServer.closeAllConnections()
        redirectingServer.close()

        expect(actual)
          .toHaveProperty('message', expected)
        expect(fetchedResponses)
          .toHaveLength(1)
        expect(requestSignals[0].aborted)
          .toBeFalsy()
        expect(releasedSockets)
          .toHaveLength(1)
      })
    })
  })
})

describe('AiRunCallbackSender', () => {
  describe('#sendAiRunCallback()', () => {
    /*
     * The fourth release, on the branch that *follows* a hop — and the one a client's own endpoint
     * reaches most often.
     *
     * The three above take the answered branch, the refused branch and the raised branch. The
     * recursion branch was taken by two describes and watched by neither, which left the one case
     * the hand-written redirect follow exists to serve with nothing looking at its socket: a
     * client answering `308` to the same path with a trailing slash, or moving a callback behind a
     * gateway of its own, runs this branch on every hop.
     *
     * Measured with that branch's own cancel removed and everything else identical, over a chain
     * of three requests: the same `202` outcome, the same three requests, and three sockets still
     * open 1500 ms later against none with it in place — while every assertion the follow describe
     * makes was identical across both runs. Eight sequential attempts leaked nine sockets. In this
     * describe's own two-request shape: the first socket released at 5 ms and at 28 ms with the
     * disposal, and not at all inside the 2000 ms waited for without it.
     *
     * **What it pins is that the followed branch disposes, not which line does the disposing.**
     * `#sendAiRunCallbackHop()` now lets the response go in a `finally`, so removing the cancel
     * that runs before the recursion no longer leaks: measured, the socket is then released 7 ms
     * later, when the `finally` of the frame that owns it runs — after the whole chain has
     * settled rather than before the next hop is posted. That is a cost paid inside one
     * ten-second budget, not a descriptor left behind, so it is green here and said in the class
     * comment instead. Take the disposal off this branch *and* out of the `finally`, and this
     * describe is red.
     *
     * The two requests asserted are what say the branch was really taken: a chain that stopped at
     * the `3xx` would release the same socket and prove nothing about the hop that follows one.
     */
    describe('should release the connection a followed redirect arrived on', () => {
      const cases = [
        {
          mockRedirectStatus: 307,
          expected: {
            httpStatusCode: 202,
          },
        },
        {
          mockRedirectStatus: 308,
          expected: {
            httpStatusCode: 202,
          },
        },
      ]

      test.each(cases)('mockRedirectStatus: $mockRedirectStatus', async ({
        mockRedirectStatus,
        expected,
      }) => {
        const releasedSockets = []
        const fetchedResponses = []
        const requestSignals = []

        const plannedAnswers = [
          {
            status: mockRedirectStatus,
            headers: {
              location: '/callbacks/10010004/moved',
              'content-length': String(LEAKY_RESPONSE_BODY_BYTE_SIZE),
            },
            body: Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x61),
          },
          {
            status: 202,
            headers: {
              'content-length': String(LEAKY_RESPONSE_BODY_BYTE_SIZE),
            },
            body: Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x62),
          },
        ]

        const movingServer = http.createServer((request, response) => {
          /*
           * The same shifted-answer shape the follow describe above uses: a request beyond the
           * planned list is answered 599 rather than raising inside the handler, and no
           * conditional is written to do it.
           */
          const answer = {
            ...UNEXPECTED_REQUEST_ANSWER,
            ...plannedAnswers.shift(),
          }

          response.writeHead(answer.status, answer.headers)
          response.end(answer.body)
        })

        movingServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

        movingServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const followedSocketReleased = new Promise(resolve => {
          movingServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          movingServer.listen(0, '127.0.0.1', resolve)
        })

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, requestOptions) => {
            requestSignals.push(requestOptions.signal)

            const response = await globalThis.fetch(requestedUrl, requestOptions)

            fetchedResponses.push(response)

            return response
          })

        const callbackUrlPrefix = `http://127.0.0.1:${movingServer.address().port}/callbacks/`

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
          followedSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        movingServer.closeAllConnections()
        movingServer.close()

        expect(actual)
          .toEqual(expected)
        expect(fetchedResponses)
          .toHaveLength(2)
        expect(requestSignals[0].aborted)
          .toBeFalsy()
        expect(releasedSockets)
          .toHaveLength(1)
      })
    })
  })
})
