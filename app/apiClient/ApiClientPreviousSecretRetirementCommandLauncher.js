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
  'usage: NODE_ENV=<environment> node scripts/retireApiClientPreviousSecret.js <client key>',
  '',
  '  <client key>  the value the client sends as its x-ort-client-id header',
  '',
  'Run this only once the client has confirmed it is signing with the secret the rotation',
  'issued. From the moment it runs, the older secret is refused.',
  '',
  'example:',
  '  NODE_ENV=production node scripts/retireApiClientPreviousSecret.js 0123456789abcdef',
].join('\n')

const SUCCESS_EXIT_CODE = 0
const REFUSED_EXIT_CODE = 1

/*
 * Retiring a client that holds no previous secret exits 0, because that is the state the command
 * was asked to produce. Only a key naming no row is a refusal.
 */
const OUTCOME_EXIT_CODE_HASH = {
  [API_CLIENT_SECRET_ROTATION_OUTCOME.RETIRED]: SUCCESS_EXIT_CODE,
  [API_CLIENT_SECRET_ROTATION_OUTCOME.NOTHING_TO_RETIRE]: SUCCESS_EXIT_CODE,
  [API_CLIENT_SECRET_ROTATION_OUTCOME.CLIENT_NOT_FOUND]: REFUSED_EXIT_CODE,
}

const LINE_BREAK = '\n'

/**
 * Stops one registered caller's previous secret from being accepted.
 *
 * **This is the half of a rotation that changes what is refused**, and it is the half that is
 * easy to forget. A rotation on its own leaves the client holding two working credentials: the
 * one it has moved to, and the one it was meant to stop using. Until this runs, nothing about
 * the old secret has been taken away from whoever else may hold a copy of it.
 *
 * **It prints no secret**, because it produces none - it clears a column. So unlike the two
 * commands that issue credentials, its output is safe to keep.
 *
 * **Asking twice is safe.** A client with nothing to retire is told so and the command succeeds,
 * which is the same reading the contract gives a cancellation asked twice: what the caller wants
 * is the state, not a distinction between the first ask and the second.
 */
export default class ApiClientPreviousSecretRetirementCommandLauncher {
  /**
   * Constructor.
   *
   * @param {ApiClientPreviousSecretRetirementCommandLauncherParams} params - Parameters.
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
   * @template {X extends typeof ApiClientPreviousSecretRetirementCommandLauncher ? X : never} T, X
   * @param {ApiClientPreviousSecretRetirementCommandLauncherFactoryParams} [params] - Parameters.
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
   * @returns {typeof ApiClientPreviousSecretRetirementCommandLauncher} This class.
   * @public
   */
  get Ctor () {
    return /** @type {typeof ApiClientPreviousSecretRetirementCommandLauncher} */ (this.constructor)
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

    const outcome = await this.rotator.retirePreviousApiClientSecret({
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
    })

    return reportHash[outcome.outcomeName]
  }

  /**
   * Build the report every outcome would be told through.
   *
   * @param {{
   *   clientKey: string
   * }} params - Parameters.
   * @returns {Record<string, string>} One report per outcome.
   * @public
   */
  buildReportHash ({
    clientKey,
  }) {
    return {
      [API_CLIENT_SECRET_ROTATION_OUTCOME.RETIRED]: [
        'Retired.',
        '',
        `  client key    ${clientKey}`,
        '',
        'The older secret is refused from now on. This client holds one working secret again.',
      ].join(LINE_BREAK),

      [API_CLIENT_SECRET_ROTATION_OUTCOME.NOTHING_TO_RETIRE]: [
        'Nothing to retire.',
        '',
        `  client key    ${clientKey}`,
        '',
        'This client holds one secret already, so no rotation is under way. Nothing was changed.',
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
 * }} ApiClientPreviousSecretRetirementCommandLauncherParams
 */

/**
 * @typedef {{
 *   processClerk?: ProcessClerk
 *   rotator?: ApiClientSecretRotator
 *   sink?: {
 *     write: (text: string) => *
 *   }
 * }} ApiClientPreviousSecretRetirementCommandLauncherFactoryParams
 */
