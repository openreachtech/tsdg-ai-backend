/**
 * Builds the body an asset-media-extraction run settles, out of what its six steps produced.
 *
 * **The shape is the enforcement, not a rule somebody remembers.** specs/1.0.0 §20 and this
 * version's own acceptance criteria both say the AI proposes and never decides: no response may
 * carry a field by which a record could be approved. So each field of the answer is written out by
 * name here rather than spread from what step 6 produced - the scored field also carries the two
 * master-row ids and the formula version the trace records, and none of the three is a client's
 * business. A key nobody named cannot travel.
 *
 * **It is built per run, holding the signature it echoes.** `mediaSignature` is derived from the
 * media by the caller and returned untouched "so a caller can tell which request an answer belongs
 * to". It is the one thing about the answer that comes from the request rather than from the run,
 * which is why it is the builder's state and not an argument of the build.
 *
 * **A missing field carries a path and nothing else.** §20: never a guess, never a zero. There is
 * no entry in `fields[]` for it, no value of any kind, and nothing here fabricates one - which is
 * why `missingFieldPaths[]` is a list of strings rather than a list of empty fields.
 *
 * **What is answered is an object, and `#generateResultBody()` is what makes it the text
 * `ai_runs.result_body` holds.** Both exist because the two readers want different things: the
 * caller of this class writes the text, and a test reads the object without parsing its own
 * fixture back out of a string.
 */
export default class AssetMediaExtractionResultBuilder {
  /**
   * Constructor.
   *
   * @param {AssetMediaExtractionResultBuilderParams} params - Parameters.
   */
  constructor ({
    mediaSignature,
  }) {
    this.mediaSignature = mediaSignature
  }

  /**
   * Factory method.
   *
   * The signature is normalized to null where the request carried none. The contract declares it
   * required, so a body reaching here without one is a body that broke the contract - and echoing
   * null says so on the surface a caller reads, where echoing an empty string or the word
   * `undefined` would look like an answer.
   *
   * @template {X extends typeof AssetMediaExtractionResultBuilder ? X : never} T, X
   * @param {{
   *   mediaSignature: *
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    mediaSignature,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        mediaSignature: this.generateEchoableMediaSignature({
          mediaSignature,
        }),
      })
    )
  }

  /**
   * Generate the signature this run echoes back.
   *
   * @param {{
   *   mediaSignature: *
   * }} params - Parameters.
   * @returns {string | null} The signature, or null when the request carried none.
   * @public
   */
  static generateEchoableMediaSignature ({
    mediaSignature,
  }) {
    if (typeof mediaSignature !== 'string') {
      return null
    }

    return mediaSignature
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AssetMediaExtractionResultBuilder} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetMediaExtractionResultBuilder} */ (this.constructor)
  }

  /**
   * Build what the run settled.
   *
   * @param {BuildResultParams} params - Parameters.
   * @returns {restfulapi.v1.AssetMediaExtractionResult} The result.
   * @public
   */
  buildResult ({
    scoredFields,
    missingFieldPaths,
    unreadableMediaKeys,
  }) {
    const fields = this.buildFieldResults({
      scoredFields,
    })

    const {
      mediaSignature,
    } = this

    return {
      fields,
      missingFieldPaths,
      unreadableMediaKeys,
      mediaSignature,
    }
  }

  /**
   * Build the text the run's result is stored and delivered as.
   *
   * @param {BuildResultParams} params - Parameters.
   * @returns {string} The result as text.
   * @public
   */
  generateResultBody ({
    scoredFields,
    missingFieldPaths,
    unreadableMediaKeys,
  }) {
    const result = this.buildResult({
      scoredFields,
      missingFieldPaths,
      unreadableMediaKeys,
    })

    return JSON.stringify(result)
  }

  /**
   * Build the entry each settled field is returned as.
   *
   * @param {{
   *   scoredFields: Array<import('./AssetFieldConfidenceScorer.js').ScoredField>
   * }} params - Parameters.
   * @returns {Array<restfulapi.v1.AssetMediaExtractionFieldResult>} The entries.
   * @public
   */
  buildFieldResults ({
    scoredFields,
  }) {
    return scoredFields.map(it =>
      this.buildFieldResult({
        scoredField: it,
      })
    )
  }

  /**
   * Build the entry one settled field is returned as.
   *
   * The seven fields are named one at a time, which is what keeps the two master-row ids and the
   * formula version off a client's surface - see the class comment.
   *
   * @param {{
   *   scoredField: import('./AssetFieldConfidenceScorer.js').ScoredField
   * }} params - Parameters.
   * @returns {restfulapi.v1.AssetMediaExtractionFieldResult} The entry.
   * @public
   */
  buildFieldResult ({
    scoredField,
  }) {
    const {
      path,
      value,
      fieldStateName,
      suggestionConfidence,
      reason,
      sourceMediaKeys,
      agreement,
    } = scoredField

    return {
      path,
      value,
      fieldStateName,
      suggestionConfidence,
      reason,
      sourceMediaKeys,
      agreement,
    }
  }
}

/**
 * @typedef {{
 *   mediaSignature: string | null
 * }} AssetMediaExtractionResultBuilderParams
 */

/**
 * @typedef {{
 *   scoredFields: Array<import('./AssetFieldConfidenceScorer.js').ScoredField>
 *   missingFieldPaths: Array<string>
 *   unreadableMediaKeys: Array<string>
 * }} BuildResultParams
 */
