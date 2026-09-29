import AiRunJobDispatchRegistrar from '../../../../app/aiRun/AiRunJobDispatchRegistrar.js'

describe('AiRunJobDispatchRegistrar', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      /*
       * The dispatcher is held by reference rather than copied, and the cases say so: its only
       * member is a function, and two functions written the same way are still two functions. So
       * the value handed in is the value asserted, and the label names the case because a stub
       * carrying nothing but a function has no field worth printing.
       */
      describe('#jobDispatcher', () => {
        const cases = [
          {
            tally: {
              jobDispatcher: {
                dispatchJob: () => null,
              },
            },
            label: 'a dispatcher that answers with null',
          },
          {
            tally: {
              jobDispatcher: {
                dispatchJob: async () => null,
              },
            },
            label: 'a dispatcher that answers with a promise',
          },
        ]

        test.each(cases)('label: $label', ({
          tally,
        }) => {
          const registrar = new AiRunJobDispatchRegistrar(tally)

          expect(registrar)
            .toHaveProperty('jobDispatcher', tally.jobDispatcher) // same reference
        })
      })
    })
  })
})

describe('AiRunJobDispatchRegistrar', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          tally: {
            jobDispatcher: {
              dispatchJob: () => null,
            },
          },
          label: 'a dispatcher that answers with null',
        },
        {
          tally: {
            jobDispatcher: {
              dispatchJob: async () => null,
            },
          },
          label: 'a dispatcher that answers with a promise',
        },
      ]

      test.each(cases)('label: $label', ({
        tally,
      }) => {
        const received = AiRunJobDispatchRegistrar.create(tally)

        expect(received)
          .toBeInstanceOf(AiRunJobDispatchRegistrar)
      })
    })
  })
})

describe('AiRunJobDispatchRegistrar', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            jobDispatcher: {
              dispatchJob: () => null,
            },
          },
          label: 'a dispatcher that answers with null',
        },
        {
          tally: {
            jobDispatcher: {
              dispatchJob: async () => null,
            },
          },
          label: 'a dispatcher that answers with a promise',
        },
      ]

      test.each(cases)('label: $label', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunJobDispatchRegistrar)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('AiRunJobDispatchRegistrar', () => {
  describe('#dispatchAiRunJob()', () => {
    /*
     * Two things are pinned here, and the second one is the one that bites.
     *
     * The body carries the run's id and nothing else — a worker loads the run it names, so a value
     * copied into the queue could only go stale between the enqueue and the run.
     *
     * `keepsConnection: true` is not a tuning choice. `BaseJobDispatcher#dispatchJob()` closes its
     * own BullMQ queue in a `finally` unless it is asked not to, so without this a dispatcher held
     * for the life of the process would connect and disconnect from Redis once per accepted run,
     * and the second run would find its queue already closed. A regression here would pass every
     * other test in this file and fail under the second request of the day.
     */
    describe('should dispatch the job of the run it was handed', () => {
      const cases = [
        {
          input: {
            aiRunId: 10310011,
          },
          expected: {
            body: {
              aiRunId: 10310011,
            },
            keepsConnection: true,
          },
        },
        {
          input: {
            aiRunId: 10310012,
          },
          expected: {
            body: {
              aiRunId: 10310012,
            },
            keepsConnection: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const dispatchJobSpy = jest.fn()
        const registrar = AiRunJobDispatchRegistrar.create({
          jobDispatcher: /** @type {*} */ ({
            dispatchJob: dispatchJobSpy,
          }),
        })

        await registrar.dispatchAiRunJob(input)

        expect(dispatchJobSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunJobDispatchRegistrar', () => {
  describe('#dispatchAiRunJob()', () => {
    /*
     * The dispatcher's answer is handed back untouched. It is what carries an enqueue failure —
     * the package catches its own errors and reports them on the response rather than throwing —
     * so a caller that wants to know whether the job was accepted has to be able to read it.
     */
    describe('should answer with the dispatcher response', () => {
      const cases = [
        {
          input: {
            aiRunId: 10310013,
          },
          tally: {
            dispatchedAt: new Date('2026-09-26T01:01:01.001Z'),
          },
        },
        {
          input: {
            aiRunId: 10310014,
          },
          tally: {
            dispatchedAt: new Date('2026-09-26T02:02:02.002Z'),
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        tally,
      }) => {
        const dispatchJobSpy = jest.fn()
          .mockResolvedValue(tally)
        const registrar = AiRunJobDispatchRegistrar.create({
          jobDispatcher: /** @type {*} */ ({
            dispatchJob: dispatchJobSpy,
          }),
        })

        const received = await registrar.dispatchAiRunJob(input)

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})
