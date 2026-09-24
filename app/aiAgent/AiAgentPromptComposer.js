import AiAgentAvailableAiTool from '../../sequelize/models/AiAgentAvailableAiTool.js'
import AiAgentDefaultInstruction from '../../sequelize/models/AiAgentDefaultInstruction.js'
import AiAgentRoleInstruction from '../../sequelize/models/AiAgentRoleInstruction.js'
import AiTool from '../../sequelize/models/AiTool.js'

/**
 * Assembles what one agent sends to a model, out of database rows.
 *
 * **There is no wording in this file, and that is the point.** The instruction, the system prompt
 * and every tool schema are rows; this class reads them and puts them together. It holds no default
 * text, no fallback text and no template with a sentence baked into it, so rewording what a service
 * sends is a write to a row and never a deployment. A reader can check that by scanning the file
 * for an English sentence outside a comment and finding none — the only literals here are the XML
 * tags the parts are wrapped in and the entities the text inside them is escaped to, which say
 * where a part begins and ends rather than what it says.
 *
 * **The composition order is the convention's, with the parts this version has.** The convention
 * joins three parts with a blank line between them, in the order background knowledge → the
 * instruction for this task → the agent preset. This version stores no documents and attaches none
 * to a call, so the first two parts have no source to be read from and only the agent preset is
 * composed. When a later version adds them they go **before** this one, joined with `\n\n`; the
 * wrapper below is copied verbatim from the convention so the part reads the same either way.
 *
 * **The system prompt is not part of the composed instruction.** A provider takes the role as its
 * own field, so it is handed back beside the instruction rather than concatenated into it, exactly
 * as it is stored.
 *
 * **Why a missing row is null and never a substitution.** An agent with no instruction row, no role
 * row, or a bound tool whose payload is not the JSON it claims to be, is a broken installation —
 * and the one thing this class must never do is paper over it with wording from code, because that
 * wording would be sent to a model while the database said something else. So the composition is
 * all or nothing: it answers a complete prompt, or it answers null and leaves the caller to report
 * the condition. Null rather than a throw follows the error convention's default for a value that
 * cannot be generated, the way `RequestBodyDigester` refuses a body it cannot digest; it also
 * leaves the decision where it belongs, since the caller is a run step and a step reports a refusal
 * with a reason code rather than crashing the job.
 *
 * **Why the `savedAt` is handed back with the prompt.** `ai_model_calls.prompt_version` records
 * which generation of the instruction was sent, and that generation is addressed by the `saved_at`
 * it was written under — the value that picks exactly one row out of the write-once history sink.
 * A composer that returned only the assembled text would leave the recorder to look that value up
 * again, against a row that may have been rewritten in between, so the instant the text was read
 * under travels with the text. Rendering it for the column belongs to `PromptVersionGenerator`,
 * which `AiModelCallRecorder` already owns; this class hands over the `Date` and renders nothing.
 */
export default class AiAgentPromptComposer {
  /**
   * Constructor.
   *
   * @param {AiAgentPromptComposerParams} params - Parameters.
   */
  constructor ({
    aiAgentId,
  }) {
    this.aiAgentId = aiAgentId
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiAgentPromptComposer ? X : never} T, X
   * @param {AiAgentPromptComposerFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiAgentId,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiAgentId,
      })
    )
  }

  /**
   * get: the agent instruction model.
   *
   * @returns {typeof AiAgentDefaultInstruction} Model.
   */
  static get AiAgentDefaultInstructionCtor () {
    return AiAgentDefaultInstruction
  }

  /**
   * get: the agent system-prompt model.
   *
   * @returns {typeof AiAgentRoleInstruction} Model.
   */
  static get AiAgentRoleInstructionCtor () {
    return AiAgentRoleInstruction
  }

  /**
   * get: the agent-to-tool binding model.
   *
   * @returns {typeof AiAgentAvailableAiTool} Model.
   */
  static get AiAgentAvailableAiToolCtor () {
    return AiAgentAvailableAiTool
  }

  /**
   * get: the tool schema model.
   *
   * @returns {typeof AiTool} Model.
   */
  static get AiToolCtor () {
    return AiTool
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiAgentPromptComposer} The class.
   */
  get Ctor () {
    return /** @type {typeof AiAgentPromptComposer} */ (this.constructor)
  }

  /**
   * Compose what this agent sends to a model, from the rows that hold it.
   *
   * @returns {Promise<ComposedAiAgentPrompt | null>} The composed prompt, or null when a row it is
   * made of is missing or unreadable.
   * @public
   */
  async composePrompt () {
    const defaultInstruction = await this.findDefaultInstruction()

    if (!defaultInstruction) {
      return null
    }

    const roleInstruction = await this.findRoleInstruction()

    if (!roleInstruction) {
      return null
    }

    const availableAiTools = await this.findAvailableAiTools()

    const toolSchemas = this.buildToolSchemas({
      availableAiTools,
    })

    if (!toolSchemas) {
      return null
    }

    const instruction = this.generateComposedInstruction({
      defaultInstruction: defaultInstruction.instruction,
    })

    return {
      instruction,
      role: roleInstruction.role,
      toolSchemas,
      instructionSavedAt: defaultInstruction.savedAt,
    }
  }

  /**
   * Find the instruction row in force for this agent.
   *
   * @returns {Promise<*>} The instruction row, or null when the agent has none.
   */
  async findDefaultInstruction () {
    return /** @type {*} */ (
      this.Ctor.AiAgentDefaultInstructionCtor.findOne({
        where: {
          AiAgentId: this.aiAgentId,
        },
      })
    )
  }

  /**
   * Find the system-prompt row in force for this agent.
   *
   * @returns {Promise<*>} The role row, or null when the agent has none.
   */
  async findRoleInstruction () {
    return /** @type {*} */ (
      this.Ctor.AiAgentRoleInstructionCtor.findOne({
        where: {
          AiAgentId: this.aiAgentId,
        },
      })
    )
  }

  /**
   * Find the tool bindings this agent may use, each with the tool it binds.
   *
   * A binding that is switched off is left out here, because a tool the agent may not use is not a
   * tool to send. Visibility is not read: `isVisible` says whether a tool is shown to an operator,
   * and a tool hidden from a console is still one a step is allowed to be given.
   *
   * @returns {Promise<Array<*>>} The enabled bindings, in the order the tools are displayed in.
   */
  async findAvailableAiTools () {
    return /** @type {*} */ (
      this.Ctor.AiAgentAvailableAiToolCtor.findAll({
        where: {
          AiAgentId: this.aiAgentId,
          isEnabled: true,
        },
        include: [
          this.Ctor.AiToolCtor,
        ],
        order: [
          [
            this.Ctor.AiToolCtor,
            'displayOrder',
            'ASC',
          ],
          [
            'id',
            'ASC',
          ],
        ],
      })
    )
  }

  /**
   * Build the schemas of the bound tools, in the order they were found.
   *
   * One payload that cannot be read as a tool schema takes the whole set with it. Dropping it
   * instead would hand a model a shorter tool set than the database describes, and the step that
   * then failed to get the call it expected would carry no trace of which row was at fault.
   *
   * @param {{
   *   availableAiTools: Array<*>
   * }} params - Parameters.
   * @returns {Array<Record<string, *>> | null} The tool schemas, or null when one cannot be read.
   */
  buildToolSchemas ({
    availableAiTools,
  }) {
    const toolSchemas = availableAiTools
      .map(it =>
        this.extractToolSchema({
          aiTool: it.AiTool,
        })
      )

    if (toolSchemas.includes(null)) {
      return null
    }

    return toolSchemas
  }

  /**
   * Extract one tool's schema from the payload it is stored as.
   *
   * The payload is held as text and parsed here, so the schema a step may return is a value an
   * operator edits rather than a shape compiled into the service.
   *
   * Parsing is not the whole of reading it. A payload that parses is still only whatever JSON the
   * column happened to hold, and what is forwarded goes to a provider as a tool the model may call
   * — so the parsed value is checked for being a tool schema before it leaves this method. A value
   * that is not one is refused exactly as an unparseable one is.
   *
   * @param {{
   *   aiTool: *
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The tool schema, or null when the payload is not JSON, or
   * is JSON that is not a tool schema.
   */
  extractToolSchema ({
    aiTool,
  }) {
    if (!aiTool) {
      return null
    }

    const toolSchema = this.parseToolPayload({
      payload: aiTool.payload,
    })

    if (
      !this.isValidToolSchema({
        toolSchema,
      })
    ) {
      return null
    }

    return toolSchema
  }

  /**
   * Parse the text one tool's schema is stored as.
   *
   * @param {{
   *   payload: *
   * }} params - Parameters.
   * @returns {*} The parsed payload, or null when it is not JSON.
   */
  parseToolPayload ({
    payload,
  }) {
    /*
     * The parse failure is not logged and not rethrown, because the null it becomes is what reports
     * it: the whole composition is refused, and the caller — a run step — records that refusal with
     * a reason code against the run. Logging it here as well would put the same event in two places
     * and leave the one nobody reads looking authoritative.
     */
    try {
      return JSON.parse(payload)
    } catch {
      return null
    }
  }

  /**
   * Check whether a parsed payload is a tool schema.
   *
   * What every vendor's tool schema has in common is a name, because a name is what a model is
   * offered a tool under and what the function call it answers with comes back carrying. Nothing
   * else is common to all of them — a vendor-defined tool such as `web_search` carries no input
   * schema at all — so a name is what is required, and a payload holding a number, a string, an
   * array or an object with no usable name is not a tool schema.
   *
   * @param {{
   *   toolSchema: *
   * }} params - Parameters.
   * @returns {boolean} Whether the parsed payload is a tool schema.
   */
  isValidToolSchema ({
    toolSchema,
  }) {
    if (!toolSchema) {
      return false
    }

    if (typeof toolSchema !== 'object') {
      return false
    }

    if (Array.isArray(toolSchema)) {
      return false
    }

    return typeof toolSchema.name === 'string'
      && toolSchema.name.length > 0
  }

  /**
   * Generate the composed instruction out of the agent's own instruction.
   *
   * The wrapper is the convention's agent-preset part, copied as it is written there. It names the
   * part; it states nothing about the task, which is why the text inside it is the only thing that
   * decides what the model is asked.
   *
   * The text is escaped before it is joined, so that it can only ever be read as the content of
   * the part and never as markup around it. Interpolated raw, a text carrying the part's own
   * closing tags would end the wrapper early, and everything after it would reach the model as
   * though it stood outside the preset.
   *
   * Today only an operator writes that text, and an operator owns it. It does not stay that way:
   * the parts this version has no source for are joined *before* this one, so the same join is
   * where a later version's background knowledge and task-specific instruction land — and those
   * carry values a client sends and this service never interprets. Escaping is done now rather
   * than then, because the day client text reaches this join is the day an unescaped one becomes
   * prompt injection from outside, and nothing about the join itself would announce it.
   *
   * @param {{
   *   defaultInstruction: string
   * }} params - Parameters.
   * @returns {string} The composed instruction.
   */
  generateComposedInstruction ({
    defaultInstruction,
  }) {
    const escapedInstruction = this.generateEscapedPartText({
      text: defaultInstruction,
    })

    return `<instruction><agent_preset>${escapedInstruction}</agent_preset></instruction>`
  }

  /**
   * Generate the escaped form of a text going inside one part of the wrapper.
   *
   * The three characters replaced are the three a tag can be built out of, so no sequence of the
   * escaped text opens or closes one. `&` goes first: replacing it after the other two would escape
   * the ampersands those two had just introduced and double them.
   *
   * @param {{
   *   text: string
   * }} params - Parameters.
   * @returns {string} The escaped text.
   */
  generateEscapedPartText ({
    text,
  }) {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  }
}

/**
 * @typedef {{
 *   aiAgentId: number
 * }} AiAgentPromptComposerParams
 */

/**
 * @typedef {AiAgentPromptComposerParams} AiAgentPromptComposerFactoryParams
 */

/**
 * @typedef {{
 *   instruction: string
 *   role: string
 *   toolSchemas: Array<Record<string, *>>
 *   instructionSavedAt: Date
 * }} ComposedAiAgentPrompt
 */
