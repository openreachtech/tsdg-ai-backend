import {
  DataTypes,
} from 'sequelize'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

import ProviderUploadedFile from '../../../../sequelize/models/ProviderUploadedFile.js'

/*
 * The egress record, asked without a row and without a write.
 *
 * Every member below is read off the declaration itself, so nothing here reads a table.
 *
 * The association to the medium carries both the foreign key and the name it loads under, and both
 * are the point of the case rather than a restatement of the declaration: Sequelize builds each of
 * them from the singular of the target model name, and the singular of `AiRunMedia` is
 * `AiRunMedium`. Left to the default, this relation would look for a `AiRunMediumId` column no
 * table has, and would load the medium under a name this project uses nowhere else.
 */

describe('ProviderUploadedFile', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = ProviderUploadedFile.prototype

      expect(received)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('ProviderUploadedFile', () => {
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
            attributeName: 'AiRunMediaId',
          },
        },
        {
          params: {
            attributeName: 'AiProviderId',
          },
        },
        {
          params: {
            attributeName: 'providerFileName',
          },
        },
        {
          params: {
            attributeName: 'uploadedAt',
          },
        },
        {
          params: {
            attributeName: 'expiresAt',
          },
        },
      ]

      test.each(cases)('attributeName: $params.attributeName', ({
        params,
      }) => {
        const actual = ProviderUploadedFile.createAttributes(DataTypes) // Act

        expect(actual) // Assert
          .toHaveProperty(params.attributeName)
      })
    })
  })
})

describe('ProviderUploadedFile', () => {
  describe('.createAttributes()', () => {
    /*
     * `id` is not among the cases: it is spread from the shared attribute factory, so its shape is
     * that factory's contract and not this model's. Its presence is pinned above.
     *
     * `expiresAt` is the one nullable column, and it is here for that: a provider that states no
     * expiry leaves nothing to record, and a column declared NOT NULL would force an invented one.
     */
    describe('should declare the shape of each column it writes itself', () => {
      const cases = [
        {
          params: {
            attributeName: 'AiRunMediaId',
          },
          expected: {
            type: DataTypes.BIGINT,
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'AiProviderId',
          },
          expected: {
            type: DataTypes.BIGINT,
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'providerFileName',
          },
          expected: {
            type: DataTypes.TEXT,
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'uploadedAt',
          },
          expected: {
            type: DataTypes.DATE(3),
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'expiresAt',
          },
          expected: {
            type: DataTypes.DATE(3),
            allowNull: true,
          },
        },
      ]

      test.each(cases)('attributeName: $params.attributeName', ({
        params,
        expected,
      }) => {
        const actual = ProviderUploadedFile.createAttributes(DataTypes) // Act

        expect(actual) // Assert
          .toHaveProperty(params.attributeName, expected)
      })
    })
  })
})

describe('ProviderUploadedFile', () => {
  describe('.associations', () => {
    describe('should hold each relation this model declares', () => {
      const cases = [
        {
          params: {
            associationName: 'AiRunMedia',
          },
          expected: expect.objectContaining({
            associationType: 'BelongsTo',
            foreignKey: 'AiRunMediaId',
          }),
        },
        {
          params: {
            associationName: 'AiProvider',
          },
          expected: expect.objectContaining({
            associationType: 'BelongsTo',
            foreignKey: 'AiProviderId',
          }),
        },
      ]

      test.each(cases)('associationName: $params.associationName', ({
        params,
        expected,
      }) => {
        const actual = ProviderUploadedFile.associations // Act

        expect(actual) // Assert
          .toHaveProperty(params.associationName, expected)
      })
    })
  })
})
