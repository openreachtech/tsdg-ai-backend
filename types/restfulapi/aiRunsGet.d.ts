export {}

/*
 * The body of `GET /v1/ai-runs`, as `.hora/contracts/1.0.0/client-api.md` fixes it.
 *
 * It is a different shape from `AiRunResponse` on purpose, and the difference is what a row is
 * for. Reading one run back answers with everything that run holds, content included; reading a
 * page of them answers with what a client needs to decide which run to read next — the subject,
 * the kind, the state, how far it got, how long it has taken and what it has spent. No content
 * of any kind crosses this surface: no `result`, no `requestBody`, no `rejections`. A page of a
 * hundred runs carrying their stored result bodies would be megabytes answering a question
 * nobody asked.
 *
 * The same reason keeps the interfaces separate rather than one extending the other. The two
 * bodies share five field names and nothing about their futures: the run body grows when a run
 * records something new, the row grows when a list needs a new column to sort or scan by, and a
 * shared ancestor would carry each change into the other surface unasked.
 */
declare global {
  namespace restfulapi.v1 {
    interface AiRunsResponse {
      runs: Array<AiRunRowResponse>
      /*
       * How to ask for the page after this one, and null when there is none. A client walks
       * until it reads null; it never has to compare a page's length against the limit it asked
       * for, and a page that came back full is not by itself a claim that more exist.
       */
      nextCursor: string | null
    }

    /*
     * One run, as a list reads it. Every field is a fact about the run itself — nothing here is
     * derived from what a model returned, and nothing is the caller's own content beyond the
     * three strings it supplied and this service never interprets.
     */
    interface AiRunRowResponse {
      runKey: string
      /*
       * The `name` of the run's category master row. One value this version,
       * `asset-media-extraction`; each later AI service adds a row rather than a type.
       */
      runCategoryName: string
      /* Exactly as the caller supplied it. Never trimmed, never reworded. */
      subjectLabel: string
      correlationId: string
      externalRef: string
      statusName: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
      /*
       * The furthest step this run has finished, so a run in progress says how far it got rather
       * than only that it is running. Null while no step has finished — a run still queued, and
       * a run whose first step is still open.
       */
      lastCompletedStep: AiRunLastCompletedStepResponse | null
      /*
       * Seconds from the instant the run was accepted to the instant it ended, or to the instant
       * this request was stamped with while it has not ended.
       *
       * It is anchored on `acceptedAt` and not on `startedAt` because every run has been accepted
       * and not every run has started: anchored on the start, a queued run would answer null for
       * the one field a client waiting on it actually wants. It also measures the wait the caller
       * is experiencing, which is what "how long has it taken" means to the caller — the time a
       * worker spent is a different question, and the step trace is where it is answered.
       */
      elapsedSeconds: number
      /*
       * What the run has spent so far. A run that has called no model reports zero rather than
       * null: no call is a fact about the run, where null would say the figure is unknown.
       *
       * The two token counts travel separately and are never summed here. Every provider prices
       * what was sent differently from what came back, so a caller adding them is a caller that
       * has chosen to — and one reading them apart can still work out what a run cost, where one
       * handed a single total could not take it apart again.
       */
      modelCallCount: number
      inputTokenCount: number
      outputTokenCount: number
      acceptedAt: Date
    }

    /*
     * The furthest step a run has finished: what it was called, and where it sits in its run's
     * own order. It carries neither what the step dropped nor how long it took — a list says how
     * far a run got, and the step trace of `GET /v1/ai-runs/:runKey?expand=steps` says the rest.
     */
    interface AiRunLastCompletedStepResponse {
      stepName: string
      stepIndex: number
    }

    /*
     * The one input `GET /v1/ai-runs` is judged on, after the adapter has read it out of the
     * query string. Every field is null when the caller did not send it; the two counts have
     * already been read as numbers, because a query string carries only text and the adapter is
     * the one class that knows it.
     */
    interface AiRunsQueryInput {
      statusName: unknown
      runCategoryName: unknown
      correlationId: unknown
      stalledForSeconds: number | null
      limit: number | null
      cursor: unknown
    }
  }
}
