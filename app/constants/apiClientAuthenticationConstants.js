/*
 * Reason codes naming why one request's authentication was refused.
 *
 * These are written to the log and nowhere else. A caller is answered `401` or `403` and is told
 * no more than that on purpose — a refusal that named which of the four it was would tell whoever
 * is probing whether a client key exists, whether a clock is the problem, or whether only the
 * signature is wrong. The operator reading the log needs exactly that distinction, and is the only
 * one who gets it.
 *
 * `INACTIVE_CLIENT` is the one that is answered `403`; the other three are all `401`, because each
 * of them means no client was resolved at all.
 *
 * **Every code here names a refusal a caller had to present a client key to reach.** A request
 * that presents no `x-ort-client-id` at all is refused `401` too, and carries no code, because it
 * is not logged: that path takes no credential, so a line per such request is a disk write anyone
 * can drive without limit, and the line would name no client and give the same reason every time.
 * Nothing is lost by leaving it out, and a code sitting here for it would invite the line back.
 *
 * What may be logged beside a reason code is fixed by section 7 of the spec: ids, latency, token
 * counts, reason codes and error codes. A client secret is never logged in either its live or its
 * rotating form, no request body reaches a log line, and the client key a request presented is not
 * written either — an unresolved one is a string somebody else chose, and the resolved one is
 * already named by the API client id.
 */
const API_CLIENT_AUTHENTICATION_REFUSAL_REASON = {
  UNKNOWN_CLIENT_KEY: 'UNKNOWN_CLIENT_KEY',
  STALE_TIMESTAMP: 'STALE_TIMESTAMP',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  INACTIVE_CLIENT: 'INACTIVE_CLIENT',
}

export default {
  API_CLIENT_AUTHENTICATION_REFUSAL_REASON,
}
