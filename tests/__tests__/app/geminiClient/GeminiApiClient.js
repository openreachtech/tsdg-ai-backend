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

describe('GeminiApiClient', () => {
  describe('#sendMessageToGemini()', () => {
    /*
     * The abort signal reaching the vendor's own request config, which is the whole of what this
     * class does with it.
     *
     * **What arrives is the very signal the caller handed over**, asserted by reference: a class
     * that built a new controller of its own would hand the vendor something the run can never
     * raise, and the call would be waited out to the end exactly as before.
     *
     * **What it buys is that this service stops waiting, and nothing more.** The vendor states in
     * its own declaration of this field that aborting is a client-only operation, that it does not
     * cancel the request in the service, and that the usage is charged regardless. No case here
     * asserts otherwise, because no case here could.
     */
    describe('should carry the abort signal into the vendor request config', () => {
      const cases = [
        {
          input: {
            model: 'gemini-2.5-flash',
            contents: [],
            maxOutputTokens: 65536,
            tools: null,
            toolConfig: null,
          },
          tally: AbortSignal.abort('run-canceled-0001'),
        },
        {
          input: {
            model: 'gemini-2.5-pro',
            contents: [],
            maxOutputTokens: 8192,
            tools: null,
            toolConfig: null,
          },
          tally: AbortSignal.abort('run-past-its-time-limit-0002'),
        },
      ]

      test.each(cases)('model: $input.model', async ({
        input,
        tally,
      }) => {
        const generateContentSpy = jest.fn()
          .mockResolvedValue({
            text: 'answer-0001',
          })
        const client = GeminiApiClient.create({
          geminiClient: {
            models: {
              generateContent: generateContentSpy,
            },
          },
        })
        const args = {
          ...input,
          abortSignal: tally,
        }
        const expected = expect.objectContaining({
          config: expect.objectContaining({
            abortSignal: tally, // same reference
          }),
        })

        await client.sendMessageToGemini(args)

        expect(generateContentSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should send no abort key where the caller handed no signal', () => {
      const cases = [
        {
          input: {
            model: 'gemini-2.5-flash',
            contents: [],
            maxOutputTokens: 65536,
            tools: null,
            toolConfig: null,
          },
          expected: {
            model: 'gemini-2.5-flash',
            contents: [],
            config: {
              maxOutputTokens: 65536,
            },
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
          expected: {
            model: 'gemini-2.5-pro',
            contents: [],
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
        const generateContentSpy = jest.fn()
          .mockResolvedValue({
            text: 'answer-0001',
          })
        const client = GeminiApiClient.create({
          geminiClient: {
            models: {
              generateContent: generateContentSpy,
            },
          },
        })

        await client.sendMessageToGemini(input)

        expect(generateContentSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#buildAbortSignalEntry()', () => {
    describe('should carry the signal it was handed', () => {
      const cases = [
        {
          tally: AbortSignal.abort('run-canceled-0011'),
        },
        {
          tally: new AbortController().signal,
        },
      ]

      test.each(cases)('abortSignal.aborted: $tally.aborted', ({
        tally,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            label: 'gemini-client-0001', // Neutral; this member reads its argument only.
          },
        })
        const args = {
          abortSignal: tally,
        }

        const entry = client.buildAbortSignalEntry(args)
        const received = entry.abortSignal

        expect(received)
          .toBe(tally) // same reference
      })
    })

    /*
     * The absence is expressed by the key not being there rather than by a null sitting in it:
     * `abortSignal` is declared optional on the vendor's config, and the two are not the same
     * thing to a vendor that reads it.
     */
    describe('should carry no key at all where no signal was handed', () => {
      const cases = [
        {
          label: 'a caller that handed null',
          input: {
            abortSignal: null,
          },
        },
        {
          label: 'a caller that named the field and left it out',
          input: {},
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            label: 'gemini-client-0001', // Neutral; this member reads its argument only.
          },
        })

        const received = client.buildAbortSignalEntry(input)

        expect(received)
          .toEqual({})
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#deleteFileFromGemini()', () => {
    /*
     * The handle is what the Files API is given, and it is the handle rather than the uri - the two
     * are separate members on the upload capsule for exactly this reason, and a delete named by the
     * uri would ask the vendor about something it does not key files by.
     */
    describe('should hand the Files API the handle the upload answered with', () => {
      const cases = [
        {
          input: {
            providerFileName: 'files/provider-file-0001',
          },
          expected: {
            name: 'files/provider-file-0001',
          },
        },
        {
          input: {
            providerFileName: 'files/provider-file-0002',
          },
          expected: {
            name: 'files/provider-file-0002',
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerFileName', async ({
        input,
        expected,
      }) => {
        const deleteTally = jest.fn()
          .mockResolvedValue({})
        const client = GeminiApiClient.create({
          geminiClient: {
            files: {
              delete: deleteTally,
            },
          },
        })

        await client.deleteFileFromGemini(input)

        expect(deleteTally)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#deleteFileFromGemini()', () => {
    describe('should answer what the Files API answered', () => {
      const cases = [
        {
          input: {
            providerFileName: 'files/provider-file-0001',
          },
          tally: {
            sdkHttpResponse: 'sdk-http-response-0001',
          },
        },
        {
          input: {
            providerFileName: 'files/provider-file-0002',
          },
          tally: {
            sdkHttpResponse: 'sdk-http-response-0002',
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerFileName', async ({
        input,
        tally,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            files: {
              delete: jest.fn()
                .mockResolvedValue(tally),
            },
          },
        })

        const received = await client.deleteFileFromGemini(input)

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('#deleteFileFromGemini()', () => {
    /*
     * A vendor that refuses is left to raise rather than being caught here: reading what a failure
     * meant is the capsule's, and the one member that talks to Google does nothing but talk to
     * Google. A 404 in particular must reach the capsule intact, because that is the answer the
     * purge reads as "the copy is gone".
     */
    describe('when the Files API raised', () => {
      const cases = [
        {
          input: {
            providerFileName: 'files/provider-file-0003',
          },
          expected: 'delete-failure-0003',
        },
        {
          input: {
            providerFileName: 'files/provider-file-0004',
          },
          expected: 'delete-failure-0004',
        },
      ]

      test.each(cases)('providerFileName: $input.providerFileName', async ({
        input,
        expected,
      }) => {
        const client = GeminiApiClient.create({
          geminiClient: {
            files: {
              delete: jest.fn()
                .mockRejectedValue(new Error(expected)),
            },
          },
        })

        const received = () => client.deleteFileFromGemini(input)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.createGoogleGenAiOnVertexAi()', () => {
    /*
     * `vertexai` and `project` are the vendor's own option names. What this pins is that the SDK is
     * built in Vertex mode and given both values - a client built without `vertexai` would quietly
     * go on expecting a key.
     */
    describe('should build the SDK in Vertex mode with both values', () => {
      const cases = [
        {
          params: {
            projectId: 'example-project-0201',
            location: 'asia-northeast1',
          },
          expected: {
            vertexai: true,
            project: 'example-project-0201',
            location: 'asia-northeast1',
          },
        },
        {
          params: {
            projectId: 'example-project-0202',
            location: 'us-central1',
          },
          expected: {
            vertexai: true,
            project: 'example-project-0202',
            location: 'us-central1',
          },
        },
      ]

      test.each(cases)('projectId: $params.projectId', ({
        params,
        expected,
      }) => {
        const googleGenAiTally = jest.fn()
        jest.spyOn(GeminiApiClient, 'GoogleGenAiCtor', 'get')
          .mockReturnValue(/** @type {*} */ (googleGenAiTally))

        GeminiApiClient.createGoogleGenAiOnVertexAi(params)

        expect(googleGenAiTally)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.createWithVertexAi()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          params: {
            projectId: 'example-project-0203',
            location: 'asia-northeast1',
          },
        },
        {
          params: {
            projectId: 'example-project-0204',
            location: 'us-central1',
          },
        },
      ]

      test.each(cases)('projectId: $params.projectId', ({
        params,
      }) => {
        jest.spyOn(GeminiApiClient, 'GoogleGenAiCtor', 'get')
          .mockReturnValue(/** @type {*} */ (jest.fn()))

        const received = GeminiApiClient.createWithVertexAi(params)

        expect(received)
          .toBeInstanceOf(GeminiApiClient)
      })
    })
  })
})

describe('GeminiApiClient', () => {
  describe('.createWithVertexAi()', () => {
    describe('should carry the Vertex SDK instance it built', () => {
      const cases = [
        {
          params: {
            projectId: 'example-project-0205',
            location: 'asia-northeast1',
          },
        },
        {
          params: {
            projectId: 'example-project-0206',
            location: 'us-central1',
          },
        },
      ]

      test.each(cases)('projectId: $params.projectId', ({
        params,
      }) => {
        const tally = {}

        jest.spyOn(GeminiApiClient, 'createGoogleGenAiOnVertexAi')
          .mockReturnValue(/** @type {*} */ (tally))

        const received = GeminiApiClient.createWithVertexAi(params)

        expect(received.geminiClient)
          .toBe(tally) // same reference
      })
    })
  })
})
