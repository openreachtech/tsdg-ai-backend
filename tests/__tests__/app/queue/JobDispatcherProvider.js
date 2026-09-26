import {
  EventEmitter,
} from 'node:events'

import timersPromises from 'node:timers/promises'

import {
  ProcessClerk,
} from '@openreachtech/renchan-job-bullmq'

import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import JobDispatcherProvider from '../../../../app/queue/JobDispatcherProvider.js'

/*
 * Every dispatcher class in this file is a fake built inside the test that uses it, and a distinct
 * object each time. That is not a shortcut around a real one: a real dispatcher opens a BullMQ
 * queue against Redis and waits until it is ready, and `npm run test` is runnable with nothing but
 * Node installed. It is also what keeps these cases independent of one another — the pool this
 * class holds is static and keyed by the dispatcher class, so two cases sharing one key would be
 * sharing one entry.
 */

describe('JobDispatcherProvider', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#JobDispatcherCtors', () => {
        const cases = [
          {
            input: {
              JobDispatcherCtors: [],
              processClerk: ProcessClerk.create(),
            },
            expected: [],
          },
          {
            input: {
              JobDispatcherCtors: [
                Object,
                Array,
              ],
              processClerk: ProcessClerk.create(),
            },
            expected: [
              Object,
              Array,
            ],
          },
        ]

        test.each(cases)('JobDispatcherCtors.length: $input.JobDispatcherCtors.length', ({
          input,
          expected,
        }) => {
          const received = new JobDispatcherProvider(input)

          expect(received)
            .toHaveProperty('JobDispatcherCtors', expected)
        })
      })

      describe('#processClerk', () => {
        const cases = [
          {
            input: {
              JobDispatcherCtors: [],
              processClerk: ProcessClerk.create(),
            },
          },
          {
            input: {
              JobDispatcherCtors: [
                Object,
              ],
              processClerk: ProcessClerk.create(),
            },
          },
        ]

        test.each(cases)('JobDispatcherCtors.length: $input.JobDispatcherCtors.length', ({
          input,
        }) => {
          const received = new JobDispatcherProvider(input)

          expect(received)
            .toHaveProperty('processClerk', input.processClerk)
        })
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            JobDispatcherCtors: [],
            processClerk: ProcessClerk.create(),
          },
        },
        {
          input: {
            JobDispatcherCtors: [
              Object,
            ],
            processClerk: ProcessClerk.create(),
          },
        },
      ]

      test.each(cases)('JobDispatcherCtors.length: $input.JobDispatcherCtors.length', ({
        input,
      }) => {
        const received = JobDispatcherProvider.create(input)

        expect(received)
          .toBeInstanceOf(JobDispatcherProvider)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            JobDispatcherCtors: [],
            processClerk: ProcessClerk.create(),
          },
        },
        {
          input: {
            JobDispatcherCtors: [
              Object,
              Array,
            ],
            processClerk: ProcessClerk.create(),
          },
        },
      ]

      test.each(cases)('JobDispatcherCtors.length: $input.JobDispatcherCtors.length', ({
        input,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(JobDispatcherProvider)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })

    describe('with no arguments', () => {
      test('should fill both defaults', () => {
        const processClerk = ProcessClerk.create()
        jest.spyOn(JobDispatcherProvider, 'createProcessClerk')
          .mockReturnValue(processClerk)

        const received = JobDispatcherProvider.create()

        expect(received)
          .toHaveProperty('JobDispatcherCtors', [])
        expect(received)
          .toHaveProperty('processClerk', processClerk)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('.jobDispatcherPromisePool', () => {
    describe('when called as is', () => {
      test('should be a WeakMap', () => {
        const received = JobDispatcherProvider.jobDispatcherPromisePool

        expect(received)
          .toBeInstanceOf(WeakMap)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('.get:ProcessClerkCtor', () => {
    describe('when called as is', () => {
      test('should be ProcessClerk', () => {
        const received = JobDispatcherProvider.ProcessClerkCtor

        expect(received)
          .toBe(ProcessClerk) // same reference
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('.createProcessClerk()', () => {
    describe('when called as is', () => {
      test('should be an instance of ProcessClerk', () => {
        const received = JobDispatcherProvider.createProcessClerk()

        expect(received)
          .toBeInstanceOf(ProcessClerk)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: JobDispatcherProvider,
      },
      {
        tally: class AlphaJobDispatcherProvider extends JobDispatcherProvider {},
      },
      {
        tally: class BetaJobDispatcherProvider extends JobDispatcherProvider {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const provider = tally.create()

      const received = provider.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#ensureJobDispatcher()', () => {
    describe('when the dispatcher has not been built yet', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'AlphaJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
        {
          input: {
            jobDispatcherName: 'BetaJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        tally,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue(tally),
          },
        }

        const received = await provider.ensureJobDispatcher(args)

        expect(received)
          .toBe(tally) // same reference
        expect(args.JobDispatcherCtor.createAsync)
          .toHaveBeenCalledWith()
      })
    })

    describe('when the dispatcher has already been built', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'GammaJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
        {
          input: {
            jobDispatcherName: 'DeltaJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        tally,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue(tally),
          },
        }
        await provider.ensureJobDispatcher(args)

        const received = await provider.ensureJobDispatcher(args)

        expect(received)
          .toBe(tally) // same reference
        expect(args.JobDispatcherCtor.createAsync)
          .toHaveBeenCalledTimes(1)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#hasJobDispatcher()', () => {
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'EpsilonJobDispatcher',
          },
        },
        {
          input: {
            jobDispatcherName: 'ZetaJobDispatcher',
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn(),
          },
        }

        const received = provider.hasJobDispatcher(args)

        expect(received)
          .toBeFalsy()
      })
    })

    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'EtaJobDispatcher',
          },
        },
        {
          input: {
            jobDispatcherName: 'ThetaJobDispatcher',
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: () => null,
              }),
          },
        }
        provider.addJobDispatcherToPool(args)

        const received = provider.hasJobDispatcher(args)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#addJobDispatcherToPool()', () => {
    describe('should record the dispatcher class as its own to close', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'IotaJobDispatcher',
          },
        },
        {
          input: {
            jobDispatcherName: 'KappaJobDispatcher',
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: () => null,
              }),
          },
        }
        provider.addJobDispatcherToPool(args)

        const received = provider.JobDispatcherCtors

        expect(received)
          .toEqual([
            args.JobDispatcherCtor,
          ])
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#createJobDispatcher()', () => {
    const cases = [
      {
        input: {
          jobDispatcherName: 'LambdaJobDispatcher',
        },
        tally: {
          teardown: () => null,
        },
      },
      {
        input: {
          jobDispatcherName: 'MuJobDispatcher',
        },
        tally: {
          teardown: () => null,
        },
      },
    ]

    test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
      input,
      tally,
    }) => {
      const provider = JobDispatcherProvider.create()

      const args = {
        JobDispatcherCtor: {
          name: input.jobDispatcherName,
          createAsync: jest.fn()
            .mockResolvedValue(tally),
        },
      }

      const received = await provider.createJobDispatcher(args)

      expect(received)
        .toBe(tally) // same reference
      expect(args.JobDispatcherCtor.createAsync)
        .toHaveBeenCalledWith()
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#extractJobDispatcherPromise()', () => {
    describe('when the pool holds none', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'NuJobDispatcher',
          },
        },
        {
          input: {
            jobDispatcherName: 'XiJobDispatcher',
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn(),
          },
        }

        const received = provider.extractJobDispatcherPromise(args)

        expect(received)
          .toBeNull()
      })
    })

    describe('when the pool holds one', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'OmicronJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
        {
          input: {
            jobDispatcherName: 'PiJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        tally,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue(tally),
          },
        }
        provider.addJobDispatcherToPool(args)

        const received = await provider.extractJobDispatcherPromise(args)

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#attachShutdownSink()', () => {
    const cases = [
      {
        input: {
          ProviderCtor: JobDispatcherProvider,
        },
        tally: {
          SIGINT: () => null,
          SIGTERM: () => null,
        },
      },
      {
        input: {
          ProviderCtor: class GammaJobDispatcherProvider extends JobDispatcherProvider {},
        },
        tally: {
          SIGINT: () => null,
          SIGTERM: () => null,
        },
      },
    ]

    test.each(cases)('ProviderCtor: $input.ProviderCtor.name', ({
      input,
      tally,
    }) => {
      const processClerk = ProcessClerk.create()
      const attachSinkSpy = jest.spyOn(processClerk, 'attachSink')
        .mockReturnValue(null)
      const provider = input.ProviderCtor.create({
        processClerk,
      })
      jest.spyOn(provider, 'buildShutdownSink')
        .mockReturnValue(tally)

      provider.attachShutdownSink()

      expect(attachSinkSpy)
        .toHaveBeenCalledWith({
          sink: tally,
        })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#buildShutdownSink()', () => {
    describe('should answer every signal by shutting the dispatchers down', () => {
      const cases = [
        {
          input: {
            signalName: 'SIGINT',
          },
        },
        {
          input: {
            signalName: 'SIGTERM',
          },
        },
      ]

      test.each(cases)('signalName: $input.signalName', async ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()
        const shutdownJobDispatchersSpy = jest.spyOn(provider, 'shutdownJobDispatchers')
          .mockResolvedValue(null)
        const sink = provider.buildShutdownSink()

        await sink[input.signalName]()

        expect(shutdownJobDispatchersSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#shutdownJobDispatchers()', () => {
    const cases = [
      {
        input: {
          teardownResponses: [],
        },
      },
      {
        input: {
          teardownResponses: [
            'teardown-response-0003',
            'teardown-response-0004',
          ],
        },
      },
    ]

    test.each(cases)('teardownResponses.length: $input.teardownResponses.length', async ({
      input,
    }) => {
      const processClerk = ProcessClerk.create()
      const exitSpy = jest.spyOn(processClerk, 'exit')
        .mockReturnValue(null)
      const provider = JobDispatcherProvider.create({
        processClerk,
      })
      const teardownJobDispatchersSpy = jest.spyOn(provider, 'teardownJobDispatchers')
        .mockResolvedValue(input.teardownResponses)

      await provider.shutdownJobDispatchers()

      expect(teardownJobDispatchersSpy)
        .toHaveBeenCalledWith()
      expect(exitSpy)
        .toHaveBeenCalledWith()
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#teardownJobDispatchers()', () => {
    describe('when the provider built none', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
        },
        {
          input: {
            ProviderCtor: class DeltaJobDispatcherProvider extends JobDispatcherProvider {},
          },
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', async ({
        input,
      }) => {
        const provider = input.ProviderCtor.create()

        const received = await provider.teardownJobDispatchers()

        expect(received)
          .toHaveLength(0)
      })
    })

    describe('when the provider built some', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'RhoJobDispatcher',
          },
          expected: 'teardown-response-0001',
        },
        {
          input: {
            jobDispatcherName: 'SigmaJobDispatcher',
          },
          expected: 'teardown-response-0002',
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        expected,
      }) => {
        const teardownSpy = jest.fn()
          .mockResolvedValue(expected)
        const provider = JobDispatcherProvider.create()
        await provider.ensureJobDispatcher({
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: teardownSpy,
              }),
          },
        })

        const received = await provider.teardownJobDispatchers()

        expect(received)
          .toEqual([
            expected,
          ])
        expect(teardownSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('.get:mentsuLogger', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = JobDispatcherProvider.mentsuLogger

        expect(received)
          .toBeInstanceOf(MentsuLogger)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('.shutdownSinkPool', () => {
    describe('when called as is', () => {
      test('should be a WeakMap', () => {
        const received = JobDispatcherProvider.shutdownSinkPool

        expect(received)
          .toBeInstanceOf(WeakMap)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#ensureJobDispatcher()', () => {
    /*
     * The finding this answers: the pool holds the promise, so a build that rejected used to stay
     * in it forever and every later ask was handed that same rejection without a second build ever
     * being attempted. One Redis blip on a process's first accepted run would then fail every run
     * that process accepted afterwards, until somebody restarted it.
     *
     * What is asserted is a build attempted per ask, which is what says the failed entry did not
     * survive the rejection — the count is the whole point, so both cases drive it.
     */
    describe('should build again', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'ChiJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
        {
          input: {
            jobDispatcherName: 'PsiJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        tally,
      }) => {
        const createAsyncSpy = jest.fn()
          .mockRejectedValueOnce(new Error('the queue would not open'))
          .mockResolvedValue(tally)
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: createAsyncSpy,
          },
        }
        await provider.ensureJobDispatcher(args)
          .catch(() => null)

        const received = await provider.ensureJobDispatcher(args)

        expect(received)
          .toBe(tally) // same reference
        expect(createAsyncSpy)
          .toHaveBeenCalledTimes(2)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#removeJobDispatcherFromPool()', () => {
    describe('should take the entry back out', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'AlphaRemovedJobDispatcher',
          },
        },
        {
          input: {
            jobDispatcherName: 'BetaRemovedJobDispatcher',
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: () => null,
              }),
          },
        }
        provider.addJobDispatcherToPool(args)
        provider.removeJobDispatcherFromPool(args)

        const received = provider.hasJobDispatcher(args)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#recordJobDispatcherCtor()', () => {
    /*
     * Recorded once however often it is asked for. A class whose first build failed is built again
     * by the next ask, and a second entry would be a second teardown of the one connection the
     * successful build opened.
     */
    describe('should record a class once', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'GammaRecordedJobDispatcher',
          },
        },
        {
          input: {
            jobDispatcherName: 'DeltaRecordedJobDispatcher',
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: () => null,
              }),
          },
        }
        provider.recordJobDispatcherCtor(args)
        provider.recordJobDispatcherCtor(args)
        provider.recordJobDispatcherCtor(args)

        const received = provider.JobDispatcherCtors

        expect(received)
          .toEqual([
            args.JobDispatcherCtor,
          ])
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#ensureShutdownSink()', () => {
    /*
     * The same sink every time, because a handler is removed from a process by its identity. A
     * provider that answered a new hash per ask could never be detached from the signals it had
     * attached to, and every attach would leave another handler answering the same `SIGINT`.
     */
    describe('should be memoized', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
        },
        {
          input: {
            ProviderCtor: class ZetaJobDispatcherProvider extends JobDispatcherProvider {},
          },
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', ({
        input,
      }) => {
        const provider = input.ProviderCtor.create()
        const expected = provider.ensureShutdownSink()

        const received = provider.ensureShutdownSink()

        expect(received)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#hasShutdownSink()', () => {
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
        },
        {
          input: {
            ProviderCtor: class EtaJobDispatcherProvider extends JobDispatcherProvider {},
          },
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', ({
        input,
      }) => {
        const provider = input.ProviderCtor.create()

        const received = provider.hasShutdownSink()

        expect(received)
          .toBeFalsy()
      })
    })

    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
        },
        {
          input: {
            ProviderCtor: class ThetaJobDispatcherProvider extends JobDispatcherProvider {},
          },
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', ({
        input,
      }) => {
        const provider = input.ProviderCtor.create()
        provider.addShutdownSinkToPool()

        const received = provider.hasShutdownSink()

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#extractShutdownSink()', () => {
    describe('when the pool holds none', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
        },
        {
          input: {
            ProviderCtor: class IotaJobDispatcherProvider extends JobDispatcherProvider {},
          },
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', ({
        input,
      }) => {
        const provider = input.ProviderCtor.create()

        const received = provider.extractShutdownSink()

        expect(received)
          .toBeNull()
      })
    })

    describe('when the pool holds one', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
          tally: {
            SIGINT: () => null,
            SIGTERM: () => null,
          },
        },
        {
          input: {
            ProviderCtor: class KappaJobDispatcherProvider extends JobDispatcherProvider {},
          },
          tally: {
            SIGINT: () => null,
            SIGTERM: () => null,
          },
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', ({
        input,
        tally,
      }) => {
        const provider = input.ProviderCtor.create()
        jest.spyOn(provider, 'buildShutdownSink')
          .mockReturnValue(tally)
        provider.addShutdownSinkToPool()

        const received = provider.extractShutdownSink()

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#attachShutdownSink()', () => {
    /*
     * Attaching twice attaches once. `process.on` handed the same function twice registers it
     * twice, so nothing but the detach in front of the attach keeps a second call from leaving a
     * second handler answering the same signal — and the earlier code, rebuilding its sink per
     * call, could not even have detached the first.
     *
     * The clerk is the real one and the process it is pointed at is an `EventEmitter` of this
     * test's own, so what is counted is exactly what this provider registered and nothing the
     * runner or another test put on the real process.
     */
    describe('should leave one registration however often it is called', () => {
      const cases = [
        {
          input: {
            signalName: 'SIGINT',
          },
        },
        {
          input: {
            signalName: 'SIGTERM',
          },
        },
      ]

      test.each(cases)('signalName: $input.signalName', ({
        input,
      }) => {
        const rawProcess = new EventEmitter()
        const processClerk = ProcessClerk.create({
          rawProcess,
        })
        const provider = JobDispatcherProvider.create({
          processClerk,
        })

        provider.attachShutdownSink()
        provider.attachShutdownSink()
        provider.attachShutdownSink()

        const received = rawProcess.listenerCount(input.signalName)

        expect(received)
          .toBe(1)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#teardownJobDispatcher()', () => {
    describe('should answer what the teardown answered', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'LambdaTornDownJobDispatcher',
          },
          expected: 'teardown-response-0011',
        },
        {
          input: {
            jobDispatcherName: 'MuTornDownJobDispatcher',
          },
          expected: 'teardown-response-0012',
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        expected,
      }) => {
        const teardownSpy = jest.fn()
          .mockResolvedValue(expected)
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: teardownSpy,
              }),
          },
        }
        await provider.ensureJobDispatcher(args)

        const received = await provider.teardownJobDispatcher(args)

        expect(received)
          .toBe(expected)
        expect(teardownSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('when there is nothing to close', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'NuUnbuiltJobDispatcher',
          },
        },
        {
          input: {
            jobDispatcherName: 'XiUnbuiltJobDispatcher',
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: () => null,
              }),
          },
        }

        const received = await provider.teardownJobDispatcher(args)

        expect(received)
          .toBeNull()
      })
    })

    /*
     * A connection that would not close is written down and answered, not thrown. It is the whole
     * of the finding one method up: a rejection carried out of here stopped every teardown after
     * it and, above that, the exit the signal handler owes.
     */
    describe('when the teardown threw', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'OmicronStuckJobDispatcher',
          },
          mockError: new Error('the connection would not close'),
          expected: 'JobDispatcherProvider a queue connection would not close: OmicronStuckJobDispatcher, Error',
        },
        {
          input: {
            jobDispatcherName: 'PiStuckJobDispatcher',
          },
          mockError: new TypeError('the client was already gone'),
          expected: 'JobDispatcherProvider a queue connection would not close: PiStuckJobDispatcher, TypeError',
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        mockError,
        expected,
      }) => {
        const provider = JobDispatcherProvider.create()
        const errorSpy = jest.spyOn(JobDispatcherProvider.mentsuLogger, 'error')

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: jest.fn()
                  .mockRejectedValue(mockError),
              }),
          },
        }
        await provider.ensureJobDispatcher(args)

        const received = await provider.teardownJobDispatcher(args)

        expect(received)
          .toBeNull()
        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'JobDispatcher',
              'FailedTeardown',
            ],
          })
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#teardownJobDispatchers()', () => {
    /*
     * One connection that would not close must not take the others down with it. `Promise.all`
     * over promises that reject stops waiting on the rest, and the rest are the connections
     * nothing else is going to close — so each is closed on its own and answers for itself.
     */
    describe('when one teardown threw', () => {
      const cases = [
        {
          input: {
            stuckJobDispatcherName: 'RhoStuckJobDispatcher',
            openJobDispatcherName: 'SigmaOpenJobDispatcher',
          },
          expected: 'teardown-response-0021',
        },
        {
          input: {
            stuckJobDispatcherName: 'TauStuckJobDispatcher',
            openJobDispatcherName: 'UpsilonOpenJobDispatcher',
          },
          expected: 'teardown-response-0022',
        },
      ]

      test.each(cases)('stuckJobDispatcherName: $input.stuckJobDispatcherName', async ({
        input,
        expected,
      }) => {
        const openTeardownSpy = jest.fn()
          .mockResolvedValue(expected)
        const provider = JobDispatcherProvider.create()
        await provider.ensureJobDispatcher({
          JobDispatcherCtor: {
            name: input.stuckJobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: jest.fn()
                  .mockRejectedValue(new Error('the connection would not close')),
              }),
          },
        })
        await provider.ensureJobDispatcher({
          JobDispatcherCtor: {
            name: input.openJobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue({
                teardown: openTeardownSpy,
              }),
          },
        })

        const received = await provider.teardownJobDispatchers()

        expect(received)
          .toEqual([
            null,
            expected,
          ])
        expect(openTeardownSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#shutdownJobDispatchers()', () => {
    /*
     * The exit is what the handler owes: attaching a `SIGINT` handler removes the one Node
     * installed, so a shutdown that carried an exception out of here left the process running
     * **and** unstoppable by the signal that had asked it to stop. Both cases drive a teardown
     * that rejects, and what is asserted is the exit on the far side of it.
     */
    describe('when the teardown threw', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
          mockError: new Error('the teardown of the queues threw'),
          expected: 'JobDispatcherProvider the shutdown of the queue connections threw: Error',
        },
        {
          input: {
            ProviderCtor: class PhiJobDispatcherProvider extends JobDispatcherProvider {},
          },
          mockError: new TypeError('a dispatcher was not one'),
          expected: 'PhiJobDispatcherProvider the shutdown of the queue connections threw: TypeError',
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', async ({
        input,
        mockError,
        expected,
      }) => {
        const processClerk = ProcessClerk.create()
        const exitSpy = jest.spyOn(processClerk, 'exit')
          .mockReturnValue(null)
        const provider = input.ProviderCtor.create({
          processClerk,
        })
        const errorSpy = jest.spyOn(JobDispatcherProvider.mentsuLogger, 'error')
        jest.spyOn(provider, 'teardownJobDispatchers')
          .mockRejectedValue(mockError)

        await provider.shutdownJobDispatchers()

        expect(exitSpy)
          .toHaveBeenCalledWith()
        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'JobDispatcher',
              'FailedShutdown',
            ],
          })
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#logFailedShutdown()', () => {
    describe('should write a line carrying nothing the error said', () => {
      const cases = [
        {
          params: {
            error: new Error('redis://cache.example.com:6379 never answered the QUIT'),
          },
          expected: 'JobDispatcherProvider the shutdown of the queue connections threw: Error',
        },
        {
          params: {
            error: new RangeError('the teardown ran past the time it was given'),
          },
          expected: 'JobDispatcherProvider the shutdown of the queue connections threw: RangeError',
        },
      ]

      test.each(cases)('error: $params.error', ({
        params,
        expected,
      }) => {
        const provider = JobDispatcherProvider.create()
        const errorSpy = jest.spyOn(JobDispatcherProvider.mentsuLogger, 'error')

        provider.logFailedShutdown(params)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'JobDispatcher',
              'FailedShutdown',
            ],
          })
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#addShutdownSinkToPool()', () => {
    describe('should put the sink it built into the pool', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
          tally: {
            SIGINT: () => null,
            SIGTERM: () => null,
          },
        },
        {
          input: {
            ProviderCtor: class LambdaJobDispatcherProvider extends JobDispatcherProvider {},
          },
          tally: {
            SIGINT: () => null,
            SIGTERM: () => null,
          },
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', ({
        input,
        tally,
      }) => {
        const provider = input.ProviderCtor.create()
        jest.spyOn(provider, 'buildShutdownSink')
          .mockReturnValue(tally)

        const pool = provider.addShutdownSinkToPool()
        const received = pool.get(provider)

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#logFailedJobDispatcherTeardown()', () => {
    /*
     * The line names which connection would not close and what class of error said so, and the
     * error's own message appears in none of it. Each `params.error` below carries a message built
     * the way a client library builds one — an address, a command — so a message creeping back
     * into the line fails here.
     */
    describe('should write a line carrying nothing the error said', () => {
      const cases = [
        {
          params: {
            JobDispatcherCtor: {
              name: 'ChiStuckJobDispatcher',
              createAsync: () => null,
            },
            error: new Error('redis://cache.example.com:6379 refused QUIT'),
          },
          expected: 'JobDispatcherProvider a queue connection would not close: ChiStuckJobDispatcher, Error',
        },
        {
          params: {
            JobDispatcherCtor: {
              name: 'PsiStuckJobDispatcher',
              createAsync: () => null,
            },
            error: new RangeError('the close ran past the time it was given'),
          },
          expected: 'JobDispatcherProvider a queue connection would not close: PsiStuckJobDispatcher, RangeError',
        },
      ]

      test.each(cases)('JobDispatcherCtor: $params.JobDispatcherCtor.name', ({
        params,
        expected,
      }) => {
        const provider = JobDispatcherProvider.create()
        const errorSpy = jest.spyOn(JobDispatcherProvider.mentsuLogger, 'error')

        provider.logFailedJobDispatcherTeardown(params)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'JobDispatcher',
              'FailedTeardown',
            ],
          })
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('.get:timersPromises', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = JobDispatcherProvider.timersPromises

        expect(received)
          .toBe(timersPromises) // same reference
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#awaitJobDispatcherWithinDeadline()', () => {
    /*
     * A build that answers is answered with, and the deadline is nothing but a timer the race
     * leaves behind — the real one is used here, and the test ends before a five-second timer
     * could fire, which is what says the timer is aborted rather than waited on.
     */
    describe('when the build answers first', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'PsiJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
        {
          input: {
            jobDispatcherName: 'ChiJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        tally,
      }) => {
        const provider = JobDispatcherProvider.create()

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: () => Promise.resolve(tally),
          },
          jobDispatcherPromise: Promise.resolve(tally),
        }

        const received = await provider.awaitJobDispatcherWithinDeadline(args)

        expect(received)
          .toBe(tally) // same reference
      })
    })

    /*
     * The build that never answers, which is what a BullMQ queue against a Redis that is not there
     * is: `waitUntilReady()` resolves on `ready` and rejects on `end`, and ioredis carrying
     * `maxRetriesPerRequest: null` retries forever and never ends. The ask is what is given up on.
     *
     * The clock is stood in for, because what is being asserted is the giving up and not the five
     * seconds — and a test that waited them out would add five seconds to every run.
     */
    describe('when the deadline passes first', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'OmegaJobDispatcher',
          },
          expected: 'JobDispatcherProvider gave up on a queue connection that would not open: OmegaJobDispatcher',
        },
        {
          input: {
            jobDispatcherName: 'SigmaJobDispatcher',
          },
          expected: 'JobDispatcherProvider gave up on a queue connection that would not open: SigmaJobDispatcher',
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        expected,
      }) => {
        const provider = JobDispatcherProvider.create()

        const timers = {
          /**
           * Stand in for the clock, answering the moment it is asked.
           *
           * @returns {Promise<null>} Nothing.
           */
          setTimeout: async () => null,
        }
        jest.spyOn(JobDispatcherProvider, 'timersPromises', 'get')
          .mockReturnValue(timers)

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: () => new Promise(() => {}),
          },
          jobDispatcherPromise: new Promise(() => {}),
        }

        const received = () => provider.awaitJobDispatcherWithinDeadline(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#refuseJobDispatcherAtDeadline()', () => {
    /*
     * The deadline on its own: it waits the span this class declares and then refuses, naming the
     * queue it could not reach. The span is asserted against the call the clock was made, which is
     * the only place it is observable — a refusal says nothing about how long it waited.
     */
    describe('should refuse the queue it could not reach', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'TauJobDispatcher',
          },
          expected: 'JobDispatcherProvider gave up on a queue connection that would not open: TauJobDispatcher',
        },
        {
          input: {
            jobDispatcherName: 'RhoJobDispatcher',
          },
          expected: 'JobDispatcherProvider gave up on a queue connection that would not open: RhoJobDispatcher',
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        expected,
      }) => {
        const provider = JobDispatcherProvider.create()

        const timers = {
          /**
           * Stand in for the clock, answering the moment it is asked.
           *
           * @returns {Promise<null>} Nothing.
           */
          setTimeout: async () => null,
        }
        const setTimeoutSpy = jest.spyOn(timers, 'setTimeout')
        jest.spyOn(JobDispatcherProvider, 'timersPromises', 'get')
          .mockReturnValue(timers)

        const abortController = new AbortController()
        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: () => new Promise(() => {}),
          },
          signal: abortController.signal,
        }

        const received = () => provider.refuseJobDispatcherAtDeadline(args)

        await expect(received)
          .rejects
          .toThrow(expected)
        expect(setTimeoutSpy)
          .toHaveBeenCalledWith(
            5000,
            null,
            {
              signal: abortController.signal,
            }
          )
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#logUnreachedQueue()', () => {
    /*
     * The line a Redis outage leaves behind, which is the only record of it: the caller is handed
     * an exception, and for the accept path that exception becomes the engine's own answer, which
     * names nothing about queues.
     */
    describe('should write a line naming the queue and nothing else', () => {
      const cases = [
        {
          input: {
            JobDispatcherCtor: {
              name: 'IotaJobDispatcher',
            },
          },
          expected: 'JobDispatcherProvider gave up on a queue connection that would not open: IotaJobDispatcher',
        },
        {
          input: {
            JobDispatcherCtor: {
              name: 'KappaJobDispatcher',
            },
          },
          expected: 'JobDispatcherProvider gave up on a queue connection that would not open: KappaJobDispatcher',
        },
      ]

      test.each(cases)('JobDispatcherCtor.name: $input.JobDispatcherCtor.name', ({
        input,
        expected,
      }) => {
        const provider = JobDispatcherProvider.create()
        const errorSpy = jest.spyOn(JobDispatcherProvider.mentsuLogger, 'error')

        provider.logUnreachedQueue(input)

        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'JobDispatcher',
              'UnreachedQueue',
            ],
          })
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#ensureJobDispatcher()', () => {
    /*
     * The finding this answers: a build against a Redis that is not there neither resolves nor
     * rejects, so the ask pended with it — and every accept request past the idempotency read hung
     * indefinitely, holding its socket, with no timeout and nothing to answer the client.
     *
     * Measured against a closed port with this repository's own connection options,
     * `waitUntilReady()` was still pending after six seconds. The ask is now bounded.
     */
    describe('when the build has not answered by the deadline', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'NuJobDispatcher',
          },
          expected: 'JobDispatcherProvider gave up on a queue connection that would not open: NuJobDispatcher',
        },
        {
          input: {
            jobDispatcherName: 'XiJobDispatcher',
          },
          expected: 'JobDispatcherProvider gave up on a queue connection that would not open: XiJobDispatcher',
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
        expected,
      }) => {
        const provider = JobDispatcherProvider.create()

        const timers = {
          /**
           * Stand in for the clock, answering the moment it is asked.
           *
           * @returns {Promise<null>} Nothing.
           */
          setTimeout: async () => null,
        }
        jest.spyOn(JobDispatcherProvider, 'timersPromises', 'get')
          .mockReturnValue(timers)

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: () => new Promise(() => {}),
          },
        }

        const received = () => provider.ensureJobDispatcher(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })

    /*
     * What the ask gives up on is itself and not the build: the entry stays in the pool and stays
     * in flight, so a Redis that comes back is connected to by the build already running rather
     * than by one more build per request that gave up.
     */
    describe('when an ask gave up on the build', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'LambdaJobDispatcher',
          },
        },
        {
          input: {
            jobDispatcherName: 'MuJobDispatcher',
          },
        },
      ]

      test.each(cases)('jobDispatcherName: $input.jobDispatcherName', async ({
        input,
      }) => {
        const provider = JobDispatcherProvider.create()

        const timers = {
          /**
           * Stand in for the clock, answering the moment it is asked.
           *
           * @returns {Promise<null>} Nothing.
           */
          setTimeout: async () => null,
        }
        jest.spyOn(JobDispatcherProvider, 'timersPromises', 'get')
          .mockReturnValue(timers)

        const args = {
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: () => new Promise(() => {}),
          },
        }
        await provider.ensureJobDispatcher(args)
          .catch(() => null)

        const received = provider.hasJobDispatcher(args)

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#teardownJobDispatchersWithinDeadline()', () => {
    /*
     * The teardowns that answer are answered with, whole and in order, exactly as the unbounded
     * teardown answered before the deadline was put around it.
     */
    describe('when the teardowns answer first', () => {
      const cases = [
        {
          input: {
            teardownResponses: [
              'teardown-response-0011',
              'teardown-response-0012',
            ],
          },
          expected: [
            'teardown-response-0011',
            'teardown-response-0012',
          ],
        },
        {
          input: {
            teardownResponses: [
              'teardown-response-0013',
            ],
          },
          expected: [
            'teardown-response-0013',
          ],
        },
      ]

      test.each(cases)('teardownResponses.0: $input.teardownResponses.0', async ({
        input,
        expected,
      }) => {
        const provider = JobDispatcherProvider.create()
        jest.spyOn(provider, 'teardownJobDispatchers')
          .mockResolvedValue(input.teardownResponses)

        const received = await provider.teardownJobDispatchersWithinDeadline()

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The teardown that never answers, which is a teardown awaiting a build that never connected.
     * Giving up on it is what lets the exit above be taken.
     */
    describe('when the deadline passes first', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
          expected: 'JobDispatcherProvider gave up on queue connections that would not close',
        },
        {
          input: {
            ProviderCtor: class UpsilonJobDispatcherProvider extends JobDispatcherProvider {},
          },
          expected: 'UpsilonJobDispatcherProvider gave up on queue connections that would not close',
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', async ({
        input,
        expected,
      }) => {
        const provider = input.ProviderCtor.create()

        const timers = {
          /**
           * Stand in for the clock, answering the moment it is asked.
           *
           * @returns {Promise<null>} Nothing.
           */
          setTimeout: async () => null,
        }
        jest.spyOn(JobDispatcherProvider, 'timersPromises', 'get')
          .mockReturnValue(timers)
        jest.spyOn(provider, 'teardownJobDispatchers')
          .mockReturnValue(new Promise(() => {}))

        const received = () => provider.teardownJobDispatchersWithinDeadline()

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#abandonTeardownAtDeadline()', () => {
    describe('should abandon the teardown it was given', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
          expected: 'JobDispatcherProvider gave up on queue connections that would not close',
        },
        {
          input: {
            ProviderCtor: class ZetaJobDispatcherProvider extends JobDispatcherProvider {},
          },
          expected: 'ZetaJobDispatcherProvider gave up on queue connections that would not close',
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', async ({
        input,
        expected,
      }) => {
        const provider = input.ProviderCtor.create()

        const timers = {
          /**
           * Stand in for the clock, answering the moment it is asked.
           *
           * @returns {Promise<null>} Nothing.
           */
          setTimeout: async () => null,
        }
        const setTimeoutSpy = jest.spyOn(timers, 'setTimeout')
        jest.spyOn(JobDispatcherProvider, 'timersPromises', 'get')
          .mockReturnValue(timers)

        const abortController = new AbortController()
        const args = {
          signal: abortController.signal,
        }

        const received = () => provider.abandonTeardownAtDeadline(args)

        await expect(received)
          .rejects
          .toThrow(expected)
        expect(setTimeoutSpy)
          .toHaveBeenCalledWith(
            5000,
            null,
            {
              signal: abortController.signal,
            }
          )
      })
    })
  })
})

describe('JobDispatcherProvider', () => {
  describe('#shutdownJobDispatchers()', () => {
    /*
     * The finding this answers, and the one the guard around the teardown did not: a teardown that
     * never settles is not a rejection, so the guard waited with it and the exit below was never
     * reached — measured, with Redis gone, as a process that took the signal and stayed up, having
     * already lost the default `SIGINT` handling that attaching a handler removes.
     *
     * The teardown here never answers, and what is asserted is the exit on the far side of it,
     * beside the line saying the connections were not all closed.
     */
    describe('when the teardown never answers', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
          expected: 'JobDispatcherProvider the shutdown of the queue connections threw: Error',
        },
        {
          input: {
            ProviderCtor: class EtaJobDispatcherProvider extends JobDispatcherProvider {},
          },
          expected: 'EtaJobDispatcherProvider the shutdown of the queue connections threw: Error',
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', async ({
        input,
        expected,
      }) => {
        const processClerk = ProcessClerk.create()
        const exitSpy = jest.spyOn(processClerk, 'exit')
          .mockReturnValue(null)
        const provider = input.ProviderCtor.create({
          processClerk,
        })
        const errorSpy = jest.spyOn(JobDispatcherProvider.mentsuLogger, 'error')

        const timers = {
          /**
           * Stand in for the clock, answering the moment it is asked.
           *
           * @returns {Promise<null>} Nothing.
           */
          setTimeout: async () => null,
        }
        jest.spyOn(JobDispatcherProvider, 'timersPromises', 'get')
          .mockReturnValue(timers)
        jest.spyOn(provider, 'teardownJobDispatchers')
          .mockReturnValue(new Promise(() => {}))

        await provider.shutdownJobDispatchers()

        expect(exitSpy)
          .toHaveBeenCalledWith()
        expect(errorSpy)
          .toHaveBeenCalledWith({
            message: expected,
            tags: [
              'JobDispatcher',
              'FailedShutdown',
            ],
          })
      })
    })
  })
})
