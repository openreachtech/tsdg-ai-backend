import UnstatedExpiryHorizonCalculator from '../../../../app/aiRunRetention/UnstatedExpiryHorizonCalculator.js'

/*
 * The clock that stands in for an expiry a provider never stated (specs/1.0.0, #retention).
 *
 * The arithmetic is asserted against dates a reader can check by hand - a month end, the turn of a
 * year, a leap day - rather than only through rows that happen to fall either side of it. That is
 * the whole reason this is a class apart from the purge.
 */

describe('UnstatedExpiryHorizonCalculator', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#dayCount', () => {
        const cases = [
          {
            input: {
              dayCount: 1,
            },
            expected: 1,
          },
          {
            input: {
              dayCount: 7,
            },
            expected: 7,
          },
          {
            input: {
              dayCount: 0,
            },
            expected: 0,
          },
        ]

        test.each(cases)('dayCount: $input.dayCount', ({
          input,
          expected,
        }) => {
          const calculator = new UnstatedExpiryHorizonCalculator(input)

          expect(calculator)
            .toHaveProperty('dayCount', expected)
        })
      })
    })
  })
})

describe('UnstatedExpiryHorizonCalculator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            dayCount: 2,
          },
        },
        {
          input: {
            dayCount: 5,
          },
        },
      ]

      test.each(cases)('dayCount: $input.dayCount', ({
        input,
      }) => {
        const received = UnstatedExpiryHorizonCalculator.create(input)

        expect(received)
          .toBeInstanceOf(UnstatedExpiryHorizonCalculator)
      })
    })
  })
})

describe('UnstatedExpiryHorizonCalculator', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            dayCount: 3,
          },
          expected: {
            dayCount: 3,
          },
        },
        {
          input: {
            dayCount: 9,
          },
          expected: {
            dayCount: 9,
          },
        },
      ]

      test.each(cases)('dayCount: $input.dayCount', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(UnstatedExpiryHorizonCalculator)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('UnstatedExpiryHorizonCalculator', () => {
  describe('.create()', () => {
    /*
     * The default is the figure the constants file argues, and it reaches the constructor rather
     * than being read off the instance - a calculator built with no argument is exactly how the
     * purge builds one, so a default that stopped arriving would move the wait for every copy no
     * provider dated.
     */
    describe('should fill default dayCount', () => {
      test('with no arguments', () => {
        const expected = {
          dayCount: 1,
        }

        const SpyClass = globalThis.constructorSpy.spyOn(UnstatedExpiryHorizonCalculator)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('UnstatedExpiryHorizonCalculator', () => {
  describe('#calculateUnstatedExpiryHorizon()', () => {
    /*
     * Both axes matter, so both are driven: the wait itself, and the instant it runs back from.
     * The instants are chosen to cross boundaries a day's subtraction is easiest to get wrong at -
     * a month end, the turn of a year, and the 29th of February in a leap year - and the times of
     * day are deliberately not midnight, so an implementation that rounded to a day would be
     * caught rather than agreed with.
     */
    const dayCountCases = [
      {
        input: {
          dayCount: 1,
        },
        nowCases: [
          {
            now: new Date('2026-03-01T05:00:00.000Z'),
            expected: new Date('2026-02-28T05:00:00.000Z'),
          },
          {
            now: new Date('2026-01-01T00:00:00.001Z'),
            expected: new Date('2025-12-31T00:00:00.001Z'),
          },
          {
            now: new Date('2024-03-01T23:59:59.999Z'),
            expected: new Date('2024-02-29T23:59:59.999Z'), // 2024 is a leap year
          },
        ],
      },
      {
        input: {
          dayCount: 7,
        },
        nowCases: [
          {
            now: new Date('2026-03-05T05:00:00.000Z'),
            expected: new Date('2026-02-26T05:00:00.000Z'),
          },
          {
            now: new Date('2026-01-03T12:34:56.789Z'),
            expected: new Date('2025-12-27T12:34:56.789Z'),
          },
        ],
      },
      {
        input: {
          dayCount: 0,
        },
        nowCases: [
          {
            now: new Date('2026-03-02T05:00:00.000Z'),
            expected: new Date('2026-03-02T05:00:00.000Z'),
          },
          {
            now: new Date('2026-01-02T00:00:00.001Z'),
            expected: new Date('2026-01-02T00:00:00.001Z'),
          },
        ],
      },
    ]

    describe.each(dayCountCases)('dayCount: $input.dayCount', ({
      input,
      nowCases,
    }) => {
      const calculator = UnstatedExpiryHorizonCalculator.create(input)

      test.each(nowCases)('now: $now', ({
        now,
        expected,
      }) => {
        const args = {
          now,
        }

        const received = calculator.calculateUnstatedExpiryHorizon(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
