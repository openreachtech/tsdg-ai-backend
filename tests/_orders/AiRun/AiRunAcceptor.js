import AiRunAcceptor from '../../../app/aiRun/AiRunAcceptor.js'

import RunKeyGenerator from '../../../app/aiRun/RunKeyGenerator.js'

import AiRun from '../../../sequelize/models/AiRun.js'

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

describe('AiRunAcceptor', () => {
  describe('#saveAiRun()', () => {
    /*
     * The run is written inside the transaction it was handed, and is there once that transaction
     * commits. This is the half that says the transaction was passed on rather than dropped: a
     * `#saveAiRun()` that ignored the argument would pass this describe too, which is why the
     * rolled-back describe below exists and why the two belong together.
     */
    describe('when the transaction committed', () => {
      const cases = [
        {
          override: {
            runKey: 'run-key-committed-0001',
          },
          input: {
            apiClientId: 10000001,
            aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            input: {
              requestKey: 'request-key-committed-0001',
              externalRef: 'external-ref-committed-0001',
              subjectLabel: 'Subject label committed 0001',
              correlationId: 'correlation-id-committed-0001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/committed-0001',
            },
            rawBody: '{"externalRef":"external-ref-committed-0001"}',
            requestBodyHash: 'request-body-hash-committed-0001',
            acceptedAt: new Date('2026-09-26T07:07:07.007Z'),
          },
          expected: expect.objectContaining({
            runKey: 'run-key-committed-0001',
            requestKey: 'request-key-committed-0001',
            requestBodyHash: 'request-body-hash-committed-0001',
            externalRef: 'external-ref-committed-0001',
            AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
          }),
        },
        {
          override: {
            runKey: 'run-key-committed-0002',
          },
          input: {
            apiClientId: 10000002,
            aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            input: {
              requestKey: 'request-key-committed-0002',
              externalRef: 'external-ref-committed-0002',
              subjectLabel: 'Subject label committed 0002',
              correlationId: 'correlation-id-committed-0002',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/committed-0002',
            },
            rawBody: '{"externalRef":"external-ref-committed-0002"}',
            requestBodyHash: 'request-body-hash-committed-0002',
            acceptedAt: new Date('2026-09-26T08:08:08.008Z'),
          },
          expected: expect.objectContaining({
            runKey: 'run-key-committed-0002',
            requestKey: 'request-key-committed-0002',
            requestBodyHash: 'request-body-hash-committed-0002',
            externalRef: 'external-ref-committed-0002',
            AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
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

        await AiRun.beginTransaction(async transaction => {
          await acceptor.saveAiRun({
            apiClientId: input.apiClientId,
            aiRunCategoryId: input.aiRunCategoryId,
            input: input.input,
            rawBody: input.rawBody,
            requestBodyHash: input.requestBodyHash,
            acceptedAt: input.acceptedAt,
            transaction,
          })
        })

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

describe('AiRunAcceptor', () => {
  describe('#saveAiRun()', () => {
    /*
     * The run was written and the request then failed, so the row must be gone. Nothing here rolls
     * anything back by hand: the transaction body throws, which is what a failure after the save
     * looks like, and Sequelize rolls back and re-throws. The re-throw is asserted rather than
     * swallowed, so that a body which somehow committed would be named here instead of turning up
     * as the next assertion failing for a reason it does not describe.
     *
     * A `#saveAiRun()` that ignored the transaction it was handed would have committed the row on
     * its own connection, and this is the describe that would catch it.
     */
    describe('when the transaction rolled back', () => {
      const cases = [
        {
          override: {
            runKey: 'run-key-rolledback-0001',
          },
          input: {
            apiClientId: 10000001,
            aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            input: {
              requestKey: 'request-key-rolledback-0001',
              externalRef: 'external-ref-rolledback-0001',
              subjectLabel: 'Subject label rolled back 0001',
              correlationId: 'correlation-id-rolledback-0001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/rolledback-0001',
            },
            rawBody: '{"externalRef":"external-ref-rolledback-0001"}',
            requestBodyHash: 'request-body-hash-rolledback-0001',
            acceptedAt: new Date('2026-09-26T09:09:09.009Z'),
          },
        },
        {
          override: {
            runKey: 'run-key-rolledback-0002',
          },
          input: {
            apiClientId: 10000002,
            aiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
            input: {
              requestKey: 'request-key-rolledback-0002',
              externalRef: 'external-ref-rolledback-0002',
              subjectLabel: 'Subject label rolled back 0002',
              correlationId: 'correlation-id-rolledback-0002',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/rolledback-0002',
            },
            rawBody: '{"externalRef":"external-ref-rolledback-0002"}',
            requestBodyHash: 'request-body-hash-rolledback-0002',
            acceptedAt: new Date('2026-09-26T10:10:10.010Z'),
          },
        },
      ]

      test.each(cases)('externalRef: $input.input.externalRef', async ({
        override,
        input,
      }) => {
        const runKeyGenerator = RunKeyGenerator.create()
        jest.spyOn(runKeyGenerator, 'generateRunKey')
          .mockReturnValue(override.runKey)

        const acceptor = AiRunAcceptor.create({
          runKeyGenerator,
        })

        const savingAiRun = () => AiRun.beginTransaction(async transaction => {
          await acceptor.saveAiRun({
            apiClientId: input.apiClientId,
            aiRunCategoryId: input.aiRunCategoryId,
            input: input.input,
            rawBody: input.rawBody,
            requestBodyHash: input.requestBodyHash,
            acceptedAt: input.acceptedAt,
            transaction,
          })

          throw new Error('the request failed after the run was saved')
        })

        await expect(savingAiRun)
          .rejects
          .toThrow('the request failed after the run was saved')

        const findAiRunArgs = {
          apiClientId: input.apiClientId,
          requestKey: input.input.requestKey,
        }

        const received = await acceptor.findAiRun(findAiRunArgs)

        expect(received)
          .toBeNull()
      })
    })
  })
})
