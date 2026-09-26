'use strict'

/*
 * What this version does with a medium, held in `ai_run_media_categories.handling_name`.
 *
 * Three endings, because §20 of specs/1.0.0 asks for three. A kind this version reads is
 * `HANDLE`; a kind it refuses the whole run over — "a video URL among the media is refused with
 * the unsupported reason code, rather than being silently skipped" — is `REFUSE`; and a kind it
 * drops from the request and says nothing about — "audio among the media is ignored" — is
 * `IGNORE`. Video and audio therefore cannot share one answer, which is exactly what the boolean
 * they used to share gave them.
 *
 * These are values of a column and not rows of a master table, for the same reason
 * `AI_RUN_FAILURE_REASON_CODE` is not one either: nothing displays them, so a row carrying a name
 * nobody shows would only be a second place for the vocabulary to drift. The stronger reason is
 * that a handling is not data the way a kind is. A fourth kind is a row because the service
 * already knows all three things it might do with it; a fourth handling is a branch of behaviour
 * that does not exist until code implements it, so seeding one would promise an ending nothing
 * could carry out.
 *
 * The key and the value are the same word, cased for where each is read: the key is how code
 * names the handling, and the value is what the column and the constant hash of every media kind
 * carry. Reading one through this module is what makes a misspelling fail at import rather than
 * at a reviewer's eye.
 */
module.exports = {
  AI_RUN_MEDIA_HANDLING: {
    HANDLE: 'handle',
    REFUSE: 'refuse',
    IGNORE: 'ignore',
  },
}
