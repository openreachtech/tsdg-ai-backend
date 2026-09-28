import {
  ProcessClerk,
} from '@openreachtech/renchan-job-bullmq'

import AiRunOperatorCommandExecutor from './AiRunOperatorCommandExecutor.js'

import bootstrapSequelize from '../../sequelize/_.js'

/*
 * Where the operator's own arguments begin in what Node hands this process.
 *
 * `process.argv` opens with the Node binary and the script path, so the command word an operator
 * typed is third. `AiRunOperatorCommandInputAdapter` reads the command word at index 0 and its one
 * parameter at index 1 of what it is given, which is the tail this index names — so the two ends
 * agree in one place rather than by two files happening to count the same way.
 */
const COMMAND_ARGUMENT_START_INDEX = 2

/**
 * Runs one operator command against a real database, and ends the process under the code it
 * answered with.
 *
 * **This is the one place that exits, and `AiRunOperatorCommandExecutor` is the one place that
 * decides what to exit with.** The executor returns its code rather than taking it, because a
 * class that called `process.exit()` could not be tested — the first case would take the runner
 * with it. That leaves the acting to somebody, and this is it. `JobDispatcherProvider` already
 * splits the pair the same way: `#generateShutdownExitCode()` decides and
 * `#shutdownJobDispatchers()` hands the number to `ProcessClerk#exit()`.
 *
 * **The database is closed on every path out, and `finally` is what makes that true.** A command
 * that answered, a command that refused the arguments and a command whose read threw all leave
 * through the same block, so none of them can leave a pool open behind them. An entry point that
 * closed only after a successful answer would hang the process on exactly the morning the command
 * exists for — the one where the database is the thing that is wrong. This repository runs Jest
 * with `--detectOpenHandles` for the same class of fault.
 *
 * **`SequelizeActivator` has no close of its own**, which is why the close reaches through it:
 * the installed `@openreachtech/renchan-sequelize` exposes `get sequelize ()` returning the
 * Sequelize client, and `close()` belongs to that client. Nothing here assumes a method on the
 * activator that the package does not have.
 *
 * **Sequelize is activated before the executor is built, and the ordering is the reason the
 * executor arrives as a class rather than as an instance.** Building the executor builds
 * `AiRunOperatorFinder`, which is the thing that reads the models; taking the class and creating
 * it inside the method puts the activation strictly first, with no ordering left for a caller to
 * get wrong.
 *
 * **Nothing here prints.** `AiRunOperatorReporter` owns every character this command itself writes,
 * so this class writes none: `console` is refused by this repository's lint, and a second place
 * that wrote to the terminal would be a second place to audit against section 16's rule about what
 * a scrollback may hold. What this class emits is an exit code, and — when something escapes that
 * no code covers, such as a database that will not open at all — whatever the runtime prints for
 * an uncaught error. That is the reporting mechanism `scripts/stopJobSchedulers.js` already relies
 * on, and it still ends the process non-zero.
 *
 * **"Every character this command writes" is narrower than "every character on standard output",
 * and the difference is Sequelize.** `sequelize/config.cjs` sets `logging: false` for development
 * only; `live`, `staging` and `production` leave the key unset, and Sequelize then defaults it to
 * `console.log`. So in those environments each of the three reads echoes an `Executing (default):
 * SELECT …` line, interleaved with the report. **The content rule still holds** — those statements
 * select no column section 7 counts as content, and carry none in any condition; what is lost is
 * the single place to audit, and a report clean enough to paste into a runbook. Fixing it belongs
 * to that config rather than here, because `SequelizeActivator.createAsync()` accepts no logging
 * option to pass.
 */
export default class AiRunOperatorCommandLauncher {
  /**
   * Constructor.
   *
   * @param {AiRunOperatorCommandLauncherParams} params - Parameters.
   */
  constructor ({
    processClerk,
    AiRunOperatorCommandExecutorCtor,
  }) {
    this.processClerk = processClerk
    this.AiRunOperatorCommandExecutorCtor = AiRunOperatorCommandExecutorCtor
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunOperatorCommandLauncher ? X : never} T, X
   * @param {AiRunOperatorCommandLauncherFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    processClerk = this.createProcessClerk(),
    AiRunOperatorCommandExecutorCtor = AiRunOperatorCommandExecutor,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        processClerk,
        AiRunOperatorCommandExecutorCtor,
      })
    )
  }

  /**
   * Create the clerk this process reads its arguments from and ends through.
   *
   * @returns {ProcessClerk} Clerk.
   * @public
   */
  static createProcessClerk () {
    return ProcessClerk.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunOperatorCommandLauncher} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunOperatorCommandLauncher} */ (this.constructor)
  }

  /**
   * Run the command this process was given, and end the process under the code it answered with.
   *
   * @returns {Promise<void>}
   * @public
   */
  async startCommandProcess () {
    const argumentTexts = this.extractArgumentTexts()

    const exitCode = await this.generateCommandExitCode({
      argumentTexts,
    })

    this.processClerk.exit({
      exitCode,
    })
  }

  /**
   * Extract the arguments the operator typed, without the two Node puts in front of them.
   *
   * @returns {Array<string>} The arguments.
   * @public
   */
  extractArgumentTexts () {
    return this.processClerk.process.argv
      .slice(COMMAND_ARGUMENT_START_INDEX)
  }

  /**
   * Generate the code the process ends under, by opening the database, running the command, and
   * closing the database whatever the command did.
   *
   * The code is the executor's and is never invented here: this method adds the database to either
   * side of the call and changes nothing in between. A refusal is a returned code like any other,
   * so it leaves through the same `finally` an answer does.
   *
   * @param {{
   *   argumentTexts: Array<string>
   * }} params - Parameters.
   * @returns {Promise<number>} The exit code.
   * @public
   */
  async generateCommandExitCode ({
    argumentTexts,
  }) {
    const activator = await this.activateSequelize()

    try {
      const executor = this.createAiRunOperatorCommandExecutor()

      const exitCode = await executor.executeCommand({
        argumentTexts,
      })

      return exitCode
    } finally {
      await this.closeSequelize({
        activator,
      })
    }
  }

  /**
   * Activate Sequelize, the way a process that is not the server does it here.
   *
   * @returns {Promise<import('@openreachtech/renchan-sequelize').SequelizeActivator>} The
   * activator, which holds the client the close reaches through.
   * @public
   */
  async activateSequelize () {
    return bootstrapSequelize()
  }

  /**
   * Create the executor that answers the command.
   *
   * @returns {AiRunOperatorCommandExecutor} Executor.
   * @public
   */
  createAiRunOperatorCommandExecutor () {
    return this.AiRunOperatorCommandExecutorCtor.create()
  }

  /**
   * Close the database this command opened.
   *
   * @param {{
   *   activator: import('@openreachtech/renchan-sequelize').SequelizeActivator
   * }} params - Parameters.
   * @returns {Promise<void>}
   * @public
   */
  async closeSequelize ({
    activator,
  }) {
    await activator.sequelize
      .close()
  }
}

/**
 * @typedef {{
 *   processClerk: ProcessClerk
 *   AiRunOperatorCommandExecutorCtor: typeof AiRunOperatorCommandExecutor
 * }} AiRunOperatorCommandLauncherParams
 */

/**
 * @typedef {Partial<AiRunOperatorCommandLauncherParams>} AiRunOperatorCommandLauncherFactoryParams
 */
