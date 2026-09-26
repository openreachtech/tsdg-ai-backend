import AiRunMediaRecorder from '../../../app/aiRunMedia/AiRunMediaRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'
import AiRunMedia from '../../../sequelize/models/AiRunMedia.js'

/*
 * The `ai_run_media` rows of one run: what the caller declared, written before anything is fetched.
 *
 * Every run this file hangs media off is created by this file, in `#asset-media-extraction`'s own
 * id block - `10610901` upward - so it borrows no seeded run and leaves nothing another file here
 * reads. The media rows themselves take the auto-increment, because that is how the class writes
 * them and asserting an id this file did not choose would be asserting the sequence.
 *
 * A row is written for a kind this version refuses and for one it ignores, both: that is what lets
 * the collector refuse a video *by name*. The video and audio cases here are therefore not edge
 * cases - they are the ordinary path for this class.
 */

describe('AiRunMediaRecorder', () => {
  describe('#saveAiRunMedia()', () => {
    describe('should record every medium the caller declared', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10610901,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610901',
              requestKey: 'request-key-10610901',
              requestBodyHash: 'request-body-hash-10610901',
              externalRef: 'external-ref-10610901',
              subjectLabel: 'Subject label of run 10610901',
              correlationId: 'correlation-id-10610901',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610901',
              acceptedAt: new Date('2026-09-26T01:00:01.001Z'),
              startedAt: new Date('2026-09-26T01:00:02.002Z'),
              finishedAt: null,
            },
            saveParams: {
              aiRunId: 10610901,
              mediaDescriptors: [
                {
                  mediaKey: 'media-key-10610901-front',
                  mediaCategoryName: 'image',
                  url: 'https://storage.client.development.invalid/10610901-front.jpg',
                  mimeType: 'image/jpeg',
                  byteSize: 214733,
                },
                {
                  mediaKey: 'media-key-10610901-walkthrough',
                  mediaCategoryName: 'video',
                  url: 'https://storage.client.development.invalid/10610901-walkthrough.mp4',
                  mimeType: 'video/mp4',
                  byteSize: 8123456,
                },
              ],
            },
          },
          expected: [
            expect.objectContaining({
              AiRunId: 10610901,
              mediaKey: 'media-key-10610901-front',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
              mimeType: 'image/jpeg',
              isReadable: false,
              fetchedAt: null,
            }),
            expect.objectContaining({
              AiRunId: 10610901,
              mediaKey: 'media-key-10610901-walkthrough',
              AiRunMediaCategoryId: 2, // AI_RUN_MEDIA_CATEGORY.VIDEO.ID
              mimeType: 'video/mp4',
              isReadable: false,
              fetchedAt: null,
            }),
          ],
        },
        {
          params: {
            aiRunRow: {
              id: 10610902,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610902',
              requestKey: 'request-key-10610902',
              requestBodyHash: 'request-body-hash-10610902',
              externalRef: 'external-ref-10610902',
              subjectLabel: 'Subject label of run 10610902',
              correlationId: 'correlation-id-10610902',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610902',
              acceptedAt: new Date('2026-09-26T02:00:01.001Z'),
              startedAt: new Date('2026-09-26T02:00:02.002Z'),
              finishedAt: null,
            },
            saveParams: {
              aiRunId: 10610902,
              mediaDescriptors: [
                {
                  mediaKey: 'media-key-10610902-narration',
                  mediaCategoryName: 'audio',
                  url: 'https://storage.client.development.invalid/10610902-narration.m4a',
                  mimeType: 'audio/mp4',
                  byteSize: 442211,
                },
              ],
            },
          },
          expected: [
            expect.objectContaining({
              AiRunId: 10610902,
              mediaKey: 'media-key-10610902-narration',
              AiRunMediaCategoryId: 3, // AI_RUN_MEDIA_CATEGORY.AUDIO.ID
              mimeType: 'audio/mp4',
              isReadable: false,
              fetchedAt: null,
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $params.saveParams.aiRunId', async ({
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)

        const recorder = AiRunMediaRecorder.create()

        const actual = await recorder.saveAiRunMedia(params.saveParams)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaRecorder', () => {
  describe('#saveAiRunMedia()', () => {
    describe('should throw error', () => {
      const cases = [
        {
          params: {
            aiRunId: 'not-an-id',
            mediaDescriptors: [],
          },
          expected: 'AiRunMediaRecorder#saveAiRunMedia() refused a run that is not an id: AiRunId not-an-id',
        },
        {
          params: {
            aiRunId: null,
            mediaDescriptors: [],
          },
          expected: 'AiRunMediaRecorder#saveAiRunMedia() refused a run that is not an id: AiRunId null',
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        expected,
      }) => {
        const recorder = AiRunMediaRecorder.create()

        const actual = () => recorder.saveAiRunMedia(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunMediaRecorder', () => {
  describe('#saveFetchedAiRunMedia()', () => {
    /*
     * `isReadable` turns true only once something has been read, and `fetchedAt` is what tells a
     * medium that was fetched and failed from one that was never fetched at all. Both endings are
     * written here, off one run.
     */
    describe('should record what became of a medium once the fetch was attempted', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10610903,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610903',
              requestKey: 'request-key-10610903',
              requestBodyHash: 'request-body-hash-10610903',
              externalRef: 'external-ref-10610903',
              subjectLabel: 'Subject label of run 10610903',
              correlationId: 'correlation-id-10610903',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610903',
              acceptedAt: new Date('2026-09-26T03:00:01.001Z'),
              startedAt: new Date('2026-09-26T03:00:02.002Z'),
              finishedAt: null,
            },
            aiRunMediaRow: {
              id: 10610911,
              AiRunId: 10610903,
              mediaKey: 'media-key-10610911-read',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
              mimeType: 'image/jpeg',
              byteSize: 318744,
              isReadable: false,
              fetchedAt: null,
            },
            saveParams: {
              aiRunMediaId: 10610911,
              isReadable: true,
              fetchedAt: new Date('2026-09-26T03:00:05.005Z'),
            },
          },
          expected: 1,
        },
        {
          params: {
            aiRunRow: {
              id: 10610904,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10610904',
              requestKey: 'request-key-10610904',
              requestBodyHash: 'request-body-hash-10610904',
              externalRef: 'external-ref-10610904',
              subjectLabel: 'Subject label of run 10610904',
              correlationId: 'correlation-id-10610904',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610904',
              acceptedAt: new Date('2026-09-26T04:00:01.001Z'),
              startedAt: new Date('2026-09-26T04:00:02.002Z'),
              finishedAt: new Date('2026-09-26T04:00:09.009Z'),
            },
            aiRunMediaRow: {
              id: 10610912,
              AiRunId: 10610904,
              mediaKey: 'media-key-10610912-unread',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
              mimeType: 'image/png',
              byteSize: 511923,
              isReadable: false,
              fetchedAt: null,
            },
            saveParams: {
              aiRunMediaId: 10610912,
              isReadable: false,
              fetchedAt: new Date('2026-09-26T04:00:06.006Z'),
            },
          },
          expected: 1,
        },
      ]

      test.each(cases)('aiRunMediaId: $params.saveParams.aiRunMediaId', async ({
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        await AiRunMedia.create(params.aiRunMediaRow)

        const recorder = AiRunMediaRecorder.create()

        const actual = await recorder.saveFetchedAiRunMedia(params.saveParams)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunMediaRecorder', () => {
  describe('#saveFetchedAiRunMedia()', () => {
    describe('should throw error', () => {
      const cases = [
        {
          params: {
            aiRunMediaId: 'not-an-id',
            isReadable: true,
            fetchedAt: new Date('2026-09-26T05:00:01.001Z'),
          },
          expected: 'AiRunMediaRecorder#saveFetchedAiRunMedia() refused a medium that is not an id: AiRunMediaId not-an-id',
        },
        {
          params: {
            aiRunMediaId: 10610913,
            isReadable: true,
            fetchedAt: 'not-an-instant',
          },
          expected: 'AiRunMediaRecorder#saveFetchedAiRunMedia() refused a fetch instant that is not an instant: AiRunMediaId 10610913',
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId', async ({
        params,
        expected,
      }) => {
        const recorder = AiRunMediaRecorder.create()

        const actual = () => recorder.saveFetchedAiRunMedia(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunMediaRecorder', () => {
  describe('#buildRecordableValues()', () => {
    describe('should throw error', () => {
      const cases = [
        {
          params: {
            aiRunId: 10610905,
            mediaDescriptor: {
              mediaKey: '',
              mediaCategoryName: 'image',
              mimeType: 'image/jpeg',
              byteSize: 12345,
            },
          },
          expected: 'AiRunMediaRecorder#buildRecordableValues() refused a medium the caller gave no key: AiRunId 10610905',
        },
        {
          params: {
            aiRunId: 10610906,
            mediaDescriptor: {
              mediaKey: 'media-key-10610906',
              mediaCategoryName: 'image',
              mimeType: null,
              byteSize: 12345,
            },
          },
          expected: 'AiRunMediaRecorder#buildRecordableValues() refused a medium the caller gave no media type: AiRunId 10610906, mediaKey media-key-10610906',
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', ({
        params,
        expected,
      }) => {
        const recorder = AiRunMediaRecorder.create()

        const actual = () => recorder.buildRecordableValues(params)

        expect(actual)
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunMediaRecorder', () => {
  describe('#generateAiRunMediaCategoryId()', () => {
    describe('should answer the id the master carries for the name', () => {
      const cases = [
        {
          params: {
            mediaCategoryName: 'image',
          },
          expected: 1,
        },
        {
          params: {
            mediaCategoryName: 'video',
          },
          expected: 2,
        },
        {
          params: {
            mediaCategoryName: 'audio',
          },
          expected: 3,
        },
      ]

      test.each(cases)('mediaCategoryName: $params.mediaCategoryName', ({
        params,
        expected,
      }) => {
        const recorder = AiRunMediaRecorder.create()

        const actual = recorder.generateAiRunMediaCategoryId(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunMediaRecorder', () => {
  describe('#generateAiRunMediaCategoryId()', () => {
    describe('should be null', () => {
      const cases = [
        {
          params: {
            mediaCategoryName: 'hologram',
          },
        },
        {
          params: {
            mediaCategoryName: null,
          },
        },
      ]

      test.each(cases)('mediaCategoryName: $params.mediaCategoryName', ({
        params,
      }) => {
        const recorder = AiRunMediaRecorder.create()

        const actual = recorder.generateAiRunMediaCategoryId(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})
