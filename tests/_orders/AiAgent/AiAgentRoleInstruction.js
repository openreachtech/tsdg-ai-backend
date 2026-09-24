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

describe('AiAgentRoleInstruction', () => {
  describe('.update()', () => {
    /*
     * A static `.update()` has to leave the same trail a `.save()` leaves.
     *
     * It was once written here that it could not: that `.update()` passes the row through without
     * the stamp and without the sink, and that forcing `individualHooks` would stamp the instant
     * but still skip the sink. Neither is true. `beforeSave` and `afterSave` are proxy hook types,
     * so the stamp is also registered as `beforeUpdate` and the backup mixin's append as
     * `afterUpdate`, and `.update()` runs both. The model turns `individualHooks` on from
     * `beforeBulkUpdate`, so no call site has to know any of this.
     *
     * It is asserted here as well as on the instruction table, and for the same reason the
     * describes above are: the two rows point at sinks of their own, and a model wired to the wrong
     * one would still pass every assertion made about the other table.
     *
     * The sink's **newest** generation is what is read, and each case hands `.update()` a `savedAt`
     * older than every generation already there. A writer whose instant survived would not be the
     * newest generation, so the wording this case wrote would not be the row that comes back.
     */
    describe('should append the generation a static update wrote', () => {
      const cases = [
        {
          params: {
            role: 'Role generation 0006',
            // older than every generation in the sink, and never to be honored
            savedAt: new Date('2020-05-05T05:05:05.005Z'),
          },
          expected: expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            role: 'Role generation 0006',
          }),
        },
        {
          params: {
            role: 'Role generation 0007',
            savedAt: new Date('2020-06-06T06:06:06.006Z'),
          },
          expected: expect.objectContaining({
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
            role: 'Role generation 0007',
          }),
        },
      ]

      test.each(cases)('role: $params.role', async ({
        params,
        expected,
      }) => {
        await AiAgentRoleInstruction.update(params, {
          where: {
            AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
        })

        const received = await AiAgentRoleInstructionBk.findOne({
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

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiAgentRoleInstruction', () => {
  describe('.bulkCreate()', () => {
    /*
     * A `.bulkCreate()` has to leave the same trail too, one sink row per row it writes.
     *
     * The rows are written under agent ids no agent row carries. That is deliberate: this table
     * declares no database-level foreign key, and every agent the seeders install already stands
     * for a case some other test reads — giving one of them a role it was seeded without would
     * change what that fixture means. An id belonging to nothing belongs to nobody.
     *
     * The last case writes two rows at once, because that is the branch `individualHooks` changes
     * the shape of: one sink row has to arrive per row created, not one per call.
     *
     * `savedAt` is asserted only as a date. Each case hands one in, it is thrown away, and what
     * replaces it is a reading of the clock that no literal can name; that the writer's value does
     * not survive is what the `.update()` and `#save()` describes establish. What this describe
     * establishes is that the sink is reached at all — without the hook it holds nothing for these
     * agents.
     */
    describe('should append one generation per row created', () => {
      const cases = [
        {
          params: {
            rows: [
              {
                AiAgentId: 10137011,
                role: 'Role of the singly created row',
                savedAt: new Date('2020-07-07T07:07:07.007Z'),
              },
            ],
            aiAgentIds: [
              10137011,
            ],
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137011,
              role: 'Role of the singly created row',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
        {
          params: {
            rows: [
              {
                AiAgentId: 10137012,
                role: 'Role of the other singly created row',
                savedAt: new Date('2020-08-08T08:08:08.008Z'),
              },
            ],
            aiAgentIds: [
              10137012,
            ],
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137012,
              role: 'Role of the other singly created row',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
        {
          params: {
            rows: [
              {
                AiAgentId: 10137013,
                role: 'Role of the earlier row of a pair',
                savedAt: new Date('2020-09-09T09:09:09.009Z'),
              },
              {
                AiAgentId: 10137014,
                role: 'Role of the later row of a pair',
                savedAt: new Date('2020-10-10T10:10:10.010Z'),
              },
            ],
            aiAgentIds: [
              10137013,
              10137014,
            ],
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137013,
              role: 'Role of the earlier row of a pair',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
            expect.objectContaining({
              AiAgentId: 10137014,
              role: 'Role of the later row of a pair',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
      ]

      test.each(cases)('rows[0].AiAgentId: $params.rows.0.AiAgentId', async ({
        params,
        expected,
      }) => {
        await AiAgentRoleInstruction.bulkCreate(params.rows)

        const received = await AiAgentRoleInstructionBk.findAll({
          where: {
            AiAgentId: params.aiAgentIds,
          },
          order: [
            [
              'AiAgentId',
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
     * The stamp must never be one the row has already been filed under, and a reading of the clock
     * alone does not promise that.
     *
     * The sink refuses a second row under an agent's existing instant, and it refuses it from
     * `afterSave` — after the live row has already been written, and outside any transaction, since
     * a bare `.save()` passes none. Two saves of one row inside the same millisecond would leave
     * the live row reworded, the sink without that wording, and the caller holding an exception
     * saying nothing was written: a `prompt_version` resolving to text the live row does not hold.
     * The stamp is therefore taken as one past the instant the row already holds whenever the clock
     * does not exceed it.
     *
     * A same-millisecond pair cannot be arranged on demand, but the condition behind it can: a row
     * whose instant the clock does not exceed. Each case installs one by saving with `hooks: false`
     * — a writer-owned bypass that survives at the model level — so the instant it names is the one
     * the row is left holding. Two rewords then follow, and the two instants they are filed under
     * are the whole of the expectation: exactly one and two milliseconds past the instant
     * installed, in that order, both present. A stamp that merely read the clock would file both
     * behind the row's own instant rather than ahead of it.
     *
     * The rows are written under agent ids no agent row carries, for the reason the `.bulkCreate()`
     * describe gives.
     */
    describe('should stamp an instant past the one the row already holds', () => {
      const cases = [
        {
          params: {
            AiAgentId: 10137015,
            installedRole: 'Role installed ahead of the clock',
            installedSavedAt: new Date('2099-03-03T03:03:03.003Z'),
            firstRole: 'Role reworded once ahead of the clock',
            secondRole: 'Role reworded twice ahead of the clock',
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137015,
              role: 'Role reworded once ahead of the clock',
              savedAt: new Date('2099-03-03T03:03:03.004Z'),
            }),
            expect.objectContaining({
              AiAgentId: 10137015,
              role: 'Role reworded twice ahead of the clock',
              savedAt: new Date('2099-03-03T03:03:03.005Z'),
            }),
          ],
        },
        {
          params: {
            AiAgentId: 10137016,
            installedRole: 'Role installed far ahead of the clock',
            installedSavedAt: new Date('2099-04-04T04:04:04.004Z'),
            firstRole: 'Role reworded once far ahead of the clock',
            secondRole: 'Role reworded twice far ahead of the clock',
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137016,
              role: 'Role reworded once far ahead of the clock',
              savedAt: new Date('2099-04-04T04:04:04.005Z'),
            }),
            expect.objectContaining({
              AiAgentId: 10137016,
              role: 'Role reworded twice far ahead of the clock',
              savedAt: new Date('2099-04-04T04:04:04.006Z'),
            }),
          ],
        },
      ]

      test.each(cases)('AiAgentId: $params.AiAgentId', async ({
        params,
        expected,
      }) => {
        const installedRoleInstruction = AiAgentRoleInstruction.build({
          AiAgentId: params.AiAgentId,
          role: params.installedRole,
          savedAt: params.installedSavedAt,
        })
        await installedRoleInstruction.save({
          hooks: false,
        })
        installedRoleInstruction.set({
          role: params.firstRole,
        })
        await installedRoleInstruction.save()
        installedRoleInstruction.set({
          role: params.secondRole,
        })
        await installedRoleInstruction.save()

        const received = await AiAgentRoleInstructionBk.findAll({
          where: {
            AiAgentId: params.AiAgentId,
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
