'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_AGENT,
} = require('../../../constants/aiAgentConstants.cjs')

const {
  ASSET_MEDIA_EXTRACTION_TOOL,
} = require('../../../constants/assetMediaExtractionToolConstants.cjs')

/*
 * Master: the tool each agent may answer through, and the binding that offers it (specs/1.0.0,
 * #asset-media-extraction, `ai_tools` / `ai_agent_available_ai_tools`).
 *
 * **This is the seeder `assetMediaExtractionToolConstants.cjs` was written for.** That file says
 * in as many words that its values are "the baseline a seeder puts into `ai_tools`, not what the
 * running service sends" - because §20 says what a model may answer is "bounded by a tool schema
 * held as data", so the shape actually offered is read from this row at run time through
 * `AiAgentPromptComposer`. Until this file existed the constants had no seeder, and the agent
 * offered no tool at all: a run would have reached step 3 and been refused by
 * `AssetMediaReadingFetcher` for having no tool to force its reading through.
 *
 * **Why it is master data and not a development fixture.** The development prompt suite seeds
 * tools too, and says why they are fixtures: they describe nothing real, being obviously-fake
 * schemas bound to obviously-fake agents, precisely so that neither a production install nor
 * another feature reads them. This row is the opposite of that - it is the schema the one shipped
 * service actually answers through, so it belongs beside the agent whose instructions are already
 * master data.
 *
 * **Two tables in one file, which the agent suite beside it already does.** A tool and the binding
 * that offers it to one agent are one fact: a tool row nobody is bound to is offered to nobody, and
 * a binding naming no tool cannot be inserted. Splitting them would put one half of one fact behind
 * the other half's migration number.
 *
 * `is_enabled` is true because the agent may use it, and `is_default` is true because it is offered
 * without the step asking - which is what "each reading forced through a single tool call" needs:
 * the step names the tool it forces, and a tool the agent did not offer could not be named.
 *
 * `PAYLOAD` is stored as the text the column holds. The composer parses it back and refuses the
 * whole composition where it is not the JSON it claims to be, so a schema edited into something
 * unparseable fails loudly at the next run rather than quietly narrowing what a model may answer.
 */

const TABLE_NAME = {
  AI_TOOLS: 'ai_tools',
  AI_AGENT_AVAILABLE_AI_TOOLS: 'ai_agent_available_ai_tools',
}

const TOOL_SAVED_AT = new Date('2026-09-26T00:00:02.002Z')
const BINDING_SAVED_AT = new Date('2026-09-26T00:00:03.003Z')

const AI_TOOL_ID = 10201001

const aiToolSeeds = [
  {
    id: AI_TOOL_ID,
    name: ASSET_MEDIA_EXTRACTION_TOOL.NAME,
    description: ASSET_MEDIA_EXTRACTION_TOOL.DESCRIPTION,
    payload: JSON.stringify(ASSET_MEDIA_EXTRACTION_TOOL.PAYLOAD),
    display_order: 10,
    is_visible: true,
    saved_at: TOOL_SAVED_AT,
  },
]

const aiAgentAvailableAiToolSeeds = [
  {
    id: 10202001,
    ai_agent_id: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
    ai_tool_id: AI_TOOL_ID,
    is_enabled: true,
    is_default: true,
    saved_at: BINDING_SAVED_AT,
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME.AI_TOOLS, TimestampSeedsSupplier.supplyAll(aiToolSeeds), {})
    await queryInterface.bulkInsert(TABLE_NAME.AI_AGENT_AVAILABLE_AI_TOOLS, TimestampSeedsSupplier.supplyAll(aiAgentAvailableAiToolSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME.AI_AGENT_AVAILABLE_AI_TOOLS, { id: aiAgentAvailableAiToolSeeds.map(it => it.id) })
    await queryInterface.bulkDelete(TABLE_NAME.AI_TOOLS, { id: aiToolSeeds.map(it => it.id) })
  },
}
