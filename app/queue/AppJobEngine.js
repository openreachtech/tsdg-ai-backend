import {
  BaseJobEngine,
} from '@openreachtech/renchan-job-bullmq'

import {
  rootPath,
} from '../globals/_.js'

import RedisConnection from './RedisConnection.js'

import AppJobShare from './contexts/AppJobShare.js'
import AppJobContext from './contexts/AppJobContext.js'

/*
 * The directory the worker daemon scans, and the reason it holds concrete jobs and nothing else.
 *
 * `JobWorkersDaemon` loads *every* `BaseJobWorker` subclass it finds under this path and binds
 * each to its manifest's `jobName`. An abstract base worker has no manifest and so no job name, so
 * one left in here stops the daemon at boot — before any queue is listening, and for a class that
 * was never meant to run. A shared base therefore lives with the service it belongs to rather than
 * here — `app/aiRun/jobs/` holds the AI run family, `app/aiRunRetention/jobs/` the purge family —
 * and `app/jobs/` holds one directory per queue and nothing above them.
 */
const WORKERS_PATH = rootPath.to('app/jobs/')

/*
 * The directory the scheduler service scans, and why it is the same one.
 *
 * `BaseJobSchedulerService` loads every `BaseJobScheduler` subclass under this path and asks each
 * for its `schedulerId`, exactly as the daemon loads every worker under `workersPath` and asks
 * each for its queue. The two scans read the same directory and cannot collide: each filters by
 * its own base class, so a worker is invisible to the scheduler scan and a scheduler is invisible
 * to the daemon's.
 *
 * **Pointing it at the same directory is a decision, not a shortcut.** A schedule belongs to the
 * job it fires — the same queue name, the same manifest — so a second directory would split one
 * job across two places and leave the framework's own "one queue is one job directory" convention
 * half kept. It is also the safe choice in a narrower sense: `DeepBulkClassLoader#loadFileNames()`
 * calls `fs.readdirSync()` with no existence guard, so a `schedulersPath` naming a directory that
 * does not exist raises `ENOENT` — and the same figure applies to any path added here later.
 * `app/jobs/` exists because the daemon already requires it.
 *
 * The consequence for a reader: an abstract scheduler is as unwelcome under `app/jobs/` as an
 * abstract worker, and for the same reason. `app/aiRunRetention/jobs/` holds the purge bases.
 */
const SCHEDULERS_PATH = WORKERS_PATH

/*
 * A prefix rather than a file name: `@openreachtech/mentsu-logger` appends the date and the
 * extension to whatever it is given, so this produces `logs/app-job-2026-09-26.log` beside the
 * `logs/api-client-authentication-` lines the request path already writes.
 */
const SAVING_LOG_FILE_PATH = rootPath.to('logs/app-job-')

/**
 * The one job engine this repository's processes are configured from.
 *
 * **What an engine is.** The single object naming where workers live, which Redis to open, which
 * share and context classes to build, which error codes exist and where a job's log goes. Every
 * dispatcher, worker and scheduler points at it through `EngineCtor`, so the two processes that
 * have to agree — the API server that enqueues and the daemon that consumes — agree by reading
 * one file instead of by two matching literals.
 *
 * **Why one engine and not one per service.** The queues are split per service, because the spec
 * asks that the heaviest operation be scalable on its own; a queue is a manifest's `jobName` and
 * costs a directory. The engine is not a queue. It is the process's configuration, and there is
 * one process on each side, so a second engine would only be a second place for the Redis address
 * to disagree with itself.
 *
 * **`InvalidRequest` is load-bearing.** `BaseJobDispatcher` raises it by that exact name when a
 * body fails its manifest's schema, which is the one error code in the hash below the framework
 * reaches for rather than this repository. Renaming it does not produce a different error; it
 * produces a `TypeError` inside the dispatcher at the moment a bad body arrives.
 *
 * **`schedulersPath`, and what changed.** This key was previously left off, on the grounds that
 * nothing in this version registered a repeatable job — every run was enqueued by the request that
 * accepted it, never by a clock — and that the day a scheduler existed was the day to add it. §19
 * brought that day: retention's two purges are bounded by a horizon rather than by a caller, so
 * nothing requests them and only a clock can start them. Both point at the same directory as the
 * workers; the note above `SCHEDULERS_PATH` gives the reasoning and the one sharp edge.
 *
 * **Registering a schedule is still not automatic, unlike binding a worker.** The scan finds the
 * scheduler classes, but a schedule also needs *when*, and the framework asks the application for
 * that through `AppJobSchedulerService.collectScheduleInputs()`. Nothing fires until
 * `scripts/startJobSchedulers.js` has been run once against this same Redis.
 */
export default class AppJobEngine extends BaseJobEngine {
  /**
   * get: Share constructor.
   *
   * @override
   * @returns {typeof AppJobShare} Share constructor.
   */
  static get ShareCtor () {
    return AppJobShare
  }

  /**
   * get: Context constructor.
   *
   * @override
   * @returns {typeof AppJobContext} Context constructor.
   */
  static get ContextCtor () {
    return AppJobContext
  }

  /**
   * get: RedisConnection class — a seam so tests can substitute it.
   *
   * @returns {typeof RedisConnection} RedisConnection class.
   */
  static get RedisConnectionCtor () {
    return RedisConnection
  }

  /**
   * get: Standard error code hash.
   *
   * @override
   * @returns {Record<string, string>} Standard error code hash.
   */
  static get standardErrorCodeHash () {
    return {
      Unknown: '100.X000.001',
      InvalidRequest: '103.X000.001',
      Database: '104.X000.001',
    }
  }

  /**
   * get: Saving log file path.
   *
   * @override
   * @returns {string} Saving log file path.
   */
  static get savingLogFilePath () {
    return SAVING_LOG_FILE_PATH
  }

  /**
   * get: Config.
   *
   * @override
   * @returns {{
   *   workersPath: string
   *   schedulersPath: string
   *   redisConfig: import('ioredis').RedisOptions
   * }} Config hash.
   */
  static get config () {
    return {
      workersPath: WORKERS_PATH,
      schedulersPath: SCHEDULERS_PATH,
      redisConfig: this.buildRedisConfig(),
    }
  }

  /**
   * Build the Redis options every queue, worker and scheduler of this engine connects with.
   *
   * @returns {import('ioredis').RedisOptions} Connection options.
   */
  static buildRedisConfig () {
    const redisConnection = this.createRedisConnection()

    return redisConnection.generateConnectionOptions()
  }

  /**
   * Create the Redis connection.
   *
   * @returns {RedisConnection} RedisConnection instance.
   */
  static createRedisConnection () {
    return this.RedisConnectionCtor.create()
  }
}
