import activate from '../sequelize/_.js'

import {
  RestfulApiServerBuilder,
} from '@openreachtech/renchan'

import AppRestfulApiServerEngine from './restfulapi/AppRestfulApiServerEngine.js'

import {
  env,
} from '../app/globals/_.js'

/*
 * Bind every interface of the container, and let the platform be the boundary.
 *
 * **This used to bind `127.0.0.1`, and the reason it no longer does is not that the exposure rule
 * relaxed.** Section 7 asks that *only the API server accepts a connection*, and a container whose
 * only route in is the platform's own front end satisfies that whether the socket inside it is
 * bound to one interface or all of them. What a loopback bind does satisfy is a reverse proxy
 * sharing the host; under a platform that reaches the container over the network instead, the same
 * bind means nothing reaches it at all.
 *
 * So the boundary moved rather than loosened, and it moved somewhere the deployment states it:
 * `docs/deployment/production.md` is where the ingress setting lives now. A deployment that puts
 * this container somewhere it can be addressed directly has removed the boundary, and no line here
 * can put it back.
 *
 * **The port is read rather than fixed**, because the platform assigns it and a fixed one is simply
 * ignored. The default is the port this service has always answered on, so a local run and a
 * container run stay the same command.
 */
const LISTEN_HOST = '0.0.0.0'
const DEFAULT_PORT = 8001

/*
 * One server, which is the whole of this product's API.
 *
 * Two GraphQL servers stood here until 1.0.0's acceptance sweep, and between them they exposed one
 * operation — `healthCheck` — on a guest allow-list that section 7 says does not exist. They also
 * carried a wildcard CORS policy, a static mount answering unauthenticated at the root, an upload
 * middleware for a product that accepts no uploads, an unauthenticated WebSocket transport and an
 * interactive console served outside production. Removing them closed all of it at once, and left
 * the one port a platform can route to.
 */
await activate()

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

const listenPort = Number(env.PORT ?? DEFAULT_PORT)

restfulApiServerBuilder.buildHttpServer()
  .listen(listenPort, LISTEN_HOST)

restfulApiServerBuilder.engine
  .share
  .jobDispatcherProvider
  .attachShutdownSink()
