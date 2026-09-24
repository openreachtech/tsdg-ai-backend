import BaseAiModelProcessor from '../../../../app/tools/BaseAiModelProcessor.js'

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
