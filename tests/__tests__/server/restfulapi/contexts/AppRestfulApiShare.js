import {
  BaseRestfulApiShare,
} from '@openreachtech/renchan'

import AppRestfulApiShare from '../../../../../server/restfulapi/contexts/AppRestfulApiShare.js'

import JobDispatcherProvider from '../../../../../app/queue/JobDispatcherProvider.js'

describe('AppRestfulApiShare', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AppRestfulApiShare.prototype

      expect(received)
        .toBeInstanceOf(BaseRestfulApiShare)
    })
  })
})

describe('AppRestfulApiShare', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#env', () => {
        const cases = [
          {
            input: {
              env: {
                NODE_ENV: 'environment-0001',
              },
              jobDispatcherProvider: JobDispatcherProvider.create(),
            },
            expected: {
              NODE_ENV: 'environment-0001',
            },
          },
          {
            input: {
              env: {
                NODE_ENV: 'environment-0002',
              },
              jobDispatcherProvider: JobDispatcherProvider.create(),
            },
            expected: {
              NODE_ENV: 'environment-0002',
            },
          },
        ]

        test.each(cases)('NODE_ENV: $input.env.NODE_ENV', ({
          input,
          expected,
        }) => {
          const received = new AppRestfulApiShare(input)

          expect(received)
            .toHaveProperty('env', expected)
        })
      })

      describe('#jobDispatcherProvider', () => {
        const cases = [
          {
            input: {
              env: {
                NODE_ENV: 'environment-0003',
              },
              jobDispatcherProvider: JobDispatcherProvider.create(),
            },
          },
          {
            input: {
              env: {
                NODE_ENV: 'environment-0004',
              },
              jobDispatcherProvider: JobDispatcherProvider.create(),
            },
          },
        ]

        test.each(cases)('NODE_ENV: $input.env.NODE_ENV', ({
          input,
        }) => {
          const received = new AppRestfulApiShare(input)

          expect(received)
            .toHaveProperty('jobDispatcherProvider', input.jobDispatcherProvider)
        })
      })
    })
  })
})

describe('AppRestfulApiShare', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            env: {
              NODE_ENV: 'environment-0005',
            },
            jobDispatcherProvider: JobDispatcherProvider.create(),
          },
        },
        {
          input: {
            env: {
              NODE_ENV: 'environment-0006',
            },
            jobDispatcherProvider: JobDispatcherProvider.create(),
          },
        },
      ]

      test.each(cases)('NODE_ENV: $input.env.NODE_ENV', ({
        input,
      }) => {
        const received = AppRestfulApiShare.create(input)

        expect(received)
          .toBeInstanceOf(AppRestfulApiShare)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            env: {
              NODE_ENV: 'environment-0007',
            },
            jobDispatcherProvider: JobDispatcherProvider.create(),
          },
        },
        {
          input: {
            env: {
              NODE_ENV: 'environment-0008',
            },
            jobDispatcherProvider: JobDispatcherProvider.create(),
          },
        },
      ]

      test.each(cases)('NODE_ENV: $input.env.NODE_ENV', ({
        input,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(AppRestfulApiShare)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })

    describe('with no arguments', () => {
      test('should fill the job dispatcher provider', () => {
        const jobDispatcherProvider = JobDispatcherProvider.create()
        jest.spyOn(AppRestfulApiShare, 'createJobDispatcherProvider')
          .mockReturnValue(jobDispatcherProvider)

        const received = AppRestfulApiShare.create()

        expect(received)
          .toHaveProperty('jobDispatcherProvider', jobDispatcherProvider)
      })
    })
  })
})

describe('AppRestfulApiShare', () => {
  describe('.get:JobDispatcherProviderCtor', () => {
    describe('when called as is', () => {
      test('should be JobDispatcherProvider', () => {
        const received = AppRestfulApiShare.JobDispatcherProviderCtor

        expect(received)
          .toBe(JobDispatcherProvider) // same reference
      })
    })
  })
})

describe('AppRestfulApiShare', () => {
  describe('.createJobDispatcherProvider()', () => {
    describe('when called as is', () => {
      test('should be an instance of JobDispatcherProvider', () => {
        const received = AppRestfulApiShare.createJobDispatcherProvider()

        expect(received)
          .toBeInstanceOf(JobDispatcherProvider)
      })
    })
  })
})
