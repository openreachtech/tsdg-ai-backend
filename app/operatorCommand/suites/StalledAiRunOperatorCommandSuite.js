import BaseAiRunOperatorCommandSuite from '../BaseAiRunOperatorCommandSuite.js'

/*
 * The word an operator types, and why it is this one.
 *
 * It names the question — runs that have been running longer than a threshold — and it is an
 * adjective rather than a verb, as all four of these words are. A command vocabulary made of verbs
 * offers an action; this one offers nothing to do, which is the fourth acceptance criterion of
 * `#operator-cli` said in the only place an operator reads before running anything.
 */
const COMMAND_NAME = 'stalled'

/**
 * The command answering which runs have been running longer than a given number of seconds.
 *
 * @extends {BaseAiRunOperatorCommandSuite}
 */
export default class StalledAiRunOperatorCommandSuite extends BaseAiRunOperatorCommandSuite {
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
   * @returns {boolean} true: the threshold is a count of seconds within bounds.
   * @public
   */
  isValidParameter ({
    validator,
  }) {
    return validator.isValidStalledForSeconds()
  }

  /**
   * Find the runs this command answers with, and the trace rows their rows are built from.
   *
   * The instant is the executor's own and not one read here, so every row of one answer measures
   * its elapsed time against the same clock reading.
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
    return finder.findStalledAiRuns({
      stalledForSeconds: this.input.stalledForSeconds,
      now,
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
