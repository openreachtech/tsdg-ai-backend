import AssetMediaExtractionInputValidator from '../../../../../app/validator/forRenderer/AssetMediaExtractionInputValidator.js'

import AiRunCommonFieldsInputValidator from '../../../../../app/validator/forRenderer/AiRunCommonFieldsInputValidator.js'

import ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT_CONSTANT_HASH from '../../../../../app/constants/assetMediaExtractionRequestLimitConstants.js'

const {
  ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT,
} = ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT_CONSTANT_HASH

/*
 * The two rules this service adds to the five every run-creating request is judged by. They are
 * what stands between one accepted request and an unbounded amount of synchronous work on the
 * `run-asset-media-extraction` queue: the field schema is read once per field of it, and the media
 * signature once per run, and specs/1.0.0 §7's run time limit cannot end work that never yields.
 *
 * The boundary cases below are built from the constants rather than from a literal, because what
 * the rule promises is "no longer than the figure that was derived" - a test repeating a literal
 * would pass against a master somebody had moved.
 */

describe('AssetMediaExtractionInputValidator', () => {
  describe('super class', () => {
    test('to be instance of AiRunCommonFieldsInputValidator', () => {
      const received = AssetMediaExtractionInputValidator.prototype

      expect(received)
        .toBeInstanceOf(AiRunCommonFieldsInputValidator)
    })
  })
})

describe('AssetMediaExtractionInputValidator', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          ValidatorCtor: AssetMediaExtractionInputValidator,
        },
      },
      {
        input: {
          ValidatorCtor: class ExtendedAssetMediaExtractionInputValidator extends AssetMediaExtractionInputValidator {},
        },
      },
    ]

    test.each(cases)('class: $input.ValidatorCtor.name', ({
      input,
    }) => {
      const validator = input.ValidatorCtor.create({
        input: {},
        errorHash: {},
      })

      const received = validator.Ctor

      expect(received)
        .toBe(input.ValidatorCtor) // same reference
    })
  })
})

describe('AssetMediaExtractionInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    /*
     * The common five keep their own order and come first, and this service's two follow. The whole
     * list is compared rather than its tail, because a rule that stopped being declared - or that
     * moved ahead of the idempotency key - would be invisible in a comparison of the tail alone.
     */
    describe('should declare this service two rules after the common five', () => {
      const cases = [
        {
          input: {
            errorHash: {
              MissingIdempotencyKey: 'missing-idempotency-key-10650001',
              InvalidIdempotencyKey: 'invalid-idempotency-key-10650001',
              InvalidExternalRef: 'invalid-external-ref-10650001',
              InvalidSubjectLabel: 'invalid-subject-label-10650001',
              InvalidCorrelationId: 'invalid-correlation-id-10650001',
              InvalidCallbackUrl: 'invalid-callback-url-10650001',
              InvalidFieldSchema: 'invalid-field-schema-10650001',
              InvalidMediaSignature: 'invalid-media-signature-10650001',
            },
          },
          expected: [
            [
              expect.any(Function),
              'missing-idempotency-key-10650001',
            ],
            [
              expect.any(Function),
              'invalid-idempotency-key-10650001',
            ],
            [
              expect.any(Function),
              'invalid-external-ref-10650001',
            ],
            [
              expect.any(Function),
              'invalid-subject-label-10650001',
            ],
            [
              expect.any(Function),
              'invalid-correlation-id-10650001',
            ],
            [
              expect.any(Function),
              'invalid-callback-url-10650001',
            ],
            [
              expect.any(Function),
              'invalid-field-schema-10650001',
            ],
            [
              expect.any(Function),
              'invalid-media-signature-10650001',
            ],
          ],
        },
        {
          input: {
            errorHash: {
              MissingIdempotencyKey: 'missing-idempotency-key-10650002',
              InvalidIdempotencyKey: 'invalid-idempotency-key-10650002',
              InvalidExternalRef: 'invalid-external-ref-10650002',
              InvalidSubjectLabel: 'invalid-subject-label-10650002',
              InvalidCorrelationId: 'invalid-correlation-id-10650002',
              InvalidCallbackUrl: 'invalid-callback-url-10650002',
              InvalidFieldSchema: 'invalid-field-schema-10650002',
              InvalidMediaSignature: 'invalid-media-signature-10650002',
            },
          },
          expected: [
            [
              expect.any(Function),
              'missing-idempotency-key-10650002',
            ],
            [
              expect.any(Function),
              'invalid-idempotency-key-10650002',
            ],
            [
              expect.any(Function),
              'invalid-external-ref-10650002',
            ],
            [
              expect.any(Function),
              'invalid-subject-label-10650002',
            ],
            [
              expect.any(Function),
              'invalid-correlation-id-10650002',
            ],
            [
              expect.any(Function),
              'invalid-callback-url-10650002',
            ],
            [
              expect.any(Function),
              'invalid-field-schema-10650002',
            ],
            [
              expect.any(Function),
              'invalid-media-signature-10650002',
            ],
          ],
        },
      ]

      test.each(cases)('InvalidFieldSchema: $input.errorHash.InvalidFieldSchema', ({
        input,
        expected,
      }) => {
        const validator = AssetMediaExtractionInputValidator.create({
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

describe('AssetMediaExtractionInputValidator', () => {
  describe('#isValidFieldSchema()', () => {
    /*
     * `label` rather than a field path: what tells these cases apart is how many entries the schema
     * carries, and a title interpolating the schema itself would print two hundred objects.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          label: 'a schema of one field',
          input: {
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                valueKind: 'select',
              },
            ],
          },
        },
        {
          label: 'a schema of exactly the maximum',
          input: {
            fieldSchema: Array.from(
              {
                length: ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT,
              },
              (unusedValue, index) => ({
                path: `attributes.field${index}`,
                valueKind: 'text',
              })
            ),
          },
        },
        {
          label: 'a schema carrying nothing',
          input: {
            fieldSchema: [],
          },
        },
        {
          label: 'no schema at all',
          input: {
            fieldSchema: null,
          },
        },
        {
          label: 'a schema that is not an array',
          input: {
            fieldSchema: 'attributes.wallMaterial', // The run keeps nothing from it and answers none
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const validator = AssetMediaExtractionInputValidator.create({
          input,
          errorHash: {},
        })

        const received = validator.isValidFieldSchema()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          label: 'a schema one field over the maximum',
          input: {
            fieldSchema: Array.from(
              {
                length: ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT + 1,
              },
              (unusedValue, index) => ({
                path: `attributes.field${index}`,
                valueKind: 'text',
              })
            ),
          },
        },
        {
          label: 'a schema of a hundred thousand fields',
          input: {
            fieldSchema: Array.from(
              {
                length: 100000,
              },
              (unusedValue, index) => ({
                path: `attributes.field${index}`,
                valueKind: 'text',
              })
            ),
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const validator = AssetMediaExtractionInputValidator.create({
          input,
          errorHash: {},
        })

        const received = validator.isValidFieldSchema()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AssetMediaExtractionInputValidator', () => {
  describe('#isValidMediaSignature()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          label: 'a signature a caller would send',
          input: {
            mediaSignature: 'nha-pho|10650011|10650012',
          },
        },
        {
          label: 'a signature of exactly the maximum length',
          input: {
            mediaSignature: 'x'.repeat(ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_MEDIA_SIGNATURE_LENGTH),
          },
        },
        {
          label: 'an empty signature',
          input: {
            mediaSignature: '',
          },
        },
        {
          label: 'no signature at all',
          input: {
            mediaSignature: null,
          },
        },
        {
          label: 'a request that carries no signature field',
          input: {},
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const validator = AssetMediaExtractionInputValidator.create({
          input,
          errorHash: {},
        })

        const received = validator.isValidMediaSignature()

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * The array case is the shape the low-severity half of this defect came in on: a value of that
     * shape reaching the recursive canonical-text builder exhausted the stack, and the run was then
     * recorded as a provider call that failed - untrue, because no provider was ever called. It is
     * refused here, where the caller can still read the refusal.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          label: 'a signature one character over the maximum',
          input: {
            mediaSignature: 'x'.repeat(ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_MEDIA_SIGNATURE_LENGTH + 1),
          },
        },
        {
          label: 'a signature of five million characters',
          input: {
            mediaSignature: 'x'.repeat(5000000),
          },
        },
        {
          label: 'an array four thousand deep',
          input: {
            mediaSignature: JSON.parse(`${'['.repeat(4000)}${']'.repeat(4000)}`),
          },
        },
        {
          label: 'a number',
          input: {
            mediaSignature: 10650013,
          },
        },
        {
          label: 'an object',
          input: {
            mediaSignature: {
              signature: 'media-signature-10650014',
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const validator = AssetMediaExtractionInputValidator.create({
          input,
          errorHash: {},
        })

        const received = validator.isValidMediaSignature()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AssetMediaExtractionInputValidator', () => {
  describe('#validateInput()', () => {
    /*
     * The whole judgment, end to end: what a caller is answered with, and that the common five are
     * still judged first. A request over either figure is refused with that field own error and
     * nothing else has run.
     */
    describe('should answer with the first failing rule error', () => {
      const cases = [
        {
          label: 'a field schema over the maximum',
          input: {
            requestKey: 'request-key-10650021',
            externalRef: 'external-ref-10650021',
            subjectLabel: 'Subject label 10650021',
            correlationId: 'correlation-id-10650021',
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/10650021',
            fieldSchema: Array.from(
              {
                length: ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT + 1,
              },
              (unusedValue, index) => ({
                path: `attributes.field${index}`,
                valueKind: 'text',
              })
            ),
            mediaSignature: 'media-signature-10650021',
          },
          expected: 'invalid-field-schema-10650021',
        },
        {
          label: 'a media signature over the maximum',
          input: {
            requestKey: 'request-key-10650022',
            externalRef: 'external-ref-10650022',
            subjectLabel: 'Subject label 10650022',
            correlationId: 'correlation-id-10650022',
            callbackUrl: 'https://beta.client.development.invalid/callbacks/10650022',
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                valueKind: 'select',
              },
            ],
            mediaSignature: 'y'.repeat(ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_MEDIA_SIGNATURE_LENGTH + 1),
          },
          expected: 'invalid-media-signature-10650021',
        },
        {
          label: 'a request missing its idempotency key as well',
          input: {
            requestKey: null,
            externalRef: 'external-ref-10650023',
            subjectLabel: 'Subject label 10650023',
            correlationId: 'correlation-id-10650023',
            callbackUrl: 'https://gamma.client.development.invalid/callbacks/10650023',
            fieldSchema: Array.from(
              {
                length: ASSET_MEDIA_EXTRACTION_REQUEST_LIMIT.MAXIMUM_FIELD_SCHEMA_ENTRY_COUNT + 1,
              },
              (unusedValue, index) => ({
                path: `attributes.field${index}`,
                valueKind: 'text',
              })
            ),
            mediaSignature: 'media-signature-10650023',
          },
          expected: 'missing-idempotency-key-10650021',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const validator = AssetMediaExtractionInputValidator.create({
          input,
          errorHash: {
            MissingIdempotencyKey: 'missing-idempotency-key-10650021',
            InvalidIdempotencyKey: 'invalid-idempotency-key-10650021',
            InvalidExternalRef: 'invalid-external-ref-10650021',
            InvalidSubjectLabel: 'invalid-subject-label-10650021',
            InvalidCorrelationId: 'invalid-correlation-id-10650021',
            InvalidCallbackUrl: 'invalid-callback-url-10650021',
            InvalidFieldSchema: 'invalid-field-schema-10650021',
            InvalidMediaSignature: 'invalid-media-signature-10650021',
          },
        })

        const received = validator.validateInput()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer nothing where every rule passed', () => {
      const cases = [
        {
          label: 'a request inside both figures',
          input: {
            requestKey: 'request-key-10650031',
            externalRef: 'external-ref-10650031',
            subjectLabel: 'Subject label 10650031',
            correlationId: 'correlation-id-10650031',
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/10650031',
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                valueKind: 'select',
                options: [
                  'brick',
                ],
              },
            ],
            mediaSignature: 'media-signature-10650031',
          },
        },
        {
          label: 'a request carrying neither field',
          input: {
            requestKey: 'request-key-10650032',
            externalRef: 'external-ref-10650032',
            subjectLabel: 'Subject label 10650032',
            correlationId: 'correlation-id-10650032',
            callbackUrl: 'https://beta.client.development.invalid/callbacks/10650032',
            fieldSchema: null,
            mediaSignature: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const validator = AssetMediaExtractionInputValidator.create({
          input,
          errorHash: {
            MissingIdempotencyKey: 'missing-idempotency-key-10650031',
            InvalidIdempotencyKey: 'invalid-idempotency-key-10650031',
            InvalidExternalRef: 'invalid-external-ref-10650031',
            InvalidSubjectLabel: 'invalid-subject-label-10650031',
            InvalidCorrelationId: 'invalid-correlation-id-10650031',
            InvalidCallbackUrl: 'invalid-callback-url-10650031',
            InvalidFieldSchema: 'invalid-field-schema-10650031',
            InvalidMediaSignature: 'invalid-media-signature-10650031',
          },
        })

        const received = validator.validateInput()

        expect(received)
          .toBeNull()
      })
    })
  })
})
