import BaseAiRunOperatorCommandSuite from '../BaseAiRunOperatorCommandSuite.js'

/*
 * The word an operator types, and why it is this one.
 *
 * `failed` alone would not say what the argument after it is, and an instant is the one parameter
 * an operator is most likely to mistake for a count. The particle is carried into the word so that
 * the command reads as the whole question it answers, and it is hyphenated lower case as every
 * other operator-facing string in this repository is — `asset-media-extraction`,
 * `purge-expired-run-content`.
 */
const COMMAND_NAME = 'failed-since'

/**
 * The command answering which runs failed since a given instant.
 *
 * @extends {BaseAiRunOperatorCommandSuite}
 */
export default class FailedSinceAiRunOperatorCommandSuite extends BaseAiRunOperatorCommandSuite {
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
   * @returns {boolean} true: the instant is one this service could have recorded.
   * @public
   */
  isValidParameter ({
    validator,
  }) {
    return validator.isValidFailedSince()
  }

  /**
   * Find the runs this command answers with, and the trace rows their rows are built from.
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
    return finder.findFailedAiRuns({
      failedSince: this.input.failedSince,
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
