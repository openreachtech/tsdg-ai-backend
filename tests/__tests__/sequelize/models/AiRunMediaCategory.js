import {
  DataTypes,
} from 'sequelize'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

import AiRunMediaCategory from '../../../../sequelize/models/AiRunMediaCategory.js'

/*
 * The master table of media kinds, asked without a row and without a write.
 *
 * Every member below is read off the declaration itself, so nothing here reads a table. What the
 * seeded rows are is asked of the constant that supplies them, in
 * `tests/__tests__/constants/aiRunMediaCategoryConstants.js`.
 */

describe('AiRunMediaCategory', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AiRunMediaCategory.prototype

      expect(received)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('AiRunMediaCategory', () => {
  describe('.createAttributes()', () => {
    describe('should declare one attribute per column of its table', () => {
      const cases = [
        {
          params: {
            attributeName: 'id',
          },
        },
        {
          params: {
            attributeName: 'name',
          },
        },
        {
          params: {
            attributeName: 'displayName',
          },
        },
        {
          params: {
            attributeName: 'displayOrder',
          },
        },
        {
          params: {
            attributeName: 'handlingName',
          },
        },
      ]

      test.each(cases)('attributeName: $params.attributeName', ({
        params,
      }) => {
        const actual = AiRunMediaCategory.createAttributes(DataTypes) // Act

        expect(actual) // Assert
          .toHaveProperty(params.attributeName)
      })
    })
  })
})

describe('AiRunMediaCategory', () => {
  describe('.createAttributes()', () => {
    /*
     * `id` is not among the cases: it is spread from the shared attribute factory, so its shape is
     * that factory's contract and not this model's. Its presence is pinned above.
     */
    describe('should declare the shape of each column it writes itself', () => {
      const cases = [
        {
          params: {
            attributeName: 'name',
          },
          expected: {
            type: DataTypes.STRING(32),
            allowNull: false,
            unique: true,
          },
        },
        {
          params: {
            attributeName: 'displayName',
          },
          expected: {
            type: DataTypes.STRING(191),
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'displayOrder',
          },
          expected: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'handlingName',
          },
          expected: {
            type: DataTypes.STRING(32),
            allowNull: false,
          },
        },
      ]

      test.each(cases)('attributeName: $params.attributeName', ({
        params,
        expected,
      }) => {
        const actual = AiRunMediaCategory.createAttributes(DataTypes) // Act

        expect(actual) // Assert
          .toHaveProperty(params.attributeName, expected)
      })
    })
  })
})

describe('AiRunMediaCategory', () => {
  describe('.associations', () => {
    /*
     * A master table holds none of its own. The medium that names a kind holds the key, and it is
     * the side that declares the relation - the same way every other master table of this schema
     * is wired.
     */
    describe('should hold no association', () => {
      test('should be fixed value', () => {
        const expected = {}

        const actual = AiRunMediaCategory.associations // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})
