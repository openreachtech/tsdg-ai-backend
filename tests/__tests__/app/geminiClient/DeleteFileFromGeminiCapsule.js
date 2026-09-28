import DeleteFileFromGeminiCapsule from '../../../../app/geminiClient/DeleteFileFromGeminiCapsule.js'

/*
 * What the Files API answered when this service asked it to delete one file (specs/1.0.0,
 * #retention).
 *
 * `#isFileGone()` is the member the whole of the third purge rests on: it is what decides whether
 * `provider_uploaded_files.provider_purged_at` may be written, and a stamp saying a copy of
 * somebody's personal data was deleted must never be written on a failure this service could not
 * read. So the statuses are enumerated rather than sampled - the ones a vendor plausibly answers to
 * a delete are a small, memorizable set - and 403 in particular is asserted false, because a key
 * that stopped working would otherwise stamp every row of every batch in a single night.
 *
 * A failure is written as a plain object carrying `message` and `status`, which are the two fields
 * `@google/genai`'s `ApiError` declares and the only two this class reads. The vendor's own class
 * is not constructed here: it would add an import of the SDK to a test of a class that must work
 * without one.
 */

describe('DeleteFileFromGeminiCapsule', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#response', () => {
        const cases = [
          {
            input: {
              response: {
                sdkHttpResponse: 'sdk-http-response-0001',
              },
            },
            expected: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
          },
          {
            input: {
              response: {
                sdkHttpResponse: 'sdk-http-response-0002',
              },
            },
            expected: {
              sdkHttpResponse: 'sdk-http-response-0002',
            },
          },
          {
            input: {
              response: null,
            },
            expected: null,
          },
        ]

        test.each(cases)('sdkHttpResponse: $input.response.sdkHttpResponse', ({
          input,
          expected,
        }) => {
          const args = {
            response: input.response,
            error: null, // Fill the unrelated required argument with a neutral value
          }

          const capsule = new DeleteFileFromGeminiCapsule(args)

          expect(capsule)
            .toHaveProperty('response', expected)
        })
      })

      describe('#error', () => {
        const cases = [
          {
            input: {
              error: {
                message: 'delete-failure-0001',
                status: 404,
              },
            },
            expected: {
              message: 'delete-failure-0001',
              status: 404,
            },
          },
          {
            input: {
              error: {
                message: 'delete-failure-0002',
                status: 503,
              },
            },
            expected: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
          {
            input: {
              error: null,
            },
            expected: null,
          },
        ]

        test.each(cases)('error.message: $input.error.message', ({
          input,
          expected,
        }) => {
          const args = {
            response: null, // Fill the unrelated required argument with a neutral value
            error: input.error,
          }

          const capsule = new DeleteFileFromGeminiCapsule(args)

          expect(capsule)
            .toHaveProperty('error', expected)
        })
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
      }) => {
        const received = DeleteFileFromGeminiCapsule.create(input)

        expect(received)
          .toBeInstanceOf(DeleteFileFromGeminiCapsule)
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
            error: null,
          },
          expected: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
          expected: {
            response: null,
            error: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(DeleteFileFromGeminiCapsule)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('.createWithResponse()', () => {
    describe('should call constructor with no failure beside it', () => {
      const cases = [
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
          },
          expected: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0002',
            },
          },
          expected: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0002',
            },
            error: null,
          },
        },
      ]

      test.each(cases)('sdkHttpResponse: $input.response.sdkHttpResponse', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(DeleteFileFromGeminiCapsule)

        SpyClass.createWithResponse(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('.createWithError()', () => {
    describe('should call constructor with no response beside it', () => {
      const cases = [
        {
          input: {
            error: {
              message: 'delete-failure-0001',
              status: 404,
            },
          },
          expected: {
            response: null,
            error: {
              message: 'delete-failure-0001',
              status: 404,
            },
          },
        },
        {
          input: {
            error: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
          expected: {
            response: null,
            error: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(DeleteFileFromGeminiCapsule)

        SpyClass.createWithError(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('.get:goneFileHttpStatus', () => {
    describe('when called as is', () => {
      /*
       * The one number a stamp turns on. It is pinned as a literal so that widening it - to 403,
       * say, which a vendor answers both for a file that is not yours and for a key that is not
       * valid - is a change somebody made on purpose and shows up as a failing line.
       */
      test('should be fixed value', () => {
        const received = DeleteFileFromGeminiCapsule.goneFileHttpStatus

        expect(received)
          .toBe(404)
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#get:Ctor', () => {
    describe('should be the class the capsule was built from', () => {
      const cases = [
        {
          input: {
            Ctor: DeleteFileFromGeminiCapsule,
          },
        },
        {
          input: {
            Ctor: class DerivedDeleteFileFromGeminiCapsule extends DeleteFileFromGeminiCapsule {},
          },
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
      }) => {
        const args = {
          response: {
            sdkHttpResponse: 'sdk-http-response-0001',
          },
        }
        const capsule = input.Ctor.createWithResponse(args)

        const received = capsule.Ctor

        expect(received)
          .toBe(input.Ctor) // same reference
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#hasError()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            error: {
              message: 'delete-failure-0001',
              status: 404,
            },
          },
        },
        {
          input: {
            error: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
      }) => {
        const capsule = DeleteFileFromGeminiCapsule.createWithError(input)

        const received = capsule.hasError()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
          },
        },
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0002',
            },
          },
        },
      ]

      test.each(cases)('sdkHttpResponse: $input.response.sdkHttpResponse', ({
        input,
      }) => {
        const capsule = DeleteFileFromGeminiCapsule.createWithResponse(input)

        const received = capsule.hasError()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#isFileGone()', () => {
    /*
     * The vendor carried the delete out. Three responses rather than one, so an implementation
     * reading something off the response rather than off the absence of a failure would be caught -
     * including the empty one, which is what `DeleteFileResponse` is when the raw HTTP response is
     * not retained.
     */
    describe('when the vendor answered', () => {
      describe('should be truthy', () => {
        const cases = [
          {
            input: {
              response: {
                sdkHttpResponse: 'sdk-http-response-0001',
              },
            },
          },
          {
            input: {
              response: {
                sdkHttpResponse: 'sdk-http-response-0002',
              },
            },
          },
          {
            input: {
              response: {}, // The vendor response with the raw HTTP response not retained
            },
          },
        ]

        test.each(cases)('sdkHttpResponse: $input.response.sdkHttpResponse', ({
          input,
        }) => {
          const capsule = DeleteFileFromGeminiCapsule.createWithResponse(input)

          const received = capsule.isFileGone()

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#isFileGone()', () => {
    /*
     * The vendor says it knows no such handle. This is the ordinary answer for a file whose stated
     * expiry has passed, because the vendor drops its own copy on its own clock and this service
     * learns of it only by asking - and it means the copy is gone, which is what the stamp records.
     */
    describe('when the vendor holds no such file', () => {
      describe('should be truthy', () => {
        const cases = [
          {
            input: {
              error: {
                message: 'delete-failure-0001',
                status: 404,
              },
            },
          },
          {
            input: {
              error: {
                message: 'delete-failure-0002',
                status: 404,
              },
            },
          },
        ]

        test.each(cases)('error.message: $input.error.message', ({
          input,
        }) => {
          const capsule = DeleteFileFromGeminiCapsule.createWithError(input)

          const received = capsule.isFileGone()

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#isFileGone()', () => {
    /*
     * Every other failure. The copy may well be gone in some of these - a 500 can follow a delete
     * that landed - and it is still false, because an answer this service cannot tell apart from an
     * unreachable vendor is not an answer it may stamp. 403 is the one to read twice: a vendor
     * answers it both for a file that is not yours and for a key that is not valid, and treating it
     * as "gone" would write the whole table's worth of stamps on the night a key expired.
     *
     * The last case is a failure that never reached the vendor at all - a socket that did not open
     * - which carries no HTTP status to read.
     */
    describe('when the vendor could not be reached', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              error: {
                message: 'delete-failure-0003',
                status: 400,
              },
            },
          },
          {
            input: {
              error: {
                message: 'delete-failure-0004',
                status: 401,
              },
            },
          },
          {
            input: {
              error: {
                message: 'delete-failure-0005',
                status: 403,
              },
            },
          },
          {
            input: {
              error: {
                message: 'delete-failure-0006',
                status: 429,
              },
            },
          },
          {
            input: {
              error: {
                message: 'delete-failure-0007',
                status: 500,
              },
            },
          },
          {
            input: {
              error: {
                message: 'delete-failure-0008',
                status: 503,
              },
            },
          },
          {
            input: {
              error: {
                message: 'delete-failure-0009', // A failure that never reached the vendor
              },
            },
          },
        ]

        test.each(cases)('error.message: $input.error.message', ({
          input,
        }) => {
          const capsule = DeleteFileFromGeminiCapsule.createWithError(input)

          const received = capsule.isFileGone()

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#extractErrorHttpStatus()', () => {
    describe('when the delete raised', () => {
      const cases = [
        {
          input: {
            error: {
              message: 'delete-failure-0001',
              status: 404,
            },
          },
          expected: 404,
        },
        {
          input: {
            error: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
          expected: 503,
        },
        {
          input: {
            error: {
              message: 'delete-failure-0003', // A failure that never reached the vendor
            },
          },
          expected: null,
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const capsule = DeleteFileFromGeminiCapsule.createWithError(input)

        const received = capsule.extractErrorHttpStatus()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#extractErrorHttpStatus()', () => {
    describe('when the delete did not raise', () => {
      const cases = [
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
          },
        },
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0002',
            },
          },
        },
      ]

      test.each(cases)('sdkHttpResponse: $input.response.sdkHttpResponse', ({
        input,
      }) => {
        const capsule = DeleteFileFromGeminiCapsule.createWithResponse(input)

        const received = capsule.extractErrorHttpStatus()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#extractErrorMessage()', () => {
    describe('when the delete raised', () => {
      const cases = [
        {
          input: {
            error: {
              message: 'delete-failure-0001',
              status: 404,
            },
          },
          expected: 'delete-failure-0001',
        },
        {
          input: {
            error: {
              message: 'delete-failure-0002',
              status: 503,
            },
          },
          expected: 'delete-failure-0002',
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const capsule = DeleteFileFromGeminiCapsule.createWithError(input)

        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('DeleteFileFromGeminiCapsule', () => {
  describe('#extractErrorMessage()', () => {
    describe('when the delete did not raise', () => {
      const cases = [
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0001',
            },
          },
        },
        {
          input: {
            response: {
              sdkHttpResponse: 'sdk-http-response-0002',
            },
          },
        },
      ]

      test.each(cases)('sdkHttpResponse: $input.response.sdkHttpResponse', ({
        input,
      }) => {
        const capsule = DeleteFileFromGeminiCapsule.createWithResponse(input)

        const received = capsule.extractErrorMessage()

        expect(received)
          .toBeNull()
      })
    })
  })
})
