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
     *
     * Every case supplies a `savedAt` older than the baseline generation already in the sink, and
     * expects it to have been thrown away: the instant is the server's to assign, and the sink is
     * read in ascending order of it, so a writer whose instant survived would file the newest
     * wording ahead of the oldest and the array would come back in the wrong order.
     */
    describe('should append each generation under an instant of the server\'s own', () => {
      const cases = [
        {
          input: {
            role: 'Role generation 0002',
            // older than every generation in the sink, and never to be honored
            savedAt: new Date('2020-05-05T05:05:05.005Z'),
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
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
        {
          input: {
            role: 'Role generation 0003',
            savedAt: new Date('2020-06-06T06:06:06.006Z'),
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
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
            expect.objectContaining({
              AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
              role: 'Role generation 0003',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
      ]

      test.each(cases)('role: $input.role', async ({
        input,
        expected,
      }) => {
        const liveRoleInstruction = await AiAgentRoleInstruction.findOne({
          where: {
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
        })
        liveRoleInstruction.set(input)
        await liveRoleInstruction.save()

        const received = await AiAgentRoleInstructionBk.findAll({
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

describe('AiAgentRoleInstruction', () => {
  describe('#save()', () => {
    /*
     * The instant the saved row comes back holding is the instant its generation is filed in the
     * sink under, exactly as for the instruction — and it is asserted here rather than inferred
     * from there, because the role is written to a sink of its own.
     *
     * The sink's newest generation is the Act and the live row's own instant is the expectation,
     * because the two are the pair under test. The `savedAt` each case supplies is older than every
     * generation already in the sink, so a writer whose instant survived would not be the newest
     * generation at all and the two values would not meet.
     */
    describe('should file the generation under the instant the saved row came back with', () => {
      const cases = [
        {
          input: {
            role: 'Role generation 0004',
            savedAt: new Date('2020-07-07T07:07:07.007Z'),
          },
        },
        {
          input: {
            role: 'Role generation 0005',
            savedAt: new Date('2020-08-08T08:08:08.008Z'),
          },
        },
      ]

      test.each(cases)('role: $input.role', async ({
        input,
      }) => {
        const liveRoleInstruction = await AiAgentRoleInstruction.findOne({
          where: {
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
        })
        liveRoleInstruction.set(input)
        await liveRoleInstruction.save()
        const expected = liveRoleInstruction.savedAt

        const savedRoleInstruction = await AiAgentRoleInstructionBk.findOne({
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
        const received = savedRoleInstruction.savedAt

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
