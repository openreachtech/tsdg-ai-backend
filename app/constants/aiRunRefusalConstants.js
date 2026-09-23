/*
 * Envelopes of every refusal a run-creating request can be answered with, before a run exists.
 *
 * A run that was accepted and later failed is not here: that is a `200` carrying a failure reason
 * code, which the run record owns. These are the answers given instead of a run.
 *
 * The statuses are the ones `.hora/contracts/1.0.0/client-api.md` fixes. `422` says a required
 * field is missing or holds a value the schema does not accept; `409` says an idempotency key that
 * already named a run arrived again under a different body, and the run it named is unchanged.
 * `401` and `403` are not here — they are the engine's, because they are decided before a renderer
 * is reached.
 *
 * The idempotency key carries two of these and every other field one, because the contract states
 * two `422` lines for that header and one for everything else: it may not have been sent at all,
 * and it may have been sent carrying a value the schema does not accept. Both are `422`, and a
 * caller reading the message can tell which it was.
 *
 * They sit in a module of their own so the renderer that spreads them stays the size of the thing
 * it does, and so a second AI service's renderer answers refusals in the same words as the first.
 */
const AI_RUN_REFUSAL_ENVELOPE = {
  MissingIdempotencyKey: {
    statusCode: 422,
    errorMessage: 'Idempotency-Key header is required',
  },
  InvalidIdempotencyKey: {
    statusCode: 422,
    errorMessage: 'Invalid Idempotency-Key header',
  },
  InvalidRequestBody: {
    statusCode: 422,
    errorMessage: 'Invalid request body',
  },
  InvalidExternalRef: {
    statusCode: 422,
    errorMessage: 'Invalid externalRef',
  },
  InvalidSubjectLabel: {
    statusCode: 422,
    errorMessage: 'Invalid subjectLabel',
  },
  InvalidCorrelationId: {
    statusCode: 422,
    errorMessage: 'Invalid correlationId',
  },
  InvalidCallbackUrl: {
    statusCode: 422,
    errorMessage: 'Invalid callbackUrl',
  },
  RequestBodyMismatch: {
    statusCode: 409,
    errorMessage: 'Idempotency-Key was already used with a different request body',
  },
}

export default {
  AI_RUN_REFUSAL_ENVELOPE,
}
