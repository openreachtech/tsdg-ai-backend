/*
 * What a key of this feature looks like: a positive whole number, written without a leading zero,
 * and no longer than a `BIGINT` can be.
 *
 * The length bound is the half that was missing, and it was missing against this file's own
 * neighbours: the field path is bounded to 191 and the method version to 32, each by the column
 * that holds it, while the key pattern bounded only the alphabet. An identifier made of digits is
 * not thereby harmless — an account number, an international telephone number with its leading zero
 * dropped, a sixteen-digit sequence — and a 260-digit one is an arbitrarily long line in whatever
 * log the refusal reaches. Nineteen digits is what a signed `BIGINT` holds, so the bound is the
 * column's, exactly as the other two are.
 *
 * **The pattern is the whole alphabet rule, and both spellings of a key are held to it by spelling
 * the key out.** `Number.isInteger()` on its own is not that rule: `1e21` is an integer by that
 * test, and what JavaScript spells it as is `'1e+21'` — five characters, inside the nineteen the
 * bound allows, and a path segment of `medium-1e+21` rather than one of digits. So a number is
 * turned into its text and held to this pattern, which is how "a key is digits" became something
 * every caller of this class may rely on rather than something the text branch alone kept.
 *
 * **A key must also name the number it spells.** Above 2^53 a reading through `Number` stops being
 * exact: `'9007199254740993'` and `'9007199254740992'` are two nineteen-or-fewer-digit keys that
 * both read back as the same number, so two media would build one file path and one would overwrite
 * the other. The pattern cannot see that, and no pattern can — it is a property of the reading, not
 * of the spelling — so the reading is spelled out again and compared with the text it came from.
 *
 * What that admits is exactly the texts standing in one-to-one correspondence with their numbers.
 * It is not "every key below 2^53": `'18014398509481984'` is above it and is admitted, because a
 * double holds that one exactly and spells it back, while `'9223372036854775807'` is refused. The
 * property being kept is not a magnitude but the absence of a collision — two keys reading back as
 * one number is impossible now, because the second of them could not spell itself back. A key this
 * refuses is raised by the recorder holding it rather than silently merged with its neighbour, and
 * the ids this service mints are nowhere near where the refusals begin.
 *
 * **What stays open, stated rather than claimed closed:** a run of nineteen digits or fewer passes,
 * and no pattern can tell one that is a key from one that is something else — a sixteen-digit
 * sequence is a key of this shape whatever else it may also be. The bound stops an arbitrarily long
 * line reaching a log; it does not make a digit sequence meaningful. What keeps something read out
 * of a medium out of a key is the caller that builds one, and this is written down because a reader
 * who took "it is digits, so it is safe" for the whole truth would not look at that caller.
 */
const AI_RUN_KEY_PATTERN = /^(?=.{1,19}$)[1-9]\d*$/u

/**
 * Answers whether a value is a key of this feature, and what number it names.
 *
 * **Why the question is a class of its own.** Every `BIGINT` key here carries the same hazard: it
 * may arrive as text — from MariaDB, from a request, from a job payload that crossed a queue as
 * JSON — so a key compared in the form it arrived in would refuse pairs that match. And every
 * refusal that writes a key into its message is writing something a caller handed over, which is
 * only safe once the key has been shown to be one.
 *
 * Both halves were re-derived per class until this existed, and the cost of that showed up twice in
 * one audit: one recorder held a key to a shape while the recorder beside it wrote eight messages
 * out of a key nothing had checked, and within a single class the text spelling and the number
 * spelling of the same key disagreed about whether `-1` named a row. One rule, in one place, asked
 * by whichever class is holding a key.
 */
export default class AiRunKeyInspector {
  /**
   * Constructor.
   *
   * @param {AiRunKeyInspectorParams} params - Parameters.
   */
  constructor ({
    keyPattern,
  }) {
    this.keyPattern = keyPattern
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunKeyInspector ? X : never} T, X
   * @param {AiRunKeyInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    keyPattern = AI_RUN_KEY_PATTERN,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        keyPattern,
      })
    )
  }

  /**
   * Generate the number a key names, so that two of them can be compared.
   *
   * @param {{
   *   key: *
   * }} params - Parameters.
   * @returns {number | null} The key as a number, or null when the value names no key.
   * @public
   */
  generateComparableKey ({
    key,
  }) {
    if (typeof key === 'number') {
      return this.namesRow({
        key,
      })
        ? key
        : null
    }

    if (typeof key !== 'string') {
      return null
    }

    return this.namesRowExactly({
      keyText: key,
    })
      ? Number(key)
      : null
  }

  /**
   * Check whether a number names a row at all.
   *
   * **The two spellings are held to the same alphabet rule.** Before this, text was held to the
   * pattern — a positive integer with no leading zero — while a number was taken whole, so `'-1'`
   * named no row and `-1` named one, and which answer a caller got depended on whether its key had
   * crossed a queue or a query string.
   *
   * **A number is held to the pattern by being spelled out**, rather than by a length bound
   * restated here. The two are not the same rule: `1e21` is a whole number whose spelling is
   * `'1e+21'`, which the length bound admits and the alphabet does not. Holding both spellings to
   * the one pattern is what lets a caller building a path out of a key rely on its being digits.
   * Zero, a negative and a leading zero are refused by that same pattern, which is why no second
   * comparison is made here.
   *
   * **The bijection test is `#namesRowExactly()`'s alone, and that asymmetry is deliberate.** This
   * method answers yes to `9007199254740993`; the text `'9007199254740993'` is answered no, for
   * spelling itself back as `9007199254740992`. It is the same key admitted one way and refused
   * the other, and the reason is that there is nothing left here to refuse: a number above 2^53
   * lost its identity at the `JSON.parse` — or at the literal — that made it, before this class
   * ever saw it, so the two keys that would have collided arrived as one value and the second of
   * them no longer exists to be told apart. What the text branch prevents is two *texts* reading
   * back as one number, which is a collision that does still survive to reach it. A caller handing
   * over numbers above 2^53 has already spent that guarantee somewhere this class cannot see.
   *
   * @param {{
   *   key: number
   * }} params - Parameters.
   * @returns {boolean} Whether the number names a row.
   * @public
   */
  namesRow ({
    key,
  }) {
    if (!Number.isInteger(key)) {
      return false
    }

    return this.keyPattern.test(String(key))
  }

  /**
   * Check whether text names a row, and names the row it spells.
   *
   * The second half is what the pattern cannot answer. `'9007199254740993'` is a key by every rule
   * the pattern states, and the number it reads back as is `9007199254740992` — the number the key
   * beside it reads back as. Two rows would then compare equal, and two media would build one file
   * path. So the number is spelled out again and compared with the text it came from: a key that
   * does not spell itself back is answered no, which refuses it rather than merging it.
   *
   * It is a bijection test and not a magnitude test. `'18014398509481984'` spells itself back and
   * is answered yes though it is above 2^53; `'9223372036854775807'` does not and is answered no.
   * What that buys is the only thing that matters here: no two texts this answers yes to can read
   * back as one number.
   *
   * @param {{
   *   keyText: string
   * }} params - Parameters.
   * @returns {boolean} Whether the text names a row exactly.
   * @public
   */
  namesRowExactly ({
    keyText,
  }) {
    if (!this.keyPattern.test(keyText)) {
      return false
    }

    return String(Number(keyText)) === keyText
  }

  /**
   * Check whether a value is a key this service may write into a message.
   *
   * @param {{
   *   key: *
   * }} params - Parameters.
   * @returns {boolean} Whether the value is a key.
   * @public
   */
  isRecordableKey ({
    key,
  }) {
    return this.generateComparableKey({
      key,
    }) !== null
  }
}

/**
 * @typedef {{
 *   keyPattern: RegExp
 * }} AiRunKeyInspectorParams
 */

/**
 * @typedef {Partial<AiRunKeyInspectorParams>} AiRunKeyInspectorFactoryParams
 */
