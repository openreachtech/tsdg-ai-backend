'use strict'

const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
}

/*
 * The two long-lived processes this service runs, and why there are two.
 *
 * `API Server` answers requests; `Job Daemon` runs the work those requests queued. They are split
 * because a run calls a model and fetches files from elsewhere, either of which can take the 300
 * seconds the non-functional section allows a run — far longer than a request may be held open.
 * The API answers `202` with a run key and enqueues, and the daemon consumes. Both processes read
 * one Redis, through `app/queue/AppJobEngine.js`, and one database.
 *
 * **`API Server`, not `GraphQL API`.** The script it runs starts three servers: the customer
 * GraphQL engine on 3900, the admin GraphQL engine on 5800, and the RESTful API on 8001 — which
 * is the one this product's clients actually call, and the one `.hora/contracts` cuts a contract
 * for. A name saying `GraphQL API` was true of a third of what the process does and silently
 * wrong about the rest.
 */
module.exports = {
  apps: [
    {
      name: 'API Server',
      script: './server/index.js',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env_development: {
        NODE_ENV: ENV.DEVELOPMENT,
      },
      env_production: {
        NODE_ENV: ENV.PRODUCTION,
      },
    },
    {
      name: 'Job Daemon',
      script: './scripts/startJobDaemon.js',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env_development: {
        NODE_ENV: ENV.DEVELOPMENT,
      },
      env_production: {
        NODE_ENV: ENV.PRODUCTION,
      },
    },
  ],
}
