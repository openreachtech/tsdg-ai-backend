import BaseAiRunPostRenderer from '../../../server/restfulapi/renderers/BaseAiRunPostRenderer.js'

import AiRunAcceptor from '../../../app/aiRun/AiRunAcceptor.js'
import RunKeyGenerator from '../../../app/aiRun/RunKeyGenerator.js'

describe('BaseAiRunPostRenderer', () => {
  describe('#render()', () => {
    describe('when the key is arriving for the first time', () => {
      const cases = [
        {
          override: {
            runKey: 'run-key-rendered-0001',
          },
          input: {
            body: {
              externalRef: 'external-ref-rendered-0001',
              subjectLabel: 'Subject label rendered 0001',
              correlationId: 'correlation-id-rendered-0001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/rendered-0001',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-21T01:01:01.001Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-rendered-0001',
                },
                rawBody: '{"externalRef":"external-ref-rendered-0001","subjectLabel":"Subject label rendered 0001","correlationId":"correlation-id-rendered-0001","callbackUrl":"https://signing.client.development.invalid/callbacks/rendered-0001"}',
              },
            },
          },
          expected: expect.objectContaining({
            statusCode: 202,
            error: null,
            content: {
              runKey: 'run-key-rendered-0001',
              runCategoryName: 'asset-media-extraction',
              statusName: 'queued',
              acceptedAt: new Date('2026-09-21T01:01:01.001Z'),
            },
          }),
        },
        {
          override: {
            runKey: 'run-key-rendered-0002',
          },
          input: {
            body: {
              externalRef: 'external-ref-rendered-0002',
              subjectLabel: 'Subject label rendered 0002',
              correlationId: 'correlation-id-rendered-0002',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/rendered-0002',
            },
            context: {
              apiClientId: 10000002,
              now: new Date('2026-09-21T02:02:02.002Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-rendered-0002',
                },
                rawBody: '{"externalRef":"external-ref-rendered-0002","subjectLabel":"Subject label rendered 0002","correlationId":"correlation-id-rendered-0002","callbackUrl":"https://rotating.client.development.invalid/callbacks/rendered-0002"}',
              },
            },
          },
          expected: expect.objectContaining({
            statusCode: 202,
            error: null,
            content: {
              runKey: 'run-key-rendered-0002',
              runCategoryName: 'asset-media-extraction',
              statusName: 'queued',
              acceptedAt: new Date('2026-09-21T02:02:02.002Z'),
            },
          }),
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', async ({
        override,
        input,
        expected,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()
        jest.spyOn(BaseAiRunPostRenderer, 'aiRunCategory', 'get')
          .mockReturnValue({
            ID: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            NAME: 'asset-media-extraction',
          })

        const runKeyGenerator = RunKeyGenerator.create()
        jest.spyOn(runKeyGenerator, 'generateRunKey')
          .mockReturnValue(override.runKey)
        jest.spyOn(BaseAiRunPostRenderer, 'createAiRunAcceptor')
          .mockReturnValue(AiRunAcceptor.create({
            runKeyGenerator,
          }))

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the key arrives again with the same body', () => {
      const cases = [
        {
          input: {
            body: {
              externalRef: 'external-ref-10010001',
              subjectLabel: 'Subject label of run 10010001',
              correlationId: 'correlation-id-10010001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10010001',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-21T03:03:03.003Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-repeat-10010001',
                },
                rawBody: '{"externalRef":"external-ref-10010001","subjectLabel":"Subject label of run 10010001","correlationId":"correlation-id-10010001","callbackUrl":"https://signing.client.development.invalid/callbacks/10010001"}',
              },
            },
          },
          expected: expect.objectContaining({
            statusCode: 202,
            error: null,
            content: {
              runKey: 'run-key-10010001',
              runCategoryName: 'asset-media-extraction',
              // The status as it now stands, not the one the run was accepted with
              statusName: 'running',
              acceptedAt: new Date('2026-09-10T01:01:01.001Z'),
            },
          }),
        },
        {
          input: {
            body: {
              externalRef: 'external-ref-10010003',
              subjectLabel: 'Subject label of run 10010003',
              correlationId: 'correlation-id-10010003',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            },
            context: {
              apiClientId: 10000002,
              now: new Date('2026-09-21T04:04:04.004Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  // The same key as above, held by another client
                  'idempotency-key': 'request-key-repeat-10010001',
                },
                rawBody: '{"externalRef":"external-ref-10010003","subjectLabel":"Subject label of run 10010003","correlationId":"correlation-id-10010003","callbackUrl":"https://rotating.client.development.invalid/callbacks/10010003"}',
              },
            },
          },
          expected: expect.objectContaining({
            statusCode: 202,
            error: null,
            content: {
              runKey: 'run-key-10010003',
              runCategoryName: 'asset-media-extraction',
              statusName: 'succeeded',
              acceptedAt: new Date('2026-09-10T03:03:03.003Z'),
            },
          }),
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', async ({
        input,
        expected,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()
        jest.spyOn(BaseAiRunPostRenderer, 'aiRunCategory', 'get')
          .mockReturnValue({
            ID: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            NAME: 'asset-media-extraction',
          })

        const aiRunAcceptor = AiRunAcceptor.create()
        const saveAiRunSpy = jest.spyOn(aiRunAcceptor, 'saveAiRun')
        jest.spyOn(BaseAiRunPostRenderer, 'createAiRunAcceptor')
          .mockReturnValue(aiRunAcceptor)

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
        expect(saveAiRunSpy) // No second run exists for the key
          .not
          .toHaveBeenCalled()
      })
    })

    describe('when the key arrives again with a different body', () => {
      const cases = [
        {
          input: {
            body: {
              externalRef: 'external-ref-changed-0001',
              subjectLabel: 'Subject label of run 10010002',
              correlationId: 'correlation-id-10010002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10010002',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-21T05:05:05.005Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-mismatch-10010002',
                },
                rawBody: '{"externalRef":"external-ref-changed-0001","subjectLabel":"Subject label of run 10010002","correlationId":"correlation-id-10010002","callbackUrl":"https://signing.client.development.invalid/callbacks/10010002"}',
              },
            },
          },
        },
        {
          input: {
            body: {
              externalRef: 'external-ref-10010002',
              subjectLabel: 'Subject label changed 0002',
              correlationId: 'correlation-id-10010002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10010002',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-21T06:06:06.006Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-mismatch-10010002',
                },
                rawBody: '{"externalRef":"external-ref-10010002","subjectLabel":"Subject label changed 0002","correlationId":"correlation-id-10010002","callbackUrl":"https://signing.client.development.invalid/callbacks/10010002"}',
              },
            },
          },
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', async ({
        input,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()
        const expected = expect.objectContaining({
          statusCode: 409,
          error: {
            message: 'Idempotency-Key was already used with a different request body',
          },
        })

        /*
         * The seeded run 10010002 as it stood before the refused repeat arrived. Every field a
         * repeat could plausibly disturb is listed: the digest it would have had to overwrite to
         * accept the new body, the status it would have had to move, and the four instants that
         * say nothing has happened to this run yet.
         */
        const expectedUnchangedAiRun = expect.objectContaining({
          id: 10010002,
          runKey: 'run-key-10010002',
          // sha256 of the body run 10010002 was accepted with, as the seeder digested it
          requestBodyHash: '41e8dd18ba83eb89d6d58fae9f5ea93f5b6947be0ee35a38c7c2c0ebf3916776',
          AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
          externalRef: 'external-ref-10010002',
          subjectLabel: 'Subject label of run 10010002',
          acceptedAt: new Date('2026-09-10T02:02:02.002Z'),
          startedAt: null,
          finishedAt: null,
          cancelRequestedAt: null,
          canceledAt: null,
        })

        const aiRunAcceptor = AiRunAcceptor.create()
        const saveAiRunSpy = jest.spyOn(aiRunAcceptor, 'saveAiRun')
        jest.spyOn(BaseAiRunPostRenderer, 'createAiRunAcceptor')
          .mockReturnValue(aiRunAcceptor)
        const findAiRunArgs = {
          apiClientId: input.context.apiClientId,
          requestKey: 'request-key-mismatch-10010002',
        }

        const received = await renderer.render(input)

        /*
         * Read back through the acceptor's own finder rather than the model, because a test
         * verifies by exercising code that is itself under test. `saveAiRun` never being called
         * rules out a second row; only this rules out the first row having been edited on the way
         * to the refusal.
         */
        const refusedAiRun = await aiRunAcceptor.findAiRun(findAiRunArgs)
        expect(received)
          .toEqual(expected)
        expect(saveAiRunSpy) // No second run is written for the key
          .not
          .toHaveBeenCalled()
        expect(refusedAiRun) // The first run is unchanged
          .toEqual(expectedUnchangedAiRun)
      })
    })

    describe('when the idempotency key was not sent', () => {
      const cases = [
        {
          input: {
            body: {
              externalRef: 'external-ref-unkeyed-0001',
              subjectLabel: 'Subject label unkeyed 0001',
              correlationId: 'correlation-id-unkeyed-0001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/unkeyed-0001',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-21T07:07:07.007Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'content-type': 'application/json',
                },
                rawBody: '{"externalRef":"external-ref-unkeyed-0001"}',
              },
            },
          },
        },
        {
          input: {
            body: {
              externalRef: 'external-ref-unkeyed-0002',
              subjectLabel: 'Subject label unkeyed 0002',
              correlationId: 'correlation-id-unkeyed-0002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/unkeyed-0002',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-21T08:08:08.008Z'),
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': '   ', // Sent, but nobody filled it in
                },
                rawBody: '{"externalRef":"external-ref-unkeyed-0002"}',
              },
            },
          },
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', async ({
        input,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()
        const expected = expect.objectContaining({
          statusCode: 422,
          error: {
            message: 'Idempotency-Key header is required',
          },
        })

        const aiRunAcceptor = AiRunAcceptor.create()
        const saveAiRunSpy = jest.spyOn(aiRunAcceptor, 'saveAiRun')
        jest.spyOn(BaseAiRunPostRenderer, 'createAiRunAcceptor')
          .mockReturnValue(aiRunAcceptor)

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
        expect(saveAiRunSpy) // A refused request writes no run
          .not
          .toHaveBeenCalled()
      })
    })

    describe('when a required common field was not sent', () => {
      /** @type {Array<{ input: Record<string, *>, expected: * }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            body: {
              // externalRef: not sent
              subjectLabel: 'Subject label incomplete 0001',
              correlationId: 'correlation-id-incomplete-0001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/incomplete-0001',
            },
            requestKey: 'request-key-incomplete-0001',
            rawBody: '{"subjectLabel":"Subject label incomplete 0001"}',
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
            body: {
              externalRef: 'external-ref-incomplete-0002',
              // subjectLabel: not sent
              correlationId: 'correlation-id-incomplete-0002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/incomplete-0002',
            },
            requestKey: 'request-key-incomplete-0002',
            rawBody: '{"externalRef":"external-ref-incomplete-0002"}',
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
            body: {
              externalRef: 'external-ref-incomplete-0003',
              subjectLabel: 'Subject label incomplete 0003',
              // correlationId: not sent
              callbackUrl: 'https://signing.client.development.invalid/callbacks/incomplete-0003',
            },
            requestKey: 'request-key-incomplete-0003',
            rawBody: '{"externalRef":"external-ref-incomplete-0003"}',
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
            body: {
              externalRef: 'external-ref-incomplete-0004',
              subjectLabel: 'Subject label incomplete 0004',
              correlationId: 'correlation-id-incomplete-0004',
              // callbackUrl: not sent
            },
            requestKey: 'request-key-incomplete-0004',
            rawBody: '{"externalRef":"external-ref-incomplete-0004"}',
          },
          expected: expect.objectContaining({
            statusCode: 422,
            error: {
              message: 'Invalid callbackUrl',
            },
          }),
        },
      ])

      test.each(cases)('requestKey: $input.requestKey', async ({
        input,
        expected,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()
        const args = {
          body: input.body,
          context: {
            apiClientId: 10000001,
            now: new Date('2026-09-21T09:09:09.009Z'),
          },
          request: {
            expressRequest: {
              headers: {
                'idempotency-key': input.requestKey,
              },
              rawBody: input.rawBody,
            },
          },
        }

        const aiRunAcceptor = AiRunAcceptor.create()
        const saveAiRunSpy = jest.spyOn(aiRunAcceptor, 'saveAiRun')
        jest.spyOn(BaseAiRunPostRenderer, 'createAiRunAcceptor')
          .mockReturnValue(aiRunAcceptor)

        const received = await renderer.render(args)

        expect(received)
          .toEqual(expected)
        expect(saveAiRunSpy) // A refused request writes no run
          .not
          .toHaveBeenCalled()
      })
    })

    describe('when the request carried no body to digest', () => {
      const cases = [
        {
          input: {
            requestKey: 'request-key-bodyless-0001',
            body: {
              externalRef: 'external-ref-bodyless-0001',
              subjectLabel: 'Subject label bodyless 0001',
              correlationId: 'correlation-id-bodyless-0001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/bodyless-0001',
            },
          },
        },
        {
          input: {
            requestKey: 'request-key-bodyless-0002',
            body: {
              externalRef: 'external-ref-bodyless-0002',
              subjectLabel: 'Subject label bodyless 0002',
              correlationId: 'correlation-id-bodyless-0002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/bodyless-0002',
            },
          },
        },
      ]

      test.each(cases)('requestKey: $input.requestKey', async ({
        input,
      }) => {
        const renderer = BaseAiRunPostRenderer.create()
        const expected = expect.objectContaining({
          statusCode: 422,
          error: {
            message: 'Invalid request body',
          },
        })
        const args = {
          body: input.body,
          context: {
            apiClientId: 10000001,
            now: new Date('2026-09-21T10:10:10.010Z'),
          },
          request: {
            expressRequest: {
              headers: {
                'idempotency-key': input.requestKey,
              },
              // rawBody: the engine parsed nothing, so none was kept
            },
          },
        }

        const aiRunAcceptor = AiRunAcceptor.create()
        const saveAiRunSpy = jest.spyOn(aiRunAcceptor, 'saveAiRun')
        jest.spyOn(BaseAiRunPostRenderer, 'createAiRunAcceptor')
          .mockReturnValue(aiRunAcceptor)

        const received = await renderer.render(args)

        expect(received)
          .toEqual(expected)
        expect(saveAiRunSpy) // A refused request writes no run
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunPostRenderer', () => {
  describe('#renderAcceptedRun()', () => {
    const cases = [
      {
        override: {
          runKey: 'run-key-accepted-0001',
        },
        input: {
          context: {
            apiClientId: 10000001,
            now: new Date('2026-09-22T01:01:01.001Z'),
          },
          input: {
            requestKey: 'request-key-accepted-0001',
            externalRef: 'external-ref-accepted-0001',
            subjectLabel: 'Subject label accepted 0001',
            correlationId: 'correlation-id-accepted-0001',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/accepted-0001',
          },
          rawBody: '{"externalRef":"external-ref-accepted-0001"}',
          requestBodyHash: 'request-body-hash-accepted-0001',
        },
        expected: expect.objectContaining({
          statusCode: 202,
          error: null,
          content: {
            runKey: 'run-key-accepted-0001',
            runCategoryName: 'asset-media-extraction',
            statusName: 'queued',
            acceptedAt: new Date('2026-09-22T01:01:01.001Z'),
          },
        }),
      },
      {
        override: {
          runKey: 'run-key-accepted-0002',
        },
        input: {
          context: {
            apiClientId: 10000002,
            now: new Date('2026-09-22T02:02:02.002Z'),
          },
          input: {
            requestKey: 'request-key-accepted-0002',
            externalRef: 'external-ref-accepted-0002',
            subjectLabel: 'Subject label accepted 0002',
            correlationId: 'correlation-id-accepted-0002',
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/accepted-0002',
          },
          rawBody: '{"externalRef":"external-ref-accepted-0002"}',
          requestBodyHash: 'request-body-hash-accepted-0002',
        },
        expected: expect.objectContaining({
          statusCode: 202,
          error: null,
          content: {
            runKey: 'run-key-accepted-0002',
            runCategoryName: 'asset-media-extraction',
            statusName: 'queued',
            acceptedAt: new Date('2026-09-22T02:02:02.002Z'),
          },
        }),
      },
    ]

    test.each(cases)('requestKey: $input.input.requestKey', async ({
      override,
      input,
      expected,
    }) => {
      const renderer = BaseAiRunPostRenderer.create()
      jest.spyOn(BaseAiRunPostRenderer, 'aiRunCategory', 'get')
        .mockReturnValue({
          ID: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
          NAME: 'asset-media-extraction',
        })

      const runKeyGenerator = RunKeyGenerator.create()
      jest.spyOn(runKeyGenerator, 'generateRunKey')
        .mockReturnValue(override.runKey)
      jest.spyOn(BaseAiRunPostRenderer, 'createAiRunAcceptor')
        .mockReturnValue(AiRunAcceptor.create({
          runKeyGenerator,
        }))

      const received = await renderer.renderAcceptedRun(input)

      expect(received)
        .toEqual(expected)
    })
  })
})
