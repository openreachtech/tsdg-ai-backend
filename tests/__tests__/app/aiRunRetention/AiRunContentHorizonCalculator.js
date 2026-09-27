import AiRunContentHorizonCalculator from '../../../../app/aiRunRetention/AiRunContentHorizonCalculator.js'

describe('AiRunContentHorizonCalculator', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#dayCount', () => {
        const cases = [
          {
            input: {
              dayCount: 30,
            },
            expected: 30,
          },
          {
            input: {
              dayCount: 7,
            },
            expected: 7,
          },
        ]

        test.each(cases)('dayCount: $input.dayCount', ({
          input,
          expected,
        }) => {
          const calculator = new AiRunContentHorizonCalculator(input)

          expect(calculator)
            .toHaveProperty('dayCount', expected)
        })
      })
    })
  })
})

describe('AiRunContentHorizonCalculator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            dayCount: 30,
          },
        },
        {
          input: {
            dayCount: 1,
          },
        },
      ]

      test.each(cases)('dayCount: $input.dayCount', ({
        input,
      }) => {
        const received = AiRunContentHorizonCalculator.create(input)

        expect(received)
          .toBeInstanceOf(AiRunContentHorizonCalculator)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            dayCount: 30,
          },
          expected: {
            dayCount: 30,
          },
        },
        {
          input: {
            dayCount: 1,
          },
          expected: {
            dayCount: 1,
          },
        },
      ]

      test.each(cases)('dayCount: $input.dayCount', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunContentHorizonCalculator)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    /*
     * The figure §7 names, reached without the caller naming it.
     *
     * This is the line that ties the class to the content clock rather than to a number somebody
     * passed it, and it is what would go red if the two retention constants files were ever merged
     * or if this class were pointed at the trace's figure by mistake. Seven hundred and thirty is
     * the value that would appear here, which is why the assertion is the literal thirty rather
     * than a read of the same constant.
     */
    describe('should fill the day count from the content retention setting', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunContentHorizonCalculator)
        const expected = {
          dayCount: 30,
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunContentHorizonCalculator', () => {
  describe('#calculateContentHorizon()', () => {
    /*
     * Days a reader can check by hand, chosen so the arithmetic has somewhere to go wrong.
     *
     * A month end, the turn of a year and a leap February are the three places a naive subtraction
     * of a month rather than of thirty days would part company with this one, and the millisecond
     * case is there because the column is `datetime(3)`: a horizon rounded to the day would move
     * the boundary by up to a day in whichever direction the rounding went, and a run accepted
     * inside that window would be purged early or kept late with nothing to show for it.
     */
    describe('should answer the instant thirty days before the one handed in', () => {
      const cases = [
        {
          params: {
            now: new Date('2026-03-15T12:00:00.000Z'),
          },
          expected: new Date('2026-02-13T12:00:00.000Z'),
        },
        {
          params: {
            now: new Date('2028-03-01T00:00:00.000Z'),
          },
          expected: new Date('2028-01-31T00:00:00.000Z'),
        },
        {
          params: {
            now: new Date('2027-01-05T06:30:00.000Z'),
          },
          expected: new Date('2026-12-06T06:30:00.000Z'),
        },
        {
          params: {
            now: new Date('2026-09-10T00:00:00.123Z'),
          },
          expected: new Date('2026-08-11T00:00:00.123Z'),
        },
      ]

      test.each(cases)('now: $params.now', ({
        params,
        expected,
      }) => {
        const calculator = AiRunContentHorizonCalculator.create() // Arrange

        const actual = calculator.calculateContentHorizon(params) // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunContentHorizonCalculator', () => {
  describe('#calculateContentHorizon()', () => {
    /*
     * A day count the caller states, so that the arithmetic is shown to read the property rather
     * than a figure baked into the method.
     *
     * Without this the class would pass every case above while ignoring `dayCount` entirely and
     * subtracting a hard-coded thirty - and the day somebody changed §7's figure, nothing would
     * move.
     */
    describe('should answer from the day count it was created with', () => {
      const cases = [
        {
          factoryParams: {
            dayCount: 1,
          },
          params: {
            now: new Date('2026-03-01T08:00:00.000Z'),
          },
          expected: new Date('2026-02-28T08:00:00.000Z'),
        },
        {
          factoryParams: {
            dayCount: 0,
          },
          params: {
            now: new Date('2026-03-01T08:00:00.000Z'),
          },
          expected: new Date('2026-03-01T08:00:00.000Z'),
        },
        {
          factoryParams: {
            dayCount: 365,
          },
          params: {
            now: new Date('2027-03-01T08:00:00.000Z'),
          },
          expected: new Date('2026-03-01T08:00:00.000Z'),
        },
      ]

      test.each(cases)('dayCount: $factoryParams.dayCount', ({
        factoryParams,
        params,
        expected,
      }) => {
        const calculator = AiRunContentHorizonCalculator.create(factoryParams) // Arrange

        const actual = calculator.calculateContentHorizon(params) // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})
