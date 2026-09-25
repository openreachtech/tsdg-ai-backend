import AiRunInstantInspector from '../../../../app/aiRun/AiRunInstantInspector.js'

describe('AiRunInstantInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#earliestRecordableInstant', () => {
        const cases = [
          {
            input: {
              earliestRecordableInstant: new Date('1000-01-01T00:00:00.000Z'),
              latestRecordableInstant: new Date('9999-12-31T23:59:59.999Z'),
            },
            expected: new Date('1000-01-01T00:00:00.000Z'),
          },
          {
            input: {
              earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
              latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
            },
            expected: new Date('2020-01-01T00:00:00.000Z'),
          },
        ]

        test.each(cases)('earliestRecordableInstant: $input.earliestRecordableInstant', ({
          input,
          expected,
        }) => {
          const inspector = new AiRunInstantInspector(input)

          expect(inspector)
            .toHaveProperty('earliestRecordableInstant', expected)
        })
      })

      describe('#latestRecordableInstant', () => {
        const cases = [
          {
            input: {
              earliestRecordableInstant: new Date('1000-01-01T00:00:00.000Z'),
              latestRecordableInstant: new Date('9999-12-31T23:59:59.999Z'),
            },
            expected: new Date('9999-12-31T23:59:59.999Z'),
          },
          {
            input: {
              earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
              latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
            },
            expected: new Date('2030-12-31T23:59:59.999Z'),
          },
        ]

        test.each(cases)('latestRecordableInstant: $input.latestRecordableInstant', ({
          input,
          expected,
        }) => {
          const inspector = new AiRunInstantInspector(input)

          expect(inspector)
            .toHaveProperty('latestRecordableInstant', expected)
        })
      })
    })
  })
})

describe('AiRunInstantInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
          },
        },
        {
          input: {
            earliestRecordableInstant: new Date('1970-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2100-01-01T00:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('earliestRecordableInstant: $input.earliestRecordableInstant', ({
        input,
      }) => {
        const received = AiRunInstantInspector.create(input)

        expect(received)
          .toBeInstanceOf(AiRunInstantInspector)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
          },
          expected: {
            earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
          },
        },
        {
          input: {
            earliestRecordableInstant: new Date('1970-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2100-01-01T00:00:00.000Z'),
          },
          expected: {
            earliestRecordableInstant: new Date('1970-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2100-01-01T00:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('earliestRecordableInstant: $input.earliestRecordableInstant', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunInstantInspector)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default bounds', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunInstantInspector)
        const expected = {
          earliestRecordableInstant: new Date('1000-01-01T00:00:00.000Z'),
          latestRecordableInstant: new Date('9999-12-31T23:59:59.999Z'),
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunInstantInspector', () => {
  describe('#isRecordableInstant()', () => {
    /*
     * The values the third audit round settled a run with, and the ones a caller hands in every day.
     *
     * Every one of the refused cases below reached `ai_runs`, `ai_run_steps` or
     * `ai_run_field_outcomes` before this class existed, and settled there as the literal text
     * `Invalid date` — because Sequelize coerces whatever it is handed into `datetime(3)`, and the
     * only question anything asked was whether something was there. On a run that has just reached
     * a terminal status nothing may ever write over it, so the row was wrong for the two years it
     * is kept and read as though it had been filled in.
     */
    describe('should refuse a value that is not an instant', () => {
      const cases = [
        {
          params: {
            instant: 'whenever',
          },
          label: 'a word that is not a time',
        },
        {
          params: {
            instant: '2026-09-25T00:00:00.000Z',
          },
          label: 'a time written as a string, which is not what the signature asks for',
        },
        {
          params: {
            instant: 0,
          },
          label: 'the epoch as a number rather than a Date',
        },
        {
          params: {
            instant: false,
          },
          label: 'a boolean',
        },
        {
          params: {
            instant: {},
          },
          label: 'an empty object',
        },
        {
          params: {
            instant: [],
          },
          label: 'an empty array',
        },
        {
          params: {
            instant: new Date('whenever'),
          },
          label: 'a Date built from a word that is not a time',
        },
        {
          params: {
            instant: new Date(Number.NaN),
          },
          label: 'a Date built from a value that is not a number',
        },
        {
          params: {
            instant: null,
          },
          label: 'null, which the evidence rule answers for and this one still must not fault on',
        },
        {
          params: {
            instant: Object.create(Date.prototype),
          },
          label: 'a value sitting on Date.prototype with no time of its own',
        },
        {
          params: {
            instant: new Proxy(new Date('2026-09-25T11:22:33.444Z'), {}),
          },
          label: 'a real Date behind a proxy, which has no internal slot to read',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const inspector = AiRunInstantInspector.create() // Arrange

        const actual = inspector.isRecordableInstant(params) // Act

        expect(actual) // Assert
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunInstantInspector', () => {
  describe('#isRecordableInstant()', () => {
    /*
     * `new Date(8.64e15)` is a valid Date naming a year no `datetime(3)` column can store, so a
     * guard that asked only whether something was a Date would hand it to the driver to be
     * truncated on one engine and rejected on another.
     */
    describe('should refuse an instant outside the range the column holds', () => {
      const cases = [
        {
          params: {
            instant: new Date('0999-12-31T23:59:59.999Z'),
          },
          label: 'one millisecond before the earliest the column holds',
        },
        {
          params: {
            instant: new Date(8.64e15),
          },
          label: 'the largest instant a Date can name at all',
        },
        {
          params: {
            instant: new Date(-8.64e15),
          },
          label: 'the earliest instant a Date can name at all',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const inspector = AiRunInstantInspector.create() // Arrange

        const actual = inspector.isRecordableInstant(params) // Act

        expect(actual) // Assert
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunInstantInspector', () => {
  describe('#isRecordableInstant()', () => {
    describe('should accept an instant the column holds', () => {
      const cases = [
        {
          params: {
            instant: new Date('2026-09-25T11:22:33.444Z'),
          },
        },
        {
          params: {
            instant: new Date('1000-01-01T00:00:00.000Z'),
          },
        },
        {
          params: {
            instant: new Date('9999-12-31T23:59:59.999Z'),
          },
        },
        {
          params: {
            instant: new Date('1970-01-01T00:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('instant: $params.instant', ({
        params,
      }) => {
        const inspector = AiRunInstantInspector.create() // Arrange

        const actual = inspector.isRecordableInstant(params) // Act

        expect(actual) // Assert
          .toBeTruthy()
      })
    })
  })
})

describe('AiRunInstantInspector', () => {
  describe('#fallsWithinRecordableRange()', () => {
    describe('should refuse an instant outside the bounds it was created with', () => {
      const cases = [
        {
          factoryParams: {
            earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
          },
          params: {
            instant: new Date('2019-12-31T23:59:59.999Z'),
          },
        },
        {
          factoryParams: {
            earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
          },
          params: {
            instant: new Date('2031-01-01T00:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('instant: $params.instant', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunInstantInspector.create(factoryParams) // Arrange

        const actual = inspector.fallsWithinRecordableRange(params) // Act

        expect(actual) // Assert
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunInstantInspector', () => {
  describe('#fallsWithinRecordableRange()', () => {
    describe('should accept an instant within the bounds it was created with', () => {
      const cases = [
        {
          factoryParams: {
            earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
          },
          params: {
            instant: new Date('2025-06-15T12:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
            latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
          },
          params: {
            instant: new Date('2020-01-01T00:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('instant: $params.instant', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunInstantInspector.create(factoryParams) // Arrange

        const actual = inspector.fallsWithinRecordableRange(params) // Act

        expect(actual) // Assert
          .toBeTruthy()
      })
    })
  })
})
