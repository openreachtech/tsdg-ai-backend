/*
 * Where each argument sits in what the entry point hands over.
 *
 * The entry point passes the tail of `process.argv` — the command word first, its one parameter
 * second — so the two positions are named here rather than written as bare numbers at the two
 * places that read them.
 */
const COMMAND_NAME_INDEX = 0
const PARAMETER_TEXT_INDEX = 1

/**
 * Reads the arguments an operator command was given and hands back one input.
 *
 * **It judges nothing, and it is the only class that knows the input arrived as text.** Argv
 * carries strings and nothing else, which is the shape `AiRunsQueryInputAdapter` already reads a
 * query string in, so the reading is split from the judging the same way: the two parameters that
 * are not text — a count of seconds and an instant — are converted here and are a number and a
 * `Date` everywhere downstream, and a value that converts to nothing comes through as `NaN` or as
 * an invalid `Date` rather than as a refusal. Whether a caller may send one is a rule, and rules
 * belong to `AiRunOperatorCommandInputValidator`.
 *
 * **Both conversions are made whatever the command word is.** Which of the four fields a command
 * reads is the command's own business, and asking that question here would put a second dispatch
 * on the command word in the one class that is supposed to be reading text. Converting both costs
 * a `Number()` and a `new Date()` on one argument.
 *
 * **An argument the operator did not give is null, and never a default.** A command with no
 * parameter is refused, and the refusal is only possible while "nothing was given" is still
 * distinguishable from "something was given that converts to nothing".
 *
 * **Only the two positions above are read.** No command this version offers takes a second
 * parameter, so nothing beyond them is looked at; a command that takes one reads it here.
 */
export default class AiRunOperatorCommandInputAdapter {
  /**
   * Constructor.
   *
   * @param {AiRunOperatorCommandInputAdapterParams} params - Parameters.
   */
  constructor ({
    argumentTexts,
  }) {
    this.argumentTexts = argumentTexts
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunOperatorCommandInputAdapter ? X : never} T, X
   * @param {AiRunOperatorCommandInputAdapterParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    argumentTexts,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        argumentTexts,
      })
    )
  }

  /**
   * Extract the argument at one position.
   *
   * @param {{
   *   argumentTexts: Array<string>
   *   index: number
   * }} params - Parameters.
   * @returns {string | null} The argument, or null when the operator gave none there.
   * @public
   */
  static extractArgumentText ({
    argumentTexts,
    index,
  }) {
    return argumentTexts[index]
      ?? null
  }

  /**
   * Read an argument as the count of seconds it is meant to be.
   *
   * An argument the operator did not give stays null, because a count nobody asked for is not
   * zero. Anything else goes through `Number()` and comes out as whatever that makes of it,
   * `NaN` included — this method's promise is that the field is a number or null, and not that
   * the number means anything.
   *
   * @param {{
   *   value: string | null
   * }} params - Parameters.
   * @returns {number | null} The count, or null when the operator gave none.
   * @public
   */
  static generateCount ({
    value,
  }) {
    if (value === null) {
      return null
    }

    return Number(value)
  }

  /**
   * Read an argument as the instant it is meant to be.
   *
   * The same promise the count above makes: the field is a `Date` or null, and an argument no
   * calendar can read comes out as an invalid `Date` for `AiRunInstantInspector` to refuse.
   *
   * @param {{
   *   value: string | null
   * }} params - Parameters.
   * @returns {Date | null} The instant, or null when the operator gave none.
   * @public
   */
  static generateInstant ({
    value,
  }) {
    if (value === null) {
      return null
    }

    return new Date(value)
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunOperatorCommandInputAdapter} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunOperatorCommandInputAdapter} */ (this.constructor)
  }

  /**
   * Build the one input a command is dispatched and judged by.
   *
   * @returns {AiRunOperatorCommandInput} Input.
   * @public
   */
  buildInput () {
    const commandName = this.Ctor.extractArgumentText({
      argumentTexts: this.argumentTexts,
      index: COMMAND_NAME_INDEX,
    })

    const parameterText = this.Ctor.extractArgumentText({
      argumentTexts: this.argumentTexts,
      index: PARAMETER_TEXT_INDEX,
    })

    const stalledForSeconds = this.Ctor.generateCount({
      value: parameterText,
    })

    const failedSince = this.Ctor.generateInstant({
      value: parameterText,
    })

    return {
      commandName,
      parameterText,
      stalledForSeconds,
      failedSince,
    }
  }
}

/**
 * @typedef {{
 *   argumentTexts: Array<string>
 * }} AiRunOperatorCommandInputAdapterParams
 */

/**
 * @typedef {{
 *   commandName: string | null
 *   parameterText: string | null
 *   stalledForSeconds: number | null
 *   failedSince: Date | null
 * }} AiRunOperatorCommandInput
 */
