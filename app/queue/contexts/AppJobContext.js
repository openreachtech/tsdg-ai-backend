import {
  BaseJobContext,
} from '@openreachtech/renchan-job-bullmq'

/**
 * App job context — the per-job bag handed to `executeJob()`.
 *
 * Built fresh for each execution, so `#executedAt` names the moment that one job started and two
 * runs of the same job never share it. The base already reaches the engine, the share, the
 * environment and the console logger through it, so nothing is added here yet.
 *
 * **What belongs here later.** The dependency resolution a job needs per execution — a loader, a
 * recorder, a model processor — so a worker stays a description of the work rather than a place
 * where collaborators are assembled. It is the empty seam for that, for the same reason
 * `AppJobShare` is one.
 */
export default class AppJobContext extends BaseJobContext {
  // noop
}
