import BaseAiRunPurgeJobManifest from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobManifest.js'

import PurgeExpiredRunContentJobManifest from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentJobManifest.js'

describe('PurgeExpiredRunContentJobManifest', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredRunContentJobManifest.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobManifest)
    })
  })
})

describe('PurgeExpiredRunContentJobManifest', () => {
  describe('.get:jobName', () => {
    describe('when called as is', () => {
      /*
       * §19's background-jobs table names the queue `purge-expired-run-content`, and the directory
       * holding the manifest carries the same name. A queue renamed on one side of that pair and
       * not the other is a daemon listening on a queue no schedule ever posts to — and because
       * nothing requests a purge, there is no failing request to notice it by.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentJobManifest.jobName

        expect(actual)
          .toBe('purge-expired-run-content')
      })
    })
  })
})

describe('PurgeExpiredRunContentJobManifest', () => {
  describe('.get:bodySchema', () => {
    describe('when called as is', () => {
      /*
       * Inherited, and asserted here as well as on the base because §19 states the payload per
       * row: both purge rows read "none", and a field added to this concrete manifest would
       * satisfy the base's test while breaking the table.
       */
      test('should be fixed value', () => {
        const expected = {}

        const actual = PurgeExpiredRunContentJobManifest.bodySchema

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
