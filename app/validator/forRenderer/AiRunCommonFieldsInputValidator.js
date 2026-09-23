import BaseInputValidator from '../BaseInputValidator.js'

/**
 * Validates the input every run-creating request carries, whichever AI service answers it.
 *
 * **The five fields, and why they are all one rule.** Four of them are the common fields of the
 * request body — the caller's own object key, the line a person reads, the id that groups a
 * business object's runs, and where the terminal callback goes. The fifth is the idempotency key,
 * which arrives in a header rather than the body but is required of the same requests and refused
 * the same way. Reaching them all through one `input` is what lets a caller judge the request in
 * one pass, and is why the renderer merges the header into the input before handing it over.
 *
 * **Presence is the whole of what is judged here.** Every one of the five is a string the service
 * never interprets, so there is no format to check: the caller's object key is never parsed, the
 * subject label is echoed back untouched, and the callback URL is matched against the client's
 * registered prefix at delivery time, against a record this class does not hold. What is left is
 * that the field was sent and carries something — text that is blank once trimmed is a field
 * nobody filled in, and it is refused rather than stored.
 *
 * **The value stored is never the trimmed one.** Trimming decides only whether the field counts as
 * filled in; the renderer stores what the caller sent, so a label whose spacing carried meaning
 * comes back the way it went in.
 *
 * @extends {BaseInputValidator}
 */
export default class AiRunCommonFieldsInputValidator extends BaseInputValidator {
  /**
   * Check whether a value is text somebody filled in.
   *
   * @param {{
   *   value: *
   * }} params - Parameters.
   * @returns {boolean} true: the value is a string carrying something other than blanks.
   */
  static isFilledText ({
    value,
  }) {
    if (typeof value !== 'string') {
      return false
    }

    return value.trim() !== ''
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCommonFieldsInputValidator} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCommonFieldsInputValidator} */ (this.constructor)
  }

  /**
   * Generate the rules this input is judged by, in the order they are judged.
   *
   * The idempotency key comes first because a request that carries none is not a request this
   * service can answer twice, and saying so before the body is judged is the shorter sentence.
   *
   * @override
   * @returns {Array<[() => boolean, *]>} Validation entries.
   */
  generateValidationEntries () {
    return [
      [
        () => this.isValidRequestKey(),
        this.errorHash.MissingIdempotencyKey,
      ],
      [
        () => this.isValidExternalRef(),
        this.errorHash.InvalidExternalRef,
      ],
      [
        () => this.isValidSubjectLabel(),
        this.errorHash.InvalidSubjectLabel,
      ],
      [
        () => this.isValidCorrelationId(),
        this.errorHash.InvalidCorrelationId,
      ],
      [
        () => this.isValidCallbackUrl(),
        this.errorHash.InvalidCallbackUrl,
      ],
    ]
  }

  /**
   * Check whether the idempotency key is one this service can answer twice by.
   *
   * @returns {boolean} true: valid.
   */
  isValidRequestKey () {
    return this.Ctor.isFilledText({
      value: this.input.requestKey,
    })
  }

  /**
   * Check whether the caller's own object key was sent.
   *
   * @returns {boolean} true: valid.
   */
  isValidExternalRef () {
    return this.Ctor.isFilledText({
      value: this.input.externalRef,
    })
  }

  /**
   * Check whether the line a person reads was sent.
   *
   * @returns {boolean} true: valid.
   */
  isValidSubjectLabel () {
    return this.Ctor.isFilledText({
      value: this.input.subjectLabel,
    })
  }

  /**
   * Check whether the id grouping one business object's runs was sent.
   *
   * @returns {boolean} true: valid.
   */
  isValidCorrelationId () {
    return this.Ctor.isFilledText({
      value: this.input.correlationId,
    })
  }

  /**
   * Check whether the callback target was sent.
   *
   * @returns {boolean} true: valid.
   */
  isValidCallbackUrl () {
    return this.Ctor.isFilledText({
      value: this.input.callbackUrl,
    })
  }
}
