import {
  BaseJobManifest,
  ConcreteMemberNotFoundJobError,
} from '@openreachtech/renchan-job-bullmq'

import {
  ScalarHash,
} from '@openreachtech/mentsu-schema'

import BaseAiRunJobManifest from '../../../../../app/aiRun/jobs/BaseAiRunJobManifest.js'

const {
  Integer,
} = ScalarHash

describe('BaseAiRunJobManifest', () => {
  describe('super class', () => {
    test('to be instance of BaseJobManifest', () => {
      const received = BaseAiRunJobManifest.prototype

      expect(received)
        .toBeInstanceOf(BaseJobManifest)
    })
  })
})

describe('BaseAiRunJobManifest', () => {
  describe('.get:bodySchema', () => {
    /*
     * Section 11 fixes the payload as `{ aiRunId }`, and states the reason: everything a worker
     * needs is re-read from the database, so a job body can never disagree with the record. A
     * second field arriving here is a copy of a column, and this case is what turns that into a
     * failing test rather than a review comment.
     */
    test('should carry the run id and nothing else', () => {
      const expected = {
        aiRunId: Integer,
      }

      const actual = BaseAiRunJobManifest.bodySchema

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('BaseAiRunJobManifest', () => {
  describe('.get:jobName', () => {
    /*
     * The base names no queue, and that is what keeps it out of the daemon's `workersPath`: one
     * queue is one job directory, and a manifest with a queue name here would give every service's
     * job the same queue.
     */
    test('should stay abstract', () => {
      const actual = () => BaseAiRunJobManifest.jobName

      expect(actual)
        .toThrow(ConcreteMemberNotFoundJobError)
    })
  })
})
