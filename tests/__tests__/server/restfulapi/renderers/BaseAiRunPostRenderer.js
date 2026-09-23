import BaseAiRunPostRenderer from '../../../../../server/restfulapi/renderers/BaseAiRunPostRenderer.js'

import {
  BasePostRenderer,
} from '@openreachtech/renchan'

import AiRunCommonFieldsInputAdapter from '../../../../../app/adapter/forRenderer/AiRunCommonFieldsInputAdapter.js'
import AiRunAcceptor from '../../../../../app/aiRun/AiRunAcceptor.js'
import AiRunCommonFieldsInputValidator from '../../../../../app/validator/forRenderer/AiRunCommonFieldsInputValidator.js'

describe('BaseAiRunPostRenderer', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = BaseAiRunPostRenderer.prototype

      expect(received)
        .toBeInstanceOf(BasePostRenderer)
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('.get:errorStructureHash', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {
          MissingIdempotencyKey: {
            statusCode: 422,
            errorMessage: 'Idempotency-Key header is required',
          },
          InvalidRequestBody: {
            statusCode: 422,
            errorMessage: 'Invalid request body',
          },
          InvalidExternalRef: {
            statusCode: 422,
            errorMessage: 'Invalid externalRef',
          },
          InvalidSubjectLabel: {
            statusCode: 422,
            errorMessage: 'Invalid subjectLabel',
          },
          InvalidCorrelationId: {
            statusCode: 422,
            errorMessage: 'Invalid correlationId',
          },
          InvalidCallbackUrl: {
            statusCode: 422,
            errorMessage: 'Invalid callbackUrl',
          },
          RequestBodyMismatch: {
            statusCode: 409,
            errorMessage: 'Idempotency-Key was already used with a different request body',
          },
        }

        const received = BaseAiRunPostRenderer.errorStructureHash

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('.get:aiRunCategory', () => {
    describe('when not inherited', () => {
      const cases = [
        {
          input: {
            Ctor: BaseAiRunPostRenderer,
          },
          expected: 'BaseAiRunPostRenderer.get:aiRunCategory must be inherited',
        },
        {
          input: {
            Ctor: class AlphaAiRunPostRenderer extends BaseAiRunPostRenderer {},
          },
          expected: 'AlphaAiRunPostRenderer.get:aiRunCategory must be inherited',
        },
        {
          input: {
            Ctor: class BetaAiRunPostRenderer extends BaseAiRunPostRenderer {},
          },
          expected: 'BetaAiRunPostRenderer.get:aiRunCategory must be inherited',
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
        expected,
      }) => {
        expect(() => input.Ctor.aiRunCategory)
          .toThrow(expected)
      })
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('.createAiRunAcceptor()', () => {
    test('should be an instance of AiRunAcceptor', () => {
      const received = BaseAiRunPostRenderer.createAiRunAcceptor()

      expect(received)
        .toBeInstanceOf(AiRunAcceptor)
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: BaseAiRunPostRenderer,
      },
      {
        tally: class GammaAiRunPostRenderer extends BaseAiRunPostRenderer {},
      },
      {
        tally: class DeltaAiRunPostRenderer extends BaseAiRunPostRenderer {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const renderer = tally.create()

      const received = renderer.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  /*
   * The one in-repo link between a signature and a run.
   *
   * `RestfulApiRoutesBuilder#generateRendererHandler()` reads this getter and, when it is true,
   * replaces the engine's filter handler with `async () => null` — so the `401` for an unsigned
   * request and the `403` for a switched-off client are never consulted, and `render()` writes a
   * run for a caller nobody identified. Nothing else in this checkpoint would notice: every other
   * test here calls `render()` directly, past the filter.
   *
   * The derived classes are the point rather than decoration. The value is inherited, so the way
   * it turns off is a one-line override on a service's own renderer, and a case list holding only
   * the base would pass while that override sat there.
   */
  describe('#get:passesFilter', () => {
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            Ctor: BaseAiRunPostRenderer,
          },
        },
        {
          input: {
            Ctor: class EpsilonAiRunPostRenderer extends BaseAiRunPostRenderer {},
          },
        },
        {
          input: {
            Ctor: class ZetaAiRunPostRenderer extends BaseAiRunPostRenderer {},
          },
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
      }) => {
        const renderer = input.Ctor.create()

        const received = renderer.passesFilter

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('#createInputAdapter()', () => {
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
      const renderer = BaseAiRunPostRenderer.create()

      const received = renderer.createInputAdapter(input)

      expect(received)
        .toBeInstanceOf(AiRunCommonFieldsInputAdapter)
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('#createInputValidator()', () => {
    const cases = [
      {
        input: {
          input: {
            externalRef: 'external-ref-0001',
          },
        },
      },
      {
        input: {
          input: {
            externalRef: 'external-ref-0002',
          },
        },
      },
    ]

    test.each(cases)('externalRef: $input.input.externalRef', ({
      input,
    }) => {
      const renderer = BaseAiRunPostRenderer.create()

      const received = renderer.createInputValidator(input)

      expect(received)
        .toBeInstanceOf(AiRunCommonFieldsInputValidator)
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('#validateInput()', () => {
    describe('when every rule passes', () => {
      const cases = [
        {
          input: {
            input: {
              requestKey: 'request-key-0001',
              externalRef: 'external-ref-0001',
              subjectLabel: 'Subject label 0001',
              correlationId: 'correlation-id-0001',
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/0001',
            },
            requestBodyHash: 'request-body-hash-0001',
          },
        },
        {
          input: {
            input: {
              requestKey: 'request-key-0002',
              externalRef: 'external-ref-0002',
              subjectLabel: 'Subject label 0002',
              correlationId: 'correlation-id-0002',
              callbackUrl: 'https://beta.client.development.invalid/callbacks/0002',
            },
            requestBodyHash: 'request-body-hash-0002',
          },
        },
      ]

      test.each(cases)('requestKey: $input.input.requestKey', ({
        input,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()

        const received = renderer.validateInput(input)

        expect(received)
          .toBeNull()
      })
    })

    describe('when a field was not sent', () => {
      /** @type {Array<{ input: Record<string, *>, expected: * }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            input: {
              // requestKey: not sent
              externalRef: 'external-ref-0003',
              subjectLabel: 'Subject label 0003',
              correlationId: 'correlation-id-0003',
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/0003',
            },
            requestBodyHash: 'request-body-hash-0003',
          },
          expected: expect.objectContaining({
            statusCode: 422,
            error: {
              message: 'Idempotency-Key header is required',
            },
          }),
        },
        {
          input: {
            input: {
              requestKey: 'request-key-0004',
              // externalRef: not sent
              subjectLabel: 'Subject label 0004',
              correlationId: 'correlation-id-0004',
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/0004',
            },
            requestBodyHash: 'request-body-hash-0004',
          },
          expected: expect.objectContaining({
            statusCode: 422,
            error: {
              message: 'Invalid externalRef',
            },
          }),
        },
        {
          input: {
            input: {
              requestKey: 'request-key-0005',
              externalRef: 'external-ref-0005',
              // subjectLabel: not sent
              correlationId: 'correlation-id-0005',
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/0005',
            },
            requestBodyHash: 'request-body-hash-0005',
          },
          expected: expect.objectContaining({
            statusCode: 422,
            error: {
              message: 'Invalid subjectLabel',
            },
          }),
        },
        {
          input: {
            input: {
              requestKey: 'request-key-0006',
              externalRef: 'external-ref-0006',
              subjectLabel: 'Subject label 0006',
              // correlationId: not sent
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/0006',
            },
            requestBodyHash: 'request-body-hash-0006',
          },
          expected: expect.objectContaining({
            statusCode: 422,
            error: {
              message: 'Invalid correlationId',
            },
          }),
        },
        {
          input: {
            input: {
              requestKey: 'request-key-0007',
              externalRef: 'external-ref-0007',
              subjectLabel: 'Subject label 0007',
              correlationId: 'correlation-id-0007',
              // callbackUrl: not sent
            },
            requestBodyHash: 'request-body-hash-0007',
          },
          expected: expect.objectContaining({
            statusCode: 422,
            error: {
              message: 'Invalid callbackUrl',
            },
          }),
        },
      ])

      test.each(cases)('externalRef: $input.input.externalRef', ({
        input,
        expected,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()

        const received = renderer.validateInput(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the request carried no body to digest', () => {
      /** @type {Array<{ input: Record<string, *>, expected: * }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            input: {
              requestKey: 'request-key-0008',
              externalRef: 'external-ref-0008',
              subjectLabel: 'Subject label 0008',
              correlationId: 'correlation-id-0008',
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/0008',
            },
            requestBodyHash: null,
          },
          expected: expect.objectContaining({
            statusCode: 422,
            error: {
              message: 'Invalid request body',
            },
          }),
        },
        {
          input: {
            input: {
              requestKey: 'request-key-0009',
              externalRef: 'external-ref-0009',
              subjectLabel: 'Subject label 0009',
              correlationId: 'correlation-id-0009',
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/0009',
            },
            requestBodyHash: null,
          },
          expected: expect.objectContaining({
            statusCode: 422,
            error: {
              message: 'Invalid request body',
            },
          }),
        },
      ])

      test.each(cases)('externalRef: $input.input.externalRef', ({
        input,
        expected,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()

        const received = renderer.validateInput(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('#buildRepeatedRunResponse()', () => {
    describe('when the body is the one the key was used with', () => {
      const cases = [
        {
          input: {
            aiRun: {
              runKey: 'run-key-0001',
              requestBodyHash: 'request-body-hash-0001',
              acceptedAt: new Date('2026-09-11T01:01:01.001Z'),
              AiRunStatus: {
                name: 'running',
              },
            },
            requestBodyHash: 'request-body-hash-0001',
          },
          expected: expect.objectContaining({
            statusCode: 202,
            error: null,
            content: {
              runKey: 'run-key-0001',
              runCategoryName: 'run-category-name-0001',
              statusName: 'running',
              acceptedAt: new Date('2026-09-11T01:01:01.001Z'),
            },
          }),
        },
        {
          input: {
            aiRun: {
              runKey: 'run-key-0002',
              requestBodyHash: 'request-body-hash-0002',
              acceptedAt: new Date('2026-09-11T02:02:02.002Z'),
              AiRunStatus: {
                name: 'succeeded',
              },
            },
            requestBodyHash: 'request-body-hash-0002',
          },
          expected: expect.objectContaining({
            statusCode: 202,
            error: null,
            content: {
              runKey: 'run-key-0002',
              runCategoryName: 'run-category-name-0001',
              statusName: 'succeeded',
              acceptedAt: new Date('2026-09-11T02:02:02.002Z'),
            },
          }),
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', ({
        input,
        expected,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()
        jest.spyOn(BaseAiRunPostRenderer, 'aiRunCategory', 'get')
          .mockReturnValue({
            ID: 100001,
            NAME: 'run-category-name-0001',
          })

        const received = renderer.buildRepeatedRunResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the body is not the one the key was used with', () => {
      const cases = [
        {
          input: {
            aiRun: {
              runKey: 'run-key-0003',
              requestBodyHash: 'request-body-hash-0003',
              acceptedAt: new Date('2026-09-11T03:03:03.003Z'),
              AiRunStatus: {
                name: 'queued',
              },
            },
            requestBodyHash: 'request-body-hash-0004',
          },
        },
        {
          input: {
            aiRun: {
              runKey: 'run-key-0005',
              requestBodyHash: 'request-body-hash-0005',
              acceptedAt: new Date('2026-09-11T05:05:05.005Z'),
              AiRunStatus: {
                name: 'running',
              },
            },
            requestBodyHash: 'request-body-hash-0006',
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', ({
        input,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()
        const expected = expect.objectContaining({
          statusCode: 409,
          error: {
            message: 'Idempotency-Key was already used with a different request body',
          },
        })

        const received = renderer.buildRepeatedRunResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('#buildAcceptedResponse()', () => {
    const cases = [
      {
        input: {
          aiRun: {
            runKey: 'run-key-0001',
            acceptedAt: new Date('2026-09-12T01:01:01.001Z'),
          },
          statusName: 'queued',
        },
        expected: expect.objectContaining({
          statusCode: 202,
          error: null,
          content: {
            runKey: 'run-key-0001',
            runCategoryName: 'run-category-name-0002',
            statusName: 'queued',
            acceptedAt: new Date('2026-09-12T01:01:01.001Z'),
          },
        }),
      },
      {
        input: {
          aiRun: {
            runKey: 'run-key-0002',
            acceptedAt: new Date('2026-09-12T02:02:02.002Z'),
          },
          statusName: 'canceled',
        },
        expected: expect.objectContaining({
          statusCode: 202,
          error: null,
          content: {
            runKey: 'run-key-0002',
            runCategoryName: 'run-category-name-0002',
            statusName: 'canceled',
            acceptedAt: new Date('2026-09-12T02:02:02.002Z'),
          },
        }),
      },
    ]

    test.each(cases)('runKey: $input.aiRun.runKey', ({
      input,
      expected,
    }) => {
      const renderer = BaseAiRunPostRenderer.create()
      jest.spyOn(BaseAiRunPostRenderer, 'aiRunCategory', 'get')
        .mockReturnValue({
          ID: 100002,
          NAME: 'run-category-name-0002',
        })

      const received = renderer.buildAcceptedResponse(input)

      expect(received)
        .toEqual(expected)
    })
  })
})
