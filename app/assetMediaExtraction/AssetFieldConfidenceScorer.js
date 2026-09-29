import AI_RUN_EVIDENCE_CATEGORY_CONSTANT_HASH from '../constants/aiRunEvidenceCategoryConstants.js'
import AI_RUN_FIELD_STATUS_CONSTANT_HASH from '../constants/aiRunFieldStatusConstants.js'

const {
  AI_RUN_EVIDENCE_CATEGORY,
} = AI_RUN_EVIDENCE_CATEGORY_CONSTANT_HASH

const {
  AI_RUN_FIELD_STATUS,
} = AI_RUN_FIELD_STATUS_CONSTANT_HASH

/*
 * What each evidence kind is worth, and the state a field resting on it comes out as.
 *
 * **One hash rather than two, because the state and the weight are one fact read at one key.** A
 * kind added to one list and forgotten in the other would score a field by somebody else's weight,
 * or record it under somebody else's state - and neither would be visible in the answer.
 *
 * **The state beside each kind is not this file's invention.** Every row of
 * `sequelize/seeders/development/*-ai_run_field_outcomes.cjs` pairs them exactly this way -
 * `extracted` with `visible-text`, `derived` with `visual-estimate`, `suggested` with
 * `category-prior` - so the mapping was fixed by the fixtures before it was written down here.
 * `missing` has no entry because a missing field rests on no evidence at all and is never scored:
 * it carries no state row here, no confidence and no evidence kind, which is what
 * `AiRunFieldOutcomeRecorder` already expects of one.
 *
 * **The weights are the whole of what "the evidence kind" contributes to the score.** A figure
 * printed in a photograph is worth its full agreement; a figure judged from what a photograph
 * shows is worth three quarters of it; a value resting on what an asset of this category usually
 * has is worth half. The ordering is what carries the meaning - the exact figures are a
 * calibration, which is why the version below exists and why recalibrating makes a new version
 * rather than a change to any run already recorded.
 */
const DEFAULT_EVIDENCE_SCORING_HASH = {
  [AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.NAME]: {
    aiRunEvidenceCategoryId: AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID,
    aiRunFieldStatusId: AI_RUN_FIELD_STATUS.EXTRACTED.ID,
    fieldStateName: AI_RUN_FIELD_STATUS.EXTRACTED.NAME,
    confidenceWeight: 1,
  },
  [AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.NAME]: {
    aiRunEvidenceCategoryId: AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.ID,
    aiRunFieldStatusId: AI_RUN_FIELD_STATUS.DERIVED.ID,
    fieldStateName: AI_RUN_FIELD_STATUS.DERIVED.NAME,
    confidenceWeight: 0.75,
  },
  [AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.NAME]: {
    aiRunEvidenceCategoryId: AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.ID,
    aiRunFieldStatusId: AI_RUN_FIELD_STATUS.SUGGESTED.ID,
    fieldStateName: AI_RUN_FIELD_STATUS.SUGGESTED.NAME,
    confidenceWeight: 0.5,
  },
}

/*
 * The version every field this formula scores is recorded under.
 *
 * **The version is a criterion of its own** - "the confidence formula carries a version, and every
 * run records which version scored it" - and `ai_run_field_outcomes.confidence_method_version` is
 * where it lands, per settled field rather than per run ([[Q92]]). Changing a weight above, the
 * rounding below, or the shape of the formula is a new version and never an edit to this string:
 * a run recorded under `confidence-v1.0.0` must still mean what it meant on the day it ran, two
 * years later, with the content it was read from long purged.
 *
 * `confidence-v1.0.0` is the label the development fixtures already give the first formula, so the
 * seeded runs and the runs this class scores are the same generation of one method rather than two
 * spellings of it.
 */
const DEFAULT_CONFIDENCE_METHOD_VERSION = 'confidence-v1.0.0'

/*
 * How far a score is rounded: four places, which is what `DECIMAL(5, 4)` holds.
 *
 * Rounding here rather than leaving it to the column means the score a client is told and the score
 * the trace records are the same number. Left unrounded, `2 / 3` reaches the response as
 * 0.6666666666666666 and the column as 0.6667, and a client comparing the two would find a service
 * that disagreed with its own record.
 */
const CONFIDENCE_DECIMAL_PLACE_COUNT = 4

const UNKNOWN_EVIDENCE_KIND_MESSAGE = 'refused a field resting on an evidence kind naming no master row'
const UNSCORABLE_READING_COUNT_MESSAGE = 'refused a field settled by no readings at all'

/**
 * Step 6 of an asset-media-extraction run: scores the confidence and sets the field's state.
 *
 * **The score is computed, and never read from anything the model returned.** That is the ninth
 * acceptance criterion in as many words, and it is the reason this class takes a settled field
 * rather than a reading: what it is handed carries an agreement and an evidence kind, and the
 * arithmetic below is the whole of where a confidence comes from. A model answering with a
 * confidence of its own has nowhere to put it - the tool schema offers no such field, step 4 does
 * not carry one, and this class reads none.
 *
 * **Two inputs, and specs/1.0.0 §20 names both**: "the observed agreement and the evidence kind".
 * The agreement is a fraction of the readings taken, and the evidence kind is a weight. The score
 * is their product, rounded to what the column holds - so a value two of three readings read off
 * text in a photograph scores 0.6667, and the same agreement on a value resting on what an asset
 * of this category usually has scores 0.3333.
 *
 * **The range is nothing to one**, which is what `DECIMAL(5, 4)` holds and what checkpoint 4's
 * stub already answers on ([[Q123]]). A weight is at most one and an agreement is at most one, so
 * nothing this class can produce leaves the range - the bound is a property of the formula rather
 * than a clamp applied after it.
 *
 * **What it refuses rather than substitutes.** A field resting on an evidence kind that names no
 * master row, and a field claiming to be settled by nothing, are both raised rather than scored:
 * one would write a foreign key naming nothing, and the other would divide by nothing. Neither can
 * arrive from step 4 and step 5 as they stand, and a guard that answered a number anyway would be
 * the one place in this feature where a value nobody derived reached a client.
 */
export default class AssetFieldConfidenceScorer {
  /**
   * Constructor.
   *
   * @param {AssetFieldConfidenceScorerParams} params - Parameters.
   */
  constructor ({
    evidenceScoringHash,
    confidenceMethodVersion,
    confidenceDecimalPlaceCount,
  }) {
    this.evidenceScoringHash = evidenceScoringHash
    this.confidenceMethodVersion = confidenceMethodVersion
    this.confidenceDecimalPlaceCount = confidenceDecimalPlaceCount
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AssetFieldConfidenceScorer ? X : never} T, X
   * @param {AssetFieldConfidenceScorerFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    evidenceScoringHash = DEFAULT_EVIDENCE_SCORING_HASH,
    confidenceMethodVersion = DEFAULT_CONFIDENCE_METHOD_VERSION,
    confidenceDecimalPlaceCount = CONFIDENCE_DECIMAL_PLACE_COUNT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        evidenceScoringHash,
        confidenceMethodVersion,
        confidenceDecimalPlaceCount,
      })
    )
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AssetFieldConfidenceScorer} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetFieldConfidenceScorer} */ (this.constructor)
  }

  /**
   * Score every field a majority settled.
   *
   * @param {{
   *   settledFields: Array<import('./FieldConsensusResolver.js').SettledField>
   * }} params - Parameters.
   * @returns {Array<ScoredField>} The fields, in the order they were settled.
   * @public
   */
  scoreSettledFields ({
    settledFields,
  }) {
    return settledFields.map(it =>
      this.scoreSettledField({
        settledField: it,
      })
    )
  }

  /**
   * Score one field a majority settled, and set the state it comes out as.
   *
   * Nothing of the settled field is carried across but what it was settled with: the path, the
   * value, the reason, the photographs and the two counts. A key the caller of this class attached
   * beside them - a confidence among them - is not read and does not travel.
   *
   * @param {{
   *   settledField: import('./FieldConsensusResolver.js').SettledField
   * }} params - Parameters.
   * @returns {ScoredField} The scored field.
   * @throws {Error} When the evidence kind names no master row, or no reading settled the field.
   * @public
   */
  scoreSettledField ({
    settledField,
  }) {
    const evidenceScoring = this.extractEvidenceScoring({
      evidenceKindName: settledField.evidenceKindName,
    })

    if (evidenceScoring === null) {
      throw new Error(`${this.Ctor.name}#scoreSettledField() ${UNKNOWN_EVIDENCE_KIND_MESSAGE}: field ${settledField.path}, evidence kind ${settledField.evidenceKindName}`)
    }

    const suggestionConfidence = this.generateSuggestionConfidence({
      agreedReadingCount: settledField.agreedReadingCount,
      totalReadingCount: settledField.totalReadingCount,
      confidenceWeight: evidenceScoring.confidenceWeight,
    })

    if (suggestionConfidence === null) {
      throw new Error(`${this.Ctor.name}#scoreSettledField() ${UNSCORABLE_READING_COUNT_MESSAGE}: field ${settledField.path}, ${settledField.agreedReadingCount} of ${settledField.totalReadingCount}`)
    }

    const agreement = this.buildAgreement({
      settledField,
    })

    const {
      path,
      value,
      reason,
      sourceMediaKeys,
    } = settledField

    const {
      fieldStateName,
      aiRunFieldStatusId,
      aiRunEvidenceCategoryId,
    } = evidenceScoring

    return {
      path,
      value,
      fieldStateName,
      suggestionConfidence,
      reason,
      sourceMediaKeys,
      agreement,
      aiRunFieldStatusId,
      aiRunEvidenceCategoryId,
      confidenceMethodVersion: this.confidenceMethodVersion,
    }
  }

  /**
   * Extract what an evidence kind is worth and what state it puts a field in.
   *
   * The membership check is `Object.hasOwn()` rather than a lookup falling back to null, because a
   * plain hash answers `constructor` and `toString` with something that is not a scoring - an
   * answer worse than no answer.
   *
   * @param {{
   *   evidenceKindName: *
   * }} params - Parameters.
   * @returns {EvidenceScoring | null} The scoring, or null when the kind names no master row.
   * @public
   */
  extractEvidenceScoring ({
    evidenceKindName,
  }) {
    if (typeof evidenceKindName !== 'string') {
      return null
    }

    if (!Object.hasOwn(this.evidenceScoringHash, evidenceKindName)) {
      return null
    }

    return this.evidenceScoringHash[evidenceKindName]
  }

  /**
   * Generate the confidence a field carries, out of its agreement and what its evidence is worth.
   *
   * @param {{
   *   agreedReadingCount: number
   *   totalReadingCount: number
   *   confidenceWeight: number
   * }} params - Parameters.
   * @returns {number | null} The score between nothing and one, or null when no reading settled it.
   * @public
   */
  generateSuggestionConfidence ({
    agreedReadingCount,
    totalReadingCount,
    confidenceWeight,
  }) {
    const agreementRatio = this.generateAgreementRatio({
      agreedReadingCount,
      totalReadingCount,
    })

    if (agreementRatio === null) {
      return null
    }

    const suggestionConfidence = agreementRatio * confidenceWeight

    return this.generateRoundedConfidence({
      suggestionConfidence,
    })
  }

  /**
   * Generate the share of the readings that agreed.
   *
   * @param {{
   *   agreedReadingCount: number
   *   totalReadingCount: number
   * }} params - Parameters.
   * @returns {number | null} The share, or null when there were no readings to take a share of.
   * @public
   */
  generateAgreementRatio ({
    agreedReadingCount,
    totalReadingCount,
  }) {
    if (!Number.isFinite(totalReadingCount)) {
      return null
    }

    if (totalReadingCount <= 0) {
      return null
    }

    if (!Number.isFinite(agreedReadingCount)) {
      return null
    }

    return agreedReadingCount / totalReadingCount
  }

  /**
   * Generate a score rounded to what the column it is recorded in holds.
   *
   * @param {{
   *   suggestionConfidence: number
   * }} params - Parameters.
   * @returns {number} The rounded score.
   * @public
   */
  generateRoundedConfidence ({
    suggestionConfidence,
  }) {
    return Number(
      suggestionConfidence.toFixed(this.confidenceDecimalPlaceCount)
    )
  }

  /**
   * Build how many readings agreed, out of how many were taken, as the result carries it.
   *
   * @param {{
   *   settledField: import('./FieldConsensusResolver.js').SettledField
   * }} params - Parameters.
   * @returns {restfulapi.v1.AssetMediaExtractionAgreementResult} The agreement.
   * @public
   */
  buildAgreement ({
    settledField,
  }) {
    const {
      agreedReadingCount,
      totalReadingCount,
    } = settledField

    return {
      agreedReadingCount,
      totalReadingCount,
    }
  }
}

/**
 * @typedef {{
 *   evidenceScoringHash: Record<string, EvidenceScoring>
 *   confidenceMethodVersion: string
 *   confidenceDecimalPlaceCount: number
 * }} AssetFieldConfidenceScorerParams
 */

/**
 * @typedef {Partial<AssetFieldConfidenceScorerParams>} AssetFieldConfidenceScorerFactoryParams
 */

/**
 * @typedef {{
 *   aiRunEvidenceCategoryId: number
 *   aiRunFieldStatusId: number
 *   fieldStateName: string
 *   confidenceWeight: number
 * }} EvidenceScoring
 */

/**
 * @typedef {{
 *   path: string
 *   value: string | number
 *   fieldStateName: string
 *   suggestionConfidence: number
 *   reason: string
 *   sourceMediaKeys: Array<string>
 *   agreement: restfulapi.v1.AssetMediaExtractionAgreementResult
 *   aiRunFieldStatusId: number
 *   aiRunEvidenceCategoryId: number
 *   confidenceMethodVersion: string
 * }} ScoredField
 */
