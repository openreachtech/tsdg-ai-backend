import {
  BaseJobDispatcher,
} from '@openreachtech/renchan-job-bullmq'

import AI_RUN_PURGE_JOB_CONSTANT_HASH from '../../constants/aiRunPurgeJobConstants.js'

const {
  AI_RUN_PURGE_JOB,
} = AI_RUN_PURGE_JOB_CONSTANT_HASH

/**
 * The queue options a purge dispatched straight at one of these two queues would run under.
 *
 * **Read the first sentence again, because an earlier version of this file said something else and
 * was wrong.** `optionHash` becomes `QueueOptions` on the `Queue` a *dispatcher* builds, and
 * `defaultJobOptions` on that queue reach the jobs that queue instance produces. A schedule is not
 * one of them. `BaseJobScheduler.createQueue()` builds its own `Queue` with the connection alone,
 * so BullMQ sets that queue's `jobsOpts` to `{}`, and `Queue#upsertJobScheduler()` stores
 * `Object.assign({}, this.jobsOpts, jobTemplate?.opts)` as the template every firing is produced
 * from. Nothing below reaches that template. `BaseAiRunPurgeCronJobScheduler` is what puts the same
 * four figures where a scheduled sweep actually reads them.
 *
 * **So why is it still here.** Because a queue that has a producer-side default should have the
 * right one rather than none: a job dispatched directly at either purge queue - an operator asking
 * for a sweep out of cycle, a re-dispatch after an incident - would otherwise get BullMQ's bare
 * defaults, which are one attempt and completed jobs kept forever. That is exactly the loss the
 * figures exist to prevent, so the dispatcher states them rather than leaving the first such
 * producer to discover the gap. What this getter must not be read as is a claim about the
 * schedules: they are governed by the scheduler's template and by nothing here.
 *
 * **Nothing in this repository dispatches either purge today.** §19 puts both jobs outside the
 * request path because "nothing requests it", and the only producer is the repeatable job in
 * Redis. That is why the values are shared rather than written here: `aiRunPurgeJobConstants.cjs`
 * holds them once and both readers take them from it, so the route that governs and the route that
 * does not cannot come to disagree.
 *
 * **It exists to say "a sweep may be retried, and a model call may not" once**, in a place where
 * the contrast with `BaseAiRunJobDispatcher` is visible.
 *
 * **`EngineCtor` and `ManifestCtor` stay abstract**, matching the AI run family beside it. The
 * engine is the process-wide configuration a concrete dispatcher points at, and the manifest names
 * the queue - and one queue is one job directory, so neither belongs to a shared base.
 *
 * @abstract
 */
export default class BaseAiRunPurgeJobDispatcher extends BaseJobDispatcher {
  /**
   * get: the BullMQ queue options a directly dispatched purge would be produced with.
   *
   * @override
   * @returns {Partial<import('bullmq').QueueOptions>} - The queue options.
   */
  static get optionHash () {
    return {
      defaultJobOptions: {
        attempts: AI_RUN_PURGE_JOB.ATTEMPT_COUNT,
        backoff: {
          type: AI_RUN_PURGE_JOB.BACKOFF_TYPE,
          delay: AI_RUN_PURGE_JOB.BACKOFF_MILLISECOND_COUNT,
        },
        removeOnComplete: {
          count: AI_RUN_PURGE_JOB.RETAINED_JOB_COUNT,
        },
        removeOnFail: {
          count: AI_RUN_PURGE_JOB.RETAINED_JOB_COUNT,
        },
      },
    }
  }
}
