import AiRunJobDispatchRegistrar from '../../../app/aiRun/AiRunJobDispatchRegistrar.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * Every run this file writes is created by this file, in `#run-execution`'s own id block
 * (`10310001` upward). Two of them commit and stay; the other two are written inside a transaction
 * that rolls back, so the ids they carry name no row once the file has run — which is the point
 * being made rather than an accident of it.
 *
 * The dispatcher is the one thing here that is not real. It must be: a real one opens a BullMQ
 * queue against Redis, and `npm run test` is runnable with nothing but Node installed. Everything
 * else — the transaction, its commit, its rollback, the run row — is the database doing what it
 * does, because what is under test is precisely which of those the dispatch hangs off.
 */

describe('AiRunJobDispatchRegistrar', () => {
  describe('#registerAiRunJobDispatch()', () => {
    /*
     * A commit sends exactly one dispatch, carrying the run it was handed. The count is asserted
     * beside the arguments because "dispatched" is not the whole of the promise: a job sent twice
     * for one run is a run executed twice, and the client was told about one.
     */
    describe('when the transaction committed', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10310001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10310001',
              requestKey: 'request-key-10310001',
              requestBodyHash: 'request-body-hash-10310001',
              externalRef: 'external-ref-10310001',
              subjectLabel: 'Subject label of run 10310001',
              correlationId: 'correlation-id-10310001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10310001',
              acceptedAt: new Date('2026-09-26T03:03:03.003Z'),
            },
          },
          expected: {
            body: {
              aiRunId: 10310001,
            },
            keepsConnection: true,
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10310002,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10310002',
              requestKey: 'request-key-10310002',
              requestBodyHash: 'request-body-hash-10310002',
              externalRef: 'external-ref-10310002',
              subjectLabel: 'Subject label of run 10310002',
              correlationId: 'correlation-id-10310002',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10310002',
              acceptedAt: new Date('2026-09-26T04:04:04.004Z'),
            },
          },
          expected: {
            body: {
              aiRunId: 10310002,
            },
            keepsConnection: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        const dispatchJobSpy = jest.fn()
        const registrar = AiRunJobDispatchRegistrar.create({
          jobDispatcher: /** @type {*} */ ({
            dispatchJob: dispatchJobSpy,
          }),
        })

        await AiRun.beginTransaction(async transaction => {
          await AiRun.create(
            input.aiRunRow,
            {
              transaction,
            }
          )

          registrar.registerAiRunJobDispatch({
            transaction,
            aiRunId: input.aiRunRow.id,
          })
        })

        expect(dispatchJobSpy)
          .toHaveBeenCalledTimes(1)
        expect(dispatchJobSpy)
          .toHaveBeenNthCalledWith(1, expected)
      })
    })
  })
})

describe('AiRunJobDispatchRegistrar', () => {
  describe('#registerAiRunJobDispatch()', () => {
    /*
     * The half this class exists for. The run was written and the dispatch was registered, and
     * then the work after it failed — so the row is gone and no job may name it. A dispatch sent
     * from inside the transaction, or sent before it finished, would be sent here too, and the
     * queue would carry a job for a run that never existed.
     */
    describe('when the transaction rolled back', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10310003,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10310003',
              requestKey: 'request-key-10310003',
              requestBodyHash: 'request-body-hash-10310003',
              externalRef: 'external-ref-10310003',
              subjectLabel: 'Subject label of run 10310003',
              correlationId: 'correlation-id-10310003',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10310003',
              acceptedAt: new Date('2026-09-26T05:05:05.005Z'),
            },
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10310004,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10310004',
              requestKey: 'request-key-10310004',
              requestBodyHash: 'request-body-hash-10310004',
              externalRef: 'external-ref-10310004',
              subjectLabel: 'Subject label of run 10310004',
              correlationId: 'correlation-id-10310004',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10310004',
              acceptedAt: new Date('2026-09-26T06:06:06.006Z'),
            },
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
      }) => {
        const dispatchJobSpy = jest.fn()
        const registrar = AiRunJobDispatchRegistrar.create({
          jobDispatcher: /** @type {*} */ ({
            dispatchJob: dispatchJobSpy,
          }),
        })

        const registeringDispatch = () => AiRun.beginTransaction(async transaction => {
          await AiRun.create(
            input.aiRunRow,
            {
              transaction,
            }
          )

          registrar.registerAiRunJobDispatch({
            transaction,
            aiRunId: input.aiRunRow.id,
          })

          throw new Error('the request failed after the run was saved')
        })

        await expect(registeringDispatch)
          .rejects
          .toThrow('the request failed after the run was saved')
        expect(dispatchJobSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
