import BaseAiRunPurgeJobManifest from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobManifest.js'

import PurgeExpiredProviderUploadsJobManifest from '../../../../../app/jobs/purge-expired-provider-uploads/PurgeExpiredProviderUploadsJobManifest.js'

describe('PurgeExpiredProviderUploadsJobManifest', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredProviderUploadsJobManifest.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobManifest)
    })
  })
})

describe('PurgeExpiredProviderUploadsJobManifest', () => {
  describe('.get:jobName', () => {
    describe('when called as is', () => {
      /*
       * Section 19's background-jobs table names the queue `purge-expired-provider-uploads`, and
       * the directory holding the manifest carries the same name. A queue renamed on one side of
       * that pair and not the other is a daemon listening on a queue no schedule ever posts to -
       * and because nothing requests this purge, there is no failing request to notice it by.
       */
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsJobManifest.jobName

        expect(received)
          .toBe('purge-expired-provider-uploads')
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobManifest', () => {
  describe('.get:bodySchema', () => {
    describe('when called as is', () => {
      /*
       * Inherited, and asserted here as well as on the base because section 19 states the payload
       * per row: all three purge rows read "none", and a field added to this concrete manifest
       * would satisfy the base's test while breaking the table.
       *
       * It matters most for this row. A repeatable job's template is written once at registration
       * and replayed on every firing, so an instant carried in the body would be frozen at the
       * moment somebody ran the registration script - and this sweep's whole selection is a
       * comparison against `now`.
       */
      test('should be fixed value', () => {
        const expected = {}

        const received = PurgeExpiredProviderUploadsJobManifest.bodySchema

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
