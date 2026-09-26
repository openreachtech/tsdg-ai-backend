import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunCallbackSender from '../../../../app/aiRunCallback/AiRunCallbackSender.js'

/*
 * The outbound half of the first acceptance criterion of section 12: every run reaching succeeded,
 * failed or canceled produces one terminal callback to the client's registered callback URL.
 *
 * The network is the one thing mocked here, and it is mocked in the success cases as well as the
 * failing ones: a test suite that posted to somebody's server would be a test suite that posts to
 * somebody's server. It is reached through `.get:fetchClient`, so substituting it is overriding
 * one member rather than mocking a module.
 *
 * The URLs are the development clients' registered prefixes, under the reserved `.invalid` domain
 * — so a request escaping the mock reaches nothing.
 */

describe('AiRunCallbackSender', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#requestTimeoutMilliseconds', () => {
        const cases = [
          {
            input: {
              requestTimeoutMilliseconds: 10000,
            },
            expected: 10000,
          },
          {
            input: {
              requestTimeoutMilliseconds: 250,
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
          },
        },
        {
          input: {
            requestTimeoutMilliseconds: 250,
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
          },
        },
        {
          input: {
            requestTimeoutMilliseconds: 250,
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
          },
        },
        {
          input: {
            requestTimeoutMilliseconds: 250,
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
     * body. Without this the four describes above would pass against a class that posted the body
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
