import AiAgentModelBindingFinder from '../../../../app/aiAgent/AiAgentModelBindingFinder.js'
import AiAgentPromptComposer from '../../../../app/aiAgent/AiAgentPromptComposer.js'

import AiRunFieldOutcomeRecorder from '../../../../app/aiRun/AiRunFieldOutcomeRecorder.js'
import AiRunStepRecorder from '../../../../app/aiRun/AiRunStepRecorder.js'

import AiRunMediaDescriptorExtractor from '../../../../app/aiRunMedia/AiRunMediaDescriptorExtractor.js'
import AiRunMediaPreparer from '../../../../app/aiRunMedia/AiRunMediaPreparer.js'

import AssetFieldConfidenceScorer from '../../../../app/assetMediaExtraction/AssetFieldConfidenceScorer.js'
import AssetFieldReadingInspector from '../../../../app/assetMediaExtraction/AssetFieldReadingInspector.js'
import AssetMediaExtractionResultBuilder from '../../../../app/assetMediaExtraction/AssetMediaExtractionResultBuilder.js'
import AssetMediaExtractionRunner from '../../../../app/assetMediaExtraction/AssetMediaExtractionRunner.js'
import AssetMediaReadingFetcher from '../../../../app/assetMediaExtraction/AssetMediaReadingFetcher.js'
import FieldConsensusResolver from '../../../../app/assetMediaExtraction/FieldConsensusResolver.js'
import SuggestibleFieldSelector from '../../../../app/assetMediaExtraction/SuggestibleFieldSelector.js'

import AiRun from '../../../../sequelize/models/AiRun.js'

/*
 * The members of the run's orchestration that decide rather than write. `#runAssetMediaExtraction()`
 * and every step method it calls write the run's media rows, its step trace and its field outcomes,
 * so they are exercised under `tests/_orders/AssetMediaExtraction/` instead.
 *
 * **The nine collaborators are asserted in one place rather than in nine constructor describes.**
 * The constructor only assigns, and `.create()` is the only caller in the repository; what has to
 * hold is that every collaborator handed to the factory reaches the instance under its own name,
 * and one `toEqual` against an `objectContaining` of all nine says exactly that. A describe per
 * property would say the same thing nine times over, in nine copies of the same nine-field
 * argument.
 *
 * **The media step's own members are not here any more.** `#generateStepReasonCode()`,
 * `#createAiRunMediaWorkspace()` and what is now `#buildPreparedAiRunMedia()` moved with the four
 * collaborators they belong to, and are exercised under
 * `tests/__tests__/app/aiRunMedia/AiRunMediaPreparer.js`.
 */

describe('AssetMediaExtractionRunner', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          label: 'a binding finder of its own',
          params: {
            aiAgentModelBindingFinder: AiAgentModelBindingFinder.create(),
          },
        },
        {
          label: 'a scorer carrying another formula version',
          params: {
            assetFieldConfidenceScorer: AssetFieldConfidenceScorer.create({
              confidenceMethodVersion: 'confidence-v9.9.9',
            }),
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const actual = AssetMediaExtractionRunner.create(params)

        expect(actual)
          .toBeInstanceOf(AssetMediaExtractionRunner)
      })
    })

    describe('should keep every collaborator it was handed', () => {
      const cases = [
        {
          params: {
            aiAgentModelBindingFinder: AiAgentModelBindingFinder.create(),
            suggestibleFieldSelector: SuggestibleFieldSelector.create(),
            aiRunMediaPreparer: AiRunMediaPreparer.create(),
            assetMediaReadingFetcher: AssetMediaReadingFetcher.create({
              readingCount: 3,
            }),
            assetFieldReadingInspector: AssetFieldReadingInspector.create(),
            fieldConsensusResolver: FieldConsensusResolver.create(),
            assetFieldConfidenceScorer: AssetFieldConfidenceScorer.create({
              confidenceMethodVersion: 'confidence-v1.1.1',
            }),
            aiRunStepRecorder: AiRunStepRecorder.create(),
            aiRunFieldOutcomeRecorder: AiRunFieldOutcomeRecorder.create(),
          },
        },
        {
          params: {
            aiAgentModelBindingFinder: AiAgentModelBindingFinder.create(),
            suggestibleFieldSelector: SuggestibleFieldSelector.create(),
            aiRunMediaPreparer: AiRunMediaPreparer.create(),
            assetMediaReadingFetcher: AssetMediaReadingFetcher.create({
              readingCount: 5,
            }),
            assetFieldReadingInspector: AssetFieldReadingInspector.create(),
            fieldConsensusResolver: FieldConsensusResolver.create(),
            assetFieldConfidenceScorer: AssetFieldConfidenceScorer.create({
              confidenceMethodVersion: 'confidence-v2.2.2',
            }),
            aiRunStepRecorder: AiRunStepRecorder.create(),
            aiRunFieldOutcomeRecorder: AiRunFieldOutcomeRecorder.create(),
          },
        },
      ]

      test.each(cases)('readingCount: $params.assetMediaReadingFetcher.readingCount', ({
        params,
      }) => {
        const expected = expect.objectContaining(params)

        const runner = AssetMediaExtractionRunner.create(params)

        expect(runner)
          .toEqual(expected)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            aiAgentModelBindingFinder: AiAgentModelBindingFinder.create(),
            suggestibleFieldSelector: SuggestibleFieldSelector.create(),
            aiRunMediaPreparer: AiRunMediaPreparer.create(),
            assetMediaReadingFetcher: AssetMediaReadingFetcher.create({
              readingCount: 7,
            }),
            assetFieldReadingInspector: AssetFieldReadingInspector.create(),
            fieldConsensusResolver: FieldConsensusResolver.create(),
            assetFieldConfidenceScorer: AssetFieldConfidenceScorer.create(),
            aiRunStepRecorder: AiRunStepRecorder.create(),
            aiRunFieldOutcomeRecorder: AiRunFieldOutcomeRecorder.create(),
          },
        },
      ]

      test.each(cases)('readingCount: $params.assetMediaReadingFetcher.readingCount', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(AssetMediaExtractionRunner)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })

    /*
     * Called bare, which is how the worker calls it once per delivery. Every collaborator builds
     * itself from constants and rows rather than from anything one run knows, so there is nothing
     * for a caller to supply - and the driver scan behind the binding finder is pooled against the
     * process rather than started here.
     */
    describe('should use default collaborators', () => {
      test('should build one of each', () => {
        const expected = expect.objectContaining({
          aiAgentModelBindingFinder: expect.any(AiAgentModelBindingFinder),
          suggestibleFieldSelector: expect.any(SuggestibleFieldSelector),
          aiRunMediaPreparer: expect.any(AiRunMediaPreparer),
          assetMediaReadingFetcher: expect.any(AssetMediaReadingFetcher),
          assetFieldReadingInspector: expect.any(AssetFieldReadingInspector),
          fieldConsensusResolver: expect.any(FieldConsensusResolver),
          assetFieldConfidenceScorer: expect.any(AssetFieldConfidenceScorer),
          aiRunStepRecorder: expect.any(AiRunStepRecorder),
          aiRunFieldOutcomeRecorder: expect.any(AiRunFieldOutcomeRecorder),
        })

        const actual = AssetMediaExtractionRunner.create()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('.get:AiRunModelCtor', () => {
    test('should be fixed value', () => {
      const actual = AssetMediaExtractionRunner.AiRunModelCtor

      expect(actual)
        .toBe(AiRun) // same reference
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('.get:AiAgentPromptComposerCtor', () => {
    test('should be fixed value', () => {
      const actual = AssetMediaExtractionRunner.AiAgentPromptComposerCtor

      expect(actual)
        .toBe(AiAgentPromptComposer) // same reference
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('.get:AiRunMediaDescriptorExtractorCtor', () => {
    test('should be fixed value', () => {
      const actual = AssetMediaExtractionRunner.AiRunMediaDescriptorExtractorCtor

      expect(actual)
        .toBe(AiRunMediaDescriptorExtractor) // same reference
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('.get:AssetMediaExtractionResultBuilderCtor', () => {
    test('should be fixed value', () => {
      const actual = AssetMediaExtractionRunner.AssetMediaExtractionResultBuilderCtor

      expect(actual)
        .toBe(AssetMediaExtractionResultBuilder) // same reference
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('.get:aiAgentName', () => {
    /*
     * The agent's name is the service's name with `-agent` appended, deliberately, so that a
     * lookup which confused an agent with a run category finds nothing instead of finding the
     * wrong row. A runner naming the category here would resolve no agent at all.
     */
    test('should be fixed value', () => {
      const actual = AssetMediaExtractionRunner.aiAgentName

      expect(actual)
        .toBe('asset-media-extraction-agent')
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          Ctor: AssetMediaExtractionRunner,
        },
      },
      {
        params: {
          Ctor: class AlphaAssetMediaExtractionRunner extends AssetMediaExtractionRunner {},
        },
      },
    ]

    test.each(cases)('Ctor: $params.Ctor.name', ({
      params,
    }) => {
      const runner = params.Ctor.create()

      const actual = runner.Ctor

      expect(actual)
        .toBe(params.Ctor) // same reference
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#buildParsedRequestBody()', () => {
    describe('should read the body the run was accepted with', () => {
      const cases = [
        {
          params: {
            aiRun: {
              requestBody: '{"mediaSignature":"media-signature-alpha","fieldSchema":[{"path":"attributes.floorCount","valueKind":"number"}]}',
            },
          },
          expected: {
            mediaSignature: 'media-signature-alpha',
            fieldSchema: [
              {
                path: 'attributes.floorCount',
                valueKind: 'number',
              },
            ],
          },
        },
        {
          params: {
            aiRun: {
              requestBody: '{"mediaSignature":"media-signature-beta","media":[]}',
            },
          },
          expected: {
            mediaSignature: 'media-signature-beta',
            media: [],
          },
        },
      ]

      test.each(cases)('requestBody: $params.aiRun.requestBody', ({
        params,
        expected,
      }) => {
        const runner = AssetMediaExtractionRunner.create()

        const actual = runner.buildParsedRequestBody(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should be null', () => {
      /*
       * A run accepted with no body, and a body that is not the JSON the column claims. Both are
       * the same answer here and both raise one statement later, by name - a run whose subject
       * cannot be read is not a run this service may quietly succeed at.
       */
      const cases = [
        {
          label: 'no body at all',
          params: {
            aiRun: {
              requestBody: null,
            },
          },
        },
        {
          label: 'text that is not JSON',
          params: {
            aiRun: {
              requestBody: 'not-json-at-all',
            },
          },
        },
        {
          label: 'JSON that is an array',
          params: {
            aiRun: {
              requestBody: '[1,2,3]',
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const runner = AssetMediaExtractionRunner.create()

        const actual = runner.buildParsedRequestBody(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#createAiRunMediaDescriptorExtractor()', () => {
    /*
     * Built where it is used rather than held. One member of this class reads the request body, and
     * a reader looking through what a run's orchestration holds should find its steps there rather
     * than a parser among them - which is also what keeps the factory's collaborator count at what
     * a run actually has steps for.
     */
    const cases = [
      {
        params: {
          confidenceMethodVersion: 'confidence-v1.1.1',
        },
      },
      {
        params: {
          confidenceMethodVersion: 'confidence-v2.2.2',
        },
      },
    ]

    test.each(cases)('confidenceMethodVersion: $params.confidenceMethodVersion', ({
      params,
    }) => {
      const runner = AssetMediaExtractionRunner.create({
        assetFieldConfidenceScorer: AssetFieldConfidenceScorer.create(params),
      })

      const actual = runner.createAiRunMediaDescriptorExtractor()

      expect(actual)
        .toBeInstanceOf(AiRunMediaDescriptorExtractor)
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#createAssetMediaExtractionResultBuilder()', () => {
    /*
     * The signature is echoed back "so a caller can tell which request an answer belongs to", and
     * a body that carried none echoes null rather than an empty string - which is that builder's
     * own rule, asserted here through the property it keeps.
     */
    const cases = [
      {
        params: {
          requestBody: {
            mediaSignature: 'media-signature-alpha',
          },
        },
        expected: 'media-signature-alpha',
      },
      {
        params: {
          requestBody: {
            mediaSignature: 'media-signature-beta',
          },
        },
        expected: 'media-signature-beta',
      },
      {
        params: {
          requestBody: {},
        },
        expected: null,
      },
    ]

    test.each(cases)('mediaSignature: $params.requestBody.mediaSignature', ({
      params,
      expected,
    }) => {
      const runner = AssetMediaExtractionRunner.create()

      const actual = runner.createAssetMediaExtractionResultBuilder(params)

      expect(actual)
        .toHaveProperty('mediaSignature', expected)
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#createAiAgentPromptComposer()', () => {
    const cases = [
      {
        params: {
          aiAgentModelBinding: {
            aiAgent: {
              id: 10150001,
            },
          },
        },
      },
      {
        params: {
          aiAgentModelBinding: {
            aiAgent: {
              id: 10130001,
            },
          },
        },
      },
    ]

    test.each(cases)('aiAgentId: $params.aiAgentModelBinding.aiAgent.id', ({
      params,
    }) => {
      const runner = AssetMediaExtractionRunner.create()

      const actual = runner.createAiAgentPromptComposer(params)

      expect(actual)
        .toHaveProperty('aiAgentId', params.aiAgentModelBinding.aiAgent.id)
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#extractSuggestibleFieldSchemaOutcomeCode()', () => {
    /*
     * §20's first acceptance criterion is the run whose asset type has nothing suggestible in it.
     * Recording that run's step 1 as `fields-kept` would make it indistinguishable in the trace
     * from a run that kept everything, which is the one thing that criterion is about.
     */
    const cases = [
      {
        params: {
          fieldSchema: [],
        },
        expected: 'no-fields-kept',
      },
      {
        params: {
          fieldSchema: [
            {
              path: 'attributes.floorCount',
            },
          ],
        },
        expected: 'fields-kept',
      },
      {
        params: {
          fieldSchema: [
            {
              path: 'attributes.floorArea',
            },
            {
              path: 'attributes.bedroomCount',
            },
          ],
        },
        expected: 'fields-kept',
      },
    ]

    test.each(cases)('fieldSchema.length: $params.fieldSchema.length', ({
      params,
      expected,
    }) => {
      const runner = AssetMediaExtractionRunner.create()

      const actual = runner.extractSuggestibleFieldSchemaOutcomeCode(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#generateUnsuggestibleResultBody()', () => {
    /*
     * A success carrying nothing: no fields, no missing paths - a field that could never have been
     * read is not a field the photographs failed to show - and no unreadable media, because
     * nothing was fetched. The signature is still echoed, because the caller still has to tell
     * which request this answer belongs to.
     */
    const cases = [
      {
        params: {
          assetMediaExtractionResultBuilder: AssetMediaExtractionResultBuilder.create({
            mediaSignature: 'media-signature-alpha',
          }),
        },
        expected: '{"fields":[],"missingFieldPaths":[],"unreadableMediaKeys":[],"mediaSignature":"media-signature-alpha"}',
      },
      {
        params: {
          assetMediaExtractionResultBuilder: AssetMediaExtractionResultBuilder.create({
            mediaSignature: 'media-signature-beta',
          }),
        },
        expected: '{"fields":[],"missingFieldPaths":[],"unreadableMediaKeys":[],"mediaSignature":"media-signature-beta"}',
      },
    ]

    test.each(cases)('mediaSignature: $params.assetMediaExtractionResultBuilder.mediaSignature', ({
      params,
      expected,
    }) => {
      const runner = AssetMediaExtractionRunner.create()

      const actual = runner.generateUnsuggestibleResultBody(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#extractResolvedFieldConsensusReasonCode()', () => {
    const cases = [
      {
        params: {
          resolvedFieldConsensus: {
            rejections: [],
          },
        },
        expected: null,
      },
      {
        params: {
          resolvedFieldConsensus: {
            rejections: [
              {
                fieldPath: 'attributes.buildYear',
                reasonCode: 'no-absolute-majority',
                figures: {
                  agreedReadingCount: 1,
                  totalReadingCount: 3,
                },
              },
            ],
          },
        },
        expected: 'majority-not-reached-for-some-fields',
      },
    ]

    test.each(cases)('rejections.length: $params.resolvedFieldConsensus.rejections.length', ({
      params,
      expected,
    }) => {
      const runner = AssetMediaExtractionRunner.create()

      const actual = runner.extractResolvedFieldConsensusReasonCode(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#extractAgreedReadingCount()', () => {
    /*
     * The count the majority step recorded against the same path, so the rejection in
     * `ai_run_steps.rejections` and the `missing` field outcome beside it agree. A required path no
     * reading answered at all carries no rejection, and nought is the truthful count for it.
     */
    const cases = [
      {
        params: {
          fieldPath: 'attributes.buildYear',
          rejections: [
            {
              fieldPath: 'attributes.buildYear',
              reasonCode: 'no-absolute-majority',
              figures: {
                agreedReadingCount: 2,
                totalReadingCount: 5,
              },
            },
          ],
        },
        expected: 2,
      },
      {
        params: {
          fieldPath: 'attributes.balconyDirectionSlug',
          rejections: [
            {
              fieldPath: 'attributes.buildYear',
              reasonCode: 'no-absolute-majority',
              figures: {
                agreedReadingCount: 2,
                totalReadingCount: 5,
              },
            },
            {
              fieldPath: 'attributes.balconyDirectionSlug',
              reasonCode: 'no-absolute-majority',
              figures: {
                agreedReadingCount: 1,
                totalReadingCount: 3,
              },
            },
          ],
        },
        expected: 1,
      },
      {
        params: {
          fieldPath: 'attributes.neverAnswered',
          rejections: [],
        },
        expected: 0,
      },
    ]

    test.each(cases)('fieldPath: $params.fieldPath', ({
      params,
      expected,
    }) => {
      const runner = AssetMediaExtractionRunner.create()

      const actual = runner.extractAgreedReadingCount(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AssetMediaExtractionRunner', () => {
  describe('#buildCurrentInstant()', () => {
    /*
     * The one clock this class reads, and it reads it only for the instants it records itself -
     * every instant the run's row is settled by is `BaseAiRunJobWorker`'s. It takes no argument, so
     * what is varied is the instance: a runner carrying one formula version and a runner carrying
     * another answer the same kind of thing.
     */
    const cases = [
      {
        params: {
          confidenceMethodVersion: 'confidence-v1.1.1',
        },
      },
      {
        params: {
          confidenceMethodVersion: 'confidence-v2.2.2',
        },
      },
    ]

    test.each(cases)('confidenceMethodVersion: $params.confidenceMethodVersion', ({
      params,
    }) => {
      const runner = AssetMediaExtractionRunner.create({
        assetFieldConfidenceScorer: AssetFieldConfidenceScorer.create(params),
      })

      const actual = runner.buildCurrentInstant()

      expect(actual)
        .toBeInstanceOf(Date)
    })
  })
})
