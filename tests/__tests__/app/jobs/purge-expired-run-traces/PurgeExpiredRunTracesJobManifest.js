import BaseAiRunPurgeJobManifest from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobManifest.js'

import PurgeExpiredRunContentJobManifest from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentJobManifest.js'
import PurgeExpiredRunTracesJobManifest from '../../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesJobManifest.js'

describe('PurgeExpiredRunTracesJobManifest', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredRunTracesJobManifest.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobManifest)
    })
  })
})

describe('PurgeExpiredRunTracesJobManifest', () => {
  describe('.get:jobName', () => {
    describe('when called as is', () => {
      /*
       * §19's background-jobs table names the queue `purge-expired-run-traces` — plural, where the
       * content row is singular — and the directory holding the manifest carries the same name.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesJobManifest.jobName

        expect(actual)
          .toBe('purge-expired-run-traces')
      })
    })
  })
})

describe('PurgeExpiredRunTracesJobManifest', () => {
  describe('.get:jobName', () => {
    describe('when compared with the content purge', () => {
      /*
       * §19's first acceptance criterion — "content and the decision trace are purged on two
       * separate settings, and never on one" — kept at the queue. Two queues is what stops the
       * weekly trace backlog from delaying the nightly content purge, which is the one bounded by
       * a promise about personal data, and what lets the two be scaled or paused apart.
       *
       * It is asserted as a difference rather than by reading either literal, because that is the
       * shape of the mistake: a queue name copied from the sibling file during a rename passes
       * both of the `toBe` cases above in isolation.
       */
      test('should be a different queue', () => {
        const expected = PurgeExpiredRunContentJobManifest.jobName

        const actual = PurgeExpiredRunTracesJobManifest.jobName

        expect(actual)
          .not
          .toBe(expected)
      })
    })
  })
})

describe('PurgeExpiredRunTracesJobManifest', () => {
  describe('.get:bodySchema', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {}

        const actual = PurgeExpiredRunTracesJobManifest.bodySchema

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
