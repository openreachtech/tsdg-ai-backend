import {
  BaseJobDispatcher,
} from '@openreachtech/renchan-job-bullmq'

/*
 * How many times BullMQ may attempt one AI run job.
 *
 * **One, and it is written down rather than left out.** BullMQ's own default for `attempts` is
 * documented as `1` in the installed package
 * (`node_modules/bullmq/dist/esm/interfaces/base-job-options.d.ts`: "The total number of attempts
 * to try the job until it completes. @defaultValue 1"), so omitting the option would reach the
 * same behavior today — but the house example every job in this organization is copied from sets
 * `attempts: 3`, and an omitted option reads as "nobody thought about it" rather than as a
 * decision. Section 11's third acceptance criterion is that a model call is never retried
 * automatically: a run that fails on a provider error reports it rather than calling again, and
 * the caller resubmits under a new idempotency key. That is a rule of this service, not a default
 * of a library, so it is stated where a reader looks for it.
 */
const AI_RUN_JOB_ATTEMPT_COUNT = 1

/**
 * The queue options every AI run job is dispatched under.
 *
 * **It exists to say "no automatic retry" once.** A dispatcher per service would otherwise each
 * repeat the same option, and the one that forgot would quietly retry a model call — the single
 * behavior section 11 rules out by name.
 *
 * **`EngineCtor` and `ManifestCtor` stay abstract.** The engine is the process-wide configuration
 * object a concrete job's dispatcher points at, and the manifest names the queue; neither is this
 * class's to fix, because one queue is one job directory. A concrete dispatcher supplies both.
 *
 * @abstract
 */
export default class BaseAiRunJobDispatcher extends BaseJobDispatcher {
  /**
   * get: the BullMQ queue options this service's jobs are produced with.
   *
   * @override
   * @returns {Partial<import('bullmq').QueueOptions>} - The queue options.
   */
  static get optionHash () {
    return {
      defaultJobOptions: {
        attempts: AI_RUN_JOB_ATTEMPT_COUNT,
      },
    }
  }
}
