import PurgeExpiredProviderUploadsJobWorker from '../../../app/jobs/purge-expired-provider-uploads/PurgeExpiredProviderUploadsJobWorker.js'

import BaseAiModelProcessor from '../../../app/tools/BaseAiModelProcessor.js'

import ProviderUploadedFile from '../../../sequelize/models/ProviderUploadedFile.js'

/*
 * What the nightly provider-upload job does when nobody hands it a purger (specs/1.0.0,
 * #retention).
 *
 * **This is the one composition the rest of #retention's tests cannot reach.** The worker's
 * declarations are pinned in `tests/__tests__/app/jobs/purge-expired-provider-uploads/`, and what
 * `ProviderUploadedFilePurger` stamps is pinned in `ProviderUploadedFilePurger.js` beside this file
 * - but between them sits the wiring that actually runs in the daemon, which builds a worker from
 * the engine alone and lets `BaseAiRunPurgeJobWorker.create()` default the purger. A worker whose
 * default was one of the two run purgers, or whose sweep hook reached a method the purger does not
 * answer, would fail only here.
 *
 * So no purger is passed, and none is mocked.
 *
 * **The engine is a stub, and it is one of the two things standing in for something real.** A
 * worker is constructed with an engine, and the real `AppJobEngine` opens Redis. Nothing in the
 * sweep touches the queue, so the stub supplies the two members construction reads and no more.
 *
 * **The other is the vendor call, and it must be.** A real key sits in the development environment
 * and the call under test deletes files, so no test here may reach Google:
 * `BaseAiModelProcessor#deleteProviderUploadedFile()` is spied on where a settled copy is wanted.
 * Everything else - the routing by provider, the selection, the write - is real.
 *
 * **Every row here is dated 2016 or 2017, and the barrel's run order is what keeps that safe.** A
 * purge is bounded by a horizon rather than by a caller, so this file and
 * `ProviderUploadedFilePurger.js` would reach each other's rows if their windows overlapped. The
 * barrel imports that file first, and every row it deliberately leaves unstamped is dated 2018-12
 * or later - so the latest `now` here, 2017-06-01, reaches none of them, and none of its sweeps
 * could have reached these rows because they did not exist yet. A case added here with a later date
 * breaks that in both directions at once.
 *
 * **The windows descend down the file** - 2017-06, then 2017-02, then 2016-12 - so a describe
 * counting rows cannot be handed a row an earlier describe left behind.
 *
 * Ids are #retention's own block, `11230001` upward, and none is borrowed.
 */

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('#sweepExpiredAiRuns()', () => {
    /*
     * The composition, end to end: a worker built the way the daemon builds one, handed a real
     * instant, routing a real row to its provider's own driver and stamping the egress record.
     *
     * `providerPurgedAt` carrying the instant handed in - rather than a clock read somewhere below
     * - is what says the horizon selected against and the stamp written are one instant. The rest
     * of the row is asserted unchanged in the same breath, because section 18 keeps the egress
     * record independently of the copy it describes: what is written is the date the copy stopped
     * existing, beside the date it started, and nothing else moves.
     */
    describe('should stamp the copies it settled', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRow: {
              id: 11230001,
              AiRunMediaId: 11230101,
              AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'files/provider-file-11230001',
              uploadedAt: new Date('2017-04-01T01:01:01.001Z'),
              expiresAt: new Date('2017-04-03T01:01:01.001Z'),
            },
            sweepArgs: {
              now: new Date('2017-06-01T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11230001,
            AiRunMediaId: 11230101,
            AiProviderId: 10100001,
            providerFileName: 'files/provider-file-11230001',
            uploadedAt: new Date('2017-04-01T01:01:01.001Z'),
            expiresAt: new Date('2017-04-03T01:01:01.001Z'),
            providerPurgedAt: new Date('2017-06-01T00:00:00.000Z'),
          }),
        },
        {
          input: {
            providerUploadedFileRow: {
              id: 11230002,
              AiRunMediaId: 11230102,
              AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'files/provider-file-11230002',
              uploadedAt: new Date('2017-04-02T02:02:02.002Z'),
              // expiresAt: the provider stated none
            },
            sweepArgs: {
              now: new Date('2017-06-01T00:00:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11230002,
            AiRunMediaId: 11230102,
            AiProviderId: 10100001,
            providerFileName: 'files/provider-file-11230002',
            uploadedAt: new Date('2017-04-02T02:02:02.002Z'),
            expiresAt: null,
            providerPurgedAt: new Date('2017-06-01T00:00:00.000Z'),
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
        const worker = PurgeExpiredProviderUploadsJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        await worker.sweepExpiredAiRuns(input.sweepArgs)

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

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('#sweepExpiredAiRuns()', () => {
    /*
     * What the worker answers with, which is the purger's own outcome and nothing added to it.
     *
     * `BaseAiRunPurgeJobWorker#executeJob()` reads `isSweepExhausted` off this value to decide
     * whether to warn about a backlog, and this job's own `#buildAiRunPurgeJobResult()` puts
     * `purgedFileCount` into the result BullMQ keeps against the completed job - so a worker that
     * swallowed the outcome, or that answered the base's `purgedAiRunCount` instead, would leave an
     * operator with no answer to "did last night's sweep take anything back" other than "the job
     * did not throw".
     *
     * This window's horizon falls before the rows the describe above created, so nothing it left
     * behind can be counted here. Two files in one batch is one batch, and the batch after it comes
     * back empty, which is what ends the sweep.
     */
    describe('should answer what its default purger settled', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRows: [
              {
                id: 11230011,
                AiRunMediaId: 11230111,
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
                providerFileName: 'files/provider-file-11230011',
                uploadedAt: new Date('2017-01-01T01:01:01.001Z'),
                expiresAt: new Date('2017-01-03T01:01:01.001Z'),
              },
              {
                id: 11230012,
                AiRunMediaId: 11230112,
                AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
                providerFileName: 'files/provider-file-11230012',
                uploadedAt: new Date('2017-01-02T02:02:02.002Z'),
                expiresAt: new Date('2017-01-04T02:02:02.002Z'),
              },
            ],
            sweepArgs: {
              now: new Date('2017-02-01T00:00:00.000Z'),
            },
          },
          expected: {
            purgedFileCount: 2,
            batchCount: 1,
            isSweepExhausted: true,
          },
        },
      ]

      test.each(cases)('now: $input.sweepArgs.now', async ({
        input,
        expected,
      }) => {
        jest.spyOn(BaseAiModelProcessor.prototype, 'deleteProviderUploadedFile')
          .mockResolvedValue(null)
        await ProviderUploadedFile.bulkCreate(input.providerUploadedFileRows)
        const worker = PurgeExpiredProviderUploadsJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const received = await worker.sweepExpiredAiRuns(input.sweepArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The whole of what one firing does, through the base's own entry point: read the clock, sweep,
     * and answer the four values BullMQ keeps against the completed job.
     *
     * The instant is stated rather than waited for, by standing in for `#buildCurrentInstant()` -
     * which is the seam the base documents for exactly this. Everything else runs: the body is not
     * read, the purger is the default one, and the row is stamped for real.
     *
     * `sweptAt` is text because the result goes into Redis, and it is the same instant the stamp
     * carries - a firing whose result quoted one instant while its stamps carried another would
     * make a night of sweeps impossible to line up against the rows they touched.
     */
    describe('should answer the result the queue keeps', () => {
      const cases = [
        {
          input: {
            providerUploadedFileRow: {
              id: 11230021,
              AiRunMediaId: 11230121,
              AiProviderId: 10100001, // AI_PROVIDER.STUB.ID
              providerFileName: 'files/provider-file-11230021',
              uploadedAt: new Date('2016-11-01T01:01:01.001Z'),
              expiresAt: new Date('2016-11-03T01:01:01.001Z'),
            },
            now: new Date('2016-12-01T00:00:00.000Z'),
          },
          expected: {
            sweptAt: '2016-12-01T00:00:00.000Z',
            purgedFileCount: 1,
            batchCount: 1,
            isSweepExhausted: true,
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerUploadedFileRow.providerFileName', async ({
        input,
        expected,
      }) => {
        jest.spyOn(BaseAiModelProcessor.prototype, 'deleteProviderUploadedFile')
          .mockResolvedValue(null)
        await ProviderUploadedFile.create(input.providerUploadedFileRow)
        const worker = PurgeExpiredProviderUploadsJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        jest.spyOn(worker, 'buildCurrentInstant')
          .mockReturnValue(input.now)

        const args = {
          body: {},
          context: null, // The sweep reads neither, and section 19 gives this job no payload
          parcel: null,
        }

        const received = await worker.executeJob(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
