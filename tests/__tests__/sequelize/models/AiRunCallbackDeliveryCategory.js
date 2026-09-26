import {
  DataTypes,
} from 'sequelize'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

import AiRunCallbackDeliveryCategory from '../../../../sequelize/models/AiRunCallbackDeliveryCategory.js'

/*
 * The master naming which callback a delivery attempt was for.
 *
 * Nothing here writes: the row read back is the one the master seeder wrote, and the attributes
 * are read off the declaration rather than off the database.
 */

describe('AiRunCallbackDeliveryCategory', () => {
  describe('super class', () => {
    test('to be instance of BaseAppRenchanModel', () => {
      const received = AiRunCallbackDeliveryCategory.prototype

      expect(received)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('AiRunCallbackDeliveryCategory', () => {
  describe('.createAttributes()', () => {
    /*
     * The whole attribute hash in one comparison, so a field appearing that the migration does not
     * create — or a field of the migration missing here — fails rather than passing unnoticed.
     *
     * A plain `test()` rather than a `test.each()`: the member takes one argument, and the only
     * value it may be handed is Sequelize's own `DataTypes`. There is no input to vary.
     */
    describe('should declare the master shape, and nothing else', () => {
      test('to be the whole attribute hash', () => {
        const expected = { // Arrange
          id: expect.objectContaining({
            primaryKey: true,
            autoIncrement: true,
          }),
          name: expect.objectContaining({
            allowNull: false,
            unique: true,
          }),
          displayName: expect.objectContaining({
            allowNull: false,
          }),
          displayOrder: expect.objectContaining({
            allowNull: false,
          }),
          isActive: expect.objectContaining({
            allowNull: false,
          }),
        }

        const actual = AiRunCallbackDeliveryCategory.createAttributes(DataTypes) // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackDeliveryCategory', () => {
  describe('.findOne()', () => {
    /*
     * The seeded row, read back by the id the constants declare.
     *
     * This is what says the three copies of one fact agree — the constant hash, the master seeder
     * that reads it, and the table the migration created. A seeder writing a different name, or a
     * migration whose column the model does not map, is only visible from the row itself.
     *
     * The asserted name is the literal rather than the constant, so a constant edited to match a
     * mistaken seeder does not make this pass.
     */
    describe('should read the one seeded kind back', () => {
      test('to carry the terminal name', async () => {
        const expected = 'terminal' // Arrange

        const actual = await AiRunCallbackDeliveryCategory.findOne({ // Act
          where: {
            id: 1, // AI_RUN_CALLBACK_DELIVERY_CATEGORY.TERMINAL.ID
          },
        })

        expect(actual) // Assert
          .toHaveProperty('name', expected)
      })
    })
  })
})
