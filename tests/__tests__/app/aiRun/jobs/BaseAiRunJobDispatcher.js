import {
  BaseJobDispatcher,
} from '@openreachtech/renchan-job-bullmq'

import BaseAiRunJobDispatcher from '../../../../../app/aiRun/jobs/BaseAiRunJobDispatcher.js'

describe('BaseAiRunJobDispatcher', () => {
  describe('super class', () => {
    test('to be instance of BaseJobDispatcher', () => {
      const received = BaseAiRunJobDispatcher.prototype

      expect(received)
        .toBeInstanceOf(BaseJobDispatcher)
    })
  })
})

describe('BaseAiRunJobDispatcher', () => {
  describe('.get:optionHash', () => {
    /*
     * Section 11's third acceptance criterion: a model call is never retried automatically — a run
     * that fails on a provider error reports it rather than calling again, and the caller
     * resubmits under a new idempotency key.
     *
     * The house example every job in this organization is copied from sets `attempts: 3`, so this
     * case exists to fail the moment somebody copies it in. It asserts the whole option hash
     * rather than the one field, because a `backoff` or a second attempt arriving beside it would
     * be the same defect wearing a different name.
     */
    test('should let a job be attempted exactly once', () => {
      const expected = {
        defaultJobOptions: {
          attempts: 1,
        },
      }

      const actual = BaseAiRunJobDispatcher.optionHash

      expect(actual)
        .toEqual(expected)
    })
  })
})
