import {
  BaseJobEngine,
} from '@openreachtech/renchan-job-bullmq'

import {
  rootPath,
} from '../../../../app/globals/_.js'

import AppJobEngine from '../../../../app/queue/AppJobEngine.js'
import RedisConnection from '../../../../app/queue/RedisConnection.js'

import AppJobShare from '../../../../app/queue/contexts/AppJobShare.js'
import AppJobContext from '../../../../app/queue/contexts/AppJobContext.js'

describe('AppJobEngine', () => {
  describe('super class', () => {
    test('to be instance of BaseJobEngine', () => {
      const received = AppJobEngine.prototype

      expect(received)
        .toBeInstanceOf(BaseJobEngine)
    })
  })
})

describe('AppJobEngine', () => {
  describe('.get:ShareCtor', () => {
    test('should be AppJobShare', () => {
      const expected = AppJobShare

      const actual = AppJobEngine.ShareCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('AppJobEngine', () => {
  describe('.get:ContextCtor', () => {
    test('should be AppJobContext', () => {
      const expected = AppJobContext

      const actual = AppJobEngine.ContextCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('AppJobEngine', () => {
  describe('.get:RedisConnectionCtor', () => {
    test('should be RedisConnection', () => {
      const expected = RedisConnection

      const actual = AppJobEngine.RedisConnectionCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('AppJobEngine', () => {
  describe('.get:standardErrorCodeHash', () => {
    /*
     * `InvalidRequest` is the one name here the framework itself reaches for: `BaseJobDispatcher`
     * raises `this.Error.InvalidRequest` when a body fails its manifest's schema. Renaming it
     * produces a TypeError inside the dispatcher rather than a different error, so the hash is
     * asserted whole rather than by the codes this repository happens to raise today.
     */
    test('should declare the codes a job can carry', () => {
      const expected = {
        Unknown: '100.X000.001',
        InvalidRequest: '103.X000.001',
        Database: '104.X000.001',
      }

      const actual = AppJobEngine.standardErrorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('AppJobEngine', () => {
  describe('.get:savingLogFilePath', () => {
    /*
     * A prefix and not a file name: `@openreachtech/mentsu-logger` appends the date and the
     * extension to whatever it is handed, so a value ending in `.log` would produce
     * `app-job.log2026-09-26.log`.
     */
    test('should be the prefix a job log rotates on', () => {
      const expected = rootPath.to('logs/app-job-')

      const actual = AppJobEngine.savingLogFilePath

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AppJobEngine', () => {
  describe('.get:config', () => {
    /*
     * `workersPath` is asserted because the daemon loads every `BaseJobWorker` subclass beneath
     * it: a path reaching one directory higher would pick up a shared abstract base worker, which
     * has no job name, and stop the daemon at boot.
     */
    test('should name the workers path and the Redis to open', () => {
      const expected = {
        workersPath: rootPath.to('app/jobs/'),
        redisConfig: {
          host: 'redis.queue.example.com',
          port: 16379,
          password: 'queue-password-beta',
          maxRetriesPerRequest: null,
        },
      }

      jest.spyOn(RedisConnection, 'env', 'get')
        .mockReturnValue(/** @type {*} */ ({
          REDIS_HOST: 'redis.queue.example.com',
          REDIS_PORT: '16379',
          REDIS_PASSWORD: 'queue-password-beta',
        }))

      const actual = AppJobEngine.config

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('AppJobEngine', () => {
  describe('.buildRedisConfig()', () => {
    test('should be the options the Redis connection generates', () => {
      const expected = {
        host: 'redis.staging.example.net',
        port: 26379,
        password: 'queue-password-gamma',
        maxRetriesPerRequest: null,
      }

      jest.spyOn(RedisConnection, 'env', 'get')
        .mockReturnValue(/** @type {*} */ ({
          REDIS_HOST: 'redis.staging.example.net',
          REDIS_PORT: '26379',
          REDIS_PASSWORD: 'queue-password-gamma',
        }))

      const actual = AppJobEngine.buildRedisConfig()

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('AppJobEngine', () => {
  describe('.createRedisConnection()', () => {
    test('should be an instance of RedisConnection', () => {
      const actual = AppJobEngine.createRedisConnection()

      expect(actual)
        .toBeInstanceOf(RedisConnection)
    })
  })
})
