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
 * It closes a second thing on the way. Above 2^53 a comparison through `Number` stops being exact,
 * so two different keys could compare equal and a step of one run could pass for a step of another.
 * Nineteen digits does not remove that by itself, but it is where the bound belongs, and the ids
 * this service mints are nowhere near it.
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

    return this.keyPattern.test(key)
      ? Number(key)
      : null
  }

  /**
   * Check whether a number names a row at all.
   *
   * **The two spellings have to agree.** Before this, text was held to the pattern — a positive
   * integer with no leading zero — while a number was taken whole, so `'-1'` named no row and `-1`
   * named one, and which answer a caller got depended on whether its key had crossed a queue or a
   * query string.
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

    if (key < 1) {
      return false
    }

    return String(key).length <= 19
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
