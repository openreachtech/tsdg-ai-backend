import AiRunAcceptor from '../../../app/aiRun/AiRunAcceptor.js'

import RunKeyGenerator from '../../../app/aiRun/RunKeyGenerator.js'

describe('AiRunAcceptor', () => {
  describe('#saveAiRun()', () => {
    const cases = [
      {
        override: {
          runKey: 'run-key-saved-0001',
        },
        input: {
          apiClientId: 10000001,
          aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
          input: {
            requestKey: 'request-key-saved-0001',
            externalRef: 'external-ref-saved-0001',
            subjectLabel: 'Subject label saved 0001',
            correlationId: 'correlation-id-saved-0001',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/saved-0001',
          },
          rawBody: '{"externalRef":"external-ref-saved-0001"}',
          requestBodyHash: 'request-body-hash-saved-0001',
          acceptedAt: new Date('2026-09-20T01:01:01.001Z'),
        },
        expected: expect.objectContaining({
          ApiClientId: 10000001,
          AiRunCategoryId: 1,
          AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID — a saved run is queued and not yet started
          runKey: 'run-key-saved-0001',
          requestKey: 'request-key-saved-0001',
          requestBodyHash: 'request-body-hash-saved-0001',
          externalRef: 'external-ref-saved-0001',
          subjectLabel: 'Subject label saved 0001',
          correlationId: 'correlation-id-saved-0001',
          callbackUrl: 'https://signing.client.development.invalid/callbacks/saved-0001',
          requestBody: '{"externalRef":"external-ref-saved-0001"}',
          acceptedAt: new Date('2026-09-20T01:01:01.001Z'),
          // startedAt, finishedAt, canceledAt, contentPurgedAt: not asserted.
          // This method writes none of them, so the instance it answers with does not
          // carry them at all — the row holds NULL because the schema says so, not
          // because saving decided anything. A worker sets startedAt, in a later feature.
        }),
      },
      {
        override: {
          runKey: 'run-key-saved-0002',
        },
        input: {
          apiClientId: 10000002,
          aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
          input: {
            // The same request key as the row above, under another client
            requestKey: 'request-key-saved-0001',
            externalRef: 'external-ref-saved-0002',
            subjectLabel: 'Subject label saved 0002',
            correlationId: 'correlation-id-saved-0002',
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/saved-0002',
          },
          rawBody: '{"externalRef":"external-ref-saved-0002"}',
          requestBodyHash: 'request-body-hash-saved-0002',
          acceptedAt: new Date('2026-09-20T02:02:02.002Z'),
        },
        expected: expect.objectContaining({
          ApiClientId: 10000002,
          AiRunCategoryId: 1,
          AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID — a saved run is queued and not yet started
          runKey: 'run-key-saved-0002',
          requestKey: 'request-key-saved-0001',
          requestBodyHash: 'request-body-hash-saved-0002',
          externalRef: 'external-ref-saved-0002',
          subjectLabel: 'Subject label saved 0002',
          correlationId: 'correlation-id-saved-0002',
          callbackUrl: 'https://rotating.client.development.invalid/callbacks/saved-0002',
          requestBody: '{"externalRef":"external-ref-saved-0002"}',
          acceptedAt: new Date('2026-09-20T02:02:02.002Z'),
          // startedAt, finishedAt, canceledAt, contentPurgedAt: not asserted.
          // This method writes none of them, so the instance it answers with does not
          // carry them at all — the row holds NULL because the schema says so, not
          // because saving decided anything. A worker sets startedAt, in a later feature.
        }),
      },
    ]

    test.each(cases)('externalRef: $input.input.externalRef', async ({
      override,
      input,
      expected,
    }) => {
      const runKeyGenerator = RunKeyGenerator.create()
      jest.spyOn(runKeyGenerator, 'generateRunKey')
        .mockReturnValue(override.runKey)

      const acceptor = AiRunAcceptor.create({
        runKeyGenerator,
      })

      const received = await acceptor.saveAiRun(input)

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('AiRunAcceptor', () => {
  describe('#findAiRun()', () => {
    /*
     * The round trip, and what only it can say.
     *
     * `#saveAiRun()` answers with the instance Sequelize built from the values handed to it, so a
     * column that method never writes is absent from that instance rather than null on it — which
     * means the describe above cannot tell "the row holds NULL" from "the row was stamped". Reading
     * the row back is what settles it: a run this service has just accepted has not started, has
     * not finished, has not been asked to cancel, has produced no result and has had nothing
     * purged, and every one of those is a column a regression could fill in at insert time.
     *
     * It is read through the class's own finder rather than through the model, because a test
     * verifies by exercising the code under test. That also makes this the one place proving a run
     * this service wrote is the run a repeat of its own idempotency key finds.
     */
    describe('when the run was written by #saveAiRun()', () => {
      const cases = [
        {
          override: {
            runKey: 'run-key-roundtrip-0001',
          },
          input: {
            apiClientId: 10000001,
            aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            input: {
              requestKey: 'request-key-roundtrip-0001',
              externalRef: 'external-ref-roundtrip-0001',
              subjectLabel: 'Subject label roundtrip 0001',
              correlationId: 'correlation-id-roundtrip-0001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/roundtrip-0001',
            },
            rawBody: '{"externalRef":"external-ref-roundtrip-0001"}',
            requestBodyHash: 'request-body-hash-roundtrip-0001',
            acceptedAt: new Date('2026-09-20T03:03:03.003Z'),
          },
          expected: expect.objectContaining({
            runKey: 'run-key-roundtrip-0001',
            requestKey: 'request-key-roundtrip-0001',
            requestBodyHash: 'request-body-hash-roundtrip-0001',
            AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
            AiRunStatus: expect.objectContaining({
              name: 'queued',
            }),
            startedAt: null,
            finishedAt: null,
            cancelRequestedAt: null,
            canceledAt: null,
            contentPurgedAt: null,
            resultBody: null,
            failureReasonCode: null,
            failureParameters: null,
            engineLabel: null,
          }),
        },
        {
          override: {
            runKey: 'run-key-roundtrip-0002',
          },
          input: {
            apiClientId: 10000002,
            aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            input: {
              requestKey: 'request-key-roundtrip-0002',
              externalRef: 'external-ref-roundtrip-0002',
              subjectLabel: 'Subject label roundtrip 0002',
              correlationId: 'correlation-id-roundtrip-0002',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/roundtrip-0002',
            },
            rawBody: '{"externalRef":"external-ref-roundtrip-0002"}',
            requestBodyHash: 'request-body-hash-roundtrip-0002',
            acceptedAt: new Date('2026-09-20T04:04:04.004Z'),
          },
          expected: expect.objectContaining({
            runKey: 'run-key-roundtrip-0002',
            requestKey: 'request-key-roundtrip-0002',
            requestBodyHash: 'request-body-hash-roundtrip-0002',
            AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
            AiRunStatus: expect.objectContaining({
              name: 'queued',
            }),
            startedAt: null,
            finishedAt: null,
            cancelRequestedAt: null,
            canceledAt: null,
            contentPurgedAt: null,
            resultBody: null,
            failureReasonCode: null,
            failureParameters: null,
            engineLabel: null,
          }),
        },
      ]

      test.each(cases)('externalRef: $input.input.externalRef', async ({
        override,
        input,
        expected,
      }) => {
        const runKeyGenerator = RunKeyGenerator.create()
        jest.spyOn(runKeyGenerator, 'generateRunKey')
          .mockReturnValue(override.runKey)

        const acceptor = AiRunAcceptor.create({
          runKeyGenerator,
        })
        await acceptor.saveAiRun(input)

        const findAiRunArgs = {
          apiClientId: input.apiClientId,
          requestKey: input.input.requestKey,
        }

        const received = await acceptor.findAiRun(findAiRunArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
