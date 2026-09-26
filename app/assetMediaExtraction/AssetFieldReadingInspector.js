import ASSET_FIELD_REJECTION_CONSTANT_HASH from '../constants/assetFieldRejectionConstants.js'
import ASSET_FIELD_VALUE_KIND_CONSTANT_HASH from '../constants/assetFieldValueKindConstants.js'
import AI_RUN_EVIDENCE_CATEGORY_CONSTANT_HASH from '../constants/aiRunEvidenceCategoryConstants.js'

const {
  ASSET_FIELD_REJECTION_REASON_CODE,
} = ASSET_FIELD_REJECTION_CONSTANT_HASH

const {
  ASSET_FIELD_VALUE_KIND,
} = ASSET_FIELD_VALUE_KIND_CONSTANT_HASH

const {
  AI_RUN_EVIDENCE_CATEGORY,
} = AI_RUN_EVIDENCE_CATEGORY_CONSTANT_HASH

/*
 * The evidence kinds a reading may name, read from the constants the master seeder seeds from.
 *
 * Reading the table instead would be a query per reading on a master of three rows, and
 * `AiRunMediaCategoryInspector` and `AiRunFieldOutcomeRecorder` both settled the same question the
 * same way: a master row that is not in the hash was never seeded.
 */
const DEFAULT_EVIDENCE_KIND_NAMES = Object.values(AI_RUN_EVIDENCE_CATEGORY)
  .map(it => it.NAME)

/*
 * A number as a number is written: an optional minus sign, then digits without a leading zero,
 * then an optional fractional part.
 *
 * It is applied to a value that arrived as text, which is how a number commonly crosses a tool
 * boundary. What it rejects is what "the expected form" of specs/1.0.0 §20 rules out - a value
 * carrying a unit (`120 m2`), a thousands separator (`1,200`), a range (`80-90`), a word
 * (`about 90`), exponent notation, whitespace at either end, a leading zero and the empty string.
 *
 * `007` is refused for the same reason an id is: a figure written that way came from somewhere
 * that was not measuring. `-0` is refused with it, and `0` on its own is a number.
 */
const NUMBER_VALUE_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u

/**
 * Step 4 of an asset-media-extraction run: drops whatever the field schema does not allow.
 *
 * **Every rule drops, and no rule corrects.** specs/1.0.0 §20 is emphatic about the two places a
 * correction would be tempting: a select value not among the options sent is "dropped, never
 * corrected to a nearby one", and a value longer than the stated maximum is "dropped rather than
 * truncated". Nothing here rewrites a value it was given; a value either passes as it stands or
 * leaves nothing behind but a rejection naming why.
 *
 * **A dropped reading is dropped, not the field.** One reading of three may be dropped and the
 * other two still settle the field between them - which is exactly why the drop is recorded per
 * reading index. What decides whether the field is returned at all is step 5, reading the
 * survivors.
 *
 * **What is recorded about a drop carries no value read out of a medium.** A rejection is the
 * field path, the reason code and figures, and a figure is a number (`#run-record`, §10). That row
 * outlives the content it describes by two years, so the value that was dropped is named nowhere -
 * its length is a figure, and the value itself is not.
 *
 * **The checks are an ordered list rather than a chain of branches**, in the shape
 * `BaseInputValidator` already uses: the first entry that is not satisfied is the reason. The
 * order is the one a reader would ask them in - is this field ours, is the answer shaped like an
 * answer, is the value within what the schema said, do the photographs exist - so a reading
 * breaking two rules is reported under the coarser one.
 *
 * **The normalized value is the one the result carries.** A number field answers a number and a
 * text or select field answers a string (`types/restfulapi/assetMediaExtractionResult.d.ts`), and
 * this is where a number that arrived as text becomes one. Normalizing is not correcting: the
 * value that comes out reads the same as the value that went in, or it is dropped.
 *
 * **The numeric range is read from `minimum` and `maximum` on the schema entry, and the contract
 * declares neither.** §20's fifth criterion names "the range sent", and
 * `AssetMediaExtractionFieldSchemaRequest` carries only `unit` for a number - so the rule is
 * implemented against the two names a caller would use, and checks nothing when the caller sends
 * neither. That gap is reported rather than papered over.
 */
export default class AssetFieldReadingInspector {
  /**
   * Constructor.
   *
   * @param {AssetFieldReadingInspectorParams} params - Parameters.
   */
  constructor ({
    evidenceKindNames,
  }) {
    this.evidenceKindNames = evidenceKindNames
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AssetFieldReadingInspector ? X : never} T, X
   * @param {AssetFieldReadingInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    evidenceKindNames = DEFAULT_EVIDENCE_KIND_NAMES,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        evidenceKindNames,
      })
    )
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AssetFieldReadingInspector} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetFieldReadingInspector} */ (this.constructor)
  }

  /**
   * Inspect one reading, and answer what the schema allows of it and what it dropped.
   *
   * @param {InspectReadingParams} params - Parameters.
   * @returns {InspectedReading} What was kept and what was dropped.
   * @public
   */
  inspectReading ({
    fieldReadings,
    fieldSchema,
    sentMediaKeys,
    readingIndex,
  }) {
    const inspectedFieldReadings = this.buildInspectedFieldReadings({
      fieldReadings,
      fieldSchema,
      sentMediaKeys,
      readingIndex,
    })

    const allowedFieldReadings = inspectedFieldReadings
      .map(it => it.allowedFieldReading)
      .filter(it => it !== null)

    const rejections = inspectedFieldReadings
      .map(it => it.rejection)
      .filter(it => it !== null)

    return {
      allowedFieldReadings,
      rejections,
    }
  }

  /**
   * Build what was made of each item of one reading.
   *
   * An item that is not an object at all carries no field path, so it is dropped by the first rule
   * exactly as an item naming a path outside the schema is - there is nothing else to say about it.
   *
   * @param {InspectReadingParams} params - Parameters.
   * @returns {Array<InspectedFieldReading>} One entry per item, in the order they arrived.
   * @public
   */
  buildInspectedFieldReadings ({
    fieldReadings,
    fieldSchema,
    sentMediaKeys,
    readingIndex,
  }) {
    if (!Array.isArray(fieldReadings)) {
      return []
    }

    return fieldReadings.map(it =>
      this.buildInspectedFieldReading({
        fieldReading: it,
        fieldSchema,
        sentMediaKeys,
        readingIndex,
      })
    )
  }

  /**
   * Build what was made of one item of one reading.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchema: Array<restfulapi.v1.AssetMediaExtractionFieldSchemaRequest>
   *   sentMediaKeys: Array<string>
   *   readingIndex: number
   * }} params - Parameters.
   * @returns {InspectedFieldReading} The item as it was kept, or the rejection it was dropped under.
   * @public
   */
  buildInspectedFieldReading ({
    fieldReading,
    fieldSchema,
    sentMediaKeys,
    readingIndex,
  }) {
    const fieldSchemaEntry = this.extractFieldSchemaEntry({
      fieldReading,
      fieldSchema,
    })

    const rejectionReasonCode = this.extractRejectionReasonCode({
      fieldReading,
      fieldSchemaEntry,
      sentMediaKeys,
    })

    if (rejectionReasonCode !== null) {
      return this.buildRejectedFieldReading({
        fieldReading,
        fieldSchemaEntry,
        rejectionReasonCode,
        readingIndex,
      })
    }

    return this.buildKeptFieldReading({
      fieldReading,
      fieldSchemaEntry,
    })
  }

  /**
   * Build the answer for an item the schema did not allow.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   *   rejectionReasonCode: string
   *   readingIndex: number
   * }} params - Parameters.
   * @returns {InspectedFieldReading} The answer.
   * @public
   */
  buildRejectedFieldReading ({
    fieldReading,
    fieldSchemaEntry,
    rejectionReasonCode,
    readingIndex,
  }) {
    const rejection = this.buildRejection({
      fieldReading,
      fieldSchemaEntry,
      rejectionReasonCode,
      readingIndex,
    })

    return {
      allowedFieldReading: null,
      rejection,
    }
  }

  /**
   * Build the answer for an item the schema allowed.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest
   * }} params - Parameters.
   * @returns {InspectedFieldReading} The answer.
   * @public
   */
  buildKeptFieldReading ({
    fieldReading,
    fieldSchemaEntry,
  }) {
    const allowedFieldReading = this.buildAllowedFieldReading({
      fieldReading,
      fieldSchemaEntry,
    })

    return {
      allowedFieldReading,
      rejection: null,
    }
  }

  /**
   * Extract the schema entry a reading item names.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchema: Array<restfulapi.v1.AssetMediaExtractionFieldSchemaRequest>
   * }} params - Parameters.
   * @returns {restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null} The entry, or null when
   * the item names a path the schema does not carry.
   * @public
   */
  extractFieldSchemaEntry ({
    fieldReading,
    fieldSchema,
  }) {
    if (typeof fieldReading?.path !== 'string') {
      return null
    }

    return fieldSchema
      .find(it => it.path === fieldReading.path)
      ?? null
  }

  /**
   * Extract the reason one reading item is dropped under, or null when the schema allows it.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   *   sentMediaKeys: Array<string>
   * }} params - Parameters.
   * @returns {string | null} The reason code, or null when nothing is broken.
   * @public
   */
  extractRejectionReasonCode ({
    fieldReading,
    fieldSchemaEntry,
    sentMediaKeys,
  }) {
    return this.buildInspectionEntries({
      fieldReading,
      fieldSchemaEntry,
      sentMediaKeys,
    })
      .find(it => !it.isAllowed())
      ?.reasonCode
      ?? null
  }

  /**
   * Build the rules one reading item is held to, in the order they are asked.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   *   sentMediaKeys: Array<string>
   * }} params - Parameters.
   * @returns {Array<AssetFieldInspectionEntry>} The rules.
   * @public
   */
  buildInspectionEntries ({
    fieldReading,
    fieldSchemaEntry,
    sentMediaKeys,
  }) {
    return [
      {
        isAllowed: () => fieldSchemaEntry !== null,
        reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.FIELD_PATH_OUTSIDE_SCHEMA,
      },
      {
        isAllowed: () => this.carriesRecognizedEvidenceKind({
          fieldReading,
        }),
        reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.EVIDENCE_KIND_OUTSIDE_SCHEMA,
      },
      {
        isAllowed: () => this.carriesReason({
          fieldReading,
        }),
        reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.REASON_ABSENT,
      },
      {
        isAllowed: () => this.carriesOfferedSelectOption({
          fieldReading,
          fieldSchemaEntry,
        }),
        reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.SELECT_OPTION_NOT_OFFERED,
      },
      {
        isAllowed: () => this.carriesExpectedNumberForm({
          fieldReading,
          fieldSchemaEntry,
        }),
        reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.NUMBER_FAILED_EXPECTED_FORM,
      },
      {
        isAllowed: () => this.fallsWithinStatedRange({
          fieldReading,
          fieldSchemaEntry,
        }),
        reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.NUMBER_OUT_OF_RANGE,
      },
      {
        isAllowed: () => this.fallsWithinStatedMaxLength({
          fieldReading,
          fieldSchemaEntry,
        }),
        reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.VALUE_OVER_MAX_LENGTH,
      },
      {
        isAllowed: () => this.citesSentMediaOnly({
          fieldReading,
          sentMediaKeys,
        }),
        reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.SOURCE_MEDIUM_NOT_SENT,
      },
    ]
  }

  /**
   * Check whether a reading item names one of the evidence kinds the master carries.
   *
   * @param {{
   *   fieldReading: *
   * }} params - Parameters.
   * @returns {boolean} Whether the kind is one of the three.
   * @public
   */
  carriesRecognizedEvidenceKind ({
    fieldReading,
  }) {
    return this.evidenceKindNames.includes(fieldReading?.evidenceKindName)
  }

  /**
   * Check whether a reading item carries the one line its value is explained by.
   *
   * @param {{
   *   fieldReading: *
   * }} params - Parameters.
   * @returns {boolean} Whether a reason is there to carry.
   * @public
   */
  carriesReason ({
    fieldReading,
  }) {
    if (typeof fieldReading?.reason !== 'string') {
      return false
    }

    return fieldReading.reason.trim() !== ''
  }

  /**
   * Check whether a select field's value is one of the options that were sent.
   *
   * A schema entry naming a select and sending no options bounds the field to nothing, so nothing
   * satisfies it - which drops every reading of that field, rather than letting an unbounded value
   * through on the strength of a bound the caller forgot to state.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   * }} params - Parameters.
   * @returns {boolean} Whether the value is offered, or the field is not a select.
   * @public
   */
  carriesOfferedSelectOption ({
    fieldReading,
    fieldSchemaEntry,
  }) {
    if (fieldSchemaEntry?.valueKind !== ASSET_FIELD_VALUE_KIND.SELECT) {
      return true
    }

    if (!Array.isArray(fieldSchemaEntry.options)) {
      return false
    }

    return fieldSchemaEntry.options.includes(fieldReading?.value)
  }

  /**
   * Check whether a number field's value is written the way a number is written.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   * }} params - Parameters.
   * @returns {boolean} Whether the form holds, or the field is not a number.
   * @public
   */
  carriesExpectedNumberForm ({
    fieldReading,
    fieldSchemaEntry,
  }) {
    if (fieldSchemaEntry?.valueKind !== ASSET_FIELD_VALUE_KIND.NUMBER) {
      return true
    }

    const comparableNumber = this.generateComparableNumber({
      value: fieldReading?.value,
    })

    return comparableNumber !== null
  }

  /**
   * Check whether a number field's value is inside the range the caller sent.
   *
   * A bound the caller did not state bounds nothing, so a field schema carrying neither `minimum`
   * nor `maximum` accepts every number whose form held. A bound that is not a number is read as one
   * that was not stated - a caller writing `maximum: 'ten'` stated no maximum.
   *
   * A value whose form did not hold is passed over here rather than answered false, because the
   * entry above it already drops it and reporting the coarser failure twice would put one drop
   * under two reason codes.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   * }} params - Parameters.
   * @returns {boolean} Whether the value is in range, or no range bounds it.
   * @public
   */
  fallsWithinStatedRange ({
    fieldReading,
    fieldSchemaEntry,
  }) {
    if (fieldSchemaEntry?.valueKind !== ASSET_FIELD_VALUE_KIND.NUMBER) {
      return true
    }

    const comparableNumber = this.generateComparableNumber({
      value: fieldReading?.value,
    })

    if (comparableNumber === null) {
      return true
    }

    const fallsAboveMinimum = this.fallsAboveStatedMinimum({
      comparableNumber,
      fieldSchemaEntry,
    })

    const fallsBelowMaximum = this.fallsBelowStatedMaximum({
      comparableNumber,
      fieldSchemaEntry,
    })

    return fallsAboveMinimum
      && fallsBelowMaximum
  }

  /**
   * Check whether a number is at or above the minimum the caller sent.
   *
   * @param {{
   *   comparableNumber: number
   *   fieldSchemaEntry: *
   * }} params - Parameters.
   * @returns {boolean} Whether it is, or no minimum was sent.
   * @public
   */
  fallsAboveStatedMinimum ({
    comparableNumber,
    fieldSchemaEntry,
  }) {
    if (!Number.isFinite(fieldSchemaEntry.minimum)) {
      return true
    }

    return comparableNumber >= fieldSchemaEntry.minimum
  }

  /**
   * Check whether a number is at or below the maximum the caller sent.
   *
   * @param {{
   *   comparableNumber: number
   *   fieldSchemaEntry: *
   * }} params - Parameters.
   * @returns {boolean} Whether it is, or no maximum was sent.
   * @public
   */
  fallsBelowStatedMaximum ({
    comparableNumber,
    fieldSchemaEntry,
  }) {
    if (!Number.isFinite(fieldSchemaEntry.maximum)) {
      return true
    }

    return comparableNumber <= fieldSchemaEntry.maximum
  }

  /**
   * Check whether a value is no longer than the maximum the caller stated.
   *
   * It is measured on the value as text, which is what a maximum length is about, and asked only
   * where the caller stated one. A value over it is dropped here and never shortened to fit - see
   * the class comment.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   * }} params - Parameters.
   * @returns {boolean} Whether it fits, or no maximum was stated.
   * @public
   */
  fallsWithinStatedMaxLength ({
    fieldReading,
    fieldSchemaEntry,
  }) {
    if (!Number.isFinite(fieldSchemaEntry?.maxLength)) {
      return true
    }

    const valueLength = this.generateValueLength({
      fieldReading,
    })

    if (valueLength === null) {
      return true
    }

    return valueLength <= fieldSchemaEntry.maxLength
  }

  /**
   * Generate how long a reading item's value is as text.
   *
   * @param {{
   *   fieldReading: *
   * }} params - Parameters.
   * @returns {number | null} The length, or null when the value is not text.
   * @public
   */
  generateValueLength ({
    fieldReading,
  }) {
    if (typeof fieldReading?.value !== 'string') {
      return null
    }

    return fieldReading.value.length
  }

  /**
   * Check whether every photograph a reading item cites was among those sent.
   *
   * **A single key that was not sent drops the whole item**, rather than the key alone. A value
   * whose stated provenance is partly invented is a value whose provenance is not known, and the
   * seventh acceptance criterion - the source photographs are always a subset of the media that was
   * sent - would be satisfied by quietly deleting the invented key while keeping the value it was
   * offered as evidence for.
   *
   * An item citing nothing is dropped with them: every field returned carries "the photos it came
   * from", and an empty list is not photographs.
   *
   * @param {{
   *   fieldReading: *
   *   sentMediaKeys: Array<string>
   * }} params - Parameters.
   * @returns {boolean} Whether every cited photograph was sent.
   * @public
   */
  citesSentMediaOnly ({
    fieldReading,
    sentMediaKeys,
  }) {
    if (!Array.isArray(fieldReading?.sourceMediaKeys)) {
      return false
    }

    if (fieldReading.sourceMediaKeys.length === 0) {
      return false
    }

    return fieldReading.sourceMediaKeys.every(it => sentMediaKeys.includes(it))
  }

  /**
   * Generate the number a reading item's value names.
   *
   * @param {{
   *   value: *
   * }} params - Parameters.
   * @returns {number | null} The number, or null when the value is not written as one.
   * @public
   */
  generateComparableNumber ({
    value,
  }) {
    if (typeof value === 'number') {
      return Number.isFinite(value)
        ? value
        : null
    }

    if (typeof value !== 'string') {
      return null
    }

    return NUMBER_VALUE_PATTERN.test(value)
      ? Number(value)
      : null
  }

  /**
   * Build the record of one reading item the schema did not allow.
   *
   * The field path is the one the item named where it named one at all, so a rejection is traceable
   * to the reading that caused it. An item carrying no path is recorded under the empty string,
   * which `AiRunStepRecorder` then drops - the step is still recorded, minus an entry naming no
   * field.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   *   rejectionReasonCode: string
   *   readingIndex: number
   * }} params - Parameters.
   * @returns {AssetFieldRejection} The rejection.
   * @public
   */
  buildRejection ({
    fieldReading,
    fieldSchemaEntry,
    rejectionReasonCode,
    readingIndex,
  }) {
    const fieldPath = this.extractRejectedFieldPath({
      fieldReading,
    })

    const figures = this.buildRejectionFigures({
      fieldReading,
      fieldSchemaEntry,
      rejectionReasonCode,
      readingIndex,
    })

    return {
      fieldPath,
      reasonCode: rejectionReasonCode,
      figures,
    }
  }

  /**
   * Extract the path a dropped reading item named.
   *
   * @param {{
   *   fieldReading: *
   * }} params - Parameters.
   * @returns {string} The path, or the empty string when the item named none.
   * @public
   */
  extractRejectedFieldPath ({
    fieldReading,
  }) {
    if (typeof fieldReading?.path !== 'string') {
      return ''
    }

    return fieldReading.path
  }

  /**
   * Build the figures a rejection carries.
   *
   * Every rejection carries the reading it came from, because a drop is per reading and the same
   * field may be dropped in one reading and kept in another. The length pair is carried only by the
   * one reason it explains, so a reader never has to work out which figures belong to which code.
   *
   * No value read out of a medium is among them - see the class comment.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest | null
   *   rejectionReasonCode: string
   *   readingIndex: number
   * }} params - Parameters.
   * @returns {Record<string, number>} The figures.
   * @public
   */
  buildRejectionFigures ({
    fieldReading,
    fieldSchemaEntry,
    rejectionReasonCode,
    readingIndex,
  }) {
    if (rejectionReasonCode !== ASSET_FIELD_REJECTION_REASON_CODE.VALUE_OVER_MAX_LENGTH) {
      return {
        readingIndex,
      }
    }

    const valueLength = this.generateValueLength({
      fieldReading,
    })

    const { maxLength } = fieldSchemaEntry

    return {
      readingIndex,
      valueLength,
      maxLength,
    }
  }

  /**
   * Build one reading item as the later steps read it.
   *
   * The value is the only field that changes shape, and it changes only for a number - see the
   * class comment on why normalizing is not correcting. Everything else is carried across as it
   * arrived, because the reason and the photographs are the model's answer and this service has no
   * better one.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest
   * }} params - Parameters.
   * @returns {AssetFieldReading} The item.
   * @public
   */
  buildAllowedFieldReading ({
    fieldReading,
    fieldSchemaEntry,
  }) {
    const value = this.generateNormalizedValue({
      fieldReading,
      fieldSchemaEntry,
    })

    const {
      path,
      evidenceKindName,
      reason,
      sourceMediaKeys,
    } = fieldReading

    return {
      path,
      value,
      evidenceKindName,
      reason,
      sourceMediaKeys,
    }
  }

  /**
   * Generate a reading item's value in the shape the result carries it in.
   *
   * @param {{
   *   fieldReading: *
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest
   * }} params - Parameters.
   * @returns {string | number} The value.
   * @public
   */
  generateNormalizedValue ({
    fieldReading,
    fieldSchemaEntry,
  }) {
    if (fieldSchemaEntry.valueKind !== ASSET_FIELD_VALUE_KIND.NUMBER) {
      return fieldReading.value
    }

    return this.generateComparableNumber({
      value: fieldReading.value,
    })
  }
}

/**
 * @typedef {{
 *   evidenceKindNames: Array<string>
 * }} AssetFieldReadingInspectorParams
 */

/**
 * @typedef {Partial<AssetFieldReadingInspectorParams>} AssetFieldReadingInspectorFactoryParams
 */

/**
 * @typedef {{
 *   fieldReadings: *
 *   fieldSchema: Array<restfulapi.v1.AssetMediaExtractionFieldSchemaRequest>
 *   sentMediaKeys: Array<string>
 *   readingIndex: number
 * }} InspectReadingParams
 */

/**
 * @typedef {{
 *   path: string
 *   value: string | number
 *   evidenceKindName: string
 *   reason: string
 *   sourceMediaKeys: Array<string>
 * }} AssetFieldReading
 */

/**
 * @typedef {{
 *   fieldPath: string
 *   reasonCode: string
 *   figures: Record<string, number>
 * }} AssetFieldRejection
 */

/**
 * @typedef {{
 *   allowedFieldReading: AssetFieldReading | null
 *   rejection: AssetFieldRejection | null
 * }} InspectedFieldReading
 */

/**
 * @typedef {{
 *   allowedFieldReadings: Array<AssetFieldReading>
 *   rejections: Array<AssetFieldRejection>
 * }} InspectedReading
 */

/**
 * @typedef {{
 *   isAllowed: () => boolean
 *   reasonCode: string
 * }} AssetFieldInspectionEntry
 */
