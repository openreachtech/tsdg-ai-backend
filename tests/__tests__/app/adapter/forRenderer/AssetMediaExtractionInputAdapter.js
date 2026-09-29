import AssetMediaExtractionInputAdapter from '../../../../../app/adapter/forRenderer/AssetMediaExtractionInputAdapter.js'

import AiRunCommonFieldsInputAdapter from '../../../../../app/adapter/forRenderer/AiRunCommonFieldsInputAdapter.js'

/*
 * The two fields `AssetMediaExtractionRequest` carries that no other run-creating request does.
 * They are read here so that one input reaches one validator - the rule that bounds them is
 * `AssetMediaExtractionInputValidator`'s, and a rule can only judge a field it can see.
 *
 * What this adapter must not do is judge anything: a field that was not sent comes back null, and a
 * field that was sent comes back exactly as it arrived, whatever shape that is. The cases below
 * hand it a signature that is not a string and a field schema that is not an array for that reason.
 */

describe('AssetMediaExtractionInputAdapter', () => {
  describe('super class', () => {
    test('to be instance of AiRunCommonFieldsInputAdapter', () => {
      const received = AssetMediaExtractionInputAdapter.prototype

      expect(received)
        .toBeInstanceOf(AiRunCommonFieldsInputAdapter)
    })
  })
})

describe('AssetMediaExtractionInputAdapter', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          AdapterCtor: AssetMediaExtractionInputAdapter,
        },
      },
      {
        input: {
          AdapterCtor: class ExtendedAssetMediaExtractionInputAdapter extends AssetMediaExtractionInputAdapter {},
        },
      },
    ]

    test.each(cases)('class: $input.AdapterCtor.name', ({
      input,
    }) => {
      const adapter = input.AdapterCtor.create({
        body: {},
        request: {},
      })

      const received = adapter.Ctor

      expect(received)
        .toBe(input.AdapterCtor) // same reference
    })
  })
})

describe('AssetMediaExtractionInputAdapter', () => {
  describe('#buildInput()', () => {
    describe('when every field was sent', () => {
      const cases = [
        {
          input: {
            body: {
              externalRef: 'external-ref-10640001',
              subjectLabel: 'Subject label 10640001',
              correlationId: 'correlation-id-10640001',
              callbackUrl: 'https://alpha.client.development.invalid/callbacks/10640001',
              asset: {
                province: 'Lam Dong',
              },
              fieldSchema: [
                {
                  path: 'attributes.wallMaterial',
                  valueKind: 'select',
                  options: [
                    'brick',
                  ],
                },
              ],
              mediaSignature: 'media-signature-10640001',
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-10640001',
                },
              },
            },
          },
          expected: {
            requestKey: 'request-key-10640001',
            externalRef: 'external-ref-10640001',
            subjectLabel: 'Subject label 10640001',
            correlationId: 'correlation-id-10640001',
            callbackUrl: 'https://alpha.client.development.invalid/callbacks/10640001',
            fieldSchema: [
              {
                path: 'attributes.wallMaterial',
                valueKind: 'select',
                options: [
                  'brick',
                ],
              },
            ],
            mediaSignature: 'media-signature-10640001',
          },
        },
        {
          input: {
            body: {
              externalRef: 'external-ref-10640002',
              subjectLabel: 'Subject label 10640002',
              correlationId: 'correlation-id-10640002',
              callbackUrl: 'https://beta.client.development.invalid/callbacks/10640002',
              fieldSchema: 'attributes.wallMaterial', // Handed on as it arrived, not judged here
              mediaSignature: 10640002, // Handed on as it arrived, not judged here
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-10640002',
                },
              },
            },
          },
          expected: {
            requestKey: 'request-key-10640002',
            externalRef: 'external-ref-10640002',
            subjectLabel: 'Subject label 10640002',
            correlationId: 'correlation-id-10640002',
            callbackUrl: 'https://beta.client.development.invalid/callbacks/10640002',
            fieldSchema: 'attributes.wallMaterial',
            mediaSignature: 10640002,
          },
        },
      ]

      test.each(cases)('externalRef: $input.body.externalRef', ({
        input,
        expected,
      }) => {
        const adapter = AssetMediaExtractionInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * `label` rather than a field path: one case's body carries the fields and leaves two out, and
     * the other has no body at all, so there is no one path that names both to a person reading the
     * run.
     */
    describe('when fields were not sent', () => {
      const cases = [
        {
          label: 'a body carrying neither field',
          input: {
            body: {
              externalRef: 'external-ref-10640003',
              subjectLabel: 'Subject label 10640003',
              correlationId: 'correlation-id-10640003',
              callbackUrl: 'https://gamma.client.development.invalid/callbacks/10640003',
              // fieldSchema: not sent
              // mediaSignature: not sent
            },
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-10640003',
                },
              },
            },
          },
          expected: {
            requestKey: 'request-key-10640003',
            externalRef: 'external-ref-10640003',
            subjectLabel: 'Subject label 10640003',
            correlationId: 'correlation-id-10640003',
            callbackUrl: 'https://gamma.client.development.invalid/callbacks/10640003',
            fieldSchema: null,
            mediaSignature: null,
          },
        },
        {
          label: 'no body at all',
          input: {
            body: null, // A request the engine parsed no body from
            request: {
              expressRequest: {
                headers: {
                  'idempotency-key': 'request-key-10640004',
                },
              },
            },
          },
          expected: {
            requestKey: 'request-key-10640004',
            externalRef: null,
            subjectLabel: null,
            correlationId: null,
            callbackUrl: null,
            fieldSchema: null,
            mediaSignature: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const adapter = AssetMediaExtractionInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
