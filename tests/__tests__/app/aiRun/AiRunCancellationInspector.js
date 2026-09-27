import AiRunCancellationInspector from '../../../../app/aiRun/AiRunCancellationInspector.js'

import AiRunKeyInspector from '../../../../app/aiRun/AiRunKeyInspector.js'

import AiRun from '../../../../sequelize/models/AiRun.js'

/*
 * Every run this file asks about is one the development seeder wrote, and nothing here writes a
 * row — the class reads one column and answers a boolean, so the file sits under `__tests__`.
 *
 * **Both answers are read off seeded rows rather than stated.** `10010006` and `10010010` are the
 * two runs the fixture carries a `cancel_requested_at` on, and `10010001`, `10010002` and
 * `10010003` are runs in three different statuses carrying none. Pairing a running run and a
 * queued one against a succeeded one is what shows the answer follows the column and not the
 * status: a class that had answered off `ai_run_status_id` would agree with this file on the two
 * canceled runs and disagree on nothing else it was asked.
 *
 * **`10849001` is created by nothing**, in `#run-cancel`'s own id block, so the absent-run case
 * has something to ask after that no run will ever answer.
 */

describe('AiRunCancellationInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunKeyInspector', () => {
        const cases = [
          {
            label: 'an inspector answering every value an id',
            input: {
              aiRunKeyInspector: {
                isRecordableKey: () => true,
              },
            },
          },
          {
            label: 'an inspector answering no value an id',
            input: {
              aiRunKeyInspector: {
                isRecordableKey: () => false,
              },
            },
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const inspector = new AiRunCancellationInspector(input)

          expect(inspector)
            .toHaveProperty('aiRunKeyInspector', input.aiRunKeyInspector)
        })
      })
    })
  })
})

describe('AiRunCancellationInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          label: 'an inspector answering every value an id',
          input: {
            aiRunKeyInspector: {
              isRecordableKey: () => true,
            },
          },
        },
        {
          label: 'an inspector answering no value an id',
          input: {
            aiRunKeyInspector: {
              isRecordableKey: () => false,
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRunCancellationInspector.create(input)

        expect(received)
          .toBeInstanceOf(AiRunCancellationInspector)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          label: 'an inspector answering every value an id',
          input: {
            aiRunKeyInspector: {
              isRecordableKey: () => true,
            },
          },
        },
        {
          label: 'an inspector answering no value an id',
          input: {
            aiRunKeyInspector: {
              isRecordableKey: () => false,
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCancellationInspector)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })

    describe('should fill default aiRunKeyInspector', () => {
      test('with no arguments', () => {
        const expected = expect.objectContaining({
          aiRunKeyInspector: expect.any(AiRunKeyInspector),
        })

        const SpyClass = constructorSpy.spyOn(AiRunCancellationInspector)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunCancellationInspector', () => {
  describe('.get:AiRunCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunCancellationInspector.AiRunCtor

        expect(received)
          .toBe(AiRun) // same reference
      })
    })
  })
})

describe('AiRunCancellationInspector', () => {
  describe('.createAiRunKeyInspector()', () => {
    const cases = [
      {
        input: {
          Ctor: AiRunCancellationInspector,
        },
      },
      {
        input: {
          Ctor: class AlphaAiRunCancellationInspector extends AiRunCancellationInspector {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', ({
      input,
    }) => {
      const received = input.Ctor.createAiRunKeyInspector()

      expect(received)
        .toBeInstanceOf(AiRunKeyInspector)
    })
  })
})

describe('AiRunCancellationInspector', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          Ctor: AiRunCancellationInspector,
        },
      },
      {
        input: {
          Ctor: class BetaAiRunCancellationInspector extends AiRunCancellationInspector {},
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

describe('AiRunCancellationInspector', () => {
  describe('#hasAiRunCancelRequest()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          // canceled — asked for 400 milliseconds before it took effect
          input: {
            aiRunId: 10010006,
          },
        },
        {
          // canceled — asked for 2.7 seconds before it took effect
          input: {
            aiRunId: 10010010,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const inspector = AiRunCancellationInspector.create()

        const received = await inspector.hasAiRunCancelRequest(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          // running, and nobody has asked
          input: {
            aiRunId: 10010001,
          },
        },
        {
          // queued, and nobody has asked
          input: {
            aiRunId: 10010002,
          },
        },
        {
          // succeeded on its own, so it settled without anybody asking
          input: {
            aiRunId: 10010003,
          },
        },
        {
          // failed on its own, so it settled without anybody asking
          input: {
            aiRunId: 10010011,
          },
        },
        {
          // a run that does not exist, which nobody can have asked about
          input: {
            aiRunId: 10849001,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const inspector = AiRunCancellationInspector.create()

        const received = await inspector.hasAiRunCancelRequest(input)

        expect(received)
          .toBeFalsy()
      })
    })

    describe('with invalid values', () => {
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            aiRunId: null,
          },
        },
        {
          input: {
            aiRunId: 0, // Zero names no row
          },
        },
        {
          input: {
            aiRunId: -10849002, // A negative names no row
          },
        },
        {
          input: {
            aiRunId: 10849003.5, // A fraction names no row
          },
        },
        {
          input: {
            aiRunId: 'not-an-id',
          },
        },
      ])

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const inspector = AiRunCancellationInspector.create()

        const received = () => inspector.hasAiRunCancelRequest(input)

        await expect(received)
          .rejects
          .toThrow('AiRunCancellationInspector#hasAiRunCancelRequest() refused a key that is not an id: field aiRunId')
      })
    })
  })
})

describe('AiRunCancellationInspector', () => {
  describe('#findAiRun()', () => {
    /*
     * The one column the answer is decided on, read off seeded rows — a run carrying the instant
     * somebody asked at, and a run carrying none.
     */
    describe('when a run carries the id', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010006,
          },
          expected: expect.objectContaining({
            id: 10010006,
            cancelRequestedAt: new Date('2026-09-10T06:06:07.307Z'),
          }),
        },
        {
          input: {
            aiRunId: 10010002,
          },
          expected: expect.objectContaining({
            id: 10010002,
            cancelRequestedAt: null,
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const inspector = AiRunCancellationInspector.create()

        const received = await inspector.findAiRun(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when no run carries the id', () => {
      const cases = [
        {
          input: {
            aiRunId: 10849001,
          },
        },
        {
          input: {
            aiRunId: 10849002,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const inspector = AiRunCancellationInspector.create()

        const received = await inspector.findAiRun(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
