import AI_AGENT_CONSTANT_HASH from '../../../app/constants/aiAgentConstants.js'

import AiAgentDefaultInstruction from '../../../sequelize/models/AiAgentDefaultInstruction.js'
import AiAgentDefaultInstructionBk from '../../../sequelize/models/AiAgentDefaultInstructionBk.js'

const {
  AI_AGENT,
} = AI_AGENT_CONSTANT_HASH

describe('AiAgentDefaultInstruction', () => {
  describe('#save()', () => {
    /*
     * Rewording the instruction must leave every earlier wording readable, and each wording must
     * stay addressable by the `savedAt` it was written under — that is what a model call records as
     * the version of the prompt it sent.
     *
     * The save is the Arrange step and reading the sink is the Act, because the mixin's effect is a
     * row in another table and not a return value: `.save()` answers with the live row, which by
     * definition holds only the newest wording and so cannot say anything about the older ones.
     *
     * The cases run in order and their expectations accumulate on purpose. One case could show that
     * a wording reached the sink; only a second, expecting the first one still to be there beside
     * it, shows that the sink appends rather than replaces.
     *
     * The baseline generation is the one the seeder installed. Its text is read from the same
     * constant the seeder read, so a reword of the baseline needs no edit here — and its `savedAt`
     * is written out, because that value is the identifier under test and a test that took it from
     * the row would assert nothing about it.
     */
    const cases = [
      {
        params: {
          instruction: 'Default instruction generation 0002',
          savedAt: new Date('2026-09-25T02:02:02.002Z'),
        },
        expected: [
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            instruction: AI_AGENT.ASSET_MEDIA_EXTRACTION.DEFAULT_INSTRUCTION,
            savedAt: new Date('2026-09-24T00:00:03.003Z'),
          }),
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            instruction: 'Default instruction generation 0002',
            savedAt: new Date('2026-09-25T02:02:02.002Z'),
          }),
        ],
      },
      {
        params: {
          instruction: 'Default instruction generation 0003',
          savedAt: new Date('2026-09-25T03:03:03.003Z'),
        },
        expected: [
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            instruction: AI_AGENT.ASSET_MEDIA_EXTRACTION.DEFAULT_INSTRUCTION,
            savedAt: new Date('2026-09-24T00:00:03.003Z'),
          }),
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            instruction: 'Default instruction generation 0002',
            savedAt: new Date('2026-09-25T02:02:02.002Z'),
          }),
          expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            instruction: 'Default instruction generation 0003',
            savedAt: new Date('2026-09-25T03:03:03.003Z'),
          }),
        ],
      },
    ]

    test.each(cases)('instruction: $params.instruction', async ({
      params,
      expected,
    }) => {
      const liveInstruction = await AiAgentDefaultInstruction.findOne({
        where: {
          AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
        },
      })
      liveInstruction.set(params)
      await liveInstruction.save()

      const actual = await AiAgentDefaultInstructionBk.findAll({
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
