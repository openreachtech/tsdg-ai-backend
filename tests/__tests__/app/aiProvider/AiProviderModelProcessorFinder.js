import AiProviderModelProcessorFinder from '../../../../app/aiProvider/AiProviderModelProcessorFinder.js'

import BulkAiModelProcessorsLoader from '../../../../app/tools/BulkAiModelProcessorsLoader.js'
import Gemini2_5FlashAiModelProcessor from '../../../../app/tools/AiModelProcessor/Gemini2_5FlashAiModelProcessor.js'
import StubAiModelProcessor from '../../../../app/tools/AiModelProcessor/StubAiModelProcessor.js'

import AiModel from '../../../../sequelize/models/AiModel.js'

/*
 * Which driver speaks to a given provider (specs/1.0.0, #retention).
 *
 * The rows are the seeded catalog and nothing here writes: provider 10100001 is the stub and its
 * one model is `stub`; provider 11100001 is the first real vendor and its one model is
 * `gemini-2-5-flash`. Both are exercised, because a finder that answered the same driver whatever
 * it was asked would pass against either one alone - and answering the wrong driver is precisely
 * the failure that would have the purge stamp copies as deleted that are still sitting at a vendor.
 *
 * Nothing in this file calls a vendor. Resolving a driver builds no client, reads no key and opens
 * no connection; the driver's own delete member is never invoked.
 */

/*
 * The driver scan is settled here rather than left to whichever case happens to start it.
 *
 * `BulkAiModelProcessorsLoader.createAsync()` walks the driver directory with a chain of dynamic
 * `import()` calls, and jest answers an `import()` issued while it sits between two tests with a
 * ReferenceError reading "You are trying to 'import' a file outside of the scope of the test
 * code". What the pool holds is the promise unawaited - the production design, and the property
 * `.ensureBulkAiModelProcessorsLoaderPromise()` is tested for - so a case that starts the scan
 * without awaiting it leaves the chain running across the gap that follows, and a single link
 * landing in that gap rejects the pooled promise for every case that awaits it afterwards. Which
 * link lands where is the runner's timing, which is why this file passes on its own and went red
 * only under a loaded run.
 *
 * A hook counts as test code to jest, so awaiting the scan here runs every one of those imports
 * where they are allowed, once, before the first case - and every case after it is handed a promise
 * that has already answered.
 */
beforeAll(async () => {
  await AiProviderModelProcessorFinder.ensureBulkAiModelProcessorsLoaderPromise()
})

describe('AiProviderModelProcessorFinder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#bulkAiModelProcessorsLoaderPromise', () => {
        const cases = [
          {
            tally: {
              bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0001'),
            },
          },
          {
            tally: {
              bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0002'),
            },
          },
        ]

        test.each(cases)('$#', ({
          tally,
        }) => {
          const finder = new AiProviderModelProcessorFinder(tally)

          expect(finder)
            .toHaveProperty('bulkAiModelProcessorsLoaderPromise', tally.bulkAiModelProcessorsLoaderPromise)
        })
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0001'),
          },
        },
        {
          input: {
            bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0002'),
          },
        },
      ]

      test.each(cases)('$#', ({
        input,
      }) => {
        const received = AiProviderModelProcessorFinder.create(input)

        expect(received)
          .toBeInstanceOf(AiProviderModelProcessorFinder)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0001'),
          },
        },
        {
          tally: {
            bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0002'),
          },
        },
      ]

      test.each(cases)('$#', ({
        tally,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(AiProviderModelProcessorFinder)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('.create()', () => {
    /*
     * Built with no argument is how the purger builds one, so the default is the shape that
     * actually runs. It is the pooled scan rather than a fresh one - a finder built per sweep that
     * started its own directory scan would import every processor file again for every sweep.
     */
    describe('should fill default bulkAiModelProcessorsLoaderPromise', () => {
      test('with no arguments', () => {
        const expected = {
          bulkAiModelProcessorsLoaderPromise: AiProviderModelProcessorFinder.ensureBulkAiModelProcessorsLoaderPromise(),
        }

        const SpyClass = globalThis.constructorSpy.spyOn(AiProviderModelProcessorFinder)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('.bulkAiModelProcessorsLoaderPromisePool', () => {
    describe('when called as is', () => {
      test('should be a WeakMap', () => {
        const received = AiProviderModelProcessorFinder.bulkAiModelProcessorsLoaderPromisePool

        expect(received)
          .toBeInstanceOf(WeakMap)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('.ensureBulkAiModelProcessorsLoaderPromise()', () => {
    /*
     * One scan per class, and the promise rather than its value - two finders built in the same
     * tick share one scan only if what is pooled is the unawaited promise.
     */
    describe('should be memoized', () => {
      const cases = [
        {
          input: {
            Ctor: AiProviderModelProcessorFinder,
          },
        },
        {
          input: {
            Ctor: class DerivedAiProviderModelProcessorFinder extends AiProviderModelProcessorFinder {},
          },
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
      }) => {
        const expected = input.Ctor.ensureBulkAiModelProcessorsLoaderPromise()

        const received = input.Ctor.ensureBulkAiModelProcessorsLoaderPromise()

        expect(received)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('.get:BulkAiModelProcessorsLoaderCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiProviderModelProcessorFinder.BulkAiModelProcessorsLoaderCtor

        expect(received)
          .toBe(BulkAiModelProcessorsLoader) // same reference
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('.get:AiModelCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiProviderModelProcessorFinder.AiModelCtor

        expect(received)
          .toBe(AiModel) // same reference
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('#get:Ctor', () => {
    describe('should be the class the finder was built from', () => {
      const cases = [
        {
          input: {
            Ctor: AiProviderModelProcessorFinder,
          },
        },
        {
          input: {
            Ctor: class DerivedAiProviderModelProcessorFinder extends AiProviderModelProcessorFinder {},
          },
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
      }) => {
        const finder = input.Ctor.create()

        const received = finder.Ctor

        expect(received)
          .toBe(input.Ctor) // same reference
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('#findAiModels()', () => {
    /*
     * Both seeded providers, because a query that ignored `AiProviderId` would answer both catalog
     * rows to either question and would pass against one provider alone. Only the id and the name
     * are read: the name is the whole of what the driver lookup takes.
     */
    describe('when a provider carries models', () => {
      const cases = [
        {
          input: {
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
          },
          expected: [
            expect.objectContaining({
              id: 10110001,
              name: 'stub',
            }),
          ],
        },
        {
          input: {
            aiProviderId: 11100001, // AI_PROVIDER.GEMINI.ID
          },
          expected: [
            expect.objectContaining({
              id: 11110001,
              name: 'gemini-2-5-flash',
            }),
          ],
        },
      ]

      test.each(cases)('aiProviderId: $input.aiProviderId', async ({
        input,
        expected,
      }) => {
        const finder = AiProviderModelProcessorFinder.create()

        const received = await finder.findAiModels(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('#findAiModels()', () => {
    /*
     * A provider the catalog carries no model for. It answers an empty set rather than raising,
     * because a vendor that was turned off and had its model rows removed is an ordinary state - and
     * the caller has to be able to say "there is no way to reach this provider" rather than fault.
     */
    describe('when a provider carries no model', () => {
      const cases = [
        {
          input: {
            aiProviderId: 99900001, // A provider the catalog does not carry
          },
        },
        {
          input: {
            aiProviderId: 99900002, // A provider the catalog does not carry
          },
        },
      ]

      test.each(cases)('aiProviderId: $input.aiProviderId', async ({
        input,
      }) => {
        const finder = AiProviderModelProcessorFinder.create()

        const received = await finder.findAiModels(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('#resolveAiModelProcessors()', () => {
    /*
     * One entry per model row, null included and in the order the rows came, so the choice made
     * afterwards is over a list a reader can line up against them.
     */
    describe('should answer one driver per model name', () => {
      const cases = [
        {
          input: {
            aiModels: [
              {
                name: 'stub',
              },
            ],
          },
          expected: [
            expect.any(StubAiModelProcessor),
          ],
        },
        {
          input: {
            aiModels: [
              {
                name: 'gemini-2-5-flash',
              },
              {
                name: 'stub',
              },
            ],
          },
          expected: [
            expect.any(Gemini2_5FlashAiModelProcessor),
            expect.any(StubAiModelProcessor),
          ],
        },
        {
          input: {
            aiModels: [
              {
                name: 'model-no-driver-claims-0001',
              },
              {
                name: 'stub',
              },
            ],
          },
          expected: [
            null,
            expect.any(StubAiModelProcessor),
          ],
        },
      ]

      test.each(cases)('aiModels[0].name: $input.aiModels.0.name', async ({
        input,
        expected,
      }) => {
        const finder = AiProviderModelProcessorFinder.create()

        const received = await finder.resolveAiModelProcessors(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('#extractFirstAiModelProcessor()', () => {
    describe('when some model is served by a driver', () => {
      const cases = [
        {
          input: {
            aiModelProcessors: [
              'processor-0001',
              'processor-0002',
            ],
          },
          expected: 'processor-0001',
        },
        {
          input: {
            aiModelProcessors: [
              null,
              'processor-0003',
            ],
          },
          expected: 'processor-0003',
        },
        {
          input: {
            aiModelProcessors: [
              null,
              null,
              'processor-0004',
            ],
          },
          expected: 'processor-0004',
        },
      ]

      test.each(cases)('aiModelProcessors[0]: $input.aiModelProcessors.0', ({
        input,
        expected,
      }) => {
        const finder = AiProviderModelProcessorFinder.create()

        const received = finder.extractFirstAiModelProcessor(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('#extractFirstAiModelProcessor()', () => {
    describe('when no model is served by a driver', () => {
      const cases = [
        {
          input: {
            aiModelProcessors: [
              null,
            ],
          },
        },
        {
          input: {
            aiModelProcessors: [
              null,
              null,
            ],
          },
        },
        {
          input: {
            aiModelProcessors: [], // A provider the catalog carries no model for
          },
        },
      ]

      test.each(cases)('aiModelProcessors.length: $input.aiModelProcessors.length', ({
        input,
      }) => {
        const finder = AiProviderModelProcessorFinder.create()

        const received = finder.extractFirstAiModelProcessor(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('#findAiModelProcessor()', () => {
    /*
     * The whole walk, on the real catalog: a provider id in, that provider's own driver out. Both
     * seeded vendors are asked, because this is the member the purge routes by and a finder that
     * answered the default driver whatever it was asked would look right against one of them.
     */
    describe('when this service can reach the provider', () => {
      const cases = [
        {
          input: {
            aiProviderId: 10100001, // AI_PROVIDER.STUB.ID
          },
          expected: StubAiModelProcessor,
        },
        {
          input: {
            aiProviderId: 11100001, // AI_PROVIDER.GEMINI.ID
          },
          expected: Gemini2_5FlashAiModelProcessor,
        },
      ]

      test.each(cases)('aiProviderId: $input.aiProviderId', async ({
        input,
        expected,
      }) => {
        const finder = AiProviderModelProcessorFinder.create()

        const received = await finder.findAiModelProcessor(input)

        expect(received)
          .toBeInstanceOf(expected)
      })
    })
  })
})

describe('AiProviderModelProcessorFinder', () => {
  describe('#findAiModelProcessor()', () => {
    /*
     * A provider this service has no way to reach answers null rather than raising, and rather than
     * falling back to any driver at all. The fallback is the dangerous answer: a purge handed the
     * default driver would ask the stub about a file that left for a real vendor, and would be told
     * nothing was deleted - or, had the stub ever gained a delete of its own, would be told it was.
     */
    describe('when this service cannot reach the provider', () => {
      const cases = [
        {
          input: {
            aiProviderId: 99900001, // A provider the catalog does not carry
          },
        },
        {
          input: {
            aiProviderId: 99900002, // A provider the catalog does not carry
          },
        },
      ]

      test.each(cases)('aiProviderId: $input.aiProviderId', async ({
        input,
      }) => {
        const finder = AiProviderModelProcessorFinder.create()

        const received = await finder.findAiModelProcessor(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
