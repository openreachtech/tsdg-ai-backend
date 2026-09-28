import BaseGeminiAiModelProcessor from '../../../../../app/tools/BaseAiModelProviderProcessor/BaseGeminiAiModelProcessor.js'

import BaseAiModelProcessor from '../../../../../app/tools/BaseAiModelProcessor.js'
import AiModelResponse from '../../../../../app/tools/AiModelResponse.js'
import GeminiMessagePayloadGenerator from '../../../../../app/tools/AiPayloadGenerator/GeminiMessagePayloadGenerator.js'

import GeminiApiClient from '../../../../../app/geminiClient/GeminiApiClient.js'
import SendMessageToGeminiCapsule from '../../../../../app/geminiClient/SendMessageToGeminiCapsule.js'
import UploadFileToGeminiCapsule from '../../../../../app/geminiClient/UploadFileToGeminiCapsule.js'

import {
  env,
} from '../../../../../app/globals/_.js'

/*
 * Everything the Gemini drivers share, and not one case of it calls Google.
 *
 * **Where a mock stands in, it stands in for the vendor and for nothing else.** `#uploadFileToGemini()`
 * and `#sendMessageToGemini()` on the client are the two members that leave the machine, so those are
 * what is stubbed; the payload the request is built with, the capsule the answer is read through, the
 * files handed back and every refusal run for real. The catalog read runs for real too - the
 * `gemini-2-5-flash` row is master data this feature seeds, so `#findAiModelByName()` reads a real
 * row rather than a mocked one.
 *
 * **The abstract model name is supplied per case.** This class names no model - a concrete driver
 * below it does - so the cases carry the name under `override` and the getter is stubbed with it.
 *
 * **What is not asserted here, and why.** No case supplies a key, because no test may reach Google
 * even by accident: `#createGeminiApiClient()` is either stubbed or is itself the thing under test,
 * and the one case that lets it run asserts the refusal a missing key produces.
 */

describe('BaseGeminiAiModelProcessor', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = BaseGeminiAiModelProcessor.prototype

      expect(received)
        .toBeInstanceOf(BaseAiModelProcessor)
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#geminiApiClientCtor', () => {
        const cases = [
          {
            tally: GeminiApiClient,
          },
          {
            tally: class AlphaGeminiApiClient {},
          },
        ]

        test.each(cases)('geminiApiClientCtor.name: $tally.name', ({
          tally,
        }) => {
          const processor = new BaseGeminiAiModelProcessor({
            geminiApiClientCtor: tally,
          })

          expect(processor)
            .toHaveProperty('geminiApiClientCtor', tally)
        })
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            geminiApiClientCtor: GeminiApiClient,
          },
        },
        {
          input: {
            geminiApiClientCtor: class BetaGeminiApiClient {},
          },
        },
      ]

      test.each(cases)('geminiApiClientCtor.name: $input.geminiApiClientCtor.name', ({
        input,
      }) => {
        const received = BaseGeminiAiModelProcessor.create(input)

        expect(received)
          .toBeInstanceOf(BaseGeminiAiModelProcessor)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            geminiApiClientCtor: GeminiApiClient,
          },
        },
        {
          input: {
            geminiApiClientCtor: class GammaGeminiApiClient {},
          },
        },
      ]

      test.each(cases)('geminiApiClientCtor.name: $input.geminiApiClientCtor.name', ({
        input,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(BaseGeminiAiModelProcessor)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.create()', () => {
    /*
     * The registry calls `.create()` with no argument at all, on every installation, at start-up.
     * What it must fill is a class and never a connection: filling a built client here would read a
     * key on a machine that has none.
     */
    describe('should fill default geminiApiClientCtor', () => {
      test('with no arguments', () => {
        const processor = BaseGeminiAiModelProcessor.create()

        const received = processor.geminiApiClientCtor

        expect(received)
          .toBe(GeminiApiClient) // same reference
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.get:GeminiMessagePayloadGeneratorCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseGeminiAiModelProcessor.GeminiMessagePayloadGeneratorCtor

        expect(received)
          .toBe(GeminiMessagePayloadGenerator) // same reference
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.get:SendMessageToGeminiCapsuleCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseGeminiAiModelProcessor.SendMessageToGeminiCapsuleCtor

        expect(received)
          .toBe(SendMessageToGeminiCapsule) // same reference
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.get:UploadFileToGeminiCapsuleCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseGeminiAiModelProcessor.UploadFileToGeminiCapsuleCtor

        expect(received)
          .toBe(UploadFileToGeminiCapsule) // same reference
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.get:AiModelResponseCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseGeminiAiModelProcessor.AiModelResponseCtor

        expect(received)
          .toBe(AiModelResponse) // same reference
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.get:environment', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseGeminiAiModelProcessor.environment

        expect(received)
          .toBe(env) // same reference
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#get:Ctor', () => {
    describe('should answer the class of the instance', () => {
      const cases = [
        {
          tally: BaseGeminiAiModelProcessor,
        },
        {
          tally: class DeltaGeminiAiModelProcessor extends BaseGeminiAiModelProcessor {},
        },
        {
          tally: class ZetaGeminiAiModelProcessor extends BaseGeminiAiModelProcessor {},
        },
      ]

      test.each(cases)('ProcessorCtor.name: $tally.name', ({
        tally,
      }) => {
        const processor = tally.create()

        const received = processor.Ctor

        expect(received)
          .toBe(tally) // same reference
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#extractApiKey()', () => {
    /*
     * `.env.development` declares `GEMINI_API_KEY` with an empty value, and this repository is
     * public - so there is no key on a development machine and none in CI. The absence is the
     * behaviour under test rather than a gap in it.
     */
    describe('should answer null where the environment declares no key', () => {
      const cases = [
        {
          input: {
            geminiApiClientCtor: GeminiApiClient,
          },
        },
        {
          input: {
            geminiApiClientCtor: class EpsilonGeminiApiClient {},
          },
        },
      ]

      test.each(cases)('geminiApiClientCtor.name: $input.geminiApiClientCtor.name', ({
        input,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create(input)
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue({})

        const received = processor.extractApiKey()

        expect(received)
          .toBeNull()
      })
    })

    describe('should answer the key the environment declares', () => {
      const cases = [
        {
          input: {
            GEMINI_API_KEY: 'not-a-key-0001',
          },
          expected: 'not-a-key-0001',
        },
        {
          input: {
            GEMINI_API_KEY: 'not-a-key-0002',
          },
          expected: 'not-a-key-0002',
        },
      ]

      test.each(cases)('GEMINI_API_KEY: $input.GEMINI_API_KEY', ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue(input)

        const received = processor.extractApiKey()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#createGeminiApiClient()', () => {
    /*
     * Calling an AI vendor with no key would come back as an ordinary provider failure, and an
     * operator reading that would go looking at Google for a fault in this machine's configuration.
     * So it refuses before the call rather than after it.
     */
    describe('when no key is configured', () => {
      const cases = [
        {
          override: {
            aiModel: 'gemini-2-5-flash',
          },
          expected: 'refused to call Gemini with no API key: model gemini-2-5-flash',
        },
        {
          override: {
            aiModel: 'gemini-2-5-pro',
          },
          expected: 'refused to call Gemini with no API key: model gemini-2-5-pro',
        },
      ]

      test.each(cases)('aiModel: $override.aiModel', ({
        override,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(processor, 'aiModel', 'get')
          .mockReturnValue(override.aiModel)
        jest.spyOn(processor, 'extractApiKey')
          .mockReturnValue(null)

        const received = () => processor.createGeminiApiClient()

        expect(received)
          .toThrow(expected)
      })
    })

    describe('when a key is configured', () => {
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
        const createWithApiKeyTally = jest.fn()
        const processor = BaseGeminiAiModelProcessor.create({
          geminiApiClientCtor: {
            createWithApiKey: createWithApiKeyTally,
          },
        })
        jest.spyOn(processor, 'extractApiKey')
          .mockReturnValue(input.apiKey)

        processor.createGeminiApiClient()

        expect(createWithApiKeyTally)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#sendMessageToGemini()', () => {
    describe('should answer a capsule carrying what the vendor answered', () => {
      const cases = [
        {
          input: {
            payload: {
              model: 'gemini-2.5-flash',
              contents: [],
              maxOutputTokens: 65536,
              tools: null,
              toolConfig: null,
            },
          },
          expected: 'answer-0001',
        },
        {
          input: {
            payload: {
              model: 'gemini-2.5-pro',
              contents: [],
              maxOutputTokens: 8192,
              tools: null,
              toolConfig: null,
            },
          },
          expected: 'answer-0002',
        },
      ]

      test.each(cases)('payload.model: $input.payload.model', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(processor, 'createGeminiApiClient')
          .mockReturnValue({
            sendMessageToGemini: jest.fn()
              .mockResolvedValue({
                text: expected,
              }),
          })

        const capsule = await processor.sendMessageToGemini(input)
        const received = capsule.extractContentText()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer a capsule carrying the failure rather than raising', () => {
      const cases = [
        {
          input: {
            payload: {
              model: 'gemini-2.5-flash',
              contents: [],
              maxOutputTokens: 65536,
              tools: null,
              toolConfig: null,
            },
          },
          expected: 'vendor-failure-0001',
        },
        {
          input: {
            payload: {
              model: 'gemini-2.5-pro',
              contents: [],
              maxOutputTokens: 8192,
              tools: null,
              toolConfig: null,
            },
          },
          expected: 'vendor-failure-0002',
        },
      ]

      test.each(cases)('payload.model: $input.payload.model', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(processor, 'createGeminiApiClient')
          .mockReturnValue({
            sendMessageToGemini: jest.fn()
              .mockRejectedValue(new Error(expected)),
          })

        const capsule = await processor.sendMessageToGemini(input)
        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#createAiModelResponse()', () => {
    describe('should wrap the capsule in the canonical response', () => {
      const cases = [
        {
          input: {
            aiResponseCapsule: SendMessageToGeminiCapsule.createWithResponse({
              response: {
                text: 'answer-0001',
              },
            }),
          },
        },
        {
          input: {
            aiResponseCapsule: SendMessageToGeminiCapsule.createWithResponse({
              response: {
                text: 'answer-0002',
              },
            }),
          },
        },
      ]

      test.each(cases)('aiResponseCapsule.response.text: $input.aiResponseCapsule.response.text', ({
        input,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()

        const received = processor.createAiModelResponse(input)

        expect(received)
          .toBeInstanceOf(AiModelResponse)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#uploadAttachedFile()', () => {
    describe('should answer a capsule carrying what the Files API answered', () => {
      const cases = [
        {
          input: {
            attachedFile: {
              id: 11100301,
              fileUrl: '/workspace/run/photograph-0001.jpg',
              fileName: 'photograph-0001.jpg',
              fileType: 'image/jpeg',
            },
          },
          expected: {
            filePath: '/workspace/run/photograph-0001.jpg',
            mimeType: 'image/jpeg',
            displayName: 'photograph-0001.jpg',
          },
        },
        {
          // A file the run recorded under no name: the vendor is given none rather than a made-up
          // one.
          input: {
            attachedFile: {
              id: 11100302,
              fileUrl: '/workspace/run/photograph-0002.png',
              fileType: 'image/png',
            },
          },
          expected: {
            filePath: '/workspace/run/photograph-0002.png',
            mimeType: 'image/png',
            displayName: null,
          },
        },
      ]

      test.each(cases)('attachedFile.fileUrl: $input.attachedFile.fileUrl', async ({
        input,
        expected,
      }) => {
        const uploadTally = jest.fn()
          .mockResolvedValue({
            name: 'files/upload-0001',
          })
        const processor = BaseGeminiAiModelProcessor.create()

        await processor.uploadAttachedFile({
          attachedFile: input.attachedFile,
          geminiApiClient: {
            uploadFileToGemini: uploadTally,
          },
        })

        expect(uploadTally)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should answer a capsule carrying the failure rather than raising', () => {
      const cases = [
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0001.jpg',
              fileType: 'image/jpeg',
            },
          },
          expected: 'upload-failure-0001',
        },
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0002.png',
              fileType: 'image/png',
            },
          },
          expected: 'upload-failure-0002',
        },
      ]

      test.each(cases)('attachedFile.fileUrl: $input.attachedFile.fileUrl', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()

        const capsule = await processor.uploadAttachedFile({
          attachedFile: input.attachedFile,
          geminiApiClient: {
            uploadFileToGemini: jest.fn()
              .mockRejectedValue(new Error(expected)),
          },
        })
        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#prepareAttachedFile()', () => {
    /*
     * The three facts the run keeps about a file it handed over, and all three are the vendor's own
     * words: the handle the egress record carries, the uri the request points at, and the expiry
     * the retention job will act on. Nothing is derived from the file this service had.
     */
    describe('should carry back what the vendor called the file', () => {
      const cases = [
        {
          input: {
            attachedFile: {
              id: 11100311,
              fileUrl: '/workspace/run/photograph-0001.jpg',
              fileType: 'image/jpeg',
            },
            uploadResponse: {
              name: 'files/upload-0001',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
              mimeType: 'image/jpeg',
              expirationTime: '2026-10-01T01:02:03.004Z',
            },
          },
          expected: {
            id: 11100311,
            fileUrl: '/workspace/run/photograph-0001.jpg',
            fileType: 'image/jpeg',
            providerFileName: 'files/upload-0001',
            providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
            providerFileExpiresAt: '2026-10-01T01:02:03.004Z',
          },
        },
        {
          // A file the vendor scheduled no expiry for: the absence is carried as an absence.
          input: {
            attachedFile: {
              id: 11100312,
              fileUrl: '/workspace/run/photograph-0002.png',
              fileType: 'image/png',
            },
            uploadResponse: {
              name: 'files/upload-0002',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
              mimeType: 'image/png',
            },
          },
          expected: {
            id: 11100312,
            fileUrl: '/workspace/run/photograph-0002.png',
            fileType: 'image/png',
            providerFileName: 'files/upload-0002',
            providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
            providerFileExpiresAt: null,
          },
        },
      ]

      test.each(cases)('attachedFile.fileUrl: $input.attachedFile.fileUrl', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()

        const received = await processor.prepareAttachedFile({
          attachedFile: input.attachedFile,
          geminiApiClient: {
            uploadFileToGemini: jest.fn()
              .mockResolvedValue(input.uploadResponse),
          },
        })

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the upload failed', () => {
      const cases = [
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0001.jpg',
              fileType: 'image/jpeg',
            },
            uploadError: new Error('upload-failure-0001'),
          },
          expected: 'failed to hand a file to Gemini: upload-failure-0001',
        },
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0002.png',
              fileType: 'image/png',
            },
            uploadError: new Error('upload-failure-0002'),
          },
          expected: 'failed to hand a file to Gemini: upload-failure-0002',
        },
      ]

      test.each(cases)('attachedFile.fileUrl: $input.attachedFile.fileUrl', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()

        const received = () => processor.prepareAttachedFile({
          attachedFile: input.attachedFile,
          geminiApiClient: {
            uploadFileToGemini: jest.fn()
              .mockRejectedValue(input.uploadError),
          },
        })

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })

    describe('when the vendor named the upload nothing', () => {
      const cases = [
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0001.jpg',
              fileType: 'image/jpeg',
            },
            uploadResponse: {
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
            },
          },
          expected: 'refused an upload the provider named nothing: /workspace/run/photograph-0001.jpg',
        },
        {
          input: {
            attachedFile: {
              fileUrl: '/workspace/run/photograph-0002.png',
              fileType: 'image/png',
            },
            uploadResponse: {},
          },
          expected: 'refused an upload the provider named nothing: /workspace/run/photograph-0002.png',
        },
      ]

      test.each(cases)('attachedFile.fileUrl: $input.attachedFile.fileUrl', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()

        const received = () => processor.prepareAttachedFile({
          attachedFile: input.attachedFile,
          geminiApiClient: {
            uploadFileToGemini: jest.fn()
              .mockResolvedValue(input.uploadResponse),
          },
        })

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#prepareAttachedFiles()', () => {
    describe('when one file is attached', () => {
      const cases = [
        {
          input: {
            fileUrls: [
              {
                id: 11100321,
                fileUrl: '/workspace/run/photograph-0001.jpg',
                fileType: 'image/jpeg',
              },
            ],
            uploadResponse: {
              name: 'files/upload-0001',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
              expirationTime: '2026-10-01T01:02:03.004Z',
            },
          },
          expected: [
            {
              id: 11100321,
              fileUrl: '/workspace/run/photograph-0001.jpg',
              fileType: 'image/jpeg',
              providerFileName: 'files/upload-0001',
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
              providerFileExpiresAt: '2026-10-01T01:02:03.004Z',
            },
          ],
        },
        {
          input: {
            fileUrls: [
              {
                id: 11100322,
                fileUrl: '/workspace/run/photograph-0002.webp',
                fileType: 'image/webp',
              },
            ],
            uploadResponse: {
              name: 'files/upload-0002',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
              expirationTime: '2026-10-02T05:06:07.008Z',
            },
          },
          expected: [
            {
              id: 11100322,
              fileUrl: '/workspace/run/photograph-0002.webp',
              fileType: 'image/webp',
              providerFileName: 'files/upload-0002',
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0002',
              providerFileExpiresAt: '2026-10-02T05:06:07.008Z',
            },
          ],
        },
      ]

      test.each(cases)('fileUrls.0.fileUrl: $input.fileUrls.0.fileUrl', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(processor, 'createGeminiApiClient')
          .mockReturnValue({
            uploadFileToGemini: jest.fn()
              .mockResolvedValue(input.uploadResponse),
          })

        const received = await processor.prepareAttachedFiles({
          fileUrls: input.fileUrls,
        })

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * Two files, because a run carries several photographs and each has to come back carrying its
     * own handle. One file alone would pass against an implementation that gave every file the
     * handle of the last upload.
     */
    describe('when more than one file is attached', () => {
      const cases = [
        {
          input: {
            fileUrls: [
              {
                id: 11100323,
                fileUrl: '/workspace/run/photograph-0003.jpg',
                fileType: 'image/jpeg',
              },
              {
                id: 11100324,
                fileUrl: '/workspace/run/photograph-0004.png',
                fileType: 'image/png',
              },
            ],
            firstUploadResponse: {
              name: 'files/upload-0003',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0003',
              expirationTime: '2026-10-03T09:10:11.012Z',
            },
            secondUploadResponse: {
              name: 'files/upload-0004',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0004',
              expirationTime: '2026-10-04T13:14:15.016Z',
            },
          },
          expected: [
            {
              id: 11100323,
              fileUrl: '/workspace/run/photograph-0003.jpg',
              fileType: 'image/jpeg',
              providerFileName: 'files/upload-0003',
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0003',
              providerFileExpiresAt: '2026-10-03T09:10:11.012Z',
            },
            {
              id: 11100324,
              fileUrl: '/workspace/run/photograph-0004.png',
              fileType: 'image/png',
              providerFileName: 'files/upload-0004',
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0004',
              providerFileExpiresAt: '2026-10-04T13:14:15.016Z',
            },
          ],
        },
        {
          input: {
            fileUrls: [
              {
                id: 11100325,
                fileUrl: '/workspace/run/photograph-0005.jpg',
                fileType: 'image/jpeg',
              },
              {
                id: 11100326,
                fileUrl: '/workspace/run/photograph-0006.webp',
                fileType: 'image/webp',
              },
            ],
            firstUploadResponse: {
              name: 'files/upload-0005',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0005',
              expirationTime: '2026-10-05T17:18:19.020Z',
            },
            // The vendor scheduled no expiry for this one; the absence is carried as an absence.
            secondUploadResponse: {
              name: 'files/upload-0006',
              uri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0006',
            },
          },
          expected: [
            {
              id: 11100325,
              fileUrl: '/workspace/run/photograph-0005.jpg',
              fileType: 'image/jpeg',
              providerFileName: 'files/upload-0005',
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0005',
              providerFileExpiresAt: '2026-10-05T17:18:19.020Z',
            },
            {
              id: 11100326,
              fileUrl: '/workspace/run/photograph-0006.webp',
              fileType: 'image/webp',
              providerFileName: 'files/upload-0006',
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0006',
              providerFileExpiresAt: null,
            },
          ],
        },
      ]

      test.each(cases)('fileUrls.0.fileUrl: $input.fileUrls.0.fileUrl', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(processor, 'createGeminiApiClient')
          .mockReturnValue({
            uploadFileToGemini: jest.fn()
              .mockResolvedValueOnce(input.firstUploadResponse)
              .mockResolvedValueOnce(input.secondUploadResponse),
          })

        const received = await processor.prepareAttachedFiles({
          fileUrls: input.fileUrls,
        })

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * A run that attached nothing must not build a client, because building one reads a key - and a
     * request naming this model on a machine with none would otherwise be refused before anything
     * had been asked of the vendor at all. One case, because there is exactly one empty input.
     */
    describe('when nothing is attached', () => {
      test('fileUrls: []', async () => {
        const createGeminiApiClientSpy = jest.spyOn(BaseGeminiAiModelProcessor.prototype, 'createGeminiApiClient')
        const processor = BaseGeminiAiModelProcessor.create()

        const received = await processor.prepareAttachedFiles({
          fileUrls: [],
        })

        expect(received)
          .toHaveLength(0)
        expect(createGeminiApiClientSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#createGeminiMessagePayloadGenerator()', () => {
    describe('should build the generator on the catalog row', () => {
      const cases = [
        {
          input: {
            aiModel: {
              targetModelName: 'gemini-2.5-flash',
              AiModelCapability: {
                maxOutputToken: 65536,
              },
            },
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
          },
          expected: {
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
            aiModel: {
              targetModelName: 'gemini-2.5-pro',
              AiModelCapability: {
                maxOutputToken: 8192,
              },
            },
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [
              {
                name: 'tool-0002',
              },
            ],
            toolChoices: [
              {
                name: 'tool-0002',
              },
            ],
          },
          expected: {
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
            ],
            toolChoices: [
              {
                name: 'tool-0002',
              },
            ],
          },
        },
      ]

      test.each(cases)('aiModel.targetModelName: $input.aiModel.targetModelName', ({
        input,
        expected,
      }) => {
        const createSpy = jest.spyOn(GeminiMessagePayloadGenerator, 'create')
        const processor = BaseGeminiAiModelProcessor.create()

        processor.createGeminiMessagePayloadGenerator(input)

        expect(createSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#sendRequestToAi()', () => {
    /*
     * The catalog read runs for real against the seeded `gemini-2-5-flash` row; only the member
     * that leaves the machine is stood in for. So what is asserted is that a driver resolved by
     * name reads its own row, builds a request against that row's ceiling and answers in the one
     * shape every driver answers in.
     */
    describe('should answer the canonical response', () => {
      const cases = [
        {
          override: {
            aiModel: 'gemini-2-5-flash',
          },
          input: {
            aiAgent: {
              name: 'agent-0001',
            },
            instruction: 'instruction-0001',
            documents: [],
            fileUrls: [],
            historyMessages: [],
            tools: [],
            toolChoices: [],
            isAutoHandleFunctionCall: false,
            extraToolOptions: {},
          },
          expected: 'answer-0001',
        },
        {
          override: {
            aiModel: 'gemini-2-5-flash',
          },
          input: {
            aiAgent: {
              name: 'agent-0002',
            },
            instruction: 'instruction-0002',
            documents: [],
            fileUrls: [
              {
                id: 11100331,
                fileUrl: '/workspace/run/photograph-0001.jpg',
                fileType: 'image/jpeg',
                providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0001',
              },
            ],
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
            isAutoHandleFunctionCall: false,
            extraToolOptions: {},
          },
          expected: 'answer-0002',
        },
      ]

      test.each(cases)('instruction: $input.instruction', async ({
        override,
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(processor, 'aiModel', 'get')
          .mockReturnValue(override.aiModel)
        jest.spyOn(processor, 'createGeminiApiClient')
          .mockReturnValue({
            sendMessageToGemini: jest.fn()
              .mockResolvedValue({
                text: expected,
              }),
          })

        const aiModelResponse = await processor.sendRequestToAi(input)
        const received = aiModelResponse.extractContentText()

        expect(received)
          .toBe(expected)
      })
    })

    /*
     * A driver may be resolved by a name the catalog has no row for - a model row deleted, or a
     * processor shipped before its master data. It refuses rather than calling the vendor with a
     * model id it does not have.
     */
    describe('when the catalog carries no row for the driver', () => {
      const cases = [
        {
          override: {
            aiModel: 'gemini-0001-unseeded',
          },
          expected: 'refused a model name the catalog does not carry: gemini-0001-unseeded',
        },
        {
          override: {
            aiModel: 'gemini-0002-unseeded',
          },
          expected: 'refused a model name the catalog does not carry: gemini-0002-unseeded',
        },
      ]

      test.each(cases)('aiModel: $override.aiModel', async ({
        override,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(processor, 'aiModel', 'get')
          .mockReturnValue(override.aiModel)

        const received = () => processor.sendRequestToAi({
          aiAgent: {
            name: 'agent-0001',
          },
          instruction: 'instruction-0001',
          documents: [],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
          isAutoHandleFunctionCall: false,
          extraToolOptions: {},
        })

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#sendStreamRequestToAi()', () => {
    /*
     * This service never streams: a run is asynchronous and its result is posted back on a
     * callback. The member is deliberately not overridden, so the abstract one raises and names the
     * class - which is the honest answer to a caller asking for something nobody built.
     */
    describe('when not inherited', () => {
      test('should throw error', async () => {
        const processor = BaseGeminiAiModelProcessor.create()

        const received = () => processor.sendStreamRequestToAi({
          aiAgent: {
            name: 'agent-0001',
          },
          instruction: 'instruction-0001',
          documents: [],
          fileUrls: [],
          historyMessages: [],
          tools: [],
          toolChoices: [],
          isAutoHandleFunctionCall: false,
          extraToolOptions: {},
          onText: () => null,
          onComplete: () => null,
        })

        await expect(received)
          .rejects
          .toThrow('BaseGeminiAiModelProcessor#sendStreamRequestToAi() must be inherited')
      })
    })
  })
})
