import AiAgentModelBindingFinder from '../../../../app/aiAgent/AiAgentModelBindingFinder.js'

import BulkAiModelProcessorsLoader from '../../../../app/tools/BulkAiModelProcessorsLoader.js'
import StubAiModelProcessor from '../../../../app/tools/AiModelProcessor/StubAiModelProcessor.js'

import AiAgent from '../../../../sequelize/models/AiAgent.js'
import AiAgentDefaultModel from '../../../../sequelize/models/AiAgentDefaultModel.js'
import AiModel from '../../../../sequelize/models/AiModel.js'

/*
 * Which agent an AI service runs as, which model that agent is bound to, and which driver serves
 * that model - one question asked of the rows that answer it.
 *
 * Every case here reads and writes nothing. The agent it reads is the one the master seeder
 * installs (`asset-media-extraction-agent`, bound to the `stub` model), and the agents it reads to
 * get a null are the development fixtures, which carry instructions and tools but deliberately no
 * model binding - `#provider-layer` seeded them to exercise the composing path, not a run.
 */

describe('AiAgentModelBindingFinder', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#bulkAiModelProcessorsLoaderPromise', () => {
        const cases = [
          {
            params: {
              bulkAiModelProcessorsLoaderPromise: Promise.resolve(
                BulkAiModelProcessorsLoader.create({
                  processorHash: {
                    alpha: StubAiModelProcessor.create(),
                  },
                })
              ),
            },
          },
          {
            params: {
              bulkAiModelProcessorsLoaderPromise: Promise.resolve(
                BulkAiModelProcessorsLoader.create({
                  processorHash: {},
                })
              ),
            },
          },
        ]

        test.each(cases)('bulkAiModelProcessorsLoaderPromise: $params.bulkAiModelProcessorsLoaderPromise', ({
          params,
        }) => {
          const finder = new AiAgentModelBindingFinder(params)

          expect(finder)
            .toHaveProperty('bulkAiModelProcessorsLoaderPromise', params.bulkAiModelProcessorsLoaderPromise)
        })
      })
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            bulkAiModelProcessorsLoaderPromise: Promise.resolve(
              BulkAiModelProcessorsLoader.create({
                processorHash: {
                  alpha: StubAiModelProcessor.create(),
                },
              })
            ),
          },
        },
        {
          params: {
            bulkAiModelProcessorsLoaderPromise: Promise.resolve(
              BulkAiModelProcessorsLoader.create({
                processorHash: {},
              })
            ),
          },
        },
      ]

      test.each(cases)('bulkAiModelProcessorsLoaderPromise: $params.bulkAiModelProcessorsLoaderPromise', ({
        params,
      }) => {
        const actual = AiAgentModelBindingFinder.create(params)

        expect(actual)
          .toBeInstanceOf(AiAgentModelBindingFinder)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            bulkAiModelProcessorsLoaderPromise: Promise.resolve(
              BulkAiModelProcessorsLoader.create({
                processorHash: {
                  beta: StubAiModelProcessor.create(),
                },
              })
            ),
          },
        },
        {
          params: {
            bulkAiModelProcessorsLoaderPromise: Promise.resolve(
              BulkAiModelProcessorsLoader.create({
                processorHash: {},
              })
            ),
          },
        },
      ]

      test.each(cases)('bulkAiModelProcessorsLoaderPromise: $params.bulkAiModelProcessorsLoaderPromise', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(AiAgentModelBindingFinder)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })

    /*
     * The scan of the driver directory is what a finder must not start per run, so the default is
     * the pooled promise of it - the same object every time, which is the whole point.
     */
    describe('should use default bulkAiModelProcessorsLoaderPromise value', () => {
      test('should be the pooled promise', () => {
        const expected = AiAgentModelBindingFinder.ensureBulkAiModelProcessorsLoaderPromise()

        const finder = AiAgentModelBindingFinder.create()

        expect(finder)
          .toHaveProperty('bulkAiModelProcessorsLoaderPromise', expected)
      })
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('.ensureBulkAiModelProcessorsLoaderPromise()', () => {
    /*
     * Pooled against the loader class, so two finders built in the same tick share one scan instead
     * of starting two - the property `JobDispatcherProvider`'s own pool exists for.
     */
    test('should answer the same promise twice', () => {
      const expected = AiAgentModelBindingFinder.ensureBulkAiModelProcessorsLoaderPromise()

      const actual = AiAgentModelBindingFinder.ensureBulkAiModelProcessorsLoaderPromise()

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('.get:BulkAiModelProcessorsLoaderCtor', () => {
    test('should be fixed value', () => {
      const actual = AiAgentModelBindingFinder.BulkAiModelProcessorsLoaderCtor

      expect(actual)
        .toBe(BulkAiModelProcessorsLoader) // same reference
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('.get:AiAgentCtor', () => {
    test('should be fixed value', () => {
      const actual = AiAgentModelBindingFinder.AiAgentCtor

      expect(actual)
        .toBe(AiAgent) // same reference
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('.get:AiAgentDefaultModelCtor', () => {
    test('should be fixed value', () => {
      const actual = AiAgentModelBindingFinder.AiAgentDefaultModelCtor

      expect(actual)
        .toBe(AiAgentDefaultModel) // same reference
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('.get:AiModelCtor', () => {
    test('should be fixed value', () => {
      const actual = AiAgentModelBindingFinder.AiModelCtor

      expect(actual)
        .toBe(AiModel) // same reference
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          Ctor: AiAgentModelBindingFinder,
        },
      },
      {
        params: {
          Ctor: class AlphaAiAgentModelBindingFinder extends AiAgentModelBindingFinder {},
        },
      },
    ]

    test.each(cases)('Ctor: $params.Ctor.name', ({
      params,
    }) => {
      const finder = params.Ctor.create()

      const actual = finder.Ctor

      expect(actual)
        .toBe(params.Ctor) // same reference
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('#findAiAgent()', () => {
    describe('should find the seeded agent', () => {
      const cases = [
        {
          params: {
            aiAgentName: 'asset-media-extraction-agent',
          },
          expected: expect.objectContaining({
            id: 10150001,
            name: 'asset-media-extraction-agent',
          }),
        },
        {
          params: {
            aiAgentName: 'alpha-fixture-agent',
          },
          expected: expect.objectContaining({
            id: 10130001,
            name: 'alpha-fixture-agent',
          }),
        },
      ]

      test.each(cases)('aiAgentName: $params.aiAgentName', async ({
        params,
        expected,
      }) => {
        const finder = AiAgentModelBindingFinder.create()

        const actual = await finder.findAiAgent(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should be null', () => {
      const cases = [
        {
          params: {
            aiAgentName: 'asset-media-extraction',
          },
        },
        {
          params: {
            aiAgentName: 'no-such-agent-anywhere',
          },
        },
      ]

      test.each(cases)('aiAgentName: $params.aiAgentName', async ({
        params,
      }) => {
        const finder = AiAgentModelBindingFinder.create()

        const actual = await finder.findAiAgent(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('#extractAiModel()', () => {
    describe('should extract the bound model', () => {
      const cases = [
        {
          params: {
            aiAgent: {
              AiAgentDefaultModel: {
                AiModel: {
                  id: 10110001,
                  name: 'stub',
                  AiProviderId: 10100001,
                },
              },
            },
          },
          expected: {
            id: 10110001,
            name: 'stub',
            AiProviderId: 10100001,
          },
        },
        {
          params: {
            aiAgent: {
              AiAgentDefaultModel: {
                AiModel: {
                  id: 10110002,
                  name: 'alpha-model',
                  AiProviderId: 10100002,
                },
              },
            },
          },
          expected: {
            id: 10110002,
            name: 'alpha-model',
            AiProviderId: 10100002,
          },
        },
      ]

      test.each(cases)('name: $params.aiAgent.AiAgentDefaultModel.AiModel.name', ({
        params,
        expected,
      }) => {
        const finder = AiAgentModelBindingFinder.create()

        const actual = finder.extractAiModel(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should be null', () => {
      /*
       * An agent nobody bound a model to, and a binding whose model row has gone. Both are the
       * same answer to a caller - there is no model to call - and neither is a defect this class
       * may raise on.
       */
      const cases = [
        {
          label: 'an agent with no binding',
          params: {
            aiAgent: {
              id: 10130001,
            },
          },
        },
        {
          label: 'a binding with no model',
          params: {
            aiAgent: {
              id: 10130002,
              AiAgentDefaultModel: {
                AiModelId: 10110009,
              },
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const finder = AiAgentModelBindingFinder.create()

        const actual = finder.extractAiModel(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('#resolveAiModelProcessor()', () => {
    describe('should resolve the driver serving the model', () => {
      const cases = [
        {
          params: {
            aiModel: {
              name: 'stub',
            },
          },
        },
      ]

      test.each(cases)('name: $params.aiModel.name', async ({
        params,
      }) => {
        const finder = AiAgentModelBindingFinder.create()

        const actual = await finder.resolveAiModelProcessor(params)

        expect(actual)
          .toBeInstanceOf(StubAiModelProcessor)
      })
    })

    describe('should be null', () => {
      /*
       * A name nothing claims is answered null and never fallen back to the default model, which
       * is the loader's own rule: a run answered by a model nobody asked for would say so only in
       * hindsight.
       */
      const cases = [
        {
          params: {
            aiModel: {
              name: 'stub-deterministic',
            },
          },
        },
        {
          params: {
            aiModel: {
              name: 'no-such-model-anywhere',
            },
          },
        },
      ]

      test.each(cases)('name: $params.aiModel.name', async ({
        params,
      }) => {
        const finder = AiAgentModelBindingFinder.create()

        const actual = await finder.resolveAiModelProcessor(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('#buildAiAgentModelBinding()', () => {
    const cases = [
      {
        params: {
          aiAgent: {
            id: 10150001,
          },
          aiModel: {
            id: 10110001,
            AiProviderId: 10100001,
          },
          aiModelProcessor: {
            aiModel: 'stub',
          },
        },
        expected: {
          aiAgent: {
            id: 10150001,
          },
          aiModelId: 10110001,
          aiProviderId: 10100001,
          aiModelProcessor: {
            aiModel: 'stub',
          },
        },
      },
      {
        params: {
          aiAgent: {
            id: 10150002,
          },
          aiModel: {
            id: 10110002,
            AiProviderId: 10100002,
          },
          aiModelProcessor: {
            aiModel: 'alpha-model',
          },
        },
        expected: {
          aiAgent: {
            id: 10150002,
          },
          aiModelId: 10110002,
          aiProviderId: 10100002,
          aiModelProcessor: {
            aiModel: 'alpha-model',
          },
        },
      },
    ]

    test.each(cases)('aiModelId: $params.aiModel.id', ({
      params,
      expected,
    }) => {
      const finder = AiAgentModelBindingFinder.create()

      const actual = finder.buildAiAgentModelBinding(params)

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('AiAgentModelBindingFinder', () => {
  describe('#findAiAgentModelBinding()', () => {
    /*
     * The one lookup a run makes. The seeded agent resolves to the seeded stub model and the driver
     * that claims its name - which is what makes a run executable at all on a default installation,
     * with no key read and no outbound connection opened.
     */
    describe('should answer the whole binding', () => {
      const cases = [
        {
          params: {
            aiAgentName: 'asset-media-extraction-agent',
          },
          expected: {
            aiAgent: expect.objectContaining({
              id: 10150001,
              name: 'asset-media-extraction-agent',
            }),
            aiModelId: 10110001,
            aiProviderId: 10100001,
            aiModelProcessor: expect.any(StubAiModelProcessor),
          },
        },
      ]

      test.each(cases)('aiAgentName: $params.aiAgentName', async ({
        params,
        expected,
      }) => {
        const finder = AiAgentModelBindingFinder.create()

        const actual = await finder.findAiAgentModelBinding(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should be null', () => {
      /*
       * An agent nobody seeded, and an agent seeded with no model bound to it. Both leave a run
       * with nothing to call, and both are answered rather than raised here - the run decides what
       * to do about it.
       */
      const cases = [
        {
          params: {
            aiAgentName: 'no-such-agent-anywhere',
          },
        },
        {
          params: {
            aiAgentName: 'alpha-fixture-agent',
          },
        },
      ]

      test.each(cases)('aiAgentName: $params.aiAgentName', async ({
        params,
      }) => {
        const finder = AiAgentModelBindingFinder.create()

        const actual = await finder.findAiAgentModelBinding(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})
