import AiRunCommonFieldsInputAdapter from './AiRunCommonFieldsInputAdapter.js'

/**
 * Reads an asset-media-extraction request, adding the two fields this service judges of its own.
 *
 * **Why it is a subclass and not a second reading of the body.** The common five are read exactly
 * as every run-creating request's are, because they are the same five; what this adds is the two
 * fields `AssetMediaExtractionRequest` carries that no other request does. A second AI service
 * wanting its own fields judged declares them the same way, off the same base, rather than finding
 * this service's inherited.
 *
 * **It judges nothing**, which is the base's rule and stays this one's: a field the caller did not
 * send comes back as null, and a field the caller did send comes back exactly as it arrived - not
 * coerced, not cut, not defaulted. Whether a null is acceptable and how long a value may be are
 * rules, and rules belong to the validator.
 *
 * @extends {AiRunCommonFieldsInputAdapter}
 */
export default class AssetMediaExtractionInputAdapter extends AiRunCommonFieldsInputAdapter {
  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof AssetMediaExtractionInputAdapter} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetMediaExtractionInputAdapter} */ (this.constructor)
  }

  /**
   * Build the one input the rules are run against.
   *
   * @override
   * @returns {AssetMediaExtractionInput} Input.
   * @public
   */
  buildInput () {
    const commonFieldsInput = super.buildInput()

    return {
      ...commonFieldsInput,

      fieldSchema: this.body?.fieldSchema ?? null,
      mediaSignature: this.body?.mediaSignature ?? null,
    }
  }
}

/**
 * @typedef {import('./AiRunCommonFieldsInputAdapter.js').AiRunCommonFieldsInput & {
 *   fieldSchema: *
 *   mediaSignature: *
 * }} AssetMediaExtractionInput
 */
