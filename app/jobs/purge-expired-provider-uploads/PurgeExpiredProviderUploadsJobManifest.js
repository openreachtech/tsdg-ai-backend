import BaseAiRunPurgeJobManifest from '../../aiRunRetention/jobs/BaseAiRunPurgeJobManifest.js'

/*
 * The queue this purge is taken from.
 *
 * §19 names it: the provider-upload purge's row of the background-jobs table gives the queue as
 * `purge-expired-provider-uploads`. The directory holding this file carries the same name, which
 * is what the framework's own convention asks — one queue is one job directory — and it is the
 * name the daemon logs on the line saying it is listening.
 */
const JOB_NAME = 'purge-expired-provider-uploads'

/**
 * The manifest of the job that asks each provider to delete the files it was handed.
 *
 * It names its queue and nothing else. The empty body schema, and the argument for why a purge
 * carries no payload and in particular carries no instant, is `BaseAiRunPurgeJobManifest`'s — and
 * §19 gives this row's payload as **none** just as it does the other two.
 *
 * **Why this queue is neither of the other two purges'.** The other two write to this service's own
 * database; this one makes an outbound call per row and a whole sweep is upwards of an hour of
 * waiting on somebody else's HTTP. Sharing a queue would let that hour delay the nightly content
 * purge — the one with a retention promise attached to it — and would make the two impossible to
 * scale apart. A vendor that is slow or unwell backs up its own queue and nothing else's.
 */
export default class PurgeExpiredProviderUploadsJobManifest extends BaseAiRunPurgeJobManifest {
  /**
   * get: the name of the queue this job is taken from.
   *
   * @override
   * @returns {string} - The queue name.
   */
  static get jobName () {
    return JOB_NAME
  }
}
