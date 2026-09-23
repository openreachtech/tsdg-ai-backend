/**
 * Base class of an input validator.
 *
 * **What a subclass declares, and what this runs.** A subclass overrides
 * `#generateValidationEntries()` alone, returning `[predicate, errorCtor]` pairs. This class holds
 * the input and the error hash, runs the predicates in the order they were declared, and answers
 * with the error of the first one that failed. A rule is therefore a boolean method and nothing
 * else — never a throw, never a message, never a status code.
 *
 * **Why the error is returned rather than raised.** The error hash is handed in by the caller, so
 * what an entry names is whatever that caller's hash holds: a GraphQL error class on one surface,
 * a `RestfulApiResponse` subclass on the other. Returning the identity leaves the caller to raise
 * it the way its own surface raises things — a resolver throws, a renderer returns a response —
 * and keeps this class ignorant of both.
 */
export default class BaseInputValidator {
  /**
   * Constructor.
   *
   * @param {BaseInputValidatorParams} params - Parameters.
   */
  constructor ({
    input,
    errorHash,
  }) {
    this.input = input
    this.errorHash = errorHash
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof BaseInputValidator ? X : never} T, X
   * @param {BaseInputValidatorParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    input,
    errorHash,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        input,
        errorHash,
      })
    )
  }

  /**
   * Validate the input against every rule declared, and answer with the first failure.
   *
   * @returns {ValidationErrorCtor | null} The failing rule's error, or null when every rule passed.
   * @public
   */
  validateInput () {
    const failedEntry = this.generateValidationEntries()
      .find(([passesRule]) => !passesRule())

    if (!failedEntry) {
      return null
    }

    const [, ErrorCtor] = failedEntry

    return ErrorCtor
  }

  /**
   * Generate the rules this input is judged by, in the order they are judged.
   *
   * @abstract
   * @returns {Array<[() => boolean, ValidationErrorCtor]>} Validation entries.
   * @throws {Error} When a subclass has not declared its rules.
   */
  generateValidationEntries () {
    throw new Error(`${this.constructor.name}#generateValidationEntries() must be inherited`)
  }
}

/**
 * @typedef {{
 *   input: Record<string, *>
 *   errorHash: Record<string, ValidationErrorCtor>
 * }} BaseInputValidatorParams
 */

/**
 * @typedef {*} ValidationErrorCtor
 */
