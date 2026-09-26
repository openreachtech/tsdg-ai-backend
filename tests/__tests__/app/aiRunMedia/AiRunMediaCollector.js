import AiRunMediaCollector from '../../../../app/aiRunMedia/AiRunMediaCollector.js'

import AiRunMediaCategoryInspector from '../../../../app/aiRunMedia/AiRunMediaCategoryInspector.js'
import AiRunMediaDescriptorExtractor from '../../../../app/aiRunMedia/AiRunMediaDescriptorExtractor.js'
import AiRunMediaLimitInspector from '../../../../app/aiRunMedia/AiRunMediaLimitInspector.js'
import AiRunMediaRecorder from '../../../../app/aiRunMedia/AiRunMediaRecorder.js'
import MediaFetchClient from '../../../../app/aiRunMedia/MediaFetchClient.js'

/*
 * The parts of step 2 of specs/1.0.0 §20 that write nothing. Four acceptance criteria sit here:
 *
 *   - "a video URL among the media is refused with the unsupported reason code, rather than being
 *     silently skipped"
 *   - "audio among the media is ignored"
 *   - "a request carrying more photos than the limit is refused, with the limit named in the
 *     reason's parameters"
 *   - "a request whose media cannot be read at all fails with the unreadable reason code"
 *
 * The first two are the halves of [[Q121]], and they are asserted as two different answers to one
 * question rather than as two spellings of one: the video case carries a reason code and refuses
 * the collection, and the audio case carries none and leaves nothing on any list a caller reads.
 *
 * The budget arithmetic is [[Q125]]'s answer, and it is exercised as arithmetic - the sequential
 * rationing that ties it to real fetches is in `tests/_orders/`, because that path writes rows.
 *
 * The kind ids are the seeded master's: 1 image, 2 video, 3 audio.
 */

describe('AiRunMediaCollector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#mediaBudgetMilliseconds', () => {
        const cases = [
          {
            params: {
              aiRunMediaCategoryInspector: AiRunMediaCategoryInspector.create(),
              aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor.create(),
              aiRunMediaLimitInspector: AiRunMediaLimitInspector.create(),
              aiRunMediaRecorder: AiRunMediaRecorder.create(),
              mediaBudgetMilliseconds: 150000,
              mediumTimeoutMilliseconds: 30000,
            },
            expected: 150000,
          },
          {
            params: {
              aiRunMediaCategoryInspector: AiRunMediaCategoryInspector.create(),
              aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor.create(),
              aiRunMediaLimitInspector: AiRunMediaLimitInspector.create(),
              aiRunMediaRecorder: AiRunMediaRecorder.create(),
              mediaBudgetMilliseconds: 4000,
              mediumTimeoutMilliseconds: 1000,
            },
            expected: 4000,
          },
        ]

        test.each(cases)('budget: $params.mediaBudgetMilliseconds', ({
          params,
          expected,
        }) => {
          const collector = new AiRunMediaCollector(params)

          expect(collector)
            .toHaveProperty('mediaBudgetMilliseconds', expected)
        })
      })

      describe('#mediumTimeoutMilliseconds', () => {
        const cases = [
          {
            params: {
              aiRunMediaCategoryInspector: AiRunMediaCategoryInspector.create(),
              aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor.create(),
              aiRunMediaLimitInspector: AiRunMediaLimitInspector.create(),
              aiRunMediaRecorder: AiRunMediaRecorder.create(),
              mediaBudgetMilliseconds: 150000,
              mediumTimeoutMilliseconds: 30000,
            },
            expected: 30000,
          },
          {
            params: {
              aiRunMediaCategoryInspector: AiRunMediaCategoryInspector.create(),
              aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor.create(),
              aiRunMediaLimitInspector: AiRunMediaLimitInspector.create(),
              aiRunMediaRecorder: AiRunMediaRecorder.create(),
              mediaBudgetMilliseconds: 4000,
              mediumTimeoutMilliseconds: 1000,
            },
            expected: 1000,
          },
        ]

        test.each(cases)('perMedium: $params.mediumTimeoutMilliseconds', ({
          params,
          expected,
        }) => {
          const collector = new AiRunMediaCollector(params)

          expect(collector)
            .toHaveProperty('mediumTimeoutMilliseconds', expected)
        })
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            mediaBudgetMilliseconds: 150000,
          },
        },
        {
          params: {
            mediaBudgetMilliseconds: 4000,
          },
        },
      ]

      test.each(cases)('budget: $params.mediaBudgetMilliseconds', ({
        params,
      }) => {
        const actual = AiRunMediaCollector.create(params)

        expect(actual)
          .toBeInstanceOf(AiRunMediaCollector)
      })
    })

    /*
     * The two figures [[Q125]] settles, asserted where they are decided: half the run's 300000 ms
     * limit for the whole step, and 30000 ms as the most any one fetch may be given. A silent
     * change to either is a silent change to how a slow storage host ends a run.
     */
    describe('should fill default value', () => {
      test('with no arguments', () => {
        const expected = expect.objectContaining({
          mediaBudgetMilliseconds: 150000,
          mediumTimeoutMilliseconds: 30000,
        })

        const SpyClass = constructorSpy.spyOn(AiRunMediaCollector)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('.get:MediaFetchClientCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunMediaCollector.MediaFetchClientCtor

        expect(actual)
          .toBe(MediaFetchClient) // same reference
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('.get:DateCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunMediaCollector.DateCtor

        expect(actual)
          .toBe(Date) // same reference
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#generateFetchAllowanceMilliseconds()', () => {
    /*
     * The heart of [[Q125]]. A fetch is given the lesser of the per-fetch ceiling and what is left,
     * so twelve stalled media fill the budget after five of them instead of overrunning the run by
     * sixty seconds. A budget already spent gives nothing, which is what stops the sixth fetch from
     * being made at all.
     */
    describe('should give a fetch the lesser of the ceiling and what is left', () => {
      const cases = [
        {
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            budgetRemainingMilliseconds: 150000,
          },
          expected: 30000,
        },
        {
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            budgetRemainingMilliseconds: 30000,
          },
          expected: 30000,
        },
        {
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            budgetRemainingMilliseconds: 12000,
          },
          expected: 12000,
        },
        {
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            budgetRemainingMilliseconds: 0,
          },
          expected: 0,
        },
        {
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            budgetRemainingMilliseconds: -5000,
          },
          expected: 0,
        },
      ]

      test.each(cases)('left: $params.budgetRemainingMilliseconds', ({
        factoryParams,
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create(factoryParams)

        const actual = collector.generateFetchAllowanceMilliseconds(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#generateBudgetRemainingMilliseconds()', () => {
    describe('should take what a medium spent off what is left', () => {
      const cases = [
        {
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            budgetRemainingMilliseconds: 150000,
            startedAt: new Date('2026-09-26T01:00:00.000Z'),
            finishedAt: new Date('2026-09-26T01:00:30.000Z'),
          },
          expected: 120000,
        },
        {
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            budgetRemainingMilliseconds: 20000,
            startedAt: new Date('2026-09-26T02:00:00.000Z'),
            finishedAt: new Date('2026-09-26T02:00:30.000Z'),
          },
          expected: 0,
        },
        {
          // a clock that stepped backwards must not hand the next medium more budget than there is
          factoryParams: {
            mediaBudgetMilliseconds: 150000,
            mediumTimeoutMilliseconds: 30000,
          },
          params: {
            budgetRemainingMilliseconds: 90000,
            startedAt: new Date('2026-09-26T03:00:10.000Z'),
            finishedAt: new Date('2026-09-26T03:00:00.000Z'),
          },
          expected: 90000,
        },
      ]

      test.each(cases)('started: $params.startedAt', ({
        factoryParams,
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create(factoryParams)

        const actual = collector.generateBudgetRemainingMilliseconds(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#shouldCollectMedium()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          params: {
            collection: {
              mediumOutcomes: [],
              budgetRemainingMilliseconds: 150000,
              refusal: null,
            },
            signal: AbortSignal.timeout(60000),
          },
        },
        {
          params: {
            collection: {
              mediumOutcomes: [],
              budgetRemainingMilliseconds: 1000,
              refusal: null,
            },
            signal: AbortSignal.timeout(60000),
          },
        },
      ]

      test.each(cases)('left: $params.collection.budgetRemainingMilliseconds', ({
        params,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.shouldCollectMedium(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * [[Q113]]: a run told its time is up fetches nothing more. The raised signal is the one the
     * base worker raises when the time limit wins, and a refusal already recorded stops the rest
     * for the other reason - the run is over either way.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          params: {
            collection: {
              mediumOutcomes: [],
              budgetRemainingMilliseconds: 150000,
              refusal: null,
            },
            signal: AbortSignal.abort(),
          },
        },
        {
          params: {
            collection: {
              mediumOutcomes: [],
              budgetRemainingMilliseconds: 120000,
              refusal: {
                failureReasonCode: 'MEDIA_UNSUPPORTED',
                failureParameters: null,
              },
            },
            signal: AbortSignal.timeout(60000),
          },
        },
      ]

      test.each(cases)('left: $params.collection.budgetRemainingMilliseconds', ({
        params,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.shouldCollectMedium(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#extractMediumHandlingName()', () => {
    /*
     * [[Q121]] settled: three kinds, three different words. A class that collapsed refuse and
     * ignore back into one boolean fails here.
     */
    describe('should answer what this version does with the kind', () => {
      const cases = [
        {
          params: {
            aiRunMediaRow: {
              id: 10610401,
              mediaKey: 'media-key-10610401',
              AiRunMediaCategoryId: 1, // AI_RUN_MEDIA_CATEGORY.IMAGE.ID
            },
          },
          expected: 'handle',
        },
        {
          params: {
            aiRunMediaRow: {
              id: 10610402,
              mediaKey: 'media-key-10610402',
              AiRunMediaCategoryId: 2, // AI_RUN_MEDIA_CATEGORY.VIDEO.ID
            },
          },
          expected: 'refuse',
        },
        {
          params: {
            aiRunMediaRow: {
              id: 10610403,
              mediaKey: 'media-key-10610403',
              AiRunMediaCategoryId: 3, // AI_RUN_MEDIA_CATEGORY.AUDIO.ID
            },
          },
          expected: 'ignore',
        },
      ]

      test.each(cases)('mediaKey: $params.aiRunMediaRow.mediaKey', ({
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.extractMediumHandlingName(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#extractMediumHandlingName()', () => {
    describe('should be null', () => {
      const cases = [
        {
          params: {
            aiRunMediaRow: {
              id: 10610404,
              mediaKey: 'media-key-10610404',
              AiRunMediaCategoryId: 9001,
            },
          },
        },
        {
          params: {
            aiRunMediaRow: {
              id: 10610405,
              mediaKey: 'media-key-10610405',
              AiRunMediaCategoryId: null,
            },
          },
        },
      ]

      test.each(cases)('mediaKey: $params.aiRunMediaRow.mediaKey', ({
        params,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.extractMediumHandlingName(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#collectMedium()', () => {
    /*
     * "A video URL among the media is refused with the unsupported reason code, rather than being
     * silently skipped", and "audio among the media is ignored". Two kinds, two different endings,
     * out of one hash lookup. An unrecognized kind joins the video rather than the audio, and is
     * told apart from it in the parameters.
     */
    describe('should refuse a kind this version does not read', () => {
      const cases = [
        {
          params: {
            requestBody: {
              media: [],
            },
            aiRunMediaRow: {
              id: 10610411,
              mediaKey: 'media-key-10610411',
              AiRunMediaCategoryId: 2, // AI_RUN_MEDIA_CATEGORY.VIDEO.ID
              byteSize: 981234,
            },
            aiRunMediaWorkspace: null,
            signal: AbortSignal.timeout(60000),
            budgetRemainingMilliseconds: 150000,
          },
          expected: {
            aiRunMediaId: 10610411,
            mediaKey: 'media-key-10610411',
            handlingName: 'refuse',
            isReadable: false,
            filePath: null,
            mimeType: null,
            refusal: {
              failureReasonCode: 'MEDIA_UNSUPPORTED',
              failureParameters: {
                mediaKey: 'media-key-10610411',
                mediaCategoryName: 'video',
                isRecognizedMediaCategory: true,
              },
            },
          },
        },
        {
          params: {
            requestBody: {
              media: [],
            },
            aiRunMediaRow: {
              id: 10610412,
              mediaKey: 'media-key-10610412',
              AiRunMediaCategoryId: 9002,
              byteSize: 12345,
            },
            aiRunMediaWorkspace: null,
            signal: AbortSignal.timeout(60000),
            budgetRemainingMilliseconds: 150000,
          },
          expected: {
            aiRunMediaId: 10610412,
            mediaKey: 'media-key-10610412',
            handlingName: 'refuse',
            isReadable: false,
            filePath: null,
            mimeType: null,
            refusal: {
              failureReasonCode: 'MEDIA_UNSUPPORTED',
              failureParameters: {
                mediaKey: 'media-key-10610412',
                mediaCategoryName: null,
                isRecognizedMediaCategory: false,
              },
            },
          },
        },
      ]

      test.each(cases)('mediaKey: $params.aiRunMediaRow.mediaKey', async ({
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = await collector.collectMedium(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#collectMedium()', () => {
    describe('should ignore a kind this version neither reads nor refuses', () => {
      const cases = [
        {
          params: {
            requestBody: {
              media: [],
            },
            aiRunMediaRow: {
              id: 10610421,
              mediaKey: 'media-key-10610421',
              AiRunMediaCategoryId: 3, // AI_RUN_MEDIA_CATEGORY.AUDIO.ID
              byteSize: 442211,
            },
            aiRunMediaWorkspace: null,
            signal: AbortSignal.timeout(60000),
            budgetRemainingMilliseconds: 150000,
          },
          expected: {
            aiRunMediaId: 10610421,
            mediaKey: 'media-key-10610421',
            handlingName: 'ignore',
            isReadable: false,
            filePath: null,
            mimeType: null,
            refusal: null, // nothing is refused, and nothing is said to the caller
          },
        },
        {
          params: {
            requestBody: {
              media: [],
            },
            aiRunMediaRow: {
              id: 10610422,
              mediaKey: 'media-key-10610422',
              AiRunMediaCategoryId: 3, // AI_RUN_MEDIA_CATEGORY.AUDIO.ID
              byteSize: 99887766, // far over the per-file cap, and never even weighed
            },
            aiRunMediaWorkspace: null,
            signal: AbortSignal.timeout(60000),
            budgetRemainingMilliseconds: 150000,
          },
          expected: {
            aiRunMediaId: 10610422,
            mediaKey: 'media-key-10610422',
            handlingName: 'ignore',
            isReadable: false,
            filePath: null,
            mimeType: null,
            refusal: null,
          },
        },
      ]

      test.each(cases)('mediaKey: $params.aiRunMediaRow.mediaKey', async ({
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = await collector.collectMedium(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#buildMediaCountRefusal()', () => {
    /*
     * "A request carrying more photos than the limit is refused, with the limit named in the
     * reason's parameters." Both figures travel: the limit as it stands, and what the request
     * declared against it.
     */
    describe('should name the limit a request went past', () => {
      const cases = [
        {
          factoryParams: {
            aiRunMediaLimitInspector: AiRunMediaLimitInspector.create({
              maximumByteSize: 10485760,
              maximumMediaCount: 12,
            }),
          },
          params: {
            aiRunMedia: [
              {
                id: 10610501,
                mediaKey: 'media-key-10610501',
              },
              {
                id: 10610502,
                mediaKey: 'media-key-10610502',
              },
              {
                id: 10610503,
                mediaKey: 'media-key-10610503',
              },
              {
                id: 10610504,
                mediaKey: 'media-key-10610504',
              },
              {
                id: 10610505,
                mediaKey: 'media-key-10610505',
              },
              {
                id: 10610506,
                mediaKey: 'media-key-10610506',
              },
              {
                id: 10610507,
                mediaKey: 'media-key-10610507',
              },
              {
                id: 10610508,
                mediaKey: 'media-key-10610508',
              },
              {
                id: 10610509,
                mediaKey: 'media-key-10610509',
              },
              {
                id: 10610510,
                mediaKey: 'media-key-10610510',
              },
              {
                id: 10610511,
                mediaKey: 'media-key-10610511',
              },
              {
                id: 10610512,
                mediaKey: 'media-key-10610512',
              },
              {
                id: 10610513,
                mediaKey: 'media-key-10610513',
              },
            ],
          },
          expected: {
            failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
            failureParameters: {
              limitName: 'mediaCount',
              limitValue: 12,
              declaredValue: 13,
            },
          },
        },
        {
          factoryParams: {
            aiRunMediaLimitInspector: AiRunMediaLimitInspector.create({
              maximumByteSize: 10485760,
              maximumMediaCount: 2,
            }),
          },
          params: {
            aiRunMedia: [
              {
                id: 10610521,
                mediaKey: 'media-key-10610521',
              },
              {
                id: 10610522,
                mediaKey: 'media-key-10610522',
              },
              {
                id: 10610523,
                mediaKey: 'media-key-10610523',
              },
            ],
          },
          expected: {
            failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
            failureParameters: {
              limitName: 'mediaCount',
              limitValue: 2,
              declaredValue: 3,
            },
          },
        },
      ]

      test.each(cases)('first key: $params.aiRunMedia.0.mediaKey', ({
        factoryParams,
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create(factoryParams)

        const actual = collector.buildMediaCountRefusal(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#buildMediaCountRefusal()', () => {
    describe('should be null', () => {
      const cases = [
        {
          params: {
            aiRunMedia: [
              {
                id: 10610531,
                mediaKey: 'media-key-10610531',
              },
            ],
          },
        },
        {
          // exactly at the cap, which separates `<` from `<=`
          params: {
            aiRunMedia: [
              {
                id: 10610541,
                mediaKey: 'media-key-10610541',
              },
              {
                id: 10610542,
                mediaKey: 'media-key-10610542',
              },
              {
                id: 10610543,
                mediaKey: 'media-key-10610543',
              },
              {
                id: 10610544,
                mediaKey: 'media-key-10610544',
              },
              {
                id: 10610545,
                mediaKey: 'media-key-10610545',
              },
              {
                id: 10610546,
                mediaKey: 'media-key-10610546',
              },
              {
                id: 10610547,
                mediaKey: 'media-key-10610547',
              },
              {
                id: 10610548,
                mediaKey: 'media-key-10610548',
              },
              {
                id: 10610549,
                mediaKey: 'media-key-10610549',
              },
              {
                id: 10610550,
                mediaKey: 'media-key-10610550',
              },
              {
                id: 10610551,
                mediaKey: 'media-key-10610551',
              },
              {
                id: 10610552,
                mediaKey: 'media-key-10610552',
              },
            ],
          },
        },
      ]

      test.each(cases)('first key: $params.aiRunMedia.0.mediaKey', ({
        params,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.buildMediaCountRefusal(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#buildByteSizeRefusal()', () => {
    describe('should name the size limit a file went past', () => {
      const cases = [
        {
          params: {
            aiRunMediaRow: {
              id: 10610551,
              mediaKey: 'media-key-10610551',
              AiRunMediaCategoryId: 1,
              byteSize: 10485761, // one byte past the cap
            },
          },
          expected: {
            failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
            failureParameters: {
              limitName: 'mediaByteSize',
              limitValue: 10485760,
              declaredValue: 10485761,
              mediaKey: 'media-key-10610551',
            },
          },
        },
        {
          params: {
            aiRunMediaRow: {
              id: 10610552,
              mediaKey: 'media-key-10610552',
              AiRunMediaCategoryId: 1,
              byteSize: '20971521', // a BIGINT that arrived as text
            },
          },
          expected: {
            failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
            failureParameters: {
              limitName: 'mediaByteSize',
              limitValue: 10485760,
              declaredValue: 20971521,
              mediaKey: 'media-key-10610552',
            },
          },
        },
      ]

      test.each(cases)('mediaKey: $params.aiRunMediaRow.mediaKey', ({
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.buildByteSizeRefusal(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#buildByteSizeRefusal()', () => {
    describe('should be null', () => {
      const cases = [
        {
          // exactly at the cap
          params: {
            aiRunMediaRow: {
              id: 10610561,
              mediaKey: 'media-key-10610561',
              AiRunMediaCategoryId: 1,
              byteSize: 10485760,
            },
          },
        },
        {
          params: {
            aiRunMediaRow: {
              id: 10610562,
              mediaKey: 'media-key-10610562',
              AiRunMediaCategoryId: 1,
              byteSize: 214733,
            },
          },
        },
      ]

      test.each(cases)('mediaKey: $params.aiRunMediaRow.mediaKey', ({
        params,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.buildByteSizeRefusal(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#storeFetchedMedium()', () => {
    /*
     * [[Q113]], and the finding `#media-fetch`'s checkpoint 7 recorded against
     * `AiRunMediaWorkspace`: a run past its time limit has had its workspace removed already, and
     * `#writeMediumFile()` creates the directory again on its way to writing. So the signal is
     * asked immediately before the write, and a raised one means nothing is written at all - which
     * is asserted on the spy rather than only on the answer.
     */
    describe('when the run has been told its time is up', () => {
      const cases = [
        {
          params: {
            aiRunMediaRow: {
              id: 10610571,
              mediaKey: 'media-key-10610571',
            },
            fetchOutcome: {
              bytes: Buffer.from('bytes of medium 10610571'),
              byteSize: 24,
              mimeType: 'image/jpeg',
              failureReasonCode: null,
            },
            signal: AbortSignal.abort(),
          },
        },
        {
          params: {
            aiRunMediaRow: {
              id: 10610572,
              mediaKey: 'media-key-10610572',
            },
            fetchOutcome: {
              bytes: Buffer.from('bytes of medium 10610572'),
              byteSize: 24,
              mimeType: 'image/png',
              failureReasonCode: null,
            },
            signal: AbortSignal.abort(),
          },
        },
      ]

      test.each(cases)('mediaKey: $params.aiRunMediaRow.mediaKey', async ({
        params,
      }) => {
        const collector = AiRunMediaCollector.create()

        const aiRunMediaWorkspace = {
          /**
           * Write nothing, and record that it was asked.
           *
           * @returns {Promise<string>} The path.
           */
          writeMediumFile: async () => '/nowhere/medium-10610570',
        }
        const writeMediumFileSpy = jest.spyOn(aiRunMediaWorkspace, 'writeMediumFile')

        const actual = await collector.storeFetchedMedium({
          aiRunMediaRow: params.aiRunMediaRow,
          aiRunMediaWorkspace,
          fetchOutcome: params.fetchOutcome,
          signal: params.signal,
        })

        expect(actual)
          .toBeNull()
        expect(writeMediumFileSpy)
          .not
          .toHaveBeenCalled()
      })
    })

    describe('when the run is still within its time limit', () => {
      const cases = [
        {
          params: {
            aiRunMediaRow: {
              id: 10610573,
              mediaKey: 'media-key-10610573',
            },
            fetchOutcome: {
              bytes: Buffer.from('bytes of medium 10610573'),
              byteSize: 24,
              mimeType: 'image/jpeg',
              failureReasonCode: null,
            },
            signal: AbortSignal.timeout(60000),
          },
          expected: '/workspace/medium-10610573',
        },
        {
          params: {
            aiRunMediaRow: {
              id: 10610574,
              mediaKey: 'media-key-10610574',
            },
            fetchOutcome: {
              bytes: Buffer.from('bytes of medium 10610574'),
              byteSize: 24,
              mimeType: 'image/png',
              failureReasonCode: null,
            },
            signal: AbortSignal.timeout(60000),
          },
          expected: '/workspace/medium-10610574',
        },
      ]

      test.each(cases)('mediaKey: $params.aiRunMediaRow.mediaKey', async ({
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create()

        const aiRunMediaWorkspace = {
          /**
           * Answer the path the copy went to.
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
        const writeMediumFileSpy = jest.spyOn(aiRunMediaWorkspace, 'writeMediumFile')

        const actual = await collector.storeFetchedMedium({
          aiRunMediaRow: params.aiRunMediaRow,
          aiRunMediaWorkspace,
          fetchOutcome: params.fetchOutcome,
          signal: params.signal,
        })

        expect(actual)
          .toBe(expected)
        expect(writeMediumFileSpy)
          .toHaveBeenCalledWith({
            aiRunMediaId: params.aiRunMediaRow.id,
            bytes: params.fetchOutcome.bytes,
          })
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#buildUnreadableRefusal()', () => {
    /*
     * "A request whose media cannot be read at all fails with the unreadable reason code." It is
     * asked of the media this version reads: a request of one photograph and one audio file whose
     * photograph failed has nothing to read, and the audio file is not a reading that succeeded.
     */
    describe('should refuse a run that read nothing', () => {
      const cases = [
        {
          params: {
            mediumOutcomes: [
              {
                aiRunMediaId: 10610581,
                mediaKey: 'media-key-10610581',
                handlingName: 'handle',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
            ],
          },
          expected: {
            failureReasonCode: 'MEDIA_UNREADABLE',
            failureParameters: null,
          },
        },
        {
          params: {
            mediumOutcomes: [
              {
                aiRunMediaId: 10610582,
                mediaKey: 'media-key-10610582',
                handlingName: 'handle',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
              {
                aiRunMediaId: 10610583,
                mediaKey: 'media-key-10610583',
                handlingName: 'ignore',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
            ],
          },
          expected: {
            failureReasonCode: 'MEDIA_UNREADABLE',
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('first key: $params.mediumOutcomes.0.mediaKey', ({
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.buildUnreadableRefusal(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#buildUnreadableRefusal()', () => {
    describe('should be null', () => {
      const cases = [
        {
          params: {
            mediumOutcomes: [
              {
                aiRunMediaId: 10610591,
                mediaKey: 'media-key-10610591',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/medium-10610591',
                mimeType: 'image/jpeg',
                refusal: null,
              },
              {
                aiRunMediaId: 10610592,
                mediaKey: 'media-key-10610592',
                handlingName: 'handle',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
            ],
          },
        },
        {
          // a request of audio alone had nothing to read, which is not the same as reading nothing
          params: {
            mediumOutcomes: [
              {
                aiRunMediaId: 10610593,
                mediaKey: 'media-key-10610593',
                handlingName: 'ignore',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
            ],
          },
        },
      ]

      test.each(cases)('first key: $params.mediumOutcomes.0.mediaKey', ({
        params,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.buildUnreadableRefusal(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#extractUnreadableMediaKeys()', () => {
    /*
     * An ignored medium is not an unreadable one: the caller is told nothing about it, which is the
     * difference between "ignored" and "refused" that [[Q121]] exists for.
     */
    describe('should name the media that were meant to be read and were not', () => {
      const cases = [
        {
          params: {
            mediumOutcomes: [
              {
                aiRunMediaId: 10610601,
                mediaKey: 'media-key-10610601',
                handlingName: 'handle',
                isReadable: true,
                filePath: '/workspace/medium-10610601',
                mimeType: 'image/jpeg',
                refusal: null,
              },
              {
                aiRunMediaId: 10610602,
                mediaKey: 'media-key-10610602',
                handlingName: 'handle',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
              {
                aiRunMediaId: 10610603,
                mediaKey: 'media-key-10610603',
                handlingName: 'ignore',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
            ],
          },
          expected: [
            'media-key-10610602',
          ],
        },
        {
          params: {
            mediumOutcomes: [
              {
                aiRunMediaId: 10610604,
                mediaKey: 'media-key-10610604',
                handlingName: 'handle',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
              {
                aiRunMediaId: 10610605,
                mediaKey: 'media-key-10610605',
                handlingName: 'handle',
                isReadable: false,
                filePath: null,
                mimeType: null,
                refusal: null,
              },
            ],
          },
          expected: [
            'media-key-10610604',
            'media-key-10610605',
          ],
        },
      ]

      test.each(cases)('first key: $params.mediumOutcomes.0.mediaKey', ({
        params,
        expected,
      }) => {
        const collector = AiRunMediaCollector.create()

        const actual = collector.extractUnreadableMediaKeys(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaCollector', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          CollectorCtor: AiRunMediaCollector,
        },
      },
      {
        params: {
          CollectorCtor: class ExtendedAiRunMediaCollector extends AiRunMediaCollector {},
        },
      },
    ]

    test.each(cases)('class: $params.CollectorCtor.name', ({
      params,
    }) => {
      const collector = params.CollectorCtor.create()

      const actual = collector.Ctor

      expect(actual)
        .toBe(params.CollectorCtor) // same reference
    })
  })
})
