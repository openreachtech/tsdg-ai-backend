import AiRunWorkFailure from '../../../../../app/aiRun/AiRunWorkFailure.js'

import BaseAiRunJobWorker from '../../../../../app/aiRun/jobs/BaseAiRunJobWorker.js'

import AssetMediaExtractionRunner from '../../../../../app/assetMediaExtraction/AssetMediaExtractionRunner.js'

import RunAssetMediaExtractionJobManifest from '../../../../../app/jobs/run-asset-media-extraction/RunAssetMediaExtractionJobManifest.js'
import RunAssetMediaExtractionJobWorker from '../../../../../app/jobs/run-asset-media-extraction/RunAssetMediaExtractionJobWorker.js'

/*
 * The members of the run worker that decide rather than run. `#executeAiRunWork()` hands a run to
 * the runner, which writes the run's media, its step trace and its field outcomes, so it is
 * exercised under `tests/_orders/AssetMediaExtraction/` instead.
 *
 * The engines handed in are plain stubs: this worker never reaches the queue in these cases, and
 * `.create()` asks an engine for two things only - the worker config and the error hash.
 */

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('inheritance', () => {
    /*
     * A run's whole lifecycle - claiming it running, racing it against the 300-second limit,
     * recording exactly one terminal state, raising the terminal callback, removing the workspace
     * - is `BaseAiRunJobWorker`'s, and §11 leaves only the body of work to the service. A worker
     * that did not extend it would be a second implementation of the one thing §11's fifth
     * criterion says there must be exactly one of.
     */
    test('should be correct class', () => {
      const received = RunAssetMediaExtractionJobWorker.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunJobWorker)
    })
  })
})

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = RunAssetMediaExtractionJobWorker.ManifestCtor

        expect(actual)
          .toBe(RunAssetMediaExtractionJobManifest) // same reference
      })
    })
  })
})

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('.get:AssetMediaExtractionRunnerCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = RunAssetMediaExtractionJobWorker.AssetMediaExtractionRunnerCtor

        expect(actual)
          .toBe(AssetMediaExtractionRunner) // same reference
      })
    })
  })
})

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('.get:AiRunWorkFailureCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = RunAssetMediaExtractionJobWorker.AiRunWorkFailureCtor

        expect(actual)
          .toBe(AiRunWorkFailure) // same reference
      })
    })
  })
})

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          Ctor: RunAssetMediaExtractionJobWorker,
        },
      },
      {
        params: {
          Ctor: class AlphaRunAssetMediaExtractionJobWorker extends RunAssetMediaExtractionJobWorker {},
        },
      },
    ]

    test.each(cases)('Ctor: $params.Ctor.name', ({
      params,
    }) => {
      const worker = params.Ctor.create({
        engine: {
          buildWorkerConfig: () => ({
            workersPath: '/alpha/jobs',
            connection: {},
          }),
          Error: {},
        },
      })

      const actual = worker.Ctor

      expect(actual)
        .toBe(params.Ctor) // same reference
    })
  })
})

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('#createAssetMediaExtractionRunner()', () => {
    /*
     * Built per delivery rather than held, because a worker is one long-lived instance per queue
     * and a runner is one run's worth of collaborators. What must not happen per run - the scan of
     * the driver directory - is pooled by `AiAgentModelBindingFinder` against the process.
     */
    describe('should be an instance of AssetMediaExtractionRunner', () => {
      const cases = [
        {
          params: {
            workersPath: '/alpha/jobs',
          },
        },
        {
          params: {
            workersPath: '/beta/jobs',
          },
        },
      ]

      test.each(cases)('workersPath: $params.workersPath', ({
        params,
      }) => {
        const worker = RunAssetMediaExtractionJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: params.workersPath,
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = worker.createAssetMediaExtractionRunner()

        expect(actual)
          .toBeInstanceOf(AssetMediaExtractionRunner)
      })
    })
  })
})

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('#isAiRunWorkFailure()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: {
                maximumMediaCount: 12,
              },
            }),
          },
        },
        {
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_UNREADABLE',
            }),
          },
        },
      ]

      test.each(cases)('failureReasonCode: $params.error.failureReasonCode', ({
        params,
      }) => {
        const worker = RunAssetMediaExtractionJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/gamma/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = worker.isAiRunWorkFailure(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /*
       * A failure nobody classified: a driver that raised, a row that could not be read, and the
       * two throws that carry no class of their own at all. Each has to be told from a run's own
       * refusal, because the reason code the row ends up with differs.
       */
      const cases = [
        {
          label: 'a plain Error',
          params: {
            error: new Error('a driver raised'),
          },
        },
        {
          label: 'a TypeError',
          params: {
            error: new TypeError('a property was read off null'),
          },
        },
        {
          label: 'a thrown string',
          params: {
            error: 'a string nobody wrapped',
          },
        },
        {
          label: 'a thrown null',
          params: {
            error: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const worker = RunAssetMediaExtractionJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/delta/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = worker.isAiRunWorkFailure(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('#extractAiRunFailureReasonCode()', () => {
    /*
     * §20's twelfth, thirteenth and fifteenth acceptance criteria each name a reason code a run
     * fails under - unreadable, unsupported, over the limit - and the step that refuses already
     * decided which. This is where the code that step decided reaches the row, without this class
     * deciding any of them a second time.
     */
    describe('when the run refused itself by name', () => {
      const cases = [
        {
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: {
                maximumMediaCount: 12,
              },
            }),
          },
          expected: 'MEDIA_LIMIT_EXCEEDED',
        },
        {
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_UNSUPPORTED',
              failureParameters: {
                mediaCategoryName: 'video',
              },
            }),
          },
          expected: 'MEDIA_UNSUPPORTED',
        },
        {
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_UNREADABLE',
            }),
          },
          expected: 'MEDIA_UNREADABLE',
        },
        {
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_FETCH_FAILED',
            }),
          },
          expected: 'MEDIA_FETCH_FAILED',
        },
      ]

      test.each(cases)('failureReasonCode: $params.error.failureReasonCode', ({
        params,
        expected,
      }) => {
        const worker = RunAssetMediaExtractionJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/epsilon/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = worker.extractAiRunFailureReasonCode(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('when nothing classified the failure', () => {
      /*
       * The base's answer, which is `PROVIDER_CALL_FAILED` - "the only one of the seven broad
       * enough to be true of a failure nobody has classified", in its own words. A run that fell
       * through to it must still carry one of the seven, because `AiRunStatusRecorder` refuses a
       * failed run naming none.
       */
      const cases = [
        {
          label: 'a plain Error',
          params: {
            error: new Error('a driver raised'),
          },
        },
        {
          label: 'a thrown null',
          params: {
            error: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const worker = RunAssetMediaExtractionJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/zeta/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = worker.extractAiRunFailureReasonCode(params)

        expect(actual)
          .toBe('PROVIDER_CALL_FAILED')
      })
    })
  })
})

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('#extractAiRunFailureParameters()', () => {
    /*
     * §20's fifteenth acceptance criterion: a request carrying more photos than the limit is
     * refused "with the limit named in the reason's parameters". The step that refuses builds
     * them; this is where they are read back off the failure it raised.
     *
     * `BaseAiRunJobWorker#buildAiRunWorkOutcome()` asks this, so what is read back here is what
     * the row records. The base wrote `failureParameters: null` and offered no hook until the
     * checkpoint that needed one added `#extractAiRunFailureParameters()` beside the reason-code
     * hook; the base's own default still answers null, which is right for the six codes whose
     * contract entry names no parameters.
     */
    describe('when the run refused itself by name', () => {
      const cases = [
        {
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: {
                maximumMediaCount: 12,
              },
            }),
          },
          expected: {
            maximumMediaCount: 12,
          },
        },
        {
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_UNSUPPORTED',
              failureParameters: {
                mediaCategoryName: 'video',
                mediaKey: 'media-key-of-the-video',
                isRecognizedMediaCategory: true,
              },
            }),
          },
          expected: {
            mediaCategoryName: 'video',
            mediaKey: 'media-key-of-the-video',
            isRecognizedMediaCategory: true,
          },
        },
      ]

      test.each(cases)('failureReasonCode: $params.error.failureReasonCode', ({
        params,
        expected,
      }) => {
        const worker = RunAssetMediaExtractionJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/eta/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = worker.extractAiRunFailureParameters(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('when the failure names no parameters', () => {
      const cases = [
        {
          label: 'a refusal carrying none',
          params: {
            error: AiRunWorkFailure.create({
              failureReasonCode: 'MEDIA_UNREADABLE',
            }),
          },
        },
        {
          label: 'a plain Error',
          params: {
            error: new Error('a driver raised'),
          },
        },
        {
          label: 'a thrown null',
          params: {
            error: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const worker = RunAssetMediaExtractionJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/theta/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const actual = worker.extractAiRunFailureParameters(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})
