import RequestBodyDigester from '../../../../app/aiRun/RequestBodyDigester.js'

import crypto from 'node:crypto'

describe('RequestBodyDigester', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#hashAlgorithm', () => {
        const cases = [
          {
            tally: 'sha256',
          },
          {
            tally: 'sha512',
          },
          {
            tally: 'sha1',
          },
        ]

        test.each(cases)('hashAlgorithm: $tally', ({
          tally,
        }) => {
          const digester = new RequestBodyDigester({
            hashAlgorithm: tally,
          })

          expect(digester)
            .toHaveProperty('hashAlgorithm', tally)
        })
      })
    })
  })
})

describe('RequestBodyDigester', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            hashAlgorithm: 'sha256',
          },
        },
        {
          input: {
            hashAlgorithm: 'sha512',
          },
        },
      ]

      test.each(cases)('hashAlgorithm: $input.hashAlgorithm', ({
        input,
      }) => {
        const received = RequestBodyDigester.create(input)

        expect(received)
          .toBeInstanceOf(RequestBodyDigester)
      })
    })
  })
})

describe('RequestBodyDigester', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            hashAlgorithm: 'sha384',
          },
        },
        {
          tally: {
            hashAlgorithm: 'sha512',
          },
        },
      ]

      test.each(cases)('hashAlgorithm: $tally.hashAlgorithm', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(RequestBodyDigester)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('RequestBodyDigester', () => {
  describe('.create()', () => {
    describe('should fill default hashAlgorithm', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(RequestBodyDigester)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith({
            hashAlgorithm: 'sha256',
          })
      })
    })
  })
})

describe('RequestBodyDigester', () => {
  describe('.get:crypto', () => {
    describe('when called as is', () => {
      test('should be the node crypto module', () => {
        const received = RequestBodyDigester.crypto

        expect(received)
          .toBe(crypto) // same reference
      })
    })
  })
})

describe('RequestBodyDigester', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: RequestBodyDigester,
      },
      {
        tally: class AlphaRequestBodyDigester extends RequestBodyDigester {},
      },
      {
        tally: class BetaRequestBodyDigester extends RequestBodyDigester {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const digester = tally.create()

      const received = digester.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('RequestBodyDigester', () => {
  describe('#digestRequestBody()', () => {
    /*
     * Every digest below was derived offline as the hex digest of the body's UTF-8 bytes under the
     * algorithm the outer case names — `printf '%s' <rawBody> | openssl dgst -<hashAlgorithm>`.
     *
     * The second body is the first one re-spaced. Both parse to the same object and differ only in
     * bytes, so a pair of digests that came out equal would be the sign that something re-serialized
     * the body instead of digesting it as it arrived. The third carries a multibyte character, which
     * a digest taken over anything but the raw UTF-8 bytes would read differently.
     */
    describe('should digest the raw bytes as they arrived', () => {
      const cases = [
        {
          input: {
            hashAlgorithm: 'sha256',
          },
          rawBodyCases: [
            {
              rawBody: '{"rate":"1.5"}',
              expected: 'e885ef23e48554e0112e8650898e9065ff4e975b6f064e9006a847edaeae9519',
            },
            {
              rawBody: '{ "rate": "1.5" }',
              expected: 'e6f9a3c47958318756d4831a7992c51391aaf2c37d9eded7aa420dc4d072852e',
            },
            {
              rawBody: '{"note":"café"}',
              expected: 'a84c174531ab46d58aaeb9c85aed22981d418f25bead412cd282e97f427a0ba1',
            },
          ],
        },
        {
          input: {
            hashAlgorithm: 'sha512',
          },
          rawBodyCases: [
            {
              rawBody: '{"rate":"1.5"}',
              expected: 'cf8b497883080c0cb177d1e87b6f6a562c9050a4ea18e9b22b550ea76ac385457855a8009b76484e7137c2a848410f6d6a3d6fbaf623626a124de04bfe406326',
            },
            {
              rawBody: '{ "rate": "1.5" }',
              expected: '14d0cbcdaaba87b29e2f995ce92631640c6bc4302654028089d37d048867a0d9e292b57606e51dab2ba7c8458833e15fcbea97b61cd632e6622a48db59502265',
            },
            {
              rawBody: '{"note":"café"}',
              expected: '733562c7d3f3b82573bf049ea85ec22832b170d51abf94f61cfde8632d68f01d126eab98de6e5f565358506961b05cf252c7d33fa86f0bc83b03333c71de3c3b',
            },
          ],
        },
      ]

      describe.each(cases)('hashAlgorithm: $input.hashAlgorithm', ({
        input,
        rawBodyCases,
      }) => {
        const digester = RequestBodyDigester.create(input)

        test.each(rawBodyCases)('rawBody: $rawBody', ({
          rawBody,
          expected,
        }) => {
          const args = {
            rawBody,
          }

          const received = digester.digestRequestBody(args)

          expect(received)
            .toBe(expected)
        })
      })
    })
  })
})

describe('RequestBodyDigester', () => {
  describe('#digestRequestBody()', () => {
    /*
     * An empty body is a body: the engine parsed one and set `rawBody` to the empty string, so it
     * digests the way any other body does. This is the digest of the empty input, which tells a
     * refusal apart from a body that happened to hold nothing.
     */
    describe('when the body is an empty string', () => {
      const cases = [
        {
          input: {
            hashAlgorithm: 'sha256',
            rawBody: '',
          },
          expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          input: {
            hashAlgorithm: 'sha512',
            rawBody: '',
          },
          expected: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
        },
      ]

      test.each(cases)('hashAlgorithm: $input.hashAlgorithm', ({
        input,
        expected,
      }) => {
        const createArgs = {
          hashAlgorithm: input.hashAlgorithm,
        }
        const digestRequestBodyArgs = {
          rawBody: input.rawBody,
        }

        const digester = RequestBodyDigester.create(createArgs)

        const received = digester.digestRequestBody(digestRequestBodyArgs)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('RequestBodyDigester', () => {
  describe('#digestRequestBody()', () => {
    /*
     * A request the engine parsed no body for carries no `rawBody` at all, and nothing that is not
     * a string is a body this class can digest. Each answers null — never a digest of some text the
     * value was coerced into, and never the digest of the empty string, which would read as a body
     * that held nothing.
     */
    describe('when the body is not a string', () => {
      /** @type {Array<{ input: { rawBody: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            rawBody: undefined, // a request the engine parsed no body for
          },
        },
        {
          input: {
            rawBody: null,
          },
        },
        {
          input: {
            rawBody: 100001,
          },
        },
        {
          input: {
            rawBody: true,
          },
        },
        {
          input: {
            rawBody: { // the parsed body, in place of the raw one
              rate: '1.5',
            },
          },
        },
        {
          input: {
            rawBody: Buffer.from('{"rate":"1.5"}'), // the bytes, before the engine made text of them
          },
        },
        {
          input: {
            rawBody: [
              '{"rate":"1.5"}',
            ],
          },
        },
      ])

      test.each(cases)('rawBody: $input.rawBody', ({
        input,
      }) => {
        const digester = RequestBodyDigester.create()

        const received = digester.digestRequestBody(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
