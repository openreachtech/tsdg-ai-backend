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
     * Both cases are refused, and the second is the one that matters: a `where` matching two rows
     * is the shape that takes the branch a single-row update can never reach, so a guard covering
     * only one row would pass this describe while leaving the defect open.
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
     * The three options the forced `individualHooks` breaks are refused by name.
     *
     * Under that flag Sequelize takes a branch which never computes the `upsertKeys` that
     * `updateOnDuplicate` needs, deletes `ignoreDuplicates` outright, and skips the `BelongsTo`
     * pre-creation that `include` relies on. Only the first of the three fails loudly on its own;
     * the other two would do nothing and say nothing, which is the failure this table is built
     * against.
     *
     * Each case is refused before any row is written, which is why these live here rather than in
     * the order tests beside the writing half of the same method.
     */
    describe('should refuse an option the forced per-row hooks break', () => {
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
              include: [],
            },
          },
          label: 'include',
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
