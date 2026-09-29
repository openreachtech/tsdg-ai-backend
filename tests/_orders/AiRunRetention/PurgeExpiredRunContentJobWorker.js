import PurgeExpiredRunContentJobWorker from '../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentJobWorker.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * What the nightly content job does when nobody hands it a purger (specs/1.0.0, #retention).
 *
 * **This is the one composition the rest of #retention's tests cannot reach.** The worker's
 * declarations are pinned in `tests/__tests__/app/jobs/purge-expired-run-content/`, and what
 * `AiRunContentPurger` empties is pinned in `AiRunContentPurger.js` beside this file - but between
 * them sits the wiring that actually runs in the daemon, which builds a worker from the engine
 * alone and lets `BaseAiRunPurgeJobWorker.create()` default the purger. A worker whose default was
 * the wrong purger, or whose `#sweepExpiredAiRuns()` reached a method the purger does not answer,
 * would fail only here.
 *
 * So no purger is passed, and none is mocked. `#sweepExpiredAiRuns()` writes to the database
 * transitively, which is why the method's cases sit in `tests/_orders/**` rather than beside the
 * class's read-only members - `rules/testing.md` classifies by what the method does, and mocking
 * the write away would not have moved it.
 *
 * **The engine is a stub, and that is the one thing standing in for something real.** A worker is
 * constructed with an engine, and the real `AppJobEngine` opens Redis. Nothing in
 * `#sweepExpiredAiRuns()` touches the queue, so the stub supplies the two members construction
 * reads and no more; the purge below is entirely real.
 *
 * **Every run here is accepted in 2019, and every `now` puts the horizon in 2019 too.** That is
 * the isolation rule this folder's barrel states, and it is what keeps a sweep local: a purge is
 * bounded by a horizon rather than by a caller, so a `now` in 2026 would empty the subject label
 * of every seeded run in the database and the failures would surface in other folders entirely.
 * The two windows descend down the file, and both fall before the earliest run
 * `AiRunContentPurger.js` creates (2019-02-01), so no row that file left behind can be reached or
 * counted here.
 *
 * Ids are #retention's own block, `11040001` upward, and none is borrowed.
 */

describe('PurgeExpiredRunContentJobWorker', () => {
  describe('#sweepExpiredAiRuns()', () => {
    /*
     * The composition, end to end: a worker built the way the daemon builds one, handed a real
     * instant, emptying the four things §7 counts as content on a real row.
     *
     * `subjectLabel` is the column to watch, for the reason `AiRunContentPurger.js` gives at
     * greater length: it is NOT NULL, so it is emptied rather than nulled, and a run whose label
     * survived still shows the line its caller wrote in every list row with every criterion of §19
     * reading as met. `contentPurgedAt` carrying the instant handed in - rather than a clock read
     * somewhere below - is what says the horizon selected against and the stamp written are one
     * instant.
     */
    describe('should empty the run content and stamp the run', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11040001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11040001',
              requestKey: 'request-key-11040001',
              requestBodyHash: 'request-body-hash-11040001',
              externalRef: 'external-ref-11040001',
              subjectLabel: 'Corner unit with the repainted balcony rail',
              correlationId: 'correlation-id-11040001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11040001',
              requestBody: '{"fields":[{"path":"asset.color","value":"sand beige"}]}',
              resultBody: '{"fields":[{"path":"asset.color","suggestedValue":"beige"}]}',
              engineLabel: 'engine-label-11040001',
              acceptedAt: new Date('2019-01-20T01:01:01.001Z'),
              startedAt: new Date('2019-01-20T01:01:02.002Z'),
              finishedAt: new Date('2019-01-20T01:01:03.003Z'),
            },
            sweepArgs: {
              now: new Date('2019-02-25T05:05:05.005Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11040001,
            requestBody: null,
            resultBody: null,
            subjectLabel: '',
            contentPurgedAt: new Date('2019-02-25T05:05:05.005Z'),
            tracePurgedAt: null,
            engineLabel: 'engine-label-11040001',
            externalRef: 'external-ref-11040001',
            finishedAt: new Date('2019-01-20T01:01:03.003Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 11040002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-11040002',
              requestKey: 'request-key-11040002',
              requestBodyHash: 'request-body-hash-11040002',
              externalRef: 'external-ref-11040002',
              subjectLabel: 'Ground floor lock-up, photographed at dusk',
              correlationId: 'correlation-id-11040002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11040002',
              requestBody: '{"fields":[{"path":"asset.floorArea","value":"31.4"}]}',
              failureReasonCode: 'failure-reason-code-11040002',
              acceptedAt: new Date('2019-01-21T02:02:02.002Z'),
              startedAt: new Date('2019-01-21T02:02:03.003Z'),
              finishedAt: new Date('2019-01-21T02:02:04.004Z'),
            },
            sweepArgs: {
              now: new Date('2019-02-25T05:05:05.005Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11040002,
            requestBody: null,
            resultBody: null,
            subjectLabel: '',
            contentPurgedAt: new Date('2019-02-25T05:05:05.005Z'),
            tracePurgedAt: null,
            failureReasonCode: 'failure-reason-code-11040002',
            externalRef: 'external-ref-11040002',
          }),
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const worker = PurgeExpiredRunContentJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        await worker.sweepExpiredAiRuns(input.sweepArgs)

        const received = await AiRun.findOne({ // Act
          where: {
            id: input.aiRunRow.id,
          },
        })

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('PurgeExpiredRunContentJobWorker', () => {
  describe('#sweepExpiredAiRuns()', () => {
    /*
     * What the worker answers with, which is the purger's own outcome and nothing added to it.
     *
     * `BaseAiRunPurgeJobWorker#executeJob()` reads `isSweepExhausted` off this value to decide
     * whether to warn about a backlog, and puts all three numbers into the job result BullMQ keeps
     * against the completed job - so a worker that swallowed the outcome would leave an operator
     * with no answer to "did last night's purge finish" other than "the job did not throw".
     *
     * This window's horizon falls before the runs the describe above creates, so no row it left
     * behind can be counted here. Two runs in one batch is one batch, and the batch after it comes
     * back empty, which is what ends the sweep.
     */
    describe('should answer with what its default purger swept', () => {
      const cases = [
        {
          input: {
            aiRunRows: [
              {
                id: 11040011,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11040011',
                requestKey: 'request-key-11040011',
                requestBodyHash: 'request-body-hash-11040011',
                externalRef: 'external-ref-11040011',
                subjectLabel: 'Subject label of run 11040011',
                correlationId: 'correlation-id-11040011',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11040011',
                requestBody: '{"fields":[{"path":"asset.color","value":"olive drab"}]}',
                acceptedAt: new Date('2019-01-01T01:01:01.001Z'),
              },
              {
                id: 11040012,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
                runKey: 'run-key-11040012',
                requestKey: 'request-key-11040012',
                requestBodyHash: 'request-body-hash-11040012',
                externalRef: 'external-ref-11040012',
                subjectLabel: 'Subject label of run 11040012',
                correlationId: 'correlation-id-11040012',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11040012',
                requestBody: '{"fields":[{"path":"asset.color","value":"brick red"}]}',
                acceptedAt: new Date('2019-01-02T02:02:02.002Z'),
              },
            ],
            sweepArgs: {
              now: new Date('2019-02-05T05:05:05.005Z'),
            },
          },
          expected: {
            purgedAiRunCount: 2,
            batchCount: 1,
            isSweepExhausted: true,
          },
        },
      ]

      test.each(cases)('now: $input.sweepArgs.now', async ({
        input,
        expected,
      }) => {
        await AiRun.bulkCreate(input.aiRunRows) // Arrange

        const worker = PurgeExpiredRunContentJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const received = await worker.sweepExpiredAiRuns(input.sweepArgs) // Act

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})
