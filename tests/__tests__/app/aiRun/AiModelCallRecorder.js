import AiModelCallRecorder from '../../../../app/aiRun/AiModelCallRecorder.js'

import PromptVersionGenerator from '../../../../app/aiRun/PromptVersionGenerator.js'
import AiModelCall from '../../../../sequelize/models/AiModelCall.js'

describe('AiModelCallRecorder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#promptVersionGenerator', () => {
        const cases = [
          {
            input: {
              promptVersionGenerator: {
                promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
              },
            },
            expected: {
              promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
            },
          },
          {
            input: {
              promptVersionGenerator: {
                promptVersionPattern: /^2026-\d{2}-\d{2}$/u,
              },
            },
            expected: {
              promptVersionPattern: /^2026-\d{2}-\d{2}$/u,
            },
          },
        ]

        test.each(cases)('promptVersionPattern: $input.promptVersionGenerator.promptVersionPattern', ({
          input,
          expected,
        }) => {
          const recorder = new AiModelCallRecorder(input)

          expect(recorder)
            .toHaveProperty('promptVersionGenerator', expected)
        })
      })
    })
  })
})

describe('AiModelCallRecorder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            promptVersionGenerator: {
              promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
            },
          },
        },
        {
          input: {
            promptVersionGenerator: {
              promptVersionPattern: /^2026-\d{2}-\d{2}$/u,
            },
          },
        },
      ]

      test.each(cases)('promptVersionPattern: $input.promptVersionGenerator.promptVersionPattern', ({
        input,
      }) => {
        const received = AiModelCallRecorder.create(input)

        expect(received)
          .toBeInstanceOf(AiModelCallRecorder)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            promptVersionGenerator: {
              promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
            },
          },
          expected: {
            promptVersionGenerator: {
              promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
            },
          },
        },
        {
          input: {
            promptVersionGenerator: {
              promptVersionPattern: /^2026-\d{2}-\d{2}$/u,
            },
          },
          expected: {
            promptVersionGenerator: {
              promptVersionPattern: /^2026-\d{2}-\d{2}$/u,
            },
          },
        },
      ]

      test.each(cases)('promptVersionPattern: $input.promptVersionGenerator.promptVersionPattern', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiModelCallRecorder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default promptVersionGenerator', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiModelCallRecorder)
        const expected = {
          promptVersionGenerator: expect.any(PromptVersionGenerator),
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiModelCallRecorder', () => {
  describe('.get:AiModelCallCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiModelCallRecorder.AiModelCallCtor

        expect(received)
          .toBe(AiModelCall) // same reference
      })
    })
  })
})

describe('AiModelCallRecorder', () => {
  describe('.createPromptVersionGenerator()', () => {
    test('should be an instance of PromptVersionGenerator', () => {
      const received = AiModelCallRecorder.createPromptVersionGenerator()

      expect(received)
        .toBeInstanceOf(PromptVersionGenerator)
    })
  })
})

describe('AiModelCallRecorder', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiModelCallRecorder,
      },
      {
        tally: class AlphaAiModelCallRecorder extends AiModelCallRecorder {},
      },
      {
        tally: class BetaAiModelCallRecorder extends AiModelCallRecorder {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const recorder = tally.create()

      const received = recorder.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('AiModelCallRecorder', () => {
  describe('#generateLatencyMilliseconds()', () => {
    /*
     * Latency is the distance between the two instants the caller measured, and nothing here reads
     * a clock, so every case states both ends.
     *
     * The cases that matter beyond the ordinary one: a reply in the same millisecond the request
     * went out, which is zero rather than an absence; a call that ran the whole of the 300-second
     * run time limit, which is the largest value this service expects to record; and a reply
     * stamped before its own request, which an NTP step can produce. The last is recorded as the
     * negative number it measured — losing a billing row to a clock that stepped backwards would
     * cost more than a number that reads oddly.
     */
    describe('should measure the distance between the two ends', () => {
      const cases = [
        {
          input: {
            calledAt: new Date('2026-09-25T02:02:02.002Z'),
            respondedAt: new Date('2026-09-25T02:02:03.457Z'),
          },
          expected: 1455,
        },
        {
          input: {
            calledAt: new Date('2026-09-25T03:03:03.003Z'),
            respondedAt: new Date('2026-09-25T03:03:05.891Z'),
          },
          expected: 2888,
        },
        {
          input: {
            calledAt: new Date('2026-09-25T04:00:00.000Z'),
            respondedAt: new Date('2026-09-25T04:05:00.000Z'), // the 300-second run time limit
          },
          expected: 300000,
        },
        {
          input: {
            calledAt: new Date('2026-09-25T05:05:05.005Z'),
            respondedAt: new Date('2026-09-25T05:05:04.888Z'), // the clock stepped backwards
          },
          expected: -117,
        },
        {
          input: {
            calledAt: new Date('2026-09-25T06:06:06.006Z'),
            respondedAt: new Date('2026-09-25T06:06:06.006Z'), // answered within the millisecond
          },
          expected: 0,
        },
      ]

      test.each(cases)('calledAt: $input.calledAt', ({
        input,
        expected,
      }) => {
        const recorder = AiModelCallRecorder.create()

        const received = recorder.generateLatencyMilliseconds(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiModelCallRecorder', () => {
  describe('#generateLatencyMilliseconds()', () => {
    /*
     * An end that is not a usable instant measured nothing, so nothing is returned for it. The
     * NOT NULL column then refuses the row rather than storing a duration nobody timed — which is
     * the whole difference between a latency that was measured and one that was estimated.
     */
    describe('when an end is not a usable Date', () => {
      /** @type {Array<{ input: { calledAt: *, respondedAt: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            calledAt: undefined,
            respondedAt: new Date('2026-09-25T07:07:07.007Z'),
          },
        },
        {
          input: {
            calledAt: null,
            respondedAt: new Date('2026-09-25T08:08:08.008Z'),
          },
        },
        {
          input: {
            calledAt: '2026-09-25T09:09:09.009Z', // the rendering, in place of the instant
            respondedAt: new Date('2026-09-25T09:09:10.010Z'),
          },
        },
        {
          input: {
            calledAt: 1790291411011, // epoch milliseconds, in place of the instant
            respondedAt: new Date('2026-09-25T10:10:12.012Z'),
          },
        },
        {
          input: {
            calledAt: new Date('unparseable-date'), // a Date carrying no time at all
            respondedAt: new Date('2026-09-25T11:11:13.013Z'),
          },
        },
        {
          input: {
            calledAt: new Date('2026-09-25T12:12:14.014Z'),
            respondedAt: undefined,
          },
        },
        {
          input: {
            calledAt: new Date('2026-09-25T13:13:15.015Z'),
            respondedAt: null,
          },
        },
        {
          input: {
            calledAt: new Date('2026-09-25T14:14:16.016Z'),
            respondedAt: '2026-09-25T14:14:17.017Z', // the rendering, in place of the instant
          },
        },
        {
          input: {
            calledAt: new Date('2026-09-25T15:15:18.018Z'),
            respondedAt: new Date('unparseable-date'), // a Date carrying no time at all
          },
        },
      ])

      test.each(cases)('calledAt: $input.calledAt', ({
        input,
      }) => {
        const recorder = AiModelCallRecorder.create()

        const received = recorder.generateLatencyMilliseconds(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
