import AiRunCancellationRegistrar from '../../../app/aiRun/AiRunCancellationRegistrar.js'
import AiRunStatusRecorder from '../../../app/aiRun/AiRunStatusRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * Every run this file asks about is created by this file, in `#run-cancel`'s own id block
 * (`10810001` upward). The development seeders hold runs in all five statuses, and this feature's
 * read-only test reads them — but a file that wrote `cancel_requested_at` onto one of them would
 * change what that file and `#run-contract`'s own tests see, and the failure would land somewhere
 * else entirely.
 *
 * The block is split so that every id in it is spoken for:
 *
 *   - `10810001` upward  the runs `#saveRequestedAiRunCancellation()` is asked about.
 *   - `10810101`–`10810199` ids stated in `tests/__tests__/app/aiRun/AiRunCancellationRegistrar.js`
 *                        and created by nothing: `#shouldSaveAiRunCancelRequest()` reads a run
 *                        that was handed to it and never a table.
 *   - `10819001` upward  never created, so a not-found case has something to ask after that no run
 *                        will ever answer.
 *   - `10820001` upward  the runs `#registerAiRunCancellation()` is asked about.
 *   - `10830001` upward  the runs the renderer's own file creates.
 *
 * Every run here is accepted in November 2026, well clear of 2026-09-10 — the day the `ai_runs`
 * fixture was seeded on, and the day the rate-limit cases of `AssetMediaExtractionPostRenderer`
 * count runs inside. A run this file wrote on that day would move a count another file asserts.
 *
 * **The recorder is injected and spied on rather than stubbed.** It runs for real, so the write
 * really reaches the row and the boolean really comes back from the affected-row count; the spy is
 * there because "nothing was written the second time" is a claim about a call that did not happen,
 * and a call that did not happen leaves nothing in the table to read. That is the one claim §15's
 * design sentence turns on — a cancellation is created, so asking twice creates nothing — and it
 * is asserted on the seam rather than inferred from a column that would look the same either way.
 */

describe('AiRunCancellationRegistrar', () => {
  describe('#saveRequestedAiRunCancellation()', () => {
    /*
     * The two statuses a run can still be stopped from. The instant written is the caller's, so a
     * run asked about carries the moment the client asked rather than the moment this process got
     * round to it.
     */
    describe('when the run is still going and has not been asked about', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10810001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10810001',
              requestKey: 'request-key-10810001',
              requestBodyHash: 'request-body-hash-10810001',
              externalRef: 'external-ref-10810001',
              subjectLabel: 'Subject label of run 10810001',
              correlationId: 'correlation-id-10810001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10810001',
              acceptedAt: new Date('2026-11-01T01:01:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            cancelRequestedAt: new Date('2026-11-01T01:01:11.011Z'),
          },
          expected: {
            aiRunId: 10810001,
            cancelRequestedAt: new Date('2026-11-01T01:01:11.011Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10810002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10810002',
              requestKey: 'request-key-10810002',
              requestBodyHash: 'request-body-hash-10810002',
              externalRef: 'external-ref-10810002',
              subjectLabel: 'Subject label of run 10810002',
              correlationId: 'correlation-id-10810002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10810002',
              acceptedAt: new Date('2026-11-02T02:02:02.002Z'),
              startedAt: new Date('2026-11-02T02:02:03.003Z'),
              finishedAt: null,
              cancelRequestedAt: null,
            },
            cancelRequestedAt: new Date('2026-11-02T02:02:22.022Z'),
          },
          expected: {
            aiRunId: 10810002,
            cancelRequestedAt: new Date('2026-11-02T02:02:22.022Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const aiRunStatusRecorder = AiRunStatusRecorder.create()
        const saveAiRunCancelRequestSpy = jest.spyOn(aiRunStatusRecorder, 'saveAiRunCancelRequest')
        const registrar = AiRunCancellationRegistrar.create({
          aiRunStatusRecorder,
        })
        const args = {
          aiRun: input.aiRunRow,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = await registrar.saveRequestedAiRunCancellation(args)

        expect(received)
          .toBeTruthy()
        expect(saveAiRunCancelRequestSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    /*
     * All three terminal statuses, one per case. The fifth acceptance criterion at the point it is
     * decided: a settled run has no cancellation left to create, so the recorder is never asked —
     * which is what keeps the caller able to answer the run's state rather than raise the refusal
     * the recorder's throwing spelling would have raised.
     */
    describe('when the run has settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10810011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10810011',
              requestKey: 'request-key-10810011',
              requestBodyHash: 'request-body-hash-10810011',
              externalRef: 'external-ref-10810011',
              subjectLabel: 'Subject label of run 10810011',
              correlationId: 'correlation-id-10810011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10810011',
              acceptedAt: new Date('2026-11-03T03:03:03.003Z'),
              startedAt: new Date('2026-11-03T03:03:04.004Z'),
              finishedAt: new Date('2026-11-03T03:03:05.005Z'),
              cancelRequestedAt: null,
            },
            cancelRequestedAt: new Date('2026-11-03T03:03:33.033Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10810012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10810012',
              requestKey: 'request-key-10810012',
              requestBodyHash: 'request-body-hash-10810012',
              externalRef: 'external-ref-10810012',
              subjectLabel: 'Subject label of run 10810012',
              correlationId: 'correlation-id-10810012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10810012',
              acceptedAt: new Date('2026-11-04T04:04:04.004Z'),
              startedAt: new Date('2026-11-04T04:04:05.005Z'),
              finishedAt: new Date('2026-11-04T04:04:06.006Z'),
              cancelRequestedAt: null,
            },
            cancelRequestedAt: new Date('2026-11-04T04:04:44.044Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10810013,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10810013',
              requestKey: 'request-key-10810013',
              requestBodyHash: 'request-body-hash-10810013',
              externalRef: 'external-ref-10810013',
              subjectLabel: 'Subject label of run 10810013',
              correlationId: 'correlation-id-10810013',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10810013',
              acceptedAt: new Date('2026-11-05T05:05:05.005Z'),
              startedAt: new Date('2026-11-05T05:05:06.006Z'),
              finishedAt: new Date('2026-11-05T05:05:08.008Z'),
              cancelRequestedAt: new Date('2026-11-05T05:05:07.007Z'),
            },
            cancelRequestedAt: new Date('2026-11-05T05:05:55.055Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow)

        const aiRunStatusRecorder = AiRunStatusRecorder.create()
        const saveAiRunCancelRequestSpy = jest.spyOn(aiRunStatusRecorder, 'saveAiRunCancelRequest')
        const registrar = AiRunCancellationRegistrar.create({
          aiRunStatusRecorder,
        })
        const args = {
          aiRun: input.aiRunRow,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = await registrar.saveRequestedAiRunCancellation(args)

        expect(received)
          .toBeFalsy()
        expect(saveAiRunCancelRequestSpy)
          .not
          .toHaveBeenCalled()
      })
    })

    /*
     * Asking a second time. The run is still going, so nothing about its status stops the write —
     * what stops it is the instant already on the row. Keeping that first instant is what leaves
     * §15's third use case a gap to measure: overwrite it and the interval between asking and
     * stopping shrinks by however long the client waited before asking again.
     */
    describe('when the cancellation was already asked for', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10810021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10810021',
              requestKey: 'request-key-10810021',
              requestBodyHash: 'request-body-hash-10810021',
              externalRef: 'external-ref-10810021',
              subjectLabel: 'Subject label of run 10810021',
              correlationId: 'correlation-id-10810021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10810021',
              acceptedAt: new Date('2026-11-06T06:06:06.006Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-06T06:06:16.016Z'),
            },
            cancelRequestedAt: new Date('2026-11-06T06:06:26.026Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10810022,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10810022',
              requestKey: 'request-key-10810022',
              requestBodyHash: 'request-body-hash-10810022',
              externalRef: 'external-ref-10810022',
              subjectLabel: 'Subject label of run 10810022',
              correlationId: 'correlation-id-10810022',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10810022',
              acceptedAt: new Date('2026-11-07T07:07:07.007Z'),
              startedAt: new Date('2026-11-07T07:07:08.008Z'),
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-07T07:07:17.017Z'),
            },
            cancelRequestedAt: new Date('2026-11-07T07:07:27.027Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow)

        const aiRunStatusRecorder = AiRunStatusRecorder.create()
        const saveAiRunCancelRequestSpy = jest.spyOn(aiRunStatusRecorder, 'saveAiRunCancelRequest')
        const registrar = AiRunCancellationRegistrar.create({
          aiRunStatusRecorder,
        })
        const args = {
          aiRun: input.aiRunRow,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = await registrar.saveRequestedAiRunCancellation(args)

        expect(received)
          .toBeFalsy()
        expect(saveAiRunCancelRequestSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('#registerAiRunCancellation()', () => {
    /*
     * A run still going answers with where it still is, because that is where it still is: the
     * request is recorded and the run stops at its next step boundary. A body claiming `canceled`
     * here would claim something that has not happened yet.
     */
    describe('when the run is still going', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10820001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10820001',
              requestKey: 'request-key-10820001',
              requestBodyHash: 'request-body-hash-10820001',
              externalRef: 'external-ref-10820001',
              subjectLabel: 'Subject label of run 10820001',
              correlationId: 'correlation-id-10820001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10820001',
              acceptedAt: new Date('2026-11-11T01:01:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-11T01:01:11.011Z'),
          },
          expected: {
            statusName: 'queued',
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10820002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10820002',
              requestKey: 'request-key-10820002',
              requestBodyHash: 'request-body-hash-10820002',
              externalRef: 'external-ref-10820002',
              subjectLabel: 'Subject label of run 10820002',
              correlationId: 'correlation-id-10820002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10820002',
              acceptedAt: new Date('2026-11-12T02:02:02.002Z'),
              startedAt: new Date('2026-11-12T02:02:03.003Z'),
              finishedAt: null,
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-12T02:02:22.022Z'),
          },
          expected: {
            statusName: 'running',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const aiRunStatusRecorder = AiRunStatusRecorder.create()
        const saveAiRunCancelRequestSpy = jest.spyOn(aiRunStatusRecorder, 'saveAiRunCancelRequest')
        const registrar = AiRunCancellationRegistrar.create({
          aiRunStatusRecorder,
        })
        const args = {
          runKey: input.aiRunRow.runKey,
          apiClientId: input.apiClientId,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = await registrar.registerAiRunCancellation(args)

        expect(received)
          .toEqual(expected)
        expect(saveAiRunCancelRequestSpy)
          .toHaveBeenCalledWith({
            aiRunId: input.aiRunRow.id,
            cancelRequestedAt: input.cancelRequestedAt,
          })
      })
    })

    /*
     * The fifth acceptance criterion of §15, read against all three terminal statuses: a run that
     * has already reached one answers with that state, not with an error the client has to handle.
     * Nothing is written on any of the three, which is what makes "answers with the state that
     * already holds" true of the row and not only of the body.
     */
    describe('when the run has already reached a terminal state', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10820011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10820011',
              requestKey: 'request-key-10820011',
              requestBodyHash: 'request-body-hash-10820011',
              externalRef: 'external-ref-10820011',
              subjectLabel: 'Subject label of run 10820011',
              correlationId: 'correlation-id-10820011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10820011',
              acceptedAt: new Date('2026-11-13T03:03:03.003Z'),
              startedAt: new Date('2026-11-13T03:03:04.004Z'),
              finishedAt: new Date('2026-11-13T03:03:05.005Z'),
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-13T03:03:33.033Z'),
          },
          expected: {
            statusName: 'succeeded',
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10820012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10820012',
              requestKey: 'request-key-10820012',
              requestBodyHash: 'request-body-hash-10820012',
              externalRef: 'external-ref-10820012',
              subjectLabel: 'Subject label of run 10820012',
              correlationId: 'correlation-id-10820012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10820012',
              acceptedAt: new Date('2026-11-14T04:04:04.004Z'),
              startedAt: new Date('2026-11-14T04:04:05.005Z'),
              finishedAt: new Date('2026-11-14T04:04:06.006Z'),
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-14T04:04:44.044Z'),
          },
          expected: {
            statusName: 'failed',
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10820013,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10820013',
              requestKey: 'request-key-10820013',
              requestBodyHash: 'request-body-hash-10820013',
              externalRef: 'external-ref-10820013',
              subjectLabel: 'Subject label of run 10820013',
              correlationId: 'correlation-id-10820013',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10820013',
              acceptedAt: new Date('2026-11-15T05:05:05.005Z'),
              startedAt: new Date('2026-11-15T05:05:06.006Z'),
              finishedAt: new Date('2026-11-15T05:05:08.008Z'),
              cancelRequestedAt: new Date('2026-11-15T05:05:07.007Z'),
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-15T05:05:55.055Z'),
          },
          expected: {
            statusName: 'canceled',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const aiRunStatusRecorder = AiRunStatusRecorder.create()
        const saveAiRunCancelRequestSpy = jest.spyOn(aiRunStatusRecorder, 'saveAiRunCancelRequest')
        const registrar = AiRunCancellationRegistrar.create({
          aiRunStatusRecorder,
        })
        const args = {
          runKey: input.aiRunRow.runKey,
          apiClientId: input.apiClientId,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = await registrar.registerAiRunCancellation(args)

        expect(received)
          .toEqual(expected)
        expect(saveAiRunCancelRequestSpy)
          .not
          .toHaveBeenCalled()
      })
    })

    /*
     * The second ask, end to end. A run already carrying the instant somebody asked at answers the
     * state it still stands in and has nothing written against it — which is §15's design sentence
     * read off a row: a cancellation is a resource that is created, so asking twice creates
     * nothing the second time and answers with the state that already holds.
     */
    describe('when the cancellation was already asked for', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10820021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10820021',
              requestKey: 'request-key-10820021',
              requestBodyHash: 'request-body-hash-10820021',
              externalRef: 'external-ref-10820021',
              subjectLabel: 'Subject label of run 10820021',
              correlationId: 'correlation-id-10820021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10820021',
              acceptedAt: new Date('2026-11-16T06:06:06.006Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-16T06:06:16.016Z'),
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-16T06:06:26.026Z'),
          },
          expected: {
            statusName: 'queued',
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10820022,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10820022',
              requestKey: 'request-key-10820022',
              requestBodyHash: 'request-body-hash-10820022',
              externalRef: 'external-ref-10820022',
              subjectLabel: 'Subject label of run 10820022',
              correlationId: 'correlation-id-10820022',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10820022',
              acceptedAt: new Date('2026-11-17T07:07:07.007Z'),
              startedAt: new Date('2026-11-17T07:07:08.008Z'),
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-17T07:07:17.017Z'),
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-17T07:07:27.027Z'),
          },
          expected: {
            statusName: 'running',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const aiRunStatusRecorder = AiRunStatusRecorder.create()
        const saveAiRunCancelRequestSpy = jest.spyOn(aiRunStatusRecorder, 'saveAiRunCancelRequest')
        const registrar = AiRunCancellationRegistrar.create({
          aiRunStatusRecorder,
        })
        const args = {
          runKey: input.aiRunRow.runKey,
          apiClientId: input.apiClientId,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = await registrar.registerAiRunCancellation(args)

        expect(received)
          .toEqual(expected)
        expect(saveAiRunCancelRequestSpy)
          .not
          .toHaveBeenCalled()
      })
    })

    /*
     * The eighth acceptance criterion, both halves at once. The run answers as though it did not
     * exist, and it is left unchanged — the second half asserted on the recorder, which is never
     * reached, because the client is a condition of the read and the run is therefore never
     * loaded.
     */
    describe('when the run belongs to another client', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10820031,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10820031',
              requestKey: 'request-key-10820031',
              requestBodyHash: 'request-body-hash-10820031',
              externalRef: 'external-ref-10820031',
              subjectLabel: 'Subject label of run 10820031',
              correlationId: 'correlation-id-10820031',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10820031',
              acceptedAt: new Date('2026-11-18T08:08:08.008Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-18T08:08:28.028Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10820032,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10820032',
              requestKey: 'request-key-10820032',
              requestBodyHash: 'request-body-hash-10820032',
              externalRef: 'external-ref-10820032',
              subjectLabel: 'Subject label of run 10820032',
              correlationId: 'correlation-id-10820032',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10820032',
              acceptedAt: new Date('2026-11-19T09:09:09.009Z'),
              startedAt: new Date('2026-11-19T09:09:10.010Z'),
              finishedAt: null,
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-19T09:09:29.029Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow)

        const aiRunStatusRecorder = AiRunStatusRecorder.create()
        const saveAiRunCancelRequestSpy = jest.spyOn(aiRunStatusRecorder, 'saveAiRunCancelRequest')
        const registrar = AiRunCancellationRegistrar.create({
          aiRunStatusRecorder,
        })
        const args = {
          runKey: input.aiRunRow.runKey,
          apiClientId: input.apiClientId,
          cancelRequestedAt: input.cancelRequestedAt,
        }

        const received = await registrar.registerAiRunCancellation(args)

        expect(received)
          .toBeNull()
        expect(saveAiRunCancelRequestSpy)
          .not
          .toHaveBeenCalled()
      })
    })

    /*
     * The same null a foreign run answers with, from a key no run carries and from a path that
     * carried no key at all. Nothing downstream can tell the two describes apart, which is the
     * point of both.
     */
    describe('when no run carries the key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10829001',
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-20T10:10:10.010Z'),
          },
        },
        {
          input: {
            runKey: null,
            apiClientId: 10000001,
            cancelRequestedAt: new Date('2026-11-21T11:11:11.011Z'),
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const aiRunStatusRecorder = AiRunStatusRecorder.create()
        const saveAiRunCancelRequestSpy = jest.spyOn(aiRunStatusRecorder, 'saveAiRunCancelRequest')
        const registrar = AiRunCancellationRegistrar.create({
          aiRunStatusRecorder,
        })

        const received = await registrar.registerAiRunCancellation(input)

        expect(received)
          .toBeNull()
        expect(saveAiRunCancelRequestSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
