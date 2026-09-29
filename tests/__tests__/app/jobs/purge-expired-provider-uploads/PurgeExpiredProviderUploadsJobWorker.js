import BaseAiRunPurgeJobWorker from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobWorker.js'

import AiRunContentPurger from '../../../../../app/aiRunRetention/AiRunContentPurger.js'
import AiRunTracePurger from '../../../../../app/aiRunRetention/AiRunTracePurger.js'
import ProviderUploadedFilePurger from '../../../../../app/aiRunRetention/ProviderUploadedFilePurger.js'

import PurgeExpiredProviderUploadsJobManifest from '../../../../../app/jobs/purge-expired-provider-uploads/PurgeExpiredProviderUploadsJobManifest.js'
import PurgeExpiredProviderUploadsJobWorker from '../../../../../app/jobs/purge-expired-provider-uploads/PurgeExpiredProviderUploadsJobWorker.js'

/*
 * The wiring this concrete worker declares, and the two members it answers again because the base
 * counts a sweep in runs (specs/1.0.0, #retention).
 *
 * **Nothing in this file writes, which is why it is the file that is here.**
 * `.get:ManifestCtor`, `.get:AiRunPurgerCtor`, `.createAiRunPurger()`,
 * `#reportUnexhaustedSweep()` and `#buildAiRunPurgeJobResult()` are declarations, a construction, a
 * log line and a shape; none of them reaches the database. `#sweepExpiredAiRuns()` does, through
 * the purger, so its cases live at
 * `tests/_orders/AiRunRetention/PurgeExpiredProviderUploadsJobWorker.js`.
 */

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredProviderUploadsJobWorker.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobWorker)
    })
  })
})

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsJobWorker.ManifestCtor

        expect(received)
          .toBe(PurgeExpiredProviderUploadsJobManifest) // same reference
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('.get:AiRunPurgerCtor', () => {
    describe('when called as is', () => {
      /*
       * The egress record's purger, not either of the two that sweep `ai_runs`. Wired to one of
       * those, this job would still fire nightly, still report a count and still look entirely
       * healthy - while every file this service ever handed to a vendor stayed at that vendor, and
       * section 19's third row went unmet with nothing red anywhere.
       */
      test('should be fixed value', () => {
        const received = PurgeExpiredProviderUploadsJobWorker.AiRunPurgerCtor

        expect(received)
          .toBe(ProviderUploadedFilePurger) // same reference
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('.get:AiRunPurgerCtor', () => {
    describe('when compared with the two run purges', () => {
      /*
       * Section 19's first acceptance criterion kept at the worker: the clocks are separate, and
       * never one. The case above pins which class; these pin that it is neither of the others,
       * which is the failure a copied file produces.
       */
      const cases = [
        {
          input: {
            AiRunPurgerCtor: AiRunContentPurger,
          },
        },
        {
          input: {
            AiRunPurgerCtor: AiRunTracePurger,
          },
        },
      ]

      test.each(cases)('AiRunPurgerCtor: $input.AiRunPurgerCtor.name', ({
        input,
      }) => {
        const received = PurgeExpiredProviderUploadsJobWorker.AiRunPurgerCtor

        expect(received)
          .not
          .toBe(input.AiRunPurgerCtor) // same reference
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('.createAiRunPurger()', () => {
    describe('when called as is', () => {
      /*
       * The factory default the worker is built with when nothing is handed in - which is every
       * execution in the daemon, since the daemon constructs workers with the engine alone.
       */
      test('should create the provider-upload purger', () => {
        const received = PurgeExpiredProviderUploadsJobWorker.createAiRunPurger()

        expect(received)
          .toBeInstanceOf(ProviderUploadedFilePurger)
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('#get:Ctor', () => {
    describe('should be the class the worker was built from', () => {
      const cases = [
        {
          input: {
            Ctor: PurgeExpiredProviderUploadsJobWorker,
          },
        },
        {
          input: {
            Ctor: class DerivedPurgeExpiredProviderUploadsJobWorker extends PurgeExpiredProviderUploadsJobWorker {},
          },
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
      }) => {
        const worker = input.Ctor.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const received = worker.Ctor

        expect(received)
          .toBe(input.Ctor) // same reference
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('#buildAiRunPurgeJobResult()', () => {
    /*
     * The four values BullMQ keeps against the completed job, and the reason this member is
     * answered again rather than inherited: the base counts a sweep in runs, and this one counts it
     * in files. A worker that let the base's `purgedAiRunCount` through would put an undefined
     * beside three numbers in the one record an operator reads a run of nights out of.
     *
     * `sweptAt` is text because the result goes into Redis, where a `Date` arrives back as whatever
     * the serializer made of it - and it is the sweep's own instant rather than a second clock
     * read, so a firing's result and the stamps it wrote line up.
     */
    describe('should answer the counts as text and numbers', () => {
      const cases = [
        {
          input: {
            now: new Date('2026-09-20T05:00:00.000Z'),
            outcome: {
              purgedFileCount: 340,
              batchCount: 4,
              isSweepExhausted: true,
            },
          },
          expected: {
            sweptAt: '2026-09-20T05:00:00.000Z',
            purgedFileCount: 340,
            batchCount: 4,
            isSweepExhausted: true,
          },
        },
        {
          input: {
            now: new Date('2026-09-21T05:00:00.000Z'),
            outcome: {
              purgedFileCount: 20000,
              batchCount: 200,
              isSweepExhausted: false,
            },
          },
          expected: {
            sweptAt: '2026-09-21T05:00:00.000Z',
            purgedFileCount: 20000,
            batchCount: 200,
            isSweepExhausted: false,
          },
        },
        {
          input: {
            now: new Date('2026-09-22T05:00:00.000Z'),
            outcome: {
              purgedFileCount: 0, // A provider that refused the whole batch
              batchCount: 1,
              isSweepExhausted: false,
            },
          },
          expected: {
            sweptAt: '2026-09-22T05:00:00.000Z',
            purgedFileCount: 0,
            batchCount: 1,
            isSweepExhausted: false,
          },
        },
      ]

      test.each(cases)('now: $input.now', ({
        input,
        expected,
      }) => {
        const worker = PurgeExpiredProviderUploadsJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const received = worker.buildAiRunPurgeJobResult(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('PurgeExpiredProviderUploadsJobWorker', () => {
  describe('#reportUnexhaustedSweep()', () => {
    /*
     * A warning rather than an error, and it carries the file count rather than a run count. The
     * distinction between the two levels is the whole of what the line is for: an error in this
     * family means a sweep did not run, and a warning means a sweep ran and could not reach the end
     * of its set. An operator paged for the second every night a backlog is large stops reading the
     * first.
     *
     * The counts are the only thing written. A vendor's handle here would name a file, in a log
     * that outlives the job that took it back.
     */
    describe('should warn with the counts and nothing beside them', () => {
      const cases = [
        {
          input: {
            outcome: {
              purgedFileCount: 20000,
              batchCount: 200,
              isSweepExhausted: false,
            },
          },
          expected: {
            message: 'PurgeExpiredProviderUploadsJobWorker a scheduled purge stopped with files still at their provider: purgedFileCount 20000, batchCount 200',
            tags: [
              'AiRunPurgeJob',
              'UnexhaustedSweep',
            ],
          },
        },
        {
          input: {
            outcome: {
              purgedFileCount: 0, // A provider that refused the whole batch
              batchCount: 1,
              isSweepExhausted: false,
            },
          },
          expected: {
            message: 'PurgeExpiredProviderUploadsJobWorker a scheduled purge stopped with files still at their provider: purgedFileCount 0, batchCount 1',
            tags: [
              'AiRunPurgeJob',
              'UnexhaustedSweep',
            ],
          },
        },
      ]

      test.each(cases)('purgedFileCount: $input.outcome.purgedFileCount', ({
        input,
        expected,
      }) => {
        const worker = PurgeExpiredProviderUploadsJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })

        const warnSpy = jest.spyOn(PurgeExpiredProviderUploadsJobWorker.mentsuLogger, 'warn')
          .mockReturnValue(null)

        worker.reportUnexhaustedSweep(input)

        expect(warnSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
