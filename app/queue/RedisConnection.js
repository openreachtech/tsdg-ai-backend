import {
  env,
} from '../globals/_.js'

/*
 * The values `docker-compose.development.yml` publishes for its `redis:7.4` service: the loopback
 * address and Redis' own port. They are a fallback and not the answer — `REDIS_HOST` and
 * `REDIS_PORT` decide, and these stand in only while an environment declares neither. A checkout
 * that has run the compose file therefore reaches the container it already started without
 * declaring anything, while a deployment pointing anywhere else says so in its own environment.
 */
const DEFAULT_REDIS_HOST = '127.0.0.1'
const DEFAULT_REDIS_PORT = 6379

/*
 * BullMQ's own requirement, and the reason this value is written out rather than left off.
 *
 * A worker parks on a blocking read for as long as its queue is empty, which is most of the time.
 * ioredis caps how many times one request may be retried, and that cap ends the very read the
 * worker is parked on. So BullMQ refuses a blocking connection carrying a cap: handed a live
 * ioredis instance it throws, and handed a plain options object — which is what this class
 * produces — it prints `BullMQ: WARNING! Your redis options maxRetriesPerRequest must be null` to
 * stderr on every connection and overrides the value itself
 * (`node_modules/bullmq/dist/cjs/classes/redis-connection.js`). Declaring it here means the
 * options this repository hands over are already the ones BullMQ would have forced, so nothing is
 * silently rewritten underneath and no warning is printed for an operator to learn to ignore.
 */
const UNCAPPED_REQUEST_RETRIES = null

/**
 * The one Redis this service opens, and the options every queue connection is built from.
 *
 * **Why one class rather than an options literal at each site.** Two long-lived processes share a
 * single Redis: the API server enqueues a job when a run is accepted, and the job daemon consumes
 * it. They are separate processes with separate boots, and a queue only works while both are
 * pointed at the same instance — so the address is resolved in one place and read from there,
 * rather than written twice and kept in step by hand.
 *
 * **Where the address comes from.** `REDIS_HOST`, `REDIS_PORT` and `REDIS_PASSWORD`, read through
 * the environment barrel (`app/globals/_.js`) and never from `process.env`. An undeclared variable
 * resolves to `null` through that barrel rather than throwing, which is what makes the two
 * defaults above reachable; a declared one always wins — including one declared empty, which is a
 * declaration and not an absence, and which ends as a connection refused against port 0 rather
 * than as a service quietly talking to the wrong Redis.
 *
 * **Why the port is converted here.** An environment variable is a string and `ioredis` wants a
 * number, and a conversion is the factory method's work rather than the constructor's — so
 * `.generatePort()` does it once and `#port` holds a number from then on.
 *
 * **What this class does not produce.** A second, un-capped option shape for a Redis PubSub
 * broker. Nothing in this service subscribes: a run reports its outcome by posting a callback to
 * the client's own URL (`#run-delivery`), not by publishing progress over a GraphQL subscription.
 * The shape belongs here the day something subscribes, and not before.
 */
export default class RedisConnection {
  /**
   * Constructor.
   *
   * @param {RedisConnectionParams} params - Parameters.
   */
  constructor ({
    host,
    port,
    password,
  }) {
    this.host = host
    this.port = port
    this.password = password
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof RedisConnection ? X : never} T, X
   * @param {RedisConnectionFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    host = this.generateHost(),
    port = this.generatePort(),
    password = this.generatePassword(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        host,
        port,
        password,
      })
    )
  }

  /**
   * Environment variables.
   *
   * @returns {typeof env} Environment facade.
   */
  static get env () {
    return env
  }

  /**
   * Generate the host the environment declares.
   *
   * @returns {string} Host.
   */
  static generateHost () {
    return this.env.REDIS_HOST
      ?? DEFAULT_REDIS_HOST
  }

  /**
   * Generate the port the environment declares.
   *
   * @returns {number} Port.
   */
  static generatePort () {
    const declaredPort = this.env.REDIS_PORT
      ?? DEFAULT_REDIS_PORT

    return Number(declaredPort)
  }

  /**
   * Generate the password the environment declares.
   *
   * A Redis reached over loopback with no `requirepass` needs none, which is what the compose
   * file runs, so an absent variable is answered with `null` — the value `ioredis` reads as "send
   * no AUTH" — rather than treated as a misconfiguration.
   *
   * @returns {string | null} Password, or null when the environment declares none.
   */
  static generatePassword () {
    return this.env.REDIS_PASSWORD
      ?? null
  }

  /**
   * Generate the connection options a BullMQ queue, worker or scheduler is built with.
   *
   * @returns {import('ioredis').RedisOptions} Connection options.
   * @public
   */
  generateConnectionOptions () {
    return {
      host: this.host,
      port: this.port,
      password: this.password,
      maxRetriesPerRequest: UNCAPPED_REQUEST_RETRIES,
    }
  }
}

/**
 * @typedef {{
 *   host: string
 *   port: number
 *   password: string | null
 * }} RedisConnectionParams
 */

/**
 * @typedef {Partial<RedisConnectionParams>} RedisConnectionFactoryParams
 */
