import PromptVersionGenerator from '../../../../app/aiRun/PromptVersionGenerator.js'

describe('PromptVersionGenerator', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#promptVersionPattern', () => {
        const cases = [
          {
            tally: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
          },
          {
            tally: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u,
          },
          {
            tally: /^2026-\d{2}-\d{2}$/u,
          },
        ]

        test.each(cases)('promptVersionPattern: $tally', ({
          tally,
        }) => {
          const generator = new PromptVersionGenerator({
            promptVersionPattern: tally,
          })

          expect(generator)
            .toHaveProperty('promptVersionPattern', tally)
        })
      })
    })
  })
})

describe('PromptVersionGenerator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
          },
        },
        {
          input: {
            promptVersionPattern: /^2026-\d{2}-\d{2}$/u,
          },
        },
      ]

      test.each(cases)('promptVersionPattern: $input.promptVersionPattern', ({
        input,
      }) => {
        const received = PromptVersionGenerator.create(input)

        expect(received)
          .toBeInstanceOf(PromptVersionGenerator)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u,
          },
        },
        {
          tally: {
            promptVersionPattern: /^2026-\d{2}-\d{2}$/u,
          },
        },
      ]

      test.each(cases)('promptVersionPattern: $tally.promptVersionPattern', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(PromptVersionGenerator)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })

    /*
     * The default is written out here rather than imported, because it is the whole of what this
     * test guards. The three millisecond digits in it are the reason the class exists: a default
     * narrowed to seconds would satisfy the column and lose the generation a call actually sent.
     */
    describe('should fill default promptVersionPattern', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(PromptVersionGenerator)
        const expected = {
          promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('PromptVersionGenerator', () => {
  describe('#generatePromptVersion()', () => {
    /*
     * Closes: "every model call records the prompt version it used".
     *
     * The first two instants are the `saved_at` of the two seeded instruction generations, so the
     * text a call would record against them is pinned to the rows reproduction reads back. The rest
     * cover what a renderer loses when it is not exact: a millisecond with a leading zero, the last
     * millisecond of a month end, and an instant given at a local offset, which has to come out in
     * UTC. The one instant whose milliseconds are zero is kept deliberately — it is the single case
     * a truncating renderer would survive, and it is here so the contrast with the others is
     * visible rather than absent.
     */
    describe('should render the instant with its milliseconds', () => {
      const cases = [
        {
          input: {
            savedAt: new Date('2026-09-24T00:00:03.003Z'), // the seeded default instruction
          },
          expected: '2026-09-24T00:00:03.003Z',
        },
        {
          input: {
            savedAt: new Date('2026-09-24T00:00:04.004Z'), // the seeded role instruction
          },
          expected: '2026-09-24T00:00:04.004Z',
        },
        {
          input: {
            savedAt: new Date('2026-01-05T09:08:07.099Z'), // milliseconds with a leading zero
          },
          expected: '2026-01-05T09:08:07.099Z',
        },
        {
          input: {
            savedAt: new Date('2026-03-31T23:59:59.999Z'), // the last millisecond of a month end
          },
          expected: '2026-03-31T23:59:59.999Z',
        },
        {
          input: {
            savedAt: new Date('2026-02-28T12:34:56.789+09:00'), // stated at an offset, rendered in UTC
          },
          expected: '2026-02-28T03:34:56.789Z',
        },
        {
          input: {
            savedAt: new Date('2026-07-01T00:00:00.000Z'), // milliseconds exactly zero
          },
          expected: '2026-07-01T00:00:00.000Z',
        },
      ]

      test.each(cases)('savedAt: $input.savedAt', ({
        input,
        expected,
      }) => {
        const generator = PromptVersionGenerator.create()

        const received = generator.generatePromptVersion(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('PromptVersionGenerator', () => {
  describe('#generatePromptVersion()', () => {
    /*
     * A version is only worth recording if it resolves back to one generation, so a rendering the
     * instance's own pattern does not admit is refused rather than returned. The second pattern is
     * the seconds-only format: a deployment that narrowed the format there gets null, and the
     * NOT NULL column refuses the row, instead of a version that silently lost its milliseconds.
     */
    describe('when the pattern does not admit the rendering', () => {
      const cases = [
        {
          input: {
            promptVersionPattern: /^2025-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
            savedAt: new Date('2026-09-24T00:00:03.003Z'),
          },
        },
        {
          input: {
            promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u,
            savedAt: new Date('2026-09-24T00:00:04.004Z'),
          },
        },
      ]

      test.each(cases)('promptVersionPattern: $input.promptVersionPattern', ({
        input,
      }) => {
        const createArgs = {
          promptVersionPattern: input.promptVersionPattern,
        }
        const generatePromptVersionArgs = {
          savedAt: input.savedAt,
        }

        const generator = PromptVersionGenerator.create(createArgs)

        const received = generator.generatePromptVersion(generatePromptVersionArgs)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('PromptVersionGenerator', () => {
  describe('#generatePromptVersion()', () => {
    /*
     * Nothing but a usable instant is rendered. The rendering itself and the epoch milliseconds are
     * both here because each is a plausible thing for a caller to hand over by mistake, and each
     * would coerce into a string that looks like an answer.
     */
    describe('when the instant is not a usable Date', () => {
      /** @type {Array<{ input: { savedAt: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            savedAt: undefined, // an instruction row that carried no saved_at
          },
        },
        {
          input: {
            savedAt: null,
          },
        },
        {
          input: {
            savedAt: '2026-09-24T00:00:03.003Z', // the rendering, in place of the instant
          },
        },
        {
          input: {
            savedAt: 1790208003003, // epoch milliseconds, in place of the instant
          },
        },
        {
          input: {
            savedAt: new Date('unparseable-date'), // a Date carrying no time at all
          },
        },
        {
          input: {
            savedAt: {
              savedAt: new Date('2026-09-24T00:00:03.003Z'), // the row, in place of its field
            },
          },
        },
      ])

      test.each(cases)('savedAt: $input.savedAt', ({
        input,
      }) => {
        const generator = PromptVersionGenerator.create()

        const received = generator.generatePromptVersion(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('PromptVersionGenerator', () => {
  describe('#buildSavedAt()', () => {
    describe('should build the instant the version names', () => {
      const cases = [
        {
          input: {
            promptVersion: '2026-09-24T00:00:03.003Z',
          },
          expected: new Date('2026-09-24T00:00:03.003Z'),
        },
        {
          input: {
            promptVersion: '2026-09-24T00:00:04.004Z',
          },
          expected: new Date('2026-09-24T00:00:04.004Z'),
        },
        {
          input: {
            promptVersion: '2026-01-05T09:08:07.099Z',
          },
          expected: new Date('2026-01-05T09:08:07.099Z'),
        },
        {
          input: {
            promptVersion: '2026-03-31T23:59:59.999Z',
          },
          expected: new Date('2026-03-31T23:59:59.999Z'),
        },
        {
          input: {
            promptVersion: '2026-07-01T00:00:00.000Z',
          },
          expected: new Date('2026-07-01T00:00:00.000Z'),
        },
      ]

      test.each(cases)('promptVersion: $input.promptVersion', ({
        input,
        expected,
      }) => {
        const generator = PromptVersionGenerator.create()

        const received = generator.buildSavedAt(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('PromptVersionGenerator', () => {
  describe('#buildSavedAt()', () => {
    /*
     * The round trip, and what only it can say.
     *
     * The two describes above each pin one direction against literals, which leaves open the one
     * thing the column exists for: that the text a call recorded addresses the very instant the
     * instruction was saved with, and not an instant a millisecond or a second away from it.
     * Minting the version and resolving it back in one test is what closes that, and it is written
     * against `DATE(3)` values — the precision `ai_agent_default_instructions.saved_at` is stored
     * at — so a rendering that dropped the milliseconds would land on a different generation and
     * fail here.
     */
    describe('when the text was minted by #generatePromptVersion()', () => {
      const cases = [
        {
          input: {
            savedAt: new Date('2026-09-24T00:00:03.003Z'), // the seeded default instruction
          },
          expected: new Date('2026-09-24T00:00:03.003Z'),
        },
        {
          input: {
            savedAt: new Date('2026-09-24T00:00:04.004Z'), // the seeded role instruction
          },
          expected: new Date('2026-09-24T00:00:04.004Z'),
        },
        {
          input: {
            savedAt: new Date('2026-01-05T09:08:07.099Z'),
          },
          expected: new Date('2026-01-05T09:08:07.099Z'),
        },
        {
          input: {
            savedAt: new Date('2026-03-31T23:59:59.999Z'),
          },
          expected: new Date('2026-03-31T23:59:59.999Z'),
        },
      ]

      test.each(cases)('savedAt: $input.savedAt', ({
        input,
        expected,
      }) => {
        const generator = PromptVersionGenerator.create()
        const buildSavedAtArgs = {
          promptVersion: generator.generatePromptVersion(input),
        }

        const received = generator.buildSavedAt(buildSavedAtArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('PromptVersionGenerator', () => {
  describe('#buildSavedAt()', () => {
    /*
     * Only the exact rendering resolves. The first two are the near misses that matter: the
     * seconds-only form a truncating writer would have recorded, and the same instant stated at an
     * offset rather than in UTC. Each parses into a perfectly good Date, which is why refusing them
     * has to be the pattern's decision and not the Date constructor's.
     */
    describe('when the text is not a prompt version', () => {
      /** @type {Array<{ input: { promptVersion: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            promptVersion: '2026-09-24T00:00:03Z', // truncated to seconds
          },
        },
        {
          input: {
            promptVersion: '2026-09-24T09:00:03.003+09:00', // stated at an offset, not in UTC
          },
        },
        {
          input: {
            promptVersion: '2026-09-24 00:00:03.003Z', // separated by a space
          },
        },
        {
          input: {
            promptVersion: '',
          },
        },
        {
          input: {
            promptVersion: 'not-a-prompt-version',
          },
        },
        {
          input: {
            promptVersion: undefined,
          },
        },
        {
          input: {
            promptVersion: null,
          },
        },
        {
          input: {
            promptVersion: new Date('2026-09-24T00:00:03.003Z'), // the instant, in place of its rendering
          },
        },
        {
          input: {
            promptVersion: 1790208003003, // epoch milliseconds
          },
        },
      ])

      test.each(cases)('promptVersion: $input.promptVersion', ({
        input,
      }) => {
        const generator = PromptVersionGenerator.create()

        const received = generator.buildSavedAt(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('PromptVersionGenerator', () => {
  describe('#buildSavedAt()', () => {
    describe('when the pattern does not admit the text', () => {
      const cases = [
        {
          input: {
            promptVersionPattern: /^2025-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
            promptVersion: '2026-09-24T00:00:03.003Z',
          },
        },
        {
          input: {
            promptVersionPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u,
            promptVersion: '2026-09-24T00:00:04.004Z',
          },
        },
      ]

      test.each(cases)('promptVersionPattern: $input.promptVersionPattern', ({
        input,
      }) => {
        const createArgs = {
          promptVersionPattern: input.promptVersionPattern,
        }
        const buildSavedAtArgs = {
          promptVersion: input.promptVersion,
        }

        const generator = PromptVersionGenerator.create(createArgs)

        const received = generator.buildSavedAt(buildSavedAtArgs)

        expect(received)
          .toBeNull()
      })
    })
  })
})
