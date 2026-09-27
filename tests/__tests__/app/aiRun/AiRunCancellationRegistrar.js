import AiRunCancellationRegistrar from '../../../../app/aiRun/AiRunCancellationRegistrar.js'

import AiRunStatusRecorder from '../../../../app/aiRun/AiRunStatusRecorder.js'
import AiRunTerminalStatusInspector from '../../../../app/aiRun/AiRunTerminalStatusInspector.js'

import AiRun from '../../../../sequelize/models/AiRun.js'
import AiRunStatus from '../../../../sequelize/models/AiRunStatus.js'

/*
 * Every member of this class that writes nothing, read against the development seeders.
 *
 * `#registerAiRunCancellation()` and `#saveRequestedAiRunCancellation()` are not here: both write
 * to `ai_runs`, so they live under `tests/_orders/AiRun/` with the runs they stand on, which that
 * file creates in `#run-cancel`'s own id block.
 *
 * **`#findAiRun()` is the one that carries the eighth acceptance criterion of §15.** A run
 * belonging to another client answers exactly as a key naming nothing does, and it answers that
 * way because the client is a condition of the read — so the run is never loaded, and "left
 * unchanged" is a property of the query rather than of a later check. The three describes below
 * are deliberately the same assertion three times over: the point is that the two absences cannot
 * be told apart.
 */

describe('AiRunCancellationRegistrar', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunTerminalStatusInspector', () => {
        const cases = [
          {
            label: 'a settled run, nothing left to write',
            input: {
              aiRunTerminalStatusInspector: {
                isTerminalAiRunStatus: () => true,
              },
              aiRunStatusRecorder: {
                saveAiRunCancelRequest: () => Promise.resolve(null),
                saveAiRunOnce: () => Promise.resolve(true),
              },
            },
          },
          {
            label: 'an ongoing run, the write outraced',
            input: {
              aiRunTerminalStatusInspector: {
                isTerminalAiRunStatus: () => false,
              },
              aiRunStatusRecorder: {
                saveAiRunCancelRequest: () => Promise.resolve(null),
                saveAiRunOnce: () => Promise.resolve(false),
              },
            },
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const registrar = new AiRunCancellationRegistrar(input)

          expect(registrar)
            .toHaveProperty('aiRunTerminalStatusInspector', input.aiRunTerminalStatusInspector)
        })
      })

      describe('#aiRunStatusRecorder', () => {
        const cases = [
          {
            label: 'a settled run, nothing left to write',
            input: {
              aiRunTerminalStatusInspector: {
                isTerminalAiRunStatus: () => true,
              },
              aiRunStatusRecorder: {
                saveAiRunCancelRequest: () => Promise.resolve(null),
                saveAiRunOnce: () => Promise.resolve(true),
              },
            },
          },
          {
            label: 'an ongoing run, the write outraced',
            input: {
              aiRunTerminalStatusInspector: {
                isTerminalAiRunStatus: () => false,
              },
              aiRunStatusRecorder: {
                saveAiRunCancelRequest: () => Promise.resolve(null),
                saveAiRunOnce: () => Promise.resolve(false),
              },
            },
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const registrar = new AiRunCancellationRegistrar(input)

          expect(registrar)
            .toHaveProperty('aiRunStatusRecorder', input.aiRunStatusRecorder)
        })
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          label: 'a settled run, nothing left to write',
          input: {
            aiRunTerminalStatusInspector: {
              isTerminalAiRunStatus: () => true,
            },
            aiRunStatusRecorder: {
              saveAiRunCancelRequest: () => Promise.resolve(null),
              saveAiRunOnce: () => Promise.resolve(true),
            },
          },
        },
        {
          label: 'an ongoing run, the write outraced',
          input: {
            aiRunTerminalStatusInspector: {
              isTerminalAiRunStatus: () => false,
            },
            aiRunStatusRecorder: {
              saveAiRunCancelRequest: () => Promise.resolve(null),
              saveAiRunOnce: () => Promise.resolve(false),
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRunCancellationRegistrar.create(input)

        expect(received)
          .toBeInstanceOf(AiRunCancellationRegistrar)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          label: 'a settled run, nothing left to write',
          input: {
            aiRunTerminalStatusInspector: {
              isTerminalAiRunStatus: () => true,
            },
            aiRunStatusRecorder: {
              saveAiRunCancelRequest: () => Promise.resolve(null),
              saveAiRunOnce: () => Promise.resolve(true),
            },
          },
        },
        {
          label: 'an ongoing run, the write outraced',
          input: {
            aiRunTerminalStatusInspector: {
              isTerminalAiRunStatus: () => false,
            },
            aiRunStatusRecorder: {
              saveAiRunCancelRequest: () => Promise.resolve(null),
              saveAiRunOnce: () => Promise.resolve(false),
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCancellationRegistrar)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })

    /*
     * Both collaborators are filled from this class's own static factories, so a caller that
     * states neither gets the real inspector and the real recorder rather than nothing.
     */
    describe('should fill default aiRunTerminalStatusInspector', () => {
      test('with no arguments', () => {
        const expected = expect.objectContaining({
          aiRunTerminalStatusInspector: expect.any(AiRunTerminalStatusInspector),
        })

        const SpyClass = constructorSpy.spyOn(AiRunCancellationRegistrar)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default aiRunStatusRecorder', () => {
      test('with no arguments', () => {
        const expected = expect.objectContaining({
          aiRunStatusRecorder: expect.any(AiRunStatusRecorder),
        })

        const SpyClass = constructorSpy.spyOn(AiRunCancellationRegistrar)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('.get:AiRunCtor', () => {
    describe('when called as is', () => {
      test('should be the run model', () => {
        const received = AiRunCancellationRegistrar.AiRunCtor

        expect(received)
          .toBe(AiRun) // same reference
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('.get:AiRunStatusCtor', () => {
    describe('when called as is', () => {
      test('should be the run status master model', () => {
        const received = AiRunCancellationRegistrar.AiRunStatusCtor

        expect(received)
          .toBe(AiRunStatus) // same reference
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('.createAiRunTerminalStatusInspector()', () => {
    describe('when called as is', () => {
      test('should be instance of AiRunTerminalStatusInspector', () => {
        const received = AiRunCancellationRegistrar.createAiRunTerminalStatusInspector()

        expect(received)
          .toBeInstanceOf(AiRunTerminalStatusInspector)
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('.createAiRunStatusRecorder()', () => {
    describe('when called as is', () => {
      test('should be instance of AiRunStatusRecorder', () => {
        const received = AiRunCancellationRegistrar.createAiRunStatusRecorder()

        expect(received)
          .toBeInstanceOf(AiRunStatusRecorder)
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunCancellationRegistrar,
      },
      {
        tally: class AlphaAiRunCancellationRegistrar extends AiRunCancellationRegistrar {},
      },
      {
        tally: class BetaAiRunCancellationRegistrar extends AiRunCancellationRegistrar {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const registrar = tally.create()

      const received = registrar.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('#findAiRun()', () => {
    /*
     * The three columns a cancellation is decided on, read off seeded rows. The queued run carries
     * no cancellation instant, the canceled one carries the instant it was asked at — 400
     * milliseconds before it took effect — so both sides of "has this already been asked for" are
     * read from the table rather than stated here.
     *
     * The first case also asserts the status association came back, because the name is what the
     * answered body carries and an include that silently stopped loading would leave that body
     * with nothing to read.
     */
    describe('when the client owns the run', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010002',
            apiClientId: 10000001,
          },
          expected: expect.objectContaining({
            id: 10010002,
            AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
            cancelRequestedAt: null,
            AiRunStatus: expect.objectContaining({
              name: 'queued',
            }),
          }),
        },
        {
          input: {
            runKey: 'run-key-10010001',
            apiClientId: 10000001,
          },
          expected: expect.objectContaining({
            id: 10010001,
            AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
            cancelRequestedAt: null,
          }),
        },
        {
          input: {
            runKey: 'run-key-10010006',
            apiClientId: 10000001,
          },
          expected: expect.objectContaining({
            id: 10010006,
            AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
            cancelRequestedAt: new Date('2026-09-10T06:06:07.307Z'),
          }),
        },
        {
          input: {
            runKey: 'run-key-10010003',
            apiClientId: 10000002,
          },
          expected: expect.objectContaining({
            id: 10010003,
            AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
            cancelRequestedAt: null,
          }),
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const registrar = AiRunCancellationRegistrar.create()

        const received = await registrar.findAiRun(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The eighth acceptance criterion. Each run below really exists and really belongs to somebody
     * else, so what is asserted is that the client in the `where` keeps it out of reach.
     */
    describe('when the run belongs to another client', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010003',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            runKey: 'run-key-10010009',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            runKey: 'run-key-10010002',
            apiClientId: 10000002,
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const registrar = AiRunCancellationRegistrar.create()

        const received = await registrar.findAiRun(input)

        expect(received)
          .toBeNull()
      })
    })

    /*
     * The same null, from a key no run carries and from a path that carried no key at all. Nothing
     * downstream can tell this describe's answer from the one above it, which is the point.
     */
    describe('when no run carries the key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10819001',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            runKey: null,
            apiClientId: 10000001,
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const registrar = AiRunCancellationRegistrar.create()

        const received = await registrar.findAiRun(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('#shouldSaveAiRunCancelRequest()', () => {
    /*
     * The two statuses a run can still be asked to stop from, neither of them yet asked about.
     */
    describe('when the run is still going and has not been asked about', () => {
      const cases = [
        {
          input: {
            aiRun: {
              id: 10810101,
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              cancelRequestedAt: null,
            },
          },
        },
        {
          input: {
            aiRun: {
              id: 10810102,
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              cancelRequestedAt: null,
            },
          },
        },
      ]

      test.each(cases)('AiRunStatusId: $input.aiRun.AiRunStatusId', ({
        input,
      }) => {
        const registrar = AiRunCancellationRegistrar.create()

        const received = registrar.shouldSaveAiRunCancelRequest(input)

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * All three terminal statuses, one per case, so a reading that let one of them through is
     * named by the case that fails. This is the fifth acceptance criterion at the point it is
     * decided: a settled run has no cancellation left to create, which is why the caller answers
     * its state instead of refusing.
     */
    describe('when the run has settled', () => {
      const cases = [
        {
          input: {
            aiRun: {
              id: 10810111,
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              cancelRequestedAt: null,
            },
          },
        },
        {
          input: {
            aiRun: {
              id: 10810112,
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              cancelRequestedAt: null,
            },
          },
        },
        {
          input: {
            aiRun: {
              id: 10810113,
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              cancelRequestedAt: new Date('2026-11-02T03:03:03.003Z'),
            },
          },
        },
      ]

      test.each(cases)('AiRunStatusId: $input.aiRun.AiRunStatusId', ({
        input,
      }) => {
        const registrar = AiRunCancellationRegistrar.create()

        const received = registrar.shouldSaveAiRunCancelRequest(input)

        expect(received)
          .toBeFalsy()
      })
    })

    /*
     * Asking twice. The run is still going, so nothing about its status stops the write — what
     * stops it is the instant already on the row, and keeping that instant is what leaves §15's
     * third use case a gap to measure.
     */
    describe('when the cancellation was already asked for', () => {
      const cases = [
        {
          input: {
            aiRun: {
              id: 10810121,
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              cancelRequestedAt: new Date('2026-11-03T04:04:04.004Z'),
            },
          },
        },
        {
          input: {
            aiRun: {
              id: 10810122,
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              cancelRequestedAt: new Date('2026-11-04T05:05:05.005Z'),
            },
          },
        },
      ]

      test.each(cases)('cancelRequestedAt: $input.aiRun.cancelRequestedAt', ({
        input,
      }) => {
        const registrar = AiRunCancellationRegistrar.create()

        const received = registrar.shouldSaveAiRunCancelRequest(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunCancellationRegistrar', () => {
  describe('#buildAiRunCancellationResponse()', () => {
    /*
     * All five statuses, because the contract's union carries all five and a body built for one of
     * them would leave the other four met for the first time by whoever wired against this route.
     * The three terminal names are the fifth acceptance criterion's own answer — the state the run
     * reached, travelling as a body rather than as an error.
     */
    describe('should carry the status the run stands at', () => {
      const cases = [
        {
          input: {
            aiRun: {
              AiRunStatus: {
                name: 'queued',
              },
            },
          },
          expected: {
            statusName: 'queued',
          },
        },
        {
          input: {
            aiRun: {
              AiRunStatus: {
                name: 'running',
              },
            },
          },
          expected: {
            statusName: 'running',
          },
        },
        {
          input: {
            aiRun: {
              AiRunStatus: {
                name: 'succeeded',
              },
            },
          },
          expected: {
            statusName: 'succeeded',
          },
        },
        {
          input: {
            aiRun: {
              AiRunStatus: {
                name: 'failed',
              },
            },
          },
          expected: {
            statusName: 'failed',
          },
        },
        {
          input: {
            aiRun: {
              AiRunStatus: {
                name: 'canceled',
              },
            },
          },
          expected: {
            statusName: 'canceled',
          },
        },
      ]

      test.each(cases)('name: $input.aiRun.AiRunStatus.name', ({
        input,
        expected,
      }) => {
        const registrar = AiRunCancellationRegistrar.create()

        const received = registrar.buildAiRunCancellationResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
