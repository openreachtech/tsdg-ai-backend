import RunKeyGenerator from '../../../../app/aiRun/RunKeyGenerator.js'

import crypto from 'node:crypto'

describe('RunKeyGenerator', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#runKeyByteSize', () => {
        const cases = [
          {
            tally: 16,
          },
          {
            tally: 32,
          },
          {
            tally: 48,
          },
        ]

        test.each(cases)('runKeyByteSize: $tally', ({
          tally,
        }) => {
          const generator = new RunKeyGenerator({
            runKeyByteSize: tally,
          })

          expect(generator)
            .toHaveProperty('runKeyByteSize', tally)
        })
      })
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            runKeyByteSize: 24,
          },
        },
        {
          input: {
            runKeyByteSize: 64,
          },
        },
      ]

      test.each(cases)('runKeyByteSize: $input.runKeyByteSize', ({
        input,
      }) => {
        const received = RunKeyGenerator.create(input)

        expect(received)
          .toBeInstanceOf(RunKeyGenerator)
      })
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            runKeyByteSize: 20,
          },
        },
        {
          tally: {
            runKeyByteSize: 40,
          },
        },
      ]

      test.each(cases)('runKeyByteSize: $tally.runKeyByteSize', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(RunKeyGenerator)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('.create()', () => {
    describe('should fill default runKeyByteSize', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(RunKeyGenerator)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith({
            runKeyByteSize: 32, // the 256 bits the class description states
          })
      })
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('.get:crypto', () => {
    describe('when called as is', () => {
      test('should be the node crypto module', () => {
        const received = RunKeyGenerator.crypto

        expect(received)
          .toBe(crypto) // same reference
      })
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: RunKeyGenerator,
      },
      {
        tally: class AlphaRunKeyGenerator extends RunKeyGenerator {},
      },
      {
        tally: class BetaRunKeyGenerator extends RunKeyGenerator {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const generator = tally.create()

      const received = generator.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('#generateRunKey()', () => {
    /*
     * The key is drawn at random, so nothing here states the value it takes. What the caller is
     * promised is its shape — lower case hex, two characters per byte — and that is what is pinned.
     */
    describe('should be lower case hex', () => {
      const cases = [
        {
          input: {
            runKeyByteSize: 16,
          },
          expected: /^[0-9a-f]{32}$/u,
        },
        {
          input: {
            runKeyByteSize: 32,
          },
          expected: /^[0-9a-f]{64}$/u,
        },
        {
          input: {
            runKeyByteSize: 48,
          },
          expected: /^[0-9a-f]{96}$/u,
        },
      ]

      test.each(cases)('runKeyByteSize: $input.runKeyByteSize', ({
        input,
        expected,
      }) => {
        const generator = RunKeyGenerator.create(input)

        const received = generator.generateRunKey()

        expect(received)
          .toMatch(expected)
      })
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('#generateRunKey()', () => {
    describe('should be twice the byte size in characters', () => {
      const cases = [
        {
          input: {
            runKeyByteSize: 16,
          },
          expected: 32,
        },
        {
          input: {
            runKeyByteSize: 32,
          },
          expected: 64, // what the unique index on ai_runs.run_key stores
        },
        {
          input: {
            runKeyByteSize: 48,
          },
          expected: 96,
        },
      ]

      test.each(cases)('runKeyByteSize: $input.runKeyByteSize', ({
        input,
        expected,
      }) => {
        const generator = RunKeyGenerator.create(input)

        const received = generator.generateRunKey()

        expect(received)
          .toHaveLength(expected)
      })
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('#generateRunKey()', () => {
    /*
     * A key one caller holds is the whole of what it presents to read or to cancel its run, so a
     * generator answering the same key twice would hand one caller another caller's run.
     */
    describe('should not repeat across calls', () => {
      const cases = [
        {
          input: {
            runKeyByteSize: 16,
          },
        },
        {
          input: {
            runKeyByteSize: 32,
          },
        },
      ]

      test.each(cases)('runKeyByteSize: $input.runKeyByteSize', ({
        input,
      }) => {
        const generator = RunKeyGenerator.create(input)
        const previousRunKey = generator.generateRunKey()

        const received = generator.generateRunKey()

        expect(received)
          .not
          .toBe(previousRunKey)
      })
    })
  })
})

describe('RunKeyGenerator', () => {
  describe('#generateRunKey()', () => {
    describe('should call randomBytes() with the byte size', () => {
      const cases = [
        {
          tally: 16,
        },
        {
          tally: 32,
        },
        {
          tally: 48,
        },
      ]

      test.each(cases)('runKeyByteSize: $tally', ({
        tally,
      }) => {
        const generator = RunKeyGenerator.create({
          runKeyByteSize: tally,
        })
        const randomBytesSpy = jest.spyOn(RunKeyGenerator.crypto, 'randomBytes')

        generator.generateRunKey()

        expect(randomBytesSpy)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})
