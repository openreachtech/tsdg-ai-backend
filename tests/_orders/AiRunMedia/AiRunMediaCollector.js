import AiRunMediaCollector from '../../../app/aiRunMedia/AiRunMediaCollector.js'

import AiRun from '../../../sequelize/models/AiRun.js'
import AiRunMedia from '../../../sequelize/models/AiRunMedia.js'

/*
 * Step 2 of specs/1.0.0 §20 run whole: the sequential fetch, the budget rationing [[Q125]] settles,
 * and the three endings [[Q121]] settles, each against real `ai_run_media` rows this file creates
 * in `#asset-media-extraction`'s own block - runs `1061092x`, media `1061093x` upward.
 *
 * **Two things are stood in for, and only two.** The fetch client is the network, which a test must
 * never reach - it is replaced through `.get:MediaFetchClientCtor`, the seam that exists for it.
 * The workspace is the worker host's own temporary directory; a real one would leave a run's files
 * behind, because removing them belongs to `BaseAiRunJobWorker`'s `finally` and not to this class.
 * Everything else runs for real: the limit inspector, the category inspector, the descriptor
 * extractor, and the recorder that moves the rows.
 *
 * The rows the class moved are never re-read by hand here. What a fetch came to is answered by the
 * method under test, and `AiRunMediaRecorder#saveFetchedAiRunMedia()` has its own test for the
 * write it makes.
 */

describe('AiRunMediaCollector', () => {
  describe('#collectAiRunMedia()', () => {
    /*
     * One photograph arrives and the other does not. The run is not refused: it settles on what it
     * has, and the caller is told by key which file it did not get.
     */
    describe('should fetch what it can and name what it could not', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10610921,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610921',
              requestKey: 'request-key-10610921',
              requestBodyHash: 'request-body-hash-10610921',
              externalRef: 'external-ref-10610921',
              subjectLabel: 'Subject label of run 10610921',
              correlationId: 'correlation-id-10610921',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610921',
              acceptedAt: new Date('2026-09-26T06:00:01.001Z'),
              startedAt: new Date('2026-09-26T06:00:02.002Z'),
              finishedAt: null,
            },
            aiRunMediaRows: [
              {
                id: 10610931,
                AiRunId: 10610921,
                mediaKey: 'media-key-10610931-arrives',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/jpeg',
                byteSize: 214733,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610932,
                AiRunId: 10610921,
                mediaKey: 'media-key-10610932-stalls',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/png',
                byteSize: 318744,
                isReadable: false,
                fetchedAt: null,
              },
            ],
            requestBody: {
              media: [
                {
                  mediaKey: 'media-key-10610931-arrives',
                  mediaCategoryName: 'image',
                  url: 'https://storage.client.development.invalid/10610931.jpg',
                  mimeType: 'image/jpeg',
                  byteSize: 214733,
                },
                {
                  mediaKey: 'media-key-10610932-stalls',
                  mediaCategoryName: 'image',
                  url: 'https://storage.client.development.invalid/10610932.png',
                  mimeType: 'image/png',
                  byteSize: 318744,
                },
              ],
            },
          },
          mockFetchOutcomeHash: {
            'https://storage.client.development.invalid/10610931.jpg': {
              bytes: Buffer.from('bytes of medium 10610931'),
              byteSize: 24,
              mimeType: 'image/jpeg',
              failureReasonCode: null,
            },
            'https://storage.client.development.invalid/10610932.png': {
              bytes: null,
              byteSize: null,
              mimeType: null,
              failureReasonCode: 'MEDIA_FETCH_FAILED',
            },
          },
          expected: {
            readableMedia: [
              {
                aiRunMediaId: 10610931,
                mediaKey: 'media-key-10610931-arrives',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/medium-10610931',
                mimeType: 'image/jpeg',
                refusal: null,
              },
            ],
            unreadableMediaKeys: [
              'media-key-10610932-stalls',
            ],
            failureReasonCode: null,
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        mockFetchOutcomeHash,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        await AiRunMedia.bulkCreate(params.aiRunMediaRows)

        const collector = AiRunMediaCollector.create()

        const aiRunMediaWorkspace = {
          /**
           * Answer the path the copy went to, without touching a disk.
           *
           * @param {{
           *   aiRunMediaId: number
           * }} writeParams - Parameters.
           * @returns {Promise<string>} The path.
           */
          writeMediumFile: async ({
            aiRunMediaId,
          }) => `/workspace/medium-${aiRunMediaId}`,
        }

        jest.spyOn(AiRunMediaCollector, 'MediaFetchClientCtor', 'get')
          .mockReturnValue(/** @type {*} */ ({
            create: () => ({
              fetchMedium: async ({
                url,
              }) => mockFetchOutcomeHash[url],
            }),
          }))

        const actual = await collector.collectAiRunMedia({
          requestBody: params.requestBody,
          aiRunMedia: params.aiRunMediaRows,
          aiRunMediaWorkspace,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#collectAiRunMedia()', () => {
    /*
     * [[Q125]]'s answer seen from its sharp end: a step whose budget is spent makes no further
     * fetch at all. The fetch client is never even constructed, which is the difference between "a
     * medium that failed" and "a medium nothing was spent on" - no connection, no line in anybody's
     * access log.
     *
     * The whole request is one photograph, so nothing was read and the run fails under the
     * unreadable code, which is the twelfth acceptance criterion reached from this direction.
     */
    describe('should fetch nothing once the budget is spent', () => {
      const cases = [
        {
          factoryParams: {
            mediaBudgetMilliseconds: 0,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            aiRunRow: {
              id: 10610922,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610922',
              requestKey: 'request-key-10610922',
              requestBodyHash: 'request-body-hash-10610922',
              externalRef: 'external-ref-10610922',
              subjectLabel: 'Subject label of run 10610922',
              correlationId: 'correlation-id-10610922',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610922',
              acceptedAt: new Date('2026-09-26T07:00:01.001Z'),
              startedAt: new Date('2026-09-26T07:00:02.002Z'),
              finishedAt: null,
            },
            aiRunMediaRows: [
              {
                id: 10610933,
                AiRunId: 10610922,
                mediaKey: 'media-key-10610933-unreached',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/jpeg',
                byteSize: 411290,
                isReadable: false,
                fetchedAt: null,
              },
            ],
            requestBody: {
              media: [
                {
                  mediaKey: 'media-key-10610933-unreached',
                  mediaCategoryName: 'image',
                  url: 'https://storage.client.development.invalid/10610933.jpg',
                  mimeType: 'image/jpeg',
                  byteSize: 411290,
                },
              ],
            },
          },
          expected: {
            readableMedia: [],
            unreadableMediaKeys: [
              'media-key-10610933-unreached',
            ],
            failureReasonCode: 'MEDIA_UNREADABLE',
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        await AiRunMedia.bulkCreate(params.aiRunMediaRows)

        const collector = AiRunMediaCollector.create(factoryParams)

        const aiRunMediaWorkspace = {
          /**
           * Answer the path the copy went to, without touching a disk.
           *
           * @param {{
           *   aiRunMediaId: number
           * }} writeParams - Parameters.
           * @returns {Promise<string>} The path.
           */
          writeMediumFile: async ({
            aiRunMediaId,
          }) => `/workspace/medium-${aiRunMediaId}`,
        }

        const mediaFetchClientFactory = {
          /**
           * Build a client that must never be asked for.
           *
           * @returns {*} The client.
           */
          create: () => ({
            fetchMedium: async () => ({
              bytes: Buffer.from('bytes nobody should have fetched'),
              byteSize: 32,
              mimeType: 'image/jpeg',
              failureReasonCode: null,
            }),
          }),
        }
        const createSpy = jest.spyOn(mediaFetchClientFactory, 'create')

        jest.spyOn(AiRunMediaCollector, 'MediaFetchClientCtor', 'get')
          .mockReturnValue(/** @type {*} */ (mediaFetchClientFactory))

        const actual = await collector.collectAiRunMedia({
          requestBody: params.requestBody,
          aiRunMedia: params.aiRunMediaRows,
          aiRunMediaWorkspace,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toEqual(expected)
        expect(createSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#collectAiRunMedia()', () => {
    /*
     * "A video URL among the media is refused with the unsupported reason code, rather than being
     * silently skipped", and "audio among the media is ignored", in one request that carries all
     * three kinds. The video refuses the whole collection by name; the photograph after it is never
     * fetched, because the run is over.
     */
    describe('should refuse a video by name and stop', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10610923,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610923',
              requestKey: 'request-key-10610923',
              requestBodyHash: 'request-body-hash-10610923',
              externalRef: 'external-ref-10610923',
              subjectLabel: 'Subject label of run 10610923',
              correlationId: 'correlation-id-10610923',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610923',
              acceptedAt: new Date('2026-09-26T08:00:01.001Z'),
              startedAt: new Date('2026-09-26T08:00:02.002Z'),
              finishedAt: null,
            },
            aiRunMediaRows: [
              {
                id: 10610934,
                AiRunId: 10610923,
                mediaKey: 'media-key-10610934-narration',
                AiRunMediaCategoryId: 3, // AI_RUN_MEDIA_CATEGORY.AUDIO.ID
                mimeType: 'audio/mp4',
                byteSize: 442211,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610935,
                AiRunId: 10610923,
                mediaKey: 'media-key-10610935-walkthrough',
                AiRunMediaCategoryId: 2, // AI_RUN_MEDIA_CATEGORY.VIDEO.ID
                mimeType: 'video/mp4',
                byteSize: 8123456,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610936,
                AiRunId: 10610923,
                mediaKey: 'media-key-10610936-after-the-video',
                AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
                mimeType: 'image/jpeg',
                byteSize: 129877,
                isReadable: false,
                fetchedAt: null,
              },
            ],
            requestBody: {
              media: [
                {
                  mediaKey: 'media-key-10610936-after-the-video',
                  mediaCategoryName: 'image',
                  url: 'https://storage.client.development.invalid/10610936.jpg',
                  mimeType: 'image/jpeg',
                  byteSize: 129877,
                },
              ],
            },
          },
          expected: {
            readableMedia: [],
            unreadableMediaKeys: [
              'media-key-10610936-after-the-video',
            ],
            failureReasonCode: 'MEDIA_UNSUPPORTED',
            failureParameters: {
              mediaKey: 'media-key-10610935-walkthrough',
              mediaCategoryName: 'video',
              isRecognizedMediaCategory: true,
            },
          },
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        await AiRunMedia.bulkCreate(params.aiRunMediaRows)

        const collector = AiRunMediaCollector.create()

        const aiRunMediaWorkspace = {
          /**
           * Answer the path the copy went to, without touching a disk.
           *
           * @param {{
           *   aiRunMediaId: number
           * }} writeParams - Parameters.
           * @returns {Promise<string>} The path.
           */
          writeMediumFile: async ({
            aiRunMediaId,
          }) => `/workspace/medium-${aiRunMediaId}`,
        }

        const mediaFetchClientFactory = {
          /**
           * Build a client that must never be asked for.
           *
           * @returns {*} The client.
           */
          create: () => ({
            fetchMedium: async () => ({
              bytes: Buffer.from('bytes nobody should have fetched'),
              byteSize: 32,
              mimeType: 'image/jpeg',
              failureReasonCode: null,
            }),
          }),
        }
        const createSpy = jest.spyOn(mediaFetchClientFactory, 'create')

        jest.spyOn(AiRunMediaCollector, 'MediaFetchClientCtor', 'get')
          .mockReturnValue(/** @type {*} */ (mediaFetchClientFactory))

        const actual = await collector.collectAiRunMedia({
          requestBody: params.requestBody,
          aiRunMedia: params.aiRunMediaRows,
          aiRunMediaWorkspace,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toEqual(expected)
        expect(createSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#collectAiRunMedia()', () => {
    /*
     * "A request carrying more photos than the limit is refused, with the limit named in the
     * reason's parameters" - and refused before anything is fetched, which the untouched fetch
     * client is what proves.
     */
    describe('should refuse a request over the count limit before fetching anything', () => {
      const cases = [
        {
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            aiRunRow: {
              id: 10610924,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610924',
              requestKey: 'request-key-10610924',
              requestBodyHash: 'request-body-hash-10610924',
              externalRef: 'external-ref-10610924',
              subjectLabel: 'Subject label of run 10610924',
              correlationId: 'correlation-id-10610924',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610924',
              acceptedAt: new Date('2026-09-26T09:00:01.001Z'),
              startedAt: new Date('2026-09-26T09:00:02.002Z'),
              finishedAt: null,
            },
            aiRunMediaRows: [
              {
                id: 10610941,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610941',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 111111,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610942,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610942',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 222222,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610943,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610943',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 333333,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610944,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610944',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 444444,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610945,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610945',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 555555,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610946,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610946',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 666666,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610947,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610947',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 777777,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610948,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610948',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 888888,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610949,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610949',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 999999,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610950,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610950',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 101010,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610951,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610951',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 121212,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610952,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610952',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 131313,
                isReadable: false,
                fetchedAt: null,
              },
              {
                id: 10610953,
                AiRunId: 10610924,
                mediaKey: 'media-key-10610953',
                AiRunMediaCategoryId: 1,
                mimeType: 'image/jpeg',
                byteSize: 141414,
                isReadable: false,
                fetchedAt: null,
              },
            ],
            requestBody: {
              media: [],
            },
          },
          expected: {
            readableMedia: [],
            unreadableMediaKeys: [],
            failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
            failureParameters: {
              limitName: 'mediaCount',
              limitValue: 12,
              declaredValue: 13,
            },
          },
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        await AiRunMedia.bulkCreate(params.aiRunMediaRows)

        const collector = AiRunMediaCollector.create(factoryParams)

        const aiRunMediaWorkspace = {
          /**
           * Answer the path the copy went to, without touching a disk.
           *
           * @param {{
           *   aiRunMediaId: number
           * }} writeParams - Parameters.
           * @returns {Promise<string>} The path.
           */
          writeMediumFile: async ({
            aiRunMediaId,
          }) => `/workspace/medium-${aiRunMediaId}`,
        }

        const mediaFetchClientFactory = {
          /**
           * Build a client that must never be asked for.
           *
           * @returns {*} The client.
           */
          create: () => ({
            fetchMedium: async () => ({
              bytes: Buffer.from('bytes nobody should have fetched'),
              byteSize: 32,
              mimeType: 'image/jpeg',
              failureReasonCode: null,
            }),
          }),
        }
        const createSpy = jest.spyOn(mediaFetchClientFactory, 'create')

        jest.spyOn(AiRunMediaCollector, 'MediaFetchClientCtor', 'get')
          .mockReturnValue(/** @type {*} */ (mediaFetchClientFactory))

        const actual = await collector.collectAiRunMedia({
          requestBody: params.requestBody,
          aiRunMedia: params.aiRunMediaRows,
          aiRunMediaWorkspace,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toEqual(expected)
        expect(createSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
