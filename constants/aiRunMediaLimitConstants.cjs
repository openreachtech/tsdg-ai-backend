'use strict'

/*
 * The two media limits a request is held to, from the non-functional section of specs/1.0.0:
 * "10 MB per photo, and at most 12 photos in one request - matching the client's own upload limit,
 * so nothing is refused twice for different reasons".
 *
 * They are values checked in code and not a column anywhere. `ai_run_media.byte_size` records what
 * the caller declared a file weighs; nothing in the schema bounds it, because a row over the cap is
 * exactly the row this service has to keep in order to say why the run failed. The cap is therefore
 * a rule applied before anything is fetched or sent, and this module is where it is written once.
 *
 * They are constants rather than environment keys because the figures are the client's stated
 * upload limit rather than a property of a deployment: a development machine refusing a different
 * size from a live one would refuse a file the client's own uploader accepted, which is the
 * double refusal the requirement exists to prevent.
 *
 * **`MAXIMUM_BYTE_SIZE` reads "10 MB" as 10 * 1024 * 1024.** Both readings of the unit are
 * defensible and the spec states only "10 MB"; the binary one is taken because an upload limit is
 * customarily stated that way, and because it is the larger of the two - a file between the two
 * readings is accepted here and accepted by the client's uploader, where the decimal reading would
 * refuse a file the client had already taken. See the media-fetch task record.
 */
module.exports = {
  AI_RUN_MEDIA_LIMIT: {
    MAXIMUM_BYTE_SIZE: 10485760,
    MAXIMUM_MEDIA_COUNT: 12,
  },
}
