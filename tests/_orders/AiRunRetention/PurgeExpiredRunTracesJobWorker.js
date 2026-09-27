import PurgeExpiredRunTracesJobWorker from '../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesJobWorker.js'

import AiRun from '../../../sequelize/models/AiRun.js'
import AiRunFieldOutcome from '../../../sequelize/models/AiRunFieldOutcome.js'
import AiRunStep from '../../../sequelize/models/AiRunStep.js'

/*
 * What the weekly trace job does when nobody hands it a purger (specs/1.0.0, #retention).
 *
 * **The composition, for the reason its content sibling states at greater length.** The worker's
 * declarations are pinned in `tests/__tests__/app/jobs/purge-expired-run-traces/`, and what
 * `AiRunTracePurger` deletes is pinned in `AiRunTracePurger.js` beside this file. What neither
 * reaches is the wiring the daemon actually runs: a worker built from the engine alone, letting
 * `BaseAiRunPurgeJobWorker.create()` default the purger, and asking it by the one method name this
 * job contributes. So no purger is passed and none is mocked, and because the sweep writes
 * transitively the cases sit here rather than beside the class's read-only members.
 *
 * **The engine is a stub**, because a worker is constructed with one and the real `AppJobEngine`
 * opens Redis. Nothing in `#sweepExpiredAiRuns()` touches the queue; the purge below is real.
 *
 * **Every run here is accepted in 2017 and every one already carries `content_purged_at`**, which
 * is this folder's isolation rule applied twice. The first keeps each sweep's horizon - two years
 * back from a `now` in 2019 - clear of the 2026 runs this repository seeds and every other test
 * creates. The second keeps these rows out of the content sweeps in `AiRunContentPurger.js` and in
 * `PurgeExpiredRunContentJobWorker.js`, whose horizons fall in 2019 and would otherwise select
 * every 2017 run in the table. It is also simply true: a run that has reached the trace horizon
 * had its content emptied seven hundred days earlier.
 *
 * **Both windows fall before the earliest run `AiRunTracePurger.js` creates (2017-02-01)**, and
 * they descend down the file, so no row that file or the describe above left behind can be reached
 * or counted here.
 *
 * Ids are #retention's own block, `11050001` upward, and none is borrowed.
 */

describe('PurgeExpiredRunTracesJobWorker', () => {
  describe('#sweepExpiredAiRuns()', () => {
    /*
     * The trace rows themselves, which are what a reader of §19's second criterion cares about:
     * the content purge leaves them alone, and this is the job that finally removes them.
     *
     * The steps are asserted rather than the run's stamp, because a worker wired to the content
     * purger would stamp nothing here and leave the steps exactly where they are - the failure
     * this case exists to catch.
     */
    describe('should delete the steps of a run past the trace horizon', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11050001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11050001',
              requestKey: 'request-key-11050001',
              requestBodyHash: 'request-body-hash-11050001',
              externalRef: 'external-ref-11050001',
              subjectLabel: '',
              correlationId: 'correlation-id-11050001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11050001',
              acceptedAt: new Date('2017-01-20T01:01:01.001Z'),
              finishedAt: new Date('2017-01-20T01:01:09.009Z'),
              contentPurgedAt: new Date('2017-02-19T01:01:01.001Z'),
            },
            aiRunStepRow: {
              id: 11050101,
              AiRunId: 11050001,
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              stepIndex: 0,
              stepName: 'read-asset-media',
              outcomeCode: 'outcome-code-11050101',
              startedAt: new Date('2017-01-20T01:01:02.002Z'),
              finishedAt: new Date('2017-01-20T01:01:03.003Z'),
            },
            aiRunFieldOutcomeRow: {
              id: 11050201,
              AiRunId: 11050001,
              AiRunStepId: 11050101,
              fieldPath: 'asset.color',
              AiRunFieldStatusId: 1,
              AiRunEvidenceCategoryId: 1,
              suggestionConfidence: '0.7125',
              agreedReadingCount: 2,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-11050201',
              settledAt: new Date('2017-01-20T01:01:04.004Z'),
            },
            sweepArgs: {
              now: new Date('2019-01-25T05:05:05.005Z'),
            },
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        await AiRunStep.create(input.aiRunStepRow)

        await AiRunFieldOutcome.create(input.aiRunFieldOutcomeRow)

        const worker = PurgeExpiredRunTracesJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        await worker.sweepExpiredAiRuns(input.sweepArgs)

        const received = await AiRunStep.findAll({ // Act
          where: {
            AiRunId: input.aiRunRow.id,
          },
        })

        expect(received) // Assert
          .toHaveLength(0)
      })
    })
  })
})

describe('PurgeExpiredRunTracesJobWorker', () => {
  describe('#sweepExpiredAiRuns()', () => {
    /*
     * The stamp, and the one column that must not move with it.
     *
     * `content_purged_at` is left exactly where it was found: the two clocks are separate settings
     * and never one, and a trace purge that rewrote the content stamp would make every purged run
     * look as though its content had been emptied seven hundred days later than it was.
     *
     * `trace_purged_at` carrying the instant handed in - rather than a clock read somewhere below
     * - is what says the horizon selected against and the stamp written are one instant, which is
     * the property a sweep long enough to cross midnight rests on.
     */
    describe('should stamp the run and leave the content stamp where it found it', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11050002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11050002',
              requestKey: 'request-key-11050002',
              requestBodyHash: 'request-body-hash-11050002',
              externalRef: 'external-ref-11050002',
              subjectLabel: '',
              correlationId: 'correlation-id-11050002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11050002',
              engineLabel: 'engine-label-11050002',
              acceptedAt: new Date('2017-01-15T03:03:03.003Z'),
              finishedAt: new Date('2017-01-15T03:03:09.009Z'),
              contentPurgedAt: new Date('2017-02-14T03:03:03.003Z'),
            },
            sweepArgs: {
              now: new Date('2019-01-18T08:08:08.008Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11050002,
            tracePurgedAt: new Date('2019-01-18T08:08:08.008Z'),
            contentPurgedAt: new Date('2017-02-14T03:03:03.003Z'),
            engineLabel: 'engine-label-11050002',
            externalRef: 'external-ref-11050002',
            finishedAt: new Date('2017-01-15T03:03:09.009Z'),
          }),
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const worker = PurgeExpiredRunTracesJobWorker.create({
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

describe('PurgeExpiredRunTracesJobWorker', () => {
  describe('#sweepExpiredAiRuns()', () => {
    /*
     * What the worker answers with, which is the purger's own outcome and nothing added to it.
     *
     * For this job the answer carries more weight than it does for the daily purge:
     * `BaseAiRunPurgeJobWorker#executeJob()` reads `isSweepExhausted` off it, and a weekly sweep
     * that stopped on its batch bound is the only warning anybody gets that a week's arrivals are
     * outgrowing one firing.
     *
     * This window's horizon falls before the run the describes above create, so nothing they left
     * behind can be counted here. Two runs in one batch is one batch, and the batch after it comes
     * back empty, which is what ends the sweep.
     */
    describe('should answer with what its default purger swept', () => {
      const cases = [
        {
          input: {
            aiRunRows: [
              {
                id: 11050011,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11050011',
                requestKey: 'request-key-11050011',
                requestBodyHash: 'request-body-hash-11050011',
                externalRef: 'external-ref-11050011',
                subjectLabel: '',
                correlationId: 'correlation-id-11050011',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11050011',
                acceptedAt: new Date('2017-01-01T01:01:01.001Z'),
                contentPurgedAt: new Date('2017-01-31T01:01:01.001Z'),
              },
              {
                id: 11050012,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
                runKey: 'run-key-11050012',
                requestKey: 'request-key-11050012',
                requestBodyHash: 'request-body-hash-11050012',
                externalRef: 'external-ref-11050012',
                subjectLabel: '',
                correlationId: 'correlation-id-11050012',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11050012',
                acceptedAt: new Date('2017-01-02T02:02:02.002Z'),
                contentPurgedAt: new Date('2017-02-01T02:02:02.002Z'),
              },
            ],
            sweepArgs: {
              now: new Date('2019-01-10T10:10:10.010Z'),
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

        const worker = PurgeExpiredRunTracesJobWorker.create({
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
