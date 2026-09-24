import crypto from 'node:crypto'

const DEFAULT_HASH_ALGORITHM = 'sha256'

const DIGESTED_NUMBER_HEX_LENGTH = 8
const HEXADECIMAL_RADIX = 16

const NULL_CANONICAL_TEXT = 'null'

/**
 * Digests one request into the value the stub driver draws its whole answer from.
 *
 * **Why a digest, and not a random generator.** The stub has to answer the same thing every time
 * it is asked the same thing — on any machine, on any run, in any order. A generator seeded from a
 * clock or from entropy cannot do that, and one seeded from a counter answers differently depending
 * on what ran before it. A digest of the request is the only source that depends on nothing but the
 * request, so two installations that never met agree on the answer without having agreed on
 * anything else.
 *
 * **Why the text is built here rather than by `JSON.stringify()`.** `JSON.stringify()` writes an
 * object's keys in insertion order, so two requests that are the same request — built by two
 * callers that filled the same fields in a different order — would digest to two different values
 * and the stub would answer them differently. This orders every object's keys before writing them,
 * so what is digested is the request's content and never the order it was assembled in.
 *
 * **What it never does.** It reads no key, opens no connection and consults no clock. Everything it
 * answers is a function of its argument alone, which is what makes the driver above it testable by
 * calling it twice.
 */
export default class StubAnswerDigester {
  /**
   * Constructor.
   *
   * @param {StubAnswerDigesterParams} params - Parameters.
   */
  constructor ({
    hashAlgorithm,
  }) {
    this.hashAlgorithm = hashAlgorithm
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof StubAnswerDigester ? X : never} T, X
   * @param {StubAnswerDigesterFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    hashAlgorithm = DEFAULT_HASH_ALGORITHM,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        hashAlgorithm,
      })
    )
  }

  /**
   * get: crypto module — a seam so tests can substitute it.
   *
   * @returns {typeof crypto} The crypto module.
   */
  static get crypto () {
    return crypto
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof StubAnswerDigester} The class.
   */
  get Ctor () {
    return /** @type {typeof StubAnswerDigester} */ (this.constructor)
  }

  /**
   * Build the one text that stands for a value, whatever shape the value has.
   *
   * @param {{
   *   value: *
   * }} params - Parameters.
   * @returns {string} The canonical text of the value.
   * @public
   */
  buildCanonicalText ({
    value,
  }) {
    if (value === null) {
      return NULL_CANONICAL_TEXT
    }

    if (Array.isArray(value)) {
      return this.buildCanonicalArrayText({
        values: value,
      })
    }

    if (typeof value !== 'object') {
      return JSON.stringify(value)
        ?? NULL_CANONICAL_TEXT
    }

    return this.buildCanonicalObjectText({
      value,
    })
  }

  /**
   * Build the canonical text of an array, keeping the order its elements are in.
   *
   * An array's order is part of what it says — the media of a request, the readings of a run — so
   * unlike an object's keys it is written out as it arrived.
   *
   * @param {{
   *   values: Array<*>
   * }} params - Parameters.
   * @returns {string} The canonical text of the array.
   */
  buildCanonicalArrayText ({
    values,
  }) {
    const texts = values.map(it => this.buildCanonicalText({
      value: it,
    }))

    return `[${texts.join(',')}]`
  }

  /**
   * Build the canonical text of an object, with its keys in a fixed order.
   *
   * Sorted by code unit rather than by locale: a locale-aware comparison answers differently on two
   * machines configured differently, which is the one thing this class exists to rule out.
   *
   * @param {{
   *   value: Record<string, *>
   * }} params - Parameters.
   * @returns {string} The canonical text of the object.
   */
  buildCanonicalObjectText ({
    value,
  }) {
    const texts = Object.keys(value)
      .toSorted()
      .map(it => this.buildCanonicalPropertyText({
        key: it,
        value: value[it],
      }))

    return `{${texts.join(',')}}`
  }

  /**
   * Build the canonical text of one property of an object.
   *
   * @param {{
   *   key: string
   *   value: *
   * }} params - Parameters.
   * @returns {string} The canonical text of the property.
   */
  buildCanonicalPropertyText ({
    key,
    value,
  }) {
    const valueText = this.buildCanonicalText({
      value,
    })

    return `${JSON.stringify(key)}:${valueText}`
  }

  /**
   * Digest a text.
   *
   * @param {{
   *   text: string
   * }} params - Parameters.
   * @returns {string} The digest, as lower case hex.
   * @public
   */
  digestText ({
    text,
  }) {
    return this.Ctor.crypto.createHash(this.hashAlgorithm)
      .update(text)
      .digest('hex')
  }

  /**
   * Generate the number a text digests to.
   *
   * The leading eight hex characters are read, which is thirty-two bits — comfortably inside the
   * safe integer range, so the number a caller reduces into a range is the same number everywhere.
   *
   * @param {{
   *   text: string
   * }} params - Parameters.
   * @returns {number} The digested number.
   * @public
   */
  generateDigestedNumber ({
    text,
  }) {
    const digest = this.digestText({
      text,
    })

    return Number.parseInt(digest.slice(0, DIGESTED_NUMBER_HEX_LENGTH), HEXADECIMAL_RADIX)
  }
}

/**
 * @typedef {{
 *   hashAlgorithm: string
 * }} StubAnswerDigesterParams
 */

/**
 * @typedef {Partial<StubAnswerDigesterParams>} StubAnswerDigesterFactoryParams
 */
