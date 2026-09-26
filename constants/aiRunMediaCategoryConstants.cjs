'use strict'

const {
  AI_RUN_MEDIA_HANDLING,
} = require('./aiRunMediaHandlingConstants.cjs')

/*
 * Rows of the `ai_run_media_categories` master table.
 *
 * A media category names the kind of file a request says it is handing over. `NAME` is the system
 * key the application binds to and the value the contract carries as `mediaCategoryName`;
 * `DISPLAY_NAME` is free to be reworded without touching logic.
 *
 * All three kinds are seeded, and only `IMAGE` is read this version. The other two are here so
 * that a request naming one of them resolves to a row and is answered by name rather than falling
 * through as a value nobody recognizes. `HANDLING_NAME` is what carries that answer, and it names
 * one of the three endings `AI_RUN_MEDIA_HANDLING` declares: image is handled, video is refused
 * under `MEDIA_UNSUPPORTED` naming the kind, and audio is ignored.
 *
 * **It replaced an `IS_ACTIVE` boolean, and the replacement is the point.** A flag answers two
 * ways and §20 asks for three, so video and audio — both false under the flag — were indistinct
 * to everything that read it. The property the flag was chosen for survives: turning video on
 * later is a value changed on an existing row, and a fourth kind is a new row, neither of them a
 * change to a column. What is new is that the row now states its own ending instead of leaving it
 * to be inferred from which kind it happens to be.
 *
 * The `DISPLAY_ORDER` values step by ten so a later kind can be slotted between two existing ones
 * without renumbering.
 */
module.exports = {
  AI_RUN_MEDIA_CATEGORY: {
    IMAGE: {
      ID: 1,
      NAME: 'image',
      DISPLAY_NAME: 'Image',
      DISPLAY_ORDER: 10,
      HANDLING_NAME: AI_RUN_MEDIA_HANDLING.HANDLE,
    },
    VIDEO: {
      ID: 2,
      NAME: 'video',
      DISPLAY_NAME: 'Video',
      DISPLAY_ORDER: 20,
      HANDLING_NAME: AI_RUN_MEDIA_HANDLING.REFUSE,
    },
    AUDIO: {
      ID: 3,
      NAME: 'audio',
      DISPLAY_NAME: 'Audio',
      DISPLAY_ORDER: 30,
      HANDLING_NAME: AI_RUN_MEDIA_HANDLING.IGNORE,
    },
  },
}
