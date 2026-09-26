import AiRunStatusRecorder from '../../../../../app/aiRun/AiRunStatusRecorder.js'
import AI_RUN_CATEGORY_CONSTANT_HASH from '../../../../../app/constants/aiRunCategoryConstants.js'
import AI_RUN_FIELD_STATUS_CONSTANT_HASH from '../../../../../app/constants/aiRunFieldStatusConstants.js'
import StubAnswerDigester from '../../../../../app/stubAiModel/StubAnswerDigester.js'

import BaseAiRunPostRenderer from '../../BaseAiRunPostRenderer.js'

const {
  AI_RUN_CATEGORY,
} = AI_RUN_CATEGORY_CONSTANT_HASH

const {
  AI_RUN_FIELD_STATUS,
} = AI_RUN_FIELD_STATUS_CONSTANT_HASH

/*
 * The dispatcher this stub hands the base's commit-time registration.
 *
 * The base registers a dispatch off the commit of the transaction that created the run, and that
 * registration is not this class's to skip — the rule it encodes (nothing leaves the process until
 * the row is visible) is the same rule whether the queue is real or not. What a stub has is nothing
 * to send: it settles the run in the request instead, so what reaches the commit is a dispatcher
 * whose one method sends nothing.
 *
 * It is here rather than in `get:JobDispatcherCtor` because the two are not the same statement. The
 * abstract member names the queue this service's runs go to, and this service has no queue until
 * checkpoint 7 builds one; naming a sham there would say it did. So the member is left inherited and
 * unanswered, `#ensureJobDispatcher()` is overridden so nothing ever asks it, and the day the real
 * dispatcher exists the override goes and the member is filled.
 */
const STUB_JOB_DISPATCHER = {
  dispatchJob: async () => null,
}

/*
 * The three value kinds a photo can be read for, as specs/1.0.0 §20 step 1 names them.
 *
 * Read as `=== true`, so a kind reaching a member of `Object.prototype` is as unsuggestible as one
 * this hash does not name. A field of any other kind is dropped and appears nowhere in the result,
 * neither as a suggestion nor as a missing path — step 1 removes it before step 5 could call it
 * unsettled.
 */
const STUB_SUGGESTIBLE_VALUE_KIND_HASH = {
  text: true,
  number: true,
  select: true,
}

/*
 * The states a settled field may come out as, and the weight each carries into its confidence.
 *
 * One array rather than two, because the state and its weight are one fact read at one index: a
 * state added to one list and forgotten in the other would score a field by somebody else's weight.
 * `missing` is deliberately absent — a field this stub does not settle is named in
 * `missingFieldPaths[]` and carries no entry at all, which is what "never a guess" means on this
 * surface.
 *
 * **The weights are a demonstration, not the formula.** specs/1.0.0 §20 says confidence is scored
 * from the observed agreement and the evidence kind, and that the formula carries a version every
 * run records. This stub records no version and computes no formula: it multiplies the agreement
 * fraction by a fixed weight so that a screen showing "2 of 3" beside a confidence shows two
 * numbers that agree with each other. The real scoring is checkpoint 5's.
 */
const STUB_FIELD_STATES = [
  {
    name: AI_RUN_FIELD_STATUS.EXTRACTED.NAME,
    confidenceWeight: 1,
  },
  {
    name: AI_RUN_FIELD_STATUS.DERIVED.NAME,
    confidenceWeight: 0.8,
  },
  {
    name: AI_RUN_FIELD_STATUS.SUGGESTED.NAME,
    confidenceWeight: 0.6,
  },
]

/*
 * The words a text field is answered with.
 *
 * A text field in the caller's own schema may be anything at all, and nothing in the request says
 * what — so these are plainly specimens rather than an attempt at plausibility. They are English
 * because this project writes one language per file; in production the value is written in the
 * language the asset owner reads (specs/1.0.0, §20).
 */
const STUB_TEXT_VALUES = [
  'brick',
  'concrete',
  'weathered',
  'repainted',
  'tiled',
  'unpainted',
]

/*
 * How many readings a settled field is reported as having been read from, and how many of them
 * agreed at the least.
 *
 * Three is a specimen: the real figure is configured, and this stub reads nothing and configures
 * nothing. The floor is two because an absolute majority of three is two — a field this stub
 * settles is one a majority settled, and a field no majority settled is not settled at all.
 */
const STUB_READING_COUNT = 3
const STUB_MINIMUM_AGREED_READING_COUNT = 2
const STUB_AGREED_READING_COUNT_SPAN = 2

/*
 * How often a medium is unreadable, and how often a readable one is cited by a field.
 *
 * Both are divisors of a digest rather than probabilities: the same media answer the same way on
 * every machine and in every process. One in seven media comes back unreadable and two in three are
 * cited, which is enough that a client demonstrating the screen meets a populated
 * `unreadableMediaKeys[]` and a `sourceMediaKeys[]` that is a proper subset without having to
 * construct a request for it.
 */
const STUB_UNREADABLE_MEDIUM_DIVISOR = 7
const STUB_CITED_MEDIUM_DIVISOR = 3

/*
 * The band a number field is answered in.
 *
 * It starts at ten rather than at zero because §20 is emphatic that a field the photos could not
 * show is reported as missing and "never a zero" — a stub answering zero would put the one value
 * the contract rules out on a client's screen as though it were a reading.
 */
const STUB_NUMBER_VALUE_FLOOR = 10
const STUB_NUMBER_VALUE_SPAN = 90

const STUB_CONFIDENCE_DECIMAL_PLACE_COUNT = 2

/**
 * Stub renderer: `POST /v1/asset-media-extractions`.
 *
 * **It is a live route the moment the engine boots.** The framework registers every renderer under
 * `renderers/v1/`, so this class answers the contract's one POST from the next start — behind the
 * engine's own `401` and `403`, because `get:passesFilter` is left at its inherited `false`.
 *
 * **What is real here, and why.** The run it writes is a real row with a real run key, minted
 * through `BaseAiRunPostRenderer`'s accept path: the idempotency pair, the request-body digest, the
 * transaction. A stub that answered a canned run key would hand a client a key that reads back as
 * nothing, and the operation's whole point is a key the caller then reads a result under.
 *
 * **What is stubbed is the reading, and nothing else.** No queue is reached, no model is called, no
 * file is fetched. The run is settled succeeded in the request that created it, carrying a result
 * built from the request itself — which is the fourth use case of specs/1.0.0 §20: a client builds
 * and demonstrates its whole suggestion screen before any API key exists, because the stub answers
 * deterministically from the media the request names.
 *
 * **Where the determinism stops, stated rather than left to be discovered.** What follows from the
 * request is every *identifier* on the surface: which `path` each field carries, which `mediaKey`
 * each value cites, which keys came back unreadable, and the `mediaSignature` echoed back. What
 * does not follow from the request is every *judgement*: the value itself, the field state, how many
 * readings agreed and the confidence are drawn from a digest of the request, so they are stable and
 * they are not a rule. A client may build a screen against the first and must not learn the second —
 * majority settling, schema filtering, a computed confidence, a video refused and audio ignored are
 * all behaviour this class does not have and does not imitate.
 *
 * **A run this stub accepts never passes through `running`.** It is queued for as long as the
 * request takes and succeeded after that, so `started_at` stays null and a client cannot
 * demonstrate the waiting state against this route. It can against `GET /v1/ai-runs/:runKey`, whose
 * development fixtures carry a run in each of the five statuses — which is where that half of the
 * screen belongs, and why nothing is faked here to provide it.
 *
 * **The agreement it writes is spelled `agreedReadingCount` and `totalReadingCount`**, after the
 * two columns of `ai_run_field_outcomes` — and this stub is what made that a decision rather than
 * an accident. The type declared at checkpoint 3 said `agreedCount` and `readingCount`, while the
 * columns, the development seeder's specimen result body and the read-back stub that answered from
 * it all said the other. Left alone, one route would have answered both spellings depending on
 * which run was read: the seeded one, or one this stub created. The columns won, being the thing
 * the real renderer will read from, and the type was corrected to match.
 *
 * **The real renderer replaces this body, in this file, under this name.** The REST layer has no
 * `stub/` and `actual/` split: a route is whatever class the framework finds under `renderers/v1/`,
 * so the migration a GraphQL stub makes by moving folders, this one makes by keeping its class name,
 * its `get:routePath` and its response shape while its body is rewritten. Every constant above, and
 * every `*Stub*` member below, goes with the old body.
 *
 * @extends {BaseAiRunPostRenderer}
 */
export default class AssetMediaExtractionPostRenderer extends BaseAiRunPostRenderer {
  /**
   * get: the route this renderer answers, under the engine's `/v1` prefix.
   *
   * @override
   * @returns {string} Route path.
   */
  static get routePath () {
    return '/asset-media-extractions'
  }

  /**
   * get: which AI service this renderer is.
   *
   * @override
   * @returns {{
   *   ID: number
   *   NAME: string
   *   DISPLAY_NAME: string
   *   DISPLAY_ORDER: number
   *   IS_ACTIVE: boolean
   * }} Run category.
   */
  static get aiRunCategory () {
    return AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION
  }

  /**
   * get: the dispatcher this stub hands the commit-time registration, which sends nothing.
   *
   * @returns {{
   *   dispatchJob: () => Promise<null>
   * }} Job dispatcher.
   */
  static get stubJobDispatcher () {
    return STUB_JOB_DISPATCHER
  }

  /**
   * get: the states a settled field may come out as — a seam so tests can read them.
   *
   * @returns {Array<StubFieldState>} Field states.
   */
  static get stubFieldStates () {
    return STUB_FIELD_STATES
  }

  /**
   * get: the words a text field is answered with — a seam so tests can read them.
   *
   * @returns {Array<string>} Text values.
   */
  static get stubTextValues () {
    return STUB_TEXT_VALUES
  }

  /**
   * Create the writer that settles the run this stub answered.
   *
   * @returns {AiRunStatusRecorder} Recorder.
   */
  static createAiRunStatusRecorder () {
    return AiRunStatusRecorder.create()
  }

  /**
   * Create the digester every derived judgement is drawn from.
   *
   * @returns {StubAnswerDigester} Digester.
   */
  static createStubAnswerDigester () {
    return StubAnswerDigester.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof AssetMediaExtractionPostRenderer} The class.
   */
  get Ctor () {
    return /** @type {typeof AssetMediaExtractionPostRenderer} */ (this.constructor)
  }

  /**
   * Obtain this service's job dispatcher, which a stub has none of.
   *
   * Nothing is reached and nothing is waited on: the base asks for the dispatcher before it opens
   * the transaction so that a queue connection is never negotiated inside one, and a stub that
   * negotiates no connection answers that question immediately. `get:JobDispatcherCtor` is left
   * inherited and unanswered on purpose — see the constant this returns.
   *
   * @override
   * @returns {Promise<{
   *   dispatchJob: () => Promise<null>
   * }>} The dispatcher.
   */
  async ensureJobDispatcher () {
    return this.Ctor.stubJobDispatcher
  }

  /**
   * Write the accepted run, and settle it with the result this stub reads out of the request.
   *
   * The settlement is after the transaction and not inside it. `AiRunStatusRecorder` reads the run
   * it is about to move on its own connection, which cannot see a row an uncommitted `SERIALIZABLE`
   * transaction is still holding — so the run is written, the commit makes it visible, and the
   * settlement follows on the row everything else can now read.
   *
   * The caller is answered `queued` regardless, which is what the contract fixes for the request
   * that created a run. It is true of the instant the run was accepted; by the time the caller reads
   * the run back it stands at `succeeded`, and a repeat of the same idempotency key is told so.
   *
   * @override
   * @param {SaveAcceptedAiRunParams} params - Parameters.
   * @returns {Promise<*>} The run that was written.
   */
  async saveAcceptedAiRun ({
    aiRunAcceptor,
    aiRunJobDispatchRegistrar,
    context,
    input,
    rawBody,
    requestBodyHash,
  }) {
    const acceptedAiRun = await super.saveAcceptedAiRun({
      aiRunAcceptor,
      aiRunJobDispatchRegistrar,
      context,
      input,
      rawBody,
      requestBodyHash,
    })

    await this.settleStubAiRun({
      aiRunId: acceptedAiRun.id,
      rawBody,
      finishedAt: context.now,
    })

    return acceptedAiRun
  }

  /**
   * Settle the run this stub accepted, carrying the result the request itself implies.
   *
   * @param {{
   *   aiRunId: number
   *   rawBody: string
   *   finishedAt: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether this call settled the run.
   */
  async settleStubAiRun ({
    aiRunId,
    rawBody,
    finishedAt,
  }) {
    const requestBody = this.extractRequestBody({
      rawBody,
    })

    const result = this.buildStubResult({
      requestBody,
    })

    const resultBody = JSON.stringify(result)

    const aiRunStatusRecorder = this.Ctor.createAiRunStatusRecorder()

    return aiRunStatusRecorder.saveSucceededAiRunOnce({
      aiRunId,
      resultBody,
      finishedAt,
    })
  }

  /**
   * Extract the request as an object, out of the bytes it was signed as.
   *
   * The raw body is read rather than the parsed one because the parsed body does not reach this
   * far — the base hands its accept path the bytes and the fields it validated, and the service's
   * own fields are neither. Nothing guards the parse: this runs only on the path where the base
   * already refused `422` for a body it could not read the four common fields out of, so bytes that
   * reach here are bytes express parsed a moment ago.
   *
   * @param {{
   *   rawBody: string
   * }} params - Parameters.
   * @returns {restfulapi.v1.AssetMediaExtractionRequest} The request.
   */
  extractRequestBody ({
    rawBody,
  }) {
    return JSON.parse(rawBody)
  }

  /**
   * Build the result the run is settled with.
   *
   * Every list here is walked out of the request: the media the caller named decide which keys can
   * be cited and which come back unreadable, and the schema the caller sent decides which paths can
   * appear at all. A request naming no media settles nothing and reports every required field
   * missing, which is the third use case reached without a special case for it.
   *
   * @param {{
   *   requestBody: restfulapi.v1.AssetMediaExtractionRequest
   * }} params - Parameters.
   * @returns {restfulapi.v1.AssetMediaExtractionResult} The result.
   */
  buildStubResult ({
    requestBody,
  }) {
    const asset = requestBody.asset
      ?? {}
    const media = requestBody.media
      ?? []
    const fieldSchema = requestBody.fieldSchema
      ?? []
    const mediaSignature = requestBody.mediaSignature
      ?? null

    const mediaKeys = media.map(it => it.mediaKey)

    const unreadableMediaKeys = mediaKeys
      .filter(it =>
        this.isUnreadableStubMedium({
          mediaKey: it,
        })
      )

    const readableMediaKeys = mediaKeys
      .filter(it =>
        !this.isUnreadableStubMedium({
          mediaKey: it,
        })
      )

    const suggestibleFieldSchema = fieldSchema
      .filter(it =>
        this.isStubSuggestibleField({
          valueKind: it.valueKind,
        })
      )

    const fields = suggestibleFieldSchema
      .map(it =>
        this.buildStubField({
          fieldSchemaEntry: it,
          readableMediaKeys,
          asset,
        })
      )
      .filter(it => it !== null)

    const missingFieldPaths = this.extractStubMissingFieldPaths({
      fieldSchema: suggestibleFieldSchema,
      fields,
    })

    return {
      fields,
      missingFieldPaths,
      unreadableMediaKeys,
      mediaSignature,
    }
  }

  /**
   * Check whether a medium came back unreadable.
   *
   * @param {{
   *   mediaKey: string
   * }} params - Parameters.
   * @returns {boolean} Whether it is unreadable.
   */
  isUnreadableStubMedium ({
    mediaKey,
  }) {
    const digestedNumber = this.generateStubDigestedNumber({
      value: {
        mediaKey,
      },
    })

    return digestedNumber % STUB_UNREADABLE_MEDIUM_DIVISOR === 0
  }

  /**
   * Check whether a field of this kind can be suggested from a photo at all.
   *
   * @param {{
   *   valueKind: string
   * }} params - Parameters.
   * @returns {boolean} Whether it is suggestible.
   */
  isStubSuggestibleField ({
    valueKind,
  }) {
    return STUB_SUGGESTIBLE_VALUE_KIND_HASH[valueKind] === true
  }

  /**
   * Build one settled field, or answer null where this stub settles none.
   *
   * A field settles on two conditions, and both are read out of the request: the schema entry has to
   * carry a value this stub can answer — a select with no options carries none — and at least one
   * readable medium has to cite it. A field failing either is not returned, which is what leaves it
   * to `missingFieldPaths[]` when the caller marked it required.
   *
   * @param {{
   *   fieldSchemaEntry: restfulapi.v1.AssetMediaExtractionFieldSchemaRequest
   *   readableMediaKeys: Array<string>
   *   asset: restfulapi.v1.AssetMediaExtractionAssetRequest
   * }} params - Parameters.
   * @returns {restfulapi.v1.AssetMediaExtractionFieldResult | null} The field, or null.
   */
  buildStubField ({
    fieldSchemaEntry,
    readableMediaKeys,
    asset,
  }) {
    const digestedNumber = this.generateStubDigestedNumber({
      value: {
        path: fieldSchemaEntry.path,
        asset,
      },
    })

    const value = this.buildStubFieldValue({
      valueKind: fieldSchemaEntry.valueKind,
      options: fieldSchemaEntry.options,
      digestedNumber,
    })

    if (value === null) {
      return null
    }

    const sourceMediaKeys = this.extractStubSourceMediaKeys({
      path: fieldSchemaEntry.path,
      readableMediaKeys,
    })

    if (sourceMediaKeys.length === 0) {
      return null
    }

    const fieldState = this.extractStubFieldState({
      digestedNumber,
    })

    const agreement = this.buildStubAgreement({
      digestedNumber,
    })

    const suggestionConfidence = this.generateStubConfidence({
      agreement,
      confidenceWeight: fieldState.confidenceWeight,
    })

    const reason = this.buildStubReason({
      label: fieldSchemaEntry.label,
      sourceMediaKeys,
      province: asset.province,
    })

    const fieldStateName = fieldState.name
    const { path } = fieldSchemaEntry

    return {
      path,
      value,
      fieldStateName,
      suggestionConfidence,
      reason,
      sourceMediaKeys,
      agreement,
    }
  }

  /**
   * Build the value a field is answered with, or null where this stub answers none.
   *
   * The three kinds are read out of one hash rather than branched over, and the read is total: each
   * entry wraps its value, so a kind reaching a member of `Object.prototype` answers no wrapper and
   * falls to null exactly as an unknown kind does. A select is the one kind whose value comes from
   * the request — answering a value outside the options sent would put something on a client's
   * screen its own control cannot render.
   *
   * @param {{
   *   valueKind: string
   *   options: Array<string> | undefined
   *   digestedNumber: number
   * }} params - Parameters.
   * @returns {string | number | null} The value, or null.
   */
  buildStubFieldValue ({
    valueKind,
    options,
    digestedNumber,
  }) {
    const textValue = this.buildStubTextValue({
      digestedNumber,
    })

    const numberValue = this.generateStubNumberValue({
      digestedNumber,
    })

    const selectValue = this.extractStubSelectValue({
      options,
      digestedNumber,
    })

    const valueHash = {
      text: {
        value: textValue,
      },
      number: {
        value: numberValue,
      },
      select: {
        value: selectValue,
      },
    }

    return valueHash[valueKind]
      ?.value
      ?? null
  }

  /**
   * Build the value a text field is answered with.
   *
   * @param {{
   *   digestedNumber: number
   * }} params - Parameters.
   * @returns {string} The value.
   */
  buildStubTextValue ({
    digestedNumber,
  }) {
    const textValues = this.Ctor.stubTextValues

    return textValues[digestedNumber % textValues.length]
  }

  /**
   * Generate the value a number field is answered with.
   *
   * @param {{
   *   digestedNumber: number
   * }} params - Parameters.
   * @returns {number} The value.
   */
  generateStubNumberValue ({
    digestedNumber,
  }) {
    return STUB_NUMBER_VALUE_FLOOR
      + (digestedNumber % STUB_NUMBER_VALUE_SPAN)
  }

  /**
   * Extract the option a select field is answered with, out of the options the request sent.
   *
   * A schema entry that names a select and sends no options to choose from bounds the field to
   * nothing, so nothing is answered for it.
   *
   * @param {{
   *   options: Array<string> | undefined
   *   digestedNumber: number
   * }} params - Parameters.
   * @returns {string | null} The option, or null when none was sent.
   */
  extractStubSelectValue ({
    options,
    digestedNumber,
  }) {
    const sentOptions = options
      ?? []

    return sentOptions[digestedNumber % sentOptions.length]
      ?? null
  }

  /**
   * Extract the readable media a field cites.
   *
   * @param {{
   *   path: string
   *   readableMediaKeys: Array<string>
   * }} params - Parameters.
   * @returns {Array<string>} The cited keys, always a subset of the readable ones.
   */
  extractStubSourceMediaKeys ({
    path,
    readableMediaKeys,
  }) {
    return readableMediaKeys
      .filter(it =>
        this.citesStubMedium({
          path,
          mediaKey: it,
        })
      )
  }

  /**
   * Check whether a field cites a medium.
   *
   * @param {{
   *   path: string
   *   mediaKey: string
   * }} params - Parameters.
   * @returns {boolean} Whether it is cited.
   */
  citesStubMedium ({
    path,
    mediaKey,
  }) {
    const digestedNumber = this.generateStubDigestedNumber({
      value: {
        path,
        mediaKey,
      },
    })

    return digestedNumber % STUB_CITED_MEDIUM_DIVISOR !== 0
  }

  /**
   * Extract the state a field came out as.
   *
   * @param {{
   *   digestedNumber: number
   * }} params - Parameters.
   * @returns {StubFieldState} The state.
   */
  extractStubFieldState ({
    digestedNumber,
  }) {
    const fieldStates = this.Ctor.stubFieldStates

    return fieldStates[digestedNumber % fieldStates.length]
  }

  /**
   * Build how many readings agreed on a field, out of how many were taken.
   *
   * @param {{
   *   digestedNumber: number
   * }} params - Parameters.
   * @returns {restfulapi.v1.AssetMediaExtractionAgreementResult} The agreement.
   */
  buildStubAgreement ({
    digestedNumber,
  }) {
    const agreedReadingCount = STUB_MINIMUM_AGREED_READING_COUNT
      + (digestedNumber % STUB_AGREED_READING_COUNT_SPAN)

    return {
      agreedReadingCount,
      totalReadingCount: STUB_READING_COUNT,
    }
  }

  /**
   * Generate the confidence a field carries.
   *
   * @param {{
   *   agreement: restfulapi.v1.AssetMediaExtractionAgreementResult
   *   confidenceWeight: number
   * }} params - Parameters.
   * @returns {number} The confidence, between zero and one.
   */
  generateStubConfidence ({
    agreement,
    confidenceWeight,
  }) {
    const agreementRatio = agreement.agreedReadingCount / agreement.totalReadingCount

    const confidence = agreementRatio * confidenceWeight

    return Number(confidence.toFixed(STUB_CONFIDENCE_DECIMAL_PLACE_COUNT))
  }

  /**
   * Build the one line a field's value is explained by.
   *
   * The province is named in it on purpose. specs/1.0.0 declares `asset.province` a string and says
   * nothing about whether it holds a name, a code or a slug ([[Q123]]); this stub reads it as the
   * human-readable name of the province, as a person writes it, because the field is context handed
   * to a model rather than a key anything resolves. Writing it into a sentence meant for a person is
   * what makes a different reading loud: a client that sent a code sees the code sitting in its own
   * screen's explanatory line, rather than discovering the mismatch when real values come back wrong.
   *
   * @param {{
   *   label: string
   *   sourceMediaKeys: Array<string>
   *   province: string
   * }} params - Parameters.
   * @returns {string} The reason.
   */
  buildStubReason ({
    label,
    sourceMediaKeys,
    province,
  }) {
    const citedMediaCount = sourceMediaKeys.length

    return `Read "${label}" from ${citedMediaCount} of the photos sent, for an asset in ${province}.`
  }

  /**
   * Extract the required fields no value was settled for.
   *
   * @param {{
   *   fieldSchema: Array<restfulapi.v1.AssetMediaExtractionFieldSchemaRequest>
   *   fields: Array<restfulapi.v1.AssetMediaExtractionFieldResult>
   * }} params - Parameters.
   * @returns {Array<string>} The paths.
   */
  extractStubMissingFieldPaths ({
    fieldSchema,
    fields,
  }) {
    const settledPaths = fields.map(it => it.path)

    return fieldSchema
      .filter(it => it.isRequired === true)
      .map(it => it.path)
      .filter(it => !settledPaths.includes(it))
  }

  /**
   * Generate the number a judgement is drawn from, for whatever the judgement is about.
   *
   * It is a digest of the value and of nothing else — no clock, no counter, no entropy — so the same
   * request answers the same result on any machine, in any process and in any order, which is the
   * whole of what the fourth use case asks for.
   *
   * @param {{
   *   value: *
   * }} params - Parameters.
   * @returns {number} The number.
   */
  generateStubDigestedNumber ({
    value,
  }) {
    const stubAnswerDigester = this.Ctor.createStubAnswerDigester()

    const text = stubAnswerDigester.buildCanonicalText({
      value,
    })

    return stubAnswerDigester.generateDigestedNumber({
      text,
    })
  }
}

/**
 * @typedef {{
 *   aiRunAcceptor: *
 *   aiRunJobDispatchRegistrar: *
 *   context: *
 *   input: *
 *   rawBody: string
 *   requestBodyHash: string
 * }} SaveAcceptedAiRunParams
 */

/**
 * @typedef {{
 *   name: string
 *   confidenceWeight: number
 * }} StubFieldState
 */
