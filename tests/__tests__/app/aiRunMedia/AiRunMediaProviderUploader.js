import AiRunMediaProviderUploader from '../../../../app/aiRunMedia/AiRunMediaProviderUploader.js'

import ProviderUploadedFileRecorder from '../../../../app/aiRunMedia/ProviderUploadedFileRecorder.js'

/*
 * The members of the provider upload that build and choose, but write nothing.
 *
 * The two that write - handing the files over and recording what left - are in
 * `tests/_orders/AiRunMedia/`, because placement follows what a method does.
 *
 * **What `#buildAttachedFile()` renames is the point of asserting it at all.** A medium's own row
 * id travels as the file's `id`, its path on this machine as `fileUrl` and its type as `fileType`,
 * and nothing carries the caller's `mediaKey` outward. Every case below therefore states a medium
 * whose three values differ from one another, so a member that read the wrong one of them could
 * not pass by coincidence.
 */

describe('AiRunMediaProviderUploader', () => {
  describe('constructor', () => {
    class AlphaProviderUploadedFileRecorder extends ProviderUploadedFileRecorder {}

    describe('should keep property', () => {
      describe('#providerUploadedFileRecorder', () => {
        const cases = [
          {
            input: {
              providerUploadedFileRecorder: ProviderUploadedFileRecorder.create(),
            },
          },
          {
            input: {
              providerUploadedFileRecorder: AlphaProviderUploadedFileRecorder.create(),
            },
          },
        ]

        test.each(cases)('providerUploadedFileRecorder: $input.providerUploadedFileRecorder.constructor.name', ({
          input,
        }) => {
          const uploader = new AiRunMediaProviderUploader(input)

          expect(uploader)
            .toHaveProperty('providerUploadedFileRecorder', input.providerUploadedFileRecorder)
        })
      })
    })
  })
})

describe('AiRunMediaProviderUploader', () => {
  describe('.create()', () => {
    class BetaProviderUploadedFileRecorder extends ProviderUploadedFileRecorder {}

    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRecorder: ProviderUploadedFileRecorder.create(),
          },
        },
        {
          input: {
            providerUploadedFileRecorder: BetaProviderUploadedFileRecorder.create(),
          },
        },
      ]

      test.each(cases)('providerUploadedFileRecorder: $input.providerUploadedFileRecorder.constructor.name', ({
        input,
      }) => {
        const received = AiRunMediaProviderUploader.create(input)

        expect(received)
          .toBeInstanceOf(AiRunMediaProviderUploader)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRecorder: ProviderUploadedFileRecorder.create(),
          },
        },
        {
          input: {
            providerUploadedFileRecorder: BetaProviderUploadedFileRecorder.create(),
          },
        },
      ]

      test.each(cases)('providerUploadedFileRecorder: $input.providerUploadedFileRecorder.constructor.name', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunMediaProviderUploader)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })

    describe('should fill default providerUploadedFileRecorder value', () => {
      test('with no arguments', () => {
        const createProviderUploadedFileRecorderSpy = jest.spyOn(AiRunMediaProviderUploader, 'createProviderUploadedFileRecorder')

        const uploader = AiRunMediaProviderUploader.create()

        expect(uploader.providerUploadedFileRecorder)
          .toBeInstanceOf(ProviderUploadedFileRecorder)
        expect(createProviderUploadedFileRecorderSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunMediaProviderUploader', () => {
  describe('.createProviderUploadedFileRecorder()', () => {
    describe('when called as is', () => {
      test('should be instance of ProviderUploadedFileRecorder', () => {
        const received = AiRunMediaProviderUploader.createProviderUploadedFileRecorder()

        expect(received)
          .toBeInstanceOf(ProviderUploadedFileRecorder)
      })
    })
  })
})

describe('AiRunMediaProviderUploader', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          Ctor: AiRunMediaProviderUploader,
        },
      },
      {
        input: {
          Ctor: class GammaAiRunMediaProviderUploader extends AiRunMediaProviderUploader {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', ({
      input,
    }) => {
      const uploader = input.Ctor.create()

      const received = uploader.Ctor

      expect(received)
        .toBe(input.Ctor) // same reference
    })
  })
})

describe('AiRunMediaProviderUploader', () => {
  describe('#buildAttachedFile()', () => {
    describe('should carry the row id, the path and the type, and nothing of the caller', () => {
      const cases = [
        {
          input: {
            mediumOutcome: {
              aiRunMediaId: 10620201,
              mediaKey: 'media-key-10620201',
              handlingName: 'handle',
              isReadable: true,
              filePath: '/workspace/10620201/alpha.jpg',
              mimeType: 'image/jpeg',
              refusal: null,
            },
          },
          expected: {
            id: 10620201,
            fileUrl: '/workspace/10620201/alpha.jpg',
            fileType: 'image/jpeg',
          },
        },
        {
          input: {
            mediumOutcome: {
              aiRunMediaId: 10620202,
              mediaKey: 'media-key-10620202',
              handlingName: 'handle',
              isReadable: true,
              filePath: '/workspace/10620202/beta.png',
              mimeType: 'image/png',
              refusal: null,
            },
          },
          expected: {
            id: 10620202,
            fileUrl: '/workspace/10620202/beta.png',
            fileType: 'image/png',
          },
        },
      ]

      test.each(cases)('aiRunMediaId: $input.mediumOutcome.aiRunMediaId', ({
        input,
        expected,
      }) => {
        const uploader = AiRunMediaProviderUploader.create()

        const received = uploader.buildAttachedFile(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaProviderUploader', () => {
  describe('#buildAttachedFiles()', () => {
    describe('should build one file per medium, in the order it was handed', () => {
      const cases = [
        {
          input: {
            readableMedia: [
              {
                aiRunMediaId: 10620211,
                mediaKey: 'media-key-10620211',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620211/gamma.jpg',
                mimeType: 'image/jpeg',
                refusal: null,
              },
              {
                aiRunMediaId: 10620212,
                mediaKey: 'media-key-10620212',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620212/delta.webp',
                mimeType: 'image/webp',
                refusal: null,
              },
            ],
          },
          expected: [
            {
              id: 10620211,
              fileUrl: '/workspace/10620211/gamma.jpg',
              fileType: 'image/jpeg',
            },
            {
              id: 10620212,
              fileUrl: '/workspace/10620212/delta.webp',
              fileType: 'image/webp',
            },
          ],
        },
        {
          input: {
            readableMedia: [
              {
                aiRunMediaId: 10620213,
                mediaKey: 'media-key-10620213',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620213/epsilon.png',
                mimeType: 'image/png',
                refusal: null,
              },
            ],
          },
          expected: [
            {
              id: 10620213,
              fileUrl: '/workspace/10620213/epsilon.png',
              fileType: 'image/png',
            },
          ],
        },
      ]

      test.each(cases)('readableMedia[0].aiRunMediaId: $input.readableMedia.0.aiRunMediaId', ({
        input,
        expected,
      }) => {
        const uploader = AiRunMediaProviderUploader.create()

        const received = uploader.buildAttachedFiles(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the run fetched nothing it could read', () => {
      const cases = [
        {
          input: {
            readableMedia: [],
          },
        },
      ]

      test.each(cases)('readableMedia: $input.readableMedia', ({
        input,
      }) => {
        const uploader = AiRunMediaProviderUploader.create()

        const received = uploader.buildAttachedFiles(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunMediaProviderUploader', () => {
  describe('#extractUploadedFiles()', () => {
    describe('should keep only the files the driver named at the provider', () => {
      const cases = [
        {
          input: {
            attachedFiles: [
              {
                id: 10620221,
                fileUrl: '/workspace/10620221/zeta.jpg',
                fileType: 'image/jpeg',
                providerFileName: 'provider-file-10620221',
              },
              {
                id: 10620222,
                fileUrl: '/workspace/10620222/eta.png',
                fileType: 'image/png',
              },
              {
                id: 10620223,
                fileUrl: '/workspace/10620223/theta.webp',
                fileType: 'image/webp',
                providerFileName: 'provider-file-10620223',
              },
            ],
          },
          expected: [
            {
              id: 10620221,
              fileUrl: '/workspace/10620221/zeta.jpg',
              fileType: 'image/jpeg',
              providerFileName: 'provider-file-10620221',
            },
            {
              id: 10620223,
              fileUrl: '/workspace/10620223/theta.webp',
              fileType: 'image/webp',
              providerFileName: 'provider-file-10620223',
            },
          ],
        },
        {
          input: {
            attachedFiles: [
              {
                id: 10620224,
                fileUrl: '/workspace/10620224/iota.jpg',
                fileType: 'image/jpeg',
                providerFileName: 'provider-file-10620224',
              },
            ],
          },
          expected: [
            {
              id: 10620224,
              fileUrl: '/workspace/10620224/iota.jpg',
              fileType: 'image/jpeg',
              providerFileName: 'provider-file-10620224',
            },
          ],
        },
      ]

      test.each(cases)('attachedFiles[0].id: $input.attachedFiles.0.id', ({
        input,
        expected,
      }) => {
        const uploader = AiRunMediaProviderUploader.create()

        const received = uploader.extractUploadedFiles(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the driver named no file at the provider', () => {
      const cases = [
        {
          input: {
            attachedFiles: [
              {
                id: 10620231,
                fileUrl: '/workspace/10620231/kappa.jpg',
                fileType: 'image/jpeg',
              },
              {
                id: 10620232,
                fileUrl: '/workspace/10620232/lambda.png',
                fileType: 'image/png',
              },
            ],
          },
        },
        {
          input: {
            attachedFiles: [
              {
                id: 10620233,
                fileUrl: '/workspace/10620233/mu.webp',
                fileType: 'image/webp',
                providerFileName: '', // Named nothing, which is not a name
              },
            ],
          },
        },
      ]

      test.each(cases)('attachedFiles[0].id: $input.attachedFiles.0.id', ({
        input,
      }) => {
        const uploader = AiRunMediaProviderUploader.create()

        const received = uploader.extractUploadedFiles(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunMediaProviderUploader', () => {
  describe('#hasLeftTheMachine()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            attachedFile: {
              id: 10620241,
              fileUrl: '/workspace/10620241/nu.jpg',
              fileType: 'image/jpeg',
              providerFileName: 'provider-file-10620241',
            },
          },
        },
        {
          input: {
            attachedFile: {
              id: 10620242,
              fileUrl: '/workspace/10620242/xi.png',
              fileType: 'image/png',
              providerFileName: 'provider-file-10620242',
            },
          },
        },
      ]

      test.each(cases)('providerFileName: $input.attachedFile.providerFileName', ({
        input,
      }) => {
        const uploader = AiRunMediaProviderUploader.create()

        const received = uploader.hasLeftTheMachine(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /** @type {Array<{ input: Record<string, *> }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            attachedFile: {
              id: 10620251,
              fileUrl: '/workspace/10620251/omicron.jpg',
              fileType: 'image/jpeg',
              // providerFileName: not answered by the driver
            },
          },
        },
        {
          input: {
            attachedFile: {
              id: 10620252,
              fileUrl: '/workspace/10620252/pi.png',
              fileType: 'image/png',
              providerFileName: null,
            },
          },
        },
        {
          input: {
            attachedFile: {
              id: 10620253,
              fileUrl: '/workspace/10620253/rho.webp',
              fileType: 'image/webp',
              providerFileName: '',
            },
          },
        },
        {
          input: {
            attachedFile: {
              id: 10620254,
              fileUrl: '/workspace/10620254/sigma.jpg',
              fileType: 'image/jpeg',
              providerFileName: 10620254, // A number is not a handle a vendor answered with
            },
          },
        },
        {
          input: {
            // attachedFile: nothing came back for this file at all
          },
        },
      ])

      test.each(cases)('attachedFile.id: $input.attachedFile.id', ({
        input,
      }) => {
        const uploader = AiRunMediaProviderUploader.create()

        const received = uploader.hasLeftTheMachine(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})
