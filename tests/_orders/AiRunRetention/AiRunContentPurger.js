import AiRunContentPurger from '../../../app/aiRunRetention/AiRunContentPurger.js'

import AiModelCall from '../../../sequelize/models/AiModelCall.js'
import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * What the content purge empties, and what it leaves alone (specs/1.0.0, #retention).
 *
 * **Every run below is accepted in 2019, and that is the whole isolation strategy.** A purge is
 * bounded by a horizon rather than by a caller, so a sweep run against this repository's database
 * would reach every row in `ai_runs` - including the seven the `#run-list` renderer asserts by
 * `run_key` and `subject_label`. Every run this repository seeds or creates anywhere is accepted
 * in 2026; every run here is accepted in 2019 and every `now` handed in puts the horizon in 2019
 * too, so the set each sweep selects is exactly the rows of the describe that created them and
 * nothing else. A case added here with a 2026 date would empty the subject label of every seeded
 * run, and the failures would surface in another folder entirely.
 *
 * **The windows descend down the file, and that is deliberate.** Each describe's horizon falls
 * before the accepted times of every describe above it, so a sweep counting rows cannot be handed
 * a row an earlier describe left behind. The describes that assert a row rather than a count share
 * one window, because a run already stamped is out of the set and re-reaching it is harmless.
 *
 * Ids are #retention's own block, `11020001` upward, and none is borrowed.
 */

describe('AiRunContentPurger', () => {
  describe('#purgeExpiredAiRunContent()', () => {
    /*
     * The four things §7 counts as content, on the run's own three columns.
     *
     * `subject_label` is the one to watch. It is NOT NULL, so the purge empties it where the other
     * two are nulled, and it is the column a purge is likeliest to skip - a run whose label
     * survived still shows the line its caller wrote in every list row, with every criterion of
     * §19 reading as met. The second case is a failed run that never produced a result body: it
     * has one column fewer to empty and is stamped all the same, which is §19's third criterion,
     * "a run whose content has been purged is distinguishable from one that never carried any".
     *
     * What each case also asserts is the columns that must not move. `failure_reason_code`,
     * `engine_label` and the run's instants are decisions rather than content and stay on the long
     * clock; `trace_purged_at` stays null, because the content clock is the shorter of the two and
     * a purge stamping both would put every run past the longer horizon two years early.
     */
    describe('should empty the run content and stamp the run', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11020001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11020001',
              requestKey: 'request-key-11020001',
              requestBodyHash: 'request-body-hash-11020001',
              externalRef: 'external-ref-11020001',
              subjectLabel: 'Silver hatchback parked behind 4-2-1 Sample-cho',
              correlationId: 'correlation-id-11020001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11020001',
              requestBody: '{"fields":[{"path":"asset.color","value":"pearl white"}]}',
              resultBody: '{"fields":[{"path":"asset.color","suggestedValue":"white"}]}',
              engineLabel: 'engine-label-11020001',
              acceptedAt: new Date('2019-06-01T01:01:01.001Z'),
              startedAt: new Date('2019-06-01T01:01:02.002Z'),
              finishedAt: new Date('2019-06-01T01:01:03.003Z'),
            },
            purgeArgs: {
              now: new Date('2019-07-15T09:09:09.009Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11020001,
            requestBody: null,
            resultBody: null,
            subjectLabel: '',
            contentPurgedAt: new Date('2019-07-15T09:09:09.009Z'),
            tracePurgedAt: null,
            engineLabel: 'engine-label-11020001',
            externalRef: 'external-ref-11020001',
            finishedAt: new Date('2019-06-01T01:01:03.003Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 11020002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-11020002',
              requestKey: 'request-key-11020002',
              requestBodyHash: 'request-body-hash-11020002',
              externalRef: 'external-ref-11020002',
              subjectLabel: 'Apartment 302, viewed the Tuesday before listing',
              correlationId: 'correlation-id-11020002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11020002',
              requestBody: '{"fields":[{"path":"asset.floorArea","value":"58.2"}]}',
              failureReasonCode: 'failure-reason-code-11020002',
              acceptedAt: new Date('2019-06-02T02:02:02.002Z'),
              startedAt: new Date('2019-06-02T02:02:03.003Z'),
              finishedAt: new Date('2019-06-02T02:02:04.004Z'),
            },
            purgeArgs: {
              now: new Date('2019-07-15T09:09:09.009Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11020002,
            requestBody: null,
            resultBody: null,
            subjectLabel: '',
            contentPurgedAt: new Date('2019-07-15T09:09:09.009Z'),
            tracePurgedAt: null,
            failureReasonCode: 'failure-reason-code-11020002',
            externalRef: 'external-ref-11020002',
          }),
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const purger = AiRunContentPurger.create()

        await purger.purgeExpiredAiRunContent(input.purgeArgs)

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

describe('AiRunContentPurger', () => {
  describe('#purgeExpiredAiRunContent()', () => {
    /*
     * The fourth content column, which is not on `ai_runs` at all.
     *
     * §7 counts the raw model output as content, and that is `ai_model_calls.response_body`. A
     * purge that wrote only to the run would leave every answer a provider gave sitting in this
     * table, and every criterion of §19 would still read as met - which is exactly why this
     * describe exists separately from the one above.
     *
     * The rest of the row is asserted unchanged in the same breath, because that is §19's second
     * criterion: after content is purged, the model, the prompt version and the token counts stay
     * readable. They are the decision trace and they live on the two-year clock.
     */
    describe('should empty the raw model output and keep the rest of the call', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11020011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11020011',
              requestKey: 'request-key-11020011',
              requestBodyHash: 'request-body-hash-11020011',
              externalRef: 'external-ref-11020011',
              subjectLabel: 'Subject label of run 11020011',
              correlationId: 'correlation-id-11020011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11020011',
              requestBody: '{"fields":[{"path":"asset.mileage","value":"48000"}]}',
              resultBody: '{"fields":[{"path":"asset.mileage","suggestedValue":"48000"}]}',
              acceptedAt: new Date('2019-06-03T03:03:03.003Z'),
              startedAt: new Date('2019-06-03T03:03:04.004Z'),
              finishedAt: new Date('2019-06-03T03:03:05.005Z'),
            },
            aiModelCallRow: {
              id: 11020101,
              AiRunId: 11020011,
              AiModelId: 10110001,
              actionName: 'read-asset-medium',
              readingIndex: 1,
              promptVersion: '2019-05-01T00:00:00.000Z',
              latencyMilliseconds: 1234,
              inputTokenCount: 567,
              outputTokenCount: 89,
              responseBody: '{"readings":[{"path":"asset.mileage","value":"48000 km on the cluster"}]}',
              calledAt: new Date('2019-06-03T03:03:04.500Z'),
            },
            purgeArgs: {
              now: new Date('2019-07-15T09:09:09.009Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11020101,
            AiRunId: 11020011,
            AiModelId: 10110001,
            actionName: 'read-asset-medium',
            readingIndex: 1,
            promptVersion: '2019-05-01T00:00:00.000Z',
            latencyMilliseconds: 1234,
            inputTokenCount: 567,
            outputTokenCount: 89,
            responseBody: null,
            calledAt: new Date('2019-06-03T03:03:04.500Z'),
          }),
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        await AiModelCall.create(input.aiModelCallRow)

        const purger = AiRunContentPurger.create()

        await purger.purgeExpiredAiRunContent(input.purgeArgs)

        const received = await AiModelCall.findOne({ // Act
          where: {
            id: input.aiModelCallRow.id,
          },
        })

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunContentPurger', () => {
  describe('#purgeExpiredAiRunContent()', () => {
    /*
     * What the sweep answers with when it clears the set.
     *
     * The count is what a worker logs, and `isSweepExhausted` is what says the horizon is clear -
     * so an operator asking "did last night's purge finish" has an answer that is not "the job did
     * not throw". Two runs in one batch is one batch, and the batch after it comes back empty,
     * which is what ends the sweep.
     *
     * This window's horizon falls before every run the describes above create, so no row either of
     * them left behind can be counted here.
     */
    describe('should answer with what it purged and that it finished', () => {
      const cases = [
        {
          input: {
            aiRunRows: [
              {
                id: 11020021,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11020021',
                requestKey: 'request-key-11020021',
                requestBodyHash: 'request-body-hash-11020021',
                externalRef: 'external-ref-11020021',
                subjectLabel: 'Subject label of run 11020021',
                correlationId: 'correlation-id-11020021',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11020021',
                requestBody: '{"fields":[{"path":"asset.color","value":"midnight blue"}]}',
                acceptedAt: new Date('2019-04-01T01:01:01.001Z'),
              },
              {
                id: 11020022,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
                runKey: 'run-key-11020022',
                requestKey: 'request-key-11020022',
                requestBodyHash: 'request-body-hash-11020022',
                externalRef: 'external-ref-11020022',
                subjectLabel: 'Subject label of run 11020022',
                correlationId: 'correlation-id-11020022',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11020022',
                requestBody: '{"fields":[{"path":"asset.color","value":"gunmetal"}]}',
                acceptedAt: new Date('2019-04-02T02:02:02.002Z'),
              },
            ],
            purgeArgs: {
              now: new Date('2019-05-10T10:10:10.010Z'),
            },
          },
          expected: {
            purgedAiRunCount: 2,
            batchCount: 1,
            isSweepExhausted: true,
          },
        },
      ]

      test.each(cases)('now: $input.purgeArgs.now', async ({
        input,
        expected,
      }) => {
        await AiRun.bulkCreate(input.aiRunRows) // Arrange

        const purger = AiRunContentPurger.create()

        const received = await purger.purgeExpiredAiRunContent(input.purgeArgs) // Act

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunContentPurger', () => {
  describe('#purgeExpiredAiRunContent()', () => {
    /*
     * A sweep that runs out of batches before it runs out of rows, which is the case §19's "it
     * reads far more rows than any request does" exists for.
     *
     * One run to a batch and two batches to a sweep is the same arithmetic as two hundred and
     * fifty at the figures `aiRunPurgeSweepConstants.cjs` ships; what it makes checkable here is
     * that the bound holds, that the sweep ends rather than running on, and that it says it did
     * not finish. `isSweepExhausted` false is not a failure - it is the backlog being larger than
     * one night's work, and tomorrow's sweep continues from the same condition because the two
     * runs purged here have left the set by being stamped.
     */
    describe('should stop at its batch bound and say it did not finish', () => {
      const cases = [
        {
          factoryParams: {
            aiRunCountPerBatch: 1,
            maximumBatchCount: 2,
          },
          input: {
            aiRunRows: [
              {
                id: 11020031,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11020031',
                requestKey: 'request-key-11020031',
                requestBodyHash: 'request-body-hash-11020031',
                externalRef: 'external-ref-11020031',
                subjectLabel: 'Subject label of run 11020031',
                correlationId: 'correlation-id-11020031',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11020031',
                requestBody: '{"fields":[{"path":"asset.year","value":"2014"}]}',
                acceptedAt: new Date('2019-03-01T01:01:01.001Z'),
              },
              {
                id: 11020032,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11020032',
                requestKey: 'request-key-11020032',
                requestBodyHash: 'request-body-hash-11020032',
                externalRef: 'external-ref-11020032',
                subjectLabel: 'Subject label of run 11020032',
                correlationId: 'correlation-id-11020032',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11020032',
                requestBody: '{"fields":[{"path":"asset.year","value":"2015"}]}',
                acceptedAt: new Date('2019-03-02T02:02:02.002Z'),
              },
              {
                id: 11020033,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11020033',
                requestKey: 'request-key-11020033',
                requestBodyHash: 'request-body-hash-11020033',
                externalRef: 'external-ref-11020033',
                subjectLabel: 'Subject label of run 11020033',
                correlationId: 'correlation-id-11020033',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11020033',
                requestBody: '{"fields":[{"path":"asset.year","value":"2016"}]}',
                acceptedAt: new Date('2019-03-03T03:03:03.003Z'),
              },
            ],
            purgeArgs: {
              now: new Date('2019-04-08T08:08:08.008Z'),
            },
          },
          expected: {
            purgedAiRunCount: 2,
            batchCount: 2,
            isSweepExhausted: false,
          },
        },
      ]

      test.each(cases)('aiRunCountPerBatch: $factoryParams.aiRunCountPerBatch', async ({
        factoryParams,
        input,
        expected,
      }) => {
        await AiRun.bulkCreate(input.aiRunRows) // Arrange

        const purger = AiRunContentPurger.create(factoryParams)

        const received = await purger.purgeExpiredAiRunContent(input.purgeArgs) // Act

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunContentPurger', () => {
  describe('#purgeExpiredAiRunContent()', () => {
    /*
     * The other half of the bound: the row the sweep did not reach is the row it did not touch.
     *
     * A bound that emptied a run's content and then ran out of batches before stamping it would be
     * the worst of both - the content gone, and `content_purged_at` null, so §19's third criterion
     * fails on a run this service itself emptied and the next sweep selects it again to empty
     * nothing. The oldest run goes first, so the one left standing here is the newest of the three.
     */
    describe('should leave a run beyond the batch bound exactly as it was', () => {
      const cases = [
        {
          factoryParams: {
            aiRunCountPerBatch: 1,
            maximumBatchCount: 2,
          },
          input: {
            aiRunRows: [
              {
                id: 11020041,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11020041',
                requestKey: 'request-key-11020041',
                requestBodyHash: 'request-body-hash-11020041',
                externalRef: 'external-ref-11020041',
                subjectLabel: 'Subject label of run 11020041',
                correlationId: 'correlation-id-11020041',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11020041',
                requestBody: '{"fields":[{"path":"asset.trim","value":"G grade"}]}',
                acceptedAt: new Date('2019-02-01T01:01:01.001Z'),
              },
              {
                id: 11020042,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11020042',
                requestKey: 'request-key-11020042',
                requestBodyHash: 'request-body-hash-11020042',
                externalRef: 'external-ref-11020042',
                subjectLabel: 'Subject label of run 11020042',
                correlationId: 'correlation-id-11020042',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11020042',
                requestBody: '{"fields":[{"path":"asset.trim","value":"X grade"}]}',
                acceptedAt: new Date('2019-02-02T02:02:02.002Z'),
              },
              {
                id: 11020043,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11020043',
                requestKey: 'request-key-11020043',
                requestBodyHash: 'request-body-hash-11020043',
                externalRef: 'external-ref-11020043',
                subjectLabel: 'Villa on the north shore of Sample Lake',
                correlationId: 'correlation-id-11020043',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11020043',
                requestBody: '{"fields":[{"path":"asset.trim","value":"Z grade"}]}',
                acceptedAt: new Date('2019-02-03T03:03:03.003Z'),
              },
            ],
            purgeArgs: {
              now: new Date('2019-03-08T08:08:08.008Z'),
            },
            unreachedAiRunId: 11020043,
          },
          expected: expect.objectContaining({
            id: 11020043,
            requestBody: '{"fields":[{"path":"asset.trim","value":"Z grade"}]}',
            subjectLabel: 'Villa on the north shore of Sample Lake',
            contentPurgedAt: null,
            tracePurgedAt: null,
          }),
        },
      ]

      test.each(cases)('unreachedAiRunId: $input.unreachedAiRunId', async ({
        factoryParams,
        input,
        expected,
      }) => {
        await AiRun.bulkCreate(input.aiRunRows) // Arrange

        const purger = AiRunContentPurger.create(factoryParams)

        await purger.purgeExpiredAiRunContent(input.purgeArgs)

        const received = await AiRun.findOne({ // Act
          where: {
            id: input.unreachedAiRunId,
          },
        })

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunContentPurger', () => {
  describe('#purgeExpiredAiRunContent()', () => {
    /*
     * An instant that is not an instant, refused before anything is read.
     *
     * Sequelize coerces whatever it is handed into `datetime(3)`, so a `now` of this kind would
     * settle in `content_purged_at` as the literal text `Invalid date` - on runs whose content it
     * had just emptied. The next sweep's condition would not find them, nothing would ever correct
     * them, and a run purged that way is indistinguishable from one purged properly. It is the
     * failure `AiRunInstantInspector` was written for, met here before the horizon is even
     * calculated.
     *
     * None of these cases reaches the database, so none creates a row.
     */
    describe('should refuse a now that is not an instant', () => {
      const cases = [
        {
          params: {
            now: 'whenever',
          },
          label: 'a word that is not a time',
        },
        {
          params: {
            now: '2019-07-15T09:09:09.009Z',
          },
          label: 'a time written as a string, which is not what the signature asks for',
        },
        {
          params: {
            now: new Date('not a date at all'),
          },
          label: 'a Date carrying no time',
        },
        {
          params: {
            now: null,
          },
          label: 'nothing at all',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
      }) => {
        const purger = AiRunContentPurger.create() // Arrange
        const expected = 'AiRunContentPurger#purgeExpiredAiRunContent() refused an instant that is not an instant: field now'

        const actual = () => purger.purgeExpiredAiRunContent(params) // Act

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})
