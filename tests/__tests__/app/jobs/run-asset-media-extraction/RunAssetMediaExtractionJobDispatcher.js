import BaseAiRunJobDispatcher from '../../../../../app/aiRun/jobs/BaseAiRunJobDispatcher.js'

import AppJobEngine from '../../../../../app/queue/AppJobEngine.js'

import RunAssetMediaExtractionJobDispatcher from '../../../../../app/jobs/run-asset-media-extraction/RunAssetMediaExtractionJobDispatcher.js'
import RunAssetMediaExtractionJobManifest from '../../../../../app/jobs/run-asset-media-extraction/RunAssetMediaExtractionJobManifest.js'

/*
 * §20: "the job is not retried: a failed model call is reported, and the caller resubmits under a
 * new idempotency key" - which is §11's third acceptance criterion said again for this service.
 * The rule lives in `BaseAiRunJobDispatcher`, so what this file asserts is that this dispatcher is
 * one of its subclasses and that the rule reaches it.
 */

describe('RunAssetMediaExtractionJobDispatcher', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = RunAssetMediaExtractionJobDispatcher.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunJobDispatcher)
    })
  })
})

describe('RunAssetMediaExtractionJobDispatcher', () => {
  describe('.get:EngineCtor', () => {
    describe('when called as is', () => {
      /*
       * One engine configures both processes - the API server that enqueues and the daemon that
       * consumes - so naming it is how this dispatcher reaches the same Redis as the worker that
       * answers it.
       */
      test('should be fixed value', () => {
        const actual = RunAssetMediaExtractionJobDispatcher.EngineCtor

        expect(actual)
          .toBe(AppJobEngine) // same reference
      })
    })
  })
})

describe('RunAssetMediaExtractionJobDispatcher', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = RunAssetMediaExtractionJobDispatcher.ManifestCtor

        expect(actual)
          .toBe(RunAssetMediaExtractionJobManifest) // same reference
      })
    })
  })
})

describe('RunAssetMediaExtractionJobDispatcher', () => {
  describe('.get:optionHash', () => {
    describe('when called as is', () => {
      /*
       * The whole hash rather than the one field, so a backoff added beside the attempt count -
       * which would mean a model call reached twice under one idempotency key - fails here rather
       * than in production. `attempts: 1` is inherited and asserted through this class, because
       * what has to hold is that *this* dispatcher produces jobs under it.
       */
      test('should be fixed value', () => {
        const expected = {
          defaultJobOptions: {
            attempts: 1,
          },
        }

        const actual = RunAssetMediaExtractionJobDispatcher.optionHash

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
