'use strict'

/*
 * How long a copy at a provider may sit there when the provider never said when it goes
 * (specs/1.0.0, #retention, "purge expired provider uploads").
 *
 * **Why a figure is needed here at all, when the other two clocks are the whole of retention.**
 * The purge of provider uploads is the one retention job whose clock is mostly not ours:
 * `provider_uploaded_files.expires_at` holds the instant the vendor itself stated, and a row is
 * ripe once that instant has passed. Nothing has to be decided for those rows. The column is
 * nullable, though, and it is null in two cases - a vendor that states no expiry, and a vendor
 * whose stated timestamp this service could not read (`BaseGeminiAiModelProcessor` answers null
 * rather than an invalid date, and says why). Those rows have no vendor clock at all, so without a
 * figure of ours they would never be ripe, never be asked about, and the copy would be held at the
 * far end for as long as the vendor cares to hold it - which is the one outcome the job exists to
 * prevent.
 *
 * **Why it is a day, and why it may not be much less.** A copy is handed over inside a run's media
 * step and is read by the model call that follows it, and section 7 caps a whole run at 300
 * seconds. So a copy is needed for at most five minutes after it is uploaded. A day is 288 times
 * that, which leaves room for a run that was retried, a job redelivered by the queue, and a sweep
 * that ran while a run was still going - none of which this table can see, because it records what
 * left rather than what is still being read. Anything under an hour would put the job in a
 * position to delete a copy out from under a live request, and the failure would land on the run
 * rather than here.
 *
 * **Why it may not be much more, either.** A vendor that stated no expiry will not remove the copy
 * on its own, so every day added here is a day of personal data held by somebody else past the
 * point this service had any use for it. One day, against a daily schedule, means such a copy is
 * asked about between one and two days after it left.
 *
 * **What this figure is not.** It is not a retention promise and it moves no horizon a client was
 * told about: section 7's two settings are content and the decision trace, and they live in
 * `aiRunContentRetentionConstants.cjs` and `aiRunTraceRetentionConstants.cjs` where a reader
 * reaching for "how long is it kept" will find them. This says only how long to wait before asking
 * a vendor that told us nothing. It is a constant rather than an environment key for the reason
 * those two are: a development machine waiting a different length of time would make the wait
 * untestable where it is written.
 */
module.exports = {
  PROVIDER_UPLOADED_FILE_RETENTION: {
    UNSTATED_EXPIRY_DAY_COUNT: 1,
  },
}
