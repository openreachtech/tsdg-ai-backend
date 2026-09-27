import AiRunTraceHorizonCalculator from '../../../../app/aiRunRetention/AiRunTraceHorizonCalculator.js'

describe('AiRunTraceHorizonCalculator', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#dayCount', () => {
        const cases = [
          {
            input: {
              dayCount: 730,
            },
            expected: 730,
          },
          {
            input: {
              dayCount: 90,
            },
            expected: 90,
          },
        ]

        test.each(cases)('dayCount: $input.dayCount', ({
          input,
          expected,
        }) => {
          const calculator = new AiRunTraceHorizonCalculator(input)

          expect(calculator)
            .toHaveProperty('dayCount', expected)
        })
      })
    })
  })
})

describe('AiRunTraceHorizonCalculator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            dayCount: 730,
          },
        },
        {
          input: {
            dayCount: 2,
          },
        },
      ]

      test.each(cases)('dayCount: $input.dayCount', ({
        input,
      }) => {
        const received = AiRunTraceHorizonCalculator.create(input)

        expect(received)
          .toBeInstanceOf(AiRunTraceHorizonCalculator)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            dayCount: 730,
          },
          expected: {
            dayCount: 730,
          },
        },
        {
          input: {
            dayCount: 2,
          },
          expected: {
            dayCount: 2,
          },
        },
      ]

      test.each(cases)('dayCount: $input.dayCount', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunTraceHorizonCalculator)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    /*
     * The figure §7 names for the longer clock, reached without the caller naming it.
     *
     * This assertion and its twin in `AiRunContentHorizonCalculator`'s file are the pair that
     * holds "two separate settings, never one" in place: each names the literal figure of its own
     * clock, so a class pointed at the wrong constants file, or the two files merged into one,
     * goes red here rather than silently purging two years of decision trace at thirty days.
     */
    describe('should fill the day count from the trace retention setting', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunTraceHorizonCalculator)
        const expected = {
          dayCount: 730,
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunTraceHorizonCalculator', () => {
  describe('#calculateTraceHorizon()', () => {
    /*
     * Two years back, across days a reader can check by hand.
     *
     * Seven hundred and thirty days is not two calendar years, and the cases are chosen so that
     * the difference shows: a span containing a leap February lands a day later than the same
     * date two years earlier, which is exactly the kind of arithmetic a "minus two years" written
     * in months would get wrong and nobody would notice for two years.
     */
    describe('should answer the instant seven hundred and thirty days before the one handed in', () => {
      const cases = [
        {
          params: {
            now: new Date('2028-09-10T00:00:00.000Z'),
          },
          expected: new Date('2026-09-11T00:00:00.000Z'),
        },
        {
          params: {
            now: new Date('2027-01-01T00:00:00.000Z'),
          },
          expected: new Date('2025-01-01T00:00:00.000Z'),
        },
        {
          params: {
            now: new Date('2029-02-28T23:59:59.999Z'),
          },
          expected: new Date('2027-03-01T23:59:59.999Z'),
        },
      ]

      test.each(cases)('now: $params.now', ({
        params,
        expected,
      }) => {
        const calculator = AiRunTraceHorizonCalculator.create() // Arrange

        const actual = calculator.calculateTraceHorizon(params) // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTraceHorizonCalculator', () => {
  describe('#calculateTraceHorizon()', () => {
    /*
     * A day count the caller states, so the arithmetic is shown to read the property rather than a
     * figure baked into the method.
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
            dayCount: 30,
          },
          params: {
            now: new Date('2026-03-15T12:00:00.000Z'),
          },
          expected: new Date('2026-02-13T12:00:00.000Z'),
        },
      ]

      test.each(cases)('dayCount: $factoryParams.dayCount', ({
        factoryParams,
        params,
        expected,
      }) => {
        const calculator = AiRunTraceHorizonCalculator.create(factoryParams) // Arrange

        const actual = calculator.calculateTraceHorizon(params) // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})
