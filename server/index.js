import activate from '../sequelize/_.js'

import {
  GraphqlServerBuilder,
  RestfulApiServerBuilder,
} from '@openreachtech/renchan'

import CustomerGraphqlServerEngine from './graphql/CustomerGraphqlServerEngine.js'
import AdminGraphqlServerEngine from './graphql/AdminGraphqlServerEngine.js'

import AppRestfulApiServerEngine from './restfulapi/AppRestfulApiServerEngine.js'

/*
 * Bind to loopback only: the app servers sit behind a reverse proxy (see docs/reverse-proxy), so
 * they must not accept connections from other network interfaces.
 */
const LOOPBACK_HOST = '127.0.0.1'

await activate()

GraphqlServerBuilder.createAsync({
  Engine: CustomerGraphqlServerEngine,
})
  .then(builder =>
    builder.buildHttpServer()
      .listen(3900, LOOPBACK_HOST)
  )

GraphqlServerBuilder.createAsync({
  Engine: AdminGraphqlServerEngine,
})
  .then(builder =>
    builder.buildHttpServer()
      .listen(5800, LOOPBACK_HOST)
  )

/*
 * The RESTful API server is awaited rather than chained, because one thing it builds outlives the
 * request that first reaches for it and has to be closed by hand.
 *
 * A run accepted here is enqueued after its transaction commits, through a job dispatcher holding
 * an open Redis connection. That dispatcher is built once per process and deliberately not closed
 * after a dispatch — closing it would leave the next accepted run enqueueing against a shut queue
 * — so nothing else in the process will ever close it. The sink attached below is what does, on
 * SIGINT and SIGTERM, before ending the process.
 */
const restfulApiServerBuilder = await RestfulApiServerBuilder.createAsync({
  Engine: AppRestfulApiServerEngine,
})

restfulApiServerBuilder.buildHttpServer()
  .listen(8001, LOOPBACK_HOST)

restfulApiServerBuilder.engine
  .share
  .jobDispatcherProvider
  .attachShutdownSink()
