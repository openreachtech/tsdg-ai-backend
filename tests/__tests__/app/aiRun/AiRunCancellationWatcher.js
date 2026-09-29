import timersPromises from 'node:timers/promises'

import AiRunCancellationWatcher from '../../../../app/aiRun/AiRunCancellationWatcher.js'

import AiRunCancellationInspector from '../../../../app/aiRun/AiRunCancellationInspector.js'

/*
 * Nothing here writes a row: the watch reads one column and raises one signal, so the file sits
 * under `__tests__`. The one claim that needs a column to change while the watch is running — that
 * a watch which found nothing asks again — is the one claim a read cannot make, and it is asserted
 * in `tests/_orders/AiRun/AiRunCancellationWatcher.js` instead, where the cancellation is recorded
 * after the watch has begun.
 *
 * **The runs are the development seeder's own.** `10010006` and `10010010` carry the instant a
 * client asked; `10010001` and `10010002` carry none. Every interval stated below is a few
 * milliseconds, which is what the factory's parameter exists for — the real default is a second,
 * and a suite that waited it out would spend seconds proving nothing about the waiting.
 *
 * **Every controller is built inside the test body.** A watcher is built per delivery and a signal
 * raised for one run must never be the signal another run's work is watching, so a controller
 * shared between two cases would be the very mistake the class is shaped to avoid.
 */

describe('AiRunCancellationWatcher', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunCancellationInspector', () => {
        const cases = [
          {
            label: 'an inspector answering that a client asked',
            input: {
              aiRunCancellationInspector: {
                hasAiRunCancelRequest: () => Promise.resolve(true),
              },
              watchIntervalMilliseconds: 1000,
            },
          },
          {
            label: 'an inspector answering that nobody asked',
            input: {
              aiRunCancellationInspector: {
                hasAiRunCancelRequest: () => Promise.resolve(false),
              },
              watchIntervalMilliseconds: 250,
            },
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const watcher = new AiRunCancellationWatcher(input)

          expect(watcher)
            .toHaveProperty('aiRunCancellationInspector', input.aiRunCancellationInspector)
        })
      })

      describe('#watchIntervalMilliseconds', () => {
        const cases = [
          {
            input: {
              aiRunCancellationInspector: {
                hasAiRunCancelRequest: () => Promise.resolve(true),
              },
              watchIntervalMilliseconds: 1000,
            },
            expected: 1000,
          },
          {
            input: {
              aiRunCancellationInspector: {
                hasAiRunCancelRequest: () => Promise.resolve(false),
              },
              watchIntervalMilliseconds: 250,
            },
            expected: 250,
          },
        ]

        test.each(cases)('watchIntervalMilliseconds: $input.watchIntervalMilliseconds', ({
          input,
          expected,
        }) => {
          const watcher = new AiRunCancellationWatcher(input)

          expect(watcher)
            .toHaveProperty('watchIntervalMilliseconds', expected)
        })
      })
    })
  })
})

describe('AiRunCancellationWatcher', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            aiRunCancellationInspector: {
              hasAiRunCancelRequest: () => Promise.resolve(true),
            },
            watchIntervalMilliseconds: 1000,
          },
        },
        {
          input: {
            aiRunCancellationInspector: {
              hasAiRunCancelRequest: () => Promise.resolve(false),
            },
            watchIntervalMilliseconds: 250,
          },
        },
      ]

      test.each(cases)('watchIntervalMilliseconds: $input.watchIntervalMilliseconds', ({
        input,
      }) => {
        const received = AiRunCancellationWatcher.create(input)

        expect(received)
          .toBeInstanceOf(AiRunCancellationWatcher)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            aiRunCancellationInspector: {
              hasAiRunCancelRequest: () => Promise.resolve(true),
            },
            watchIntervalMilliseconds: 1000,
          },
        },
        {
          input: {
            aiRunCancellationInspector: {
              hasAiRunCancelRequest: () => Promise.resolve(false),
            },
            watchIntervalMilliseconds: 250,
          },
        },
      ]

      test.each(cases)('watchIntervalMilliseconds: $input.watchIntervalMilliseconds', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCancellationWatcher)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })

    describe('should fill default value', () => {
      const cases = [
        {
          label: 'only the interval omitted',
          input: {
            aiRunCancellationInspector: {
              hasAiRunCancelRequest: () => Promise.resolve(true),
            },
            // watchIntervalMilliseconds: omitted → default 1000
          },
          expected: expect.objectContaining({
            watchIntervalMilliseconds: 1000,
          }),
        },
        {
          label: 'only the inspector omitted',
          input: {
            // aiRunCancellationInspector: omitted → default AiRunCancellationInspector.create()
            watchIntervalMilliseconds: 250,
          },
          expected: expect.objectContaining({
            aiRunCancellationInspector: expect.any(AiRunCancellationInspector),
            watchIntervalMilliseconds: 250,
          }),
        },
        {
          label: 'both omitted',
          input: {
            // aiRunCancellationInspector: omitted → default AiRunCancellationInspector.create()
            // watchIntervalMilliseconds: omitted → default 1000
          },
          expected: expect.objectContaining({
            aiRunCancellationInspector: expect.any(AiRunCancellationInspector),
            watchIntervalMilliseconds: 1000,
          }),
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunCancellationWatcher)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunCancellationWatcher', () => {
  describe('.get:timersPromises', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AiRunCancellationWatcher.timersPromises

        expect(received)
          .toBe(timersPromises) // same reference
      })
    })
  })
})

describe('AiRunCancellationWatcher', () => {
  describe('.createAiRunCancellationInspector()', () => {
    const cases = [
      {
        input: {
          Ctor: AiRunCancellationWatcher,
        },
      },
      {
        input: {
          Ctor: class AlphaAiRunCancellationWatcher extends AiRunCancellationWatcher {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', ({
      input,
    }) => {
      const received = input.Ctor.createAiRunCancellationInspector()

      expect(received)
        .toBeInstanceOf(AiRunCancellationInspector)
    })
  })
})

describe('AiRunCancellationWatcher', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          Ctor: AiRunCancellationWatcher,
        },
      },
      {
        input: {
          Ctor: class BetaAiRunCancellationWatcher extends AiRunCancellationWatcher {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', ({
      input,
    }) => {
      const watcher = input.Ctor.create()

      const received = watcher.Ctor

      expect(received)
        .toBe(input.Ctor) // same reference
    })
  })
})

describe('AiRunCancellationWatcher', () => {
  describe('#waitOutWatchInterval()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            watchIntervalMilliseconds: 1,
          },
        },
        {
          input: {
            watchIntervalMilliseconds: 3,
          },
        },
      ]

      test.each(cases)('watchIntervalMilliseconds: $input.watchIntervalMilliseconds', async ({
        input,
      }) => {
        const watcher = AiRunCancellationWatcher.create(input)
        const watchTerminator = new AbortController()
        const args = {
          watchSignal: watchTerminator.signal,
        }

        const received = await watcher.waitOutWatchInterval(args)

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * The intervals are minutes long, so nothing but the raised signal can be what answers. A wait
     * that ignored the signal would hold the test until Jest gave up on it.
     */
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            watchIntervalMilliseconds: 60000,
          },
        },
        {
          input: {
            watchIntervalMilliseconds: 120000,
          },
        },
      ]

      test.each(cases)('watchIntervalMilliseconds: $input.watchIntervalMilliseconds', async ({
        input,
      }) => {
        const watcher = AiRunCancellationWatcher.create(input)
        const watchTerminator = new AbortController()
        const args = {
          watchSignal: watchTerminator.signal,
        }
        watchTerminator.abort()

        const received = await watcher.waitOutWatchInterval(args)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunCancellationWatcher', () => {
  describe('#raiseAiRunCancellation()', () => {
    describe('when a client has asked for the run to stop', () => {
      describe('should be truthy', () => {
        const cases = [
          {
            input: {
              aiRunId: 10010006,
            },
          },
          {
            input: {
              aiRunId: 10010010,
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const watcher = AiRunCancellationWatcher.create()
          const aiRunWorkTerminator = new AbortController()
          const args = {
            aiRunId: input.aiRunId,
            aiRunWorkTerminator,
          }

          const received = await watcher.raiseAiRunCancellation(args)

          expect(received)
            .toBeTruthy()
        })
      })

      describe('should raise the work terminator', () => {
        const cases = [
          {
            input: {
              aiRunId: 10010006,
            },
          },
          {
            input: {
              aiRunId: 10010010,
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const watcher = AiRunCancellationWatcher.create()
          const aiRunWorkTerminator = new AbortController()
          const args = {
            aiRunId: input.aiRunId,
            aiRunWorkTerminator,
          }

          await watcher.raiseAiRunCancellation(args)

          const received = aiRunWorkTerminator.signal.aborted
          expect(received)
            .toBeTruthy()
        })
      })
    })

    describe('when nobody has asked for the run to stop', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunId: 10010001,
            },
          },
          {
            input: {
              aiRunId: 10010002,
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const watcher = AiRunCancellationWatcher.create()
          const aiRunWorkTerminator = new AbortController()
          const args = {
            aiRunId: input.aiRunId,
            aiRunWorkTerminator,
          }

          const received = await watcher.raiseAiRunCancellation(args)

          expect(received)
            .toBeFalsy()
        })
      })

      describe('should leave the work terminator unraised', () => {
        const cases = [
          {
            input: {
              aiRunId: 10010001,
            },
          },
          {
            input: {
              aiRunId: 10010002,
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const watcher = AiRunCancellationWatcher.create()
          const aiRunWorkTerminator = new AbortController()
          const args = {
            aiRunId: input.aiRunId,
            aiRunWorkTerminator,
          }

          await watcher.raiseAiRunCancellation(args)

          const received = aiRunWorkTerminator.signal.aborted
          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('AiRunCancellationWatcher', () => {
  describe('#watchAiRunCancellation()', () => {
    describe('when the run has already been asked to stop', () => {
      describe('should be truthy', () => {
        const cases = [
          {
            input: {
              aiRunId: 10010006,
            },
          },
          {
            input: {
              aiRunId: 10010010,
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const watcher = AiRunCancellationWatcher.create({
            watchIntervalMilliseconds: 1,
          })
          const aiRunWorkTerminator = new AbortController()
          const watchTerminator = new AbortController()
          const args = {
            aiRunId: input.aiRunId,
            aiRunWorkTerminator,
            watchSignal: watchTerminator.signal,
          }

          const received = await watcher.watchAiRunCancellation(args)

          expect(received)
            .toBeTruthy()
        })
      })

      describe('should raise the work terminator', () => {
        const cases = [
          {
            input: {
              aiRunId: 10010006,
            },
          },
          {
            input: {
              aiRunId: 10010010,
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const watcher = AiRunCancellationWatcher.create({
            watchIntervalMilliseconds: 1,
          })
          const aiRunWorkTerminator = new AbortController()
          const watchTerminator = new AbortController()
          const args = {
            aiRunId: input.aiRunId,
            aiRunWorkTerminator,
            watchSignal: watchTerminator.signal,
          }

          await watcher.watchAiRunCancellation(args)

          const received = aiRunWorkTerminator.signal.aborted
          expect(received)
            .toBeTruthy()
        })
      })
    })

    /*
     * The watch is stopped before its first interval has passed, which is what a delivery does the
     * moment its work has answered. The interval is minutes long, so nothing but the stop can be
     * what answers — and the run named is one that has been asked to stop, so a watch that read the
     * column before honoring its own signal would answer true and be caught here.
     */
    describe('when the watch is stopped before it reads', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              aiRunId: 10010006,
            },
          },
          {
            input: {
              aiRunId: 10010010,
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const watcher = AiRunCancellationWatcher.create({
            watchIntervalMilliseconds: 60000,
          })
          const aiRunWorkTerminator = new AbortController()
          const watchTerminator = new AbortController()
          const args = {
            aiRunId: input.aiRunId,
            aiRunWorkTerminator,
            watchSignal: watchTerminator.signal,
          }
          watchTerminator.abort()

          const received = await watcher.watchAiRunCancellation(args)

          expect(received)
            .toBeFalsy()
        })
      })

      describe('should leave the work terminator unraised', () => {
        const cases = [
          {
            input: {
              aiRunId: 10010006,
            },
          },
          {
            input: {
              aiRunId: 10010010,
            },
          },
        ]

        test.each(cases)('aiRunId: $input.aiRunId', async ({
          input,
        }) => {
          const watcher = AiRunCancellationWatcher.create({
            watchIntervalMilliseconds: 60000,
          })
          const aiRunWorkTerminator = new AbortController()
          const watchTerminator = new AbortController()
          const args = {
            aiRunId: input.aiRunId,
            aiRunWorkTerminator,
            watchSignal: watchTerminator.signal,
          }
          watchTerminator.abort()

          await watcher.watchAiRunCancellation(args)

          const received = aiRunWorkTerminator.signal.aborted
          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})
