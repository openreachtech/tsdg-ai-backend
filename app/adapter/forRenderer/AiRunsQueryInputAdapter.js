/**
 * Reads the query string of `GET /v1/ai-runs` and hands back one input.
 *
 * **It judges nothing, and it is the only class that knows the input arrived as text.** A query
 * string carries strings and nothing else, so the two fields that are counts — `stalledForSeconds`
 * and `limit` — are read as numbers here and are numbers everywhere downstream. A value that is
 * not a number comes through as `NaN` rather than as an error, because whether a caller may send
 * one is a rule, and rules belong to the validator.
 *
 * **The four text fields are handed on untouched.** Not trimmed, not lower-cased, not coerced to
 * a string. A repeated query parameter arrives as an array — Express reads `?statusName=queued&
 * statusName=failed` as `['queued', 'failed']` — and that array is passed through as it came, so
 * the validator refuses it. Quietly taking the first entry, or quietly dropping the filter, would
 * both answer a question the caller did not ask: one of them narrows the list to something the
 * caller never named, and the other widens it to everything.
 *
 * **A field the caller did not send is null, and never a default.** What a missing `limit` means
 * is the page size this service chooses, and choosing it is the reading side's business, not the
 * reading-of-the-request's. Leaving it null here keeps "the caller asked for nothing" and "the
 * caller asked for the number that happens to be the default" distinguishable for as long as
 * anything needs to tell them apart.
 */
export default class AiRunsQueryInputAdapter {
  /**
   * Constructor.
   *
   * @param {AiRunsQueryInputAdapterParams} params - Parameters.
   */
  constructor ({
    query,
  }) {
    this.query = query
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunsQueryInputAdapter ? X : never} T, X
   * @param {AiRunsQueryInputAdapterParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    query,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        query,
      })
    )
  }

  /**
   * Read a query value as the count it is meant to be.
   *
   * A value the caller did not send stays null, because a count nobody asked for is not zero.
   * Anything else goes through `Number()` and comes out as whatever that makes of it, `NaN`
   * included — this method's promise is that the field is a number or null, and not that the
   * number means anything.
   *
   * @param {{
   *   value: *
   * }} params - Parameters.
   * @returns {number | null} The count, or null when the caller sent none.
   * @public
   */
  static generateCount ({
    value,
  }) {
    if (value === null) {
      return null
    }

    if (typeof value === 'undefined') {
      return null
    }

    return Number(value)
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunsQueryInputAdapter} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunsQueryInputAdapter} */ (this.constructor)
  }

  /**
   * Build the one input the rules are run against.
   *
   * @returns {restfulapi.v1.AiRunsQueryInput} Input.
   * @public
   */
  buildInput () {
    const stalledForSeconds = this.Ctor.generateCount({
      value: this.query?.stalledForSeconds,
    })

    const limit = this.Ctor.generateCount({
      value: this.query?.limit,
    })

    return {
      statusName: this.query?.statusName ?? null,
      runCategoryName: this.query?.runCategoryName ?? null,
      correlationId: this.query?.correlationId ?? null,
      stalledForSeconds,
      limit,
      cursor: this.query?.cursor ?? null,
    }
  }
}

/**
 * @typedef {{
 *   query: *
 * }} AiRunsQueryInputAdapterParams
 */
