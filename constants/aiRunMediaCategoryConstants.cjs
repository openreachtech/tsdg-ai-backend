'use strict'

/*
 * Rows of the `ai_run_media_categories` master table.
 *
 * A media category names the kind of file a request says it is handing over. `NAME` is the system
 * key the application binds to and the value the contract carries as `mediaCategoryName`;
 * `DISPLAY_NAME` is free to be reworded without touching logic.
 *
 * All three kinds are seeded, and only `IMAGE` is handled this version. The other two are here so
 * that a request naming one of them resolves to a row and is refused by name — `MEDIA_UNSUPPORTED`,
 * naming the kind — rather than falling through as a value nobody recognizes. `IS_ACTIVE` is what
 * carries that distinction: it says whether this version handles the kind, so turning video on
 * later is a flag flipped on an existing row and adding a fourth kind is a new row. Neither is a
 * change to a column.
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
      IS_ACTIVE: true,
    },
    VIDEO: {
      ID: 2,
      NAME: 'video',
      DISPLAY_NAME: 'Video',
      DISPLAY_ORDER: 20,
      IS_ACTIVE: false,
    },
    AUDIO: {
      ID: 3,
      NAME: 'audio',
      DISPLAY_NAME: 'Audio',
      DISPLAY_ORDER: 30,
      IS_ACTIVE: false,
    },
  },
}
