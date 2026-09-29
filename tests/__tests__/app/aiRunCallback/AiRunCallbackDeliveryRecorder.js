import AiRunCallbackDeliveryRecorder from '../../../../app/aiRunCallback/AiRunCallbackDeliveryRecorder.js'

import AiRunInstantInspector from '../../../../app/aiRun/AiRunInstantInspector.js'

import AiRunCallbackDelivery from '../../../../sequelize/models/AiRunCallbackDelivery.js'

/*
 * The read-only half of the recorder. Writing a row is `tests/_orders/AiRunCallback/` — placement
 * follows what each method does, not which class it sits on.
 *
 * The attempts read back are the development seeder's
 * (`20260926110003-000008-ai_run_callback_deliveries.cjs`), which exists so that "was this
 * callback retried" is a count of rows against real data rather than a claim. No row is written
 * here, so what the finder answers with is the fixture as committed.
 */

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunCallbackDeliveryCategoryIdHash', () => {
        const cases = [
          {
            input: {
              aiRunCallbackDeliveryCategoryIdHash: {
                terminal: 1,
              },
              aiRunInstantInspector: AiRunInstantInspector.create(),
            },
            expected: {
              terminal: 1,
            },
          },
          {
            input: {
              aiRunCallbackDeliveryCategoryIdHash: {
                terminal: 1,
                progress: 2,
              },
              aiRunInstantInspector: AiRunInstantInspector.create(),
            },
            expected: {
              terminal: 1,
              progress: 2,
            },
          },
        ]

        test.each(cases)('terminal: $input.aiRunCallbackDeliveryCategoryIdHash.terminal', ({
          input,
          expected,
        }) => {
          const recorder = new AiRunCallbackDeliveryRecorder(input)

          expect(recorder)
            .toHaveProperty('aiRunCallbackDeliveryCategoryIdHash', expected)
        })
      })

      describe('#aiRunInstantInspector', () => {
        const cases = [
          {
            input: {
              aiRunCallbackDeliveryCategoryIdHash: {
                terminal: 1,
              },
              aiRunInstantInspector: AiRunInstantInspector.create(),
            },
            label: 'the real inspector',
          },
          {
            input: {
              aiRunCallbackDeliveryCategoryIdHash: {
                terminal: 1,
              },
              aiRunInstantInspector: {
                isRecordableInstant: () => false,
              },
            },
            label: 'a stand-in refusing every instant',
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const recorder = new AiRunCallbackDeliveryRecorder(input)

          expect(recorder)
            .toHaveProperty('aiRunInstantInspector', input.aiRunInstantInspector)
        })
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          input: {
            aiRunCallbackDeliveryCategoryIdHash: {
              terminal: 1,
            },
            aiRunInstantInspector: AiRunInstantInspector.create(),
          },
          label: 'one kind declared',
        },
        {
          input: {
            aiRunCallbackDeliveryCategoryIdHash: {
              terminal: 1,
              progress: 2,
            },
            aiRunInstantInspector: AiRunInstantInspector.create(),
          },
          label: 'a second kind declared',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const actual = AiRunCallbackDeliveryRecorder.create(input)

        expect(actual)
          .toBeInstanceOf(AiRunCallbackDeliveryRecorder)
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            aiRunCallbackDeliveryCategoryIdHash: {
              terminal: 1,
            },
            aiRunInstantInspector: AiRunInstantInspector.create(),
          },
          label: 'one kind declared',
        },
        {
          input: {
            aiRunCallbackDeliveryCategoryIdHash: {
              terminal: 1,
              progress: 2,
            },
            aiRunInstantInspector: AiRunInstantInspector.create(),
          },
          label: 'a second kind declared',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCallbackDeliveryRecorder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('.create()', () => {
    describe('should use default aiRunCallbackDeliveryCategoryIdHash value', () => {
      test('with no arguments', () => {
        const buildHashSpy = jest.spyOn(AiRunCallbackDeliveryRecorder, 'buildAiRunCallbackDeliveryCategoryIdHash')

        const recorder = AiRunCallbackDeliveryRecorder.create()

        expect(recorder)
          .toHaveProperty('aiRunCallbackDeliveryCategoryIdHash', {
            terminal: 1,
          })
        expect(buildHashSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default aiRunInstantInspector value', () => {
      test('with no arguments', () => {
        const createInspectorSpy = jest.spyOn(AiRunCallbackDeliveryRecorder, 'createAiRunInstantInspector')

        const recorder = AiRunCallbackDeliveryRecorder.create()

        expect(recorder.aiRunInstantInspector)
          .toBeInstanceOf(AiRunInstantInspector)
        expect(createInspectorSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('.createAiRunInstantInspector()', () => {
    describe('when called as is', () => {
      test('should build the inspector the instant is held to', () => {
        const actual = AiRunCallbackDeliveryRecorder.createAiRunInstantInspector()

        expect(actual)
          .toBeInstanceOf(AiRunInstantInspector)
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('.buildAiRunCallbackDeliveryCategoryIdHash()', () => {
    /*
     * One kind this version, and the whole hash is asserted rather than one key of it: a second
     * kind appearing here before its master row is seeded would hand the `NOT NULL` column an id
     * naming no row.
     */
    describe('when called as is', () => {
      test('should answer the one kind this version declares', () => {
        const expected = {
          terminal: 1,
        }

        const actual = AiRunCallbackDeliveryRecorder.buildAiRunCallbackDeliveryCategoryIdHash()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('.get:AiRunCallbackDeliveryCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunCallbackDeliveryRecorder.AiRunCallbackDeliveryCtor

        expect(actual)
          .toBe(AiRunCallbackDelivery) // same reference
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('#get:Ctor', () => {
    describe('should answer own constructor', () => {
      const cases = [
        {
          input: {
            aiRunCallbackDeliveryCategoryIdHash: {
              terminal: 1,
            },
            aiRunInstantInspector: AiRunInstantInspector.create(),
          },
          label: 'one kind declared',
        },
        {
          input: {
            aiRunCallbackDeliveryCategoryIdHash: {
              terminal: 1,
              progress: 2,
            },
            aiRunInstantInspector: AiRunInstantInspector.create(),
          },
          label: 'a second kind declared',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const recorder = AiRunCallbackDeliveryRecorder.create(input)

        const actual = recorder.Ctor

        expect(actual)
          .toBe(AiRunCallbackDeliveryRecorder) // same reference
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('#generateAiRunCallbackDeliveryCategoryId()', () => {
    describe('when the name names a kind', () => {
      const cases = [
        {
          input: {
            callbackDeliveryCategoryName: 'terminal',
          },
          expected: 1,
        },
      ]

      test.each(cases)('callbackDeliveryCategoryName: $input.callbackDeliveryCategoryName', ({
        input,
        expected,
      }) => {
        const recorder = AiRunCallbackDeliveryRecorder.create()

        const actual = recorder.generateAiRunCallbackDeliveryCategoryId(input)

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * Nothing guesses. `constructor` and `toString` are the cases that matter: a lookup read with
     * `[name]` alone would answer a member of `Object.prototype` for either of them, and the
     * column would take whatever that is.
     */
    describe('when the name names no kind', () => {
      const cases = [
        {
          input: {
            callbackDeliveryCategoryName: 'progress',
          },
        },
        {
          input: {
            callbackDeliveryCategoryName: 'Terminal',
          },
        },
        {
          input: {
            callbackDeliveryCategoryName: 'constructor',
          },
        },
        {
          input: {
            callbackDeliveryCategoryName: 'toString',
          },
        },
        {
          input: {
            callbackDeliveryCategoryName: '',
          },
        },
        {
          input: {
            callbackDeliveryCategoryName: null,
          },
        },
      ]

      test.each(cases)('callbackDeliveryCategoryName: $input.callbackDeliveryCategoryName', ({
        input,
      }) => {
        const recorder = AiRunCallbackDeliveryRecorder.create()

        const actual = recorder.generateAiRunCallbackDeliveryCategoryId(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunCallbackDeliveryRecorder', () => {
  describe('#findAiRunCallbackDeliveries()', () => {
    /*
     * The eighth acceptance criterion of section 12, read as the count it is: a callback that
     * fails to deliver is retried. Run 10010003 was refused twice and landed on the third try, so
     * the answer here is three rows and not one — an implementation that stopped after a single
     * attempt could not produce this list.
     *
     * Run 10010005's two attempts both carry a null status, which is the other half of the column:
     * the attempt was made and the request never completed. Run 10010011's one attempt carries a
     * status the far side really answered with, and a refusing one — so "not landed" is read on a
     * client that said no as well as on one that said nothing ([[Q117]]).
     *
     * The order asserted is the one the attempts claim in `attempt_index`, and the rows are
     * asserted as a list rather than searched, so a finder answering in insertion order or missing
     * one attempt fails rather than matching.
     */
    describe('when the run has attempts on the record', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010003,
            callbackDeliveryCategoryName: 'terminal',
          },
          expected: [
            expect.objectContaining({
              id: 10510002,
              attemptIndex: 1,
              httpStatusCode: 503,
              attemptedAt: new Date('2026-09-13T02:02:02.202Z'),
            }),
            expect.objectContaining({
              id: 10510003,
              attemptIndex: 2,
              httpStatusCode: 500,
              attemptedAt: new Date('2026-09-13T02:02:12.302Z'),
            }),
            expect.objectContaining({
              id: 10510004,
              attemptIndex: 3,
              httpStatusCode: 204,
              attemptedAt: new Date('2026-09-13T02:02:32.402Z'),
            }),
          ],
        },
        {
          input: {
            aiRunId: 10010004,
            callbackDeliveryCategoryName: 'terminal',
          },
          expected: [
            expect.objectContaining({
              id: 10510001,
              attemptIndex: 1,
              httpStatusCode: 200,
              attemptedAt: new Date('2026-09-13T01:01:01.101Z'),
            }),
          ],
        },
        {
          input: {
            aiRunId: 10010005,
            callbackDeliveryCategoryName: 'terminal',
          },
          expected: [
            expect.objectContaining({
              id: 10510005,
              attemptIndex: 1,
              httpStatusCode: null,
              attemptedAt: new Date('2026-09-13T03:03:03.503Z'),
            }),
            expect.objectContaining({
              id: 10510006,
              attemptIndex: 2,
              httpStatusCode: null,
              attemptedAt: new Date('2026-09-13T03:03:23.603Z'),
            }),
          ],
        },
        {
          input: {
            aiRunId: 10010010,
            callbackDeliveryCategoryName: 'terminal',
          },
          expected: [
            expect.objectContaining({
              id: 10510011,
              attemptIndex: 1,
              httpStatusCode: null,
              attemptedAt: new Date('2026-09-13T06:06:06.116Z'),
            }),
            expect.objectContaining({
              id: 10510012,
              attemptIndex: 2,
              httpStatusCode: 201,
              attemptedAt: new Date('2026-09-13T06:06:36.216Z'),
            }),
          ],
        },
        {
          input: {
            aiRunId: 10010011,
            callbackDeliveryCategoryName: 'terminal',
          },
          expected: [
            expect.objectContaining({
              id: 10510013,
              attemptIndex: 1,
              httpStatusCode: 400,
              attemptedAt: new Date('2026-09-13T07:07:07.127Z'),
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunCallbackDeliveryRecorder.create()

        const actual = await recorder.findAiRunCallbackDeliveries(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * A run that never reached a terminal state raised no callback, so it has no attempt. An empty
     * list is the honest answer and is not the same as a run with one attempt that failed.
     */
    describe('when the run has no attempt on the record', () => {
      const cases = [
        {
          // queued
          input: {
            aiRunId: 10010002,
            callbackDeliveryCategoryName: 'terminal',
          },
        },
        {
          // running
          input: {
            aiRunId: 10010001,
            callbackDeliveryCategoryName: 'terminal',
          },
        },
        {
          // queued, under the rotating client
          input: {
            aiRunId: 10010007,
            callbackDeliveryCategoryName: 'terminal',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const recorder = AiRunCallbackDeliveryRecorder.create()

        const actual = await recorder.findAiRunCallbackDeliveries(input)

        expect(actual)
          .toHaveLength(0)
      })
    })

    /*
     * A kind this version does not declare resolves to no id, so the read is scoped to a category
     * nothing is filed under and answers nothing — rather than quietly dropping the condition and
     * answering every attempt the run made.
     */
    describe('when the kind names no callback this version declares', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010003,
            callbackDeliveryCategoryName: 'progress',
          },
        },
        {
          input: {
            aiRunId: 10010004,
            callbackDeliveryCategoryName: 'constructor',
          },
        },
      ]

      test.each(cases)('callbackDeliveryCategoryName: $input.callbackDeliveryCategoryName', async ({
        input,
      }) => {
        const recorder = AiRunCallbackDeliveryRecorder.create()

        const actual = await recorder.findAiRunCallbackDeliveries(input)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})
