'use strict'

/*
 * The headers a signed request carries, in either direction.
 *
 * `.hora/contracts/1.0.0/client-api.md` fixes the first three for every route this service
 * answers, and fixes the callback as "signed as a request is, plus the run key in a header". So
 * the same three names travel outbound on the terminal callback, and a fourth goes with them.
 *
 * **`RUN_KEY` is the one this version adds, and the contract names no header for it.** The
 * contract says a callback "additionally carries the run key in a header" and stops there, so the
 * spelling is a reading rather than something it states: `x-ort-run-key`, matching the three
 * beside it so a client reads one prefix and one casing across the whole protocol. Recorded in
 * this feature's report rather than settled silently.
 *
 * **Why the names live here rather than beside the one class that sends them.** They are a
 * protocol fact shared by the code that verifies an inbound request and the code that signs an
 * outbound one, and two literals free to drift apart would let a client be verified under one
 * spelling and called back under another, with nothing anywhere saying so.
 *
 * `server/restfulapi/contexts/AppRestfulApiContext.js` still declares its own three literals, and
 * should be changed to read them from here. That file belongs to `#run-contract` and is not this
 * feature's to edit, so the change is reported rather than made.
 *
 * Every name is lower case because a header name is case-insensitive on the wire and Node's own
 * `Headers` lower-cases what it is given — so the lower-case spelling is the one a reader will
 * see on both sides of a comparison.
 */
module.exports = {
  SIGNED_REQUEST_HEADER_NAME: {
    CLIENT_ID: 'x-ort-client-id',
    TIMESTAMP: 'x-ort-timestamp',
    SIGNATURE: 'x-ort-signature',
    RUN_KEY: 'x-ort-run-key',
  },
}
