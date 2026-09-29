import AiRunCommonFieldsInputAdapter from '../../../../../app/adapter/forRenderer/AiRunCommonFieldsInputAdapter.js'

import RequestBodyDigester from '../../../../../app/aiRun/RequestBodyDigester.js'

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#body', () => {
        const cases = [
          {
            input: {
              body: {
                externalRef: 'external-ref-0001',
              },
              request: {}, // Fill the unrelated required argument with a neutral value
              requestBodyDigester: null, // Fill the unrelated required argument with a neutral value
            },
            expected: {
              externalRef: 'external-ref-0001',
            },
          },
          {
            input: {
              body: {
                externalRef: 'external-ref-0002',
              },
              request: {}, // Fill the unrelated required argument with a neutral value
              requestBodyDigester: null, // Fill the unrelated required argument with a neutral value
            },
            expected: {
              externalRef: 'external-ref-0002',
            },
          },
        ]

        test.each(cases)('externalRef: $input.body.externalRef', ({
          input,
          expected,
        }) => {
          const adapter = new AiRunCommonFieldsInputAdapter(input)

          expect(adapter)
            .toHaveProperty('body', expected)
        })
      })

      describe('#request', () => {
        const cases = [
          {
            input: {
              body: {}, // Fill the unrelated required argument with a neutral value
              request: {
                expressRequest: {
                  rawBody: 'raw-body-0001',
                },
              },
              requestBodyDigester: null, // Fill the unrelated required argument with a neutral value
            },
            expected: {
              expressRequest: {
                rawBody: 'raw-body-0001',
              },
            },
          },
          {
            input: {
              body: {}, // Fill the unrelated required argument with a neutral value
              request: {
                expressRequest: {
                  rawBody: 'raw-body-0002',
                },
              },
              requestBodyDigester: null, // Fill the unrelated required argument with a neutral value
            },
            expected: {
              expressRequest: {
                rawBody: 'raw-body-0002',
              },
            },
          },
        ]

        test.each(cases)('rawBody: $input.request.expressRequest.rawBody', ({
          input,
          expected,
        }) => {
          const adapter = new AiRunCommonFieldsInputAdapter(input)

          expect(adapter)
            .toHaveProperty('request', expected)
        })
      })

      describe('#requestBodyDigester', () => {
        const cases = [
          {
            input: {
              body: {}, // Fill the unrelated required argument with a neutral value
              request: {}, // Fill the unrelated required argument with a neutral value
              requestBodyDigester: {
                hashAlgorithm: 'hash-algorithm-0001',
              },
            },
            expected: {
              hashAlgorithm: 'hash-algorithm-0001',
            },
          },
          {
            input: {
              body: {}, // Fill the unrelated required argument with a neutral value
              request: {}, // Fill the unrelated required argument with a neutral value
              requestBodyDigester: {
                hashAlgorithm: 'hash-algorithm-0002',
              },
            },
            expected: {
              hashAlgorithm: 'hash-algorithm-0002',
            },
          },
        ]

        test.each(cases)('hashAlgorithm: $input.requestBodyDigester.hashAlgorithm', ({
          input,
          expected,
        }) => {
          const adapter = new AiRunCommonFieldsInputAdapter(input)

          expect(adapter)
            .toHaveProperty('requestBodyDigester', expected)
        })
      })
    })
  })
})

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            body: {
              externalRef: 'external-ref-0001',
            },
            request: {},
          },
        },
        {
          input: {
            body: {
              externalRef: 'external-ref-0002',
            },
            request: {},
          },
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', ({
        input,
      }) => {
        const received = AiRunCommonFieldsInputAdapter.create(input)

        expect(received)
          .toBeInstanceOf(AiRunCommonFieldsInputAdapter)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            body: {
              externalRef: 'external-ref-0001',
            },
            request: {},
            requestBodyDigester: {
              hashAlgorithm: 'hash-algorithm-0001',
            },
          },
          expected: {
            body: {
              externalRef: 'external-ref-0001',
            },
            request: {},
            requestBodyDigester: {
              hashAlgorithm: 'hash-algorithm-0001',
            },
          },
        },
        {
          input: {
            body: {
              externalRef: 'external-ref-0002',
            },
            request: {},
            requestBodyDigester: {
              hashAlgorithm: 'hash-algorithm-0002',
            },
          },
          expected: {
            body: {
              externalRef: 'external-ref-0002',
            },
            request: {},
            requestBodyDigester: {
              hashAlgorithm: 'hash-algorithm-0002',
            },
          },
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCommonFieldsInputAdapter)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default requestBodyDigester', () => {
      test('with no requestBodyDigester', () => {
        const SpyClass = constructorSpy.spyOn(AiRunCommonFieldsInputAdapter)
        const expected = {
          body: {
            externalRef: 'external-ref-0003',
          },
          request: {},
          requestBodyDigester: expect.any(RequestBodyDigester),
        }

        SpyClass.create({
          body: {
            externalRef: 'external-ref-0003',
          },
          request: {},
          // requestBodyDigester: omitted → default RequestBodyDigester
        })

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('.get:IDEMPOTENCY_KEY_HEADER_KEY', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunCommonFieldsInputAdapter.IDEMPOTENCY_KEY_HEADER_KEY

        expect(received)
          .toBe('idempotency-key')
      })
    })
  })
})

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('.createRequestBodyDigester()', () => {
    test('should be an instance of RequestBodyDigester', () => {
      const received = AiRunCommonFieldsInputAdapter.createRequestBodyDigester()

      expect(received)
        .toBeInstanceOf(RequestBodyDigester)
    })
  })
})

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunCommonFieldsInputAdapter,
      },
      {
        tally: class AlphaInputAdapter extends AiRunCommonFieldsInputAdapter {},
      },
      {
        tally: class BetaInputAdapter extends AiRunCommonFieldsInputAdapter {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const adapter = tally.create({
        body: {}, // Neutral value; not under test
        request: {}, // Neutral value; not under test
      })

      const received = adapter.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('#buildInput()', () => {
    describe('when every field was sent', () => {
      const cases = [
        {
          input: {
            body: {
              externalRef: 'external-ref-0001',
              subjectLabel: 'Subject label 0001',
              correlationId: 'correlation-id-0001',
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/0001',
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-0001',
                },
              },
            },
          },
          expected: {
            requestKey: 'request-key-0001',
            externalRef: 'external-ref-0001',
            subjectLabel: 'Subject label 0001',
            correlationId: 'correlation-id-0001',
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/0001',
          },
        },
        {
          input: {
            body: {
              externalRef: 'external-ref-0002',
              subjectLabel: 'Subject label 0002',
              correlationId: 'correlation-id-0002',
              callbackUrl: 'https://beta.client.development.invalid/callbacks/0002',
              asset: 'asset-0002', // A service's own field is not merged into the common input
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-0002',
                },
              },
            },
          },
          expected: {
            requestKey: 'request-key-0002',
            externalRef: 'external-ref-0002',
            subjectLabel: 'Subject label 0002',
            correlationId: 'correlation-id-0002',
            callbackUrl: 'https://beta.client.development.invalid/callbacks/0002',
          },
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', ({
        input,
        expected,
      }) => {
        const adapter = AiRunCommonFieldsInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when fields were not sent', () => {
      /** @type {Array<{ input: Record<string, *>, expected: Record<string, *> }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            body: {
              externalRef: 'external-ref-0003',
              // subjectLabel: not sent
              // correlationId: not sent
              // callbackUrl: not sent
            },
            request: {
              expressRequest: {
                headers: {},
              },
            },
          },
          expected: {
            requestKey: null,
            externalRef: 'external-ref-0003',
            subjectLabel: null,
            correlationId: null,
            callbackUrl: null,
          },
        },
        {
          input: {
            body: null, // The request carried no parsed body at all
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-0004',
                },
              },
            },
          },
          expected: {
            requestKey: 'request-key-0004',
            externalRef: null,
            subjectLabel: null,
            correlationId: null,
            callbackUrl: null,
          },
        },
      ])

      test.each(cases)('externalRef: $input.body.externalRef', ({
        input,
        expected,
      }) => {
        const adapter = AiRunCommonFieldsInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('#extractRequestKey()', () => {
    describe('when the header was sent', () => {
      const cases = [
        {
          input: {
            requestKey: 'request-key-0001',
          },
          expected: 'request-key-0001',
        },
        {
          input: {
            requestKey: 'request-key-0002',
          },
          expected: 'request-key-0002',
        },
      ]

      test.each(cases)('requestKey: $input.requestKey', ({
        input,
        expected,
      }) => {
        const adapter = AiRunCommonFieldsInputAdapter.create({
          body: {}, // Neutral value; not under test
          request: {
            expressRequest: {
              headers: {
                'idempotency-key': input.requestKey,
              },
            },
          },
        })

        const received = adapter.extractRequestKey()

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the header was not sent', () => {
      /** @type {Array<{ input: Record<string, *> }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            request: {
              expressRequest: {
                headers: {
                  'content-type': 'application/json',
                },
              },
            },
          },
        },
        {
          input: {
            request: {
              expressRequest: {
                headers: null,
              },
            },
          },
        },
        {
          input: {
            request: null,
          },
        },
      ])

      test.each(cases)('request: $input.request', ({
        input,
      }) => {
        const adapter = AiRunCommonFieldsInputAdapter.create({
          body: {}, // Neutral value; not under test
          request: input.request,
        })

        const received = adapter.extractRequestKey()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('#extractRawBody()', () => {
    describe('when the request carried a body', () => {
      const cases = [
        {
          input: {
            request: {
              expressRequest: {
                rawBody: '{"externalRef":"external-ref-0001"}',
              },
            },
          },
          expected: '{"externalRef":"external-ref-0001"}',
        },
        {
          input: {
            request: {
              expressRequest: {
                rawBody: '{"externalRef":"external-ref-0002"}',
              },
            },
          },
          expected: '{"externalRef":"external-ref-0002"}',
        },
      ]

      test.each(cases)('rawBody: $input.request.expressRequest.rawBody', ({
        input,
        expected,
      }) => {
        const adapter = AiRunCommonFieldsInputAdapter.create({
          body: {}, // Neutral value; not under test
          request: input.request,
        })

        const received = adapter.extractRawBody()

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the request carried none', () => {
      /** @type {Array<{ input: Record<string, *> }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            request: {
              expressRequest: {
                headers: {},
              },
            },
          },
        },
        {
          input: {
            request: null,
          },
        },
      ])

      test.each(cases)('request: $input.request', ({
        input,
      }) => {
        const adapter = AiRunCommonFieldsInputAdapter.create({
          body: {}, // Neutral value; not under test
          request: input.request,
        })

        const received = adapter.extractRawBody()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCommonFieldsInputAdapter', () => {
  describe('#generateRequestBodyHash()', () => {
    describe('when the request carried a body', () => {
      const cases = [
        {
          input: {
            request: {
              expressRequest: {
                rawBody: '{"externalRef":"external-ref-0001"}',
              },
            },
          },
          // sha256 of '{"externalRef":"external-ref-0001"}'
          expected: '49fdc2a75f13396fe660e66348e08ff4c9973317cb07aef8bfa20c58361e1707',
        },
        {
          input: {
            request: {
              expressRequest: {
                rawBody: '{"externalRef":"external-ref-0002"}',
              },
            },
          },
          // sha256 of '{"externalRef":"external-ref-0002"}'
          expected: '24b91cf4a9cd8869c8173e608b878cb29d77d72f86a892a3742e580dce1aaee3',
        },
      ]

      test.each(cases)('rawBody: $input.request.expressRequest.rawBody', ({
        input,
        expected,
      }) => {
        const adapter = AiRunCommonFieldsInputAdapter.create({
          body: {}, // Neutral value; the digest is taken from the raw bytes, not the parsed body
          request: input.request,
        })

        const received = adapter.generateRequestBodyHash()

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the request carried none', () => {
      /** @type {Array<{ input: Record<string, *> }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            request: {
              expressRequest: {
                headers: {},
              },
            },
          },
        },
        {
          input: {
            request: null,
          },
        },
      ])

      test.each(cases)('request: $input.request', ({
        input,
      }) => {
        const adapter = AiRunCommonFieldsInputAdapter.create({
          body: {}, // Neutral value; not under test
          request: input.request,
        })

        const received = adapter.generateRequestBodyHash()

        expect(received)
          .toBeNull()
      })
    })
  })
})
