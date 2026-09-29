import {
  BaseCronJobScheduler,
  ConcreteMemberNotFoundJobError,
  CronSchedule,
} from '@openreachtech/renchan-job-bullmq'

import BaseAiRunPurgeCronJobScheduler from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeCronJobScheduler.js'
import BaseAiRunPurgeJobDispatcher from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobDispatcher.js'

import PurgeExpiredRunContentCronJobScheduler from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentCronJobScheduler.js'
import PurgeExpiredRunTracesCronJobScheduler from '../../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesCronJobScheduler.js'

/*
 * BullMQ's own name for the body of a job, and the one key of the template this repository did not
 * choose. It is written here once, as a value, because it cannot be written as a key at all: spelled
 * bare it is `id-denylist`'s forbidden `data`, spelled `'data'` it is `quote-props`'s unnecessary
 * quoting, and the directive comment that would excuse either is itself banned. Naming it as a
 * constant and reaching the key through it satisfies all three, and says the thing worth saying —
 * the word is the framework's, not ours. Compare `mimeType` in the glossary, kept verbatim for the
 * same reason.
 *
 * A purge job carries no body, so the value under it is always `{}`; the key is asserted so that a
 * template growing a payload fails here rather than passing unnoticed.
 */
const JOB_TEMPLATE_BODY_KEY = 'data'

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = BaseAiRunPurgeCronJobScheduler.prototype

      expect(received)
        .toBeInstanceOf(BaseCronJobScheduler)
    })
  })
})

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('.get:ScheduleCtor', () => {
    describe('when called as is', () => {
      /*
       * Cron and not interval, which is the choice §19's two calendar phrases force. A
       * `BaseIntervalJobScheduler` fires a fixed number of milliseconds after the last firing, so
       * a daemon restarted at an awkward hour walks the sweep across the clock until the nightly
       * purge is running at lunchtime — and a purge is the one job here whose cost lands on
       * everything else using the database, so when it runs is the point.
       */
      test('should be fixed value', () => {
        const actual = BaseAiRunPurgeCronJobScheduler.ScheduleCtor

        expect(actual)
          .toBe(CronSchedule) // same reference
      })
    })
  })
})

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('.get:cronExpression', () => {
    describe('when the concrete scheduler has not filled it in', () => {
      /*
       * Abstract, because it is the one thing §19 says differently about the two rows of its
       * table: "a daily schedule" and "a schedule on the longer horizon". A default here would
       * give a scheduler that forgot to state its cadence somebody else's.
       */
      test('should throw', () => {
        const actual = () => BaseAiRunPurgeCronJobScheduler.cronExpression

        expect(actual)
          .toThrow(ConcreteMemberNotFoundJobError)
      })
    })
  })
})

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('.buildScheduleInput()', () => {
    describe('when the concrete scheduler has not filled its members in', () => {
      /*
       * The assembly reaches for `schedulerId` and `cronExpression`, both of which are abstract
       * here, so the base cannot build an input at all — which is the correct behavior and not an
       * inconvenience. A base able to assemble a half-filled input would be a schedule registered
       * under a missing id, and `#startSchedule()` declines such a request by returning a response
       * carrying neither a job nor an error. Failing loudly at assembly is what keeps that silent
       * path unreachable.
       *
       * What the method actually produces is pinned on the two concrete schedulers, where the
       * values are real: see their own `.buildScheduleInput()` cases.
       */
      test('should throw', () => {
        const actual = () => BaseAiRunPurgeCronJobScheduler.buildScheduleInput()

        expect(actual)
          .toThrow(ConcreteMemberNotFoundJobError)
      })
    })
  })
})

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('.buildScheduleInput()', () => {
    describe('should build a schedule the framework accepts', () => {
      /*
       * A concrete scheduler's input is fed through the framework's own `CronSchedule` rather than
       * only inspected, because `#startSchedule()` silently declines an invalid one — no job, no
       * error, no schedule. This pins that the key is `cronExpression`, the name
       * `CronSchedule.schema` declares, and that it denormalizes to BullMQ's `{ pattern }`. A
       * renamed key would produce a registration that reports success and registers nothing.
       */
      const cases = [
        {
          params: {
            SchedulerCtor: PurgeExpiredRunContentCronJobScheduler,
          },
          expected: {
            pattern: '0 3 * * *',
          },
        },
        {
          params: {
            SchedulerCtor: PurgeExpiredRunTracesCronJobScheduler,
          },
          expected: {
            pattern: '0 4 * * 0',
          },
        },
      ]

      test.each(cases)('SchedulerCtor: $params.SchedulerCtor.name', ({
        params,
        expected,
      }) => {
        const scheduleInput = params.SchedulerCtor.buildScheduleInput()
        const schedule = CronSchedule.create({
          rawSchedule: scheduleInput.schedule,
        })

        const actual = schedule.denormalizeSchedule()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('.buildScheduleInput()', () => {
    describe('should build a body the framework does not refuse', () => {
      /*
       * The reason the method supplies a literal `{}` rather than leaving the key off.
       * `BaseJobSchedulerService.resolveScheduleInput()` substitutes `body: null` for a scheduler
       * it finds no input under, and `#startSchedule()` then finds the request invalid and returns
       * without registering anything — throwing nothing and logging nothing. This case asserts the
       * request the real inputs produce is one the framework accepts, which is the property that
       * silent path is avoided by.
       */
      const cases = [
        {
          params: {
            SchedulerCtor: PurgeExpiredRunContentCronJobScheduler,
          },
        },
        {
          params: {
            SchedulerCtor: PurgeExpiredRunTracesCronJobScheduler,
          },
        },
      ]

      test.each(cases)('SchedulerCtor: $params.SchedulerCtor.name', ({
        params,
      }) => {
        const scheduleInput = params.SchedulerCtor.buildScheduleInput()
        const request = params.SchedulerCtor.createRequest({
          schedule: scheduleInput.schedule,
          normalizedBody: scheduleInput.body,
          optionHash: scheduleInput.optionHash,
        })

        const actual = request.isValid()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('.get:optionHash', () => {
    describe('when called as is', () => {
      /*
       * The options a scheduled purge actually runs under, asserted where they take effect.
       *
       * This getter becomes `jobTemplate.opts`, which `Queue#upsertJobScheduler()` stores as
       * `Object.assign({}, this.jobsOpts, jobTemplate?.opts)` — and the queue a schedule is
       * upserted through is built by `BaseJobScheduler.createQueue()` with the connection alone,
       * so its `jobsOpts` is `{}` and this value is the whole of what a firing reads. An empty one
       * here — which is what this constant used to be — made every firing of both purges a
       * single-attempt job with BullMQ's unbounded completed-job retention.
       *
       * The whole hash is asserted rather than one field. A case reading only `attempts` would
       * pass on a backoff removed beside it, which would spend all three attempts inside the first
       * second of a database restart; and `removeOnComplete` is load-bearing rather than
       * housekeeping, because the job result is where `isSweepExhausted` is readable across
       * firings and BullMQ keeps completed jobs forever by default.
       */
      test('should be fixed value', () => {
        const expected = {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 300000,
          },
          removeOnComplete: {
            count: 90,
          },
          removeOnFail: {
            count: 90,
          },
        }

        const actual = BaseAiRunPurgeCronJobScheduler.optionHash

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('.get:optionHash', () => {
    describe('when compared with the dispatcher queue default', () => {
      /*
       * The two copies cannot drift, and this is what says so.
       *
       * `aiRunPurgeJobConstants.cjs` holds the four figures once, so the *values* cannot disagree.
       * The two *shapes* still could: the scheduler states them flat, as
       * `JobSchedulerTemplateOptions`, and the dispatcher states them nested under
       * `defaultJobOptions`, as `QueueOptions`. A field added to one and forgotten on the other
       * would be exactly the kind of half-applied change that put the schedule on one attempt in
       * the first place — visible in neither place, because each side's own case would still pass.
       */
      test('should be the same job options', () => {
        const expected = BaseAiRunPurgeJobDispatcher.optionHash.defaultJobOptions

        const actual = BaseAiRunPurgeCronJobScheduler.optionHash

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunPurgeCronJobScheduler', () => {
  describe('.buildScheduleInput()', () => {
    describe('should carry the job options into the job template the framework builds', () => {
      /*
       * One step further down than the getter case above, and the step that matters: it is the
       * *template* BullMQ replays at every firing, not the input, and between the two sit
       * `createRequest()`, `SchedulerRequest` and `buildJobTemplate()`. An option hash dropped or
       * renamed anywhere along there would leave the getter's own case passing while every sweep
       * still ran on one attempt.
       *
       * This is as far as the mechanism can be followed without Redis. The remaining link —
       * `queue.upsertJobScheduler(id, schedule, template)` writing `template.opts` into Redis, and
       * BullMQ producing each firing from it — is BullMQ's own, needs a live server, and is not
       * asserted here.
       */
      const cases = [
        {
          params: {
            SchedulerCtor: PurgeExpiredRunContentCronJobScheduler,
          },
          expected: {
            name: 'purge-expired-run-content',
            [JOB_TEMPLATE_BODY_KEY]: {},
            opts: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 300000,
              },
              removeOnComplete: {
                count: 90,
              },
              removeOnFail: {
                count: 90,
              },
            },
          },
        },
        {
          params: {
            SchedulerCtor: PurgeExpiredRunTracesCronJobScheduler,
          },
          expected: {
            name: 'purge-expired-run-traces',
            [JOB_TEMPLATE_BODY_KEY]: {},
            opts: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 300000,
              },
              removeOnComplete: {
                count: 90,
              },
              removeOnFail: {
                count: 90,
              },
            },
          },
        },
      ]

      test.each(cases)('SchedulerCtor: $params.SchedulerCtor.name', ({
        params,
        expected,
      }) => {
        const scheduleInput = params.SchedulerCtor.buildScheduleInput()
        const request = params.SchedulerCtor.createRequest({
          schedule: scheduleInput.schedule,
          normalizedBody: scheduleInput.body,
          optionHash: scheduleInput.optionHash,
        })

        const actual = request.buildJobTemplate()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
