import AiRunCallbackDeliveryRecorder from '../../../app/aiRunCallback/AiRunCallbackDeliveryRecorder.js'
import AiRunCallbackSender from '../../../app/aiRunCallback/AiRunCallbackSender.js'
import AiRunTerminalCallbackDeliverer from '../../../app/aiRunCallback/AiRunTerminalCallbackDeliverer.js'

import DeliverRunCallbackJobWorker from '../../../app/jobs/deliver-run-callback/DeliverRunCallbackJobWorker.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * `#executeJob()` end to end: it reads the run the body names, posts one attempt and records it,
 * so it writes and belongs here. Every member of this worker that only decides is under
 * `tests/__tests__/app/jobs/deliver-run-callback/DeliverRunCallbackJobWorker.js`.
 *
 * Section 12's eighth acceptance criterion — "a callback that fails to deliver is retried, though
 * a model call in the same run is not" — is two halves, and this file holds one of them: a
 * callback that did not land **raises**, because raising is how BullMQ brings a job back. A worker
 * that answered normally after a `503` would leave the queue believing the job had succeeded, and
 * the seven attempts the dispatcher states would never be reached however generous the number was.
 * The other half is the dispatcher's own option hash, asserted whole in its test.
 *
 * The runs are created here, in `#run-delivery`'s own id block — 10530031 upward — and the network
 * is the one thing mocked. The parcels are stand-ins shaped like the framework's own: what the
 * worker reads off one is `jobModel.job.attemptsStarted`, which is the counter BullMQ raises as it
 * moves a job to active.
 */

describe('DeliverRunCallbackJobWorker', () => {
  describe('#executeJob()', () => {
    describe('should report the attempt that landed', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530031,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530031',
              requestKey: 'request-key-10530031',
              requestBodyHash: 'request-body-hash-10530031',
              externalRef: 'external-ref-10530031',
              subjectLabel: 'Subject label of run 10530031',
              correlationId: 'correlation-id-10530031',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530031',
              acceptedAt: new Date('2026-09-25T14:00:01.001Z'),
              startedAt: new Date('2026-09-25T14:00:02.002Z'),
              finishedAt: new Date('2026-09-25T14:00:03.003Z'),
            },
            executeJobParams: {
              body: {
                aiRunId: 10530031,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 1,
                  },
                },
              },
            },
          },
          mockResponseStatus: 200,
          expected: {
            aiRunId: 10530031,
            attemptIndex: 1,
            httpStatusCode: 200,
            refusalReasonCode: null,
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10530032,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10530032',
              requestKey: 'request-key-10530032',
              requestBodyHash: 'request-body-hash-10530032',
              externalRef: 'external-ref-10530032',
              subjectLabel: 'Subject label of run 10530032',
              correlationId: 'correlation-id-10530032',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530032',
              acceptedAt: new Date('2026-09-25T15:00:01.001Z'),
              startedAt: new Date('2026-09-25T15:00:02.002Z'),
              finishedAt: new Date('2026-09-25T15:00:03.003Z'),
            },
            executeJobParams: {
              body: {
                aiRunId: 10530032,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 4,
                  },
                },
              },
            },
          },
          mockResponseStatus: 204,
          expected: {
            aiRunId: 10530032,
            attemptIndex: 4,
            httpStatusCode: 204,
            refusalReasonCode: null,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.executeJobParams.body.aiRunId', async ({
        input,
        mockResponseStatus,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: mockResponseStatus,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const worker = DeliverRunCallbackJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = await worker.executeJob(input.executeJobParams)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The retry, at the only place a job can ask for one. Every answer that is not a `2xx` raises,
     * a `4xx` included: section 12 says the callback is retried until it lands and draws no line
     * between a client that is down and a client that refused.
     */
    describe('should raise when the callback did not land', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530033,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530033',
              requestKey: 'request-key-10530033',
              requestBodyHash: 'request-body-hash-10530033',
              externalRef: 'external-ref-10530033',
              subjectLabel: 'Subject label of run 10530033',
              correlationId: 'correlation-id-10530033',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530033',
              acceptedAt: new Date('2026-09-25T16:00:01.001Z'),
              startedAt: new Date('2026-09-25T16:00:02.002Z'),
              finishedAt: new Date('2026-09-25T16:00:03.003Z'),
            },
            executeJobParams: {
              body: {
                aiRunId: 10530033,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 1,
                  },
                },
              },
            },
          },
          mockResponseStatus: 503,
          expected: 'DeliverRunCallbackJobWorker#executeJob() a terminal callback did not land: AiRunId 10530033, attemptIndex 1, httpStatusCode 503',
        },
        {
          input: {
            aiRunRow: {
              id: 10530034,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10530034',
              requestKey: 'request-key-10530034',
              requestBodyHash: 'request-body-hash-10530034',
              externalRef: 'external-ref-10530034',
              subjectLabel: 'Subject label of run 10530034',
              correlationId: 'correlation-id-10530034',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530034',
              failureReasonCode: 'PROVIDER_CALL_FAILED',
              acceptedAt: new Date('2026-09-25T17:00:01.001Z'),
              startedAt: new Date('2026-09-25T17:00:02.002Z'),
              finishedAt: new Date('2026-09-25T17:00:03.003Z'),
            },
            executeJobParams: {
              body: {
                aiRunId: 10530034,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 2,
                  },
                },
              },
            },
          },
          mockResponseStatus: 404,
          expected: 'DeliverRunCallbackJobWorker#executeJob() a terminal callback did not land: AiRunId 10530034, attemptIndex 2, httpStatusCode 404',
        },
      ]

      test.each(cases)('aiRunId: $input.executeJobParams.body.aiRunId', async ({
        input,
        mockResponseStatus,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: mockResponseStatus,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const worker = DeliverRunCallbackJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = () => worker.executeJob(input.executeJobParams)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A delivery that raised still leaves its row behind, and that is what makes the retry
     * countable: three attempts at one run are three rows, carrying the indexes the queue was on.
     * A worker that wrote nothing on the attempts that failed would leave every run in the table
     * looking as though it had landed first time.
     */
    describe('should record every attempt, landed or not', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530035,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530035',
              requestKey: 'request-key-10530035',
              requestBodyHash: 'request-body-hash-10530035',
              externalRef: 'external-ref-10530035',
              subjectLabel: 'Subject label of run 10530035',
              correlationId: 'correlation-id-10530035',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530035',
              acceptedAt: new Date('2026-09-25T18:00:01.001Z'),
              startedAt: new Date('2026-09-25T18:00:02.002Z'),
              finishedAt: new Date('2026-09-25T18:00:03.003Z'),
            },
            firstDelivery: {
              body: {
                aiRunId: 10530035,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 1,
                  },
                },
              },
            },
            secondDelivery: {
              body: {
                aiRunId: 10530035,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 2,
                  },
                },
              },
            },
            findParams: {
              aiRunId: 10530035,
              callbackDeliveryCategoryName: 'terminal',
            },
          },
          expected: [
            expect.objectContaining({
              AiRunId: 10530035,
              attemptIndex: 1,
              httpStatusCode: 500,
            }),
            expect.objectContaining({
              AiRunId: 10530035,
              attemptIndex: 2,
              httpStatusCode: 200,
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.findParams.aiRunId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetchFunction = jest.fn()
          .mockResolvedValueOnce(new Response(null, {
            status: 500,
          }))
          .mockResolvedValueOnce(new Response(null, {
            status: 200,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const worker = DeliverRunCallbackJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })
        const recorder = AiRunCallbackDeliveryRecorder.create()

        await expect(() => worker.executeJob(input.firstDelivery))
          .rejects
          .toThrow('DeliverRunCallbackJobWorker#executeJob() a terminal callback did not land: AiRunId 10530035, attemptIndex 1, httpStatusCode 500')
        await worker.executeJob(input.secondDelivery)

        const actual = await recorder.findAiRunCallbackDeliveries(input.findParams)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A refusal answers rather than raising. A callback URL outside the client's registered prefix
     * will read the same on every retry, so a worker that raised here would spend the whole attempt
     * budget on a request that was never made — and the reason it was refused is what the job's
     * result carries instead.
     */
    describe('should answer a refusal without raising a registered URL does not cover', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10530036,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10530036',
              requestKey: 'request-key-10530036',
              requestBodyHash: 'request-body-hash-10530036',
              externalRef: 'external-ref-10530036',
              subjectLabel: 'Subject label of run 10530036',
              correlationId: 'correlation-id-10530036',
              callbackUrl: 'https://elsewhere.client.development.invalid/callbacks/10530036',
              acceptedAt: new Date('2026-09-25T19:00:01.001Z'),
              startedAt: new Date('2026-09-25T19:00:02.002Z'),
              finishedAt: new Date('2026-09-25T19:00:03.003Z'),
            },
            executeJobParams: {
              body: {
                aiRunId: 10530036,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 1,
                  },
                },
              },
            },
          },
          expected: {
            aiRunId: 10530036,
            attemptIndex: 1,
            httpStatusCode: null,
            refusalReasonCode: 'unregistered-callback-url',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.executeJobParams.body.aiRunId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: 200,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)
        jest.spyOn(AiRunTerminalCallbackDeliverer.mentsuLogger, 'error')
          .mockReturnValue(null)

        const worker = DeliverRunCallbackJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = await worker.executeJob(input.executeJobParams)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The other refusal that answers rather than raising, and it wants no row at all: a job
     * body naming a run nothing created. It sits in its own describe because the case above
     * has to write a run first and this one must not, and choosing between them inside one
     * test body would be a conditional in a test.
     */
    describe('should answer a refusal without raising for a run nothing created', () => {
      const cases = [
        {
          input: {
            executeJobParams: {
              body: {
                aiRunId: 10539003,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 2,
                  },
                },
              },
            },
          },
          expected: {
            aiRunId: 10539003,
            attemptIndex: 2,
            httpStatusCode: null,
            refusalReasonCode: 'unknown-ai-run',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.executeJobParams.body.aiRunId', async ({
        input,
        expected,
      }) => {
        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: 200,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)
        jest.spyOn(AiRunTerminalCallbackDeliverer.mentsuLogger, 'error')
          .mockReturnValue(null)

        const worker = DeliverRunCallbackJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = await worker.executeJob(input.executeJobParams)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The three refusals that happen before any run is read. The last of them is the one this
     * worker would otherwise have to guess at: an attempt the queue did not number has no safe
     * index to substitute — a repeated one collides with the row already written under it, and a
     * zero claims an attempt the column's own fixtures say cannot exist.
     */
    describe('should raise before reading a run', () => {
      const cases = [
        {
          input: {
            executeJobParams: {
              body: {
                aiRunId: 'omega',
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 1,
                  },
                },
              },
            },
          },
          expected: 'DeliverRunCallbackJobWorker#executeJob() refused a job body its own schema does not hold',
        },
        {
          input: {
            executeJobParams: {
              body: {},
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 2,
                  },
                },
              },
            },
          },
          expected: 'DeliverRunCallbackJobWorker#executeJob() refused a job body naming no run',
        },
        {
          input: {
            executeJobParams: {
              body: {
                aiRunId: 10530037,
              },
              context: {},
              parcel: {
                jobModel: {
                  job: {
                    attemptsStarted: 0,
                  },
                },
              },
            },
          },
          expected: 'DeliverRunCallbackJobWorker#executeJob() refused a delivery whose attempt the queue did not number: AiRunId 10530037',
        },
      ]

      test.each(cases)('aiRunId: $input.executeJobParams.body.aiRunId', async ({
        input,
        expected,
      }) => {
        const worker = DeliverRunCallbackJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = () => worker.executeJob(input.executeJobParams)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})
