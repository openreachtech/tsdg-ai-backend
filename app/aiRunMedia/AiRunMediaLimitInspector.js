import AI_RUN_MEDIA_LIMIT_CONSTANT_HASH from '../constants/aiRunMediaLimitConstants.js'

const {
  AI_RUN_MEDIA_LIMIT,
} = AI_RUN_MEDIA_LIMIT_CONSTANT_HASH

const DEFAULT_MAXIMUM_BYTE_SIZE = AI_RUN_MEDIA_LIMIT.MAXIMUM_BYTE_SIZE
const DEFAULT_MAXIMUM_MEDIA_COUNT = AI_RUN_MEDIA_LIMIT.MAXIMUM_MEDIA_COUNT

/*
 * A whole number of bytes, or a whole number of files: digits alone, without a sign and without a
 * leading zero.
 *
 * `byte_size` is a `BIGINT`, and a `BIGINT` reaches here as a number from SQLite and as text from
 * MariaDB - the same split `AiRunKeyInspector` exists for - so both spellings are held to one rule
 * rather than to whichever the environment happened to hand over. `0` on its own is a size; `007`
 * and `+3` are not, because a value written that way came from somewhere that was not measuring.
 */
const WHOLE_NUMBER_PATTERN = /^(?:0|[1-9]\d*)$/u

/*
 * What each limit is called in the parameters of the refusal.
 *
 * The client system builds the sentence people read out of `reasonCode` and `parameters`, and
 * `MEDIA_LIMIT_EXCEEDED` is the one code of the seven that carries parameters at all - so the name
 * is what tells "this file is too large" apart from "there are too many files", which are one code
 * and two different things for a person to do about it.
 */
const BYTE_SIZE_LIMIT_NAME = 'mediaByteSize'
const MEDIA_COUNT_LIMIT_NAME = 'mediaCount'

/**
 * Answers whether the media of a request are within the two limits, and names the limit that was
 * not.
 *
 * **Why the question is a class of its own.** The two figures - ten megabytes per photo, twelve
 * photos per request - are in the non-functional section rather than in section 18's data model,
 * because neither is a column: `ai_run_media.byte_size` records what the caller declared a file
 * weighs and nothing in the schema bounds it. A row over the cap is exactly the row this service
 * has to keep in order to say why the run failed, so the limit is a rule applied before anything is
 * fetched or sent, asked by whatever is about to send.
 *
 * **The size that is checked is the one the caller declared.** The second acceptance criterion says
 * byte size is checked before anything reaches a provider, and the third use case says a run given
 * a file too large fails "before anything has been sent to a provider" - so the check is made
 * against the `byteSize` the request carries, which is available before a single byte is fetched.
 * What the file actually weighs once fetched is a second question with the same answer available:
 * the fetch outcome carries its own `byteSize`, and passing that one in asks this same rule of it.
 *
 * **A size that is not a size is not within the limit.** A missing, negative or unreadable value is
 * answered false rather than passed through, because the only alternative is treating "we do not
 * know how large this is" as "small enough", which is the one reading that lets an unbounded file
 * reach a provider.
 *
 * **The limit is named in the parameters, never the wording.** This service returns no display
 * wording; the parameters carry the name of the limit, the figure it is set to, and the figure that
 * was declared against it. The declared figure is passed on only when it is a number - an
 * unreadable value is reported as null rather than copied into a column a client reads, because
 * `parameters` carries metadata and never a value somebody else wrote.
 */
export default class AiRunMediaLimitInspector {
  /**
   * Constructor.
   *
   * @param {AiRunMediaLimitInspectorParams} params - Parameters.
   */
  constructor ({
    maximumByteSize,
    maximumMediaCount,
  }) {
    this.maximumByteSize = maximumByteSize
    this.maximumMediaCount = maximumMediaCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunMediaLimitInspector ? X : never} T, X
   * @param {AiRunMediaLimitInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    maximumByteSize = DEFAULT_MAXIMUM_BYTE_SIZE,
    maximumMediaCount = DEFAULT_MAXIMUM_MEDIA_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        maximumByteSize,
        maximumMediaCount,
      })
    )
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunMediaLimitInspector} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunMediaLimitInspector} */ (this.constructor)
  }

  /**
   * Check whether one file is within the size the cap allows.
   *
   * @param {{
   *   byteSize: *
   * }} params - Parameters.
   * @returns {boolean} Whether it is within the cap.
   * @public
   */
  isWithinByteSizeLimit ({
    byteSize,
  }) {
    const comparableByteSize = this.generateComparableWholeNumber({
      value: byteSize,
    })

    if (comparableByteSize === null) {
      return false
    }

    return comparableByteSize <= this.maximumByteSize
  }

  /**
   * Check whether a request carries no more files than the limit allows.
   *
   * @param {{
   *   mediaCount: *
   * }} params - Parameters.
   * @returns {boolean} Whether it is within the limit.
   * @public
   */
  isWithinMediaCountLimit ({
    mediaCount,
  }) {
    const comparableMediaCount = this.generateComparableWholeNumber({
      value: mediaCount,
    })

    if (comparableMediaCount === null) {
      return false
    }

    return comparableMediaCount <= this.maximumMediaCount
  }

  /**
   * Generate the number a figure names, so that it can be compared with a limit.
   *
   * @param {{
   *   value: *
   * }} params - Parameters.
   * @returns {number | null} The figure as a number, or null when the value names none.
   * @public
   */
  generateComparableWholeNumber ({
    value,
  }) {
    if (typeof value === 'number') {
      return this.isWholeNumber({
        value,
      })
        ? value
        : null
    }

    if (typeof value !== 'string') {
      return null
    }

    return WHOLE_NUMBER_PATTERN.test(value)
      ? Number(value)
      : null
  }

  /**
   * Check whether a number is a figure something can be measured in.
   *
   * @param {{
   *   value: number
   * }} params - Parameters.
   * @returns {boolean} Whether it is a whole number of nothing or more.
   * @public
   */
  isWholeNumber ({
    value,
  }) {
    if (!Number.isInteger(value)) {
      return false
    }

    return value >= 0
  }

  /**
   * Build the parameters naming the size limit a file went past.
   *
   * @param {{
   *   byteSize: *
   * }} params - Parameters.
   * @returns {AiRunMediaLimitParameters} The parameters of the refusal.
   * @public
   */
  buildExceededByteSizeLimitParameters ({
    byteSize,
  }) {
    const declaredValue = this.generateComparableWholeNumber({
      value: byteSize,
    })

    return {
      limitName: BYTE_SIZE_LIMIT_NAME,
      limitValue: this.maximumByteSize,
      declaredValue,
    }
  }

  /**
   * Build the parameters naming the count limit a request went past.
   *
   * @param {{
   *   mediaCount: *
   * }} params - Parameters.
   * @returns {AiRunMediaLimitParameters} The parameters of the refusal.
   * @public
   */
  buildExceededMediaCountLimitParameters ({
    mediaCount,
  }) {
    const declaredValue = this.generateComparableWholeNumber({
      value: mediaCount,
    })

    return {
      limitName: MEDIA_COUNT_LIMIT_NAME,
      limitValue: this.maximumMediaCount,
      declaredValue,
    }
  }
}

/**
 * @typedef {{
 *   maximumByteSize: number
 *   maximumMediaCount: number
 * }} AiRunMediaLimitInspectorParams
 */

/**
 * @typedef {Partial<AiRunMediaLimitInspectorParams>} AiRunMediaLimitInspectorFactoryParams
 */

/**
 * @typedef {{
 *   limitName: string
 *   limitValue: number
 *   declaredValue: number | null
 * }} AiRunMediaLimitParameters
 */
