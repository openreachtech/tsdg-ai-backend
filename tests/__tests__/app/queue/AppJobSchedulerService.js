import {
  BaseJobSchedulerService,
} from '@openreachtech/renchan-job-bullmq'

import AppJobEngine from '../../../../app/queue/AppJobEngine.js'
import AppJobSchedulerService from '../../../../app/queue/AppJobSchedulerService.js'

describe('AppJobSchedulerService', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AppJobSchedulerService.prototype

      expect(received)
        .toBeInstanceOf(BaseJobSchedulerService)
    })
  })
})

describe('AppJobSchedulerService', () => {
  describe('.collectScheduleInputs()', () => {
    describe('when called as is', () => {
      /*
       * §19 declares three scheduled purges, and all three are here now that the first vendor
       * driver exists — the third row, the provider-upload purge, was deferred under "Out of scope
       * for now" for exactly as long as the only driver was the stub, which uploads nothing and
       * would have had a schedule stamping "the copy was deleted" without a copy having been
       * deleted.
       *
       * The list is compared whole, because a scheduler missing from it registers nothing while
       * `scripts/startJobSchedulers.js` reports success: the framework substitutes
       * `{ schedule: null, body: null, optionHash: null }` for an id it finds no input under, and
       * the schedule simply never fires. There is no scan that catches the omission.
       */
      test('should carry every schedule this version declares', async () => {
        const expected = [
          {
            schedulerId: 'purge-expired-run-content',
            schedule: {
              cronExpression: '0 3 * * *',
            },
            body: {},
            optionHash: {
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
          {
            schedulerId: 'purge-expired-run-traces',
            schedule: {
              cronExpression: '0 4 * * 0',
            },
            body: {},
            optionHash: {
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
          {
            schedulerId: 'purge-expired-provider-uploads',
            schedule: {
              cronExpression: '0 5 * * *',
            },
            body: {},
            optionHash: {
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
        ]

        const actual = await AppJobSchedulerService.collectScheduleInputs()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AppJobSchedulerService', () => {
  describe('.collectScheduleInputs()', () => {
    describe('when matched against what the folder scan finds', () => {
      /*
       * **The one silent failure this whole wiring has, turned into a red test.**
       *
       * The schedulers themselves are discovered — `BaseJobSchedulerService` scans the engine's
       * `schedulersPath` — but *when* each fires is not, and the framework does not treat a
       * missing answer as an error. `resolveScheduleInput()` substitutes
       * `{ schedule: null, body: null, optionHash: null }` for a `schedulerId` it finds no input
       * under, `JobBody` then refuses the null body, and `#startSchedule()` returns a response
       * carrying neither a job nor an error. A scheduler added under `app/jobs/` and forgotten
       * here would therefore register nothing, throw nothing, log nothing, and be discovered as a
       * purge that had never once run.
       *
       * So the expectation is taken from the scan rather than written down a second time, and this
       * case fails the moment the number of scheduler classes under the engine's `schedulersPath`
       * stops matching the number of inputs. Which ids those are is pinned by the case above; what
       * this one adds is that neither list can grow without the other.
       */
      test('should name every scheduler the engine scan discovers', async () => {
        const schedulerCtors = await AppJobSchedulerService.loadSchedulerCtors({
          engine: {
            schedulersPath: AppJobEngine.config.schedulersPath,
          },
        })
        const expected = schedulerCtors.length

        const actual = await AppJobSchedulerService.collectScheduleInputs()

        expect(actual)
          .toHaveLength(expected)
      })
    })
  })
})
