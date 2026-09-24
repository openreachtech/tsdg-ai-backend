const DEFAULT_PROMPT_VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u

/**
 * Renders the version of the prompt a model call sent, for `ai_model_calls.prompt_version`, and
 * resolves that rendering back to the instant it names.
 *
 * **What a prompt version is.** Every editable text an agent sends is written through the backup
 * mixin, so the live row always holds the current wording and the sink holds every generation that
 * came before it. A generation is addressed by the `saved_at` it was written with — there is no
 * version number anywhere, because a number would be a second thing to keep in step with the text.
 * The version a call records is therefore the `saved_at` of the instruction that was in force when
 * the call was made, written as text.
 *
 * **Why the format lives here and not at the call site.** The column is `STRING(32)` and
 * `NOT NULL`, and `saved_at` is `DATE(3)` — millisecond precision. A rendering that dropped the
 * milliseconds would still be a non-empty string of fewer than thirty-two characters, so the column
 * would take it, every test asserting that a call records a version would pass, and the loss would
 * surface only when somebody reproduced a months-old result and got wording that was replaced
 * within the same second. Two rewordings a second apart are ordinary when an operator is editing on
 * the machine. One class owning the rendering is what keeps that from being decided again, slightly
 * differently, at each place a call is recorded.
 *
 * **Why the rendering is verified against the same pattern it is read back with.** A version is
 * only worth recording if it addresses exactly one row of the sink, which means the text has to
 * resolve back to the instant it was made from. `toISOString()` has a second, expanded form for
 * years outside four digits, and that form is not what `#buildSavedAt()` reads. Passing the minted
 * text through the pattern before returning it is what makes the two directions the same format
 * rather than two formats that agree most of the time.
 *
 * **Why a refusal is null rather than a throw.** Generating a value that cannot be generated is
 * reported as null, the way `RequestBodyDigester` reports a body it cannot digest. The column is
 * `NOT NULL`, so a null never becomes a recorded version: the row is refused instead. That is the
 * intended outcome — a call whose prompt version could not be rendered is better unrecorded than
 * recorded against a version that was guessed.
 */
export default class PromptVersionGenerator {
  /**
   * Constructor.
   *
   * @param {PromptVersionGeneratorParams} params - Parameters.
   */
  constructor ({
    promptVersionPattern,
  }) {
    this.promptVersionPattern = promptVersionPattern
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof PromptVersionGenerator ? X : never} T, X
   * @param {PromptVersionGeneratorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    promptVersionPattern = DEFAULT_PROMPT_VERSION_PATTERN,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        promptVersionPattern,
      })
    )
  }

  /**
   * Generate the prompt version naming the instruction generation that was in force.
   *
   * The instant arrives as the `savedAt` read from the instruction row, and nothing but a usable
   * instant can be rendered: a value that is not a `Date`, and a `Date` carrying no time at all,
   * each answer null rather than some text they never stated.
   *
   * @param {{
   *   savedAt: *
   * }} params - Parameters.
   * @returns {string | null} Prompt version, or null when the instant cannot be rendered.
   * @public
   */
  generatePromptVersion ({
    savedAt,
  }) {
    if (!(savedAt instanceof Date)) {
      return null
    }

    if (Number.isNaN(savedAt.getTime())) {
      return null
    }

    const promptVersion = savedAt.toISOString()

    if (!this.promptVersionPattern.test(promptVersion)) {
      return null
    }

    return promptVersion
  }

  /**
   * Build the instant a prompt version names, so the generation it addresses can be read back.
   *
   * This is the direction reproduction travels: a recorded version is matched against the
   * `saved_at` of the generations in the sink. Only the exact rendering this class mints resolves;
   * anything else carries no instant to look a generation up by, and answers null.
   *
   * @param {{
   *   promptVersion: *
   * }} params - Parameters.
   * @returns {Date | null} The instant the version names, or null when the text is not one.
   * @public
   */
  buildSavedAt ({
    promptVersion,
  }) {
    if (typeof promptVersion !== 'string') {
      return null
    }

    if (!this.promptVersionPattern.test(promptVersion)) {
      return null
    }

    return new Date(promptVersion)
  }
}

/**
 * @typedef {{
 *   promptVersionPattern: RegExp
 * }} PromptVersionGeneratorParams
 */

/**
 * @typedef {Partial<PromptVersionGeneratorParams>} PromptVersionGeneratorFactoryParams
 */
