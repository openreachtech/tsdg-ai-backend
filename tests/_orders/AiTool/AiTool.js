import Sequelize from 'sequelize'

import AiTool from '../../../sequelize/models/AiTool.js'

const {
  UniqueConstraintError,
} = Sequelize

describe('AiTool', () => {
  describe('.create()', () => {
    /*
     * A tool is offered to a model under its name, and the function call the model answers with
     * comes back carrying that name and nothing else. Two rows sharing one name would put two
     * schemas behind one call, and the step reading it could not say which of them was meant — so
     * the second row is refused by the UNIQUE index on the column rather than discovered in a run.
     *
     * The names are the seeded fixtures' own, because the refusal is only observable against a name
     * some other row already holds. Both cases refuse before anything is written, so neither leaves
     * a row behind.
     */
    describe('should refuse a name another tool already holds', () => {
      const cases = [
        {
          input: {
            id: 10135011,
            name: 'visible_fixture_tool', // the name of a seeded fixture tool
            description: 'Fixture tool claiming a name a seeded tool already holds.',
            payload: '{"name":"visible_fixture_tool"}',
            displayOrder: 110,
            isVisible: true,
            savedAt: new Date('2026-09-12T01:01:01.001Z'),
          },
        },
        {
          input: {
            id: 10135012,
            name: 'shared_fixture_tool', // the name of another seeded fixture tool
            description: 'Fixture tool claiming the name of the shared seeded tool.',
            payload: '{"name":"shared_fixture_tool"}',
            displayOrder: 120,
            isVisible: false,
            savedAt: new Date('2026-09-12T02:02:02.002Z'),
          },
        },
      ]

      test.each(cases)('name: $input.name', async ({
        input,
      }) => {
        const received = () => AiTool.create(input)

        await expect(received)
          .rejects
          .toThrow(UniqueConstraintError)
      })
    })
  })
})

describe('AiTool', () => {
  describe('.create()', () => {
    /*
     * The constraint is on the name and on nothing else, which is what keeps the per-vendor rows of
     * one capability legal: they are stored under the names their vendors give them, so they are
     * different names and the index never sees them as a clash. Both cases here differ from every
     * seeded row and from each other in the name alone, and are expected to be written.
     *
     * Without this the describe above would agree with a `.create()` that refused everything.
     */
    describe('should accept a name no other tool holds', () => {
      const cases = [
        {
          input: {
            id: 10135021,
            name: 'alpha_fixture_vendor_tool',
            description: 'Fixture tool naming one vendor\'s form of a shared capability.',
            payload: '{"name":"alpha_fixture_vendor_tool"}',
            displayOrder: 210,
            isVisible: true,
            savedAt: new Date('2026-09-12T03:03:03.003Z'),
          },
          expected: expect.objectContaining({
            id: 10135021,
            name: 'alpha_fixture_vendor_tool',
            description: 'Fixture tool naming one vendor\'s form of a shared capability.',
            payload: '{"name":"alpha_fixture_vendor_tool"}',
            displayOrder: 210,
            isVisible: true,
            savedAt: new Date('2026-09-12T03:03:03.003Z'),
          }),
        },
        {
          input: {
            id: 10135022,
            name: 'beta_fixture_vendor_tool',
            description: 'Fixture tool naming another vendor\'s form of the same capability.',
            payload: '{"name":"beta_fixture_vendor_tool"}',
            displayOrder: 220,
            isVisible: false,
            savedAt: new Date('2026-09-12T04:04:04.004Z'),
          },
          expected: expect.objectContaining({
            id: 10135022,
            name: 'beta_fixture_vendor_tool',
            description: 'Fixture tool naming another vendor\'s form of the same capability.',
            payload: '{"name":"beta_fixture_vendor_tool"}',
            displayOrder: 220,
            isVisible: false,
            savedAt: new Date('2026-09-12T04:04:04.004Z'),
          }),
        },
      ]

      test.each(cases)('name: $input.name', async ({
        input,
        expected,
      }) => {
        const received = await AiTool.create(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
