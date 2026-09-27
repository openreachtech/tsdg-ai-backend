import AiRunInstantInspector from '../aiRun/AiRunInstantInspector.js'

import AiRunsQueryInputValidator from '../validator/forRenderer/AiRunsQueryInputValidator.js'

import AI_RUN_PAGE_CONSTANT_HASH from '../constants/aiRunPageConstants.js'

const {
  AI_RUN_PAGE,
} = AI_RUN_PAGE_CONSTANT_HASH

/*
 * The smallest threshold that is a threshold, restated from `AiRunsQueryInputValidator`'s own rule
 * for the same parameter.
 *
 * A threshold of nothing asks for every run that has not settled under a filter the operator never
 * wrote, and `stalled` with an empty argument after it reads as zero. The ceiling beside it is the
 * route's, and is the constant rather than a number copied out of it.
 */
const MINIMUM_STALLED_SECOND_COUNT = 1

/*
 * What a run key given on a command line has to look like, and deliberately not the shape a key is
 * minted in.
 *
 * `RunKeyGenerator` mints sixty-four hexadecimal characters, and every key in the development
 * seeders reads `run-key-10700001`; a pattern matching the mint would refuse every key an operator
 * has in front of them on a local or a manually verified stack. `AiRunPageCursor` settled this
 * question once already, for the key inside a cursor, and what it asserts is the smallest true
 * property — a key is printable text within the width of the column that stores it. That column is
 * `ai_runs.run_key`, declared `Sequelize.STRING(64)`.
 *
 * Bounding the length is the half that would otherwise be missing: an argument of arbitrary length
 * is an arbitrarily long line in whatever runbook log the refusal reaches, which is the argument
 * `AiRunKeyInspector` makes for its own bound and which holds here for the same reason.
 */
const RUN_KEY_SHAPED_PATTERN = /^[!-~]{1,64}$/u

/*
 * The width `sequelize/migrations/20260922100004-000004-create_table-ai_runs.cjs` gives
 * `correlation_id` — `Sequelize.STRING(191)` — the same bound `AiRunsQueryInputValidator` holds the
 * same parameter to. A longer one could only ever match nothing, and answering nothing-found to a
 * filter no run could satisfy tells an operator there are no runs when what happened is that they
 * asked with something no run could carry.
 */
const CORRELATION_ID_MAXIMUM_LENGTH = 191

/**
 * Judges the one parameter an operator command was given.
 *
 * **It judges, and it reads nothing.** `AiRunOperatorCommandInputAdapter` has already turned argv
 * into an input, so what arrives here is a number, a `Date`, a string or null — never the text a
 * terminal handed over. That is the split the renderer side keeps between its adapter and its
 * validator, and it is kept here for the same reason: a rule that also had to know how its value
 * was spelled would be two rules.
 *
 * **Every bound is one this repository already stated.** The stall threshold is judged by
 * `AiRunsQueryInputValidator.isCountWithin()` against the route's own ceiling, the instant by
 * `AiRunInstantInspector`, the correlation id against the width of the column that holds it, and
 * the run key by the property `AiRunPageCursor` settled. A command line is not a softer surface
 * than a query string, and inventing a looser rule for it would mean this service refused a value
 * on one surface and read it on the other.
 *
 * **It is not a `BaseInputValidator`, and the reason is the error hash.** That base exists to
 * answer with the identity of the refusal a surface raises — a GraphQL error class, a
 * `RestfulApiResponse` subclass — and a command line has no such vocabulary: its whole refusal is
 * an exit code, decided by `AiRunOperatorCommandExecutor`. So the rules here are what the base
 * would have run, and nothing is carried that only a request could use.
 *
 * **One rule is asked per command, and which one is the command's own business.** Each command
 * suite names the rule it is judged by, so a fifth command adds a rule here and names it there
 * rather than editing a branch in either place.
 */
export default class AiRunOperatorCommandInputValidator {
  /**
   * Constructor.
   *
   * @param {AiRunOperatorCommandInputValidatorParams} params - Parameters.
   */
  constructor ({
    input,
    aiRunInstantInspector,
  }) {
    this.input = input
    this.aiRunInstantInspector = aiRunInstantInspector
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunOperatorCommandInputValidator ? X : never} T, X
   * @param {AiRunOperatorCommandInputValidatorFactoryParams} params - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    input,
    aiRunInstantInspector = this.createAiRunInstantInspector(),
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        input,
        aiRunInstantInspector,
      })
    )
  }

  /**
   * get: the validator whose count rule the stall threshold is held to.
   *
   * @returns {typeof AiRunsQueryInputValidator} The class.
   */
  static get AiRunsQueryInputValidatorCtor () {
    return AiRunsQueryInputValidator
  }

  /**
   * Create the inspector an instant is judged by.
   *
   * @returns {AiRunInstantInspector} Inspector.
   * @public
   */
  static createAiRunInstantInspector () {
    return AiRunInstantInspector.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunOperatorCommandInputValidator} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunOperatorCommandInputValidator} */ (this.constructor)
  }

  /**
   * Check whether the command was given a parameter at all.
   *
   * It is asked before the command's own rule and never instead of it. Every rule below already
   * answers no to a parameter nobody gave, but it answers no for the wrong reason — that null is
   * not an integer, that null is not a string — and an operator who forgot the argument is told so
   * by the rule that is about the argument being missing.
   *
   * An empty argument is the same thing said differently: a command whose parameter is the empty
   * string was given one the way a caller building its arguments out of optional fields gives one,
   * and it names nothing.
   *
   * @returns {boolean} true: a parameter was given.
   * @public
   */
  hasParameter () {
    return this.input.parameterText !== null
      && this.input.parameterText !== ''
  }

  /**
   * Check whether the stall threshold is a count of seconds this command can measure against.
   *
   * @returns {boolean} true: the threshold is an integer within the route's own bounds.
   * @public
   */
  isValidStalledForSeconds () {
    return this.Ctor.AiRunsQueryInputValidatorCtor.isCountWithin({
      value: this.input.stalledForSeconds,
      minimum: MINIMUM_STALLED_SECOND_COUNT,
      maximum: AI_RUN_PAGE.MAXIMUM_STALLED_SECOND_COUNT,
    })
  }

  /**
   * Check whether the instant failures are counted from is one this service could have recorded.
   *
   * @returns {boolean} true: the instant is one the column can hold.
   * @public
   */
  isValidFailedSince () {
    return this.aiRunInstantInspector.isRecordableInstant({
      instant: this.input.failedSince,
    })
  }

  /**
   * Check whether the run key is one a run could be stored under.
   *
   * @returns {boolean} true: the key is printable text within the column's width.
   * @public
   */
  isValidRunKey () {
    if (typeof this.input.parameterText !== 'string') {
      return false
    }

    return RUN_KEY_SHAPED_PATTERN.test(this.input.parameterText)
  }

  /**
   * Check whether the correlation id is one value the column could hold.
   *
   * What it holds is never interpreted — the id groups a caller's own business object and this
   * service reads no meaning into it — so there is no format to check beyond being text somebody
   * filled in, short enough to have been stored.
   *
   * @returns {boolean} true: the correlation id is storable text.
   * @public
   */
  isValidCorrelationId () {
    if (typeof this.input.parameterText !== 'string') {
      return false
    }

    if (this.input.parameterText === '') {
      return false
    }

    return this.input.parameterText.length <= CORRELATION_ID_MAXIMUM_LENGTH
  }
}

/**
 * @typedef {{
 *   input: import('./AiRunOperatorCommandInputAdapter.js').AiRunOperatorCommandInput
 *   aiRunInstantInspector: AiRunInstantInspector
 * }} AiRunOperatorCommandInputValidatorParams
 */

/**
 * @typedef {{
 *   input: import('./AiRunOperatorCommandInputAdapter.js').AiRunOperatorCommandInput
 *   aiRunInstantInspector?: AiRunInstantInspector
 * }} AiRunOperatorCommandInputValidatorFactoryParams
 */
