import AiRunCallbackDeliveryRecorder from '../../../app/aiRunCallback/AiRunCallbackDeliveryRecorder.js'
import AiRunCallbackSender from '../../../app/aiRunCallback/AiRunCallbackSender.js'
import AiRunTerminalCallbackDeliverer from '../../../app/aiRunCallback/AiRunTerminalCallbackDeliverer.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * The three members of the terminal callback's orchestration that write: they post one attempt and
 * record that it was made. Everything that only reads or decides is under
 * `tests/__tests__/app/aiRunCallback/AiRunTerminalCallbackDeliverer.js`.
 *
 * Every run these attempts hang off is created here, in `#run-delivery`'s own id block — 10530021
 * upward — and none is borrowed. `ai_run_callback_deliveries` is UNIQUE on
 * `(AiRunId, AiRunCallbackDeliveryCategoryId, attempt_index)`, and the development seeder already
 * hangs attempts off six of the seeded runs, so writing onto one of those would be this file and
 * that fixture competing for the same triple. The runs belong to the seeded signing client
 * 10000001, whose registered prefix and real encrypted secret are what let the callback be built
 * and signed for real rather than stubbed.
 *
 * The network is the one thing mocked, and it is mocked in the case that lands as well as the ones
 * that do not: a suite that posted to somebody's server would be a suite that posts to somebody's
 * server. Every URL here is under the reserved `.invalid` domain, so a request escaping the stub
 * reaches nothing.
 */

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#deliverTerminalCallback()', () => {
    /*
     * Section 12's first, third and fourth acceptance criteria in one pass: a run that reached a
     * terminal state produces one callback to the client's registered URL; it is signed as a
     * request is and additionally carries the run key in a header; and the body it carries is the
     * body `GET /v1/ai-runs/:runKey` answers with, serialized once.
     *
     * The signature is asserted by shape rather than by a literal, because it is computed over a
     * timestamp read at the moment of the call. That the digest is the same one an inbound request
     * is verified against is `AiRunCallbackSigner`'s own test — it borrows the verifier rather than
     * computing anything of its own, which is what makes that one assertion enough.
     */
    describe('should post the run body to the registered URL', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530021',
              requestKey: 'request-key-10530021',
              requestBodyHash: 'request-body-hash-10530021',
              externalRef: 'external-ref-10530021',
              subjectLabel: 'Subject label of run 10530021',
              correlationId: 'correlation-id-10530021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530021',
              acceptedAt: new Date('2026-09-25T05:00:01.001Z'),
              startedAt: new Date('2026-09-25T05:00:02.002Z'),
              finishedAt: new Date('2026-09-25T05:00:03.003Z'),
            },
            deliverParams: {
              aiRunId: 10530021,
              attemptIndex: 1,
            },
          },
          mockResponseStatus: 200,
          expected: [
            'https://signing.client.development.invalid/callbacks/10530021',
            {
              method: 'POST',
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': expect.stringMatching(/^\d{10}$/u),
                'x-ort-signature': expect.stringMatching(/^[0-9a-f]{64}$/u),
                'x-ort-run-key': 'run-key-10530021',
                'content-type': 'application/json',
              },
              body: '{"runKey":"run-key-10530021","runCategoryName":"asset-media-extraction","externalRef":"external-ref-10530021","subjectLabel":"Subject label of run 10530021","correlationId":"correlation-id-10530021","statusName":"succeeded","engine":{"label":null,"confidenceMethodVersion":null},"usage":{"modelCallCount":0,"inputTokenCount":0,"outputTokenCount":0},"result":null,"failure":null}',
              signal: expect.any(AbortSignal),
            },
          ],
        },
        {
          input: {
            aiRunRow: {
              id: 10530022,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10530022',
              requestKey: 'request-key-10530022',
              requestBodyHash: 'request-body-hash-10530022',
              externalRef: 'external-ref-10530022',
              subjectLabel: 'Subject label of run 10530022',
              correlationId: 'correlation-id-10530022',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530022',
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: {
                limitName: 'mediaCount',
                limitValue: 12,
                declaredValue: 13,
              },
              acceptedAt: new Date('2026-09-25T06:00:01.001Z'),
              startedAt: new Date('2026-09-25T06:00:02.002Z'),
              finishedAt: new Date('2026-09-25T06:00:03.003Z'),
            },
            deliverParams: {
              aiRunId: 10530022,
              attemptIndex: 2,
            },
          },
          mockResponseStatus: 204,
          expected: [
            'https://signing.client.development.invalid/callbacks/10530022',
            {
              method: 'POST',
              headers: {
                'x-ort-client-id': 'client-key-signing-10000001',
                'x-ort-timestamp': expect.stringMatching(/^\d{10}$/u),
                'x-ort-signature': expect.stringMatching(/^[0-9a-f]{64}$/u),
                'x-ort-run-key': 'run-key-10530022',
                'content-type': 'application/json',
              },
              body: '{"runKey":"run-key-10530022","runCategoryName":"asset-media-extraction","externalRef":"external-ref-10530022","subjectLabel":"Subject label of run 10530022","correlationId":"correlation-id-10530022","statusName":"failed","engine":{"label":null,"confidenceMethodVersion":null},"usage":{"modelCallCount":0,"inputTokenCount":0,"outputTokenCount":0},"result":null,"failure":{"reasonCode":"MEDIA_LIMIT_EXCEEDED","parameters":{"limitName":"mediaCount","limitValue":12,"declaredValue":13}}}',
              signal: expect.any(AbortSignal),
            },
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.deliverParams.aiRunId', async ({
        input,
        mockResponseStatus,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: mockResponseStatus,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        await deliverer.deliverTerminalCallback(input.deliverParams)

        expect(fetchFunction)
          .toHaveBeenCalledWith(...expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#deliverTerminalCallback()', () => {
    /*
     * One row per attempt, carrying the index the queue handed in — which is what makes "it was
     * retried" a count rather than a claim (section 12's eighth acceptance criterion). The run
     * below carries three attempts under three different answers: refused, never completed, and
     * finally accepted.
     */
    describe('should record one row per attempt', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530023,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530023',
              requestKey: 'request-key-10530023',
              requestBodyHash: 'request-body-hash-10530023',
              externalRef: 'external-ref-10530023',
              subjectLabel: 'Subject label of run 10530023',
              correlationId: 'correlation-id-10530023',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530023',
              acceptedAt: new Date('2026-09-25T07:00:01.001Z'),
              startedAt: new Date('2026-09-25T07:00:02.002Z'),
              finishedAt: new Date('2026-09-25T07:00:03.003Z'),
            },
            firstAttempt: {
              aiRunId: 10530023,
              attemptIndex: 1,
            },
            secondAttempt: {
              aiRunId: 10530023,
              attemptIndex: 2,
            },
            thirdAttempt: {
              aiRunId: 10530023,
              attemptIndex: 3,
            },
            findParams: {
              aiRunId: 10530023,
              callbackDeliveryCategoryName: 'terminal',
            },
          },
          expected: [
            expect.objectContaining({
              AiRunId: 10530023,
              AiRunCallbackDeliveryCategoryId: 1,
              attemptIndex: 1,
              httpStatusCode: 503,
            }),
            expect.objectContaining({
              AiRunId: 10530023,
              AiRunCallbackDeliveryCategoryId: 1,
              attemptIndex: 2,
              httpStatusCode: null,
            }),
            expect.objectContaining({
              AiRunId: 10530023,
              AiRunCallbackDeliveryCategoryId: 1,
              attemptIndex: 3,
              httpStatusCode: 202,
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.findParams.aiRunId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetchFunction = jest.fn()
          .mockResolvedValueOnce(new Response(null, {
            status: 503,
          }))
          .mockRejectedValueOnce(new TypeError('fetch failed'))
          .mockResolvedValueOnce(new Response(null, {
            status: 202,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)
        jest.spyOn(AiRunCallbackSender.mentsuLogger, 'error')
          .mockReturnValue(null)

        const deliverer = AiRunTerminalCallbackDeliverer.create()
        const recorder = AiRunCallbackDeliveryRecorder.create()

        await deliverer.deliverTerminalCallback(input.firstAttempt)
        await deliverer.deliverTerminalCallback(input.secondAttempt)
        await deliverer.deliverTerminalCallback(input.thirdAttempt)

        const actual = await recorder.findAiRunCallbackDeliveries(input.findParams)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#deliverTerminalCallback()', () => {
    /*
     * Section 12's second acceptance criterion: a callback URL that does not match the client's
     * registered prefix is not called at all. "At all" is read strictly — nothing is posted, and
     * no attempt is recorded either, because a delivery row says an attempt was made and the retry
     * count is read off those rows.
     *
     * The first run's URL is on another host entirely; the second's normalizes out of the
     * registered path, which a comparison made on the text as it arrived would have let through.
     */
    describe('should post nothing when the URL is not the registered one', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530024,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530024',
              requestKey: 'request-key-10530024',
              requestBodyHash: 'request-body-hash-10530024',
              externalRef: 'external-ref-10530024',
              subjectLabel: 'Subject label of run 10530024',
              correlationId: 'correlation-id-10530024',
              callbackUrl: 'https://elsewhere.client.development.invalid/callbacks/10530024',
              acceptedAt: new Date('2026-09-25T08:00:01.001Z'),
              startedAt: new Date('2026-09-25T08:00:02.002Z'),
              finishedAt: new Date('2026-09-25T08:00:03.003Z'),
            },
            deliverParams: {
              aiRunId: 10530024,
              attemptIndex: 1,
            },
            findParams: {
              aiRunId: 10530024,
              callbackDeliveryCategoryName: 'terminal',
            },
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unregistered-callback-url',
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10530025,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10530025',
              requestKey: 'request-key-10530025',
              requestBodyHash: 'request-body-hash-10530025',
              externalRef: 'external-ref-10530025',
              subjectLabel: 'Subject label of run 10530025',
              correlationId: 'correlation-id-10530025',
              // normalizes to https://signing.client.development.invalid/elsewhere
              callbackUrl: 'https://signing.client.development.invalid/callbacks/../../elsewhere',
              acceptedAt: new Date('2026-09-25T09:00:01.001Z'),
              startedAt: new Date('2026-09-25T09:00:02.002Z'),
              finishedAt: new Date('2026-09-25T09:00:03.003Z'),
            },
            deliverParams: {
              aiRunId: 10530025,
              attemptIndex: 1,
            },
            findParams: {
              aiRunId: 10530025,
              callbackDeliveryCategoryName: 'terminal',
            },
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unregistered-callback-url',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.deliverParams.aiRunId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: 200,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)
        jest.spyOn(AiRunTerminalCallbackDeliverer.mentsuLogger, 'error')
          .mockReturnValue(null)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.deliverTerminalCallback(input.deliverParams)

        expect(actual)
          .toEqual(expected)
        expect(fetchFunction)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#deliverTerminalCallback()', () => {
    /*
     * The other half of "not called at all": no attempt was made, so no row was written. Read back
     * through the recorder's own finder, because the attempts of a run are exactly what the retry
     * count is read from.
     */
    describe('should record nothing when the URL is not the registered one', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530026,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530026',
              requestKey: 'request-key-10530026',
              requestBodyHash: 'request-body-hash-10530026',
              externalRef: 'external-ref-10530026',
              subjectLabel: 'Subject label of run 10530026',
              correlationId: 'correlation-id-10530026',
              callbackUrl: 'https://elsewhere.client.development.invalid/callbacks/10530026',
              acceptedAt: new Date('2026-09-25T10:00:01.001Z'),
              startedAt: new Date('2026-09-25T10:00:02.002Z'),
              finishedAt: new Date('2026-09-25T10:00:03.003Z'),
            },
            deliverParams: {
              aiRunId: 10530026,
              attemptIndex: 1,
            },
            findParams: {
              aiRunId: 10530026,
              callbackDeliveryCategoryName: 'terminal',
            },
          },
        },
      ]

      test.each(cases)('aiRunId: $input.deliverParams.aiRunId', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow)

        jest.spyOn(AiRunTerminalCallbackDeliverer.mentsuLogger, 'error')
          .mockReturnValue(null)

        const deliverer = AiRunTerminalCallbackDeliverer.create()
        const recorder = AiRunCallbackDeliveryRecorder.create()

        await deliverer.deliverTerminalCallback(input.deliverParams)

        const actual = await recorder.findAiRunCallbackDeliveries(input.findParams)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#deliverTerminalCallback()', () => {
    /*
     * A run the job body names and no row carries. It reaches the deliverer rather than being
     * refused at the worker, because a well-formed id naming nothing is not a defect in the call —
     * it is a job outliving its run, and the answer is that there is nothing to send.
     */
    describe('should answer a refusal when no run carries the id', () => {
      const cases = [
        {
          input: {
            deliverParams: {
              aiRunId: 10539001,
              attemptIndex: 1,
            },
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unknown-ai-run',
          },
        },
        {
          input: {
            deliverParams: {
              aiRunId: 10539002,
              attemptIndex: 2,
            },
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unknown-ai-run',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.deliverParams.aiRunId', async ({
        input,
        expected,
      }) => {
        jest.spyOn(AiRunTerminalCallbackDeliverer.mentsuLogger, 'error')
          .mockReturnValue(null)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.deliverTerminalCallback(input.deliverParams)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#attemptTerminalCallback()', () => {
    /*
     * A client whose stored secret will not decrypt is not sent a callback at all. A callback
     * bearing a signature nothing can verify looks signed to everything that handles it, which is
     * the one failure a signature exists to make impossible — so the attempt is refused before the
     * request, and no row claims one was made.
     */
    describe('should post nothing when the secret does not decrypt', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530027,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530027',
              requestKey: 'request-key-10530027',
              requestBodyHash: 'request-body-hash-10530027',
              externalRef: 'external-ref-10530027',
              subjectLabel: 'Subject label of run 10530027',
              correlationId: 'correlation-id-10530027',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530027',
              acceptedAt: new Date('2026-09-25T11:00:01.001Z'),
              startedAt: new Date('2026-09-25T11:00:02.002Z'),
              finishedAt: new Date('2026-09-25T11:00:03.003Z'),
            },
            attemptParams: {
              apiClient: {
                clientKey: 'client-key-signing-10000001',
                callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
                secretCiphertext: 'not-an-envelope-0001',
              },
              attemptIndex: 1,
            },
            findParams: {
              aiRunId: 10530027,
              callbackDeliveryCategoryName: 'terminal',
            },
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unsignable-client-secret',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.findParams.aiRunId', async ({
        input,
        expected,
      }) => {
        const aiRun = await AiRun.create(input.aiRunRow)

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: 200,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)
        jest.spyOn(AiRunTerminalCallbackDeliverer.mentsuLogger, 'error')
          .mockReturnValue(null)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.attemptTerminalCallback({
          aiRun,
          apiClient: input.attemptParams.apiClient,
          attemptIndex: input.attemptParams.attemptIndex,
        })

        expect(actual)
          .toEqual(expected)
        expect(fetchFunction)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#saveTerminalCallbackDelivery()', () => {
    /*
     * The row an attempt leaves behind, written whatever came back. A request that never completed
     * is an attempt that was made, and the null status is the column's own case — there is nothing
     * to substitute for it.
     */
    describe('should record the attempt as its own row', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530028,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530028',
              requestKey: 'request-key-10530028',
              requestBodyHash: 'request-body-hash-10530028',
              externalRef: 'external-ref-10530028',
              subjectLabel: 'Subject label of run 10530028',
              correlationId: 'correlation-id-10530028',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530028',
              acceptedAt: new Date('2026-09-25T12:00:01.001Z'),
              startedAt: new Date('2026-09-25T12:00:02.002Z'),
              finishedAt: new Date('2026-09-25T12:00:03.003Z'),
            },
            saveParams: {
              attemptIndex: 4,
              httpStatusCode: 500,
              attemptedAt: new Date('2026-09-25T12:00:04.004Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10530028,
            AiRunCallbackDeliveryCategoryId: 1,
            attemptIndex: 4,
            httpStatusCode: 500,
            attemptedAt: new Date('2026-09-25T12:00:04.004Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10530029,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10530029',
              requestKey: 'request-key-10530029',
              requestBodyHash: 'request-body-hash-10530029',
              externalRef: 'external-ref-10530029',
              subjectLabel: 'Subject label of run 10530029',
              correlationId: 'correlation-id-10530029',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530029',
              failureReasonCode: 'PROVIDER_CALL_FAILED',
              acceptedAt: new Date('2026-09-25T13:00:01.001Z'),
              startedAt: new Date('2026-09-25T13:00:02.002Z'),
              finishedAt: new Date('2026-09-25T13:00:03.003Z'),
            },
            saveParams: {
              attemptIndex: 5,
              httpStatusCode: null,
              attemptedAt: new Date('2026-09-25T13:00:05.005Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10530029,
            AiRunCallbackDeliveryCategoryId: 1,
            attemptIndex: 5,
            httpStatusCode: null,
            attemptedAt: new Date('2026-09-25T13:00:05.005Z'),
          }),
        },
      ]

      test.each(cases)('attemptIndex: $input.saveParams.attemptIndex', async ({
        input,
        expected,
      }) => {
        const aiRun = await AiRun.create(input.aiRunRow)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.saveTerminalCallbackDelivery({
          aiRun,
          attemptIndex: input.saveParams.attemptIndex,
          httpStatusCode: input.saveParams.httpStatusCode,
          attemptedAt: input.saveParams.attemptedAt,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
