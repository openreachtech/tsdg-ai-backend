import ProviderUploadedFilePurger from '../../../app/aiRunRetention/ProviderUploadedFilePurger.js'

import BaseAiModelProcessor from '../../../app/tools/BaseAiModelProcessor.js'

import ProviderUploadedFile from '../../../sequelize/models/ProviderUploadedFile.js'

/*
 * What the provider-upload purge stamps, and what it leaves exactly where it was (specs/1.0.0,
 * #retention).
 *
 * **Every row below is dated 2019, and that is the whole isolation strategy.** A purge is bounded
 * by a horizon rather than by a caller, so a sweep run against this repository's database would
 * reach every row of `provider_uploaded_files` - including the twelve the egress seeder holds and
 * every row `tests/_orders/AiRunMedia/` creates. All of those are dated 2026; every row here is
 * dated 2019 and every `now` handed in puts the horizon in 2019 too, so the set each sweep selects
 * is exactly the rows of the describe that created them. A case added here with a 2026 date would
 * ask a vendor to delete files this repository's other tests have just recorded, and would stamp
 * them.
 *
 * **The windows descend down the file, and that is deliberate.** Each describe's horizon falls
 * before the expiries of every describe above it, so a sweep counting rows cannot be handed a row
 * an earlier describe left behind - and the rows an earlier describe deliberately left unstamped
 * are excluded by their own dates rather than by luck.
 *
 * **The vendor call is the one thing standing in for something real, and it is the only thing that
 * may be.** No test here may reach Google: a real key sits in the development environment, and the
 * call under test deletes files. So `BaseAiModelProcessor#deleteProviderUploadedFile()` is spied on
 * where a settled copy is wanted, and its real refusal is used where an unsettled one is. What the
 * spy steers is a third party; the routing, the selection, the transaction-free write and the rows
 * are all real.
 *
 * **The stub driver's own refusal is used rather than imitated**, in the describe that asks what
 * happens when nothing can be settled. It hands no file to anybody, so its inherited raise is
 * exactly what a row recorded against it would meet - and a purge that stamped anyway would be the
 * false record #provider-layer's deferral refused to build.
 *
 * Ids are #retention's own block, `11220001` upward, and none is borrowed.
 */

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * Which rows are ripe, one row per case, and the two that are not are the point of the
     * describe as much as the two that are.
     *
     * A provider's stated expiry that has passed makes a row ripe - the vendor says it is past
     * keeping the copy, and asking is the only way this service learns whether it acted on that. A
     * provider that stated nothing makes a row ripe once it has sat for the unstated-expiry wait,
     * because nothing at the far end is ever going to remove that copy on its own. A stated expiry
     * still ahead does not: the vendor has told us it is holding the file, and a run may still be
     * reading it. A file that left inside the wait does not either.
     */
    describe('should stamp a copy whose provider stated an expiry that has passed', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRow: {
              id: 11220001,
              AiRunMediaId: 11220101,
              AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'files/provider-file-11220001',
              uploadedAt: new Date('2019-05-01T01:01:01.001Z'),
              expiresAt: new Date('2019-06-01T01:01:01.001Z'),
            },
            purgeArgs: {
              now: new Date('2019-07-01T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11220001,
            providerFileName: 'files/provider-file-11220001',
            uploadedAt: new Date('2019-05-01T01:01:01.001Z'),
            expiresAt: new Date('2019-06-01T01:01:01.001Z'),
            providerPurgedAt: new Date('2019-07-01T00:00:00.000Z'),
          }),
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFileRow.providerFileName', async ({
        input,
        expected,
      }) => {
        jest.spyOn(BaseAiModelProcessor.prototype, 'deleteProviderUploadedFile')
          .mockResolvedValue(null)
        await ProviderUploadedFile.create(input.providerUploadedFileRow)
        const purger = ProviderUploadedFilePurger.create()

        await purger.purgeExpiredProviderUploadedFiles(input.purgeArgs)

        const received = await ProviderUploadedFile.findOne({
          where: {
            id: input.providerUploadedFileRow.id,
          },
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * The copy nothing at the far end is going to remove. `expires_at` is null either because the
     * vendor stated no expiry or because it stated a timestamp this service could not read, and in
     * both cases the only clock is ours - so this row is the reason
     * `UnstatedExpiryHorizonCalculator` exists at all. Left to `expires_at`, it would never be
     * selected, never be asked about, and sit at a vendor for ever with its stamp still null.
     */
    describe('should stamp a copy whose provider stated no expiry once it has sat for the wait', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRow: {
              id: 11220002,
              AiRunMediaId: 11220102,
              AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'files/provider-file-11220002',
              uploadedAt: new Date('2019-05-02T02:02:02.002Z'),
              // expiresAt: the provider stated none
            },
            purgeArgs: {
              now: new Date('2019-07-01T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11220002,
            providerFileName: 'files/provider-file-11220002',
            uploadedAt: new Date('2019-05-02T02:02:02.002Z'),
            expiresAt: null,
            providerPurgedAt: new Date('2019-07-01T00:00:00.000Z'),
          }),
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFileRow.providerFileName', async ({
        input,
        expected,
      }) => {
        jest.spyOn(BaseAiModelProcessor.prototype, 'deleteProviderUploadedFile')
          .mockResolvedValue(null)
        await ProviderUploadedFile.create(input.providerUploadedFileRow)
        const purger = ProviderUploadedFilePurger.create()

        await purger.purgeExpiredProviderUploadedFiles(input.purgeArgs)

        const received = await ProviderUploadedFile.findOne({
          where: {
            id: input.providerUploadedFileRow.id,
          },
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * The two rows that must be left alone, and the vendor must not be asked about either.
     *
     * The first is inside a stated expiry: the vendor has said it is holding the copy, and the run
     * that uploaded it may still be reading it - a state this table cannot see, because it records
     * what left rather than what is still in use. The second stated no expiry and has not yet sat
     * for the wait, which is the same hazard reached by the other branch of the condition.
     *
     * A purge that selected everything not yet taken back would stamp both of these, and would be
     * deleting files out from under live requests.
     */
    describe('should leave a copy that is not yet past its time', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRow: {
              id: 11220003,
              AiRunMediaId: 11220103,
              AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'files/provider-file-11220003',
              uploadedAt: new Date('2019-05-03T03:03:03.003Z'),
              expiresAt: new Date('2019-09-03T03:03:03.003Z'), // Still ahead of the sweep
            },
            purgeArgs: {
              now: new Date('2019-07-01T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11220003,
            expiresAt: new Date('2019-09-03T03:03:03.003Z'),
            providerPurgedAt: null,
          }),
        },
        {
          input: {
            providerUploadedFileRow: {
              id: 11220004,
              AiRunMediaId: 11220104,
              AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'files/provider-file-11220004',
              uploadedAt: new Date('2019-06-30T12:00:00.000Z'), // Inside the one-day wait
              // expiresAt: the provider stated none
            },
            purgeArgs: {
              now: new Date('2019-07-01T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11220004,
            expiresAt: null,
            providerPurgedAt: null,
          }),
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFileRow.providerFileName', async ({
        input,
        expected,
      }) => {
        const deleteSpy = jest.spyOn(BaseAiModelProcessor.prototype, 'deleteProviderUploadedFile')
          .mockResolvedValue(null)
        await ProviderUploadedFile.create(input.providerUploadedFileRow)
        const purger = ProviderUploadedFilePurger.create()

        await purger.purgeExpiredProviderUploadedFiles(input.purgeArgs)

        const received = await ProviderUploadedFile.findOne({
          where: {
            id: input.providerUploadedFileRow.id,
          },
        })

        expect(received)
          .toEqual(expected)
        expect(deleteSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * What the sweep answers with, over a batch it cleared. Two ripe rows are one batch, and the
     * batch after it comes back empty, which is the exit that means the set is clear.
     *
     * This window's horizon falls before every row the describes above created, so nothing they
     * left behind can be counted here.
     */
    describe('should answer what it settled when the set clears', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRows: [
              {
                id: 11220011,
                AiRunMediaId: 11220111,
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
                providerFileName: 'files/provider-file-11220011',
                uploadedAt: new Date('2019-02-01T01:01:01.001Z'),
                expiresAt: new Date('2019-02-03T01:01:01.001Z'),
              },
              {
                id: 11220012,
                AiRunMediaId: 11220112,
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
                providerFileName: 'files/provider-file-11220012',
                uploadedAt: new Date('2019-02-02T02:02:02.002Z'),
                // expiresAt: the provider stated none
              },
            ],
            purgeArgs: {
              now: new Date('2019-03-01T00:00:00.000Z'),
            },
          },
          expected: {
            purgedFileCount: 2,
            batchCount: 1,
            isSweepExhausted: true,
          },
        },
      ]

      test.each(cases)('now: $input.purgeArgs.now', async ({
        input,
        expected,
      }) => {
        jest.spyOn(BaseAiModelProcessor.prototype, 'deleteProviderUploadedFile')
          .mockResolvedValue(null)
        await ProviderUploadedFile.bulkCreate(input.providerUploadedFileRows)
        const purger = ProviderUploadedFilePurger.create()

        const received = await purger.purgeExpiredProviderUploadedFiles(input.purgeArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * The provider refused every file in the batch. Nothing is stamped, and the sweep stops rather
     * than asking the same rows again until its batch bound is spent - twenty thousand calls to a
     * vendor that is already failing would be the alternative. It reports that it did not finish,
     * which is honest: nothing was established.
     *
     * The refusal is the stub driver's own, reached through the real routing rather than mocked: a
     * row is recorded against the stub, which hands nothing to anybody and therefore raises when
     * asked to take something back. Both rows stay exactly as they were, which is what leaves them
     * in the set for the next sweep - and that is the whole of this job's retry.
     */
    describe('should stop and stamp nothing when a whole batch could not be settled', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRows: [
              {
                id: 11220021,
                AiRunMediaId: 11220121,
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID, whose driver hands nothing over
                providerFileName: 'files/provider-file-11220021',
                uploadedAt: new Date('2019-01-10T01:01:01.001Z'),
                expiresAt: new Date('2019-01-15T01:01:01.001Z'),
              },
              {
                id: 11220022,
                AiRunMediaId: 11220122,
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID, whose driver hands nothing over
                providerFileName: 'files/provider-file-11220022',
                uploadedAt: new Date('2019-01-11T02:02:02.002Z'),
                expiresAt: new Date('2019-01-16T02:02:02.002Z'),
              },
            ],
            purgeArgs: {
              now: new Date('2019-01-20T00:00:00.000Z'),
            },
          },
          expected: {
            purgedFileCount: 0,
            batchCount: 1,
            isSweepExhausted: false,
          },
        },
      ]

      test.each(cases)('now: $input.purgeArgs.now', async ({
        input,
        expected,
      }) => {
        await ProviderUploadedFile.bulkCreate(input.providerUploadedFileRows)
        const purger = ProviderUploadedFilePurger.create()

        const received = await purger.purgeExpiredProviderUploadedFiles(input.purgeArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * The rows of the describe above, read back. Asserting the outcome is not enough: a purge that
     * answered `purgedFileCount: 0` while writing the stamps anyway would pass that describe and
     * would still have recorded that copies of personal data were deleted when they were not.
     *
     * The window is the same one, and both rows were left in the set by it - so this sweep selects
     * and fails on them again, which is exactly what tomorrow's sweep would do.
     */
    describe('should leave a copy it could not settle exactly as it was', () => {
      const cases = [
        {
          input: {
            providerUploadedFileId: 11220021,
            purgeArgs: {
              now: new Date('2019-01-20T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11220021,
            providerFileName: 'files/provider-file-11220021',
            expiresAt: new Date('2019-01-15T01:01:01.001Z'),
            providerPurgedAt: null,
          }),
        },
        {
          input: {
            providerUploadedFileId: 11220022,
            purgeArgs: {
              now: new Date('2019-01-20T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11220022,
            providerFileName: 'files/provider-file-11220022',
            expiresAt: new Date('2019-01-16T02:02:02.002Z'),
            providerPurgedAt: null,
          }),
        },
      ]

      test.each(cases)('providerUploadedFileId: $input.providerUploadedFileId', async ({
        input,
        expected,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        await purger.purgeExpiredProviderUploadedFiles(input.purgeArgs)

        const received = await ProviderUploadedFile.findOne({
          where: {
            id: input.providerUploadedFileId,
          },
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * A row naming a provider this installation has no driver for. Nothing is deleted and nothing
     * is stamped: the copy is still at the far end, and saying otherwise would be a lie in the one
     * column that is supposed to answer for it.
     *
     * This is not a hypothetical. A vendor turned off, or a model row removed from the catalog,
     * leaves exactly this state behind - and the rows that outlive their driver are the ones most
     * in need of being taken back rather than quietly marked done.
     */
    describe('should leave a copy whose provider this service cannot reach', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRow: {
              id: 11220031,
              AiRunMediaId: 11220131,
              AiProviderId: 99900001, // A provider the catalog carries no model for
              providerFileName: 'files/provider-file-11220031',
              uploadedAt: new Date('2019-01-01T01:01:01.001Z'),
              expiresAt: new Date('2019-01-02T01:01:01.001Z'),
            },
            purgeArgs: {
              now: new Date('2019-01-05T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11220031,
            providerFileName: 'files/provider-file-11220031',
            providerPurgedAt: null,
          }),
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFileRow.providerFileName', async ({
        input,
        expected,
      }) => {
        jest.spyOn(BaseAiModelProcessor.prototype, 'deleteProviderUploadedFile')
          .mockResolvedValue(null)
        await ProviderUploadedFile.create(input.providerUploadedFileRow)
        const purger = ProviderUploadedFilePurger.create()

        await purger.purgeExpiredProviderUploadedFiles(input.purgeArgs)

        const received = await ProviderUploadedFile.findOne({
          where: {
            id: input.providerUploadedFileRow.id,
          },
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * The batch bound, spent with files still at their provider. One file a batch and one batch
     * allowed, against two ripe rows: the sweep takes one back and stops, and says it did not
     * finish - which is a fact about the size of the backlog rather than a failure, and is what the
     * worker turns into a warning an operator can read a run of.
     */
    describe('should stop on its batch bound and say it did not finish', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRows: [
              {
                id: 11220041,
                AiRunMediaId: 11220141,
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
                providerFileName: 'files/provider-file-11220041',
                uploadedAt: new Date('2018-12-10T01:01:01.001Z'),
                expiresAt: new Date('2018-12-11T01:01:01.001Z'),
              },
              {
                id: 11220042,
                AiRunMediaId: 11220142,
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
                providerFileName: 'files/provider-file-11220042',
                uploadedAt: new Date('2018-12-12T02:02:02.002Z'),
                expiresAt: new Date('2018-12-13T02:02:02.002Z'),
              },
            ],
            factoryArgs: {
              providerUploadedFileCountPerBatch: 1,
              maximumBatchCount: 1,
            },
            purgeArgs: {
              now: new Date('2019-01-01T00:00:00.000Z'),
            },
          },
          expected: {
            purgedFileCount: 1,
            batchCount: 1,
            isSweepExhausted: false,
          },
        },
      ]

      test.each(cases)('now: $input.purgeArgs.now', async ({
        input,
        expected,
      }) => {
        jest.spyOn(BaseAiModelProcessor.prototype, 'deleteProviderUploadedFile')
          .mockResolvedValue(null)
        await ProviderUploadedFile.bulkCreate(input.providerUploadedFileRows)
        const purger = ProviderUploadedFilePurger.create(input.factoryArgs)

        const received = await purger.purgeExpiredProviderUploadedFiles(input.purgeArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFilePurger', () => {
  describe('#purgeExpiredProviderUploadedFiles()', () => {
    /*
     * An instant that is not an instant is refused before anything is read, and refused by name.
     *
     * Sequelize coerces whatever it is handed into `datetime(3)`, so any of these would settle in
     * `provider_purged_at` as the literal text `Invalid date` - a row both unfindable by the next
     * sweep and indistinguishable from a purge that worked. A string that happens to parse is
     * refused beside the ones that do not, because the signature says `Date` and a caller not
     * honoring that is the door the next unparseable string comes through.
     */
    describe('when the instant is not an instant', () => {
      const cases = [
        {
          input: {
            now: '2019-01-01T00:00:00.000Z', // A string that would parse, and is still not a Date
          },
        },
        {
          input: {
            now: new Date('unparseable-instant'),
          },
        },
        {
          input: {
            now: null,
          },
        },
        {
          input: {
            now: 1546300800000, // The same instant as a millisecond count
          },
        },
      ]

      test.each(cases)('now: $input.now', async ({
        input,
      }) => {
        const purger = ProviderUploadedFilePurger.create()

        const received = () => purger.purgeExpiredProviderUploadedFiles(input)

        await expect(received)
          .rejects
          .toThrow('ProviderUploadedFilePurger#purgeExpiredProviderUploadedFiles() refused an instant that is not an instant: field now')
      })
    })
  })
})
