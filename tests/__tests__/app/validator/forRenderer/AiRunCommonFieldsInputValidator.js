import AiRunCommonFieldsInputValidator from '../../../../../app/validator/forRenderer/AiRunCommonFieldsInputValidator.js'

import BaseInputValidator from '../../../../../app/validator/BaseInputValidator.js'

describe('AiRunCommonFieldsInputValidator', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AiRunCommonFieldsInputValidator.prototype

      expect(received)
        .toBeInstanceOf(BaseInputValidator)
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('.isFilledText()', () => {
    describe('with valid values', () => {
      const cases = [
        {
          input: {
            value: 'omega',
          },
        },
        {
          input: {
            value: 'external-ref-0001',
          },
        },
        {
          input: {
            value: '  surrounded-by-blanks-0002  ', // Blanks around text do not empty it
          },
        },
        {
          input: {
            value: '0', // A string that is falsy as a number is still filled text
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunCommonFieldsInputValidator.isFilledText(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('with invalid values', () => {
      /** @type {Array<{ input: { value: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            value: '',
          },
        },
        {
          input: {
            value: '   ', // Blanks alone are a field nobody filled in
          },
        },
        {
          input: {
            value: '\t\n',
          },
        },
        {
          input: {
            value: null,
          },
        },
        {
          input: {
            value: undefined,
          },
        },
        {
          input: {
            value: 100001, // A number is not the text this field holds
          },
        },
        {
          input: {
            value: true,
          },
        },
        {
          input: {
            value: {},
          },
        },
        {
          input: {
            value: [],
          },
        },
      ])

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunCommonFieldsInputValidator.isFilledText(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunCommonFieldsInputValidator,
      },
      {
        tally: class AlphaAiRunInputValidator extends AiRunCommonFieldsInputValidator {},
      },
      {
        tally: class BetaAiRunInputValidator extends AiRunCommonFieldsInputValidator {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const validator = tally.create({
        input: {}, // Neutral value; not under test
        errorHash: {}, // Neutral value; not under test
      })

      const received = validator.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    describe('should declare one rule per required field', () => {
      const cases = [
        {
          input: {
            errorHash: {
              MissingIdempotencyKey: 'missing-idempotency-key-0001',
              InvalidExternalRef: 'invalid-external-ref-0001',
              InvalidSubjectLabel: 'invalid-subject-label-0001',
              InvalidCorrelationId: 'invalid-correlation-id-0001',
              InvalidCallbackUrl: 'invalid-callback-url-0001',
            },
          },
          expected: [
            [
              expect.any(Function),
              'missing-idempotency-key-0001',
            ],
            [
              expect.any(Function),
              'invalid-external-ref-0001',
            ],
            [
              expect.any(Function),
              'invalid-subject-label-0001',
            ],
            [
              expect.any(Function),
              'invalid-correlation-id-0001',
            ],
            [
              expect.any(Function),
              'invalid-callback-url-0001',
            ],
          ],
        },
        {
          input: {
            errorHash: {
              MissingIdempotencyKey: 'missing-idempotency-key-0002',
              InvalidExternalRef: 'invalid-external-ref-0002',
              InvalidSubjectLabel: 'invalid-subject-label-0002',
              InvalidCorrelationId: 'invalid-correlation-id-0002',
              InvalidCallbackUrl: 'invalid-callback-url-0002',
            },
          },
          expected: [
            [
              expect.any(Function),
              'missing-idempotency-key-0002',
            ],
            [
              expect.any(Function),
              'invalid-external-ref-0002',
            ],
            [
              expect.any(Function),
              'invalid-subject-label-0002',
            ],
            [
              expect.any(Function),
              'invalid-correlation-id-0002',
            ],
            [
              expect.any(Function),
              'invalid-callback-url-0002',
            ],
          ],
        },
      ]

      test.each(cases)('MissingIdempotencyKey: $input.errorHash.MissingIdempotencyKey', ({
        input,
        expected,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input: {}, // Neutral value; the entries are declared before any rule runs
          errorHash: input.errorHash,
        })

        const received = validator.generateValidationEntries()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('#isValidRequestKey()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            requestKey: 'request-key-0001',
          },
        },
        {
          input: {
            requestKey: 'request-key-0002',
          },
        },
      ]

      test.each(cases)('requestKey: $input.requestKey', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidRequestKey()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /** @type {Array<{ input: { requestKey: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            requestKey: null, // The header was not sent
          },
        },
        {
          input: {
            requestKey: '',
          },
        },
        {
          input: {
            requestKey: '   ',
          },
        },
      ])

      test.each(cases)('requestKey: $input.requestKey', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidRequestKey()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('#isValidExternalRef()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            externalRef: 'external-ref-0001',
          },
        },
        {
          input: {
            externalRef: 'external-ref-0002',
          },
        },
      ]

      test.each(cases)('externalRef: $input.externalRef', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidExternalRef()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /** @type {Array<{ input: { externalRef: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            externalRef: null,
          },
        },
        {
          input: {
            externalRef: '',
          },
        },
        {
          input: {
            externalRef: '  ',
          },
        },
      ])

      test.each(cases)('externalRef: $input.externalRef', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidExternalRef()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('#isValidSubjectLabel()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            subjectLabel: 'Subject label 0001',
          },
        },
        {
          input: {
            subjectLabel: 'Subject label 0002',
          },
        },
      ]

      test.each(cases)('subjectLabel: $input.subjectLabel', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidSubjectLabel()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /** @type {Array<{ input: { subjectLabel: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            subjectLabel: null,
          },
        },
        {
          input: {
            subjectLabel: '',
          },
        },
        {
          input: {
            subjectLabel: ' ',
          },
        },
      ])

      test.each(cases)('subjectLabel: $input.subjectLabel', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidSubjectLabel()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('#isValidCorrelationId()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            correlationId: 'correlation-id-0001',
          },
        },
        {
          input: {
            correlationId: 'correlation-id-0002',
          },
        },
      ]

      test.each(cases)('correlationId: $input.correlationId', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidCorrelationId()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /** @type {Array<{ input: { correlationId: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            correlationId: null,
          },
        },
        {
          input: {
            correlationId: '',
          },
        },
        {
          input: {
            correlationId: '\t',
          },
        },
      ])

      test.each(cases)('correlationId: $input.correlationId', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidCorrelationId()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('#isValidCallbackUrl()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/0001',
          },
        },
        {
          input: {
            callbackUrl: 'https://beta.client.development.invalid/callbacks/0002',
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.callbackUrl', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidCallbackUrl()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /** @type {Array<{ input: { callbackUrl: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            callbackUrl: null,
          },
        },
        {
          input: {
            callbackUrl: '',
          },
        },
        {
          input: {
            callbackUrl: '    ',
          },
        },
      ])

      test.each(cases)('callbackUrl: $input.callbackUrl', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {}, // Neutral value; a predicate reads no error
        })

        const received = validator.isValidCallbackUrl()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunCommonFieldsInputValidator', () => {
  describe('#validateInput()', () => {
    describe('when every field was sent', () => {
      const cases = [
        {
          input: {
            requestKey: 'request-key-0001',
            externalRef: 'external-ref-0001',
            subjectLabel: 'Subject label 0001',
            correlationId: 'correlation-id-0001',
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/0001',
          },
        },
        {
          input: {
            requestKey: 'request-key-0002',
            externalRef: 'external-ref-0002',
            subjectLabel: 'Subject label 0002',
            correlationId: 'correlation-id-0002',
            callbackUrl: 'https://beta.client.development.invalid/callbacks/0002',
          },
        },
      ]

      test.each(cases)('requestKey: $input.requestKey', ({
        input,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {
            MissingIdempotencyKey: 'missing-idempotency-key-0003',
            InvalidExternalRef: 'invalid-external-ref-0003',
            InvalidSubjectLabel: 'invalid-subject-label-0003',
            InvalidCorrelationId: 'invalid-correlation-id-0003',
            InvalidCallbackUrl: 'invalid-callback-url-0003',
          },
        })

        const received = validator.validateInput()

        expect(received)
          .toBeNull()
      })
    })

    describe('when a field was not sent', () => {
      /** @type {Array<{ input: Record<string, *>, expected: string }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            // requestKey: not sent
            externalRef: 'external-ref-0004',
            subjectLabel: 'Subject label 0004',
            correlationId: 'correlation-id-0004',
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/0004',
          },
          expected: 'missing-idempotency-key-0003',
        },
        {
          input: {
            requestKey: 'request-key-0005',
            // externalRef: not sent
            subjectLabel: 'Subject label 0005',
            correlationId: 'correlation-id-0005',
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/0005',
          },
          expected: 'invalid-external-ref-0003',
        },
        {
          input: {
            requestKey: 'request-key-0006',
            externalRef: 'external-ref-0006',
            // subjectLabel: not sent
            correlationId: 'correlation-id-0006',
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/0006',
          },
          expected: 'invalid-subject-label-0003',
        },
        {
          input: {
            requestKey: 'request-key-0007',
            externalRef: 'external-ref-0007',
            subjectLabel: 'Subject label 0007',
            // correlationId: not sent
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/0007',
          },
          expected: 'invalid-correlation-id-0003',
        },
        {
          input: {
            requestKey: 'request-key-0008',
            externalRef: 'external-ref-0008',
            subjectLabel: 'Subject label 0008',
            correlationId: 'correlation-id-0008',
            // callbackUrl: not sent
          },
          expected: 'invalid-callback-url-0003',
        },
      ])

      test.each(cases)('externalRef: $input.externalRef', ({
        input,
        expected,
      }) => {
        const validator = AiRunCommonFieldsInputValidator.create({
          input,
          errorHash: {
            MissingIdempotencyKey: 'missing-idempotency-key-0003',
            InvalidExternalRef: 'invalid-external-ref-0003',
            InvalidSubjectLabel: 'invalid-subject-label-0003',
            InvalidCorrelationId: 'invalid-correlation-id-0003',
            InvalidCallbackUrl: 'invalid-callback-url-0003',
          },
        })

        const received = validator.validateInput()

        expect(received)
          .toBe(expected)
      })
    })
  })
})
