import {
  BaseCronJobScheduler,
  ConcreteMemberNotFoundJobError,
} from '@openreachtech/renchan-job-bullmq'

import AI_RUN_PURGE_JOB_CONSTANT_HASH from '../../constants/aiRunPurgeJobConstants.js'

const {
  AI_RUN_PURGE_JOB,
} = AI_RUN_PURGE_JOB_CONSTANT_HASH

/*
 * The body a scheduled purge's job template carries, which is nothing.
 *
 * It is written explicitly rather than left off, because leaving it off is not the same thing.
 * `BaseJobSchedulerService.resolveScheduleInput()` substitutes `{ schedule: null, body: null,
 * optionHash: null }` for a scheduler whose id it finds no input under, and `body: null` fails
 * `JobBody`'s check - at which point `BaseJobScheduler#startSchedule()` returns a response with no
 * job in it and throws nothing. The schedule would simply not exist, and the registration script
 * would finish reporting success. A literal `{}` here is what keeps that failure impossible for
 * these two schedulers rather than merely unlikely.
 */
const EMPTY_SCHEDULE_BODY = {}

/*
 * The BullMQ options the job template is upserted with, and the only copy of them a scheduled
 * purge ever reads.
 *
 * **This constant used to be `{}`, on the argument that the retry, the backoff and the retention
 * depth all belonged to `BaseAiRunPurgeJobDispatcher.optionHash` and reached a scheduled job from
 * there. They do not, and the chain is short enough to check.** That getter becomes `QueueOptions`
 * on the `Queue` a *dispatcher* builds. A schedule is upserted through a different `Queue`
 * entirely - `BaseJobScheduler.createQueue()` builds `new Queue(jobName, { connection })` with no
 * `defaultJobOptions` - so BullMQ sets that queue's `jobsOpts` to `{}`, and
 * `Queue#upsertJobScheduler()` stores `Object.assign({}, this.jobsOpts, jobTemplate?.opts)` as the
 * template. `jobTemplate.opts` is this value. An empty one therefore meant every firing of both
 * purges was a single-attempt job with BullMQ's unbounded completed-job retention: the weekly trace
 * sweep had no retry budget at all, and the job whose stated purpose is to stop a store growing
 * without limit was keeping a record of every sweep forever.
 *
 * **What may go in is bounded by the framework's own type.** `JobSchedulerTemplateOptions` is
 * `Omit<JobsOptions, 'jobId' | 'repeat' | 'delay' | 'deduplication' | 'debounce'>`, so the attempt
 * count, the backoff and the two retention bounds are all legal here, and the scheduling itself -
 * which BullMQ owns - cannot be smuggled in beside them.
 *
 * **The four figures are read rather than written**, from `aiRunPurgeJobConstants.cjs`, which is
 * also where the argument for each of them is. The dispatcher reads the same file for its own
 * queue's defaults, so the route that governs a scheduled sweep and the route that would govern a
 * direct dispatch cannot drift apart in their values; that they do not drift in *shape* is held by
 * a test rather than by this file.
 */
const SCHEDULE_OPTION_HASH = {
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
}

/**
 * What both of §19's purge schedules do, minus when they fire.
 *
 * **Cron rather than interval, and the pair is a real choice.** §19 gives the two triggers as "a
 * daily schedule" and "a schedule on the longer horizon" - calendar statements. An interval is not
 * one: `BaseIntervalJobScheduler` takes a millisecond count and fires that long after the last
 * firing, so a daemon restarted at an awkward hour walks the sweep steadily across the clock until
 * the nightly purge is running at lunchtime. A purge is the one job here whose cost lands on
 * everything else using the database, so when it runs is the point.
 *
 * **What this hierarchy does not need is a reach into a running job.** That is the other thing the
 * scheduler pair is chosen between - a watch that has to reach into a delivery's memory needs more
 * than a clock. A purge needs exactly "fire at a time", which is the whole of what a cron schedule
 * is.
 *
 * **This class also carries the job options, and that is not housekeeping.** A repeatable job is
 * produced from the template stored at registration, so that template's `opts` are the only
 * options a firing ever sees. The retry budget that keeps a dropped connection from costing the
 * weekly sweep a whole week, and the bound that keeps ninety completed sweeps readable instead of
 * all of them forever, both live in `SCHEDULE_OPTION_HASH` above for that reason.
 *
 * **A caveat a reader needs before trusting the hour.** `CronSchedule` in
 * `@openreachtech/renchan-job-bullmq` 1.1.3 declares one field, `cronExpression`, and denormalizes
 * to `{ pattern }` - so BullMQ's own `tz` repeat option cannot be reached through it, and the
 * expression is therefore evaluated in **whatever timezone the daemon process happens to run in**.
 * Nothing about correctness rests on that: a sweep's horizon is computed from the instant the
 * sweep starts, not from the schedule, so a purge firing at 03:00 in one zone or another is still
 * a nightly purge removing everything past thirty days. What it does mean is that "03:00" is a
 * statement about the machine and not about any particular country's night, and that pinning it to
 * one would need the package to carry `tz` through.
 *
 * **`EngineCtor`, `ManifestCtor`, `schedulerId` and `cronExpression` all stay abstract.** The
 * first three are the framework's required trio, and the fourth is the one thing §19 says
 * differently about the two rows of its table. A concrete scheduler answers all four; this class
 * answers only how they are assembled into the input the service starts a schedule from.
 *
 * Being abstract is why this file sits outside `app/jobs/`: `BaseJobSchedulerService` loads every
 * `BaseJobScheduler` subclass under the engine's `schedulersPath` and asks each for its
 * `schedulerId`, so one left there would throw during registration.
 *
 * @abstract
 */
export default class BaseAiRunPurgeCronJobScheduler extends BaseCronJobScheduler {
  /**
   * get: the cron expression this purge fires on.
   *
   * @abstract
   * @returns {string} The cron expression.
   * @throws {ConcreteMemberNotFoundJobError} When the concrete scheduler has not filled it in.
   */
  static get cronExpression () {
    throw ConcreteMemberNotFoundJobError.create({
      value: {
        memberName: `${this.name}.get:cronExpression`,
      },
    })
  }

  /**
   * get: the BullMQ options every firing of this schedule is produced with.
   *
   * @returns {import('bullmq').JobSchedulerTemplateOptions} The template options.
   */
  static get optionHash () {
    return SCHEDULE_OPTION_HASH
  }

  /**
   * Build what the scheduler service starts this schedule from.
   *
   * The service's own `collectScheduleInputs()` is an abstract static with no access to the
   * scheduler classes it will be matched against, so the input has to be assembled somewhere and
   * handed over. Assembling it here is what keeps a schedule's cron expression in the same file as
   * the scheduler it belongs to - the alternative is a service listing both ids and both
   * expressions, where renaming a `schedulerId` on one side leaves a schedule registered under the
   * old name that nothing will ever stop.
   *
   * @returns {AiRunPurgeScheduleInput} The schedule input.
   * @public
   */
  static buildScheduleInput () {
    return {
      schedulerId: this.schedulerId,
      schedule: {
        cronExpression: this.cronExpression,
      },
      body: EMPTY_SCHEDULE_BODY,
      optionHash: this.optionHash,
    }
  }
}

/**
 * @typedef {{
 *   schedulerId: string
 *   schedule: {
 *     cronExpression: string
 *   }
 *   body: Record<string, *>
 *   optionHash: import('bullmq').JobSchedulerTemplateOptions
 * }} AiRunPurgeScheduleInput
 */
