import AiRunCallbackSigner from '../../../../app/aiRunCallback/AiRunCallbackSigner.js'

import ApiClientSignatureVerifier from '../../../../app/apiClient/ApiClientSignatureVerifier.js'

/*
 * The third acceptance criterion of section 12: "a callback is signed the same way a request is,
 * and additionally carries the run key in a header".
 *
 * Every digest asserted below is a literal. Recomputing one inside a test would be the very thing
 * being tested written twice, and a test that computes its own expectation passes against any
 * implementation that makes the same mistake. They were produced by
 * `crypto.createHmac('sha256', secret).update(timestamp + '.' + rawBody).digest('hex')` — the
 * formula `.hora/contracts/1.0.0/client-api.md` states — and pasted in.
 *
 * The secrets are obviously fake and belong to no seeded client: this class reads no row, and a
 * secret is a value the caller hands over already decrypted.
 *
 * The last describe is the one that matters most, and it computes nothing either: it signs with
 * this class and verifies with `ApiClientSignatureVerifier`, which is the class a client's own
 * request is verified by. If the two ever stopped agreeing — a delimiter, an algorithm, an
 * encoding — every literal above could still be right and a client would still be unable to
 * verify the callback it received.
 */

describe('AiRunCallbackSigner', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#signatureVerifierFactory', () => {
        const cases = [
          {
            input: {
              signatureVerifierFactory: ApiClientSignatureVerifier,
            },
            label: 'the real verifier factory',
          },
          {
            input: {
              signatureVerifierFactory: {
                create: () => null,
              },
            },
            label: 'a stand-in factory',
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const signer = new AiRunCallbackSigner(input)

          expect(signer)
            .toHaveProperty('signatureVerifierFactory', input.signatureVerifierFactory)
        })
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          input: {
            signatureVerifierFactory: ApiClientSignatureVerifier,
          },
          label: 'the real verifier factory',
        },
        {
          input: {
            signatureVerifierFactory: {
              create: () => null,
            },
          },
          label: 'a stand-in factory',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const actual = AiRunCallbackSigner.create(input)

        expect(actual)
          .toBeInstanceOf(AiRunCallbackSigner)
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            signatureVerifierFactory: ApiClientSignatureVerifier,
          },
          label: 'the real verifier factory',
        },
        {
          input: {
            signatureVerifierFactory: {
              create: () => null,
            },
          },
          label: 'a stand-in factory',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCallbackSigner)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('.create()', () => {
    describe('should use default signatureVerifierFactory value', () => {
      test('with no arguments', () => {
        const signer = AiRunCallbackSigner.create()

        expect(signer)
          .toHaveProperty('signatureVerifierFactory', ApiClientSignatureVerifier)
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('#get:Ctor', () => {
    describe('should answer own constructor', () => {
      const cases = [
        {
          input: {
            signatureVerifierFactory: ApiClientSignatureVerifier,
          },
          label: 'the real verifier factory',
        },
        {
          input: {
            signatureVerifierFactory: {
              create: () => null,
            },
          },
          label: 'a stand-in factory',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const signer = AiRunCallbackSigner.create(input)

        const actual = signer.Ctor

        expect(actual)
          .toBe(AiRunCallbackSigner) // same reference
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('#createSignatureVerifier()', () => {
    describe('should build the verifier this callback borrows its digest from', () => {
      const cases = [
        {
          input: {
            secret: 'secret-of-signing-client-0001',
          },
        },
        {
          input: {
            secret: 'secret-of-rotating-client-0002',
          },
        },
      ]

      test.each(cases)('secret: $input.secret', ({
        input,
      }) => {
        const signer = AiRunCallbackSigner.create()

        const actual = signer.createSignatureVerifier(input)

        expect(actual)
          .toBeInstanceOf(ApiClientSignatureVerifier)
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('#generateTimestampSeconds()', () => {
    /*
     * The seconds are floored, so an instant carrying milliseconds answers the second it sits in
     * rather than the next one. A case whose milliseconds are nearly a whole second is what makes
     * that visible — rounding would answer one second later, and the signature would then verify
     * against nothing.
     */
    describe('should answer the epoch second the instant sits in', () => {
      const cases = [
        {
          input: {
            attemptedAt: new Date('2026-09-13T01:01:01.101Z'),
          },
          expected: '1789261261',
        },
        {
          input: {
            attemptedAt: new Date('2026-09-13T02:02:02.999Z'),
          },
          expected: '1789264922',
        },
        {
          input: {
            attemptedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
          expected: '1767225600',
        },
      ]

      test.each(cases)('attemptedAt: $input.attemptedAt', ({
        input,
        expected,
      }) => {
        const signer = AiRunCallbackSigner.create()

        const actual = signer.generateTimestampSeconds(input)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('#generateSignature()', () => {
    /*
     * The first and the third case are one byte apart in the body and share a secret and a
     * timestamp, so a digest that ignored the body would answer the same string twice.
     */
    describe('should answer the hex digest of the signed payload', () => {
      const cases = [
        {
          input: {
            secret: 'secret-of-signing-client-0001',
            rawBody: '{"runKey":"run-key-10010004"}',
            timestampSeconds: '1790157600',
          },
          expected: 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
        },
        {
          input: {
            secret: 'secret-of-rotating-client-0002',
            rawBody: '{"runKey":"run-key-10010003"}',
            timestampSeconds: '1790157601',
          },
          expected: 'ce3bf8dff4e9f13604ee3d0f564f9d47a497724bea96e3bfc20a66e4bbb8e33d',
        },
        {
          input: {
            secret: 'secret-of-signing-client-0001',
            rawBody: '{"runKey":"run-key-10010005"}',
            timestampSeconds: '1790157600',
          },
          expected: 'f859595fe7c05b2501cea621726587c572a581beb7e217d0de7bdb3e52a24499',
        },
        {
          input: {
            secret: 'secret-of-signing-client-0001',
            rawBody: '',
            timestampSeconds: '1790157602',
          },
          expected: '4e62668ce833f69c1df11678b95bde22ad69a20d62e3e9b7aa9d23c2ab9b6805',
        },
        {
          input: {
            secret: 'secret-of-previous-rotation-0003',
            rawBody: '{"runKey":"run-key-10010006"}',
            timestampSeconds: '1790157603',
          },
          expected: '4aebf925929cea786a5430d64df0a7694ae184be3881b4283d8630d2a8afa7b6',
        },
      ]

      test.each(cases)('rawBody: $input.rawBody, timestampSeconds: $input.timestampSeconds', ({
        input,
        expected,
      }) => {
        const signer = AiRunCallbackSigner.create()

        const actual = signer.generateSignature(input)

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * An empty string is a usable HMAC key as far as `node:crypto` is concerned, so nothing but
     * this guard stands between a secret that failed to decrypt and a callback bearing a signature
     * nothing can verify — which looks signed to everything that handles it.
     */
    describe('when the secret cannot key an HMAC', () => {
      const cases = [
        {
          input: {
            secret: '',
            rawBody: '{"runKey":"run-key-10010004"}',
            timestampSeconds: '1790157600',
          },
        },
        {
          input: {
            secret: null,
            rawBody: '{"runKey":"run-key-10010003"}',
            timestampSeconds: '1790157601',
          },
        },
        {
          input: {
            secret: 12345,
            rawBody: '{"runKey":"run-key-10010005"}',
            timestampSeconds: '1790157602',
          },
        },
      ]

      test.each(cases)('secret: $input.secret', ({
        input,
      }) => {
        const signer = AiRunCallbackSigner.create()

        const actual = signer.generateSignature(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('#buildCallbackHeaderHash()', () => {
    /*
     * The four headers, one of which is the run key — the "additionally" of the criterion. The
     * timestamp in the header is the one the digest was computed over, which is why the case
     * states an instant and not a second: a class that read a clock twice would sign one value and
     * send another, and the two literals here would stop agreeing.
     */
    describe('should answer the four headers the callback is posted with', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-signing-10000001',
            secret: 'secret-of-signing-client-0001',
            runKey: 'run-key-10010004',
            rawBody: '{"runKey":"run-key-10010004"}',
            attemptedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
          expected: {
            'x-ort-client-id': 'client-key-signing-10000001',
            'x-ort-timestamp': '1790157600',
            'x-ort-signature': 'faf7cdd737d6605567349f1f2ba060338772e196f6901304c6258940674db19b',
            'x-ort-run-key': 'run-key-10010004',
          },
        },
        {
          input: {
            clientKey: 'client-key-rotating-10000002',
            secret: 'secret-of-rotating-client-0002',
            runKey: 'run-key-10010003',
            rawBody: '{"runKey":"run-key-10010003"}',
            attemptedAt: new Date('2026-09-23T10:00:01.999Z'),
          },
          expected: {
            'x-ort-client-id': 'client-key-rotating-10000002',
            'x-ort-timestamp': '1790157601',
            'x-ort-signature': 'ce3bf8dff4e9f13604ee3d0f564f9d47a497724bea96e3bfc20a66e4bbb8e33d',
            'x-ort-run-key': 'run-key-10010003',
          },
        },
        {
          input: {
            clientKey: 'client-key-signing-10000001',
            secret: 'secret-of-signing-client-0001',
            runKey: 'run-key-10010005',
            rawBody: '',
            attemptedAt: new Date('2026-09-23T10:00:02.500Z'),
          },
          expected: {
            'x-ort-client-id': 'client-key-signing-10000001',
            'x-ort-timestamp': '1790157602',
            'x-ort-signature': '4e62668ce833f69c1df11678b95bde22ad69a20d62e3e9b7aa9d23c2ab9b6805',
            'x-ort-run-key': 'run-key-10010005',
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', ({
        input,
        expected,
      }) => {
        const signer = AiRunCallbackSigner.create()

        const actual = signer.buildCallbackHeaderHash(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('when the secret cannot key an HMAC', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-signing-10000001',
            secret: '',
            runKey: 'run-key-10010004',
            rawBody: '{"runKey":"run-key-10010004"}',
            attemptedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            clientKey: 'client-key-rotating-10000002',
            secret: null,
            runKey: 'run-key-10010003',
            rawBody: '{"runKey":"run-key-10010003"}',
            attemptedAt: new Date('2026-09-23T10:00:01.999Z'),
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', ({
        input,
      }) => {
        const signer = AiRunCallbackSigner.create()

        const actual = signer.buildCallbackHeaderHash(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCallbackSigner', () => {
  describe('#buildCallbackHeaderHash()', () => {
    /*
     * The round trip, and the whole reason this class borrows the verifier rather than computing
     * its own digest: what this signs is what that verifies. Both sides are production classes and
     * nothing is recomputed here.
     */
    describe('should produce a signature the request verifier accepts', () => {
      const cases = [
        {
          input: {
            clientKey: 'client-key-signing-10000001',
            secret: 'secret-of-signing-client-0001',
            runKey: 'run-key-10010004',
            rawBody: '{"runKey":"run-key-10010004","statusName":"succeeded"}',
            attemptedAt: new Date('2026-09-23T10:00:00.000Z'),
          },
        },
        {
          input: {
            clientKey: 'client-key-rotating-10000002',
            secret: 'secret-of-rotating-client-0002',
            runKey: 'run-key-10010006',
            rawBody: '{"runKey":"run-key-10010006","statusName":"canceled"}',
            attemptedAt: new Date('2026-09-23T10:00:01.999Z'),
          },
        },
        {
          input: {
            clientKey: 'client-key-signing-10000001',
            secret: 'secret-of-signing-client-0001',
            runKey: 'run-key-10010005',
            rawBody: '',
            attemptedAt: new Date('2026-09-23T10:00:02.500Z'),
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', ({
        input,
      }) => {
        const signer = AiRunCallbackSigner.create()
        const headerHash = signer.buildCallbackHeaderHash(input)
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: input.secret,
        })

        const actual = verifier.isAcceptableSignature({
          signatureHeaderValue: headerHash['x-ort-signature'],
          timestampHeaderValue: headerHash['x-ort-timestamp'],
          rawBody: input.rawBody,
        })

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * And the same round trip with the body changed after signing, which must not verify. Without
     * this case the one above would pass against a verifier that accepted everything.
     */
    describe('should produce a signature the request verifier refuses for another body', () => {
      const cases = [
        {
          input: {
            signingParams: {
              clientKey: 'client-key-signing-10000001',
              secret: 'secret-of-signing-client-0001',
              runKey: 'run-key-10010004',
              rawBody: '{"runKey":"run-key-10010004","statusName":"succeeded"}',
              attemptedAt: new Date('2026-09-23T10:00:00.000Z'),
            },
            tamperedRawBody: '{"runKey":"run-key-10010004","statusName":"succeeded"} ',
          },
        },
        {
          input: {
            signingParams: {
              clientKey: 'client-key-rotating-10000002',
              secret: 'secret-of-rotating-client-0002',
              runKey: 'run-key-10010006',
              rawBody: '{"runKey":"run-key-10010006","statusName":"canceled"}',
              attemptedAt: new Date('2026-09-23T10:00:01.999Z'),
            },
            tamperedRawBody: '{"runKey":"run-key-10010006","statusName":"succeeded"}',
          },
        },
      ]

      test.each(cases)('tamperedRawBody: $input.tamperedRawBody', ({
        input,
      }) => {
        const signer = AiRunCallbackSigner.create()
        const headerHash = signer.buildCallbackHeaderHash(input.signingParams)
        const verifier = ApiClientSignatureVerifier.create({
          currentSecret: input.signingParams.secret,
        })

        const actual = verifier.isAcceptableSignature({
          signatureHeaderValue: headerHash['x-ort-signature'],
          timestampHeaderValue: headerHash['x-ort-timestamp'],
          rawBody: input.tamperedRawBody,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})
