import AiRunMediaProviderUploader from '../../../app/aiRunMedia/AiRunMediaProviderUploader.js'

import ProviderUploadedFileRecorder from '../../../app/aiRunMedia/ProviderUploadedFileRecorder.js'
import StubAiModelProcessor from '../../../app/tools/AiModelProcessor/StubAiModelProcessor.js'

import AiRun from '../../../sequelize/models/AiRun.js'
import AiRunMedia from '../../../sequelize/models/AiRunMedia.js'

/*
 * The third acceptance criterion of section 18 - "every file handed to a provider is recorded, with
 * which provider received it and when" - in the class that does the handing over.
 *
 * **An egress row is written for a file the driver says it uploaded, and for no other.** That is
 * the behaviour with two sides, and both are here: a driver that answers with a `providerFileName`
 * leaves a row per file, and one that answers with the files untouched leaves none. The second is
 * not an omission in the record - no file left the machine, so the table saying which files left
 * has nothing to say - and a case asserting the recorder was never reached is what holds it.
 *
 * **The driver that uploads is reached by a spy, because this installation has none.**
 * `StubAiModelProcessor` is the only driver seeded, and it inherits the default that hands the
 * files back untouched; no vendor in this repository uploads ahead of the request. So the uploading
 * branch is steered by spying that one member on the real processor, and every other part of the
 * path - the files built from the media, the recorder, the rows - runs for real.
 *
 * Every run and every medium below is created by this file, in `#asset-media-extraction`'s `1062`
 * sub-block, and none is borrowed: hanging an egress row off a seeded medium would put this file's
 * rows among the fixtures a later reader asks about. The `1062039x` media are ids nothing ever
 * creates, held apart from the `1062031x` rows so that a medium which must stay absent is never
 * mistaken for one meant to be written. The runs are accepted on 2026-10-12, clear of the
 * 2026-09-10 day the rate-limit tests count runs inside.
 */

describe('AiRunMediaProviderUploader', () => {
  describe('#saveProviderUploadedFiles()', () => {
    describe('should record every file the driver says left', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10620301,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10620301',
              requestKey: 'request-key-10620301',
              requestBodyHash: 'request-body-hash-10620301',
              externalRef: 'external-ref-10620301',
              subjectLabel: 'Subject label of run 10620301',
              correlationId: 'correlation-id-10620301',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10620301',
              acceptedAt: new Date('2026-10-12T11:01:01.001Z'),
            },
            aiRunMediaRows: [
              {
                id: 10620311,
                AiRunId: 10620301,
                mediaKey: 'media-key-10620311',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/jpeg',
                byteSize: 131101,
                isReadable: true,
                fetchedAt: new Date('2026-10-12T11:01:02.002Z'),
              },
              {
                id: 10620312,
                AiRunId: 10620301,
                mediaKey: 'media-key-10620312',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/png',
                byteSize: 131202,
                isReadable: true,
                fetchedAt: new Date('2026-10-12T11:01:03.003Z'),
              },
            ],
            attachedFiles: [
              {
                id: 10620311,
                fileUrl: '/workspace/10620301/media-10620311.jpg',
                fileType: 'image/jpeg',
                providerFileName: 'provider-file-10620311',
              },
              {
                id: 10620312,
                fileUrl: '/workspace/10620301/media-10620312.png',
                fileType: 'image/png',
                providerFileName: 'provider-file-10620312',
              },
            ],
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
            uploadedAt: new Date('2026-10-12T11:01:04.004Z'),
          },
          expected: [
            expect.objectContaining({
              AiRunMediaId: 10620311,
              AiProviderId: 10100001,
              providerFileName: 'provider-file-10620311',
              uploadedAt: new Date('2026-10-12T11:01:04.004Z'),
              expiresAt: null,
            }),
            expect.objectContaining({
              AiRunMediaId: 10620312,
              AiProviderId: 10100001,
              providerFileName: 'provider-file-10620312',
              uploadedAt: new Date('2026-10-12T11:01:04.004Z'),
              expiresAt: null,
            }),
          ],
        },
        {
          input: {
            aiRunRow: {
              id: 10620302,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10620302',
              requestKey: 'request-key-10620302',
              requestBodyHash: 'request-body-hash-10620302',
              externalRef: 'external-ref-10620302',
              subjectLabel: 'Subject label of run 10620302',
              correlationId: 'correlation-id-10620302',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10620302',
              acceptedAt: new Date('2026-10-12T12:02:01.001Z'),
            },
            aiRunMediaRows: [
              {
                id: 10620313,
                AiRunId: 10620302,
                mediaKey: 'media-key-10620313',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/webp',
                byteSize: 131303,
                isReadable: true,
                fetchedAt: new Date('2026-10-12T12:02:02.002Z'),
              },
              {
                id: 10620314,
                AiRunId: 10620302,
                mediaKey: 'media-key-10620314',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/jpeg',
                byteSize: 131404,
                isReadable: true,
                fetchedAt: new Date('2026-10-12T12:02:03.003Z'),
              },
            ],
            attachedFiles: [
              {
                id: 10620313,
                fileUrl: '/workspace/10620302/media-10620313.webp',
                fileType: 'image/webp',
                providerFileName: 'provider-file-10620313',
              },
              {
                // The driver prepared this one without sending it anywhere
                id: 10620314,
                fileUrl: '/workspace/10620302/media-10620314.jpg',
                fileType: 'image/jpeg',
              },
            ],
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
            uploadedAt: new Date('2026-10-12T12:02:04.004Z'),
          },
          expected: [
            expect.objectContaining({
              AiRunMediaId: 10620313,
              AiProviderId: 10100001,
              providerFileName: 'provider-file-10620313',
              uploadedAt: new Date('2026-10-12T12:02:04.004Z'),
              expiresAt: null,
            }),
          ],
        },
      ]

      test.each(cases)('attachedFiles[0].id: $input.attachedFiles.0.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)
        await AiRunMedia.bulkCreate(input.aiRunMediaRows)
        const uploader = AiRunMediaProviderUploader.create()
        const saveProviderUploadedFilesArgs = {
          attachedFiles: input.attachedFiles,
          aiProviderId: input.aiProviderId,
          uploadedAt: input.uploadedAt,
        }

        const received = await uploader.saveProviderUploadedFiles(saveProviderUploadedFilesArgs)

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
                id: 10620391, // A medium nothing creates; nothing here reaches a row
                fileUrl: '/workspace/10620391/unsent.jpg',
                fileType: 'image/jpeg',
              },
              {
                id: 10620392,
                fileUrl: '/workspace/10620392/unsent.png',
                fileType: 'image/png',
              },
            ],
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
            uploadedAt: new Date('2026-10-12T13:03:04.004Z'),
          },
        },
        {
          input: {
            attachedFiles: [
              {
                id: 10620393,
                fileUrl: '/workspace/10620393/unsent.webp',
                fileType: 'image/webp',
                providerFileName: '', // Named nothing, which is not a name
              },
            ],
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
            uploadedAt: new Date('2026-10-12T13:03:05.005Z'),
          },
        },
      ]

      test.each(cases)('attachedFiles[0].id: $input.attachedFiles.0.id', async ({
        input,
      }) => {
        const providerUploadedFileRecorder = ProviderUploadedFileRecorder.create()
        const saveProviderUploadedFileSpy = jest.spyOn(providerUploadedFileRecorder, 'saveProviderUploadedFile')
        const uploader = AiRunMediaProviderUploader.create({
          providerUploadedFileRecorder,
        })
        const saveProviderUploadedFilesArgs = {
          attachedFiles: input.attachedFiles,
          aiProviderId: input.aiProviderId,
          uploadedAt: input.uploadedAt,
        }

        const received = await uploader.saveProviderUploadedFiles(saveProviderUploadedFilesArgs)

        expect(received)
          .toHaveLength(0)
        expect(saveProviderUploadedFileSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunMediaProviderUploader', () => {
  describe('#uploadAiRunMedia()', () => {
    describe('when the driver uploads the files', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10620303,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10620303',
              requestKey: 'request-key-10620303',
              requestBodyHash: 'request-body-hash-10620303',
              externalRef: 'external-ref-10620303',
              subjectLabel: 'Subject label of run 10620303',
              correlationId: 'correlation-id-10620303',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10620303',
              acceptedAt: new Date('2026-10-12T14:04:01.001Z'),
            },
            aiRunMediaRows: [
              {
                id: 10620315,
                AiRunId: 10620303,
                mediaKey: 'media-key-10620315',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/jpeg',
                byteSize: 131505,
                isReadable: true,
                fetchedAt: new Date('2026-10-12T14:04:02.002Z'),
              },
              {
                id: 10620316,
                AiRunId: 10620303,
                mediaKey: 'media-key-10620316',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/png',
                byteSize: 131606,
                isReadable: true,
                fetchedAt: new Date('2026-10-12T14:04:03.003Z'),
              },
            ],
            readableMedia: [
              {
                aiRunMediaId: 10620315,
                mediaKey: 'media-key-10620315',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620303/media-10620315.jpg',
                mimeType: 'image/jpeg',
                refusal: null,
              },
              {
                aiRunMediaId: 10620316,
                mediaKey: 'media-key-10620316',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620303/media-10620316.png',
                mimeType: 'image/png',
                refusal: null,
              },
            ],
            preparedFiles: [
              {
                id: 10620315,
                fileUrl: '/workspace/10620303/media-10620315.jpg',
                fileType: 'image/jpeg',
                providerFileName: 'provider-file-10620315',
              },
              {
                id: 10620316,
                fileUrl: '/workspace/10620303/media-10620316.png',
                fileType: 'image/png',
                providerFileName: 'provider-file-10620316',
              },
            ],
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
            uploadedAt: new Date('2026-10-12T14:04:04.004Z'),
          },
          expected: {
            prepareAttachedFilesArgs: {
              fileUrls: [
                {
                  id: 10620315,
                  fileUrl: '/workspace/10620303/media-10620315.jpg',
                  fileType: 'image/jpeg',
                },
                {
                  id: 10620316,
                  fileUrl: '/workspace/10620303/media-10620316.png',
                  fileType: 'image/png',
                },
              ],
            },
            saveProviderUploadedFileArgs: [
              {
                aiRunMediaId: 10620315,
                aiProviderId: 10100001,
                providerFileName: 'provider-file-10620315',
                uploadedAt: new Date('2026-10-12T14:04:04.004Z'),
                expiresAt: null,
              },
              {
                aiRunMediaId: 10620316,
                aiProviderId: 10100001,
                providerFileName: 'provider-file-10620316',
                uploadedAt: new Date('2026-10-12T14:04:04.004Z'),
                expiresAt: null,
              },
            ],
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10620304,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10620304',
              requestKey: 'request-key-10620304',
              requestBodyHash: 'request-body-hash-10620304',
              externalRef: 'external-ref-10620304',
              subjectLabel: 'Subject label of run 10620304',
              correlationId: 'correlation-id-10620304',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10620304',
              acceptedAt: new Date('2026-10-12T15:05:01.001Z'),
            },
            aiRunMediaRows: [
              {
                id: 10620317,
                AiRunId: 10620304,
                mediaKey: 'media-key-10620317',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/webp',
                byteSize: 131707,
                isReadable: true,
                fetchedAt: new Date('2026-10-12T15:05:02.002Z'),
              },
              {
                id: 10620318,
                AiRunId: 10620304,
                mediaKey: 'media-key-10620318',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/jpeg',
                byteSize: 131808,
                isReadable: true,
                fetchedAt: new Date('2026-10-12T15:05:03.003Z'),
              },
            ],
            readableMedia: [
              {
                aiRunMediaId: 10620317,
                mediaKey: 'media-key-10620317',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620304/media-10620317.webp',
                mimeType: 'image/webp',
                refusal: null,
              },
              {
                aiRunMediaId: 10620318,
                mediaKey: 'media-key-10620318',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620304/media-10620318.jpg',
                mimeType: 'image/jpeg',
                refusal: null,
              },
            ],
            preparedFiles: [
              {
                id: 10620317,
                fileUrl: '/workspace/10620304/media-10620317.webp',
                fileType: 'image/webp',
                providerFileName: 'provider-file-10620317',
              },
              {
                id: 10620318,
                fileUrl: '/workspace/10620304/media-10620318.jpg',
                fileType: 'image/jpeg',
                providerFileName: 'provider-file-10620318',
              },
            ],
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
            uploadedAt: new Date('2026-10-12T15:05:04.004Z'),
          },
          expected: {
            prepareAttachedFilesArgs: {
              fileUrls: [
                {
                  id: 10620317,
                  fileUrl: '/workspace/10620304/media-10620317.webp',
                  fileType: 'image/webp',
                },
                {
                  id: 10620318,
                  fileUrl: '/workspace/10620304/media-10620318.jpg',
                  fileType: 'image/jpeg',
                },
              ],
            },
            saveProviderUploadedFileArgs: [
              {
                aiRunMediaId: 10620317,
                aiProviderId: 10100001,
                providerFileName: 'provider-file-10620317',
                uploadedAt: new Date('2026-10-12T15:05:04.004Z'),
                expiresAt: null,
              },
              {
                aiRunMediaId: 10620318,
                aiProviderId: 10100001,
                providerFileName: 'provider-file-10620318',
                uploadedAt: new Date('2026-10-12T15:05:04.004Z'),
                expiresAt: null,
              },
            ],
          },
        },
      ]

      test.each(cases)('readableMedia[0].aiRunMediaId: $input.readableMedia.0.aiRunMediaId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)
        await AiRunMedia.bulkCreate(input.aiRunMediaRows)
        const providerUploadedFileRecorder = ProviderUploadedFileRecorder.create()
        const saveProviderUploadedFileSpy = jest.spyOn(providerUploadedFileRecorder, 'saveProviderUploadedFile')
        const uploader = AiRunMediaProviderUploader.create({
          providerUploadedFileRecorder,
        })

        const aiModelProcessor = StubAiModelProcessor.create()
        const prepareAttachedFilesSpy = jest.spyOn(aiModelProcessor, 'prepareAttachedFiles')
          .mockResolvedValue(input.preparedFiles)
        const uploadAiRunMediaArgs = {
          aiModelProcessor,
          aiProviderId: input.aiProviderId,
          readableMedia: input.readableMedia,
          uploadedAt: input.uploadedAt,
        }
        const [firstRecordedFile, secondRecordedFile] = expected.saveProviderUploadedFileArgs

        const received = await uploader.uploadAiRunMedia(uploadAiRunMediaArgs)

        expect(received)
          .toBe(input.preparedFiles) // same reference
        expect(prepareAttachedFilesSpy)
          .toHaveBeenCalledWith(expected.prepareAttachedFilesArgs)
        expect(saveProviderUploadedFileSpy)
          .toHaveBeenNthCalledWith(1, firstRecordedFile)
        expect(saveProviderUploadedFileSpy)
          .toHaveBeenNthCalledWith(2, secondRecordedFile)
      })
    })

    describe('when the driver sends nothing', () => {
      const cases = [
        {
          input: {
            readableMedia: [
              {
                aiRunMediaId: 10620394, // A medium nothing creates; nothing here reaches a row
                mediaKey: 'media-key-10620394',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620394/unsent.jpg',
                mimeType: 'image/jpeg',
                refusal: null,
              },
              {
                aiRunMediaId: 10620395,
                mediaKey: 'media-key-10620395',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620395/unsent.png',
                mimeType: 'image/png',
                refusal: null,
              },
            ],
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
            uploadedAt: new Date('2026-10-12T16:06:04.004Z'),
          },
          expected: [
            {
              id: 10620394,
              fileUrl: '/workspace/10620394/unsent.jpg',
              fileType: 'image/jpeg',
            },
            {
              id: 10620395,
              fileUrl: '/workspace/10620395/unsent.png',
              fileType: 'image/png',
            },
          ],
        },
        {
          input: {
            readableMedia: [
              {
                aiRunMediaId: 10620396,
                mediaKey: 'media-key-10620396',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/10620396/unsent.webp',
                mimeType: 'image/webp',
                refusal: null,
              },
            ],
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
            uploadedAt: new Date('2026-10-12T17:07:04.004Z'),
          },
          expected: [
            {
              id: 10620396,
              fileUrl: '/workspace/10620396/unsent.webp',
              fileType: 'image/webp',
            },
          ],
        },
      ]

      test.each(cases)('readableMedia[0].aiRunMediaId: $input.readableMedia.0.aiRunMediaId', async ({
        input,
        expected,
      }) => {
        const providerUploadedFileRecorder = ProviderUploadedFileRecorder.create()
        const saveProviderUploadedFileSpy = jest.spyOn(providerUploadedFileRecorder, 'saveProviderUploadedFile')
        const uploader = AiRunMediaProviderUploader.create({
          providerUploadedFileRecorder,
        })
        const uploadAiRunMediaArgs = {
          aiModelProcessor: StubAiModelProcessor.create(),
          aiProviderId: input.aiProviderId,
          readableMedia: input.readableMedia,
          uploadedAt: input.uploadedAt,
        }

        const received = await uploader.uploadAiRunMedia(uploadAiRunMediaArgs)

        expect(received)
          .toEqual(expected)
        expect(saveProviderUploadedFileSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
