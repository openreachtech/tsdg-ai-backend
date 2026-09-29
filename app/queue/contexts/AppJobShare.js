import {
  BaseJobShare,
} from '@openreachtech/renchan-job-bullmq'

/**
 * App job share — the per-process bag every job in this repository is handed.
 *
 * Built once when the engine is created, and shared by every job that process runs. The base
 * already holds the three things a job reaches for — the process clerk, the environment facade
 * and the console logger — so nothing is added here yet.
 *
 * **Why the file exists at all rather than naming the base directly.** `AppJobEngine.ShareCtor`
 * has to answer with something, and answering with the framework's own class would mean the first
 * per-process dependency this service acquires is a change of class rather than a change of
 * member — every reference re-pointed, in a repository where `#run-delivery` and
 * `#asset-media-extraction` are both still to come. The empty subclass is the seam, and it is the
 * same one `AppRestfulApiShare` already is on the request side.
 */
export default class AppJobShare extends BaseJobShare {
  // noop
}
