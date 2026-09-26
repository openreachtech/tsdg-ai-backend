import {
  DataTypes,
} from 'sequelize'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

import AiRunMedia from '../../../../sequelize/models/AiRunMedia.js'

/*
 * The medium a run was handed, asked without a row and without a write.
 *
 * Every member below is read off the declaration itself, so nothing here reads a table.
 *
 * The association cases carry the foreign key each relation resolves to, and that is the point of
 * them rather than a restatement of the declaration: Sequelize builds a key from the singular of a
 * model name, and the singular of `AiRunMedia` is `AiRunMedium`. Left to the default, the relation
 * to the uploaded files would look for a `AiRunMediumId` column no table has - so a case that
 * asserted only the association's existence would pass against exactly the wiring that is broken.
 */

describe('AiRunMedia', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AiRunMedia.prototype

      expect(received)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('AiRunMedia', () => {
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
            attributeName: 'AiRunId',
          },
        },
        {
          params: {
            attributeName: 'mediaKey',
          },
        },
        {
          params: {
            attributeName: 'AiRunMediaCategoryId',
          },
        },
        {
          params: {
            attributeName: 'mimeType',
          },
        },
        {
          params: {
            attributeName: 'byteSize',
          },
        },
        {
          params: {
            attributeName: 'isReadable',
          },
        },
        {
          params: {
            attributeName: 'fetchedAt',
          },
        },
      ]

      test.each(cases)('attributeName: $params.attributeName', ({
        params,
      }) => {
        const actual = AiRunMedia.createAttributes(DataTypes) // Act

        expect(actual) // Assert
          .toHaveProperty(params.attributeName)
      })
    })
  })
})

describe('AiRunMedia', () => {
  describe('.createAttributes()', () => {
    /*
     * `id` is not among the cases: it is spread from the shared attribute factory, so its shape is
     * that factory's contract and not this model's. Its presence is pinned above.
     *
     * `fetchedAt` is the one nullable column, and it is here for that: a medium that has not been
     * fetched has no instant to record, and a column declared NOT NULL would force a false one.
     */
    describe('should declare the shape of each column it writes itself', () => {
      const cases = [
        {
          params: {
            attributeName: 'AiRunId',
          },
          expected: {
            type: DataTypes.BIGINT,
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'mediaKey',
          },
          expected: {
            type: DataTypes.STRING(191),
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'AiRunMediaCategoryId',
          },
          expected: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'mimeType',
          },
          expected: {
            type: DataTypes.STRING(191),
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'byteSize',
          },
          expected: {
            type: DataTypes.BIGINT,
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'isReadable',
          },
          expected: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
          },
        },
        {
          params: {
            attributeName: 'fetchedAt',
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
        const actual = AiRunMedia.createAttributes(DataTypes) // Act

        expect(actual) // Assert
          .toHaveProperty(params.attributeName, expected)
      })
    })
  })
})

describe('AiRunMedia', () => {
  describe('.associations', () => {
    describe('should hold each relation this model declares', () => {
      const cases = [
        {
          params: {
            associationName: 'AiRun',
          },
          expected: expect.objectContaining({
            associationType: 'BelongsTo',
            foreignKey: 'AiRunId',
          }),
        },
        {
          params: {
            associationName: 'AiRunMediaCategory',
          },
          expected: expect.objectContaining({
            associationType: 'BelongsTo',
            foreignKey: 'AiRunMediaCategoryId',
          }),
        },
        {
          params: {
            associationName: 'ProviderUploadedFiles',
          },
          expected: expect.objectContaining({
            associationType: 'HasMany',
            foreignKey: 'AiRunMediaId',
          }),
        },
      ]

      test.each(cases)('associationName: $params.associationName', ({
        params,
        expected,
      }) => {
        const actual = AiRunMedia.associations // Act

        expect(actual) // Assert
          .toHaveProperty(params.associationName, expected)
      })
    })
  })
})

describe('AiRunMedia', () => {
  describe('.tableName', () => {
    /*
     * `media` is a plural that pluralizes to itself, so the name Sequelize infers is the one the
     * migration created and no `tableName` is stated on the model. The inference is worth pinning
     * precisely because it is silent: were it ever to resolve to `ai_run_medias`, every read of
     * this model would fail against a table that exists.
     */
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = 'ai_run_media'

        const actual = AiRunMedia.tableName // Act

        expect(actual) // Assert
          .toBe(expected)
      })
    })
  })
})
