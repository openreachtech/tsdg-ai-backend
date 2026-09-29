import UploadFileToGeminiCapsule from '../../../../app/geminiClient/UploadFileToGeminiCapsule.js'

/*
 * Every member read off a response shaped the way the vendor documents the Files API's `File`:
 * `name` is the `files/<id>` handle, `uri` is what a request points a file part at, and
 * `expirationTime` / `createTime` are RFC 3339 strings the vendor stated.
 *
 * The absent cases carry the weight here. `expirationTime` is only set where the file is scheduled
 * to expire, and the egress record is written from these values - so a member that quietly answered
 * something instead of nothing would put a date nobody can check in front of the retention job that
 * later asks Google to delete the copy.
 *
 * No case here calls Google.
 */

describe('UploadFileToGeminiCapsule', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#response', () => {
        const cases = [
          {
            tally: {
              name: 'files/upload-0001',
            },
          },
          {
            tally: {
              name: 'files/upload-0002',
            },
          },
          {
            tally: null,
          },
        ]

        test.each(cases)('response.name: $tally.name', ({
          tally,
        }) => {
          const capsule = new UploadFileToGeminiCapsule({
            response: tally,
            error: null, // Fill the unrelated required argument with a neutral value.
          })

          expect(capsule)
            .toHaveProperty('response', tally)
        })
      })

      describe('#error', () => {
        const cases = [
          {
            tally: new Error('upload-failure-0001'),
          },
          {
            tally: new Error('upload-failure-0002'),
          },
          {
            tally: null,
          },
        ]

        test.each(cases)('error.message: $tally.message', ({
          tally,
        }) => {
          const capsule = new UploadFileToGeminiCapsule({
            response: null, // Fill the unrelated required argument with a neutral value.
            error: tally,
          })

          expect(capsule)
            .toHaveProperty('error', tally)
        })
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0002'),
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
      }) => {
        const received = UploadFileToGeminiCapsule.create(input)

        expect(received)
          .toBeInstanceOf(UploadFileToGeminiCapsule)
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0002'),
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(UploadFileToGeminiCapsule)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('.createWithResponse()', () => {
    describe('should call constructor with no error', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
            },
          },
          expected: {
            response: {
              name: 'files/upload-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: {
              name: 'files/upload-0002',
            },
          },
          expected: {
            response: {
              name: 'files/upload-0002',
            },
            error: null,
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(UploadFileToGeminiCapsule)

        SpyClass.createWithResponse(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('.createWithError()', () => {
    describe('should call constructor with no response', () => {
      const cases = [
        {
          input: {
            error: new Error('upload-failure-0001'),
          },
          expected: {
            response: null,
            error: new Error('upload-failure-0001'),
          },
        },
        {
          input: {
            error: new Error('upload-failure-0002'),
          },
          expected: {
            response: null,
            error: new Error('upload-failure-0002'),
          },
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(UploadFileToGeminiCapsule)

        SpyClass.createWithError(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('#hasError()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            response: null,
            error: new Error('upload-failure-0001'),
          },
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0002'),
          },
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

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
              name: 'files/upload-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: {
              name: 'files/upload-0002',
            },
            error: null,
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.hasError()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('#extractErrorMessage()', () => {
    describe('should answer the message the upload raised', () => {
      const cases = [
        {
          input: {
            response: null,
            error: new Error('upload-failure-0001'),
          },
          expected: 'upload-failure-0001',
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0002'),
          },
          expected: 'upload-failure-0002',
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer null where the upload did not raise', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: {
              name: 'files/upload-0002',
            },
            error: null,
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractErrorMessage()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('#extractUploadedFileName()', () => {
    describe('should answer the handle the vendor stated', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
            },
            error: null,
          },
          expected: 'files/upload-0001',
        },
        {
          input: {
            response: {
              name: 'files/upload-0002',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
            },
            error: null,
          },
          expected: 'files/upload-0002',
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
        expected,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileName()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer null where the vendor stated none', () => {
      const cases = [
        {
          input: {
            response: {
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0003',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0004'),
          },
        },
      ]

      test.each(cases)('response.uri: $input.response.uri', ({
        input,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileName()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('#extractUploadedFileUri()', () => {
    describe('should answer the uri the vendor stated', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
            },
            error: null,
          },
          expected: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
        },
        {
          input: {
            response: {
              name: 'files/upload-0002',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
            },
            error: null,
          },
          expected: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
        expected,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileUri()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer null where the vendor stated none', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0003',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0004'),
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileUri()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('#extractUploadedFileMimeType()', () => {
    describe('should answer the mime type the vendor stated', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
              mimeType: 'image/jpeg',
            },
            error: null,
          },
          expected: 'image/jpeg',
        },
        {
          input: {
            response: {
              name: 'files/upload-0002',
              mimeType: 'image/png',
            },
            error: null,
          },
          expected: 'image/png',
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
        expected,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileMimeType()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer null where the vendor stated none', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0003',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0004'),
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileMimeType()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('#extractUploadedFileExpirationTime()', () => {
    describe('should answer the expiry the vendor stated', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
              expirationTime: '2026-10-01T01:02:03.004Z',
            },
            error: null,
          },
          expected: '2026-10-01T01:02:03.004Z',
        },
        {
          input: {
            response: {
              name: 'files/upload-0002',
              expirationTime: '2026-10-02T05:06:07.008Z',
            },
            error: null,
          },
          expected: '2026-10-02T05:06:07.008Z',
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
        expected,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileExpirationTime()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer null where the file is not scheduled to expire', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0003',
              createTime: '2026-09-28T01:02:03.004Z',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0004'),
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileExpirationTime()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('UploadFileToGeminiCapsule', () => {
  describe('#extractUploadedFileCreateTime()', () => {
    describe('should answer the instant the vendor stated', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0001',
              createTime: '2026-09-28T01:02:03.004Z',
            },
            error: null,
          },
          expected: '2026-09-28T01:02:03.004Z',
        },
        {
          input: {
            response: {
              name: 'files/upload-0002',
              createTime: '2026-09-28T05:06:07.008Z',
            },
            error: null,
          },
          expected: '2026-09-28T05:06:07.008Z',
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
        expected,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileCreateTime()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer null where the vendor stated none', () => {
      const cases = [
        {
          input: {
            response: {
              name: 'files/upload-0003',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('upload-failure-0004'),
          },
        },
      ]

      test.each(cases)('response.name: $input.response.name', ({
        input,
      }) => {
        const capsule = UploadFileToGeminiCapsule.create(input)

        const received = capsule.extractUploadedFileCreateTime()

        expect(received)
          .toBeNull()
      })
    })
  })
})
