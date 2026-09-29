import http from 'node:http'
import timersPromises from 'node:timers/promises'

import MediaFetchClient from '../../../../app/aiRunMedia/MediaFetchClient.js'

/*
 * The first and the fourth acceptance criteria of section 18 are what this file exists for.
 *
 * "A file URL whose host is not on the allow-list is refused, and nothing is fetched" is two
 * assertions and not one: the outcome carries the reason code, and the function that performs the
 * network read was never called. The second half is the one a passing outcome could hide, so every
 * refusal case asserts it.
 *
 * "A file that could not be fetched at all fails the run with a fetch reason code, distinct from
 * one that was fetched but could not be read" is the pair of codes: `MEDIA_FETCH_FAILED` for a
 * refused host, a URL that is no URL, a connection that failed and a status the server answered
 * with; `MEDIA_UNREADABLE` for a body that carried nothing.
 *
 * The network is mocked in most of this file, and it is mocked through the getter the class reaches
 * it by. What stands in for a response is a real `Response` - Node builds one - rather than a
 * hand-written double, so nothing in this file restates what a response is.
 *
 * Several describes use a real one instead, over loopback, and say so where they sit: a redirect
 * refused, a redirect followed, a chain longer than the hops allowed, and the seven that watch a
 * connection be released. A stubbed fetch follows nothing, so it could not have shown that `fetch`
 * left to itself follows up to twenty hops and answers with the last of them - and a stubbed one
 * has no socket at all, which is the only thing the release describes can observe.
 *
 * **The seven release describes hold on to the `Response` they were handed, and that is not
 * tidiness.** Undici releases a connection when the unread `Response` is finalized - which is
 * garbage collection, and lands wherever it lands. Measured against a client whose cancel had been
 * taken out again, that path fired at 20 ms on one run and not at all within five seconds on four
 * others, so a describe that let the `Response` go would pass against the very defect it exists to
 * catch on roughly one run in five. Each of the seven therefore wraps `fetchClient` around the real
 * `globalThis.fetch` - a pass-through, so the socket, the body and the headers all stay real -
 * purely to keep a reference to every `Response` alive for the length of the test.
 *
 * **What holding the `Response` leaves is not the cancel alone, and a previous round of this file
 * said it was.** With the body unread, the `Response` held and no cancel anywhere, three things
 * release that socket and only the first of them belongs to this class:
 *
 *   1. the cancel, which releases it promptly - measured at 7-40 ms across the shapes checked
 *      this round, and at 2-17 ms by the rounds that wrote the describes before them;
 *   2. the request's own `AbortSignal.timeout`, which destroys the connection when it fires
 *      whether or not the fetch resolved - measured at 205 ms for a 200 ms signal, 511 ms for a
 *      500 ms one, 1012 ms for a 1000 ms one, and not at all inside 2000 ms for a 30000 ms one;
 *   3. the server's own keep-alive, which closes an idle connection on its own - measured at
 *      6032 ms against Node's default `keepAliveTimeout`.
 *
 * The second and the third are what make a release describe discriminate for a reason that is not
 * this class's, and a comment saying "keep them parked beyond the wait" is the kind of sentence
 * four audit rounds have found stale. The two are not shut out the same way, and this says which
 * is which rather than claiming both. The server's keep-alive is pinned to
 * `SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS`, far above the wait, so the margin is this
 * file's rather than Node's - but it is a margin, it is not switched off, and its own comment
 * carries the measured boundary and says that nothing asserts it. The abort signal is the one
 * that is shut out by something the test does: it is captured off the options the pass-through
 * was handed and asserted **not** to have fired - so a later author who lowers a describe's
 * `requestTimeoutMilliseconds` under the wait gets a red assertion naming the signal, where before
 * the describe went quietly green with the disposal removed. Measured: with the cancel sabotaged
 * and the timeout at 1000 ms the socket is released at 1014 ms and the captured signal reads
 * `aborted: true`; with the timeout at 30000 ms it reads `aborted: false` and nothing is released.
 *
 * What that leaves is the cancel's own promptness, which is asserted only as "inside the wait" and
 * not as a number - a cancel that took 1900 ms would still pass. Nothing measured comes near it:
 * the slowest release this round was 40 ms. Pinning a millisecond figure would be a timing
 * assertion on a shared build host, which is the trade made here knowingly.
 *
 * An eighth describe sits beside the seven and does nothing but check the claim they all rest on -
 * that undici releases nothing of its own inside the wait while the `Response` is held. It takes
 * the cancel out on purpose and asserts the socket is not released. Its red is the signal that the
 * seven have stopped discriminating.
 *
 * Each of those closes its servers before it asserts, not after. A failing assertion ends the test
 * body where it stands, so a `close()` written below the assertions is a listening handle left
 * behind by exactly the run that failed - which is the run under `--detectOpenHandles`.
 */

/*
 * The body a response carries in the describes that watch a connection be released.
 *
 * The size is load-bearing. An empty body arrives complete, so the client can release its
 * connection whether anybody cancelled it or not, and a describe built on one would pass against
 * the defect it exists to catch. A quarter of a megabyte does not fit the buffers between here and
 * there, so the body stays undelivered and the connection stays held - and the cancel is then the
 * only thing that releases it *inside the wait*, the abort signal and the server's keep-alive
 * having been shut out by the two measures the head comment sets out. Without that qualifier the
 * sentence would be the one round five found false.
 *
 * It is no longer only a `3xx` body: the describe that watches a declared size be refused serves
 * the same quarter megabyte behind an honest `content-length`, which is why the name says response
 * rather than redirect.
 */
const LEAKY_RESPONSE_BODY_BYTE_SIZE = 262144

/*
 * How long those describes wait for the server to see its socket go.
 *
 * The wait is bounded rather than open-ended so that a regression fails on the assertion, naming a
 * socket still alive, instead of on a suite timeout naming nothing. With the cancel in place the
 * wait ends in single-figure milliseconds and this figure is never reached; without it - and with
 * the `Response` held, so undici's own finalizer cannot stand in for the cancel - nothing closes
 * the socket and the whole of it is spent. Measured across five runs of each of the two describes
 * an earlier round added: 2-17 ms with the cancel, and nothing at all inside five seconds without
 * it.
 *
 * **This figure has to sit below every path that releases the socket without the cancel, and
 * there are two of them.** Neither is undici's finalizer, which the held `Response` already keeps
 * out. They are the request's own `AbortSignal.timeout` - measured destroying the connection at
 * 205 ms, 511 ms and 1012 ms for 200 ms, 500 ms and 1000 ms signals, to the millisecond, whether
 * or not the fetch resolved - and the server's own keep-alive, measured closing an idle connection
 * at 6032 ms against Node's default. A wait above either would mean the describe could not tell
 * the cancel from that path, and the two couplings are not of the same kind:
 *
 *   2000 ms  <  every release describe's own `requestTimeoutMilliseconds`   -- asserted
 *   the server's keep-alive parked far beyond 2000 ms                       -- not asserted
 *
 * The first cannot be pinned here - it is a `factoryParams` field, and this file already carries
 * describes at 12000 and at 1 - so it is asserted instead: each release describe captures the
 * signal off the options its pass-through was handed and asserts it has not fired. Lowering a
 * timeout under this wait therefore turns the assertion red rather than turning the describe into
 * one that passes with the disposal removed.
 *
 * The second is written as a parking rather than as an inequality on purpose, and
 * `SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS` carries the measurements. `2000 ms < pin` is not
 * the condition: measured, a pin of 2000 releases nothing and a pin of 900 releases inside the
 * wait, so the boundary is undici's own and sits between 900 ms and 1000 ms. Asserting the
 * inequality would therefore go red where the experiment is still sound, which is why nothing
 * asserts it and why this line says so instead of implying it is covered.
 *
 * **Two margins above it, one enforced and one not.** Jest's per-test limit was its 5000 ms
 * default against a body that always spends this 2000 ms, leaving roughly 3000 ms of head-room -
 * and a runner stall past that turned the canary red for a reason that has nothing to do with
 * undici, whose red is documented to mean something else entirely. `jest.config.js` now sets
 * `testTimeout: 15000`, so that margin is a setting rather than a hope; raising it could not
 * break a passing test, and the file says why. The margin still only stated is the wait against
 * the cancel's own promptness, 7-40 ms measured this round, which is where the whole of the
 * separation lives - a cancel that took 1900 ms would pass, and nothing here would say so.
 */
const SOCKET_RELEASE_WAIT_MILLISECONDS = 2000

/*
 * How long the servers in those describes hold an idle connection open before closing it on their
 * own.
 *
 * Node's default `server.keepAliveTimeout` is five seconds, and measured against it a held,
 * uncancelled `Response` had its socket closed by the server at 6032 ms - a release the describes
 * above do not own and would have credited to the cancel had the wait ever reached it. Pinned to
 * a minute, nothing was released inside a 9000 ms wait.
 *
 * **It is a parking and not a switching-off, which an earlier round of this comment claimed it
 * was.** There is no setting that takes the path out of the experiment. Measured, holding an
 * unread `Response` and waiting 9000 ms: at a pin of 60000 nothing was released; at 5000 the
 * socket went at 3011 ms; and at 0 - the value Node documents as disabling the keep-alive - it
 * went at 4026 and 4038 ms across two runs. Zeroing it does not switch the path off, it removes
 * the hint the client keeps its own shorter fallback against, which is worse than the parking.
 * So the lever is how far beyond the wait the path is parked, and a minute is far.
 *
 * **The relation the head comment states is not the relation the path obeys, either.** Measured
 * in the canary's own shape - an oversize body, the cancel sabotaged away, the 2000 ms wait -
 * lowering this pin turns `releasedSockets` non-empty somewhere between 900 ms and 1000 ms: 500,
 * 600, 700, 800 and 900 each released a socket inside the wait; 1000, 2000, 3000 and 60000 each
 * released none. A pin of 2000 is equal to the wait and violates the stated strict inequality,
 * and nothing was released at it. So `wait < pin` is neither necessary nor sufficient here - the
 * boundary belongs to undici's own arithmetic over the server's hint - and asserting the stated
 * inequality would have produced a red at a pin of 1500 that the experiment is still sound at.
 * That is why no assertion was added for it, and it is what leaves this figure guarded by nothing
 * but its distance: an edit lowering it to anything at or above a second would be caught nowhere,
 * and the canary, which is what catches the rest, reports it as news about undici.
 */
const SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS = 60000

/*
 * The body the describe that watches a body abandoned mid-read is served.
 *
 * Three things about it are load-bearing, and none of them is the number itself.
 *
 * It is served with **no `content-length`**, so the declared-size refusal cannot reach it and the
 * read is the only thing that can stop it. That is the branch this body exists to drive - the
 * seventh disposal site, in `#readBoundedStreamBytes()`, which the six describes before it never
 * touched because every one of them refuses before a byte of body is read.
 *
 * It is **never ended**: the handler writes and does not call `response.end()`. A body that
 * arrives complete lets the client release its connection whether anybody cancelled or not, which
 * is the same reason the constant above is a quarter of a megabyte rather than empty. Here the
 * write stalls in backpressure with the socket open, so the only thing that closes it inside the
 * wait is the cancel.
 *
 * It is **thirteen megabytes**, which is past the ten-megabyte per-file cap, so the shape is the
 * production one rather than a contrivance: any object over the cap served with chunked transfer
 * encoding reaches this branch, and that needs no dishonest host - only one that does not know the
 * length up front, which is what chunked encoding is for.
 */
const CHUNKED_RESPONSE_BODY_BYTE_SIZE = 13631488

describe('MediaFetchClient', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#allowedHosts', () => {
        const cases = [
          {
            params: {
              allowedHosts: [
                'files.client.example',
              ],
              requestTimeoutMilliseconds: 30000,
              maximumRedirectCount: 3,
              maximumReadByteSize: 10485760,
              maximumReadChunkCount: 65536,
            },
            expected: [
              'files.client.example',
            ],
          },
          {
            params: {
              allowedHosts: [
                'storage.alpha.example',
                'storage.beta.example',
              ],
              requestTimeoutMilliseconds: 12000,
              maximumRedirectCount: 1,
              maximumReadByteSize: 2048,
              maximumReadChunkCount: 1024,
            },
            expected: [
              'storage.alpha.example',
              'storage.beta.example',
            ],
          },
        ]

        test.each(cases)('allowedHosts: $params.allowedHosts', ({
          params,
          expected,
        }) => {
          const client = new MediaFetchClient(params)

          expect(client)
            .toHaveProperty('allowedHosts', expected)
        })
      })

      describe('#requestTimeoutMilliseconds', () => {
        const cases = [
          {
            params: {
              allowedHosts: [
                'files.client.example',
              ],
              requestTimeoutMilliseconds: 30000,
              maximumRedirectCount: 3,
              maximumReadByteSize: 10485760,
              maximumReadChunkCount: 65536,
            },
            expected: 30000,
          },
          {
            params: {
              allowedHosts: [
                'storage.alpha.example',
              ],
              requestTimeoutMilliseconds: 12000,
              maximumRedirectCount: 1,
              maximumReadByteSize: 2048,
              maximumReadChunkCount: 1024,
            },
            expected: 12000,
          },
        ]

        test.each(cases)('requestTimeoutMilliseconds: $params.requestTimeoutMilliseconds', ({
          params,
          expected,
        }) => {
          const client = new MediaFetchClient(params)

          expect(client)
            .toHaveProperty('requestTimeoutMilliseconds', expected)
        })
      })

      describe('#maximumRedirectCount', () => {
        const cases = [
          {
            params: {
              allowedHosts: [
                'files.client.example',
              ],
              requestTimeoutMilliseconds: 30000,
              maximumRedirectCount: 3,
              maximumReadByteSize: 10485760,
              maximumReadChunkCount: 65536,
            },
            expected: 3,
          },
          {
            params: {
              allowedHosts: [
                'storage.alpha.example',
              ],
              requestTimeoutMilliseconds: 12000,
              maximumRedirectCount: 0,
              maximumReadByteSize: 2048,
              maximumReadChunkCount: 1024,
            },
            expected: 0,
          },
        ]

        test.each(cases)('maximumRedirectCount: $params.maximumRedirectCount', ({
          params,
          expected,
        }) => {
          const client = new MediaFetchClient(params)

          expect(client)
            .toHaveProperty('maximumRedirectCount', expected)
        })
      })

      describe('#maximumReadByteSize', () => {
        const cases = [
          {
            params: {
              allowedHosts: [
                'files.client.example',
              ],
              requestTimeoutMilliseconds: 30000,
              maximumRedirectCount: 3,
              maximumReadByteSize: 10485760,
              maximumReadChunkCount: 65536,
            },
            expected: 10485760,
          },
          {
            params: {
              allowedHosts: [
                'storage.alpha.example',
              ],
              requestTimeoutMilliseconds: 12000,
              maximumRedirectCount: 1,
              maximumReadByteSize: 2048,
              maximumReadChunkCount: 1024,
            },
            expected: 2048,
          },
        ]

        test.each(cases)('maximumReadByteSize: $params.maximumReadByteSize', ({
          params,
          expected,
        }) => {
          const client = new MediaFetchClient(params)

          expect(client)
            .toHaveProperty('maximumReadByteSize', expected)
        })
      })

      describe('#maximumReadChunkCount', () => {
        const cases = [
          {
            params: {
              allowedHosts: [
                'files.client.example',
              ],
              requestTimeoutMilliseconds: 30000,
              maximumRedirectCount: 3,
              maximumReadByteSize: 10485760,
              maximumReadChunkCount: 65536,
            },
            expected: 65536,
          },
          {
            params: {
              allowedHosts: [
                'storage.alpha.example',
              ],
              requestTimeoutMilliseconds: 12000,
              maximumRedirectCount: 1,
              maximumReadByteSize: 2048,
              maximumReadChunkCount: 1024,
            },
            expected: 1024,
          },
        ]

        test.each(cases)('maximumReadChunkCount: $params.maximumReadChunkCount', ({
          params,
          expected,
        }) => {
          const client = new MediaFetchClient(params)

          expect(client)
            .toHaveProperty('maximumReadChunkCount', expected)
        })
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
        },
        {
          params: {
            allowedHosts: [
              'storage.alpha.example',
            ],
            requestTimeoutMilliseconds: 12000,
          },
        },
      ]

      test.each(cases)('allowedHosts: $params.allowedHosts', ({
        params,
      }) => {
        const actual = MediaFetchClient.create(params)

        expect(actual)
          .toBeInstanceOf(MediaFetchClient)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumRedirectCount: 3,
            maximumReadByteSize: 10485760,
            maximumReadChunkCount: 65536,
          },
          expected: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumRedirectCount: 3,
            maximumReadByteSize: 10485760,
            maximumReadChunkCount: 65536,
          },
        },
        {
          params: {
            allowedHosts: [
              'storage.alpha.example',
            ],
            requestTimeoutMilliseconds: 12000,
            maximumRedirectCount: 1,
            maximumReadByteSize: 2048,
            maximumReadChunkCount: 1024,
          },
          expected: {
            allowedHosts: [
              'storage.alpha.example',
            ],
            requestTimeoutMilliseconds: 12000,
            maximumRedirectCount: 1,
            maximumReadByteSize: 2048,
            maximumReadChunkCount: 1024,
          },
        },
      ]

      test.each(cases)('allowedHosts: $params.allowedHosts', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(MediaFetchClient)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should use default allowedHosts value', () => {
      test('read from the environment', () => {
        const SpyClass = constructorSpy.spyOn(MediaFetchClient)
        const buildAllowedHostsSpy = jest.spyOn(MediaFetchClient, 'buildAllowedHosts')
          .mockReturnValue([
            'declared.client.example',
          ])
        const expected = {
          allowedHosts: [
            'declared.client.example',
          ],
          requestTimeoutMilliseconds: 30000,
          maximumRedirectCount: 3,
          maximumReadByteSize: 10485760,
          maximumReadChunkCount: 65536,
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
        expect(buildAllowedHostsSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default requestTimeoutMilliseconds value', () => {
      test('with the hosts stated', () => {
        const client = MediaFetchClient.create({
          allowedHosts: [
            'files.client.example',
          ],
        })

        expect(client)
          .toHaveProperty('requestTimeoutMilliseconds', 30000)
      })
    })

    describe('should use default maximumRedirectCount value', () => {
      test('with the hosts stated', () => {
        const client = MediaFetchClient.create({
          allowedHosts: [
            'files.client.example',
          ],
        })

        expect(client)
          .toHaveProperty('maximumRedirectCount', 3)
      })
    })

    describe('should use default maximumReadByteSize value', () => {
      /*
       * The per-file cap of the non-functional section, borrowed as the bound on the read. It is
       * the same figure AiRunMediaLimitInspector holds, and stating it here is what would fail if
       * the two ever parted company without anybody saying so.
       */
      test('with the hosts stated', () => {
        const client = MediaFetchClient.create({
          allowedHosts: [
            'files.client.example',
          ],
        })

        expect(client)
          .toHaveProperty('maximumReadByteSize', 10485760)
      })
    })

    describe('should use default maximumReadChunkCount value', () => {
      /*
       * The second of the two bounds on the read. The byte bound cannot see the cost of a body
       * framed a byte at a time - ten megabytes arriving that way is ten million objects inside a
       * bound that sees ten megabytes and is content - so the count is bounded too, and the figure
       * is stated here because it is the one a deployment would have to argue with.
       */
      test('with the hosts stated', () => {
        const client = MediaFetchClient.create({
          allowedHosts: [
            'files.client.example',
          ],
        })

        expect(client)
          .toHaveProperty('maximumReadChunkCount', 65536)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('.buildAllowedHosts()', () => {
    /*
     * The key is read through the `env` getter, so the environment of the machine running the suite
     * never decides the answer. A key nobody declared reaches the facade as null, which is the
     * first case below - and it builds an empty allow-list, which refuses everything.
     */
    describe('should build the hosts the environment declares', () => {
      const cases = [
        {
          params: {
            declaredHosts: null,
          },
          expected: [],
          label: 'a key nobody declared',
        },
        {
          params: {
            declaredHosts: '',
          },
          expected: [],
          label: 'a key declared empty',
        },
        {
          params: {
            declaredHosts: 'files.client.example',
          },
          expected: [
            'files.client.example',
          ],
          label: 'one host',
        },
        {
          params: {
            declaredHosts: 'storage.alpha.example,storage.beta.example',
          },
          expected: [
            'storage.alpha.example',
            'storage.beta.example',
          ],
          label: 'two hosts',
        },
        {
          params: {
            declaredHosts: ' storage.alpha.example , storage.beta.example ,',
          },
          expected: [
            'storage.alpha.example',
            'storage.beta.example',
          ],
          label: 'spaces around the entries and a trailing comma',
        },
        {
          params: {
            declaredHosts: 'Storage.ALPHA.Example',
          },
          expected: [
            'storage.alpha.example',
          ],
          label: 'an entry written in mixed case',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        jest.spyOn(MediaFetchClient, 'env', 'get')
          .mockReturnValue(/** @type {*} */ ({
            MEDIA_FETCH_ALLOWED_HOSTS: params.declaredHosts,
          }))

        const actual = MediaFetchClient.buildAllowedHosts()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#isFetchableUrl()', () => {
    describe('should accept a URL on the allow-list', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://FILES.CLIENT.EXAMPLE/photos/living-room.png',
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example:8443/photos/floor-plan.webp',
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              'localhost',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'http://localhost:9000/photos/balcony-view.jpg',
          },
        },
      ]

      test.each(cases)('url: $params.url', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.isFetchableUrl(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * Every entry here reached a fetch before the guard existed, or would have.
     *
     * The credentials case is the one worth reading twice: `https://files.client.example@evil.example/`
     * has `evil.example` as its host, and a comparison made against the text of the URL rather than
     * against the parsed hostname says it is on the list.
     */
    describe('should refuse a URL that is not on the allow-list', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://evil.example/photos/front-elevation.jpg',
          },
          label: 'another host entirely',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example@evil.example/photos/front-elevation.jpg',
          },
          label: 'the allowed host written as credentials before another one',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example.evil.example/photo.jpg',
          },
          label: 'the allowed host as a label of a longer name',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'file:///etc/passwd',
          },
          label: 'a scheme that reads this machine rather than a remote host',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'data:image/jpeg;base64,MTIz',
          },
          label: 'a scheme carrying the bytes inside the URL itself',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'files.client.example/photo.jpg',
          },
          label: 'a host with no scheme at all, which parses as no URL',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photo.jpg',
          },
          label: 'an allow-list nobody declared, which refuses everything',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: null,
          },
          label: 'null, which a purged request body leaves behind',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 12345,
          },
          label: 'a number',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.isFetchableUrl(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#extractFetchableHost()', () => {
    describe('should extract the host a URL names', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          expected: 'files.client.example',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'http://STORAGE.Beta.Example:9000/photo.png',
          },
          expected: 'storage.beta.example',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example@evil.example/photo.jpg',
          },
          expected: 'evil.example',
        },
      ]

      test.each(cases)('url: $params.url', ({
        factoryParams,
        params,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractFetchableHost(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null when the value names no fetchable host', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'file:///etc/passwd',
          },
          label: 'a scheme that is not fetched over',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'not a url at all',
          },
          label: 'text that is no URL',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: null,
          },
          label: 'null',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractFetchableHost(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The first acceptance criterion: the host is refused, and nothing is fetched. The spy standing
     * in for the network is asserted as not called, because an outcome carrying the right reason
     * code says nothing about whether a connection was opened on the way to it.
     */
    describe('should refuse a host off the allow-list without fetching', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://evil.example/photos/front-elevation.jpg',
          },
          expected: {
            bytes: null,
            byteSize: null,
            mimeType: null,
            failureReasonCode: 'MEDIA_FETCH_FAILED',
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'file:///etc/passwd',
          },
          expected: {
            bytes: null,
            byteSize: null,
            mimeType: null,
            failureReasonCode: 'MEDIA_FETCH_FAILED',
          },
        },
      ]

      test.each(cases)('url: $params.url', async ({
        factoryParams,
        params,
        expected,
      }) => {
        const fetchFunction = jest.fn()

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium(params)

        expect(actual)
          .toEqual(expected)
        expect(fetchFunction)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    describe('should answer the file it fetched', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          mockResponseBody: 'front-elevation-bytes',
          mockResponseMimeType: 'image/jpeg',
          expected: {
            bytes: Buffer.from('front-elevation-bytes'),
            byteSize: 21,
            mimeType: 'image/jpeg',
            failureReasonCode: null,
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              'storage.beta.example',
            ],
            requestTimeoutMilliseconds: 12000,
          },
          params: {
            url: 'https://storage.beta.example/photos/kitchen.png',
          },
          mockResponseBody: 'kitchen-counter-png',
          mockResponseMimeType: 'image/png',
          expected: {
            bytes: Buffer.from('kitchen-counter-png'),
            byteSize: 19,
            mimeType: 'image/png',
            failureReasonCode: null,
          },
        },
      ]

      test.each(cases)('url: $params.url', async ({
        factoryParams,
        params,
        mockResponseBody,
        mockResponseMimeType,
        expected,
      }) => {
        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(mockResponseBody, {
            status: 200,
            headers: {
              'content-type': mockResponseMimeType,
            },
          }))

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The fourth criterion's first half: a file that could not be fetched at all. A connection that
     * failed and a status the server answered with are both this, and neither is
     * `MEDIA_UNREADABLE` - nothing of the file arrived, so there was nothing to read.
     */
    describe('should fail under MEDIA_FETCH_FAILED when nothing was fetched', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/gone.jpg',
          },
          mockResponseStatus: 404,
          label: 'a status saying the file is not there',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/broken-storage.jpg',
          },
          mockResponseStatus: 503,
          label: 'a storage answering that it is unavailable',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        params,
        mockResponseStatus,
      }) => {
        const expected = {
          bytes: null,
          byteSize: null,
          mimeType: null,
          failureReasonCode: 'MEDIA_FETCH_FAILED',
        }

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response('not the file', {
            status: mockResponseStatus,
          }))

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    describe('should fail under MEDIA_FETCH_FAILED when the request itself failed', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/unreachable.jpg',
          },
          mockFetchFailure: new TypeError('fetch failed'),
          label: 'a connection that could not be made',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 1,
          },
          params: {
            url: 'https://files.client.example/photos/slow.jpg',
          },
          mockFetchFailure: new Error('The operation was aborted due to timeout'),
          label: 'a request that ran past its time limit',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        params,
        mockFetchFailure,
      }) => {
        const expected = {
          bytes: null,
          byteSize: null,
          mimeType: null,
          failureReasonCode: 'MEDIA_FETCH_FAILED',
        }

        const fetchFunction = jest.fn()
          .mockRejectedValue(mockFetchFailure)

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium(params)

        expect(actual)
          .toEqual(expected)
        expect(fetchFunction)
          .toHaveBeenCalledWith(params.url, expect.objectContaining({
            signal: expect.any(AbortSignal),
          }))
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The fourth criterion's second half: fetched, and nothing could be read from it. The request
     * succeeded and the server answered `200`, which is what makes this a different row on
     * `ai_run_media` - `fetched_at` set, `is_readable` false - and a different code to the caller.
     */
    describe('should fail under MEDIA_UNREADABLE when what was fetched carries nothing', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/truncated.jpg',
          },
          mockResponseMimeType: 'image/jpeg',
          label: 'a body of no bytes at all',
        },
        {
          factoryParams: {
            allowedHosts: [
              'storage.beta.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://storage.beta.example/photos/empty-object.png',
          },
          mockResponseMimeType: 'image/png',
          label: 'an object that exists and holds nothing',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        params,
        mockResponseMimeType,
      }) => {
        const expected = {
          bytes: null,
          byteSize: null,
          mimeType: null,
          failureReasonCode: 'MEDIA_UNREADABLE',
        }

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response('', {
            status: 200,
            headers: {
              'content-type': mockResponseMimeType,
            },
          }))

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#readResponseBytes()', () => {
    describe('should read the bytes of a fetched file', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'rooftop-terrace-bytes',
          expected: Buffer.from('rooftop-terrace-bytes'),
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'storage-room-bytes',
          expected: Buffer.from('storage-room-bytes'),
        },
      ]

      test.each(cases)('mockResponseBody: $mockResponseBody', async ({
        factoryParams,
        mockResponseBody,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.readResponseBytes({
          response: new Response(mockResponseBody),
        })

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * A body that throws while it is being read is the case a real truncated transfer leaves, and
     * the only way to reach it is a response whose body read rejects. The stub carries the one
     * member this method touches - the stream, and the reader it hands out - and nothing else.
     */
    describe('should answer null when the body could not be read', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponse: {
            ok: true,
            body: {
              getReader: () => ({
                read: () => Promise.reject(new TypeError('terminated')),
                cancel: () => Promise.resolve(),
              }),
            },
          },
          label: 'a transfer that ended part way through',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponse: {
            ok: true,
            body: {
              getReader: () => ({
                read: () => Promise.reject(new Error('stream closed')),
                cancel: () => Promise.resolve(),
              }),
            },
          },
          label: 'a stream closed under the read',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponse: {
            ok: true,
            body: null,
          },
          label: 'a response carrying no body at all',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        mockResponse,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.readResponseBytes({
          response: /** @type {*} */ (mockResponse),
        })

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#readResponseBytes()', () => {
    /*
     * The bound on the read, at the boundary rather than by example.
     *
     * A body of exactly the bound is read, and a body of one byte past it is not - and the second
     * of those is the case the old implementation could not have: `response.arrayBuffer()` had the
     * whole of the body in memory before any size was anybody's to judge. The bodies here are real
     * `Response` bodies, so the stream being read is the one a fetch would hand over.
     */
    describe('should answer null for a body past the bound', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 8,
          },
          mockResponseBody: 'nine-byte',
          label: 'one byte past a bound of eight',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 4,
          },
          mockResponseBody: 'far more than four bytes of body',
          label: 'many times a bound of four',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        mockResponseBody,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.readResponseBytes({
          response: new Response(mockResponseBody),
        })

        expect(actual)
          .toBeNull()
      })
    })

    describe('should read a body up to the bound', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 8,
          },
          mockResponseBody: 'exactly8',
          expected: Buffer.from('exactly8'),
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 64,
          },
          mockResponseBody: 'well inside the bound',
          expected: Buffer.from('well inside the bound'),
        },
      ]

      test.each(cases)('mockResponseBody: $mockResponseBody', async ({
        factoryParams,
        mockResponseBody,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.readResponseBytes({
          response: new Response(mockResponseBody),
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#hasFetchedResponse()', () => {
    describe('should accept a response the file arrived in', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 200,
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 206,
        },
      ]

      test.each(cases)('mockResponseStatus: $mockResponseStatus', ({
        factoryParams,
        mockResponseStatus,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.hasFetchedResponse({
          response: new Response('bytes', {
            status: mockResponseStatus,
          }),
        })

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse a response the file did not arrive in', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 403,
          label: 'a storage refusing the read',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 404,
          label: 'a file that is not there',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 500,
          label: 'a storage that failed',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        mockResponseStatus,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.hasFetchedResponse({
          response: new Response('not the file', {
            status: mockResponseStatus,
          }),
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#hasFetchedResponse()', () => {
    describe('should refuse a request that produced no response', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            response: null,
          },
        },
      ]

      test.each(cases)('response: $params.response', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.hasFetchedResponse(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#hasReadableBytes()', () => {
    describe('should accept bytes there is something to read in', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            bytes: Buffer.from('one-byte-short-of-nothing'),
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            bytes: Buffer.from('x'),
          },
        },
      ]

      test.each(cases)('bytes: $params.bytes', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.hasReadableBytes(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse bytes there is nothing to read in', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            bytes: Buffer.alloc(0),
          },
          label: 'a body of zero bytes',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            bytes: null,
          },
          label: 'a body that could not be read at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.hasReadableBytes(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#extractResponseMimeType()', () => {
    describe('should extract the media type the response declared', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseMimeType: 'image/jpeg',
          expected: 'image/jpeg',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseMimeType: 'image/webp',
          expected: 'image/webp',
        },
      ]

      test.each(cases)('mockResponseMimeType: $mockResponseMimeType', ({
        factoryParams,
        mockResponseMimeType,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractResponseMimeType({
          response: new Response('bytes', {
            headers: {
              'content-type': mockResponseMimeType,
            },
          }),
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#buildFetchOptions()', () => {
    describe('should build the time limit one fetch is sent under', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 12000,
          },
        },
      ]

      test.each(cases)('requestTimeoutMilliseconds: $factoryParams.requestTimeoutMilliseconds', ({
        factoryParams,
      }) => {
        const timeoutSignal = AbortSignal.timeout(factoryParams.requestTimeoutMilliseconds)
        const timeoutFunction = jest.fn()
          .mockReturnValue(timeoutSignal)
        const expected = {
          signal: timeoutSignal,
          redirect: 'manual',
        }

        jest.spyOn(MediaFetchClient, 'AbortSignalCtor', 'get')
          .mockReturnValue(/** @type {*} */ ({
            timeout: timeoutFunction,
          }))

        const client = MediaFetchClient.create(factoryParams)

        const actual = client.buildFetchOptions()

        expect(actual)
          .toEqual(expected)
        expect(timeoutFunction)
          .toHaveBeenCalledWith(factoryParams.requestTimeoutMilliseconds)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#extractErrorName()', () => {
    describe('should extract the class a failure came back as', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            error: new TypeError('fetch failed'),
          },
          expected: 'TypeError',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            error: new RangeError('out of range'),
          },
          expected: 'RangeError',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            error: null,
          },
          expected: 'Error',
        },
      ]

      test.each(cases)('error: $params.error', ({
        factoryParams,
        params,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractErrorName(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#buildFetchedOutcome()', () => {
    describe('should build the outcome of a fetch that produced a file', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            bytes: Buffer.from('front-elevation-bytes'),
            mimeType: 'image/jpeg',
          },
          expected: {
            bytes: Buffer.from('front-elevation-bytes'),
            byteSize: 21,
            mimeType: 'image/jpeg',
            failureReasonCode: null,
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            bytes: Buffer.from('floor-plan'),
            mimeType: null,
          },
          expected: {
            bytes: Buffer.from('floor-plan'),
            byteSize: 10,
            mimeType: null,
            failureReasonCode: null,
          },
        },
      ]

      test.each(cases)('mimeType: $params.mimeType', ({
        factoryParams,
        params,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.buildFetchedOutcome(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#buildFailedFetchOutcome()', () => {
    describe('should build the outcome of a fetch that produced nothing', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            failureReasonCode: 'MEDIA_FETCH_FAILED',
          },
          expected: {
            bytes: null,
            byteSize: null,
            mimeType: null,
            failureReasonCode: 'MEDIA_FETCH_FAILED',
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            failureReasonCode: 'MEDIA_UNREADABLE',
          },
          expected: {
            bytes: null,
            byteSize: null,
            mimeType: null,
            failureReasonCode: 'MEDIA_UNREADABLE',
          },
        },
      ]

      test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
        factoryParams,
        params,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.buildFailedFetchOutcome(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The first acceptance criterion, asked of a hop that is not the first.
     *
     * The network is real here and the redirect is a real one, because the thing being tested is
     * partly `fetch`'s own behavior: left to itself it follows up to twenty hops and answers with
     * the last, and a stubbed fetch would never have shown that. Two loopback servers stand in for
     * the two hosts - the allow-listed one answers `302` to the other, and the other counts every
     * request it is asked for. The count is the assertion that matters: an outcome carrying the
     * right reason code says nothing about whether the refused host was contacted on the way to it.
     *
     * The allow-list holds `127.0.0.1` and the redirect names the same machine by another name, so
     * the refusal is the allow-list's rather than the network's - the second server is listening,
     * and would answer.
     */
    describe('should refuse a redirect to a host off the allow-list without fetching it', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockRedirectHost: 'localhost',
          expected: {
            bytes: null,
            byteSize: null,
            mimeType: null,
            failureReasonCode: 'MEDIA_FETCH_FAILED',
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockRedirectHost: '[::1]',
          expected: {
            bytes: null,
            byteSize: null,
            mimeType: null,
            failureReasonCode: 'MEDIA_FETCH_FAILED',
          },
        },
      ]

      test.each(cases)('mockRedirectHost: $mockRedirectHost', async ({
        factoryParams,
        mockRedirectHost,
        expected,
      }) => {
        const refusedHostRequestPaths = []
        const refusedHostServer = http.createServer((request, response) => {
          refusedHostRequestPaths.push(request.url)

          response.writeHead(200, {
            'content-type': 'image/jpeg',
          })
          response.end('loot-bytes')
        })

        await new Promise(resolve => {
          refusedHostServer.listen(0, '127.0.0.1', resolve)
        })

        const redirectingServer = http.createServer((request, response) => {
          const redirectedUrlText = `http://${mockRedirectHost}:${refusedHostServer.address().port}/loot`

          response.writeHead(302, {
            location: redirectedUrlText,
          })
          response.end()
        })

        await new Promise(resolve => {
          redirectingServer.listen(0, '127.0.0.1', resolve)
        })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${redirectingServer.address().port}/photos/front-elevation.jpg`,
        })

        redirectingServer.closeAllConnections()
        redirectingServer.close()
        refusedHostServer.closeAllConnections()
        refusedHostServer.close()

        expect(actual)
          .toEqual(expected)
        expect(refusedHostRequestPaths)
          .toHaveLength(0)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The other half of the decision: a redirect to a host the list holds is followed, because a
     * pre-signed URL fronting a redirector is how object storage ordinarily serves a private
     * object. Refusing every redirect would have been simpler and would have refused this.
     */
    describe('should follow a redirect to a host the allow-list holds', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'front-elevation-bytes',
          expected: {
            bytes: Buffer.from('front-elevation-bytes'),
            byteSize: 21,
            mimeType: 'image/jpeg',
            failureReasonCode: null,
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'kitchen-counter-png',
          expected: {
            bytes: Buffer.from('kitchen-counter-png'),
            byteSize: 19,
            mimeType: 'image/jpeg',
            failureReasonCode: null,
          },
        },
      ]

      test.each(cases)('mockResponseBody: $mockResponseBody', async ({
        factoryParams,
        mockResponseBody,
        expected,
      }) => {
        const objectServer = http.createServer((request, response) => {
          response.writeHead(200, {
            'content-type': 'image/jpeg',
          })
          response.end(mockResponseBody)
        })

        await new Promise(resolve => {
          objectServer.listen(0, '127.0.0.1', resolve)
        })

        const redirectingServer = http.createServer((request, response) => {
          const redirectedUrlText = `http://127.0.0.1:${objectServer.address().port}/object`

          response.writeHead(302, {
            location: redirectedUrlText,
          })
          response.end()
        })

        await new Promise(resolve => {
          redirectingServer.listen(0, '127.0.0.1', resolve)
        })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${redirectingServer.address().port}/photos/front-elevation.jpg`,
        })

        redirectingServer.closeAllConnections()
        redirectingServer.close()
        objectServer.closeAllConnections()
        objectServer.close()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * A host on the list redirecting to itself for ever is still a host on the list, so the
     * allow-list cannot end this one - the hop count does. The paths the server was asked for are
     * what say where it ended: the first fetch plus one per hop allowed, in order.
     *
     * The requests are collected into an array rather than counted on a `jest.fn()`, so the
     * assertion is `toHaveLength()` and `toEqual()` over the paths - which pins the order of the
     * chain as well as its length, and stays inside the matchers this repository allows.
     */
    describe('should give up a chain longer than the hops allowed', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumRedirectCount: 0,
          },
          expected: [
            '/photos/looping.jpg',
          ],
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumRedirectCount: 2,
          },
          expected: [
            '/photos/looping.jpg',
            '/again',
            '/again',
          ],
        },
      ]

      test.each(cases)('maximumRedirectCount: $factoryParams.maximumRedirectCount', async ({
        factoryParams,
        expected,
      }) => {
        const hopRequestPaths = []
        const loopingServer = http.createServer((request, response) => {
          hopRequestPaths.push(request.url)

          response.writeHead(302, {
            location: '/again',
          })
          response.end()
        })

        await new Promise(resolve => {
          loopingServer.listen(0, '127.0.0.1', resolve)
        })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${loopingServer.address().port}/photos/looping.jpg`,
        })

        loopingServer.closeAllConnections()
        loopingServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_FETCH_FAILED')
        expect(hopRequestPaths)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The cap used to be a cap on the caller's honesty: the declared size was checked before the
     * fetch, and the body was then read whole whatever it turned out to be. Here the client is
     * given a bound of a few bytes and a host serving far more, and answers MEDIA_UNREADABLE - it
     * fetched the file and declined to read it whole, which is what the code means here.
     */
    describe('should fail under MEDIA_UNREADABLE for a body past the bound', () => {
      const cases = [
        {
          /*
           * The audited case exactly: a size of one declared against a host sending far more. The
           * declared size passes every check made of it, which is the point - what stops this one
           * is the read, and nothing did before.
           */
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 8,
          },
          params: {
            url: 'https://files.client.example/photos/under-declared.jpg',
          },
          mockResponseBody: 'far more than eight bytes of body',
          mockContentLength: '1',
          label: 'one byte declared against a body of thirty-three',
        },
        {
          /*
           * The other way round, and it isolates the header: the body is inside the bound, so the
           * read would answer with it. Only the declared size can refuse this one, and refusing it
           * is what stops the sixty-four megabytes an honest host would have sent.
           */
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 8,
          },
          params: {
            url: 'https://files.client.example/photos/declared-large.jpg',
          },
          mockResponseBody: 'tiny',
          mockContentLength: '67108864',
          label: 'sixty-four megabytes declared before a byte is read',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        params,
        mockResponseBody,
        mockContentLength,
      }) => {
        const expected = {
          bytes: null,
          byteSize: null,
          mimeType: null,
          failureReasonCode: 'MEDIA_UNREADABLE',
        }

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(mockResponseBody, {
            status: 200,
            headers: {
              'content-type': 'image/jpeg',
              'content-length': mockContentLength,
            },
          }))

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#extractRedirectedUrl()', () => {
    /*
     * A location is allowed to be relative, and resolving it against the hop it arrived on is what
     * makes the host the allow-list is then asked about the host the request would really go to.
     */
    describe('should build the URL of the next hop', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 302,
          mockLocation: 'https://elsewhere.example/loot',
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          expected: 'https://elsewhere.example/loot',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 301,
          mockLocation: '/objects/1234',
          params: {
            url: 'https://files.client.example/photos/kitchen.png',
          },
          expected: 'https://files.client.example/objects/1234',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 308,
          mockLocation: '//storage.beta.example/moved.jpg',
          params: {
            url: 'https://files.client.example/photos/balcony.jpg',
          },
          expected: 'https://storage.beta.example/moved.jpg',
        },
      ]

      test.each(cases)('mockLocation: $mockLocation', ({
        factoryParams,
        mockResponseStatus,
        mockLocation,
        params,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractRedirectedUrl({
          response: new Response(null, {
            status: mockResponseStatus,
            headers: {
              location: mockLocation,
            },
          }),
          url: params.url,
        })

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null for a response sending the fetch nowhere', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 200,
          mockLocation: 'https://elsewhere.example/loot',
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          label: 'a status that is no redirect, whatever header it carries',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 304,
          mockLocation: 'https://elsewhere.example/loot',
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          label: 'a status inside the three hundreds that names no new URL',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 302,
          mockLocation: 'http://',
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          label: 'a location that resolves to no URL at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        mockResponseStatus,
        mockLocation,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractRedirectedUrl({
          response: new Response(null, {
            status: mockResponseStatus,
            headers: {
              location: mockLocation,
            },
          }),
          url: params.url,
        })

        expect(actual)
          .toBeNull()
      })
    })

    /*
     * A `location` that is present and carries no text. It says the same thing about where the
     * host moved the object to as no header at all, and it did not behave like it: `new URL('',
     * hopUrl)` answers the hop itself, whose host the allow-list has just allowed, so the hop was
     * fetched again until the count ran out.
     *
     * Measured before the guard, over loopback against a `302`: four requests for one photo, every
     * one of them to `/photos/a.jpg`, ending `MEDIA_FETCH_FAILED` where the host had named no
     * destination at all. Measured after it: one request, same code.
     *
     * Every blank spelling arrives here as `''` - measured, the Headers layer answers `''` for a
     * value of three spaces and for a tab, off a socket and in a hand-built `Response` alike - so
     * writing them out as separate cases here would be one case written twice. They are exercised
     * where they are still distinct, on `#isBlankRedirectLocation()`, which is handed the text as
     * given.
     */
    describe('should answer null when the location carries no text', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 302,
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 307,
          params: {
            url: 'https://files.client.example/photos/kitchen.png',
          },
        },
      ]

      test.each(cases)('mockResponseStatus: $mockResponseStatus', ({
        factoryParams,
        mockResponseStatus,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractRedirectedUrl({
          response: new Response(null, {
            status: mockResponseStatus,
            headers: {
              location: '',
            },
          }),
          url: params.url,
        })

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#isBlankRedirectLocation()', () => {
    /*
     * The spellings of "nowhere" a header can arrive in. Over a socket the Headers layer will have
     * trimmed most of them to `''` already; this method is what makes the answer the same whether
     * or not some layer did that first, so it is handed each spelling as written.
     *
     * **The last case is refused here and would not have resolved to nothing**, and it is in this
     * describe rather than the one below because that is what the method answers. `String#trim()`
     * strips Unicode whitespace and `new URL` strips only ASCII, so a lone U+00A0 is text the
     * resolution would have read as a distinct path - measured, `new URL` answers `.../%C2%A0` -
     * while `trim()` reduces it to `''`. The guard is therefore a narrowing of "what resolves to
     * the hop itself" and not an equality with it. The direction is the safe one, a hop refused
     * rather than a hop followed, and this case is what would notice if the trim were swapped for
     * an ASCII-only one and the narrowing quietly went away.
     *
     * It is written as an escape rather than as the character so that nothing here depends on an
     * invisible byte surviving an editor.
     *
     * The title uses `label` because no field path tells these five apart - `$params.location`
     * renders every one of them as blank.
     */
    describe('should answer that the location names nowhere', () => {
      const cases = [
        {
          label: 'empty text',
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: '',
          },
        },
        {
          label: 'spaces',
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: '   ',
          },
        },
        {
          label: 'a tab',
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: '\t',
          },
        },
        {
          label: 'a line break',
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: '\n',
          },
        },
        {
          label: 'a non-breaking space, which would have resolved to a path of its own',
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: '\u00a0',
          },
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.isBlankRedirectLocation(params)

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#isBlankRedirectLocation()', () => {
    /*
     * A location naming somewhere is not this method's to refuse, whatever it names - a host off
     * the allow-list included, which `#isFetchableUrl()` answers for and this does not.
     *
     * The padded case is the one that says the trim decides emptiness rather than trimming the
     * value that is then resolved: `'  /objects/padded  '` is not blank, and what the resolution
     * is handed is still the padded text.
     *
     * The fragment case is the one the guard deliberately lets through. It names the same object
     * again, it is followed, and the hop count is what ends it - measured at four requests under
     * the default of three, both before this guard and after. A same-URL rule here would take away
     * the only thing that count is tested against and leave a two-URL cycle to it anyway, which is
     * the decision the sibling `AiRunCallbackSender` took first and for that reason.
     */
    describe('should answer that the location names somewhere', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: '/objects/1234',
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: '  /objects/padded  ',
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: 'https://elsewhere.example/loot',
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            location: '#fragment-of-the-same-object',
          },
        },
      ]

      test.each(cases)('location: $params.location', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.isBlankRedirectLocation(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * A `302` whose `location` names nowhere is answered as the `302` it was, and costs one
     * request rather than four.
     *
     * The network is real because the header is the thing under test and the Headers layer is part
     * of how it arrives: an empty value, a whitespace-only value and a tab are all `''` by the
     * time `.get()` answers, and that is only true of a value that came off a socket the way these
     * did.
     *
     * Measured before the guard, over exactly this shape: each of the three spent the whole hop
     * count - four requests for one photo, every one of them to `/photos/a.jpg`, because
     * `new URL('', hopUrl)` answers the hop itself and the hop's host is the one the allow-list
     * just allowed. The host named no destination and the code read one out of it. Measured after
     * the guard: one request for each of the three, and the same `MEDIA_FETCH_FAILED` - the `302`
     * is no longer a redirect this class follows, so it falls to the status refusal, which is also
     * the branch that disposes of its body.
     *
     * **The four is the hop count's own bound and not a property of this case.** What this does
     * not cover is a `location` naming the same object outright, or a fragment of it: those name
     * somewhere, they are followed, and only the count ends them. The chain-length describe above
     * measures four against a server answering a growing path, a different URL every hop, so no
     * describe in this file drives a `location` naming the path it arrived on. A same-path
     * short-circuit added to `#extractRedirectedUrl()` later would change that case and leave both
     * describes green.
     */
    describe('should not follow a redirect whose location names nowhere', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          label: 'an empty location header',
          mockRedirectLocation: '',
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          label: 'a location header holding only spaces',
          mockRedirectLocation: '   ',
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          label: 'a location header holding only a tab',
          mockRedirectLocation: '\t',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        mockRedirectLocation,
      }) => {
        const hopRequestPaths = []
        const redirectingServer = http.createServer((request, response) => {
          hopRequestPaths.push(request.url)

          response.writeHead(302, {
            location: mockRedirectLocation,
          })
          response.end('moved nowhere')
        })

        await new Promise(resolve => {
          redirectingServer.listen(0, '127.0.0.1', resolve)
        })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${redirectingServer.address().port}/photos/a.jpg`,
        })

        redirectingServer.closeAllConnections()
        redirectingServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_FETCH_FAILED')
        expect(hopRequestPaths)
          .toEqual([
            '/photos/a.jpg',
          ])
      })
    })
  })
})
describe('MediaFetchClient', () => {
  describe('#isReadableResponseSize()', () => {
    /*
     * The header is the host's claim, and it is read for the case where the host is honest: a
     * declared sixty-four megabytes is sixty-four megabytes never read. A response declaring
     * nothing is accepted here, because "we do not know yet" is not "too large" - the bound on the
     * read is what decides that one, and it has its own cases.
     */
    describe('should refuse a size declared past the bound', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
          mockContentLength: '1025',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
          mockContentLength: '67108864',
        },
      ]

      test.each(cases)('mockContentLength: $mockContentLength', ({
        factoryParams,
        mockContentLength,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.isReadableResponseSize({
          response: new Response('bytes', {
            headers: {
              'content-length': mockContentLength,
            },
          }),
        })

        expect(actual)
          .toBeFalsy()
      })
    })

    describe('should accept a size the bound holds', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
          mockContentLength: '1024',
          label: 'exactly the bound',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
          mockContentLength: '1',
          label: 'well inside the bound',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
          mockContentLength: 'not a number',
          label: 'a header that is no size, which the read then bounds',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        mockContentLength,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.isReadableResponseSize({
          response: new Response('bytes', {
            headers: {
              'content-length': mockContentLength,
            },
          }),
        })

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#extractResponseContentLength()', () => {
    describe('should extract the size a response declared', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockContentLength: '4096',
          expected: 4096,
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockContentLength: '0',
          expected: 0,
        },
      ]

      test.each(cases)('mockContentLength: $mockContentLength', ({
        factoryParams,
        mockContentLength,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractResponseContentLength({
          response: new Response('bytes', {
            headers: {
              'content-length': mockContentLength,
            },
          }),
        })

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null for a header that is no size', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockContentLength: 'unknown',
          label: 'text naming no number',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockContentLength: '-1',
          label: 'a negative size',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockContentLength: '1.5',
          label: 'a size that is not whole',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        mockContentLength,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractResponseContentLength({
          response: new Response('bytes', {
            headers: {
              'content-length': mockContentLength,
            },
          }),
        })

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The connection a followed redirect arrived on, released rather than leaked.
     *
     * This is the cost `redirect: 'manual'` carried in with it. Under `redirect: 'follow'` the
     * client drained a redirect's body itself; asked for the hop by hand, it hands the `3xx` over
     * body and all, and a body neither read nor cancelled is a connection the client cannot give
     * back. A worker following one redirect per medium leaks one socket per medium, until the
     * request's own abort signal destroys it - measured at 1025 ms for a 1000 ms signal and
     * 1511 ms for a 1500 ms one, so thirty seconds at the default, not the life of the daemon.
     * Twelve media per run times the run concurrency times thirty seconds of held descriptors is
     * still a real exhaustion window, which is what this describe is worth; it is not an unbounded
     * one, which an earlier round of this comment claimed.
     *
     * The network is real here because a socket is the only thing that can show it, and the `302`
     * carries a quarter of a megabyte because that is the shape of the defect: an empty `302`
     * arrives complete and leaks nothing, while the body of a `302` is the caller's to make as
     * large as it likes - the object redirecting from is theirs.
     *
     * What is watched is the first connection the redirecting server accepted, which is the one
     * the unread `3xx` came in on. Measured against a client whose cancel was taken out again, it
     * is never released at all; measured against this one, it is released in single-figure
     * milliseconds.
     */
    describe('should release the connection a followed redirect arrived on', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'front-elevation-bytes',
          expected: {
            bytes: Buffer.from('front-elevation-bytes'),
            byteSize: 21,
            mimeType: 'image/jpeg',
            failureReasonCode: null,
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'kitchen-counter-png',
          expected: {
            bytes: Buffer.from('kitchen-counter-png'),
            byteSize: 19,
            mimeType: 'image/jpeg',
            failureReasonCode: null,
          },
        },
      ]

      test.each(cases)('mockResponseBody: $mockResponseBody', async ({
        factoryParams,
        mockResponseBody,
        expected,
      }) => {
        const releasedSockets = []

        const objectServer = http.createServer((request, response) => {
          response.writeHead(200, {
            'content-type': 'image/jpeg',
          })
          response.end(mockResponseBody)
        })

        objectServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

        objectServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        await new Promise(resolve => {
          objectServer.listen(0, '127.0.0.1', resolve)
        })

        const redirectingServer = http.createServer((request, response) => {
          const redirectedUrlText = `http://127.0.0.1:${objectServer.address().port}/object`

          response.writeHead(302, {
            location: redirectedUrlText,
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

        const fetchedResponses = []
        const requestSignals = []

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, fetchOptions) => {
            requestSignals.push(fetchOptions.signal)

            const response = await globalThis.fetch(requestedUrl, fetchOptions)

            fetchedResponses.push(response)

            return response
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${redirectingServer.address().port}/photos/front-elevation.jpg`,
        })

        await Promise.race([
          redirectSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        redirectingServer.closeAllConnections()
        redirectingServer.close()
        objectServer.closeAllConnections()
        objectServer.close()

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

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The same release on the branch that ends a chain instead of continuing it. A host on the
     * list redirecting to itself for ever is refused by the hop count, and the `3xx` it was refused
     * on still has to be disposed of - the audit named this branch beside the recursing one, and it
     * leaked the same way.
     *
     * No hops are allowed at all, so the server sees one connection and the one it sees is the one
     * carrying the `3xx` nobody read.
     */
    describe('should release the connection of a chain it gave up', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumRedirectCount: 0,
          },
          mockLocation: '/again',
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumRedirectCount: 0,
          },
          mockLocation: '/objects/1234',
        },
      ]

      test.each(cases)('mockLocation: $mockLocation', async ({
        factoryParams,
        mockLocation,
      }) => {
        const releasedSockets = []

        const loopingServer = http.createServer((request, response) => {
          response.writeHead(302, {
            location: mockLocation,
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x62))
        })

        loopingServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

        loopingServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const loopingSocketReleased = new Promise(resolve => {
          loopingServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          loopingServer.listen(0, '127.0.0.1', resolve)
        })

        const fetchedResponses = []
        const requestSignals = []

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, fetchOptions) => {
            requestSignals.push(fetchOptions.signal)

            const response = await globalThis.fetch(requestedUrl, fetchOptions)

            fetchedResponses.push(response)

            return response
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${loopingServer.address().port}/photos/looping.jpg`,
        })

        await Promise.race([
          loopingSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        loopingServer.closeAllConnections()
        loopingServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_FETCH_FAILED')
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

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The third `3xx` branch: a hop the allow-list refuses. Nothing is fetched from the host the
     * `location` names - that is the first acceptance criterion and has its own describe above -
     * and the response carrying that `location` is still this client's to dispose of.
     */
    describe('should release the connection of a redirect it refused', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockLocation: 'http://elsewhere.example/loot',
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockLocation: 'http://storage.beta.example/moved.jpg',
        },
      ]

      test.each(cases)('mockLocation: $mockLocation', async ({
        factoryParams,
        mockLocation,
      }) => {
        const releasedSockets = []

        const redirectingServer = http.createServer((request, response) => {
          response.writeHead(302, {
            location: mockLocation,
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x63))
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

        const fetchedResponses = []
        const requestSignals = []

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, fetchOptions) => {
            requestSignals.push(fetchOptions.signal)

            const response = await globalThis.fetch(requestedUrl, fetchOptions)

            fetchedResponses.push(response)

            return response
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${redirectingServer.address().port}/photos/front-elevation.jpg`,
        })

        await Promise.race([
          redirectSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        redirectingServer.closeAllConnections()
        redirectingServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_FETCH_FAILED')
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

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The same defect one level up, and this one is no redirect at all: a status the server
     * answered with is answered away from without its body being read either, and a `404` page of
     * a quarter of a megabyte holds its connection exactly as an unread `302` does. The audit named
     * the redirect branches; this is the branch above them, and closing only what was named would
     * have closed the finding without closing the hole.
     */
    describe('should release the connection of a status it refused', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 404,
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseStatus: 503,
        },
      ]

      test.each(cases)('mockResponseStatus: $mockResponseStatus', async ({
        factoryParams,
        mockResponseStatus,
      }) => {
        const releasedSockets = []

        const refusingServer = http.createServer((request, response) => {
          response.writeHead(mockResponseStatus, {
            'content-type': 'text/html',
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x64))
        })

        refusingServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

        refusingServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const refusedSocketReleased = new Promise(resolve => {
          refusingServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          refusingServer.listen(0, '127.0.0.1', resolve)
        })

        const fetchedResponses = []
        const requestSignals = []

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, fetchOptions) => {
            requestSignals.push(fetchOptions.signal)

            const response = await globalThis.fetch(requestedUrl, fetchOptions)

            fetchedResponses.push(response)

            return response
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${refusingServer.address().port}/photos/missing.jpg`,
        })

        await Promise.race([
          refusedSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        refusingServer.closeAllConnections()
        refusingServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_FETCH_FAILED')
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

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The fifth `3xx` branch, and the one no describe in this file could reach: a hop refused for
     * moving the fetch off `https:`. The describe further down that names that refusal stubs the
     * network with a `Response` built on a `null` body, whose `body` is therefore `null` - so the
     * cancel this branch owes returns at a guard and is never made, and the branch could lose its
     * disposal with the suite still green.
     *
     * **The TLS is in the URL and not on the wire, and that is the whole of the stub.** The class
     * reads the scheme off the URL text it was handed - `#downgradesTransportSecurity()` parses
     * two strings and touches no socket - so a hop is made to arrive "over TLS" by handing the
     * client an `https:` URL and rewriting it back to `http:` inside the fetch function, one line
     * inside a pass-through onto the real `globalThis.fetch`. Everything the branch is about stays
     * real: a real socket, a real `3xx`, a real quarter megabyte nobody read, a real release.
     *
     * What this cannot show is a TLS socket being released, because a loopback server here has no
     * certificate to stand up. Undici releases a TLS socket by the same `destroy`, so the branch
     * is the same one either way - but nothing in this suite demonstrates that, and a regression
     * that released a plaintext socket and held a TLS one would pass here. Standing a certificate
     * up is what would close it.
     *
     * The `location` names the same server, so nothing but the scheme can be what refused it, and
     * the one request the fetch function was handed is the evidence that the hop was never asked
     * for.
     */
    describe('should release the connection a refused downgrade arrived on', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockRedirectStatus: 302,
          mockLocationPath: '/objects/1234',
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          mockRedirectStatus: 307,
          mockLocationPath: '/objects/5678',
        },
      ]

      test.each(cases)('mockLocationPath: $mockLocationPath', async ({
        factoryParams,
        mockRedirectStatus,
        mockLocationPath,
      }) => {
        const releasedSockets = []
        const requestedUrls = []
        const fetchedResponses = []
        const requestSignals = []

        const downgradingServer = http.createServer((request, response) => {
          const downgradingPort = downgradingServer.address().port

          const redirectedUrlText = `http://127.0.0.1:${downgradingPort}${mockLocationPath}`

          response.writeHead(mockRedirectStatus, {
            location: redirectedUrlText,
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x65))
        })

        downgradingServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

        downgradingServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const downgradeSocketReleased = new Promise(resolve => {
          downgradingServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          downgradingServer.listen(0, '127.0.0.1', resolve)
        })

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, fetchOptions) => {
            requestedUrls.push(requestedUrl)
            requestSignals.push(fetchOptions.signal)

            const plainUrl = requestedUrl.replace(/^https:/u, 'http:')

            const response = await globalThis.fetch(plainUrl, fetchOptions)

            fetchedResponses.push(response)

            return response
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `https://127.0.0.1:${downgradingServer.address().port}/photos/front.jpg`,
        })

        await Promise.race([
          downgradeSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        downgradingServer.closeAllConnections()
        downgradingServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_FETCH_FAILED')
        expect(requestedUrls)
          .toHaveLength(1)
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

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The sixth branch, and the one the second audit round dropped: a `content-length` declared
     * past the cap, refused before a byte of the body is read. Its `3xx` siblings above leak one
     * connection per redirect; this one leaks one per over-declared file, which is the branch a
     * caller reaches by pointing at any object bigger than the cap.
     *
     * **It was dropped for a reason that does not hold, and what makes it not hold is the rescuer
     * rather than the timing.** The claim was that undici releases the connection on its own after
     * roughly 650 ms, so no honest test separates fixed from unfixed. What undici does is release
     * when the unread `Response` is finalized - garbage collection, whose timing is arbitrary in
     * both directions. Measured over five runs of the shape below with the cancel taken out and
     * the `Response` let go: released at 20 ms once, at 3107 ms once, and not at all inside five
     * seconds on the other three. A describe resting on that is not slow, it is green either way.
     *
     * Holding the `Response` for the length of the test takes the rescuer out of the experiment.
     * Measured over five runs of exactly the shape below: 2-14 ms with the cancel, and nothing
     * inside five seconds on any run without it. That is a separation rather than a race.
     *
     * The body is complete and its `content-length` is honest - the server declares the quarter
     * megabyte it then sends - so what refuses it is this client's own bound and not a malformed
     * response. The second case sets that bound one byte under the body, which is the boundary the
     * declared-size check is written against.
     */
    describe('should release the connection of a size it refused', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 262143,
          },
        },
      ]

      test.each(cases)('maximumReadByteSize: $factoryParams.maximumReadByteSize', async ({
        factoryParams,
      }) => {
        const releasedSockets = []
        const fetchedResponses = []
        const requestSignals = []

        const oversizeServer = http.createServer((request, response) => {
          response.writeHead(200, {
            'content-type': 'image/jpeg',
            'content-length': String(LEAKY_RESPONSE_BODY_BYTE_SIZE),
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x66))
        })

        oversizeServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

        oversizeServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const oversizeSocketReleased = new Promise(resolve => {
          oversizeServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          oversizeServer.listen(0, '127.0.0.1', resolve)
        })

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, fetchOptions) => {
            requestSignals.push(fetchOptions.signal)

            const response = await globalThis.fetch(requestedUrl, fetchOptions)

            fetchedResponses.push(response)

            return response
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${oversizeServer.address().port}/photos/panorama.jpg`,
        })

        await Promise.race([
          oversizeSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        oversizeServer.closeAllConnections()
        oversizeServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_UNREADABLE')
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

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The seventh disposal branch, and the one that had no describe at all until now.
     *
     * The class comment used to enumerate six disposal branches, say all six were watched over a
     * socket, and frame a seventh as something a later author might add. The seventh already
     * existed. `#cancelBoundedStreamRead()` is reached from `#readBoundedStreamBytes()` when a
     * body runs past `maximumReadByteSize` or `maximumReadChunkCount`, its own comment says
     * "Cancelling the reader is what releases the socket", and nothing in this file asserted that
     * over a socket: its own describes drive it with stub readers, and `#readResponseBytes()`'s
     * bound describes build a synthetic `new Response(text)` that has no socket behind it at all.
     *
     * Measured with the one line taken out - `client.cancelBoundedStreamRead = async () => null` -
     * against the shape below: the outcome stays `MEDIA_UNREADABLE` and `releasedSockets` goes
     * from one to zero, on four runs of each of the two cases. With the cancel in place the socket
     * comes back at 14-40 ms. Nothing else in this file would have caught that removal either -
     * the two `#cancelBoundedStreamRead()` describes drive it directly and assert it answers null,
     * which an emptied method still does, and the bound describes assert the same null - so the
     * branch had no guard at all, which is exactly the condition the six describes above exist to
     * prevent.
     *
     * **It is the most reachable of the seven in production, not the least.** The six above need a
     * redirecting host, a refusing status or a host that declares an honest length past the cap.
     * This one needs only a body that does not fit the bound and a host that does not know its
     * length up front - which is every object over the ten-megabyte cap served with chunked
     * transfer encoding.
     *
     * The two cases drive the two bounds that reach the method, and which of them fires was
     * measured rather than assumed. The first is stopped by the byte bound on its very first
     * frame - `#cancelBoundedStreamRead()` is reached with nothing yet accumulated. The second is
     * stopped by the chunk-count bound on the third frame, with two chunks held and 130906 bytes
     * read, far under its own ten-megabyte byte bound, so it is the count that refuses it and not
     * the size.
     *
     * **That second sentence rests on how undici frames a stalled 13 MB write, which is not this
     * project's to fix.** Were a later undici to hand the body over in one or two much larger
     * frames, the byte bound would refuse the second case before the count bound did. The describe
     * would still pass - same method, same `MEDIA_UNREADABLE`, same released socket - and only the
     * "which bound fired" sentence would be stale, which is why it is written as a measurement
     * with a date's worth of authority rather than as a property of the code. What the case
     * guarantees whatever the framing is that `#cancelBoundedStreamRead()` is reached and the
     * socket comes back.
     *
     * Both answer `MEDIA_UNREADABLE`, which is what the class comment says costs an operator the
     * ability to tell them apart.
     */
    describe('should release the connection of a body it stopped reading', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
            maximumReadChunkCount: 65536,
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 10485760,
            maximumReadChunkCount: 2,
          },
        },
      ]

      test.each(cases)('maximumReadByteSize: $factoryParams.maximumReadByteSize', async ({
        factoryParams,
      }) => {
        const releasedSockets = []
        const fetchedResponses = []
        const requestSignals = []

        const chunkedServer = http.createServer((request, response) => {
          response.writeHead(200, {
            'content-type': 'image/jpeg',
          })
          response.write(Buffer.alloc(CHUNKED_RESPONSE_BODY_BYTE_SIZE, 0x68))
        })

        chunkedServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

        chunkedServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const chunkedSocketReleased = new Promise(resolve => {
          chunkedServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          chunkedServer.listen(0, '127.0.0.1', resolve)
        })

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, fetchOptions) => {
            requestSignals.push(fetchOptions.signal)

            const response = await globalThis.fetch(requestedUrl, fetchOptions)

            fetchedResponses.push(response)

            return response
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${chunkedServer.address().port}/photos/chunked.jpg`,
        })

        await Promise.race([
          chunkedSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        chunkedServer.closeAllConnections()
        chunkedServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_UNREADABLE')
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

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * A canary on undici rather than on this class, and the only thing standing between the seven
     * release describes above and their going quietly green-either-way.
     *
     * Every one of those seven rests on a property of a package this project did not write: while
     * the unread `Response` is strongly referenced, undici releases the connection of its own
     * accord at no point inside the wait. **That is narrower than the sentence an earlier round of
     * this file wrote here, which said undici released on the cancel and on nothing else, and that
     * sentence was false.** Two further paths release the socket without any cancel, and both
     * belong to the shape of the test rather than to undici: the request's own
     * `AbortSignal.timeout`, measured destroying the connection at 1012 ms for a 1000 ms signal,
     * and the server's keep-alive, measured at 6032 ms against Node's default. Neither is left to
     * a margin any more - the server's is pinned by
     * `SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS` and the signal is asserted not to have
     * fired - so what is left for this canary to watch really is undici alone.
     *
     * Measured today it holds - across fifteen runs of three shapes, a client whose cancel had
     * been taken out never released the socket inside five seconds, while the same shapes with the
     * `Response` let go released at 20 ms once and at 3107 ms once, which is the finalizer this
     * reference is here to keep out. If a later undici releases on a timer instead, or keeps a
     * strong reference of its own, all seven above would pass with the cancel removed and nothing
     * in this file would say so.
     *
     * So this one takes the cancel out on purpose and asserts the socket is **not** released. It
     * is the one describe here whose red is good news: red means the seven above have stopped
     * discriminating and their shape needs rewriting, not that this class regressed.
     *
     * **Its red has one other cause, and it is not undici.** This body always spends the whole
     * 2000 ms wait, so a runner stall on top of that can time the test out for a reason that has
     * nothing to do with what it watches. `jest.config.js` sets `testTimeout: 15000` and says at
     * its own line why, which leaves about 13000 ms of head-room rather than the roughly 3000 ms
     * jest's 5000 ms default left - an earlier round of this paragraph described that default as
     * though it were still in force, and told an operator to add a setting the config already
     * carries. A runner stall past the ceiling still reads as a false alarm about undici, which is
     * how a test gets skipped, so before believing the alarm check the failure: a timeout names
     * jest, a real regression names `releasedSockets`.
     *
     * The cancel is removed by overriding the method on the instance, which is sabotage rather
     * than a stub. It is written nowhere else in this file, and should not be. The seventh
     * describe disposes through `#cancelBoundedStreamRead()` rather than through this method, so
     * the canary does not cover that method's own removal; what it covers is the undici property
     * all seven rest on, which is one property and not seven.
     */
    describe('should not release the connection when the cancel is taken out', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 4096,
          },
        },
      ]

      test.each(cases)('maximumReadByteSize: $factoryParams.maximumReadByteSize', async ({
        factoryParams,
      }) => {
        const releasedSockets = []
        const fetchedResponses = []
        const requestSignals = []

        const oversizeServer = http.createServer((request, response) => {
          response.writeHead(200, {
            'content-type': 'image/jpeg',
            'content-length': String(LEAKY_RESPONSE_BODY_BYTE_SIZE),
          })
          response.end(Buffer.alloc(LEAKY_RESPONSE_BODY_BYTE_SIZE, 0x67))
        })

        oversizeServer.keepAliveTimeout = SOCKET_RELEASE_SERVER_KEEP_ALIVE_MILLISECONDS

        oversizeServer.on('connection', socket => {
          socket.on('error', () => null)
        })

        const oversizeSocketReleased = new Promise(resolve => {
          oversizeServer.once('connection', socket => {
            socket.on('close', () => {
              releasedSockets.push(socket)
              resolve(socket)
            })
          })
        })

        await new Promise(resolve => {
          oversizeServer.listen(0, '127.0.0.1', resolve)
        })

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async (requestedUrl, fetchOptions) => {
            requestSignals.push(fetchOptions.signal)

            const response = await globalThis.fetch(requestedUrl, fetchOptions)

            fetchedResponses.push(response)

            return response
          })

        const client = MediaFetchClient.create(factoryParams)

        client.cancelUnreadResponseBody = async () => null

        const actual = await client.fetchMedium({
          url: `http://127.0.0.1:${oversizeServer.address().port}/photos/canary.jpg`,
        })

        await Promise.race([
          oversizeSocketReleased,
          timersPromises.setTimeout(SOCKET_RELEASE_WAIT_MILLISECONDS, null, {
            ref: false,
          }),
        ])

        oversizeServer.closeAllConnections()
        oversizeServer.close()

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_UNREADABLE')
        expect(fetchedResponses)
          .toHaveLength(1)
        expect(requestSignals[0].aborted)
          .toBeFalsy()
        expect(releasedSockets)
          .toHaveLength(0)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#cancelUnreadResponseBody()', () => {
    /*
     * What the disposal does, asked of the method that does it. A cancelled body reads back as
     * used, which is the only thing a `Response` says about itself here - the socket is the
     * connection's business and the describes above are where that is observed.
     */
    describe('should mark the body of a response it cancelled as used', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'front-elevation-bytes',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'kitchen-counter-png',
        },
      ]

      test.each(cases)('mockResponseBody: $mockResponseBody', async ({
        factoryParams,
        mockResponseBody,
      }) => {
        const client = MediaFetchClient.create(factoryParams)
        const response = new Response(mockResponseBody, {
          status: 302,
          headers: {
            location: 'https://elsewhere.example/loot',
          },
        })

        await client.cancelUnreadResponseBody({
          response,
        })

        expect(response.bodyUsed)
          .toBeTruthy()
      })
    })

    describe('should answer nothing readable', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: 'front-elevation-bytes',
          label: 'a response carrying a body',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockResponseBody: null,
          label: 'a response carrying none',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        mockResponseBody,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.cancelUnreadResponseBody({
          response: new Response(mockResponseBody, {
            status: 302,
          }),
        })

        expect(actual)
          .toBeNull()
      })
    })

    /*
     * A request that produced no response at all - a connection refused, a host that does not
     * resolve, a hop refused on the way - reaches this method as null, because the branches that
     * dispose of a response do not first ask whether there is one.
     */
    describe('should answer nothing readable for a request that produced no response', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            response: null,
          },
          label: 'an empty allow-list',
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 12000,
          },
          params: {
            response: null,
          },
          label: 'an allow-list holding a host',
        },
      ]

      test.each(cases)('label: $label', async ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.cancelUnreadResponseBody(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#abandonFetchedResponse()', () => {
    /*
     * The two halves together: the outcome the caller reads, and the body disposed of on the way
     * to it. Leaving them apart is what the audit found, so they are asserted together.
     */
    describe('should build the outcome of a response it let go', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            failureReasonCode: 'MEDIA_FETCH_FAILED',
          },
          mockResponseBody: 'a page that is not a photograph',
          expected: {
            bytes: null,
            byteSize: null,
            mimeType: null,
            failureReasonCode: 'MEDIA_FETCH_FAILED',
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            failureReasonCode: 'MEDIA_UNREADABLE',
          },
          mockResponseBody: 'more bytes than the bound will hold',
          expected: {
            bytes: null,
            byteSize: null,
            mimeType: null,
            failureReasonCode: 'MEDIA_UNREADABLE',
          },
        },
      ]

      test.each(cases)('failureReasonCode: $params.failureReasonCode', async ({
        factoryParams,
        params,
        mockResponseBody,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)
        const response = new Response(mockResponseBody, {
          status: 404,
        })

        const actual = await client.abandonFetchedResponse({
          response,
          failureReasonCode: params.failureReasonCode,
        })

        expect(actual)
          .toEqual(expected)
        expect(response.bodyUsed)
          .toBeTruthy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#downgradesTransportSecurity()', () => {
    /*
     * An allow-list entry is a bare hostname, so the key cannot say "this host over TLS only", and
     * a listed host answering `302` to plaintext on a listed host passes every other check made
     * here. That is the hop this refuses.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
            redirectedUrl: 'http://files.client.example/objects/1234',
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
              'storage.beta.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/kitchen.png',
            redirectedUrl: 'http://storage.beta.example/moved.jpg',
          },
        },
      ]

      test.each(cases)('redirectedUrl: $params.redirectedUrl', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.downgradesTransportSecurity(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * A chain that began on plaintext is held to nothing, and that is deliberate: it was
     * protecting nothing to begin with, and which hosts exist over plaintext is the key's decision
     * rather than this class's. The third case is the one a reader would want to see - plaintext
     * going on to TLS is an upgrade and is not refused.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
            redirectedUrl: 'https://files.client.example/objects/1234',
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'http://127.0.0.1/photos/front-elevation.jpg',
            redirectedUrl: 'http://127.0.0.1/objects/1234',
          },
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'http://files.client.example/photos/balcony.jpg',
            redirectedUrl: 'https://files.client.example/objects/5678',
          },
        },
      ]

      test.each(cases)('redirectedUrl: $params.redirectedUrl', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.downgradesTransportSecurity(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#extractUrlProtocol()', () => {
    describe('should extract the scheme a URL names', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          expected: 'https:',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'http://127.0.0.1:8080/photos/kitchen.png',
          },
          expected: 'http:',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'file:///etc/passwd',
          },
          expected: 'file:',
        },
      ]

      test.each(cases)('url: $params.url', ({
        factoryParams,
        params,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractUrlProtocol(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null for a value that is no URL', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'not a url at all',
          },
          label: 'text naming no URL',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: '/objects/1234',
          },
          label: 'a path with nothing to resolve it against',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = client.extractUrlProtocol(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * The downgrade refused end to end, and the hop it would have gone to never asked for.
     *
     * An allow-list entry cannot say "this host over TLS only", so a listed host answering `302`
     * to plaintext on a listed host passed every check this class made before. What is asserted
     * here is the URLs the fetch function was handed: the first and no other.
     *
     * **This describe covers the refusal and not the disposal, and the stubbed `Response` is why
     * it cannot cover both.** It is built on a `null` body, so its `body` is `null`, so
     * `#cancelUnreadResponseBody()`
     * returns at its own guard and the cancel this branch owes is never reached - take the cancel
     * out of the branch and this describe stays green. The disposal has a describe of its own over
     * a real socket, above this one, which reaches the branch by handing the client an `https:`
     * URL and rewriting the scheme inside the fetch function.
     */
    describe('should refuse a redirect that would move the fetch off https', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          mockLocation: 'http://files.client.example/objects/1234',
          expected: [
            'https://files.client.example/photos/front-elevation.jpg',
          ],
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/kitchen.png',
          },
          mockLocation: 'http://files.client.example/objects/5678',
          expected: [
            'https://files.client.example/photos/kitchen.png',
          ],
        },
      ]

      test.each(cases)('mockLocation: $mockLocation', async ({
        factoryParams,
        params,
        mockLocation,
        expected,
      }) => {
        const requestedUrls = []

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async requestedUrl => {
            requestedUrls.push(requestedUrl)

            return new Response(null, {
              status: 302,
              headers: {
                location: mockLocation,
              },
            })
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium(params)

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_FETCH_FAILED')
        expect(requestedUrls)
          .toEqual(expected)
      })
    })

    /*
     * The control the refusal above would be meaningless without: the same chain staying on TLS is
     * followed, so what refused the first one was the scheme and not the redirect.
     */
    describe('should follow a redirect that stays on https', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/front-elevation.jpg',
          },
          mockLocation: 'https://files.client.example/objects/1234',
          expected: [
            'https://files.client.example/photos/front-elevation.jpg',
            'https://files.client.example/objects/1234',
          ],
        },
        {
          factoryParams: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
          },
          params: {
            url: 'https://files.client.example/photos/kitchen.png',
          },
          mockLocation: 'https://files.client.example/objects/5678',
          expected: [
            'https://files.client.example/photos/kitchen.png',
            'https://files.client.example/objects/5678',
          ],
        },
      ]

      test.each(cases)('mockLocation: $mockLocation', async ({
        factoryParams,
        params,
        mockLocation,
        expected,
      }) => {
        const requestedUrls = []

        /*
         * The two answers in the order the chain asks for them, rather than a ternary picking one
         * by the URL it was handed. A conditional in a test body hides a branch, and here it hid
         * the thing the case is actually about: that the first request is answered with the
         * redirect and the second with the object. A queue states that, and a chain that asked a
         * third time would be handed nothing rather than quietly re-answered.
         */
        const mockResponses = [
          new Response(null, {
            status: 302,
            headers: {
              location: mockLocation,
            },
          }),
          new Response('front-elevation-bytes', {
            status: 200,
            headers: {
              'content-type': 'image/jpeg',
            },
          }),
        ]

        jest.spyOn(MediaFetchClient, 'fetchClient', 'get')
          .mockReturnValue(async requestedUrl => {
            requestedUrls.push(requestedUrl)

            return mockResponses.shift()
          })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.fetchMedium(params)

        expect(actual)
          .toHaveProperty('failureReasonCode', null)
        expect(requestedUrls)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#readBoundedStreamBytes()', () => {
    /*
     * The second bound on the read, and the reason there is one.
     *
     * The byte bound cannot see what a body costs to assemble. Ten megabytes arriving one byte at
     * a time is ten million objects and ten million wake-ups inside a bound that sees ten
     * megabytes and is content, and the accumulation used to be quadratic on top of that - a
     * measured fifteen seconds of processor time and the whole request budget spent on eighty-six
     * kilobytes, synchronously, on the loop a worker's heartbeat shares.
     *
     * The reader is stubbed rather than driven over a socket, and that is not a shortcut: a
     * loopback server writing four hundred two-byte frames was measured arriving as a handful of
     * chunks, because the kernel coalesces them, so a real socket cannot state the number of
     * pieces a body arrives in. The reader is the parameter this method takes and the pieces are
     * its cases.
     */
    describe('should refuse a body arriving in more pieces than the bound allows', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadChunkCount: 2,
          },
          mockChunks: [
            {
              done: false,
              value: Uint8Array.from([0x61]),
            },
            {
              done: false,
              value: Uint8Array.from([0x62]),
            },
            {
              done: false,
              value: Uint8Array.from([0x63]),
            },
            {
              done: true,
            },
          ],
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadChunkCount: 1,
          },
          mockChunks: [
            {
              done: false,
              value: Uint8Array.from([0x64]),
            },
            {
              done: false,
              value: Uint8Array.from([0x65]),
            },
            {
              done: true,
            },
          ],
        },
      ]

      test.each(cases)('maximumReadChunkCount: $factoryParams.maximumReadChunkCount', async ({
        factoryParams,
        mockChunks,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.readBoundedStreamBytes({
          reader: {
            read: async () => mockChunks.shift(),
            cancel: async () => null,
          },
          chunks: [],
          readByteSize: 0,
        })

        expect(actual)
          .toBeNull()
      })
    })

    describe('should read a body arriving in as many pieces as the bound allows', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadChunkCount: 3,
          },
          mockChunks: [
            {
              done: false,
              value: Uint8Array.from([0x61]),
            },
            {
              done: false,
              value: Uint8Array.from([0x62]),
            },
            {
              done: false,
              value: Uint8Array.from([0x63]),
            },
            {
              done: true,
            },
          ],
          expected: Buffer.from('abc'),
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadChunkCount: 65536,
          },
          mockChunks: [
            {
              done: false,
              value: Uint8Array.from([0x64, 0x65]),
            },
            {
              done: false,
              value: Uint8Array.from([0x66]),
            },
            {
              done: true,
            },
          ],
          expected: Buffer.from('def'),
        },
      ]

      test.each(cases)('maximumReadChunkCount: $factoryParams.maximumReadChunkCount', async ({
        factoryParams,
        mockChunks,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.readBoundedStreamBytes({
          reader: {
            read: async () => mockChunks.shift(),
            cancel: async () => null,
          },
          chunks: [],
          readByteSize: 0,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#readBoundedStreamBytes()', () => {
    /*
     * The linear accumulation, asserted as the contract it is rather than as a stopwatch reading.
     *
     * Rebuilding the array per chunk and appending to it answer the same bytes, so no assertion on
     * the return value can tell the two apart; what tells them apart is where the pieces end up.
     * The quadratic form left the array it was handed empty, because every piece went into a fresh
     * array it built beside it. So this asserts that the array handed in holds the pieces
     * afterwards - which is exactly the property that makes the read linear in them, and which the
     * method's own comment now states as something a caller must not be surprised by.
     *
     * A stopwatch was considered and not written. The honest form of it is a processor-time
     * reading against a threshold, and a threshold that separates the two on one machine may not
     * on a loaded runner; a test that could pass either way is worse than none. The measurement
     * was taken outside the suite instead - twenty thousand pieces at thirty-two milliseconds
     * against forty thousand at forty-seven, which is linear where quadratic would have been four
     * times the one from the other.
     */
    describe('should append to the array it was given', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockChunks: [
            {
              done: false,
              value: Uint8Array.from([0x61]),
            },
            {
              done: false,
              value: Uint8Array.from([0x62]),
            },
            {
              done: true,
            },
          ],
          expected: [
            Buffer.from('a'),
            Buffer.from('b'),
          ],
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
          },
          mockChunks: [
            {
              done: false,
              value: Uint8Array.from([0x63, 0x64]),
            },
            {
              done: false,
              value: Uint8Array.from([0x65]),
            },
            {
              done: false,
              value: Uint8Array.from([0x66]),
            },
            {
              done: true,
            },
          ],
          expected: [
            Buffer.from('cd'),
            Buffer.from('e'),
            Buffer.from('f'),
          ],
        },
      ]

      test.each(cases)('mockChunks[0].value: $mockChunks.0.value', async ({
        factoryParams,
        mockChunks,
        expected,
      }) => {
        const client = MediaFetchClient.create(factoryParams)
        const actual = []

        await client.readBoundedStreamBytes({
          reader: {
            read: async () => mockChunks.shift(),
            cancel: async () => null,
          },
          chunks: actual,
          readByteSize: 0,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#cancelBoundedStreamRead()', () => {
    /*
     * Cancelling the reader is what lets the connection go when a body is abandoned part-read, so
     * the call is the point of the method and is asserted rather than assumed.
     */
    describe('should answer nothing readable', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 8,
          },
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
        },
      ]

      test.each(cases)('maximumReadByteSize: $factoryParams.maximumReadByteSize', async ({
        factoryParams,
      }) => {
        const client = MediaFetchClient.create(factoryParams)
        const canceledReaders = []

        const actual = await client.cancelBoundedStreamRead({
          reader: {
            read: async () => ({
              done: true,
            }),
            cancel: async () => {
              canceledReaders.push('canceled')

              return null
            },
          },
        })

        expect(actual)
          .toBeNull()
        expect(canceledReaders)
          .toHaveLength(1)
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#cancelBoundedStreamRead()', () => {
    /*
     * A cancel that raises, answered rather than raised.
     *
     * A cancel rejects on more than one occasion, and an earlier round of this file named only the
     * harmless ones. Measured against Node's own `ReadableStream`: an already-errored stream
     * rejects with the error it stored, and a readable stream **still holding bytes** rejects with
     * whatever its underlying source's own cancel algorithm threw. An already-cancelled stream and
     * one already read to its end both resolve. The second of the rejecting two is one in which
     * nothing was released, which is what makes the swallow cost something.
     *
     * **A third rejecting case exists and is not this method's, though a previous round of this
     * file listed it here.** `stream.cancel()` on a stream **locked by a reader** rejects with
     * `TypeError: Invalid state: ReadableStream is locked` without the underlying source's cancel
     * being called - but this method holds the only reader and cancels through it, and measured,
     * `reader.cancel()` while holding the lock resolves and does call the source's cancel. That
     * case belongs to `#cancelUnreadResponseBody()`, which cancels the stream. Both cases below
     * are therefore spelled as what can reach *this* call site.
     *
     * A host resetting the connection in the same tick the bound is hit reaches this. Before the
     * guard, that rejection left this method, was caught by `#readResponseBytes()` and written as
     * a log line, which is the one thing the class comment says a refusal never does. This
     * describe is the method's own answer; the one below it is where the line is asserted absent,
     * and that one is the discriminating half.
     */
    describe('should answer nothing readable when the cancel raised', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 8,
          },
          mockCancelFailureMessage: 'terminated',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 1024,
          },
          mockCancelFailureMessage: 'the source cancel algorithm threw',
        },
      ]

      test.each(cases)('mockCancelFailureMessage: $mockCancelFailureMessage', async ({
        factoryParams,
        mockCancelFailureMessage,
      }) => {
        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.cancelBoundedStreamRead({
          reader: {
            read: async () => ({
              done: true,
            }),
            cancel: async () => {
              throw new TypeError(mockCancelFailureMessage)
            },
          },
        })

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#readResponseBytes()', () => {
    /*
     * The line a rejecting cancel used to write, asserted absent.
     *
     * `#cancelBoundedStreamRead()` answering null is not the whole of the fix, and on its own it
     * is not even the observable one: the unguarded method answered null here too, by way of
     * `#readResponseBytes()`'s own catch. What the audit found was the line that catch wrote, so
     * the only way to see the difference is to watch the logger.
     *
     * The body is a real `ReadableStream` whose `cancel()` raises, driven one chunk past the byte
     * bound. **It is worth being exact about which rejecting case this is, because an earlier
     * round of this file called it an already-errored stream and it is not one.** At the moment of
     * the cancel this stream is readable and still holding its enqueued chunk, and what rejects is
     * its underlying source's own cancel algorithm - the case the class's swallow is least
     * entitled to treat as "the work was already done", and the reason that method's comment now
     * says so. Against the unguarded method the same case answers null and writes
     * `MediaFetchClient MEDIA_UNREADABLE: TypeError`; against this one it answers null and writes
     * nothing. So the null is not the discriminator and the empty log is.
     *
     * The logger is stubbed rather than left real because a line is not observable otherwise - the
     * client owns a rotating file and writes into it - and because a test should not be writing
     * into `logs/` to make an assertion.
     */
    describe('should write no line when the cancel raised', () => {
      const cases = [
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 4,
          },
          mockResponseBody: 'nine-byte',
        },
        {
          factoryParams: {
            allowedHosts: [],
            requestTimeoutMilliseconds: 30000,
            maximumReadByteSize: 2,
          },
          mockResponseBody: 'far more than two bytes of body',
        },
      ]

      test.each(cases)('mockResponseBody: $mockResponseBody', async ({
        factoryParams,
        mockResponseBody,
      }) => {
        const loggedLines = []

        jest.spyOn(MediaFetchClient, 'mentsuLogger', 'get')
          .mockReturnValue(/** @type {*} */ ({
            error: line => loggedLines.push(line),
          }))

        const bodyStream = new ReadableStream({
          start (controller) {
            controller.enqueue(Buffer.from(mockResponseBody))
          },
          cancel () {
            throw new TypeError('terminated')
          },
        })

        const client = MediaFetchClient.create(factoryParams)

        const actual = await client.readResponseBytes({
          response: new Response(bodyStream),
        })

        expect(actual)
          .toBeNull()
        expect(loggedLines)
          .toHaveLength(0)
      })
    })
  })
})
