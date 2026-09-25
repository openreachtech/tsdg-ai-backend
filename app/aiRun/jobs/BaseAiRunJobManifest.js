import {
  BaseJobManifest,
} from '@openreachtech/renchan-job-bullmq'

import {
  ScalarHash,
} from '@openreachtech/mentsu-schema'

const {
  Integer,
} = ScalarHash

/**
 * The body every AI run job is dispatched with.
 *
 * **The body carries the run's id and nothing else.** Section 11 fixes the payload as
 * `{ aiRunId }` and states why: everything a worker needs is re-read from the database, so a job
 * body can never disagree with the record. A body that carried the run's subject, its request or
 * its keys would be a second copy of a row that is already written, and the two would drift the
 * first time a run is amended between the dispatch and the execution.
 *
 * **The queue name is left unstated here, deliberately.** `jobName` stays the abstract getter the
 * framework declares, because one queue is one job directory and §11 gives each service its own
 * queue so the heaviest of them can be scaled alone. A concrete job names its queue; this class
 * names only what every one of them carries.
 *
 * Being abstract is also why this file sits outside the daemon's `workersPath`: the daemon boots
 * every worker it finds there, and a manifest with no queue name has no queue to bind to.
 *
 * @abstract
 */
export default class BaseAiRunJobManifest extends BaseJobManifest {
  /**
   * get: the schema the dispatched body is validated against.
   *
   * @override
   * @returns {Record<string, *>} - The body schema.
   */
  static get bodySchema () {
    return {
      aiRunId: Integer,
    }
  }
}
