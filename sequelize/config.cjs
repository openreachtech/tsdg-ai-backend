'use strict'

const env = require('../app/globals/env.cjs')

const DatabaseDialectOptionsBuilder = require('./tools/DatabaseDialectOptionsBuilder.cjs')

/*
 * What every SQL connection that is not the local SQLite file is given, and why it exists.
 *
 * **`logParam: false` keeps a run's own content out of the error a failed write raises.** The
 * `mariadb` driver defaults it to `true` and then appends the statement's bound parameters to the
 * message of any error it throws, truncating only when the SQL *alone* already passes `debugLen`
 * (256 by default). The terminal write that stores a run's result body is 135 characters, so it is
 * comfortably under that bound — and roughly a hundred characters of the result body would travel
 * inside the error. Sequelize passes a driver's message through untouched, the job that raised it
 * does not swallow it, and BullMQ persists it as a failed job's `failedReason`. That is section
 * 22's rule broken — "no log written anywhere carries an image, a document or question content" —
 * by a route no single feature's own audit could see, because every link in it belongs to a
 * different one.
 *
 * Turning the driver's own appending off closes every variant of that route at once, rather than
 * the one statement that happens to be short enough today. The queues bound their failed records
 * as well, which makes anything that still escapes transient rather than permanent; two locks,
 * because the first depends on a library default that a later version could reverse.
 *
 * `mysql2` accepts and ignores the key, so `staging` may carry it without a second shape.
 */
const SQL_DIALECT_OPTION_HASH = {
  logParam: false,
}

/*
 * How the driver reaches a database whose address comes from the environment - `production`,
 * the one profile below that reads one.
 *
 * **Cloud SQL on Cloud Run is a unix socket, not a host, and handing it over as a host does not
 * connect.** The platform mounts it at `/cloudsql/<connection name>` and that path arrives in
 * `DATABASE_HOST` where a host name would. No host name begins with `/`, so one that does is a
 * socket path and belongs in `socketPath` - the option both `mysql2` and `mariadb` read.
 *
 * `live` and `staging` get none of it on purpose: their connection is written in this file, to a
 * loopback database the suite stands up or to a host that resolves nowhere, so there is no
 * address for an environment key to change and no transport for TLS to protect.
 */
const environmentDialectOptionsBuilder = DatabaseDialectOptionsBuilder.create({
  databaseHost: env.DATABASE_HOST,
  databaseSsl: env.DATABASE_SSL,
  databaseSslCa: env.DATABASE_SSL_CA,
})

const environmentDialectOptions = environmentDialectOptionsBuilder.buildDialectOptions()

module.exports = {
  development: {
    database: 'development_database',
    username: null,
    password: null,

    dialect: 'sqlite',
    storage: 'sequelize/storage/development.sqlite3',
    logging: false,
  },
  live: {
    username: 'root',
    password: 'password',
    database: 'live',
    host: '127.0.0.1',

    dialect: 'mariadb',
    port: '3306',
    dialectOptions: SQL_DIALECT_OPTION_HASH,
  },
  staging: {
    database: 'staging_database',
    username: 'admin-staging',
    password: 'staging-password',

    dialect: 'mysql',
    host: 'http://sample.example.com',
    port: 3306,
    dialectOptions: SQL_DIALECT_OPTION_HASH,
  },
  production: {
    database: env.DATABASE_NAME,
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,

    dialect: env.DATABASE_DIALECT,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    dialectOptions: {
      ...SQL_DIALECT_OPTION_HASH,
      ...environmentDialectOptions,
    },
  },
}
