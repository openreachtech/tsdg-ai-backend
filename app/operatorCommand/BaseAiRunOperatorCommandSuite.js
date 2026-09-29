/**
 * Base class of one operator command.
 *
 * **One class per command, and the command word is the only key.** Four questions an operator asks
 * — stalled past a threshold, failed since an instant, one run, one correlation chain — differ in
 * four small ways each: the word that names them, the rule their parameter is judged by, the
 * finder method that answers them, and whether the answer reads as a page of rows or as one run.
 * Held as four branches those four differences would be four places to edit for a fifth command,
 * and `else if` and `switch` are both refused here for exactly that reason. Held as four subclasses
 * they are one file to add and one entry to register.
 *
 * **What a suite may not do is as much of the contract as what it must.** Every member below is a
 * `find~` or a `report~`: there is no `save~`, no `create~` and no transaction anywhere in this
 * layer, so a subclass that wanted to change a run's state would have to be named for it. That is
 * the fourth acceptance criterion of `#operator-cli` made checkable by the verb table rather than
 * by a reviewer's memory.
 *
 * **A suite holds the input and nothing else.** It reads its own parameter off it, so no argument
 * is relayed from the executor into the finder through this class.
 */
export default class BaseAiRunOperatorCommandSuite {
  /**
   * Constructor.
   *
   * @param {BaseAiRunOperatorCommandSuiteParams} params - Parameters.
   */
  constructor ({
    input,
  }) {
    this.input = input
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof BaseAiRunOperatorCommandSuite ? X : never} T, X
   * @param {BaseAiRunOperatorCommandSuiteParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    input,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        input,
      })
    )
  }

  /**
   * get: the word an operator types to reach this command.
   *
   * @abstract
   * @returns {string} The command word.
   * @throws {Error} When a subclass has not named its command word.
   */
  static get commandName () {
    throw new Error(`${this.name}.get:commandName must be inherited`)
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof BaseAiRunOperatorCommandSuite} The class.
   */
  get Ctor () {
    return /** @type {typeof BaseAiRunOperatorCommandSuite} */ (this.constructor)
  }

  /**
   * Check whether the parameter this command was given is one it can answer with.
   *
   * A suite names the rule it is judged by and states no rule of its own — every bound lives in
   * `AiRunOperatorCommandInputValidator`, so two commands reading the same kind of parameter are
   * held to one rule rather than to two that drift.
   *
   * @abstract
   * @param {{
   *   validator: import('./AiRunOperatorCommandInputValidator.js').default
   * }} params - Parameters.
   * @returns {boolean} true: the parameter is one this command can answer with.
   * @throws {Error} When a subclass has not named the rule it is judged by.
   * @public
   */
  isValidParameter ({
    validator,
  }) {
    throw new Error(`${this.constructor.name}#isValidParameter() must be inherited`)
  }

  /**
   * Find the runs this command answers with, and the trace rows their rows are built from.
   *
   * The answer is the same shape for every command, the one-run command included, so that the row
   * building above it is one method rather than one per command.
   *
   * @abstract
   * @param {FindAiRunAnswerParams} params - Parameters.
   * @returns {Promise<AiRunOperatorCommandAnswer>} The runs, their steps and their model calls.
   * @throws {Error} When a subclass has not named the read that answers it.
   * @public
   */
  async findAiRunAnswer ({
    finder,
    now,
    runCount,
  }) {
    throw new Error(`${this.constructor.name}#findAiRunAnswer() must be inherited`)
  }

  /**
   * Hand the answer to the reporter, in the shape this command reads as.
   *
   * Which of the reporter's two answers a command uses is the command's own fact, so it is stated
   * by the command rather than decided by a flag read above it. Nothing here writes to a terminal:
   * the reporter owns every character this command itself writes, which is what keeps the fields
   * section 7 counts as content out of a scrollback that has no retention clock.
   *
   * @abstract
   * @param {ReportAnswerParams} params - Parameters.
   * @returns {void}
   * @throws {Error} When a subclass has not named the answer it reports.
   * @public
   */
  reportAnswer ({
    reporter,
    rows,
    aiRunSteps,
  }) {
    throw new Error(`${this.constructor.name}#reportAnswer() must be inherited`)
  }
}

/**
 * @typedef {{
 *   input: import('./AiRunOperatorCommandInputAdapter.js').AiRunOperatorCommandInput
 * }} BaseAiRunOperatorCommandSuiteParams
 */

/**
 * @typedef {{
 *   finder: *
 *   now: Date
 *   runCount: number
 * }} FindAiRunAnswerParams
 */

/**
 * @typedef {{
 *   reporter: *
 *   rows: Array<*>
 *   aiRunSteps: Array<*>
 * }} ReportAnswerParams
 */

/**
 * @typedef {{
 *   aiRuns: Array<*>
 *   aiRunSteps: Array<*>
 *   aiModelCalls: Array<*>
 * }} AiRunOperatorCommandAnswer
 */
