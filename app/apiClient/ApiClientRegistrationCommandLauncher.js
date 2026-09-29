import {
  ProcessClerk,
} from '@openreachtech/renchan-job-bullmq'

import ApiClientRegistrar from './ApiClientRegistrar.js'

import bootstrapSequelize from '../../sequelize/_.js'

/*
 * `process.argv` opens with the Node binary and the script path, so the two parameters an operator
 * typed begin at index 2.
 */
const ARGUMENT_OFFSET = 2
const EXPECTED_ARGUMENT_COUNT = 2

const CALLBACK_URL_PREFIX_PATTERN = /^https?:\/\/[^\s]+\/$/u

const USAGE_TEXT = [
  'usage: NODE_ENV=<environment> node scripts/registerApiClient.js <name> <callback URL prefix>',
  '',
  '  <name>                 how this caller is named in the table. Not read by any check',
  '  <callback URL prefix>  a run result is posted only to a URL beginning with this.',
  '                         It must be absolute and must end with a slash',
  '',
  'example:',
  '  NODE_ENV=production node scripts/registerApiClient.js \'Example client\' https://api.example.com/callbacks/',
].join('\n')

const UNUSABLE_CALLBACK_URL_PREFIX_MESSAGE = 'the callback URL prefix must be an absolute http(s) URL ending with a slash'

/*
 * `ProcessClerk#exit()` reads `exitCode` and defaults it to 0, so a call naming the field
 * anything else exits successfully however loudly the refusal was printed - which is a command
 * whose failure no caller can detect.
 */
const SUCCESS_EXIT_CODE = 0
const REFUSED_EXIT_CODE = 1

const LINE_BREAK = '\n'

/**
 * Registers one API client from the command line, and prints what it was given.
 *
 * **The secret is printed once and can never be printed again.** It is stored encrypted, the
 * model's default scope does not select the column, and nothing in this repository decrypts one for
 * display. So the output of this command is the whole of the client's copy: capture it as it
 * appears, hand it over through a channel that is not this terminal's scrollback, and issue a new
 * client rather than trying to recover a lost one.
 *
 * **`NODE_ENV` comes from the caller and is not written here**, for the reason the operator command
 * and the scheduler scripts give: the database this writes to is the deployment's, so the
 * deployment names it. Unset, the environment barrel throws before anything connects, which is the
 * right failure for a command about to write a real row.
 */
export default class ApiClientRegistrationCommandLauncher {
  /**
   * Constructor.
   *
   * @param {ApiClientRegistrationCommandLauncherParams} params - Parameters.
   */
  constructor ({
    processClerk,
    registrar,
    sink,
  }) {
    this.processClerk = processClerk
    this.registrar = registrar
    this.sink = sink
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof ApiClientRegistrationCommandLauncher ? X : never} T, X
   * @param {ApiClientRegistrationCommandLauncherFactoryParams} [params] - Parameters.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   */
  static create ({
    processClerk = this.createProcessClerk(),
    registrar = this.createRegistrar(),
    sink = this.defaultSink,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        processClerk,
        registrar,
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
   * Create the registrar that does the work.
   *
   * @returns {ApiClientRegistrar} Registrar.
   * @public
   */
  static createRegistrar () {
    return ApiClientRegistrar.create()
  }

  /**
   * get: where the report is written, so a test collects the text instead of printing it.
   *
   * @returns {{ write: (text: string) => *}} Sink.
   * @public
   */
  static get defaultSink () {
    return process.stdout
  }

  /**
   * get: own constructor.
   *
   * @returns {typeof ApiClientRegistrationCommandLauncher} This class.
   * @public
   */
  get Ctor () {
    return /** @type {typeof ApiClientRegistrationCommandLauncher} */ (this.constructor)
  }

  /**
   * Run the command, from arguments to a written report.
   *
   * @returns {Promise<null>} Nothing.
   * @public
   */
  async startCommandProcess () {
    const [
      name,
      callbackUrlPrefix,
    ] = this.extractArgumentValues()

    const refusal = this.generateRefusal({
      name,
      callbackUrlPrefix,
    })

    if (refusal) {
      this.writeLine({
        text: refusal,
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

    const issued = await this.registrar.registerApiClient({
      name,
      callbackUrlPrefix,
      registeredAt: this.generateCurrentDateTime(),
    })

    this.writeLine({
      text: this.buildReport({
        name,
        callbackUrlPrefix,
        issued,
      }),
    })

    this.processClerk.exit({
      exitCode: SUCCESS_EXIT_CODE,
    })

    return null
  }

  /**
   * Extract the two parameters an operator typed.
   *
   * @returns {Array<string>} Argument values.
   * @public
   */
  extractArgumentValues () {
    return this.processClerk.process.argv
      .slice(ARGUMENT_OFFSET, ARGUMENT_OFFSET + EXPECTED_ARGUMENT_COUNT)
  }

  /**
   * Generate the reason this command will not run, or null when it will.
   *
   * @param {{
   *   name: *
   *   callbackUrlPrefix: *
   * }} params - Parameters.
   * @returns {string | null} Refusal, or null.
   * @public
   */
  generateRefusal ({
    name,
    callbackUrlPrefix,
  }) {
    if (!name || !callbackUrlPrefix) {
      return 'both a name and a callback URL prefix are required'
    }

    if (!CALLBACK_URL_PREFIX_PATTERN.test(callbackUrlPrefix)) {
      return UNUSABLE_CALLBACK_URL_PREFIX_MESSAGE
    }

    return null
  }

  /**
   * Generate the instant the row records as its registration.
   *
   * @returns {Date} Now.
   * @public
   */
  generateCurrentDateTime () {
    return new Date()
  }

  /**
   * Build the report, which is the client's only copy of its secret.
   *
   * @param {{
   *   name: string
   *   callbackUrlPrefix: string
   *   issued: {
   *     clientKey: string
   *     secret: string
   *   }
   * }} params - Parameters.
   * @returns {string} Report.
   * @public
   */
  buildReport ({
    name,
    callbackUrlPrefix,
    issued,
  }) {
    return [
      'Registered.',
      '',
      `  name                 ${name}`,
      `  callback URL prefix  ${callbackUrlPrefix}`,
      `  client key           ${issued.clientKey}`,
      `  secret               ${issued.secret}`,
      '',
      'The client sends the key as the x-ort-client-id header, and signs each request with the',
      'secret: hex HMAC-SHA256 over the timestamp, a dot, and the raw request body. A request that',
      'carries no body signs over the empty string.',
      '',
      'This is the only time the secret can be read. It is stored encrypted and nothing prints it',
      'back. If it is lost, register a new client rather than looking for it.',
    ].join(LINE_BREAK)
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
 * @typedef {{
 *   processClerk: ProcessClerk
 *   registrar: ApiClientRegistrar
 *   sink: {
 *     write: (text: string) => *
 *   }
 * }} ApiClientRegistrationCommandLauncherParams
 */

/**
 * @typedef {{
 *   processClerk?: ProcessClerk
 *   registrar?: ApiClientRegistrar
 *   sink?: {
 *     write: (text: string) => *
 *   }
 * }} ApiClientRegistrationCommandLauncherFactoryParams
 */
