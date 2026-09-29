import AiRunCallbackUrlInspector from '../../../../app/aiRunCallback/AiRunCallbackUrlInspector.js'

/*
 * The second acceptance criterion of section 12: "a callback URL that does not match the client's
 * registered prefix is not called at all".
 *
 * The prefixes are the ones `20260923100003-000001-api_clients.cjs` registers for the development
 * clients, under the reserved `.invalid` domain — so a URL that were somehow posted in development
 * reaches nothing. No row is read here: the check is a comparison of two texts the caller hands
 * over, and reading them out of the database would test the read rather than the comparison.
 */

describe('AiRunCallbackUrlInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#normalizedCallbackUrlPrefix', () => {
        const cases = [
          {
            input: {
              normalizedCallbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            },
            expected: 'https://signing.client.development.invalid/callbacks/',
          },
          {
            input: {
              normalizedCallbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
            },
            expected: 'https://rotating.client.development.invalid/callbacks/',
          },
          {
            input: {
              normalizedCallbackUrlPrefix: null,
            },
            expected: null,
          },
        ]

        test.each(cases)('normalizedCallbackUrlPrefix: $input.normalizedCallbackUrlPrefix', ({
          input,
          expected,
        }) => {
          const inspector = new AiRunCallbackUrlInspector(input)

          expect(inspector)
            .toHaveProperty('normalizedCallbackUrlPrefix', expected)
        })
      })
    })
  })
})

describe('AiRunCallbackUrlInspector', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
          },
        },
        {
          input: {
            callbackUrlPrefix: 'https://switched-off.client.development.invalid/callbacks/',
          },
        },
      ]

      test.each(cases)('callbackUrlPrefix: $input.callbackUrlPrefix', ({
        input,
      }) => {
        const actual = AiRunCallbackUrlInspector.create(input)

        expect(actual)
          .toBeInstanceOf(AiRunCallbackUrlInspector)
      })
    })
  })
})

describe('AiRunCallbackUrlInspector', () => {
  describe('.create()', () => {
    /*
     * The factory normalizes the prefix before handing it over, so the constructor is called with
     * the transformed value rather than with the text that arrived. A prefix written in mixed case
     * and with no trailing path is the case where the two differ visibly.
     */
    describe('should call constructor with the normalized prefix', () => {
      const cases = [
        {
          input: {
            callbackUrlPrefix: 'HTTPS://Signing.Client.Development.Invalid/callbacks/',
          },
          expected: {
            normalizedCallbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
          },
        },
        {
          input: {
            callbackUrlPrefix: 'https://rotating.client.development.invalid',
          },
          expected: {
            normalizedCallbackUrlPrefix: 'https://rotating.client.development.invalid/',
          },
        },
        {
          input: {
            callbackUrlPrefix: 'not a url at all',
          },
          expected: {
            normalizedCallbackUrlPrefix: null,
          },
        },
      ]

      test.each(cases)('callbackUrlPrefix: $input.callbackUrlPrefix', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCallbackUrlInspector)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunCallbackUrlInspector', () => {
  describe('.get:UrlCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunCallbackUrlInspector.UrlCtor

        expect(actual)
          .toBe(URL) // same reference
      })
    })
  })
})

describe('AiRunCallbackUrlInspector', () => {
  describe('.buildParsedUrl()', () => {
    describe('when the text is a URL', () => {
      const cases = [
        {
          input: {
            url: 'https://signing.client.development.invalid/callbacks/10010004',
          },
          expected: 'https://signing.client.development.invalid/callbacks/10010004',
        },
        {
          input: {
            url: 'http://localhost:3000/hooks',
          },
          expected: 'http://localhost:3000/hooks',
        },
      ]

      test.each(cases)('url: $input.url', ({
        input,
        expected,
      }) => {
        const actual = AiRunCallbackUrlInspector.buildParsedUrl(input)

        expect(actual.href)
          .toBe(expected)
      })
    })

    describe('when the text is no URL', () => {
      const cases = [
        {
          input: {
            url: '/callbacks/10010004',
          },
        },
        {
          input: {
            url: '',
          },
        },
      ]

      test.each(cases)('url: $input.url', ({
        input,
      }) => {
        const actual = AiRunCallbackUrlInspector.buildParsedUrl(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCallbackUrlInspector', () => {
  describe('.generateNormalizedUrl()', () => {
    /*
     * Normalizing is the whole of what makes the comparison meaningful, so every case here is one
     * where the normalized form differs from the text that arrived: a scheme and host in the wrong
     * case, a missing path, and the traversal segments that are the reason a raw text comparison
     * would be unsafe.
     */
    describe('when the value names a URL this service may post over', () => {
      const cases = [
        {
          input: {
            url: 'HTTPS://Signing.Client.Development.Invalid/callbacks/',
          },
          expected: 'https://signing.client.development.invalid/callbacks/',
        },
        {
          input: {
            url: 'https://signing.client.development.invalid',
          },
          expected: 'https://signing.client.development.invalid/',
        },
        {
          input: {
            url: 'https://signing.client.development.invalid/callbacks/../../elsewhere',
          },
          expected: 'https://signing.client.development.invalid/elsewhere',
        },
        {
          input: {
            url: 'http://localhost:3000/hooks/10010004',
          },
          expected: 'http://localhost:3000/hooks/10010004',
        },
      ]

      test.each(cases)('url: $input.url', ({
        input,
        expected,
      }) => {
        const actual = AiRunCallbackUrlInspector.generateNormalizedUrl(input)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('when the value names none this service may post over', () => {
      const cases = [
        {
          // a scheme that reads this machine's own disk
          input: {
            url: 'file:///etc/passwd',
          },
        },
        {
          // a scheme carrying its bytes inside the URL
          input: {
            url: 'data:text/plain,hello',
          },
        },
        {
          input: {
            url: 'not a url at all',
          },
        },
        {
          input: {
            url: '',
          },
        },
        {
          input: {
            url: null,
          },
        },
        {
          input: {
            url: 12345,
          },
        },
      ]

      test.each(cases)('url: $input.url', ({
        input,
      }) => {
        const actual = AiRunCallbackUrlInspector.generateNormalizedUrl(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCallbackUrlInspector', () => {
  describe('#get:Ctor', () => {
    describe('should answer own constructor', () => {
      const cases = [
        {
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
          },
        },
        {
          input: {
            callbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
          },
        },
      ]

      test.each(cases)('callbackUrlPrefix: $input.callbackUrlPrefix', ({
        input,
      }) => {
        const inspector = AiRunCallbackUrlInspector.create(input)

        const actual = inspector.Ctor

        expect(actual)
          .toBe(AiRunCallbackUrlInspector) // same reference
      })
    })
  })
})

describe('AiRunCallbackUrlInspector', () => {
  describe('#isDeliverableCallbackUrl()', () => {
    /*
     * A URL under the prefix the client registered. These are the ones the terminal callback is
     * actually posted to, and the run keys are the development seeder's own.
     */
    describe('when the URL sits under the registered prefix', () => {
      const cases = [
        {
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
        },
        {
          // the prefix itself, with nothing after it
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/',
          },
        },
        {
          input: {
            callbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003?attempt=2',
          },
        },
        {
          // the host's case is not the client's to get right twice
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'HTTPS://Signing.Client.Development.Invalid/callbacks/10010001',
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.callbackUrl', ({
        input,
      }) => {
        const inspector = AiRunCallbackUrlInspector.create({
          callbackUrlPrefix: input.callbackUrlPrefix,
        })

        const actual = inspector.isDeliverableCallbackUrl({
          callbackUrl: input.callbackUrl,
        })

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * The refusals, and each is a different way of not matching.
     *
     * The traversal case is the one a raw `startsWith` on the text would have let through: the
     * text does start with the prefix, and the request would have been sent somewhere else
     * entirely.
     *
     * The `.invalid` sibling host is the other classic — a host whose name opens with the
     * registered one and continues into somebody else's domain.
     */
    describe('when the URL does not sit under the registered prefix', () => {
      const cases = [
        {
          // walks out of the registered path after starting inside it
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/../../elsewhere',
          },
        },
        {
          // another client's registered prefix
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
          },
        },
        {
          // a host whose name opens with the registered one
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'https://signing.client.development.invalid.elsewhere.invalid/callbacks/1',
          },
        },
        {
          // credentials written before the host, which is not the host
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'https://signing.client.development.invalid@elsewhere.invalid/callbacks/1',
          },
        },
        {
          // the registered host over plaintext, which the registered scheme does not cover
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'http://signing.client.development.invalid/callbacks/10010004',
          },
        },
        {
          // a path above the registered one
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'https://signing.client.development.invalid/admin',
          },
        },
        {
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: 'not a url at all',
          },
        },
        {
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            callbackUrl: null,
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.callbackUrl', ({
        input,
      }) => {
        const inspector = AiRunCallbackUrlInspector.create({
          callbackUrlPrefix: input.callbackUrlPrefix,
        })

        const actual = inspector.isDeliverableCallbackUrl({
          callbackUrl: input.callbackUrl,
        })

        expect(actual)
          .toBeFalsy()
      })
    })

    /*
     * A prefix that cannot be normalized refuses every URL, including one that looks perfectly
     * ordinary. This is the direction the check must never fail in: an empty prefix compared as
     * text would have matched everything in existence.
     */
    describe('when the registered prefix is not a usable one', () => {
      const cases = [
        {
          input: {
            callbackUrlPrefix: '',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
        },
        {
          input: {
            callbackUrlPrefix: '/callbacks/',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
        },
        {
          input: {
            callbackUrlPrefix: null,
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          },
        },
      ]

      test.each(cases)('callbackUrlPrefix: $input.callbackUrlPrefix', ({
        input,
      }) => {
        const inspector = AiRunCallbackUrlInspector.create({
          callbackUrlPrefix: input.callbackUrlPrefix,
        })

        const actual = inspector.isDeliverableCallbackUrl({
          callbackUrl: input.callbackUrl,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})
