import BaseAiRunOperatorCommandSuite from '../BaseAiRunOperatorCommandSuite.js'

/*
 * The word an operator types, and why it is this one.
 *
 * `run` is the shortest word that names what comes back — one run — and it is what the runbook
 * line reads as beside the key pasted after it. It is a noun, as the other three words are.
 */
const COMMAND_NAME = 'run'

/**
 * The command answering with one run and the steps it took, by its run key.
 *
 * **The answer is normalized into the shape every other command answers in.** The finder hands
 * back one run or null, and what the row building above needs is an array — so the run becomes an
 * array of one and a key naming nothing becomes an empty one. That is what lets an unknown key
 * reach `#reportNothingFound()` through the same emptiness test every other command reaches it by,
 * rather than through a second test written for this command alone.
 *
 * @extends {BaseAiRunOperatorCommandSuite}
 */
export default class RunKeyAiRunOperatorCommandSuite extends BaseAiRunOperatorCommandSuite {
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
   * @returns {boolean} true: the run key is text a run could be stored under.
   * @public
   */
  isValidParameter ({
    validator,
  }) {
    return validator.isValidRunKey()
  }

  /**
   * Find the run this command answers with, and the trace rows its row is built from.
   *
   * @override
   * @param {import('../BaseAiRunOperatorCommandSuite.js').FindAiRunAnswerParams} params -
   * Parameters.
   * @returns {Promise<import('../BaseAiRunOperatorCommandSuite.js').AiRunOperatorCommandAnswer>}
   * The run, its steps and its model calls.
   * @public
   */
  async findAiRunAnswer ({
    finder,
    now,
    runCount,
  }) {
    const answer = await finder.findAiRunByRunKey({
      runKey: this.input.parameterText,
    })

    const aiRuns = this.extractFoundAiRuns({
      aiRun: answer.aiRun,
    })

    return {
      aiRuns,
      aiRunSteps: answer.aiRunSteps,
      aiModelCalls: answer.aiModelCalls,
    }
  }

  /**
   * Extract the runs a read by key found, as the many-run commands answer them.
   *
   * @param {{
   *   aiRun: *
   * }} params - Parameters.
   * @returns {Array<*>} The run found, or no run at all.
   * @public
   */
  extractFoundAiRuns ({
    aiRun,
  }) {
    if (aiRun === null) {
      return []
    }

    return [
      aiRun,
    ]
  }

  /**
   * Hand the answer to the reporter, in the shape this command reads as.
   *
   * One run reads as a detail and not as a table of one line, and it is the only command of the
   * four that carries the step trace outward — which is the whole of why the reporter has two
   * answers rather than one.
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
    const [
      row,
    ] = rows

    reporter.reportAiRunDetail({
      row,
      steps: aiRunSteps,
    })
  }
}
