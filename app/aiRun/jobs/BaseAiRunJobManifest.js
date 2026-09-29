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
 * **The run's id is the only field this service puts in a body.** Section 11 fixes the payload as
 * `{ aiRunId }` and states why: everything a worker needs is re-read from the database, so a job
 * body can never disagree with the record. A body that carried the run's subject, its request or
 * its keys would be a second copy of a row that is already written, and the two would drift the
 * first time a run is amended between the dispatch and the execution.
 *
 * **What this schema is, and what it is not.** It states the kind of a declared field, and the
 * framework checks it on the way in — `DispatcherRequest#isValidBody()`, in the process doing the
 * dispatching. It is not a check on the way out, and it is not a closed shape: the framework's
 * normalization keeps undeclared keys, an absent `aiRunId` satisfies the schema as written, and a
 * body can reach the queue from anywhere with the same Redis. So a body a worker is handed is not
 * a body this class has vouched for. What makes the sentence above true at the worker is
 * `BaseAiRunJobWorker#executeJob()`, which asks this schema's own `isValid()` and then rebuilds
 * the body out of the fields declared here before the concrete job's work sees it.
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
   * get: the schema the dispatched body is held to.
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
