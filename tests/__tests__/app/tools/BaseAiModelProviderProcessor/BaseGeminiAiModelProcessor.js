import BaseGeminiAiModelProcessor from '../../../../../app/tools/BaseAiModelProviderProcessor/BaseGeminiAiModelProcessor.js'

import BaseAiModelProcessor from '../../../../../app/tools/BaseAiModelProcessor.js'
import AiModelResponse from '../../../../../app/tools/AiModelResponse.js'
import GeminiMessagePayloadGenerator from '../../../../../app/tools/AiPayloadGenerator/GeminiMessagePayloadGenerator.js'

import DeleteFileFromGeminiCapsule from '../../../../../app/geminiClient/DeleteFileFromGeminiCapsule.js'
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
     * What it must fill is **nothing**, and that is the assertion.
     *
     * Filling a built client here would read a key on a machine that has none. Filling the client
     * *class* would be milder but still wrong: naming it would import it, and importing it loads
     * the vendor SDK into a process that may never call the vendor — which is what §17's first use
     * case forbids. So the default is null, the class is loaded by
     * `#resolveGeminiApiClientCtor()` the first time a client is actually wanted, and a test that
     * injects one costs no import at all.
     */
    describe('should leave geminiApiClientCtor unfilled', () => {
      test('with no arguments', () => {
        const processor = BaseGeminiAiModelProcessor.create()

        const received = processor.geminiApiClientCtor

        expect(received)
          .toBeNull()
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
          expected: 'refused to call Gemini with neither a Vertex AI project nor an API key: model gemini-2-5-flash',
        },
        {
          override: {
            aiModel: 'gemini-2-5-pro',
          },
          expected: 'refused to call Gemini with neither a Vertex AI project nor an API key: model gemini-2-5-pro',
        },
      ]

      test.each(cases)('aiModel: $override.aiModel', async ({
        override,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create({
          geminiApiClientCtor: {
            createWithApiKey: () => null,
          },
        })
        jest.spyOn(processor, 'aiModel', 'get')
          .mockReturnValue(override.aiModel)
        jest.spyOn(processor, 'extractApiKey')
          .mockReturnValue(null)

        const received = () => processor.createGeminiApiClient()

        await expect(received)
          .rejects
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

      test.each(cases)('apiKey: $input.apiKey', async ({
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

        await processor.createGeminiApiClient()

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
            providerFileExpiresAt: new Date('2026-10-01T01:02:03.004Z'),
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
              providerFileExpiresAt: new Date('2026-10-01T01:02:03.004Z'),
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
              providerFileExpiresAt: new Date('2026-10-02T05:06:07.008Z'),
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
              providerFileExpiresAt: new Date('2026-10-03T09:10:11.012Z'),
            },
            {
              id: 11100324,
              fileUrl: '/workspace/run/photograph-0004.png',
              fileType: 'image/png',
              providerFileName: 'files/upload-0004',
              providerFileUri: 'https://generativelanguage.googleapis.com/v1beta/files/upload-0004',
              providerFileExpiresAt: new Date('2026-10-04T13:14:15.016Z'),
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
              providerFileExpiresAt: new Date('2026-10-05T17:18:19.020Z'),
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

describe('BaseGeminiAiModelProcessor', () => {
  describe('#sendRequestToAi()', () => {
    /*
     * specs/1.0.0 §15, the item deferred until a driver existed that opens a connection at all.
     *
     * **A run already told to stop is refused before anything is read, built or opened.** The two
     * spies below are the two things that would otherwise have happened for nobody: a catalog row
     * read, and a client built - which is where the key is read and the vendor SDK is loaded. Both
     * are asserted as never called, so a guard that sat one statement lower would fail here.
     *
     * **What the caller gets back is the base's refusal, not a raise.** A raise travelling out of
     * `AssetMediaReadingFetcher` would reach the worker as a thrown failure and be recorded as
     * `PROVIDER_CALL_FAILED`, which is the wrong terminal reason for a run that was canceled.
     *
     * No case here reaches Google, and the refusal case could not: it is the case in which nothing
     * is built to reach it with.
     */
    describe('should refuse a run already told to stop, before reading the catalog', () => {
      const cases = [
        {
          input: {
            abortSignal: AbortSignal.abort('run-canceled-0001'),
          },
        },
        {
          input: {
            abortSignal: AbortSignal.abort('run-past-its-time-limit-0002'),
          },
        },
      ]

      test.each(cases)('abortSignal.reason: $input.abortSignal.reason', async ({
        input,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        const findAiModelByNameSpy = jest.spyOn(processor, 'findAiModelByName')
        const createGeminiApiClientSpy = jest.spyOn(processor, 'createGeminiApiClient')
        const args = {
          aiAgent: {}, // Neutral value; the member refuses before reading it
          instruction: 'instruction-0001', // Neutral value; the member refuses before reading it
          documents: [], // Neutral value; the member refuses before reading it
          fileUrls: [], // Neutral value; the member refuses before reading it
          abortSignal: input.abortSignal,
        }

        await processor.sendRequestToAi(args)

        expect(findAiModelByNameSpy)
          .not
          .toHaveBeenCalled()
        expect(createGeminiApiClientSpy)
          .not
          .toHaveBeenCalled()
      })
    })

    describe('should answer a refusal that reads as a failed call', () => {
      const cases = [
        {
          input: {
            abortSignal: AbortSignal.abort('run-canceled-0011'),
          },
        },
        {
          input: {
            abortSignal: AbortSignal.abort('run-past-its-time-limit-0012'),
          },
        },
      ]

      test.each(cases)('abortSignal.reason: $input.abortSignal.reason', async ({
        input,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        const args = {
          aiAgent: {}, // Neutral value; the member refuses before reading it
          instruction: 'instruction-0002', // Neutral value; the member refuses before reading it
          documents: [], // Neutral value; the member refuses before reading it
          fileUrls: [], // Neutral value; the member refuses before reading it
          abortSignal: input.abortSignal,
        }

        const aiModelResponse = await processor.sendRequestToAi(args)
        const received = aiModelResponse.hasError()

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * Zero because this request never left the machine. A call that did leave and was abandoned in
     * flight records zero as well: the vendor answers no usage figure to a connection that was
     * dropped, and it charges for the work regardless - which is what its own declaration of
     * `abortSignal` says in as many words.
     */
    describe('should answer a refusal that spent no input token', () => {
      const cases = [
        {
          input: {
            abortSignal: AbortSignal.abort('run-canceled-0021'),
          },
          expected: 0,
        },
        {
          input: {
            abortSignal: AbortSignal.abort('run-past-its-time-limit-0022'),
          },
          expected: 0,
        },
      ]

      test.each(cases)('abortSignal.reason: $input.abortSignal.reason', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        const args = {
          aiAgent: {}, // Neutral value; the member refuses before reading it
          instruction: 'instruction-0003', // Neutral value; the member refuses before reading it
          documents: [], // Neutral value; the member refuses before reading it
          fileUrls: [], // Neutral value; the member refuses before reading it
          abortSignal: input.abortSignal,
        }

        const aiModelResponse = await processor.sendRequestToAi(args)
        const received = aiModelResponse.extractInputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer a refusal that spent no output token', () => {
      const cases = [
        {
          input: {
            abortSignal: AbortSignal.abort('run-canceled-0031'),
          },
          expected: 0,
        },
        {
          input: {
            abortSignal: AbortSignal.abort('run-past-its-time-limit-0032'),
          },
          expected: 0,
        },
      ]

      test.each(cases)('abortSignal.reason: $input.abortSignal.reason', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        const args = {
          aiAgent: {}, // Neutral value; the member refuses before reading it
          instruction: 'instruction-0004', // Neutral value; the member refuses before reading it
          documents: [], // Neutral value; the member refuses before reading it
          fileUrls: [], // Neutral value; the member refuses before reading it
          abortSignal: input.abortSignal,
        }

        const aiModelResponse = await processor.sendRequestToAi(args)
        const received = aiModelResponse.extractOutputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#sendMessageToGemini()', () => {
    /*
     * The run's signal reaching the client, beside the payload rather than inside it.
     *
     * Asserted by reference: a driver that built a controller of its own would hand the client
     * something the run can never raise, and an in-flight call would be waited out to the end
     * exactly as before the feature existed.
     */
    describe('should hand the client the signal beside the payload', () => {
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
          tally: new AbortController().signal,
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
          tally: new AbortController().signal,
        },
      ]

      test.each(cases)('payload.model: $input.payload.model', async ({
        input,
        tally,
      }) => {
        const sendMessageToGeminiSpy = jest.fn()
          .mockResolvedValue({
            text: 'answer-0001',
          })
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(processor, 'createGeminiApiClient')
          .mockReturnValue({
            sendMessageToGemini: sendMessageToGeminiSpy,
          })
        const args = {
          payload: input.payload,
          abortSignal: tally,
        }
        const expected = expect.objectContaining({
          abortSignal: tally, // same reference
        })

        await processor.sendMessageToGemini(args)

        expect(sendMessageToGeminiSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    /*
     * An abort that lands while the call is in flight arrives here as the SDK's own rejection, and
     * is answered as a failed call rather than raised - the same channel a timeout or a refused key
     * arrives on. That is what lets the reading be recorded and the run settle on its own terms.
     */
    describe('should answer a capsule carrying an abort raised while the call was in flight', () => {
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
          expected: 'This operation was aborted',
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
          expected: 'signal is aborted without reason',
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
        const args = {
          payload: input.payload,
          abortSignal: new AbortController().signal,
        }

        const capsule = await processor.sendMessageToGemini(args)
        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('.get:DeleteFileFromGeminiCapsuleCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseGeminiAiModelProcessor.DeleteFileFromGeminiCapsuleCtor

        expect(received)
          .toBe(DeleteFileFromGeminiCapsule) // same reference
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#deleteFileFromGemini()', () => {
    /*
     * The handle travels to the client untouched. It is `provider_uploaded_files.provider_file_name`
     * and nothing is derived from it here - a delete asking about anything but what the upload
     * answered with would name a file the vendor does not key by.
     */
    describe('should hand the client the handle it was given', () => {
      const cases = [
        {
          input: {
            providerFileName: 'files/provider-file-0001',
          },
          expected: {
            providerFileName: 'files/provider-file-0001',
          },
        },
        {
          input: {
            providerFileName: 'files/provider-file-0002',
          },
          expected: {
            providerFileName: 'files/provider-file-0002',
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerFileName', async ({
        input,
        expected,
      }) => {
        const deleteTally = jest.fn()
          .mockResolvedValue({})
        const processor = BaseGeminiAiModelProcessor.create()

        await processor.deleteFileFromGemini({
          providerFileName: input.providerFileName,
          geminiApiClient: {
            deleteFileFromGemini: deleteTally,
          },
        })

        expect(deleteTally)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#deleteFileFromGemini()', () => {
    /*
     * A failure comes back as a capsule rather than raising, exactly as the upload's does: this
     * member talks to the vendor and the member above it decides what the answer meant, so every
     * answer a vendor can give is exercised without a network being involved in any of them.
     */
    describe('should answer a capsule carrying the failure rather than raising', () => {
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
        const processor = BaseGeminiAiModelProcessor.create()

        const capsule = await processor.deleteFileFromGemini({
          providerFileName: input.providerFileName,
          geminiApiClient: {
            deleteFileFromGemini: jest.fn()
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
  describe('#deleteProviderUploadedFile()', () => {
    /*
     * The copy is gone and the member answers, which is the signal `ProviderUploadedFilePurger`
     * reads as permission to stamp `provider_uploaded_files.provider_purged_at`.
     *
     * Both ways a copy can be gone are cases, because they are the same answer and an
     * implementation that raised on the second would leave every file whose stated expiry had
     * passed unstamped for ever - and those are most of them, since Google drops its own copy after
     * about forty-eight hours whether or not anybody asks.
     */
    describe('when the copy is gone', () => {
      const cases = [
        {
          input: {
            providerFileName: 'files/provider-file-0001',
            deleteAnswer: {}, // The vendor carried the delete out
          },
        },
        {
          input: {
            providerFileName: 'files/provider-file-0002',
            deleteAnswer: {
              sdkHttpResponse: 'sdk-http-response-0002',
            },
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerFileName', async ({
        input,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()

        jest.spyOn(processor, 'createGeminiApiClient')
          .mockResolvedValue({
            deleteFileFromGemini: jest.fn()
              .mockResolvedValue(input.deleteAnswer),
          })

        const received = await processor.deleteProviderUploadedFile({
          providerFileName: input.providerFileName,
        })

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#deleteProviderUploadedFile()', () => {
    /*
     * The vendor says it knows no such handle. The copy is gone, so this answers rather than
     * raising - the whole reason the judgement lives in a Gemini class is that nothing above a
     * driver could know that 404 means this.
     */
    describe('when the vendor holds no such file', () => {
      const cases = [
        {
          input: {
            providerFileName: 'files/provider-file-0003',
            deleteFailure: {
              message: 'delete-failure-0003',
              status: 404,
            },
          },
        },
        {
          input: {
            providerFileName: 'files/provider-file-0004',
            deleteFailure: {
              message: 'delete-failure-0004',
              status: 404,
            },
          },
        },
      ]

      test.each(cases)('providerFileName: $input.providerFileName', async ({
        input,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()

        jest.spyOn(processor, 'createGeminiApiClient')
          .mockResolvedValue({
            deleteFileFromGemini: jest.fn()
              .mockRejectedValue(input.deleteFailure),
          })

        const received = await processor.deleteProviderUploadedFile({
          providerFileName: input.providerFileName,
        })

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#deleteProviderUploadedFile()', () => {
    /*
     * Every other failure raises, and raising is what leaves the row unstamped. 403 is the case to
     * read twice: a vendor answers it both for a file that is not yours and for a key that is not
     * valid, so a driver treating it as "gone" would write the whole table's worth of stamps on the
     * night a key expired. The last case never reached the vendor at all and carries no status.
     */
    describe('when the copy could not be established gone', () => {
      const cases = [
        {
          input: {
            providerFileName: 'files/provider-file-0005',
            deleteFailure: {
              message: 'delete-failure-0005',
              status: 403,
            },
          },
          expected: 'BaseGeminiAiModelProcessor#deleteProviderUploadedFile() could not establish that Gemini no longer holds a file: files/provider-file-0005, delete-failure-0005',
        },
        {
          input: {
            providerFileName: 'files/provider-file-0006',
            deleteFailure: {
              message: 'delete-failure-0006',
              status: 429,
            },
          },
          expected: 'BaseGeminiAiModelProcessor#deleteProviderUploadedFile() could not establish that Gemini no longer holds a file: files/provider-file-0006, delete-failure-0006',
        },
        {
          input: {
            providerFileName: 'files/provider-file-0007',
            deleteFailure: {
              message: 'delete-failure-0007',
              status: 503,
            },
          },
          expected: 'BaseGeminiAiModelProcessor#deleteProviderUploadedFile() could not establish that Gemini no longer holds a file: files/provider-file-0007, delete-failure-0007',
        },
        {
          input: {
            providerFileName: 'files/provider-file-0008',
            deleteFailure: {
              message: 'delete-failure-0008', // A failure that never reached the vendor
            },
          },
          expected: 'BaseGeminiAiModelProcessor#deleteProviderUploadedFile() could not establish that Gemini no longer holds a file: files/provider-file-0008, delete-failure-0008',
        },
      ]

      test.each(cases)('providerFileName: $input.providerFileName', async ({
        input,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()

        jest.spyOn(processor, 'createGeminiApiClient')
          .mockResolvedValue({
            deleteFileFromGemini: jest.fn()
              .mockRejectedValue(input.deleteFailure),
          })

        const args = {
          providerFileName: input.providerFileName,
        }

        const received = () => processor.deleteProviderUploadedFile(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#extractVertexAiProjectId()', () => {
    describe('should answer null where the environment declares none', () => {
      const cases = [
        {
          mockEnvironment: {
            VERTEX_AI_LOCATION: 'asia-northeast1',
          },
        },
        {
          mockEnvironment: {
            GEMINI_API_KEY: 'not-a-key-0101',
          },
        },
      ]

      test.each(cases)('mockEnvironment: $mockEnvironment', ({
        mockEnvironment,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue(mockEnvironment)

        const received = processor.extractVertexAiProjectId()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#extractVertexAiProjectId()', () => {
    describe('should answer the project the environment declares', () => {
      const cases = [
        {
          mockEnvironment: {
            VERTEX_AI_PROJECT_ID: 'example-project-0101',
          },
          expected: 'example-project-0101',
        },
        {
          mockEnvironment: {
            VERTEX_AI_PROJECT_ID: 'example-project-0102',
          },
          expected: 'example-project-0102',
        },
      ]

      test.each(cases)('mockEnvironment: $mockEnvironment', ({
        mockEnvironment,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue(mockEnvironment)

        const received = processor.extractVertexAiProjectId()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#extractVertexAiLocation()', () => {
    describe('should answer null where the environment declares none', () => {
      const cases = [
        {
          mockEnvironment: {
            VERTEX_AI_PROJECT_ID: 'example-project-0103',
          },
        },
        {
          mockEnvironment: {
            GEMINI_API_KEY: 'not-a-key-0104',
          },
        },
      ]

      test.each(cases)('mockEnvironment: $mockEnvironment', ({
        mockEnvironment,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue(mockEnvironment)

        const received = processor.extractVertexAiLocation()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#extractVertexAiLocation()', () => {
    describe('should answer the region the environment declares', () => {
      const cases = [
        {
          mockEnvironment: {
            VERTEX_AI_LOCATION: 'asia-northeast1',
          },
          expected: 'asia-northeast1',
        },
        {
          mockEnvironment: {
            VERTEX_AI_LOCATION: 'us-central1',
          },
          expected: 'us-central1',
        },
      ]

      test.each(cases)('mockEnvironment: $mockEnvironment', ({
        mockEnvironment,
        expected,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create()
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue(mockEnvironment)

        const received = processor.extractVertexAiLocation()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#createVertexAiGeminiApiClient()', () => {
    /*
     * One of the two alone addresses nothing: the SDK builds a host out of the location and asks it
     * about the project. A half-finished configuration answers null, so the caller falls back to a
     * key and the deployment finds out which arrangement it actually got.
     */
    describe('should answer null where Vertex is half configured or not configured', () => {
      const cases = [
        {
          mockEnvironment: {
            VERTEX_AI_PROJECT_ID: 'example-project-0105',
          },
        },
        {
          mockEnvironment: {
            VERTEX_AI_LOCATION: 'asia-northeast1',
          },
        },
        {
          mockEnvironment: {
            GEMINI_API_KEY: 'not-a-key-0106',
          },
        },
      ]

      test.each(cases)('mockEnvironment: $mockEnvironment', async ({
        mockEnvironment,
      }) => {
        const processor = BaseGeminiAiModelProcessor.create({
          geminiApiClientCtor: {
            createWithVertexAi: () => 'must not be reached',
          },
        })
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue(mockEnvironment)

        const received = await processor.createVertexAiGeminiApiClient()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#createVertexAiGeminiApiClient()', () => {
    describe('should hand the client class both values', () => {
      const cases = [
        {
          mockEnvironment: {
            VERTEX_AI_PROJECT_ID: 'example-project-0107',
            VERTEX_AI_LOCATION: 'asia-northeast1',
          },
          expected: {
            projectId: 'example-project-0107',
            location: 'asia-northeast1',
          },
        },
        {
          mockEnvironment: {
            VERTEX_AI_PROJECT_ID: 'example-project-0108',
            VERTEX_AI_LOCATION: 'us-central1',
          },
          expected: {
            projectId: 'example-project-0108',
            location: 'us-central1',
          },
        },
      ]

      test.each(cases)('mockEnvironment: $mockEnvironment', async ({
        mockEnvironment,
        expected,
      }) => {
        const createWithVertexAiTally = jest.fn()
        const processor = BaseGeminiAiModelProcessor.create({
          geminiApiClientCtor: {
            createWithVertexAi: createWithVertexAiTally,
          },
        })
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue(mockEnvironment)

        await processor.createVertexAiGeminiApiClient()

        expect(createWithVertexAiTally)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('BaseGeminiAiModelProcessor', () => {
  describe('#createGeminiApiClient()', () => {
    /*
     * Configured both ways, the arrangement that holds no secret is the one that wins. A key left
     * behind in an environment must not quietly take precedence over an identity the platform
     * already granted.
     */
    describe('should prefer Vertex over a key when both are configured', () => {
      const cases = [
        {
          mockEnvironment: {
            VERTEX_AI_PROJECT_ID: 'example-project-0109',
            VERTEX_AI_LOCATION: 'asia-northeast1',
            GEMINI_API_KEY: 'not-a-key-0109',
          },
        },
        {
          mockEnvironment: {
            VERTEX_AI_PROJECT_ID: 'example-project-0110',
            VERTEX_AI_LOCATION: 'us-central1',
            GEMINI_API_KEY: 'not-a-key-0110',
          },
        },
      ]

      test.each(cases)('mockEnvironment: $mockEnvironment', async ({
        mockEnvironment,
      }) => {
        const createWithApiKeyTally = jest.fn()
        const processor = BaseGeminiAiModelProcessor.create({
          geminiApiClientCtor: {
            createWithVertexAi: () => 'the vertex client',
            createWithApiKey: createWithApiKeyTally,
          },
        })
        jest.spyOn(BaseGeminiAiModelProcessor, 'environment', 'get')
          .mockReturnValue(mockEnvironment)

        await processor.createGeminiApiClient()

        expect(createWithApiKeyTally)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
