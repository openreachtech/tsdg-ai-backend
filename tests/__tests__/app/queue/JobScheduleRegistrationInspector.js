import timersPromises from 'node:timers/promises'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AppJobSchedulerService from '../../../../app/queue/AppJobSchedulerService.js'
import JobScheduleRegistrationInspector from '../../../../app/queue/JobScheduleRegistrationInspector.js'
import RegisteredJobScheduleReader from '../../../../app/queue/RegisteredJobScheduleReader.js'

/*
 * What this class decides, checked without a Redis anywhere near it.
 *
 * The declared half of the comparison runs for real — `AppJobSchedulerService`'s ids are the
 * three §19 purges, `purge-expired-run-content`, `purge-expired-run-traces` and
 * `purge-expired-provider-uploads`, and a case that wrote them down a third time would stop
 * failing the day the declaration changed. The registered half is the one thing a suite cannot
 * obtain, so the reader is handed in.
 *
 * Every case that reports asserts the logger call, because the log line **is** the control: this
 * check has no return value an operator reads and no exception it is allowed to raise, so a line
 * that is not written is a purge schedule that is missing and nobody told.
 */

describe('JobScheduleRegistrationInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#registeredScheduleReader', () => {
        const cases = [
          {
            params: {
              registeredScheduleReader: {
                label: 'alpha reader',
              },
            },
          },
          {
            params: {
              registeredScheduleReader: {
                label: 'beta reader',
              },
            },
          },
        ]

        test.each(cases)('registeredScheduleReader.label: $params.registeredScheduleReader.label', ({
          params,
        }) => {
          const inspector = new JobScheduleRegistrationInspector(params)

          expect(inspector)
            .toHaveProperty('registeredScheduleReader', params.registeredScheduleReader)
        })
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            registeredScheduleReader: {
              label: 'alpha reader',
            },
          },
        },
        {
          params: {
            registeredScheduleReader: {
              label: 'beta reader',
            },
          },
        },
      ]

      test.each(cases)('registeredScheduleReader.label: $params.registeredScheduleReader.label', ({
        params,
      }) => {
        const actual = JobScheduleRegistrationInspector.create(params)

        expect(actual)
          .toBeInstanceOf(JobScheduleRegistrationInspector)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('.create()', () => {
    describe('should be called by constructor', () => {
      /*
       * The engine is taken to build the reader from and is not kept, so the constructor is handed
       * the reader alone — the transformed object rather than what the caller passed.
       */
      const cases = [
        {
          params: {
            engine: {
              schedulersPath: '/alpha/jobs',
            },
            registeredScheduleReader: {
              label: 'alpha reader',
            },
          },
          expected: {
            registeredScheduleReader: {
              label: 'alpha reader',
            },
          },
        },
        {
          params: {
            engine: {
              schedulersPath: '/beta/jobs',
            },
            registeredScheduleReader: {
              label: 'beta reader',
            },
          },
          expected: {
            registeredScheduleReader: {
              label: 'beta reader',
            },
          },
        },
      ]

      test.each(cases)('registeredScheduleReader.label: $params.registeredScheduleReader.label', ({
        params,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(JobScheduleRegistrationInspector)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('.create()', () => {
    describe('should use default registeredScheduleReader value', () => {
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
        const createRegisteredScheduleReaderSpy = jest.spyOn(
          JobScheduleRegistrationInspector,
          'createRegisteredScheduleReader'
        )

        const actual = JobScheduleRegistrationInspector.create(params)

        expect(actual)
          .toBeInstanceOf(JobScheduleRegistrationInspector)
        expect(createRegisteredScheduleReaderSpy)
          .toHaveBeenCalledWith({
            engine: params.engine,
          })
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('.get:SchedulerServiceCtor', () => {
    test('should be the application scheduler service', () => {
      const expected = AppJobSchedulerService

      const actual = JobScheduleRegistrationInspector.SchedulerServiceCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('.get:mentsuLogger', () => {
    test('should be a logger client', () => {
      const actual = JobScheduleRegistrationInspector.mentsuLogger

      expect(actual)
        .toBeInstanceOf(MentsuLogger)
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('.get:timersPromises', () => {
    test('should be the standard library timers', () => {
      const expected = timersPromises

      const actual = JobScheduleRegistrationInspector.timersPromises

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('.createRegisteredScheduleReader()', () => {
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
      const actual = JobScheduleRegistrationInspector.createRegisteredScheduleReader(params)

      expect(actual)
        .toBeInstanceOf(RegisteredJobScheduleReader)
      expect(actual)
        .toHaveProperty('engine', params.engine)
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          registeredScheduleReader: {
            label: 'alpha reader',
          },
        },
      },
      {
        params: {
          registeredScheduleReader: {
            label: 'beta reader',
          },
        },
      },
    ]

    test.each(cases)('registeredScheduleReader.label: $params.registeredScheduleReader.label', ({
      params,
    }) => {
      const inspector = JobScheduleRegistrationInspector.create(params)

      const actual = inspector.Ctor

      expect(actual)
        .toBe(JobScheduleRegistrationInspector) // same reference
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#extractDeclaredSchedulerIds()', () => {
    describe('when read from the application scheduler service', () => {
      /*
       * Run for real, because it can be: `collectScheduleInputs()` assembles three cron
       * expressions
       * and opens nothing. This is the half of the comparison the brief calls authoritative — the
       * same list `scripts/startJobSchedulers.js` registers from, already held to the folder scan
       * by `AppJobSchedulerService`'s own test — so the ids are read here rather than written down
       * a second time where they could fall out of step.
       */
      const cases = [
        {
          label: 'the three purge schedules §19 declares for this version',
          expected: [
            'purge-expired-run-content',
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
        },
      ]

      test.each(cases)('label: $label', async ({
        expected,
      }) => {
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => [],
          },
        })

        const actual = await inspector.extractDeclaredSchedulerIds()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#extractDeclaredSchedulerIds()', () => {
    describe('when the scheduler service is substituted', () => {
      const cases = [
        {
          mockScheduleInputs: [
            {
              schedulerId: 'alpha-schedule',
            },
          ],
          expected: [
            'alpha-schedule',
          ],
        },
        {
          mockScheduleInputs: [
            {
              schedulerId: 'beta-schedule',
            },
            {
              schedulerId: 'gamma-schedule',
            },
          ],
          expected: [
            'beta-schedule',
            'gamma-schedule',
          ],
        },
      ]

      test.each(cases)('mockScheduleInputs[0].schedulerId: $mockScheduleInputs.0.schedulerId', async ({
        mockScheduleInputs,
        expected,
      }) => {
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => [],
          },
        })
        jest.spyOn(JobScheduleRegistrationInspector, 'SchedulerServiceCtor', 'get')
          .mockReturnValue({
            collectScheduleInputs: async () => mockScheduleInputs,
          })

        const actual = await inspector.extractDeclaredSchedulerIds()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#extractMissingSchedulerIds()', () => {
    describe('when Redis is short of a declared schedule', () => {
      const cases = [
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-run-content',
          ],
          expected: [
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
        },
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-run-traces',
          ],
          expected: [
            'purge-expired-run-content',
            'purge-expired-provider-uploads',
          ],
        },
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-provider-uploads',
          ],
          expected: [
            'purge-expired-run-content',
            'purge-expired-run-traces',
          ],
        },
        {
          mockRegisteredSchedulerIds: [],
          expected: [
            'purge-expired-run-content',
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
        },
      ]

      test.each(cases)('mockRegisteredSchedulerIds[0]: $mockRegisteredSchedulerIds.0', async ({
        mockRegisteredSchedulerIds,
        expected,
      }) => {
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => mockRegisteredSchedulerIds,
          },
        })

        const actual = await inspector.extractMissingSchedulerIds()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#extractMissingSchedulerIds()', () => {
    describe('when Redis holds every declared schedule', () => {
      /*
       * The comparison runs one way only. A schedule Redis holds that this repository no longer
       * declares — the orphan a rename leaves behind — is not answered here, because the operator
       * action for it is `npm run schedulers:stop` rather than `schedulers:start`. The second case
       * is what pins that: an extra id is not a finding.
       */
      const cases = [
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-run-content',
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
        },
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
            'purge-expired-run-content',
            'purge-expired-provider-files',
          ],
        },
      ]

      test.each(cases)('mockRegisteredSchedulerIds[0]: $mockRegisteredSchedulerIds.0', async ({
        mockRegisteredSchedulerIds,
      }) => {
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => mockRegisteredSchedulerIds,
          },
        })

        const actual = await inspector.extractMissingSchedulerIds()

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#extractMissingSchedulerIdsWithinDeadline()', () => {
    describe('when the read answers in time', () => {
      const cases = [
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-run-content',
          ],
          expected: [
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
        },
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-run-traces',
          ],
          expected: [
            'purge-expired-run-content',
            'purge-expired-provider-uploads',
          ],
        },
      ]

      test.each(cases)('mockRegisteredSchedulerIds[0]: $mockRegisteredSchedulerIds.0', async ({
        mockRegisteredSchedulerIds,
        expected,
      }) => {
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => mockRegisteredSchedulerIds,
          },
        })

        const actual = await inspector.extractMissingSchedulerIdsWithinDeadline()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#extractMissingSchedulerIdsWithinDeadline()', () => {
    describe('when the read never answers', () => {
      /*
       * `RedisConnection` issues `maxRetriesPerRequest: null`, so a read against a Redis that is
       * not there pends rather than rejects — the reader stub below is that, exactly. Without the
       * deadline this check would hang and report nothing, and reporting nothing is the same shape
       * as reporting that every schedule is registered.
       */
      const cases = [
        {
          label: 'a reader whose promise never settles',
          expected: 'gave up on a read of the registered job schedules',
        },
      ]

      test.each(cases)('label: $label', async ({
        expected,
      }) => {
        const timers = {
          setTimeout: async () => null,
        }
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: () => new Promise(() => {}),
          },
        })
        jest.spyOn(JobScheduleRegistrationInspector, 'timersPromises', 'get')
          .mockReturnValue(timers)

        const actual = () => inspector.extractMissingSchedulerIdsWithinDeadline()

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#refuseRegistrationAtDeadline()', () => {
    const cases = [
      {
        label: 'a signal of its own',
        expected: 'gave up on a read of the registered job schedules',
      },
    ]

    test.each(cases)('label: $label', async ({
      expected,
    }) => {
      const timers = {
        setTimeout: async () => null,
      }
      const setTimeoutSpy = jest.spyOn(timers, 'setTimeout')
      const deadlineTerminator = new AbortController()
      const inspector = JobScheduleRegistrationInspector.create({
        registeredScheduleReader: {
          readRegisteredSchedulerIds: async () => [],
        },
      })
      jest.spyOn(JobScheduleRegistrationInspector, 'timersPromises', 'get')
        .mockReturnValue(timers)

      const actual = () => inspector.refuseRegistrationAtDeadline({
        signal: deadlineTerminator.signal,
      })

      await expect(actual)
        .rejects
        .toThrow(expected)
      expect(setTimeoutSpy)
        .toHaveBeenCalledWith(
          5000,
          null,
          {
            signal: deadlineTerminator.signal,
          }
        )
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#reportMissingSchedules()', () => {
    describe('when schedules are missing', () => {
      const cases = [
        {
          params: {
            missingSchedulerIds: [
              'purge-expired-run-traces',
            ],
          },
          expected: {
            message: 'JobScheduleRegistrationInspector declared job schedules are not registered in Redis: purge-expired-run-traces',
            tags: [
              'JobScheduleRegistration',
              'MissingSchedule',
            ],
          },
        },
        {
          params: {
            missingSchedulerIds: [
              'purge-expired-run-content',
              'purge-expired-run-traces',
            ],
          },
          expected: {
            message: 'JobScheduleRegistrationInspector declared job schedules are not registered in Redis: purge-expired-run-content, purge-expired-run-traces',
            tags: [
              'JobScheduleRegistration',
              'MissingSchedule',
            ],
          },
        },
      ]

      test.each(cases)('missingSchedulerIds[0]: $params.missingSchedulerIds.0', ({
        params,
        expected,
      }) => {
        const errorSpy = jest.spyOn(JobScheduleRegistrationInspector.mentsuLogger, 'error')
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => [],
          },
        })

        const actual = inspector.reportMissingSchedules(params)

        expect(actual)
          .toBeNull()
        expect(errorSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#reportMissingSchedules()', () => {
    describe('when nothing is missing', () => {
      const cases = [
        {
          label: 'no missing scheduler id at all',
          params: {
            missingSchedulerIds: [],
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const errorSpy = jest.spyOn(JobScheduleRegistrationInspector.mentsuLogger, 'error')
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => [],
          },
        })

        const actual = inspector.reportMissingSchedules(params)

        expect(actual)
          .toBeNull()
        expect(errorSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#reportUnreadableRegistration()', () => {
    const cases = [
      {
        params: {
          error: new Error('alpha connection refused'),
        },
        expected: {
          message: 'JobScheduleRegistrationInspector the registered job schedules could not be read: alpha connection refused',
          tags: [
            'JobScheduleRegistration',
            'UnreadableRegistration',
          ],
        },
      },
      {
        params: {
          error: new Error('gave up on a read of the registered job schedules'),
        },
        expected: {
          message: 'JobScheduleRegistrationInspector the registered job schedules could not be read: gave up on a read of the registered job schedules',
          tags: [
            'JobScheduleRegistration',
            'UnreadableRegistration',
          ],
        },
      },
    ]

    test.each(cases)('error.message: $params.error.message', ({
      params,
      expected,
    }) => {
      const errorSpy = jest.spyOn(JobScheduleRegistrationInspector.mentsuLogger, 'error')
      const inspector = JobScheduleRegistrationInspector.create({
        registeredScheduleReader: {
          readRegisteredSchedulerIds: async () => [],
        },
      })

      const actual = inspector.reportUnreadableRegistration(params)

      expect(actual)
        .toBeNull()
      expect(errorSpy)
        .toHaveBeenCalledWith(expected)
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#extractErrorMessage()', () => {
    const cases = [
      {
        params: {
          error: new Error('alpha connection refused'),
        },
        expected: 'alpha connection refused',
      },
      {
        params: {
          error: new Error('beta connection reset'),
        },
        expected: 'beta connection reset',
      },
      {
        params: {
          error: 'gamma thrown as a plain string',
        },
        expected: 'Error',
      },
      {
        params: {
          error: null,
        },
        expected: 'Error',
      },
    ]

    test.each(cases)('error: $params.error', ({
      params,
      expected,
    }) => {
      const inspector = JobScheduleRegistrationInspector.create({
        registeredScheduleReader: {
          readRegisteredSchedulerIds: async () => [],
        },
      })

      const actual = inspector.extractErrorMessage(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#inspectRegisteredSchedules()', () => {
    describe('when Redis holds every declared schedule', () => {
      /*
       * Nothing is written, and that silence is the whole of what a healthy boot looks like. It is
       * also why every other case here asserts the call: silence is what the missing-schedule
       * failure used to look like too, and the only thing separating the two is now this class.
       */
      const cases = [
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-run-content',
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
        },
        {
          mockRegisteredSchedulerIds: [
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
            'purge-expired-run-content',
          ],
        },
      ]

      test.each(cases)('mockRegisteredSchedulerIds[0]: $mockRegisteredSchedulerIds.0', async ({
        mockRegisteredSchedulerIds,
      }) => {
        const errorSpy = jest.spyOn(JobScheduleRegistrationInspector.mentsuLogger, 'error')
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => mockRegisteredSchedulerIds,
          },
        })

        const actual = await inspector.inspectRegisteredSchedules()

        expect(actual)
          .toBeNull()
        expect(errorSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#inspectRegisteredSchedules()', () => {
    describe('when one declared schedule is missing', () => {
      /*
       * The id is the finding. "Some schedules are missing" tells an operator to go and look;
       * `purge-expired-run-traces` tells them which horizon is not being applied, which is §7's
       * 730-day one and therefore which data is being kept.
       *
       * The third case is the one a deployment actually meets: a job was added to the repository
       * and `npm run schedulers:start` was never run again, so a Redis that was complete yesterday
       * holds every purge except the one that landed today.
       */
      const cases = [
        {
          label: 'a Redis holding every purge but the run-content one',
          mockRegisteredSchedulerIds: [
            'purge-expired-run-traces',
            'purge-expired-provider-uploads',
          ],
          expected: {
            message: 'JobScheduleRegistrationInspector declared job schedules are not registered in Redis: purge-expired-run-content',
            tags: [
              'JobScheduleRegistration',
              'MissingSchedule',
            ],
          },
        },
        {
          label: 'a Redis holding every purge but the run-traces one',
          mockRegisteredSchedulerIds: [
            'purge-expired-run-content',
            'purge-expired-provider-uploads',
          ],
          expected: {
            message: 'JobScheduleRegistrationInspector declared job schedules are not registered in Redis: purge-expired-run-traces',
            tags: [
              'JobScheduleRegistration',
              'MissingSchedule',
            ],
          },
        },
        {
          label: 'a Redis holding both run purges but not the provider-uploads one',
          mockRegisteredSchedulerIds: [
            'purge-expired-run-content',
            'purge-expired-run-traces',
          ],
          expected: {
            message: 'JobScheduleRegistrationInspector declared job schedules are not registered in Redis: purge-expired-provider-uploads',
            tags: [
              'JobScheduleRegistration',
              'MissingSchedule',
            ],
          },
        },
      ]

      test.each(cases)('label: $label', async ({
        mockRegisteredSchedulerIds,
        expected,
      }) => {
        const errorSpy = jest.spyOn(JobScheduleRegistrationInspector.mentsuLogger, 'error')
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => mockRegisteredSchedulerIds,
          },
        })

        const actual = await inspector.inspectRegisteredSchedules()

        expect(actual)
          .toBeNull()
        expect(errorSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#inspectRegisteredSchedules()', () => {
    describe('when every declared schedule is missing', () => {
      /*
       * The registration script was never run against this Redis, which is the failure the whole
       * check exists for: every retention horizon §19 delivers unapplied, every purge queue green
       * and empty, and the purge log silent — indistinguishable, until this line, from a service
       * sweeping nightly.
       */
      const cases = [
        {
          label: 'a Redis holding no schedule at all',
          mockRegisteredSchedulerIds: [],
          expected: {
            message: 'JobScheduleRegistrationInspector declared job schedules are not registered in Redis: purge-expired-run-content, purge-expired-run-traces, purge-expired-provider-uploads',
            tags: [
              'JobScheduleRegistration',
              'MissingSchedule',
            ],
          },
        },
        {
          label: 'a Redis holding only a schedule this repository does not declare',
          mockRegisteredSchedulerIds: [
            'purge-expired-provider-files',
          ],
          expected: {
            message: 'JobScheduleRegistrationInspector declared job schedules are not registered in Redis: purge-expired-run-content, purge-expired-run-traces, purge-expired-provider-uploads',
            tags: [
              'JobScheduleRegistration',
              'MissingSchedule',
            ],
          },
        },
      ]

      test.each(cases)('label: $label', async ({
        mockRegisteredSchedulerIds,
        expected,
      }) => {
        const errorSpy = jest.spyOn(JobScheduleRegistrationInspector.mentsuLogger, 'error')
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => mockRegisteredSchedulerIds,
          },
        })

        const actual = await inspector.inspectRegisteredSchedules()

        expect(actual)
          .toBeNull()
        expect(errorSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#inspectRegisteredSchedules()', () => {
    describe('when the read itself fails', () => {
      /*
       * Reported and not thrown. The daemon this runs in also serves callback delivery and asset
       * media extraction, and a check that could not reach Redis is no reason to take those down —
       * so the failure ends as a written line and a `null`, on every path.
       */
      const cases = [
        {
          mockReadFailure: new Error('alpha connection refused'),
          expected: {
            message: 'JobScheduleRegistrationInspector the registered job schedules could not be read: alpha connection refused',
            tags: [
              'JobScheduleRegistration',
              'UnreadableRegistration',
            ],
          },
        },
        {
          mockReadFailure: new Error('beta answered a shape nothing expected'),
          expected: {
            message: 'JobScheduleRegistrationInspector the registered job schedules could not be read: beta answered a shape nothing expected',
            tags: [
              'JobScheduleRegistration',
              'UnreadableRegistration',
            ],
          },
        },
      ]

      test.each(cases)('mockReadFailure.message: $mockReadFailure.message', async ({
        mockReadFailure,
        expected,
      }) => {
        const errorSpy = jest.spyOn(JobScheduleRegistrationInspector.mentsuLogger, 'error')
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: async () => {
              throw mockReadFailure
            },
          },
        })

        const actual = await inspector.inspectRegisteredSchedules()

        expect(actual)
          .toBeNull()
        expect(errorSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('JobScheduleRegistrationInspector', () => {
  describe('#inspectRegisteredSchedules()', () => {
    describe('when the read never answers', () => {
      const cases = [
        {
          label: 'a reader whose promise never settles',
          expected: {
            message: 'JobScheduleRegistrationInspector the registered job schedules could not be read: gave up on a read of the registered job schedules',
            tags: [
              'JobScheduleRegistration',
              'UnreadableRegistration',
            ],
          },
        },
      ]

      test.each(cases)('label: $label', async ({
        expected,
      }) => {
        const timers = {
          setTimeout: async () => null,
        }
        const errorSpy = jest.spyOn(JobScheduleRegistrationInspector.mentsuLogger, 'error')
        const inspector = JobScheduleRegistrationInspector.create({
          registeredScheduleReader: {
            readRegisteredSchedulerIds: () => new Promise(() => {}),
          },
        })
        jest.spyOn(JobScheduleRegistrationInspector, 'timersPromises', 'get')
          .mockReturnValue(timers)

        const actual = await inspector.inspectRegisteredSchedules()

        expect(actual)
          .toBeNull()
        expect(errorSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
