import {
  GoogleGenAI,
} from '@google/genai'

import GeminiApiClient from '../../../../app/geminiClient/GeminiApiClient.js'

/*
 * The two calls this service makes to Google, asserted as delegations rather than as round trips.
 *
 * **No case here reaches the network.** The SDK instance the client is built on is a plain object
 * answering `models.generateContent` and `files.upload`, so what is verified is the argument this
 * class hands the vendor - which is the only part of a round trip this class is responsible for.
 * The two describes that do build a real `GoogleGenAI` build it and nothing more: the SDK opens no
 * connection when it is constructed, and the keys below are strings that are not keys.
 */

describe('GeminiApiClient', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#geminiClient', () => {
        const cases = [
          {
            tally: {
              label: 'gemini-client-0001',
            },
          },
          {
            tally: {
              label: 'gemini-client-0002',
            },
          },
        ]

        test.each(cases)('geminiClient.label: $tally.label', ({
          tally,
        }) => {
          const client = new GeminiApiClient({
            geminiClient: tally,
          })

          expect(client)
            .toHaveProperty('geminiClient', tally)
        })
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            geminiClient: {
              label: 'gemini-client-0001',
            },
          },
        },
        {
          input: {
            geminiClient: {
              label: 'gemini-client-0002',
            },
          },
        },
      ]

      test.each(cases)('geminiClient.label: $input.geminiClient.label', ({
        input,
      }) => {
        const received = GeminiApiClient.create(input)

        expect(received)
          .toBeInstanceOf(GeminiApiClient)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            geminiClient: {
              label: 'gemini-client-0001',
            },
          },
        },
        {
          input: {
            geminiClient: {
              label: 'gemini-client-0002',
            },
          },
        },
      ]

      test.each(cases)('geminiClient.label: $input.geminiClient.label', ({
        input,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(GeminiApiClient)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.createWithApiKey()', () => {
    describe('should build the client on the SDK instance it made', () => {
      const cases = [
        {
          input: {
            apiKey: 'not-a-key-0001',
          },
          expected: {
            apiKey: 'not-a-key-0001',
          },
        },
        {
          input: {
            apiKey: 'not-a-key-0002',
          },
          expected: {
            apiKey: 'not-a-key-0002',
          },
        },
      ]

      test.each(cases)('apiKey: $input.apiKey', ({
        input,
        expected,
      }) => {
        const createGoogleGenAiSpy = jest.spyOn(GeminiApiClient, 'createGoogleGenAi')

        GeminiApiClient.createWithApiKey(input)

        expect(createGoogleGenAiSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.createWithApiKey()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            apiKey: 'not-a-key-0001',
          },
        },
        {
          input: {
            apiKey: 'not-a-key-0002',
          },
        },
      ]

      test.each(cases)('apiKey: $input.apiKey', ({
        input,
      }) => {
        const received = GeminiApiClient.createWithApiKey(input)

        expect(received)
          .toBeInstanceOf(GeminiApiClient)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.get:GoogleGenAiCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = GeminiApiClient.GoogleGenAiCtor

        expect(received)
          .toBe(GoogleGenAI) // same reference
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.createGoogleGenAi()', () => {
    describe('should build the vendor SDK instance', () => {
      const cases = [
        {
          input: {
            apiKey: 'not-a-key-0001',
          },
        },
        {
          input: {
            apiKey: 'not-a-key-0002',
          },
        },
      ]

      test.each(cases)('apiKey: $input.apiKey', ({
        input,
      }) => {
        const received = GeminiApiClient.createGoogleGenAi(input)

        expect(received)
          .toBeInstanceOf(GoogleGenAI)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#sendMessageToGemini()', () => {
    describe('should hand the vendor the request it built', () => {
      const cases = [
        {
          input: {
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'instruction-0001',
                  },
                ],
              },
            ],
            maxOutputTokens: 65536,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'record_field_readings',
                  },
                ],
              },
            ],
            toolConfig: {
              functionCallingConfig: {
                mode: 'ANY',
                allowedFunctionNames: [
                  'record_field_readings',
                ],
              },
            },
          },
          expected: {
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'instruction-0001',
                  },
                ],
              },
            ],
            config: {
              maxOutputTokens: 65536,
              tools: [
                {
                  functionDeclarations: [
                    {
                      name: 'record_field_readings',
                    },
                  ],
                },
              ],
              toolConfig: {
                functionCallingConfig: {
                  mode: 'ANY',
                  allowedFunctionNames: [
                    'record_field_readings',
                  ],
                },
              },
            },
          },
        },
        {
          // Nothing offered: neither tool key reaches the vendor at all.
          input: {
            model: 'gemini-2.5-pro',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'instruction-0002',
                  },
                ],
              },
            ],
            maxOutputTokens: 8192,
            tools: null,
            toolConfig: null,
          },
          expected: {
            model: 'gemini-2.5-pro',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'instruction-0002',
                  },
                ],
              },
            ],
            config: {
              maxOutputTokens: 8192,
            },
          },
        },
      ]

      test.each(cases)('model: $input.model', async ({
        input,
        expected,
      }) => {
        const generateContentTally = jest.fn()
          .mockResolvedValue({
            text: 'answer-0001',
          })
        const client = GeminiApiClient.create({
          geminiClient: {
            models: {
              generateContent: generateContentTally,
            },
          },
        })

        await client.sendMessageToGemini(input)

        expect(generateContentTally)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#sendMessageToGemini()', () => {
    describe('should answer what the vendor answered', () => {
      const cases = [
        {
          input: {
            model: 'gemini-2.5-flash',
            contents: [],
            maxOutputTokens: 65536,
            tools: null,
            toolConfig: null,
          },
          tally: {
            text: 'answer-0001',
          },
        },
        {
          input: {
            model: 'gemini-2.5-pro',
            contents: [],
            maxOutputTokens: 8192,
            tools: null,
            toolConfig: null,
          },
          tally: {
            text: 'answer-0002',
          },
        },
      ]

      test.each(cases)('model: $input.model', async ({
        input,
        tally,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            models: {
              generateContent: jest.fn()
                .mockResolvedValue(tally),
            },
          },
        })

        const received = await client.sendMessageToGemini(input)

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#buildGenerateContentConfig()', () => {
    describe('should build the config a request is sent under', () => {
      const cases = [
        {
          input: {
            maxOutputTokens: 65536,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'tool-0001',
                  },
                ],
              },
            ],
            toolConfig: {
              functionCallingConfig: {
                mode: 'AUTO',
              },
            },
          },
          expected: {
            maxOutputTokens: 65536,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'tool-0001',
                  },
                ],
              },
            ],
            toolConfig: {
              functionCallingConfig: {
                mode: 'AUTO',
              },
            },
          },
        },
        {
          input: {
            maxOutputTokens: 8192,
            tools: null,
            toolConfig: null,
          },
          expected: {
            maxOutputTokens: 8192,
          },
        },
      ]

      test.each(cases)('maxOutputTokens: $input.maxOutputTokens', ({
        input,
        expected,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            label: 'gemini-client-0001', // Neutral; this member reads its argument only.
          },
        })

        const received = client.buildGenerateContentConfig(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#buildToolEntries()', () => {
    describe('should carry both keys where a tool is offered', () => {
      const cases = [
        {
          input: {
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'tool-0001',
                  },
                ],
              },
            ],
            toolConfig: {
              functionCallingConfig: {
                mode: 'AUTO',
              },
            },
          },
          expected: {
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'tool-0001',
                  },
                ],
              },
            ],
            toolConfig: {
              functionCallingConfig: {
                mode: 'AUTO',
              },
            },
          },
        },
        {
          // An empty declaration set is still a declaration, and is passed on as one.
          input: {
            tools: [],
            toolConfig: null,
          },
          expected: {
            tools: [],
            toolConfig: null,
          },
        },
      ]

      test.each(cases)('tools.0.functionDeclarations.0.name: $input.tools.0.functionDeclarations.0.name', ({
        input,
        expected,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            label: 'gemini-client-0001', // Neutral; this member reads its argument only.
          },
        })

        const received = client.buildToolEntries(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should carry neither key where no tool is offered', () => {
      const cases = [
        {
          input: {
            tools: null,
            toolConfig: null,
          },
        },
        {
          input: {
            tools: null,
            toolConfig: {
              functionCallingConfig: {
                mode: 'AUTO',
              },
            },
          },
        },
      ]

      test.each(cases)('toolConfig.functionCallingConfig.mode: $input.toolConfig.functionCallingConfig.mode', ({
        input,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            label: 'gemini-client-0001', // Neutral; this member reads its argument only.
          },
        })

        const received = client.buildToolEntries(input)

        expect(received)
          .toEqual({})
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#uploadFileToGemini()', () => {
    describe('should hand the Files API the path and the type', () => {
      const cases = [
        {
          input: {
            filePath: '/workspace/run/photograph-0001.jpg',
            displayName: 'photograph-0001.jpg',
            mimeType: 'image/jpeg',
          },
          expected: {
            file: '/workspace/run/photograph-0001.jpg',
            config: {
              mimeType: 'image/jpeg',
              displayName: 'photograph-0001.jpg',
            },
          },
        },
        {
          input: {
            filePath: '/workspace/run/photograph-0002.png',
            displayName: null,
            mimeType: 'image/png',
          },
          expected: {
            file: '/workspace/run/photograph-0002.png',
            config: {
              mimeType: 'image/png',
              displayName: null,
            },
          },
        },
      ]

      test.each(cases)('filePath: $input.filePath', async ({
        input,
        expected,
      }) => {
        const uploadTally = jest.fn()
          .mockResolvedValue({
            name: 'files/upload-0001',
          })
        const client = GeminiApiClient.create({
          geminiClient: {
            files: {
              upload: uploadTally,
            },
          },
        })

        await client.uploadFileToGemini(input)

        expect(uploadTally)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#uploadFileToGemini()', () => {
    describe('should answer what the Files API answered', () => {
      const cases = [
        {
          input: {
            filePath: '/workspace/run/photograph-0001.jpg',
            displayName: 'photograph-0001.jpg',
            mimeType: 'image/jpeg',
          },
          tally: {
            name: 'files/upload-0001',
            uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
          },
        },
        {
          input: {
            filePath: '/workspace/run/photograph-0002.png',
            displayName: 'photograph-0002.png',
            mimeType: 'image/png',
          },
          tally: {
            name: 'files/upload-0002',
            uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
          },
        },
      ]

      test.each(cases)('filePath: $input.filePath', async ({
        input,
        tally,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            files: {
              upload: jest.fn()
                .mockResolvedValue(tally),
            },
          },
        })

        const received = await client.uploadFileToGemini(input)

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})
