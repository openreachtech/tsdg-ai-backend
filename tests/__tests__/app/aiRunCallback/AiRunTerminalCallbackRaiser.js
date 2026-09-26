import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunTerminalCallbackRaiser from '../../../../app/aiRunCallback/AiRunTerminalCallbackRaiser.js'

/*
 * The seam a terminal transition calls to raise a run's callback — section 12's first acceptance
 * criterion, at the point the job is sent.
 *
 * The dispatcher is a stand-in in every case here, and it is the one collaborator that must be: a
 * real one opens a BullMQ queue on Redis, which is the external system this suite may not reach.
 * What each case pins is the sentence this class says to it — the body carries the run's id and
 * nothing else, and the connection is kept open — and what it does with each of the three answers
 * a dispatch can give.
 */

describe('AiRunTerminalCallbackRaiser', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#jobDispatcher', () => {
        const cases = [
          {
            input: {
              jobDispatcher: {
                label: 'job-dispatcher-0001',
              },
            },
            expected: {
              label: 'job-dispatcher-0001',
            },
          },
          {
            input: {
              jobDispatcher: {
                label: 'job-dispatcher-0002',
              },
            },
            expected: {
              label: 'job-dispatcher-0002',
            },
          },
        ]

        test.each(cases)('jobDispatcher: $input.jobDispatcher.label', ({
          input,
          expected,
        }) => {
          const raiser = new AiRunTerminalCallbackRaiser(input)

          expect(raiser)
            .toHaveProperty('jobDispatcher', expected)
        })
      })
    })
  })
})

describe('AiRunTerminalCallbackRaiser', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          input: {
            jobDispatcher: {
              label: 'job-dispatcher-0001',
            },
          },
        },
        {
          input: {
            jobDispatcher: {
              label: 'job-dispatcher-0002',
            },
          },
        },
      ]

      test.each(cases)('jobDispatcher: $input.jobDispatcher.label', ({
        input,
      }) => {
        const actual = AiRunTerminalCallbackRaiser.create(input)

        expect(actual)
          .toBeInstanceOf(AiRunTerminalCallbackRaiser)
      })
    })
  })
})

describe('AiRunTerminalCallbackRaiser', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            jobDispatcher: {
              label: 'job-dispatcher-0001',
            },
          },
          expected: {
            jobDispatcher: {
              label: 'job-dispatcher-0001',
            },
          },
        },
        {
          input: {
            jobDispatcher: {
              label: 'job-dispatcher-0002',
            },
          },
          expected: {
            jobDispatcher: {
              label: 'job-dispatcher-0002',
            },
          },
        },
      ]

      test.each(cases)('jobDispatcher: $input.jobDispatcher.label', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunTerminalCallbackRaiser)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackRaiser', () => {
  describe('.get:mentsuLogger', () => {
    describe('when called as is', () => {
      test('should be a MentsuLogger', () => {
        const actual = AiRunTerminalCallbackRaiser.mentsuLogger

        expect(actual)
          .toBeInstanceOf(MentsuLogger)
      })
    })
  })
})

describe('AiRunTerminalCallbackRaiser', () => {
  describe('#get:Ctor', () => {
    describe('should answer own constructor', () => {
      const cases = [
        {
          input: {
            RaiserCtor: AiRunTerminalCallbackRaiser,
          },
        },
        {
          input: {
            RaiserCtor: class AlphaAiRunTerminalCallbackRaiser extends AiRunTerminalCallbackRaiser {},
          },
        },
      ]

      test.each(cases)('RaiserCtor: $input.RaiserCtor.name', ({
        input,
      }) => {
        const raiser = input.RaiserCtor.create({
          jobDispatcher: {
            label: 'job-dispatcher-0001',
          },
        })

        const actual = raiser.Ctor

        expect(actual)
          .toBe(input.RaiserCtor) // same reference
      })
    })
  })
})

describe('AiRunTerminalCallbackRaiser', () => {
  describe('#raiseTerminalCallback()', () => {
    /*
     * The dispatch the terminal transition asks for. The response is handed back as it came, so
     * that a caller wanting the enqueued instant reads the dispatcher's own answer rather than
     * something rebuilt here.
     */
    describe('when the queue accepted the job', () => {
      const cases = [
        {
          input: {
            aiRunId: 10530021,
          },
          tally: {
            hasError: () => false,
          },
        },
        {
          input: {
            aiRunId: 10530022,
          },
          tally: {
            hasError: () => false,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        tally,
      }) => {
        const raiser = AiRunTerminalCallbackRaiser.create({
          jobDispatcher: {
            dispatchJob: async () => tally,
          },
        })

        const actual = await raiser.raiseTerminalCallback(input)

        expect(actual)
          .toBe(tally) // same reference
      })
    })

    /*
     * A body the queue refused, a Redis that answered an error: the run has already settled and is
     * never rewritten, so nothing is raised to the caller. The line is the only record that a run
     * settled with no callback queued for it.
     */
    describe('when the queue answered an error', () => {
      const cases = [
        {
          input: {
            aiRunId: 10530023,
          },
        },
        {
          input: {
            aiRunId: 10530024,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        jest.spyOn(AiRunTerminalCallbackRaiser.mentsuLogger, 'error')
          .mockReturnValue(null)

        const raiser = AiRunTerminalCallbackRaiser.create({
          jobDispatcher: {
            dispatchJob: async () => ({
              hasError: () => true,
            }),
          },
        })

        const actual = await raiser.raiseTerminalCallback(input)

        expect(actual)
          .toBeNull()
      })
    })

    describe('when the queue could not be reached', () => {
      const cases = [
        {
          input: {
            aiRunId: 10530025,
          },
          mockDispatchFailure: new Error('Connection is closed'),
        },
        {
          input: {
            aiRunId: 10530026,
          },
          mockDispatchFailure: new TypeError('connect ECONNREFUSED'),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        mockDispatchFailure,
      }) => {
        jest.spyOn(AiRunTerminalCallbackRaiser.mentsuLogger, 'error')
          .mockReturnValue(null)

        const raiser = AiRunTerminalCallbackRaiser.create({
          jobDispatcher: {
            dispatchJob: async () => {
              throw mockDispatchFailure
            },
          },
        })

        const actual = await raiser.raiseTerminalCallback(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunTerminalCallbackRaiser', () => {
  describe('#dispatchTerminalCallbackJob()', () => {
    /*
     * The body carries the run's id and nothing else — section 11's rule about a job body, which
     * holds here for the same reason: the worker reads the run it names. `keepsConnection` is what
     * leaves the dispatcher's queue open, because the dispatcher handed in is one the process
     * reuses for every run it settles.
     */
    describe('should send the run id and keep the connection', () => {
      const cases = [
        {
          input: {
            aiRunId: 10530021,
          },
          expected: {
            body: {
              aiRunId: 10530021,
            },
            keepsConnection: true,
          },
        },
        {
          input: {
            aiRunId: 10530022,
          },
          expected: {
            body: {
              aiRunId: 10530022,
            },
            keepsConnection: true,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const jobDispatcher = {
          /**
           * @returns {Promise<*>} The dispatcher's response.
           */
          dispatchJob: async () => ({
            hasError: () => false,
          }),
        }
        const dispatchJobSpy = jest.spyOn(jobDispatcher, 'dispatchJob')

        const raiser = AiRunTerminalCallbackRaiser.create({
          jobDispatcher,
        })

        await raiser.dispatchTerminalCallbackJob(input)

        expect(dispatchJobSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackRaiser', () => {
  describe('#logUnraisedTerminalCallback()', () => {
    /*
     * The run's id alone. What the queue's own error says is composed by a library out of a
     * connection this service configures, and section 7 keeps a log to ids, reason codes and
     * counts.
     */
    describe('should write the line naming the run', () => {
      const cases = [
        {
          input: {
            aiRunId: 10530021,
          },
          expected: {
            message: 'AiRunTerminalCallbackRaiser#raiseTerminalCallback() reached no queue: AiRunId 10530021',
            tags: [
              'AiRunCallback',
              'UnraisedJob',
            ],
          },
        },
        {
          input: {
            aiRunId: 10530022,
          },
          expected: {
            message: 'AiRunTerminalCallbackRaiser#raiseTerminalCallback() reached no queue: AiRunId 10530022',
            tags: [
              'AiRunCallback',
              'UnraisedJob',
            ],
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
        expected,
      }) => {
        const errorLogSpy = jest.spyOn(AiRunTerminalCallbackRaiser.mentsuLogger, 'error')
          .mockReturnValue(null)

        const raiser = AiRunTerminalCallbackRaiser.create({
          jobDispatcher: {
            label: 'job-dispatcher-0001',
          },
        })

        raiser.logUnraisedTerminalCallback(input)

        expect(errorLogSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
