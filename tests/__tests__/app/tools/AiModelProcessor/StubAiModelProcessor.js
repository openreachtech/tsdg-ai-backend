import StubAiModelProcessor from '../../../../../app/tools/AiModelProcessor/StubAiModelProcessor.js'

import BaseAiModelProcessor from '../../../../../app/tools/BaseAiModelProcessor.js'
import AiModelResponse from '../../../../../app/tools/AiModelResponse.js'
import StubAnswerDigester from '../../../../../app/stubAiModel/StubAnswerDigester.js'
import StubAiResponseCapsule from '../../../../../app/stubAiModel/StubAiResponseCapsule.js'

describe('StubAiModelProcessor', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = StubAiModelProcessor.prototype

      expect(received)
        .toBeInstanceOf(BaseAiModelProcessor)
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#answerDigester', () => {
        const cases = [
          {
            tally: StubAnswerDigester.create({
              hashAlgorithm: 'sha256',
            }),
          },
          {
            tally: StubAnswerDigester.create({
              hashAlgorithm: 'sha512',
            }),
          },
        ]

        test.each(cases)('hashAlgorithm: $tally.hashAlgorithm', ({
          tally,
        }) => {
          const processor = new StubAiModelProcessor({
            answerDigester: tally,
          })

          expect(processor)
            .toHaveProperty('answerDigester', tally)
        })
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            answerDigester: StubAnswerDigester.create({
              hashAlgorithm: 'sha256',
            }),
          },
        },
        {
          input: {
            answerDigester: StubAnswerDigester.create({
              hashAlgorithm: 'sha512',
            }),
          },
        },
      ]

      test.each(cases)('hashAlgorithm: $input.answerDigester.hashAlgorithm', ({
        input,
      }) => {
        const received = StubAiModelProcessor.create(input)

        expect(received)
          .toBeInstanceOf(StubAiModelProcessor)
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            answerDigester: StubAnswerDigester.create({
              hashAlgorithm: 'sha384',
            }),
          },
        },
        {
          tally: {
            answerDigester: StubAnswerDigester.create({
              hashAlgorithm: 'sha512',
            }),
          },
        },
      ]

      test.each(cases)('hashAlgorithm: $tally.answerDigester.hashAlgorithm', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(StubAiModelProcessor)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('.create()', () => {
    /*
     * The directory scan that discovers a processor calls `.create()` with no arguments at all, so
     * the driver a default installation runs is the one built here — with nothing handed to it, and
     * nothing read from anywhere.
     */
    describe('should fill default answerDigester', () => {
      test('with no arguments', () => {
        const createStubAnswerDigesterSpy = jest.spyOn(StubAiModelProcessor, 'createStubAnswerDigester')
        const SpyClass = constructorSpy.spyOn(StubAiModelProcessor)

        SpyClass.create()

        expect(createStubAnswerDigesterSpy)
          .toHaveBeenCalledWith()
        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith({
            answerDigester: expect.any(StubAnswerDigester),
          })
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('.get:StubAnswerDigesterCtor', () => {
    describe('when called as is', () => {
      test('should be the stub answer digester', () => {
        const received = StubAiModelProcessor.StubAnswerDigesterCtor

        expect(received)
          .toBe(StubAnswerDigester) // same reference
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('.get:StubAiResponseCapsuleCtor', () => {
    describe('when called as is', () => {
      test('should be the stub response capsule', () => {
        const received = StubAiModelProcessor.StubAiResponseCapsuleCtor

        expect(received)
          .toBe(StubAiResponseCapsule) // same reference
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('.get:AiModelResponseCtor', () => {
    describe('when called as is', () => {
      test('should be the canonical response', () => {
        const received = StubAiModelProcessor.AiModelResponseCtor

        expect(received)
          .toBe(AiModelResponse) // same reference
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('.createStubAnswerDigester()', () => {
    describe('when called as is', () => {
      test('should be an instance of the stub answer digester', () => {
        const received = StubAiModelProcessor.createStubAnswerDigester()

        expect(received)
          .toBeInstanceOf(StubAnswerDigester)
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: StubAiModelProcessor,
      },
      {
        tally: class AlphaStubAiModelProcessor extends StubAiModelProcessor {},
      },
      {
        tally: class BetaStubAiModelProcessor extends StubAiModelProcessor {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const processor = tally.create()

      const received = processor.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('StubAiModelProcessor', () => {
  /*
   * The name here is the app-facing `ai_models.name` of the seeded default row, which is what the
   * loader keys its hash on. A driver whose key drifted from that row would simply never be
   * resolved, so the value is pinned rather than read back from the same place it is written.
   */
  describe('#get:aiModel', () => {
    const cases = [
      {
        input: {
          Ctor: StubAiModelProcessor,
        },
        expected: 'stub',
      },
      {
        input: {
          Ctor: class AlphaStubAiModelProcessor extends StubAiModelProcessor {},
        },
        expected: 'stub',
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', ({
      input,
      expected,
    }) => {
      const processor = input.Ctor.create()

      const received = processor.aiModel

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAiModelProcessor', () => {
  /*
   * Acceptance criterion: a default installation answers every service on the stub — no key is read
   * and no outbound connection is opened.
   *
   * The driver imports no client module and no environment module, so the observable claim left to
   * assert is that answering opens nothing. `fetch` is the one route this repository reaches an
   * outbound service by, and it is spied on the global object it is reached through, so a driver
   * that grew a call would be caught here rather than on the first machine without a key.
   */
  describe('#sendRequestToAi()', () => {
    describe('should answer without opening an outbound connection', () => {
      const cases = [
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'alpha-0001',
            documents: [
              {
                path: 'document-0001',
              },
            ],
            fileUrls: [
              {
                fileType: 'image/jpeg',
                fileUrl: 'https://example.com/media-0001.jpg',
              },
            ],
            historyMessages: [],
            tools: [
              {
                description: 'omega',
                name: 'record_field_values',
                payload: '{}',
              },
            ],
            toolChoices: [],
            isAutoHandleFunctionCall: true,
            extraToolOptions: {},
          },
        },
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'beta-0002-with-a-longer-instruction',
            documents: [
              {
                path: 'document-0001',
              },
            ],
            fileUrls: [
              {
                fileType: 'image/jpeg',
                fileUrl: 'https://example.com/media-0001.jpg',
              },
            ],
            historyMessages: [],
            tools: [
              {
                description: 'omega',
                name: 'record_field_values',
                payload: '{}',
              },
            ],
            toolChoices: [],
            isAutoHandleFunctionCall: true,
            extraToolOptions: {},
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
      }) => {
        const fetchSpy = jest.spyOn(globalThis, 'fetch')
        const processor = StubAiModelProcessor.create()

        await processor.sendRequestToAi(input)

        expect(fetchSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  /*
   * Acceptance criterion: the stub returns the same answer every time for the same input.
   *
   * Every expected value below was derived offline from the request alone — the canonical text of
   * the request, sorted by key, digested with SHA-256 — so these literals do not move between runs
   * or between machines. The two cases differ only in the instruction, and answer differently, so a
   * driver that returned a constant would fail here rather than look deterministic by standing
   * still.
   */
  describe('#sendRequestToAi()', () => {
    describe('should answer with the content text drawn from the request', () => {
      const cases = [
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'alpha-0001',
            documents: [
              {
                path: 'document-0001',
              },
            ],
            fileUrls: [
              {
                fileType: 'image/jpeg',
                fileUrl: 'https://example.com/media-0001.jpg',
              },
            ],
            historyMessages: [],
            tools: [
              {
                description: 'omega',
                name: 'record_field_values',
                payload: '{}',
              },
            ],
            toolChoices: [],
            isAutoHandleFunctionCall: true,
            extraToolOptions: {},
          },
          expected: 'stub-answer:4e943469cb31d82944e7c09961f78c009009968f5249bedcb24ba15d7c2ff623',
        },
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'beta-0002-with-a-longer-instruction',
            documents: [
              {
                path: 'document-0001',
              },
            ],
            fileUrls: [
              {
                fileType: 'image/jpeg',
                fileUrl: 'https://example.com/media-0001.jpg',
              },
            ],
            historyMessages: [],
            tools: [
              {
                description: 'omega',
                name: 'record_field_values',
                payload: '{}',
              },
            ],
            toolChoices: [],
            isAutoHandleFunctionCall: true,
            extraToolOptions: {},
          },
          expected: 'stub-answer:e0dde380c61eb150d1ccd54d52af305b9f2c320db169453d9023e9a9ac0b83b3',
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
        expected,
      }) => {
        const processor = StubAiModelProcessor.create()

        const aiModelResponse = await processor.sendRequestToAi(input)
        const received = aiModelResponse.extractContentText()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  /*
   * The same criterion, seen from the side that catches the subtler failure: "the same input" is the
   * request's content, not the order somebody happened to assemble it in. The fields below are the
   * first case's fields written in a different order, and the answer is the first case's answer. An
   * implementation that digested the request as it was serialized would answer something else here.
   */
  describe('#sendRequestToAi()', () => {
    describe('should answer the same however the request was assembled', () => {
      test('with the fields in a different order', async () => {
        const args = {
          extraToolOptions: {},
          isAutoHandleFunctionCall: true,
          toolChoices: [],
          tools: [
            {
              payload: '{}',
              name: 'record_field_values',
              description: 'omega',
            },
          ],
          historyMessages: [],
          fileUrls: [
            {
              fileUrl: 'https://example.com/media-0001.jpg',
              fileType: 'image/jpeg',
            },
          ],
          documents: [
            {
              path: 'document-0001',
            },
          ],
          instruction: 'alpha-0001',
          aiAgent: {
            name: 'asset-media-extraction',
          },
        }
        const expected = 'stub-answer:4e943469cb31d82944e7c09961f78c009009968f5249bedcb24ba15d7c2ff623'

        const processor = StubAiModelProcessor.create()

        const aiModelResponse = await processor.sendRequestToAi(args)
        const received = aiModelResponse.extractContentText()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#sendRequestToAi()', () => {
    describe('should answer with the input token count of the request', () => {
      const cases = [
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'alpha-0001',
            documents: [
              {
                path: 'document-0001',
              },
            ],
            fileUrls: [
              {
                fileType: 'image/jpeg',
                fileUrl: 'https://example.com/media-0001.jpg',
              },
            ],
            historyMessages: [],
            tools: [
              {
                description: 'omega',
                name: 'record_field_values',
                payload: '{}',
              },
            ],
            toolChoices: [],
            isAutoHandleFunctionCall: true,
            extraToolOptions: {},
          },
          expected: 91, // Math.ceil(362 / 4)
        },
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'beta-0002-with-a-longer-instruction',
            documents: [
              {
                path: 'document-0001',
              },
            ],
            fileUrls: [
              {
                fileType: 'image/jpeg',
                fileUrl: 'https://example.com/media-0001.jpg',
              },
            ],
            historyMessages: [],
            tools: [
              {
                description: 'omega',
                name: 'record_field_values',
                payload: '{}',
              },
            ],
            toolChoices: [],
            isAutoHandleFunctionCall: true,
            extraToolOptions: {},
          },
          expected: 97, // Math.ceil(387 / 4)
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
        expected,
      }) => {
        const processor = StubAiModelProcessor.create()

        const aiModelResponse = await processor.sendRequestToAi(input)
        const received = aiModelResponse.extractInputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#sendRequestToAi()', () => {
    describe('should answer with the output token count drawn from the request', () => {
      const cases = [
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'alpha-0001',
            documents: [
              {
                path: 'document-0001',
              },
            ],
            fileUrls: [
              {
                fileType: 'image/jpeg',
                fileUrl: 'https://example.com/media-0001.jpg',
              },
            ],
            historyMessages: [],
            tools: [
              {
                description: 'omega',
                name: 'record_field_values',
                payload: '{}',
              },
            ],
            toolChoices: [],
            isAutoHandleFunctionCall: true,
            extraToolOptions: {},
          },
          expected: 104, // 24 + (0x2cd4df50 % 256)
        },
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'beta-0002-with-a-longer-instruction',
            documents: [
              {
                path: 'document-0001',
              },
            ],
            fileUrls: [
              {
                fileType: 'image/jpeg',
                fileUrl: 'https://example.com/media-0001.jpg',
              },
            ],
            historyMessages: [],
            tools: [
              {
                description: 'omega',
                name: 'record_field_values',
                payload: '{}',
              },
            ],
            toolChoices: [],
            isAutoHandleFunctionCall: true,
            extraToolOptions: {},
          },
          expected: 140, // 24 + (0x5e0aa774 % 256)
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
        expected,
      }) => {
        const processor = StubAiModelProcessor.create()

        const aiModelResponse = await processor.sendRequestToAi(input)
        const received = aiModelResponse.extractOutputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#sendRequestToAi()', () => {
    describe('should answer without a failure', () => {
      const cases = [
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'alpha-0001',
            documents: [],
            fileUrls: [],
          },
        },
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'beta-0002',
            documents: [],
            fileUrls: [],
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
      }) => {
        const processor = StubAiModelProcessor.create()

        const aiModelResponse = await processor.sendRequestToAi(input)
        const received = aiModelResponse.hasError()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#sendRequestToAi()', () => {
    describe('should answer with one tool call per tool offered', () => {
      const cases = [
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'alpha-0001',
            documents: [],
            fileUrls: [],
            tools: [
              {
                name: 'record_field_values',
                description: 'omega',
                payload: '{}',
              },
            ],
          },
          expected: [
            {
              name: 'record_field_values',
              arguments: {},
            },
          ],
        },
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'beta-0002',
            documents: [],
            fileUrls: [],
            tools: [
              {
                name: 'record_field_values',
                description: 'omega',
                payload: '{}',
              },
              {
                name: 'search_edit_options',
                description: 'zeta',
                payload: '{}',
              },
            ],
          },
          expected: [
            {
              name: 'record_field_values',
              arguments: {},
            },
            {
              name: 'search_edit_options',
              arguments: {},
            },
          ],
        },
        {
          input: {
            aiAgent: {
              name: 'asset-media-extraction',
            },
            instruction: 'gamma-0003',
            documents: [],
            fileUrls: [],
            tools: [],
          },
          expected: [],
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
        expected,
      }) => {
        const processor = StubAiModelProcessor.create()

        const aiModelResponse = await processor.sendRequestToAi(input)
        const received = aiModelResponse.extractFunctionCalls()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#buildRequestIdentity()', () => {
    const cases = [
      {
        input: {
          aiAgent: {
            name: 'asset-media-extraction',
          },
          instruction: 'alpha-0001',
          documents: [
            {
              path: 'document-0001',
            },
          ],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
          isAutoHandleFunctionCall: true,
          extraToolOptions: {},
        },
        expected: {
          aiAgentName: 'asset-media-extraction',
          instruction: 'alpha-0001',
          documents: [
            {
              path: 'document-0001',
            },
          ],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
          isAutoHandleFunctionCall: true,
          extraToolOptions: {},
        },
      },
      {
        input: {
          aiAgent: null, // No agent at all, which must read as no name rather than raise.
          instruction: 'beta-0002',
          documents: [],
          fileUrls: [
            {
              fileType: 'image/png',
              fileUrl: 'https://example.com/media-0002.png',
            },
          ],
          historyMessages: [],
          tools: [],
          toolChoices: [],
          isAutoHandleFunctionCall: false,
          extraToolOptions: {
            zeta: 'zeta-0006',
          },
        },
        expected: {
          aiAgentName: null,
          instruction: 'beta-0002',
          documents: [],
          fileUrls: [
            {
              fileType: 'image/png',
              fileUrl: 'https://example.com/media-0002.png',
            },
          ],
          historyMessages: [],
          tools: [],
          toolChoices: [],
          isAutoHandleFunctionCall: false,
          extraToolOptions: {
            zeta: 'zeta-0006',
          },
        },
      },
    ]

    test.each(cases)('instruction: $input.instruction', ({
      input,
      expected,
    }) => {
      const processor = StubAiModelProcessor.create()

      const received = processor.buildRequestIdentity(input)

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#buildAiModelResponse()', () => {
    const cases = [
      {
        input: {
          request: {
            beta: 'beta-0002',
            alpha: 'alpha-0001',
          },
          tools: [],
        },
        // sha256('{"alpha":"alpha-0001","beta":"beta-0002"}')
        expected: 'stub-answer:67e88d742edc6d8daf02b893376ec034944ceaaa504987a1c9b61e6267caa468',
      },
      {
        input: {
          request: {
            gamma: 100003,
            alpha: 'alpha-0003',
          },
          tools: [],
        },
        // sha256('{"alpha":"alpha-0003","gamma":100003}')
        expected: 'stub-answer:2437f361bf53416af48ac67562bbeb829148caa8ea720d877573edfb1982ab0a',
      },
    ]

    test.each(cases)('request.alpha: $input.request.alpha', ({
      input,
      expected,
    }) => {
      const processor = StubAiModelProcessor.create()

      const aiModelResponse = processor.buildAiModelResponse(input)
      const received = aiModelResponse.extractContentText()

      expect(received)
        .toBe(expected)
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#buildFunctionCalls()', () => {
    const cases = [
      {
        input: {
          tools: [
            {
              name: 'record_field_values',
            },
          ],
        },
        expected: [
          {
            name: 'record_field_values',
            arguments: {},
          },
        ],
      },
      {
        input: {
          tools: [
            {
              name: 'search_edit_options',
            },
            {
              name: 'select_search_targets',
            },
          ],
        },
        expected: [
          {
            name: 'search_edit_options',
            arguments: {},
          },
          {
            name: 'select_search_targets',
            arguments: {},
          },
        ],
      },
      {
        input: {
          tools: [],
        },
        expected: [],
      },
    ]

    test.each(cases)('tools.0.name: $input.tools.0.name', ({
      input,
      expected,
    }) => {
      const processor = StubAiModelProcessor.create()

      const received = processor.buildFunctionCalls(input)

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#buildFunctionCall()', () => {
    const cases = [
      {
        input: {
          tool: {
            name: 'record_field_values',
            description: 'omega',
          },
        },
        expected: {
          name: 'record_field_values',
          arguments: {},
        },
      },
      {
        input: {
          tool: {
            name: 'search_edit_options',
            description: 'zeta',
          },
        },
        expected: {
          name: 'search_edit_options',
          arguments: {},
        },
      },
      {
        input: {
          tool: {
            description: 'a tool carrying no name at all',
            // name: absent → answered as null rather than left off
          },
        },
        expected: {
          name: null,
          arguments: {},
        },
      },
    ]

    test.each(cases)('tool.description: $input.tool.description', ({
      input,
      expected,
    }) => {
      const processor = StubAiModelProcessor.create()

      const received = processor.buildFunctionCall(input)

      expect(received)
        .toEqual(expected)
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#createStubAiResponseCapsule()', () => {
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
          requestText: 'beta-0002-longer-request-text',
          answerDigest: 'beta-0002',
          functionCalls: [],
        },
      },
    ]

    test.each(cases)('answerDigest: $input.answerDigest', ({
      input,
    }) => {
      const processor = StubAiModelProcessor.create()

      const received = processor.createStubAiResponseCapsule(input)

      expect(received)
        .toBeInstanceOf(StubAiResponseCapsule)
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#createAiModelResponse()', () => {
    const cases = [
      {
        input: {
          aiResponseCapsule: StubAiResponseCapsule.create({
            contentText: 'stub-answer:alpha-0001',
            functionCalls: [],
            inputTokenCount: 100001,
            outputTokenCount: 100002,
          }),
        },
      },
      {
        input: {
          aiResponseCapsule: StubAiResponseCapsule.create({
            contentText: 'stub-answer:beta-0002',
            functionCalls: [],
            inputTokenCount: 100003,
            outputTokenCount: 100004,
          }),
        },
      },
    ]

    test.each(cases)('contentText: $input.aiResponseCapsule.contentText', ({
      input,
    }) => {
      const processor = StubAiModelProcessor.create()

      const received = processor.createAiModelResponse(input)

      expect(received)
        .toBeInstanceOf(AiModelResponse)
    })
  })
})

describe('StubAiModelProcessor', () => {
  describe('#sendStreamRequestToAi()', () => {
    describe('should hand the answered text to the text hook', () => {
      const cases = [
        {
          input: {
            instruction: 'alpha-0001',
          },
          expected: 'stub-answer:4e943469cb31d82944e7c09961f78c009009968f5249bedcb24ba15d7c2ff623',
        },
        {
          input: {
            instruction: 'beta-0002-with-a-longer-instruction',
          },
          expected: 'stub-answer:e0dde380c61eb150d1ccd54d52af305b9f2c320db169453d9023e9a9ac0b83b3',
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
        expected,
      }) => {
        const processor = StubAiModelProcessor.create()

        const args = {
          aiAgent: {
            name: 'asset-media-extraction',
          },
          instruction: input.instruction,
          documents: [
            {
              path: 'document-0001',
            },
          ],
          fileUrls: [
            {
              fileType: 'image/jpeg',
              fileUrl: 'https://example.com/media-0001.jpg',
            },
          ],
          historyMessages: [],
          tools: [
            {
              description: 'omega',
              name: 'record_field_values',
              payload: '{}',
            },
          ],
          toolChoices: [],
          isAutoHandleFunctionCall: true,
          extraToolOptions: {},

          /**
           * @param {string} text - The answered text.
           * @returns {string} The answered text.
           */
          onText: text => text,

          /**
           * @param {*} message - The completed answer.
           * @returns {*} The completed answer.
           */
          onComplete: message => message,
        }
        const onTextSpy = jest.spyOn(args, 'onText')

        await processor.sendStreamRequestToAi(args)

        expect(onTextSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should hand the normalized response to the completion hook', () => {
      const cases = [
        {
          input: {
            instruction: 'alpha-0001',
          },
        },
        {
          input: {
            instruction: 'beta-0002-with-a-longer-instruction',
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        input,
      }) => {
        const processor = StubAiModelProcessor.create()

        const args = {
          aiAgent: {
            name: 'asset-media-extraction',
          },
          instruction: input.instruction,
          documents: [],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
          isAutoHandleFunctionCall: true,
          extraToolOptions: {},

          /**
           * @param {string} text - The answered text.
           * @returns {string} The answered text.
           */
          onText: text => text,

          /**
           * @param {*} message - The completed answer.
           * @returns {*} The completed answer.
           */
          onComplete: message => message,
        }
        const onCompleteSpy = jest.spyOn(args, 'onComplete')

        await processor.sendStreamRequestToAi(args)

        expect(onCompleteSpy)
          .toHaveBeenCalledWith(expect.any(AiModelResponse))
      })
    })
  })
})
