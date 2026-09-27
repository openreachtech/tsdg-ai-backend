import timersPromises from 'node:timers/promises'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import {
  env,
} from '../globals/_.js'

import AppJobEngine from './AppJobEngine.js'
import AppJobSchedulerService from './AppJobSchedulerService.js'
import RegisteredJobScheduleReader from './RegisteredJobScheduleReader.js'

const MISSING_SCHEDULE_MESSAGE = 'declared job schedules are not registered in Redis'
const UNREADABLE_REGISTRATION_MESSAGE = 'the registered job schedules could not be read'
const UNREAD_REGISTRATION_MESSAGE = 'gave up on a read of the registered job schedules'

/*
 * What a failure is reported as when it came back carrying no message of its own — a thrown
 * string, a thrown null. Nothing on this path throws one; the fallback is here so that the line is
 * still written rather than the reporting faulting inside a catch whose whole purpose is to stop a
 * fault escaping.
 */
const UNNAMED_ERROR_MESSAGE = 'Error'

/*
 * How long the read of the registered schedules is waited on before it is given up and reported as
 * unread.
 *
 * It is not a measure of how long Redis may take. `RedisConnection` issues
 * `maxRetriesPerRequest: null`, which BullMQ requires and which makes ioredis retry a command
 * indefinitely, so a read against a Redis that is not there neither succeeds nor fails — it pends,
 * exactly as `JobDispatcherProvider` records of a dispatcher build against the same options. An
 * unbounded await here would leave this check silent in the one case it most needs to speak, and
 * silence is indistinguishable from "every schedule is registered", which is the whole failure
 * this class exists to make visible. Five seconds is the figure `JobDispatcherProvider` already
 * uses against the same Redis, and is long enough for a Redis that is there — the compose file's
 * container answers in single-digit milliseconds.
 */
const REGISTRATION_READ_DEADLINE_MILLISECOND = 5000

const MISSING_SCHEDULE_TAGS = [
  'JobScheduleRegistration',
  'MissingSchedule',
]

const UNREADABLE_REGISTRATION_TAGS = [
  'JobScheduleRegistration',
  'UnreadableRegistration',
]

/*
 * The same dated file the job engine already writes to, read from the engine rather than restated,
 * so the two cannot drift.
 *
 * A boot check is not a job and could have had a file of its own. It does not, because a third
 * file is a third thing to know to open: an operator asking why nothing has been purged opens the
 * job log, and this is the line that answers.
 */
const LOG_FILE_PATH = AppJobEngine.savingLogFilePath

const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * The boot-time check that Redis actually holds the schedules this repository declares.
 *
 * **The failure it exists for.** §7 gives personal data two retention horizons — run content at 30
 * days, the decision trace at 730 — and §19 delivers both through scheduled purges. A schedule is
 * a record in Redis that exists only once somebody has run `npm run schedulers:start` by hand, and
 * until this class nothing verified it afterwards. If that step is skipped, run against a
 * different Redis, or a `schedulerId` is renamed without `npm run schedulers:stop` under the old
 * id first, then no purge ever fires and personal data is retained indefinitely — while every
 * visible signal reads healthy. The daemon reports itself listening on both purge queues, both
 * queues are green and empty, and the purge log is silent, which is also precisely what a working
 * sweep looks like outside production. This is the one failure where the absence of the control
 * and the healthy operation of the control are otherwise indistinguishable, and the only thing
 * that separates them is asking Redis what it holds.
 *
 * **It runs automatically, from `scripts/startJobDaemon.js`, and that is the point.** A second
 * manual script to detect that the first manual script was skipped would be skipped the same way.
 * The daemon is the process that is already running wherever the schedules matter, so the check
 * rides its boot.
 *
 * **It never stops the daemon.** That process also serves callback delivery and asset media
 * extraction, and a missing purge schedule is no reason to take those down. Every path through
 * `#inspectRegisteredSchedules()` ends in a log line and a `null` — a read that failed, a read
 * that never answered, an unexpected shape, all of it — and nothing is rethrown.
 *
 * **What it compares against is what the application already declares.**
 * `AppJobSchedulerService.collectScheduleInputs()` is the list, it is the same one
 * `scripts/startJobSchedulers.js` registers from, and a test already holds it to the folder scan.
 * A second hand-written list of scheduler ids here would only be a third thing to forget.
 *
 * **The limitation, stated rather than glossed.** `@openreachtech/mentsu-logger`'s
 * `shouldSkipLogging()` reads `!['production'].includes(this.env.NODE_ENV)`, so every line this
 * class writes is **silent in every environment except production** — see
 * `BaseAiRunPurgeJobWorker`, which carries the same constraint and the same note. This is
 * therefore a production control and not a development one: a developer booting the daemon locally
 * with no schedules registered will see exactly what they see today, which is nothing. Correcting
 * the logger would mean owning somebody else's package and is recorded as its own question; it is
 * deliberately not done here.
 */
export default class JobScheduleRegistrationInspector {
  /**
   * Constructor.
   *
   * @param {JobScheduleRegistrationInspectorParams} params - Parameters.
   */
  constructor ({
    registeredScheduleReader,
  }) {
    this.registeredScheduleReader = registeredScheduleReader
  }

  /**
   * Factory method.
   *
   * The engine is taken only to build the reader from, and is not kept: what this object holds is
   * the collaborator that answers "what does Redis hold", which is the one piece a test has to be
   * able to replace.
   *
   * @template {X extends typeof JobScheduleRegistrationInspector ? X : never} T, X
   * @param {JobScheduleRegistrationInspectorFactoryParams} params - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    engine,
    registeredScheduleReader = this.createRegisteredScheduleReader({
      engine,
    }),
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        registeredScheduleReader,
      })
    )
  }

  /**
   * get: the scheduler service class the declared schedules are read from — a seam so tests can
   * substitute it.
   *
   * @returns {typeof AppJobSchedulerService} The class.
   */
  static get SchedulerServiceCtor () {
    return AppJobSchedulerService
  }

  /**
   * get: the one logger client this check writes through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * get: the promise-shaped timers of the standard library.
   *
   * Reached through a getter rather than referred to inside the method that waits, so the one
   * place this class touches the clock is named and a test can stand something else in its place.
   *
   * @returns {typeof timersPromises} Timers.
   */
  static get timersPromises () {
    return timersPromises
  }

  /**
   * Create the reader this check asks Redis through.
   *
   * @param {{
   *   engine: InstanceType<EngineCtor>
   * }} params - Parameters.
   * @returns {RegisteredJobScheduleReader} The reader.
   */
  static createRegisteredScheduleReader ({
    engine,
  }) {
    return RegisteredJobScheduleReader.create({
      engine,
    })
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof JobScheduleRegistrationInspector} The class.
   */
  get Ctor () {
    return /** @type {typeof JobScheduleRegistrationInspector} */ (this.constructor)
  }

  /**
   * Check that Redis holds every schedule this repository declares, and report the ones it does
   * not.
   *
   * This is the whole of the guard the class promises: the comparison, the read it rests on, and
   * the deadline that bounds the read are all inside the `try`, so a Redis refusing the read, a
   * shape nothing expected, or a read that never answers each end as a written line rather than as
   * an exception leaving a daemon's boot path.
   *
   * @returns {Promise<null>} Nothing. Reporting is the whole of what it does.
   * @public
   */
  async inspectRegisteredSchedules () {
    try {
      const missingSchedulerIds = await this.extractMissingSchedulerIdsWithinDeadline()

      return this.reportMissingSchedules({
        missingSchedulerIds,
      })
    } catch (error) {
      return this.reportUnreadableRegistration({
        error,
      })
    }
  }

  /**
   * Work out which declared schedules Redis does not hold, giving up on a read that has not
   * answered by the deadline.
   *
   * The read is not cancelled when it is given up on — ioredis goes on trying, and the queue the
   * read opened closes itself if Redis ever answers. `Promise.race` stays subscribed to both, so a
   * rejection arriving after the race settled is handled rather than left loose.
   *
   * @returns {Promise<Array<string>>} The scheduler ids Redis does not hold.
   * @throws {Error} When the read fails, or has not answered by the deadline.
   * @public
   */
  async extractMissingSchedulerIdsWithinDeadline () {
    const deadlineTerminator = new AbortController()

    try {
      return await Promise.race([
        this.extractMissingSchedulerIds(),
        this.refuseRegistrationAtDeadline({
          signal: deadlineTerminator.signal,
        }),
      ])
    } finally {
      deadlineTerminator.abort()
    }
  }

  /**
   * Work out which declared schedules Redis does not hold.
   *
   * The comparison runs one way only. A schedule registered in Redis that this repository no
   * longer declares is a real problem — it is the orphan a rename leaves behind, firing forever
   * under a name nothing knows — but it is `npm run schedulers:stop` that answers it, and folding
   * it in here would put two different operator actions behind one line.
   *
   * @returns {Promise<Array<string>>} The scheduler ids Redis does not hold.
   * @public
   */
  async extractMissingSchedulerIds () {
    const declaredSchedulerIds = await this.extractDeclaredSchedulerIds()
    const registeredSchedulerIds = await this.registeredScheduleReader.readRegisteredSchedulerIds()

    return declaredSchedulerIds
      .filter(it => !registeredSchedulerIds.includes(it))
  }

  /**
   * Extract the scheduler ids this repository declares a schedule for.
   *
   * @returns {Promise<Array<string>>} The declared scheduler ids.
   * @public
   */
  async extractDeclaredSchedulerIds () {
    const scheduleInputs = await this.Ctor.SchedulerServiceCtor.collectScheduleInputs()

    return scheduleInputs
      .map(it => it.schedulerId)
  }

  /**
   * Refuse a read of the registered schedules that has not answered by the deadline.
   *
   * @param {{
   *   signal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<void>} Nothing, ever.
   * @throws {Error} When the deadline passes, which is the whole of what it does.
   * @public
   */
  async refuseRegistrationAtDeadline ({
    signal,
  }) {
    await this.Ctor.timersPromises.setTimeout(
      REGISTRATION_READ_DEADLINE_MILLISECOND,
      null,
      {
        signal,
      }
    )

    throw new Error(UNREAD_REGISTRATION_MESSAGE)
  }

  /**
   * Report the declared schedules Redis does not hold.
   *
   * **An error rather than a warning.** A missing purge schedule means §7's two horizons are not
   * being applied at all and personal data is being kept indefinitely; there is no level below
   * error that says that.
   *
   * The ids are written, because "some schedules are missing" is not something an operator can
   * act on and a scheduler id is. Nothing else is written: this check has read no run and knows
   * no content.
   *
   * A check that found everything registered says nothing. The line that matters is the one that
   * names a gap, and a per-boot "all present" would be read once and then skimmed past.
   *
   * @param {{
   *   missingSchedulerIds: Array<string>
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  reportMissingSchedules ({
    missingSchedulerIds,
  }) {
    if (missingSchedulerIds.length === 0) {
      return null
    }

    const namedSchedulerIds = missingSchedulerIds.join(', ')

    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${MISSING_SCHEDULE_MESSAGE}: ${namedSchedulerIds}`,
      tags: MISSING_SCHEDULE_TAGS,
    })

    return null
  }

  /**
   * Report that the registered schedules could not be read at all.
   *
   * **The message is written here, where its sibling `BaseAiRunPurgeJobWorker` writes only the
   * error's class name, and the difference is deliberate.** That class withholds the message
   * because a sweep's failure is composed deep inside a purge and can quote a row whose content it
   * was removing. Nothing on this path has read a run: what fails here is a connection to Redis or
   * this class's own deadline, and the two are told apart only by what they say — a name would
   * read `Error` either way, and an operator would learn nothing from it.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  reportUnreadableRegistration ({
    error,
  }) {
    const errorMessage = this.extractErrorMessage({
      error,
    })

    this.Ctor.mentsuLogger.error({
      message: `${this.Ctor.name} ${UNREADABLE_REGISTRATION_MESSAGE}: ${errorMessage}`,
      tags: UNREADABLE_REGISTRATION_TAGS,
    })

    return null
  }

  /**
   * Extract the message of whatever the read failed with.
   *
   * @param {{
   *   error: *
   * }} params - Parameters.
   * @returns {string} The message.
   * @public
   */
  extractErrorMessage ({
    error,
  }) {
    return error?.message
      ?? UNNAMED_ERROR_MESSAGE
  }
}

/**
 * @typedef {{
 *   registeredScheduleReader: RegisteredJobScheduleReader
 * }} JobScheduleRegistrationInspectorParams
 */

/**
 * @typedef {{
 *   engine: InstanceType<EngineCtor>
 *   registeredScheduleReader?: RegisteredJobScheduleReader
 * }} JobScheduleRegistrationInspectorFactoryParams
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-job-bullmq').BaseJobEngine} EngineCtor
 */
