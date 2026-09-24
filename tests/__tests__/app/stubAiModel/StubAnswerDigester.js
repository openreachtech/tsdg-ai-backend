import StubAnswerDigester from '../../../../app/stubAiModel/StubAnswerDigester.js'

import crypto from 'node:crypto'

describe('StubAnswerDigester', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#hashAlgorithm', () => {
        const cases = [
          {
            tally: 'sha256',
          },
          {
            tally: 'sha512',
          },
          {
            tally: 'sha1',
          },
        ]

        test.each(cases)('hashAlgorithm: $tally', ({
          tally,
        }) => {
          const digester = new StubAnswerDigester({
            hashAlgorithm: tally,
          })

          expect(digester)
            .toHaveProperty('hashAlgorithm', tally)
        })
      })
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            hashAlgorithm: 'sha256',
          },
        },
        {
          input: {
            hashAlgorithm: 'sha512',
          },
        },
      ]

      test.each(cases)('hashAlgorithm: $input.hashAlgorithm', ({
        input,
      }) => {
        const received = StubAnswerDigester.create(input)

        expect(received)
          .toBeInstanceOf(StubAnswerDigester)
      })
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            hashAlgorithm: 'sha384',
          },
        },
        {
          tally: {
            hashAlgorithm: 'sha512',
          },
        },
      ]

      test.each(cases)('hashAlgorithm: $tally.hashAlgorithm', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(StubAnswerDigester)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('.create()', () => {
    describe('should fill default hashAlgorithm', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(StubAnswerDigester)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith({
            hashAlgorithm: 'sha256',
          })
      })
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('.get:crypto', () => {
    describe('when called as is', () => {
      test('should be the node crypto module', () => {
        const received = StubAnswerDigester.crypto

        expect(received)
          .toBe(crypto) // same reference
      })
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: StubAnswerDigester,
      },
      {
        tally: class AlphaStubAnswerDigester extends StubAnswerDigester {},
      },
      {
        tally: class BetaStubAnswerDigester extends StubAnswerDigester {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const digester = tally.create()

      const received = digester.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('#buildCanonicalText()', () => {
    describe('with a scalar value', () => {
      const cases = [
        {
          input: {
            value: 'alpha-0001',
          },
          expected: '"alpha-0001"',
        },
        {
          input: {
            value: 100001,
          },
          expected: '100001',
        },
        {
          input: {
            value: true,
          },
          expected: 'true',
        },
        {
          input: {
            value: false,
          },
          expected: 'false',
        },
        {
          input: {
            value: 'beta "quoted" gamma', // A value that must be escaped to survive the round trip.
          },
          expected: '"beta \\"quoted\\" gamma"',
        },
        {
          input: {
            value: null,
          },
          expected: 'null',
        },
        {
          input: {
            value: undefined,
          },
          expected: 'null',
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const digester = StubAnswerDigester.create()

        const received = digester.buildCanonicalText(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with an array value', () => {
      const cases = [
        {
          input: {
            value: [
              100001,
              'alpha-0001',
              null,
            ],
          },
          expected: '[100001,"alpha-0001",null]',
        },
        {
          input: {
            value: [
              'gamma-0003',
              'beta-0002',
            ],
          },
          expected: '["gamma-0003","beta-0002"]', // Order is kept: an array says something by its order.
        },
        {
          input: {
            value: [],
          },
          expected: '[]',
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const digester = StubAnswerDigester.create()

        const received = digester.buildCanonicalText(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with an object value', () => {
      const cases = [
        {
          input: {
            value: {
              beta: 'beta-0002',
              alpha: 'alpha-0001',
            },
          },
          expected: '{"alpha":"alpha-0001","beta":"beta-0002"}', // Keys are ordered, whatever order they were assembled in.
        },
        {
          input: {
            value: {
              gamma: 100003,
              delta: null,
            },
          },
          expected: '{"delta":null,"gamma":100003}',
        },
        {
          input: {
            value: {},
          },
          expected: '{}',
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const digester = StubAnswerDigester.create()

        const received = digester.buildCanonicalText(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with nested values', () => {
      const cases = [
        {
          input: {
            value: {
              omega: {
                delta: [
                  true,
                  null,
                ],
                beta: 100002,
              },
            },
          },
          expected: '{"omega":{"beta":100002,"delta":[true,null]}}',
        },
        {
          input: {
            value: {
              omega: [
                {
                  zeta: 'zeta-0006',
                  epsilon: 'epsilon-0005',
                },
              ],
            },
          },
          expected: '{"omega":[{"epsilon":"epsilon-0005","zeta":"zeta-0006"}]}',
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const digester = StubAnswerDigester.create()

        const received = digester.buildCanonicalText(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('#buildCanonicalArrayText()', () => {
    const cases = [
      {
        input: {
          values: [
            100001,
            'alpha-0001',
          ],
        },
        expected: '[100001,"alpha-0001"]',
      },
      {
        input: {
          values: [
            null,
            true,
          ],
        },
        expected: '[null,true]',
      },
      {
        input: {
          values: [],
        },
        expected: '[]',
      },
    ]

    test.each(cases)('values: $input.values', ({
      input,
      expected,
    }) => {
      const digester = StubAnswerDigester.create()

      const received = digester.buildCanonicalArrayText(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('#buildCanonicalObjectText()', () => {
    const cases = [
      {
        input: {
          value: {
            beta: 'beta-0002',
            alpha: 'alpha-0001',
          },
        },
        expected: '{"alpha":"alpha-0001","beta":"beta-0002"}',
      },
      {
        input: {
          value: {
            zeta: 100006,
            epsilon: 100005,
            delta: 100004,
          },
        },
        expected: '{"delta":100004,"epsilon":100005,"zeta":100006}',
      },
      {
        input: {
          value: {},
        },
        expected: '{}',
      },
    ]

    test.each(cases)('value: $input.value', ({
      input,
      expected,
    }) => {
      const digester = StubAnswerDigester.create()

      const received = digester.buildCanonicalObjectText(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('#buildCanonicalPropertyText()', () => {
    const cases = [
      {
        input: {
          key: 'alpha',
          value: 'alpha-0001',
        },
        expected: '"alpha":"alpha-0001"',
      },
      {
        input: {
          key: 'beta',
          value: 100002,
        },
        expected: '"beta":100002',
      },
      {
        input: {
          key: 'gamma with "quotes"', // A key that must be escaped.
          value: null,
        },
        expected: '"gamma with \\"quotes\\"":null',
      },
    ]

    test.each(cases)('key: $input.key', ({
      input,
      expected,
    }) => {
      const digester = StubAnswerDigester.create()

      const received = digester.buildCanonicalPropertyText(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('#digestText()', () => {
    describe('when #hashAlgorithm:sha256', () => {
      const cases = [
        {
          input: {
            text: 'alpha-0001',
          },
          expected: '613891ed7ce962361fa2f99b986a99e9f00e027e129e47fc18abba558709ccae',
        },
        {
          input: {
            text: 'alpha-0002',
          },
          expected: 'ced95175ce96a7eb0af264b2da771df275555ac8ed705357da779caf34158f3d',
        },
        {
          input: {
            text: 'omega-0003',
          },
          expected: '54a25d1b4edaefcefab062ad3de875a60e5e7ddb2f7ba867a9a818eae5846adb',
        },
      ]

      test.each(cases)('text: $input.text', ({
        input,
        expected,
      }) => {
        const digester = StubAnswerDigester.create({
          hashAlgorithm: 'sha256',
        })

        const received = digester.digestText(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when #hashAlgorithm:sha512', () => {
      const cases = [
        {
          input: {
            text: 'alpha-0001',
          },
          expected: 'b4e59c48df3fd52af8c355f4bb2def5af7f9da11b08c61d01f4903b7bcb7b4d51eb261c31dc8e49eb263c150a2b382fb379b696e4364025be0e3129bf314eead',
        },
        {
          input: {
            text: 'alpha-0002',
          },
          expected: '13c4092dbf937a79fa788fdfa59a942a851f6b302c9990adc51ffef2fdb9325f836035ea8d62195dad1de651f729cc71dc3830d9f80b59f9deac1710e875204d',
        },
      ]

      test.each(cases)('text: $input.text', ({
        input,
        expected,
      }) => {
        const digester = StubAnswerDigester.create({
          hashAlgorithm: 'sha512',
        })

        const received = digester.digestText(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('StubAnswerDigester', () => {
  describe('#generateDigestedNumber()', () => {
    const cases = [
      {
        input: {
          text: 'alpha-0001',
        },
        expected: 1631097325, // Number.parseInt('613891ed', 16)
      },
      {
        input: {
          text: 'alpha-0002',
        },
        expected: 3470348661, // Number.parseInt('ced95175', 16)
      },
      {
        input: {
          text: 'omega-0003',
        },
        expected: 1419926811, // Number.parseInt('54a25d1b', 16)
      },
    ]

    test.each(cases)('text: $input.text', ({
      input,
      expected,
    }) => {
      const digester = StubAnswerDigester.create()

      const received = digester.generateDigestedNumber(input)

      expect(received)
        .toBe(expected)
    })
  })
})
