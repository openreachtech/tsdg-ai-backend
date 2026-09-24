import AI_AGENT_CONSTANT_HASH from '../../../app/constants/aiAgentConstants.js'

import AiAgentRoleInstruction from '../../../sequelize/models/AiAgentRoleInstruction.js'
import AiAgentRoleInstructionBk from '../../../sequelize/models/AiAgentRoleInstructionBk.js'

const {
  AI_AGENT,
} = AI_AGENT_CONSTANT_HASH

describe('AiAgentRoleInstruction', () => {
  describe('#save()', () => {
    /*
     * The role is the system prompt, and it is versioned the same way the instruction is: rewording
     * it must leave every earlier wording readable, each addressable by the `savedAt` it was written
     * under.
     *
     * It is tested separately rather than assumed from the instruction's test because the two rows
     * point at sinks of their own, and a model that pointed at the wrong one would still pass every
     * assertion made about the other table.
     *
     * The save is Arrange and reading the sink is the Act, for the reason given in the
     * instruction's test; the cases accumulate for the same reason too.
     */
    const cases = [
      {
        params: {
          role: 'Role generation 0002',
          savedAt: new Date('2026-09-25T04:04:04.004Z'),
        },
        expected: [
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            role: AI_AGENT.ASSET_MEDIA_EXTRACTION.ROLE_INSTRUCTION,
            savedAt: new Date('2026-09-24T00:00:04.004Z'),
          }),
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            role: 'Role generation 0002',
            savedAt: new Date('2026-09-25T04:04:04.004Z'),
          }),
        ],
      },
      {
        params: {
          role: 'Role generation 0003',
          savedAt: new Date('2026-09-25T05:05:05.005Z'),
        },
        expected: [
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            role: AI_AGENT.ASSET_MEDIA_EXTRACTION.ROLE_INSTRUCTION,
            savedAt: new Date('2026-09-24T00:00:04.004Z'),
          }),
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            role: 'Role generation 0002',
            savedAt: new Date('2026-09-25T04:04:04.004Z'),
          }),
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            role: 'Role generation 0003',
            savedAt: new Date('2026-09-25T05:05:05.005Z'),
          }),
        ],
      },
    ]

    test.each(cases)('role: $params.role', async ({
      params,
      expected,
    }) => {
      const liveRoleInstruction = await AiAgentRoleInstruction.findOne({
        where: {
          AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
        },
      })
      liveRoleInstruction.set(params)
      await liveRoleInstruction.save()

      const actual = await AiAgentRoleInstructionBk.findAll({
        where: {
          AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
        },
        order: [
          ['savedAt', 'ASC'],
        ],
      })

      expect(actual)
        .toEqual(expected)
    })
  })
})
