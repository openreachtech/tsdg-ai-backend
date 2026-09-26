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
 * The network is the one thing mocked here, and it is mocked through the getter the class reaches
 * it by. What stands in for a response is a real `Response` - Node builds one - rather than a
 * hand-written double, so nothing in this file restates what a response is.
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
            },
            expected: 30000,
          },
          {
            params: {
              allowedHosts: [
                'storage.alpha.example',
              ],
              requestTimeoutMilliseconds: 12000,
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
          },
          expected: {
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
          expected: {
            allowedHosts: [
              'storage.alpha.example',
            ],
            requestTimeoutMilliseconds: 12000,
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
     * the only way to reach it is a response whose body read rejects. The stub carries the two
     * members this method touches and nothing else.
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
            arrayBuffer: () => Promise.reject(new TypeError('terminated')),
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
            arrayBuffer: () => Promise.reject(new Error('stream closed')),
          },
          label: 'a stream closed under the read',
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
