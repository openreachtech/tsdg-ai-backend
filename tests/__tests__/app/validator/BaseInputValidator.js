import BaseInputValidator from '../../../../app/validator/BaseInputValidator.js'

describe('BaseInputValidator', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#input', () => {
        const cases = [
          {
            input: {
              input: {
                externalRef: 'external-ref-0001',
              },
              errorHash: {}, // Fill the unrelated required argument with a neutral value
            },
            expected: {
              externalRef: 'external-ref-0001',
            },
          },
          {
            input: {
              input: {
                externalRef: 'external-ref-0002',
              },
              errorHash: {}, // Fill the unrelated required argument with a neutral value
            },
            expected: {
              externalRef: 'external-ref-0002',
            },
          },
        ]

        test.each(cases)('externalRef: $input.input.externalRef', ({
          input,
          expected,
        }) => {
          const validator = new BaseInputValidator(input)

          expect(validator)
            .toHaveProperty('input', expected)
        })
      })

      describe('#errorHash', () => {
        const cases = [
          {
            input: {
              input: {}, // Fill the unrelated required argument with a neutral value
              errorHash: {
                InvalidAlpha: 'error-identity-0001',
              },
            },
            expected: {
              InvalidAlpha: 'error-identity-0001',
            },
          },
          {
            input: {
              input: {}, // Fill the unrelated required argument with a neutral value
              errorHash: {
                InvalidBeta: 'error-identity-0002',
              },
            },
            expected: {
              InvalidBeta: 'error-identity-0002',
            },
          },
        ]

        test.each(cases)('errorHash: $input.errorHash', ({
          input,
          expected,
        }) => {
          const validator = new BaseInputValidator(input)

          expect(validator)
            .toHaveProperty('errorHash', expected)
        })
      })
    })
  })
})

describe('BaseInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            input: {
              externalRef: 'external-ref-0001',
            },
            errorHash: {},
          },
        },
        {
          input: {
            input: {
              externalRef: 'external-ref-0002',
            },
            errorHash: {},
          },
        },
      ]

      test.each(cases)('externalRef: $input.input.externalRef', ({
        input,
      }) => {
        const received = BaseInputValidator.create(input)

        expect(received)
          .toBeInstanceOf(BaseInputValidator)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            input: {
              externalRef: 'external-ref-0001',
            },
            errorHash: {},
          },
          expected: {
            input: {
              externalRef: 'external-ref-0001',
            },
            errorHash: {},
          },
        },
        {
          input: {
            input: {
              externalRef: 'external-ref-0002',
            },
            errorHash: {},
          },
          expected: {
            input: {
              externalRef: 'external-ref-0002',
            },
            errorHash: {},
          },
        },
      ]

      test.each(cases)('externalRef: $input.input.externalRef', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(BaseInputValidator)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('BaseInputValidator', () => {
  describe('#validateInput()', () => {
    describe('when every rule passes', () => {
      const cases = [
        {
          override: {
            entries: [
              [
                () => true,
                'InvalidAlpha',
              ],
            ],
          },
        },
        {
          override: {
            entries: [
              [
                () => true,
                'InvalidBeta',
              ],
              [
                () => true,
                'InvalidGamma',
              ],
            ],
          },
        },
      ]

      test.each(cases)('first rule error: $override.entries.0.1', ({
        override,
      }) => {
        const validator = BaseInputValidator.create({
          input: {}, // The rules are substituted, so the input is not read
          errorHash: {}, // The rules are substituted, so the error hash is not read
        })
        jest.spyOn(validator, 'generateValidationEntries')
          .mockReturnValue(override.entries)

        const received = validator.validateInput()

        expect(received)
          .toBeNull()
      })
    })

    describe('when a rule fails', () => {
      const cases = [
        {
          override: {
            entries: [
              [
                () => false,
                'InvalidAlpha',
              ],
            ],
          },
          expected: 'InvalidAlpha',
        },
        {
          override: {
            entries: [
              [
                () => true,
                'InvalidBeta',
              ],
              [
                () => false,
                'InvalidGamma',
              ],
            ],
          },
          expected: 'InvalidGamma',
        },
        {
          override: {
            entries: [
              [
                () => false,
                'InvalidDelta',
              ],
              [
                () => false,
                'InvalidEpsilon',
              ],
            ],
          },
          expected: 'InvalidDelta', // The first failing rule wins, not the last
        },
      ]

      test.each(cases)('first rule error: $override.entries.0.1', ({
        override,
        expected,
      }) => {
        const validator = BaseInputValidator.create({
          input: {}, // The rules are substituted, so the input is not read
          errorHash: {}, // The rules are substituted, so the error hash is not read
        })
        jest.spyOn(validator, 'generateValidationEntries')
          .mockReturnValue(override.entries)

        const received = validator.validateInput()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    describe('when not inherited', () => {
      test('should throw error', () => {
        const validator = BaseInputValidator.create({
          input: {}, // Neutral value; not under test
          errorHash: {}, // Neutral value; not under test
        })

        expect(() => validator.generateValidationEntries())
          .toThrow('BaseInputValidator#generateValidationEntries() must be inherited')
      })
    })
  })
})
