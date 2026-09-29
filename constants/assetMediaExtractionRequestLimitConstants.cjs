'use strict'

/*
 * The two limits an asset-media-extraction request's own two unbounded fields are held to.
 *
 * Every other field of that request is already bounded somewhere: the common five by the widths of
 * the columns that store them, the media by `aiRunMediaLimitConstants.cjs`. These two were bounded
 * by nothing at all, and both are read by work that grows with them - the field schema once per
 * field, the signature once per run - so a single accepted request could buy an unbounded amount of
 * synchronous work on the queue that carries it out. The run time limit of specs/1.0.0 §7 cannot
 * end that work: it is a deadline raced against the run, and a deadline cannot interrupt a
 * synchronous loop. So the bound has to be at the door, where a request is still a request.
 *
 * They are constants rather than environment keys for the reason the media limits are: the figures
 * are properties of what the product is for rather than of a deployment, and a development machine
 * refusing a different shape from a live one would make the refusal untestable where it is written.
 *
 * **`MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT` is 200, and here is where 200 comes from.** The field schema
 * is, in the words of specs/1.0.0 §3, "the list of fields the client system sends with a request,
 * saying what may be suggested and what each field accepts" - the fields of one asset, in one
 * request, which §7's volume row calls "one deliberate press by an asset owner". The same section's
 * availability row says what happens when this service is down: "the asset owner fills the fields
 * in by hand instead". So the schema is exactly a form one person fills in by hand for one asset,
 * and §20's result returns "one entry per settled field" onto one screen that person then reads. A
 * hand-filled form of more than two hundred fields is not the form this service stands in for. The
 * worked request in the specification's own annex carries four, so the bound sits roughly fifty
 * times above the real figure and no schema this version foresees is refused by it.
 *
 * **`MAXIMUM_MEDIA_SIGNATURE_LENGTH` is 2304, and here is where 2304 comes from.** The contract
 * says of the field only that it is "derived from the media, and echoed back", and §7's media
 * limits row bounds that media at "at most 12 photos in one request". A value derived from at most
 * twelve photographs is at most twelve of their keys and the separators between them. What one
 * caller-supplied key is worth here is already settled elsewhere in this service: `request_key`,
 * `external_ref` and `correlation_id` are each `STRING(191)`, and `AiRunCommonFieldsInputValidator`
 * holds a caller to that 191. Twelve of those plus a separator apiece is 12 * (191 + 1) = 2304. The
 * annex's worked request signs `nha-pho|9051|9052` - seventeen characters for two photographs - so
 * this too sits far above anything a caller sends.
 *
 * **Both are ceilings, not shapes.** Neither says the field must be sent: a request carrying no
 * field schema and no signature is a request this service already answers, and bounding a field is
 * not the place to start requiring one.
 */
module.exports = {
  ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT: {
    MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT: 200,
    MAXIMUM_MEDIA_SIGNATURE_LENGTH: 2304,
  },
}
