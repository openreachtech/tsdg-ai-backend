'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_AGENT,
} = require('../../../constants/aiAgentConstants.cjs')

const {
  AI_MODEL,
} = require('../../../constants/aiModelConstants.cjs')

/*
 * Master: which model each agent calls (specs/1.0.0, #provider-layer, `ai_agent_default_models`).
 *
 * **Without this row an agent cannot be called at all.** `ai_agents` says who the agent is and the
 * two instruction tables say what it sends; the model it sends to is this binding, and a run that
 * resolves an agent with nothing bound to it has no driver to reach. The agent and the model were
 * both seeded before this file existed - `#provider-layer` installed each of them - and the row
 * joining them was not, so the first run that tried to execute would have found the service
 * correctly configured in every table but this one.
 *
 * **It binds to `STUB`, which is what a default installation runs.** `aiModelConstants.cjs` states
 * why that row exists and why it is the default: no key is read and no outbound connection is
 * opened, expressed as data rather than as a branch. Turning a real provider on is a row in
 * `ai_models` and a change of this binding - never a change to the service that uses one.
 *
 * **One binding per agent, which the table enforces.** `ai_agent_default_models.AiAgentId` is
 * unique, so an agent's model is a value that is rewritten rather than a row that is added beside
 * the old one; `saved_at` is when that rewriting last happened, which is what makes "which model
 * did this agent use in September" answerable after the fact.
 */

const TABLE_NAME = 'ai_agent_default_models'

const BINDING_SAVED_AT = new Date('2026-09-26T00:00:01.001Z')

const aiAgentDefaultModelSeeds = [
  {
    id: 10200001,
    ai_agent_id: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
    ai_model_id: AI_MODEL.STUB.ID,
    saved_at: BINDING_SAVED_AT,
  },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(aiAgentDefaultModelSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: aiAgentDefaultModelSeeds.map(it => it.id) })
  },
}
