import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  BaseJobWorker,
  ConcreteMemberNotFoundJobError,
  JobBody,
} from '@openreachtech/renchan-job-bullmq'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import BaseAiRunJobWorker from '../../../../../app/aiRun/jobs/BaseAiRunJobWorker.js'

import BaseAiRunJobManifest from '../../../../../app/aiRun/jobs/BaseAiRunJobManifest.js'

import AiRunStatusRecorder from '../../../../../app/aiRun/AiRunStatusRecorder.js'

import AiRunMediaWorkspace from '../../../../../app/aiRunMedia/AiRunMediaWorkspace.js'

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
              manifest: BaseAiRunJobManifest.create({
                jobName: 'alpha-ai-run-queue',
              }),
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
              manifest: BaseAiRunJobManifest.create({
                jobName: 'alpha-ai-run-queue',
              }),
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
              manifest: BaseAiRunJobManifest.create({
                jobName: 'alpha-ai-run-queue',
              }),
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
              manifest: BaseAiRunJobManifest.create({
                jobName: 'alpha-ai-run-queue',
              }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
     * What this answers null for is a body that does not carry the field, which the schema does
     * not rule out — `{ aiRunId: Integer }` states what the field holds when it is there and not
     * that it has to be. A body that is nothing at all answers null too, though `#executeJob()`
     * has already refused that one at the schema gate by the time this is reached. Either way the
     * caller refuses by name instead of faulting on a property read three methods deeper.
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
            manifest: BaseAiRunJobManifest.create({
              jobName: 'alpha-ai-run-queue',
            }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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

describe('BaseAiRunJobWorker', () => {
  describe('.get:mentsuLogger', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseAiRunJobWorker.mentsuLogger

        expect(received)
          .toBeInstanceOf(MentsuLogger)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#createJobBody()', () => {
    describe('should hold the body it was handed', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10330201,
            },
          },
        },
        {
          params: {
            body: {
              aiRunId: 10330202,
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10330202',
            },
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const jobBody = worker.createJobBody(params)
        const received = jobBody.body

        expect(received)
          .toBe(params.body) // same reference
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#createJobBody()', () => {
    describe('should be the framework value object bound to the manifest schema', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10330211,
            },
          },
        },
        {
          params: {
            body: {
              aiRunId: 10330212,
            },
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const received = worker.createJobBody(params)

        expect(received)
          .toBeInstanceOf(JobBody)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#isValidJobBody()', () => {
    /*
     * What the schema holds a body to is the kind of a declared field, and nothing more. A body
     * with no keys satisfies it, and so does one carrying keys it never declared — both are here
     * so that the gate is not read as doing more than it does. `#executeJob()` is what refuses a
     * body naming no run, and `#buildDeclaredJobBody()` is what drops the undeclared keys.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          label: 'the body this service dispatches',
          input: {
            body: {
              aiRunId: 10330221,
            },
          },
        },
        {
          label: 'a body carrying keys the schema never declared',
          input: {
            body: {
              aiRunId: 10330222,
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10330222',
              resultBody: '{"fields":[{"fieldPath":"subject.alpha"}]}',
            },
          },
        },
        {
          label: 'a body carrying no key at all',
          input: {
            body: {},
          },
        },
        {
          label: 'an id that is an integer but names no row',
          input: {
            body: {
              aiRunId: 0,
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const received = worker.isValidJobBody(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          label: 'no body at all',
          input: {
            body: null,
          },
        },
        {
          label: 'an id that is not an integer',
          input: {
            body: {
              aiRunId: 'ai-run-id-omega',
            },
          },
        },
        {
          label: 'an id declared as nothing',
          input: {
            body: {
              aiRunId: null,
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const received = worker.isValidJobBody(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#buildDeclaredJobBody()', () => {
    /*
     * The declared fields the body actually holds, and nothing else. The second and third cases
     * are the ones that matter: a normalized body keeps every key it was given, so a delivery
     * carrying a callback URL or a whole result reaches this method with them, and what leaves it
     * is the run's id alone.
     */
    describe('should carry the declared fields and nothing else', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10330231,
            },
          },
          expected: {
            aiRunId: 10330231,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10330232,
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10330232',
              resultBody: '{"fields":[{"fieldPath":"subject.beta"}]}',
            },
          },
          expected: {
            aiRunId: 10330232,
          },
        },
        {
          params: {
            body: {
              runKey: 'run-key-10330233',
              requestKey: 'request-key-10330233',
            },
          },
          expected: {},
        },
      ]

      test.each(cases)('body.aiRunId: $params.body.aiRunId', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const received = worker.buildDeclaredJobBody(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#logFailedAiRunWork()', () => {
    /*
     * The line names the run, the reason code and the error's class, and the error's own message
     * appears in none of it. That is the point of the case values: each `mockError` carries a
     * message built the way a media fetch or a provider call builds one — a URL, a file name — and
     * the asserted line is the whole of what is written, so a message creeping back into it fails
     * here.
     */
    describe('should write a line carrying nothing the error said', () => {
      const cases = [
        {
          params: {
            aiRunId: 10330241,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            error: new Error('POST https://provider.example.com/v1/answer answered 503'),
          },
          expected: 'BaseAiRunJobWorker the work of a run threw: AiRunId 10330241, PROVIDER_CALL_FAILED, Error',
        },
        {
          params: {
            aiRunId: 10330242,
            failureReasonCode: 'MEDIA_FETCH_FAILED',
            error: new TypeError('could not read subject-photograph-10330242.jpeg'),
          },
          expected: 'BaseAiRunJobWorker the work of a run threw: AiRunId 10330242, MEDIA_FETCH_FAILED, TypeError',
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const errorSpy = jest.spyOn(BaseAiRunJobWorker.mentsuLogger, 'error')

        worker.logFailedAiRunWork(params)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'AiRunJob',
              'FailedAiRunWork',
            ],
          })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#onJobCompleted()', () => {
    describe('should write the queue event and nothing the delivery answered', () => {
      const cases = [
        {
          params: {
            jobModel: {},
            result: {
              aiRunId: 10330251,
            },
            previousStatus: 'active',
          },
          expected: 'BaseAiRunJobWorker a delivery completed: active',
        },
        {
          params: {
            jobModel: {},
            result: {
              aiRunId: 10330252,
            },
            previousStatus: 'waiting',
          },
          expected: 'BaseAiRunJobWorker a delivery completed: waiting',
        },
      ]

      test.each(cases)('previousStatus: $params.previousStatus', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const logSpy = jest.spyOn(BaseAiRunJobWorker.mentsuLogger, 'log')

        worker.onJobCompleted(params)

        expect(logSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'AiRunJob',
              'CompletedDelivery',
            ],
          })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#onJobFailed()', () => {
    describe('should write a line carrying nothing the error said', () => {
      const cases = [
        {
          params: {
            jobModel: {},
            error: new Error('https://provider.example.com/v1/answer timed out'),
            previousStatus: 'active',
          },
          expected: 'BaseAiRunJobWorker a delivery failed: active, Error',
        },
        {
          params: {
            jobModel: {},
            error: new RangeError('subject-photograph-10330261.jpeg exceeded the size allowed'),
            previousStatus: 'waiting',
          },
          expected: 'BaseAiRunJobWorker a delivery failed: waiting, RangeError',
        },
      ]

      test.each(cases)('previousStatus: $params.previousStatus', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const errorSpy = jest.spyOn(BaseAiRunJobWorker.mentsuLogger, 'error')

        worker.onJobFailed(params)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'AiRunJob',
              'FailedDelivery',
            ],
          })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#onWorkerError()', () => {
    describe('should write a line carrying nothing the error said', () => {
      const cases = [
        {
          params: {
            error: new Error('redis://cache.example.com:6379 dropped the connection'),
          },
          expected: 'BaseAiRunJobWorker the worker errored: Error',
        },
        {
          params: {
            error: new TypeError('the queue refused a command'),
          },
          expected: 'BaseAiRunJobWorker the worker errored: TypeError',
        },
      ]

      test.each(cases)('error: $params.error', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const errorSpy = jest.spyOn(BaseAiRunJobWorker.mentsuLogger, 'error')

        worker.onWorkerError(params)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'AiRunJob',
              'WorkerError',
            ],
          })
      })
    })
  })
})

/*
 * Section 18's fifth acceptance criterion, at the four members that keep it: the temporary copy of
 * a fetched file is deleted when the run ends.
 *
 * The file system is not mocked in the cases that are about the deletion. A spy saying
 * `removeWorkspace` was called would pass against a worker that removed the wrong run's directory,
 * so those cases write real bytes under the machine's own temporary directory - the very place
 * `AiRunMediaWorkspace` puts them in production, because this worker builds the workspace with no
 * root of its own - and then read the disk to see that they are gone.
 *
 * The run ids are `10450001` upward, a block of `#media-fetch`'s own that no other file writes, so
 * a directory these cases create belongs to these cases alone.
 *
 * `#executeJob()` is where the removal is hooked, and its cases are not here: that method writes a
 * run's terminal state, so they sit in `tests/_orders/AiRun/BaseAiRunJobWorker.js` beside the rest
 * of the lifecycle.
 */

describe('BaseAiRunJobWorker', () => {
  describe('.get:AiRunMediaWorkspaceCtor', () => {
    test('should be the workspace holding the fetched files of one run', () => {
      const expected = AiRunMediaWorkspace

      const actual = BaseAiRunJobWorker.AiRunMediaWorkspaceCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#createAiRunMediaWorkspace()', () => {
    describe('should create the workspace of the run it is given', () => {
      const cases = [
        {
          params: {
            aiRunId: 10450001,
          },
        },
        {
          params: {
            aiRunId: 10450002,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.createAiRunMediaWorkspace(params)

        expect(actual)
          .toBeInstanceOf(AiRunMediaWorkspace)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#createAiRunMediaWorkspace()', () => {
    /*
     * A worker is one long-lived instance per queue, so the run is what one delivery is about and
     * never what the worker holds. The workspace it hands back has to be the run's own, which is
     * the whole of what makes a removal delete this run's files and not another's.
     */
    describe('should hand the workspace the run of this delivery', () => {
      const cases = [
        {
          params: {
            aiRunId: 10450003,
          },
          expected: 10450003,
        },
        {
          params: {
            aiRunId: 10450004,
          },
          expected: 10450004,
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.createAiRunMediaWorkspace(params)

        expect(actual)
          .toHaveProperty('aiRunId', expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#removeAiRunMediaWorkspace()', () => {
    /*
     * The deletion itself. The copies are written in the arrange phase because removing them is
     * what is under test, and the assertion reads the disk because "the file is gone" is not
     * observable any other way.
     */
    describe('should delete every temporary copy the run fetched', () => {
      const cases = [
        {
          mockMediumFile: {
            aiRunMediaId: 10450101,
            bytes: Buffer.from('kitchen-worktop-bytes'),
          },
          params: {
            aiRunId: 10450011,
          },
          expected: path.join(os.tmpdir(), 'ai-run-media-10450011'),
        },
        {
          mockMediumFile: {
            aiRunMediaId: 10450102,
            bytes: Buffer.from('bathroom-tiling-bytes'),
          },
          params: {
            aiRunId: 10450012,
          },
          expected: path.join(os.tmpdir(), 'ai-run-media-10450012'),
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        mockMediumFile,
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const workspace = AiRunMediaWorkspace.create(params)
        const mediumFilePath = await workspace.writeMediumFile(mockMediumFile)

        const actual = await worker.removeAiRunMediaWorkspace(params)

        expect(actual)
          .toBe(expected)
        await expect(fsPromises.readFile(mediumFilePath))
          .rejects
          .toThrow('ENOENT') // the file is gone, not merely unreadable
      })
    })

    /*
     * Every run in this version, and the reason the removal may be asked for unconditionally: no
     * job fetches a file yet, so no run has a directory, and a run that has none still ends.
     */
    describe('should remove nothing without complaining', () => {
      const cases = [
        {
          params: {
            aiRunId: 10450013,
          },
          expected: path.join(os.tmpdir(), 'ai-run-media-10450013'),
        },
        {
          params: {
            aiRunId: 10450014,
          },
          expected: path.join(os.tmpdir(), 'ai-run-media-10450014'),
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = await worker.removeAiRunMediaWorkspace(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#removeAiRunMediaWorkspace()', () => {
    /*
     * A directory that is there and could not be removed is a fetched file still sitting on a disk
     * after the run that fetched it ended. It is reported and swallowed rather than raised: the
     * call sits in a `finally`, and a throw from here would replace whatever the delivery was
     * already returning or raising with one about a directory.
     *
     * The workspace is stubbed here because a directory that refuses to be removed cannot be
     * arranged on every platform this suite runs on, and the branch is unreachable without one.
     */
    describe('should answer null when the removal failed', () => {
      const cases = [
        {
          mockRemovalFailure: new Error('EBUSY: resource busy or locked'),
          params: {
            aiRunId: 10450021,
          },
        },
        {
          mockRemovalFailure: new TypeError('EACCES: permission denied'),
          params: {
            aiRunId: 10450022,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        mockRemovalFailure,
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const removeWorkspace = jest.fn()
          .mockRejectedValue(mockRemovalFailure)
        jest.spyOn(worker, 'createAiRunMediaWorkspace')
          .mockReturnValue({
            removeWorkspace,
          })

        const actual = await worker.removeAiRunMediaWorkspace(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#removeAiRunMediaWorkspace()', () => {
    /*
     * Swallowing without writing the line down would make a fetched file outliving its run
     * invisible, which is the one thing an operator has to be told about it.
     */
    describe('should write the line a removal that failed leaves behind', () => {
      const cases = [
        {
          mockRemovalFailure: new Error('EBUSY: resource busy or locked'),
          params: {
            aiRunId: 10450023,
          },
          expected: 'BaseAiRunJobWorker a run ended with its fetched files still on disk: AiRunId 10450023, Error',
        },
        {
          mockRemovalFailure: new TypeError('EACCES: permission denied'),
          params: {
            aiRunId: 10450024,
          },
          expected: 'BaseAiRunJobWorker a run ended with its fetched files still on disk: AiRunId 10450024, TypeError',
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        mockRemovalFailure,
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const removeWorkspace = jest.fn()
          .mockRejectedValue(mockRemovalFailure)
        jest.spyOn(worker, 'createAiRunMediaWorkspace')
          .mockReturnValue({
            removeWorkspace,
          })
        const errorSpy = jest.spyOn(BaseAiRunJobWorker.mentsuLogger, 'error')

        await worker.removeAiRunMediaWorkspace(params)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'AiRunJob',
              'FailedWorkspaceRemoval',
            ],
          })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#logFailedWorkspaceRemoval()', () => {
    /*
     * The line names the run and the error's class, and the error's own message appears in none of
     * it - the same bound-message rule `#logFailedAiRunWork()` keeps, for the same reason. Each
     * `params.error` below carries a message built the way the file system builds one, carrying a
     * path, so a message creeping back into the line fails here.
     */
    describe('should write a line carrying nothing the error said', () => {
      const cases = [
        {
          params: {
            aiRunId: 10450031,
            error: new Error('EBUSY: resource busy or locked, rm ./ai-run-media-10450031'),
          },
          expected: 'BaseAiRunJobWorker a run ended with its fetched files still on disk: AiRunId 10450031, Error',
        },
        {
          params: {
            aiRunId: 10450032,
            error: new TypeError('EACCES: permission denied, rm ./ai-run-media-10450032'),
          },
          expected: 'BaseAiRunJobWorker a run ended with its fetched files still on disk: AiRunId 10450032, TypeError',
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const errorSpy = jest.spyOn(BaseAiRunJobWorker.mentsuLogger, 'error')

        worker.logFailedWorkspaceRemoval(params)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'AiRunJob',
              'FailedWorkspaceRemoval',
            ],
          })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#extractErrorName()', () => {
    /*
     * Four sites in this class read the class a failure came back as, and every one of them used
     * to read it off the value directly. A `throw null` from a concrete job - written by another
     * service, against this class's own contract - made each of them raise a TypeError from inside
     * a catch, which no try in this file catches, because a throw inside a catch escapes the try
     * that catch belongs to.
     *
     * So the cases here are the values a property read faults on, and the ones that carry no class
     * of their own. What each of them costs when it is not guarded is stated in the describes
     * below.
     */
    describe('should name what carries no class of its own', () => {
      const cases = [
        {
          params: {
            error: null,
          },
          expected: 'Error',
          label: 'null, which a concrete job may throw',
        },
        {
          params: {
            error: Object.create(null),
          },
          expected: 'Error',
          label: 'an object with no prototype at all',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.extractErrorName(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should name the class a failure came back as', () => {
      const cases = [
        {
          params: {
            error: new Error('the provider answered 503'),
          },
          expected: 'Error',
        },
        {
          params: {
            error: new TypeError('fetch failed'),
          },
          expected: 'TypeError',
        },
        {
          params: {
            error: 'a failure thrown as text',
          },
          expected: 'String',
        },
        {
          params: {
            error: 0,
          },
          expected: 'Number',
        },
      ]

      test.each(cases)('error: $params.error', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })

        const actual = worker.extractErrorName(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#buildAiRunWorkOutcome()', () => {
    /*
     * The costliest of the four sites. A work that throws null used to make the logging raise a
     * TypeError out of the catch, past the terminal write and out of `#executeJob()` - so the run
     * sat at running until its retention sweep and the client waited on a callback that never
     * came, which is the one thing this outcome exists to prevent.
     *
     * An outcome rather than a rejection is therefore what is asserted, and the reason code with
     * it: a failure nobody classified is still a failure with a code a reader can act on.
     */
    describe('should turn a work that threw nothing with a class into a failure outcome', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10450041,
            },
            context: {},
            parcel: {},
          },
          mockFailure: null,
          expected: {
            resultBody: null,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            failureParameters: null,
          },
          label: 'a work that threw null',
        },
        {
          params: {
            body: {
              aiRunId: 10450042,
            },
            context: {},
            parcel: {},
          },
          mockFailure: 'the provider answered badly',
          expected: {
            resultBody: null,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            failureParameters: null,
          },
          label: 'a work that threw text',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        mockFailure,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockRejectedValue(mockFailure)

        const actual = await worker.buildAiRunWorkOutcome(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#logFailedAiRunWork()', () => {
    describe('should write a line for a failure carrying no class', () => {
      const cases = [
        {
          params: {
            aiRunId: 10450043,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            error: null,
          },
          expected: 'BaseAiRunJobWorker the work of a run threw: AiRunId 10450043, PROVIDER_CALL_FAILED, Error',
          label: 'a work that threw null',
        },
        {
          params: {
            aiRunId: 10450044,
            failureReasonCode: 'MEDIA_FETCH_FAILED',
            error: 'https://files.client.example/photos/front-elevation.jpg could not be read',
          },
          expected: 'BaseAiRunJobWorker the work of a run threw: AiRunId 10450044, MEDIA_FETCH_FAILED, String',
          label: 'a work that threw text carrying a URL',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const errorSpy = jest.spyOn(BaseAiRunJobWorker.mentsuLogger, 'error')

        worker.logFailedAiRunWork(params)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'AiRunJob',
              'FailedAiRunWork',
            ],
          })
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#removeAiRunMediaWorkspace()', () => {
    /*
     * The second site, and the one that is worse in kind. It is reached from the `finally`, so a
     * throw raised here would replace the result the delivery was returning or the exception it
     * was already raising - the exact thing the `finally`'s design says it prevents.
     */
    describe('should answer null when the removal threw nothing with a class', () => {
      const cases = [
        {
          mockRemovalFailure: null,
          params: {
            aiRunId: 10450045,
          },
          label: 'a removal that threw null',
        },
        {
          mockRemovalFailure: 'rm refused ./ai-run-media-10450046',
          params: {
            aiRunId: 10450046,
          },
          label: 'a removal that threw text',
        },
      ]

      test.each(cases)('label: $label', async ({
        mockRemovalFailure,
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: AiRunStatusRecorder.create(),
        })
        const removeWorkspace = jest.fn()
          .mockRejectedValue(mockRemovalFailure)
        jest.spyOn(worker, 'createAiRunMediaWorkspace')
          .mockReturnValue(/** @type {*} */ ({
            removeWorkspace,
          }))

        const actual = await worker.removeAiRunMediaWorkspace(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#onJobFailed()', () => {
    /*
     * The third site. BullMQ hands this handler whatever the delivery rejected with, so a delivery
     * that rejected with null used to fault the handler the queue calls.
     */
    describe('should record nothing for a delivery that failed with no class', () => {
      const cases = [
        {
          params: {
            jobModel: {},
            error: null,
            previousStatus: 'active',
          },
        },
        {
          params: {
            jobModel: {},
            error: 'the delivery rejected with text',
            previousStatus: 'waiting',
          },
        },
      ]

      test.each(cases)('previousStatus: $params.previousStatus', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
  describe('#onWorkerError()', () => {
    /*
     * The fourth site. This one is the queue connection failing rather than a run failing, and the
     * value it hands over is the driver's rather than this service's.
     */
    describe('should record nothing for a worker error with no class', () => {
      const cases = [
        {
          params: {
            error: null,
          },
          label: 'a worker error of null',
        },
        {
          params: {
            error: 'the queue connection dropped',
          },
          label: 'a worker error thrown as text',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
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
