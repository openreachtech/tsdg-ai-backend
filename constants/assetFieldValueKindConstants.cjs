'use strict'

/*
 * The kinds of value a field of a caller's own schema may carry, as the request spells them.
 *
 * **This is the caller's vocabulary, not this service's.** `valueKind` describes the shape of a
 * value the caller's schema defines and has no master table behind it (specs/1.0.0, §20), so these
 * are the words this service knows how to read rather than a set a caller is held to. A kind that
 * is not one of these is dropped by step 1 and is never a refusal.
 *
 * All three are suggestible from a photograph, which is why step 1 keeps exactly this set: text and
 * a select are read off what is written or shown, and a number is read or estimated. A kind that
 * cannot be read off a photograph at all - a date, a file, a nested object - has no entry here and
 * no reading is ever asked for it.
 */
module.exports = {
  ASSET_FIELD_VALUE_KIND: {
    TEXT: 'text',
    NUMBER: 'number',
    SELECT: 'select',
  },
}
