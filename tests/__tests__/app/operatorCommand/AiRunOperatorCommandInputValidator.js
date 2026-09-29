import AiRunOperatorCommandInputValidator from '../../../../app/operatorCommand/AiRunOperatorCommandInputValidator.js'

import AiRunInstantInspector from '../../../../app/aiRun/AiRunInstantInspector.js'
import AiRunsQueryInputValidator from '../../../../app/validator/forRenderer/AiRunsQueryInputValidator.js'

/*
 * The judging of the one parameter an operator command was given.
 *
 * Nothing here is mocked. Every rule is a boolean over a value the adapter already built, and the
 * instant inspector it leans on is a real domain class that needs no database — substituting it
 * would hide the bounds the whole file exists to pin.
 */

describe('AiRunOperatorCommandInputValidator', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#input', () => {
        const cases = [
          {
            input: {
              commandName: 'stalled',
              parameterText: '300',
              stalledForSeconds: 300,
              failedSince: null,
            },
          },
          {
            input: {
              commandName: 'run',
              parameterText: 'run-key-10900001',
              stalledForSeconds: null,
              failedSince: null,
            },
          },
        ]

        test.each(cases)('commandName: $input.commandName', ({
          input,
        }) => {
          const validator = new AiRunOperatorCommandInputValidator({
            input,
            aiRunInstantInspector: AiRunInstantInspector.create(), // Fill the unrelated required argument with a neutral value
          })

          expect(validator)
            .toHaveProperty('input', input)
        })
      })

      describe('#aiRunInstantInspector', () => {
        const cases = [
          {
            input: {
              aiRunInstantInspector: AiRunInstantInspector.create({
                earliestRecordableInstant: new Date('1000-01-01T00:00:00.000Z'),
                latestRecordableInstant: new Date('9999-12-31T23:59:59.999Z'),
              }),
            },
          },
          {
            input: {
              aiRunInstantInspector: AiRunInstantInspector.create({
                earliestRecordableInstant: new Date('2020-01-01T00:00:00.000Z'),
                latestRecordableInstant: new Date('2030-12-31T23:59:59.999Z'),
              }),
            },
          },
        ]

        test.each(cases)('earliestRecordableInstant: $input.aiRunInstantInspector.earliestRecordableInstant', ({
          input,
        }) => {
          const validator = new AiRunOperatorCommandInputValidator({
            input: {
              commandName: null, // Fill the unrelated required argument with a neutral value
              parameterText: null,
              stalledForSeconds: null,
              failedSince: null,
            },
            aiRunInstantInspector: input.aiRunInstantInspector,
          })

          expect(validator)
            .toHaveProperty('aiRunInstantInspector', input.aiRunInstantInspector)
        })
      })
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            input: {
              commandName: 'stalled',
              parameterText: '300',
              stalledForSeconds: 300,
              failedSince: null,
            },
          },
        },
        {
          input: {
            input: {
              commandName: 'correlation',
              parameterText: 'correlation-id-10900002',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
          },
        },
      ]

      test.each(cases)('commandName: $input.input.commandName', ({
        input,
      }) => {
        const received = AiRunOperatorCommandInputValidator.create(input)

        expect(received)
          .toBeInstanceOf(AiRunOperatorCommandInputValidator)
      })
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            input: {
              commandName: 'run',
              parameterText: 'run-key-10900003',
              stalledForSeconds: Number.NaN,
              failedSince: null,
            },
            aiRunInstantInspector: AiRunInstantInspector.create(),
          },
        },
        {
          input: {
            input: {
              commandName: 'failed-since',
              parameterText: '2026-09-28T00:00:00.000Z',
              stalledForSeconds: Number.NaN,
              failedSince: new Date('2026-09-28T00:00:00.000Z'),
            },
            aiRunInstantInspector: AiRunInstantInspector.create(),
          },
        },
      ]

      test.each(cases)('commandName: $input.input.commandName', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunOperatorCommandInputValidator)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('.create()', () => {
    describe('should use default aiRunInstantInspector value', () => {
      const cases = [
        {
          input: {
            input: {
              commandName: 'failed-since',
              parameterText: '2026-09-28T00:00:00.000Z',
              stalledForSeconds: Number.NaN,
              failedSince: new Date('2026-09-28T00:00:00.000Z'),
            },
            // aiRunInstantInspector: omitted -> default .createAiRunInstantInspector()
          },
        },
        {
          input: {
            input: {
              commandName: 'stalled',
              parameterText: '300',
              stalledForSeconds: 300,
              failedSince: null,
            },
            // aiRunInstantInspector: omitted -> default .createAiRunInstantInspector()
          },
        },
      ]

      test.each(cases)('commandName: $input.input.commandName', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create(input)

        const received = validator.aiRunInstantInspector

        expect(received)
          .toBeInstanceOf(AiRunInstantInspector)
      })
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('.get:AiRunsQueryInputValidatorCtor', () => {
    test('should be the validator whose count rule is reused', () => {
      const received = AiRunOperatorCommandInputValidator.AiRunsQueryInputValidatorCtor

      expect(received)
        .toBe(AiRunsQueryInputValidator) // same reference
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('.createAiRunInstantInspector()', () => {
    test('should be an instance of the inspector', () => {
      const received = AiRunOperatorCommandInputValidator.createAiRunInstantInspector()

      expect(received)
        .toBeInstanceOf(AiRunInstantInspector)
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          input: {
            commandName: 'stalled',
            parameterText: '300',
            stalledForSeconds: 300,
            failedSince: null,
          },
        },
      },
      {
        input: {
          input: {
            commandName: 'run',
            parameterText: 'run-key-10900004',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      },
    ]

    test.each(cases)('commandName: $input.input.commandName', ({
      input,
    }) => {
      const validator = AiRunOperatorCommandInputValidator.create(input)

      const received = validator.Ctor

      expect(received)
        .toBe(AiRunOperatorCommandInputValidator) // same reference
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('#hasParameter()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'stalled',
            parameterText: '300',
            stalledForSeconds: 300,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'run',
            parameterText: 'run-key-10900005',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.hasParameter()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            commandName: 'stalled',
            parameterText: null,
            stalledForSeconds: null,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'correlation',
            parameterText: '',
            stalledForSeconds: 0,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('commandName: $input.commandName', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.hasParameter()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('#isValidStalledForSeconds()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'stalled',
            parameterText: '1',
            stalledForSeconds: 1,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: '300',
            stalledForSeconds: 300,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: '31536000',
            stalledForSeconds: 31536000,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.isValidStalledForSeconds()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            commandName: 'stalled',
            parameterText: '0',
            stalledForSeconds: 0,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: '-1',
            stalledForSeconds: -1,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: '31536001',
            stalledForSeconds: 31536001,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: '1.5',
            stalledForSeconds: 1.5,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: 'three-hundred',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'stalled',
            parameterText: null,
            stalledForSeconds: null,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.isValidStalledForSeconds()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('#isValidFailedSince()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'failed-since',
            parameterText: '2026-09-28T00:00:00.000Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('2026-09-28T00:00:00.000Z'),
          },
        },
        {
          input: {
            commandName: 'failed-since',
            parameterText: '1000-01-01T00:00:00.000Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('1000-01-01T00:00:00.000Z'),
          },
        },
        {
          input: {
            commandName: 'failed-since',
            parameterText: '2024-02-29T12:34:56.789Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('2024-02-29T12:34:56.789Z'),
          },
        },
      ]

      test.each(cases)('failedSince: $input.failedSince', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.isValidFailedSince()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            commandName: 'failed-since',
            parameterText: 'yesterday',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('yesterday'),
          },
        },
        {
          input: {
            commandName: 'failed-since',
            parameterText: '0999-12-31T23:59:59.999Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('0999-12-31T23:59:59.999Z'),
          },
        },
        {
          input: {
            commandName: 'failed-since',
            parameterText: null,
            stalledForSeconds: null,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.isValidFailedSince()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('#isValidRunKey()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'run',
            parameterText: 'run-key-10900001',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'run',
            parameterText: 'a1b2c3d4e5f60718a1b2c3d4e5f60718a1b2c3d4e5f60718a1b2c3d4e5f60718', // 64 characters -- the width of the column
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.isValidRunKey()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            commandName: 'run',
            parameterText: '',
            stalledForSeconds: 0,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'run',
            parameterText: 'a1b2c3d4e5f60718a1b2c3d4e5f60718a1b2c3d4e5f60718a1b2c3d4e5f607180', // 65 characters -- one past the column
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'run',
            parameterText: 'run key 10900006', // spaces are not printable characters of a key
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'run',
            parameterText: null,
            stalledForSeconds: null,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.isValidRunKey()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunOperatorCommandInputValidator', () => {
  describe('#isValidCorrelationId()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            commandName: 'correlation',
            parameterText: 'correlation-id-10900002',
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'correlation',
            parameterText: 'correlation-id-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 191 characters -- the width of the column
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.isValidCorrelationId()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            commandName: 'correlation',
            parameterText: '',
            stalledForSeconds: 0,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'correlation',
            parameterText: 'correlation-id-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', // 192 characters -- one past the column
            stalledForSeconds: Number.NaN,
            failedSince: null,
          },
        },
        {
          input: {
            commandName: 'correlation',
            parameterText: null,
            stalledForSeconds: null,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('parameterText: $input.parameterText', ({
        input,
      }) => {
        const validator = AiRunOperatorCommandInputValidator.create({
          input,
        })

        const received = validator.isValidCorrelationId()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})
