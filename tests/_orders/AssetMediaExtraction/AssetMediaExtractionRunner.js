import AiRunMediaCollector from '../../../app/aiRunMedia/AiRunMediaCollector.js'
import AiRunMediaPreparer from '../../../app/aiRunMedia/AiRunMediaPreparer.js'

import AssetMediaExtractionRunner from '../../../app/assetMediaExtraction/AssetMediaExtractionRunner.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * The six steps of an asset-media-extraction run, run whole against real rows.
 *
 * **This is where four of the acceptance criteria of specs/1.0.0 §20 become true of a run rather
 * than of a step.** The unreadable code, the refused video, the ignored audio and the photograph
 * cap were each built and tested in `AiRunMediaCollector` at the checkpoint before this one, and
 * none of them is decided a second time here. What these cases assert is the other half of each:
 * that a run reaching the condition ends carrying the reason that step decided, through the
 * failure the run raises.
 *
 * **Three things are stood in for, and each for a stated reason.** The fetch client is the network,
 * which a test must never reach - it is replaced through `.get:MediaFetchClientCtor`, the seam that
 * exists for it. The workspace is the worker host's own temporary directory; a real one would leave
 * a run's files behind, because removing them belongs to `BaseAiRunJobWorker`'s `finally` and not
 * to anything under test here. And the reading fetcher, in the two cases that reach it, is the
 * provider call: its answer on the stub driver is drawn from a digest of the request, which is not
 * something a run's settled body may be asserted against.
 *
 * **The media step is a class of its own and is built here rather than defaulted**, so that the one
 * member of it a test may not let run - the one that makes a directory on the machine - can be
 * stood in for. Everything else about `AiRunMediaPreparer` runs for real, and these five runs are
 * the whole of its write behavior's coverage: it has no `_orders` file of its own, because a second
 * copy of these runs driven through it directly would go red in two places for one reason.
 *
 * **Everything else runs for real**, including the four rows that make a run executable at all: the
 * agent the master seeder installs, the model bound to it, the driver that claims that model's
 * name, and the tool schema a reading is forced through. A missing row in any of the four is a run
 * that cannot start, and these cases are where that shows.
 *
 * Every run is created here in `#asset-media-extraction`'s `1063` sub-block and none is borrowed:
 * `ai_run_steps` is UNIQUE on `(AiRunId, step_index)`, and every seeded run already carries a
 * trace.
 */

describe('AssetMediaExtractionRunner', () => {
  describe('#runAssetMediaExtraction()', () => {
    /*
     * §20: "a request carrying more photos than the limit is refused, with the limit named in the
     * reason's parameters". Thirteen photographs against a cap of twelve, refused before a single
     * byte crosses the network - the fetch client below is stood in for and never asked.
     *
     * The reason code reaches the assertion through the failure's own message, which is built out
     * of it. The limit itself travels in that failure's parameters, which `AiRunMediaCollector`'s
     * own test asserts; what carries it on to the row is the worker's
     * `#extractAiRunFailureParameters()`, and what does not ask for it yet is
     * `BaseAiRunJobWorker#buildAiRunWorkOutcome()`.
     */
    describe('should refuse a request carrying more photographs than the limit', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10630101,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10630101',
              requestKey: 'request-key-10630101',
              requestBodyHash: 'request-body-hash-10630101',
              externalRef: 'external-ref-10630101',
              subjectLabel: 'Subject label of run 10630101',
              correlationId: 'correlation-id-10630101',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10630101',
              requestBody: '{"externalRef":"external-ref-10630101","asset":{"categorySlugs":["residential"],"province":"Khanh Hoa"},"fieldSchema":[{"path":"attributes.floorCount","label":"Floor count","valueKind":"number","isRequired":false,"unit":"floor"}],"media":[{"mediaKey":"media-key-106301001","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301001.jpg","mimeType":"image/jpeg","byteSize":210001},{"mediaKey":"media-key-106301002","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301002.jpg","mimeType":"image/jpeg","byteSize":210002},{"mediaKey":"media-key-106301003","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301003.jpg","mimeType":"image/jpeg","byteSize":210003},{"mediaKey":"media-key-106301004","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301004.jpg","mimeType":"image/jpeg","byteSize":210004},{"mediaKey":"media-key-106301005","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301005.jpg","mimeType":"image/jpeg","byteSize":210005},{"mediaKey":"media-key-106301006","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301006.jpg","mimeType":"image/jpeg","byteSize":210006},{"mediaKey":"media-key-106301007","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301007.jpg","mimeType":"image/jpeg","byteSize":210007},{"mediaKey":"media-key-106301008","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301008.jpg","mimeType":"image/jpeg","byteSize":210008},{"mediaKey":"media-key-106301009","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301009.jpg","mimeType":"image/jpeg","byteSize":210009},{"mediaKey":"media-key-106301010","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301010.jpg","mimeType":"image/jpeg","byteSize":210010},{"mediaKey":"media-key-106301011","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301011.jpg","mimeType":"image/jpeg","byteSize":210011},{"mediaKey":"media-key-106301012","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301012.jpg","mimeType":"image/jpeg","byteSize":210012},{"mediaKey":"media-key-106301013","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-106301013.jpg","mimeType":"image/jpeg","byteSize":210013}],"mediaSignature":"media-signature-10630101"}',
              acceptedAt: new Date('2026-10-14T01:01:01.001Z'),
              startedAt: new Date('2026-10-14T01:01:02.002Z'),
              finishedAt: null,
            },
          },
          mockFetchOutcomeHash: {},
          expected: 'the work of a run failed: MEDIA_LIMIT_EXCEEDED',
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        mockFetchOutcomeHash,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        const aiRunMediaPreparer = AiRunMediaPreparer.create()
        jest.spyOn(aiRunMediaPreparer, 'createAiRunMediaWorkspace')
          .mockReturnValue(/** @type {*} */ ({
            createWorkspace: async () => '/workspace',
            writeMediumFile: async ({
              aiRunMediaId,
            }) => `/workspace/medium-${aiRunMediaId}`,
          }))
        const runner = AssetMediaExtractionRunner.create({
          aiRunMediaPreparer,
        })
        jest.spyOn(AiRunMediaCollector, 'MediaFetchClientCtor', 'get')
          .mockReturnValue(/** @type {*} */ ({
            create: () => ({
              fetchMedium: async ({
                url,
              }) => mockFetchOutcomeHash[url],
            }),
          }))

        const actual = () => runner.runAssetMediaExtraction({
          aiRunId: params.aiRunRow.id,
          signal: AbortSignal.timeout(60000),
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#runAssetMediaExtraction()', () => {
    /*
     * §20: "a video URL among the media is refused with the unsupported reason code, rather than
     * being silently skipped". The request carries a photograph and a recording; the photograph is
     * fetched, and the recording ends the run by name rather than being passed over.
     *
     * That distinction is the whole of [[Q121]]: `ai_run_media_categories.handling_name` says
     * `refuse` for video and `ignore` for audio, and this case and the one two below it are the two
     * endings that word decides.
     */
    describe('should refuse a request carrying a video', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10630102,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10630102',
              requestKey: 'request-key-10630102',
              requestBodyHash: 'request-body-hash-10630102',
              externalRef: 'external-ref-10630102',
              subjectLabel: 'Subject label of run 10630102',
              correlationId: 'correlation-id-10630102',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10630102',
              requestBody: '{"externalRef":"external-ref-10630102","asset":{"categorySlugs":["commercial"],"province":"Lam Dong"},"fieldSchema":[{"path":"attributes.frontageWidth","label":"Frontage width","valueKind":"number","isRequired":false,"unit":"metre"}],"media":[{"mediaKey":"media-key-10630201-photograph","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-10630201-photograph.png","mimeType":"image/png","byteSize":220001},{"mediaKey":"media-key-10630202-recording","mediaCategoryName":"video","url":"https://storage.client.development.invalid/media-key-10630202-recording.mp4","mimeType":"video/mp4","byteSize":220002}],"mediaSignature":"media-signature-10630102"}',
              acceptedAt: new Date('2026-10-14T02:02:01.001Z'),
              startedAt: new Date('2026-10-14T02:02:02.002Z'),
              finishedAt: null,
            },
          },
          mockFetchOutcomeHash: {
            'https://storage.client.development.invalid/media-key-10630201-photograph.png': {
              bytes: Buffer.from('bytes of the photograph of run 10630102'),
              byteSize: 39,
              mimeType: 'image/png',
              failureReasonCode: null,
            },
          },
          expected: 'the work of a run failed: MEDIA_UNSUPPORTED',
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        mockFetchOutcomeHash,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        const aiRunMediaPreparer = AiRunMediaPreparer.create()
        jest.spyOn(aiRunMediaPreparer, 'createAiRunMediaWorkspace')
          .mockReturnValue(/** @type {*} */ ({
            createWorkspace: async () => '/workspace',
            writeMediumFile: async ({
              aiRunMediaId,
            }) => `/workspace/medium-${aiRunMediaId}`,
          }))
        const runner = AssetMediaExtractionRunner.create({
          aiRunMediaPreparer,
        })
        jest.spyOn(AiRunMediaCollector, 'MediaFetchClientCtor', 'get')
          .mockReturnValue(/** @type {*} */ ({
            create: () => ({
              fetchMedium: async ({
                url,
              }) => mockFetchOutcomeHash[url],
            }),
          }))

        const actual = () => runner.runAssetMediaExtraction({
          aiRunId: params.aiRunRow.id,
          signal: AbortSignal.timeout(60000),
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#runAssetMediaExtraction()', () => {
    /*
     * §20: "a request whose media cannot be read at all fails with the unreadable reason code". The
     * one photograph the request carries does not arrive, so there is nothing for a model to read
     * and the run fails rather than succeeding with an empty answer nobody asked for.
     */
    describe('should fail a request whose media could not be read at all', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10630103,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10630103',
              requestKey: 'request-key-10630103',
              requestBodyHash: 'request-body-hash-10630103',
              externalRef: 'external-ref-10630103',
              subjectLabel: 'Subject label of run 10630103',
              correlationId: 'correlation-id-10630103',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10630103',
              requestBody: '{"externalRef":"external-ref-10630103","asset":{"categorySlugs":["land"],"province":"Binh Thuan"},"fieldSchema":[{"path":"attributes.alleyWidth","label":"Alley width","valueKind":"number","isRequired":false,"unit":"metre"}],"media":[{"mediaKey":"media-key-10630301-unreachable","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-10630301-unreachable.jpg","mimeType":"image/jpeg","byteSize":230001}],"mediaSignature":"media-signature-10630103"}',
              acceptedAt: new Date('2026-10-14T03:03:01.001Z'),
              startedAt: new Date('2026-10-14T03:03:02.002Z'),
              finishedAt: null,
            },
          },
          mockFetchOutcomeHash: {
            'https://storage.client.development.invalid/media-key-10630301-unreachable.jpg': {
              bytes: null,
              byteSize: null,
              mimeType: null,
              failureReasonCode: 'MEDIA_FETCH_FAILED',
            },
          },
          expected: 'the work of a run failed: MEDIA_UNREADABLE',
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        mockFetchOutcomeHash,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        const aiRunMediaPreparer = AiRunMediaPreparer.create()
        jest.spyOn(aiRunMediaPreparer, 'createAiRunMediaWorkspace')
          .mockReturnValue(/** @type {*} */ ({
            createWorkspace: async () => '/workspace',
            writeMediumFile: async ({
              aiRunMediaId,
            }) => `/workspace/medium-${aiRunMediaId}`,
          }))
        const runner = AssetMediaExtractionRunner.create({
          aiRunMediaPreparer,
        })
        jest.spyOn(AiRunMediaCollector, 'MediaFetchClientCtor', 'get')
          .mockReturnValue(/** @type {*} */ ({
            create: () => ({
              fetchMedium: async ({
                url,
              }) => mockFetchOutcomeHash[url],
            }),
          }))

        const actual = () => runner.runAssetMediaExtraction({
          aiRunId: params.aiRunRow.id,
          signal: AbortSignal.timeout(60000),
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#runAssetMediaExtraction()', () => {
    /*
     * §20: "audio among the media is ignored". The request carries a photograph and a narration.
     * The run settles rather than being refused, and the narration appears nowhere in what the
     * caller is told: it is not in `unreadableMediaKeys[]`, because an ignored file is not a
     * reading that failed, and it is not a refusal, because a video is one and audio is not.
     *
     * The readings are stood in for and answer nothing. What this case is about is the ending the
     * audio file gets, and a stub driver's answer is drawn from a digest of the request - so a body
     * asserted against it would be asserting the digest. The three empty readings still travel
     * through steps 4, 5 and 6 for real.
     */
    describe('should ignore audio among the media', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10630104,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10630104',
              requestKey: 'request-key-10630104',
              requestBodyHash: 'request-body-hash-10630104',
              externalRef: 'external-ref-10630104',
              subjectLabel: 'Subject label of run 10630104',
              correlationId: 'correlation-id-10630104',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10630104',
              requestBody: '{"externalRef":"external-ref-10630104","asset":{"categorySlugs":["residential"],"province":"Dak Lak"},"fieldSchema":[{"path":"attributes.balconyCount","label":"Balcony count","valueKind":"number","isRequired":false,"unit":"balcony"}],"media":[{"mediaKey":"media-key-10630401-photograph","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-10630401-photograph.jpg","mimeType":"image/jpeg","byteSize":240001},{"mediaKey":"media-key-10630402-narration","mediaCategoryName":"audio","url":"https://storage.client.development.invalid/media-key-10630402-narration.mp3","mimeType":"audio/mpeg","byteSize":240002}],"mediaSignature":"media-signature-10630104"}',
              acceptedAt: new Date('2026-10-14T04:04:01.001Z'),
              startedAt: new Date('2026-10-14T04:04:02.002Z'),
              finishedAt: null,
            },
          },
          mockFetchOutcomeHash: {
            'https://storage.client.development.invalid/media-key-10630401-photograph.jpg': {
              bytes: Buffer.from('bytes of the photograph of run 10630104'),
              byteSize: 39,
              mimeType: 'image/jpeg',
              failureReasonCode: null,
            },
          },
          expected: '{"fields":[],"missingFieldPaths":[],"unreadableMediaKeys":[],"mediaSignature":"media-signature-10630104"}',
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        mockFetchOutcomeHash,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        const aiRunMediaPreparer = AiRunMediaPreparer.create()
        jest.spyOn(aiRunMediaPreparer, 'createAiRunMediaWorkspace')
          .mockReturnValue(/** @type {*} */ ({
            createWorkspace: async () => '/workspace',
            writeMediumFile: async ({
              aiRunMediaId,
            }) => `/workspace/medium-${aiRunMediaId}`,
          }))
        const runner = AssetMediaExtractionRunner.create({
          aiRunMediaPreparer,
          assetMediaReadingFetcher: /** @type {*} */ ({
            fetchAssetMediaReadings: async () => ({
              readings: [
                [],
                [],
                [],
              ],
              totalReadingCount: 3,
            }),
          }),
        })
        jest.spyOn(AiRunMediaCollector, 'MediaFetchClientCtor', 'get')
          .mockReturnValue(/** @type {*} */ ({
            create: () => ({
              fetchMedium: async ({
                url,
              }) => mockFetchOutcomeHash[url],
            }),
          }))

        const actual = await runner.runAssetMediaExtraction({
          aiRunId: params.aiRunRow.id,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#runAssetMediaExtraction()', () => {
    /*
     * §20's first acceptance criterion: "an asset type with no suggestible field returns a
     * successful run with no fields and no model call". The schema this request carries is a date
     * and a file, neither of which a photograph can answer, so step 1 keeps nothing and the run
     * stops there - before the media are fetched as well as before the model is called, which is
     * what §20's own step 1 says: "with nothing left it returns no fields and calls no model".
     *
     * The reading fetcher is handed in so that "no model call" can be asserted rather than
     * described. It is the only stand-in here, and the assertion on it is half the point of the
     * case - the other half being that the run settles rather than failing for a schema it could
     * do nothing with.
     */
    describe('should settle a run whose schema has nothing suggestible in it', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10630105,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10630105',
              requestKey: 'request-key-10630105',
              requestBodyHash: 'request-body-hash-10630105',
              externalRef: 'external-ref-10630105',
              subjectLabel: 'Subject label of run 10630105',
              correlationId: 'correlation-id-10630105',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10630105',
              requestBody: '{"externalRef":"external-ref-10630105","asset":{"categorySlugs":["industrial"],"province":"Gia Lai"},"fieldSchema":[{"path":"attributes.handoverDate","label":"Handover date","valueKind":"date","isRequired":true},{"path":"attributes.blueprintFile","label":"Blueprint","valueKind":"file","isRequired":false}],"media":[{"mediaKey":"media-key-10630501-photograph","mediaCategoryName":"image","url":"https://storage.client.development.invalid/media-key-10630501-photograph.jpg","mimeType":"image/jpeg","byteSize":250001}],"mediaSignature":"media-signature-10630105"}',
              acceptedAt: new Date('2026-10-14T05:05:01.001Z'),
              startedAt: new Date('2026-10-14T05:05:02.002Z'),
              finishedAt: null,
            },
          },
          expected: '{"fields":[],"missingFieldPaths":[],"unreadableMediaKeys":[],"mediaSignature":"media-signature-10630105"}',
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        const assetMediaReadingFetcher = {
          fetchAssetMediaReadings: async () => ({
            readings: [],
            totalReadingCount: 3,
          }),
        }
        const fetchAssetMediaReadingsSpy = jest.spyOn(assetMediaReadingFetcher, 'fetchAssetMediaReadings')
        const runner = AssetMediaExtractionRunner.create({
          assetMediaReadingFetcher: /** @type {*} */ (assetMediaReadingFetcher),
        })

        const actual = await runner.runAssetMediaExtraction({
          aiRunId: params.aiRunRow.id,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toBe(expected)
        expect(fetchAssetMediaReadingsSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
