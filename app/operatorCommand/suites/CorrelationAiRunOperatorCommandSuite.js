import BaseAiRunOperatorCommandSuite from '../BaseAiRunOperatorCommandSuite.js'

/*
 * The word an operator types, and why it is this one.
 *
 * `correlation` rather than `correlation-id`: the argument after it is the id, and a word that
 * repeated what its own parameter is would add nothing a reader does not already see. It is a noun
 * naming the chain being asked about, as the other three words are nouns or adjectives naming what
 * is being asked about — none of them is a verb, because none of these commands does anything.
 */
const COMMAND_NAME = 'correlation'

/**
 * The command answering which runs belong to one correlation chain.
 *
 * @extends {BaseAiRunOperatorCommandSuite}
 */
export default class CorrelationAiRunOperatorCommandSuite extends BaseAiRunOperatorCommandSuite {
  /**
   * get: the word an operator types to reach this command.
   *
   * @override
   * @returns {string} The command word.
   */
  static get commandName () {
    return COMMAND_NAME
  }

  /**
   * Check whether the parameter this command was given is one it can answer with.
   *
   * @override
   * @param {{
   *   validator: import('../AiRunOperatorCommandInputValidator.js').default
   * }} params - Parameters.
   * @returns {boolean} true: the correlation id is text the column could hold.
   * @public
   */
  isValidParameter ({
    validator,
  }) {
    return validator.isValidCorrelationId()
  }

  /**
   * Find the runs this command answers with, and the trace rows their rows are built from.
   *
   * The correlation id is read as the text it arrived as. It is the one parameter of the four that
   * this service reads no meaning into, so there is nothing for the adapter to have converted.
   *
   * @override
   * @param {import('../BaseAiRunOperatorCommandSuite.js').FindAiRunAnswerParams} params -
   * Parameters.
   * @returns {Promise<import('../BaseAiRunOperatorCommandSuite.js').AiRunOperatorCommandAnswer>}
   * The runs, their steps and their model calls.
   * @public
   */
  async findAiRunAnswer ({
    finder,
    now,
    runCount,
  }) {
    return finder.findAiRunsByCorrelationId({
      correlationId: this.input.parameterText,
      limit: runCount,
    })
  }

  /**
   * Hand the answer to the reporter, in the shape this command reads as.
   *
   * @override
   * @param {import('../BaseAiRunOperatorCommandSuite.js').ReportAnswerParams} params - Parameters.
   * @returns {void}
   * @public
   */
  reportAnswer ({
    reporter,
    rows,
    aiRunSteps,
  }) {
    reporter.reportAiRunRows({
      rows,
    })
  }
}
