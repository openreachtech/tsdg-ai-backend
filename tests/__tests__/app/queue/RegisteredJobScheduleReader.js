import AppJobEngine from '../../../../app/queue/AppJobEngine.js'
import AppJobSchedulerService from '../../../../app/queue/AppJobSchedulerService.js'
import RegisteredJobScheduleReader from '../../../../app/queue/RegisteredJobScheduleReader.js'

import PurgeExpiredRunContentCronJobScheduler from '../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentCronJobScheduler.js'
import PurgeExpiredRunTracesCronJobScheduler from '../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesCronJobScheduler.js'

/*
 * No case below reaches Redis, and `npm run test` is runnable with nothing but Node installed.
 *
 * The one method that must reach it — `#createScheduler()`, which opens a queue and waits until it
 * is ready — is exercised against a fake scheduler class here, and the queue a real one would open
 * is what the cases stand in for. That is the reason the class is split away from
 * `JobScheduleRegistrationInspector` at all: the comparison that decides whether a purge schedule
 * exists is testable, and what remains untestable without a live Redis is this one delegation.
 *
 * `#loadSchedulerCtors()` is the exception, and it runs for real: the folder scan it delegates to
 * reads the engine's `schedulersPath` off the disk and opens no connection.
 */

describe('RegisteredJobScheduleReader', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#engine', () => {
        const cases = [
          {
            params: {
              engine: {
                schedulersPath: '/alpha/jobs',
              },
              schedulerServiceFactory: AppJobSchedulerService,
            },
          },
          {
            params: {
              engine: {
                schedulersPath: '/beta/jobs',
              },
              schedulerServiceFactory: AppJobSchedulerService,
            },
          },
        ]

        test.each(cases)('engine.schedulersPath: $params.engine.schedulersPath', ({
          params,
        }) => {
          const reader = new RegisteredJobScheduleReader(params)

          expect(reader)
            .toHaveProperty('engine', params.engine)
        })
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#schedulerServiceFactory', () => {
        const cases = [
          {
            params: {
              engine: {
                schedulersPath: '/alpha/jobs',
              },
              schedulerServiceFactory: {
                label: 'alpha scheduler service',
              },
            },
          },
          {
            params: {
              engine: {
                schedulersPath: '/beta/jobs',
              },
              schedulerServiceFactory: {
                label: 'beta scheduler service',
              },
            },
          },
        ]

        test.each(cases)('schedulerServiceFactory.label: $params.schedulerServiceFactory.label', ({
          params,
        }) => {
          const reader = new RegisteredJobScheduleReader(params)

          expect(reader)
            .toHaveProperty('schedulerServiceFactory', params.schedulerServiceFactory)
        })
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            engine: {
              schedulersPath: '/alpha/jobs',
            },
            schedulerServiceFactory: {
              label: 'alpha scheduler service',
            },
          },
        },
        {
          params: {
            engine: {
              schedulersPath: '/beta/jobs',
            },
            schedulerServiceFactory: {
              label: 'beta scheduler service',
            },
          },
        },
      ]

      test.each(cases)('engine.schedulersPath: $params.engine.schedulersPath', ({
        params,
      }) => {
        const actual = RegisteredJobScheduleReader.create(params)

        expect(actual)
          .toBeInstanceOf(RegisteredJobScheduleReader)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('.create()', () => {
    describe('should be called by constructor', () => {
      const cases = [
        {
          params: {
            engine: {
              schedulersPath: '/alpha/jobs',
            },
            schedulerServiceFactory: {
              label: 'alpha scheduler service',
            },
          },
        },
        {
          params: {
            engine: {
              schedulersPath: '/beta/jobs',
            },
            schedulerServiceFactory: {
              label: 'beta scheduler service',
            },
          },
        },
      ]

      test.each(cases)('engine.schedulersPath: $params.engine.schedulersPath', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(RegisteredJobScheduleReader)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('.create()', () => {
    describe('should use default schedulerServiceFactory value', () => {
      /*
       * The application's own scheduler service, and not the framework base it extends: the scan
       * this class asks for is the same one `scripts/startJobSchedulers.js` registers from, and
       * the two reading different lists is exactly the drift this whole check exists to catch.
       */
      const cases = [
        {
          params: {
            engine: {
              schedulersPath: '/alpha/jobs',
            },
          },
        },
        {
          params: {
            engine: {
              schedulersPath: '/beta/jobs',
            },
          },
        },
      ]

      test.each(cases)('engine.schedulersPath: $params.engine.schedulersPath', ({
        params,
      }) => {
        const actual = RegisteredJobScheduleReader.create(params)

        expect(actual)
          .toHaveProperty('schedulerServiceFactory', AppJobSchedulerService)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          engine: {
            schedulersPath: '/alpha/jobs',
          },
        },
      },
      {
        params: {
          engine: {
            schedulersPath: '/beta/jobs',
          },
        },
      },
    ]

    test.each(cases)('engine.schedulersPath: $params.engine.schedulersPath', ({
      params,
    }) => {
      const reader = RegisteredJobScheduleReader.create(params)

      const actual = reader.Ctor

      expect(actual)
        .toBe(RegisteredJobScheduleReader) // same reference
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#loadSchedulerCtors()', () => {
    describe('when scanning the real engine path', () => {
      /*
       * Run for real, because it can be: the scan reads a directory and opens no connection. What
       * it pins is that this class asks the same question `BaseJobSchedulerService` asks at
       * registration — so a third scheduler added under `app/jobs/` is read back with no line
       * changed here, which is the whole reason the queues come from the scan rather than from the
       * declared ids.
       */
      const cases = [
        {
          params: {
            engine: {
              schedulersPath: AppJobEngine.config.schedulersPath,
            },
          },
          expected: expect.arrayContaining([
            PurgeExpiredRunContentCronJobScheduler,
            PurgeExpiredRunTracesCronJobScheduler,
          ]),
        },
      ]

      test.each(cases)('engine.schedulersPath: $params.engine.schedulersPath', async ({
        params,
        expected,
      }) => {
        const reader = RegisteredJobScheduleReader.create(params)

        const actual = await reader.loadSchedulerCtors()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#loadSchedulerCtors()', () => {
    describe('when delegating to the injected scheduler service', () => {
      const cases = [
        {
          params: {
            engine: {
              schedulersPath: '/alpha/jobs',
            },
          },
          mockSchedulerCtors: [
            {
              schedulerId: 'alpha-schedule',
            },
          ],
        },
        {
          params: {
            engine: {
              schedulersPath: '/beta/jobs',
            },
          },
          mockSchedulerCtors: [
            {
              schedulerId: 'beta-schedule',
            },
            {
              schedulerId: 'gamma-schedule',
            },
          ],
        },
      ]

      test.each(cases)('engine.schedulersPath: $params.engine.schedulersPath', async ({
        params,
        mockSchedulerCtors,
      }) => {
        const schedulerServiceFactory = {
          loadSchedulerCtors: async () => mockSchedulerCtors,
        }
        const loadSchedulerCtorsSpy = jest.spyOn(schedulerServiceFactory, 'loadSchedulerCtors')
        const reader = RegisteredJobScheduleReader.create({
          engine: params.engine,
          schedulerServiceFactory,
        })

        const actual = await reader.loadSchedulerCtors()

        expect(actual)
          .toBe(mockSchedulerCtors) // same reference
        expect(loadSchedulerCtorsSpy)
          .toHaveBeenCalledWith({
            engine: params.engine,
          })
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#createScheduler()', () => {
    /*
     * The one delegation that reaches Redis in production — `BaseJobScheduler.createAsync()` opens
     * a queue and waits until it is ready. What is checked here is the hand-off: the engine this
     * reader holds is the engine the scheduler is built on, so the queue read back is a queue on
     * the same Redis the daemon is running against.
     */
    const cases = [
      {
        params: {
          SchedulerCtor: {
            schedulerId: 'alpha-schedule',
          },
        },
        factoryParams: {
          engine: {
            schedulersPath: '/alpha/jobs',
          },
        },
        mockScheduler: {
          label: 'alpha scheduler',
        },
      },
      {
        params: {
          SchedulerCtor: {
            schedulerId: 'beta-schedule',
          },
        },
        factoryParams: {
          engine: {
            schedulersPath: '/beta/jobs',
          },
        },
        mockScheduler: {
          label: 'beta scheduler',
        },
      },
    ]

    test.each(cases)('SchedulerCtor.schedulerId: $params.SchedulerCtor.schedulerId', async ({
      params,
      factoryParams,
      mockScheduler,
    }) => {
      const SchedulerCtor = {
        ...params.SchedulerCtor,
        createAsync: async () => mockScheduler,
      }
      const createAsyncSpy = jest.spyOn(SchedulerCtor, 'createAsync')
      const reader = RegisteredJobScheduleReader.create(factoryParams)

      const actual = await reader.createScheduler({
        SchedulerCtor,
      })

      expect(actual)
        .toBe(mockScheduler) // same reference
      expect(createAsyncSpy)
        .toHaveBeenCalledWith({
          engine: factoryParams.engine,
        })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#readSchedulerIdsInQueue()', () => {
    describe('when the queue answers', () => {
      /*
       * `#createScheduler()` is steered rather than run, because a real one opens a queue against a
       * Redis the suite has none of; it is exercised on its own above. The whole slice of the
       * sorted set is what gets asked for — `(0, -1, true)` — so a schedule is never missed for
       * sitting past a page boundary, which would report a registered purge as absent.
       */
      const cases = [
        {
          params: {
            SchedulerCtor: {
              schedulerId: 'alpha-schedule',
            },
          },
          mockSchedulerJsons: [
            {
              key: 'purge-expired-run-content',
              name: 'purge-expired-run-content',
              next: 1790000000000,
            },
          ],
          expected: [
            'purge-expired-run-content',
          ],
        },
        {
          params: {
            SchedulerCtor: {
              schedulerId: 'beta-schedule',
            },
          },
          mockSchedulerJsons: [
            {
              key: 'purge-expired-run-traces',
              name: 'purge-expired-run-traces',
              next: 1790000111111,
            },
            {
              key: 'purge-expired-provider-uploads',
              name: 'purge-expired-provider-uploads',
              next: 1790000222222,
            },
          ],
          expected: [
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
        },
      ]

      test.each(cases)('SchedulerCtor.schedulerId: $params.SchedulerCtor.schedulerId', async ({
        params,
        mockSchedulerJsons,
        expected,
      }) => {
        const queue = {
          getJobSchedulers: async () => mockSchedulerJsons,
        }
        const getJobSchedulersSpy = jest.spyOn(queue, 'getJobSchedulers')
        const scheduler = {
          queue,
          teardown: async () => null,
        }
        const reader = RegisteredJobScheduleReader.create({
          engine: {
            schedulersPath: '/alpha/jobs',
          },
        })
        jest.spyOn(reader, 'createScheduler')
          .mockResolvedValue(scheduler)

        const actual = await reader.readSchedulerIdsInQueue(params)

        expect(actual)
          .toEqual(expected)
        expect(getJobSchedulersSpy)
          .toHaveBeenCalledWith(0, -1, true)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#readSchedulerIdsInQueue()', () => {
    describe('when the queue answers with no schedule at all', () => {
      const cases = [
        {
          params: {
            SchedulerCtor: {
              schedulerId: 'alpha-schedule',
            },
          },
          mockSchedulerJsons: [],
        },
        {
          params: {
            SchedulerCtor: {
              schedulerId: 'beta-schedule',
            },
          },
          mockSchedulerJsons: [],
        },
      ]

      test.each(cases)('SchedulerCtor.schedulerId: $params.SchedulerCtor.schedulerId', async ({
        params,
        mockSchedulerJsons,
      }) => {
        const scheduler = {
          queue: {
            getJobSchedulers: async () => mockSchedulerJsons,
          },
          teardown: async () => null,
        }
        const reader = RegisteredJobScheduleReader.create({
          engine: {
            schedulersPath: '/alpha/jobs',
          },
        })
        jest.spyOn(reader, 'createScheduler')
          .mockResolvedValue(scheduler)

        const actual = await reader.readSchedulerIdsInQueue(params)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#readSchedulerIdsInQueue()', () => {
    describe('should close the queue it opened', () => {
      /*
       * A queue is a live Redis connection. A boot check leaking one per scheduler, every boot,
       * would be a worse defect than the gap it was added to close — which is why the framework's
       * own `#teardown()` is called in a `finally` and why both the answering and the failing path
       * are pinned here.
       */
      const cases = [
        {
          params: {
            SchedulerCtor: {
              schedulerId: 'alpha-schedule',
            },
          },
          mockSchedulerJsons: [
            {
              key: 'purge-expired-run-content',
              name: 'purge-expired-run-content',
              next: 1790000000000,
            },
          ],
        },
        {
          params: {
            SchedulerCtor: {
              schedulerId: 'beta-schedule',
            },
          },
          mockSchedulerJsons: [],
        },
      ]

      test.each(cases)('SchedulerCtor.schedulerId: $params.SchedulerCtor.schedulerId', async ({
        params,
        mockSchedulerJsons,
      }) => {
        const scheduler = {
          queue: {
            getJobSchedulers: async () => mockSchedulerJsons,
          },
          teardown: async () => null,
        }
        const teardownSpy = jest.spyOn(scheduler, 'teardown')
        const reader = RegisteredJobScheduleReader.create({
          engine: {
            schedulersPath: '/alpha/jobs',
          },
        })
        jest.spyOn(reader, 'createScheduler')
          .mockResolvedValue(scheduler)

        await reader.readSchedulerIdsInQueue(params)

        expect(teardownSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#readSchedulerIdsInQueue()', () => {
    describe('when the queue refuses the read', () => {
      const cases = [
        {
          params: {
            SchedulerCtor: {
              schedulerId: 'alpha-schedule',
            },
          },
          expected: 'alpha connection refused',
        },
        {
          params: {
            SchedulerCtor: {
              schedulerId: 'beta-schedule',
            },
          },
          expected: 'beta connection reset',
        },
      ]

      test.each(cases)('SchedulerCtor.schedulerId: $params.SchedulerCtor.schedulerId', async ({
        params,
        expected,
      }) => {
        const scheduler = {
          queue: {
            getJobSchedulers: async () => {
              throw new Error(expected)
            },
          },
          teardown: async () => null,
        }
        const teardownSpy = jest.spyOn(scheduler, 'teardown')
        const reader = RegisteredJobScheduleReader.create({
          engine: {
            schedulersPath: '/alpha/jobs',
          },
        })
        jest.spyOn(reader, 'createScheduler')
          .mockResolvedValue(scheduler)

        const actual = () => reader.readSchedulerIdsInQueue(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
        expect(teardownSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#extractSchedulerIds()', () => {
    describe('when every record carries its key', () => {
      const cases = [
        {
          params: {
            schedulerJsons: [
              {
                key: 'purge-expired-run-content',
                name: 'purge-expired-run-content',
                next: 1790000000000,
              },
            ],
          },
          expected: [
            'purge-expired-run-content',
          ],
        },
        {
          params: {
            schedulerJsons: [
              {
                key: 'purge-expired-run-traces',
                name: 'purge-expired-run-traces',
                next: 1790000111111,
              },
              {
                key: 'purge-expired-provider-uploads',
                name: 'purge-expired-provider-uploads',
                next: 1790000222222,
              },
            ],
          },
          expected: [
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
        },
      ]

      test.each(cases)('schedulerJsons[0].key: $params.schedulerJsons.0.key', ({
        params,
        expected,
      }) => {
        const reader = RegisteredJobScheduleReader.create({
          engine: {
            schedulersPath: '/alpha/jobs',
          },
        })

        const actual = reader.extractSchedulerIds(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#extractSchedulerIds()', () => {
    describe('when a record carries no key', () => {
      /*
       * BullMQ's own transform answers with nothing for a record whose hash has gone while the
       * sorted set still names it. Dropping it leaves the read one schedule short — which the
       * caller reports as missing, the safe direction — rather than faulting inside a check whose
       * whole purpose is to keep running.
       */
      const cases = [
        {
          params: {
            schedulerJsons: [
              {
                key: 'purge-expired-run-content',
                name: 'purge-expired-run-content',
                next: 1790000000000,
              },
              null,
            ],
          },
          expected: [
            'purge-expired-run-content',
          ],
        },
        {
          params: {
            schedulerJsons: [
              {
                key: 'purge-expired-run-traces',
                name: 'purge-expired-run-traces',
                next: 1790000111111,
              },
              {
                name: 'purge-expired-provider-uploads',
                next: 1790000222222,
              },
            ],
          },
          expected: [
            'purge-expired-run-traces',
          ],
        },
      ]

      test.each(cases)('schedulerJsons[0].key: $params.schedulerJsons.0.key', ({
        params,
        expected,
      }) => {
        const reader = RegisteredJobScheduleReader.create({
          engine: {
            schedulersPath: '/alpha/jobs',
          },
        })

        const actual = reader.extractSchedulerIds(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#readRegisteredSchedulerIds()', () => {
    describe('when every queue answers', () => {
      /*
       * The ids of every queue, in one list. The caller asks a membership question of it, so what
       * matters is that a schedule registered on the second queue is not lost behind the first.
       */
      const cases = [
        {
          mockSchedulerIdGroups: [
            [
              'purge-expired-run-content',
            ],
            [
              'purge-expired-run-traces',
            ],
          ],
          expected: [
            'purge-expired-run-content',
            'purge-expired-run-traces',
          ],
        },
        {
          mockSchedulerIdGroups: [
            [
              'purge-expired-run-traces',
            ],
            [],
          ],
          expected: [
            'purge-expired-run-traces',
          ],
        },
      ]

      test.each(cases)('mockSchedulerIdGroups[0][0]: $mockSchedulerIdGroups.0.0', async ({
        mockSchedulerIdGroups,
        expected,
      }) => {
        const reader = RegisteredJobScheduleReader.create({
          engine: {
            schedulersPath: '/alpha/jobs',
          },
          schedulerServiceFactory: {
            loadSchedulerCtors: async () => [
              {
                schedulerId: 'alpha-schedule',
              },
              {
                schedulerId: 'beta-schedule',
              },
            ],
          },
        })
        jest.spyOn(reader, 'readSchedulerIdsInQueue')
          .mockResolvedValueOnce(mockSchedulerIdGroups[0])
          .mockResolvedValueOnce(mockSchedulerIdGroups[1])

        const actual = await reader.readRegisteredSchedulerIds()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RegisteredJobScheduleReader', () => {
  describe('#readRegisteredSchedulerIds()', () => {
    describe('when the scan finds no scheduler', () => {
      const cases = [
        {
          label: 'a schedulers directory holding no scheduler class',
          mockSchedulerCtors: [],
        },
      ]

      test.each(cases)('label: $label', async ({
        mockSchedulerCtors,
      }) => {
        const reader = RegisteredJobScheduleReader.create({
          engine: {
            schedulersPath: '/alpha/jobs',
          },
          schedulerServiceFactory: {
            loadSchedulerCtors: async () => mockSchedulerCtors,
          },
        })

        const actual = await reader.readRegisteredSchedulerIds()

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})
