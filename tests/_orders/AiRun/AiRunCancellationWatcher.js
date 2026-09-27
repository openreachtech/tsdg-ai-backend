import timersPromises from 'node:timers/promises'

import AiRunCancellationWatcher from '../../../app/aiRun/AiRunCancellationWatcher.js'

import AiRunStatusRecorder from '../../../app/aiRun/AiRunStatusRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * The one claim about this class that no read can make: a watch that found nothing asks again.
 *
 * Every other member of `AiRunCancellationWatcher` is asserted against seeded rows in
 * `tests/__tests__/app/aiRun/AiRunCancellationWatcher.js`, where nothing is written. This file
 * exists because the behavior §15's second acceptance criterion turns on — a run that was not
 * canceled when its work began, and is canceled while that work is in flight — is a column
 * changing underneath a watch that is already running. A watcher that read the column once and
 * answered would pass every case in that file and fail every run in production.
 *
 * **The cancellation is recorded after the watch has begun, and after it has certainly already
 * looked.** The interval is 25 milliseconds and the recording waits out 100 of them, so the watch
 * has read the column and found nothing several times over before there is anything to find. The
 * run is created carrying no cancellation for the same reason: a row that already held one would
 * be answered by the watch's first reading and would prove nothing about the second.
 *
 * **Nothing here is timed from the other end.** The watch resolves when it finds the cancellation,
 * so the assertion waits on it rather than on a clock — a watcher that stopped asking would hold
 * the test until Jest gave up on it, which is a failure and not a flake.
 *
 * **Every run is created by this file, in `#run-cancel`'s own id block (`10840001` upward), and is
 * accepted in November 2026.** The development seeder's runs are read by this feature's own
 * read-only file and by `#run-contract`'s, and a test that wrote `cancel_requested_at` onto one of
 * them would change what those read. November keeps these rows clear of 2026-09-10, the day the
 * rate-limit cases count runs inside.
 *
 * **The recorder runs for real rather than being stubbed.** It is the class that writes this column
 * in production, and what is being asserted is that the watch sees a write somebody else made —
 * which a stub could not have made.
 */

describe('AiRunCancellationWatcher', () => {
  describe('#watchAiRunCancellation()', () => {
    describe('when the run is canceled while the watch is running', () => {
      describe('should be truthy', () => {
        const cases = [
          {
            input: {
              aiRunRow: {
                id: 10840001,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
                runKey: 'run-key-10840001',
                requestKey: 'request-key-10840001',
                requestBodyHash: 'request-body-hash-10840001',
                externalRef: 'external-ref-10840001',
                subjectLabel: 'Subject label of run 10840001',
                correlationId: 'correlation-id-10840001',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10840001',
                acceptedAt: new Date('2026-11-06T01:01:01.001Z'),
                startedAt: new Date('2026-11-06T01:01:02.002Z'),
                finishedAt: null,
                cancelRequestedAt: null,
              },
              cancelRequestedAt: new Date('2026-11-06T01:01:11.011Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10840002,
                ApiClientId: 10000002,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
                runKey: 'run-key-10840002',
                requestKey: 'request-key-10840002',
                requestBodyHash: 'request-body-hash-10840002',
                externalRef: 'external-ref-10840002',
                subjectLabel: 'Subject label of run 10840002',
                correlationId: 'correlation-id-10840002',
                callbackUrl: 'https://rotating.client.development.invalid/callbacks/10840002',
                acceptedAt: new Date('2026-11-06T02:02:01.001Z'),
                startedAt: null,
                finishedAt: null,
                cancelRequestedAt: null,
              },
              cancelRequestedAt: new Date('2026-11-06T02:02:22.022Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
          input,
        }) => {
          await AiRun.create(input.aiRunRow) // Arrange

          const watcher = AiRunCancellationWatcher.create({
            watchIntervalMilliseconds: 25,
          })
          const recorder = AiRunStatusRecorder.create()
          const aiRunWorkTerminator = new AbortController()
          const watchTerminator = new AbortController()
          const watchArgs = {
            aiRunId: input.aiRunRow.id,
            aiRunWorkTerminator,
            watchSignal: watchTerminator.signal,
          }
          const saveArgs = {
            aiRunId: input.aiRunRow.id,
            cancelRequestedAt: input.cancelRequestedAt,
          }

          const watched = watcher.watchAiRunCancellation(watchArgs) // Act
          await timersPromises.setTimeout(100)
          await recorder.saveAiRunCancelRequest(saveArgs)
          const received = await watched

          expect(received) // Assert
            .toBeTruthy()
        })
      })

      describe('should raise the work terminator', () => {
        const cases = [
          {
            input: {
              aiRunRow: {
                id: 10840011,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
                runKey: 'run-key-10840011',
                requestKey: 'request-key-10840011',
                requestBodyHash: 'request-body-hash-10840011',
                externalRef: 'external-ref-10840011',
                subjectLabel: 'Subject label of run 10840011',
                correlationId: 'correlation-id-10840011',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/10840011',
                acceptedAt: new Date('2026-11-06T03:03:01.001Z'),
                startedAt: new Date('2026-11-06T03:03:02.002Z'),
                finishedAt: null,
                cancelRequestedAt: null,
              },
              cancelRequestedAt: new Date('2026-11-06T03:03:33.033Z'),
            },
          },
          {
            input: {
              aiRunRow: {
                id: 10840012,
                ApiClientId: 10000002,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
                runKey: 'run-key-10840012',
                requestKey: 'request-key-10840012',
                requestBodyHash: 'request-body-hash-10840012',
                externalRef: 'external-ref-10840012',
                subjectLabel: 'Subject label of run 10840012',
                correlationId: 'correlation-id-10840012',
                callbackUrl: 'https://rotating.client.development.invalid/callbacks/10840012',
                acceptedAt: new Date('2026-11-06T04:04:01.001Z'),
                startedAt: null,
                finishedAt: null,
                cancelRequestedAt: null,
              },
              cancelRequestedAt: new Date('2026-11-06T04:04:44.044Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
          input,
        }) => {
          await AiRun.create(input.aiRunRow) // Arrange

          const watcher = AiRunCancellationWatcher.create({
            watchIntervalMilliseconds: 25,
          })
          const recorder = AiRunStatusRecorder.create()
          const aiRunWorkTerminator = new AbortController()
          const watchTerminator = new AbortController()
          const watchArgs = {
            aiRunId: input.aiRunRow.id,
            aiRunWorkTerminator,
            watchSignal: watchTerminator.signal,
          }
          const saveArgs = {
            aiRunId: input.aiRunRow.id,
            cancelRequestedAt: input.cancelRequestedAt,
          }

          const watched = watcher.watchAiRunCancellation(watchArgs) // Act
          await timersPromises.setTimeout(100)
          await recorder.saveAiRunCancelRequest(saveArgs)
          await watched

          const received = aiRunWorkTerminator.signal.aborted // Assert
          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})
