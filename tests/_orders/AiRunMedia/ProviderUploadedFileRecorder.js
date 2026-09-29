import ProviderUploadedFileRecorder from '../../../app/aiRunMedia/ProviderUploadedFileRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'
import AiRunMedia from '../../../sequelize/models/AiRunMedia.js'

/*
 * The third acceptance criterion of section 18: "every file handed to a provider is recorded, with
 * which provider received it and when".
 *
 * Every run and every medium this file hangs an egress record off is created by this file, in
 * `#media-fetch`'s own id block - `10430011` upward for the runs and `10430001` upward for the
 * media, so the two sets read apart. Borrowing the development seeder's media would hang rows off
 * the same media its own `provider_uploaded_files` seeder writes to, and a later reader asking what
 * left for medium `10410001` would find this file's rows among the fixtures.
 *
 * `10439001` is reserved inside the same block for a medium nothing ever creates, kept well clear
 * of the `10430001` media so that an id which must stay absent is never mistaken for one that was
 * meant to be written.
 *
 * The provider is the seeded one - `#provider-layer` seeds a single vendor, and the point of the
 * record is that a real provider row is on the other end of the join.
 */

describe('ProviderUploadedFileRecorder', () => {
  describe('#saveProviderUploadedFile()', () => {
    describe('should record the file that left, and to whom', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10430011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10430011',
              requestKey: 'request-key-10430011',
              requestBodyHash: 'request-body-hash-10430011',
              externalRef: 'external-ref-10430011',
              subjectLabel: 'Subject label of run 10430011',
              correlationId: 'correlation-id-10430011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10430011',
              acceptedAt: new Date('2026-09-22T01:00:01.001Z'),
              startedAt: new Date('2026-09-22T01:00:02.002Z'),
              finishedAt: new Date('2026-09-22T01:00:03.003Z'),
            },
            aiRunMediaRow: {
              id: 10430001,
              AiRunId: 10430011,
              mediaKey: 'media-key-10430001-handed-over',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
              mimeType: 'image/jpeg',
              byteSize: 214733,
              isReadable: true,
              fetchedAt: new Date('2026-09-22T01:00:04.004Z'),
            },
            providerUploadedFile: {
              aiRunMediaId: 10430001,
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'stub-file-10430001-a1b2',
              uploadedAt: new Date('2026-09-22T01:00:05.005Z'),
              expiresAt: new Date('2026-09-24T01:00:05.005Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunMediaId: 10430001,
            AiProviderId: 10100001,
            providerFileName: 'stub-file-10430001-a1b2',
            uploadedAt: new Date('2026-09-22T01:00:05.005Z'),
            expiresAt: new Date('2026-09-24T01:00:05.005Z'),
          }),
        },
        {
          params: {
            aiRunRow: {
              id: 10430012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10430012',
              requestKey: 'request-key-10430012',
              requestBodyHash: 'request-body-hash-10430012',
              externalRef: 'external-ref-10430012',
              subjectLabel: 'Subject label of run 10430012',
              correlationId: 'correlation-id-10430012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10430012',
              acceptedAt: new Date('2026-09-22T02:00:01.001Z'),
              startedAt: new Date('2026-09-22T02:00:02.002Z'),
              finishedAt: null,
            },
            aiRunMediaRow: {
              id: 10430002,
              AiRunId: 10430012,
              mediaKey: 'media-key-10430002-no-expiry',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
              mimeType: 'image/png',
              byteSize: 325844,
              isReadable: true,
              fetchedAt: new Date('2026-09-22T02:00:04.004Z'),
            },
            providerUploadedFile: {
              aiRunMediaId: 10430002,
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'stub-file-10430002-c3d4',
              uploadedAt: new Date('2026-09-22T02:00:05.005Z'),
              expiresAt: null,
            },
          },
          expected: expect.objectContaining({
            AiRunMediaId: 10430002,
            AiProviderId: 10100001,
            providerFileName: 'stub-file-10430002-c3d4',
            uploadedAt: new Date('2026-09-22T02:00:05.005Z'),
            expiresAt: null,
          }),
        },
      ]

      test.each(cases)('providerFileName: $params.providerUploadedFile.providerFileName', async ({
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        await AiRunMedia.create(params.aiRunMediaRow)

        const recorder = ProviderUploadedFileRecorder.create()

        const actual = await recorder.saveProviderUploadedFile(params.providerUploadedFile)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#saveProviderUploadedFile()', () => {
    /*
     * A record whose medium was uploaded and then could not be read is still a record: what left is
     * a separate question from what came back, which is why the development seeder carries the same
     * pair.
     */
    describe('should record a file that left and could not be read afterwards', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10430013,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10430013',
              requestKey: 'request-key-10430013',
              requestBodyHash: 'request-body-hash-10430013',
              externalRef: 'external-ref-10430013',
              subjectLabel: 'Subject label of run 10430013',
              correlationId: 'correlation-id-10430013',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10430013',
              acceptedAt: new Date('2026-09-22T03:00:01.001Z'),
              startedAt: new Date('2026-09-22T03:00:02.002Z'),
              finishedAt: new Date('2026-09-22T03:00:03.003Z'),
            },
            aiRunMediaRow: {
              id: 10430003,
              AiRunId: 10430013,
              mediaKey: 'media-key-10430003-unreadable',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
              mimeType: 'image/jpeg',
              byteSize: 436955,
              isReadable: false,
              fetchedAt: new Date('2026-09-22T03:00:04.004Z'),
            },
            providerUploadedFile: {
              aiRunMediaId: 10430003,
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'stub-file-10430003-e5f6',
              uploadedAt: new Date('2026-09-22T03:00:05.005Z'),
              expiresAt: new Date('2026-09-26T03:00:05.005Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunMediaId: 10430003,
            AiProviderId: 10100001,
            providerFileName: 'stub-file-10430003-e5f6',
            uploadedAt: new Date('2026-09-22T03:00:05.005Z'),
            expiresAt: new Date('2026-09-26T03:00:05.005Z'),
          }),
        },
      ]

      test.each(cases)('providerFileName: $params.providerUploadedFile.providerFileName', async ({
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        await AiRunMedia.create(params.aiRunMediaRow)

        const recorder = ProviderUploadedFileRecorder.create()

        const actual = await recorder.saveProviderUploadedFile(params.providerUploadedFile)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#saveProviderUploadedFile()', () => {
    /*
     * The table declares no database foreign key, so nothing but this class stops a record pointing
     * at a medium or a provider that does not exist - and a record pointing at nothing answers the
     * use case it exists for with nothing.
     */
    describe('should refuse a record naming an end that does not exist', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10430014,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10430014',
              requestKey: 'request-key-10430014',
              requestBodyHash: 'request-body-hash-10430014',
              externalRef: 'external-ref-10430014',
              subjectLabel: 'Subject label of run 10430014',
              correlationId: 'correlation-id-10430014',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10430014',
              acceptedAt: new Date('2026-09-22T04:00:01.001Z'),
              startedAt: new Date('2026-09-22T04:00:02.002Z'),
              finishedAt: new Date('2026-09-22T04:00:03.003Z'),
            },
            aiRunMediaRow: {
              id: 10430004,
              AiRunId: 10430014,
              mediaKey: 'media-key-10430004-real-medium',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
              mimeType: 'image/webp',
              byteSize: 548066,
              isReadable: true,
              fetchedAt: new Date('2026-09-22T04:00:04.004Z'),
            },
            providerUploadedFile: {
              aiRunMediaId: 10439001,
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'stub-file-10439001-a7b8',
              uploadedAt: new Date('2026-09-22T04:00:05.005Z'),
              expiresAt: null,
            },
          },
          expected: 'refused a medium that does not exist',
        },
        {
          params: {
            aiRunRow: {
              id: 10430015,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10430015',
              requestKey: 'request-key-10430015',
              requestBodyHash: 'request-body-hash-10430015',
              externalRef: 'external-ref-10430015',
              subjectLabel: 'Subject label of run 10430015',
              correlationId: 'correlation-id-10430015',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10430015',
              acceptedAt: new Date('2026-09-22T05:00:01.001Z'),
              startedAt: new Date('2026-09-22T05:00:02.002Z'),
              finishedAt: new Date('2026-09-22T05:00:03.003Z'),
            },
            aiRunMediaRow: {
              id: 10430005,
              AiRunId: 10430015,
              mediaKey: 'media-key-10430005-unknown-vendor',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
              mimeType: 'image/jpeg',
              byteSize: 659177,
              isReadable: true,
              fetchedAt: new Date('2026-09-22T05:00:04.004Z'),
            },
            providerUploadedFile: {
              aiRunMediaId: 10430005,
              aiProviderId: 10109001,
              providerFileName: 'stub-file-10430005-c9d0',
              uploadedAt: new Date('2026-09-22T05:00:05.005Z'),
              expiresAt: null,
            },
          },
          expected: 'refused a provider that does not exist',
        },
      ]

      test.each(cases)('providerFileName: $params.providerUploadedFile.providerFileName', async ({
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        await AiRunMedia.create(params.aiRunMediaRow)

        const recorder = ProviderUploadedFileRecorder.create()

        const actual = () => recorder.saveProviderUploadedFile(params.providerUploadedFile)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#saveProviderUploadedFile()', () => {
    /*
     * Every refusal here is a defect in the call rather than a row that is missing, so it is raised
     * before anything is read - a caller answered with a quiet null would carry on believing the
     * departure of the file had been recorded.
     */
    describe('should refuse a call the record cannot be written from', () => {
      const cases = [
        {
          params: {
            providerUploadedFile: {
              aiRunMediaId: 'media-key-10430001-handed-over',
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'stub-file-refused-by-media-key',
              uploadedAt: new Date('2026-09-22T06:00:05.005Z'),
              expiresAt: null,
            },
          },
          expected: 'refused a key that is not an id: field AiRunMediaId',
        },
        {
          params: {
            providerUploadedFile: {
              aiRunMediaId: 10430001,
              aiProviderId: null,
              providerFileName: 'stub-file-refused-by-provider',
              uploadedAt: new Date('2026-09-22T06:01:05.005Z'),
              expiresAt: null,
            },
          },
          expected: 'refused a key that is not an id: field AiProviderId',
        },
        {
          params: {
            providerUploadedFile: {
              aiRunMediaId: 10430001,
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: '   ',
              uploadedAt: new Date('2026-09-22T06:02:05.005Z'),
              expiresAt: null,
            },
          },
          expected: 'refused a provider file name the record cannot carry',
        },
        {
          params: {
            providerUploadedFile: {
              aiRunMediaId: 10430001,
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'stub-file-refused-by-upload-instant',
              uploadedAt: '2026-09-22T06:03:05.005Z',
              expiresAt: null,
            },
          },
          expected: 'refused an upload instant that is not an instant',
        },
        {
          params: {
            providerUploadedFile: {
              aiRunMediaId: 10430001,
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'stub-file-refused-by-expiry',
              uploadedAt: new Date('2026-09-22T06:04:05.005Z'),
              expiresAt: new Date('whenever'),
            },
          },
          expected: 'refused an expiry that is not an instant',
        },
        {
          params: {
            providerUploadedFile: {
              aiRunMediaId: 10430001,
              aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'stub-file-refused-by-backwards-span',
              uploadedAt: new Date('2026-09-22T06:05:05.005Z'),
              expiresAt: new Date('2026-09-21T06:05:05.005Z'),
            },
          },
          expected: 'refused an expiry falling before the upload it belongs to',
        },
      ]

      test.each(cases)('providerFileName: $params.providerUploadedFile.providerFileName', async ({
        params,
        expected,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = () => recorder.saveProviderUploadedFile(params.providerUploadedFile)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})
