import AiRunCommonFieldsInputValidator from './AiRunCommonFieldsInputValidator.js'

import ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT_CONSTANT_HASH from '../../constants/assetMediaExtractionRequestLimitConstants.js'

const {
  ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT,
} = ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT_CONSTANT_HASH

/**
 * Validates the input an asset-media-extraction request carries, over the common five.
 *
 * **What it adds, and why it is added here rather than deeper.** The field schema and the media
 * signature are the two fields of `AssetMediaExtractionRequest` that nothing bounded. Both are read
 * by the work the run's own queue carries out, and both are read by work that grows with them - the
 * schema once per field of it, the signature inside the draw each of those fields is answered from.
 * That work is synchronous, so specs/1.0.0 §7's run time limit cannot end it: the limit is a
 * deadline raced against the run, and a deadline cannot interrupt a synchronous loop, nor even fire
 * while one holds the event loop. A caller choosing both figures therefore chose how long one
 * request holds that queue against every other client of it. The only place that can be refused is
 * the door, before a run exists - which is where this class runs.
 *
 * **Both rules are ceilings, and neither is a requirement to send the field.** A request carrying
 * no field schema is answered today with a successful run carrying no fields, which is §20's second
 * use case; a request carrying no signature is echoed a null one. Neither becomes a refusal here.
 * What is refused is a field that was sent and is larger than
 * `constants/assetMediaExtractionRequestLimitConstants.cjs` allows - and that file, not this one,
 * is where the two figures are derived.
 *
 * **A signature that is not a string is refused rather than read.** The contract calls it "derived
 * from the media, and echoed back", and every reader of it downstream already treats a non-string
 * as no signature at all - the result builder echoes null, and the reading supplier digests
 * nothing. Refusing it at the door says the same thing where the caller can still act on it, and
 * keeps a value of a shape nobody expects from reaching a recursive reader at all.
 *
 * @extends {AiRunCommonFieldsInputValidator}
 */
export default class AssetMediaExtractionInputValidator extends AiRunCommonFieldsInputValidator {
  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof AssetMediaExtractionInputValidator} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetMediaExtractionInputValidator} */ (this.constructor)
  }

  /**
   * Generate the rules this input is judged by, in the order they are judged.
   *
   * The common five come first, unchanged and in their own order, because a request missing its
   * idempotency key is not a request whose field schema is worth measuring. This service's own two
   * follow, in the order the request writes them.
   *
   * @override
   * @returns {Array<[() => boolean, *]>} Validation entries.
   */
  generateValidationEntries () {
    const commonFieldsEntries = super.generateValidationEntries()

    return [
      ...commonFieldsEntries,

      [
        () => this.isValidFieldSchema(),
        this.errorHash.InvalidFieldSchema,
      ],
      [
        () => this.isValidMediaSignature(),
        this.errorHash.InvalidMediaSignature,
      ],
    ]
  }

  /**
   * Check whether the field schema carries no more fields than one request may ask about.
   *
   * A schema that is not an array at all passes: the run keeps no field from it and answers with
   * none, which is what it already did, and this rule is a ceiling rather than a shape.
   *
   * @returns {boolean} true: valid.
   */
  isValidFieldSchema () {
    const { fieldSchema } = this.input

    if (!Array.isArray(fieldSchema)) {
      return true
    }

    return fieldSchema.length <= ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT
  }

  /**
   * Check whether the media signature is a string this service can echo, and short enough to be one.
   *
   * @returns {boolean} true: valid.
   */
  isValidMediaSignature () {
    const mediaSignature = this.input.mediaSignature
      ?? null

    if (mediaSignature === null) {
      return true
    }

    return this.Ctor.isStorableText({
      value: mediaSignature,
      maximumLength: ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_MEDIA_SIGNATURE_LENGTH,
    })
  }
}
