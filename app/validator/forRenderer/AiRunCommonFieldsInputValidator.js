import BaseInputValidator from '../BaseInputValidator.js'

/*
 * The longest value each field may carry, measured in JavaScript string length.
 *
 * `REQUEST_KEY`, `EXTERNAL_REF` and `CORRELATION_ID` are not numbers chosen here. They are the
 * widths `sequelize/migrations/20260922100004-000004-create_table-ai_runs.cjs` gives those three
 * columns — `Sequelize.STRING(191)` each — restated so that a value this class accepts is a value
 * the column takes. Anything longer used to pass every rule, reach `AiRun.create()`, and come back
 * as the `500` Sequelize's own error is turned into, where `.hora/contracts/1.0.0/client-api.md`
 * says a field carrying a value the schema does not accept is answered `422`.
 *
 * `SUBJECT_LABEL` and `CALLBACK_URL` are `TEXT`, so their columns state no ceiling and these two
 * are chosen here rather than copied:
 *
 * - `SUBJECT_LABEL` is the one line a person reads beside a run. Five hundred characters is
 *   already several lines, so no label anybody writes is refused, while an authenticated client
 *   can no longer write megabytes into one run.
 * - `CALLBACK_URL` is 2048, the length every browser, proxy and server agrees to carry a URL in.
 *   A target longer than that would not survive the hop this service later makes to it.
 *
 * A surrogate pair counts twice in JavaScript and once in the database, so measuring the string
 * refuses a little sooner than the column would. Erring toward refusal is the safe direction.
 */
const AI_RUN_FIELD_MAXIMUM_LENGTH = {
  REQUEST_KEY: 191,
  EXTERNAL_REF: 191,
  CORRELATION_ID: 191,
  SUBJECT_LABEL: 500,
  CALLBACK_URL: 2048,
}

/**
 * Validates the input every run-creating request carries, whichever AI service answers it.
 *
 * **The five fields, and why they are judged together.** Four of them are the common fields of the
 * request body — the caller's own object key, the line a person reads, the id that groups a
 * business object's runs, and where the terminal callback goes. The fifth is the idempotency key,
 * which arrives in a header rather than the body but is required of the same requests and refused
 * the same way. Reaching them all through one `input` is what lets a caller judge the request in
 * one pass, and is why the renderer merges the header into the input before handing it over.
 *
 * **Presence and length are the whole of what is judged here.** Every one of the five is a string
 * the service never interprets, so there is no format to check: the caller's object key is never
 * parsed, the subject label is echoed back untouched, and the callback URL is matched against the
 * client's registered prefix at delivery time, against a record this class does not hold. What is
 * left is that the field was sent and carries something — text that is blank once trimmed is a
 * field nobody filled in — and that what it carries is short enough for the column that stores it.
 * A value too long for its column is a value the schema does not accept, and the contract answers
 * that `422`; judged anywhere later it is the `500` the database driver's own error becomes.
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
   * Check whether a value is text the column behind it can store whole.
   *
   * The untrimmed value is what is measured, because the untrimmed value is what is stored —
   * trimming settles only whether a field counts as filled in.
   *
   * @param {{
   *   value: *
   *   maximumLength: number
   * }} params - Parameters.
   * @returns {boolean} true: the value is a string no longer than the maximum.
   */
  static isStorableText ({
    value,
    maximumLength,
  }) {
    if (typeof value !== 'string') {
      return false
    }

    return value.length <= maximumLength
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
   * service can answer twice, and saying so before the body is judged is the shorter sentence. It
   * is also the one field judged by two rules rather than one, because the contract states two
   * `422` lines for it: the header may not have been sent, and it may have been sent carrying a
   * value the schema does not accept. Every other field folds both questions into one rule, since
   * the contract gives it one line and one answer.
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
        () => this.hasStorableRequestKey(),
        this.errorHash.InvalidIdempotencyKey,
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
   * Check whether the idempotency key is short enough for the column that stores it.
   *
   * @returns {boolean} true: valid.
   */
  hasStorableRequestKey () {
    return this.Ctor.isStorableText({
      value: this.input.requestKey,
      maximumLength: AI_RUN_FIELD_MAXIMUM_LENGTH.REQUEST_KEY,
    })
  }

  /**
   * Check whether the caller's own object key was sent, and fits the column that stores it.
   *
   * @returns {boolean} true: valid.
   */
  isValidExternalRef () {
    const wasSent = this.Ctor.isFilledText({
      value: this.input.externalRef,
    })

    const fitsTheColumn = this.Ctor.isStorableText({
      value: this.input.externalRef,
      maximumLength: AI_RUN_FIELD_MAXIMUM_LENGTH.EXTERNAL_REF,
    })

    return wasSent
      && fitsTheColumn
  }

  /**
   * Check whether the line a person reads was sent, and fits the column that stores it.
   *
   * @returns {boolean} true: valid.
   */
  isValidSubjectLabel () {
    const wasSent = this.Ctor.isFilledText({
      value: this.input.subjectLabel,
    })

    const fitsTheColumn = this.Ctor.isStorableText({
      value: this.input.subjectLabel,
      maximumLength: AI_RUN_FIELD_MAXIMUM_LENGTH.SUBJECT_LABEL,
    })

    return wasSent
      && fitsTheColumn
  }

  /**
   * Check whether the id grouping one business object's runs was sent, and fits its column.
   *
   * @returns {boolean} true: valid.
   */
  isValidCorrelationId () {
    const wasSent = this.Ctor.isFilledText({
      value: this.input.correlationId,
    })

    const fitsTheColumn = this.Ctor.isStorableText({
      value: this.input.correlationId,
      maximumLength: AI_RUN_FIELD_MAXIMUM_LENGTH.CORRELATION_ID,
    })

    return wasSent
      && fitsTheColumn
  }

  /**
   * Check whether the callback target was sent, and fits the column that stores it.
   *
   * @returns {boolean} true: valid.
   */
  isValidCallbackUrl () {
    const wasSent = this.Ctor.isFilledText({
      value: this.input.callbackUrl,
    })

    const fitsTheColumn = this.Ctor.isStorableText({
      value: this.input.callbackUrl,
      maximumLength: AI_RUN_FIELD_MAXIMUM_LENGTH.CALLBACK_URL,
    })

    return wasSent
      && fitsTheColumn
  }
}
