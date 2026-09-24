'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

/*
 * Development fixtures: agents whose prompts exercise the composing path (specs/1.0.0,
 * #provider-layer, `ai_agents` / `ai_agent_default_instructions` / `ai_agent_role_instructions` /
 * `ai_tools` / `ai_agent_available_ai_tools`).
 *
 * **Why fixture agents rather than the seeded service agent.** The master seeder installs one
 * agent, for asset media extraction, with its baseline instruction and role. Reading that one row
 * proves the text comes from the database, but it cannot show that the *right* agent's text was
 * read: a composer that ignored the agent it was handed would answer identically. Agents carrying
 * different text are what makes that visible. They also carry the cases the one service agent has
 * no reason to carry — a tool switched off, a tool hidden from an operator, a payload that is not
 * the JSON it claims to be, and an agent whose rows were only half written.
 *
 * **Why the tool rows are fixtures and not master data.** What a step of the asset-media-extraction
 * run may return is that service's own schema, and that service's own feature owns its shape.
 * Inventing it here would install a baseline nobody designed. These tools describe nothing real:
 * they are obviously-fake schemas bound to obviously-fake agents, so neither a production install
 * nor another feature reads them.
 *
 * The rows that carry the cases:
 *
 *   - 10130001 composes, and holds three bound tools. Two are switched on and one of those two is
 *              hidden from an operator, which must not keep it out of what is sent; the third is
 *              switched off and must never reach a model. The two that are sent are displayed in
 *              the reverse of the order their bindings were written in, so a composer answering in
 *              insertion order is caught.
 *   - 10130002 error path — its one bound tool holds a payload that is not JSON. Nothing about it
 *              can be composed, and the whole composition is refused rather than quietly shortened.
 *   - 10130003 composes, with one bound tool, and that tool is the one 10130001 has switched off.
 *              One binding switched off for one agent and on for another is what shows the switch
 *              is read per binding rather than per tool.
 *   - 10130004 error path — an agent row with neither an instruction nor a role beneath it.
 *   - 10130005 error path — an agent row with an instruction but no role.
 *
 * The history sinks are seeded beside the live instruction rows, and that is not a duplicate: a
 * seeder inserts through `queryInterface`, which fires no model hook, so a generation installed here
 * would be the one generation the sink never heard of. The sink row therefore carries the same
 * agent, the same text and the same `saved_at` as the live row it copies — `saved_at` being the
 * value a model call records as the version of the prompt it sent.
 *
 * Every value is distinct from every other value in the file, so a column read in place of its
 * neighbour fails loudly instead of matching by accident.
 */

const TABLE_NAME = {
  AI_AGENTS: 'ai_agents',
  AI_AGENT_DEFAULT_INSTRUCTIONS: 'ai_agent_default_instructions',
  AI_AGENT_DEFAULT_INSTRUCTIONS_BK: 'ai_agent_default_instructions_bk',
  AI_AGENT_ROLE_INSTRUCTIONS: 'ai_agent_role_instructions',
  AI_AGENT_ROLE_INSTRUCTIONS_BK: 'ai_agent_role_instructions_bk',
  AI_TOOLS: 'ai_tools',
  AI_AGENT_AVAILABLE_AI_TOOLS: 'ai_agent_available_ai_tools',
}

/*
 * A live row and the sink row copying it have to hold the identical instant and the identical text,
 * so each is written once here and read twice below. Two literals free to drift apart is exactly
 * the failure nobody notices until a version is resolved back to the wrong wording.
 */
const ALPHA_INSTRUCTION_SAVED_AT = new Date('2026-09-11T03:03:03.003Z')
const BETA_INSTRUCTION_SAVED_AT = new Date('2026-09-11T04:04:04.004Z')
const GAMMA_INSTRUCTION_SAVED_AT = new Date('2026-09-11T05:05:05.005Z')
const OMEGA_INSTRUCTION_SAVED_AT = new Date('2026-09-11T06:06:06.006Z')

const ALPHA_ROLE_SAVED_AT = new Date('2026-09-11T07:07:07.007Z')
const BETA_ROLE_SAVED_AT = new Date('2026-09-11T08:08:08.008Z')
const GAMMA_ROLE_SAVED_AT = new Date('2026-09-11T09:09:09.009Z')

const ALPHA_INSTRUCTION = 'Fixture instruction of the alpha agent.'
const BETA_INSTRUCTION = 'Fixture instruction of the beta agent.'
const GAMMA_INSTRUCTION = 'Fixture instruction of the gamma agent.'
const OMEGA_INSTRUCTION = 'Fixture instruction of the omega agent.'

const ALPHA_ROLE = 'Fixture role of the alpha agent.'
const BETA_ROLE = 'Fixture role of the beta agent.'
const GAMMA_ROLE = 'Fixture role of the gamma agent.'

const aiAgentSeeds = [
  {
    // composes — two bound tools switched on, a third switched off
    id: 10130001,
    name: 'alpha-fixture-agent',
    description: 'Fixture agent composing with two of its three bound tools.',
    registered_at: new Date('2026-09-11T01:01:01.001Z'),
    saved_at: new Date('2026-09-11T02:02:02.002Z'),
  },
  {
    // error path — its one bound tool holds an unreadable payload
    id: 10130002,
    name: 'beta-fixture-agent',
    description: 'Fixture agent bound to a tool whose payload is unreadable.',
    registered_at: new Date('2026-09-11T01:11:11.011Z'),
    saved_at: new Date('2026-09-11T02:12:12.012Z'),
  },
  {
    // composes — one bound tool, switched on for this agent and off for 10130001
    id: 10130003,
    name: 'gamma-fixture-agent',
    description: 'Fixture agent composing with the one tool it shares with another agent.',
    registered_at: new Date('2026-09-11T01:21:21.021Z'),
    saved_at: new Date('2026-09-11T02:22:22.022Z'),
  },
  {
    // error path — no instruction row and no role row beneath it
    id: 10130004,
    name: 'delta-fixture-agent',
    description: 'Fixture agent left without an instruction and without a role.',
    registered_at: new Date('2026-09-11T01:31:31.031Z'),
    saved_at: new Date('2026-09-11T02:32:32.032Z'),
  },
  {
    // error path — an instruction row, and no role row
    id: 10130005,
    name: 'omega-fixture-agent',
    description: 'Fixture agent left without a role.',
    registered_at: new Date('2026-09-11T01:41:41.041Z'),
    saved_at: new Date('2026-09-11T02:42:42.042Z'),
  },
]

const aiAgentDefaultInstructionSeeds = [
  {
    id: 10131001,
    ai_agent_id: 10130001,
    instruction: ALPHA_INSTRUCTION,
    saved_at: ALPHA_INSTRUCTION_SAVED_AT,
  },
  {
    id: 10131002,
    ai_agent_id: 10130002,
    instruction: BETA_INSTRUCTION,
    saved_at: BETA_INSTRUCTION_SAVED_AT,
  },
  {
    id: 10131003,
    ai_agent_id: 10130003,
    instruction: GAMMA_INSTRUCTION,
    saved_at: GAMMA_INSTRUCTION_SAVED_AT,
  },
  {
    id: 10131005,
    ai_agent_id: 10130005,
    instruction: OMEGA_INSTRUCTION,
    saved_at: OMEGA_INSTRUCTION_SAVED_AT,
  },
]

// The baseline generation of the rows above, in the sink the mixin would have written them to.
const aiAgentDefaultInstructionBkSeeds = [
  {
    id: 10132001,
    ai_agent_id: 10130001,
    instruction: ALPHA_INSTRUCTION,
    saved_at: ALPHA_INSTRUCTION_SAVED_AT,
  },
  {
    id: 10132002,
    ai_agent_id: 10130002,
    instruction: BETA_INSTRUCTION,
    saved_at: BETA_INSTRUCTION_SAVED_AT,
  },
  {
    id: 10132003,
    ai_agent_id: 10130003,
    instruction: GAMMA_INSTRUCTION,
    saved_at: GAMMA_INSTRUCTION_SAVED_AT,
  },
  {
    id: 10132005,
    ai_agent_id: 10130005,
    instruction: OMEGA_INSTRUCTION,
    saved_at: OMEGA_INSTRUCTION_SAVED_AT,
  },
]

const aiAgentRoleInstructionSeeds = [
  {
    id: 10133001,
    ai_agent_id: 10130001,
    role: ALPHA_ROLE,
    saved_at: ALPHA_ROLE_SAVED_AT,
  },
  {
    id: 10133002,
    ai_agent_id: 10130002,
    role: BETA_ROLE,
    saved_at: BETA_ROLE_SAVED_AT,
  },
  {
    id: 10133003,
    ai_agent_id: 10130003,
    role: GAMMA_ROLE,
    saved_at: GAMMA_ROLE_SAVED_AT,
  },
]

// The baseline generation of the rows above, in the sink the mixin would have written them to.
const aiAgentRoleInstructionBkSeeds = [
  {
    id: 10134001,
    ai_agent_id: 10130001,
    role: ALPHA_ROLE,
    saved_at: ALPHA_ROLE_SAVED_AT,
  },
  {
    id: 10134002,
    ai_agent_id: 10130002,
    role: BETA_ROLE,
    saved_at: BETA_ROLE_SAVED_AT,
  },
  {
    id: 10134003,
    ai_agent_id: 10130003,
    role: GAMMA_ROLE,
    saved_at: GAMMA_ROLE_SAVED_AT,
  },
]

const aiToolSeeds = [
  {
    // displayed second, and shown to an operator
    id: 10135001,
    name: 'visible_fixture_tool',
    description: 'Fixture tool an operator can see.',
    payload: JSON.stringify({
      name: 'visible_fixture_tool',
      description: 'Reports the visible value the fixture asks for.',
      input_schema: {
        type: 'object',
        properties: {
          visibleValue: {
            type: 'string',
          },
        },
        required: [
          'visibleValue',
        ],
      },
    }),
    display_order: 20,
    is_visible: true,
    saved_at: new Date('2026-09-11T10:10:10.010Z'),
  },
  {
    // displayed first, and hidden from an operator — hidden must not mean withheld from a model
    id: 10135002,
    name: 'hidden_fixture_tool',
    description: 'Fixture tool an operator cannot see.',
    payload: JSON.stringify({
      name: 'hidden_fixture_tool',
      description: 'Reports the hidden value the fixture asks for.',
      input_schema: {
        type: 'object',
        properties: {
          hiddenValue: {
            type: 'string',
          },
        },
        required: [
          'hiddenValue',
        ],
      },
    }),
    display_order: 10,
    is_visible: false,
    saved_at: new Date('2026-09-11T11:11:11.011Z'),
  },
  {
    // error path — the payload is deliberately not JSON
    id: 10135003,
    name: 'unreadable_fixture_tool',
    description: 'Fixture tool whose payload is not the JSON it claims to be.',
    payload: 'unreadable-fixture-payload-{',
    display_order: 30,
    is_visible: true,
    saved_at: new Date('2026-09-11T12:12:12.012Z'),
  },
  {
    // bound to two agents, switched off for one of them and on for the other
    id: 10135004,
    name: 'shared_fixture_tool',
    description: 'Fixture tool bound to two agents under opposite switches.',
    payload: JSON.stringify({
      name: 'shared_fixture_tool',
      description: 'Reports the shared value the fixture asks for.',
      input_schema: {
        type: 'object',
        properties: {
          sharedValue: {
            type: 'string',
          },
        },
        required: [
          'sharedValue',
        ],
      },
    }),
    display_order: 40,
    is_visible: true,
    saved_at: new Date('2026-09-11T13:13:13.013Z'),
  },
]

const aiAgentAvailableAiToolSeeds = [
  {
    // written first, displayed second
    id: 10136001,
    ai_agent_id: 10130001,
    ai_tool_id: 10135001,
    is_enabled: true,
    is_default: true,
    saved_at: new Date('2026-09-11T14:14:14.014Z'),
  },
  {
    // written second, displayed first
    id: 10136002,
    ai_agent_id: 10130001,
    ai_tool_id: 10135002,
    is_enabled: true,
    is_default: false,
    saved_at: new Date('2026-09-11T15:15:15.015Z'),
  },
  {
    // switched off, and so never sent
    id: 10136003,
    ai_agent_id: 10130001,
    ai_tool_id: 10135004,
    is_enabled: false,
    is_default: false,
    saved_at: new Date('2026-09-11T16:16:16.016Z'),
  },
  {
    // switched on, and unreadable
    id: 10136004,
    ai_agent_id: 10130002,
    ai_tool_id: 10135003,
    is_enabled: true,
    is_default: true,
    saved_at: new Date('2026-09-11T17:17:17.017Z'),
  },
  {
    // the same tool 10136003 has switched off, switched on for this agent
    id: 10136005,
    ai_agent_id: 10130003,
    ai_tool_id: 10135004,
    is_enabled: true,
    is_default: false,
    saved_at: new Date('2026-09-11T18:18:18.018Z'),
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENTS, TimestampSeedsSupplier.supplyAll(aiAgentSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_DEFAULT_INSTRUCTIONS, TimestampSeedsSupplier.supplyAll(aiAgentDefaultInstructionSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_DEFAULT_INSTRUCTIONS_BK, TimestampSeedsSupplier.supplyAll(aiAgentDefaultInstructionBkSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_ROLE_INSTRUCTIONS, TimestampSeedsSupplier.supplyAll(aiAgentRoleInstructionSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_ROLE_INSTRUCTIONS_BK, TimestampSeedsSupplier.supplyAll(aiAgentRoleInstructionBkSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_TOOLS, TimestampSeedsSupplier.supplyAll(aiToolSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_AVAILABLE_AI_TOOLS, TimestampSeedsSupplier.supplyAll(aiAgentAvailableAiToolSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_AVAILABLE_AI_TOOLS, { id: aiAgentAvailableAiToolSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_TOOLS, { id: aiToolSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_ROLE_INSTRUCTIONS_BK, { id: aiAgentRoleInstructionBkSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_ROLE_INSTRUCTIONS, { id: aiAgentRoleInstructionSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_DEFAULT_INSTRUCTIONS_BK, { id: aiAgentDefaultInstructionBkSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_DEFAULT_INSTRUCTIONS, { id: aiAgentDefaultInstructionSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENTS, { id: aiAgentSeeds.map(it => it.id) })
  },
}
