import AppJobSchedulerService from './AppJobSchedulerService.js'

/*
 * The slice of the sorted set of schedules a queue holds that this class asks Redis for, which is
 * all of it.
 *
 * `Queue#getJobSchedulers(start, end, asc)` passes these straight to `ZRANGE`, so `-1` means the
 * last element rather than a count. Ascending by next firing is asked for because it is the order
 * an operator reading the same key by hand would see; nothing here depends on it, since what this
 * class answers is a membership question.
 */
const REGISTERED_SCHEDULE_RANGE = {
  START: 0,
  END: -1,
  IS_ASCENDING: true,
}

/**
 * What Redis actually holds, read back as a list of scheduler ids.
 *
 * **Why a read-back exists at all.** A repeatable job is a record in Redis rather than anything in
 * either of this repository's two processes: `scripts/startJobSchedulers.js` writes it once, and
 * BullMQ replays it for as long as the record is there. Nothing in a running process depends on
 * that record existing — a worker binds to its queue and waits, whether or not a clock will ever
 * post to it — so "was the registration step ever run against this Redis?" had no answer anywhere
 * in the application. This class is that answer: it opens each scheduler's queue and reads the set
 * of schedules the queue holds.
 *
 * **It reports what is there and judges nothing.** Which ids *ought* to be there is
 * `AppJobSchedulerService.collectScheduleInputs()`, and comparing the two is
 * `JobScheduleRegistrationInspector`'s. Keeping the read in a class of its own is what lets that
 * comparison be exercised with no Redis anywhere near it: the inspector is handed one of these,
 * and a test hands it something else.
 *
 * **Which queues get read comes from the same folder scan the registration uses**, through
 * `BaseJobSchedulerService.loadSchedulerCtors()`, so a scheduler class added under the engine's
 * `schedulersPath` is read back with no line changed here. A queue name is not derivable from a
 * scheduler id — the two coincide for retention's two purges, and the framework promises nothing
 * of the sort — which is why the scan is what names the queues rather than the declared ids.
 *
 * **Every queue it opens, it closes.** `BaseJobScheduler#teardown()` is the framework's own close,
 * and it is called here in a `finally` for the reason the framework calls it in one: a queue is a
 * live Redis connection, and a check leaking one per scheduler at every boot would be a worse
 * defect than the gap it was added to close.
 *
 * **What it does not bound is how long a read takes.** This repository's connection options carry
 * `maxRetriesPerRequest: null` — which BullMQ requires — so ioredis retries a command for as long
 * as it takes, and against a Redis that is not there `createAsync()` pends rather than rejects.
 * The deadline for that belongs to the caller: `JobScheduleRegistrationInspector` races this read
 * against one. A read given up on is not cancelled, and the connection it left behind closes
 * itself through the `finally` above if Redis ever answers.
 */
export default class RegisteredJobScheduleReader {
  /**
   * Constructor.
   *
   * @param {RegisteredJobScheduleReaderParams} params - Parameters.
   */
  constructor ({
    engine,
    schedulerServiceFactory,
  }) {
    this.engine = engine
    this.schedulerServiceFactory = schedulerServiceFactory
  }

  /**
   * Factory method.
   *
   * The engine is handed in rather than built, so that a process which already has one — the job
   * daemon, which is the only caller — reads through the engine it is already running on instead
   * of standing a second configuration of the same Redis up beside it.
   *
   * @template {X extends typeof RegisteredJobScheduleReader ? X : never} T, X
   * @param {RegisteredJobScheduleReaderFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    engine,
    schedulerServiceFactory = AppJobSchedulerService,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        engine,
        schedulerServiceFactory,
      })
    )
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof RegisteredJobScheduleReader} The class.
   */
  get Ctor () {
    return /** @type {typeof RegisteredJobScheduleReader} */ (this.constructor)
  }

  /**
   * Read back every scheduler id Redis holds a schedule for, across every queue this engine
   * schedules on.
   *
   * The queues are read at once rather than one after another: each is a separate connection
   * answering a separate key, nothing one reads depends on another, and the whole read sits in a
   * boot path the daemon is waiting on.
   *
   * @returns {Promise<Array<string>>} The scheduler ids Redis holds.
   * @public
   */
  async readRegisteredSchedulerIds () {
    const SchedulerCtors = await this.loadSchedulerCtors()

    const schedulerIdGroups = await Promise.all(
      SchedulerCtors.map(async SchedulerCtor =>
        this.readSchedulerIdsInQueue({
          SchedulerCtor,
        })
      )
    )

    return schedulerIdGroups.flat()
  }

  /**
   * Load the scheduler classes the engine's own folder scan finds.
   *
   * @returns {Promise<Array<SchedulerCtor>>} The scheduler classes.
   * @public
   */
  async loadSchedulerCtors () {
    return this.schedulerServiceFactory.loadSchedulerCtors({
      engine: this.engine,
    })
  }

  /**
   * Read back the scheduler ids held by one scheduler's queue.
   *
   * @param {{
   *   SchedulerCtor: SchedulerCtor
   * }} params - Parameters.
   * @returns {Promise<Array<string>>} The scheduler ids that queue holds.
   * @public
   */
  async readSchedulerIdsInQueue ({
    SchedulerCtor,
  }) {
    const scheduler = await this.createScheduler({
      SchedulerCtor,
    })

    try {
      const schedulerJsons = await scheduler.queue.getJobSchedulers(
        REGISTERED_SCHEDULE_RANGE.START,
        REGISTERED_SCHEDULE_RANGE.END,
        REGISTERED_SCHEDULE_RANGE.IS_ASCENDING
      )

      return this.extractSchedulerIds({
        schedulerJsons,
      })
    } finally {
      await scheduler.teardown()
    }
  }

  /**
   * Create one scheduler, which is how a queue for it is opened.
   *
   * @param {{
   *   SchedulerCtor: SchedulerCtor
   * }} params - Parameters.
   * @returns {Promise<InstanceType<SchedulerCtor>>} The scheduler.
   * @public
   */
  async createScheduler ({
    SchedulerCtor,
  }) {
    return SchedulerCtor.createAsync({
      engine: this.engine,
    })
  }

  /**
   * Extract the scheduler id out of each schedule record a queue answered with.
   *
   * BullMQ names the id `key`. Its own transform can answer with nothing at all for a record whose
   * hash has gone while the sorted set still names it, so a record carrying no key is dropped
   * rather than read — which leaves a torn read reporting one schedule short instead of faulting
   * inside a check whose whole purpose is to keep running.
   *
   * @param {{
   *   schedulerJsons: Array<import('bullmq').JobSchedulerJson>
   * }} params - Parameters.
   * @returns {Array<string>} The scheduler ids.
   * @public
   */
  extractSchedulerIds ({
    schedulerJsons,
  }) {
    return schedulerJsons
      .filter(it => it?.key)
      .map(it => it.key)
  }
}

/**
 * @typedef {{
 *   engine: InstanceType<EngineCtor>
 *   schedulerServiceFactory: typeof AppJobSchedulerService
 * }} RegisteredJobScheduleReaderParams
 */

/**
 * @typedef {{
 *   engine: InstanceType<EngineCtor>
 *   schedulerServiceFactory?: typeof AppJobSchedulerService
 * }} RegisteredJobScheduleReaderFactoryParams
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').BaseJobEngine} EngineCtor
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').BaseJobScheduler} SchedulerCtor
 */
