'use strict'

const UNUSABLE_SSL_DECLARATION_MESSAGE = 'DATABASE_SSL must be either `true`, `false`, or unset. It is read as those three words and nothing else, because every other way of reading it turns a misspelling into a silent `false`: a deployment that believes it asked for an encrypted connection and did not get one is worse off than one that never asked, and the difference is invisible from the outside.'

const SSL_OVER_SOCKET_MESSAGE = 'DATABASE_SSL must not be `true` while DATABASE_HOST names a unix socket. A socket connection never leaves the host, so there is no transport for TLS to protect and the driver would be asked to negotiate it over a path that does not offer it. Declaring both is a contradiction rather than extra caution, and it is refused here instead of being dropped quietly — a setting that is ignored still reads, to whoever set it, as a setting that took effect.'

/**
 * Says how the driver reaches the database: over the network, or over a unix socket, and whether
 * that network connection is encrypted.
 *
 * Cloud SQL is reached from Cloud Run through the socket it mounts at
 * `/cloudsql/<connection name>`, and that path arrives in `DATABASE_HOST` like any host would. No
 * host name begins with `/`, so a host that does is a socket path, and it is handed to the driver
 * as `socketPath` — the option both `mysql2` and `mariadb` read. Anything else is a host, and the
 * driver needs nothing beyond it to reach one.
 *
 * ## TLS is a lever, built and left down
 *
 * Ported from a sibling repository that reached the same two problems first. The lever half
 * closes what this repository recorded as Q24 - no transport encryption option existed on any
 * SQL connection - and the socket half is what lets the deployment connect at all.
 *
 * **The default is no TLS, and changing that default would break the deployment that exists.** The
 * connection this application actually makes is the unix socket above, where the bytes never reach
 * a network; the two dialect suites reach a database on loopback. Neither has a transport to
 * encrypt. What was missing is the lever for the day the connection moves onto a TCP path — a
 * read replica, a database outside the VPC, a second region — because that is the day somebody
 * needs it configured, not written.
 *
 * So `DATABASE_SSL` turns it on and nothing else does:
 *
 * | key | default | meaning |
 * | :-- | :-- | :-- |
 * | `DATABASE_SSL` | unset, read as `false` | `true` asks the driver for a TLS connection. Only `true`, `false` and unset are accepted; anything else refuses, rather than being read as `false` |
 * | `DATABASE_SSL_CA` | unset | the PEM of the certificate authority to verify the server against. Unset means the system trust store, which is right for a managed database with a publicly-signed certificate and wrong for one signed by a per-instance authority |
 *
 * **`rejectUnauthorized` is `true` and no key can make it false.** It is written here rather than
 * left to the driver because `mysql2` has defaulted it the other way, and a TLS connection that
 * accepts any certificate protects against a passive listener while leaving the active one — the
 * only attacker who was ever the reason to encrypt this — with the same access they had. If a
 * certificate cannot be verified, the answer is `DATABASE_SSL_CA`, or a certificate that can be.
 *
 * CommonJS, because `sequelize/config.cjs` is read by `sequelize-cli` through `require`.
 */
class DatabaseDialectOptionsBuilder {
  /**
   * Constructor.
   *
   * @param {DatabaseDialectOptionsBuilderParams} params - Parameters.
   */
  constructor ({
    databaseHost,
    databaseSsl,
    databaseSslCa,
  }) {
    this.databaseHost = databaseHost
    this.databaseSsl = databaseSsl
    this.databaseSslCa = databaseSslCa
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof DatabaseDialectOptionsBuilder ? X : never} T, X
   * @param {DatabaseDialectOptionsBuilderFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    databaseHost,
    databaseSsl = null,
    databaseSslCa = null,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        databaseHost,
        databaseSsl,
        databaseSslCa,
      })
    )
  }

  /**
   * Build the `dialectOptions` of a Sequelize configuration.
   *
   * @returns {{
   *   socketPath?: string
   *   ssl?: {
   *     rejectUnauthorized: boolean
   *     ca?: string
   *   }
   * }} The options the driver needs to reach the database.
   * @throws {Error} When TLS is asked for over a unix socket, or declared unusably.
   * @public
   */
  buildDialectOptions () {
    if (this.isSocketPath()) {
      return this.buildSocketOptions()
    }

    return this.buildSslOptions()
  }

  /**
   * Build the options reaching the database over a unix socket.
   *
   * @returns {{
   *   socketPath: string
   * }} Socket options.
   * @throws {Error} When TLS is asked for as well.
   * @public
   */
  buildSocketOptions () {
    if (this.usesSsl()) {
      throw new Error(SSL_OVER_SOCKET_MESSAGE)
    }

    return {
      socketPath: this.databaseHost,
    }
  }

  /**
   * Build the options encrypting the connection, empty where TLS was not asked for.
   *
   * @returns {{
   *   ssl?: {
   *     rejectUnauthorized: boolean
   *     ca?: string
   *   }
   * }} TLS options.
   * @throws {Error} When TLS is declared unusably.
   * @public
   */
  buildSslOptions () {
    if (!this.usesSsl()) {
      return {}
    }

    return {
      ssl: {
        ...this.buildCertificateAuthorityOptions(),

        /*
         * Never `false`, and no environment key reaches it. See the class documentation: a TLS
         * connection that accepts any certificate stops a listener and not the one who answers.
         */
        rejectUnauthorized: true,
      },
    }
  }

  /**
   * Build the certificate authority to verify the server against, empty where none is declared.
   *
   * @returns {{
   *   ca?: string
   * }} Certificate authority options.
   * @public
   */
  buildCertificateAuthorityOptions () {
    if (!this.databaseSslCa) {
      return {}
    }

    return {
      ca: this.databaseSslCa,
    }
  }

  /**
   * Check whether the connection is to be encrypted.
   *
   * @returns {boolean} `true` when TLS is asked for.
   * @throws {Error} When the declaration is neither `true`, `false`, nor absent.
   * @public
   */
  usesSsl () {
    return this.normalizeSslDeclaration() === 'true'
  }

  /**
   * Normalize the TLS declaration to one of the three words it may be.
   *
   * Surrounding whitespace is trimmed first: a platform that supplies the process environment from
   * a form often carries it along.
   *
   * @returns {string} `'true'`, `'false'`, or `''` for an absent declaration.
   * @throws {Error} When the declaration is none of those.
   * @public
   */
  normalizeSslDeclaration () {
    const declaredSsl = String(this.databaseSsl ?? '')
      .trim()

    if (!['', 'true', 'false'].includes(declaredSsl)) {
      throw new Error(UNUSABLE_SSL_DECLARATION_MESSAGE)
    }

    return declaredSsl
  }

  /**
   * Check whether the host is a unix socket path.
   *
   * @returns {boolean} `true` when the host is an absolute path.
   * @public
   */
  isSocketPath () {
    return String(this.databaseHost ?? '')
      .startsWith('/')
  }
}

module.exports = DatabaseDialectOptionsBuilder

/**
 * @typedef {{
 *   databaseHost: string | null | undefined
 *   databaseSsl: string | null | undefined
 *   databaseSslCa: string | null | undefined
 * }} DatabaseDialectOptionsBuilderParams
 */

/**
 * @typedef {{
 *   databaseHost: string | null | undefined
 *   databaseSsl?: string | null | undefined
 *   databaseSslCa?: string | null | undefined
 * }} DatabaseDialectOptionsBuilderFactoryParams
 */
