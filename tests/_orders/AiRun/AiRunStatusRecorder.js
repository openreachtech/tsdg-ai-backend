import AI_RUN_FAILURE_REASON_CONSTANT_HASH from '../../../app/constants/aiRunFailureReasonConstants.js'

import AiRunStatusRecorder from '../../../app/aiRun/AiRunStatusRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'

const {
  AI_RUN_FAILURE_REASON_CODE,
} = AI_RUN_FAILURE_REASON_CONSTANT_HASH

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
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_FETCH_FAILED,
            failureParameters: {
              attemptCount: 3,
              lastStatusCode: 504,
            },
            finishedAt: new Date('2026-09-26T21:21:09.009Z'),
          },
          expected: expect.objectContaining({
            id: 10230021,
            AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_FETCH_FAILED,
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
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
            failureParameters: null, // the reason stands on its own, and nothing is invented for it
            finishedAt: new Date('2026-09-26T22:22:09.009Z'),
          },
          expected: expect.objectContaining({
            id: 10230022,
            AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
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
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_FETCH_FAILED,
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
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_UNREADABLE,
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
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_LIMIT_EXCEEDED,
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

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The bound on what a transition writes, at the one method that writes anything.
     *
     * Every run below is running — a status nothing refuses — so what turns each of these calls
     * away is the field it named and nothing else. A run's identity, the URL its result is
     * delivered to and the body it was accepted with are written once when the run is accepted, and
     * the purge marker belongs to the retention sweep. One call rewording any of them would send a
     * run's result to another host, or tell the sweep a run it never purged is already purged.
     */
    describe('when the call names a field no transition writes', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230061,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230061',
              requestKey: 'request-key-10230061',
              requestBodyHash: 'request-body-hash-10230061',
              externalRef: 'external-ref-10230061',
              subjectLabel: 'Subject label of run 10230061',
              correlationId: 'correlation-id-10230061',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230061',
              acceptedAt: new Date('2026-09-28T01:01:01.001Z'),
              startedAt: new Date('2026-09-28T01:01:02.002Z'),
              finishedAt: null,
            },
            values: {
              callbackUrl: 'https://another.client.development.invalid/collect',
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a field no transition of this class writes: AiRunId 10230061, field callbackUrl',
        },
        {
          input: {
            aiRunRow: {
              id: 10230062,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230062',
              requestKey: 'request-key-10230062',
              requestBodyHash: 'request-body-hash-10230062',
              externalRef: 'external-ref-10230062',
              subjectLabel: 'Subject label of run 10230062',
              correlationId: 'correlation-id-10230062',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230062',
              acceptedAt: new Date('2026-09-28T02:02:01.001Z'),
              startedAt: new Date('2026-09-28T02:02:02.002Z'),
              finishedAt: null,
            },
            values: {
              contentPurgedAt: new Date('2000-01-01T00:00:00.000Z'),
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a field no transition of this class writes: AiRunId 10230062, field contentPurgedAt',
        },
        {
          input: {
            aiRunRow: {
              id: 10230063,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230063',
              requestKey: 'request-key-10230063',
              requestBodyHash: 'request-body-hash-10230063',
              externalRef: 'external-ref-10230063',
              subjectLabel: 'Subject label of run 10230063',
              correlationId: 'correlation-id-10230063',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230063',
              acceptedAt: new Date('2026-09-28T03:03:01.001Z'),
              startedAt: new Date('2026-09-28T03:03:02.002Z'),
              finishedAt: null,
            },
            values: {
              requestBody: '{"asset":"a body the run was never accepted with"}',
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a field no transition of this class writes: AiRunId 10230063, field requestBody',
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
     * A terminal status handed in on its own, with none of the columns that status is evidenced by.
     *
     * This is what one method per destination status exists to prevent: a run reading succeeded
     * that says nothing about when it finished or what it settled, or failed with no reason anybody
     * can act on. Each run below is running, so the terminal guard has nothing to say — what
     * refuses the call is the evidence the call does not carry.
     */
    describe('when the status it moves to is not evidenced', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230064,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230064',
              requestKey: 'request-key-10230064',
              requestBodyHash: 'request-body-hash-10230064',
              externalRef: 'external-ref-10230064',
              subjectLabel: 'Subject label of run 10230064',
              correlationId: 'correlation-id-10230064',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230064',
              acceptedAt: new Date('2026-09-28T04:04:01.001Z'),
              startedAt: new Date('2026-09-28T04:04:02.002Z'),
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a status the call carries no evidence for: AiRunId 10230064, AiRunStatusId 3, field resultBody',
        },
        {
          input: {
            aiRunRow: {
              id: 10230065,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230065',
              requestKey: 'request-key-10230065',
              requestBodyHash: 'request-body-hash-10230065',
              externalRef: 'external-ref-10230065',
              subjectLabel: 'Subject label of run 10230065',
              correlationId: 'correlation-id-10230065',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230065',
              acceptedAt: new Date('2026-09-28T05:05:01.001Z'),
              startedAt: new Date('2026-09-28T05:05:02.002Z'),
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              finishedAt: new Date('2026-09-28T05:05:03.003Z'),
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a status the call carries no evidence for: AiRunId 10230065, AiRunStatusId 4, field failureReasonCode',
        },
        {
          input: {
            aiRunRow: {
              id: 10230066,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230066',
              requestKey: 'request-key-10230066',
              requestBodyHash: 'request-body-hash-10230066',
              externalRef: 'external-ref-10230066',
              subjectLabel: 'Subject label of run 10230066',
              correlationId: 'correlation-id-10230066',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230066',
              acceptedAt: new Date('2026-09-28T06:06:01.001Z'),
              startedAt: new Date('2026-09-28T06:06:02.002Z'),
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              finishedAt: new Date('2026-09-28T06:06:03.003Z'),
            },
          },
          expected: 'AiRunStatusRecorder#saveOngoingAiRun() refused a status the call carries no evidence for: AiRunId 10230066, AiRunStatusId 5, field canceledAt',
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

/*
 * The three describes below are `AiRun`'s, not this recorder's.
 *
 * They are here because they are the other half of the rule the recorder enforces, and because the
 * guard they exercise is reached by writing a row — so it belongs in this folder rather than in
 * `tests/__tests__/`, and this folder's run order is declared in a barrel every unit of the feature
 * shares. Moving them to a file of their own means editing that barrel, which is not one unit's to
 * edit while its siblings are running. They create their rows in this file's own id block, as
 * everything here does.
 */

describe('AiRun', () => {
  describe('.setupHooks()', () => {
    /*
     * The rule at the row: a run never leaves succeeded, failed or canceled, however it is written.
     *
     * The recorder refuses this already, and these runs are never touched by it — each is created
     * settled and then moved with Sequelize's own instance write, which is the line a later feature
     * would reach for without knowing this class exists. One of the three terminal statuses per
     * case, because a guard that only knew about succeeded would pass a test that only asked about
     * succeeded.
     */
    describe('when an instance is moved out of a status a run never leaves', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230071,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230071',
              requestKey: 'request-key-10230071',
              requestBodyHash: 'request-body-hash-10230071',
              externalRef: 'external-ref-10230071',
              subjectLabel: 'Subject label of run 10230071',
              correlationId: 'correlation-id-10230071',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230071',
              acceptedAt: new Date('2026-09-29T01:01:01.001Z'),
              startedAt: new Date('2026-09-29T01:01:02.002Z'),
              finishedAt: new Date('2026-09-29T01:01:03.003Z'),
            },
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            },
          },
          expected: 'AiRun refuses a move out of a status a run never leaves: AiRunId 10230071, AiRunStatusId 3 to 2',
        },
        {
          input: {
            aiRunRow: {
              id: 10230072,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10230072',
              requestKey: 'request-key-10230072',
              requestBodyHash: 'request-body-hash-10230072',
              externalRef: 'external-ref-10230072',
              subjectLabel: 'Subject label of run 10230072',
              correlationId: 'correlation-id-10230072',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230072',
              acceptedAt: new Date('2026-09-29T02:02:01.001Z'),
              startedAt: new Date('2026-09-29T02:02:02.002Z'),
              finishedAt: new Date('2026-09-29T02:02:03.003Z'),
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.OUTPUT_INVALID,
            },
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            },
          },
          expected: 'AiRun refuses a move out of a status a run never leaves: AiRunId 10230072, AiRunStatusId 4 to 3',
        },
        {
          input: {
            aiRunRow: {
              id: 10230073,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230073',
              requestKey: 'request-key-10230073',
              requestBodyHash: 'request-body-hash-10230073',
              externalRef: 'external-ref-10230073',
              subjectLabel: 'Subject label of run 10230073',
              correlationId: 'correlation-id-10230073',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230073',
              acceptedAt: new Date('2026-09-29T03:03:01.001Z'),
              startedAt: new Date('2026-09-29T03:03:02.002Z'),
              finishedAt: new Date('2026-09-29T03:03:03.003Z'),
              canceledAt: new Date('2026-09-29T03:03:03.003Z'),
            },
            values: {
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
            },
          },
          expected: 'AiRun refuses a move out of a status a run never leaves: AiRunId 10230073, AiRunStatusId 5 to 1',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        const aiRun = await AiRun.create(input.aiRunRow)

        const received = () => aiRun.update(input.values)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRun', () => {
  describe('.setupHooks()', () => {
    /*
     * The same rule where no row has been read yet.
     *
     * `Model.update()` reaches `beforeBulkUpdate` and no per-row hook, so at that point nothing
     * knows which statuses the matched rows carry. A bulk write that names the status is therefore
     * refused by name rather than judged, and the one line that would otherwise undo the whole rule
     * — an update naming the status column and a `where` — cannot be written by accident. The three
     * runs below are each settled, which is the move the refusal is here for.
     */
    describe('when a static update writes the run status', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230074,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230074',
              requestKey: 'request-key-10230074',
              requestBodyHash: 'request-body-hash-10230074',
              externalRef: 'external-ref-10230074',
              subjectLabel: 'Subject label of run 10230074',
              correlationId: 'correlation-id-10230074',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230074',
              acceptedAt: new Date('2026-09-29T04:04:01.001Z'),
              startedAt: new Date('2026-09-29T04:04:02.002Z'),
              finishedAt: new Date('2026-09-29T04:04:03.003Z'),
            },
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            },
          },
          expected: 'AiRun.update() is refused when it writes AiRunStatusId. Load the run and move it through AiRunStatusRecorder.',
        },
        {
          input: {
            aiRunRow: {
              id: 10230075,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10230075',
              requestKey: 'request-key-10230075',
              requestBodyHash: 'request-body-hash-10230075',
              externalRef: 'external-ref-10230075',
              subjectLabel: 'Subject label of run 10230075',
              correlationId: 'correlation-id-10230075',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230075',
              acceptedAt: new Date('2026-09-29T05:05:01.001Z'),
              startedAt: new Date('2026-09-29T05:05:02.002Z'),
              finishedAt: new Date('2026-09-29T05:05:03.003Z'),
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_UNSUPPORTED,
            },
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: '{"fields":[{"path":"a result the run never settled"}]}',
            },
          },
          expected: 'AiRun.update() is refused when it writes AiRunStatusId. Load the run and move it through AiRunStatusRecorder.',
        },
        {
          input: {
            aiRunRow: {
              id: 10230076,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230076',
              requestKey: 'request-key-10230076',
              requestBodyHash: 'request-body-hash-10230076',
              externalRef: 'external-ref-10230076',
              subjectLabel: 'Subject label of run 10230076',
              correlationId: 'correlation-id-10230076',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230076',
              acceptedAt: new Date('2026-09-29T06:06:01.001Z'),
              startedAt: new Date('2026-09-29T06:06:02.002Z'),
              finishedAt: new Date('2026-09-29T06:06:03.003Z'),
              canceledAt: new Date('2026-09-29T06:06:03.003Z'),
            },
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            },
          },
          expected: 'AiRun.update() is refused when it writes AiRunStatusId. Load the run and move it through AiRunStatusRecorder.',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const received = () => AiRun.update(
          input.values,
          {
            where: {
              id: input.aiRunRow.id,
            },
          }
        )

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRun', () => {
  describe('.setupHooks()', () => {
    /*
     * What the guard must not refuse, which is the half a guard written too wide would break.
     *
     * A settled run is still written to for reasons that are not transitions: the retention sweep
     * removes the content and stamps the instant it did, thirty days after a run finished — and by
     * then every run it touches is terminal by definition. A guard that refused every write against
     * a settled run at the row would turn the retention promise into an error, so it refuses a
     * status move and nothing else. Both cases write a settled run without naming a status.
     */
    describe('when a write against a settled run names no status', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230077,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10230077',
              requestKey: 'request-key-10230077',
              requestBodyHash: 'request-body-hash-10230077',
              externalRef: 'external-ref-10230077',
              subjectLabel: 'Subject label of run 10230077',
              correlationId: 'correlation-id-10230077',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230077',
              acceptedAt: new Date('2026-09-29T07:07:01.001Z'),
              startedAt: new Date('2026-09-29T07:07:02.002Z'),
              finishedAt: new Date('2026-09-29T07:07:03.003Z'),
              requestBody: '{"asset":"the body run 10230077 was accepted with"}',
              resultBody: '{"fields":[{"path":"the result run 10230077 settled"}]}',
            },
            values: {
              requestBody: null,
              resultBody: null,
              contentPurgedAt: new Date('2026-10-29T07:07:07.007Z'),
            },
          },
          expected: expect.objectContaining({
            id: 10230077,
            AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID — where it settled, and where it stays
            requestBody: null,
            resultBody: null,
            contentPurgedAt: new Date('2026-10-29T07:07:07.007Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10230078,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10230078',
              requestKey: 'request-key-10230078',
              requestBodyHash: 'request-body-hash-10230078',
              externalRef: 'external-ref-10230078',
              subjectLabel: 'Subject label of run 10230078',
              correlationId: 'correlation-id-10230078',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230078',
              acceptedAt: new Date('2026-09-29T08:08:01.001Z'),
              startedAt: new Date('2026-09-29T08:08:02.002Z'),
              finishedAt: new Date('2026-09-29T08:08:03.003Z'),
              canceledAt: new Date('2026-09-29T08:08:03.003Z'),
              requestBody: '{"asset":"the body run 10230078 was accepted with"}',
            },
            values: {
              requestBody: null,
              contentPurgedAt: new Date('2026-10-29T08:08:08.008Z'),
            },
          },
          expected: expect.objectContaining({
            id: 10230078,
            AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID — where it settled, and where it stays
            requestBody: null,
            contentPurgedAt: new Date('2026-10-29T08:08:08.008Z'),
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        const aiRun = await AiRun.create(input.aiRunRow)

        const received = await aiRun.update(input.values)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The two ways checkpoint 8's re-audit reached past the guards that had just been put in for it.
     *
     * The allow-list was read with `Object.keys`, which sees a caller's own fields, while Sequelize's
     * own setter walks the prototype chain — so a `values` whose prototype carried `callbackUrl`
     * passed the list and reached the column, and the audit redirected a run's result to another
     * host through this very method after the list was already in place. The guard and the write
     * disagreed about what a field is. Both ends are now closed: a `values` carrying anything it did
     * not state as its own is refused outright, and what is written is built from the allow-list
     * rather than being the object the caller handed over.
     *
     * The evidence map asked only whether a key was named. So a failed run reached the row with no
     * reason code — the very state the seeded record had been corrected for one commit earlier — and
     * a succeeded run reached it with no `finishedAt`, which makes the gap the fifth criterion
     * promises unmeasurable. Being named is evidence only for the two fields whose emptiness is
     * itself a statement, and the case below proves that exception still stands.
     */
    describe('should refuse a call that reaches past what this class states it writes', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230081,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230081',
              requestKey: 'request-key-10230081',
              requestBodyHash: 'request-body-hash-10230081',
              externalRef: 'external-ref-10230081',
              subjectLabel: 'Subject label of run 10230081',
              correlationId: 'correlation-id-10230081',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230081',
              acceptedAt: new Date('2026-09-26T02:02:02.002Z'),
              startedAt: new Date('2026-09-26T02:02:03.003Z'),
              finishedAt: null,
            },
            buildValues: () => {
              const values = Object.create({
                callbackUrl: 'https://probe.invalid/collect',
              })

              values.engineLabel = 'probe-engine'

              return values
            },
          },
          expected: 'refused values carrying fields it did not state as its own',
          label: 'a field carried on the prototype rather than stated',
        },
        {
          input: {
            aiRunRow: {
              id: 10230082,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230082',
              requestKey: 'request-key-10230082',
              requestBodyHash: 'request-body-hash-10230082',
              externalRef: 'external-ref-10230082',
              subjectLabel: 'Subject label of run 10230082',
              correlationId: 'correlation-id-10230082',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230082',
              acceptedAt: new Date('2026-09-26T02:02:02.002Z'),
              startedAt: new Date('2026-09-26T02:02:03.003Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              failureReasonCode: null,
              failureParameters: null,
              finishedAt: new Date('2026-09-26T02:02:09.009Z'),
            }),
          },
          expected: 'refused a status whose evidence field carries nothing',
          label: 'a failed run whose reason code is null',
        },
        {
          input: {
            aiRunRow: {
              id: 10230083,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230083',
              requestKey: 'request-key-10230083',
              requestBodyHash: 'request-body-hash-10230083',
              externalRef: 'external-ref-10230083',
              subjectLabel: 'Subject label of run 10230083',
              correlationId: 'correlation-id-10230083',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230083',
              acceptedAt: new Date('2026-09-26T02:02:02.002Z'),
              startedAt: new Date('2026-09-26T02:02:03.003Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              failureReasonCode: '   ',
              failureParameters: null,
              finishedAt: new Date('2026-09-26T02:02:10.010Z'),
            }),
          },
          expected: 'refused a status whose evidence field carries nothing',
          label: 'a failed run whose reason code is blank',
        },
        {
          input: {
            aiRunRow: {
              id: 10230084,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230084',
              requestKey: 'request-key-10230084',
              requestBodyHash: 'request-body-hash-10230084',
              externalRef: 'external-ref-10230084',
              subjectLabel: 'Subject label of run 10230084',
              correlationId: 'correlation-id-10230084',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230084',
              acceptedAt: new Date('2026-09-26T02:02:02.002Z'),
              startedAt: new Date('2026-09-26T02:02:03.003Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: '{"fields":[]}',
              finishedAt: null,
            }),
          },
          expected: 'refused a status whose evidence field carries nothing',
          label: 'a succeeded run with no instant it finished at',
        },
        {
          input: {
            aiRunRow: {
              id: 10230085,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230085',
              requestKey: 'request-key-10230085',
              requestBodyHash: 'request-body-hash-10230085',
              externalRef: 'external-ref-10230085',
              subjectLabel: 'Subject label of run 10230085',
              correlationId: 'correlation-id-10230085',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230085',
              acceptedAt: new Date('2026-09-26T02:02:02.002Z'),
              startedAt: new Date('2026-09-26T02:02:03.003Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 99,
            }),
          },
          expected: 'refused a status naming no master row',
          label: 'a status no master row carries',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const received = () => recorder.saveOngoingAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          values: input.buildValues(),
        })

        await expect(received) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The exception the evidence rule is built around, and the reason it is a rule rather than a
     * blanket check.
     *
     * Section 10's second criterion says a run whose result is legitimately empty is recorded as
     * succeeded, not as failed. So a caller stating `resultBody: null` is recording a run that
     * settled nothing, and turning that away would make the criterion unreachable — which is why
     * `resultBody` and `failureParameters` are evidence by being stated, whatever they hold, and
     * every other evidence field is evidence by carrying something.
     *
     * If this case ever goes red alongside the refusals above, the rule has been widened into a
     * blanket check and the criterion has been broken.
     */
    describe('should record a run that settled nothing as succeeded', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230086,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230086',
              requestKey: 'request-key-10230086',
              requestBodyHash: 'request-body-hash-10230086',
              externalRef: 'external-ref-10230086',
              subjectLabel: 'Subject label of run 10230086',
              correlationId: 'correlation-id-10230086',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230086',
              acceptedAt: new Date('2026-09-26T02:02:02.002Z'),
              startedAt: new Date('2026-09-26T02:02:03.003Z'),
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: null,
              finishedAt: new Date('2026-09-26T02:02:12.012Z'),
            },
          },
          expected: 3, // AI_RUN_STATUS.SUCCEEDED.ID
          label: 'a result body of null, which is a success and not a failure',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        await recorder.saveOngoingAiRun({
          aiRunId: input.aiRunRow.id,
          values: input.values,
        })

        const received = await AiRun.findOne({ // Act
          where: {
            id: input.aiRunRow.id,
          },
        })

        expect(received.AiRunStatusId) // Assert
          .toBe(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The door the third audit round found still open after the second had closed the one beside it.
     *
     * The evidence rule refuses a missing instant, and that is what the round before this one put
     * in. What it could not see is a value that is present and is not a time: Sequelize coerces
     * whatever it is handed into `datetime(3)`, so every case below settled a run permanently with
     * the literal text `Invalid date` in `finished_at` or `canceled_at`. That is worse than the
     * null it replaced in the one way that decides it — a sweep for the absence finds nothing, no
     * parser resolves the text, and the status reached is terminal, so `#saveOngoingAiRun()` itself
     * refuses every later write that might have corrected it. `canceled_at` is half of the very
     * pair the fifth criterion measures a gap across.
     */
    describe('should refuse an instant field carrying something that is not an instant', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230091,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230091',
              requestKey: 'request-key-10230091',
              requestBodyHash: 'request-body-hash-10230091',
              externalRef: 'external-ref-10230091',
              subjectLabel: 'Subject label of run 10230091',
              correlationId: 'correlation-id-10230091',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230091',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: null,
              finishedAt: 'whenever',
            }),
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a succeeded run finished at a word that is not a time',
        },
        {
          input: {
            aiRunRow: {
              id: 10230092,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230092',
              requestKey: 'request-key-10230092',
              requestBodyHash: 'request-body-hash-10230092',
              externalRef: 'external-ref-10230092',
              subjectLabel: 'Subject label of run 10230092',
              correlationId: 'correlation-id-10230092',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230092',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              canceledAt: 'whenever',
              finishedAt: new Date('2026-09-26T03:03:09.009Z'),
            }),
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a canceled run canceled at a word that is not a time',
        },
        {
          input: {
            aiRunRow: {
              id: 10230093,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230093',
              requestKey: 'request-key-10230093',
              requestBodyHash: 'request-body-hash-10230093',
              externalRef: 'external-ref-10230093',
              subjectLabel: 'Subject label of run 10230093',
              correlationId: 'correlation-id-10230093',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230093',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: null,
              finishedAt: 0,
            }),
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a succeeded run finished at the epoch written as a number',
        },
        {
          input: {
            aiRunRow: {
              id: 10230094,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230094',
              requestKey: 'request-key-10230094',
              requestBodyHash: 'request-body-hash-10230094',
              externalRef: 'external-ref-10230094',
              subjectLabel: 'Subject label of run 10230094',
              correlationId: 'correlation-id-10230094',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230094',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: null,
              finishedAt: {},
            }),
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a succeeded run finished at an empty object',
        },
        {
          input: {
            aiRunRow: {
              id: 10230095,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230095',
              requestKey: 'request-key-10230095',
              requestBodyHash: 'request-body-hash-10230095',
              externalRef: 'external-ref-10230095',
              subjectLabel: 'Subject label of run 10230095',
              correlationId: 'correlation-id-10230095',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230095',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            buildValues: () => ({
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              startedAt: new Date('whenever'),
            }),
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a running run started at a Date that names no time',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const actual = () => recorder.saveOngoingAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          values: input.buildValues(),
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The other half of the rule above, and the reason it reads only what is present.
     *
     * A null instant is an absence, and absence is the evidence rule's question — it answers it per
     * status, refusing a missing `finished_at` on a run that just succeeded and allowing one on a
     * run that is only starting. `cancel_requested_at` is evidence of no status at all, so a
     * cancellation that was never asked for states it as null and must still record.
     *
     * If this case ever goes red beside the refusals above, the new rule has swallowed the old one.
     */
    describe('should record an instant stated as null', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230096,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230096',
              requestKey: 'request-key-10230096',
              requestBodyHash: 'request-body-hash-10230096',
              externalRef: 'external-ref-10230096',
              subjectLabel: 'Subject label of run 10230096',
              correlationId: 'correlation-id-10230096',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230096',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              canceledAt: new Date('2026-09-26T03:03:11.011Z'),
              finishedAt: new Date('2026-09-26T03:03:12.012Z'),
              cancelRequestedAt: null,
            },
          },
          expected: 5, // AI_RUN_STATUS.CANCELED.ID
          label: 'a cancellation whose request instant is stated as null, which is an absence and not a wrong time',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        await recorder.saveOngoingAiRun({
          aiRunId: input.aiRunRow.id,
          values: input.values,
        })

        const received = await AiRun.findOne({ // Act
          where: {
            id: input.aiRunRow.id,
          },
        })

        expect(received.AiRunStatusId) // Assert
          .toBe(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * A refusal has to name itself, which is this class's own doctrine and the only thing a caller's
     * log has to go on.
     *
     * Before this, a `values` of null nor a `values` that was not an object at all reached the
     * prototype read and faulted there with a bare `TypeError` naming neither the refusal nor the
     * run. Nothing was written either way, so the harm was never a wrong row — it was a caller that
     * could not tell which of this method's six refusals had happened, in the one case where the
     * answer is that the call was malformed before any of them was reached.
     */
    describe('should refuse values it cannot answer for, by name', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230097,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230097',
              requestKey: 'request-key-10230097',
              requestBodyHash: 'request-body-hash-10230097',
              externalRef: 'external-ref-10230097',
              subjectLabel: 'Subject label of run 10230097',
              correlationId: 'correlation-id-10230097',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230097',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            values: null,
          },
          expected: 'refused values that are not a plain object',
          label: 'values of null',
        },
        {
          input: {
            aiRunRow: {
              id: 10230098,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230098',
              requestKey: 'request-key-10230098',
              requestBodyHash: 'request-body-hash-10230098',
              externalRef: 'external-ref-10230098',
              subjectLabel: 'Subject label of run 10230098',
              correlationId: 'correlation-id-10230098',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230098',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            values: 'AiRunStatusId=3',
          },
          expected: 'refused values that are not a plain object',
          label: 'values written as a string',
        },
        {
          input: {
            aiRunRow: {
              id: 10230099,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230099',
              requestKey: 'request-key-10230099',
              requestBodyHash: 'request-body-hash-10230099',
              externalRef: 'external-ref-10230099',
              subjectLabel: 'Subject label of run 10230099',
              correlationId: 'correlation-id-10230099',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230099',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            values: 42,
          },
          expected: 'refused values that are not a plain object',
          label: 'values written as a number',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const actual = () => recorder.saveOngoingAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          values: input.values,
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The case the prototype read cannot be reached with, which is why the kind is asked first.
     *
     * A string and a number are turned away by the prototype read on their own — `String.prototype`
     * is not `Object.prototype`. Values that were never stated are not: `Object.getPrototypeOf()`
     * faults on them, so without the two kind checks in front, a call that simply forgot its second
     * argument would report a `TypeError` naming neither the refusal nor the run.
     */
    describe('should refuse a call that states no values at all', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230100,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230100',
              requestKey: 'request-key-10230100',
              requestBodyHash: 'request-body-hash-10230100',
              externalRef: 'external-ref-10230100',
              subjectLabel: 'Subject label of run 10230100',
              correlationId: 'correlation-id-10230100',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230100',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
          },
          expected: 'refused values that are not a plain object',
          label: 'the values argument omitted altogether',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const actual = () => recorder.saveOngoingAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          // values: not stated, which is the whole of this case
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The one shape that cannot carry the hazard the refusal beside it describes.
     *
     * An object created with no prototype has no chain at all, so every field it carries is its own
     * - which is precisely the property the allow-list needs, and the one thing a walked prototype
     * chain cannot subvert. For one commit it was refused under a message saying it carried fields
     * it had not stated as its own, which is the opposite of what is true of it.
     */
    describe('should record values on an object with no prototype', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230101,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230101',
              requestKey: 'request-key-10230101',
              requestBodyHash: 'request-body-hash-10230101',
              externalRef: 'external-ref-10230101',
              subjectLabel: 'Subject label of run 10230101',
              correlationId: 'correlation-id-10230101',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230101',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
          },
          expected: 3, // AI_RUN_STATUS.SUCCEEDED.ID
          label: 'a succeeded run stated on a null-prototype object',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const values = Object.create(null)

        values.AiRunStatusId = 3 // AI_RUN_STATUS.SUCCEEDED.ID
        values.resultBody = null
        values.finishedAt = new Date('2026-09-26T03:03:20.020Z')

        await recorder.saveOngoingAiRun({
          aiRunId: input.aiRunRow.id,
          values,
        })

        const received = await AiRun.findOne({ // Act
          where: {
            id: input.aiRunRow.id,
          },
        })

        expect(received.AiRunStatusId) // Assert
          .toBe(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The one refusal in this class that still reproduced what the caller handed it.
     *
     * `AiRunStatusId` is not an identity that locates a row - it is the value being judged, and on
     * this branch it has just been judged to name no status at all. The two sibling messages
     * interpolate the same field safely, because by the time they run it is one of five known ids.
     *
     * The value below is invented for the probe and names nobody. The assertion anchors the end of
     * the message: a substring match would pass just as well if the text came back.
     */
    describe('should name the field when the status names no master row', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230102,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230102',
              requestKey: 'request-key-10230102',
              requestBodyHash: 'request-body-hash-10230102',
              externalRef: 'external-ref-10230102',
              subjectLabel: 'Subject label of run 10230102',
              correlationId: 'correlation-id-10230102',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230102',
              acceptedAt: new Date('2026-09-26T03:03:01.001Z'),
              startedAt: new Date('2026-09-26T03:03:02.002Z'),
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 'read from the medium: the owner is a sample person, 090-0000-0000',
            },
          },
          expected: /refused a status naming no master row: AiRunId \d+, field AiRunStatusId$/u,
          label: 'a status carrying what was read out of the medium',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const actual = () => recorder.saveOngoingAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          values: input.values,
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})
