import BaseAiRunPurgeJobDispatcher from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobDispatcher.js'

import AppJobEngine from '../../../../../app/queue/AppJobEngine.js'

import PurgeExpiredRunTracesJobDispatcher from '../../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesJobDispatcher.js'
import PurgeExpiredRunTracesJobManifest from '../../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesJobManifest.js'

describe('PurgeExpiredRunTracesJobDispatcher', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredRunTracesJobDispatcher.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobDispatcher)
    })
  })
})

describe('PurgeExpiredRunTracesJobDispatcher', () => {
  describe('.get:EngineCtor', () => {
    describe('when called as is', () => {
      /*
       * One engine configures both of this repository's processes and the registration script, so
       * naming it is how this queue, the daemon that consumes it and the schedule that feeds it
       * all reach the same Redis. A second engine here would be a queue nothing else can see.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesJobDispatcher.EngineCtor

        expect(actual)
          .toBe(AppJobEngine) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunTracesJobDispatcher', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesJobDispatcher.ManifestCtor

        expect(actual)
          .toBe(PurgeExpiredRunTracesJobManifest) // same reference
      })
    })
  })
})
