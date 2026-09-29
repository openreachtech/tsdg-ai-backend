import StubAiResponseCapsule from '../../../../app/stubAiModel/StubAiResponseCapsule.js'

import StubAnswerDigester from '../../../../app/stubAiModel/StubAnswerDigester.js'

describe('StubAiResponseCapsule', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#contentText', () => {
        const cases = [
          {
            tally: 'stub-answer:alpha-0001',
          },
          {
            tally: 'stub-answer:alpha-0002',
          },
        ]

        test.each(cases)('contentText: $tally', ({
          tally,
        }) => {
          const capsule = new StubAiResponseCapsule({
            contentText: tally,
            functionCalls: [], // Fill the unrelated required argument with a neutral value.
            inputTokenCount: 100001, // Fill the unrelated required argument with a neutral value.
            outputTokenCount: 100002, // Fill the unrelated required argument with a neutral value.
          })

          expect(capsule)
            .toHaveProperty('contentText', tally)
        })
      })

      describe('#functionCalls', () => {
        const cases = [
          {
            tally: [
              {
                name: 'alpha_tool',
                arguments: {},
              },
            ],
          },
          {
            tally: [
              {
                name: 'beta_tool',
                arguments: {},
              },
            ],
          },
          {
            tally: [],
          },
        ]

        test.each(cases)('functionCalls.0.name: $tally.0.name', ({
          tally,
        }) => {
          const capsule = new StubAiResponseCapsule({
            contentText: '', // Fill the unrelated required argument with a neutral value.
            functionCalls: tally,
            inputTokenCount: 100001, // Fill the unrelated required argument with a neutral value.
            outputTokenCount: 100002, // Fill the unrelated required argument with a neutral value.
          })

          expect(capsule)
            .toHaveProperty('functionCalls', tally)
        })
      })

      describe('#inputTokenCount', () => {
        const cases = [
          {
            tally: 100003,
          },
          {
            tally: 100004,
          },
        ]

        test.each(cases)('inputTokenCount: $tally', ({
          tally,
        }) => {
          const capsule = new StubAiResponseCapsule({
            contentText: '', // Fill the unrelated required argument with a neutral value.
            functionCalls: [], // Fill the unrelated required argument with a neutral value.
            inputTokenCount: tally,
            outputTokenCount: 100002, // Fill the unrelated required argument with a neutral value.
          })

          expect(capsule)
            .toHaveProperty('inputTokenCount', tally)
        })
      })

      describe('#outputTokenCount', () => {
        const cases = [
          {
            tally: 100005,
          },
          {
            tally: 100006,
          },
        ]

        test.each(cases)('outputTokenCount: $tally', ({
          tally,
        }) => {
          const capsule = new StubAiResponseCapsule({
            contentText: '', // Fill the unrelated required argument with a neutral value.
            functionCalls: [], // Fill the unrelated required argument with a neutral value.
            inputTokenCount: 100001, // Fill the unrelated required argument with a neutral value.
            outputTokenCount: tally,
          })

          expect(capsule)
            .toHaveProperty('outputTokenCount', tally)
        })
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            contentText: 'stub-answer:alpha-0001',
            functionCalls: [],
            inputTokenCount: 100001,
            outputTokenCount: 100002,
          },
        },
        {
          input: {
            contentText: 'stub-answer:alpha-0002',
            functionCalls: [],
            inputTokenCount: 100003,
            outputTokenCount: 100004,
          },
        },
      ]

      test.each(cases)('contentText: $input.contentText', ({
        input,
      }) => {
        const received = StubAiResponseCapsule.create(input)

        expect(received)
          .toBeInstanceOf(StubAiResponseCapsule)
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            contentText: 'stub-answer:gamma-0005',
            functionCalls: [],
            inputTokenCount: 100005,
            outputTokenCount: 100006,
          },
        },
        {
          tally: {
            contentText: 'stub-answer:delta-0007',
            functionCalls: [],
            inputTokenCount: 100007,
            outputTokenCount: 100008,
          },
        },
      ]

      test.each(cases)('contentText: $tally.contentText', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(StubAiResponseCapsule)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.createWithAnswer()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            requestText: 'alpha-0001',
            answerDigest: 'alpha-0001',
            functionCalls: [],
          },
        },
        {
          input: {
            requestText: 'alpha-0002-longer-request-text',
            answerDigest: 'alpha-0002',
            functionCalls: [],
          },
        },
      ]

      test.each(cases)('answerDigest: $input.answerDigest', ({
        input,
      }) => {
        const received = StubAiResponseCapsule.createWithAnswer(input)

        expect(received)
          .toBeInstanceOf(StubAiResponseCapsule)
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.createWithAnswer()', () => {
    /*
     * Every expected value below was derived offline from the arguments alone, so a capsule built
     * from one request is the same capsule wherever it is built:
     *
     *   contentText      = 'stub-answer:' + answerDigest
     *   inputTokenCount  = Math.ceil(requestText.length / 4)
     *   outputTokenCount = 24 + (Number.parseInt(sha256(answerDigest + ':outputTokenCount').slice(0, 8), 16) % 256)
     */
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            requestText: 'alpha-0001',
            answerDigest: 'alpha-0001',
            functionCalls: [],
          },
          expected: {
            contentText: 'stub-answer:alpha-0001',
            functionCalls: [],
            inputTokenCount: 3, // Math.ceil(10 / 4)
            outputTokenCount: 236, // 24 + (0x6a59c5d4 % 256)
          },
        },
        {
          input: {
            requestText: 'alpha-0002-longer-request-text',
            answerDigest: 'alpha-0002',
            functionCalls: [
              {
                name: 'record_field_values',
                arguments: {},
              },
            ],
          },
          expected: {
            contentText: 'stub-answer:alpha-0002',
            functionCalls: [
              {
                name: 'record_field_values',
                arguments: {},
              },
            ],
            inputTokenCount: 8, // Math.ceil(30 / 4)
            outputTokenCount: 177, // 24 + (0x78371299 % 256)
          },
        },
        {
          input: {
            requestText: 'omega-0003-request',
            answerDigest: 'omega-0003',
            functionCalls: [],
          },
          expected: {
            contentText: 'stub-answer:omega-0003',
            functionCalls: [],
            inputTokenCount: 5, // Math.ceil(18 / 4)
            outputTokenCount: 260, // 24 + (0xf0bd61ec % 256)
          },
        },
      ]

      test.each(cases)('answerDigest: $input.answerDigest', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(StubAiResponseCapsule)

        SpyClass.createWithAnswer(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.createWithAnswer()', () => {
    describe('should fill default answerDigester', () => {
      test('with no answerDigester', () => {
        const createStubAnswerDigesterSpy = jest.spyOn(StubAiResponseCapsule, 'createStubAnswerDigester')

        const args = {
          requestText: 'alpha-0001',
          answerDigest: 'alpha-0001',
          functionCalls: [],
          // answerDigester: omitted → default StubAnswerDigester.create()
        }

        const received = StubAiResponseCapsule.createWithAnswer(args)

        expect(createStubAnswerDigesterSpy)
          .toHaveBeenCalledWith()
        expect(received)
          .toHaveProperty('outputTokenCount', 236) // 24 + (0x6a59c5d4 % 256)
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.get:StubAnswerDigesterCtor', () => {
    describe('when called as is', () => {
      test('should be the stub answer digester', () => {
        const received = StubAiResponseCapsule.StubAnswerDigesterCtor

        expect(received)
          .toBe(StubAnswerDigester) // same reference
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.createStubAnswerDigester()', () => {
    describe('when called as is', () => {
      test('should be an instance of the stub answer digester', () => {
        const received = StubAiResponseCapsule.createStubAnswerDigester()

        expect(received)
          .toBeInstanceOf(StubAnswerDigester)
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.generateContentText()', () => {
    const cases = [
      {
        input: {
          answerDigest: 'alpha-0001',
        },
        expected: 'stub-answer:alpha-0001',
      },
      {
        input: {
          answerDigest: 'beta-0002',
        },
        expected: 'stub-answer:beta-0002',
      },
      {
        input: {
          answerDigest: '',
        },
        expected: 'stub-answer:',
      },
    ]

    test.each(cases)('answerDigest: $input.answerDigest', ({
      input,
      expected,
    }) => {
      const received = StubAiResponseCapsule.generateContentText(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.generateInputTokenCount()', () => {
    const cases = [
      {
        input: {
          requestText: 'alpha-0001',
        },
        expected: 3, // Math.ceil(10 / 4)
      },
      {
        input: {
          requestText: 'alpha-0002-longer-request-text',
        },
        expected: 8, // Math.ceil(30 / 4)
      },
      {
        input: {
          requestText: 'omega-0003-request',
        },
        expected: 5, // Math.ceil(18 / 4)
      },
      {
        input: {
          requestText: '',
        },
        expected: 0, // Math.ceil(0 / 4)
      },
    ]

    test.each(cases)('requestText: $input.requestText', ({
      input,
      expected,
    }) => {
      const received = StubAiResponseCapsule.generateInputTokenCount(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('.generateOutputTokenCount()', () => {
    const cases = [
      {
        input: {
          answerDigest: 'alpha-0001',
        },
        expected: 236, // 24 + (0x6a59c5d4 % 256)
      },
      {
        input: {
          answerDigest: 'alpha-0002',
        },
        expected: 177, // 24 + (0x78371299 % 256)
      },
      {
        input: {
          answerDigest: 'omega-0003',
        },
        expected: 260, // 24 + (0xf0bd61ec % 256)
      },
    ]

    test.each(cases)('answerDigest: $input.answerDigest', ({
      input,
      expected,
    }) => {
      const args = {
        answerDigest: input.answerDigest,
        answerDigester: StubAnswerDigester.create(),
      }

      const received = StubAiResponseCapsule.generateOutputTokenCount(args)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('#hasError()', () => {
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            contentText: 'stub-answer:alpha-0001',
            functionCalls: [],
            inputTokenCount: 100001,
            outputTokenCount: 100002,
          },
        },
        {
          input: {
            contentText: 'stub-answer:alpha-0002',
            functionCalls: [
              {
                name: 'record_field_values',
                arguments: {},
              },
            ],
            inputTokenCount: 100003,
            outputTokenCount: 100004,
          },
        },
      ]

      test.each(cases)('contentText: $input.contentText', ({
        input,
      }) => {
        const capsule = StubAiResponseCapsule.create(input)

        const received = capsule.hasError()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('#extractContentText()', () => {
    const cases = [
      {
        tally: 'stub-answer:alpha-0001',
      },
      {
        tally: 'stub-answer:alpha-0002',
      },
    ]

    test.each(cases)('contentText: $tally', ({
      tally,
    }) => {
      const capsule = StubAiResponseCapsule.create({
        contentText: tally,
        functionCalls: [], // Fill the unrelated required argument with a neutral value.
        inputTokenCount: 100001, // Fill the unrelated required argument with a neutral value.
        outputTokenCount: 100002, // Fill the unrelated required argument with a neutral value.
      })

      const received = capsule.extractContentText()

      expect(received)
        .toBe(tally)
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('#extractFunctionCalls()', () => {
    const cases = [
      {
        tally: [
          {
            name: 'alpha_tool',
            arguments: {},
          },
        ],
      },
      {
        tally: [
          {
            name: 'beta_tool',
            arguments: {},
          },
        ],
      },
      {
        tally: [],
      },
    ]

    test.each(cases)('functionCalls.0.name: $tally.0.name', ({
      tally,
    }) => {
      const capsule = StubAiResponseCapsule.create({
        contentText: '', // Fill the unrelated required argument with a neutral value.
        functionCalls: tally,
        inputTokenCount: 100001, // Fill the unrelated required argument with a neutral value.
        outputTokenCount: 100002, // Fill the unrelated required argument with a neutral value.
      })

      const received = capsule.extractFunctionCalls()

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('#extractErrorMessage()', () => {
    const cases = [
      {
        input: {
          contentText: 'stub-answer:alpha-0001',
          functionCalls: [],
          inputTokenCount: 100001,
          outputTokenCount: 100002,
        },
        expected: '',
      },
      {
        input: {
          contentText: 'stub-answer:alpha-0002',
          functionCalls: [],
          inputTokenCount: 100003,
          outputTokenCount: 100004,
        },
        expected: '',
      },
    ]

    test.each(cases)('contentText: $input.contentText', ({
      input,
      expected,
    }) => {
      const capsule = StubAiResponseCapsule.create(input)

      const received = capsule.extractErrorMessage()

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('#extractInputTokenCount()', () => {
    const cases = [
      {
        tally: 100009,
      },
      {
        tally: 100010,
      },
    ]

    test.each(cases)('inputTokenCount: $tally', ({
      tally,
    }) => {
      const capsule = StubAiResponseCapsule.create({
        contentText: '', // Fill the unrelated required argument with a neutral value.
        functionCalls: [], // Fill the unrelated required argument with a neutral value.
        inputTokenCount: tally,
        outputTokenCount: 100002, // Fill the unrelated required argument with a neutral value.
      })

      const received = capsule.extractInputTokenCount()

      expect(received)
        .toBe(tally)
    })
  })
})

describe('StubAiResponseCapsule', () => {
  describe('#extractOutputTokenCount()', () => {
    const cases = [
      {
        tally: 100011,
      },
      {
        tally: 100012,
      },
    ]

    test.each(cases)('outputTokenCount: $tally', ({
      tally,
    }) => {
      const capsule = StubAiResponseCapsule.create({
        contentText: '', // Fill the unrelated required argument with a neutral value.
        functionCalls: [], // Fill the unrelated required argument with a neutral value.
        inputTokenCount: 100001, // Fill the unrelated required argument with a neutral value.
        outputTokenCount: tally,
      })

      const received = capsule.extractOutputTokenCount()

      expect(received)
        .toBe(tally)
    })
  })
})
