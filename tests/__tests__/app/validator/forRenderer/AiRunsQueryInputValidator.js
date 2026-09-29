import AiRunsQueryInputValidator from '../../../../../app/validator/forRenderer/AiRunsQueryInputValidator.js'

import BaseInputValidator from '../../../../../app/validator/BaseInputValidator.js'

import AiRunPageCursor from '../../../../../app/aiRun/AiRunPageCursor.js'

/*
 * The rules section 13's query string is judged by.
 *
 * **The error hash is a hash of strings.** `BaseInputValidator` returns the identity of the first
 * rule that failed and raises nothing itself, so what a rule names is whatever the caller's hash
 * holds — the renderer passes response classes, and a test that wants to read which rule failed
 * passes strings. Building the real hash here would tie every case below to the status code the
 * renderer happens to answer with, which is the renderer's to state and not this class's.
 *
 * **Every rule is read in both directions and with the field absent.** A parameter nobody sent
 * passes, which is what makes each of the six optional; asserting only the failures would leave
 * a rule that refused everything looking correct.
 */

describe('AiRunsQueryInputValidator', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AiRunsQueryInputValidator.prototype

      expect(received)
        .toBeInstanceOf(BaseInputValidator)
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('.get:AiRunPageCursorCtor', () => {
    describe('when called as is', () => {
      test('should be the class a cursor text is read through', () => {
        const received = AiRunsQueryInputValidator.AiRunPageCursorCtor

        expect(received)
          .toBe(AiRunPageCursor) // same reference
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('.isMasterRowName()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            value: 'alpha',
            masterRowHash: {
              ALPHA: {
                NAME: 'alpha',
              },
              BETA: {
                NAME: 'beta',
              },
            },
          },
        },
        {
          input: {
            value: 'beta',
            masterRowHash: {
              ALPHA: {
                NAME: 'alpha',
              },
              BETA: {
                NAME: 'beta',
              },
            },
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunsQueryInputValidator.isMasterRowName(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            value: 'gamma',
            masterRowHash: {
              ALPHA: {
                NAME: 'alpha',
              },
              BETA: {
                NAME: 'beta',
              },
            },
          },
        },
        {
          input: {
            // the key rather than the name, which is the mistake a reader of the constant makes
            value: 'ALPHA',
            masterRowHash: {
              ALPHA: {
                NAME: 'alpha',
              },
            },
          },
        },
        {
          input: {
            value: [
              'alpha',
            ],
            masterRowHash: {
              ALPHA: {
                NAME: 'alpha',
              },
            },
          },
        },
        {
          input: {
            value: 100001,
            masterRowHash: {
              ALPHA: {
                NAME: 'alpha',
              },
            },
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunsQueryInputValidator.isMasterRowName(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('.isCountWithin()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            value: 20,
            minimum: 1,
            maximum: 100,
          },
        },
        {
          input: {
            value: 1,
            minimum: 1,
            maximum: 100,
          },
        },
        {
          input: {
            value: 100,
            minimum: 1,
            maximum: 100,
          },
        },
        {
          input: {
            value: 0,
            minimum: 0,
            maximum: 10,
          },
        },
        {
          input: {
            value: Number.MAX_SAFE_INTEGER,
            minimum: 1,
            maximum: Number.MAX_SAFE_INTEGER,
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunsQueryInputValidator.isCountWithin(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            value: 0,
            minimum: 1,
            maximum: 100,
          },
        },
        {
          input: {
            value: 101,
            minimum: 1,
            maximum: 100,
          },
        },
        {
          input: {
            value: -1,
            minimum: 1,
            maximum: 100,
          },
        },
        {
          input: {
            value: 1.5,
            minimum: 1,
            maximum: 100,
          },
        },
        {
          input: {
            value: Number.NaN,
            minimum: 1,
            maximum: 100,
          },
        },
        {
          input: {
            value: Number.MAX_SAFE_INTEGER + 1,
            minimum: 1,
            maximum: Number.MAX_SAFE_INTEGER,
          },
        },
        {
          input: {
            value: '20',
            minimum: 1,
            maximum: 100,
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunsQueryInputValidator.isCountWithin(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    describe('should declare one rule per parameter, in the order the contract lists them', () => {
      const cases = [
        {
          input: {
            index: 0,
            parameterName: 'statusName',
          },
          expected: 'error-identity-0001',
        },
        {
          input: {
            index: 1,
            parameterName: 'runCategoryName',
          },
          expected: 'error-identity-0002',
        },
        {
          input: {
            index: 2,
            parameterName: 'correlationId',
          },
          expected: 'error-identity-0003',
        },
        {
          input: {
            index: 3,
            parameterName: 'stalledForSeconds',
          },
          expected: 'error-identity-0004',
        },
        {
          input: {
            index: 4,
            parameterName: 'limit',
          },
          expected: 'error-identity-0005',
        },
        {
          input: {
            index: 5,
            parameterName: 'cursor',
          },
          expected: 'error-identity-0006',
        },
      ]

      test.each(cases)('parameterName: $input.parameterName', ({
        input,
        expected,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input: {
            statusName: null,
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: null,
            limit: null,
            cursor: null,
          },
          errorHash: {
            InvalidStatusName: 'error-identity-0001',
            InvalidRunCategoryName: 'error-identity-0002',
            InvalidCorrelationId: 'error-identity-0003',
            InvalidStalledForSeconds: 'error-identity-0004',
            InvalidLimit: 'error-identity-0005',
            InvalidCursor: 'error-identity-0006',
          },
        })

        const entries = validator.generateValidationEntries()
        const [, received] = entries[input.index]

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('#validateInput()', () => {
    describe('should answer with the rule that failed', () => {
      const cases = [
        {
          input: {
            statusName: 'runing', // the typo a client makes, and the whole reason this is refused
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: null,
            limit: null,
            cursor: null,
          },
          expected: 'error-identity-0001',
        },
        {
          input: {
            statusName: 'queued',
            runCategoryName: 'asset-media-extractions',
            correlationId: null,
            stalledForSeconds: null,
            limit: null,
            cursor: null,
          },
          expected: 'error-identity-0002',
        },
        {
          input: {
            statusName: 'running',
            runCategoryName: null,
            correlationId: '',
            stalledForSeconds: null,
            limit: null,
            cursor: null,
          },
          expected: 'error-identity-0003',
        },
        {
          input: {
            statusName: 'succeeded',
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: 0,
            limit: null,
            cursor: null,
          },
          expected: 'error-identity-0004',
        },
        {
          input: {
            statusName: 'failed',
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: null,
            limit: 101,
            cursor: null,
          },
          expected: 'error-identity-0005',
        },
        {
          input: {
            statusName: 'canceled',
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: null,
            limit: null,
            cursor: 'run-key-10010001',
          },
          expected: 'error-identity-0006',
        },
        {
          // two wrong at once answers with the first rule declared, and never with both
          input: {
            statusName: 'RUNNING',
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: null,
            limit: 0,
            cursor: null,
          },
          expected: 'error-identity-0001',
        },
      ]

      test.each(cases)('statusName: $input.statusName', ({
        input,
        expected,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {
            InvalidStatusName: 'error-identity-0001',
            InvalidRunCategoryName: 'error-identity-0002',
            InvalidCorrelationId: 'error-identity-0003',
            InvalidStalledForSeconds: 'error-identity-0004',
            InvalidLimit: 'error-identity-0005',
            InvalidCursor: 'error-identity-0006',
          },
        })

        const received = validator.validateInput()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer with nothing when every rule passed', () => {
      const cases = [
        {
          input: {
            statusName: 'running',
            runCategoryName: 'asset-media-extraction',
            correlationId: 'correlation-id-10700000',
            stalledForSeconds: 300,
            limit: 50,
            cursor: 'cnVuLWtleS0xMDAxMDAwMQ',
          },
        },
        {
          // nothing at all was asked for, which is every rule passing rather than none running
          input: {
            statusName: null,
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: null,
            limit: null,
            cursor: null,
          },
        },
      ]

      test.each(cases)('statusName: $input.statusName', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {
            InvalidStatusName: 'error-identity-0001',
            InvalidRunCategoryName: 'error-identity-0002',
            InvalidCorrelationId: 'error-identity-0003',
            InvalidStalledForSeconds: 'error-identity-0004',
            InvalidLimit: 'error-identity-0005',
            InvalidCursor: 'error-identity-0006',
          },
        })

        const received = validator.validateInput()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('#isValidStatusName()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            statusName: 'queued',
          },
        },
        {
          input: {
            statusName: 'running',
          },
        },
        {
          input: {
            statusName: 'succeeded',
          },
        },
        {
          input: {
            statusName: 'failed',
          },
        },
        {
          input: {
            statusName: 'canceled',
          },
        },
        {
          input: {
            statusName: null,
          },
        },
      ]

      test.each(cases)('statusName: $input.statusName', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidStatusName()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            statusName: 'runing',
          },
        },
        {
          input: {
            statusName: 'QUEUED',
          },
        },
        {
          input: {
            statusName: '',
          },
        },
        {
          input: {
            statusName: [
              'queued',
              'running',
            ],
          },
        },
        {
          input: {
            statusName: 1,
          },
        },
      ]

      test.each(cases)('statusName: $input.statusName', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidStatusName()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('#isValidRunCategoryName()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            runCategoryName: 'asset-media-extraction',
          },
        },
        {
          input: {
            runCategoryName: null,
          },
        },
      ]

      test.each(cases)('runCategoryName: $input.runCategoryName', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidRunCategoryName()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            runCategoryName: 'asset-media-extractions',
          },
        },
        {
          input: {
            runCategoryName: 'Asset media extraction',
          },
        },
        {
          input: {
            runCategoryName: '',
          },
        },
        {
          input: {
            runCategoryName: [
              'asset-media-extraction',
            ],
          },
        },
      ]

      test.each(cases)('runCategoryName: $input.runCategoryName', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidRunCategoryName()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('#isValidCorrelationId()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            correlationId: 'correlation-id-10700000',
          },
        },
        {
          input: {
            // whatever the caller groups its own object by is never interpreted
            correlationId: '{"objectId":100001}',
          },
        },
        {
          input: {
            correlationId: 'c'.repeat(191), // the width the column gives the field
          },
        },
        {
          input: {
            correlationId: null,
          },
        },
      ]

      test.each(cases)('correlationId: $input.correlationId', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
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
            correlationId: '',
          },
        },
        {
          input: {
            correlationId: 'c'.repeat(192), // one past the width the column gives the field
          },
        },
        {
          input: {
            correlationId: [
              'correlation-id-10700000',
            ],
          },
        },
        {
          input: {
            correlationId: 100001,
          },
        },
      ]

      test.each(cases)('correlationId: $input.correlationId', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidCorrelationId()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('#isValidStalledForSeconds()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            stalledForSeconds: 300,
          },
        },
        {
          input: {
            stalledForSeconds: 1,
          },
        },
        {
          input: {
            stalledForSeconds: 31536000, // the ceiling, which is 365 days
          },
        },
        {
          input: {
            stalledForSeconds: null,
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidStalledForSeconds()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          // `?stalledForSeconds=` with nothing after it reads as this
          input: {
            stalledForSeconds: 0,
          },
        },
        {
          input: {
            stalledForSeconds: -1,
          },
        },
        {
          input: {
            stalledForSeconds: 31536001, // one past the ceiling
          },
        },
        {
          input: {
            stalledForSeconds: 300.5,
          },
        },
        {
          input: {
            stalledForSeconds: Number.NaN,
          },
        },
        {
          input: {
            stalledForSeconds: Number.MAX_SAFE_INTEGER + 1,
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidStalledForSeconds()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('#isValidLimit()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            limit: 20,
          },
        },
        {
          input: {
            limit: 1,
          },
        },
        {
          input: {
            limit: 100, // the ceiling one page is read at
          },
        },
        {
          input: {
            limit: null,
          },
        },
      ]

      test.each(cases)('limit: $input.limit', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidLimit()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            limit: 0,
          },
        },
        {
          input: {
            limit: 101, // one past the ceiling
          },
        },
        {
          input: {
            limit: -20,
          },
        },
        {
          input: {
            limit: 20.5,
          },
        },
        {
          input: {
            limit: Number.NaN,
          },
        },
        {
          input: {
            limit: Number.MAX_SAFE_INTEGER + 1,
          },
        },
      ]

      test.each(cases)('limit: $input.limit', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidLimit()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunsQueryInputValidator', () => {
  describe('#isValidCursor()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            cursor: 'cnVuLWtleS0xMDAxMDAwMQ',
          },
        },
        {
          input: {
            cursor: 'cnVuLWtleS0xMDcwMDAwMQ',
          },
        },
        {
          input: {
            cursor: null,
          },
        },
      ]

      test.each(cases)('cursor: $input.cursor', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidCursor()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          // a run key sent as it is, which is the cursor somebody builds by hand
          input: {
            cursor: 'run-key-10010001',
          },
        },
        {
          input: {
            cursor: 'cnVuLWtleS0xMDAxMDAwMQ==',
          },
        },
        {
          input: {
            cursor: '',
          },
        },
        {
          input: {
            cursor: [
              'cnVuLWtleS0xMDAxMDAwMQ',
            ],
          },
        },
        {
          input: {
            cursor: 100001,
          },
        },
      ]

      test.each(cases)('cursor: $input.cursor', ({
        input,
      }) => {
        const validator = AiRunsQueryInputValidator.create({
          input,
          errorHash: {}, // no rule is reached, so the hash is not under test
        })

        const received = validator.isValidCursor()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})
