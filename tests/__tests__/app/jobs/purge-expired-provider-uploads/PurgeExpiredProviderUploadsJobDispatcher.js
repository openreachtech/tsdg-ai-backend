import BaseAiRunPurgeJobDispatcher from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobDispatcher.js'

import AppJobEngine from '../../../../../app/queue/AppJobEngine.js'

import PurgeExpiredProviderUploadsJobDispatcher from '../../../../../app/jobs/purge-expired-provider-uploads/PurgeExpiredProviderUploadsJobDispatcher.js'
import PurgeExpiredProviderUploadsJobManifest from '../../../../../app/jobs/purge-expired-provider-uploads/PurgeExpiredProviderUploadsJobManifest.js'

describe('PurgeExpiredProviderUploadsJobDispatcher', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredProviderUploadsJobDispatcher.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobDispatcher)
    })
  })
})

describe('PurgeExpiredProviderUploadsJobDispatcher', () => {
  describe('.get:EngineCtor', () => {
    describe('when called as is', () => {
      /*
       * One engine configures both of this repository's processes and the registration script, so
       * naming it is how this queue, the daemon that consumes it and the schedule that feeds it all
       * reach the same Redis. A second engine here would be a queue nothing else can see.
       */
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsJobDispatcher.EngineCtor

        expect(received)
          .toBe(AppJobEngine) // same reference
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobDispatcher', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      /*
       * Its own manifest, and therefore its own queue. Section 19 gives the three purges three
       * queues, and this one's reason is the sharpest: a whole sweep here is upwards of an hour of
       * waiting on somebody else's HTTP, and sharing a queue would let that hour delay the nightly
       * content purge - the one with a retention promise attached to it.
       */
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsJobDispatcher.ManifestCtor

        expect(received)
          .toBe(PurgeExpiredProviderUploadsJobManifest) // same reference
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobDispatcher', () => {
  describe('.get:optionHash', () => {
    describe('when called as is', () => {
      /*
       * Inherited from the shared purge dispatcher, and asserted on this concrete class because a
       * queue with no producer-side default is one whose first direct dispatch gets BullMQ's bare
       * defaults - one attempt, and completed jobs kept for ever. Nothing dispatches this queue
       * today; what governs the nightly firing is the scheduler's own template, and these four
       * figures are read from the same constants file so the two routes cannot come to disagree in
       * their values.
       */
      test('should be fixed value', () => {
        const expected = {
          defaultJobOptions: {
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

        const received = PurgeExpiredProviderUploadsJobDispatcher.optionHash

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
