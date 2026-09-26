const CURSOR_TEXT_ENCODING = 'base64url'

const RUN_KEY_ENCODING = 'utf8'

/**
 * One place in a client's walk through its own runs.
 *
 * **What a cursor holds is a run key, and the reason is that a run key never moves.** The list
 * is read while runs are still changing status (specs/1.0.0, #run-list), and an offset page
 * would skip or repeat rows as they move — an offset counts rows that match *now*, so a run
 * leaving the filtered set shifts every row after it. A cursor names one run, the page after it
 * is every run older than that one, and nothing a run does to its own status moves it in that
 * order. A run that leaves the filter between two pages simply stops matching; it does not drag
 * its neighbours past the boundary.
 *
 * **Why the run key rather than the row's own id.** The row id is this service's internal
 * counter, and handing it to a client would let one client read, from the gap between two of its
 * own runs, how many runs every other client created in between. The run key is already the
 * client's — it is the identifier it holds for every run it has — so a cursor built from it
 * tells the client nothing it did not already know. `AiRunPageResponseBuilder` resolves the key
 * back to a row id under the client's own scope, so a cursor naming a run of somebody else
 * resolves to nothing and is refused exactly as a fabricated one is.
 *
 * **Why the key is encoded rather than sent as it is.** Base64url is how a token says "this is
 * mine to build and yours to hand back". It hides nothing — a client that decodes it finds its
 * own run key — and that is the point: what it buys is not secrecy but the freedom to carry
 * something else later. A cursor that ordered by a second column would encode two values, and a
 * client that had been constructing cursors out of run keys by hand would break on the day it
 * did. Encoded from the first version, nothing was ever constructing them.
 *
 * **What makes a cursor text invalid.** Base64 decoding in Node throws nothing: it drops what it
 * cannot read and answers with whatever is left, so any string at all decodes to something. The
 * check is therefore a round trip — the decoded key is re-encoded, and a text that does not come
 * back identical is not a text this class issued. That makes the judgment total without a
 * pattern to keep in step with whatever a run key happens to look like.
 */
export default class AiRunPageCursor {
  /**
   * Constructor.
   *
   * @param {AiRunPageCursorParams} params - Parameters.
   */
  constructor ({
    runKey,
  }) {
    this.runKey = runKey
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunPageCursor ? X : never} T, X
   * @param {AiRunPageCursorParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    runKey,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        runKey,
      })
    )
  }

  /**
   * Generate the text a run key is carried on the wire as.
   *
   * @param {{
   *   runKey: string
   * }} params - Parameters.
   * @returns {string} Cursor text.
   * @public
   */
  static generateCursorText ({
    runKey,
  }) {
    return Buffer.from(runKey, RUN_KEY_ENCODING)
      .toString(CURSOR_TEXT_ENCODING)
  }

  /**
   * Extract the run key a cursor text names.
   *
   * The round trip is the whole of the judgment: a text this class issued re-encodes to itself,
   * and one it did not re-encodes to something else — padding a decoder ignored, a character it
   * dropped, an empty string. Answering null rather than throwing leaves the refusal to the
   * caller that knows which status it answers with.
   *
   * @param {{
   *   cursorText: string
   * }} params - Parameters.
   * @returns {string | null} Run key, or null when the text is not one this class issued.
   * @public
   */
  static extractRunKey ({
    cursorText,
  }) {
    const runKey = Buffer.from(cursorText, CURSOR_TEXT_ENCODING)
      .toString(RUN_KEY_ENCODING)

    if (runKey === '') {
      return null
    }

    const canonicalCursorText = this.generateCursorText({
      runKey,
    })

    if (canonicalCursorText !== cursorText) {
      return null
    }

    return runKey
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunPageCursor} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunPageCursor} */ (this.constructor)
  }

  /**
   * Generate the text this cursor is carried on the wire as.
   *
   * @returns {string} Cursor text.
   * @public
   */
  generateCursorText () {
    return this.Ctor.generateCursorText({
      runKey: this.runKey,
    })
  }
}

/**
 * @typedef {{
 *   runKey: string
 * }} AiRunPageCursorParams
 */
