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

/*
 * How many finished job records this queue keeps, and why leaving it unset was the more serious
 * omission of the two on this class.
 *
 * BullMQ's default is to keep every completed and every failed job **forever**, and a failed
 * record carries the thrown error's message. Section 22 of the specification requires that no log
 * written anywhere carry content — and the terminal write that stores a run's result body is the
 * one statement in this service short enough that the database driver appends its bound parameters
 * to the error it raises. A database fault on that write therefore puts a run's suggested values
 * into a Redis record, and an unbounded queue is what makes that record permanent rather than
 * transient. The driver is stopped from appending at all in `sequelize/config.cjs`; this bound is
 * the second lock, and the one that also answers the plain question of how large this queue may
 * grow.
 *
 * **Ninety is the figure retention already chose** for its own purge queues, and one number across
 * every queue in this service is worth more than a figure tuned per queue: a reader learns it once.
 * At the volume section 7 foresees it is a few days of history on this queue, which is the range in
 * which somebody actually looks.
 */
const AI_RUN_JOB_RETAINED_COUNT = 90

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
        removeOnComplete: {
          count: AI_RUN_JOB_RETAINED_COUNT,
        },
        removeOnFail: {
          count: AI_RUN_JOB_RETAINED_COUNT,
        },
      },
    }
  }
}
