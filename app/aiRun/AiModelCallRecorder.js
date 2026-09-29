import PromptVersionGenerator from './PromptVersionGenerator.js'

import AiModelCall from '../../sequelize/models/AiModelCall.js'

/**
 * Writes one `ai_model_calls` row for each call a run makes to a model.
 *
 * **Why the record is a class of its own.** Which model answered, what it cost and how long it took
 * are the same facts whichever service asked and whichever vendor replied, so they are written in
 * one place rather than once per driver. Keeping it here leaves each driver holding only the
 * request and the reply, and leaves the record reachable from a job or a script that never had a
 * driver at all.
 *
 * **Everything but the body has to outlive the body.** Content is purged at thirty days and the
 * decision trace is kept for seven hundred and thirty, and `response_body` is the only content in
 * this row. That is what makes the rest of it answerable afterwards: a run is billed by reading the
 * token counts of the calls recorded against it, and a result is reproduced by reading the model
 * and the prompt version each call used — all of it still true once the body it produced is gone.
 * So the model output goes in `response_body` and nowhere else. Nothing is copied out of it into a
 * column that survives the purge, because a copy would be content outliving its own clock.
 *
 * **Latency is measured, and the two ends are handed in.** Both instants arrive on the call — the
 * moment the request went out and the moment the reply came back — and the difference between them
 * is what is recorded. This class never reads a clock, which follows `RequestTimestampWindowInspector`
 * and `SessionClerk`: one call then has exactly one pair of instants, shared by everything that
 * judges it, and a test states both ends rather than mocking global time or waiting for a real
 * clock to move. A reply that arrives before the request went out — which an NTP step can produce —
 * is recorded as the negative number it measured, because losing a billing row to a clock blip is
 * worse than a number that reads oddly.
 *
 * **A value that could not be derived is never substituted.** The prompt version and the latency
 * are both derived here, and each answers null when it cannot be derived. Both columns are
 * `NOT NULL`, so a null refuses the row instead of recording a guess against it.
 */
export default class AiModelCallRecorder {
  /**
   * Constructor.
   *
   * @param {AiModelCallRecorderParams} params - Parameters.
   */
  constructor ({
    promptVersionGenerator,
  }) {
    this.promptVersionGenerator = promptVersionGenerator
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiModelCallRecorder ? X : never} T, X
   * @param {AiModelCallRecorderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    promptVersionGenerator = this.createPromptVersionGenerator(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        promptVersionGenerator,
      })
    )
  }

  /**
   * get: the model-call model.
   *
   * @returns {typeof AiModelCall} Model.
   */
  static get AiModelCallCtor () {
    return AiModelCall
  }

  /**
   * Create the generator rendering the version of the prompt a call sent.
   *
   * @returns {PromptVersionGenerator} Generator.
   */
  static createPromptVersionGenerator () {
    return PromptVersionGenerator.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiModelCallRecorder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiModelCallRecorder} */ (this.constructor)
  }

  /**
   * Save the record of one call a run made to a model.
   *
   * @param {SaveAiModelCallParams} params - Parameters.
   * @returns {Promise<*>} The saved model call.
   * @public
   */
  async saveAiModelCall ({
    aiRunId,
    aiModelId,
    actionName,
    readingIndex,
    instructionSavedAt,
    calledAt,
    respondedAt,
    inputTokenCount,
    outputTokenCount,
    responseBody,
  }) {
    const promptVersion = this.promptVersionGenerator.generatePromptVersion({
      savedAt: instructionSavedAt,
    })

    const latencyMilliseconds = this.generateLatencyMilliseconds({
      calledAt,
      respondedAt,
    })

    return /** @type {*} */ (
      this.Ctor.AiModelCallCtor.create({
        AiRunId: aiRunId,
        AiModelId: aiModelId,
        actionName,
        readingIndex,
        promptVersion,
        latencyMilliseconds,
        inputTokenCount,
        outputTokenCount,
        responseBody,
        calledAt,
      })
    )
  }

  /**
   * Generate how long the model took to answer, from the two ends of the call.
   *
   * Nothing here estimates. Only a pair of usable instants measures anything, so a value that is
   * not a `Date`, and a `Date` carrying no time at all, answer null rather than a number that was
   * never measured.
   *
   * @param {{
   *   calledAt: *
   *   respondedAt: *
   * }} params - Parameters.
   * @returns {number | null} Milliseconds between the two ends, or null when neither end measures.
   */
  generateLatencyMilliseconds ({
    calledAt,
    respondedAt,
  }) {
    if (!(calledAt instanceof Date)) {
      return null
    }

    if (!(respondedAt instanceof Date)) {
      return null
    }

    const latencyMilliseconds = respondedAt.getTime() - calledAt.getTime()

    if (Number.isNaN(latencyMilliseconds)) {
      return null
    }

    return latencyMilliseconds
  }
}

/**
 * @typedef {{
 *   promptVersionGenerator: PromptVersionGenerator
 * }} AiModelCallRecorderParams
 */

/**
 * @typedef {Partial<AiModelCallRecorderParams>} AiModelCallRecorderFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiModelId: number
 *   actionName: string
 *   readingIndex: number
 *   instructionSavedAt: Date
 *   calledAt: Date
 *   respondedAt: Date
 *   inputTokenCount: number
 *   outputTokenCount: number
 *   responseBody: string | null
 * }} SaveAiModelCallParams
 */
