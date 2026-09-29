import AiRunCallbackDeliveryRecorder from '../../../app/aiRunCallback/AiRunCallbackDeliveryRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * The eighth acceptance criterion of section 12: "a callback that fails to deliver is retried,
 * though a model call in the same run is not". Whether it was retried is a count of rows, and this
 * file is the half that writes them.
 *
 * Every run these attempts hang off is created here, in `#run-delivery`'s own id block —
 * `10530011` upward — and none is borrowed. `ai_run_callback_deliveries` is UNIQUE on
 * `(AiRunId, AiRunCallbackDeliveryCategoryId, attempt_index)`, and the development seeder already
 * hangs attempts off six of the seeded runs, so writing onto one of those would be this file and
 * that fixture competing for the same triple. `10539001` is reserved in the same block as a run
 * nothing ever creates.
 *
 * The delivery rows themselves take their ids from the auto-increment: nothing here reads a
 * delivery back by id, and the rows are asserted as what the method answered with.
 */

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('#saveAiRunCallbackDelivery()', () => {
    /*
     * Three attempts on one run, written in the order they were made. The second carries a null
     * status because the request never completed, which is the column's own case — an attempt was
     * made and there was nothing to record from the far side.
     */
    describe('should record each attempt as its own row', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530011',
              requestKey: 'request-key-10530011',
              requestBodyHash: 'request-body-hash-10530011',
              externalRef: 'external-ref-10530011',
              subjectLabel: 'Subject label of run 10530011',
              correlationId: 'correlation-id-10530011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530011',
              acceptedAt: new Date('2026-09-25T01:00:01.001Z'),
              startedAt: new Date('2026-09-25T01:00:02.002Z'),
              finishedAt: new Date('2026-09-25T01:00:03.003Z'),
            },
            aiRunCallbackDelivery: {
              aiRunId: 10530011,
              callbackDeliveryCategoryName: 'terminal',
              attemptIndex: 1,
              httpStatusCode: 200,
              attemptedAt: new Date('2026-09-25T01:00:04.004Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10530011,
            AiRunCallbackDeliveryCategoryId: 1,
            attemptIndex: 1,
            httpStatusCode: 200,
            attemptedAt: new Date('2026-09-25T01:00:04.004Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10530012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10530012',
              requestKey: 'request-key-10530012',
              requestBodyHash: 'request-body-hash-10530012',
              externalRef: 'external-ref-10530012',
              subjectLabel: 'Subject label of run 10530012',
              correlationId: 'correlation-id-10530012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530012',
              acceptedAt: new Date('2026-09-25T02:00:01.001Z'),
              startedAt: new Date('2026-09-25T02:00:02.002Z'),
              finishedAt: new Date('2026-09-25T02:00:03.003Z'),
            },
            aiRunCallbackDelivery: {
              aiRunId: 10530012,
              callbackDeliveryCategoryName: 'terminal',
              attemptIndex: 2,
              httpStatusCode: null,
              attemptedAt: new Date('2026-09-25T02:00:05.005Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10530012,
            AiRunCallbackDeliveryCategoryId: 1,
            attemptIndex: 2,
            httpStatusCode: null,
            attemptedAt: new Date('2026-09-25T02:00:05.005Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10530013,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10530013',
              requestKey: 'request-key-10530013',
              requestBodyHash: 'request-body-hash-10530013',
              externalRef: 'external-ref-10530013',
              subjectLabel: 'Subject label of run 10530013',
              correlationId: 'correlation-id-10530013',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10530013',
              acceptedAt: new Date('2026-09-25T03:00:01.001Z'),
              startedAt: new Date('2026-09-25T03:00:02.002Z'),
              finishedAt: new Date('2026-09-25T03:00:03.003Z'),
            },
            aiRunCallbackDelivery: {
              aiRunId: 10530013,
              callbackDeliveryCategoryName: 'terminal',
              attemptIndex: 7,
              httpStatusCode: 503,
              attemptedAt: new Date('2026-09-25T03:00:06.006Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10530013,
            AiRunCallbackDeliveryCategoryId: 1,
            attemptIndex: 7,
            httpStatusCode: 503,
            attemptedAt: new Date('2026-09-25T03:00:06.006Z'),
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunCallbackDelivery.aiRunId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunCallbackDeliveryRecorder.create()

        const actual = await recorder.saveAiRunCallbackDelivery(input.aiRunCallbackDelivery)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('#saveAiRunCallbackDelivery()', () => {
    /*
     * Several attempts really do sit on one run, each as its own row, which is what makes the
     * retry countable. Written out of order on purpose — the third attempt first — because the
     * index is the caller's statement about which try this was and never the order the rows
     * arrived in.
     */
    describe('should let one run carry several attempts', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530014,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530014',
              requestKey: 'request-key-10530014',
              requestBodyHash: 'request-body-hash-10530014',
              externalRef: 'external-ref-10530014',
              subjectLabel: 'Subject label of run 10530014',
              correlationId: 'correlation-id-10530014',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530014',
              acceptedAt: new Date('2026-09-25T04:00:01.001Z'),
              startedAt: new Date('2026-09-25T04:00:02.002Z'),
              finishedAt: new Date('2026-09-25T04:00:03.003Z'),
            },
            thirdAttempt: {
              aiRunId: 10530014,
              callbackDeliveryCategoryName: 'terminal',
              attemptIndex: 3,
              httpStatusCode: 204,
              attemptedAt: new Date('2026-09-25T04:00:44.044Z'),
            },
            firstAttempt: {
              aiRunId: 10530014,
              callbackDeliveryCategoryName: 'terminal',
              attemptIndex: 1,
              httpStatusCode: 502,
              attemptedAt: new Date('2026-09-25T04:00:04.004Z'),
            },
            secondAttempt: {
              aiRunId: 10530014,
              callbackDeliveryCategoryName: 'terminal',
              attemptIndex: 2,
              httpStatusCode: null,
              attemptedAt: new Date('2026-09-25T04:00:24.024Z'),
            },
            findParams: {
              aiRunId: 10530014,
              callbackDeliveryCategoryName: 'terminal',
            },
          },
          expected: [
            expect.objectContaining({
              attemptIndex: 1,
              httpStatusCode: 502,
              attemptedAt: new Date('2026-09-25T04:00:04.004Z'),
            }),
            expect.objectContaining({
              attemptIndex: 2,
              httpStatusCode: null,
              attemptedAt: new Date('2026-09-25T04:00:24.024Z'),
            }),
            expect.objectContaining({
              attemptIndex: 3,
              httpStatusCode: 204,
              attemptedAt: new Date('2026-09-25T04:00:44.044Z'),
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.findParams.aiRunId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)
        const recorder = AiRunCallbackDeliveryRecorder.create()
        await recorder.saveAiRunCallbackDelivery(input.thirdAttempt)
        await recorder.saveAiRunCallbackDelivery(input.firstAttempt)
        await recorder.saveAiRunCallbackDelivery(input.secondAttempt)

        const actual = await recorder.findAiRunCallbackDeliveries(input.findParams)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('#saveAiRunCallbackDelivery()', () => {
    /*
     * `attempted_at` is NOT NULL, so there is nothing to drop to — and a value that is present and
     * is not a time coerces to the literal text `Invalid date`, which reads as though an attempt
     * had been timed. So it is refused, exactly as `AiRunStepRecorder` refuses the two instants
     * that bound a step.
     */
    describe('should refuse an attempted_at that is not an instant', () => {
      const cases = [
        {
          input: {
            aiRunId: 10530011,
            callbackDeliveryCategoryName: 'terminal',
            attemptIndex: 9,
            httpStatusCode: 200,
            attemptedAt: 'the twenty fifth of September',
          },
          expected: 'AiRunCallbackDeliveryRecorder#saveAiRunCallbackDelivery() refused an attempted_at carrying something that is not an instant: AiRunId 10530011, attemptIndex 9',
        },
        {
          input: {
            aiRunId: 10530012,
            callbackDeliveryCategoryName: 'terminal',
            attemptIndex: 10,
            httpStatusCode: null,
            attemptedAt: new Date('not a date'),
          },
          expected: 'AiRunCallbackDeliveryRecorder#saveAiRunCallbackDelivery() refused an attempted_at carrying something that is not an instant: AiRunId 10530012, attemptIndex 10',
        },
        {
          input: {
            aiRunId: 10530013,
            callbackDeliveryCategoryName: 'terminal',
            attemptIndex: 11,
            httpStatusCode: 500,
            attemptedAt: null,
          },
          expected: 'AiRunCallbackDeliveryRecorder#saveAiRunCallbackDelivery() refused an attempted_at carrying something that is not an instant: AiRunId 10530013, attemptIndex 11',
        },
      ]

      test.each(cases)('attemptIndex: $input.attemptIndex', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunCallbackDeliveryRecorder.create()

        const actual = () => recorder.saveAiRunCallbackDelivery(input)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('#saveAiRunCallbackDelivery()', () => {
    /*
     * A kind that names no row resolves to no id, and the `NOT NULL` column refuses the row rather
     * than recording an attempt filed under a callback that does not exist — which would count
     * towards a retry total it never belonged to.
     */
    describe('should refuse a kind this version does not declare', () => {
      const cases = [
        {
          input: {
            aiRunId: 10530011,
            callbackDeliveryCategoryName: 'progress',
            attemptIndex: 12,
            httpStatusCode: 200,
            attemptedAt: new Date('2026-09-25T05:00:01.001Z'),
          },
        },
        {
          input: {
            aiRunId: 10530012,
            callbackDeliveryCategoryName: 'constructor',
            attemptIndex: 13,
            httpStatusCode: 204,
            attemptedAt: new Date('2026-09-25T05:00:02.002Z'),
          },
        },
      ]

      test.each(cases)('callbackDeliveryCategoryName: $input.callbackDeliveryCategoryName', async ({
        input,
      }) => {
        const recorder = AiRunCallbackDeliveryRecorder.create()

        const actual = () => recorder.saveAiRunCallbackDelivery(input)

        await expect(actual)
          .rejects
          .toThrow('notNull Violation: AiRunCallbackDelivery.AiRunCallbackDeliveryCategoryId cannot be null')
      })
    })
  })
})
