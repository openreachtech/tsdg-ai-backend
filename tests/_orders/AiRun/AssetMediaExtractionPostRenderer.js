import AssetMediaExtractionPostRenderer from '../../../server/restfulapi/renderers/v1/post/AssetMediaExtractionPostRenderer.js'

import AiRunAcceptor from '../../../app/aiRun/AiRunAcceptor.js'
import AiRunRateLimitInspector from '../../../app/aiRun/AiRunRateLimitInspector.js'
import RunKeyGenerator from '../../../app/aiRun/RunKeyGenerator.js'

/*
 * The one member of this route that writes, read against the real database.
 *
 * **What a client receives, and what is left behind afterwards, are asserted apart.** The accepted
 * response carries a run key and three other fields; the run it names is a row that has to still be
 * queued when the request ends, because nothing in this service has read a photo yet. The stub that
 * stood here settled that row inside the request, so the case asserting it is *not* settled is the
 * one that would have failed against the code this replaced - `AiRunStatusId` succeeded, a
 * `finishedAt` and a `resultBody`, all written before the caller was answered.
 *
 * **The job is dispatched, and it is dispatched after the commit.** The dispatcher is stood in
 * for, because obtaining the real one means opening a Redis connection a test may not open - the
 * base reaches it through the request share, which these cases carry none of. The registration
 * itself is real, so the call can be asserted and the run it names read back: a dispatch naming a
 * run the transaction never committed is the failure that registration exists to prevent, and it
 * is the one thing about the queue that is this route's to get right.
 *
 * **The rate-limit refusal is the last acceptance criterion of section 20**, in the half of it that
 * is checkable: "a client that has exceeded its rate limit is refused, and no run is created". The
 * other half - "and no model is called" - is vacuous here, in a class that calls no model on any
 * path, and no case below pretends to assert it.
 *
 * The refusal cases stand on the development seeder's own runs inside 2026-09-10, where the three
 * seeded clients hold six, three and two runs and nothing any test writes ever lands; the accepted
 * cases are dated 2026-10-12, clear of that day, so the runs they create cannot move a count the
 * read-only tests assert. Every run below is created through the acceptor and takes its id from the
 * auto-increment, which is why this file sits above every file writing an explicit id.
 */

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#render()', () => {
    describe('when the key is arriving for the first time', () => {
      describe('should answer with the run it accepted', () => {
        const cases = [
          {
            override: {
              runKey: 'run-key-10620001',
            },
            input: {
              body: {
                externalRef: 'external-ref-10620001',
                subjectLabel: 'Subject label of run 10620001',
                correlationId: 'correlation-id-10620001',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10620001',
              },
              context: {
                apiClientId: 10000001,
                now: new Date('2026-10-12T01:01:01.001Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620001',
                  },
                  rawBody: '{"externalRef":"external-ref-10620001","subjectLabel":"Subject label of run 10620001","correlationId":"correlation-id-10620001","callbackUrl":"https://signing.client.development.invalid/callbacks/10620001","asset":{"categorySlugs":["residential"],"province":"Ha Noi"},"fieldSchema":[{"path":"attributes.wallMaterial","label":"Wall material","valueKind":"text","isRequired":true}],"media":[{"mediaKey":"media-key-10620001","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10620001.jpg","mimeType":"image/jpeg","byteSize":120001}],"mediaSignature":"media-signature-10620001"}',
                },
              },
            },
            expected: expect.objectContaining({
              statusCode: 202,
              error: null,
              content: {
                runKey: 'run-key-10620001',
                runCategoryName: 'asset-media-extraction',
                statusName: 'queued',
                acceptedAt: new Date('2026-10-12T01:01:01.001Z'),
              },
            }),
          },
          {
            override: {
              runKey: 'run-key-10620002',
            },
            input: {
              body: {
                externalRef: 'external-ref-10620002',
                subjectLabel: 'Subject label of run 10620002',
                correlationId: 'correlation-id-10620002',
                callbackUrl: 'https://rotating.client.development.invalid/callbacks/10620002',
              },
              context: {
                apiClientId: 10000002,
                now: new Date('2026-10-12T02:02:02.002Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620002',
                  },
                  rawBody: '{"externalRef":"external-ref-10620002","subjectLabel":"Subject label of run 10620002","correlationId":"correlation-id-10620002","callbackUrl":"https://rotating.client.development.invalid/callbacks/10620002","asset":{"categorySlugs":["commercial"],"province":"Da Nang"},"fieldSchema":[{"path":"attributes.floorCount","label":"Floor count","valueKind":"number","isRequired":false,"unit":"floor"}],"media":[{"mediaKey":"media-key-10620002","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10620002.jpg","mimeType":"image/png","byteSize":230002}],"mediaSignature":"media-signature-10620002"}',
                },
              },
            },
            expected: expect.objectContaining({
              statusCode: 202,
              error: null,
              content: {
                runKey: 'run-key-10620002',
                runCategoryName: 'asset-media-extraction',
                statusName: 'queued',
                acceptedAt: new Date('2026-10-12T02:02:02.002Z'),
              },
            }),
          },
        ]

        test.each(cases)('externalRef: $input.body.externalRef', async ({
          override,
          input,
          expected,
        }) => {
          const renderer = AssetMediaExtractionPostRenderer.create()
          const jobDispatcher = {
            dispatchJob: async () => null,
          }
          jest.spyOn(renderer, 'ensureJobDispatcher')
            .mockResolvedValue(jobDispatcher)

          const runKeyGenerator = RunKeyGenerator.create()
          jest.spyOn(runKeyGenerator, 'generateRunKey')
            .mockReturnValue(override.runKey)
          jest.spyOn(AssetMediaExtractionPostRenderer, 'createAiRunAcceptor')
            .mockReturnValue(AiRunAcceptor.create({
              runKeyGenerator,
            }))

          const received = await renderer.render(input)

          expect(received)
            .toEqual(expected)
        })
      })

      describe('should leave the run queued and unsettled', () => {
        const cases = [
          {
            override: {
              runKey: 'run-key-10620003',
            },
            input: {
              body: {
                externalRef: 'external-ref-10620003',
                subjectLabel: 'Subject label of run 10620003',
                correlationId: 'correlation-id-10620003',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10620003',
              },
              context: {
                apiClientId: 10000001,
                now: new Date('2026-10-12T03:03:03.003Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620003',
                  },
                  rawBody: '{"externalRef":"external-ref-10620003","subjectLabel":"Subject label of run 10620003","correlationId":"correlation-id-10620003","callbackUrl":"https://signing.client.development.invalid/callbacks/10620003","asset":{"categorySlugs":["residential"],"province":"Hai Phong"},"fieldSchema":[{"path":"attributes.roofMaterial","label":"Roof material","valueKind":"text","isRequired":true}],"media":[{"mediaKey":"media-key-10620003","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10620003.jpg","mimeType":"image/jpeg","byteSize":340003}],"mediaSignature":"media-signature-10620003"}',
                },
              },
            },
            expected: expect.objectContaining({
              runKey: 'run-key-10620003',
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              acceptedAt: new Date('2026-10-12T03:03:03.003Z'),
              startedAt: null,
              finishedAt: null,
              resultBody: null,
              failureReasonCode: null,
            }),
          },
          {
            override: {
              runKey: 'run-key-10620004',
            },
            input: {
              body: {
                externalRef: 'external-ref-10620004',
                subjectLabel: 'Subject label of run 10620004',
                correlationId: 'correlation-id-10620004',
                callbackUrl: 'https://rotating.client.development.invalid/callbacks/10620004',
              },
              context: {
                apiClientId: 10000002,
                now: new Date('2026-10-12T04:04:04.004Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620004',
                  },
                  rawBody: '{"externalRef":"external-ref-10620004","subjectLabel":"Subject label of run 10620004","correlationId":"correlation-id-10620004","callbackUrl":"https://rotating.client.development.invalid/callbacks/10620004","asset":{"categorySlugs":["land"],"province":"Can Tho"},"fieldSchema":[{"path":"attributes.legalStatusSlug","label":"Legal status","valueKind":"select","isRequired":true,"options":["full-title","pending-title"]}],"media":[],"mediaSignature":"media-signature-10620004"}',
                },
              },
            },
            expected: expect.objectContaining({
              runKey: 'run-key-10620004',
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              acceptedAt: new Date('2026-10-12T04:04:04.004Z'),
              startedAt: null,
              finishedAt: null,
              resultBody: null,
              failureReasonCode: null,
            }),
          },
        ]

        test.each(cases)('externalRef: $input.body.externalRef', async ({
          override,
          input,
          expected,
        }) => {
          const renderer = AssetMediaExtractionPostRenderer.create()
          const jobDispatcher = {
            dispatchJob: async () => null,
          }
          jest.spyOn(renderer, 'ensureJobDispatcher')
            .mockResolvedValue(jobDispatcher)

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

          await renderer.render(input)

          const received = await aiRunAcceptor.findAiRun(findAiRunArgs)
          expect(received)
            .toEqual(expected)
        })
      })

      describe('should dispatch the run job once the transaction has committed', () => {
        const cases = [
          {
            override: {
              runKey: 'run-key-10620005',
            },
            input: {
              body: {
                externalRef: 'external-ref-10620005',
                subjectLabel: 'Subject label of run 10620005',
                correlationId: 'correlation-id-10620005',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10620005',
              },
              context: {
                apiClientId: 10000001,
                now: new Date('2026-10-12T05:05:05.005Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620005',
                  },
                  rawBody: '{"externalRef":"external-ref-10620005","subjectLabel":"Subject label of run 10620005","correlationId":"correlation-id-10620005","callbackUrl":"https://signing.client.development.invalid/callbacks/10620005","asset":{"categorySlugs":["residential"],"province":"Hue"},"fieldSchema":[{"path":"attributes.wallMaterial","label":"Wall material","valueKind":"text","isRequired":false}],"media":[{"mediaKey":"media-key-10620005","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10620005.jpg","mimeType":"image/jpeg","byteSize":450005}],"mediaSignature":"media-signature-10620005"}',
                },
              },
            },
          },
          {
            override: {
              runKey: 'run-key-10620006',
            },
            input: {
              body: {
                externalRef: 'external-ref-10620006',
                subjectLabel: 'Subject label of run 10620006',
                correlationId: 'correlation-id-10620006',
                callbackUrl: 'https://rotating.client.development.invalid/callbacks/10620006',
              },
              context: {
                apiClientId: 10000002,
                now: new Date('2026-10-12T06:06:06.006Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620006',
                  },
                  rawBody: '{"externalRef":"external-ref-10620006","subjectLabel":"Subject label of run 10620006","correlationId":"correlation-id-10620006","callbackUrl":"https://rotating.client.development.invalid/callbacks/10620006","asset":{"categorySlugs":["commercial"],"province":"Nha Trang"},"fieldSchema":[{"path":"attributes.floorCount","label":"Floor count","valueKind":"number","isRequired":true,"unit":"floor"}],"media":[{"mediaKey":"media-key-10620006","mediaCategoryName":"photo","url":"https://storage.client.development.invalid/media-key-10620006.jpg","mimeType":"image/webp","byteSize":560006}],"mediaSignature":"media-signature-10620006"}',
                },
              },
            },
          },
        ]

        test.each(cases)('externalRef: $input.body.externalRef', async ({
          override,
          input,
        }) => {
          const renderer = AssetMediaExtractionPostRenderer.create()
          const jobDispatcher = {
            dispatchJob: async () => null,
          }
          jest.spyOn(renderer, 'ensureJobDispatcher')
            .mockResolvedValue(jobDispatcher)

          const runKeyGenerator = RunKeyGenerator.create()
          jest.spyOn(runKeyGenerator, 'generateRunKey')
            .mockReturnValue(override.runKey)
          const aiRunAcceptor = AiRunAcceptor.create({
            runKeyGenerator,
          })
          jest.spyOn(AssetMediaExtractionPostRenderer, 'createAiRunAcceptor')
            .mockReturnValue(aiRunAcceptor)
          const dispatchJobSpy = jest.spyOn(jobDispatcher, 'dispatchJob')
          const findAiRunArgs = {
            apiClientId: input.context.apiClientId,
            requestKey: input.request.expressRequest.headers['idempotency-key'],
          }

          await renderer.render(input)

          const acceptedAiRun = await aiRunAcceptor.findAiRun(findAiRunArgs)
          const expected = {
            body: {
              aiRunId: acceptedAiRun.id,
            },
            keepsConnection: true,
          }
          expect(dispatchJobSpy)
            .toHaveBeenCalledWith(expected)
        })
      })
    })

    describe('when the client has exceeded its rate limit', () => {
      describe('should refuse the request', () => {
        const cases = [
          {
            input: {
              aiRunRateLimitInspectorArgs: {
                maximumAcceptedAiRunCount: 1,
                windowSecondCount: 86400,
              },
              body: {
                externalRef: 'external-ref-10620011',
                subjectLabel: 'Subject label of refused request 10620011',
                correlationId: 'correlation-id-10620011',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10620011',
              },
              context: {
                apiClientId: 10000001, // Six runs seeded inside the window
                now: new Date('2026-09-10T12:00:00.000Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620011',
                  },
                  rawBody: '{"externalRef":"external-ref-10620011","subjectLabel":"Subject label of refused request 10620011","correlationId":"correlation-id-10620011","callbackUrl":"https://signing.client.development.invalid/callbacks/10620011","asset":{"categorySlugs":["residential"],"province":"Ha Noi"},"fieldSchema":[],"media":[],"mediaSignature":"media-signature-10620011"}',
                },
              },
            },
            expected: expect.objectContaining({
              statusCode: 429,
              error: {
                message: 'Rate limit exceeded',
              },
            }),
          },
          {
            input: {
              aiRunRateLimitInspectorArgs: {
                maximumAcceptedAiRunCount: 2,
                windowSecondCount: 86400,
              },
              body: {
                externalRef: 'external-ref-10620012',
                subjectLabel: 'Subject label of refused request 10620012',
                correlationId: 'correlation-id-10620012',
                callbackUrl: 'https://rotating.client.development.invalid/callbacks/10620012',
              },
              context: {
                apiClientId: 10000002, // Three runs seeded inside the window
                now: new Date('2026-09-10T12:00:00.000Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620012',
                  },
                  rawBody: '{"externalRef":"external-ref-10620012","subjectLabel":"Subject label of refused request 10620012","correlationId":"correlation-id-10620012","callbackUrl":"https://rotating.client.development.invalid/callbacks/10620012","asset":{"categorySlugs":["land"],"province":"Da Lat"},"fieldSchema":[],"media":[],"mediaSignature":"media-signature-10620012"}',
                },
              },
            },
            expected: expect.objectContaining({
              statusCode: 429,
              error: {
                message: 'Rate limit exceeded',
              },
            }),
          },
        ]

        test.each(cases)('externalRef: $input.body.externalRef', async ({
          input,
          expected,
        }) => {
          const renderer = AssetMediaExtractionPostRenderer.create()
          jest.spyOn(AssetMediaExtractionPostRenderer, 'createAiRunRateLimitInspector')
            .mockReturnValue(AiRunRateLimitInspector.create(input.aiRunRateLimitInspectorArgs))
          const renderArgs = {
            body: input.body,
            context: input.context,
            request: input.request,
          }

          const received = await renderer.render(renderArgs)

          expect(received)
            .toEqual(expected)
        })
      })

      describe('should create no run', () => {
        const cases = [
          {
            input: {
              aiRunRateLimitInspectorArgs: {
                maximumAcceptedAiRunCount: 1,
                windowSecondCount: 86400,
              },
              body: {
                externalRef: 'external-ref-10620013',
                subjectLabel: 'Subject label of refused request 10620013',
                correlationId: 'correlation-id-10620013',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10620013',
              },
              context: {
                apiClientId: 10000001,
                now: new Date('2026-09-10T12:00:00.000Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620013',
                  },
                  rawBody: '{"externalRef":"external-ref-10620013","subjectLabel":"Subject label of refused request 10620013","correlationId":"correlation-id-10620013","callbackUrl":"https://signing.client.development.invalid/callbacks/10620013","asset":{"categorySlugs":["residential"],"province":"Ha Noi"},"fieldSchema":[],"media":[],"mediaSignature":"media-signature-10620013"}',
                },
              },
            },
          },
          {
            input: {
              aiRunRateLimitInspectorArgs: {
                maximumAcceptedAiRunCount: 2,
                windowSecondCount: 86400,
              },
              body: {
                externalRef: 'external-ref-10620014',
                subjectLabel: 'Subject label of refused request 10620014',
                correlationId: 'correlation-id-10620014',
                callbackUrl: 'https://rotating.client.development.invalid/callbacks/10620014',
              },
              context: {
                apiClientId: 10000002,
                now: new Date('2026-09-10T12:00:00.000Z'),
              },
              request: {
                expressRequest: {
                  headers: {
                    'idempotency-key': 'request-key-10620014',
                  },
                  rawBody: '{"externalRef":"external-ref-10620014","subjectLabel":"Subject label of refused request 10620014","correlationId":"correlation-id-10620014","callbackUrl":"https://rotating.client.development.invalid/callbacks/10620014","asset":{"categorySlugs":["land"],"province":"Da Lat"},"fieldSchema":[],"media":[],"mediaSignature":"media-signature-10620014"}',
                },
              },
            },
          },
        ]

        test.each(cases)('externalRef: $input.body.externalRef', async ({
          input,
        }) => {
          const renderer = AssetMediaExtractionPostRenderer.create()
          jest.spyOn(AssetMediaExtractionPostRenderer, 'createAiRunRateLimitInspector')
            .mockReturnValue(AiRunRateLimitInspector.create(input.aiRunRateLimitInspectorArgs))
          const aiRunAcceptor = AiRunAcceptor.create()
          const findAiRunArgs = {
            apiClientId: input.context.apiClientId,
            requestKey: input.request.expressRequest.headers['idempotency-key'],
          }
          const renderArgs = {
            body: input.body,
            context: input.context,
            request: input.request,
          }

          await renderer.render(renderArgs)

          const received = await aiRunAcceptor.findAiRun(findAiRunArgs)
          expect(received)
            .toBeNull()
        })
      })
    })
  })
})
