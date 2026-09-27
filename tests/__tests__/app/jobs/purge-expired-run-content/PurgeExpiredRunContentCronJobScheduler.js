import BaseAiRunPurgeCronJobScheduler from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeCronJobScheduler.js'

import AppJobEngine from '../../../../../app/queue/AppJobEngine.js'

import PurgeExpiredRunContentCronJobScheduler from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentCronJobScheduler.js'
import PurgeExpiredRunContentJobManifest from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentJobManifest.js'

describe('PurgeExpiredRunContentCronJobScheduler', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredRunContentCronJobScheduler.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeCronJobScheduler)
    })
  })
})

describe('PurgeExpiredRunContentCronJobScheduler', () => {
  describe('.get:EngineCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentCronJobScheduler.EngineCtor

        expect(actual)
          .toBe(AppJobEngine) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunContentCronJobScheduler', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentCronJobScheduler.ManifestCtor

        expect(actual)
          .toBe(PurgeExpiredRunContentJobManifest) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunContentCronJobScheduler', () => {
  describe('.get:schedulerId', () => {
    describe('when called as is', () => {
      /*
       * BullMQ keys the repeatable job by this string, so it is not a label. Changing it does not
       * rename the schedule: it registers a second one and leaves the first firing forever under a
       * name `scripts/stopJobSchedulers.js` no longer knows. The literal is pinned for that
       * reason, not for tidiness.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentCronJobScheduler.schedulerId

        expect(actual)
          .toBe('purge-expired-run-content')
      })
    })
  })
})

describe('PurgeExpiredRunContentCronJobScheduler', () => {
  describe('.get:cronExpression', () => {
    describe('when called as is', () => {
      /*
       * §19's "a daily schedule", and §7 is why it cannot be looser. The content clock is thirty
       * days, and all four of the things §7 names as personal data are content — so the gap
       * between a run's thirtieth day and the sweep that reaches it is the amount by which this
       * service over-keeps personal data beyond what it promised. A day is the coarsest that gap
       * can be while the schedule is still daily.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentCronJobScheduler.cronExpression

        expect(actual)
          .toBe('0 3 * * *')
      })
    })
  })
})

describe('PurgeExpiredRunContentCronJobScheduler', () => {
  describe('.buildScheduleInput()', () => {
    describe('when called as is', () => {
      /*
       * The whole input, because every field of it is a way for the schedule to silently not
       * exist. A `schedulerId` that does not match the one the scan reads leaves the service
       * substituting `body: null`, which fails validation and returns a response carrying neither
       * a job nor an error; a `schedule` under any key but `cronExpression` fails the same way.
       */
      test('should be fixed value', () => {
        const expected = {
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
        }

        const actual = PurgeExpiredRunContentCronJobScheduler.buildScheduleInput()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
