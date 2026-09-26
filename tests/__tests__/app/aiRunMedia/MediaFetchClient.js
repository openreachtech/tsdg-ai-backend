import http from 'node:http'

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
 * Three describes use a real one instead, over loopback, and say so where they sit: a redirect
 * refused, a redirect followed, and a chain longer than the hops allowed. A stubbed fetch follows
 * nothing, so it could not have shown that `fetch` left to itself follows up to twenty hops and
 * answers with the last of them - which is the thing those three are about.
 */

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
          },
          expected: {
            allowedHosts: [
              'files.client.example',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumRedirectCount: 3,
            maximumReadByteSize: 10485760,
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
          },
          expected: {
            allowedHosts: [
              'storage.alpha.example',
            ],
            requestTimeoutMilliseconds: 12000,
            maximumRedirectCount: 1,
            maximumReadByteSize: 2048,
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
        const refusedHostListener = jest.fn()
        const refusedHostServer = http.createServer((request, response) => {
          refusedHostListener()

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

        expect(actual)
          .toEqual(expected)
        expect(refusedHostListener)
          .not
          .toHaveBeenCalled()

        redirectingServer.close()
        refusedHostServer.close()
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

        expect(actual)
          .toEqual(expected)

        redirectingServer.close()
        objectServer.close()
      })
    })
  })
})

describe('MediaFetchClient', () => {
  describe('#fetchMedium()', () => {
    /*
     * A host on the list redirecting to itself for ever is still a host on the list, so the
     * allow-list cannot end this one - the hop count does. The number of requests the server saw
     * is what says where it ended: the first fetch plus one per hop allowed.
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
          expected: 1,
        },
        {
          factoryParams: {
            allowedHosts: [
              '127.0.0.1',
            ],
            requestTimeoutMilliseconds: 30000,
            maximumRedirectCount: 2,
          },
          expected: 3,
        },
      ]

      test.each(cases)('maximumRedirectCount: $factoryParams.maximumRedirectCount', async ({
        factoryParams,
        expected,
      }) => {
        const hopListener = jest.fn()
        const loopingServer = http.createServer((request, response) => {
          hopListener()

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

        expect(actual)
          .toHaveProperty('failureReasonCode', 'MEDIA_FETCH_FAILED')
        expect(hopListener)
          .toHaveBeenCalledTimes(expected)

        loopingServer.close()
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
