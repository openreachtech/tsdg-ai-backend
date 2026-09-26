import {
  BaseJobWorker,
} from '@openreachtech/renchan-job-bullmq'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import BaseAiRunJobWorker from '../../../../../app/aiRun/jobs/BaseAiRunJobWorker.js'

import AiRunCallbackSender from '../../../../../app/aiRunCallback/AiRunCallbackSender.js'
import AiRunTerminalCallbackDeliverer from '../../../../../app/aiRunCallback/AiRunTerminalCallbackDeliverer.js'

import DeliverRunCallbackJobManifest from '../../../../../app/jobs/deliver-run-callback/DeliverRunCallbackJobManifest.js'
import DeliverRunCallbackJobWorker from '../../../../../app/jobs/deliver-run-callback/DeliverRunCallbackJobWorker.js'

/*
 * The members of the callback worker that decide rather than deliver. `#executeJob()` reads a run
 * and writes a delivery row, so it is exercised under `tests/_orders/AiRunCallback/` instead.
 *
 * The engines handed in are plain stubs: this worker never reaches the queue in these cases, and
 * `.create()` asks an engine for two things only — the worker config and the error hash.
 */

describe('DeliverRunCallbackJobWorker', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = DeliverRunCallbackJobWorker.prototype

      expect(received)
        .toBeInstanceOf(BaseJobWorker)
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('inheritance', () => {
    /*
     * A callback delivery is not a run's lifecycle. `BaseAiRunJobWorker` claims a run running,
     * races it against the 300-second limit and writes exactly one terminal state; a delivery
     * writes no run status at all — the run it is about has already settled, and section 10's
     * first criterion is that a run never leaves a terminal state. A worker inheriting that
     * lifecycle would have to override the whole of `#executeJob()` to escape it, and would still
     * carry a claim and a race that could never run.
     */
    test('should not be an AI run job worker', () => {
      const received = DeliverRunCallbackJobWorker.prototype

      expect(received)
        .not
        .toBeInstanceOf(BaseAiRunJobWorker)
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunTerminalCallbackDeliverer', () => {
        const cases = [
          {
            input: {
              requestTimeoutMilliseconds: 10000,
            },
          },
          {
            input: {
              requestTimeoutMilliseconds: 250,
            },
          },
        ]

        test.each(cases)('requestTimeoutMilliseconds: $input.requestTimeoutMilliseconds', ({
          input,
        }) => {
          const aiRunTerminalCallbackDeliverer = AiRunTerminalCallbackDeliverer.create({
            aiRunCallbackSender: AiRunCallbackSender.create({
              requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
            }),
          })
          const worker = new DeliverRunCallbackJobWorker({
            engine: {}, // Fill the unrelated required argument with a neutral value
            config: {}, // Fill the unrelated required argument with a neutral value
            manifest: DeliverRunCallbackJobManifest.create(),
            dispatcherHash: {}, // Fill the unrelated required argument with a neutral value
            errorHash: {}, // Fill the unrelated required argument with a neutral value
            aiRunTerminalCallbackDeliverer,
          })

          expect(worker)
            .toHaveProperty('aiRunTerminalCallbackDeliverer', aiRunTerminalCallbackDeliverer)
        })
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/alpha/jobs',
                connection: {},
              }),
              Error: {},
            },
            aiRunTerminalCallbackDeliverer: AiRunTerminalCallbackDeliverer.create(),
          },
        },
        {
          input: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/beta/jobs',
                connection: {},
              }),
              Error: {},
            },
            aiRunTerminalCallbackDeliverer: AiRunTerminalCallbackDeliverer.create(),
          },
        },
      ]

      test.each(cases)('workersPath: $input.engine.buildWorkerConfig().workersPath', ({
        input,
      }) => {
        const actual = DeliverRunCallbackJobWorker.create(input)

        expect(actual)
          .toBeInstanceOf(DeliverRunCallbackJobWorker)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/alpha/jobs',
                connection: {},
              }),
              Error: {},
            },
            aiRunTerminalCallbackDeliverer: AiRunTerminalCallbackDeliverer.create(),
          },
          expected: expect.objectContaining({
            config: {
              workersPath: '/alpha/jobs',
              connection: {},
            },
            dispatcherHash: {},
            errorHash: {},
            aiRunTerminalCallbackDeliverer: expect.any(AiRunTerminalCallbackDeliverer),
          }),
        },
        {
          input: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/beta/jobs',
                connection: {},
              }),
              Error: {},
            },
            aiRunTerminalCallbackDeliverer: AiRunTerminalCallbackDeliverer.create(),
          },
          expected: expect.objectContaining({
            config: {
              workersPath: '/beta/jobs',
              connection: {},
            },
            dispatcherHash: {},
            errorHash: {},
            aiRunTerminalCallbackDeliverer: expect.any(AiRunTerminalCallbackDeliverer),
          }),
        },
      ]

      test.each(cases)('workersPath: $input.engine.buildWorkerConfig().workersPath', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(DeliverRunCallbackJobWorker)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('.create()', () => {
    describe('should fill default aiRunTerminalCallbackDeliverer', () => {
      test('with no deliverer', () => {
        const input = {
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/gamma/jobs',
              connection: {},
            }),
            Error: {},
          },
          // aiRunTerminalCallbackDeliverer: omitted → default AiRunTerminalCallbackDeliverer
        }
        const expected = expect.objectContaining({
          aiRunTerminalCallbackDeliverer: expect.any(AiRunTerminalCallbackDeliverer),
        })

        const SpyClass = constructorSpy.spyOn(DeliverRunCallbackJobWorker)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = DeliverRunCallbackJobWorker.ManifestCtor

        expect(actual)
          .toBe(DeliverRunCallbackJobManifest) // same reference
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('.get:AiRunTerminalCallbackDelivererCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = DeliverRunCallbackJobWorker.AiRunTerminalCallbackDelivererCtor

        expect(actual)
          .toBe(AiRunTerminalCallbackDeliverer) // same reference
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('.get:mentsuLogger', () => {
    describe('when called as is', () => {
      test('should be a MentsuLogger', () => {
        const actual = DeliverRunCallbackJobWorker.mentsuLogger

        expect(actual)
          .toBeInstanceOf(MentsuLogger)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('.createAiRunTerminalCallbackDeliverer()', () => {
    describe('when called as is', () => {
      test('should be an AiRunTerminalCallbackDeliverer', () => {
        const actual = DeliverRunCallbackJobWorker.createAiRunTerminalCallbackDeliverer()

        expect(actual)
          .toBeInstanceOf(AiRunTerminalCallbackDeliverer)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#get:Ctor', () => {
    describe('should answer own constructor', () => {
      const cases = [
        {
          input: {
            WorkerCtor: DeliverRunCallbackJobWorker,
          },
        },
        {
          input: {
            WorkerCtor: class AlphaDeliverRunCallbackJobWorker extends DeliverRunCallbackJobWorker {},
          },
        },
      ]

      test.each(cases)('WorkerCtor: $input.WorkerCtor.name', ({
        input,
      }) => {
        const worker = input.WorkerCtor.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = worker.Ctor

        expect(actual)
          .toBe(input.WorkerCtor) // same reference
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#isValidJobBody()', () => {
    /*
     * The schema states the kind of a declared field, not that the field has to be there — so an
     * empty body passes here and is refused by name in `#executeJob()`. A body carrying keys
     * nobody declared passes too, which is why the worker reads one field out of it rather than
     * handing the body on.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            body: {
              aiRunId: 10530021,
            },
          },
        },
        {
          input: {
            body: {},
          },
        },
        {
          input: {
            body: {
              aiRunId: 10530022,
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530022',
            },
          },
        },
      ]

      test.each(cases)('aiRunId: $input.body.aiRunId', ({
        input,
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

        const actual = worker.isValidJobBody(input)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            body: {
              aiRunId: 'omega',
            },
          },
        },
        {
          input: {
            body: null,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.body.aiRunId', ({
        input,
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

        const actual = worker.isValidJobBody(input)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#createJobBody()', () => {
    describe('should keep the body it was given', () => {
      const cases = [
        {
          input: {
            body: {
              aiRunId: 10530021,
            },
          },
          expected: {
            aiRunId: 10530021,
          },
        },
        {
          input: {
            body: {
              aiRunId: 10530022,
            },
          },
          expected: {
            aiRunId: 10530022,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.body.aiRunId', ({
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

        const jobBody = worker.createJobBody(input)
        const actual = jobBody.normalizedBody

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#extractAiRunId()', () => {
    describe('should answer the run the body names', () => {
      const cases = [
        {
          input: {
            body: {
              aiRunId: 10530021,
            },
          },
          expected: 10530021,
        },
        {
          input: {
            body: {
              aiRunId: 10530022,
            },
          },
          expected: 10530022,
        },
      ]

      test.each(cases)('aiRunId: $input.body.aiRunId', ({
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

        const actual = worker.extractAiRunId(input)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null', () => {
      const cases = [
        {
          input: {
            body: {},
          },
        },
        {
          input: {
            body: {
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10530023',
            },
          },
        },
        {
          input: {
            body: null,
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.body.callbackUrl', ({
        input,
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

        const actual = worker.extractAiRunId(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#extractAttemptIndex()', () => {
    /*
     * The index a delivery row carries comes from the queue, never from a count of the rows
     * already written: two workers retrying one run would each read the same count and claim the
     * same index, which the table's unique triple would refuse.
     *
     * `attemptsStarted` is what BullMQ raises as it moves a job to active, so the first attempt
     * reads 1 while it is running. `attemptsMade` is raised when an attempt *finishes* and reads 0
     * throughout the first one — the case below carrying both is what keeps the wrong one from
     * being read.
     */
    describe('should answer the attempt the queue is on', () => {
      const cases = [
        {
          input: {
            parcel: {
              jobModel: {
                job: {
                  attemptsStarted: 1,
                  attemptsMade: 0,
                },
              },
            },
          },
          expected: 1,
        },
        {
          input: {
            parcel: {
              jobModel: {
                job: {
                  attemptsStarted: 3,
                  attemptsMade: 2,
                },
              },
            },
          },
          expected: 3,
        },
        {
          input: {
            parcel: {
              jobModel: {
                job: {
                  attemptsStarted: 7,
                  attemptsMade: 6,
                },
              },
            },
          },
          expected: 7,
        },
      ]

      test.each(cases)('attemptsStarted: $input.parcel.jobModel.job.attemptsStarted', ({
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

        const actual = worker.extractAttemptIndex(input)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null', () => {
      const cases = [
        {
          input: {
            parcel: {
              jobModel: {
                job: {
                  attemptsStarted: 0,
                },
              },
            },
          },
        },
        {
          input: {
            parcel: {
              jobModel: {
                job: {
                  attemptsStarted: -1,
                },
              },
            },
          },
        },
        {
          input: {
            parcel: {
              jobModel: {
                job: {
                  attemptsStarted: 1.5,
                },
              },
            },
          },
        },
        {
          input: {
            parcel: {
              jobModel: {
                job: {
                  attemptsStarted: '2',
                },
              },
            },
          },
        },
        {
          input: {
            parcel: {
              jobModel: {
                job: {},
              },
            },
          },
        },
      ]

      test.each(cases)('attemptsStarted: $input.parcel.jobModel.job.attemptsStarted', ({
        input,
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

        const actual = worker.extractAttemptIndex(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#shouldRetryTerminalCallback()', () => {
    /*
     * Section 12's eighth acceptance criterion, as one decision: an attempt that was made and did
     * not land brings the job back. This is the half of the criterion the worker owns — the other
     * is the attempt count in the dispatcher, and neither works without the other.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            outcome: {
              hasAttempted: true,
              hasDelivered: false,
              httpStatusCode: 503,
              refusalReasonCode: null,
            },
          },
        },
        {
          input: {
            outcome: {
              hasAttempted: true,
              hasDelivered: false,
              httpStatusCode: 404,
              refusalReasonCode: null,
            },
          },
        },
        {
          input: {
            outcome: {
              hasAttempted: true,
              hasDelivered: false,
              httpStatusCode: null,
              refusalReasonCode: null,
            },
          },
        },
      ]

      test.each(cases)('httpStatusCode: $input.outcome.httpStatusCode', ({
        input,
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

        const actual = worker.shouldRetryTerminalCallback(input)

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * A refusal reads the same on every retry — a URL outside the client's registered prefix does
     * not come inside it a minute later — so retrying it would spend the whole budget on a request
     * that was never made.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            outcome: {
              hasAttempted: true,
              hasDelivered: true,
              httpStatusCode: 200,
              refusalReasonCode: null,
            },
          },
        },
        {
          input: {
            outcome: {
              hasAttempted: true,
              hasDelivered: true,
              httpStatusCode: 204,
              refusalReasonCode: null,
            },
          },
        },
        {
          input: {
            outcome: {
              hasAttempted: false,
              hasDelivered: false,
              httpStatusCode: null,
              refusalReasonCode: 'unregistered-callback-url',
            },
          },
        },
      ]

      test.each(cases)('refusalReasonCode: $input.outcome.refusalReasonCode', ({
        input,
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

        const actual = worker.shouldRetryTerminalCallback(input)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#buildAiRunCallbackJobResult()', () => {
    /*
     * The framework stores this in Redis, so it carries four small fields and never the body that
     * was posted — that is the client's own result, and the queue's store is not where it belongs.
     */
    describe('should report what the attempt came to', () => {
      const cases = [
        {
          input: {
            aiRunId: 10530021,
            attemptIndex: 1,
            outcome: {
              hasAttempted: true,
              hasDelivered: true,
              httpStatusCode: 200,
              refusalReasonCode: null,
            },
          },
          expected: {
            aiRunId: 10530021,
            attemptIndex: 1,
            httpStatusCode: 200,
            refusalReasonCode: null,
          },
        },
        {
          input: {
            aiRunId: 10530022,
            attemptIndex: 4,
            outcome: {
              hasAttempted: false,
              hasDelivered: false,
              httpStatusCode: null,
              refusalReasonCode: 'unregistered-callback-url',
            },
          },
          expected: {
            aiRunId: 10530022,
            attemptIndex: 4,
            httpStatusCode: null,
            refusalReasonCode: 'unregistered-callback-url',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
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

        const actual = worker.buildAiRunCallbackJobResult(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#onJobCompleted()', () => {
    describe('should write the line the queue reported', () => {
      const cases = [
        {
          input: {
            jobModel: {},
            result: {
              aiRunId: 10530021,
            },
            previousStatus: 'active',
          },
          expected: {
            message: 'DeliverRunCallbackJobWorker a delivery completed: active',
            tags: [
              'DeliverRunCallbackJob',
              'CompletedDelivery',
            ],
          },
        },
        {
          input: {
            jobModel: {},
            result: {
              aiRunId: 10530022,
            },
            previousStatus: 'waiting',
          },
          expected: {
            message: 'DeliverRunCallbackJobWorker a delivery completed: waiting',
            tags: [
              'DeliverRunCallbackJob',
              'CompletedDelivery',
            ],
          },
        },
      ]

      test.each(cases)('previousStatus: $input.previousStatus', ({
        input,
        expected,
      }) => {
        const logSpy = jest.spyOn(DeliverRunCallbackJobWorker.mentsuLogger, 'log')
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

        worker.onJobCompleted(input)

        expect(logSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#onJobFailed()', () => {
    /*
     * Every attempt that did not land arrives here, which is what an operator counts while a
     * client's endpoint is down. What is written is the queue's own status and the error's class —
     * never the message, which is composed elsewhere and can quote a callback URL.
     */
    describe('should write the line the queue reported', () => {
      const cases = [
        {
          input: {
            jobModel: {},
            error: new Error('DeliverRunCallbackJobWorker#executeJob() a terminal callback did not land: AiRunId 10530021, attemptIndex 1, httpStatusCode 503'),
            previousStatus: 'active',
          },
          expected: {
            message: 'DeliverRunCallbackJobWorker a delivery failed: active, Error',
            tags: [
              'DeliverRunCallbackJob',
              'FailedDelivery',
            ],
          },
        },
        {
          input: {
            jobModel: {},
            error: new TypeError('fetch failed'),
            previousStatus: 'waiting',
          },
          expected: {
            message: 'DeliverRunCallbackJobWorker a delivery failed: waiting, TypeError',
            tags: [
              'DeliverRunCallbackJob',
              'FailedDelivery',
            ],
          },
        },
      ]

      test.each(cases)('previousStatus: $input.previousStatus', ({
        input,
        expected,
      }) => {
        const errorLogSpy = jest.spyOn(DeliverRunCallbackJobWorker.mentsuLogger, 'error')
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

        worker.onJobFailed(input)

        expect(errorLogSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#extractErrorName()', () => {
    describe('should answer the class a delivery failed with', () => {
      const cases = [
        {
          input: {
            error: new Error('a terminal callback did not land'),
          },
          expected: 'Error',
        },
        {
          input: {
            error: new TypeError('fetch failed'),
          },
          expected: 'TypeError',
        },
        {
          input: {
            error: new DOMException('The operation was aborted', 'TimeoutError'),
          },
          expected: 'TimeoutError',
        },
        {
          input: {
            error: 'omega', // a thrown string carries no class of its own
          },
          expected: 'Error',
        },
        {
          input: {
            error: null,
          },
          expected: 'Error',
        },
      ]

      test.each(cases)('error: $input.error', ({
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

        const actual = worker.extractErrorName(input)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#onJobProgress()', () => {
    /*
     * A callback is one request, and nothing subscribes to this service's queues — so there is
     * nothing to publish between its start and its end.
     */
    describe('should answer null', () => {
      const cases = [
        {
          input: {
            jobModel: {},
            progress: 10,
          },
        },
        {
          input: {
            jobModel: {},
            progress: 'omega',
          },
        },
      ]

      test.each(cases)('progress: $input.progress', ({
        input,
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

        const actual = worker.onJobProgress(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('DeliverRunCallbackJobWorker', () => {
  describe('#onWorkerError()', () => {
    describe('should write the line naming the class', () => {
      const cases = [
        {
          input: {
            error: new Error('Connection is closed'),
          },
          expected: {
            message: 'DeliverRunCallbackJobWorker the worker errored: Error',
            tags: [
              'DeliverRunCallbackJob',
              'WorkerError',
            ],
          },
        },
        {
          input: {
            error: new RangeError('Maximum call stack size exceeded'),
          },
          expected: {
            message: 'DeliverRunCallbackJobWorker the worker errored: RangeError',
            tags: [
              'DeliverRunCallbackJob',
              'WorkerError',
            ],
          },
        },
      ]

      test.each(cases)('error: $input.error.name', ({
        input,
        expected,
      }) => {
        const errorLogSpy = jest.spyOn(DeliverRunCallbackJobWorker.mentsuLogger, 'error')
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

        worker.onWorkerError(input)

        expect(errorLogSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
