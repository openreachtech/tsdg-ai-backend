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

/*
 * What `REDIS_TLS` has to say for the connection to be wrapped in TLS, and the one thing that is
 * never read from the environment.
 *
 * The switch is a declaration and the verification is not: `rejectUnauthorized` stays true here
 * with no environment variable able to reach it, so a deployment can turn transport security on
 * and cannot turn certificate checking off. An environment able to say `REDIS_TLS_VERIFY=false`
 * would be a TLS connection that authenticates nobody, which reads in a log exactly like one that
 * does.
 */
const TLS_DECLARED_VALUE = 'true'

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
 * **The transport is declared in the environment too, and separately from the address.** Naming a
 * remote host says where the connection goes and nothing about how it is carried, and this class
 * once had no way to say the second thing at all: it emitted host, port, password and the retry
 * cap, so a deployment pointing at a Redis across a network sent `AUTH <password>` and every
 * command that followed in the clear, with no environment variable able to change that. `REDIS_TLS`
 * is that variable. Declared as `'true'` it adds ioredis' `tls` option, which is what makes the
 * socket a TLS one; undeclared or declared as anything else it adds nothing, which is what
 * loopback against the compose file's container wants. Certificate verification is not on the same
 * switch — see the constant above.
 *
 * **Why the port is converted here.** An environment variable is a string and `ioredis` wants a
 * number, and a conversion is the factory method's work rather than the constructor's — so
 * `.generatePort()` does it once and `#port` holds a number from then on.
 *
 * **What this class does not produce.** A second, un-capped option shape for a Redis PubSub
 * broker. Nothing in this service subscribes: a run reports its outcome by posting a callback to
 * the client's own URL (`#run-delivery`), not by publishing progress over a GraphQL subscription.
 * The shape belongs here the day something subscribes, and not before.
 *
 * **And no `retryStrategy` that gives up, deliberately.** A connection against a Redis that is not
 * there retries for as long as it takes and never emits `end`, which is why BullMQ's
 * `waitUntilReady()` neither resolves nor rejects — and a retry strategy returning nothing after a
 * few attempts would turn that into the rejection a caller can answer. What rules it out is that
 * these options are one shape for two roles: `AppJobEngine` hands the same hash to the API
 * server's dispatchers and to the job daemon's workers, and a worker that stopped reconnecting
 * after a blip would be a consumer that is up and listening to nothing, silently. So the bound
 * sits on the side that needs one — `JobDispatcherProvider` gives up on an ask rather than on the
 * connection, leaving ioredis to reconnect in the background. The day a worker wants a different
 * retry policy from a dispatcher, it is a second option shape here and a second engine to read it,
 * and not a change to this one.
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
    tlsOptions,
  }) {
    this.host = host
    this.port = port
    this.password = password
    this.tlsOptions = tlsOptions
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
    tlsOptions = this.generateTlsOptions(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        host,
        port,
        password,
        tlsOptions,
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
   * Generate the transport-security options the environment declares.
   *
   * The answer is the object `ioredis` reads as "make this socket a TLS one", or null for a
   * connection carried as it always was. `rejectUnauthorized` is written out rather than left to
   * the default, because it is the half of TLS that does the authenticating and a reader should
   * not have to know Node's default to see that it is on.
   *
   * @returns {Record<string, *> | null} Options, or null when the environment declares no TLS.
   */
  static generateTlsOptions () {
    if (this.env.REDIS_TLS !== TLS_DECLARED_VALUE) {
      return null
    }

    return {
      rejectUnauthorized: true,
    }
  }

  /**
   * Generate the connection options a BullMQ queue, worker or scheduler is built with.
   *
   * @returns {import('ioredis').RedisOptions} Connection options.
   * @public
   */
  generateConnectionOptions () {
    const tlsOptionHash = this.buildTlsOptionHash()

    return {
      host: this.host,
      port: this.port,
      password: this.password,
      maxRetriesPerRequest: UNCAPPED_REQUEST_RETRIES,
      ...tlsOptionHash,
    }
  }

  /**
   * Build the `tls` half of the options, or nothing at all.
   *
   * A connection with no TLS answers an empty hash, so the key is spread away entirely rather than
   * written as `tls: null`. `ioredis` reads the option's truthiness, so null would have carried
   * the same behavior — but these options are read by people too, in a log or against a
   * deployment's intent, and `tls: null` reads as TLS considered and declined where an absent key
   * reads as TLS never in play. The second is what this repository's default is.
   *
   * @returns {Record<string, *>} The `tls` option, or an empty hash when no TLS is declared.
   * @public
   */
  buildTlsOptionHash () {
    if (this.tlsOptions === null) {
      return {}
    }

    return {
      tls: this.tlsOptions,
    }
  }
}

/**
 * @typedef {{
 *   host: string
 *   port: number
 *   password: string | null
 *   tlsOptions: Record<string, *> | null
 * }} RedisConnectionParams
 */

/**
 * @typedef {Partial<RedisConnectionParams>} RedisConnectionFactoryParams
 */
