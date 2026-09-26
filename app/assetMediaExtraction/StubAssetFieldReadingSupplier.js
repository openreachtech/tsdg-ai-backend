import StubAnswerDigester from '../stubAiModel/StubAnswerDigester.js'

import AI_RUN_EVIDENCE_CATEGORY_CONSTANT_HASH from '../constants/aiRunEvidenceCategoryConstants.js'
import ASSET_FIELD_VALUE_KIND_CONSTANT_HASH from '../constants/assetFieldValueKindConstants.js'

const {
  AI_RUN_EVIDENCE_CATEGORY,
} = AI_RUN_EVIDENCE_CATEGORY_CONSTANT_HASH

const {
  ASSET_FIELD_VALUE_KIND,
} = ASSET_FIELD_VALUE_KIND_CONSTANT_HASH

/*
 * The evidence kinds a supplied reading may rest on, in the order the master seeds them.
 *
 * Read from the constant rather than written out, so a kind added to the master is a kind this
 * answers on and no second list can fall behind the first. Which of them a field rests on is drawn
 * from the field's own digest, so one demonstration carries all three - and with them all three
 * field states and three different confidences, which is what a screen showing a confidence per
 * field has to be built against.
 */
const DEFAULT_EVIDENCE_KIND_NAMES = Object.values(AI_RUN_EVIDENCE_CATEGORY)
  .map(it => it.NAME)

/*
 * What every supplied reason and every supplied text value carries, so nobody mistakes one for a
 * reading.
 *
 * A demonstration answer reaches the same screen a model's answer reaches, and the one thing that
 * must never happen is somebody reading a suggestion off it and believing a photograph was read.
 * The reason carries the marker whatever the field's kind is - a number field answers a number and
 * a select field answers one of the caller's own options, so neither value can carry a mark of its
 * own, and the reason is the one place every supplied reading can say what it is.
 */
const STUB_REASON_PREFIX = '[stub]'
const STUB_VALUE_PREFIX = 'stub-value-'

/*
 * The smallest number a field with no stated range is answered with, and how wide the span above it
 * is.
 *
 * A span of ninety-nine over a minimum of one keeps every drawn figure small enough to read on a
 * screen and wide enough that two fields of one request rarely answer the same one.
 */
const DEFAULT_MINIMUM_NUMBER = 1
const DEFAULT_NUMBER_SPAN = 99

/**
 * Supplies the readings a run answered by the keyless driver demonstrates a suggestion screen with.
 *
 * **This service owes this fixture, and the driver does not.** `StubAiModelProcessor` answers a
 * forced tool call with nothing in it, and says why in its own words: a driver that invented
 * plausible findings would let a judgment be recorded that no reading earned, and a driver that
 * knew what an asset field is would hold this service's knowledge. So the knowledge lives here -
 * what a field schema means, what a value kind bounds, what an evidence kind is - and the driver
 * keeps none of it. specs/1.0.0 §20's fourth use case is what makes it owed: "the client system
 * builds and demonstrates its whole suggestion screen before any API key exists".
 *
 * **Deterministic, and deterministic from the media.** Every value is drawn from a digest of the
 * request's own media signature, the photographs that were read, and the field being answered -
 * through `StubAnswerDigester`, the one digester the keyless driver already answers from. No clock,
 * no counter and no random draw, so one request answers the same twice; two different sets of
 * photographs answer differently, because their keys are inside the digest whatever signature the
 * caller chose to send.
 *
 * **The same for every reading of one run, on purpose.** Nothing here takes a reading index. Three
 * readings of one request therefore agree, which is what lets step 5 settle a field by absolute
 * majority - a supplier that varied per reading would demonstrate a screen on which nothing is ever
 * settled.
 *
 * **What it supplies is a reading, never a result.** Every value it answers goes through step 4,
 * step 5 and step 6 exactly as a vendor's would: a value the schema does not allow is dropped by
 * the inspector, and a confidence is scored from the observed agreement and the evidence kind. That
 * is why this answers what a reading carries rather than what a run settles - the pipeline it feeds
 * is the thing being demonstrated.
 *
 * **It answers a field it can bound, and leaves the rest.** A select whose options the caller did
 * not send bounds the field to nothing, and a kind this service does not read off a photograph
 * bounds it to nothing either; both are left out rather than answered with something step 4 would
 * drop. A run none of whose photographs could be read is answered with no readings at all, because
 * there is nothing a reading could have cited.
 */
export default class StubAssetFieldReadingSupplier {
  /**
   * Constructor.
   *
   * @param {StubAssetFieldReadingSupplierParams} params - Parameters.
   */
  constructor ({
    answerDigester,
    evidenceKindNames,
  }) {
    this.answerDigester = answerDigester
    this.evidenceKindNames = evidenceKindNames
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof StubAssetFieldReadingSupplier ? X : never} T, X
   * @param {StubAssetFieldReadingSupplierFactoryParams} [params] - Parameters for the factory
   * method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    answerDigester = this.createStubAnswerDigester(),
    evidenceKindNames = DEFAULT_EVIDENCE_KIND_NAMES,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        answerDigester,
        evidenceKindNames,
      })
    )
  }

  /**
   * get: the digester every supplied value is drawn through.
   *
   * @returns {typeof StubAnswerDigester} The class.
   */
  static get StubAnswerDigesterCtor () {
    return StubAnswerDigester
  }

  /**
   * Create the digester every supplied value is drawn through.
   *
   * @returns {StubAnswerDigester} The digester.
   */
  static createStubAnswerDigester () {
    return this.StubAnswerDigesterCtor.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof StubAssetFieldReadingSupplier} The class.
   */
  get Ctor () {
    return /** @type {typeof StubAssetFieldReadingSupplier} */ (this.constructor)
  }

  /**
   * Build what one reading of these photographs found.
   *
   * @param {BuildFieldReadingsParams} params - Parameters.
   * @returns {Array<SuppliedFieldReading>} The readings, one per field this can bound.
   * @public
   */
  buildFieldReadings ({
    fieldSchema,
    mediaSignature,
    readableMediaKeys,
  }) {
    if (!Array.isArray(fieldSchema)) {
      return []
    }

    if (
      !this.hasReadableMedia({
        readableMediaKeys,
      })
    ) {
      return []
    }

    return fieldSchema
      .map(it =>
        this.buildFieldReading({
          fieldSchemaEntry: it,
          mediaSignature,
          readableMediaKeys,
        })
      )
      .filter(it => it !== null)
  }

  /**
   * Check whether any photograph of this run came back readable.
   *
   * @param {{
   *   readableMediaKeys: *
   * }} params - Parameters.
   * @returns {boolean} Whether there is a photograph a reading could cite.
   * @public
   */
  hasReadableMedia ({
    readableMediaKeys,
  }) {
    if (!Array.isArray(readableMediaKeys)) {
      return false
    }

    return readableMediaKeys.length > 0
  }

  /**
   * Build what one reading found about one field, or nothing where the schema bounds it to nothing.
   *
   * @param {BuildFieldReadingParams} params - Parameters.
   * @returns {SuppliedFieldReading | null} The reading, or null when the field cannot be bounded.
   * @public
   */
  buildFieldReading ({
    fieldSchemaEntry,
    mediaSignature,
    readableMediaKeys,
  }) {
    const drawnNumber = this.generateDrawnNumber({
      fieldSchemaEntry,
      mediaSignature,
      readableMediaKeys,
    })

    const value = this.generateFieldValue({
      fieldSchemaEntry,
      drawnNumber,
    })

    if (value === null) {
      return null
    }

    const { path } = fieldSchemaEntry

    const evidenceKindName = this.extractEvidenceKindName({
      drawnNumber,
    })

    const reason = this.generateReason({
      fieldSchemaEntry,
    })

    const sourceMediaKeys = this.extractSourceMediaKeys({
      readableMediaKeys,
      drawnNumber,
    })

    return {
      path,
      value,
      evidenceKindName,
      reason,
      sourceMediaKeys,
    }
  }

  /**
   * Generate the number every answer about one field is drawn from.
   *
   * **The photographs are inside it beside the signature.** `mediaSignature` is the caller's own
   * string, and specs/1.0.0 §20 calls it "a value derived from a request's media" - but a caller
   * that sent one signature for two different sets of photographs would otherwise be demonstrated
   * the same answer twice. Digesting the keys that were read makes "different photographs, a
   * different answer" a property of this class rather than a promise about the caller's discipline.
   *
   * The field's own path and kind are in it too, so two fields of one request answer differently.
   *
   * @param {BuildFieldReadingParams} params - Parameters.
   * @returns {number} The drawn number.
   * @public
   */
  generateDrawnNumber ({
    fieldSchemaEntry,
    mediaSignature,
    readableMediaKeys,
  }) {
    const text = this.answerDigester.buildCanonicalText({
      value: {
        mediaSignature,
        readableMediaKeys,
        path: fieldSchemaEntry?.path,
        valueKind: fieldSchemaEntry?.valueKind,
      },
    })

    return this.answerDigester.generateDigestedNumber({
      text,
    })
  }

  /**
   * Generate the value a field of this kind is answered with.
   *
   * @param {GenerateFieldValueParams} params - Parameters.
   * @returns {string | number | null} The value, or null when the schema bounds the field to
   * nothing.
   * @public
   */
  generateFieldValue ({
    fieldSchemaEntry,
    drawnNumber,
  }) {
    return this.buildValueKindEntries({
      fieldSchemaEntry,
      drawnNumber,
    })
      .find(it => it.valueKind === fieldSchemaEntry?.valueKind)
      ?.generateValue()
      ?? null
  }

  /**
   * Build the value each kind this service reads is answered through.
   *
   * An ordered list rather than a chain of branches, in the shape `AssetFieldReadingInspector`
   * already reads its rules in: a kind that is on no entry is a kind nothing here answers.
   *
   * @param {GenerateFieldValueParams} params - Parameters.
   * @returns {Array<SuppliedValueKindEntry>} The entries.
   * @public
   */
  buildValueKindEntries ({
    fieldSchemaEntry,
    drawnNumber,
  }) {
    return [
      {
        valueKind: ASSET_FIELD_VALUE_KIND.TEXT,
        generateValue: () => this.generateTextValue({
          fieldSchemaEntry,
          drawnNumber,
        }),
      },
      {
        valueKind: ASSET_FIELD_VALUE_KIND.NUMBER,
        generateValue: () => this.generateNumberValue({
          fieldSchemaEntry,
          drawnNumber,
        }),
      },
      {
        valueKind: ASSET_FIELD_VALUE_KIND.SELECT,
        generateValue: () => this.generateSelectValue({
          fieldSchemaEntry,
          drawnNumber,
        }),
      },
    ]
  }

  /**
   * Generate the text a text field is answered with.
   *
   * It is cut to the maximum the caller stated rather than answered over it, because a value over a
   * stated maximum is dropped by step 4 and a demonstration that dropped its own answers would
   * demonstrate an empty screen. Cutting a value this class has just generated is not the
   * correcting step 4 refuses to do - nothing read it anywhere.
   *
   * @param {GenerateFieldValueParams} params - Parameters.
   * @returns {string} The value.
   * @public
   */
  generateTextValue ({
    fieldSchemaEntry,
    drawnNumber,
  }) {
    const text = `${STUB_VALUE_PREFIX}${drawnNumber}`

    if (!Number.isFinite(fieldSchemaEntry?.maxLength)) {
      return text
    }

    return text.slice(0, fieldSchemaEntry.maxLength)
  }

  /**
   * Generate the number a number field is answered with.
   *
   * A whole number inside whatever range the caller stated, so what step 4 reads is a value the
   * schema allows. It is a number rather than the text a tool boundary would carry it as: what the
   * result declares for a number field is a number, and a demonstration answering text would
   * exercise step 4's normalizing rather than the screen the client is building.
   *
   * @param {GenerateFieldValueParams} params - Parameters.
   * @returns {number} The value.
   * @public
   */
  generateNumberValue ({
    fieldSchemaEntry,
    drawnNumber,
  }) {
    const minimumNumber = this.extractMinimumNumber({
      fieldSchemaEntry,
    })

    const maximumNumber = this.extractMaximumNumber({
      fieldSchemaEntry,
      minimumNumber,
    })

    return minimumNumber + (drawnNumber % (maximumNumber - minimumNumber + 1))
  }

  /**
   * Extract the smallest number a field may be answered with.
   *
   * @param {{
   *   fieldSchemaEntry: *
   * }} params - Parameters.
   * @returns {number} The minimum.
   * @public
   */
  extractMinimumNumber ({
    fieldSchemaEntry,
  }) {
    if (!Number.isFinite(fieldSchemaEntry?.minimum)) {
      return this.extractDefaultMinimumNumber({
        fieldSchemaEntry,
      })
    }

    return Math.ceil(fieldSchemaEntry.minimum)
  }

  /**
   * Extract the smallest number a field with no stated minimum may be answered with.
   *
   * One, unless the caller stated a maximum below it - a field bounded at or under zero is answered
   * inside its own bound rather than above it.
   *
   * @param {{
   *   fieldSchemaEntry: *
   * }} params - Parameters.
   * @returns {number} The minimum.
   * @public
   */
  extractDefaultMinimumNumber ({
    fieldSchemaEntry,
  }) {
    if (!Number.isFinite(fieldSchemaEntry?.maximum)) {
      return DEFAULT_MINIMUM_NUMBER
    }

    return Math.min(DEFAULT_MINIMUM_NUMBER, Math.floor(fieldSchemaEntry.maximum))
  }

  /**
   * Extract the largest number a field may be answered with.
   *
   * Never below the minimum, so the span a value is drawn from is at least one wide. A caller whose
   * maximum is under its own minimum has stated a range nothing satisfies, and the value answered
   * above that maximum is dropped by step 4 - which is the right ending for a schema that bounds a
   * field to nothing.
   *
   * @param {{
   *   fieldSchemaEntry: *
   *   minimumNumber: number
   * }} params - Parameters.
   * @returns {number} The maximum.
   * @public
   */
  extractMaximumNumber ({
    fieldSchemaEntry,
    minimumNumber,
  }) {
    if (!Number.isFinite(fieldSchemaEntry?.maximum)) {
      return minimumNumber + DEFAULT_NUMBER_SPAN
    }

    return Math.max(minimumNumber, Math.floor(fieldSchemaEntry.maximum))
  }

  /**
   * Generate the option a select field is answered with.
   *
   * One of the caller's own options, never a value beside them: step 4 drops a select value that
   * was not offered and never corrects it to a nearby one, so a demonstration answering anything
   * else would demonstrate a field that is always dropped. A select carrying no options bounds the
   * field to nothing and is answered with nothing.
   *
   * @param {GenerateFieldValueParams} params - Parameters.
   * @returns {*} The option, or null when the caller offered none.
   * @public
   */
  generateSelectValue ({
    fieldSchemaEntry,
    drawnNumber,
  }) {
    if (!Array.isArray(fieldSchemaEntry?.options)) {
      return null
    }

    if (fieldSchemaEntry.options.length === 0) {
      return null
    }

    return fieldSchemaEntry.options[drawnNumber % fieldSchemaEntry.options.length]
  }

  /**
   * Extract what a supplied reading rests on.
   *
   * @param {{
   *   drawnNumber: number
   * }} params - Parameters.
   * @returns {string} The evidence kind name.
   * @public
   */
  extractEvidenceKindName ({
    drawnNumber,
  }) {
    return this.evidenceKindNames[drawnNumber % this.evidenceKindNames.length]
  }

  /**
   * Generate the one line a supplied value is explained by.
   *
   * It says what it is in the first characters of the line, because this is the one part of a
   * supplied reading that reaches a person unchanged - a number field's value is a number and a
   * select field's is the caller's own option, so neither can carry a mark. specs/1.0.0 §20 says
   * reasons are "written in the language the asset owner reads" and its first use case says that
   * language is Vietnamese; this line is neither, deliberately. A fixture written the way the
   * product writes is a fixture somebody ships.
   *
   * @param {{
   *   fieldSchemaEntry: *
   * }} params - Parameters.
   * @returns {string} The reason.
   * @public
   */
  generateReason ({
    fieldSchemaEntry,
  }) {
    return `${STUB_REASON_PREFIX} demonstration value for ${fieldSchemaEntry?.path}, supplied without a model call.`
  }

  /**
   * Extract the photographs a supplied reading is offered as resting on.
   *
   * One of the photographs that were read, drawn per field, so a screen being built shows different
   * fields citing different photographs. It is one of the keys that came back readable rather than
   * one the request merely declared: a value offered as resting on a photograph nobody opened would
   * be a worse claim than the value itself.
   *
   * @param {{
   *   readableMediaKeys: Array<string>
   *   drawnNumber: number
   * }} params - Parameters.
   * @returns {Array<string>} The keys.
   * @public
   */
  extractSourceMediaKeys ({
    readableMediaKeys,
    drawnNumber,
  }) {
    const mediaKey = readableMediaKeys[drawnNumber % readableMediaKeys.length]

    return [
      mediaKey,
    ]
  }
}

/**
 * @typedef {{
 *   answerDigester: StubAnswerDigester
 *   evidenceKindNames: Array<string>
 * }} StubAssetFieldReadingSupplierParams
 */

/**
 * @typedef {Partial<StubAssetFieldReadingSupplierParams>} StubAssetFieldReadingSupplierFactoryParams
 */

/**
 * @typedef {{
 *   fieldSchema: *
 *   mediaSignature: *
 *   readableMediaKeys: *
 * }} BuildFieldReadingsParams
 */

/**
 * @typedef {{
 *   fieldSchemaEntry: *
 *   mediaSignature: *
 *   readableMediaKeys: Array<string>
 * }} BuildFieldReadingParams
 */

/**
 * @typedef {{
 *   fieldSchemaEntry: *
 *   drawnNumber: number
 * }} GenerateFieldValueParams
 */

/**
 * @typedef {{
 *   path: string
 *   value: string | number
 *   evidenceKindName: string
 *   reason: string
 *   sourceMediaKeys: Array<string>
 * }} SuppliedFieldReading
 */

/**
 * @typedef {{
 *   valueKind: string
 *   generateValue: () => string | number | null
 * }} SuppliedValueKindEntry
 */
