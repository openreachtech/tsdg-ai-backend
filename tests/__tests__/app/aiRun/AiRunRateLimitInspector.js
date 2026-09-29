import AiRunRateLimitInspector from '../../../../app/aiRun/AiRunRateLimitInspector.js'

import AiRun from '../../../../sequelize/models/AiRun.js'

/*
 * The last acceptance criterion of section 20 - "a client that has exceeded its rate limit is
 * refused, and no run is created and no model is called" - as far as this class carries it: the
 * judgement. What a refused caller is answered with belongs to the renderer, and is asserted there.
 *
 * **Every count below is of the development seeder's own runs, inside 2026-09-10.** That day is the
 * one the `ai_runs` fixture was seeded on and the one no DB-writing test writes into - every run
 * created under `tests/_orders/` is accepted on 2026-09-20 or later - so a window drawn inside it
 * holds the same rows whatever else has run. The three seeded clients hold six, three and two runs
 * respectively, which is why the figures asserted here are small ones injected through the factory
 * rather than the sixty the constant states: sixty seeded runs would be a fixture written to fit a
 * test.
 *
 * **Both ends of the window are asserted, and both are inclusive.** A case draws a window whose
 * ends fall exactly on a run's accepted instant and expects both of them counted, and another draws
 * one that cuts runs off on each side.
 */

describe('AiRunRateLimitInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#maximumAcceptedAiRunCount', () => {
        const cases = [
          {
            input: {
              maximumAcceptedAiRunCount: 60,
              windowSecondCount: 60,
            },
            expected: 60,
          },
          {
            input: {
              maximumAcceptedAiRunCount: 5,
              windowSecondCount: 3600,
            },
            expected: 5,
          },
        ]

        test.each(cases)('maximumAcceptedAiRunCount: $input.maximumAcceptedAiRunCount', ({
          input,
          expected,
        }) => {
          const inspector = new AiRunRateLimitInspector(input)

          expect(inspector)
            .toHaveProperty('maximumAcceptedAiRunCount', expected)
        })
      })

      describe('#windowSecondCount', () => {
        const cases = [
          {
            input: {
              maximumAcceptedAiRunCount: 60,
              windowSecondCount: 60,
            },
            expected: 60,
          },
          {
            input: {
              maximumAcceptedAiRunCount: 5,
              windowSecondCount: 3600,
            },
            expected: 3600,
          },
        ]

        test.each(cases)('windowSecondCount: $input.windowSecondCount', ({
          input,
          expected,
        }) => {
          const inspector = new AiRunRateLimitInspector(input)

          expect(inspector)
            .toHaveProperty('windowSecondCount', expected)
        })
      })
    })
  })
})

describe('AiRunRateLimitInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            maximumAcceptedAiRunCount: 60,
            windowSecondCount: 60,
          },
        },
        {
          input: {
            maximumAcceptedAiRunCount: 5,
            windowSecondCount: 3600,
          },
        },
      ]

      test.each(cases)('maximumAcceptedAiRunCount: $input.maximumAcceptedAiRunCount', ({
        input,
      }) => {
        const received = AiRunRateLimitInspector.create(input)

        expect(received)
          .toBeInstanceOf(AiRunRateLimitInspector)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            maximumAcceptedAiRunCount: 60,
            windowSecondCount: 60,
          },
          expected: {
            maximumAcceptedAiRunCount: 60,
            windowSecondCount: 60,
          },
        },
        {
          input: {
            maximumAcceptedAiRunCount: 5,
            windowSecondCount: 3600,
          },
          expected: {
            maximumAcceptedAiRunCount: 5,
            windowSecondCount: 3600,
          },
        },
      ]

      test.each(cases)('maximumAcceptedAiRunCount: $input.maximumAcceptedAiRunCount', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunRateLimitInspector)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default value', () => {
      const cases = [
        {
          input: {
            maximumAcceptedAiRunCount: 5,
            // windowSecondCount: omitted → default 60
          },
          expected: {
            maximumAcceptedAiRunCount: 5,
            windowSecondCount: 60,
          },
        },
        {
          input: {
            // maximumAcceptedAiRunCount: omitted → default 60
            windowSecondCount: 3600,
          },
          expected: {
            maximumAcceptedAiRunCount: 60,
            windowSecondCount: 3600,
          },
        },
        {
          input: {
            // maximumAcceptedAiRunCount: omitted → default 60
            // windowSecondCount: omitted → default 60
          },
          expected: {
            maximumAcceptedAiRunCount: 60,
            windowSecondCount: 60,
          },
        },
      ]

      test.each(cases)('maximumAcceptedAiRunCount: $expected.maximumAcceptedAiRunCount, windowSecondCount: $expected.windowSecondCount', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunRateLimitInspector)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunRateLimitInspector', () => {
  describe('.get:AiRunCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunRateLimitInspector.AiRunCtor

        expect(received)
          .toBe(AiRun) // same reference
      })
    })
  })
})

describe('AiRunRateLimitInspector', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          Ctor: AiRunRateLimitInspector,
        },
      },
      {
        input: {
          Ctor: class AlphaAiRunRateLimitInspector extends AiRunRateLimitInspector {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', ({
      input,
    }) => {
      const inspector = input.Ctor.create()

      const received = inspector.Ctor

      expect(received)
        .toBe(input.Ctor) // same reference
    })
  })
})

describe('AiRunRateLimitInspector', () => {
  describe('#buildWindowOpenedAt()', () => {
    describe('should reach back by the window this inspector holds', () => {
      const cases = [
        {
          input: {
            windowSecondCount: 60,
            now: new Date('2026-09-10T01:01:01.001Z'),
          },
          expected: new Date('2026-09-10T01:00:01.001Z'),
        },
        {
          input: {
            windowSecondCount: 3600,
            now: new Date('2026-09-10T02:02:02.002Z'),
          },
          expected: new Date('2026-09-10T01:02:02.002Z'),
        },
        {
          input: {
            windowSecondCount: 86400,
            now: new Date('2026-09-10T03:03:03.003Z'),
          },
          expected: new Date('2026-09-09T03:03:03.003Z'),
        },
        {
          input: {
            windowSecondCount: 0, // A window of no width, which opens where it closes
            now: new Date('2026-09-10T04:04:04.004Z'),
          },
          expected: new Date('2026-09-10T04:04:04.004Z'),
        },
      ]

      test.each(cases)('windowSecondCount: $input.windowSecondCount', ({
        input,
        expected,
      }) => {
        const createArgs = {
          maximumAcceptedAiRunCount: 60, // Neutral value; this member never reads it
          windowSecondCount: input.windowSecondCount,
        }
        const buildWindowOpenedAtArgs = {
          now: input.now,
        }

        const inspector = AiRunRateLimitInspector.create(createArgs)

        const received = inspector.buildWindowOpenedAt(buildWindowOpenedAtArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunRateLimitInspector', () => {
  describe('#findAcceptedAiRunCount()', () => {
    describe('should count the runs this client had accepted inside the window', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            windowOpenedAt: new Date('2026-09-10T00:00:00.000Z'),
            windowClosedAt: new Date('2026-09-10T23:59:59.999Z'),
          },
          expected: 6,
        },
        {
          // Both ends fall exactly on a run of this client, and both of those runs are counted
          input: {
            apiClientId: 10000002,
            windowOpenedAt: new Date('2026-09-10T03:03:03.003Z'),
            windowClosedAt: new Date('2026-09-10T08:08:08.008Z'),
          },
          expected: 3,
        },
        {
          input: {
            apiClientId: 10000003,
            windowOpenedAt: new Date('2026-09-10T00:00:00.001Z'),
            windowClosedAt: new Date('2026-09-10T23:59:59.998Z'),
          },
          expected: 2,
        },
        {
          // Cuts four of this client's six runs off, two on each side of the window
          input: {
            apiClientId: 10000001,
            windowOpenedAt: new Date('2026-09-10T04:00:00.000Z'),
            windowClosedAt: new Date('2026-09-10T06:00:00.000Z'),
          },
          expected: 2,
        },
      ]

      test.each(cases)('windowOpenedAt: $input.windowOpenedAt', async ({
        input,
        expected,
      }) => {
        const inspector = AiRunRateLimitInspector.create()

        const received = await inspector.findAcceptedAiRunCount(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the window holds no run of this client', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            windowOpenedAt: new Date('2026-09-11T00:00:00.000Z'),
            windowClosedAt: new Date('2026-09-11T23:59:59.999Z'),
          },
        },
        {
          input: {
            apiClientId: 10000002,
            windowOpenedAt: new Date('2026-09-11T01:00:00.000Z'),
            windowClosedAt: new Date('2026-09-11T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('windowOpenedAt: $input.windowOpenedAt', async ({
        input,
      }) => {
        const inspector = AiRunRateLimitInspector.create()

        const received = await inspector.findAcceptedAiRunCount(input)

        expect(received)
          .toBe(0)
      })
    })
  })
})

describe('AiRunRateLimitInspector', () => {
  describe('#isWithinRateLimit()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          // Six runs of this client sit in the day the window reaches back over
          input: {
            maximumAcceptedAiRunCount: 7,
            windowSecondCount: 86400,
            apiClientId: 10000001,
            now: new Date('2026-09-10T12:00:00.000Z'),
          },
        },
        {
          input: {
            maximumAcceptedAiRunCount: 4,
            windowSecondCount: 86400,
            apiClientId: 10000003,
            now: new Date('2026-09-10T12:00:00.000Z'),
          },
        },
        {
          // An hour-wide window leaves one of this client's six runs inside it
          input: {
            maximumAcceptedAiRunCount: 3,
            windowSecondCount: 3600,
            apiClientId: 10000001,
            now: new Date('2026-09-10T05:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('maximumAcceptedAiRunCount: $input.maximumAcceptedAiRunCount', async ({
        input,
      }) => {
        const createArgs = {
          maximumAcceptedAiRunCount: input.maximumAcceptedAiRunCount,
          windowSecondCount: input.windowSecondCount,
        }
        const isWithinRateLimitArgs = {
          apiClientId: input.apiClientId,
          now: input.now,
        }

        const inspector = AiRunRateLimitInspector.create(createArgs)

        const received = await inspector.isWithinRateLimit(isWithinRateLimitArgs)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          // Exactly the limit is already had, so the next run is the one refused
          input: {
            maximumAcceptedAiRunCount: 6,
            windowSecondCount: 86400,
            apiClientId: 10000001,
            now: new Date('2026-09-10T12:00:00.000Z'),
          },
        },
        {
          input: {
            maximumAcceptedAiRunCount: 2,
            windowSecondCount: 86400,
            apiClientId: 10000002,
            now: new Date('2026-09-10T12:00:00.000Z'),
          },
        },
        {
          input: {
            maximumAcceptedAiRunCount: 1,
            windowSecondCount: 86400,
            apiClientId: 10000003,
            now: new Date('2026-09-10T12:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('maximumAcceptedAiRunCount: $input.maximumAcceptedAiRunCount', async ({
        input,
      }) => {
        const createArgs = {
          maximumAcceptedAiRunCount: input.maximumAcceptedAiRunCount,
          windowSecondCount: input.windowSecondCount,
        }
        const isWithinRateLimitArgs = {
          apiClientId: input.apiClientId,
          now: input.now,
        }

        const inspector = AiRunRateLimitInspector.create(createArgs)

        const received = await inspector.isWithinRateLimit(isWithinRateLimitArgs)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})
