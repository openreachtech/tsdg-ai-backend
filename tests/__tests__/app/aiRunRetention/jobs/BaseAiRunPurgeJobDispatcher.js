import {
  BaseJobDispatcher,
} from '@openreachtech/renchan-job-bullmq'

import BaseAiRunJobDispatcher from '../../../../../app/aiRun/jobs/BaseAiRunJobDispatcher.js'

import BaseAiRunPurgeJobDispatcher from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobDispatcher.js'

describe('BaseAiRunPurgeJobDispatcher', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = BaseAiRunPurgeJobDispatcher.prototype

      expect(received)
        .toBeInstanceOf(BaseJobDispatcher)
    })
  })
})

describe('BaseAiRunPurgeJobDispatcher', () => {
  describe('inheritance', () => {
    /*
     * `BaseAiRunJobDispatcher` sets `attempts: 1`, because §11's third criterion is that a model
     * call is never retried automatically. A purge is under no such rule, and inheriting that
     * class would impose it here by accident — which for the weekly trace sweep means a single
     * dropped connection costing a week of not purging, silently. This case is what keeps the two
     * hierarchies from being merged later by somebody who notices they look alike.
     */
    test('should not be an AI run job dispatcher', () => {
      const received = BaseAiRunPurgeJobDispatcher.prototype

      expect(received)
        .not
        .toBeInstanceOf(BaseAiRunJobDispatcher)
    })
  })
})

describe('BaseAiRunPurgeJobDispatcher', () => {
  describe('.get:optionHash', () => {
    describe('when called as is', () => {
      /*
       * **What this case protects, stated narrowly, because an earlier version of this comment
       * claimed more than the assertion gives.** `optionHash` becomes `QueueOptions` on the queue
       * a *dispatcher* builds, so `defaultJobOptions` reaches a job dispatched directly at that
       * queue and reaches nothing else. It does not reach either purge's schedule: that template
       * is upserted through `BaseJobScheduler.createQueue()`'s own queue, whose `jobsOpts` is
       * `{}`. So this case says "a direct dispatch would get three attempts and a bounded history"
       * — a route nothing in this repository takes yet — and says nothing whatever about the
       * nightly and weekly firings. Those are pinned on `BaseAiRunPurgeCronJobScheduler`, whose
       * `.get:optionHash` case is the one that would fail if a sweep lost its retry budget.
       *
       * The whole hash is asserted rather than the one field, for the reason the callback
       * dispatcher's own case gives: a case reading only `attempts` would pass on a backoff
       * removed beside it.
       */
      test('should be fixed value', () => {
        const expected = {
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 300000,
            },
            removeOnComplete: {
              count: 90,
            },
            removeOnFail: {
              count: 90,
            },
          },
        }

        const actual = BaseAiRunPurgeJobDispatcher.optionHash

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
