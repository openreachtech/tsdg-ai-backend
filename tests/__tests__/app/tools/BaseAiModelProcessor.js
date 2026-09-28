import BaseAiModelProcessor from '../../../../app/tools/BaseAiModelProcessor.js'

import AiModelResponse from '../../../../app/tools/AiModelResponse.js'
import AbortedAiCallCapsule from '../../../../app/tools/AbortedAiCallCapsule.js'

import AiModel from '../../../../sequelize/models/AiModel.js'
import AiModelCapability from '../../../../sequelize/models/AiModelCapability.js'

describe('BaseAiModelProcessor', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          tally: BaseAiModelProcessor,
        },
        {
          // A driver adding nothing but its own model name inherits this factory as it stands
          tally: class AlphaAiModelProcessor extends BaseAiModelProcessor {},
        },
        {
          tally: class BetaAiModelProcessor extends BaseAiModelProcessor {},
        },
      ]

      test.each(cases)('tally: $tally.name', ({
        tally,
      }) => {
        const received = tally.create()

        expect(received)
          .toBeInstanceOf(tally)
      })
    })

    describe('should call constructor', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(BaseAiModelProcessor)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('.get:AiModelCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseAiModelProcessor.AiModelCtor

        expect(received)
          .toBe(AiModel) // same reference
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('.get:AiModelCapabilityCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseAiModelProcessor.AiModelCapabilityCtor

        expect(received)
          .toBe(AiModelCapability) // same reference
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('#get:Ctor', () => {
    describe('should be own constructor', () => {
      const cases = [
        {
          tally: BaseAiModelProcessor,
        },
        {
          tally: class GammaAiModelProcessor extends BaseAiModelProcessor {},
        },
        {
          tally: class DeltaAiModelProcessor extends BaseAiModelProcessor {},
        },
      ]

      test.each(cases)('tally: $tally.name', ({
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

describe('BaseAiModelProcessor', () => {
  describe('#get:aiModel', () => {
    describe('when not inherited', () => {
      const cases = [
        {
          input: {
            ProcessorCtor: BaseAiModelProcessor,
          },
          expected: 'BaseAiModelProcessor#get:aiModel must be inherited',
        },
        {
          input: {
            ProcessorCtor: class EpsilonAiModelProcessor extends BaseAiModelProcessor {},
          },
          expected: 'EpsilonAiModelProcessor#get:aiModel must be inherited',
        },
      ]

      test.each(cases)('ProcessorCtor: $input.ProcessorCtor.name', ({
        input,
        expected,
      }) => {
        const processor = input.ProcessorCtor.create()

        expect(() => processor.aiModel)
          .toThrow(expected)
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('#sendRequestToAi()', () => {
    describe('when not inherited', () => {
      const cases = [
        {
          input: {
            ProcessorCtor: BaseAiModelProcessor,
          },
          expected: 'BaseAiModelProcessor#sendRequestToAi() must be inherited',
        },
        {
          input: {
            ProcessorCtor: class ZetaAiModelProcessor extends BaseAiModelProcessor {},
          },
          expected: 'ZetaAiModelProcessor#sendRequestToAi() must be inherited',
        },
      ]

      test.each(cases)('ProcessorCtor: $input.ProcessorCtor.name', async ({
        input,
        expected,
      }) => {
        const processor = input.ProcessorCtor.create()
        const args = {
          aiAgent: {}, // Neutral value; the member throws before reading it
          instruction: 'instruction-0001', // Neutral value; the member throws before reading it
          documents: [], // Neutral value; the member throws before reading it
          fileUrls: [], // Neutral value; the member throws before reading it
        }

        const received = processor.sendRequestToAi(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('#sendStreamRequestToAi()', () => {
    describe('when not inherited', () => {
      const cases = [
        {
          input: {
            ProcessorCtor: BaseAiModelProcessor,
          },
          expected: 'BaseAiModelProcessor#sendStreamRequestToAi() must be inherited',
        },
        {
          input: {
            ProcessorCtor: class EtaAiModelProcessor extends BaseAiModelProcessor {},
          },
          expected: 'EtaAiModelProcessor#sendStreamRequestToAi() must be inherited',
        },
      ]

      test.each(cases)('ProcessorCtor: $input.ProcessorCtor.name', async ({
        input,
        expected,
      }) => {
        const processor = input.ProcessorCtor.create()
        const args = {
          aiAgent: {}, // Neutral value; the member throws before reading it
          instruction: 'instruction-0002', // Neutral value; the member throws before reading it
          documents: [], // Neutral value; the member throws before reading it
          fileUrls: [], // Neutral value; the member throws before reading it
          onText: () => null, // Neutral value; the member throws before reading it
          onComplete: () => null, // Neutral value; the member throws before reading it
        }

        const received = processor.sendStreamRequestToAi(args)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('#prepareAttachedFiles()', () => {
    describe('should answer with the files it was handed', () => {
      const cases = [
        {
          tally: {
            fileUrls: [
              {
                fileUrl: 'https://example.com/media/file-url-0001',
                fileType: 'image/png',
              },
            ],
          },
        },
        {
          tally: {
            fileUrls: [
              {
                fileUrl: 'https://example.com/media/file-url-0002',
                fileType: 'image/jpeg',
              },
              {
                fileUrl: 'https://example.com/media/file-url-0003',
                fileType: 'image/webp',
              },
            ],
          },
        },
        {
          tally: {
            fileUrls: [], // A request that attached nothing
          },
        },
      ]

      test.each(cases)('fileUrls[0].fileUrl: $tally.fileUrls.0.fileUrl', async ({
        tally,
      }) => {
        const processor = BaseAiModelProcessor.create()

        const received = await processor.prepareAttachedFiles(tally)

        expect(received)
          .toBe(tally.fileUrls) // same reference
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('#findAiModelByName()', () => {
    describe('when a model carries the name', () => {
      // A default installation seeds one model, so one case is every model there is
      const cases = [
        {
          input: {
            aiModelName: 'stub',
          },
          expected: expect.objectContaining({
            id: 10110001,
            name: 'stub',
            targetModelName: 'stub-deterministic',
            displayOrder: 10,
            AiModelCapability: expect.objectContaining({
              AiModelId: 10110001,
              contextWindowToken: 200000,
              maxOutputToken: 8192,
            }),
          }),
        },
      ]

      test.each(cases)('aiModelName: $input.aiModelName', async ({
        input,
        expected,
      }) => {
        const processor = BaseAiModelProcessor.create()

        const received = await processor.findAiModelByName(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when no model carries the name', () => {
      const cases = [
        {
          input: {
            aiModelName: 'ai-model-name-0001',
          },
        },
        {
          input: {
            // The vendor's own model id, which is not what a model is selected by
            aiModelName: 'stub-deterministic',
          },
        },
      ]

      test.each(cases)('aiModelName: $input.aiModelName', async ({
        input,
      }) => {
        const processor = BaseAiModelProcessor.create()

        const received = await processor.findAiModelByName(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('.get:AiModelResponseCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseAiModelProcessor.AiModelResponseCtor

        expect(received)
          .toBe(AiModelResponse) // same reference
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('.get:AbortedAiCallCapsuleCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = BaseAiModelProcessor.AbortedAiCallCapsuleCtor

        expect(received)
          .toBe(AbortedAiCallCapsule) // same reference
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('#isAbortSignalRaised()', () => {
    /*
     * The one question a driver asks of the signal it is handed. A driver refuses on a true answer,
     * so a member that answered true for a signal nobody raised would stop every run on every
     * installation - which is why the unraised signal and the absent signal are both cases here
     * rather than one assumed to stand for the other.
     */
    describe('should be truthy', () => {
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

      test.each(cases)('abortSignal.reason: $input.abortSignal.reason', ({
        input,
      }) => {
        const processor = BaseAiModelProcessor.create()

        const received = processor.isAbortSignalRaised(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          label: 'a signal nobody has raised',
          input: {
            abortSignal: new AbortController().signal,
          },
        },
        {
          label: 'a caller that handed no signal at all',
          input: {
            abortSignal: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const processor = BaseAiModelProcessor.create()

        const received = processor.isAbortSignalRaised(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('#createAbortedAiModelResponse()', () => {
    describe('should answer in the shape every answer is read in', () => {
      const cases = [
        {
          input: {
            ProcessorCtor: BaseAiModelProcessor,
          },
        },
        {
          // A driver adding nothing but its own model name refuses in these same words
          input: {
            ProcessorCtor: class EtaAiModelProcessor extends BaseAiModelProcessor {},
          },
        },
      ]

      test.each(cases)('ProcessorCtor: $input.ProcessorCtor.name', ({
        input,
      }) => {
        const processor = input.ProcessorCtor.create()

        const received = processor.createAbortedAiModelResponse()

        expect(received)
          .toBeInstanceOf(AiModelResponse)
      })
    })

    describe('should answer a refusal that reads as a failed call', () => {
      const cases = [
        {
          input: {
            ProcessorCtor: BaseAiModelProcessor,
          },
        },
        {
          input: {
            ProcessorCtor: class ThetaAiModelProcessor extends BaseAiModelProcessor {},
          },
        },
      ]

      test.each(cases)('ProcessorCtor: $input.ProcessorCtor.name', ({
        input,
      }) => {
        const processor = input.ProcessorCtor.create()
        const aiModelResponse = processor.createAbortedAiModelResponse()

        const received = aiModelResponse.hasError()

        expect(received)
          .toBeTruthy()
      })
    })

    /*
     * Zero because the request never left this machine. A call that did leave and was abandoned in
     * flight records zero as well, for a different reason - the vendor answers no usage figure to a
     * connection that was dropped - and the vendor charges for it regardless.
     */
    describe('should answer that no input token was spent', () => {
      const cases = [
        {
          input: {
            ProcessorCtor: BaseAiModelProcessor,
          },
          expected: 0,
        },
        {
          input: {
            ProcessorCtor: class IotaAiModelProcessor extends BaseAiModelProcessor {},
          },
          expected: 0,
        },
      ]

      test.each(cases)('ProcessorCtor: $input.ProcessorCtor.name', ({
        input,
        expected,
      }) => {
        const processor = input.ProcessorCtor.create()
        const aiModelResponse = processor.createAbortedAiModelResponse()

        const received = aiModelResponse.extractInputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer that no output token was spent', () => {
      const cases = [
        {
          input: {
            ProcessorCtor: BaseAiModelProcessor,
          },
          expected: 0,
        },
        {
          input: {
            ProcessorCtor: class KappaAiModelProcessor extends BaseAiModelProcessor {},
          },
          expected: 0,
        },
      ]

      test.each(cases)('ProcessorCtor: $input.ProcessorCtor.name', ({
        input,
        expected,
      }) => {
        const processor = input.ProcessorCtor.create()
        const aiModelResponse = processor.createAbortedAiModelResponse()

        const received = aiModelResponse.extractOutputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('BaseAiModelProcessor', () => {
  describe('#deleteProviderUploadedFile()', () => {
    /*
     * The counterpart of `#prepareAttachedFiles()`, and the default is deliberately the opposite
     * shape: that one hands the files back untouched, because a driver that sends nothing outward
     * needs no override. This one raises, because there is no untouched answer to give - the caller
     * writes `provider_uploaded_files.provider_purged_at` when it returns, and a default that
     * returned would have every driver that forgot to implement this stamping copies of personal
     * data as deleted without a delete having happened. That is the false record #retention's third
     * job was deferred rather than faked to avoid.
     *
     * The message carries the class that failed to implement it and the handle it was asked about,
     * so the classes are driven as cases: a message built from a literal rather than from
     * `this.constructor.name` would name the base in a log line about a concrete driver.
     */
    describe('when not inherited', () => {
      const cases = [
        {
          input: {
            Ctor: BaseAiModelProcessor,
            providerFileName: 'files/provider-file-0001',
          },
          expected: 'BaseAiModelProcessor#deleteProviderUploadedFile() hands no file to a provider, so it holds none to delete: files/provider-file-0001',
        },
        {
          input: {
            Ctor: class AlphaAiModelProcessor extends BaseAiModelProcessor {},
            providerFileName: 'files/provider-file-0002',
          },
          expected: 'AlphaAiModelProcessor#deleteProviderUploadedFile() hands no file to a provider, so it holds none to delete: files/provider-file-0002',
        },
        {
          input: {
            Ctor: class BetaAiModelProcessor extends BaseAiModelProcessor {},
            providerFileName: 'files/provider-file-0003',
          },
          expected: 'BetaAiModelProcessor#deleteProviderUploadedFile() hands no file to a provider, so it holds none to delete: files/provider-file-0003',
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', async ({
        input,
        expected,
      }) => {
        const processor = input.Ctor.create()

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
