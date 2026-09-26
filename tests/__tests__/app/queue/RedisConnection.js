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
              tlsOptions: null,
            },
            expected: '127.0.0.1',
          },
          {
            input: {
              host: 'redis.queue.example.com',
              port: 16379,
              password: 'queue-password-alpha',
              tlsOptions: null,
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
              tlsOptions: null,
            },
            expected: 6379,
          },
          {
            input: {
              host: 'redis.queue.example.com',
              port: 16379,
              password: 'queue-password-alpha',
              tlsOptions: null,
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
              tlsOptions: null,
            },
            expected: null,
          },
          {
            input: {
              host: 'redis.queue.example.com',
              port: 16379,
              password: 'queue-password-alpha',
              tlsOptions: null,
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

      describe('#tlsOptions', () => {
        const cases = [
          {
            label: 'no TLS declared',
            input: {
              host: '127.0.0.1',
              port: 6379,
              password: null,
              tlsOptions: null,
            },
            expected: null,
          },
          {
            label: 'TLS declared, certificates verified',
            input: {
              host: 'redis.queue.example.com',
              port: 16379,
              password: 'queue-password-alpha',
              tlsOptions: {
                rejectUnauthorized: true,
              },
            },
            expected: {
              rejectUnauthorized: true,
            },
          },
        ]

        test.each(cases)('label: $label', ({
          input,
          expected,
        }) => {
          const connection = new RedisConnection(input)

          expect(connection)
            .toHaveProperty('tlsOptions', expected)
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
            tlsOptions: null,
          },
          expected: {
            host: '127.0.0.1',
            port: 6379,
            password: null,
            tlsOptions: null,
          },
        },
        {
          input: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
            tlsOptions: {
              rejectUnauthorized: true,
            },
          },
          expected: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
            tlsOptions: {
              rejectUnauthorized: true,
            },
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
              REDIS_TLS: 'true',
            },
          },
          expected: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-beta',
            tlsOptions: {
              rejectUnauthorized: true,
            },
          },
        },
        {
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.staging.example.net',
              REDIS_PORT: '26379',
              REDIS_PASSWORD: 'queue-password-gamma',
              // REDIS_TLS: a deployment that declares none
            },
          },
          expected: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-gamma',
            tlsOptions: null,
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
          tlsOptions: null,
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
            tlsOptions: null,
          },
          expected: {
            host: '127.0.0.1',
            port: 6379,
            password: null,
            maxRetriesPerRequest: null,
            // tls: an absent key, not a key holding null
          },
        },
        {
          factoryParams: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
            tlsOptions: null,
          },
          expected: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-alpha',
            maxRetriesPerRequest: null,
            // tls: an absent key, not a key holding null
          },
        },
        {
          factoryParams: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-delta',
            tlsOptions: null,
          },
          expected: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-delta',
            maxRetriesPerRequest: null,
            // tls: an absent key, not a key holding null
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

describe('RedisConnection', () => {
  describe('.generateTlsOptions()', () => {
    /*
     * The address and the transport are declared separately, and this is the second of them. A
     * host across a network says where the connection goes and nothing about how it is carried —
     * which is why a `REDIS_HOST` naming a remote Redis is not what turns TLS on here.
     */
    describe('should answer the options the environment declares', () => {
      const cases = [
        {
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.queue.example.com',
              REDIS_TLS: 'true',
            },
          },
          expected: {
            rejectUnauthorized: true,
          },
        },
        {
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.staging.example.net',
              REDIS_TLS: 'true',
            },
          },
          expected: {
            rejectUnauthorized: true,
          },
        },
      ]

      test.each(cases)('REDIS_HOST: $input.environmentHash.REDIS_HOST', ({
        input,
        expected,
      }) => {
        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (input.environmentHash))

        const received = RedisConnection.generateTlsOptions()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('.generateTlsOptions()', () => {
    /*
     * Everything but the one declared value answers none, including the spellings an operator
     * might reach for. Anything else would make "is TLS on" depend on which of them was written.
     */
    describe('should answer null when the environment declares no TLS', () => {
      const cases = [
        {
          label: 'nothing declared at all',
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.queue.example.com',
            },
          },
        },
        {
          label: 'declared empty',
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.queue.example.com',
              REDIS_TLS: '',
            },
          },
        },
        {
          label: 'declared false',
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.queue.example.com',
              REDIS_TLS: 'false',
            },
          },
        },
        {
          label: 'declared with the wrong spelling',
          input: {
            environmentHash: {
              REDIS_HOST: 'redis.queue.example.com',
              REDIS_TLS: 'TRUE',
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        jest.spyOn(RedisConnection, 'env', 'get')
          .mockReturnValue(/** @type {*} */ (input.environmentHash))

        const received = RedisConnection.generateTlsOptions()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('#buildTlsOptionHash()', () => {
    describe('should carry the tls option when the connection has one', () => {
      const cases = [
        {
          factoryParams: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-epsilon',
            tlsOptions: {
              rejectUnauthorized: true,
            },
          },
          expected: {
            tls: {
              rejectUnauthorized: true,
            },
          },
        },
        {
          factoryParams: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-zeta',
            tlsOptions: {
              rejectUnauthorized: true,
            },
          },
          expected: {
            tls: {
              rejectUnauthorized: true,
            },
          },
        },
      ]

      test.each(cases)('host: $factoryParams.host', ({
        factoryParams,
        expected,
      }) => {
        const connection = RedisConnection.create(factoryParams)

        const received = connection.buildTlsOptionHash()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('#buildTlsOptionHash()', () => {
    /*
     * Nothing at all rather than a `tls` key holding null. `ioredis` reads the option's
     * truthiness, so both would carry the same behavior — but these options are read by people
     * too, and a key stating that TLS was considered and declined is a different claim from one
     * that was never in play.
     */
    describe('should carry nothing when the connection has none', () => {
      const cases = [
        {
          factoryParams: {
            host: '127.0.0.1',
            port: 6379,
            password: null,
            tlsOptions: null,
          },
        },
        {
          factoryParams: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-eta',
            tlsOptions: null,
          },
        },
      ]

      test.each(cases)('host: $factoryParams.host', ({
        factoryParams,
      }) => {
        const connection = RedisConnection.create(factoryParams)

        const received = connection.buildTlsOptionHash()

        expect(received)
          .toEqual({})
      })
    })
  })
})

describe('RedisConnection', () => {
  describe('#generateConnectionOptions()', () => {
    /*
     * The whole point of the finding this answers: before it, these options carried host, port,
     * password and the retry cap, and a deployment pointing at a Redis across a network had no way
     * to say the connection should be encrypted — so `AUTH <password>` and every command after it
     * crossed the network in the clear. What a `tls` option does is make the socket a TLS one, and
     * `rejectUnauthorized` is what makes it authenticate the far end.
     */
    describe('should carry the tls option when the environment declared one', () => {
      const cases = [
        {
          factoryParams: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-theta',
            tlsOptions: {
              rejectUnauthorized: true,
            },
          },
          expected: {
            host: 'redis.queue.example.com',
            port: 16379,
            password: 'queue-password-theta',
            maxRetriesPerRequest: null,
            tls: {
              rejectUnauthorized: true,
            },
          },
        },
        {
          factoryParams: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-iota',
            tlsOptions: {
              rejectUnauthorized: true,
            },
          },
          expected: {
            host: 'redis.staging.example.net',
            port: 26379,
            password: 'queue-password-iota',
            maxRetriesPerRequest: null,
            tls: {
              rejectUnauthorized: true,
            },
          },
        },
      ]

      test.each(cases)('host: $factoryParams.host', ({
        factoryParams,
        expected,
      }) => {
        const connection = RedisConnection.create(factoryParams)

        const received = connection.generateConnectionOptions()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
