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
     * **Every case supplies a `savedAt` of its own, and every one of them is older than the
     * baseline generation already in the sink.** The instant is the server's to assign, so what a
     * writer sets is expected to be thrown away — and the sink is read in ascending order of it, so
     * a writer whose instant survived would file the newest wording ahead of the oldest and the
     * array would come back in the wrong order. Nothing else in this test would have to change for
     * that to be caught.
     *
     * The baseline generation is the one the seeder installed, which no hook ran for: its text is
     * read from the same constant the seeder read, so a reword of the baseline needs no edit here,
     * and its `savedAt` is written out because a seeded row is the one row whose instant is a
     * literal rather than a reading of the clock.
     */
    describe('should append each generation under an instant of the server\'s own', () => {
      const cases = [
        {
          input: {
            instruction: 'Default instruction generation 0002',
            // older than every generation in the sink, and never to be honored
            savedAt: new Date('2020-01-01T01:01:01.001Z'),
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
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
        {
          input: {
            instruction: 'Default instruction generation 0003',
            savedAt: new Date('2020-02-02T02:02:02.002Z'),
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
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
            expect.objectContaining({
              AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
              instruction: 'Default instruction generation 0003',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
        expected,
      }) => {
        const liveInstruction = await AiAgentDefaultInstruction.findOne({
          where: {
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
        })
        liveInstruction.set(input)
        await liveInstruction.save()

        const received = await AiAgentDefaultInstructionBk.findAll({
          where: {
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
          order: [
            [
              'savedAt',
              'ASC',
            ],
          ],
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiAgentDefaultInstruction', () => {
  describe('#save()', () => {
    /*
     * The instant the saved row comes back holding is the instant its generation is filed in the
     * sink under. That is the whole of what `ai_model_calls.prompt_version` leans on: the recorder
     * reads the value off the row it just wrote, and months later somebody resolves that value back
     * through the sink and expects the wording that was actually sent.
     *
     * The sink's newest generation is the Act, and the live row's own instant is the expectation,
     * because the two are the pair under test — a literal could only be one of them, and a literal
     * the test itself supplied would say nothing about either.
     *
     * The `savedAt` each case supplies is older than every generation already in the sink, so a
     * writer whose instant survived would not be the newest generation at all and the two values
     * would not meet.
     */
    describe('should file the generation under the instant the saved row came back with', () => {
      const cases = [
        {
          input: {
            instruction: 'Default instruction generation 0004',
            savedAt: new Date('2020-03-03T03:03:03.003Z'),
          },
        },
        {
          input: {
            instruction: 'Default instruction generation 0005',
            savedAt: new Date('2020-04-04T04:04:04.004Z'),
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
      }) => {
        const liveInstruction = await AiAgentDefaultInstruction.findOne({
          where: {
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
        })
        liveInstruction.set(input)
        await liveInstruction.save()
        const expected = liveInstruction.savedAt

        const savedInstruction = await AiAgentDefaultInstructionBk.findOne({
          where: {
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
          order: [
            [
              'savedAt',
              'DESC',
            ],
          ],
        })
        const received = savedInstruction.savedAt

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
