import AiRunStatusRecorder from '../../../app/aiRun/AiRunStatusRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * Every run this file transitions is created by this file, in `#run-record`'s own id block
 * (`10230001` upward). The development seeders fill `ai_runs` with runs in all five statuses, but
 * those rows are read by the tests of `#run-contract` and of this feature's other units — a test
 * that moved one of them would change what those read, and the failure would land somewhere else
 * entirely. `10239001` upward is reserved for ids that are never created, so a not-found case has
 * something to ask for that no run will ever answer.
 */

describe('AiRunStatusRecorder', () => {
  describe('#saveRunningAiRun()', () => {
    /*
     * Running is the one non-terminal status a run is moved into, and the instant it began arrives
     * on the call. The second case re-stamps a run that is already running, which is what a worker
     * picking up a run again after a crash does: running is not a status a run has settled in, so
     * nothing refuses it.
     */
    describe('should save the run as running', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10230001',
              requestKey: 'request-key-10230001',
              requestBodyHash: 'request-body-hash-10230001',
              externalRef: 'external-ref-10230001',
              subjectLabel: 'Subject label of run 10230001',
              correlationId: 'correlation-id-10230001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230001',
              acceptedAt: new Date('2026-09-26T01:01:01.001Z'),
              startedAt: null,
              finishedAt: null,
            },
            startedAt: new Date('2026-09-26T01:01:05.005Z'),
          },
          expected: expect.objectContaining({
            id: 10230001,
            AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            startedAt: new Date('2026-09-26T01:01:05.005Z'),
            finishedAt: null,
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10230002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — picked up once already
              runKey: 'run-key-10230002',
              requestKey: 'request-key-10230002',
              requestBodyHash: 'request-body-hash-10230002',
              externalRef: 'external-ref-10230002',
              subjectLabel: 'Subject label of run 10230002',
              correlationId: 'correlation-id-10230002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230002',
              acceptedAt: new Date('2026-09-26T02:02:02.002Z'),
              startedAt: new Date('2026-09-26T02:02:03.003Z'),
              finishedAt: null,
            },
            startedAt: new Date('2026-09-26T02:02:44.044Z'),
          },
          expected: expect.objectContaining({
            id: 10230002,
            AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            startedAt: new Date('2026-09-26T02:02:44.044Z'),
            finishedAt: null,
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          startedAt: input.startedAt,
        }

        const received = await recorder.saveRunningAiRun(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveRunningAiRun()', () => {
    /*
     * A run never leaves succeeded, failed or canceled — one terminal status per case, so a guard
     * that let one of the three through is named by the case that fails. The refusal is an
     * exception rather than a quiet no-op: a worker that asked for a run to be marked running and
     * was answered with nothing would carry on as though it owned the run.
     */
    describe('when the run has already settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230003,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230003',
              requestKey: 'request-key-10230003',
              requestBodyHash: 'request-body-hash-10230003',
              externalRef: 'external-ref-10230003',
              subjectLabel: 'Subject label of run 10230003',
              correlationId: 'correlation-id-10230003',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230003',
              acceptedAt: new Date('2026-09-26T03:03:03.003Z'),
              startedAt: new Date('2026-09-26T03:03:04.004Z'),
              finishedAt: new Date('2026-09-26T03:03:05.005Z'),
            },
            startedAt: new Date('2026-09-26T03:03:33.033Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230003, AiRunStatusId 3',
        },
        {
          input: {
            aiRunRow: {
              id: 10230004,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10230004',
              requestKey: 'request-key-10230004',
              requestBodyHash: 'request-body-hash-10230004',
              externalRef: 'external-ref-10230004',
              subjectLabel: 'Subject label of run 10230004',
              correlationId: 'correlation-id-10230004',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230004',
              acceptedAt: new Date('2026-09-26T04:04:04.004Z'),
              startedAt: new Date('2026-09-26T04:04:05.005Z'),
              finishedAt: new Date('2026-09-26T04:04:06.006Z'),
            },
            startedAt: new Date('2026-09-26T04:04:44.044Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230004, AiRunStatusId 4',
        },
        {
          input: {
            aiRunRow: {
              id: 10230005,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230005',
              requestKey: 'request-key-10230005',
              requestBodyHash: 'request-body-hash-10230005',
              externalRef: 'external-ref-10230005',
              subjectLabel: 'Subject label of run 10230005',
              correlationId: 'correlation-id-10230005',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230005',
              acceptedAt: new Date('2026-09-26T05:05:05.005Z'),
              startedAt: new Date('2026-09-26T05:05:06.006Z'),
              finishedAt: new Date('2026-09-26T05:05:07.007Z'),
            },
            startedAt: new Date('2026-09-26T05:05:55.055Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230005, AiRunStatusId 5',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          startedAt: input.startedAt,
        }

        const received = () => recorder.saveRunningAiRun(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRun()', () => {
    /*
     * A run whose result is legitimately empty is recorded as succeeded, not as failed. The second
     * case settles no field at all and the third carries no result body whatsoever, and both land
     * on succeeded — nothing here measures the result to decide the status.
     *
     * Every case also asserts that no failure reason and no failure parameters were recorded. That
     * is the other half of the criterion the failed describe below carries: a failure is recorded
     * with a reason, and a success is recorded with none.
     */
    describe('should save the run as succeeded', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230011',
              requestKey: 'request-key-10230011',
              requestBodyHash: 'request-body-hash-10230011',
              externalRef: 'external-ref-10230011',
              subjectLabel: 'Subject label of run 10230011',
              correlationId: 'correlation-id-10230011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230011',
              acceptedAt: new Date('2026-09-26T11:11:01.001Z'),
              startedAt: new Date('2026-09-26T11:11:02.002Z'),
              finishedAt: null,
              resultBody: null,
              failureReasonCode: null,
              failureParameters: null,
            },
            resultBody: '{"fields":[{"fieldPath":"subject.alpha"}]}',
            finishedAt: new Date('2026-09-26T11:11:09.009Z'),
          },
          expected: expect.objectContaining({
            id: 10230011,
            AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            resultBody: '{"fields":[{"fieldPath":"subject.alpha"}]}',
            finishedAt: new Date('2026-09-26T11:11:09.009Z'),
            failureReasonCode: null,
            failureParameters: null,
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10230012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230012',
              requestKey: 'request-key-10230012',
              requestBodyHash: 'request-body-hash-10230012',
              externalRef: 'external-ref-10230012',
              subjectLabel: 'Subject label of run 10230012',
              correlationId: 'correlation-id-10230012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230012',
              acceptedAt: new Date('2026-09-26T12:12:01.001Z'),
              startedAt: new Date('2026-09-26T12:12:02.002Z'),
              finishedAt: null,
              resultBody: null,
              failureReasonCode: null,
              failureParameters: null,
            },
            resultBody: '{"fields":[]}', // the run settled nothing, and that is a success
            finishedAt: new Date('2026-09-26T12:12:09.009Z'),
          },
          expected: expect.objectContaining({
            id: 10230012,
            AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            resultBody: '{"fields":[]}',
            finishedAt: new Date('2026-09-26T12:12:09.009Z'),
            failureReasonCode: null,
            failureParameters: null,
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10230013,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10230013',
              requestKey: 'request-key-10230013',
              requestBodyHash: 'request-body-hash-10230013',
              externalRef: 'external-ref-10230013',
              subjectLabel: 'Subject label of run 10230013',
              correlationId: 'correlation-id-10230013',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230013',
              acceptedAt: new Date('2026-09-26T13:13:01.001Z'),
              startedAt: null,
              finishedAt: null,
              resultBody: null,
              failureReasonCode: null,
              failureParameters: null,
            },
            resultBody: null, // there was no body to record at all
            finishedAt: new Date('2026-09-26T13:13:09.009Z'),
          },
          expected: expect.objectContaining({
            id: 10230013,
            AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            resultBody: null,
            finishedAt: new Date('2026-09-26T13:13:09.009Z'),
            failureReasonCode: null,
            failureParameters: null,
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          resultBody: input.resultBody,
          finishedAt: input.finishedAt,
        }

        const received = await recorder.saveSucceededAiRun(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRun()', () => {
    describe('when the run has already settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230014,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230014',
              requestKey: 'request-key-10230014',
              requestBodyHash: 'request-body-hash-10230014',
              externalRef: 'external-ref-10230014',
              subjectLabel: 'Subject label of run 10230014',
              correlationId: 'correlation-id-10230014',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230014',
              acceptedAt: new Date('2026-09-26T14:14:01.001Z'),
              startedAt: new Date('2026-09-26T14:14:02.002Z'),
              finishedAt: new Date('2026-09-26T14:14:03.003Z'),
            },
            resultBody: '{"fields":[{"fieldPath":"subject.beta"}]}',
            finishedAt: new Date('2026-09-26T14:14:44.044Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230014, AiRunStatusId 3',
        },
        {
          input: {
            aiRunRow: {
              id: 10230015,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10230015',
              requestKey: 'request-key-10230015',
              requestBodyHash: 'request-body-hash-10230015',
              externalRef: 'external-ref-10230015',
              subjectLabel: 'Subject label of run 10230015',
              correlationId: 'correlation-id-10230015',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230015',
              acceptedAt: new Date('2026-09-26T15:15:01.001Z'),
              startedAt: new Date('2026-09-26T15:15:02.002Z'),
              finishedAt: new Date('2026-09-26T15:15:03.003Z'),
            },
            resultBody: '{"fields":[{"fieldPath":"subject.gamma"}]}',
            finishedAt: new Date('2026-09-26T15:15:55.055Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230015, AiRunStatusId 4',
        },
        {
          input: {
            aiRunRow: {
              id: 10230016,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230016',
              requestKey: 'request-key-10230016',
              requestBodyHash: 'request-body-hash-10230016',
              externalRef: 'external-ref-10230016',
              subjectLabel: 'Subject label of run 10230016',
              correlationId: 'correlation-id-10230016',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230016',
              acceptedAt: new Date('2026-09-26T16:16:01.001Z'),
              startedAt: new Date('2026-09-26T16:16:02.002Z'),
              finishedAt: new Date('2026-09-26T16:16:03.003Z'),
            },
            resultBody: '{"fields":[{"fieldPath":"subject.delta"}]}',
            finishedAt: new Date('2026-09-26T16:16:56.056Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230016, AiRunStatusId 5',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          resultBody: input.resultBody,
          finishedAt: input.finishedAt,
        }

        const received = () => recorder.saveSucceededAiRun(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveFailedAiRun()', () => {
    /*
     * A failed run records a reason code. The code and its parameters arrive from the caller, which
     * is the only thing that knows why the run ended the way it did, and both are written exactly
     * as handed over — the second case hands no parameters at all, and none are invented for it.
     */
    describe('should save the run as failed', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230021',
              requestKey: 'request-key-10230021',
              requestBodyHash: 'request-body-hash-10230021',
              externalRef: 'external-ref-10230021',
              subjectLabel: 'Subject label of run 10230021',
              correlationId: 'correlation-id-10230021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230021',
              acceptedAt: new Date('2026-09-26T21:21:01.001Z'),
              startedAt: new Date('2026-09-26T21:21:02.002Z'),
              finishedAt: null,
              failureReasonCode: null,
              failureParameters: null,
            },
            failureReasonCode: 'media_unreachable',
            failureParameters: {
              attemptCount: 3,
              lastStatusCode: 504,
            },
            finishedAt: new Date('2026-09-26T21:21:09.009Z'),
          },
          expected: expect.objectContaining({
            id: 10230021,
            AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
            failureReasonCode: 'media_unreachable',
            failureParameters: {
              attemptCount: 3,
              lastStatusCode: 504,
            },
            finishedAt: new Date('2026-09-26T21:21:09.009Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10230022,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10230022',
              requestKey: 'request-key-10230022',
              requestBodyHash: 'request-body-hash-10230022',
              externalRef: 'external-ref-10230022',
              subjectLabel: 'Subject label of run 10230022',
              correlationId: 'correlation-id-10230022',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230022',
              acceptedAt: new Date('2026-09-26T22:22:01.001Z'),
              startedAt: null,
              finishedAt: null,
              failureReasonCode: null,
              failureParameters: null,
            },
            failureReasonCode: 'run_time_limit_reached',
            failureParameters: null, // the reason stands on its own, and nothing is invented for it
            finishedAt: new Date('2026-09-26T22:22:09.009Z'),
          },
          expected: expect.objectContaining({
            id: 10230022,
            AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
            failureReasonCode: 'run_time_limit_reached',
            failureParameters: null,
            finishedAt: new Date('2026-09-26T22:22:09.009Z'),
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          failureReasonCode: input.failureReasonCode,
          failureParameters: input.failureParameters,
          finishedAt: input.finishedAt,
        }

        const received = await recorder.saveFailedAiRun(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveFailedAiRun()', () => {
    describe('when the run has already settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230023,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230023',
              requestKey: 'request-key-10230023',
              requestBodyHash: 'request-body-hash-10230023',
              externalRef: 'external-ref-10230023',
              subjectLabel: 'Subject label of run 10230023',
              correlationId: 'correlation-id-10230023',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230023',
              acceptedAt: new Date('2026-09-26T23:23:01.001Z'),
              startedAt: new Date('2026-09-26T23:23:02.002Z'),
              finishedAt: new Date('2026-09-26T23:23:03.003Z'),
            },
            failureReasonCode: 'media_unreachable',
            failureParameters: null,
            finishedAt: new Date('2026-09-26T23:23:33.033Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230023, AiRunStatusId 3',
        },
        {
          input: {
            aiRunRow: {
              id: 10230024,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10230024',
              requestKey: 'request-key-10230024',
              requestBodyHash: 'request-body-hash-10230024',
              externalRef: 'external-ref-10230024',
              subjectLabel: 'Subject label of run 10230024',
              correlationId: 'correlation-id-10230024',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230024',
              acceptedAt: new Date('2026-09-27T01:01:01.001Z'),
              startedAt: new Date('2026-09-27T01:01:02.002Z'),
              finishedAt: new Date('2026-09-27T01:01:03.003Z'),
            },
            failureReasonCode: 'media_unreadable',
            failureParameters: null,
            finishedAt: new Date('2026-09-27T01:01:44.044Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230024, AiRunStatusId 4',
        },
        {
          input: {
            aiRunRow: {
              id: 10230025,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230025',
              requestKey: 'request-key-10230025',
              requestBodyHash: 'request-body-hash-10230025',
              externalRef: 'external-ref-10230025',
              subjectLabel: 'Subject label of run 10230025',
              correlationId: 'correlation-id-10230025',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230025',
              acceptedAt: new Date('2026-09-27T02:02:01.001Z'),
              startedAt: new Date('2026-09-27T02:02:02.002Z'),
              finishedAt: new Date('2026-09-27T02:02:03.003Z'),
            },
            failureReasonCode: 'media_too_large',
            failureParameters: null,
            finishedAt: new Date('2026-09-27T02:02:55.055Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230025, AiRunStatusId 5',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          failureReasonCode: input.failureReasonCode,
          failureParameters: input.failureParameters,
          finishedAt: input.finishedAt,
        }

        const received = () => recorder.saveFailedAiRun(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveFailedAiRun()', () => {
    /*
     * The other half of the criterion: a failed run records a reason code, so a call carrying none
     * is refused rather than recorded. Every run here is queued or running — non-terminal, so the
     * settled guard cannot be what turns any of these away, and a pass names this refusal alone.
     *
     * The four cases are the four ways a reason code can be absent: null, nothing passed at all,
     * the empty string, and a string holding only whitespace. The last two matter because
     * `failure_reason_code` is nullable and would take either of them without complaint — a code of
     * blanks reads as present at the column while naming no reason a client can resolve into
     * wording. The second case hands failure parameters and no code, because parameters describe a
     * reason rather than being one, and a row carrying them alone still cannot say why the run
     * failed.
     */
    describe('when the reason code is absent', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230026,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230026',
              requestKey: 'request-key-10230026',
              requestBodyHash: 'request-body-hash-10230026',
              externalRef: 'external-ref-10230026',
              subjectLabel: 'Subject label of run 10230026',
              correlationId: 'correlation-id-10230026',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230026',
              acceptedAt: new Date('2026-09-27T18:18:01.001Z'),
              startedAt: new Date('2026-09-27T18:18:02.002Z'),
              finishedAt: null,
            },
            failureReasonCode: null,
            failureParameters: null,
            finishedAt: new Date('2026-09-27T18:18:09.009Z'),
          },
          expected: 'AiRunStatusRecorder#saveFailedAiRun() refused a failed run carrying no reason code: AiRunId 10230026',
        },
        {
          input: {
            aiRunRow: {
              id: 10230027,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10230027',
              requestKey: 'request-key-10230027',
              requestBodyHash: 'request-body-hash-10230027',
              externalRef: 'external-ref-10230027',
              subjectLabel: 'Subject label of run 10230027',
              correlationId: 'correlation-id-10230027',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230027',
              acceptedAt: new Date('2026-09-27T19:19:01.001Z'),
              startedAt: null,
              finishedAt: null,
            },
            // failureReasonCode: undefined — nothing was passed at all
            failureParameters: {
              attemptCount: 2,
              lastStatusCode: 502,
            },
            finishedAt: new Date('2026-09-27T19:19:09.009Z'),
          },
          expected: 'AiRunStatusRecorder#saveFailedAiRun() refused a failed run carrying no reason code: AiRunId 10230027',
        },
        {
          input: {
            aiRunRow: {
              id: 10230028,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230028',
              requestKey: 'request-key-10230028',
              requestBodyHash: 'request-body-hash-10230028',
              externalRef: 'external-ref-10230028',
              subjectLabel: 'Subject label of run 10230028',
              correlationId: 'correlation-id-10230028',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230028',
              acceptedAt: new Date('2026-09-27T20:20:01.001Z'),
              startedAt: new Date('2026-09-27T20:20:02.002Z'),
              finishedAt: null,
            },
            failureReasonCode: '', // the column would take it, and it names no reason
            failureParameters: null,
            finishedAt: new Date('2026-09-27T20:20:09.009Z'),
          },
          expected: 'AiRunStatusRecorder#saveFailedAiRun() refused a failed run carrying no reason code: AiRunId 10230028',
        },
        {
          input: {
            aiRunRow: {
              id: 10230029,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10230029',
              requestKey: 'request-key-10230029',
              requestBodyHash: 'request-body-hash-10230029',
              externalRef: 'external-ref-10230029',
              subjectLabel: 'Subject label of run 10230029',
              correlationId: 'correlation-id-10230029',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230029',
              acceptedAt: new Date('2026-09-27T21:21:01.001Z'),
              startedAt: null,
              finishedAt: null,
            },
            failureReasonCode: '   ', // blanks read as present at the column and resolve to nothing
            failureParameters: null,
            finishedAt: new Date('2026-09-27T21:21:09.009Z'),
          },
          expected: 'AiRunStatusRecorder#saveFailedAiRun() refused a failed run carrying no reason code: AiRunId 10230029',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          failureReasonCode: input.failureReasonCode,
          failureParameters: input.failureParameters,
          finishedAt: input.finishedAt,
        }

        const received = () => recorder.saveFailedAiRun(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveCanceledAiRun()', () => {
    /*
     * The instant a cancellation took effect, and the gap it closes.
     *
     * Both runs were asked to cancel before this call, at an instant already on the row, and this
     * is the write that records the instant it actually took effect at a step boundary. The two
     * columns are asserted together on purpose: `cancel_requested_at` is untouched here and
     * `canceled_at` is new, so the distance between them — seven seconds in the first case, nine
     * hundred milliseconds in the second — is readable from the row afterwards. A class that wrote
     * one of them over the other, or wrote both in one call, would leave nothing to measure.
     */
    describe('should save the run as canceled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230031,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230031',
              requestKey: 'request-key-10230031',
              requestBodyHash: 'request-body-hash-10230031',
              externalRef: 'external-ref-10230031',
              subjectLabel: 'Subject label of run 10230031',
              correlationId: 'correlation-id-10230031',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230031',
              acceptedAt: new Date('2026-09-27T03:03:01.001Z'),
              startedAt: new Date('2026-09-27T03:03:02.002Z'),
              finishedAt: null,
              cancelRequestedAt: new Date('2026-09-27T03:03:10.000Z'), // when somebody asked
              canceledAt: null,
            },
            canceledAt: new Date('2026-09-27T03:03:17.007Z'),
            finishedAt: new Date('2026-09-27T03:03:17.007Z'),
          },
          expected: expect.objectContaining({
            id: 10230031,
            AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
            cancelRequestedAt: new Date('2026-09-27T03:03:10.000Z'),
            canceledAt: new Date('2026-09-27T03:03:17.007Z'),
            finishedAt: new Date('2026-09-27T03:03:17.007Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10230032,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10230032',
              requestKey: 'request-key-10230032',
              requestBodyHash: 'request-body-hash-10230032',
              externalRef: 'external-ref-10230032',
              subjectLabel: 'Subject label of run 10230032',
              correlationId: 'correlation-id-10230032',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230032',
              acceptedAt: new Date('2026-09-27T04:04:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-09-27T04:04:05.005Z'), // when somebody asked
              canceledAt: null,
            },
            canceledAt: new Date('2026-09-27T04:04:05.905Z'),
            finishedAt: new Date('2026-09-27T04:04:05.905Z'),
          },
          expected: expect.objectContaining({
            id: 10230032,
            AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
            cancelRequestedAt: new Date('2026-09-27T04:04:05.005Z'),
            canceledAt: new Date('2026-09-27T04:04:05.905Z'),
            finishedAt: new Date('2026-09-27T04:04:05.905Z'),
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          canceledAt: input.canceledAt,
          finishedAt: input.finishedAt,
        }

        const received = await recorder.saveCanceledAiRun(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveCanceledAiRun()', () => {
    describe('when the run has already settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230033,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230033',
              requestKey: 'request-key-10230033',
              requestBodyHash: 'request-body-hash-10230033',
              externalRef: 'external-ref-10230033',
              subjectLabel: 'Subject label of run 10230033',
              correlationId: 'correlation-id-10230033',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230033',
              acceptedAt: new Date('2026-09-27T05:05:01.001Z'),
              startedAt: new Date('2026-09-27T05:05:02.002Z'),
              finishedAt: new Date('2026-09-27T05:05:03.003Z'),
            },
            canceledAt: new Date('2026-09-27T05:05:33.033Z'),
            finishedAt: new Date('2026-09-27T05:05:33.033Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230033, AiRunStatusId 3',
        },
        {
          input: {
            aiRunRow: {
              id: 10230034,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10230034',
              requestKey: 'request-key-10230034',
              requestBodyHash: 'request-body-hash-10230034',
              externalRef: 'external-ref-10230034',
              subjectLabel: 'Subject label of run 10230034',
              correlationId: 'correlation-id-10230034',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230034',
              acceptedAt: new Date('2026-09-27T06:06:01.001Z'),
              startedAt: new Date('2026-09-27T06:06:02.002Z'),
              finishedAt: new Date('2026-09-27T06:06:03.003Z'),
            },
            canceledAt: new Date('2026-09-27T06:06:44.044Z'),
            finishedAt: new Date('2026-09-27T06:06:44.044Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230034, AiRunStatusId 4',
        },
        {
          input: {
            aiRunRow: {
              id: 10230035,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230035',
              requestKey: 'request-key-10230035',
              requestBodyHash: 'request-body-hash-10230035',
              externalRef: 'external-ref-10230035',
              subjectLabel: 'Subject label of run 10230035',
              correlationId: 'correlation-id-10230035',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230035',
              acceptedAt: new Date('2026-09-27T07:07:01.001Z'),
              startedAt: new Date('2026-09-27T07:07:02.002Z'),
              finishedAt: new Date('2026-09-27T07:07:03.003Z'),
            },
            canceledAt: new Date('2026-09-27T07:07:55.055Z'),
            finishedAt: new Date('2026-09-27T07:07:55.055Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230035, AiRunStatusId 5',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          canceledAt: input.canceledAt,
          finishedAt: input.finishedAt,
        }

        const received = () => recorder.saveCanceledAiRun(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveAiRunCancelRequest()', () => {
    /*
     * Asking is not stopping, and the two are recorded apart.
     *
     * This writes `cancel_requested_at` and nothing else: the status is where it was, and
     * `canceled_at` is still empty, because the run goes on until the step loop reaches a boundary
     * and honors the request. Asserting the status and `canceled_at` here is what would catch a
     * class that settled the run the moment somebody asked — and with it the gap that the pair of
     * columns exists to make measurable.
     */
    describe('should save the instant the cancellation was asked for', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230041,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10230041',
              requestKey: 'request-key-10230041',
              requestBodyHash: 'request-body-hash-10230041',
              externalRef: 'external-ref-10230041',
              subjectLabel: 'Subject label of run 10230041',
              correlationId: 'correlation-id-10230041',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230041',
              acceptedAt: new Date('2026-09-27T08:08:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
              canceledAt: null,
            },
            cancelRequestedAt: new Date('2026-09-27T08:08:08.008Z'),
          },
          expected: expect.objectContaining({
            id: 10230041,
            AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID — asking moves no status
            cancelRequestedAt: new Date('2026-09-27T08:08:08.008Z'),
            canceledAt: null,
            finishedAt: null,
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10230042,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230042',
              requestKey: 'request-key-10230042',
              requestBodyHash: 'request-body-hash-10230042',
              externalRef: 'external-ref-10230042',
              subjectLabel: 'Subject label of run 10230042',
              correlationId: 'correlation-id-10230042',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230042',
              acceptedAt: new Date('2026-09-27T09:09:01.001Z'),
              startedAt: new Date('2026-09-27T09:09:02.002Z'),
              finishedAt: null,
              cancelRequestedAt: null,
              canceledAt: null,
            },
            cancelRequestedAt: new Date('2026-09-27T09:09:09.009Z'),
          },
          expected: expect.objectContaining({
            id: 10230042,
            AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — the run goes on until a step boundary
            cancelRequestedAt: new Date('2026-09-27T09:09:09.009Z'),
            canceledAt: null,
            finishedAt: null,
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = await recorder.saveAiRunCancelRequest(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveAiRunCancelRequest()', () => {
    /*
     * A cancellation arriving after the run has settled is refused too. Nothing is left to stop, and
     * an instant recorded against a run that finished yesterday would read as a gap that was never
     * waited out. Whether the caller answers that refusal with a conflict or with the settled run as
     * it stands is `#run-cancel`'s to decide; what this class owes it is an answer it can act on.
     */
    describe('when the run has already settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230043,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230043',
              requestKey: 'request-key-10230043',
              requestBodyHash: 'request-body-hash-10230043',
              externalRef: 'external-ref-10230043',
              subjectLabel: 'Subject label of run 10230043',
              correlationId: 'correlation-id-10230043',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230043',
              acceptedAt: new Date('2026-09-27T10:10:01.001Z'),
              startedAt: new Date('2026-09-27T10:10:02.002Z'),
              finishedAt: new Date('2026-09-27T10:10:03.003Z'),
            },
            cancelRequestedAt: new Date('2026-09-27T10:10:33.033Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230043, AiRunStatusId 3',
        },
        {
          input: {
            aiRunRow: {
              id: 10230044,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10230044',
              requestKey: 'request-key-10230044',
              requestBodyHash: 'request-body-hash-10230044',
              externalRef: 'external-ref-10230044',
              subjectLabel: 'Subject label of run 10230044',
              correlationId: 'correlation-id-10230044',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230044',
              acceptedAt: new Date('2026-09-27T11:11:01.001Z'),
              startedAt: new Date('2026-09-27T11:11:02.002Z'),
              finishedAt: new Date('2026-09-27T11:11:03.003Z'),
            },
            cancelRequestedAt: new Date('2026-09-27T11:11:44.044Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230044, AiRunStatusId 4',
        },
        {
          input: {
            aiRunRow: {
              id: 10230045,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230045',
              requestKey: 'request-key-10230045',
              requestBodyHash: 'request-body-hash-10230045',
              externalRef: 'external-ref-10230045',
              subjectLabel: 'Subject label of run 10230045',
              correlationId: 'correlation-id-10230045',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230045',
              acceptedAt: new Date('2026-09-27T12:12:01.001Z'),
              startedAt: new Date('2026-09-27T12:12:02.002Z'),
              finishedAt: new Date('2026-09-27T12:12:03.003Z'),
            },
            cancelRequestedAt: new Date('2026-09-27T12:12:55.055Z'),
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230045, AiRunStatusId 5',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = () => recorder.saveAiRunCancelRequest(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The guard's own describe. Every method above reaches the row through this one, and what it
     * writes is whatever it was handed — the two cases hand it columns no status transition of its
     * own writes, so a pass here says the write is faithful rather than that one of the five
     * callers happened to work.
     */
    describe('should save the values it was handed', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230051,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10230051',
              requestKey: 'request-key-10230051',
              requestBodyHash: 'request-body-hash-10230051',
              externalRef: 'external-ref-10230051',
              subjectLabel: 'Subject label of run 10230051',
              correlationId: 'correlation-id-10230051',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230051',
              acceptedAt: new Date('2026-09-27T13:13:01.001Z'),
              startedAt: null,
              finishedAt: null,
              engineLabel: null,
            },
            values: {
              engineLabel: 'engine-label-0001',
            },
          },
          expected: expect.objectContaining({
            id: 10230051,
            AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID — nothing was said about the status
            engineLabel: 'engine-label-0001',
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10230052,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230052',
              requestKey: 'request-key-10230052',
              requestBodyHash: 'request-body-hash-10230052',
              externalRef: 'external-ref-10230052',
              subjectLabel: 'Subject label of run 10230052',
              correlationId: 'correlation-id-10230052',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230052',
              acceptedAt: new Date('2026-09-27T14:14:01.001Z'),
              startedAt: new Date('2026-09-27T14:14:02.002Z'),
              finishedAt: null,
              engineLabel: null,
            },
            values: {
              engineLabel: 'engine-label-0002',
              resultBody: '{"fields":[]}',
            },
          },
          expected: expect.objectContaining({
            id: 10230052,
            AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — nothing was said about the status
            engineLabel: 'engine-label-0002',
            resultBody: '{"fields":[]}',
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          values: input.values,
        }

        const received = await recorder.saveOngoingAiRun(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The rule itself, at the one place it is enforced: succeeded, failed and canceled, one per
     * case, each refused by an exception naming the run and the status it had already settled in.
     */
    describe('when the run has already settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230053,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230053',
              requestKey: 'request-key-10230053',
              requestBodyHash: 'request-body-hash-10230053',
              externalRef: 'external-ref-10230053',
              subjectLabel: 'Subject label of run 10230053',
              correlationId: 'correlation-id-10230053',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230053',
              acceptedAt: new Date('2026-09-27T15:15:01.001Z'),
              startedAt: new Date('2026-09-27T15:15:02.002Z'),
              finishedAt: new Date('2026-09-27T15:15:03.003Z'),
            },
            values: {
              engineLabel: 'engine-label-0003',
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230053, AiRunStatusId 3',
        },
        {
          input: {
            aiRunRow: {
              id: 10230054,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10230054',
              requestKey: 'request-key-10230054',
              requestBodyHash: 'request-body-hash-10230054',
              externalRef: 'external-ref-10230054',
              subjectLabel: 'Subject label of run 10230054',
              correlationId: 'correlation-id-10230054',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230054',
              acceptedAt: new Date('2026-09-27T16:16:01.001Z'),
              startedAt: new Date('2026-09-27T16:16:02.002Z'),
              finishedAt: new Date('2026-09-27T16:16:03.003Z'),
            },
            values: {
              engineLabel: 'engine-label-0004',
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230054, AiRunStatusId 4',
        },
        {
          input: {
            aiRunRow: {
              id: 10230055,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230055',
              requestKey: 'request-key-10230055',
              requestBodyHash: 'request-body-hash-10230055',
              externalRef: 'external-ref-10230055',
              subjectLabel: 'Subject label of run 10230055',
              correlationId: 'correlation-id-10230055',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230055',
              acceptedAt: new Date('2026-09-27T17:17:01.001Z'),
              startedAt: new Date('2026-09-27T17:17:02.002Z'),
              finishedAt: new Date('2026-09-27T17:17:03.003Z'),
            },
            values: {
              engineLabel: 'engine-label-0005',
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run already settled, which a run never leaves: AiRunId 10230055, AiRunStatusId 5',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          values: input.values,
        }

        const received = () => recorder.saveOngoingAiRun(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * A run that is not there is refused as loudly as one that has settled, and by its own message.
     * Writing nothing and saying nothing would leave the caller believing a run it cannot see is
     * carrying the record it asked for.
     */
    describe('when no run carries the id', () => {
      const cases = [
        {
          // Reserved inside this feature's own id block as a run that is never created
          input: {
            aiRunId: 10239003,
            values: {
              engineLabel: 'engine-label-0006',
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run that does not exist: AiRunId 10239003',
        },
        {
          input: {
            aiRunId: 10239004,
            values: {
              engineLabel: 'engine-label-0007',
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a run that does not exist: AiRunId 10239004',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunStatusRecorder.create()

        const received = () => recorder.saveOngoingAiRun(input)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})
