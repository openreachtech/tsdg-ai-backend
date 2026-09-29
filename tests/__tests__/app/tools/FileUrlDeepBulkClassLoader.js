import FileUrlDeepBulkClassLoader from '../../../../app/tools/FileUrlDeepBulkClassLoader.js'

import url from 'node:url'

import {
  DeepBulkClassLoader,
} from '@openreachtech/renchan'

import {
  rootPath,
} from '../../../../app/globals/_.js'

describe('FileUrlDeepBulkClassLoader', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = FileUrlDeepBulkClassLoader.prototype

      expect(received)
        .toBeInstanceOf(DeepBulkClassLoader)
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('.get:url', () => {
    describe('when called as is', () => {
      test('should be the node url module', () => {
        const received = FileUrlDeepBulkClassLoader.url

        expect(received)
          .toBe(url) // same reference
      })
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: FileUrlDeepBulkClassLoader,
      },
      {
        tally: class AlphaFileUrlDeepBulkClassLoader extends FileUrlDeepBulkClassLoader {},
      },
      {
        tally: class BetaFileUrlDeepBulkClassLoader extends FileUrlDeepBulkClassLoader {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const loader = tally.create({
        poolPath: 'pool-path-0001', // Fill the unrelated required argument with a neutral value
      })

      const received = loader.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('#loadFileNames()', () => {
    /*
     * The property the fix exists for: a plain `node` process imports these strings, and its ESM
     * loader refuses anything that is not a URL. An entry that is not a file URL is exactly what
     * earns `ERR_UNSUPPORTED_ESM_URL_SCHEME`, so the assertion is that the returned array holds none
     * of them — at any depth of the pool.
     *
     * Jest cannot assert the import itself: babel rewrites `import()` into a `require()` interop
     * here, which takes a Windows path without complaint.
     *
     * The matcher carries the negation in the pattern — `(?!file://)` matches an entry that is not
     * a file URL — rather than in `expect.not.stringMatching()`. Both say the same thing about the
     * same entry, and the one-level form is the one `jest/no-standalone-expect` recognizes where a
     * matcher belongs, in the case's `expected`.
     */
    describe('should hand back none but file URLs', () => {
      const cases = [
        {
          input: {
            poolPath: rootPath.to('app/tools/'), // holds files of its own and a subdirectory
          },
          expected: expect.stringMatching(/^(?!file:\/\/)/u), // an entry that is not a file URL
        },
        {
          input: {
            poolPath: rootPath.to('app/tools/AiModelProcessor/'), // holds files and no subdirectory
          },
          expected: expect.stringMatching(/^(?!file:\/\/)/u), // an entry that is not a file URL
        },
      ]

      test.each(cases)('poolPath: $input.poolPath', ({
        input,
        expected,
      }) => {
        const loader = FileUrlDeepBulkClassLoader.create(input)

        const received = loader.loadFileNames(input)

        expect(received)
          .not
          .toContainEqual(expected)
      })
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('#loadFileNames()', () => {
    /*
     * The base walk recurses through `this`, so an entry found in a subdirectory passes through the
     * conversion once per level. Converted twice it would read
     * `file:///<project root>/file:/<the path>`, which is not the value expected here — and the two
     * pools differ in how many levels lie between them and the same file.
     */
    describe('should convert a file in a subdirectory exactly once', () => {
      // Not a literal: the project root is the machine's, so the expected URL is built from it.
      const stubProcessorFileUrl = url.pathToFileURL(rootPath.to('app/tools/AiModelProcessor/StubAiModelProcessor.js'))
        .href

      const cases = [
        {
          input: {
            poolPath: rootPath.to('app/tools/'), // one level above the file
          },
          expected: stubProcessorFileUrl,
        },
        {
          input: {
            poolPath: rootPath.to('app/'), // two levels above the same file
          },
          expected: stubProcessorFileUrl,
        },
      ]

      test.each(cases)('poolPath: $input.poolPath', ({
        input,
        expected,
      }) => {
        const loader = FileUrlDeepBulkClassLoader.create(input)

        const received = loader.loadFileNames(input)

        expect(received)
          .toContain(expected)
      })
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('#loadFileNames()', () => {
    describe('should fill default poolPath from the property', () => {
      // Not literals: the project root is the machine's, so the expected URLs are built from it.
      const classLoaderFileUrl = url.pathToFileURL(rootPath.to('app/tools/FileUrlDeepBulkClassLoader.js'))
        .href
      const stubProcessorFileUrl = url.pathToFileURL(rootPath.to('app/tools/AiModelProcessor/StubAiModelProcessor.js'))
        .href

      const cases = [
        {
          input: {
            poolPath: rootPath.to('app/tools/'),
          },
          expected: classLoaderFileUrl,
        },
        {
          input: {
            poolPath: rootPath.to('app/tools/AiModelProcessor/'),
          },
          expected: stubProcessorFileUrl,
        },
      ]

      test.each(cases)('poolPath: $input.poolPath', ({
        input,
        expected,
      }) => {
        const loader = FileUrlDeepBulkClassLoader.create(input)

        const received = loader.loadFileNames()

        expect(received)
          .toContain(expected)
      })
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('#generateFileUrl()', () => {
    describe('should convert the entry to a file URL', () => {
      describe('when the entry is a filesystem path', () => {
        // Not literals: a filesystem path is the machine's, and so is the URL built from it.
        const classLoaderFileUrl = url.pathToFileURL(rootPath.to('app/tools/FileUrlDeepBulkClassLoader.js'))
          .href
        const stubProcessorFileUrl = url.pathToFileURL(rootPath.to('app/tools/AiModelProcessor/StubAiModelProcessor.js'))
          .href

        const cases = [
          {
            input: {
              fileName: rootPath.to('app/tools/FileUrlDeepBulkClassLoader.js'),
            },
            expected: classLoaderFileUrl,
          },
          {
            input: {
              fileName: rootPath.to('app/tools/AiModelProcessor/StubAiModelProcessor.js'),
            },
            expected: stubProcessorFileUrl,
          },
        ]

        test.each(cases)('fileName: $input.fileName', ({
          input,
          expected,
        }) => {
          const loader = FileUrlDeepBulkClassLoader.create({
            poolPath: 'pool-path-0002', // Fill the unrelated required argument with a neutral value
          })

          const received = loader.generateFileUrl(input)

          expect(received)
            .toBe(expected)
        })
      })
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('#generateFileUrl()', () => {
    /*
     * What keeps the base walk's recursion from converting a nested entry a second time.
     */
    describe('should answer the entry as it stands', () => {
      describe('when the entry is already a file URL', () => {
        const cases = [
          {
            tally: {
              fileName: 'file:///D:/pool-0003/AlphaSample.js',
            },
          },
          {
            tally: {
              fileName: 'file:///pool-0004/BetaSample.js',
            },
          },
        ]

        test.each(cases)('fileName: $tally.fileName', ({
          tally,
        }) => {
          const loader = FileUrlDeepBulkClassLoader.create({
            poolPath: 'pool-path-0005', // Fill the unrelated required argument with a neutral value
          })

          const received = loader.generateFileUrl(tally)

          expect(received)
            .toBe(tally.fileName)
        })
      })
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('#isFileUrl()', () => {
    describe('should be truthy', () => {
      describe('when the entry carries the file URL scheme', () => {
        const cases = [
          {
            input: {
              fileName: 'file:///D:/pool-0006/GammaSample.js',
            },
          },
          {
            input: {
              fileName: 'file:///pool-0007/DeltaSample.js',
            },
          },
        ]

        test.each(cases)('fileName: $input.fileName', ({
          input,
        }) => {
          const loader = FileUrlDeepBulkClassLoader.create({
            poolPath: 'pool-path-0008', // Fill the unrelated required argument with a neutral value
          })

          const received = loader.isFileUrl(input)

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('FileUrlDeepBulkClassLoader', () => {
  describe('#isFileUrl()', () => {
    describe('should be falsy', () => {
      describe('when the entry carries no file URL scheme', () => {
        const cases = [
          {
            input: {
              fileName: 'D:\\pool-0009\\EpsilonSample.js', // the Windows path the ESM loader refuses
            },
          },
          {
            input: {
              fileName: '/pool-0010/ZetaSample.js',
            },
          },
          {
            input: {
              fileName: '',
            },
          },
        ]

        test.each(cases)('fileName: $input.fileName', ({
          input,
        }) => {
          const loader = FileUrlDeepBulkClassLoader.create({
            poolPath: 'pool-path-0011', // Fill the unrelated required argument with a neutral value
          })

          const received = loader.isFileUrl(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})
