# renchan-boilerplate

A running skeleton for a [renchan](https://github.com/openreachtech/renchan) application — two GraphQL endpoints, a RESTful API endpoint, and Sequelize, already wired together.

## Table of contents

- [Concept](#concept)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [How the session tokens work](#how-the-session-tokens-work)
- [Contribution](#contribution)
- [License](#license)
- [Developer](#developer)
- [Copyright](#copyright)

## Concept

renchan is an Express-based framework that builds GraphQL and RESTful API endpoints from template classes. This repository is the starting point for an application built on it.

It is not an empty directory. Clone it, install, and three servers already listen, each answering a `healthCheck` query; Sequelize already activates against SQLite; and the classes that hold a session's access and refresh tokens are already written. What is left is the application's own schema, resolvers and models.

## Installation

Requires Node.js LTS (the version the CI builds against).

A boilerplate is cloned, not installed as a package.

```sh
git clone https://github.com/openreachtech/renchan-boilerplate.git <your-project>
cd <your-project>
npm install
npm run db:refresh
npm run dev
```

`package.json` ships `name`, `version` and `description` as `TODO` placeholders — fill them in first.

The project is an ES module (`"type": "module"`); write imports with ESM `import` syntax.

## Usage

### The three servers

`server/index.js` starts all three, each on its own port.

| server | port | endpoint | engine |
| :-- | :-- | :-- | :-- |
| GraphQL for customers | 3900 | `/graphql-customer` | `CustomerGraphqlServerEngine` |
| GraphQL for admins | 5800 | `/graphql-admin` | `AdminGraphqlServerEngine` |
| RESTful API | 8001 | `/v1` | `AppRestfulApiServerEngine` |

Every one of them binds to `127.0.0.1` alone. They are meant to sit behind a reverse proxy, so no other network interface accepts a connection.

Each GraphQL endpoint answers a health check out of the box.

```sh
curl -X POST http://127.0.0.1:3900/graphql-customer \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ healthCheck }"}'
```

In production the servers run under PM2, whose configuration is `pm2.config.cjs`.

### Commands

| command | what it does |
| :-- | :-- |
| `npm run dev` | run `server/` under nodemon with `NODE_ENV=development` |
| `npm run schedulers:start` | write this repository's repeatable jobs into Redis (`scripts/startJobSchedulers.js`) |
| `npm run schedulers:stop` | remove them from Redis again (`scripts/stopJobSchedulers.js`) |
| `node scripts/readAiRuns.js <command> <parameter>` | read AI runs straight from the database, while the API is not serving |
| `npm test` | rebuild the database, seed it, and run Jest (`test.sh`) |
| `npm run test:live` | run Jest against the `live` environment, leaving the database alone (`test-live.sh`) |
| `npm run lint` | ESLint over the repository (alias: `npm run l`) |
| `npm run db:setup` | run the migrations |
| `npm run db:seed:master` | seed `sequelize/seeders/dev-master/` |
| `npm run db:seed:dev` | seed `sequelize/seeders/development/` |
| `npm run db:teardown` | delete the SQLite files under `sequelize/storage/` (alias: `npm run db:drop`) |
| `npm run db:refresh` | teardown, migrate, then both seed sets (alias: `npm run r`) |

`npm test` takes the same arguments as Jest, plus `--empty` to run only against the master seeds and `--seeded` to run against the development seeds as well.

```sh
npm test tests/__tests__/server/graphql/
npm test -- --empty
```

`sequelize/seeders/master/` holds the seeds meant for a real deployment. No script points at it — it is seeded deliberately, by hand.

`npm run schedulers:start` is a deployment step rather than a process, which is why PM2 does not run it. The retention purges are started by a clock instead of by a request, and a repeatable job lives in Redis rather than in either of the two processes — so the job daemon reports itself listening on both purge queues whether or not anything will ever post to them. Nothing does until this has been run once against the same Redis. In production the daemon also asks Redis which schedules it actually holds when it starts, and logs the id of any declared one that is missing — the retention horizons are a promise about personal data, and a schedule that was never registered otherwise looks exactly like one that is working. Run it at deployment, and again whenever a scheduler's cron expression changes; it is an upsert keyed by the scheduler id, so re-running is safe. Renaming or retiring a scheduler needs `npm run schedulers:stop` **first**, while the old id is still in the source, otherwise the old schedule keeps firing under a name nothing knows.

Neither script hardcodes an environment, because the Redis they write to is the deployment's. `NODE_ENV` therefore comes from the caller, and an unset one stops the script before it connects:

```sh
NODE_ENV=production npm run schedulers:start
```

### Reading AI runs from the command line

`scripts/readAiRuns.js` answers four questions about AI runs, and changes nothing. It is the one way to read them that does not go through the API.

```sh
NODE_ENV=production node scripts/readAiRuns.js stalled 300
NODE_ENV=production node scripts/readAiRuns.js failed-since 2026-09-27T00:00:00.000Z
NODE_ENV=production node scripts/readAiRuns.js run <run key>
NODE_ENV=production node scripts/readAiRuns.js correlation <correlation id>
```

`stalled` takes a number of seconds and answers with the runs that have been running longer than that. `failed-since` takes an instant and answers with the runs that failed after it. `run` takes a run key and answers with that one run and its steps in order. `correlation` takes a correlation id and answers with every run under it. All four read across every client, and none of them changes a run.

It opens the database directly and imports nothing from `server/`, so it answers **while the API will not boot** — which is the situation it exists for. `NODE_ENV` comes from the caller for the reason the scheduler scripts give above: the database it reads is the deployment's, and an unset one stops the command before it connects rather than letting it read a developer's SQLite file and report that nothing is stalled.

It ends under one of three codes, so a runbook step or a scheduled task can tell the cases apart without reading the output at all:

| code | what it means |
| :-- | :-- |
| `0` | it answered — including the answer that nothing matched, which is a true answer |
| `1` | it could not answer: the database would not open, or the read failed |
| `2` | the arguments were not one of the four commands |

Run it with `node` rather than through `npm run`. npm prints its own error block on any non-zero exit, and here `1` and `2` are both ordinary outcomes rather than faults — so npm would bury a real answer under `npm ERR!` lines and give a scheduled task a second thing to parse.

It never prints a request body, a result body, raw model output, or the subject label. A terminal scrollback and a scheduled task's log have no retention clock; the database gives those fields a thirty-day one.

### Where the application code goes

```
├── app/                    # code every server shares
│   ├── constants/          # constants, re-exported to ESM
│   ├── globals/            # env facade, root path, CJS require
│   └── session/            # access and refresh tokens
├── constants/              # constants, written as CJS
├── public/                 # static files the servers serve
├── sequelize/
│   ├── config.cjs          # connection settings, per NODE_ENV
│   ├── migrations/         # write the migrations here
│   ├── models/             # write the models here
│   └── seeders/            # master, dev-master, development
├── server/
│   ├── graphql/
│   │   ├── contexts/       # context and share, per audience
│   │   ├── resolvers/      # write the resolvers here
│   │   ├── schemas/        # write the GraphQL schemas here
│   │   └── *ServerEngine.js
│   ├── restfulapi/
│   │   ├── renderers/      # write the renderers here
│   │   └── AppRestfulApiServerEngine.js
│   └── index.js            # the three servers and their ports
├── tests/                  # Jest tests
└── types/                  # ambient type declarations
```

Three places are marked in the code as waiting for the application.

| what | where |
| :-- | :-- |
| how the signed-in user is found | `CustomerGraphqlContext.findUser()`, `AdminGraphqlContext.findUser()`, `AppRestfulApiContext.findUser()` |
| which schema fields a user may reach | `#get:visaIssuers` of each engine |
| the package's own identity | `name`, `version`, `description` of `package.json` |

### Resolvers, actual and stub

Each GraphQL engine declares two resolver directories, and a schema field is served by its actual resolver where one exists, by the stub otherwise.

```
server/graphql/resolvers/customer/
├── actual/          # the real implementation
│   ├── queries/
│   └── mutations/
└── stub/            # answers until the actual one is written
    ├── queries/
    └── mutations/
```

A stub lets the frontend develop against a field before its query is implemented. Note that the authentication filter is built from the actual resolvers alone, so a field served by a stub is reached without it.

### Environment variables

Variables are read through `@openreachtech/renchan-env`, which loads the dotenv file named after `NODE_ENV` from the repository root — so `NODE_ENV=development` reads the development one. Under `NODE_ENV=production` no file is read at all, and the process environment is the only source.

| variable | what it decides | default |
| :-- | :-- | :-- |
| `AUTH_REFRESH_TOKEN_TTL_DAYS` | how long the refresh-token cookie lives, in days | 14 |
| `AUTH_COOKIE_SECURE` | whether that cookie carries `Secure`; only the exact string `false` turns it off | on |
| `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_DIALECT`, `DATABASE_HOST`, `DATABASE_PORT` | the production connection in `sequelize/config.cjs` | — |

### Database

`sequelize/config.cjs` carries one entry per `NODE_ENV`: `development` on SQLite in `sequelize/storage/`, `live` and `staging` on MariaDB and MySQL, and `production` built from the variables above.

Development runs on a file, which is why `npm run db:refresh` can throw the database away and rebuild it in one step.

## API

Class members are written with the following notation.

| notation | members |
| :-- | :-- |
| `#instanceProperty` | instance property |
| `#instanceMethod()` | instance method |
| `#get:instanceGetter` | instance getter |
| `#set:instanceSetter` | instance setter |
| `.staticProperty` | static property |
| `.staticMethod()` | static method |
| `.get:staticGetter` | static getter |
| `.set:staticSetter` | static setter |

### `SessionClerk`

The single window onto a session's data — every read and write across the tables a session is made of. Callers depend on this class and never touch the tables themselves.

| member | description |
| :-- | :-- |
| `.create()` | Build a clerk over the access-token and refresh-token models it is given |
| `#saveSession()` | Start a session, and return its first token pair |
| `#findRefreshToken()` | Find the row a presented refresh token belongs to |
| `#rotateSession()` | Spend the presented refresh token and issue the next pair in the same series |
| `#revokeSession()` | Revoke a whole series, and report how much it removed |

The models are injected rather than imported, so both audiences share one implementation.

```js
const sessionClerk = SessionClerk.create({
  AccessTokenModel,
  RefreshTokenModel,
})

const savingResult = await sessionClerk.saveSession({
  userId,
  now: new Date(),
})

if (savingResult.hasError()) {
  // the transaction was rolled back
}

const credentialPair = savingResult.credentialPair
```

No write throws at its caller. Each opens its own transaction and reports the outcome as a result object — `#hasError()` on failure, the payload on success — so a throw inside rolls the transaction back and arrives as `#error`. Naming the error is left to the resolver.

`sequelize/models/` ships empty, so the two models are the application's own.

## How the session tokens work

A session is a pair of tokens, minted from `crypto.randomBytes()` rather than from `Math.random()` — the latter is a deterministic sequence, so observing enough tokens narrows down the ones that come next.

The two halves are stored differently. A refresh token is stored as a SHA-256 digest, because it is the long-lived half and a leaked dump would otherwise be a set of working sessions; the lookup hashes what arrives and matches on that. An access token is stored as it is, since it expires in minutes and hashing it would cost a digest on every single request.

The refresh token reaches the browser as an `HttpOnly` cookie, and each audience holds its own under its own name — `customer_refresh_token` and `admin_refresh_token` — scoped to that audience's endpoint path, so a customer's cookie is never even sent to the admin endpoint. The cookie names no domain, on purpose: naming one widens the cookie to every subdomain, and one XSS on any of them would reach it.

The cookie's configuration lives in `BaseAppGraphqlServerEngine`, and the cookie itself is written through `RefreshTokenExpressCookieClerk` — a resolver that manages a session builds one from its context, and every other resolver never touches the cookie.

## Contribution

Bug reports, feature requests, and code contributions are welcome.

Feel free to contact us through GitHub Issues.

```sh
git clone https://github.com/openreachtech/renchan-boilerplate.git
cd renchan-boilerplate
npm install
npm run lint
npm test
```

## License

This project is released under the Apache License 2.0.

For more details, please see [in the LICENSE file](./LICENSE).

## Developer

[Open Reach Tech Inc.](https://openreach.tech)

## Copyright

© 2026 Open Reach Tech Inc.
