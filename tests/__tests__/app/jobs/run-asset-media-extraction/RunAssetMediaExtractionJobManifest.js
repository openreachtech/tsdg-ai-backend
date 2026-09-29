import {
  ScalarHash,
} from '@openreachtech/mentsu-schema'

import BaseAiRunJobManifest from '../../../../../app/aiRun/jobs/BaseAiRunJobManifest.js'

import RunAssetMediaExtractionJobManifest from '../../../../../app/jobs/run-asset-media-extraction/RunAssetMediaExtractionJobManifest.js'

const {
  Integer,
} = ScalarHash

describe('RunAssetMediaExtractionJobManifest', () => {
  describe('inheritance', () => {
    /*
     * The run's own manifest, so the body shape is inherited rather than restated. §11 fixes a run
     * job's payload and §20's own background-jobs table repeats it; a copy of that schema here
     * would be a second place for it to be changed in.
     */
    test('should be correct class', () => {
      const received = RunAssetMediaExtractionJobManifest.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunJobManifest)
    })
  })
})

describe('RunAssetMediaExtractionJobManifest', () => {
  describe('.get:jobName', () => {
    describe('when called as is', () => {
      /*
       * §20's background-jobs table names the queue `run-asset-media-extraction`, and the directory
       * holding the manifest carries the same name. A queue renamed on one side of that pair and
       * not the other is a daemon listening on a queue nobody dispatches to - which is exactly what
       * this route's accepted runs would then be waiting for.
       */
      test('should be fixed value', () => {
        const actual = RunAssetMediaExtractionJobManifest.jobName

        expect(actual)
          .toBe('run-asset-media-extraction')
      })
    })
  })
})

describe('RunAssetMediaExtractionJobManifest', () => {
  describe('.get:bodySchema', () => {
    describe('when called as is', () => {
      /*
       * The run's id and nothing else. The field schema, the media list and the caller's signature
       * are all columns of the run this job names, so a copy of any of them in the body would go
       * stale between the enqueue and the execution - and would sit in Redis besides.
       */
      test('should be fixed value', () => {
        const expected = {
          aiRunId: Integer,
        }

        const actual = RunAssetMediaExtractionJobManifest.bodySchema

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
