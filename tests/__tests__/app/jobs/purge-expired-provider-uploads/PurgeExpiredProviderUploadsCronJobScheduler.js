import BaseAiRunPurgeCronJobScheduler from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeCronJobScheduler.js'

import AppJobEngine from '../../../../../app/queue/AppJobEngine.js'

import PurgeExpiredProviderUploadsCronJobScheduler from '../../../../../app/jobs/purge-expired-provider-uploads/PurgeExpiredProviderUploadsCronJobScheduler.js'
import PurgeExpiredProviderUploadsJobManifest from '../../../../../app/jobs/purge-expired-provider-uploads/PurgeExpiredProviderUploadsJobManifest.js'

describe('PurgeExpiredProviderUploadsCronJobScheduler', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredProviderUploadsCronJobScheduler.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeCronJobScheduler)
    })
  })
})

describe('PurgeExpiredProviderUploadsCronJobScheduler', () => {
  describe('.get:EngineCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsCronJobScheduler.EngineCtor

        expect(received)
          .toBe(AppJobEngine) // same reference
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsCronJobScheduler', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsCronJobScheduler.ManifestCtor

        expect(received)
          .toBe(PurgeExpiredProviderUploadsJobManifest) // same reference
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsCronJobScheduler', () => {
  describe('.get:schedulerId', () => {
    describe('when called as is', () => {
      /*
       * BullMQ keys the repeatable job by this string, so it is not a label. Changing it does not
       * rename the schedule: it registers a second one and leaves the first firing for ever under a
       * name `scripts/stopJobSchedulers.js` no longer knows. The literal is pinned for that reason,
       * not for tidiness.
       */
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsCronJobScheduler.schedulerId

        expect(received)
          .toBe('purge-expired-provider-uploads')
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsCronJobScheduler', () => {
  describe('.get:cronExpression', () => {
    describe('when called as is', () => {
      /*
       * Section 19's "a daily schedule" for the third row, and the reason it cannot be looser is
       * that the clock this job acts on is mostly not ours: a file becomes ripe the moment its
       * provider's stated expiry passes, and the gap between that moment and the sweep that reaches
       * it is time a copy sits at a vendor that has said it is past keeping it. A day is the
       * coarsest that gap can be while the schedule is still daily.
       *
       * The hour is pinned too, and it is 05:00 rather than either of the other two purges': they
       * are database work at 03:00 and 04:00, and starting an hour of outbound HTTP while one of
       * them is still running would put three retention sweeps in flight at once on a Sunday
       * morning.
       */
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsCronJobScheduler.cronExpression

        expect(received)
          .toBe('0 5 * * *')
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsCronJobScheduler', () => {
  describe('.get:optionHash', () => {
    describe('when called as is', () => {
      /*
       * Inherited from the shared purge scheduler, and asserted here because this is the copy that
       * governs: a repeatable job is produced from the template stored at registration, so these
       * are the only options a nightly firing ever sees. Without the retry budget a sweep lost to a
       * dropped connection costs a whole night; without the retention bound the job that exists to
       * stop copies accumulating keeps a record of every firing for ever.
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

        const received = PurgeExpiredProviderUploadsCronJobScheduler.optionHash

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsCronJobScheduler', () => {
  describe('.buildScheduleInput()', () => {
    describe('when called as is', () => {
      /*
       * The whole input, because every field of it is a way for the schedule to silently not exist.
       * A `schedulerId` that does not match the one the scan reads leaves the service substituting
       * `body: null`, which fails validation and returns a response carrying neither a job nor an
       * error; a `schedule` under any key but `cronExpression` fails the same way.
       */
      test('should be fixed value', () => {
        const expected = {
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
        }

        const received = PurgeExpiredProviderUploadsCronJobScheduler.buildScheduleInput()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
