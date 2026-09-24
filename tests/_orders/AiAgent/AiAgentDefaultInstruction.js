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

describe('AiAgentDefaultInstruction', () => {
  describe('.bulkCreate()', () => {
    /*
     * A `.bulkCreate()` has to leave the same trail too, one sink row per row it writes.
     *
     * The rows are written under agent ids no agent row carries. That is deliberate: this table
     * declares no database-level foreign key, and every agent the seeders install already stands
     * for a case some other test reads — giving one of them an instruction it was seeded without
     * would change what that fixture means. An id belonging to nothing belongs to nobody.
     *
     * The last case writes two rows at once, because that is the branch `individualHooks` changes
     * the shape of: one sink row has to arrive per row created, not one per call.
     *
     * `savedAt` is asserted only as a date. Each case hands one in, it is thrown away, and what
     * replaces it is a reading of the clock that no literal can name; that the writer's value does
     * not survive is what the `#save()` describes establish. What this describe
     * establishes is that the sink is reached at all — without the hook it holds nothing for these
     * agents.
     */
    describe('should append one generation per row created', () => {
      const cases = [
        {
          params: {
            rows: [
              {
                AiAgentId: 10137001,
                instruction: 'Default instruction of the singly created row',
                savedAt: new Date('2020-07-07T07:07:07.007Z'),
              },
            ],
            aiAgentIds: [
              10137001,
            ],
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137001,
              instruction: 'Default instruction of the singly created row',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
        {
          params: {
            rows: [
              {
                AiAgentId: 10137002,
                instruction: 'Default instruction of the other singly created row',
                savedAt: new Date('2020-08-08T08:08:08.008Z'),
              },
            ],
            aiAgentIds: [
              10137002,
            ],
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137002,
              instruction: 'Default instruction of the other singly created row',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
        {
          params: {
            rows: [
              {
                AiAgentId: 10137003,
                instruction: 'Default instruction of the earlier row of a pair',
                savedAt: new Date('2020-09-09T09:09:09.009Z'),
              },
              {
                AiAgentId: 10137004,
                instruction: 'Default instruction of the later row of a pair',
                savedAt: new Date('2020-10-10T10:10:10.010Z'),
              },
            ],
            aiAgentIds: [
              10137003,
              10137004,
            ],
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137003,
              instruction: 'Default instruction of the earlier row of a pair',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
            expect.objectContaining({
              AiAgentId: 10137004,
              instruction: 'Default instruction of the later row of a pair',
              savedAt: expect.any(Date), // read from the clock at the moment of the save
            }),
          ],
        },
      ]

      test.each(cases)('rows[0].AiAgentId: $params.rows.0.AiAgentId', async ({
        params,
        expected,
      }) => {
        await AiAgentDefaultInstruction.bulkCreate(params.rows)

        const received = await AiAgentDefaultInstructionBk.findAll({
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

describe('AiAgentDefaultInstruction', () => {
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
            AiAgentId: 10137005,
            installedInstruction: 'Default instruction installed ahead of the clock',
            installedSavedAt: new Date('2099-01-01T00:00:00.000Z'),
            firstInstruction: 'Default instruction reworded once ahead of the clock',
            secondInstruction: 'Default instruction reworded twice ahead of the clock',
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137005,
              instruction: 'Default instruction reworded once ahead of the clock',
              savedAt: new Date('2099-01-01T00:00:00.001Z'),
            }),
            expect.objectContaining({
              AiAgentId: 10137005,
              instruction: 'Default instruction reworded twice ahead of the clock',
              savedAt: new Date('2099-01-01T00:00:00.002Z'),
            }),
          ],
        },
        {
          params: {
            AiAgentId: 10137006,
            installedInstruction: 'Default instruction installed far ahead of the clock',
            installedSavedAt: new Date('2099-02-02T02:02:02.002Z'),
            firstInstruction: 'Default instruction reworded once far ahead of the clock',
            secondInstruction: 'Default instruction reworded twice far ahead of the clock',
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137006,
              instruction: 'Default instruction reworded once far ahead of the clock',
              savedAt: new Date('2099-02-02T02:02:02.003Z'),
            }),
            expect.objectContaining({
              AiAgentId: 10137006,
              instruction: 'Default instruction reworded twice far ahead of the clock',
              savedAt: new Date('2099-02-02T02:02:02.004Z'),
            }),
          ],
        },
      ]

      test.each(cases)('AiAgentId: $params.AiAgentId', async ({
        params,
        expected,
      }) => {
        const installedInstruction = AiAgentDefaultInstruction.build({
          AiAgentId: params.AiAgentId,
          instruction: params.installedInstruction,
          savedAt: params.installedSavedAt,
        })
        await installedInstruction.save({
          hooks: false,
        })
        installedInstruction.set({
          instruction: params.firstInstruction,
        })
        await installedInstruction.save()
        installedInstruction.set({
          instruction: params.secondInstruction,
        })
        await installedInstruction.save()

        const received = await AiAgentDefaultInstructionBk.findAll({
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

describe('AiAgentDefaultInstruction', () => {
  describe('#update()', () => {
    /*
     * The refusal of the static `.update()` must not have taken the instance one with it.
     *
     * That method is the replacement callers are told to use, so a change that closed the static
     * path by closing both would satisfy every refusal test and leave nothing able to reword a row.
     * Nothing else in this suite would notice: the describes above reach the sink through `#save()`
     * and `.bulkCreate()`, never through `#update()`.
     *
     * The create and the update are both Arrange and reading the sink is the Act, as in the
     * describes above — the mixin's effect is a row in another table rather than a return value.
     *
     * Each case works on an agent id of its own, so the two cases cannot see each other's rows and
     * neither can disturb the accumulating expectations earlier in this file. The sink is read in
     * ascending order of the instant the server assigned, so the created wording comes back first
     * and the reworded one second.
     *
     * That ordering is **not** evidence that the writer's `savedAt` was discarded, and is not
     * offered as any: the stamp steps past whatever the row already held, so the created wording
     * sorts first either way. The `#save()` describes above are what establish the discarding.
     */
    describe('should append the generation an instance update wrote', () => {
      const cases = [
        {
          params: {
            seed: {
              AiAgentId: 10137007,
              instruction: 'Default instruction created before its first rewording',
              savedAt: new Date('2020-07-07T07:07:07.007Z'),
            },
            values: {
              instruction: 'Default instruction written by an instance update',
            },
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137007,
              instruction: 'Default instruction created before its first rewording',
            }),
            expect.objectContaining({
              AiAgentId: 10137007,
              instruction: 'Default instruction written by an instance update',
            }),
          ],
        },
        {
          params: {
            seed: {
              AiAgentId: 10137008,
              instruction: 'Default instruction created before its second rewording',
              savedAt: new Date('2020-08-08T08:08:08.008Z'),
            },
            values: {
              instruction: 'Default instruction written by another instance update',
            },
          },
          expected: [
            expect.objectContaining({
              AiAgentId: 10137008,
              instruction: 'Default instruction created before its second rewording',
            }),
            expect.objectContaining({
              AiAgentId: 10137008,
              instruction: 'Default instruction written by another instance update',
            }),
          ],
        },
      ]

      test.each(cases)('instruction: $params.values.instruction', async ({
        params,
        expected,
      }) => {
        const entity = await AiAgentDefaultInstruction.create(params.seed) // Arrange

        await entity.update(params.values)

        const received = await AiAgentDefaultInstructionBk.findAll({ // Act
          where: {
            AiAgentId: params.seed.AiAgentId,
          },
          order: [
            [
              'savedAt',
              'ASC',
            ],
          ],
        })

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})
