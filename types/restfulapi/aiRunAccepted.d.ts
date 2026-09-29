export {}

/*
 * The body every run-creating POST answers with, as `.hora/contracts/1.0.0/client-api.md` fixes
 * it: `runKey`, `runCategoryName`, `statusName`, `acceptedAt`, and nothing else.
 *
 * It sits in a file of its own rather than in the one service's, because the class that builds it
 * is `BaseAiRunPostRenderer` and not any one renderer under it. One route answers with it this
 * version; the second AI service to be added answers with the same body, and reaching into the
 * first service's declaration for it would make that service's file the home of something it does
 * not own.
 */
declare global {
  namespace restfulapi.v1 {
    interface AiRunAcceptedResponse {
      runKey: string
      /*
       * The `name` of the run's category master row. One value this version,
       * `asset-media-extraction`; each later AI service adds a row rather than a type.
       */
      runCategoryName: string
      /*
       * `queued` on the request that created the run, which is every request that is not a
       * repeat. A repeat of the same idempotency key under the same body answers the run created
       * the first time and carries that run's status as it now stands, so the field is the same
       * five-value set `AiRunResponse` carries rather than the one literal.
       */
      statusName: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
      acceptedAt: Date
    }
  }
}
