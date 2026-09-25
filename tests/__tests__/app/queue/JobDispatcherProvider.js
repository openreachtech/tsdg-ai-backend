import {
  ProcessClerk,
} from '@openreachtech/renchan-job-bullmq'

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
            createAsync: jest.fn(),
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
            createAsync: jest.fn(),
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
  describe('#extractJobDispatchers()', () => {
    describe('when the provider built none', () => {
      const cases = [
        {
          input: {
            ProviderCtor: JobDispatcherProvider,
          },
        },
        {
          input: {
            ProviderCtor: class EpsilonJobDispatcherProvider extends JobDispatcherProvider {},
          },
        },
      ]

      test.each(cases)('ProviderCtor: $input.ProviderCtor.name', async ({
        input,
      }) => {
        const provider = input.ProviderCtor.create()

        const received = await provider.extractJobDispatchers()

        expect(received)
          .toHaveLength(0)
      })
    })

    describe('when the provider built some', () => {
      const cases = [
        {
          input: {
            jobDispatcherName: 'TauJobDispatcher',
          },
          tally: {
            teardown: () => null,
          },
        },
        {
          input: {
            jobDispatcherName: 'UpsilonJobDispatcher',
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
        await provider.ensureJobDispatcher({
          JobDispatcherCtor: {
            name: input.jobDispatcherName,
            createAsync: jest.fn()
              .mockResolvedValue(tally),
          },
        })

        const received = await provider.extractJobDispatchers()

        expect(received)
          .toEqual([
            tally,
          ])
      })
    })
  })
})
