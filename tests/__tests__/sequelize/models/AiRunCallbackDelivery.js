import {
  DataTypes,
} from 'sequelize'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

import AiRunCallbackDelivery from '../../../../sequelize/models/AiRunCallbackDelivery.js'

/*
 * One row per attempt at posting a run's terminal callback.
 *
 * Nothing here writes: the rows read back are the ones the development seeder wrote, and the
 * attributes are read off the declaration rather than off the database.
 */

describe('AiRunCallbackDelivery', () => {
  describe('super class', () => {
    test('to be instance of BaseAppRenchanModel', () => {
      const received = AiRunCallbackDelivery.prototype

      expect(received)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('AiRunCallbackDelivery', () => {
  describe('.createAttributes()', () => {
    /*
     * The whole attribute hash in one comparison, and that is the point of comparing it whole:
     * #run-delivery says no response body is stored, and a column holding one would be caught here
     * and nowhere else. A field the migration creates and this omits fails the same way.
     *
     * `httpStatusCode` is the one nullable field — an attempt that never completed had no status
     * to record — so its `allowNull` is asserted the other way round from every sibling.
     *
     * A plain `test()` rather than a `test.each()`: the member takes one argument, and the only
     * value it may be handed is Sequelize's own `DataTypes`. There is no input to vary.
     */
    describe('should declare every field of the table, and nothing else', () => {
      test('to be the whole attribute hash', () => {
        const expected = { // Arrange
          id: expect.objectContaining({
            primaryKey: true,
            autoIncrement: true,
          }),
          AiRunId: expect.objectContaining({
            allowNull: false,
          }),
          AiRunCallbackDeliveryCategoryId: expect.objectContaining({
            allowNull: false,
          }),
          attemptIndex: expect.objectContaining({
            allowNull: false,
          }),
          httpStatusCode: expect.objectContaining({
            allowNull: true,
          }),
          attemptedAt: expect.objectContaining({
            allowNull: false,
          }),
        }

        const actual = AiRunCallbackDelivery.createAttributes(DataTypes) // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackDelivery', () => {
  describe('.findAll()', () => {
    /*
     * How many times one run's callback was attempted.
     *
     * #run-delivery's eighth criterion is that a callback which fails to deliver is retried, and
     * "was it retried" is a count of rows against one run — which is only answerable because the
     * table holds an attempt rather than a run. A schema collapsing the attempts into one row per
     * run would answer 1 to all three cases below.
     *
     * The three runs are chosen so that no single wrong answer passes: one landed on its first
     * try, one was refused twice and landed on the third, and one never completed either attempt.
     * Only the length is asserted, so nothing here depends on how a dialect hands a column back.
     */
    describe('should count the attempts made against one run', () => {
      const cases = [
        {
          params: {
            where: {
              AiRunId: 10010004, // landed on the first try
            },
          },
          expected: 1,
        },
        {
          params: {
            where: {
              AiRunId: 10010003, // refused twice, landed on the third try
            },
          },
          expected: 3,
        },
        {
          params: {
            where: {
              AiRunId: 10010005, // neither attempt completed
            },
          },
          expected: 2,
        },
      ]

      test.each(cases)('where.AiRunId: $params.where.AiRunId', async ({
        params,
        expected,
      }) => {
        const actual = await AiRunCallbackDelivery.findAll(params) // Act

        expect(actual) // Assert
          .toHaveLength(expected)
      })
    })
  })
})

describe('AiRunCallbackDelivery', () => {
  describe('.findOne()', () => {
    /*
     * The status the far side answered with, on an attempt that got one and on an attempt that
     * did not.
     *
     * The second case is what the nullable column exists for: the request never completed, so
     * there was no status to record, and the record still says the attempt happened. A schema
     * that made the column NOT NULL could not hold that row at all, and the seeder would fail
     * before this test ran.
     */
    describe('should read the status an attempt came back with', () => {
      const cases = [
        {
          params: {
            where: {
              id: 10510001, // the attempt the client's service accepted
            },
          },
          expected: 200,
        },
        {
          params: {
            where: {
              id: 10510005, // the attempt whose connection was refused
            },
          },
          expected: null,
        },
      ]

      test.each(cases)('where.id: $params.where.id', async ({
        params,
        expected,
      }) => {
        const actual = await AiRunCallbackDelivery.findOne(params) // Act

        expect(actual) // Assert
          .toHaveProperty('httpStatusCode', expected)
      })
    })
  })
})
