import BulkAiModelProcessorsLoader from '../../../../app/tools/BulkAiModelProcessorsLoader.js'

import {
  DeepBulkClassLoader,
} from '@openreachtech/renchan'

import BaseAiModelProcessor from '../../../../app/tools/BaseAiModelProcessor.js'
import FileUrlDeepBulkClassLoader from '../../../../app/tools/FileUrlDeepBulkClassLoader.js'

import {
  rootPath,
} from '../../../../app/globals/_.js'

describe('BulkAiModelProcessorsLoader', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#processorHash', () => {
        const cases = [
          {
            tally: {
              'model-alpha-0001': {
                aiModel: 'model-alpha-0001',
              },
            },
          },
          {
            tally: {
              'model-beta-0002': {
                aiModel: 'model-beta-0002',
              },
              'model-gamma-0003': {
                aiModel: 'model-gamma-0003',
              },
            },
          },
          {
            tally: {},
          },
        ]

        test.each(cases)('processorHash: $tally', ({
          tally,
        }) => {
          const loader = new BulkAiModelProcessorsLoader({
            processorHash: tally,
          })

          expect(loader)
            .toHaveProperty('processorHash', tally)
        })
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            processorHash: {
              'model-alpha-0001': {
                aiModel: 'model-alpha-0001',
              },
            },
          },
        },
        {
          input: {
            processorHash: {
              'model-beta-0002': {
                aiModel: 'model-beta-0002',
              },
            },
          },
        },
      ]

      test.each(cases)('processorHash: $input.processorHash', ({
        input,
      }) => {
        const received = BulkAiModelProcessorsLoader.create(input)

        expect(received)
          .toBeInstanceOf(BulkAiModelProcessorsLoader)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            processorHash: {
              'model-gamma-0003': {
                aiModel: 'model-gamma-0003',
              },
            },
          },
        },
        {
          tally: {
            processorHash: {
              'model-delta-0004': {
                aiModel: 'model-delta-0004',
              },
            },
          },
        },
      ]

      test.each(cases)('processorHash: $tally.processorHash', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(BulkAiModelProcessorsLoader)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.createAsync()', () => {
    describe('should be an instance of own class', () => {
      test('with no arguments', async () => {
        const received = await BulkAiModelProcessorsLoader.createAsync()

        expect(received)
          .toBeInstanceOf(BulkAiModelProcessorsLoader)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.createAsync()', () => {
    describe('should fill default poolPath', () => {
      test('with no arguments', async () => {
        const loadProcessorCtorsSpy = jest.spyOn(BulkAiModelProcessorsLoader, 'loadProcessorCtors')

        await BulkAiModelProcessorsLoader.createAsync()

        expect(loadProcessorCtorsSpy)
          .toHaveBeenCalledWith({
            poolPath: rootPath.to('app/tools/AiModelProcessor/'), // the directory that is the registry
          })
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.get:DeepBulkClassLoaderCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BulkAiModelProcessorsLoader.DeepBulkClassLoaderCtor

        expect(received)
          .toBe(FileUrlDeepBulkClassLoader) // same reference
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.get:BaseAiModelProcessorCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BulkAiModelProcessorsLoader.BaseAiModelProcessorCtor

        expect(received)
          .toBe(BaseAiModelProcessor) // same reference
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.loadProcessorCtors()', () => {
    /*
     * A default installation ships exactly one model — the seeded `stub` row — so the pool holds
     * exactly one processor. The count is the assertion that the filter admits processors and
     * nothing else: a helper class dropped beside them would push it to two.
     */
    describe('should discover the processors the pool holds', () => {
      test('with the pool the processors live in', async () => {
        const args = {
          poolPath: rootPath.to('app/tools/AiModelProcessor/'),
        }

        const received = await BulkAiModelProcessorsLoader.loadProcessorCtors(args)

        expect(received)
          .toHaveLength(1)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.createDeepBulkClassLoader()', () => {
    describe('should be an instance of the class loader', () => {
      const cases = [
        {
          input: {
            poolPath: 'pool-path-0001',
          },
        },
        {
          input: {
            poolPath: 'pool-path-0002',
          },
        },
      ]

      test.each(cases)('poolPath: $input.poolPath', ({
        input,
      }) => {
        const received = BulkAiModelProcessorsLoader.createDeepBulkClassLoader(input)

        expect(received)
          .toBeInstanceOf(FileUrlDeepBulkClassLoader)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.createDeepBulkClassLoader()', () => {
    describe('should hand the pool path to the class loader', () => {
      const cases = [
        {
          input: {
            poolPath: 'pool-path-0003',
          },
          expected: 'pool-path-0003',
        },
        {
          input: {
            poolPath: 'pool-path-0004',
          },
          expected: 'pool-path-0004',
        },
      ]

      test.each(cases)('poolPath: $input.poolPath', ({
        input,
        expected,
      }) => {
        const classLoader = BulkAiModelProcessorsLoader.createDeepBulkClassLoader(input)
        const received = classLoader.poolPath

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.isProcessorCtor()', () => {
    describe('should be truthy', () => {
      describe('when the class derives from the abstract processor', () => {
        class AlphaAiModelProcessor extends BaseAiModelProcessor {}

        class BetaAiModelProcessor extends AlphaAiModelProcessor {}

        const cases = [
          {
            input: {
              Ctor: AlphaAiModelProcessor,
            },
          },
          {
            input: {
              Ctor: BetaAiModelProcessor,
            },
          },
        ]

        test.each(cases)('Ctor: $input.Ctor.name', ({
          input,
        }) => {
          const received = BulkAiModelProcessorsLoader.isProcessorCtor(input)

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.isProcessorCtor()', () => {
    describe('should be falsy', () => {
      describe('when the class does not derive from the abstract processor', () => {
        const cases = [
          {
            input: {
              Ctor: BaseAiModelProcessor, // the abstract base itself is not one of its own processors
            },
          },
          {
            input: {
              Ctor: BulkAiModelProcessorsLoader,
            },
          },
          {
            input: {
              Ctor: DeepBulkClassLoader,
            },
          },
        ]

        test.each(cases)('Ctor: $input.Ctor.name', ({
          input,
        }) => {
          const received = BulkAiModelProcessorsLoader.isProcessorCtor(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.buildProcessorHash()', () => {
    describe('should key every processor by the name it declares', () => {
      const cases = [
        {
          input: {
            processors: [
              {
                aiModel: 'model-alpha-0001',
              },
            ],
          },
          expected: {
            'model-alpha-0001': {
              aiModel: 'model-alpha-0001',
            },
          },
        },
        {
          input: {
            processors: [
              {
                aiModel: 'model-beta-0002',
              },
              {
                aiModel: 'model-gamma-0003',
              },
            ],
          },
          expected: {
            'model-beta-0002': {
              aiModel: 'model-beta-0002',
            },
            'model-gamma-0003': {
              aiModel: 'model-gamma-0003',
            },
          },
        },
        {
          input: {
            processors: [],
          },
          expected: {},
        },
      ]

      test.each(cases)('processors: $input.processors', ({
        input,
        expected,
      }) => {
        const received = BulkAiModelProcessorsLoader.buildProcessorHash(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.buildProcessorHash()', () => {
    /*
     * Two processors claiming one name would leave one of them never reached again, with nothing
     * said about it. It stops start-up instead.
     */
    describe('when two processors claim one name', () => {
      const cases = [
        {
          input: {
            processors: [
              {
                aiModel: 'model-alpha-0001',
              },
              {
                aiModel: 'model-alpha-0001',
              },
            ],
          },
          expected: 'BulkAiModelProcessorsLoader.buildProcessorHash() found two processors claiming the AI model name: model-alpha-0001',
        },
        {
          input: {
            processors: [
              {
                aiModel: 'model-beta-0002',
              },
              {
                aiModel: 'model-gamma-0003',
              },
              {
                aiModel: 'model-beta-0002',
              },
            ],
          },
          expected: 'BulkAiModelProcessorsLoader.buildProcessorHash() found two processors claiming the AI model name: model-beta-0002',
        },
      ]

      test.each(cases)('processors: $input.processors', ({
        input,
        expected,
      }) => {
        const received = () => BulkAiModelProcessorsLoader.buildProcessorHash(input)

        expect(received)
          .toThrow(expected)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.extractAiModelName()', () => {
    describe('should be the name the processor declares', () => {
      const cases = [
        {
          input: {
            processor: {
              aiModel: 'model-alpha-0001',
            },
          },
          expected: 'model-alpha-0001',
        },
        {
          input: {
            processor: {
              aiModel: 'model-beta-0002',
            },
          },
          expected: 'model-beta-0002',
        },
      ]

      test.each(cases)('processor.aiModel: $input.processor.aiModel', ({
        input,
        expected,
      }) => {
        const received = BulkAiModelProcessorsLoader.extractAiModelName(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.extractDuplicatedAiModelName()', () => {
    /*
     * The name answered is the one of the second processor claiming it — the processor that would
     * otherwise overwrite an entry already made — and not simply the first name in the array.
     */
    describe('when one name is claimed more than once', () => {
      const cases = [
        {
          input: {
            aiModelNames: [
              'model-alpha-0001',
              'model-alpha-0001',
            ],
          },
          expected: 'model-alpha-0001',
        },
        {
          input: {
            aiModelNames: [
              'model-beta-0002',
              'model-gamma-0003',
              'model-beta-0002',
            ],
          },
          expected: 'model-beta-0002',
        },
        {
          input: {
            aiModelNames: [
              'model-delta-0004',
              'model-epsilon-0005',
              'model-epsilon-0005',
              'model-delta-0004',
            ],
          },
          expected: 'model-epsilon-0005',
        },
      ]

      test.each(cases)('aiModelNames: $input.aiModelNames', ({
        input,
        expected,
      }) => {
        const received = BulkAiModelProcessorsLoader.extractDuplicatedAiModelName(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.extractDuplicatedAiModelName()', () => {
    describe('when every name is claimed once', () => {
      const cases = [
        {
          input: {
            aiModelNames: [
              'model-zeta-0006',
            ],
          },
        },
        {
          input: {
            aiModelNames: [
              'model-eta-0007',
              'model-theta-0008',
            ],
          },
        },
        {
          input: {
            aiModelNames: [],
          },
        },
      ]

      test.each(cases)('aiModelNames: $input.aiModelNames', ({
        input,
      }) => {
        const received = BulkAiModelProcessorsLoader.extractDuplicatedAiModelName(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.appendProcessorToHash()', () => {
    describe('should key the processor by the name it declares', () => {
      const cases = [
        {
          input: {
            processorHash: {},
            processor: {
              aiModel: 'model-alpha-0001',
            },
          },
          expected: {
            'model-alpha-0001': {
              aiModel: 'model-alpha-0001',
            },
          },
        },
        {
          input: {
            processorHash: {
              'model-beta-0002': {
                aiModel: 'model-beta-0002',
              },
            },
            processor: {
              aiModel: 'model-gamma-0003',
            },
          },
          expected: {
            'model-beta-0002': {
              aiModel: 'model-beta-0002',
            },
            'model-gamma-0003': {
              aiModel: 'model-gamma-0003',
            },
          },
        },
      ]

      test.each(cases)('processor.aiModel: $input.processor.aiModel', ({
        input,
        expected,
      }) => {
        const received = BulkAiModelProcessorsLoader.appendProcessorToHash(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('.appendProcessorToHash()', () => {
    /*
     * The fold this serves hands its accumulator in on every step, so an answer that was the same
     * object would make the fold carry state of its own.
     */
    describe('should answer a hash of its own', () => {
      const cases = [
        {
          input: {
            processorHash: {},
            processor: {
              aiModel: 'model-delta-0004',
            },
          },
        },
        {
          input: {
            processorHash: {
              'model-epsilon-0005': {
                aiModel: 'model-epsilon-0005',
              },
            },
            processor: {
              aiModel: 'model-zeta-0006',
            },
          },
        },
      ]

      test.each(cases)('processor.aiModel: $input.processor.aiModel', ({
        input,
      }) => {
        const received = BulkAiModelProcessorsLoader.appendProcessorToHash(input)

        expect(received)
          .not
          .toBe(input.processorHash) // same reference
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('#resolveProcessor()', () => {
    describe('when a processor claims the name', () => {
      const cases = [
        {
          input: {
            aiModelName: 'model-alpha-0001',
          },
          expected: 'model-alpha-0001',
        },
        {
          input: {
            aiModelName: 'model-beta-0002',
          },
          expected: 'model-beta-0002',
        },
      ]

      test.each(cases)('aiModelName: $input.aiModelName', ({
        input,
        expected,
      }) => {
        const loader = BulkAiModelProcessorsLoader.create({
          processorHash: {
            'model-alpha-0001': {
              aiModel: 'model-alpha-0001',
            },
            'model-beta-0002': {
              aiModel: 'model-beta-0002',
            },
          },
        })

        const processor = loader.resolveProcessor(input)
        const received = processor.aiModel

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('#resolveProcessor()', () => {
    /*
     * A name nothing claims is answered with null, never with the default model. `stub-deterministic`
     * is here because it is the vendor id of the one seeded model: keying on `target_model_name`
     * instead of `name` is the mix-up this case makes visible.
     */
    describe('when no processor claims the name', () => {
      const cases = [
        {
          input: {
            aiModelName: 'model-gamma-0003',
          },
        },
        {
          input: {
            aiModelName: 'stub-deterministic', // AI_MODEL.STUB.TARGET_MODEL_NAME, which is not the key
          },
        },
        {
          input: {
            aiModelName: 'constructor', // a key every plain hash answers, and no processor claims
          },
        },
        {
          input: {
            aiModelName: 'toString', // likewise
          },
        },
        {
          input: {
            aiModelName: '',
          },
        },
      ]

      test.each(cases)('aiModelName: $input.aiModelName', ({
        input,
      }) => {
        const loader = BulkAiModelProcessorsLoader.create({
          processorHash: {
            'model-alpha-0001': {
              aiModel: 'model-alpha-0001',
            },
            'model-beta-0002': {
              aiModel: 'model-beta-0002',
            },
          },
        })

        const received = loader.resolveProcessor(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('#resolveProcessor()', () => {
    describe('when the processors are discovered on disk', () => {
      describe('should resolve a processor for the seeded default model', () => {
        test('aiModelName: stub', async () => {
          const loader = await BulkAiModelProcessorsLoader.createAsync()
          const args = {
            aiModelName: 'stub', // AI_MODEL.STUB.NAME — the seeded row carrying is_default
          }

          const received = loader.resolveProcessor(args)

          expect(received)
            .toBeInstanceOf(BaseAiModelProcessor)
        })
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('#resolveProcessor()', () => {
    describe('when the processors are discovered on disk', () => {
      describe('should resolve the processor declaring that very name', () => {
        test('aiModelName: stub', async () => {
          const loader = await BulkAiModelProcessorsLoader.createAsync()
          const args = {
            aiModelName: 'stub', // AI_MODEL.STUB.NAME — the seeded row carrying is_default
          }

          const stubProcessor = loader.resolveProcessor(args)
          const received = stubProcessor.aiModel

          expect(received)
            .toBe('stub')
        })
      })
    })
  })
})

describe('BulkAiModelProcessorsLoader', () => {
  describe('#resolveProcessor()', () => {
    describe('when the processors are discovered on disk', () => {
      describe('should answer null for a name no processor serves', () => {
        const cases = [
          {
            input: {
              aiModelName: 'claude-sonnet-4-5', // a real vendor model, served by no processor yet
            },
          },
          {
            input: {
              aiModelName: 'stub-deterministic', // AI_MODEL.STUB.TARGET_MODEL_NAME, which is not the key
            },
          },
          {
            input: {
              aiModelName: 'stub-0001', // a misspelling of the seeded name
            },
          },
        ]

        test.each(cases)('aiModelName: $input.aiModelName', async ({
          input,
        }) => {
          const loader = await BulkAiModelProcessorsLoader.createAsync()

          const received = loader.resolveProcessor(input)

          expect(received)
            .toBeNull()
        })
      })
    })
  })
})
