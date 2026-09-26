import {
  DataTypes,
} from 'sequelize'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

import AiRunMedia from '../../../../sequelize/models/AiRunMedia.js'

/*
 * The medium a run was handed.
 *
 * Every member below is read off the declaration itself, and nothing here writes. The one
 * describe that does read a table is `.findAll()`, and it is there to hold two failed runs and
 * their media to one story ([[Q114]]).
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
  describe('.findAll()', () => {
    /*
     * What each failed run was handed, read back against the reason code its row carries.
     *
     * The two have to disagree with each other, and each has to agree with its own run. A run
     * refused for the size of a file was refused before anything was fetched, so its medium
     * declares a size over the cap and carries no `fetched_at`. A run that failed on its provider
     * had something to send, so its medium was fetched and read — and the model call the fixtures
     * hold for it is the call that errored.
     *
     * Reading the two in one place is what the fixture set lacked: the over-cap medium had been
     * hung on the run that failed on its provider, so one run read as having sent nothing and as
     * having called a provider at once, and no test was red ([[Q114]]). Move it back and this
     * describe fails.
     *
     * Each run holds exactly one medium, so the lists are single-element and nothing here depends
     * on the order a dialect hands rows back.
     */
    describe('should hold each failed run to the media its reason code implies', () => {
      const cases = [
        {
          params: {
            where: {
              AiRunId: 10010009, // PROVIDER_CALL_FAILED — fetched, read, and handed over
            },
          },
          expected: [
            expect.objectContaining({
              id: 10410018,
              mediaKey: 'media-key-street-frontage',
              byteSize: 356722,
              isReadable: true,
              fetchedAt: new Date('2026-09-12T09:09:09.909Z'),
            }),
          ],
        },
        {
          params: {
            where: {
              AiRunId: 10010011, // MEDIA_LIMIT_EXCEEDED — over the cap, so never fetched
            },
          },
          expected: [
            expect.objectContaining({
              id: 10410010,
              mediaKey: 'media-key-oversized-panorama',
              byteSize: 20971521,
              isReadable: false,
              fetchedAt: null,
            }),
          ],
        },
      ]

      test.each(cases)('where.AiRunId: $params.where.AiRunId', async ({
        params,
        expected,
      }) => {
        const actual = await AiRunMedia.findAll(params) // Act

        expect(actual) // Assert
          .toEqual(expected)
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
