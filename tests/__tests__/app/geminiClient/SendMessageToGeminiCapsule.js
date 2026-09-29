import SendMessageToGeminiCapsule from '../../../../app/geminiClient/SendMessageToGeminiCapsule.js'

/*
 * The six members `AiModelResponse` delegates to, read off responses shaped the way the vendor
 * documents `GenerateContentResponse`: `text`, `functionCalls` of `{ name, args }`, and a
 * `usageMetadata` carrying `promptTokenCount` and `candidatesTokenCount`.
 *
 * No case here calls Google. The responses are built in the test, which is the only way to pin what
 * each member reads: a live call would answer something different every run, and a run needing a
 * key is a run nobody can make on a default installation.
 */

describe('SendMessageToGeminiCapsule', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#response', () => {
        const cases = [
          {
            tally: {
              text: 'answer-0001',
            },
          },
          {
            tally: {
              text: 'answer-0002',
            },
          },
          {
            tally: null,
          },
        ]

        test.each(cases)('response.text: $tally.text', ({
          tally,
        }) => {
          const capsule = new SendMessageToGeminiCapsule({
            response: tally,
            error: null, // Fill the unrelated required argument with a neutral value.
          })

          expect(capsule)
            .toHaveProperty('response', tally)
        })
      })

      describe('#error', () => {
        const cases = [
          {
            tally: new Error('failure-0001'),
          },
          {
            tally: new Error('failure-0002'),
          },
          {
            tally: null,
          },
        ]

        test.each(cases)('error.message: $tally.message', ({
          tally,
        }) => {
          const capsule = new SendMessageToGeminiCapsule({
            response: null, // Fill the unrelated required argument with a neutral value.
            error: tally,
          })

          expect(capsule)
            .toHaveProperty('error', tally)
        })
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'answer-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('failure-0002'),
          },
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
      }) => {
        const received = SendMessageToGeminiCapsule.create(input)

        expect(received)
          .toBeInstanceOf(SendMessageToGeminiCapsule)
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'answer-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('failure-0002'),
          },
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(SendMessageToGeminiCapsule)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('.createWithResponse()', () => {
    describe('should call constructor with no error', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'answer-0001',
            },
          },
          expected: {
            response: {
              text: 'answer-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: {
              text: 'answer-0002',
            },
          },
          expected: {
            response: {
              text: 'answer-0002',
            },
            error: null,
          },
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(SendMessageToGeminiCapsule)

        SpyClass.createWithResponse(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('.createWithError()', () => {
    describe('should call constructor with no response', () => {
      const cases = [
        {
          input: {
            error: new Error('failure-0001'),
          },
          expected: {
            response: null,
            error: new Error('failure-0001'),
          },
        },
        {
          input: {
            error: new Error('failure-0002'),
          },
          expected: {
            response: null,
            error: new Error('failure-0002'),
          },
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(SendMessageToGeminiCapsule)

        SpyClass.createWithError(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#hasError()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            response: null,
            error: new Error('failure-0001'),
          },
        },
        {
          input: {
            response: null,
            error: new Error('failure-0002'),
          },
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.hasError()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'answer-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: null,
          },
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.hasError()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#extractContentText()', () => {
    describe('should answer the text the vendor stated', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'The plate reads AB-1234',
            },
            error: null,
          },
          expected: 'The plate reads AB-1234',
        },
        {
          input: {
            response: {
              text: 'answer-0002',
            },
            error: null,
          },
          expected: 'answer-0002',
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractContentText()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer empty where the vendor stated none', () => {
      const cases = [
        {
          // An answer of tool calls alone carries no text, which is the ordinary forced-call case.
          input: {
            response: {
              functionCalls: [
                {
                  name: 'record_field_readings',
                  args: {},
                },
              ],
            },
            error: null,
          },
        },
        {
          input: {
            response: {},
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('failure-0003'),
          },
        },
      ]

      test.each(cases)('response.functionCalls.0.name: $input.response.functionCalls.0.name', ({
        input,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractContentText()

        expect(received)
          .toBe('')
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#extractFunctionCalls()', () => {
    describe('should rename the vendor args to arguments', () => {
      const cases = [
        {
          input: {
            response: {
              functionCalls: [
                {
                  name: 'record_field_readings',
                  args: {
                    readings: [
                      {
                        path: 'alpha',
                      },
                    ],
                  },
                },
              ],
            },
            error: null,
          },
          expected: [
            {
              name: 'record_field_readings',
              arguments: {
                readings: [
                  {
                    path: 'alpha',
                  },
                ],
              },
            },
          ],
        },
        {
          input: {
            response: {
              functionCalls: [
                {
                  name: 'tool-0002',
                  args: {
                    beta: 'value-0002',
                  },
                },
                {
                  name: 'tool-0003',
                  args: {
                    gamma: 'value-0003',
                  },
                },
              ],
            },
            error: null,
          },
          expected: [
            {
              name: 'tool-0002',
              arguments: {
                beta: 'value-0002',
              },
            },
            {
              name: 'tool-0003',
              arguments: {
                gamma: 'value-0003',
              },
            },
          ],
        },
        {
          // The vendor omits args entirely for a call taking none.
          input: {
            response: {
              functionCalls: [
                {
                  name: 'tool-0004',
                },
              ],
            },
            error: null,
          },
          expected: [
            {
              name: 'tool-0004',
              arguments: {},
            },
          ],
        },
      ]

      test.each(cases)('functionCalls.0.name: $input.response.functionCalls.0.name', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractFunctionCalls()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should answer empty where the model asked for none', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'answer-0001',
              functionCalls: [],
            },
            error: null,
          },
        },
        {
          input: {
            response: {
              text: 'answer-0002',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('failure-0003'),
          },
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractFunctionCalls()

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#buildFunctionCall()', () => {
    describe('should build one call in the shape the contract names', () => {
      const cases = [
        {
          input: {
            functionCall: {
              name: 'tool-0001',
              args: {
                alpha: 'value-0001',
              },
            },
          },
          expected: {
            name: 'tool-0001',
            arguments: {
              alpha: 'value-0001',
            },
          },
        },
        {
          input: {
            functionCall: {
              name: 'tool-0002',
            },
          },
          expected: {
            name: 'tool-0002',
            arguments: {},
          },
        },
        {
          input: {
            functionCall: {
              args: {
                beta: 'value-0003',
              },
            },
          },
          expected: {
            name: null,
            arguments: {
              beta: 'value-0003',
            },
          },
        },
      ]

      test.each(cases)('functionCall.name: $input.functionCall.name', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create({
          response: null, // Neutral; this member reads its argument only.
          error: null,
        })

        const received = capsule.buildFunctionCall(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#extractErrorMessage()', () => {
    describe('should answer the message the API stated', () => {
      const cases = [
        {
          input: {
            response: null,
            error: new Error('got status: 400 Bad Request. {"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}'),
          },
          expected: 'API key not valid. Please pass a valid API key.',
        },
        {
          input: {
            response: null,
            error: new Error('got status: 429. {"error":{"code":429,"message":"Resource has been exhausted (e.g. check quota).","status":"RESOURCE_EXHAUSTED"}}'),
          },
          expected: 'Resource has been exhausted (e.g. check quota).',
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer the raised message where it carries no readable body', () => {
      const cases = [
        {
          input: {
            response: null,
            error: new Error('fetch failed'),
          },
          expected: 'fetch failed',
        },
        {
          input: {
            response: null,
            // A brace with nothing parseable behind it: the whole message has to stand.
            error: new Error('exception thrown {not-json'),
          },
          expected: 'exception thrown {not-json',
        },
        {
          input: {
            response: null,
            // JSON that parses but states no error message.
            error: new Error('odd body {"status":"UNKNOWN"}'),
          },
          expected: 'odd body {"status":"UNKNOWN"}',
        },
      ]

      test.each(cases)('error.message: $input.error.message', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer empty where the call did not raise', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'answer-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: {
              text: 'answer-0002',
            },
            error: null,
          },
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe('')
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#extractApiErrorMessage()', () => {
    describe('should read the body out of a raised message', () => {
      const cases = [
        {
          input: {
            rawMessage: 'prefix {"error":{"message":"message-0001"}}',
          },
          expected: 'message-0001',
        },
        {
          input: {
            rawMessage: '{"error":{"message":"message-0002"}}',
          },
          expected: 'message-0002',
        },
        {
          input: {
            rawMessage: 'no body at all',
          },
          expected: 'no body at all',
        },
      ]

      test.each(cases)('rawMessage: $input.rawMessage', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create({
          response: null, // Neutral; this member reads its argument only.
          error: null,
        })

        const received = capsule.extractApiErrorMessage(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#parseErrorBody()', () => {
    describe('should answer the parsed body', () => {
      const cases = [
        {
          input: {
            bodyText: '{"error":{"message":"message-0001"}}',
          },
          expected: {
            error: {
              message: 'message-0001',
            },
          },
        },
        {
          input: {
            bodyText: '{"status":"UNKNOWN-0002"}',
          },
          expected: {
            status: 'UNKNOWN-0002',
          },
        },
      ]

      test.each(cases)('bodyText: $input.bodyText', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create({
          response: null, // Neutral; this member reads its argument only.
          error: null,
        })

        const received = capsule.parseErrorBody(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should answer null where the body is not JSON', () => {
      const cases = [
        {
          input: {
            bodyText: '{not-json',
          },
        },
        {
          input: {
            bodyText: '{"unterminated": ',
          },
        },
      ]

      test.each(cases)('bodyText: $input.bodyText', ({
        input,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create({
          response: null, // Neutral; this member reads its argument only.
          error: null,
        })

        const received = capsule.parseErrorBody(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#extractInputTokenCount()', () => {
    describe('should answer the count the vendor billed', () => {
      const cases = [
        {
          input: {
            response: {
              usageMetadata: {
                promptTokenCount: 100001,
                candidatesTokenCount: 100002,
              },
            },
            error: null,
          },
          expected: 100001,
        },
        {
          input: {
            response: {
              usageMetadata: {
                promptTokenCount: 100003,
                candidatesTokenCount: 100004,
              },
            },
            error: null,
          },
          expected: 100003,
        },
      ]

      test.each(cases)('promptTokenCount: $input.response.usageMetadata.promptTokenCount', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractInputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer zero where the vendor stated no usage', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'answer-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('failure-0002'),
          },
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractInputTokenCount()

        expect(received)
          .toBe(0)
      })
    })
  })
})

describe('SendMessageToGeminiCapsule', () => {
  describe('#extractOutputTokenCount()', () => {
    describe('should answer the count the vendor billed', () => {
      const cases = [
        {
          input: {
            response: {
              usageMetadata: {
                promptTokenCount: 100001,
                candidatesTokenCount: 100002,
              },
            },
            error: null,
          },
          expected: 100002,
        },
        {
          input: {
            response: {
              usageMetadata: {
                promptTokenCount: 100003,
                candidatesTokenCount: 100004,
              },
            },
            error: null,
          },
          expected: 100004,
        },
      ]

      test.each(cases)('candidatesTokenCount: $input.response.usageMetadata.candidatesTokenCount', ({
        input,
        expected,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractOutputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer zero where the vendor stated no usage', () => {
      const cases = [
        {
          input: {
            response: {
              text: 'answer-0001',
            },
            error: null,
          },
        },
        {
          input: {
            response: null,
            error: new Error('failure-0002'),
          },
        },
      ]

      test.each(cases)('response.text: $input.response.text', ({
        input,
      }) => {
        const capsule = SendMessageToGeminiCapsule.create(input)

        const received = capsule.extractOutputTokenCount()

        expect(received)
          .toBe(0)
      })
    })
  })
})
