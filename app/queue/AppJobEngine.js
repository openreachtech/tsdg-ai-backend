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
 * was never meant to run. A shared base therefore lives beside this file under `app/queue/`, and
 * `app/jobs/` holds one directory per queue and nothing above them.
 */
const WORKERS_PATH = rootPath.to('app/jobs/')

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
 * **No `schedulersPath`.** Nothing in this version registers a repeatable job — a run is enqueued
 * by the request that accepted it, never by a clock — so the key is left off rather than pointed
 * at a directory with nothing in it. It is added the day a scheduler exists.
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
   *   redisConfig: import('ioredis').RedisOptions
   * }} Config hash.
   */
  static get config () {
    return {
      workersPath: WORKERS_PATH,
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
