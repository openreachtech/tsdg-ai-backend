import AiModelResponse from '../../../../app/tools/AiModelResponse.js'

describe('AiModelResponse', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiResponseCapsule', () => {
        const cases = [
          {
            tally: {
              aiResponseCapsule: {
                extractContentText: () => 'content-text-0001',
              },
            },
          },
          {
            tally: {
              aiResponseCapsule: {
                hasError: () => false,
              },
            },
          },
        ]

        test.each(cases)('aiResponseCapsule: $tally.aiResponseCapsule', ({
          tally,
        }) => {
          const response = new AiModelResponse(tally)

          expect(response)
            .toHaveProperty('aiResponseCapsule', tally.aiResponseCapsule)
        })
      })
    })
  })
})

describe('AiModelResponse', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            aiResponseCapsule: {
              extractContentText: () => 'content-text-0001',
            },
          },
        },
        {
          input: {
            aiResponseCapsule: {
              hasError: () => false,
            },
          },
        },
      ]

      test.each(cases)('aiResponseCapsule: $input.aiResponseCapsule', ({
        input,
      }) => {
        const received = AiModelResponse.create(input)

        expect(received)
          .toBeInstanceOf(AiModelResponse)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            aiResponseCapsule: {
              extractContentText: () => 'content-text-0001',
            },
          },
        },
        {
          tally: {
            aiResponseCapsule: {
              hasError: () => false,
            },
          },
        },
      ]

      test.each(cases)('aiResponseCapsule: $tally.aiResponseCapsule', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiModelResponse)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('AiModelResponse', () => {
  describe('#hasError()', () => {
    describe('should be truthy', () => {
      // Only one capsule answer can be truthy, so a single case covers it.
      const cases = [
        {
          input: {
            hasError: true,
          },
        },
      ]

      test.each(cases)('hasError: $input.hasError', ({
        input,
      }) => {
        const args = {
          aiResponseCapsule: {
            hasError: () => input.hasError,
          },
        }
        const response = AiModelResponse.create(args)

        const received = response.hasError()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      // Only one capsule answer can be falsy, so a single case covers it.
      const cases = [
        {
          input: {
            hasError: false,
          },
        },
      ]

      test.each(cases)('hasError: $input.hasError', ({
        input,
      }) => {
        const args = {
          aiResponseCapsule: {
            hasError: () => input.hasError,
          },
        }
        const response = AiModelResponse.create(args)

        const received = response.hasError()

        expect(received)
          .toBeFalsy()
      })
    })

    describe('when the capsule does not answer the member', () => {
      const cases = [
        {
          input: {
            aiResponseCapsule: {
              extractContentText: () => 'content-text-0001', // Another member, not this one
            },
          },
        },
        {
          input: {
            aiResponseCapsule: null,
          },
        },
      ]

      test.each(cases)('aiResponseCapsule: $input.aiResponseCapsule', ({
        input,
      }) => {
        const response = AiModelResponse.create(input)

        expect(() => response.hasError())
          .toThrow('aiResponseCapsule#hasError() must be implemented')
      })
    })
  })
})

describe('AiModelResponse', () => {
  describe('#extractContentText()', () => {
    describe('when the capsule answers', () => {
      const cases = [
        {
          input: {
            contentText: 'content-text-0001',
          },
          expected: 'content-text-0001',
        },
        {
          input: {
            contentText: 'content-text-0002',
          },
          expected: 'content-text-0002',
        },
        {
          input: {
            contentText: '', // A model that answered with tool calls alone says nothing
          },
          expected: '',
        },
      ]

      test.each(cases)('contentText: $input.contentText', ({
        input,
        expected,
      }) => {
        const args = {
          aiResponseCapsule: {
            extractContentText: () => input.contentText,
          },
        }
        const response = AiModelResponse.create(args)

        const received = response.extractContentText()

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the capsule does not answer the member', () => {
      const cases = [
        {
          input: {
            aiResponseCapsule: {
              hasError: () => false, // Another member, not this one
            },
          },
        },
        {
          input: {
            aiResponseCapsule: null,
          },
        },
      ]

      test.each(cases)('aiResponseCapsule: $input.aiResponseCapsule', ({
        input,
      }) => {
        const response = AiModelResponse.create(input)

        expect(() => response.extractContentText())
          .toThrow('aiResponseCapsule#extractContentText() must be implemented')
      })
    })
  })
})

describe('AiModelResponse', () => {
  describe('#extractFunctionCalls()', () => {
    describe('when the capsule answers', () => {
      const cases = [
        {
          input: {
            functionCalls: [
              {
                name: 'tool-name-0001',
                arguments: {
                  alpha: 'argument-value-0001',
                },
              },
            ],
          },
          expected: [
            {
              name: 'tool-name-0001',
              arguments: {
                alpha: 'argument-value-0001',
              },
            },
          ],
        },
        {
          input: {
            functionCalls: [
              {
                name: 'tool-name-0002',
                arguments: {
                  beta: 'argument-value-0002',
                },
              },
              {
                name: 'tool-name-0003',
                arguments: {
                  gamma: 'argument-value-0003',
                },
              },
            ],
          },
          expected: [
            {
              name: 'tool-name-0002',
              arguments: {
                beta: 'argument-value-0002',
              },
            },
            {
              name: 'tool-name-0003',
              arguments: {
                gamma: 'argument-value-0003',
              },
            },
          ],
        },
        {
          input: {
            functionCalls: [], // A model that asked for no tool
          },
          expected: [],
        },
      ]

      test.each(cases)('functionCalls[0].name: $input.functionCalls.0.name', ({
        input,
        expected,
      }) => {
        const args = {
          aiResponseCapsule: {
            extractFunctionCalls: () => input.functionCalls,
          },
        }
        const response = AiModelResponse.create(args)

        const received = response.extractFunctionCalls()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the capsule does not answer the member', () => {
      const cases = [
        {
          input: {
            aiResponseCapsule: {
              hasError: () => false, // Another member, not this one
            },
          },
        },
        {
          input: {
            aiResponseCapsule: null,
          },
        },
      ]

      test.each(cases)('aiResponseCapsule: $input.aiResponseCapsule', ({
        input,
      }) => {
        const response = AiModelResponse.create(input)

        expect(() => response.extractFunctionCalls())
          .toThrow('aiResponseCapsule#extractFunctionCalls() must be implemented')
      })
    })
  })
})

describe('AiModelResponse', () => {
  describe('#extractErrorMessage()', () => {
    describe('when the capsule answers', () => {
      const cases = [
        {
          input: {
            errorMessage: 'error-message-0001',
          },
          expected: 'error-message-0001',
        },
        {
          input: {
            errorMessage: 'error-message-0002',
          },
          expected: 'error-message-0002',
        },
      ]

      test.each(cases)('errorMessage: $input.errorMessage', ({
        input,
        expected,
      }) => {
        const args = {
          aiResponseCapsule: {
            extractErrorMessage: () => input.errorMessage,
          },
        }
        const response = AiModelResponse.create(args)

        const received = response.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the capsule does not answer the member', () => {
      const cases = [
        {
          input: {
            aiResponseCapsule: {
              hasError: () => false, // Another member, not this one
            },
          },
        },
        {
          input: {
            aiResponseCapsule: null,
          },
        },
      ]

      test.each(cases)('aiResponseCapsule: $input.aiResponseCapsule', ({
        input,
      }) => {
        const response = AiModelResponse.create(input)

        expect(() => response.extractErrorMessage())
          .toThrow('aiResponseCapsule#extractErrorMessage() must be implemented')
      })
    })
  })
})

describe('AiModelResponse', () => {
  describe('#extractInputTokenCount()', () => {
    describe('when the capsule answers', () => {
      const cases = [
        {
          input: {
            inputTokenCount: 1201,
          },
          expected: 1201,
        },
        {
          input: {
            inputTokenCount: 34071,
          },
          expected: 34071,
        },
        {
          input: {
            inputTokenCount: 0, // A capsule that was answered a failure spent nothing
          },
          expected: 0,
        },
      ]

      test.each(cases)('inputTokenCount: $input.inputTokenCount', ({
        input,
        expected,
      }) => {
        const args = {
          aiResponseCapsule: {
            extractInputTokenCount: () => input.inputTokenCount,
          },
        }
        const response = AiModelResponse.create(args)

        const received = response.extractInputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the capsule does not answer the member', () => {
      const cases = [
        {
          input: {
            aiResponseCapsule: {
              extractOutputTokenCount: () => 2302, // The other count, not this one
            },
          },
        },
        {
          input: {
            aiResponseCapsule: null,
          },
        },
      ]

      test.each(cases)('aiResponseCapsule: $input.aiResponseCapsule', ({
        input,
      }) => {
        const response = AiModelResponse.create(input)

        expect(() => response.extractInputTokenCount())
          .toThrow('aiResponseCapsule#extractInputTokenCount() must be implemented')
      })
    })
  })
})

describe('AiModelResponse', () => {
  describe('#extractOutputTokenCount()', () => {
    describe('when the capsule answers', () => {
      const cases = [
        {
          input: {
            outputTokenCount: 2302,
          },
          expected: 2302,
        },
        {
          input: {
            outputTokenCount: 45182,
          },
          expected: 45182,
        },
        {
          input: {
            outputTokenCount: 0, // A capsule that was answered a failure spent nothing
          },
          expected: 0,
        },
      ]

      test.each(cases)('outputTokenCount: $input.outputTokenCount', ({
        input,
        expected,
      }) => {
        const args = {
          aiResponseCapsule: {
            extractOutputTokenCount: () => input.outputTokenCount,
          },
        }
        const response = AiModelResponse.create(args)

        const received = response.extractOutputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the capsule does not answer the member', () => {
      const cases = [
        {
          input: {
            aiResponseCapsule: {
              extractInputTokenCount: () => 1201, // The other count, not this one
            },
          },
        },
        {
          input: {
            aiResponseCapsule: null,
          },
        },
      ]

      test.each(cases)('aiResponseCapsule: $input.aiResponseCapsule', ({
        input,
      }) => {
        const response = AiModelResponse.create(input)

        expect(() => response.extractOutputTokenCount())
          .toThrow('aiResponseCapsule#extractOutputTokenCount() must be implemented')
      })
    })
  })
})
