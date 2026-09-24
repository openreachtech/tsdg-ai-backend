import AI_AGENT_CONSTANT_HASH from '../../../../app/constants/aiAgentConstants.js'

import AiAgentRoleInstruction from '../../../../sequelize/models/AiAgentRoleInstruction.js'

const {
  AI_AGENT,
} = AI_AGENT_CONSTANT_HASH

describe('AiAgentRoleInstruction', () => {
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
              role: 'A rewording one matched row would have taken',
            },
            options: {
              where: {
                AiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
              },
            },
          },
          expected: 'AiAgentRoleInstruction.update() is refused. Load the rows and save() each one.',
        },
        {
          params: {
            values: {
              role: 'A rewording two matched rows would have taken',
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
          expected: 'AiAgentRoleInstruction.update() is refused. Load the rows and save() each one.',
        },
      ]

      test.each(cases)('role: $params.values.role', async ({
        params,
        expected,
      }) => {
        const actual = () => AiAgentRoleInstruction.update(params.values, params.options) // Arrange + Act

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiAgentRoleInstruction', () => {
  describe('.bulkCreate()', () => {
    /*
     * The four options the forced `individualHooks` stops honoring are refused by name.
     *
     * Under that flag Sequelize never computes the `upsertKeys` that `updateOnDuplicate` needs, and
     * deletes both `ignoreDuplicates` and `fields` outright — so a duplicate raises where it would
     * have been skipped, and a caller who named a subset of fields has every attribute written
     * without being told. An `include` naming a `hasMany` writes the associated rows twice, which
     * their table's primary key then rejects; a `belongsTo` include survives, because `save()`
     * writes that association itself.
     *
     * The guard reads the option name, not its value, so the refusal is deliberately wider than the
     * hazard: an empty `include` is refused too. **Neither include case below carries the hazard
     * shape, and neither claims to.** This model declares one association and it is a `belongsTo`,
     * so no case written here can be a `hasMany` include; the two cases witness that the guard
     * fires on the option name whatever the value is, and the `hasMany` mechanism stays prose in
     * the model. Each case is refused before a row is written, which is why these live here rather
     * than beside the writing half of the same method.
     */
    describe('should refuse an option the forced per-row hooks stop honoring', () => {
      const cases = [
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                role: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              updateOnDuplicate: [
                'role',
              ],
            },
          },
          label: 'updateOnDuplicate',
          expected: 'AiAgentRoleInstruction.bulkCreate() refuses the option: updateOnDuplicate',
        },
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                role: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              ignoreDuplicates: true,
            },
          },
          label: 'ignoreDuplicates',
          expected: 'AiAgentRoleInstruction.bulkCreate() refuses the option: ignoreDuplicates',
        },
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                role: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              fields: [
                'AiAgentId',
              ],
            },
          },
          label: 'fields',
          expected: 'AiAgentRoleInstruction.bulkCreate() refuses the option: fields',
        },
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                role: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              include: [
                {
                  association: 'AiAgent',
                },
              ],
            },
          },
          label: 'include naming the one association this model has',
          expected: 'AiAgentRoleInstruction.bulkCreate() refuses the option: include',
        },
        {
          params: {
            records: [
              {
                AiAgentId: 10130001,
                role: 'A row no refused bulk create ever writes',
              },
            ],
            options: {
              include: [],
            },
          },
          label: 'include carrying nothing at all',
          expected: 'AiAgentRoleInstruction.bulkCreate() refuses the option: include',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const actual = () => AiAgentRoleInstruction.bulkCreate(params.records, params.options) // Arrange + Act

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiAgentRoleInstruction', () => {
  describe('.extractRefusedBulkCreateOptionName()', () => {
    describe('should name the refused option the caller passed', () => {
      const cases = [
        {
          params: {
            options: {
              updateOnDuplicate: [
                'role',
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
        const actual = AiAgentRoleInstruction.extractRefusedBulkCreateOptionName(params) // Act

        expect(actual) // Assert
          .toBe(expected)
      })
    })
  })
})

describe('AiAgentRoleInstruction', () => {
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
        const actual = AiAgentRoleInstruction.extractRefusedBulkCreateOptionName(params) // Act

        expect(actual) // Assert
          .toBeNull()
      })
    })
  })
})
