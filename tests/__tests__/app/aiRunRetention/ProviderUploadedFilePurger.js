import ProviderUploadedFilePurger from '../../../../app/aiRunRetention/ProviderUploadedFilePurger.js'

import AiProviderModelProcessorFinder from '../../../../app/aiProvider/AiProviderModelProcessorFinder.js'
import AiRunInstantInspector from '../../../../app/aiRun/AiRunInstantInspector.js'
import UnstatedExpiryHorizonCalculator from '../../../../app/aiRunRetention/UnstatedExpiryHorizonCalculator.js'

import StubAiModelProcessor from '../../../../app/tools/AiModelProcessor/StubAiModelProcessor.js'

import ProviderUploadedFile from '../../../../sequelize/models/ProviderUploadedFile.js'

/*
 * The members of the provider-upload purge that read and decide but write nothing (specs/1.0.0,
 * #retention). What it writes is pinned in `tests/_orders/AiRunRetention/`, beside the rows it
 * writes to.
 *
 * Nothing here calls a vendor. `#deleteProviderCopy()` is handed a driver that answers without a
 * network - which is also the only honest way to exercise a vendor refusing, since a refusal is not
 * something a real provider can be asked for on demand.
 */

describe('ProviderUploadedFilePurger', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#unstatedExpiryHorizonCalculator', () => {
        const cases = [
          {
            input: {
              unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator.create({
                dayCount: 1,
              }),
            },
          },
          {
            input: {
              unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator.create({
                dayCount: 7,
              }),
            },
          },
        ]

        test.each(cases)('dayCount: $input.unstatedExpiryHorizonCalculator.dayCount', ({
          input,
        }) => {
          const args = {
            unstatedExpiryHorizonCalculator: input.unstatedExpiryHorizonCalculator,
            // Fill the unrelated required arguments with neutral values
            aiRunInstantInspector: null,
            aiProviderModelProcessorFinder: null,
            providerUploadedFileCountPerBatch: 0,
            maximumBatchCount: 0,
          }

          const purger = new ProviderUploadedFilePurger(args)

          expect(purger)
            .toHaveProperty('unstatedExpiryHorizonCalculator', input.unstatedExpiryHorizonCalculator)
        })
      })

      describe('#aiRunInstantInspector', () => {
        const cases = [
          {
            input: {
              aiRunInstantInspector: AiRunInstantInspector.create({
                earliestRecordableInstant: new Date('1000-01-01T00:00:00.000Z'),
              }),
            },
          },
          {
            input: {
              aiRunInstantInspector: AiRunInstantInspector.create({
                earliestRecordableInstant: new Date('1500-01-01T00:00:00.000Z'),
              }),
            },
          },
        ]

        test.each(cases)('earliestRecordableInstant: $input.aiRunInstantInspector.earliestRecordableInstant', ({
          input,
        }) => {
          const args = {
            aiRunInstantInspector: input.aiRunInstantInspector,
            // Fill the unrelated required arguments with neutral values
            unstatedExpiryHorizonCalculator: null,
            aiProviderModelProcessorFinder: null,
            providerUploadedFileCountPerBatch: 0,
            maximumBatchCount: 0,
          }

          const purger = new ProviderUploadedFilePurger(args)

          expect(purger)
            .toHaveProperty('aiRunInstantInspector', input.aiRunInstantInspector)
        })
      })

      describe('#aiProviderModelProcessorFinder', () => {
        const cases = [
          {
            input: {
              aiProviderModelProcessorFinder: AiProviderModelProcessorFinder.create({
                bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0001'),
              }),
            },
          },
          {
            input: {
              aiProviderModelProcessorFinder: AiProviderModelProcessorFinder.create({
                bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0002'),
              }),
            },
          },
        ]

        test.each(cases)('$#', ({
          input,
        }) => {
          const args = {
            aiProviderModelProcessorFinder: input.aiProviderModelProcessorFinder,
            // Fill the unrelated required arguments with neutral values
            unstatedExpiryHorizonCalculator: null,
            aiRunInstantInspector: null,
            providerUploadedFileCountPerBatch: 0,
            maximumBatchCount: 0,
          }

          const purger = new ProviderUploadedFilePurger(args)

          expect(purger)
            .toHaveProperty('aiProviderModelProcessorFinder', input.aiProviderModelProcessorFinder)
        })
      })

      describe('#providerUploadedFileCountPerBatch', () => {
        const cases = [
          {
            input: {
              providerUploadedFileCountPerBatch: 100,
            },
            expected: 100,
          },
          {
            input: {
              providerUploadedFileCountPerBatch: 7,
            },
            expected: 7,
          },
        ]

        test.each(cases)('providerUploadedFileCountPerBatch: $input.providerUploadedFileCountPerBatch', ({
          input,
          expected,
        }) => {
          const args = {
            providerUploadedFileCountPerBatch: input.providerUploadedFileCountPerBatch,
            // Fill the unrelated required arguments with neutral values
            unstatedExpiryHorizonCalculator: null,
            aiRunInstantInspector: null,
            aiProviderModelProcessorFinder: null,
            maximumBatchCount: 0,
          }

          const purger = new ProviderUploadedFilePurger(args)

          expect(purger)
            .toHaveProperty('providerUploadedFileCountPerBatch', expected)
        })
      })

      describe('#maximumBatchCount', () => {
        const cases = [
          {
            input: {
              maximumBatchCount: 200,
            },
            expected: 200,
          },
          {
            input: {
              maximumBatchCount: 3,
            },
            expected: 3,
          },
        ]

        test.each(cases)('maximumBatchCount: $input.maximumBatchCount', ({
          input,
          expected,
        }) => {
          const args = {
            maximumBatchCount: input.maximumBatchCount,
            // Fill the unrelated required arguments with neutral values
            unstatedExpiryHorizonCalculator: null,
            aiRunInstantInspector: null,
            aiProviderModelProcessorFinder: null,
            providerUploadedFileCountPerBatch: 0,
          }

          const purger = new ProviderUploadedFilePurger(args)

          expect(purger)
            .toHaveProperty('maximumBatchCount', expected)
        })
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            providerUploadedFileCountPerBatch: 5,
            maximumBatchCount: 2,
          },
        },
        {
          input: {
            providerUploadedFileCountPerBatch: 9,
            maximumBatchCount: 4,
          },
        },
      ]

      test.each(cases)('providerUploadedFileCountPerBatch: $input.providerUploadedFileCountPerBatch', ({
        input,
      }) => {
        const received = ProviderUploadedFilePurger.create(input)

        expect(received)
          .toBeInstanceOf(ProviderUploadedFilePurger)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator.create({
              dayCount: 1,
            }),
            aiRunInstantInspector: AiRunInstantInspector.create(),
            aiProviderModelProcessorFinder: AiProviderModelProcessorFinder.create({
              bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0001'),
            }),
            providerUploadedFileCountPerBatch: 5,
            maximumBatchCount: 2,
          },
        },
        {
          tally: {
            unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator.create({
              dayCount: 7,
            }),
            aiRunInstantInspector: AiRunInstantInspector.create(),
            aiProviderModelProcessorFinder: AiProviderModelProcessorFinder.create({
              bulkAiModelProcessorsLoaderPromise: Promise.resolve('bulk-loader-0002'),
            }),
            providerUploadedFileCountPerBatch: 9,
            maximumBatchCount: 4,
          },
        },
      ]

      test.each(cases)('providerUploadedFileCountPerBatch: $tally.providerUploadedFileCountPerBatch', ({
        tally,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(ProviderUploadedFilePurger)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('.create()', () => {
    /*
     * Five arguments carry a default, and each is asserted by omitting it alone - so a default that
     * stopped arriving is named by the failing case rather than hidden among four that still do.
     * The all-omitted case is the composition that actually runs: the worker builds its purger with
     * no argument at all, through `BaseAiRunPurgeJobWorker.createAiRunPurger()`.
     *
     * The full grid of every combination in which at least one argument is omitted is deliberately
     * not enumerated. The five defaults are independent suppliers, each read once in the factory's
     * own parameter list, so no combination of them can produce a value none of these cases does -
     * and thirty-one hand-written cases would be a table nobody reads.
     */
    describe('should fill default value', () => {
      const cases = [
        {
          input: {
            // unstatedExpiryHorizonCalculator: omitted -> default UnstatedExpiryHorizonCalculator
            aiRunInstantInspector: AiRunInstantInspector.create(),
            aiProviderModelProcessorFinder: AiProviderModelProcessorFinder.create(),
            providerUploadedFileCountPerBatch: 5,
            maximumBatchCount: 2,
          },
          expected: expect.objectContaining({
            unstatedExpiryHorizonCalculator: expect.any(UnstatedExpiryHorizonCalculator),
          }),
        },
        {
          input: {
            unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator.create(),
            // aiRunInstantInspector: omitted -> default AiRunInstantInspector
            aiProviderModelProcessorFinder: AiProviderModelProcessorFinder.create(),
            providerUploadedFileCountPerBatch: 5,
            maximumBatchCount: 2,
          },
          expected: expect.objectContaining({
            aiRunInstantInspector: expect.any(AiRunInstantInspector),
          }),
        },
        {
          input: {
            unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator.create(),
            aiRunInstantInspector: AiRunInstantInspector.create(),
            // aiProviderModelProcessorFinder: omitted -> default AiProviderModelProcessorFinder
            providerUploadedFileCountPerBatch: 5,
            maximumBatchCount: 2,
          },
          expected: expect.objectContaining({
            aiProviderModelProcessorFinder: expect.any(AiProviderModelProcessorFinder),
          }),
        },
        {
          input: {
            unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator.create(),
            aiRunInstantInspector: AiRunInstantInspector.create(),
            aiProviderModelProcessorFinder: AiProviderModelProcessorFinder.create(),
            // providerUploadedFileCountPerBatch: omitted -> default 100
            maximumBatchCount: 2,
          },
          expected: expect.objectContaining({
            providerUploadedFileCountPerBatch: 100,
          }),
        },
        {
          input: {
            unstatedExpiryHorizonCalculator: UnstatedExpiryHorizonCalculator.create(),
            aiRunInstantInspector: AiRunInstantInspector.create(),
            aiProviderModelProcessorFinder: AiProviderModelProcessorFinder.create(),
            providerUploadedFileCountPerBatch: 5,
            // maximumBatchCount: omitted -> default 200
          },
          expected: expect.objectContaining({
            maximumBatchCount: 200,
          }),
        },
        {
          input: {}, // Every argument omitted, which is how the worker builds one
          expected: expect.objectContaining({
            unstatedExpiryHorizonCalculator: expect.any(UnstatedExpiryHorizonCalculator),
            aiRunInstantInspector: expect.any(AiRunInstantInspector),
            aiProviderModelProcessorFinder: expect.any(AiProviderModelProcessorFinder),
            providerUploadedFileCountPerBatch: 100,
            maximumBatchCount: 200,
          }),
        },
      ]

      test.each(cases)('$#', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(ProviderUploadedFilePurger)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('.get:ProviderUploadedFileCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = ProviderUploadedFilePurger.ProviderUploadedFileCtor

        expect(received)
          .toBe(ProviderUploadedFile) // same reference
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('.createUnstatedExpiryHorizonCalculator()', () => {
    describe('when called as is', () => {
      test('should be an instance of the calculator', () => {
        const received = ProviderUploadedFilePurger.createUnstatedExpiryHorizonCalculator()

        expect(received)
          .toBeInstanceOf(UnstatedExpiryHorizonCalculator)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('.createAiRunInstantInspector()', () => {
    describe('when called as is', () => {
      test('should be an instance of the inspector', () => {
        const received = ProviderUploadedFilePurger.createAiRunInstantInspector()

        expect(received)
          .toBeInstanceOf(AiRunInstantInspector)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('.createAiProviderModelProcessorFinder()', () => {
    describe('when called as is', () => {
      test('should be an instance of the finder', () => {
        const received = ProviderUploadedFilePurger.createAiProviderModelProcessorFinder()

        expect(received)
          .toBeInstanceOf(AiProviderModelProcessorFinder)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#get:Ctor', () => {
    describe('should be the class the purger was built from', () => {
      const cases = [
        {
          input: {
            Ctor: ProviderUploadedFilePurger,
          },
        },
        {
          input: {
            Ctor: class DerivedProviderUploadedFilePurger extends ProviderUploadedFilePurger {},
          },
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
      }) => {
        const purger = input.Ctor.create()

        const received = purger.Ctor

        expect(received)
          .toBe(input.Ctor) // same reference
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#buildSweepOutcome()', () => {
    /*
     * Two numbers and a boolean, and no ids: what a worker returns is stored in Redis, and a
     * vendor's handle names a file that carried somebody's photographs. A sweep that put its
     * handles in the outcome would keep a list of them in the queue long after taking the copies
     * back.
     */
    describe('should answer the counts and nothing beside them', () => {
      const cases = [
        {
          input: {
            purgedFileCount: 340,
            batchCount: 4,
            isSweepExhausted: true,
          },
          expected: {
            purgedFileCount: 340,
            batchCount: 4,
            isSweepExhausted: true,
          },
        },
        {
          input: {
            purgedFileCount: 20000,
            batchCount: 200,
            isSweepExhausted: false,
          },
          expected: {
            purgedFileCount: 20000,
            batchCount: 200,
            isSweepExhausted: false,
          },
        },
        {
          input: {
            purgedFileCount: 0,
            batchCount: 1,
            isSweepExhausted: false,
          },
          expected: {
            purgedFileCount: 0,
            batchCount: 1,
            isSweepExhausted: false,
          },
        },
      ]

      test.each(cases)('purgedFileCount: $input.purgedFileCount', ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = purger.buildSweepOutcome(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#extractAiProviderIds()', () => {
    /*
     * Each provider once, so a batch of a hundred files handed to one vendor costs one catalog
     * lookup rather than a hundred identical ones. The repeated ids in the cases are the point of
     * the member and are the one place the uniqueness convention does not apply.
     */
    describe('should answer each provider a batch names once', () => {
      const cases = [
        {
          input: {
            providerUploadedFiles: [
              {
                AiProviderId: 10100001,
              },
              {
                AiProviderId: 10100001,
              },
              {
                AiProviderId: 10100001,
              },
            ],
          },
          expected: [
            10100001,
          ],
        },
        {
          input: {
            providerUploadedFiles: [
              {
                AiProviderId: 11100001,
              },
              {
                AiProviderId: 10100001,
              },
              {
                AiProviderId: 11100001,
              },
            ],
          },
          expected: [
            11100001,
            10100001,
          ],
        },
        {
          input: {
            providerUploadedFiles: [
              {
                AiProviderId: 10100001,
              },
            ],
          },
          expected: [
            10100001,
          ],
        },
        {
          input: {
            providerUploadedFiles: [], // A batch the caller never reaches with, guarded above
          },
          expected: [],
        },
      ]

      test.each(cases)('providerUploadedFiles[0].AiProviderId: $input.providerUploadedFiles.0.AiProviderId', ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = purger.extractAiProviderIds(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#appendGoneProviderUploadedFileId()', () => {
    describe('when the copy was settled', () => {
      const cases = [
        {
          input: {
            goneProviderUploadedFileIds: [],
            goneProviderUploadedFileId: 11210001,
          },
          expected: [
            11210001,
          ],
        },
        {
          input: {
            goneProviderUploadedFileIds: [
              11210002,
            ],
            goneProviderUploadedFileId: 11210003,
          },
          expected: [
            11210002,
            11210003,
          ],
        },
      ]

      test.each(cases)('goneProviderUploadedFileId: $input.goneProviderUploadedFileId', ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = purger.appendGoneProviderUploadedFileId(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#appendGoneProviderUploadedFileId()', () => {
    /*
     * A row nothing was established about is left out, which is what leaves it in the work set for
     * the next sweep. This is the shape of the whole recovery story, so it is asserted rather than
     * inferred from the caller.
     */
    describe('when nothing was settled', () => {
      const cases = [
        {
          input: {
            goneProviderUploadedFileIds: [],
            goneProviderUploadedFileId: null,
          },
          expected: [],
        },
        {
          input: {
            goneProviderUploadedFileIds: [
              11210004,
              11210005,
            ],
            goneProviderUploadedFileId: null,
          },
          expected: [
            11210004,
            11210005,
          ],
        },
      ]

      test.each(cases)('goneProviderUploadedFileIds.length: $input.goneProviderUploadedFileIds.length', ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = purger.appendGoneProviderUploadedFileId(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#deleteProviderCopy()', () => {
    /*
     * The driver answered, so the copy is gone and the row's id travels back to be stamped. The
     * handle reaching the driver untouched is asserted in the same breath: a delete asking about
     * anything but what the upload answered with would name a file no vendor keys by, and would
     * come back as "no such file" - which this service reads as "gone".
     */
    describe('when the provider settled the copy', () => {
      const cases = [
        {
          input: {
            providerUploadedFile: {
              id: 11210011,
              AiProviderId: 10100001,
              providerFileName: 'files/provider-file-0001',
            },
          },
          expected: {
            providerFileName: 'files/provider-file-0001',
          },
        },
        {
          input: {
            providerUploadedFile: {
              id: 11210012,
              AiProviderId: 11100001,
              providerFileName: 'files/provider-file-0002',
            },
          },
          expected: {
            providerFileName: 'files/provider-file-0002',
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFile.providerFileName', async ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const deleteSpy = jest.fn()
          .mockResolvedValue(null)
        const args = {
          providerUploadedFile: input.providerUploadedFile,
          aiModelProcessor: {
            deleteProviderUploadedFile: deleteSpy,
          },
        }

        const received = await purger.deleteProviderCopy(args)

        expect(received)
          .toBe(input.providerUploadedFile.id)
        expect(deleteSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#deleteProviderCopy()', () => {
    /*
     * The driver raised, so nothing about the copy was established and the row is left exactly as
     * it was. Answering the id here would be the false stamp the whole job was deferred to avoid -
     * and the raise is caught rather than allowed through, because one row's failure must not
     * abandon the other ninety-nine files of its batch.
     *
     * The stub driver is one of the cases, and it is the real class rather than a stand-in: it
     * hands nothing to anybody, so its inherited refusal is exactly what a row wrongly recorded
     * against it would meet.
     */
    describe('when the provider could not settle the copy', () => {
      const cases = [
        {
          input: {
            providerUploadedFile: {
              id: 11210021,
              AiProviderId: 10100001,
              providerFileName: 'files/provider-file-0003',
            },
            aiModelProcessor: {
              deleteProviderUploadedFile: jest.fn()
                .mockRejectedValue(new Error('delete-failure-0003')),
            },
          },
        },
        {
          input: {
            providerUploadedFile: {
              id: 11210022,
              AiProviderId: 11100001,
              providerFileName: 'files/provider-file-0004',
            },
            aiModelProcessor: {
              deleteProviderUploadedFile: jest.fn()
                .mockRejectedValue(new Error('delete-failure-0004')),
            },
          },
        },
        {
          input: {
            providerUploadedFile: {
              id: 11210023,
              AiProviderId: 10100001,
              providerFileName: 'files/provider-file-0005',
            },
            aiModelProcessor: StubAiModelProcessor.create(), // A driver that hands nothing over
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFile.providerFileName', async ({
        input,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = await purger.deleteProviderCopy(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#deleteProviderCopy()', () => {
    /*
     * No driver at all: a row naming a provider this installation cannot reach. Nothing is deleted
     * and nothing is stamped, which is the truthful outcome - the copy is still there.
     */
    describe('when this service has no driver for the provider', () => {
      const cases = [
        {
          input: {
            providerUploadedFile: {
              id: 11210031,
              AiProviderId: 99900001,
              providerFileName: 'files/provider-file-0006',
            },
            aiModelProcessor: null,
          },
        },
        {
          input: {
            providerUploadedFile: {
              id: 11210032,
              AiProviderId: 99900002,
              providerFileName: 'files/provider-file-0007',
            },
            aiModelProcessor: null,
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFile.providerFileName', async ({
        input,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = await purger.deleteProviderCopy(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#buildAiModelProcessorHash()', () => {
    /*
     * A batch spanning two vendors gets two drivers, each its own, and a provider this service
     * cannot reach is held as null rather than left out - the row naming it has to be recognised
     * below rather than fault on a missing key.
     *
     * The catalog is the real seeded one and no vendor is called: resolving a driver builds no
     * client and reads no key.
     */
    describe('should answer one driver per provider the batch names', () => {
      const cases = [
        {
          input: {
            providerUploadedFiles: [
              {
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              },
              {
                AiProviderId: 10100001,
              },
            ],
          },
          expected: {
            10100001: expect.any(StubAiModelProcessor),
          },
        },
        {
          input: {
            providerUploadedFiles: [
              {
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              },
              {
                AiProviderId: 99900001, // A provider the catalog does not carry
              },
            ],
          },
          expected: {
            10100001: expect.any(StubAiModelProcessor),
            99900001: null,
          },
        },
      ]

      test.each(cases)('providerUploadedFiles[1].AiProviderId: $input.providerUploadedFiles.1.AiProviderId', async ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = await purger.buildAiModelProcessorHash(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#findExpiredProviderUploadedFiles()', () => {
    /*
     * The work set, against the seeded egress record. Both branches of the condition are in the
     * answer: rows whose provider stated an expiry that has passed, and rows whose provider stated
     * none and which left this machine before the unstated-expiry horizon. A condition built on
     * `expires_at` alone would miss the second kind entirely, and those are the copies nothing at
     * the far end is ever going to remove.
     *
     * Asserted as a containment rather than as the whole answer, because other test files write
     * their own rows to this table and the set a sweep selects is bounded by a horizon rather than
     * by a caller. Which rows are *excluded* is pinned exactly in
     * `tests/_orders/AiRunRetention/ProviderUploadedFilePurger.js`, over rows that file creates and
     * owns.
     */
    describe('when files are past their time', () => {
      const cases = [
        {
          input: {
            now: new Date('2026-09-20T00:00:00.000Z'),
            unstatedExpiryHorizon: new Date('2026-09-19T00:00:00.000Z'),
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              id: 10420001, // expires_at 2026-09-14, past
            }),
            expect.objectContaining({
              id: 10420007, // expires_at 2026-09-15, past
            }),
            expect.objectContaining({
              id: 10420008, // expires_at 2026-09-13, past
            }),
            expect.objectContaining({
              id: 10420011, // expires_at 2026-09-13, past
            }),
            expect.objectContaining({
              id: 10420003, // expires_at null, uploaded 2026-09-12
            }),
            expect.objectContaining({
              id: 10420006, // expires_at null, uploaded 2026-09-12
            }),
            expect.objectContaining({
              id: 10420010, // expires_at null, uploaded 2026-09-12
            }),
          ]),
        },
      ]

      test.each(cases)('now: $input.now', async ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = await purger.findExpiredProviderUploadedFiles(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#findExpiredProviderUploadedFiles()', () => {
    /*
     * A horizon before every row this repository holds. Nothing is ripe, which is what a sweep run
     * on a database that has only just started keeping records has to answer - and it is the exit
     * the sweep reads as "the set is clear and this one finished".
     *
     * The years are 2010 and 2011 rather than the 2017 and 2019 the writing tests work in: those
     * files create rows of their own, in another jest worker against the same database, and a
     * horizon in either of their windows would make this assertion depend on which finished first.
     * Nothing in this repository is dated before 2017.
     */
    describe('when no file is past its time', () => {
      const cases = [
        {
          input: {
            now: new Date('2011-06-01T00:00:00.000Z'),
            unstatedExpiryHorizon: new Date('2011-05-31T00:00:00.000Z'),
          },
        },
        {
          input: {
            now: new Date('2010-01-01T00:00:00.000Z'),
            unstatedExpiryHorizon: new Date('2009-12-31T00:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('now: $input.now', async ({
        input,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = await purger.findExpiredProviderUploadedFiles(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#extractErrorName()', () => {
    /*
     * A raise reaches the log line as a class name and never as a message. What a refusal carries
     * is the vendor's to decide, so a name this service recognizes is the only part of it that may
     * be written down.
     */
    describe('should name the class of a raise', () => {
      const cases = [
        {
          label: 'an Error subclass',
          input: {
            error: new TypeError('files/provider-file-0101 is not a file'),
          },
          expected: 'TypeError',
        },
        {
          label: 'a raise that is not an Error',
          input: {
            error: {
              name: 'ClientError',
              message: 'got status: 403. {"error":{"message":"permission denied"}}',
            },
          },
          expected: 'ClientError',
        },
        {
          label: 'a raise carrying no name at all',
          input: {
            error: null,
          },
          expected: 'Error',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = purger.extractErrorName(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#deleteProviderCopy()', () => {
    /*
     * The provider refuses. The row is left exactly as it was, so tomorrow's sweep asks again.
     */
    describe('when the provider refuses the delete', () => {
      const cases = [
        {
          input: {
            providerUploadedFile: {
              id: 11210041,
              AiProviderId: 99900003,
              providerFileName: 'files/provider-file-0008',
            },
            aiModelProcessor: {
              deleteProviderUploadedFile: async () => {
                throw new TypeError('refused')
              },
            },
          },
        },
        {
          input: {
            providerUploadedFile: {
              id: 11210042,
              AiProviderId: 99900004,
              providerFileName: 'files/provider-file-0009',
            },
            aiModelProcessor: {
              deleteProviderUploadedFile: async () => {
                throw new TypeError('refused')
              },
            },
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFile.providerFileName', async ({
        input,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = await purger.deleteProviderCopy(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#deleteProviderCopy()', () => {
    /*
     * **The vendor's own wording does not reach the log file.** A provider is free to quote the
     * request back in a refusal - a handle, a prompt, a string somebody else wrote - and this line
     * is asserted whole so that a message travelling into it fails here rather than in a log file
     * nobody reads until an audit.
     */
    describe('should write the class of the refusal and nothing the provider worded', () => {
      const cases = [
        {
          input: {
            providerUploadedFile: {
              id: 11210051,
              AiProviderId: 99900005,
              providerFileName: 'files/provider-file-0010',
            },
            aiModelProcessor: {
              deleteProviderUploadedFile: async () => {
                throw new TypeError('got status: 403. {"error":{"message":"files/provider-file-0010 denied"}}')
              },
            },
          },
          expected: {
            message: 'ProviderUploadedFilePurger left a file where it is because the provider could not be reached: AiProviderId 99900005, providerFileName files/provider-file-0010, TypeError',
            tags: [
              'ProviderUploadPurge',
              'FailedDelete',
            ],
          },
        },
        {
          input: {
            providerUploadedFile: {
              id: 11210052,
              AiProviderId: 99900006,
              providerFileName: 'files/provider-file-0011',
            },
            aiModelProcessor: {
              deleteProviderUploadedFile: async () => {
                throw new RangeError('got status: 500. {"error":{"message":"files/provider-file-0011 unavailable"}}')
              },
            },
          },
          expected: {
            message: 'ProviderUploadedFilePurger left a file where it is because the provider could not be reached: AiProviderId 99900006, providerFileName files/provider-file-0011, RangeError',
            tags: [
              'ProviderUploadPurge',
              'FailedDelete',
            ],
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFile.providerFileName', async ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()
        const errorSpy = jest.spyOn(ProviderUploadedFilePurger.mentsuLogger, 'error')
          .mockImplementation(() => null)

        await purger.deleteProviderCopy(input)

        expect(errorSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
