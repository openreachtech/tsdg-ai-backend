export {}

/*
 * The body of `POST /v1/ai-runs/:runKey/cancellations`, as
 * `.hora/contracts/1.0.0/client-api.md` fixes it.
 *
 * **One field, and the contract's sentence is the whole of the reason.** It states the body as
 * "the run's `statusName` after the request, which is its terminal state where it had already
 * reached one" — so a client reading this body learns one thing, and it is the one thing a
 * cancellation can honestly report. Anything else a shape like this might be tempted to carry
 * would be a claim this route cannot make: the instant the cancellation was asked for is this
 * service's measurement and not the caller's (specs/1.0.0, §15, third use case), and the instant
 * it took effect does not exist yet when the request is answered, because a run stops at a step
 * boundary rather than at the moment somebody asks.
 *
 * **It is deliberately not a subset of `AiRunResponse`.** The two answer different questions —
 * this one says what the run is now, and `GET /v1/ai-runs/:runKey` says everything the run holds
 * — and a shared ancestor would carry every field the run body grows onto a surface whose whole
 * point is that it says one thing. The same argument `aiRunsGet.d.ts` records for keeping a list
 * row apart from the run body applies here for the same reason, and the cost of restating four
 * words is lower than the cost of the two surfaces moving together.
 *
 * **`statusName` is not narrowed to the states a cancellation can leave behind.** All five are
 * here, because a run that had already succeeded or failed answers with the state it reached, a
 * run already canceled answers `canceled`, and a run still queued or running answers where it
 * still is — the request is recorded and the run stops later. Narrowing the union would say this
 * route answers fewer states than it does.
 */
declare global {
  namespace restfulapi.v1 {
    interface AiRunCancellationResponse {
      statusName: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
    }
  }
}
