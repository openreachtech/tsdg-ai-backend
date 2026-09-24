'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_AGENT,
} = require('../../../constants/aiAgentConstants.cjs')

/*
 * Master: the agent of each AI service, and the two texts it sends (specs/1.0.0, #provider-layer,
 * `ai_agents` / `ai_agent_default_instructions` / `ai_agent_role_instructions`).
 *
 * One agent this version, for asset media extraction. A later service adds an entry to
 * `constants/aiAgentConstants.cjs` and a row here — never a column, and never a text in code.
 *
 * **The history sinks are seeded too, and that is not a duplicate.** The backup mixin appends a
 * sink row on every `.save()` of a live instruction row, but a seeder inserts through
 * `queryInterface`, which fires no model hook — so a row installed here would be the one generation
 * the sink never heard of. A model call records `saved_at` as the version of the prompt it sent and
 * resolves it back through the sink; the baseline generation is the one every call made before the
 * first reword used, so it is also the one most likely to be asked about. The sink row therefore
 * carries the same `ai_agent_id`, the same text and, above all, the same `saved_at` as the live row
 * it copies.
 *
 * `saved_at` is the reason these datetimes are written out as constants rather than inline: the
 * live row and its sink row have to hold the identical value, and two literals free to drift is
 * exactly the failure nobody would notice until a dispute about a months-old run.
 *
 * Every other value is read from the constants hash rather than retyped, because the application
 * binds to the same hash.
 */

const TABLE_NAME = {
  AI_AGENTS: 'ai_agents',
  AI_AGENT_DEFAULT_INSTRUCTIONS: 'ai_agent_default_instructions',
  AI_AGENT_DEFAULT_INSTRUCTIONS_BK: 'ai_agent_default_instructions_bk',
  AI_AGENT_ROLE_INSTRUCTIONS: 'ai_agent_role_instructions',
  AI_AGENT_ROLE_INSTRUCTIONS_BK: 'ai_agent_role_instructions_bk',
}

const AGENT_REGISTERED_AT = new Date('2026-09-24T00:00:01.001Z')
const AGENT_SAVED_AT = new Date('2026-09-24T00:00:02.002Z')
const DEFAULT_INSTRUCTION_SAVED_AT = new Date('2026-09-24T00:00:03.003Z')
const ROLE_INSTRUCTION_SAVED_AT = new Date('2026-09-24T00:00:04.004Z')

const aiAgentSeeds = [
  {
    id: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
    name: AI_AGENT.ASSET_MEDIA_EXTRACTION.NAME,
    description: AI_AGENT.ASSET_MEDIA_EXTRACTION.DESCRIPTION,
    registered_at: AGENT_REGISTERED_AT,
    saved_at: AGENT_SAVED_AT,
  },
]

const aiAgentDefaultInstructionSeeds = [
  {
    id: 10160001,
    ai_agent_id: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
    instruction: AI_AGENT.ASSET_MEDIA_EXTRACTION.DEFAULT_INSTRUCTION,
    saved_at: DEFAULT_INSTRUCTION_SAVED_AT,
  },
]

// The baseline generation of the row above, in the sink the mixin would have written it to.
const aiAgentDefaultInstructionBkSeeds = [
  {
    id: 10170001,
    ai_agent_id: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
    instruction: AI_AGENT.ASSET_MEDIA_EXTRACTION.DEFAULT_INSTRUCTION,
    saved_at: DEFAULT_INSTRUCTION_SAVED_AT,
  },
]

const aiAgentRoleInstructionSeeds = [
  {
    id: 10180001,
    ai_agent_id: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
    role: AI_AGENT.ASSET_MEDIA_EXTRACTION.ROLE_INSTRUCTION,
    saved_at: ROLE_INSTRUCTION_SAVED_AT,
  },
]

// The baseline generation of the row above, in the sink the mixin would have written it to.
const aiAgentRoleInstructionBkSeeds = [
  {
    id: 10190001,
    ai_agent_id: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
    role: AI_AGENT.ASSET_MEDIA_EXTRACTION.ROLE_INSTRUCTION,
    saved_at: ROLE_INSTRUCTION_SAVED_AT,
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENTS, TimestampSeedsSupplier.supplyAll(aiAgentSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_DEFAULT_INSTRUCTIONS, TimestampSeedsSupplier.supplyAll(aiAgentDefaultInstructionSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_DEFAULT_INSTRUCTIONS_BK, TimestampSeedsSupplier.supplyAll(aiAgentDefaultInstructionBkSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_ROLE_INSTRUCTIONS, TimestampSeedsSupplier.supplyAll(aiAgentRoleInstructionSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_ROLE_INSTRUCTIONS_BK, TimestampSeedsSupplier.supplyAll(aiAgentRoleInstructionBkSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_ROLE_INSTRUCTIONS_BK, { id: aiAgentRoleInstructionBkSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_ROLE_INSTRUCTIONS, { id: aiAgentRoleInstructionSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_DEFAULT_INSTRUCTIONS_BK, { id: aiAgentDefaultInstructionBkSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_DEFAULT_INSTRUCTIONS, { id: aiAgentDefaultInstructionSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENTS, { id: aiAgentSeeds.map(it => it.id) })
  },
}
