import {
  Op,
} from 'sequelize'

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
 *
 * `#run-execution` writes into this file as well, each of its units in a block of its own:
 * `10300001` upward for the conditional write, and `10320001` upward for the second spelling of a
 * transition and for the model guard that write now goes through. `10329001` upward is that last
 * block's never-created range, as `10239001` is `#run-record`'s.
 *
 * `10330001` upward belongs to the same feature's audit round: the conditions in
 * `tests/__tests__/sequelize/models/AiRun.js` that state an exclusion beside a second key on the
 * same column. Every id in that block names a run nothing creates — the guard under test reads the
 * condition and never the table — so the block is listed here to keep it spoken for, not because a
 * row of it exists.
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
     * refused unless its own `where` proves the rule cannot be broken — and the three below prove
     * nothing: each locates its run by id alone, which matches a settled run as readily as any
     * other. So the one line that would otherwise undo the whole rule cannot be written by
     * accident. The three runs are each settled, which is the move the refusal is here for.
     *
     * What the `where` has to say to be accepted is asked separately, of the guard itself, in
     * `tests/__tests__/sequelize/models/AiRun.js` — and of the one write in this application that
     * says it, under `#saveUnsettledAiRunValues()` below.
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
          expected: 'AiRun.update() writing AiRunStatusId is refused unless its where excludes every terminal status. Move the run through AiRunStatusRecorder.',
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
          expected: 'AiRun.update() writing AiRunStatusId is refused unless its where excludes every terminal status. Move the run through AiRunStatusRecorder.',
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
          expected: 'AiRun.update() writing AiRunStatusId is refused unless its where excludes every terminal status. Move the run through AiRunStatusRecorder.',
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

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * The rule this class states about its messages, finally asked of its own run id.
     *
     * Round six raised it for `AiRunStatusId` here and it was fixed here; round seven found that the
     * principle had been carried to the recorder next door and had stopped at the file boundary.
     * `aiRunId` was interpolated raw into eight messages of this class, with no shape check
     * anywhere in it - and one of those messages throws before the database is read at all, so it
     * needed nothing but a wrong call to reach a log.
     *
     * The values below are invented for the probe and name nobody. The assertions anchor the end of
     * the message, because a substring match would pass just as well if the text came back.
     */
    describe('should refuse a run id that is no id, naming the parameter only', () => {
      const cases = [
        {
          input: {
            aiRunId: 'read from the medium: the owner is a sample person, 090-0000-0000',
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              startedAt: new Date('2026-09-26T04:04:01.001Z'),
            },
          },
          expected: /refused a key that is not an id: field aiRunId$/u,
          label: 'a run id carrying what was read out of the medium',
        },
        {
          input: {
            aiRunId: 0,
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              startedAt: new Date('2026-09-26T04:04:02.002Z'),
            },
          },
          expected: /refused a key that is not an id: field aiRunId$/u,
          label: 'a run id of zero, which no row carries',
        },
        {
          input: {
            aiRunId: '8190123456789819012345678981901234567898190123456789',
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              startedAt: new Date('2026-09-26T04:04:03.003Z'),
            },
          },
          expected: /refused a key that is not an id: field aiRunId$/u,
          label: 'a run id longer than any key, which no length bound used to stop',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunStatusRecorder.create() // Arrange

        const actual = () => recorder.saveOngoingAiRun({ // Act
          aiRunId: input.aiRunId,
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
  describe('#saveFailedAiRun()', () => {
    /*
     * The one public method that throws before the database is read, so its message needed nothing
     * but a wrong call to reach a log.
     */
    describe('should refuse a run id that is no id before anything else', () => {
      const cases = [
        {
          input: {
            aiRunId: 'read from the medium: 12 Sample Street',
          },
          expected: /refused a key that is not an id: field aiRunId$/u,
          label: 'a run id carrying what was read out of the medium',
        },
        {
          input: {
            aiRunId: -1,
          },
          expected: /refused a key that is not an id: field aiRunId$/u,
          label: 'a run id below one',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunStatusRecorder.create() // Arrange

        const actual = () => recorder.saveFailedAiRun({ // Act
          aiRunId: input.aiRunId,
          failureReasonCode: null,
          failureParameters: null,
          finishedAt: new Date('2026-09-26T04:04:04.004Z'),
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
     * A refused field is named when its name is a name, and located when it is not.
     *
     * The keys of `values` are the one text in this class the caller chose, so reporting them
     * unconditionally is the same channel every other message here has just been closed against.
     * Reporting none of them would cost the operator the thing that makes the refusal actionable,
     * so a name shaped like a field is repeated and anything else is reported by where it sat.
     */
    describe('should locate a refused field whose name is no name', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10230103,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230103',
              requestKey: 'request-key-10230103',
              requestBodyHash: 'request-body-hash-10230103',
              externalRef: 'external-ref-10230103',
              subjectLabel: 'Subject label of run 10230103',
              correlationId: 'correlation-id-10230103',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230103',
              acceptedAt: new Date('2026-09-26T04:04:05.005Z'),
              startedAt: new Date('2026-09-26T04:04:06.006Z'),
              finishedAt: null,
            },
            refusedFieldName: 'read from the medium: the owner is a sample person',
          },
          expected: /refused a field no transition of this class writes: AiRunId \d+, field the field at position 1$/u,
          label: 'a field name carrying what was read out of the medium',
        },
        {
          input: {
            aiRunRow: {
              id: 10230104,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10230104',
              requestKey: 'request-key-10230104',
              requestBodyHash: 'request-body-hash-10230104',
              externalRef: 'external-ref-10230104',
              subjectLabel: 'Subject label of run 10230104',
              correlationId: 'correlation-id-10230104',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10230104',
              acceptedAt: new Date('2026-09-26T04:04:07.007Z'),
              startedAt: new Date('2026-09-26T04:04:08.008Z'),
              finishedAt: null,
            },
            refusedFieldName: 'contentPurgedAt',
          },
          expected: /refused a field no transition of this class writes: AiRunId \d+, field contentPurgedAt$/u,
          label: 'a field name that is a name, which is repeated so the operator can act on it',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const values = {
          [input.refusedFieldName]: 'probe',
        }

        const actual = () => recorder.saveOngoingAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          values,
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

/*
 * Everything below is `#run-execution`'s, and its runs are created in that feature's own id block
 * (`10300001` upward). Nothing here reads or moves a `1023xxxx` row, so the describes above go on
 * standing on exactly what they created.
 *
 * What these ask is the half of the rule the describes above cannot reach. Up there, a run that had
 * settled is refused because the guard read it and saw so. Here the run settles *between* the read
 * and the write, which is the instant a guard reading a row beforehand can never see — and the
 * instant this feature made real, because the queue delivers at-least-once and a worker whose job
 * stalls has it re-queued while the first worker is still finishing.
 *
 * The stale read is put there with a spy, which is the one thing a test can do that two workers do
 * by accident. Nothing else is stubbed: the row is real, settled by a first writer before the call,
 * and the condition in the `WHERE` is what turns the second writer away.
 */

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRun()', () => {
    /*
     * The second writer is refused, and the refusal names the instant it happened in rather than
     * the one the guard above reports. The guard passed here — it was handed a run still running —
     * so a pass of this case is the condition in the `WHERE` doing the work and nothing else.
     */
    describe('when another writer settled the run between the read and the write', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10300011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID — the first writer already settled it
              runKey: 'run-key-10300011',
              requestKey: 'request-key-10300011',
              requestBodyHash: 'request-body-hash-10300011',
              externalRef: 'external-ref-10300011',
              subjectLabel: 'Subject label of run 10300011',
              correlationId: 'correlation-id-10300011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300011',
              acceptedAt: new Date('2026-10-01T01:01:01.001Z'),
              startedAt: new Date('2026-10-01T01:01:02.002Z'),
              finishedAt: new Date('2026-10-01T01:01:03.003Z'),
            },
            staleAiRun: {
              id: 10300011,
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — the run as the guard read it
            },
            resultBody: '{"fields":[{"fieldPath":"subject.epsilon"}]}',
            finishedAt: new Date('2026-10-01T01:01:11.011Z'),
          },
          expected: /#saveAiRunTransition\(\) refused a run that had settled or gone by the time the write reached it: AiRunId 10300011$/u,
          label: 'a run the first writer had recorded as succeeded',
        },
        {
          input: {
            aiRunRow: {
              id: 10300012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID — a cancellation took effect first
              runKey: 'run-key-10300012',
              requestKey: 'request-key-10300012',
              requestBodyHash: 'request-body-hash-10300012',
              externalRef: 'external-ref-10300012',
              subjectLabel: 'Subject label of run 10300012',
              correlationId: 'correlation-id-10300012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300012',
              acceptedAt: new Date('2026-10-01T02:02:01.001Z'),
              startedAt: new Date('2026-10-01T02:02:02.002Z'),
              finishedAt: new Date('2026-10-01T02:02:03.003Z'),
              canceledAt: new Date('2026-10-01T02:02:03.003Z'),
            },
            staleAiRun: {
              id: 10300012,
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — the run as the guard read it
            },
            resultBody: '{"fields":[{"fieldPath":"subject.zeta"}]}',
            finishedAt: new Date('2026-10-01T02:02:22.022Z'),
          },
          expected: /#saveAiRunTransition\(\) refused a run that had settled or gone by the time the write reached it: AiRunId 10300012$/u,
          label: 'a run a cancellation had taken effect on first',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        jest.spyOn(recorder, 'findAiRun')
          .mockResolvedValue(input.staleAiRun)

        const actual = () => recorder.saveSucceededAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          resultBody: input.resultBody,
          finishedAt: input.finishedAt,
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRun()', () => {
    /*
     * A refusal that had already written half of what it was handed would be worse than no guard at
     * all: the run would read as succeeded with the second writer's instant against the first
     * writer's status. So the row is read back and asserted whole — the status, the reason and the
     * instant are all the first writer's, and the second writer's values appear nowhere.
     *
     * The losing call sits in the Arrange phase because it is what sets the row up for the one
     * question this case asks, which is what the row says afterwards.
     */
    describe('should leave the row as the writer that settled it first left it', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10300013,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID — the first writer recorded a failure
              runKey: 'run-key-10300013',
              requestKey: 'request-key-10300013',
              requestBodyHash: 'request-body-hash-10300013',
              externalRef: 'external-ref-10300013',
              subjectLabel: 'Subject label of run 10300013',
              correlationId: 'correlation-id-10300013',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300013',
              acceptedAt: new Date('2026-10-01T03:03:01.001Z'),
              startedAt: new Date('2026-10-01T03:03:02.002Z'),
              finishedAt: new Date('2026-10-01T03:03:03.003Z'),
              resultBody: null,
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.PROVIDER_CALL_FAILED,
            },
            staleAiRun: {
              id: 10300013,
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — the run as the guard read it
            },
            resultBody: '{"fields":[{"fieldPath":"subject.eta"}]}',
            finishedAt: new Date('2026-10-01T03:03:33.033Z'),
          },
          expected: expect.objectContaining({
            id: 10300013,
            AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID — still the first writer's
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.PROVIDER_CALL_FAILED,
            resultBody: null,
            finishedAt: new Date('2026-10-01T03:03:03.003Z'),
          }),
          label: 'a failure the first writer recorded, against a success the second one tried to',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        jest.spyOn(recorder, 'findAiRun')
          .mockResolvedValue(input.staleAiRun)

        const losingWrite = () => recorder.saveSucceededAiRun({
          aiRunId: input.aiRunRow.id,
          resultBody: input.resultBody,
          finishedAt: input.finishedAt,
        })

        await expect(losingWrite)
          .rejects
          .toThrow('refused a run that had settled or gone by the time the write reached it')

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

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRun()', () => {
    /*
     * The other side of the same write: the writer that gets there first moves the run.
     *
     * Nothing is stubbed here, so the guard and the condition both run against the real row — which
     * is what says the condition turns away a settled run without also turning away the ordinary
     * one. Queued and running are both covered, because a run is settled from either.
     */
    describe('should move the run when it is the first write to reach it', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10300021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10300021',
              requestKey: 'request-key-10300021',
              requestBodyHash: 'request-body-hash-10300021',
              externalRef: 'external-ref-10300021',
              subjectLabel: 'Subject label of run 10300021',
              correlationId: 'correlation-id-10300021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300021',
              acceptedAt: new Date('2026-10-01T04:04:01.001Z'),
              startedAt: new Date('2026-10-01T04:04:02.002Z'),
              finishedAt: null,
              resultBody: null,
            },
            resultBody: '{"fields":[{"fieldPath":"subject.theta"}]}',
            finishedAt: new Date('2026-10-01T04:04:44.044Z'),
          },
          expected: expect.objectContaining({
            id: 10300021,
            AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            resultBody: '{"fields":[{"fieldPath":"subject.theta"}]}',
            finishedAt: new Date('2026-10-01T04:04:44.044Z'),
          }),
          label: 'a run the worker was still running',
        },
        {
          input: {
            aiRunRow: {
              id: 10300022,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10300022',
              requestKey: 'request-key-10300022',
              requestBodyHash: 'request-body-hash-10300022',
              externalRef: 'external-ref-10300022',
              subjectLabel: 'Subject label of run 10300022',
              correlationId: 'correlation-id-10300022',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300022',
              acceptedAt: new Date('2026-10-01T05:05:01.001Z'),
              startedAt: null,
              finishedAt: null,
              resultBody: null,
            },
            resultBody: '{"fields":[]}',
            finishedAt: new Date('2026-10-01T05:05:55.055Z'),
          },
          expected: expect.objectContaining({
            id: 10300022,
            AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            resultBody: '{"fields":[]}',
            finishedAt: new Date('2026-10-01T05:05:55.055Z'),
          }),
          label: 'a run still waiting in the queue',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const received = await recorder.saveSucceededAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          resultBody: input.resultBody,
          finishedAt: input.finishedAt,
        })

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRun()', () => {
    /*
     * A run that had already settled before the call is still refused by the guard, by name.
     *
     * This is the case the condition in the `WHERE` could have swallowed. A run settled before the
     * call matches that condition no more than one settled during it, so a class that had dropped
     * the guard would still refuse these three — and would answer every one of them with a message
     * naming neither the rule nor the status the run had settled in. Asking for the older message
     * by name, anchored, is what keeps the two answers apart.
     */
    describe('should still name the refusal where the run had settled before the call', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10300031,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10300031',
              requestKey: 'request-key-10300031',
              requestBodyHash: 'request-body-hash-10300031',
              externalRef: 'external-ref-10300031',
              subjectLabel: 'Subject label of run 10300031',
              correlationId: 'correlation-id-10300031',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300031',
              acceptedAt: new Date('2026-10-01T06:06:01.001Z'),
              startedAt: new Date('2026-10-01T06:06:02.002Z'),
              finishedAt: new Date('2026-10-01T06:06:03.003Z'),
            },
            resultBody: '{"fields":[{"fieldPath":"subject.iota"}]}',
            finishedAt: new Date('2026-10-01T06:06:36.036Z'),
          },
          expected: /#saveOngoingAiRun\(\) refused a run already settled, which a run never leaves: AiRunId 10300031, AiRunStatusId 3$/u,
          label: 'a run that had succeeded before the call',
        },
        {
          input: {
            aiRunRow: {
              id: 10300032,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10300032',
              requestKey: 'request-key-10300032',
              requestBodyHash: 'request-body-hash-10300032',
              externalRef: 'external-ref-10300032',
              subjectLabel: 'Subject label of run 10300032',
              correlationId: 'correlation-id-10300032',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300032',
              acceptedAt: new Date('2026-10-01T07:07:01.001Z'),
              startedAt: new Date('2026-10-01T07:07:02.002Z'),
              finishedAt: new Date('2026-10-01T07:07:03.003Z'),
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
            },
            resultBody: '{"fields":[{"fieldPath":"subject.kappa"}]}',
            finishedAt: new Date('2026-10-01T07:07:47.047Z'),
          },
          expected: /#saveOngoingAiRun\(\) refused a run already settled, which a run never leaves: AiRunId 10300032, AiRunStatusId 4$/u,
          label: 'a run that had failed before the call',
        },
        {
          input: {
            aiRunRow: {
              id: 10300033,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10300033',
              requestKey: 'request-key-10300033',
              requestBodyHash: 'request-body-hash-10300033',
              externalRef: 'external-ref-10300033',
              subjectLabel: 'Subject label of run 10300033',
              correlationId: 'correlation-id-10300033',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300033',
              acceptedAt: new Date('2026-10-01T08:08:01.001Z'),
              startedAt: new Date('2026-10-01T08:08:02.002Z'),
              finishedAt: new Date('2026-10-01T08:08:03.003Z'),
              canceledAt: new Date('2026-10-01T08:08:03.003Z'),
            },
            resultBody: '{"fields":[{"fieldPath":"subject.lambda"}]}',
            finishedAt: new Date('2026-10-01T08:08:58.058Z'),
          },
          expected: /#saveOngoingAiRun\(\) refused a run already settled, which a run never leaves: AiRunId 10300033, AiRunStatusId 5$/u,
          label: 'a run that had been canceled before the call',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const actual = () => recorder.saveSucceededAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          resultBody: input.resultBody,
          finishedAt: input.finishedAt,
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveUnsettledAiRunValues()', () => {
    /*
     * The count itself, asked of the row directly rather than through the refusal above.
     *
     * One row means this writer moved the run and none means it did not, and the two answers are
     * what the refusal is built out of — so they are worth asking for on their own, where a class
     * that had stopped putting the statuses in the `WHERE` would answer one to every case.
     */
    describe('should answer how many rows the condition matched', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10300051,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10300051',
              requestKey: 'request-key-10300051',
              requestBodyHash: 'request-body-hash-10300051',
              externalRef: 'external-ref-10300051',
              subjectLabel: 'Subject label of run 10300051',
              correlationId: 'correlation-id-10300051',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300051',
              acceptedAt: new Date('2026-10-01T09:09:01.001Z'),
              startedAt: new Date('2026-10-01T09:09:02.002Z'),
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: '{"fields":[{"fieldPath":"subject.mu"}]}',
              finishedAt: new Date('2026-10-01T09:09:59.059Z'),
            },
          },
          expected: 1,
          label: 'a running run, which the condition still admits',
        },
        {
          input: {
            aiRunRow: {
              id: 10300052,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10300052',
              requestKey: 'request-key-10300052',
              requestBodyHash: 'request-body-hash-10300052',
              externalRef: 'external-ref-10300052',
              subjectLabel: 'Subject label of run 10300052',
              correlationId: 'correlation-id-10300052',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300052',
              acceptedAt: new Date('2026-10-01T10:10:01.001Z'),
              startedAt: new Date('2026-10-01T10:10:02.002Z'),
              finishedAt: new Date('2026-10-01T10:10:03.003Z'),
            },
            values: {
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.OUTPUT_INVALID,
              failureParameters: null,
              finishedAt: new Date('2026-10-01T10:10:50.050Z'),
            },
          },
          expected: 0,
          label: 'a run that had settled, which the condition excludes',
        },
        {
          input: {
            aiRunRow: {
              id: 10300053,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10300053',
              requestKey: 'request-key-10300053',
              requestBodyHash: 'request-body-hash-10300053',
              externalRef: 'external-ref-10300053',
              subjectLabel: 'Subject label of run 10300053',
              correlationId: 'correlation-id-10300053',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300053',
              acceptedAt: new Date('2026-10-01T11:11:01.001Z'),
              startedAt: null,
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              startedAt: new Date('2026-10-01T11:11:11.011Z'),
            },
          },
          expected: 1,
          label: 'a queued run moving to a status that is not terminal either',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const received = await recorder.saveUnsettledAiRunValues({ // Act
          aiRunId: input.aiRunRow.id,
          values: input.values,
        })

        expect(received) // Assert
          .toBe(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveOngoingAiRun()', () => {
    /*
     * A call naming nothing this class writes is not a lost race, and must not be answered as one.
     *
     * No column is written, so no row can match a write of no columns however the run stands, and
     * the count that decides the race says nothing at all here. The call is answered with the run
     * as it stands — which is what the write it asked for would have left — rather than with a
     * refusal claiming a second writer that never existed.
     */
    describe('should answer a call that names nothing it writes with the run as it stands', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10300041,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10300041',
              requestKey: 'request-key-10300041',
              requestBodyHash: 'request-body-hash-10300041',
              externalRef: 'external-ref-10300041',
              subjectLabel: 'Subject label of run 10300041',
              correlationId: 'correlation-id-10300041',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10300041',
              acceptedAt: new Date('2026-10-01T12:12:01.001Z'),
              startedAt: new Date('2026-10-01T12:12:02.002Z'),
              finishedAt: null,
            },
            values: {},
          },
          expected: expect.objectContaining({
            id: 10300041,
            AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — where it stood before the call
            startedAt: new Date('2026-10-01T12:12:02.002Z'),
            finishedAt: null,
          }),
          label: 'a call whose values name no field at all',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()

        const received = await recorder.saveOngoingAiRun({ // Act
          aiRunId: input.aiRunRow.id,
          values: input.values,
        })

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveRunningAiRunOnce()', () => {
    /*
     * The spelling a queue worker claims a run with, where the claim lands.
     *
     * Nothing is stubbed, so the guard and the condition both run against the real row, and the
     * answer is the write's own count read back as a boolean. The second case re-claims a run that
     * is already running, which is what a worker picking a run up again after a crash does:
     * running is not a status a run has settled in, so this writer moves it and says so.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10320101,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10320101',
              requestKey: 'request-key-10320101',
              requestBodyHash: 'request-body-hash-10320101',
              externalRef: 'external-ref-10320101',
              subjectLabel: 'Subject label of run 10320101',
              correlationId: 'correlation-id-10320101',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320101',
              acceptedAt: new Date('2026-10-03T01:01:01.001Z'),
              startedAt: null,
              finishedAt: null,
            },
            startedAt: new Date('2026-10-03T01:01:05.005Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10320102,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — a delivery picked it up once already
              runKey: 'run-key-10320102',
              requestKey: 'request-key-10320102',
              requestBodyHash: 'request-body-hash-10320102',
              externalRef: 'external-ref-10320102',
              subjectLabel: 'Subject label of run 10320102',
              correlationId: 'correlation-id-10320102',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320102',
              acceptedAt: new Date('2026-10-03T02:02:01.001Z'),
              startedAt: new Date('2026-10-03T02:02:02.002Z'),
              finishedAt: null,
            },
            startedAt: new Date('2026-10-03T02:02:44.044Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          startedAt: input.startedAt,
        }

        const received = await recorder.saveRunningAiRunOnce(args) // Act

        expect(received) // Assert
          .toBeTruthy()
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveRunningAiRunOnce()', () => {
    /*
     * The loss, which is the whole reason this spelling exists.
     *
     * The guard is handed a run still under way and passes; the row it then writes against has
     * settled. The throwing spelling refuses that, and the queue would mark the delivery failed and
     * redeliver it — so this one answers false, and the worker stops without writing anything
     * further.
     */
    describe('when another writer settled the run between the read and the write', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunRow: {
                id: 10320111,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID — the first delivery settled it
                runKey: 'run-key-10320111',
                requestKey: 'request-key-10320111',
                requestBodyHash: 'request-body-hash-10320111',
                externalRef: 'external-ref-10320111',
                subjectLabel: 'Subject label of run 10320111',
                correlationId: 'correlation-id-10320111',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320111',
                acceptedAt: new Date('2026-10-03T03:03:01.001Z'),
                startedAt: new Date('2026-10-03T03:03:02.002Z'),
                finishedAt: new Date('2026-10-03T03:03:03.003Z'),
              },
              staleAiRun: {
                id: 10320111,
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — the run as the guard read it
              },
              startedAt: new Date('2026-10-03T03:03:33.033Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10320112,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID — a cancellation took effect first
                runKey: 'run-key-10320112',
                requestKey: 'request-key-10320112',
                requestBodyHash: 'request-body-hash-10320112',
                externalRef: 'external-ref-10320112',
                subjectLabel: 'Subject label of run 10320112',
                correlationId: 'correlation-id-10320112',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320112',
                acceptedAt: new Date('2026-10-03T04:04:01.001Z'),
                startedAt: new Date('2026-10-03T04:04:02.002Z'),
                finishedAt: new Date('2026-10-03T04:04:03.003Z'),
                canceledAt: new Date('2026-10-03T04:04:03.003Z'),
              },
              staleAiRun: {
                id: 10320112,
                AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID — the run as the guard read it
              },
              startedAt: new Date('2026-10-03T04:04:44.044Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
          input,
        }) => {
          await AiRun.create(input.aiRunRow) // Arrange

          const recorder = AiRunStatusRecorder.create()

          jest.spyOn(recorder, 'findAiRun')
            .mockResolvedValue(input.staleAiRun)

          const args = {
            aiRunId: input.aiRunRow.id,
            startedAt: input.startedAt,
          }

          const received = await recorder.saveRunningAiRunOnce(args) // Act

          expect(received) // Assert
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveRunningAiRunOnce()', () => {
    /*
     * The ordinary at-least-once case: a delivery arriving at a run another delivery finished
     * minutes ago.
     *
     * Nothing is stubbed here — the run has simply settled, and the guard reads it as settled. The
     * throwing spelling refuses that, and a worker handed the refusal would have its job marked
     * failed and redelivered on every duplicate, which is the event this spelling exists for.
     * There is nothing for this delivery to do and no later attempt will change that, so it is
     * told so rather than refused. One case per terminal status, because a guard that only knew
     * about succeeded would pass a describe that only asked about succeeded.
     */
    describe('when the run had already settled when the guard read it', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunRow: {
                id: 10320121,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-10320121',
                requestKey: 'request-key-10320121',
                requestBodyHash: 'request-body-hash-10320121',
                externalRef: 'external-ref-10320121',
                subjectLabel: 'Subject label of run 10320121',
                correlationId: 'correlation-id-10320121',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320121',
                acceptedAt: new Date('2026-10-03T05:05:01.001Z'),
                startedAt: new Date('2026-10-03T05:05:02.002Z'),
                finishedAt: new Date('2026-10-03T05:05:03.003Z'),
              },
              startedAt: new Date('2026-10-03T05:05:55.055Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10320122,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
                runKey: 'run-key-10320122',
                requestKey: 'request-key-10320122',
                requestBodyHash: 'request-body-hash-10320122',
                externalRef: 'external-ref-10320122',
                subjectLabel: 'Subject label of run 10320122',
                correlationId: 'correlation-id-10320122',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320122',
                acceptedAt: new Date('2026-10-03T06:06:01.001Z'),
                startedAt: new Date('2026-10-03T06:06:02.002Z'),
                finishedAt: new Date('2026-10-03T06:06:03.003Z'),
                failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
              },
              startedAt: new Date('2026-10-03T06:06:06.006Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10320123,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
                runKey: 'run-key-10320123',
                requestKey: 'request-key-10320123',
                requestBodyHash: 'request-body-hash-10320123',
                externalRef: 'external-ref-10320123',
                subjectLabel: 'Subject label of run 10320123',
                correlationId: 'correlation-id-10320123',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320123',
                acceptedAt: new Date('2026-10-03T07:07:01.001Z'),
                startedAt: new Date('2026-10-03T07:07:02.002Z'),
                finishedAt: new Date('2026-10-03T07:07:03.003Z'),
                canceledAt: new Date('2026-10-03T07:07:03.003Z'),
              },
              startedAt: new Date('2026-10-03T07:07:07.007Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
          input,
        }) => {
          await AiRun.create(input.aiRunRow) // Arrange

          const recorder = AiRunStatusRecorder.create()
          const args = {
            aiRunId: input.aiRunRow.id,
            startedAt: input.startedAt,
          }

          const received = await recorder.saveRunningAiRunOnce(args) // Act

          expect(received) // Assert
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveRunningAiRunOnce()', () => {
    /*
     * A job naming a run that is not there, which is the case Q86's mitigation rests on.
     *
     * Sequelize 6.37.8 runs a transaction's `afterCommit` hooks from a `finally`, so a COMMIT that
     * failed still dispatches the job it registered — and the worker that picks that job up finds
     * no row. Nothing at the hook can tell that case apart, so what covers it is the worker doing
     * nothing about it, and the worker can only do nothing if this answers rather than refuses. A
     * spelling that threw here would mark every such delivery failed and redeliver it against a
     * run that will never exist.
     *
     * No row is created for either id, and both sit in this block's reserved never-created range.
     */
    describe('when no run carries the id', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunId: 10329101,
              startedAt: new Date('2026-10-03T08:08:08.008Z'),
            },
          },
          {
            input: {
              aiRunId: 10329102,
              startedAt: new Date('2026-10-03T09:09:09.009Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const recorder = AiRunStatusRecorder.create() // Arrange

          const received = await recorder.saveRunningAiRunOnce(input) // Act

          expect(received) // Assert
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveRunningAiRunOnce()', () => {
    /*
     * A key that is no key is refused before the run is looked for at all, and the parameter is
     * named without the value being repeated — the same refusal the throwing spelling raises.
     */
    describe('when the run id is no id', () => {
      const cases = [
        {
          input: {
            aiRunId: 'a run id the caller built out of something else',
            startedAt: new Date('2026-10-03T10:10:10.010Z'),
          },
          expected: /#saveOngoingAiRun\(\) refused a key that is not an id: field aiRunId$/u,
        },
        {
          input: {
            aiRunId: null,
            startedAt: new Date('2026-10-03T11:11:11.011Z'),
          },
          expected: /#saveOngoingAiRun\(\) refused a key that is not an id: field aiRunId$/u,
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunStatusRecorder.create() // Arrange

        const received = () => recorder.saveRunningAiRunOnce(input) // Act

        await expect(received) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRunOnce()', () => {
    /*
     * The delivery that settles the run first is the one that owns it, from either status a run is
     * settled from. The second case settles a result that is legitimately empty, which is a success
     * here as it is in the throwing spelling.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10320201,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10320201',
              requestKey: 'request-key-10320201',
              requestBodyHash: 'request-body-hash-10320201',
              externalRef: 'external-ref-10320201',
              subjectLabel: 'Subject label of run 10320201',
              correlationId: 'correlation-id-10320201',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320201',
              acceptedAt: new Date('2026-10-04T01:01:01.001Z'),
              startedAt: new Date('2026-10-04T01:01:02.002Z'),
              finishedAt: null,
              resultBody: null,
            },
            resultBody: '{"fields":[{"fieldPath":"subject.nu"}]}',
            finishedAt: new Date('2026-10-04T01:01:11.011Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10320202,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10320202',
              requestKey: 'request-key-10320202',
              requestBodyHash: 'request-body-hash-10320202',
              externalRef: 'external-ref-10320202',
              subjectLabel: 'Subject label of run 10320202',
              correlationId: 'correlation-id-10320202',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320202',
              acceptedAt: new Date('2026-10-04T02:02:01.001Z'),
              startedAt: null,
              finishedAt: null,
              resultBody: null,
            },
            resultBody: null, // a run that legitimately settled nothing
            finishedAt: new Date('2026-10-04T02:02:22.022Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          resultBody: input.resultBody,
          finishedAt: input.finishedAt,
        }

        const received = await recorder.saveSucceededAiRunOnce(args) // Act

        expect(received) // Assert
          .toBeTruthy()
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRunOnce()', () => {
    /*
     * The second delivery of a job whose run another delivery had already settled. It is told no,
     * and the row it did not write is left carrying what the first writer put there.
     */
    describe('when another writer settled the run between the read and the write', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunRow: {
                id: 10320211,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-10320211',
                requestKey: 'request-key-10320211',
                requestBodyHash: 'request-body-hash-10320211',
                externalRef: 'external-ref-10320211',
                subjectLabel: 'Subject label of run 10320211',
                correlationId: 'correlation-id-10320211',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320211',
                acceptedAt: new Date('2026-10-04T03:03:01.001Z'),
                startedAt: new Date('2026-10-04T03:03:02.002Z'),
                finishedAt: new Date('2026-10-04T03:03:03.003Z'),
              },
              staleAiRun: {
                id: 10320211,
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — the run as the guard read it
              },
              resultBody: '{"fields":[{"fieldPath":"subject.xi"}]}',
              finishedAt: new Date('2026-10-04T03:03:33.033Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10320212,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
                runKey: 'run-key-10320212',
                requestKey: 'request-key-10320212',
                requestBodyHash: 'request-body-hash-10320212',
                externalRef: 'external-ref-10320212',
                subjectLabel: 'Subject label of run 10320212',
                correlationId: 'correlation-id-10320212',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320212',
                acceptedAt: new Date('2026-10-04T04:04:01.001Z'),
                startedAt: new Date('2026-10-04T04:04:02.002Z'),
                finishedAt: new Date('2026-10-04T04:04:03.003Z'),
                failureReasonCode: AI_RUN_FAILURE_REASON_CODE.PROVIDER_CALL_FAILED,
              },
              staleAiRun: {
                id: 10320212,
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — the run as the guard read it
              },
              resultBody: '{"fields":[{"fieldPath":"subject.omicron"}]}',
              finishedAt: new Date('2026-10-04T04:04:44.044Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
          input,
        }) => {
          await AiRun.create(input.aiRunRow) // Arrange

          const recorder = AiRunStatusRecorder.create()

          jest.spyOn(recorder, 'findAiRun')
            .mockResolvedValue(input.staleAiRun)

          const args = {
            aiRunId: input.aiRunRow.id,
            resultBody: input.resultBody,
            finishedAt: input.finishedAt,
          }

          const received = await recorder.saveSucceededAiRunOnce(args) // Act

          expect(received) // Assert
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveSucceededAiRunOnce()', () => {
    /*
     * A run that had settled before the call is answered rather than refused here too, and the
     * second case is the one that matters most: a delivery finishing work on a run a cancellation
     * already took effect on. There is nothing for it to record, and a later attempt would find
     * the same thing.
     */
    describe('when the run had already settled when the guard read it', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunRow: {
                id: 10320221,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-10320221',
                requestKey: 'request-key-10320221',
                requestBodyHash: 'request-body-hash-10320221',
                externalRef: 'external-ref-10320221',
                subjectLabel: 'Subject label of run 10320221',
                correlationId: 'correlation-id-10320221',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320221',
                acceptedAt: new Date('2026-10-04T05:05:01.001Z'),
                startedAt: new Date('2026-10-04T05:05:02.002Z'),
                finishedAt: new Date('2026-10-04T05:05:03.003Z'),
              },
              resultBody: '{"fields":[{"fieldPath":"subject.pi"}]}',
              finishedAt: new Date('2026-10-04T05:05:55.055Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10320222,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
                runKey: 'run-key-10320222',
                requestKey: 'request-key-10320222',
                requestBodyHash: 'request-body-hash-10320222',
                externalRef: 'external-ref-10320222',
                subjectLabel: 'Subject label of run 10320222',
                correlationId: 'correlation-id-10320222',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320222',
                acceptedAt: new Date('2026-10-04T06:06:01.001Z'),
                startedAt: new Date('2026-10-04T06:06:02.002Z'),
                finishedAt: new Date('2026-10-04T06:06:03.003Z'),
                canceledAt: new Date('2026-10-04T06:06:03.003Z'),
              },
              resultBody: '{"fields":[{"fieldPath":"subject.rho"}]}',
              finishedAt: new Date('2026-10-04T06:06:36.036Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
          input,
        }) => {
          await AiRun.create(input.aiRunRow) // Arrange

          const recorder = AiRunStatusRecorder.create()
          const args = {
            aiRunId: input.aiRunRow.id,
            resultBody: input.resultBody,
            finishedAt: input.finishedAt,
          }

          const received = await recorder.saveSucceededAiRunOnce(args) // Act

          expect(received) // Assert
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveFailedAiRunOnce()', () => {
    /*
     * The failure a delivery records, from either status a run is settled from. The reason code and
     * its parameters are written as handed over, which is the throwing spelling's rule reached
     * through this one.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10320301,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10320301',
              requestKey: 'request-key-10320301',
              requestBodyHash: 'request-body-hash-10320301',
              externalRef: 'external-ref-10320301',
              subjectLabel: 'Subject label of run 10320301',
              correlationId: 'correlation-id-10320301',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320301',
              acceptedAt: new Date('2026-10-05T01:01:01.001Z'),
              startedAt: new Date('2026-10-05T01:01:02.002Z'),
              finishedAt: null,
              failureReasonCode: null,
              failureParameters: null,
            },
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
            failureParameters: null,
            finishedAt: new Date('2026-10-05T01:01:11.011Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10320302,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10320302',
              requestKey: 'request-key-10320302',
              requestBodyHash: 'request-body-hash-10320302',
              externalRef: 'external-ref-10320302',
              subjectLabel: 'Subject label of run 10320302',
              correlationId: 'correlation-id-10320302',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320302',
              acceptedAt: new Date('2026-10-05T02:02:01.001Z'),
              startedAt: null,
              finishedAt: null,
              failureReasonCode: null,
              failureParameters: null,
            },
            failureReasonCode: AI_RUN_FAILURE_REASON_CODE.PROVIDER_CALL_FAILED,
            failureParameters: {
              attemptCount: 2,
            },
            finishedAt: new Date('2026-10-05T02:02:22.022Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          failureReasonCode: input.failureReasonCode,
          failureParameters: input.failureParameters,
          finishedAt: input.finishedAt,
        }

        const received = await recorder.saveFailedAiRunOnce(args) // Act

        expect(received) // Assert
          .toBeTruthy()
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveFailedAiRunOnce()', () => {
    /*
     * A delivery that ran out of time while another had already settled the run. Answering it with
     * a refusal would fail the job in the queue and redeliver it, for a run nothing further can be
     * written to.
     */
    describe('when another writer settled the run between the read and the write', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunRow: {
                id: 10320311,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-10320311',
                requestKey: 'request-key-10320311',
                requestBodyHash: 'request-body-hash-10320311',
                externalRef: 'external-ref-10320311',
                subjectLabel: 'Subject label of run 10320311',
                correlationId: 'correlation-id-10320311',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320311',
                acceptedAt: new Date('2026-10-05T03:03:01.001Z'),
                startedAt: new Date('2026-10-05T03:03:02.002Z'),
                finishedAt: new Date('2026-10-05T03:03:03.003Z'),
              },
              staleAiRun: {
                id: 10320311,
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID — the run as the guard read it
              },
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
              failureParameters: null,
              finishedAt: new Date('2026-10-05T03:03:33.033Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10320312,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
                runKey: 'run-key-10320312',
                requestKey: 'request-key-10320312',
                requestBodyHash: 'request-body-hash-10320312',
                externalRef: 'external-ref-10320312',
                subjectLabel: 'Subject label of run 10320312',
                correlationId: 'correlation-id-10320312',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320312',
                acceptedAt: new Date('2026-10-05T04:04:01.001Z'),
                startedAt: new Date('2026-10-05T04:04:02.002Z'),
                finishedAt: new Date('2026-10-05T04:04:03.003Z'),
                canceledAt: new Date('2026-10-05T04:04:03.003Z'),
              },
              staleAiRun: {
                id: 10320312,
                AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID — the run as the guard read it
              },
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.OUTPUT_INVALID,
              failureParameters: {
                attemptCount: 4,
              },
              finishedAt: new Date('2026-10-05T04:04:44.044Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
          input,
        }) => {
          await AiRun.create(input.aiRunRow) // Arrange

          const recorder = AiRunStatusRecorder.create()

          jest.spyOn(recorder, 'findAiRun')
            .mockResolvedValue(input.staleAiRun)

          const args = {
            aiRunId: input.aiRunRow.id,
            failureReasonCode: input.failureReasonCode,
            failureParameters: input.failureParameters,
            finishedAt: input.finishedAt,
          }

          const received = await recorder.saveFailedAiRunOnce(args) // Act

          expect(received) // Assert
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveFailedAiRunOnce()', () => {
    /*
     * A failed run records a reason code in this spelling too, and a call carrying none is refused
     * rather than answered false — it is the call that is malformed, and false would name a second
     * writer that never existed. Both runs are still running, so the settled guard cannot be what
     * turns either away.
     */
    describe('when the reason code is absent', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10320321,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10320321',
              requestKey: 'request-key-10320321',
              requestBodyHash: 'request-body-hash-10320321',
              externalRef: 'external-ref-10320321',
              subjectLabel: 'Subject label of run 10320321',
              correlationId: 'correlation-id-10320321',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320321',
              acceptedAt: new Date('2026-10-05T05:05:01.001Z'),
              startedAt: new Date('2026-10-05T05:05:02.002Z'),
              finishedAt: null,
            },
            failureReasonCode: null,
            failureParameters: null,
            finishedAt: new Date('2026-10-05T05:05:55.055Z'),
          },
          expected: /#saveFailedAiRun\(\) refused a failed run carrying no reason code: AiRunId 10320321$/u,
        },
        {
          input: {
            aiRunRow: {
              id: 10320322,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10320322',
              requestKey: 'request-key-10320322',
              requestBodyHash: 'request-body-hash-10320322',
              externalRef: 'external-ref-10320322',
              subjectLabel: 'Subject label of run 10320322',
              correlationId: 'correlation-id-10320322',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320322',
              acceptedAt: new Date('2026-10-05T06:06:01.001Z'),
              startedAt: new Date('2026-10-05T06:06:02.002Z'),
              finishedAt: null,
            },
            failureReasonCode: '   ', // present at the column, naming no reason a client can resolve
            failureParameters: null,
            finishedAt: new Date('2026-10-05T06:06:36.036Z'),
          },
          expected: /#saveFailedAiRun\(\) refused a failed run carrying no reason code: AiRunId 10320322$/u,
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()
        const args = {
          aiRunId: input.aiRunRow.id,
          failureReasonCode: input.failureReasonCode,
          failureParameters: input.failureParameters,
          finishedAt: input.finishedAt,
        }

        const received = () => recorder.saveFailedAiRunOnce(args) // Act

        await expect(received) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveFailedAiRunOnce()', () => {
    /*
     * The third spelling answers the same way, so the rule is not one the other two happen to
     * share. A delivery that ran out of time against a run another delivery had already succeeded
     * or a cancellation had already taken effect on has nothing to record, and a later attempt
     * would find the same thing.
     */
    describe('when the run had already settled when the guard read it', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunRow: {
                id: 10320331,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-10320331',
                requestKey: 'request-key-10320331',
                requestBodyHash: 'request-body-hash-10320331',
                externalRef: 'external-ref-10320331',
                subjectLabel: 'Subject label of run 10320331',
                correlationId: 'correlation-id-10320331',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320331',
                acceptedAt: new Date('2026-10-05T07:07:01.001Z'),
                startedAt: new Date('2026-10-05T07:07:02.002Z'),
                finishedAt: new Date('2026-10-05T07:07:03.003Z'),
              },
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.TIME_LIMIT_EXCEEDED,
              failureParameters: null,
              finishedAt: new Date('2026-10-05T07:07:47.047Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10320332,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
                runKey: 'run-key-10320332',
                requestKey: 'request-key-10320332',
                requestBodyHash: 'request-body-hash-10320332',
                externalRef: 'external-ref-10320332',
                subjectLabel: 'Subject label of run 10320332',
                correlationId: 'correlation-id-10320332',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10320332',
                acceptedAt: new Date('2026-10-05T08:08:01.001Z'),
                startedAt: new Date('2026-10-05T08:08:02.002Z'),
                finishedAt: new Date('2026-10-05T08:08:03.003Z'),
                canceledAt: new Date('2026-10-05T08:08:03.003Z'),
              },
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.PROVIDER_CALL_FAILED,
              failureParameters: {
                attemptCount: 5,
              },
              finishedAt: new Date('2026-10-05T08:08:58.058Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
          input,
        }) => {
          await AiRun.create(input.aiRunRow) // Arrange

          const recorder = AiRunStatusRecorder.create()
          const args = {
            aiRunId: input.aiRunRow.id,
            failureReasonCode: input.failureReasonCode,
            failureParameters: input.failureParameters,
            finishedAt: input.finishedAt,
          }

          const received = await recorder.saveFailedAiRunOnce(args) // Act

          expect(received) // Assert
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveFailedAiRunOnce()', () => {
    /*
     * A run that is not there answers the same way here as it does when a delivery claims one, so
     * a worker whose job was dispatched by a failed COMMIT (Q86) can stop wherever in its
     * lifecycle it happens to be. No row is created for either id.
     */
    describe('when no run carries the id', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunId: 10329301,
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_FETCH_FAILED,
              failureParameters: null,
              finishedAt: new Date('2026-10-05T09:09:09.009Z'),
            },
          },
          {
            input: {
              aiRunId: 10329302,
              failureReasonCode: AI_RUN_FAILURE_REASON_CODE.OUTPUT_INVALID,
              failureParameters: null,
              finishedAt: new Date('2026-10-05T10:10:10.010Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const recorder = AiRunStatusRecorder.create() // Arrange

          const received = await recorder.saveFailedAiRunOnce(input) // Act

          expect(received) // Assert
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunStatusRecorder', () => {
  describe('#saveUnsettledAiRunValues()', () => {
    /*
     * The transition write goes through `AiRun`'s own guard now, rather than around it.
     *
     * It used to be made with `hooks: false`, because `beforeBulkUpdate` refused any bulk write
     * naming the status. The model reads the `where` instead: a condition excluding every terminal
     * status matches no settled run, so it cannot move one out of a status a run never leaves. The
     * spy is on `AiRun.excludesEveryTerminalAiRunStatus()`, which nothing but that hook reaches —
     * so a call to it is the hook having run, and what it was handed is the condition this class
     * built. The count beside it says the write still landed with the guard in the way.
     */
    describe('should let the model guard read the condition and still land the write', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10320401,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10320401',
              requestKey: 'request-key-10320401',
              requestBodyHash: 'request-body-hash-10320401',
              externalRef: 'external-ref-10320401',
              subjectLabel: 'Subject label of run 10320401',
              correlationId: 'correlation-id-10320401',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320401',
              acceptedAt: new Date('2026-10-06T01:01:01.001Z'),
              startedAt: new Date('2026-10-06T01:01:02.002Z'),
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              resultBody: '{"fields":[{"fieldPath":"subject.sigma"}]}',
              finishedAt: new Date('2026-10-06T01:01:11.011Z'),
            },
          },
          expected: {
            affectedAiRunCount: 1,
            guardArguments: {
              where: {
                id: 10320401,
                AiRunStatusId: {
                  [Op.notIn]: [
                    3, // AI_RUN_STATUS.SUCCEEDED.ID
                    4, // AI_RUN_STATUS.FAILED.ID
                    5, // AI_RUN_STATUS.CANCELED.ID
                  ],
                },
              },
            },
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10320402,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10320402',
              requestKey: 'request-key-10320402',
              requestBodyHash: 'request-body-hash-10320402',
              externalRef: 'external-ref-10320402',
              subjectLabel: 'Subject label of run 10320402',
              correlationId: 'correlation-id-10320402',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10320402',
              acceptedAt: new Date('2026-10-06T02:02:01.001Z'),
              startedAt: null,
              finishedAt: null,
            },
            values: {
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              startedAt: new Date('2026-10-06T02:02:22.022Z'),
            },
          },
          expected: {
            affectedAiRunCount: 1,
            guardArguments: {
              where: {
                id: 10320402,
                AiRunStatusId: {
                  [Op.notIn]: [
                    3, // AI_RUN_STATUS.SUCCEEDED.ID
                    4, // AI_RUN_STATUS.FAILED.ID
                    5, // AI_RUN_STATUS.CANCELED.ID
                  ],
                },
              },
            },
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStatusRecorder.create()
        const excludesEveryTerminalAiRunStatusSpy = jest.spyOn(AiRun, 'excludesEveryTerminalAiRunStatus')
        const args = {
          aiRunId: input.aiRunRow.id,
          values: input.values,
        }

        const received = await recorder.saveUnsettledAiRunValues(args) // Act

        expect(received) // Assert
          .toBe(expected.affectedAiRunCount)
        expect(excludesEveryTerminalAiRunStatusSpy)
          .toHaveBeenCalledWith(expected.guardArguments)
      })
    })
  })
})
