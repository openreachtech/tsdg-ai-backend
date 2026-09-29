import BaseGeminiAiModelProcessor from '../BaseAiModelProviderProcessor/BaseGeminiAiModelProcessor.js'

import AI_MODEL_CONSTANT_HASH from '../../constants/aiModelConstants.js'

const {
  AI_MODEL,
} = AI_MODEL_CONSTANT_HASH

/**
 * The driver serving Gemini 2.5 Flash.
 *
 * **Its whole distinctness is the name it answers for.** Which vendor model is actually called is
 * `ai_models.target_model_name`, and the ceiling its payload is built against is
 * `ai_model_capabilities.max_output_token` - both read at call time from the row this name selects.
 * So a vendor revising its model id is a master-data change, and adding the next Gemini model is a
 * file beside this one plus rows: never an edit here, and never an edit to anything that calls a
 * driver.
 *
 * **It is in the registry directory, and its base is not.** `BulkAiModelProcessorsLoader` imports
 * every file under `app/tools/AiModelProcessor/`, builds whatever derives from the abstract
 * processor and asks each one for the name it claims. This class claims one; the base holds
 * everything else and lives a directory up so that start-up never asks it.
 *
 * **Being here does not make it reachable.** The loader answers a processor for a model name and
 * for nothing else - `#resolveProcessor()` returns null for a name nothing claims and never falls
 * back to the default. The seeded default is the stub, and this model's row carries `is_default`
 * false, so no request reaches Google unless it asked for this model by name. A machine with no key
 * runs the whole path on the stub exactly as before, which is §17's first use case and §22's second
 * version criterion.
 *
 * @extends {BaseGeminiAiModelProcessor}
 */
export default class Gemini2_5FlashAiModelProcessor extends BaseGeminiAiModelProcessor {
  /**
   * get: the model name this processor answers for.
   *
   * The app-facing `ai_models.name`, never the vendor's own model id.
   *
   * @override
   * @returns {string} The model name.
   * @public
   */
  get aiModel () {
    return AI_MODEL.GEMINI_2_5_FLASH.NAME
  }
}
