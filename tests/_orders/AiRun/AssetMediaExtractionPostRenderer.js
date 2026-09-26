import AssetMediaExtractionPostRenderer from '../../../server/restfulapi/renderers/v1/post/AssetMediaExtractionPostRenderer.js'

import AiRunAcceptor from '../../../app/aiRun/AiRunAcceptor.js'
import AiRunJobDispatchRegistrar from '../../../app/aiRun/AiRunJobDispatchRegistrar.js'
import RunKeyGenerator from '../../../app/aiRun/RunKeyGenerator.js'

/*
 * The three members of the stub route that write, read against the real database.
 *
 * **What a client actually receives is here, not in the sibling `__tests__` file.** The accepted
 * response carries a run key and nothing else, so a test that stopped at the `202` would say nothing
 * about the screen the fourth use case is about. Each case below reads the run back through the
 * acceptor's own finder — code that is itself under test — and asserts the result body the run was
 * settled with, which is the body `GET /v1/ai-runs/:runKey` then hands the client.
 *
 * **The two cases name different photos, and that is the point of there being two.** The same schema
 * and the same asset answer two different bodies because the media differ, and each body is written
 * out as a literal, so the answer is pinned across processes rather than merely consistent within
 * one.
 */

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#render()', () => {
    describe('when the key is arriving for the first time', () => {
      const cases = [
        {
          override: {
            runKey: 'run-key-stub-10600001',
          },
          input: {
            body: {
              externalRef: 'external-ref-10600001',
              subjectLabel: 'Subject label of stub run 10600001',
              correlationId: 'correlation-id-10600001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10600001',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-25T01:01:01.001Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-10600001',
                },
                rawBody: '{"externalRef":"external-ref-10600001","subjectLabel":"Subject label of stub run 10600001","correlationId":"correlation-id-10600001","callbackUrl":"https://signing.client.development.invalid/callbacks/10600001","asset":{"categorySlugs":["residential"],"province":"Ha Noi"},"fieldSchema":[{"path":"attributes.wallMaterial","label":"Wall material","valueKind":"text","isRequired":true},{"path":"attributes.legalStatusSlug","label":"Legal status","valueKind":"select","isRequired":true,"options":["full-title","pending-title","no-title"]}],"media":[{"mediaKey":"media-key-10600001","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10600001.jpg","mimeType":"image/jpeg","byteSize":120001},{"mediaKey":"media-key-10600003","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10600003.jpg","mimeType":"image/jpeg","byteSize":120001}],"mediaSignature":"media-signature-10600001"}',
              },
            },
          },
          expected: {
            response: expect.objectContaining({
              statusCode: 202,
              error: null,
              content: {
                runKey: 'run-key-stub-10600001',
                runCategoryName: 'asset-media-extraction',
                statusName: 'queued',
                acceptedAt: new Date('2026-09-25T01:01:01.001Z'),
              },
            }),
            settledAiRun: expect.objectContaining({
              runKey: 'run-key-stub-10600001',
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              finishedAt: new Date('2026-09-25T01:01:01.001Z'),
              resultBody: '{"fields":[{"path":"attributes.wallMaterial","value":"concrete","fieldStateName":"derived","suggestionConfidence":0.8,"reason":"Read \\"Wall material\\" from 2 of the photos sent, for an asset in Ha Noi.","sourceMediaKeys":["media-key-10600001","media-key-10600003"],"agreement":{"agreedReadingCount":3,"totalReadingCount":3}}],"missingFieldPaths":["attributes.legalStatusSlug"],"unreadableMediaKeys":[],"mediaSignature":"media-signature-10600001"}',
            }),
          },
        },
        {
          override: {
            runKey: 'run-key-stub-10600002',
          },
          input: {
            body: {
              externalRef: 'external-ref-10600002',
              subjectLabel: 'Subject label of stub run 10600002',
              correlationId: 'correlation-id-10600002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10600002',
            },
            context: {
              apiClientId: 10000002,
              now: new Date('2026-09-25T02:02:02.002Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-10600002',
                },
                rawBody: '{"externalRef":"external-ref-10600002","subjectLabel":"Subject label of stub run 10600002","correlationId":"correlation-id-10600002","callbackUrl":"https://signing.client.development.invalid/callbacks/10600002","asset":{"categorySlugs":["residential"],"province":"Ha Noi"},"fieldSchema":[{"path":"attributes.wallMaterial","label":"Wall material","valueKind":"text","isRequired":true},{"path":"attributes.legalStatusSlug","label":"Legal status","valueKind":"select","isRequired":true,"options":["full-title","pending-title","no-title"]}],"media":[{"mediaKey":"media-key-10600004","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10600004.jpg","mimeType":"image/jpeg","byteSize":120001},{"mediaKey":"media-key-10600005","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10600005.jpg","mimeType":"image/jpeg","byteSize":120001},{"mediaKey":"media-key-10600006","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10600006.jpg","mimeType":"image/jpeg","byteSize":120001}],"mediaSignature":"media-signature-10600002"}',
              },
            },
          },
          expected: {
            response: expect.objectContaining({
              statusCode: 202,
              error: null,
              content: {
                runKey: 'run-key-stub-10600002',
                runCategoryName: 'asset-media-extraction',
                statusName: 'queued',
                acceptedAt: new Date('2026-09-25T02:02:02.002Z'),
              },
            }),
            settledAiRun: expect.objectContaining({
              runKey: 'run-key-stub-10600002',
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              finishedAt: new Date('2026-09-25T02:02:02.002Z'),
              resultBody: '{"fields":[{"path":"attributes.wallMaterial","value":"concrete","fieldStateName":"derived","suggestionConfidence":0.8,"reason":"Read \\"Wall material\\" from 1 of the photos sent, for an asset in Ha Noi.","sourceMediaKeys":["media-key-10600006"],"agreement":{"agreedReadingCount":3,"totalReadingCount":3}},{"path":"attributes.legalStatusSlug","value":"pending-title","fieldStateName":"derived","suggestionConfidence":0.53,"reason":"Read \\"Legal status\\" from 3 of the photos sent, for an asset in Ha Noi.","sourceMediaKeys":["media-key-10600004","media-key-10600005","media-key-10600006"],"agreement":{"agreedReadingCount":2,"totalReadingCount":3}}],"missingFieldPaths":[],"unreadableMediaKeys":[],"mediaSignature":"media-signature-10600002"}',
            }),
          },
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', async ({
        override,
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()

        const runKeyGenerator = RunKeyGenerator.create()
        jest.spyOn(runKeyGenerator, 'generateRunKey')
          .mockReturnValue(override.runKey)
        const aiRunAcceptor = AiRunAcceptor.create({
          runKeyGenerator,
        })
        jest.spyOn(AssetMediaExtractionPostRenderer, 'createAiRunAcceptor')
          .mockReturnValue(aiRunAcceptor)

        const findAiRunArgs = {
          apiClientId: input.context.apiClientId,
          requestKey: input.request.expressRequest.headers['idempotency-key'],
        }

        const received = await renderer.render(input)

        const settledAiRun = await aiRunAcceptor.findAiRun(findAiRunArgs)
        expect(received)
          .toEqual(expected.response)
        expect(settledAiRun) // The run the caller was handed a key to, as it now stands
          .toEqual(expected.settledAiRun)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#saveAcceptedAiRun()', () => {
    const cases = [
      {
        override: {
          runKey: 'run-key-stub-10600003',
        },
        input: {
          context: {
            apiClientId: 10000001,
            now: new Date('2026-09-25T03:03:03.003Z'),
          },
          input: {
            requestKey: 'request-key-10600003',
            externalRef: 'external-ref-10600003',
            subjectLabel: 'Subject label of stub run 10600003',
            correlationId: 'correlation-id-10600003',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10600003',
          },
          rawBody: '{"externalRef":"external-ref-10600003","media":[],"mediaSignature":"media-signature-10600003"}',
          requestBodyHash: 'request-body-hash-10600003',
        },
        expected: {
          settleArgs: {
            aiRunId: expect.any(Number),
            rawBody: '{"externalRef":"external-ref-10600003","media":[],"mediaSignature":"media-signature-10600003"}',
            finishedAt: new Date('2026-09-25T03:03:03.003Z'),
          },
        },
      },
      {
        override: {
          runKey: 'run-key-stub-10600004',
        },
        input: {
          context: {
            apiClientId: 10000002,
            now: new Date('2026-09-25T04:04:04.004Z'),
          },
          input: {
            requestKey: 'request-key-10600004',
            externalRef: 'external-ref-10600004',
            subjectLabel: 'Subject label of stub run 10600004',
            correlationId: 'correlation-id-10600004',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10600004',
          },
          rawBody: '{"externalRef":"external-ref-10600004","media":[],"mediaSignature":"media-signature-10600004"}',
          requestBodyHash: 'request-body-hash-10600004',
        },
        expected: {
          settleArgs: {
            aiRunId: expect.any(Number),
            rawBody: '{"externalRef":"external-ref-10600004","media":[],"mediaSignature":"media-signature-10600004"}',
            finishedAt: new Date('2026-09-25T04:04:04.004Z'),
          },
        },
      },
    ]

    test.each(cases)('requestKey: $input.input.requestKey', async ({
      override,
      input,
      expected,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()
      const settleStubAiRunSpy = jest.spyOn(renderer, 'settleStubAiRun')
        .mockResolvedValue(true)

      const runKeyGenerator = RunKeyGenerator.create()
      jest.spyOn(runKeyGenerator, 'generateRunKey')
        .mockReturnValue(override.runKey)
      const args = {
        aiRunAcceptor: AiRunAcceptor.create({
          runKeyGenerator,
        }),
        aiRunJobDispatchRegistrar: AiRunJobDispatchRegistrar.create({
          jobDispatcher: AssetMediaExtractionPostRenderer.stubJobDispatcher,
        }),
        context: input.context,
        input: input.input,
        rawBody: input.rawBody,
        requestBodyHash: input.requestBodyHash,
      }

      const acceptedAiRun = await renderer.saveAcceptedAiRun(args)
      const received = acceptedAiRun.runKey

      expect(received)
        .toBe(override.runKey)
      expect(settleStubAiRunSpy)
        .toHaveBeenCalledWith(expected.settleArgs)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#settleStubAiRun()', () => {
    const cases = [
      {
        override: {
          runKey: 'run-key-stub-10600005',
        },
        input: {
          acceptArgs: {
            apiClientId: 10000001,
            aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            input: {
              requestKey: 'request-key-10600005',
              externalRef: 'external-ref-10600005',
              subjectLabel: 'Subject label of stub run 10600005',
              correlationId: 'correlation-id-10600005',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10600005',
            },
            rawBody: '{"externalRef":"external-ref-10600005","media":[],"mediaSignature":"media-signature-10600005"}',
            requestBodyHash: 'request-body-hash-10600005',
            acceptedAt: new Date('2026-09-25T05:05:05.005Z'),
          },
          rawBody: '{"externalRef":"external-ref-10600005","media":[],"mediaSignature":"media-signature-10600005"}',
          finishedAt: new Date('2026-09-25T05:05:05.505Z'),
        },
      },
      {
        override: {
          runKey: 'run-key-stub-10600006',
        },
        input: {
          acceptArgs: {
            apiClientId: 10000002,
            aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            input: {
              requestKey: 'request-key-10600006',
              externalRef: 'external-ref-10600006',
              subjectLabel: 'Subject label of stub run 10600006',
              correlationId: 'correlation-id-10600006',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10600006',
            },
            rawBody: '{"externalRef":"external-ref-10600006","media":[],"mediaSignature":"media-signature-10600006"}',
            requestBodyHash: 'request-body-hash-10600006',
            acceptedAt: new Date('2026-09-25T06:06:06.006Z'),
          },
          rawBody: '{"externalRef":"external-ref-10600006","media":[],"mediaSignature":"media-signature-10600006"}',
          finishedAt: new Date('2026-09-25T06:06:06.606Z'),
        },
      },
    ]

    test.each(cases)('requestKey: $input.acceptArgs.input.requestKey', async ({
      override,
      input,
    }) => {
      const renderer = AssetMediaExtractionPostRenderer.create()

      const runKeyGenerator = RunKeyGenerator.create()
      jest.spyOn(runKeyGenerator, 'generateRunKey')
        .mockReturnValue(override.runKey)
      const aiRunAcceptor = AiRunAcceptor.create({
        runKeyGenerator,
      })
      const acceptedAiRun = await aiRunAcceptor.saveAiRun(input.acceptArgs)
      const args = {
        aiRunId: acceptedAiRun.id,
        rawBody: input.rawBody,
        finishedAt: input.finishedAt,
      }

      const received = await renderer.settleStubAiRun(args)

      expect(received)
        .toBeTruthy()
    })
  })
})
