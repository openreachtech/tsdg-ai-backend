import {
  BaseJobWorker,
  ConcreteMemberNotFoundJobError,
} from '@openreachtech/renchan-job-bullmq'

import BaseAiRunJobWorker from '../../../../../app/aiRun/jobs/BaseAiRunJobWorker.js'

import BaseAiRunPurgeJobWorker from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobWorker.js'

/*
 * What this hierarchy does before and after it reaches a purger.
 *
 * **Nothing here writes, and that is a property of the class rather than of the test.**
 * `#sweepExpiredAiRuns()` is abstract on this class and `.get:AiRunPurgerCtor` throws, so the base
 * has no purger of its own and no route to the database; every case below supplies the collaborator
 * the class is built to receive. The purgers themselves are exercised for real, against seeded
 * rows, under `tests/_orders/AiRunRetention/`.
 *
 * The engines handed in are plain stubs: this worker never reaches the queue in these cases, and
 * `.create()` asks an engine for two things only — the worker config and the error hash.
 */

describe('BaseAiRunPurgeJobWorker', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = BaseAiRunPurgeJobWorker.prototype

      expect(received)
        .toBeInstanceOf(BaseJobWorker)
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('inheritance', () => {
    /*
     * A purge is not a run's lifecycle. `BaseAiRunJobWorker` claims one run running, races its
     * work against the 300-second limit and writes exactly one terminal state for it; a purge is
     * about no run in particular and writes no status at all, and §10's first criterion is that a
     * run never leaves a terminal state — so a purge that claimed one running would be undoing it.
     * A worker inheriting that lifecycle would have to override the whole of `#executeJob()` to
     * escape it and would still carry a claim and a race that could never run. This case is what
     * keeps that from being re-introduced quietly.
     */
    test('should not be an AI run job worker', () => {
      const received = BaseAiRunPurgeJobWorker.prototype

      expect(received)
        .not
        .toBeInstanceOf(BaseAiRunJobWorker)
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunPurger', () => {
        const cases = [
          {
            params: {
              engine: {
                Error: {},
              },
              config: {
                workersPath: '/alpha/jobs',
              },
              manifest: {
                bodySchema: {},
              },
              dispatcherHash: {},
              errorHash: {},
              aiRunPurger: {
                label: 'alpha purger',
              },
            },
          },
          {
            params: {
              engine: {
                Error: {},
              },
              config: {
                workersPath: '/beta/jobs',
              },
              manifest: {
                bodySchema: {},
              },
              dispatcherHash: {},
              errorHash: {},
              aiRunPurger: {
                label: 'beta purger',
              },
            },
          },
        ]

        test.each(cases)('aiRunPurger.label: $params.aiRunPurger.label', ({
          params,
        }) => {
          const worker = new BaseAiRunPurgeJobWorker(params)

          expect(worker)
            .toHaveProperty('aiRunPurger', params.aiRunPurger)
        })
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/alpha/jobs',
                connection: {},
              }),
              Error: {},
            },
            manifest: {
              bodySchema: {},
            },
            aiRunPurger: {
              label: 'alpha purger',
            },
          },
        },
        {
          params: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/beta/jobs',
                connection: {},
              }),
              Error: {},
            },
            manifest: {
              bodySchema: {},
            },
            aiRunPurger: {
              label: 'beta purger',
            },
          },
        },
      ]

      test.each(cases)('aiRunPurger.label: $params.aiRunPurger.label', ({
        params,
      }) => {
        const actual = BaseAiRunPurgeJobWorker.create(params)

        expect(actual)
          .toBeInstanceOf(BaseAiRunPurgeJobWorker)
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/alpha/jobs',
                connection: {},
              }),
              Error: {},
            },
            manifest: {
              bodySchema: {},
            },
            aiRunPurger: {
              label: 'alpha purger',
            },
          },
          expected: expect.objectContaining({
            config: {
              workersPath: '/alpha/jobs',
              connection: {},
            },
            dispatcherHash: {},
            errorHash: {},
            aiRunPurger: {
              label: 'alpha purger',
            },
          }),
        },
        {
          params: {
            engine: {
              buildWorkerConfig: () => ({
                workersPath: '/beta/jobs',
                connection: {},
              }),
              Error: {},
            },
            manifest: {
              bodySchema: {},
            },
            aiRunPurger: {
              label: 'beta purger',
            },
          },
          expected: expect.objectContaining({
            config: {
              workersPath: '/beta/jobs',
              connection: {},
            },
            dispatcherHash: {},
            errorHash: {},
            aiRunPurger: {
              label: 'beta purger',
            },
          }),
        },
      ]

      test.each(cases)('aiRunPurger.label: $params.aiRunPurger.label', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(BaseAiRunPurgeJobWorker)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('.get:AiRunPurgerCtor', () => {
    describe('when the concrete job has not filled it in', () => {
      /*
       * Abstract, and it has to stay that way: a default purger here would be one of the two
       * clocks, silently applied to whichever job forgot to name its own — so the content purge
       * could be made to sweep on the trace horizon, or the reverse, with nothing red anywhere.
       */
      test('should throw', () => {
        const actual = () => BaseAiRunPurgeJobWorker.AiRunPurgerCtor

        expect(actual)
          .toThrow(ConcreteMemberNotFoundJobError)
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#sweepExpiredAiRuns()', () => {
    describe('when the concrete job has not filled it in', () => {
      /*
       * The one member a concrete purge job adds. It is abstract rather than defaulted for the
       * same reason as the purger class above: the two purgers deliberately expose two different
       * method names, so that nothing can reach for "the purge".
       */
      const cases = [
        {
          params: {
            now: new Date('2026-09-28T03:00:00.000Z'),
          },
        },
        {
          params: {
            now: new Date('2026-10-05T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('now: $params.now', async ({
        params,
      }) => {
        const worker = BaseAiRunPurgeJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
          manifest: {
            bodySchema: {},
          },
          aiRunPurger: {
            label: 'alpha purger',
          },
        })

        const actual = () => worker.sweepExpiredAiRuns(params)

        await expect(actual)
          .rejects
          .toThrow(ConcreteMemberNotFoundJobError)
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#buildCurrentInstant()', () => {
    /*
     * Read through a method so a test can substitute it, and read once per execution rather than
     * per batch. The value itself cannot be asserted against a literal, so the case pins what the
     * caller depends on: that it is a real `Date`, which is what `AiRunInstantInspector` inside
     * each purger refuses anything else for.
     */
    const cases = [
      {
        params: {
          aiRunPurger: {
            label: 'alpha purger',
          },
        },
      },
      {
        params: {
          aiRunPurger: {
            label: 'beta purger',
          },
        },
      },
    ]

    test.each(cases)('aiRunPurger.label: $params.aiRunPurger.label', ({
      params,
    }) => {
      const worker = BaseAiRunPurgeJobWorker.create({
        engine: {
          buildWorkerConfig: () => ({
            workersPath: '/alpha/jobs',
            connection: {},
          }),
          Error: {},
        },
        manifest: {
          bodySchema: {},
        },
        aiRunPurger: params.aiRunPurger,
      })

      const actual = worker.buildCurrentInstant()

      expect(actual)
        .toBeInstanceOf(Date)
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#executeJob()', () => {
    describe('should hand the sweep the instant it read', () => {
      /*
       * §19 gives both purges a payload of none, so the instant cannot come off the body — a
       * repeatable job's template is written once at registration and replayed on every firing, so
       * an instant carried there would be frozen at the moment somebody ran the registration
       * script and the purge would silently stop purging while still reporting success.
       *
       * The clock is substituted so the assertion is against a value this test chose. What it
       * pins is that the instant the worker read is the instant the sweep was given: a worker
       * reading the clock twice would hand the sweep one instant and stamp the result with
       * another, and every case below would still be green under a single reading.
       */
      const cases = [
        {
          params: {
            now: new Date('2026-09-28T03:00:00.000Z'),
          },
        },
        {
          params: {
            now: new Date('2026-10-05T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('now: $params.now', async ({
        params,
      }) => {
        const worker = BaseAiRunPurgeJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
          manifest: {
            bodySchema: {},
          },
          aiRunPurger: {
            label: 'alpha purger',
          },
        })

        jest.spyOn(worker, 'buildCurrentInstant')
          .mockReturnValue(params.now)

        const sweepSpy = jest.spyOn(worker, 'sweepExpiredAiRuns')
          .mockResolvedValue({
            purgedAiRunCount: 400,
            batchCount: 2,
            isSweepExhausted: true,
          })

        await worker.executeJob({
          body: null,
          context: null,
          parcel: null,
        })

        expect(sweepSpy)
          .toHaveBeenCalledWith({
            now: params.now,
          })
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#executeJob()', () => {
    describe('should report what the sweep did', () => {
      const cases = [
        {
          params: {
            now: new Date('2026-09-28T03:00:00.000Z'),
          },
          mockOutcome: {
            purgedAiRunCount: 400,
            batchCount: 2,
            isSweepExhausted: true,
          },
          expected: {
            sweptAt: '2026-09-28T03:00:00.000Z',
            purgedAiRunCount: 400,
            batchCount: 2,
            isSweepExhausted: true,
          },
        },
        {
          params: {
            now: new Date('2026-10-05T04:00:00.000Z'),
          },
          mockOutcome: {
            purgedAiRunCount: 10000,
            batchCount: 50,
            isSweepExhausted: false,
          },
          expected: {
            sweptAt: '2026-10-05T04:00:00.000Z',
            purgedAiRunCount: 10000,
            batchCount: 50,
            isSweepExhausted: false,
          },
        },
        {
          params: {
            now: new Date('2026-10-12T04:00:00.000Z'),
          },
          mockOutcome: {
            purgedAiRunCount: 0,
            batchCount: 0,
            isSweepExhausted: true,
          },
          expected: {
            sweptAt: '2026-10-12T04:00:00.000Z',
            purgedAiRunCount: 0,
            batchCount: 0,
            isSweepExhausted: true,
          },
        },
      ]

      test.each(cases)('now: $params.now', async ({
        params,
        mockOutcome,
        expected,
      }) => {
        const worker = BaseAiRunPurgeJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
          manifest: {
            bodySchema: {},
          },
          aiRunPurger: {
            label: 'alpha purger',
          },
        })

        jest.spyOn(worker, 'buildCurrentInstant')
          .mockReturnValue(params.now)

        jest.spyOn(worker, 'sweepExpiredAiRuns')
          .mockResolvedValue(mockOutcome)

        const actual = await worker.executeJob({
          body: null,
          context: null,
          parcel: null,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#executeJob()', () => {
    describe('when the sweep stopped on its batch bound', () => {
      /*
       * §19's backlog case, and the decision this class exists to make. `isSweepExhausted: false`
       * means the bound was spent with runs still past the horizon — a fact about the size of the
       * backlog, not a failure. It is reported rather than thrown: throwing would spend the retry
       * budget re-running a sweep that would stop at the same bound, and would file a healthy
       * overnight batch under the same signal as a database outage.
       */
      const cases = [
        {
          params: {
            now: new Date('2026-09-28T03:00:00.000Z'),
          },
          mockOutcome: {
            purgedAiRunCount: 10000,
            batchCount: 50,
            isSweepExhausted: false,
          },
        },
        {
          params: {
            now: new Date('2026-10-05T04:00:00.000Z'),
          },
          mockOutcome: {
            purgedAiRunCount: 9800,
            batchCount: 49,
            isSweepExhausted: false,
          },
        },
      ]

      test.each(cases)('now: $params.now', async ({
        params,
        mockOutcome,
      }) => {
        const worker = BaseAiRunPurgeJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
          manifest: {
            bodySchema: {},
          },
          aiRunPurger: {
            label: 'alpha purger',
          },
        })

        jest.spyOn(worker, 'buildCurrentInstant')
          .mockReturnValue(params.now)

        jest.spyOn(worker, 'sweepExpiredAiRuns')
          .mockResolvedValue(mockOutcome)

        const reportSpy = jest.spyOn(worker, 'reportUnexhaustedSweep')

        await worker.executeJob({
          body: null,
          context: null,
          parcel: null,
        })

        expect(reportSpy)
          .toHaveBeenCalledWith({
            outcome: mockOutcome,
          })
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#executeJob()', () => {
    describe('when the sweep reached the end of its set', () => {
      /*
       * The other half of the case above, and the one that keeps the warning meaning something. A
       * worker that reported every sweep would make the line that says "the backlog is outgrowing
       * one firing" indistinguishable from the ordinary night, at which point nobody reads it.
       */
      const cases = [
        {
          params: {
            now: new Date('2026-09-28T03:00:00.000Z'),
          },
          mockOutcome: {
            purgedAiRunCount: 400,
            batchCount: 2,
            isSweepExhausted: true,
          },
        },
        {
          params: {
            now: new Date('2026-10-05T04:00:00.000Z'),
          },
          mockOutcome: {
            purgedAiRunCount: 0,
            batchCount: 0,
            isSweepExhausted: true,
          },
        },
      ]

      test.each(cases)('now: $params.now', async ({
        params,
        mockOutcome,
      }) => {
        const worker = BaseAiRunPurgeJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
          manifest: {
            bodySchema: {},
          },
          aiRunPurger: {
            label: 'alpha purger',
          },
        })

        jest.spyOn(worker, 'buildCurrentInstant')
          .mockReturnValue(params.now)

        jest.spyOn(worker, 'sweepExpiredAiRuns')
          .mockResolvedValue(mockOutcome)

        const reportSpy = jest.spyOn(worker, 'reportUnexhaustedSweep')

        await worker.executeJob({
          body: null,
          context: null,
          parcel: null,
        })

        expect(reportSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#reportUnexhaustedSweep()', () => {
    describe('should write a warning and not an error', () => {
      /*
       * The level is the whole of what this line is for. An error in this log means a sweep did
       * not run; a warning means a sweep ran and could not reach the end of its set. An operator
       * paged for the second every night a backlog is large stops reading the first.
       *
       * The counts are asserted and nothing else is written: a run id here would name a row whose
       * content the job has just removed, in a file that outlives it.
       */
      const cases = [
        {
          params: {
            outcome: {
              purgedAiRunCount: 10000,
              batchCount: 50,
              isSweepExhausted: false,
            },
          },
          expected: {
            message: 'BaseAiRunPurgeJobWorker a scheduled purge stopped with runs still past its horizon: purgedAiRunCount 10000, batchCount 50',
            tags: [
              'AiRunPurgeJob',
              'UnexhaustedSweep',
            ],
          },
        },
        {
          params: {
            outcome: {
              purgedAiRunCount: 9800,
              batchCount: 49,
              isSweepExhausted: false,
            },
          },
          expected: {
            message: 'BaseAiRunPurgeJobWorker a scheduled purge stopped with runs still past its horizon: purgedAiRunCount 9800, batchCount 49',
            tags: [
              'AiRunPurgeJob',
              'UnexhaustedSweep',
            ],
          },
        },
      ]

      test.each(cases)('purgedAiRunCount: $params.outcome.purgedAiRunCount', ({
        params,
        expected,
      }) => {
        const worker = BaseAiRunPurgeJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
          manifest: {
            bodySchema: {},
          },
          aiRunPurger: {
            label: 'alpha purger',
          },
        })

        const warnSpy = jest.spyOn(BaseAiRunPurgeJobWorker.mentsuLogger, 'warn')

        worker.reportUnexhaustedSweep(params)

        expect(warnSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#extractErrorName()', () => {
    const cases = [
      {
        params: {
          error: new TypeError('alpha'),
        },
        expected: 'TypeError',
      },
      {
        params: {
          error: new RangeError('beta'),
        },
        expected: 'RangeError',
      },
      {
        params: {
          error: null,
        },
        expected: 'Error',
      },
      {
        params: {
          error: 'a thrown string',
        },
        expected: 'Error',
      },
    ]

    test.each(cases)('error: $params.error', ({
      params,
      expected,
    }) => {
      const worker = BaseAiRunPurgeJobWorker.create({
        engine: {
          buildWorkerConfig: () => ({
            workersPath: '/alpha/jobs',
            connection: {},
          }),
          Error: {},
        },
        manifest: {
          bodySchema: {},
        },
        aiRunPurger: {
          label: 'alpha purger',
        },
      })

      const actual = worker.extractErrorName(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#onJobProgress()', () => {
    /*
     * A sweep publishes no progress: nothing subscribes to this service's queues, and the fact a
     * sweep has to report is known only when it stops. The hook is abstract on `BaseJobWorker` and
     * throws unless it is filled in, so answering null is required rather than optional.
     */
    const cases = [
      {
        params: {
          jobModel: null,
          progress: 25,
        },
      },
      {
        params: {
          jobModel: null,
          progress: 'halfway',
        },
      },
    ]

    test.each(cases)('progress: $params.progress', ({
      params,
    }) => {
      const worker = BaseAiRunPurgeJobWorker.create({
        engine: {
          buildWorkerConfig: () => ({
            workersPath: '/alpha/jobs',
            connection: {},
          }),
          Error: {},
        },
        manifest: {
          bodySchema: {},
        },
        aiRunPurger: {
          label: 'alpha purger',
        },
      })

      const actual = worker.onJobProgress(params)

      expect(actual)
        .toBeNull()
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#onJobCompleted()', () => {
    const cases = [
      {
        params: {
          jobModel: null,
          result: {
            purgedAiRunCount: 400,
          },
          previousStatus: 'active',
        },
        expected: {
          message: 'BaseAiRunPurgeJobWorker a sweep completed: active',
          tags: [
            'AiRunPurgeJob',
            'CompletedSweep',
          ],
        },
      },
      {
        params: {
          jobModel: null,
          result: {
            purgedAiRunCount: 0,
          },
          previousStatus: 'waiting',
        },
        expected: {
          message: 'BaseAiRunPurgeJobWorker a sweep completed: waiting',
          tags: [
            'AiRunPurgeJob',
            'CompletedSweep',
          ],
        },
      },
    ]

    test.each(cases)('previousStatus: $params.previousStatus', ({
      params,
      expected,
    }) => {
      const worker = BaseAiRunPurgeJobWorker.create({
        engine: {
          buildWorkerConfig: () => ({
            workersPath: '/alpha/jobs',
            connection: {},
          }),
          Error: {},
        },
        manifest: {
          bodySchema: {},
        },
        aiRunPurger: {
          label: 'alpha purger',
        },
      })

      const logSpy = jest.spyOn(BaseAiRunPurgeJobWorker.mentsuLogger, 'log')

      worker.onJobCompleted(params)

      expect(logSpy)
        .toHaveBeenCalledWith(expected)
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#onJobFailed()', () => {
    /*
     * Only the error's class name is written. A message composed deeper down can quote a row, and
     * the rows this job touches are the ones whose content it is removing.
     */
    const cases = [
      {
        params: {
          jobModel: null,
          error: new TypeError('alpha'),
          previousStatus: 'active',
        },
        expected: {
          message: 'BaseAiRunPurgeJobWorker a sweep failed: active, TypeError',
          tags: [
            'AiRunPurgeJob',
            'FailedSweep',
          ],
        },
      },
      {
        params: {
          jobModel: null,
          error: new RangeError('beta'),
          previousStatus: 'waiting',
        },
        expected: {
          message: 'BaseAiRunPurgeJobWorker a sweep failed: waiting, RangeError',
          tags: [
            'AiRunPurgeJob',
            'FailedSweep',
          ],
        },
      },
    ]

    test.each(cases)('previousStatus: $params.previousStatus', ({
      params,
      expected,
    }) => {
      const worker = BaseAiRunPurgeJobWorker.create({
        engine: {
          buildWorkerConfig: () => ({
            workersPath: '/alpha/jobs',
            connection: {},
          }),
          Error: {},
        },
        manifest: {
          bodySchema: {},
        },
        aiRunPurger: {
          label: 'alpha purger',
        },
      })

      const errorSpy = jest.spyOn(BaseAiRunPurgeJobWorker.mentsuLogger, 'error')

      worker.onJobFailed(params)

      expect(errorSpy)
        .toHaveBeenCalledWith(expected)
    })
  })
})

describe('BaseAiRunPurgeJobWorker', () => {
  describe('#onWorkerError()', () => {
    const cases = [
      {
        params: {
          error: new TypeError('alpha'),
        },
        expected: {
          message: 'BaseAiRunPurgeJobWorker the worker errored: TypeError',
          tags: [
            'AiRunPurgeJob',
            'WorkerError',
          ],
        },
      },
      {
        params: {
          error: new RangeError('beta'),
        },
        expected: {
          message: 'BaseAiRunPurgeJobWorker the worker errored: RangeError',
          tags: [
            'AiRunPurgeJob',
            'WorkerError',
          ],
        },
      },
    ]

    test.each(cases)('error: $params.error', ({
      params,
      expected,
    }) => {
      const worker = BaseAiRunPurgeJobWorker.create({
        engine: {
          buildWorkerConfig: () => ({
            workersPath: '/alpha/jobs',
            connection: {},
          }),
          Error: {},
        },
        manifest: {
          bodySchema: {},
        },
        aiRunPurger: {
          label: 'alpha purger',
        },
      })

      const errorSpy = jest.spyOn(BaseAiRunPurgeJobWorker.mentsuLogger, 'error')

      worker.onWorkerError(params)

      expect(errorSpy)
        .toHaveBeenCalledWith(expected)
    })
  })
})
