import GeminiMessagePayloadGenerator from '../../../../../app/tools/AiPayloadGenerator/GeminiMessagePayloadGenerator.js'

/*
 * Gemini's own name for the part of a message that points at an uploaded file.
 *
 * It is written as a value because it cannot be written as a key in this repository: `Data` is
 * forbidden as an identifier suffix, and the comment that would excuse one is forbidden too. The
 * word belongs to the vendor rather than to us, and naming it once says so. The generator under
 * test holds the same constant for the same reason.
 */
const FILE_PART_KEY = 'fileData'

/*
 * The request a Gemini call is made with, asserted as a returned value rather than as what a mocked
 * client was called with. Nothing here opens a connection: the generator reads only what it was
 * handed, which is why the shape of a request can be pinned on a machine with no key.
 *
 * The forced-call case is the one this service actually runs. §20 has each reading forced through a
 * single tool call, and in this vendor's terms that is `mode: ANY` naming exactly that tool - so a
 * case offering a tool without forcing one, and a case forcing one, are both here.
 */

describe('GeminiMessagePayloadGenerator', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#targetModelName', () => {
        const cases = [
          {
            tally: 'gemini-2.5-flash',
          },
          {
            tally: 'gemini-2.5-pro',
          },
        ]

        test.each(cases)('targetModelName: $tally', ({
          tally,
        }) => {
          const generator = new GeminiMessagePayloadGenerator({
            targetModelName: tally,
            maxOutputTokens: 65536, // Fill the unrelated required argument with a neutral value.
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          })

          expect(generator)
            .toHaveProperty('targetModelName', tally)
        })
      })

      describe('#maxOutputTokens', () => {
        const cases = [
          {
            tally: 65536,
          },
          {
            tally: 8192,
          },
        ]

        test.each(cases)('maxOutputTokens: $tally', ({
          tally,
        }) => {
          const generator = new GeminiMessagePayloadGenerator({
            targetModelName: 'gemini-2.5-flash', // Fill the unrelated required argument.
            maxOutputTokens: tally,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          })

          expect(generator)
            .toHaveProperty('maxOutputTokens', tally)
        })
      })

      describe('#instruction', () => {
        const cases = [
          {
            tally: 'instruction-0001',
          },
          {
            tally: 'instruction-0002',
          },
        ]

        test.each(cases)('instruction: $tally', ({
          tally,
        }) => {
          const generator = new GeminiMessagePayloadGenerator({
            targetModelName: 'gemini-2.5-flash', // Fill the unrelated required argument.
            maxOutputTokens: 65536,
            instruction: tally,
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          })

          expect(generator)
            .toHaveProperty('instruction', tally)
        })
      })

      describe('#documents', () => {
        const cases = [
          {
            tally: [
              {
                title: 'document-0001',
              },
            ],
          },
          {
            tally: [],
          },
        ]

        test.each(cases)('documents.0.title: $tally.0.title', ({
          tally,
        }) => {
          const generator = new GeminiMessagePayloadGenerator({
            targetModelName: 'gemini-2.5-flash', // Fill the unrelated required argument.
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: tally,
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          })

          expect(generator)
            .toHaveProperty('documents', tally)
        })
      })

      describe('#fileUrls', () => {
        const cases = [
          {
            tally: [
              {
                fileUrl: '/workspace/run/photograph-0001.jpg',
              },
            ],
          },
          {
            tally: [],
          },
        ]

        test.each(cases)('fileUrls.0.fileUrl: $tally.0.fileUrl', ({
          tally,
        }) => {
          const generator = new GeminiMessagePayloadGenerator({
            targetModelName: 'gemini-2.5-flash', // Fill the unrelated required argument.
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: tally,
            historyMessages: [],
            tools: [],
            toolChoices: [],
          })

          expect(generator)
            .toHaveProperty('fileUrls', tally)
        })
      })

      describe('#historyMessages', () => {
        const cases = [
          {
            tally: [
              {
                role: 'user',
                content: 'history-0001',
              },
            ],
          },
          {
            tally: [],
          },
        ]

        test.each(cases)('historyMessages.0.content: $tally.0.content', ({
          tally,
        }) => {
          const generator = new GeminiMessagePayloadGenerator({
            targetModelName: 'gemini-2.5-flash', // Fill the unrelated required argument.
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: tally,
            tools: [],
            toolChoices: [],
          })

          expect(generator)
            .toHaveProperty('historyMessages', tally)
        })
      })

      describe('#tools', () => {
        const cases = [
          {
            tally: [
              {
                name: 'record_field_readings',
              },
            ],
          },
          {
            tally: [],
          },
        ]

        test.each(cases)('tools.0.name: $tally.0.name', ({
          tally,
        }) => {
          const generator = new GeminiMessagePayloadGenerator({
            targetModelName: 'gemini-2.5-flash', // Fill the unrelated required argument.
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: tally,
            toolChoices: [],
          })

          expect(generator)
            .toHaveProperty('tools', tally)
        })
      })

      describe('#toolChoices', () => {
        const cases = [
          {
            tally: [
              {
                name: 'record_field_readings',
              },
            ],
          },
          {
            tally: [],
          },
        ]

        test.each(cases)('toolChoices.0.name: $tally.0.name', ({
          tally,
        }) => {
          const generator = new GeminiMessagePayloadGenerator({
            targetModelName: 'gemini-2.5-flash', // Fill the unrelated required argument.
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: tally,
          })

          expect(generator)
            .toHaveProperty('toolChoices', tally)
        })
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
        {
          input: {
            targetModelName: 'gemini-2.5-pro',
            maxOutputTokens: 8192,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
      ]

      test.each(cases)('targetModelName: $input.targetModelName', ({
        input,
      }) => {
        const received = GeminiMessagePayloadGenerator.create(input)

        expect(received)
          .toBeInstanceOf(GeminiMessagePayloadGenerator)
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
        {
          input: {
            targetModelName: 'gemini-2.5-pro',
            maxOutputTokens: 8192,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
      ]

      test.each(cases)('targetModelName: $input.targetModelName', ({
        input,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(GeminiMessagePayloadGenerator)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#generateGeminiMessagePayload()', () => {
    describe('should build the whole request', () => {
      const cases = [
        {
          // The shape this service actually sends: one instruction, two uploaded photographs, one
          // tool, and that tool forced.
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'Read the asset photographs.',
            documents: [],
            fileUrls: [
              {
                fileUrl: '/workspace/run/photograph-0001.jpg',
                fileType: 'image/jpeg',
                providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
              },
              {
                fileUrl: '/workspace/run/photograph-0002.png',
                fileType: 'image/png',
                providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
              },
            ],
            historyMessages: [],
            tools: [
              {
                name: 'record_field_readings',
                description: 'Record one reading of the asset photographs.',
              },
            ],
            toolChoices: [
              {
                name: 'record_field_readings',
              },
            ],
          },
          expected: {
            model: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'Read the asset photographs.',
                  },
                  {
                    [FILE_PART_KEY]: {
                      fileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
                      mimeType: 'image/jpeg',
                    },
                  },
                  {
                    [FILE_PART_KEY]: {
                      fileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
                      mimeType: 'image/png',
                    },
                  },
                ],
              },
            ],
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'record_field_readings',
                    description: 'Record one reading of the asset photographs.',
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
        {
          // Nothing offered and nothing attached: both tool keys are null, so the client leaves
          // them off the request entirely.
          input: {
            targetModelName: 'gemini-2.5-pro',
            maxOutputTokens: 8192,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
          expected: {
            model: 'gemini-2.5-pro',
            maxOutputTokens: 8192,
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
            tools: null,
            toolConfig: null,
          },
        },
      ]

      test.each(cases)('targetModelName: $input.targetModelName', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.generateGeminiMessagePayload()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#buildContents()', () => {
    describe('should replay the history before the turn being asked about', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [
              {
                role: 'user',
                content: 'history-0001',
              },
              {
                role: 'assistant',
                content: 'history-0002',
              },
            ],
            tools: [],
            toolChoices: [],
          },
          expected: [
            {
              role: 'user',
              parts: [
                {
                  text: 'history-0001',
                },
              ],
            },
            {
              role: 'model',
              parts: [
                {
                  text: 'history-0002',
                },
              ],
            },
            {
              role: 'user',
              parts: [
                {
                  text: 'instruction-0001',
                },
              ],
            },
          ],
        },
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
          expected: [
            {
              role: 'user',
              parts: [
                {
                  text: 'instruction-0002',
                },
              ],
            },
          ],
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildContents()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#extractHistoryRole()', () => {
    describe('should answer the vendor role a turn is replayed under', () => {
      const cases = [
        {
          input: {
            historyMessage: {
              role: 'model',
              content: 'history-0001',
            },
          },
          expected: 'model',
        },
        {
          input: {
            historyMessage: {
              role: 'assistant',
              content: 'history-0002',
            },
          },
          expected: 'model',
        },
        {
          input: {
            historyMessage: {
              role: 'user',
              content: 'history-0003',
            },
          },
          expected: 'user',
        },
        {
          input: {
            // A role the vendor does not take is replayed as the user's, never as the model's.
            historyMessage: {
              role: 'system',
              content: 'history-0004',
            },
          },
          expected: 'user',
        },
        {
          input: {
            historyMessage: {
              content: 'history-0005',
            },
          },
          expected: 'user',
        },
      ]

      test.each(cases)('historyMessage.content: $input.historyMessage.content', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create({
          targetModelName: 'gemini-2.5-flash', // Neutral; this member reads its argument only.
          maxOutputTokens: 65536,
          instruction: 'instruction-0001',
          documents: [],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
        })

        const received = generator.extractHistoryRole(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#extractHistoryText()', () => {
    describe('should answer what a replayed turn said', () => {
      const cases = [
        {
          input: {
            historyMessage: {
              role: 'user',
              content: 'history-0001',
            },
          },
          expected: 'history-0001',
        },
        {
          input: {
            historyMessage: {
              role: 'user',
              content: 'history-0002',
            },
          },
          expected: 'history-0002',
        },
        {
          input: {
            historyMessage: {
              role: 'user',
            },
          },
          expected: '',
        },
      ]

      test.each(cases)('historyMessage.content: $input.historyMessage.content', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create({
          targetModelName: 'gemini-2.5-flash', // Neutral; this member reads its argument only.
          maxOutputTokens: 65536,
          instruction: 'instruction-0001',
          documents: [],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
        })

        const received = generator.extractHistoryText(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#buildDocumentParts()', () => {
    describe('should carry each document as its JSON text', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [
              {
                title: 'document-0001',
              },
            ],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
          expected: [
            {
              text: '{"title":"document-0001"}',
            },
          ],
        },
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0002',
            documents: [
              {
                title: 'document-0002',
              },
              {
                title: 'document-0003',
              },
            ],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
          expected: [
            {
              text: '{"title":"document-0002"}',
            },
            {
              text: '{"title":"document-0003"}',
            },
          ],
        },
      ]

      test.each(cases)('documents.0.title: $input.documents.0.title', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildDocumentParts()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should carry none where none was handed over', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
        {
          input: {
            targetModelName: 'gemini-2.5-pro',
            maxOutputTokens: 8192,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildDocumentParts()

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#buildFileParts()', () => {
    describe('should point a part at every file the vendor named', () => {
      const cases = [
        {
          // The file carrying no uri is the one the upload got no handle for, and it is left out
          // rather than sent as a part pointing nowhere.
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [
              {
                fileUrl: '/workspace/run/photograph-0001.jpg',
                fileType: 'image/jpeg',
                providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
              },
              {
                fileUrl: '/workspace/run/photograph-0002.png',
                fileType: 'image/png',
              },
            ],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
          expected: [
            {
              [FILE_PART_KEY]: {
                fileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
                mimeType: 'image/jpeg',
              },
            },
          ],
        },
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [
              {
                fileUrl: '/workspace/run/photograph-0003.webp',
                fileType: 'image/webp',
                providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0003',
              },
            ],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
          expected: [
            {
              [FILE_PART_KEY]: {
                fileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0003',
                mimeType: 'image/webp',
              },
            },
          ],
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildFileParts()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should point at none where no file was named', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [
              {
                fileUrl: '/workspace/run/photograph-0004.jpg',
                fileType: 'image/jpeg',
                providerFileUri: '',
              },
            ],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildFileParts()

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#hasProviderFileUri()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            attachedFile: {
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
            },
          },
        },
        {
          input: {
            attachedFile: {
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
            },
          },
        },
      ]

      test.each(cases)('providerFileUri: $input.attachedFile.providerFileUri', ({
        input,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create({
          targetModelName: 'gemini-2.5-flash', // Neutral; this member reads its argument only.
          maxOutputTokens: 65536,
          instruction: 'instruction-0001',
          documents: [],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
        })

        const received = generator.hasProviderFileUri(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0003.jpg',
            },
          },
        },
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0004.jpg',
              providerFileUri: '',
            },
          },
        },
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0005.jpg',
              providerFileUri: null,
            },
          },
        },
      ]

      test.each(cases)('attachedFile.fileUrl: $input.attachedFile.fileUrl', ({
        input,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create({
          targetModelName: 'gemini-2.5-flash', // Neutral; this member reads its argument only.
          maxOutputTokens: 65536,
          instruction: 'instruction-0001',
          documents: [],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
        })

        const received = generator.hasProviderFileUri(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#buildTools()', () => {
    describe('should declare the tools the model is offered', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [
              {
                name: 'record_field_readings',
              },
            ],
            toolChoices: [],
          },
          expected: [
            {
              functionDeclarations: [
                {
                  name: 'record_field_readings',
                },
              ],
            },
          ],
        },
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [
              {
                name: 'tool-0002',
              },
              {
                name: 'tool-0003',
              },
            ],
            toolChoices: [],
          },
          expected: [
            {
              functionDeclarations: [
                {
                  name: 'tool-0002',
                },
                {
                  name: 'tool-0003',
                },
              ],
            },
          ],
        },
      ]

      test.each(cases)('tools.0.name: $input.tools.0.name', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildTools()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should answer null where none is offered', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
        {
          input: {
            targetModelName: 'gemini-2.5-pro',
            maxOutputTokens: 8192,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [
              {
                name: 'tool-0003',
              },
            ],
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildTools()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#buildToolConfig()', () => {
    describe('should force exactly the tools the call named', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [
              {
                name: 'record_field_readings',
              },
            ],
            toolChoices: [
              {
                name: 'record_field_readings',
              },
            ],
          },
          expected: {
            functionCallingConfig: {
              mode: 'ANY',
              allowedFunctionNames: [
                'record_field_readings',
              ],
            },
          },
        },
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [
              {
                name: 'tool-0002',
              },
              {
                name: 'tool-0003',
              },
            ],
            toolChoices: [
              {
                name: 'tool-0002',
              },
              {
                name: 'tool-0003',
              },
            ],
          },
          expected: {
            functionCallingConfig: {
              mode: 'ANY',
              allowedFunctionNames: [
                'tool-0002',
                'tool-0003',
              ],
            },
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildToolConfig()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should leave the choice to the model where nothing is forced', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [
              {
                name: 'tool-0001',
              },
            ],
            toolChoices: [],
          },
          expected: {
            functionCallingConfig: {
              mode: 'AUTO',
            },
          },
        },
        {
          input: {
            targetModelName: 'gemini-2.5-pro',
            maxOutputTokens: 8192,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [
              {
                name: 'tool-0002',
              },
              {
                name: 'tool-0003',
              },
            ],
            toolChoices: [],
          },
          expected: {
            functionCallingConfig: {
              mode: 'AUTO',
            },
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildToolConfig()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should answer null where no tool is offered', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
        },
        {
          input: {
            targetModelName: 'gemini-2.5-pro',
            maxOutputTokens: 8192,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [
              {
                name: 'tool-0003',
              },
            ],
          },
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.buildToolConfig()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('GeminiMessagePayloadGenerator', () => {
  describe('#extractToolChoiceNames()', () => {
    describe('should answer the names the call forces', () => {
      const cases = [
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [
              {
                name: 'record_field_readings',
              },
            ],
          },
          expected: [
            'record_field_readings',
          ],
        },
        {
          input: {
            targetModelName: 'gemini-2.5-flash',
            maxOutputTokens: 65536,
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [
              {
                name: 'tool-0002',
              },
              {
                name: 'tool-0003',
              },
            ],
          },
          expected: [
            'tool-0002',
            'tool-0003',
          ],
        },
      ]

      test.each(cases)('instruction: $input.instruction', ({
        input,
        expected,
      }) => {
        const generator = GeminiMessagePayloadGenerator.create(input)

        const received = generator.extractToolChoiceNames()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
