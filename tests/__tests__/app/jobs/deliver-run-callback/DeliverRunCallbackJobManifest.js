import {
  ScalarHash,
} from '@openreachtech/mentsu-schema'

import BaseAiRunJobManifest from '../../../../../app/aiRun/jobs/BaseAiRunJobManifest.js'

import DeliverRunCallbackJobManifest from '../../../../../app/jobs/deliver-run-callback/DeliverRunCallbackJobManifest.js'

const {
  Integer,
} = ScalarHash

describe('DeliverRunCallbackJobManifest', () => {
  describe('inheritance', () => {
    /*
     * The manifest is the one part of a run's job hierarchy this job does inherit. A manifest
     * carries a queue name and a body shape and no policy at all — the retry lives in the
     * dispatcher, the lifecycle in the worker — so extending it shares the body schema without
     * bringing either along.
     */
    test('should be correct class', () => {
      const received = DeliverRunCallbackJobManifest.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunJobManifest)
    })
  })
})

describe('DeliverRunCallbackJobManifest', () => {
  describe('.get:jobName', () => {
    describe('when called as is', () => {
      /*
       * Section 12's background-jobs table names the queue `deliver-run-callback`, and the
       * directory holding the manifest carries the same name. A queue renamed on one side of that
       * pair and not the other is a daemon listening on a queue nobody dispatches to.
       */
      test('should be fixed value', () => {
        const actual = DeliverRunCallbackJobManifest.jobName

        expect(actual)
          .toBe('deliver-run-callback')
      })
    })
  })
})

describe('DeliverRunCallbackJobManifest', () => {
  describe('.get:bodySchema', () => {
    describe('when called as is', () => {
      /*
       * The run's id and nothing else, which is section 11's rule about a job body and holds here
       * for the same reason: the worker re-reads everything it needs, so a body can never disagree
       * with the record. A callback URL, a secret or a result arriving beside the id would each be
       * a copy of a column — held in Redis, where a client's result has no business being.
       */
      test('should be fixed value', () => {
        const expected = {
          aiRunId: Integer,
        }

        const actual = DeliverRunCallbackJobManifest.bodySchema

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
