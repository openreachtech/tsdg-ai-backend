import ASSET_FIELD_VALUE_KIND_CONSTANT_HASH from '../constants/assetFieldValueKindConstants.js'

const {
  ASSET_FIELD_VALUE_KIND,
} = ASSET_FIELD_VALUE_KIND_CONSTANT_HASH

/*
 * The kinds step 1 keeps, as a hash a membership question is asked of.
 *
 * It is built from the constant rather than written out, so a kind added there is a kind kept here
 * and no second list can fall behind the first. The value under each key is `true` and the read is
 * `=== true`, so a `valueKind` naming a member of `Object.prototype` - `constructor`,
 * `toString` - is as unsuggestible as a kind nobody declared.
 */
const DEFAULT_SUGGESTIBLE_VALUE_KIND_HASH = Object.fromEntries(
  Object.values(ASSET_FIELD_VALUE_KIND)
    .map(it => [
      it,
      true,
    ])
)

/**
 * Step 1 of an asset-media-extraction run: keeps only the fields a photograph could answer.
 *
 * **What it keeps is decided by the kind alone.** specs/1.0.0 §20 names three - text, number and
 * select - and every other kind the caller's own schema may carry is dropped here, before a model
 * is asked anything. A dropped kind is not a refusal and is reported nowhere: the caller asked for
 * a field this service cannot read off a photograph, which is an answer rather than a failure.
 *
 * **A dropped field is not a missing field either, and the difference is the whole point of doing
 * this first.** `missingFieldPaths[]` names required fields "no majority settled" - fields this
 * service tried to read and could not. A date field was never tried, so naming it there would tell
 * a client the photographs failed to show something that was never looked for. It leaves through
 * step 1 and appears on no list.
 *
 * **With nothing left it returns no fields and calls no model**, which is the first acceptance
 * criterion. That is a property of the caller rather than of this class - what this class
 * guarantees is that the answer is empty, and the run then has nothing to ask a model about.
 *
 * **An entry is also held to carrying a usable path.** A schema entry whose `path` is not a
 * string bounds nothing: step 4 could not match a reading against it and step 5 could not settle
 * it, so keeping it would put an entry in the kept schema that no later step can act on.
 */
export default class SuggestibleFieldSelector {
  /**
   * Constructor.
   *
   * @param {SuggestibleFieldSelectorParams} params - Parameters.
   */
  constructor ({
    suggestibleValueKindHash,
  }) {
    this.suggestibleValueKindHash = suggestibleValueKindHash
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof SuggestibleFieldSelector ? X : never} T, X
   * @param {SuggestibleFieldSelectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    suggestibleValueKindHash = DEFAULT_SUGGESTIBLE_VALUE_KIND_HASH,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        suggestibleValueKindHash,
      })
    )
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof SuggestibleFieldSelector} The class.
   */
  get Ctor () {
    return /** @type {typeof SuggestibleFieldSelector} */ (this.constructor)
  }

  /**
   * Extract the entries of a field schema a photograph could answer.
   *
   * A `fieldSchema` that is not an array declares no field, so it answers none - which is the same
   * answer a request carrying an empty schema gets, and the same thing the run does about it.
   *
   * @param {{
   *   fieldSchema: *
   * }} params - Parameters.
   * @returns {Array<restfulapi.v1.AssetMediaExtractionFieldSchemaRequest>} The kept entries, in the
   * order the caller sent them.
   * @public
   */
  extractSuggestibleFieldSchema ({
    fieldSchema,
  }) {
    if (!Array.isArray(fieldSchema)) {
      return []
    }

    return fieldSchema.filter(it =>
      this.isSuggestibleFieldSchemaEntry({
        fieldSchemaEntry: it,
      })
    )
  }

  /**
   * Check whether one schema entry is one a photograph could answer.
   *
   * @param {{
   *   fieldSchemaEntry: *
   * }} params - Parameters.
   * @returns {boolean} Whether the entry is kept.
   * @public
   */
  isSuggestibleFieldSchemaEntry ({
    fieldSchemaEntry,
  }) {
    if (typeof fieldSchemaEntry?.path !== 'string') {
      return false
    }

    if (fieldSchemaEntry.path === '') {
      return false
    }

    return this.isSuggestibleValueKind({
      valueKind: fieldSchemaEntry.valueKind,
    })
  }

  /**
   * Check whether a field of this kind can be suggested from a photograph at all.
   *
   * @param {{
   *   valueKind: *
   * }} params - Parameters.
   * @returns {boolean} Whether the kind is suggestible.
   * @public
   */
  isSuggestibleValueKind ({
    valueKind,
  }) {
    if (typeof valueKind !== 'string') {
      return false
    }

    return this.suggestibleValueKindHash[valueKind] === true
  }

  /**
   * Extract the paths of the kept entries the caller marked required.
   *
   * It is asked of the kept schema rather than of the whole one, so a required field of a kind
   * this service cannot read is not reported missing - see the class comment on why those two are
   * different answers.
   *
   * `isRequired` is read as `=== true` rather than for truthiness, because a caller that sent the
   * string `'false'` meant the opposite of what truthiness would make of it, and a required field
   * is the one thing on this surface a client acts on.
   *
   * @param {{
   *   fieldSchema: Array<restfulapi.v1.AssetMediaExtractionFieldSchemaRequest>
   * }} params - Parameters.
   * @returns {Array<string>} The paths, in the order the caller sent them.
   * @public
   */
  extractRequiredFieldPaths ({
    fieldSchema,
  }) {
    return fieldSchema
      .filter(it => it.isRequired === true)
      .map(it => it.path)
  }
}

/**
 * @typedef {{
 *   suggestibleValueKindHash: Record<string, boolean>
 * }} SuggestibleFieldSelectorParams
 */

/**
 * @typedef {Partial<SuggestibleFieldSelectorParams>} SuggestibleFieldSelectorFactoryParams
 */
