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
 * `server/restfulapi/contexts/AppRestfulApiContext.js` reads the inbound three from here, through
 * the ESM wrapper at `app/constants/signedRequestHeaderConstants.js`, and declares no literal of
 * its own. So each name is spelled once in this repository, and a reader comparing the inbound
 * side with the outbound one is comparing a constant with itself.
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
