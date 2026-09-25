import {
  env,
} from '../../../../app/globals/_.js'

import RedisConnection from '../../../../app/queue/RedisConnection.js'

describe('RedisConnection', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#host', () => {
        const cases = [
          {
            input: {
              host: '127.0.0.1',
              port: 6379,
              password: null,
            },
            expected: '127.0.0.1',
          },
          {
            input: {
              host: 'redis.queue.example.com',
              port: 16379,
              password: 'queue-password-alpha',
            },
            expected: 'redis.queue.example.com',
          },
        ]

        test.each(cases)('host: $input.host', ({
          input,
          expected,
        }) => {
          const connection = new RedisConnection(input)

          expect(connection)
            .toHaveProperty('host', expected)
        })
      })

      describe('#port', () => {
        const cases = [
          {
            input: {
              host: '127.0.0.1',
              port: 6379,
              password: null,
            },
            expected: 6379,
          },
          {
            input: {
              host: 'redis.queue.example.com',
              port: 16379,
              password: 'queue-password-alpha',
            },
            expected: 16379,
          },
        ]

        test.each(cases)('port: $input.port', ({
          input,
          expected,
        }) => {
          const connection = new RedisConnection(input)

          expect(connection)
            .toHaveProperty('port', expected)
        })
      })

      describe('#password', () => {
        const cases = [
          {
            input: {
              host: '127.0.0.1',
              port: 6379,
              password: null,
            },
            expected: null,
          },
          {
            input: {
              host: 'redis.queue.example.com',
              port: 16379,
              password: 'queue-password-alpha',
            },
            expected: 'queue-password-alpha',
          },
        ]

        test.each(cases)('password: $input.password', ({
          input,
          expected,
        }) => {
          const connection = new RedisConnection(input)

          expect(connection)
            .toHaveProperty('password', expected)
        })
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            host: '127.0.0.1',
            port: 6379,
            password: null,
          },
        },
        {
          input: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
          },
        },
      ]

      test.each(cases)('host: $input.host', ({
        input,
      }) => {
        const received = RedisConnection.create(input)

        expect(received)
          .toBeInstanceOf(RedisConnection)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            host: '127.0.0.1',
            port: 6379,
            password: null,
          },
          expected: {
            host: '127.0.0.1',
            port: 6379,
            password: null,
          },
        },
        {
          input: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
          },
          expected: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
          },
        },
      ]

      test.each(cases)('host: $input.host', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(RedisConnection)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill every value from the environment', () => {
      const cases = [
        {
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.queue.example.com',
              REDIS_PORT: '16379',
              REDIS_PASSWORD: 'queue-password-beta',
            },
          },
          expected: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-beta',
          },
        },
        {
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.staging.example.net',
              REDIS_PORT: '26379',
              REDIS_PASSWORD: 'queue-password-gamma',
            },
          },
          expected: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-gamma',
          },
        },
      ]

      test.each(cases)('REDIS_HOST: $input.environmentHash.REDIS_HOST', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(RedisConnection)

        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (input.environmentHash))

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fall back to the address the compose file publishes', () => {
      test('when the environment declares nothing', () => {
        const SpyClass = constructorSpy.spyOn(RedisConnection)
        const expected = {
          host: '127.0.0.1',
          port: 6379,
          password: null,
        }

        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ ({}))

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('.get:env', () => {
    test('should be the environment barrel', () => {
      const expected = env

      const actual = RedisConnection.env

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('RedisConnection', () => {
  describe('.generateHost()', () => {
    describe('should answer the host the environment declares', () => {
      const cases = [
        {
          params: {
            environmentHash: {
              REDIS_HOST: 'redis.queue.example.com',
            },
          },
          expected: 'redis.queue.example.com',
        },
        {
          params: {
            environmentHash: {
              REDIS_HOST: '10.4.2.17',
            },
          },
          expected: '10.4.2.17',
        },
        {
          params: {
            environmentHash: {
              REDIS_HOST: 'localhost',
            },
          },
          expected: 'localhost',
        },
      ]

      test.each(cases)('REDIS_HOST: $params.environmentHash.REDIS_HOST', ({
        params,
        expected,
      }) => {
        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (params.environmentHash))

        const actual = RedisConnection.generateHost()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('.generateHost()', () => {
    describe('should fall back to loopback', () => {
      const cases = [
        {
          params: {
            environmentHash: {},
          },
          label: 'a variable nobody declared',
        },
        {
          params: {
            environmentHash: {
              REDIS_HOST: null,
            },
          },
          label: 'a variable the barrel answers null for',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const expected = '127.0.0.1'

        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (params.environmentHash))

        const actual = RedisConnection.generateHost()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('.generatePort()', () => {
    describe('should answer the port the environment declares, as a number', () => {
      const cases = [
        {
          params: {
            environmentHash: {
              REDIS_PORT: '6379',
            },
          },
          expected: 6379,
        },
        {
          params: {
            environmentHash: {
              REDIS_PORT: '16379',
            },
          },
          expected: 16379,
        },
        {
          params: {
            environmentHash: {
              REDIS_PORT: '26379',
            },
          },
          expected: 26379,
        },
      ]

      test.each(cases)('REDIS_PORT: $params.environmentHash.REDIS_PORT', ({
        params,
        expected,
      }) => {
        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (params.environmentHash))

        const actual = RedisConnection.generatePort()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('.generatePort()', () => {
    describe('should fall back to the default Redis port', () => {
      const cases = [
        {
          params: {
            environmentHash: {},
          },
          label: 'a variable nobody declared',
        },
        {
          params: {
            environmentHash: {
              REDIS_PORT: null,
            },
          },
          label: 'a variable the barrel answers null for',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const expected = 6379

        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (params.environmentHash))

        const actual = RedisConnection.generatePort()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('.generatePassword()', () => {
    describe('should answer the password the environment declares', () => {
      const cases = [
        {
          params: {
            environmentHash: {
              REDIS_PASSWORD: 'queue-password-beta',
            },
          },
          expected: 'queue-password-beta',
        },
        {
          params: {
            environmentHash: {
              REDIS_PASSWORD: 'queue-password-gamma',
            },
          },
          expected: 'queue-password-gamma',
        },
      ]

      test.each(cases)('REDIS_PASSWORD: $params.environmentHash.REDIS_PASSWORD', ({
        params,
        expected,
      }) => {
        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (params.environmentHash))

        const actual = RedisConnection.generatePassword()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('.generatePassword()', () => {
    describe('should answer null when the environment declares none', () => {
      const cases = [
        {
          params: {
            environmentHash: {},
          },
          label: 'a variable nobody declared',
        },
        {
          params: {
            environmentHash: {
              REDIS_PASSWORD: null,
            },
          },
          label: 'a variable the barrel answers null for',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (params.environmentHash))

        const actual = RedisConnection.generatePassword()

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('#generateConnectionOptions()', () => {
    /*
     * `maxRetriesPerRequest: null` is BullMQ's own requirement — a worker parks on a blocking read
     * while its queue is empty, and any cap on request retries ends that read. Handed a live
     * ioredis instance BullMQ throws on a capped connection; handed an options object it warns and
     * overrides. Either way the value is not ours to leave off, so it is asserted every time.
     */
    describe('should carry the address it was created with, uncapped', () => {
      const cases = [
        {
          factoryParams: {
            host: '127.0.0.1',
            port: 6379,
            password: null,
          },
          expected: {
            host: '127.0.0.1',
            port: 6379,
            password: null,
            maxRetriesPerRequest: null,
          },
        },
        {
          factoryParams: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
          },
          expected: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
            maxRetriesPerRequest: null,
          },
        },
        {
          factoryParams: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-delta',
          },
          expected: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-delta',
            maxRetriesPerRequest: null,
          },
        },
      ]

      test.each(cases)('host: $factoryParams.host', ({
        factoryParams,
        expected,
      }) => {
        const connection = RedisConnection.create(factoryParams)

        const actual = connection.generateConnectionOptions()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
