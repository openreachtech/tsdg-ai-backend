import Gemini2_5FlashAiModelProcessor from '../../../../../app/tools/AiModelProcessor/Gemini2_5FlashAiModelProcessor.js'

import BaseGeminiAiModelProcessor from '../../../../../app/tools/BaseAiModelProviderProcessor/BaseGeminiAiModelProcessor.js'

import AI_MODEL_CONSTANT_HASH from '../../../../../app/constants/aiModelConstants.js'

const {
  AI_MODEL,
} = AI_MODEL_CONSTANT_HASH

/*
 * The one thing this driver adds: the name it answers for.
 *
 * The name matters more than it looks. `BulkAiModelProcessorsLoader` builds every processor in the
 * registry at start-up and asks each one for its key, and the model it serves is selected by that
 * key alone - so a name that drifted from the seeded `ai_models.name` would take this driver out of
 * reach without anything failing, and a name matching another driver's would stop start-up.
 *
 * The case asserting the name is not the vendor's own model id is the one that would catch the
 * likeliest mistake: `target_model_name` is `gemini-2.5-flash` and the key is `gemini-2-5-flash`,
 * and sending the key or selecting by the id would each look almost right.
 */

describe('Gemini2_5FlashAiModelProcessor', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = Gemini2_5FlashAiModelProcessor.prototype

      expect(received)
        .toBeInstanceOf(BaseGeminiAiModelProcessor)
    })
  })
})

describe('Gemini2_5FlashAiModelProcessor', () => {
  describe('#get:aiModel', () => {
    describe('when called as is', () => {
      test('should be the seeded model name', () => {
        const processor = Gemini2_5FlashAiModelProcessor.create()

        const received = processor.aiModel

        expect(received)
          .toBe('gemini-2-5-flash')
      })
    })
  })
})

describe('Gemini2_5FlashAiModelProcessor', () => {
  describe('#get:aiModel', () => {
    describe('when called as is', () => {
      test('should be the name the master constant declares', () => {
        const expected = AI_MODEL.GEMINI_2_5_FLASH.NAME

        const processor = Gemini2_5FlashAiModelProcessor.create()
        const received = processor.aiModel

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('Gemini2_5FlashAiModelProcessor', () => {
  describe('#get:aiModel', () => {
    /*
     * The application-facing key and the vendor's model id are two values that change for different
     * reasons, and a driver selected by the vendor's id would be unreachable the day Google revised
     * it.
     */
    describe('when called as is', () => {
      test('should not be the vendor model id', () => {
        const processor = Gemini2_5FlashAiModelProcessor.create()

        const received = processor.aiModel

        expect(received)
          .not
          .toBe(AI_MODEL.GEMINI_2_5_FLASH.TARGET_MODEL_NAME)
      })
    })
  })
})

describe('Gemini2_5FlashAiModelProcessor', () => {
  describe('.create()', () => {
    /*
     * The registry calls this with no argument, at start-up, on every installation - a keyless one
     * included. It must therefore build without reading the environment and without opening
     * anything.
     */
    describe('should be an instance of own class', () => {
      test('with no arguments', () => {
        const received = Gemini2_5FlashAiModelProcessor.create()

        expect(received)
          .toBeInstanceOf(Gemini2_5FlashAiModelProcessor)
      })
    })
  })
})
