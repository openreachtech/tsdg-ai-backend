import {
  BaseRestfulApiShare,
} from '@openreachtech/renchan'

import JobDispatcherProvider from '../../../app/queue/JobDispatcherProvider.js'

/**
 * App RESTful API share — the per-process bag every renderer of this server is handed.
 *
 * Built once when the engine is created (`BaseRestfulApiServerEngine.createAsync()` awaits
 * `Share.createAsync()` and holds the one instance), and reached from a renderer as
 * `context.share`. That per-process lifetime is the whole reason the job dispatcher provider
 * lives here: a job dispatcher holds a Redis connection that must outlive the request that opened
 * it and be closed once when the process stops, so it can belong to nothing that is built per
 * request.
 *
 * The provider itself opens nothing on construction — it builds a dispatcher the first time one is
 * asked for — so a process that never accepts a run never connects to Redis at all.
 */
export default class AppRestfulApiShare extends BaseRestfulApiShare {
  /**
   * Constructor.
   *
   * @param {AppRestfulApiShareParams} params - Parameters.
   */
  constructor ({
    env,
    jobDispatcherProvider,
  }) {
    super({
      env,
    })

    this.jobDispatcherProvider = jobDispatcherProvider
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AppRestfulApiShare ? X : never} T, X
   * @override
   * @param {AppRestfulApiShareFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    env = this.generateEnv(),
    jobDispatcherProvider = this.createJobDispatcherProvider(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        env,
        jobDispatcherProvider,
      })
    )
  }

  /**
   * get: JobDispatcherProvider class — a seam so tests can substitute it.
   *
   * @returns {typeof JobDispatcherProvider} The class.
   */
  static get JobDispatcherProviderCtor () {
    return JobDispatcherProvider
  }

  /**
   * Create the provider holding this process's job dispatchers.
   *
   * @returns {JobDispatcherProvider} The provider.
   */
  static createJobDispatcherProvider () {
    return this.JobDispatcherProviderCtor.create()
  }
}

/**
 * @typedef {{
 *   env: renchan.RenchanEnv
 *   jobDispatcherProvider: JobDispatcherProvider
 * }} AppRestfulApiShareParams
 */

/**
 * @typedef {Partial<AppRestfulApiShareParams>} AppRestfulApiShareFactoryParams
 */
