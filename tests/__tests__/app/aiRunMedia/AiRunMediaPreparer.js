import AiRunStepRecorder from '../../../../app/aiRun/AiRunStepRecorder.js'
import AiRunWorkFailure from '../../../../app/aiRun/AiRunWorkFailure.js'

import AiRunMediaCollector from '../../../../app/aiRunMedia/AiRunMediaCollector.js'
import AiRunMediaDescriptorExtractor from '../../../../app/aiRunMedia/AiRunMediaDescriptorExtractor.js'
import AiRunMediaPreparer from '../../../../app/aiRunMedia/AiRunMediaPreparer.js'
import AiRunMediaProviderUploader from '../../../../app/aiRunMedia/AiRunMediaProviderUploader.js'
import AiRunMediaRecorder from '../../../../app/aiRunMedia/AiRunMediaRecorder.js'
import AiRunMediaWorkspace from '../../../../app/aiRunMedia/AiRunMediaWorkspace.js'

/*
 * The members of the media step that decide rather than write.
 *
 * `#prepareAiRunMedia()` and the four members it calls write the run's media rows, its egress
 * records and its trace row, so they are exercised where a run is - under
 * `tests/_orders/AssetMediaExtraction/AssetMediaExtractionRunner.js`, which drives this class whole
 * five times: refused at the photograph cap, refused at a video, failed on media that could not be
 * read, and settled twice. A second copy of those runs driven through this class directly would
 * assert the same thing twice and go red in two places for one reason.
 *
 * **The five collaborators are asserted in one place rather than in five constructor describes**,
 * for the reason the runner's own file gives: the constructor only assigns, and one `toEqual`
 * against an `objectContaining` of all five says everything a describe per property would say five
 * times over.
 */

describe('AiRunMediaPreparer', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          label: 'a collector carrying a budget of its own',
          params: {
            aiRunMediaCollector: AiRunMediaCollector.create({
              mediaBudgetMilliseconds: 11000,
            }),
          },
        },
        {
          label: 'an extractor reading another field of the body',
          params: {
            aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor.create({
              mediaFieldName: 'attachments',
            }),
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const actual = AiRunMediaPreparer.create(params)

        expect(actual)
          .toBeInstanceOf(AiRunMediaPreparer)
      })
    })

    describe('should keep every collaborator it was handed', () => {
      const cases = [
        {
          params: {
            aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor.create(),
            aiRunMediaRecorder: AiRunMediaRecorder.create(),
            aiRunMediaCollector: AiRunMediaCollector.create({
              mediaBudgetMilliseconds: 11000,
            }),
            aiRunMediaProviderUploader: AiRunMediaProviderUploader.create(),
            aiRunStepRecorder: AiRunStepRecorder.create(),
          },
        },
        {
          params: {
            aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor.create(),
            aiRunMediaRecorder: AiRunMediaRecorder.create(),
            aiRunMediaCollector: AiRunMediaCollector.create({
              mediaBudgetMilliseconds: 22000,
            }),
            aiRunMediaProviderUploader: AiRunMediaProviderUploader.create(),
            aiRunStepRecorder: AiRunStepRecorder.create(),
          },
        },
      ]

      test.each(cases)('mediaBudgetMilliseconds: $params.aiRunMediaCollector.mediaBudgetMilliseconds', ({
        params,
      }) => {
        const expected = expect.objectContaining(params)

        const preparer = AiRunMediaPreparer.create(params)

        expect(preparer)
          .toEqual(expected)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            aiRunMediaDescriptorExtractor: AiRunMediaDescriptorExtractor.create(),
            aiRunMediaRecorder: AiRunMediaRecorder.create(),
            aiRunMediaCollector: AiRunMediaCollector.create({
              mediaBudgetMilliseconds: 33000,
            }),
            aiRunMediaProviderUploader: AiRunMediaProviderUploader.create(),
            aiRunStepRecorder: AiRunStepRecorder.create(),
          },
        },
      ]

      test.each(cases)('mediaBudgetMilliseconds: $params.aiRunMediaCollector.mediaBudgetMilliseconds', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(AiRunMediaPreparer)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })

    /*
     * Called bare, which is how a run's orchestration calls it. Every collaborator builds itself
     * from constants and rows rather than from anything one run knows.
     */
    describe('should use default collaborators', () => {
      test('should build one of each', () => {
        const expected = expect.objectContaining({
          aiRunMediaDescriptorExtractor: expect.any(AiRunMediaDescriptorExtractor),
          aiRunMediaRecorder: expect.any(AiRunMediaRecorder),
          aiRunMediaCollector: expect.any(AiRunMediaCollector),
          aiRunMediaProviderUploader: expect.any(AiRunMediaProviderUploader),
          aiRunStepRecorder: expect.any(AiRunStepRecorder),
        })

        const actual = AiRunMediaPreparer.create()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaPreparer', () => {
  describe('.get:AiRunMediaWorkspaceCtor', () => {
    test('should be fixed value', () => {
      const actual = AiRunMediaPreparer.AiRunMediaWorkspaceCtor

      expect(actual)
        .toBe(AiRunMediaWorkspace) // same reference
    })
  })
})

describe('AiRunMediaPreparer', () => {
  describe('.get:AiRunWorkFailureCtor', () => {
    test('should be fixed value', () => {
      const actual = AiRunMediaPreparer.AiRunWorkFailureCtor

      expect(actual)
        .toBe(AiRunWorkFailure) // same reference
    })
  })
})

describe('AiRunMediaPreparer', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          Ctor: AiRunMediaPreparer,
        },
      },
      {
        params: {
          Ctor: class AlphaAiRunMediaPreparer extends AiRunMediaPreparer {},
        },
      },
    ]

    test.each(cases)('Ctor: $params.Ctor.name', ({
      params,
    }) => {
      const preparer = params.Ctor.create()

      const actual = preparer.Ctor

      expect(actual)
        .toBe(params.Ctor) // same reference
    })
  })
})

describe('AiRunMediaPreparer', () => {
  describe('#createAiRunMediaWorkspace()', () => {
    const cases = [
      {
        params: {
          aiRunId: 10630001,
        },
      },
      {
        params: {
          aiRunId: 10630002,
        },
      },
    ]

    test.each(cases)('aiRunId: $params.aiRunId', ({
      params,
    }) => {
      const preparer = AiRunMediaPreparer.create()

      const actual = preparer.createAiRunMediaWorkspace(params)

      expect(actual)
        .toHaveProperty('aiRunId', params.aiRunId)
    })
  })
})

describe('AiRunMediaPreparer', () => {
  describe('#generateStepReasonCode()', () => {
    /*
     * The step trace writes its reason codes in the lower-case hyphenated form the seeded fixture
     * fixed - `media-unreadable` beside `MEDIA_UNREADABLE` on the run - so the two are derived from
     * one another rather than listed twice. All four codes this step can refuse under are here,
     * because a derivation asserted on one of them would pass on a rule that only worked for one.
     */
    const cases = [
      {
        params: {
          failureReasonCode: 'MEDIA_UNREADABLE',
        },
        expected: 'media-unreadable',
      },
      {
        params: {
          failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
        },
        expected: 'media-limit-exceeded',
      },
      {
        params: {
          failureReasonCode: 'MEDIA_UNSUPPORTED',
        },
        expected: 'media-unsupported',
      },
      {
        params: {
          failureReasonCode: 'MEDIA_FETCH_FAILED',
        },
        expected: 'media-fetch-failed',
      },
    ]

    test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
      params,
      expected,
    }) => {
      const preparer = AiRunMediaPreparer.create()

      const actual = preparer.generateStepReasonCode(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AiRunMediaPreparer', () => {
  describe('#buildPreparedAiRunMedia()', () => {
    /*
     * `sentMediaKeys` is taken from what the request declared and not from what was fetched: the
     * rule it feeds is "a photo that was not among those sent", and a photograph the caller sent
     * and this service failed to read is still one the caller sent. A case here carries a medium
     * that came back unreadable, so a version reading the fetched media instead would drop it.
     */
    const cases = [
      {
        params: {
          attachedFiles: [
            {
              id: 10630011,
              fileUrl: '/workspace/medium-10630011',
              fileType: 'image/jpeg',
            },
          ],
          collectedAiRunMedia: {
            unreadableMediaKeys: [
              'media-key-10630012',
            ],
          },
          mediaDescriptors: [
            {
              mediaKey: 'media-key-10630011',
            },
            {
              mediaKey: 'media-key-10630012',
            },
          ],
        },
        expected: {
          attachedFiles: [
            {
              id: 10630011,
              fileUrl: '/workspace/medium-10630011',
              fileType: 'image/jpeg',
            },
          ],
          sentMediaKeys: [
            'media-key-10630011',
            'media-key-10630012',
          ],
          unreadableMediaKeys: [
            'media-key-10630012',
          ],
        },
      },
      {
        params: {
          attachedFiles: [],
          collectedAiRunMedia: {
            unreadableMediaKeys: [],
          },
          mediaDescriptors: [
            {
              mediaKey: 'media-key-10630021',
            },
          ],
        },
        expected: {
          attachedFiles: [],
          sentMediaKeys: [
            'media-key-10630021',
          ],
          unreadableMediaKeys: [],
        },
      },
    ]

    test.each(cases)('mediaDescriptors[0].mediaKey: $params.mediaDescriptors.0.mediaKey', ({
      params,
      expected,
    }) => {
      const preparer = AiRunMediaPreparer.create()

      const actual = preparer.buildPreparedAiRunMedia(params)

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('AiRunMediaPreparer', () => {
  describe('#buildCurrentInstant()', () => {
    /*
     * The one clock this class reads, and it reads it only for the two instants its own trace row
     * is bounded by. It takes no argument, so what is varied is the instance: a preparer carrying
     * one fetch budget and a preparer carrying another answer the same kind of thing.
     */
    const cases = [
      {
        params: {
          mediaBudgetMilliseconds: 11000,
        },
      },
      {
        params: {
          mediaBudgetMilliseconds: 22000,
        },
      },
    ]

    test.each(cases)('mediaBudgetMilliseconds: $params.mediaBudgetMilliseconds', ({
      params,
    }) => {
      const preparer = AiRunMediaPreparer.create({
        aiRunMediaCollector: AiRunMediaCollector.create(params),
      })

      const actual = preparer.buildCurrentInstant()

      expect(actual)
        .toBeInstanceOf(Date)
    })
  })
})
