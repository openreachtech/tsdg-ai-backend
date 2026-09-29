import timersPromises from 'node:timers/promises'

import BaseAiRunJobWorker from '../../../app/aiRun/jobs/BaseAiRunJobWorker.js'

import BaseAiRunJobManifest from '../../../app/aiRun/jobs/BaseAiRunJobManifest.js'

import AiRunCancellationWatcher from '../../../app/aiRun/AiRunCancellationWatcher.js'

import AiRunStatusRecorder from '../../../app/aiRun/AiRunStatusRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * The cancellation half of the run lifecycle, asserted against real rows.
 *
 * **Why it is a file of its own rather than more describes in
 * `tests/_orders/AiRun/BaseAiRunJobWorker.js`.** That file hands the worker a recorder of its own
 * and so reads and writes no row at all, which is what makes its position in this folder carry no
 * meaning. Every case here writes an `ai_runs` row with an explicit id, so it belongs below every
 * file that takes an id from the auto-increment — which is a different constraint, and one that
 * would have to be argued for the whole of that file if these cases were added to it.
 *
 * **The recorder runs for real, and that is the point.** What §15's first and fourth acceptance
 * criteria are about is the state the row ends in and the callback that follows it, and a stubbed
 * recorder can only say which method the worker called. The three things asserted below — the
 * status the row carries, the answer that was not written into it, and the work that never ran —
 * are all facts about the database or about the work, and none of them is a delegation.
 *
 * **Every run is created here, in `#run-cancel`'s own id block (`10870001` upward), and accepted in
 * November 2026.** The development seeder's runs are read by `#run-list`'s renderer test, which
 * asserts seven exact run keys of the `107` block ordered by id descending with no id filter, so a
 * row seeded there for the same client would break it. November keeps these rows clear of
 * 2026-09-10, the day the rate-limit cases count runs inside.
 *
 * **What the "stops at a step boundary" cases can and cannot claim.** The boundaries themselves
 * belong to `AiRunMediaCollector` and `AssetMediaReadingFetcher`, and are asserted beside those
 * classes. What is this worker's, and what is asserted here, is that the signal is raised while the
 * work is still in flight and that a work which answered because it was told to stop is recorded
 * canceled rather than succeeded. The work stubbed below stops only when the signal is raised, so a
 * worker that never raised it would hold these cases until the run's time limit rather than pass
 * them.
 */

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * §15's first acceptance criterion, at the row: a queued run that is canceled ends canceled.
     *
     * The run is claimed `running` first and only then asked about, which is deliberate — §11's
     * fifth criterion is that a run moves queued → running → exactly one terminal state, and a
     * worker that checked before claiming would take this run straight from queued to canceled.
     */
    describe('when the run was already asked to stop before its work began', () => {
      describe('should record the run as canceled', () => {
        const cases = [
          {
            params: {
              body: {
                aiRunId: 10870001,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870001',
              requestKey: 'request-key-10870001',
              requestBodyHash: 'request-body-hash-10870001',
              externalRef: 'external-ref-10870001',
              subjectLabel: 'Subject label of run 10870001',
              correlationId: 'correlation-id-10870001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10870001',
              acceptedAt: new Date('2026-11-09T01:01:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-09T01:01:05.005Z'),
            },
            expected: 5, // AI_RUN_STATUS.CANCELED.ID
          },
          {
            params: {
              body: {
                aiRunId: 10870002,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870002,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870002',
              requestKey: 'request-key-10870002',
              requestBodyHash: 'request-body-hash-10870002',
              externalRef: 'external-ref-10870002',
              subjectLabel: 'Subject label of run 10870002',
              correlationId: 'correlation-id-10870002',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10870002',
              acceptedAt: new Date('2026-11-09T02:02:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-09T02:02:06.006Z'),
            },
            expected: 5, // AI_RUN_STATUS.CANCELED.ID
          },
        ]

        test.each(cases)('aiRunId: $params.body.aiRunId', async ({
          params,
          mockAiRunRow,
          expected,
        }) => {
          await AiRun.create(mockAiRunRow) // Arrange

          const worker = new BaseAiRunJobWorker({
            engine: {},
            config: {},
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 30000,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          })
          jest.spyOn(worker, 'executeAiRunWork')
            .mockResolvedValue('{"brand":"alpha"}')

          await worker.executeJob(params) // Act

          const received = await AiRun.findOne({
            where: {
              id: mockAiRunRow.id,
            },
          })

          expect(received.AiRunStatusId) // Assert
            .toBe(expected)
        })
      })

      /*
       * The other half of that criterion, and the half a status alone cannot state: zero model
       * calls. Every model call this service makes is made inside `#executeAiRunWork()`, so a work
       * that was never entered made none.
       */
      describe('should never begin the work', () => {
        const cases = [
          {
            params: {
              body: {
                aiRunId: 10870011,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870011',
              requestKey: 'request-key-10870011',
              requestBodyHash: 'request-body-hash-10870011',
              externalRef: 'external-ref-10870011',
              subjectLabel: 'Subject label of run 10870011',
              correlationId: 'correlation-id-10870011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10870011',
              acceptedAt: new Date('2026-11-09T03:03:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-09T03:03:07.007Z'),
            },
          },
          {
            params: {
              body: {
                aiRunId: 10870012,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870012,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10870012',
              requestKey: 'request-key-10870012',
              requestBodyHash: 'request-body-hash-10870012',
              externalRef: 'external-ref-10870012',
              subjectLabel: 'Subject label of run 10870012',
              correlationId: 'correlation-id-10870012',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10870012',
              acceptedAt: new Date('2026-11-09T04:04:01.001Z'),
              startedAt: new Date('2026-11-09T04:04:02.002Z'),
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-09T04:04:08.008Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $params.body.aiRunId', async ({
          params,
          mockAiRunRow,
        }) => {
          await AiRun.create(mockAiRunRow) // Arrange

          const worker = new BaseAiRunJobWorker({
            engine: {},
            config: {},
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 30000,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          })
          const executeAiRunWorkSpy = jest.spyOn(worker, 'executeAiRunWork')
            .mockResolvedValue('{"brand":"alpha"}')

          await worker.executeJob(params) // Act

          expect(executeAiRunWorkSpy) // Assert
            .not
            .toHaveBeenCalled()
        })
      })

      /*
       * The instant §15's third use case measures to. `cancel_requested_at` is when the client
       * asked and is never overwritten; `canceled_at` is when the run actually stopped, and a run
       * that ended canceled carrying no second instant would leave that measurement with one end.
       */
      describe('should record the instant the run stopped', () => {
        const cases = [
          {
            params: {
              body: {
                aiRunId: 10870021,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870021',
              requestKey: 'request-key-10870021',
              requestBodyHash: 'request-body-hash-10870021',
              externalRef: 'external-ref-10870021',
              subjectLabel: 'Subject label of run 10870021',
              correlationId: 'correlation-id-10870021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10870021',
              acceptedAt: new Date('2026-11-09T05:05:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-09T05:05:09.009Z'),
            },
          },
          {
            params: {
              body: {
                aiRunId: 10870022,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870022,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870022',
              requestKey: 'request-key-10870022',
              requestBodyHash: 'request-body-hash-10870022',
              externalRef: 'external-ref-10870022',
              subjectLabel: 'Subject label of run 10870022',
              correlationId: 'correlation-id-10870022',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10870022',
              acceptedAt: new Date('2026-11-09T06:06:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-09T06:06:10.010Z'),
            },
          },
        ]

        test.each(cases)('aiRunId: $params.body.aiRunId', async ({
          params,
          mockAiRunRow,
        }) => {
          await AiRun.create(mockAiRunRow) // Arrange

          const worker = new BaseAiRunJobWorker({
            engine: {},
            config: {},
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 30000,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          })
          jest.spyOn(worker, 'executeAiRunWork')
            .mockResolvedValue('{"brand":"alpha"}')

          await worker.executeJob(params) // Act

          const received = await AiRun.findOne({
            where: {
              id: mockAiRunRow.id,
            },
          })

          expect(received.canceledAt) // Assert
            .toBeInstanceOf(Date)
        })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * §15's second acceptance criterion, from the worker's end.
     *
     * The run carries no cancellation when its work begins, so the pick-up reading finds nothing
     * and the work is entered. The cancellation is recorded a hundred milliseconds later, by the
     * class that records it in production, while the work is still in flight — which is the one
     * shape a read taken once could not answer.
     *
     * **The work stops only when it is told**, and answers with what it had, which is what both
     * boundaries in this service do. A worker that never raised the signal would hold these cases
     * until the run's time limit rather than pass them, and a worker that raised it but read the
     * run's state from the work's own answer would record them succeeded.
     */
    describe('when the run is asked to stop while its work is in flight', () => {
      describe('should record the run as canceled', () => {
        const cases = [
          {
            params: {
              body: {
                aiRunId: 10870031,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870031,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870031',
              requestKey: 'request-key-10870031',
              requestBodyHash: 'request-body-hash-10870031',
              externalRef: 'external-ref-10870031',
              subjectLabel: 'Subject label of run 10870031',
              correlationId: 'correlation-id-10870031',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10870031',
              acceptedAt: new Date('2026-11-10T01:01:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            mockCancelRequestedAt: new Date('2026-11-10T01:01:11.011Z'),
            expected: 5, // AI_RUN_STATUS.CANCELED.ID
          },
          {
            params: {
              body: {
                aiRunId: 10870032,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870032,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870032',
              requestKey: 'request-key-10870032',
              requestBodyHash: 'request-body-hash-10870032',
              externalRef: 'external-ref-10870032',
              subjectLabel: 'Subject label of run 10870032',
              correlationId: 'correlation-id-10870032',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10870032',
              acceptedAt: new Date('2026-11-10T02:02:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            mockCancelRequestedAt: new Date('2026-11-10T02:02:22.022Z'),
            expected: 5, // AI_RUN_STATUS.CANCELED.ID
          },
        ]

        test.each(cases)('aiRunId: $params.body.aiRunId', async ({
          params,
          mockAiRunRow,
          mockCancelRequestedAt,
          expected,
        }) => {
          await AiRun.create(mockAiRunRow) // Arrange

          const worker = new BaseAiRunJobWorker({
            engine: {},
            config: {},
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 30000,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          })
          jest.spyOn(worker, 'createAiRunCancellationWatcher')
            .mockReturnValue(AiRunCancellationWatcher.create({
              watchIntervalMilliseconds: 25,
            }))
          jest.spyOn(worker, 'executeAiRunWork')
            .mockImplementation(async ({
              signal,
            }) => {
              await new Promise(resolve => {
                signal.addEventListener(
                  'abort',
                  () => resolve(null),
                  {
                    once: true,
                  }
                )
              })

              return '{"partial":"alpha"}'
            })
          const recorder = AiRunStatusRecorder.create()

          const executed = worker.executeJob(params) // Act
          await timersPromises.setTimeout(100)
          await recorder.saveAiRunCancelRequest({
            aiRunId: mockAiRunRow.id,
            cancelRequestedAt: mockCancelRequestedAt,
          })
          await executed

          const received = await AiRun.findOne({
            where: {
              id: mockAiRunRow.id,
            },
          })

          expect(received.AiRunStatusId) // Assert
            .toBe(expected)
        })
      })

      /*
       * What a canceled run does not say. The work came back holding what it had reached before it
       * was told to stop, and writing that into `result_body` would offer a client a fragment as
       * the answer its run produced.
       */
      describe('should not record the answer the stopped work came back with', () => {
        const cases = [
          {
            params: {
              body: {
                aiRunId: 10870041,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870041,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870041',
              requestKey: 'request-key-10870041',
              requestBodyHash: 'request-body-hash-10870041',
              externalRef: 'external-ref-10870041',
              subjectLabel: 'Subject label of run 10870041',
              correlationId: 'correlation-id-10870041',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10870041',
              acceptedAt: new Date('2026-11-10T03:03:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            mockCancelRequestedAt: new Date('2026-11-10T03:03:33.033Z'),
          },
          {
            params: {
              body: {
                aiRunId: 10870042,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870042,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870042',
              requestKey: 'request-key-10870042',
              requestBodyHash: 'request-body-hash-10870042',
              externalRef: 'external-ref-10870042',
              subjectLabel: 'Subject label of run 10870042',
              correlationId: 'correlation-id-10870042',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10870042',
              acceptedAt: new Date('2026-11-10T04:04:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            mockCancelRequestedAt: new Date('2026-11-10T04:04:44.044Z'),
          },
        ]

        test.each(cases)('aiRunId: $params.body.aiRunId', async ({
          params,
          mockAiRunRow,
          mockCancelRequestedAt,
        }) => {
          await AiRun.create(mockAiRunRow) // Arrange

          const worker = new BaseAiRunJobWorker({
            engine: {},
            config: {},
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 30000,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          })
          jest.spyOn(worker, 'createAiRunCancellationWatcher')
            .mockReturnValue(AiRunCancellationWatcher.create({
              watchIntervalMilliseconds: 25,
            }))
          jest.spyOn(worker, 'executeAiRunWork')
            .mockImplementation(async ({
              signal,
            }) => {
              await new Promise(resolve => {
                signal.addEventListener(
                  'abort',
                  () => resolve(null),
                  {
                    once: true,
                  }
                )
              })

              return '{"partial":"beta"}'
            })
          const recorder = AiRunStatusRecorder.create()

          const executed = worker.executeJob(params) // Act
          await timersPromises.setTimeout(100)
          await recorder.saveAiRunCancelRequest({
            aiRunId: mockAiRunRow.id,
            cancelRequestedAt: mockCancelRequestedAt,
          })
          await executed

          const received = await AiRun.findOne({
            where: {
              id: mockAiRunRow.id,
            },
          })

          expect(received.resultBody) // Assert
            .toBeNull()
        })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * §15's fourth acceptance criterion, and the word in it that needed a test: "always".
     *
     * The terminal callback is raised once, below the branch in `#settleAiRun()`, out of the
     * delivery that was accepted as the run's writer. A cancellation settled by an early return
     * from `#executeJob()` would have reached the row and skipped that line, and no run would have
     * looked any different for it — which is why this case asserts the raise rather than the row.
     *
     * The raiser is stubbed because the real one reaches a Redis queue this test has no business
     * opening; what is asserted is the one thing this worker decides, which is that it is called
     * and which run it is called about.
     */
    describe('when a canceled run has been settled', () => {
      describe('should raise the terminal callback', () => {
        const cases = [
          {
            params: {
              body: {
                aiRunId: 10870051,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870051,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870051',
              requestKey: 'request-key-10870051',
              requestBodyHash: 'request-body-hash-10870051',
              externalRef: 'external-ref-10870051',
              subjectLabel: 'Subject label of run 10870051',
              correlationId: 'correlation-id-10870051',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10870051',
              acceptedAt: new Date('2026-11-11T01:01:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-11T01:01:05.005Z'),
            },
            expected: {
              aiRunId: 10870051,
            },
          },
          {
            params: {
              body: {
                aiRunId: 10870052,
              },
              context: {},
              parcel: {},
            },
            mockAiRunRow: {
              id: 10870052,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10870052',
              requestKey: 'request-key-10870052',
              requestBodyHash: 'request-body-hash-10870052',
              externalRef: 'external-ref-10870052',
              subjectLabel: 'Subject label of run 10870052',
              correlationId: 'correlation-id-10870052',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10870052',
              acceptedAt: new Date('2026-11-11T02:02:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-11T02:02:06.006Z'),
            },
            expected: {
              aiRunId: 10870052,
            },
          },
        ]

        test.each(cases)('aiRunId: $params.body.aiRunId', async ({
          params,
          mockAiRunRow,
          expected,
        }) => {
          await AiRun.create(mockAiRunRow) // Arrange

          const worker = new BaseAiRunJobWorker({
            engine: {},
            config: {},
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 30000,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          })
          const raiseTerminalCallback = jest.fn()
            .mockResolvedValue(null)
          jest.spyOn(worker, 'createAiRunTerminalCallbackRaiser')
            .mockReturnValue({
              raiseTerminalCallback,
            })
          jest.spyOn(worker, 'executeAiRunWork')
            .mockResolvedValue('{"brand":"alpha"}')

          await worker.executeJob(params) // Act

          expect(raiseTerminalCallback) // Assert
            .toHaveBeenCalledWith(expected)
        })
      })
    })
  })
})
