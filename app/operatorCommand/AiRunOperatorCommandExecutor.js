import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunOperatorFinder from './AiRunOperatorFinder.js'
import AiRunOperatorReporter from './AiRunOperatorReporter.js'

import AiRunOperatorCommandInputAdapter from './AiRunOperatorCommandInputAdapter.js'
import AiRunOperatorCommandInputValidator from './AiRunOperatorCommandInputValidator.js'

import CorrelationAiRunOperatorCommandSuite from './suites/CorrelationAiRunOperatorCommandSuite.js'
import FailedSinceAiRunOperatorCommandSuite from './suites/FailedSinceAiRunOperatorCommandSuite.js'
import RunKeyAiRunOperatorCommandSuite from './suites/RunKeyAiRunOperatorCommandSuite.js'
import StalledAiRunOperatorCommandSuite from './suites/StalledAiRunOperatorCommandSuite.js'

import AiRunPageResponseBuilder from '../aiRun/AiRunPageResponseBuilder.js'

import AI_RUN_PAGE_CONSTANT_HASH from '../constants/aiRunPageConstants.js'

import {
  env,
  rootPath,
} from '../globals/_.js'

const {
  AI_RUN_PAGE,
} = AI_RUN_PAGE_CONSTANT_HASH

/*
 * Every command this version offers, and the whole of the dispatch.
 *
 * A command word resolves to a class by asking each class what word it answers to, so the word
 * lives once — in the class that owns it — and a fifth command is a file added and a name appended
 * here. `else if` and `switch` are both refused by this repository's lint for the reason this array
 * exists: either of them would make adding a command an edit to the four already working.
 */
const AI_RUN_OPERATOR_COMMAND_SUITE_CTORS = [
  StalledAiRunOperatorCommandSuite,
  FailedSinceAiRunOperatorCommandSuite,
  RunKeyAiRunOperatorCommandSuite,
  CorrelationAiRunOperatorCommandSuite,
]

/*
 * The three codes a command ends under, and why returning one is not the same as exiting with it.
 *
 * `0` says the command answered — including the answer that nothing matched, which is a true
 * answer and not a failure. `1` says it could not answer: the database would not open, or the read
 * threw. `2` says the operator's own arguments were not a command this offers, which is a
 * different thing from the service being unwell and is worth a scheduled task being able to tell
 * apart.
 *
 * `JobDispatcherProvider` already declares its two the same way, as module constants returned by a
 * method rather than handed to `process.exit()`. Returning is what makes the whole of a command
 * testable: a class that exited would take the test runner with it, and nothing above it could
 * ever assert which code it chose. Acting on the code is the entry point's job.
 */
const SUCCESSFUL_COMMAND_EXIT_CODE = 0
const FAILED_COMMAND_EXIT_CODE = 1
const MALFORMED_ARGUMENT_EXIT_CODE = 2

/*
 * How many runs one answer carries.
 *
 * It is the page ceiling `GET /v1/ai-runs` is already held to rather than a second number invented
 * for a terminal. The bound exists because each run in an answer carries facts read from two
 * further tables, and that is as true of a scrollback as it is of a response body.
 */
const ANSWERED_RUN_COUNT = AI_RUN_PAGE.MAXIMUM_RUN_COUNT

const UNANSWERED_COMMAND_TAGS = [
  'AiRunOperatorCommand',
  'UnansweredCommand',
]

const LOG_FILE_PATH = rootPath.to('logs/ai-run-operator-command-')

const mentsuLogger = MentsuLogger.create({
  filePath: LOG_FILE_PATH,
  env,
})

/**
 * Runs one operator command and answers with the code the process should end under.
 *
 * **It never calls `process.exit()`, and that is the design rather than an omission.** A class that
 * ended the process could not be tested at all — the first case would take the runner with it — so
 * the code is returned and `scripts/` acts on it. It is the shape `JobDispatcherProvider` already
 * uses for its own two codes.
 *
 * **Nothing here reaches the service.** The finder opens the database directly and no file in this
 * layer imports anything under `server/`, which is the second use case of `#operator-cli`: an
 * operator reads what the runs are doing while the API will not boot, so the command may not
 * depend on the API booting.
 *
 * **Nothing here writes, and the vocabulary says so.** The three collaborators are a finder, a row
 * builder and a reporter; the suite contract has a `find~` and a `report~` and nothing else; and
 * every command word is a noun or an adjective. There is no `save~`, no `create~` of a row, no
 * `destroy`, and no transaction anywhere under `app/operatorCommand/` — the fourth acceptance
 * criterion held by the naming rule, so that a write could not be added without being named as one.
 *
 * **The row an operator reads is the row a client reads.** `AiRunPageResponseBuilder` builds it,
 * and this class does not assemble a field of it: a second row shaper would be a second answer to
 * "what does a run look like" and the two would drift. The field section 16 forbids travels in
 * that row and is dropped by the reporter, which owns every character this command itself writes —
 * this class prints nothing, so there is no second place to audit. (Outside development Sequelize
 * echoes each query to standard output as well; `AiRunOperatorCommandLauncher` records why, and
 * those statements carry no content.)
 *
 * **One clock reading answers the whole command.** The instant is taken once and handed both to
 * the read and to every row built from it, so a run's elapsed time is measured against the same
 * moment the threshold was.
 */
export default class AiRunOperatorCommandExecutor {
  /**
   * Constructor.
   *
   * @param {AiRunOperatorCommandExecutorParams} params - Parameters.
   */
  constructor ({
    aiRunOperatorFinder,
    aiRunOperatorReporter,
    aiRunPageResponseBuilder,
    now,
  }) {
    this.aiRunOperatorFinder = aiRunOperatorFinder
    this.aiRunOperatorReporter = aiRunOperatorReporter
    this.aiRunPageResponseBuilder = aiRunPageResponseBuilder
    this.now = now
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunOperatorCommandExecutor ? X : never} T, X
   * @param {AiRunOperatorCommandExecutorFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunOperatorFinder = this.createAiRunOperatorFinder(),
    aiRunOperatorReporter = this.createAiRunOperatorReporter(),
    aiRunPageResponseBuilder = this.createAiRunPageResponseBuilder(),
    now = this.generateCurrentInstant(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunOperatorFinder,
        aiRunOperatorReporter,
        aiRunPageResponseBuilder,
        now,
      })
    )
  }

  /**
   * get: the logger client this process writes an unanswered command through.
   *
   * @returns {MentsuLogger} Logger client.
   */
  static get mentsuLogger () {
    return mentsuLogger
  }

  /**
   * get: every command this version offers.
   *
   * @returns {Array<typeof import('./BaseAiRunOperatorCommandSuite.js').default>} The commands.
   */
  static get commandSuiteCtors () {
    return AI_RUN_OPERATOR_COMMAND_SUITE_CTORS
  }

  /**
   * Create the reader that answers every command.
   *
   * @returns {AiRunOperatorFinder} Finder.
   * @public
   */
  static createAiRunOperatorFinder () {
    return AiRunOperatorFinder.create()
  }

  /**
   * Create the writer that every character this process prints goes through.
   *
   * @returns {AiRunOperatorReporter} Reporter.
   * @public
   */
  static createAiRunOperatorReporter () {
    return AiRunOperatorReporter.create()
  }

  /**
   * Create the builder that shapes one run into the row a list row already reads as.
   *
   * @returns {AiRunPageResponseBuilder} Builder.
   * @public
   */
  static createAiRunPageResponseBuilder () {
    return AiRunPageResponseBuilder.create()
  }

  /**
   * Generate the instant the whole command is measured against.
   *
   * @returns {Date} The instant.
   * @public
   */
  static generateCurrentInstant () {
    return new Date()
  }

  /**
   * Extract the command a word names.
   *
   * @param {{
   *   commandName: string | null
   * }} params - Parameters.
   * @returns {typeof import('./BaseAiRunOperatorCommandSuite.js').default | null} The command, or
   * null when no command answers to that word.
   * @public
   */
  static extractCommandSuiteCtor ({
    commandName,
  }) {
    return this.commandSuiteCtors
      .find(CommandSuiteCtor =>
        CommandSuiteCtor.commandName === commandName
      )
      ?? null
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunOperatorCommandExecutor} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunOperatorCommandExecutor} */ (this.constructor)
  }

  /**
   * Run the command these arguments name, and answer with the code the process should end under.
   *
   * The three refusals are one code because they are one thing said three ways: the arguments were
   * not a command this offers. An operator who typed a word that is not a command, who left the
   * parameter off, and who wrote a parameter the command cannot read are all told to look at what
   * they typed, and a scheduled task reading the code alone can tell that from a service that
   * could not answer.
   *
   * @param {{
   *   argumentTexts: Array<string>
   * }} params - Parameters.
   * @returns {Promise<number>} The exit code.
   * @public
   */
  async executeCommand ({
    argumentTexts,
  }) {
    const inputAdapter = this.createInputAdapter({
      argumentTexts,
    })

    const input = inputAdapter.buildInput()

    const CommandSuiteCtor = this.Ctor.extractCommandSuiteCtor({
      commandName: input.commandName,
    })

    if (CommandSuiteCtor === null) {
      return MALFORMED_ARGUMENT_EXIT_CODE
    }

    const validator = this.createInputValidator({
      input,
    })

    if (!validator.hasParameter()) {
      return MALFORMED_ARGUMENT_EXIT_CODE
    }

    const commandSuite = CommandSuiteCtor.create({
      input,
    })

    if (
      !commandSuite.isValidParameter({
        validator,
      })
    ) {
      return MALFORMED_ARGUMENT_EXIT_CODE
    }

    return this.answerCommand({
      commandSuite,
    })
  }

  /**
   * Create the reading of the arguments.
   *
   * @param {{
   *   argumentTexts: Array<string>
   * }} params - Parameters.
   * @returns {AiRunOperatorCommandInputAdapter} Adapter.
   * @public
   */
  createInputAdapter ({
    argumentTexts,
  }) {
    return AiRunOperatorCommandInputAdapter.create({
      argumentTexts,
    })
  }

  /**
   * Create the judging of the parameter.
   *
   * @param {{
   *   input: import('./AiRunOperatorCommandInputAdapter.js').AiRunOperatorCommandInput
   * }} params - Parameters.
   * @returns {AiRunOperatorCommandInputValidator} Validator.
   * @public
   */
  createInputValidator ({
    input,
  }) {
    return AiRunOperatorCommandInputValidator.create({
      input,
    })
  }

  /**
   * Answer a command whose arguments have already been judged.
   *
   * **A read that threw ends the command and is not raised further.** This is the top of the
   * process, so there is nobody above to react: the line is written to the log and the code says
   * the command could not answer. Nothing of the failure is printed, because the reporter is the
   * only thing that prints and what it prints is runs.
   *
   * @param {{
   *   commandSuite: import('./BaseAiRunOperatorCommandSuite.js').default
   * }} params - Parameters.
   * @returns {Promise<number>} The exit code.
   * @public
   */
  async answerCommand ({
    commandSuite,
  }) {
    try {
      const answer = await commandSuite.findAiRunAnswer({
        finder: this.aiRunOperatorFinder,
        now: this.now,
        runCount: ANSWERED_RUN_COUNT,
      })

      const rows = this.buildAiRunRows({
        answer,
      })

      this.reportAnswer({
        commandSuite,
        rows,
        aiRunSteps: answer.aiRunSteps,
      })

      return SUCCESSFUL_COMMAND_EXIT_CODE
    } catch (error) {
      this.reportFailure({
        commandSuite,
        error,
      })

      return FAILED_COMMAND_EXIT_CODE
    }
  }

  /**
   * Build the row each run this command found reads as.
   *
   * @param {{
   *   answer: import('./BaseAiRunOperatorCommandSuite.js').AiRunOperatorCommandAnswer
   * }} params - Parameters.
   * @returns {Array<*>} The rows.
   * @public
   */
  buildAiRunRows ({
    answer,
  }) {
    const {
      aiRuns,
      aiRunSteps,
      aiModelCalls,
    } = answer

    return aiRuns.map(aiRun =>
      this.aiRunPageResponseBuilder.buildAiRunRowResponse({
        aiRun,
        aiRunSteps,
        aiModelCalls,
        now: this.now,
      })
    )
  }

  /**
   * Hand what the command found to the reporter.
   *
   * **Nothing found is an answer and reads as one.** A command that matched no run reaches
   * `#reportNothingFound()` rather than a table with a header and no lines under it, because an
   * empty table and a table that failed to fill look the same in a scrollback and an operator has
   * no second place to check.
   *
   * @param {ReportAnswerParams} params - Parameters.
   * @returns {void}
   * @public
   */
  reportAnswer ({
    commandSuite,
    rows,
    aiRunSteps,
  }) {
    if (rows.length === 0) {
      this.aiRunOperatorReporter.reportNothingFound({
        label: commandSuite.Ctor.commandName,
      })

      return
    }

    commandSuite.reportAnswer({
      reporter: this.aiRunOperatorReporter,
      rows,
      aiRunSteps,
    })
  }

  /**
   * Write the line that says a command could not answer.
   *
   * The command word and the failure's **name**, and no parameter the operator typed: a
   * correlation id or a run key in a log line is a caller's value written where nothing purges it.
   *
   * **The message is deliberately not logged, and the reason is that it carries the parameter by
   * a route nothing here controls.** A Sequelize `DatabaseError` is constructed from its driver's
   * message, and the driver builds that message by appending the failing SQL — into which the
   * `where` value has already been escaped inline. So logging `error.message` would write the run
   * key or the correlation id the operator typed into a file with no retention clock, while this
   * very docblock said it did not. `BaseAiRunPurgeJobWorker` reached the same conclusion for the
   * same reason and logs the name alone.
   *
   * What is given up is the driver's own wording; what is kept is which class of failure it was,
   * which is what tells a nightly job from an outage.
   *
   * @param {{
   *   commandSuite: import('./BaseAiRunOperatorCommandSuite.js').default
   *   error: Error
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  reportFailure ({
    commandSuite,
    error,
  }) {
    const message = [
      `${this.Ctor.name}#executeCommand() could not answer`,
      `${commandSuite.Ctor.commandName}: ${error.name}`,
    ].join(' ')

    this.Ctor.mentsuLogger.error({
      message,
      tags: UNANSWERED_COMMAND_TAGS,
    })
  }
}

/**
 * @typedef {{
 *   aiRunOperatorFinder: AiRunOperatorFinder
 *   aiRunOperatorReporter: AiRunOperatorReporter
 *   aiRunPageResponseBuilder: AiRunPageResponseBuilder
 *   now: Date
 * }} AiRunOperatorCommandExecutorParams
 */

/**
 * @typedef {Partial<AiRunOperatorCommandExecutorParams>} AiRunOperatorCommandExecutorFactoryParams
 */

/**
 * @typedef {{
 *   commandSuite: import('./BaseAiRunOperatorCommandSuite.js').default
 *   rows: Array<*>
 *   aiRunSteps: Array<*>
 * }} ReportAnswerParams
 */
