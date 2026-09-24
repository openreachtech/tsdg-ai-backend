import AI_AGENT_CONSTANT_HASH from '../../../../app/constants/aiAgentConstants.js'

import AiAgentDefaultInstruction from '../../../../sequelize/models/AiAgentDefaultInstruction.js'

const {
  AI_AGENT,
} = AI_AGENT_CONSTANT_HASH

describe('AiAgentDefaultInstruction', () => {
  describe('.update()', () => {
    /*
     * A static update is refused, and the refusal is the contract rather than a limitation being
     * worked around.
     *
     * Sequelize decides how `Model.update()` writes from the data, not from the call: when every
     * matched row produces the same changed-value set it writes one statement and includes the
     * field the stamp hook set, and when the sets differ it writes row by row with `hooks: false`
     * and leaves that field out. The sink is appended either way, so the second shape files a
     * generation the live row never carried — and the live row's own marker then resolves to a
     * wording that has already been replaced.
     *
     * The refusal is unconditional and throws before the `where` is ever read, so the two cases
     * below cannot tell one implementation from another today. The second is kept for the shape it
     * pins rather than the branch it reaches: it is the case that fails if the refusal is ever
     * softened into a conditional one, which is the only way the defect above returns.
     */
    describe('should refuse every static update', () => {
      const cases = [
        {
          params: {
            values: {
              instruction: 'A rewording one matched row would have taken',
            },
            options: {
              where: {
                AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
              },
            },
          },
          expected: 'AiAgentDefaultInstruction.update() is refused. Load the rows and save() each one.',
        },
        {
          params: {
            values: {
              instruction: 'A rewording two matched rows would have taken',
            },
            options: {
              where: {
                AiAgentId: [
                  10130001,
                  10130002,
                ],
              },
            },
          },
          expected: 'AiAgentDefaultInstruction.update() is refused. Load the rows and save() each one.',
        },
      ]

      test.each(cases)('instruction: $params.values.instruction', async ({
        params,
        expected,
      }) => {
        const actual = () => AiAgentDefaultInstruction.update(params.values, params.options) // Arrange + Act

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiAgentDefaultInstruction', () => {
  describe('.bulkCreate()', () => {
    /*
     * The four options the forced `individualHooks` stops honoring are refused by name.
     *
     * Under that flag Sequelize never computes the `upsertKeys` that `updateOnDuplicate` needs, and
     * deletes both `ignoreDuplicates` and `fields` outright — so a duplicate raises where it would
     * have been skipped, and a caller who named a subset of fields has every attribute written
     * without being told. An `include` naming a `hasMany` inserts its parent twice; a `belongsTo`
     * include survives, because `save()` writes that association itself.
     *
     * The guard reads the option name, not its value, so the refusal is deliberately wider than the
     * hazard: an empty or absent `include` is refused too. Each case is refused before a row is
     * written, which is why these live here rather than beside the writing half of the same method.
     */
    describe('should refuse an option the forced per-row hooks stop honoring', () => {
      const cases = [
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                instruction: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              updateOnDuplicate: [
                'instruction',
              ],
            },
          },
          label: 'updateOnDuplicate',
          expected: 'AiAgentDefaultInstruction.bulkCreate() refuses the option: updateOnDuplicate',
        },
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                instruction: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              ignoreDuplicates: true,
            },
          },
          label: 'ignoreDuplicates',
          expected: 'AiAgentDefaultInstruction.bulkCreate() refuses the option: ignoreDuplicates',
        },
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                instruction: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              fields: [
                'AiAgentId',
              ],
            },
          },
          label: 'fields',
          expected: 'AiAgentDefaultInstruction.bulkCreate() refuses the option: fields',
        },
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                instruction: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              include: [
                {
                  association: 'aiAgentDefaultInstructions',
                },
              ],
            },
          },
          label: 'include naming a hasMany, the shape that inserts a parent twice',
          expected: 'AiAgentDefaultInstruction.bulkCreate() refuses the option: include',
        },
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                instruction: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              include: [],
            },
          },
          label: 'include carrying nothing, refused because the guard reads the name',
          expected: 'AiAgentDefaultInstruction.bulkCreate() refuses the option: include',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const actual = () => AiAgentDefaultInstruction.bulkCreate(params.records, params.options) // Arrange + Act

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiAgentDefaultInstruction', () => {
  describe('.extractRefusedBulkCreateOptionName()', () => {
    describe('should name the refused option the caller passed', () => {
      const cases = [
        {
          params: {
            options: {
              updateOnDuplicate: [
                'instruction',
              ],
            },
          },
          label: 'updateOnDuplicate',
          expected: 'updateOnDuplicate',
        },
        {
          params: {
            options: {
              ignoreDuplicates: true,
            },
          },
          label: 'ignoreDuplicates',
          expected: 'ignoreDuplicates',
        },
        {
          params: {
            options: {
              fields: [
                'AiAgentId',
              ],
            },
          },
          label: 'fields',
          expected: 'fields',
        },
        {
          params: {
            options: {
              include: [],
            },
          },
          label: 'include',
          expected: 'include',
        },
        {
          params: {
            options: {
              ignoreDuplicates: true,
              include: [],
            },
          },
          label: 'two refused options at once, the first declared one wins',
          expected: 'ignoreDuplicates',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const actual = AiAgentDefaultInstruction.extractRefusedBulkCreateOptionName(params) // Act

        expect(actual) // Assert
          .toBe(expected)
      })
    })
  })
})

describe('AiAgentDefaultInstruction', () => {
  describe('.extractRefusedBulkCreateOptionName()', () => {
    describe('should return null when no refused option was passed', () => {
      const cases = [
        {
          params: {
            options: {},
          },
          label: 'no option at all',
        },
        {
          params: {
            options: {
              transaction: null,
            },
          },
          label: 'an option this model does not refuse',
        },
        {
          params: {
            options: {
              validate: true,
              returning: true,
            },
          },
          label: 'two options this model does not refuse',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const actual = AiAgentDefaultInstruction.extractRefusedBulkCreateOptionName(params) // Act

        expect(actual) // Assert
          .toBeNull()
      })
    })
  })
})
