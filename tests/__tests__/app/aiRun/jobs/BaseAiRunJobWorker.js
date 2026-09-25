import {
  BaseJobWorker,
  ConcreteMemberNotFoundJobError,
} from '@openreachtech/renchan-job-bullmq'

import BaseAiRunJobWorker from '../../../../../app/aiRun/jobs/BaseAiRunJobWorker.js'

import AiRunStatusRecorder from '../../../../../app/aiRun/AiRunStatusRecorder.js'

describe('BaseAiRunJobWorker', () => {
  describe('super class', () => {
    test('to be instance of BaseJobWorker', () => {
      const received = BaseAiRunJobWorker.prototype

      expect(received)
        .toBeInstanceOf(BaseJobWorker)
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#runTimeLimitMilliseconds', () => {
        const cases = [
          {
            input: {
              engine: {},
              config: {},
              manifest: {},
              dispatcherHash: {},
              errorHash: {},
              runTimeLimitMilliseconds: 300000,
              aiRunStatusRecorder: AiRunStatusRecorder.create(),
            },
            expected: 300000,
          },
          {
            input: {
              engine: {},
              config: {},
              manifest: {},
              dispatcherHash: {},
              errorHash: {},
              runTimeLimitMilliseconds: 25,
              aiRunStatusRecorder: AiRunStatusRecorder.create(),
            },
            expected: 25,
          },
        ]

        test.each(cases)('runTimeLimitMilliseconds: $input.runTimeLimitMilliseconds', ({
          input,
          expected,
        }) => {
          const worker = new BaseAiRunJobWorker(input)

          expect(worker)
            .toHaveProperty('runTimeLimitMilliseconds', expected)
        })
      })

      describe('#aiRunStatusRecorder', () => {
        const cases = [
          {
            input: {
              engine: {},
              config: {},
              manifest: {},
              dispatcherHash: {},
              errorHash: {},
              runTimeLimitMilliseconds: 300000,
              aiRunStatusRecorder: AiRunStatusRecorder.create(),
            },
          },
          {
            input: {
              engine: {},
              config: {},
              manifest: {},
              dispatcherHash: {},
              errorHash: {},
              runTimeLimitMilliseconds: 75,
              aiRunStatusRecorder: AiRunStatusRecorder.create(),
            },
          },
        ]

        test.each(cases)('runTimeLimitMilliseconds: $input.runTimeLimitMilliseconds', ({
          input,
        }) => {
          const worker = new BaseAiRunJobWorker(input)

          expect(worker)
            .toHaveProperty('aiRunStatusRecorder', input.aiRunStatusRecorder)
        })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/alpha/jobs',
                connection: {},
              }),
              Error: {},
              timber: {
                log: () => null,
                error: () => null,
              },
            },
            manifest: {},
            runTimeLimitMilliseconds: 300000,
          },
        },
        {
          factoryParams: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/beta/jobs',
                connection: {},
              }),
              Error: {},
              timber: {
                log: () => null,
                error: () => null,
              },
            },
            manifest: {},
            runTimeLimitMilliseconds: 15,
          },
        },
      ]

      test.each(cases)('runTimeLimitMilliseconds: $factoryParams.runTimeLimitMilliseconds', ({
        factoryParams,
      }) => {
        const received = BaseAiRunJobWorker.create(factoryParams)

        expect(received)
          .toBeInstanceOf(BaseAiRunJobWorker)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          factoryParams: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/alpha/jobs',
                connection: {},
              }),
              Error: {},
              timber: {
                log: () => null,
                error: () => null,
              },
            },
            manifest: {},
            runTimeLimitMilliseconds: 300000,
          },
          expected: expect.objectContaining({
            config: {
              workersPath: '/alpha/jobs',
              connection: {},
            },
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 300000,
            aiRunStatusRecorder: expect.any(AiRunStatusRecorder),
          }),
        },
        {
          factoryParams: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/beta/jobs',
                connection: {},
              }),
              Error: {},
              timber: {
                log: () => null,
                error: () => null,
              },
            },
            manifest: {},
            runTimeLimitMilliseconds: 15,
          },
          expected: expect.objectContaining({
            config: {
              workersPath: '/beta/jobs',
              connection: {},
            },
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 15,
            aiRunStatusRecorder: expect.any(AiRunStatusRecorder),
          }),
        },
      ]

      test.each(cases)('runTimeLimitMilliseconds: $factoryParams.runTimeLimitMilliseconds', ({
        factoryParams,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(BaseAiRunJobWorker)

        SpyClass.create(factoryParams)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    /*
     * The run time limit the non-functional section fixes: 300 seconds, as milliseconds.
     *
     * It is asserted here rather than read off a constant the class exports, so that a limit
     * quietly loosened to ten minutes fails a test instead of passing one that recomputed itself.
     */
    describe('should use default runTimeLimitMilliseconds value', () => {
      test('with no limit stated', () => {
        const factoryParams = {
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
            timber: {
              log: () => null,
              error: () => null,
            },
          },
          manifest: {},
        }

        const actual = BaseAiRunJobWorker.create(factoryParams)

        expect(actual)
          .toHaveProperty('runTimeLimitMilliseconds', 300000)
      })
    })

    describe('should use default aiRunStatusRecorder value', () => {
      test('with no recorder stated', () => {
        const factoryParams = {
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
            timber: {
              log: () => null,
              error: () => null,
            },
          },
          manifest: {},
        }
        const createAiRunStatusRecorderSpy = jest.spyOn(BaseAiRunJobWorker, 'createAiRunStatusRecorder')

        const actual = BaseAiRunJobWorker.create(factoryParams)

        expect(createAiRunStatusRecorderSpy)
          .toHaveBeenCalledWith()
        expect(actual.aiRunStatusRecorder)
          .toBeInstanceOf(AiRunStatusRecorder)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('.get:AiRunStatusRecorderCtor', () => {
    test('should be the recorder that moves a run between statuses', () => {
      const expected = AiRunStatusRecorder

      const actual = BaseAiRunJobWorker.AiRunStatusRecorderCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('.createAiRunStatusRecorder()', () => {
    test('should create the recorder', () => {
      const actual = BaseAiRunJobWorker.createAiRunStatusRecorder()

      expect(actual)
        .toBeInstanceOf(AiRunStatusRecorder)
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#extractAiRunId()', () => {
    describe('should extract the run the body names', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300001,
            },
          },
          expected: 10300001,
        },
        {
          params: {
            body: {
              aiRunId: 10300002,
            },
          },
          expected: 10300002,
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.extractAiRunId(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#extractAiRunId()', () => {
    /*
     * A body that failed its schema arrives as null from the framework, and a body carrying some
     * other field is the same defect seen from here. Both answer null, and `#executeJob()` refuses
     * by name instead of faulting on a property read three methods deeper.
     */
    describe('should answer null for a body naming no run', () => {
      const cases = [
        {
          params: {
            body: null,
          },
          label: 'a body that failed its schema',
        },
        {
          params: {
            body: {},
          },
          label: 'a body carrying no field at all',
        },
        {
          params: {
            body: {
              runKey: 'alpha-run-key',
            },
          },
          label: 'a body carrying the run key instead of the id',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.extractAiRunId(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#buildCurrentInstant()', () => {
    describe('should build an instant', () => {
      const cases = [
        {
          factoryParams: {
            engine: {},
            config: {},
            manifest: {},
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 300000,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          },
        },
        {
          factoryParams: {
            engine: {},
            config: {},
            manifest: {},
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 40,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          },
        },
      ]

      test.each(cases)('runTimeLimitMilliseconds: $factoryParams.runTimeLimitMilliseconds', ({
        factoryParams,
      }) => {
        const worker = new BaseAiRunJobWorker(factoryParams)

        const actual = worker.buildCurrentInstant()

        expect(actual)
          .toBeInstanceOf(Date)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#buildAiRunJobResult()', () => {
    describe('should carry the three fields the queue stores', () => {
      const cases = [
        {
          params: {
            aiRunId: 10300011,
            failureReasonCode: null,
            hasSettled: true,
          },
          expected: {
            aiRunId: 10300011,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
        {
          params: {
            aiRunId: 10300012,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            hasSettled: true,
          },
          expected: {
            aiRunId: 10300012,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            hasSettled: true,
          },
        },
        {
          params: {
            aiRunId: 10300013,
            failureReasonCode: null,
            hasSettled: false,
          },
          expected: {
            aiRunId: 10300013,
            failureReasonCode: null,
            hasSettled: false,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.buildAiRunJobResult(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeAiRunWork()', () => {
    /*
     * The one member a concrete job fills in. It fails the way the framework's own abstract members
     * fail, so a job that forgot it is told which member it forgot rather than answering `undefined`
     * and settling a run with an empty result.
     */
    describe('should stay abstract', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300021,
            },
            context: {},
            parcel: {},
          },
        },
        {
          params: {
            body: {
              aiRunId: 10300022,
            },
            context: {},
            parcel: {},
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = () => worker.executeAiRunWork(params)

        await expect(actual)
          .rejects
          .toThrow(ConcreteMemberNotFoundJobError)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#extractAiRunFailureReasonCode()', () => {
    /*
     * Every failed run must carry one of the seven codes the client contract fixes, and a job that
     * has not classified its own failures still has to leave one. `PROVIDER_CALL_FAILED` is that
     * answer, and a job that can tell a media fetch from a provider call overrides this.
     */
    describe('should answer the code an unclassified failure is recorded under', () => {
      const cases = [
        {
          params: {
            error: new Error('the provider answered 503'),
          },
          expected: 'PROVIDER_CALL_FAILED',
        },
        {
          params: {
            error: new Error('the response carried no content'),
          },
          expected: 'PROVIDER_CALL_FAILED',
        },
      ]

      test.each(cases)('error: $params.error', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.extractAiRunFailureReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#waitOutRunTimeLimit()', () => {
    describe('should resolve once the limit it was created with has passed', () => {
      const cases = [
        {
          factoryParams: {
            engine: {},
            config: {},
            manifest: {},
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 1,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          },
          expected: 1,
        },
        {
          factoryParams: {
            engine: {},
            config: {},
            manifest: {},
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 5,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          },
          expected: 5,
        },
      ]

      test.each(cases)('runTimeLimitMilliseconds: $factoryParams.runTimeLimitMilliseconds', async ({
        factoryParams,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker(factoryParams)

        const actual = await worker.waitOutRunTimeLimit()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#buildTimeLimitOutcome()', () => {
    /*
     * Section 11's fourth acceptance criterion: a run still running past the time limit ends as
     * failed, carrying the time-limit reason code. This is the outcome that carries it.
     */
    describe('should carry the time-limit reason code', () => {
      const cases = [
        {
          factoryParams: {
            engine: {},
            config: {},
            manifest: {},
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 1,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          },
          expected: {
            resultBody: null,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
          },
        },
        {
          factoryParams: {
            engine: {},
            config: {},
            manifest: {},
            dispatcherHash: {},
            errorHash: {},
            runTimeLimitMilliseconds: 4,
            aiRunStatusRecorder: AiRunStatusRecorder.create(),
          },
          expected: {
            resultBody: null,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('runTimeLimitMilliseconds: $factoryParams.runTimeLimitMilliseconds', async ({
        factoryParams,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker(factoryParams)

        const actual = await worker.buildTimeLimitOutcome()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#buildAiRunWorkOutcome()', () => {
    describe('should carry the result the work settled', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300031,
            },
            context: {},
            parcel: {},
          },
          mockResultBody: '{"brand":"alpha"}',
          expected: {
            resultBody: '{"brand":"alpha"}',
            failureReasonCode: null,
            failureParameters: null,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10300032,
            },
            context: {},
            parcel: {},
          },
          mockResultBody: null,
          expected: {
            resultBody: null,
            failureReasonCode: null,
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        mockResultBody,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue(mockResultBody)

        const actual = await worker.buildAiRunWorkOutcome(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#buildAiRunWorkOutcome()', () => {
    /*
     * A work that threw becomes an outcome rather than an exception, because the failure has to be
     * recorded before anything else sees it — a run whose worker threw and wrote nothing would sit
     * at running until its retention sweep, and the client system would wait on a callback that
     * never comes.
     */
    describe('should turn a work that threw into a failure outcome', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300041,
            },
            context: {},
            parcel: {},
          },
          mockError: new Error('the provider answered 503'),
          expected: {
            resultBody: null,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            failureParameters: null,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10300042,
            },
            context: {},
            parcel: {},
          },
          mockError: new Error('the medium could not be fetched'),
          expected: {
            resultBody: null,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        mockError,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {
            timber: {
              log: () => null,
              error: () => null,
            },
          },
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockRejectedValue(mockError)

        const actual = await worker.buildAiRunWorkOutcome(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#raceAiRunWorkAgainstTimeLimit()', () => {
    describe('should answer the work outcome when the work finishes inside the limit', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300051,
            },
            context: {},
            parcel: {},
          },
          mockResultBody: '{"brand":"alpha"}',
          expected: {
            resultBody: '{"brand":"alpha"}',
            failureReasonCode: null,
            failureParameters: null,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10300052,
            },
            context: {},
            parcel: {},
          },
          mockResultBody: '{"brand":"beta"}',
          expected: {
            resultBody: '{"brand":"beta"}',
            failureReasonCode: null,
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        mockResultBody,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue(mockResultBody)

        const actual = await worker.raceAiRunWorkAgainstTimeLimit(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#raceAiRunWorkAgainstTimeLimit()', () => {
    /*
     * The work here never settles at all, which is the shape the limit exists for: a run that holds
     * a worker indefinitely. The limit answers instead, and its reason code is what the row ends up
     * carrying.
     */
    describe('should answer the time-limit outcome when the work runs past the limit', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300061,
            },
            context: {},
            parcel: {},
          },
          expected: {
            resultBody: null,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10300062,
            },
            context: {},
            parcel: {},
          },
          expected: {
            resultBody: null,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 1,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockReturnValue(new Promise(() => {
            // A run that holds a worker indefinitely: nothing here ever settles it.
          }))

        const actual = await worker.raceAiRunWorkAgainstTimeLimit(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#onJobCompleted()', () => {
    describe('should record nothing', () => {
      const cases = [
        {
          params: {
            jobModel: {},
            result: {
              aiRunId: 10300071,
            },
            previousStatus: 'active',
          },
        },
        {
          params: {
            jobModel: {},
            result: {
              aiRunId: 10300072,
            },
            previousStatus: 'waiting',
          },
        },
      ]

      test.each(cases)('previousStatus: $params.previousStatus', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {
            timber: {
              log: () => null,
              error: () => null,
            },
          },
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.onJobCompleted(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#onJobFailed()', () => {
    describe('should record nothing', () => {
      const cases = [
        {
          params: {
            jobModel: {},
            error: new Error('the delivery threw'),
            previousStatus: 'active',
          },
        },
        {
          params: {
            jobModel: {},
            error: new Error('the worker lost its lock'),
            previousStatus: 'waiting',
          },
        },
      ]

      test.each(cases)('previousStatus: $params.previousStatus', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {
            timber: {
              log: () => null,
              error: () => null,
            },
          },
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.onJobFailed(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#onJobProgress()', () => {
    describe('should record nothing', () => {
      const cases = [
        {
          params: {
            jobModel: {},
            progress: 10,
          },
        },
        {
          params: {
            jobModel: {},
            progress: 90,
          },
        },
      ]

      test.each(cases)('progress: $params.progress', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.onJobProgress(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#onWorkerError()', () => {
    describe('should record nothing', () => {
      const cases = [
        {
          params: {
            error: new Error('the queue connection dropped'),
          },
        },
        {
          params: {
            error: new Error('the queue refused a command'),
          },
        },
      ]

      test.each(cases)('error: $params.error', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {
            timber: {
              log: () => null,
              error: () => null,
            },
          },
          config: {},
          manifest: {},
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.onWorkerError(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})
