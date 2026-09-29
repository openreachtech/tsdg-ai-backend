import BaseAiRunPurgeJobDispatcher from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobDispatcher.js'

import AppJobEngine from '../../../../../app/queue/AppJobEngine.js'

import PurgeExpiredRunContentJobDispatcher from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentJobDispatcher.js'
import PurgeExpiredRunContentJobManifest from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentJobManifest.js'

describe('PurgeExpiredRunContentJobDispatcher', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredRunContentJobDispatcher.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobDispatcher)
    })
  })
})

describe('PurgeExpiredRunContentJobDispatcher', () => {
  describe('.get:EngineCtor', () => {
    describe('when called as is', () => {
      /*
       * One engine configures both of this repository's processes and the registration script, so
       * naming it is how this queue, the daemon that consumes it and the schedule that feeds it
       * all reach the same Redis. A second engine here would be a queue nothing else can see.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentJobDispatcher.EngineCtor

        expect(actual)
          .toBe(AppJobEngine) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunContentJobDispatcher', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentJobDispatcher.ManifestCtor

        expect(actual)
          .toBe(PurgeExpiredRunContentJobManifest) // same reference
      })
    })
  })
})
