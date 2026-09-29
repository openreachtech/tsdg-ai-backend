import AiRunKeyInspector from '../../../../app/aiRun/AiRunKeyInspector.js'

describe('AiRunKeyInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#keyPattern', () => {
        const cases = [
          {
            input: {
              keyPattern: /^(?=.{1,19}$)[1-9]\d*$/u,
            },
            expected: /^(?=.{1,19}$)[1-9]\d*$/u,
          },
          {
            input: {
              keyPattern: /^[1-9]$/u,
            },
            expected: /^[1-9]$/u,
          },
        ]

        test.each(cases)('keyPattern: $input.keyPattern', ({
          input,
          expected,
        }) => {
          const inspector = new AiRunKeyInspector(input)

          expect(inspector)
            .toHaveProperty('keyPattern', expected)
        })
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            keyPattern: /^[1-9]\d*$/u,
          },
        },
        {
          input: {
            keyPattern: /^[1-9]$/u,
          },
        },
      ]

      test.each(cases)('keyPattern: $input.keyPattern', ({
        input,
      }) => {
        const received = AiRunKeyInspector.create(input)

        expect(received)
          .toBeInstanceOf(AiRunKeyInspector)
      })
    })

    describe('should fill default keyPattern', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunKeyInspector)
        const expected = {
          keyPattern: /^(?=.{1,19}$)[1-9]\d*$/u,
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#generateComparableKey()', () => {
    /*
     * The two spellings of one key have to give one answer.
     *
     * Before this rule lived in one place, text was held to a positive integer with no leading zero
     * while a number was taken whole - so '-1' named no row and -1 named one, and which answer a
     * caller got depended on whether its key had crossed a queue or a query string. Each pair below
     * states the same key twice and expects the same answer.
     */
    describe('should answer the same for both spellings of a key', () => {
      const cases = [
        {
          params: {
            key: 10010001,
          },
          expected: 10010001,
        },
        {
          params: {
            key: '10010001',
          },
          expected: 10010001,
        },
        {
          params: {
            key: 1,
          },
          expected: 1,
        },
        {
          params: {
            key: '1',
          },
          expected: 1,
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
        expected,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.generateComparableKey(params) // Act

        expect(actual) // Assert
          .toBe(expected)
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#generateComparableKey()', () => {
    /*
     * Cases taken from the boundary, not from a list of examples.
     *
     * The length bound is the half that was missing for six rounds, and it was missing against the
     * conventions its own neighbours already kept - a field path bounded to 191, a method version to
     * 32, and a key bounded only by its alphabet. A run of digits is not thereby harmless: the
     * nineteen-digit case below is the largest a signed BIGINT holds, and the twenty-digit one is
     * the first that no longer names a key.
     */
    describe('should answer null for a value that names no key', () => {
      const cases = [
        {
          params: {
            key: 0,
          },
          label: 'zero, which no row carries',
        },
        {
          params: {
            key: -1,
          },
          label: 'a negative number',
        },
        {
          params: {
            key: '-1',
          },
          label: 'a negative number written as text, which used to answer differently',
        },
        {
          params: {
            key: 2.5,
          },
          label: 'a number that is not whole',
        },
        {
          params: {
            key: '007',
          },
          label: 'a key written with a leading zero',
        },
        {
          params: {
            key: '12345678901234567890',
          },
          label: 'twenty digits, one past what a signed BIGINT holds',
        },
        {
          // The number spelling of the case above, which the text pattern cannot see. Both
          // spellings have to answer alike, and only the number branch answers for this one.
          params: {
            key: 1e20,
          },
          label: 'a number of twenty-one digits, which the text pattern never sees',
        },
        {
          params: {
            key: '8190123456789819012345678981901234567898190123456789',
          },
          label: 'a long run of digits, which no length bound used to stop',
        },
        {
          /*
           * The number spelling of one exponent further up, which `Number.isInteger()` calls a
           * whole number and which JavaScript spells `'1e+21'` — five characters, inside the
           * nineteen the bound allows, and a path segment of `medium-1e+21` rather than of digits.
           * The length bound admitted it; holding the number to the same alphabet the text is held
           * to is what refuses it.
           */
          params: {
            key: 1e21,
          },
          label: 'a number whose spelling carries an exponent rather than digits',
        },
        {
          /*
           * A key the pattern cannot fault, and one a `Number` cannot hold: it reads back as
           * 9007199254740992, which is the key one below it. Two media declaring these two would
           * have built one file path, and the second would have overwritten the first.
           */
          params: {
            key: '9007199254740993',
          },
          label: 'a key reading back as the number of the key below it',
        },
        {
          params: {
            key: '9223372036854775807',
          },
          label: 'the largest a signed BIGINT holds, which a number cannot spell back',
        },
        {
          params: {
            key: 'read from the medium: the owner is a sample person',
          },
          label: 'text that names no number',
        },
        {
          params: {
            key: null,
          },
          label: 'null',
        },
        {
          params: {
            key: true,
          },
          label: 'a boolean',
        },
        {
          params: {
            key: {},
          },
          label: 'an object',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.generateComparableKey(params) // Act

        expect(actual) // Assert
          .toBeNull()
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#generateComparableKey()', () => {
    /*
     * The bound is a bijection and not a magnitude, which is what these two state.
     *
     * Both are keys a `Number` holds exactly and spells back, and one of them is above 2^53 - so
     * "everything above 2^53 is refused" would be the wrong sentence to read out of the refusals
     * above. What is refused is a key that reads back as some other key's number; these read back
     * as their own.
     */
    describe('should answer the number for a key at the bound', () => {
      const cases = [
        {
          params: {
            key: '18014398509481984',
          },
          label: 'seventeen digits, above 2^53 and held exactly',
        },
        {
          params: {
            key: '1000000000000000000',
          },
          label: 'nineteen digits, opening with one',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.generateComparableKey(params) // Act

        expect(actual) // Assert
          .toEqual(expect.any(Number))
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#isRecordableKey()', () => {
    describe('should refuse a value that names no key', () => {
      const cases = [
        {
          params: {
            key: 'read from the medium: 090-0000-0000',
          },
          label: 'text carrying what was read out of a medium',
        },
        {
          params: {
            key: 0,
          },
          label: 'zero',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.isRecordableKey(params) // Act

        expect(actual) // Assert
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#isRecordableKey()', () => {
    describe('should accept a key of this service', () => {
      const cases = [
        {
          params: {
            key: 10010001,
          },
        },
        {
          params: {
            key: '10240004',
          },
        },
        {
          // Sixteen digits, which this answers yes to, and which is the residual stated in the
          // class docblock rather than claimed closed: no pattern can tell a run of digits that is
          // an id from a run of digits that is something else.
          params: {
            key: '4000000000000002',
          },
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.isRecordableKey(params) // Act

        expect(actual) // Assert
          .toBeTruthy()
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#namesRow()', () => {
    /*
     * The number spelling, held to the same alphabet the text spelling is held to.
     *
     * `Number.isInteger()` plus a length bound admitted `1e21`, whose spelling is `'1e+21'`. A
     * caller building a path segment out of a key was told by the workspace class's own docblock
     * that a segment is always digits, and for that one value it was not.
     */
    describe('should refuse a number whose spelling is not digits', () => {
      const cases = [
        {
          params: {
            key: 1e21,
          },
          label: 'a number spelled with an exponent',
        },
        {
          params: {
            key: 1e20,
          },
          label: 'a number of twenty-one digits',
        },
        {
          params: {
            key: 2.5,
          },
          label: 'a number that is not whole',
        },
        {
          params: {
            key: 0,
          },
          label: 'zero, which no row carries',
        },
        {
          params: {
            key: -1,
          },
          label: 'a negative number',
        },
        {
          params: {
            key: Number.NaN,
          },
          label: 'a number that is no number',
        },
        {
          params: {
            key: Number.POSITIVE_INFINITY,
          },
          label: 'a number without end',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.namesRow(params) // Act

        expect(actual) // Assert
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#namesRow()', () => {
    describe('should accept a number spelled in digits', () => {
      const cases = [
        {
          params: {
            key: 1,
          },
        },
        {
          params: {
            key: 10010001,
          },
        },
        {
          params: {
            key: 9007199254740992,
          },
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.namesRow(params) // Act

        expect(actual) // Assert
          .toBeTruthy()
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#namesRowExactly()', () => {
    /*
     * A key that reads back as another key's number is the collision this refuses: two media
     * declaring `'9007199254740992'` and `'9007199254740993'` would have built one file path.
     */
    describe('should refuse text that does not spell back the number it names', () => {
      const cases = [
        {
          params: {
            keyText: '9007199254740993',
          },
          label: 'a key reading back as the number of the key below it',
        },
        {
          params: {
            keyText: '9223372036854775807',
          },
          label: 'the largest a signed BIGINT holds',
        },
        {
          params: {
            keyText: '1152921504606846976',
          },
          label: 'nineteen digits a double rounds on the way back',
        },
        {
          params: {
            keyText: '007',
          },
          label: 'a key written with a leading zero',
        },
        {
          params: {
            keyText: 'read from the medium: the owner is a sample person',
          },
          label: 'text that names no number',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.namesRowExactly(params) // Act

        expect(actual) // Assert
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunKeyInspector', () => {
  describe('#namesRowExactly()', () => {
    describe('should accept text spelling back the number it names', () => {
      const cases = [
        {
          params: {
            keyText: '1',
          },
        },
        {
          params: {
            keyText: '10440019',
          },
        },
        {
          params: {
            keyText: '9007199254740992',
          },
        },
        {
          params: {
            keyText: '18014398509481984',
          },
        },
      ]

      test.each(cases)('keyText: $params.keyText', ({
        params,
      }) => {
        const inspector = AiRunKeyInspector.create() // Arrange

        const actual = inspector.namesRowExactly(params) // Act

        expect(actual) // Assert
          .toBeTruthy()
      })
    })
  })
})
