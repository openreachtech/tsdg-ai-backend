import {
  ProcessClerk,
} from '@openreachtech/renchan-job-bullmq'

import API_CLIENT_SECRET_ROTATION_CONSTANT_HASH from '../constants/apiClientSecretRotationConstants.js'

import ApiClientSecretRotator from './ApiClientSecretRotator.js'

import bootstrapSequelize from '../../sequelize/_.js'

const {
  API_CLIENT_SECRET_ROTATION_OUTCOME,
} = API_CLIENT_SECRET_ROTATION_CONSTANT_HASH

/*
 * `process.argv` opens with the Node binary and the script path, so the one parameter an operator
 * typed begins at index 2.
 */
const ARGUMENT_OFFSET = 2

const USAGE_TEXT = [
  'usage: NODE_ENV=<environment> node scripts/rotateApiClientSecret.js <client key>',
  '',
  '  <client key>  the value the client sends as its x-ort-client-id header',
  '',
  'The client goes on signing with the secret it already holds until it is changed: both are',
  'accepted until the previous one is retired. Retire it with:',
  '',
  '  NODE_ENV=<environment> node scripts/retireApiClientPreviousSecret.js <client key>',
  '',
  'example:',
  '  NODE_ENV=production node scripts/rotateApiClientSecret.js 0123456789abcdef',
].join('\n')

/*
 * `ProcessClerk#exit()` reads `exitCode` and defaults it to 0, so a call naming the field anything
 * else exits successfully however loudly the refusal was printed - which is a command whose
 * failure no caller can detect.
 */
const SUCCESS_EXIT_CODE = 0
const REFUSED_EXIT_CODE = 1

/*
 * A rotation that did not happen exits non-zero, so a script driving this command stops rather
 * than going on to tell somebody a secret was replaced when it was not.
 */
const OUTCOME_EXIT_CODE_HASH = {
  [API_CLIENT_SECRET_ROTATION_OUTCOME.ROTATED]: SUCCESS_EXIT_CODE,
  [API_CLIENT_SECRET_ROTATION_OUTCOME.ROTATION_ALREADY_UNDER_WAY]: REFUSED_EXIT_CODE,
  [API_CLIENT_SECRET_ROTATION_OUTCOME.CLIENT_NOT_FOUND]: REFUSED_EXIT_CODE,
}

const LINE_BREAK = '\n'

/**
 * Issues one registered caller a new secret from the command line, and prints it once.
 *
 * **The new secret is printed once and can never be printed again**, for the same reason
 * registration's is: it is stored encrypted, the model's default scope does not select the column,
 * and nothing in this repository decrypts one for display. Capture it as it appears and hand it
 * over through a channel that is not this terminal's scrollback.
 *
 * **Nothing stops working when this runs.** The secret being replaced moves into the column the
 * signature verifier reads second, so the client's requests go on being accepted while it is still
 * configured with the old value. What ends that window is the retirement command, which the
 * operator runs once the client says it has changed over.
 *
 * **`NODE_ENV` comes from the caller and is not written here**, as it is for every other command
 * that writes to a deployment's own database. Unset, the environment barrel throws before anything
 * connects.
 */
export default class ApiClientSecretRotationCommandLauncher {
  /**
   * Constructor.
   *
   * @param {ApiClientSecretRotationCommandLauncherParams} params - Parameters.
   */
  constructor ({
    processClerk,
    rotator,
    sink,
  }) {
    this.processClerk = processClerk
    this.rotator = rotator
    this.sink = sink
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof ApiClientSecretRotationCommandLauncher ? X : never} T, X
   * @param {ApiClientSecretRotationCommandLauncherFactoryParams} [params] - Parameters.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   */
  static create ({
    processClerk = this.createProcessClerk(),
    rotator = this.createRotator(),
    sink = this.defaultSink,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        processClerk,
        rotator,
        sink,
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
   * Create the rotator that does the work.
   *
   * @returns {ApiClientSecretRotator} Rotator.
   * @public
   */
  static createRotator () {
    return ApiClientSecretRotator.create()
  }

  /**
   * get: where the report is written, so a test collects the text instead of printing it.
   *
   * @returns {{ write: (text: string) => * }} Sink.
   * @public
   */
  static get defaultSink () {
    return process.stdout
  }

  /**
   * get: own constructor.
   *
   * @returns {typeof ApiClientSecretRotationCommandLauncher} This class.
   * @public
   */
  get Ctor () {
    return /** @type {typeof ApiClientSecretRotationCommandLauncher} */ (this.constructor)
  }

  /**
   * Run the command, from arguments to a written report.
   *
   * @returns {Promise<null>} Nothing.
   * @public
   */
  async startCommandProcess () {
    const clientKey = this.extractClientKey()

    if (!clientKey) {
      this.writeLine({
        text: 'a client key is required',
      })
      this.writeLine({
        text: USAGE_TEXT,
      })

      this.processClerk.exit({
        exitCode: REFUSED_EXIT_CODE,
      })

      return null
    }

    await bootstrapSequelize()

    const outcome = await this.rotator.rotateApiClientSecret({
      clientKey,
    })

    this.writeLine({
      text: this.buildReport({
        clientKey,
        outcome,
      }),
    })

    this.processClerk.exit({
      exitCode: OUTCOME_EXIT_CODE_HASH[outcome.outcomeName],
    })

    return null
  }

  /**
   * Extract the one parameter an operator typed.
   *
   * @returns {string} Client key, empty when none was given.
   * @public
   */
  extractClientKey () {
    return this.processClerk.process.argv[ARGUMENT_OFFSET]
      ?? ''
  }

  /**
   * Build the report this outcome is told through.
   *
   * @param {{
   *   clientKey: string
   *   outcome: ApiClientSecretRotationOutcome
   * }} params - Parameters.
   * @returns {string} Report.
   * @public
   */
  buildReport ({
    clientKey,
    outcome,
  }) {
    const reportHash = this.buildReportHash({
      clientKey,
      outcome,
    })

    return reportHash[outcome.outcomeName]
  }

  /**
   * Build the report every outcome would be told through.
   *
   * All three are built and one is read. Selecting a sentence about a credential by indexing a
   * hash cannot pick a branch nobody wrote, which a chain of conditions can.
   *
   * @param {{
   *   clientKey: string
   *   outcome: ApiClientSecretRotationOutcome
   * }} params - Parameters.
   * @returns {Record<string, string>} One report per outcome.
   * @public
   */
  buildReportHash ({
    clientKey,
    outcome,
  }) {
    return {
      [API_CLIENT_SECRET_ROTATION_OUTCOME.ROTATED]: [
        'Rotated.',
        '',
        `  client key    ${clientKey}`,
        `  new secret    ${outcome.secret}`,
        '',
        'Both secrets are accepted from now until the previous one is retired. Give the client',
        'the new value, wait until it confirms it is signing with it, then run:',
        '',
        `  NODE_ENV=<environment> node scripts/retireApiClientPreviousSecret.js ${clientKey}`,
        '',
        'This is the only time the new secret can be read. It is stored encrypted and nothing',
        'prints it back. If it is lost, rotate again rather than looking for it.',
      ].join(LINE_BREAK),

      [API_CLIENT_SECRET_ROTATION_OUTCOME.ROTATION_ALREADY_UNDER_WAY]: [
        'Refused: this client is already mid-rotation.',
        '',
        `  client key    ${clientKey}`,
        '',
        'It holds a previous secret that is still being accepted. Rotating again would discard',
        'that one and put the client at risk of being refused, so retire it first:',
        '',
        `  NODE_ENV=<environment> node scripts/retireApiClientPreviousSecret.js ${clientKey}`,
      ].join(LINE_BREAK),

      [API_CLIENT_SECRET_ROTATION_OUTCOME.CLIENT_NOT_FOUND]: [
        'Refused: no client holds that key.',
        '',
        `  client key    ${clientKey}`,
        '',
        'Nothing was changed. Check the key, and the environment this command was pointed at.',
      ].join(LINE_BREAK),
    }
  }

  /**
   * Write one line to the sink.
   *
   * @param {{
   *   text: string
   * }} params - Parameters.
   * @returns {null} Nothing.
   * @public
   */
  writeLine ({
    text,
  }) {
    this.sink.write(`${text}${LINE_BREAK}`)

    return null
  }
}

/**
 * @typedef {import('./ApiClientSecretRotator.js').ApiClientSecretRotationOutcome
 * } ApiClientSecretRotationOutcome
 */

/**
 * @typedef {{
 *   processClerk: ProcessClerk
 *   rotator: ApiClientSecretRotator
 *   sink: {
 *     write: (text: string) => *
 *   }
 * }} ApiClientSecretRotationCommandLauncherParams
 */

/**
 * @typedef {{
 *   processClerk?: ProcessClerk
 *   rotator?: ApiClientSecretRotator
 *   sink?: {
 *     write: (text: string) => *
 *   }
 * }} ApiClientSecretRotationCommandLauncherFactoryParams
 */
