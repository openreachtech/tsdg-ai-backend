import fsPromises from 'node:fs/promises'

import BaseAiRunJobWorker from '../../../app/aiRun/jobs/BaseAiRunJobWorker.js'

import BaseAiRunJobManifest from '../../../app/aiRun/jobs/BaseAiRunJobManifest.js'

import AiRunMediaWorkspace from '../../../app/aiRunMedia/AiRunMediaWorkspace.js'

/*
 * Why the recorder is handed in rather than run for real.
 *
 * The lifecycle this file exercises writes to `ai_runs` through `AiRunStatusRecorder`, which is why
 * the file sits here and not under `tests/__tests__/` — placement follows what the method does, not
 * whether a test stubs the write away. What it does not do is re-test the recorder: the conditional
 * write, its refusals and its evidence rules are `AiRunStatusRecorder`'s own, tested beside it in
 * this folder. What is this worker's, and what every case below asserts, is which transition it
 * asks for, with which columns, and what it does with the answer it is given.
 *
 * That answer is the whole reason the recorder is a seam here. It is how a delivery learns that
 * another writer settled the run first, and there is no seeded row that can be made to say so on
 * demand: it is a race between two writers, and the only way to state one end of it in a test is to
 * state the answer.
 */

describe('BaseAiRunJobWorker', () => {
  describe('#saveRunningAiRun()', () => {
    describe('should hand the recorder the instant the work began', () => {
      const cases = [
        {
          params: {
            aiRunId: 10300081,
            startedAt: new Date('2026-09-25T10:00:00.000Z'),
          },
          mockHasStarted: true,
          expected: {
            aiRunId: 10300081,
            startedAt: new Date('2026-09-25T10:00:00.000Z'),
          },
        },
        {
          params: {
            aiRunId: 10300082,
            startedAt: new Date('2026-09-25T11:30:00.000Z'),
          },
          mockHasStarted: false,
          expected: {
            aiRunId: 10300082,
            startedAt: new Date('2026-09-25T11:30:00.000Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        mockHasStarted,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(mockHasStarted)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
          },
        })

        const actual = await worker.saveRunningAiRun(params)

        expect(saveRunningAiRunOnce)
          .toHaveBeenCalledWith(expected)
        expect(actual)
          .toBe(mockHasStarted)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#saveSucceededAiRun()', () => {
    describe('should hand the recorder the result the run settled', () => {
      const cases = [
        {
          params: {
            aiRunId: 10300083,
            resultBody: '{"brand":"alpha"}',
            finishedAt: new Date('2026-09-25T10:01:00.000Z'),
          },
          mockHasSettled: true,
          expected: {
            aiRunId: 10300083,
            resultBody: '{"brand":"alpha"}',
            finishedAt: new Date('2026-09-25T10:01:00.000Z'),
          },
        },
        {
          params: {
            aiRunId: 10300084,
            resultBody: null,
            finishedAt: new Date('2026-09-25T10:02:00.000Z'),
          },
          mockHasSettled: false,
          expected: {
            aiRunId: 10300084,
            resultBody: null,
            finishedAt: new Date('2026-09-25T10:02:00.000Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        mockHasSettled,
        expected,
      }) => {
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(mockHasSettled)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: {
            saveSucceededAiRunOnce,
          },
        })

        const actual = await worker.saveSucceededAiRun(params)

        expect(saveSucceededAiRunOnce)
          .toHaveBeenCalledWith(expected)
        expect(actual)
          .toBe(mockHasSettled)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#saveFailedAiRun()', () => {
    describe('should hand the recorder the reason the run failed for', () => {
      const cases = [
        {
          params: {
            aiRunId: 10300085,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
            finishedAt: new Date('2026-09-25T10:05:00.000Z'),
          },
          mockHasSettled: true,
          expected: {
            aiRunId: 10300085,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
            finishedAt: new Date('2026-09-25T10:05:00.000Z'),
          },
        },
        {
          params: {
            aiRunId: 10300086,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            failureParameters: null,
            finishedAt: new Date('2026-09-25T10:06:00.000Z'),
          },
          mockHasSettled: false,
          expected: {
            aiRunId: 10300086,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            failureParameters: null,
            finishedAt: new Date('2026-09-25T10:06:00.000Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        mockHasSettled,
        expected,
      }) => {
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(mockHasSettled)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: {
            saveFailedAiRunOnce,
          },
        })

        const actual = await worker.saveFailedAiRun(params)

        expect(saveFailedAiRunOnce)
          .toHaveBeenCalledWith(expected)
        expect(actual)
          .toBe(mockHasSettled)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#settleSucceededAiRun()', () => {
    describe('should record the run succeeded and report the delivery', () => {
      const cases = [
        {
          params: {
            aiRunId: 10300091,
            outcome: {
              resultBody: '{"brand":"alpha"}',
              failureReasonCode: null,
              failureParameters: null,
            },
          },
          mockHasSettled: true,
          expected: {
            aiRunId: 10300091,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
        {
          params: {
            aiRunId: 10300092,
            outcome: {
              resultBody: null,
              failureReasonCode: null,
              failureParameters: null,
            },
          },
          mockHasSettled: false,
          expected: {
            aiRunId: 10300092,
            failureReasonCode: null,
            hasSettled: false,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        mockHasSettled,
        expected,
      }) => {
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(mockHasSettled)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: {
            saveSucceededAiRunOnce,
          },
        })

        const actual = await worker.settleSucceededAiRun(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#settleFailedAiRun()', () => {
    describe('should record the run failed and report the delivery', () => {
      const cases = [
        {
          params: {
            aiRunId: 10300093,
            outcome: {
              resultBody: null,
              failureReasonCode: 'TIME_LIMIT_EXCEEDED',
              failureParameters: null,
            },
          },
          mockHasSettled: true,
          expected: {
            aiRunId: 10300093,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            hasSettled: true,
          },
        },
        {
          params: {
            aiRunId: 10300094,
            outcome: {
              resultBody: null,
              failureReasonCode: 'PROVIDER_CALL_FAILED',
              failureParameters: null,
            },
          },
          mockHasSettled: false,
          expected: {
            aiRunId: 10300094,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            hasSettled: false,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        mockHasSettled,
        expected,
      }) => {
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(mockHasSettled)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 300000,
          aiRunStatusRecorder: {
            saveFailedAiRunOnce,
          },
        })

        const actual = await worker.settleFailedAiRun(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#settleAiRun()', () => {
    /*
     * One outcome reaches one terminal write. The case that matters is the second assertion: the
     * status the outcome did not name is never written, which is the half of the fifth acceptance
     * criterion this method is responsible for.
     */
    describe('should write only the terminal status the outcome names', () => {
      const cases = [
        {
          params: {
            aiRunId: 10300101,
            body: {
              aiRunId: 10300101,
            },
            context: {},
            parcel: {},
          },
          mockResultBody: '{"brand":"alpha"}',
          expected: {
            aiRunId: 10300101,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
        {
          params: {
            aiRunId: 10300102,
            body: {
              aiRunId: 10300102,
            },
            context: {},
            parcel: {},
          },
          mockResultBody: null,
          expected: {
            aiRunId: 10300102,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        mockResultBody,
        expected,
      }) => {
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue(mockResultBody)

        const actual = await worker.settleAiRun(params)

        expect(actual)
          .toEqual(expected)
        expect(saveFailedAiRunOnce)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#settleAiRun()', () => {
    /*
     * Section 11's fourth acceptance criterion, at the place the row is written: a run still running
     * past the time limit ends as failed, carrying the time-limit reason code. The work here never
     * settles at all, which is the shape the limit exists for.
     */
    describe('should record a run past its limit as failed', () => {
      const cases = [
        {
          params: {
            aiRunId: 10300103,
            body: {
              aiRunId: 10300103,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10300103,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
            finishedAt: expect.any(Date),
          },
        },
        {
          params: {
            aiRunId: 10300104,
            body: {
              aiRunId: 10300104,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10300104,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
            finishedAt: expect.any(Date),
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        expected,
      }) => {
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 1,
          aiRunStatusRecorder: {
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockReturnValue(new Promise(() => {
            // A run that holds a worker indefinitely: nothing here ever settles it.
          }))

        await worker.settleAiRun(params)

        expect(saveFailedAiRunOnce)
          .toHaveBeenCalledWith(expected)
        expect(saveSucceededAiRunOnce)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The whole of the fifth acceptance criterion in one case: a run's status moves from queued to
     * running to exactly one terminal state. Running is asked for first, succeeded second, and the
     * third transition this class knows how to write is asked for not at all.
     */
    describe('should move the run to running and then to one terminal state', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300111,
            },
            context: {},
            parcel: {},
          },
          mockResultBody: '{"brand":"alpha"}',
          expected: {
            aiRunId: 10300111,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10300112,
            },
            context: {},
            parcel: {},
          },
          mockResultBody: null,
          expected: {
            aiRunId: 10300112,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        mockResultBody,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue(mockResultBody)

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
        expect(saveRunningAiRunOnce)
          .toHaveBeenCalledWith({
            aiRunId: expected.aiRunId,
            startedAt: expect.any(Date),
          })
        expect(saveFailedAiRunOnce)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * BullMQ delivers at least once: a worker that stalls has its job re-queued, so the same run can
     * reach two executions. The second of them is told by the conditional write that the run has
     * already settled, and this case is what says it stops there — no work, and above all no second
     * terminal write against a run that is already succeeded, failed or canceled.
     */
    describe('should write nothing further when another writer already settled the run', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300121,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10300121,
            failureReasonCode: null,
            hasSettled: false,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10300122,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10300122,
            failureReasonCode: null,
            hasSettled: false,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(false)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        const executeAiRunWorkSpy = jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue('{"brand":"alpha"}')

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
        expect(executeAiRunWorkSpy)
          .not
          .toHaveBeenCalled()
        expect(saveSucceededAiRunOnce)
          .not
          .toHaveBeenCalled()
        expect(saveFailedAiRunOnce)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The run settled between this delivery's claim and its own terminal write — the race the
     * conditional write exists to decide. The delivery reports that it did not settle the run, and
     * nothing it computed reaches the row.
     */
    describe('should report a terminal write another writer won', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10300131,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10300131,
            failureReasonCode: null,
            hasSettled: false,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10300132,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10300132,
            failureReasonCode: null,
            hasSettled: false,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(false)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue('{"brand":"alpha"}')

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A body that carries the field but not a run is refused before any status is asked for, so a
     * malformed delivery cannot move a run it cannot identify.
     *
     * Both shapes below satisfy the schema: `{ aiRunId: Integer }` states what the field holds
     * when it is there and not that it has to be, so a body with no keys and a body carrying some
     * other key are each valid and each name nothing. The refusal is this class's rather than the
     * schema's for exactly that reason.
     */
    describe('should refuse a job body naming no run', () => {
      const cases = [
        {
          params: {
            body: {},
            context: {},
            parcel: {},
          },
          label: 'a body carrying no field at all',
        },
        {
          params: {
            body: {
              runKey: 'run-key-10330101',
            },
            context: {},
            parcel: {},
          },
          label: 'a body carrying the run key instead of the id',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
          },
        })

        const actual = () => worker.executeJob(params)

        await expect(actual)
          .rejects
          .toThrow('refused a job body naming no run')
        expect(saveRunningAiRunOnce)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The queue is a boundary and nothing upstream of this method checks what crosses it. The
     * dispatcher's own check ran in the process that enqueued, against what that process was about
     * to send, and the framework hands a worker whatever `jobModel.normalizeBody()` made of the
     * job's stored data without asking the body anything. So a body that fails its schema is
     * refused here, before a status is asked for.
     */
    describe('should refuse a job body its schema does not hold', () => {
      const cases = [
        {
          params: {
            body: null,
            context: {},
            parcel: {},
          },
          label: 'no body at all',
        },
        {
          params: {
            body: {
              aiRunId: 'ai-run-id-omega',
            },
            context: {},
            parcel: {},
          },
          label: 'an id that is not an integer',
        },
        {
          params: {
            body: {
              aiRunId: null,
            },
            context: {},
            parcel: {},
          },
          label: 'an id declared as nothing',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
          },
        })

        const actual = () => worker.executeJob(params)

        await expect(actual)
          .rejects
          .toThrow('refused a job body its own schema does not hold')
        expect(saveRunningAiRunOnce)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A body satisfying its schema is not a body carrying only what the schema declares — the
     * framework's normalization keeps every key it was given. What the concrete job's work is
     * handed is therefore rebuilt from the declared fields, so a delivery carrying a callback URL
     * or a result beside the run's id reaches the work with those gone.
     *
     * This is the sentence `#executeAiRunWork()`'s own documentation makes to the service that
     * writes it, asserted where it is made true rather than where it is written down.
     */
    describe('should hand the work only the fields the schema declares', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10330111,
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10330111',
              resultBody: '{"fields":[{"fieldPath":"subject.alpha"}]}',
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10330111,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10330112,
              runKey: 'run-key-10330112',
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10330112,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
          },
        })
        const executeAiRunWorkSpy = jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue('{"brand":"alpha"}')

        await worker.executeJob(params)

        expect(executeAiRunWorkSpy)
          .toHaveBeenCalledWith({
            body: expected,
            context: params.context,
            parcel: params.parcel,
          })
      })
    })
  })
})

/*
 * Section 18's fifth acceptance criterion, at the one place that knows a run has ended: the
 * temporary copy of a fetched file is deleted when the run ends.
 *
 * **"However it ends" is what the cases below are for**, and each describe is one of the ways.
 * The work succeeded; the work threw; the run went past its time limit; the terminal write itself
 * threw. A removal that ran only on the first of those would keep the criterion for the one case
 * that never leaks and drop it for every case that does.
 *
 * The file system is not mocked in any of them. A spy saying `removeWorkspace` was called would
 * pass against a worker that removed the wrong run's directory, so each case writes real bytes into
 * the directory `AiRunMediaWorkspace` builds for that run - under the machine's own temporary
 * directory, because the worker builds the workspace with no root of its own, which is exactly what
 * it does in production - and then reads the disk to see that they are gone.
 *
 * The run ids are `10450201` upward and the media ids `10450301` upward, a block of
 * `#media-fetch`'s own that no other file writes.
 */

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The way a run ends that leaks nothing, and therefore the one a removal on the happy path
     * alone would be enough for. It is here so the other describes are read as additions to it
     * rather than as the whole of the criterion.
     */
    describe('should delete the temporary copies when the work succeeded', () => {
      const cases = [
        {
          mockMediumFile: {
            aiRunMediaId: 10450301,
            bytes: Buffer.from('front-elevation-bytes'),
          },
          params: {
            body: {
              aiRunId: 10450201,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450201,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
        {
          mockMediumFile: {
            aiRunMediaId: 10450302,
            bytes: Buffer.from('rear-elevation-bytes'),
          },
          params: {
            body: {
              aiRunId: 10450202,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450202,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        mockMediumFile,
        params,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue('{"brand":"alpha"}')
        const workspace = AiRunMediaWorkspace.create({
          aiRunId: params.body.aiRunId,
        })
        const mediumFilePath = await workspace.writeMediumFile(mockMediumFile)

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
        await expect(fsPromises.readFile(mediumFilePath))
          .rejects
          .toThrow('ENOENT') // the file is gone, not merely unreadable
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A run whose work threw is a run that ended, and it is the way most likely to leave a fetch
     * half done - a run that fetched four of its twelve files and then failed on the fifth. The
     * directory is removed whole, so no record of what it managed to fetch is needed.
     */
    describe('should delete the temporary copies when the work threw', () => {
      const cases = [
        {
          mockMediumFile: {
            aiRunMediaId: 10450303,
            bytes: Buffer.from('side-elevation-bytes'),
          },
          params: {
            body: {
              aiRunId: 10450203,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450203,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            hasSettled: true,
          },
        },
        {
          mockMediumFile: {
            aiRunMediaId: 10450304,
            bytes: Buffer.from('roof-plan-bytes'),
          },
          params: {
            body: {
              aiRunId: 10450204,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450204,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            hasSettled: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        mockMediumFile,
        params,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockRejectedValue(new Error('the provider answered 503'))
        const workspace = AiRunMediaWorkspace.create({
          aiRunId: params.body.aiRunId,
        })
        const mediumFilePath = await workspace.writeMediumFile(mockMediumFile)

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
        await expect(fsPromises.readFile(mediumFilePath))
          .rejects
          .toThrow('ENOENT') // the file is gone, not merely unreadable
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The run went past its limit and the work never settled at all - the shape the limit exists
     * for, and the one way of ending where the work is still running when the removal happens.
     * What is asserted is that the run ending triggers the deletion, and not the work finishing:
     * nothing here ever lets the work finish.
     *
     * The limit of that is written on `#executeJob()` itself rather than hidden here: a work still
     * running can write another copy afterwards and recreate the directory, and there is no signal
     * that stops it.
     */
    describe('should delete the temporary copies when the run went past its time limit', () => {
      const cases = [
        {
          mockMediumFile: {
            aiRunMediaId: 10450305,
            bytes: Buffer.from('site-boundary-bytes'),
          },
          params: {
            body: {
              aiRunId: 10450205,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450205,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            hasSettled: true,
          },
        },
        {
          mockMediumFile: {
            aiRunMediaId: 10450306,
            bytes: Buffer.from('drainage-run-bytes'),
          },
          params: {
            body: {
              aiRunId: 10450206,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450206,
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            hasSettled: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        mockMediumFile,
        params,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 1,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockReturnValue(new Promise(() => {
            // A run that holds a worker indefinitely: nothing here ever settles it.
          }))
        const workspace = AiRunMediaWorkspace.create({
          aiRunId: params.body.aiRunId,
        })
        const mediumFilePath = await workspace.writeMediumFile(mockMediumFile)

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
        await expect(fsPromises.readFile(mediumFilePath))
          .rejects
          .toThrow('ENOENT') // the file is gone, not merely unreadable
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A run can also end by the delivery being thrown out of, and the terminal write itself failing
     * is the way that reaches furthest: by then the work has already run and may already have
     * fetched. The delivery still raises, so the queue records a failed delivery; what is asserted
     * beside it is that the raising did not take the removal with it.
     */
    describe('should delete the temporary copies when the terminal write threw', () => {
      const cases = [
        {
          mockMediumFile: {
            aiRunMediaId: 10450307,
            bytes: Buffer.from('floor-plan-bytes'),
          },
          params: {
            body: {
              aiRunId: 10450207,
            },
            context: {},
            parcel: {},
          },
        },
        {
          mockMediumFile: {
            aiRunMediaId: 10450308,
            bytes: Buffer.from('ceiling-plan-bytes'),
          },
          params: {
            body: {
              aiRunId: 10450208,
            },
            context: {},
            parcel: {},
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        mockMediumFile,
        params,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockRejectedValue(new Error('the transition could not be written'))
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue('{"brand":"alpha"}')
        const workspace = AiRunMediaWorkspace.create({
          aiRunId: params.body.aiRunId,
        })
        const mediumFilePath = await workspace.writeMediumFile(mockMediumFile)

        const actual = () => worker.executeJob(params)

        await expect(actual)
          .rejects
          .toThrow('the transition could not be written')
        await expect(fsPromises.readFile(mediumFilePath))
          .rejects
          .toThrow('ENOENT') // the file is gone, not merely unreadable
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A run that succeeded and then could not delete a temporary directory has still succeeded, and
     * a run that failed has still failed for the reason it failed for. The removal sits in a
     * `finally`, where a throw would replace the result the delivery was returning - so what this
     * asserts is the result surviving a removal that rejected.
     *
     * The workspace is stubbed because a directory that refuses to be removed cannot be arranged on
     * every platform this suite runs on, and the branch is unreachable without one.
     */
    describe('should leave the ending of the run untouched when the removal failed', () => {
      const cases = [
        {
          mockResultBody: '{"brand":"alpha"}',
          params: {
            body: {
              aiRunId: 10450209,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450209,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
        {
          mockResultBody: null,
          params: {
            body: {
              aiRunId: 10450210,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450210,
            failureReasonCode: null,
            hasSettled: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        mockResultBody,
        params,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const removeWorkspace = jest.fn()
          .mockRejectedValue(new Error('EBUSY: resource busy or locked'))
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue(mockResultBody)
        jest.spyOn(worker, 'createAiRunMediaWorkspace')
          .mockReturnValue({
            removeWorkspace,
          })

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A delivery told the run had already settled fetched nothing of its own - its work never ran -
     * so the only directory it could remove is one another delivery made, and that other delivery
     * may still be working inside it. The run it was told about was settled by a writer that ran
     * the same removal on its own way out.
     */
    describe('should remove nothing when another writer already settled the run', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10450211,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450211,
            failureReasonCode: null,
            hasSettled: false,
          },
        },
        {
          params: {
            body: {
              aiRunId: 10450212,
            },
            context: {},
            parcel: {},
          },
          expected: {
            aiRunId: 10450212,
            failureReasonCode: null,
            hasSettled: false,
          },
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(false)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        const removeAiRunMediaWorkspaceSpy = jest.spyOn(worker, 'removeAiRunMediaWorkspace')

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
        expect(removeAiRunMediaWorkspaceSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * A concrete job throwing something with no class of its own, taken all the way through.
     *
     * `#executeAiRunWork()` is written by another service against this class's contract, and
     * `throw null` is a line somebody may write there. Reading the class off it inside the catch
     * raised a TypeError, and a throw inside a catch is not caught by that catch's own try - so it
     * escaped the outcome builder, passed the terminal write, and left `#executeJob()` with the
     * run still at running: no terminal state, and a client waiting on a callback that never comes.
     *
     * What is asserted is therefore the terminal write itself, and not merely that the call
     * returned: the failed transition was asked for, with the code an unclassified failure carries.
     */
    describe('should settle a run whose work threw nothing with a class', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10450301,
            },
            context: {},
            parcel: {},
          },
          mockFailure: null,
          expected: {
            aiRunId: 10450301,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            hasSettled: true,
          },
          label: 'a work that threw null',
        },
        {
          params: {
            body: {
              aiRunId: 10450302,
            },
            context: {},
            parcel: {},
          },
          mockFailure: 'the provider answered badly',
          expected: {
            aiRunId: 10450302,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            hasSettled: true,
          },
          label: 'a work that threw text',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        mockFailure,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockRejectedValue(mockFailure)

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
        expect(saveFailedAiRunOnce)
          .toHaveBeenCalledWith({
            aiRunId: expected.aiRunId,
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            failureParameters: null,
            finishedAt: expect.any(Date),
          })
        expect(saveSucceededAiRunOnce)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseAiRunJobWorker', () => {
  describe('#executeJob()', () => {
    /*
     * The removal's own site, reached from the `finally` of a delivery that succeeded. A throw
     * raised there would replace the result this delivery was returning with one about a
     * directory - so the result is what is asserted, beside the terminal write that produced it.
     */
    describe('should keep its result when the removal threw nothing with a class', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10450303,
            },
            context: {},
            parcel: {},
          },
          mockRemovalFailure: null,
          expected: {
            aiRunId: 10450303,
            failureReasonCode: null,
            hasSettled: true,
          },
          label: 'a removal that threw null',
        },
        {
          params: {
            body: {
              aiRunId: 10450304,
            },
            context: {},
            parcel: {},
          },
          mockRemovalFailure: 'rm refused ./ai-run-media-10450304',
          expected: {
            aiRunId: 10450304,
            failureReasonCode: null,
            hasSettled: true,
          },
          label: 'a removal that threw text',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        mockRemovalFailure,
        expected,
      }) => {
        const saveRunningAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveSucceededAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const saveFailedAiRunOnce = jest.fn()
          .mockResolvedValue(true)
        const worker = new BaseAiRunJobWorker({
          engine: {},
          config: {},
          manifest: BaseAiRunJobManifest.create({
            jobName: 'alpha-ai-run-queue',
          }),
          dispatcherHash: {},
          errorHash: {},
          runTimeLimitMilliseconds: 30000,
          aiRunStatusRecorder: {
            saveRunningAiRunOnce,
            saveSucceededAiRunOnce,
            saveFailedAiRunOnce,
          },
        })
        jest.spyOn(worker, 'executeAiRunWork')
          .mockResolvedValue('{"brand":"alpha"}')
        const removeWorkspace = jest.fn()
          .mockRejectedValue(mockRemovalFailure)
        jest.spyOn(worker, 'createAiRunMediaWorkspace')
          .mockReturnValue(/** @type {*} */ ({
            removeWorkspace,
          }))

        const actual = await worker.executeJob(params)

        expect(actual)
          .toEqual(expected)
        expect(saveSucceededAiRunOnce)
          .toHaveBeenCalledWith({
            aiRunId: expected.aiRunId,
            resultBody: '{"brand":"alpha"}',
            finishedAt: expect.any(Date),
          })
      })
    })
  })
})
