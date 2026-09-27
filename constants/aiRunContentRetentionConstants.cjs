'use strict'

/*
 * How long a run's content is kept, from the non-functional section of specs/1.0.0: "content 30
 * days; the decision trace 730 days. Two separate settings, never one".
 *
 * **What content is.** The same section names four things and calls all four content: the asset's
 * field values and the media URLs, which arrive inside the request body; the suggested values in
 * the result body; the raw model output; and the subject label. In the schema those are
 * `ai_runs.request_body`, `ai_runs.result_body`, `ai_model_calls.response_body` and
 * `ai_runs.subject_label` - and nothing else. The media URL is not a column anywhere: it reaches
 * this service inside the request body and is never copied out of it, which is why `ai_run_media`
 * records a key, a kind and a size and no address.
 *
 * **Why this is a file of its own, holding one figure.** The requirement says "two separate
 * settings, never one", so the trace's figure lives in `aiRunTraceRetentionConstants.cjs` and
 * there is no module that answers for both. A worker reaching for "the retention setting" finds
 * nothing of the sort; it has to name which of the two clocks it means, and a change to one
 * cannot reach the other by editing a shared key. The third use case of #retention - "ORT changes
 * how long content is kept without changing how long the decision trace is kept" - is that
 * separation, and a single hash with two keys would have made combining them the easier of the
 * two ways to write it.
 *
 * **Why 30 is a constant rather than an environment key.** For the reason the media limits and the
 * rate limit are: the figure is a property of the product's promise to the client, not of a
 * deployment, and a development machine purging on a different clock would make the purge
 * untestable where it is written. Changing it is a deployment, which the specification never says
 * it must not be - #provider-layer says that of prompts, deliberately and about prompts.
 *
 * **What the clock runs from.** `ai_runs.accepted_at` - the instant the content arrived at this
 * service. Not `finished_at`, which is null for a run that never finished and would leave that
 * run's content unreachable by any purge; and not `created_at`, which is the row's own
 * bookkeeping rather than a fact about the run.
 */
module.exports = {
  AI_RUN_CONTENT_RETENTION: {
    DAY_COUNT: 30,
  },
}
