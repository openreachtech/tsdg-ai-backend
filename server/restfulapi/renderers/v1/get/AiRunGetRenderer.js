import {
  BaseGetRenderer,
  RestfulApiResponse,
} from '@openreachtech/renchan'

import AI_RUN_CATEGORY_CONSTANT_HASH from '../../../../../app/constants/aiRunCategoryConstants.js'
import AI_RUN_FAILURE_REASON_CONSTANT_HASH from '../../../../../app/constants/aiRunFailureReasonConstants.js'
import AI_RUN_FIELD_STATUS_CONSTANT_HASH from '../../../../../app/constants/aiRunFieldStatusConstants.js'
import AI_RUN_STATUS_CONSTANT_HASH from '../../../../../app/constants/aiRunStatusConstants.js'
import AI_RUN_STEP_CATEGORY_CONSTANT_HASH from '../../../../../app/constants/aiRunStepCategoryConstants.js'

const {
  AI_RUN_CATEGORY,
} = AI_RUN_CATEGORY_CONSTANT_HASH

const {
  AI_RUN_FAILURE_REASON_CODE,
} = AI_RUN_FAILURE_REASON_CONSTANT_HASH

const {
  AI_RUN_FIELD_STATUS,
} = AI_RUN_FIELD_STATUS_CONSTANT_HASH

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

const {
  AI_RUN_STEP_CATEGORY,
} = AI_RUN_STEP_CATEGORY_CONSTANT_HASH

const SUCCESS_STATUS_CODE = 200

const EXPAND_STEPS_QUERY_VALUE = 'steps'

/*
 * The five run keys this stub answers for, one per value of `statusName`.
 *
 * A real run key is sixty-four lower case hex characters minted by `RunKeyGenerator`, so each of
 * these is sixty-four of one digit — a shape a caller can type and can never confuse with a real
 * key. The digit is the run status's own `ID`, so `3` reads back as the succeeded run without a
 * table to consult.
 */
const CANNED_RUN_KEY = {
  QUEUED: '1111111111111111111111111111111111111111111111111111111111111111',
  RUNNING: '2222222222222222222222222222222222222222222222222222222222222222',
  SUCCEEDED: '3333333333333333333333333333333333333333333333333333333333333333',
  FAILED: '4444444444444444444444444444444444444444444444444444444444444444',
  CANCELED: '5555555555555555555555555555555555555555555555555555555555555555',
}

/*
 * The answer a run key this stub does not name falls back to.
 *
 * A caller that has not yet minted anything reads the richest body rather than a refusal: the
 * contract's `404` is for a run belonging to *another* client, and a stub that holds no client and
 * no run cannot tell that case from an unknown key. Deciding it is the real renderer's work, at
 * checkpoint 6.
 */
const FALLBACK_CANNED_RUN_KEY = CANNED_RUN_KEY.SUCCEEDED

/*
 * What a succeeded asset-media-extraction run carries as its `result`.
 *
 * The field list is specs/1.0.0 §20's, not this feature's: the contract says `result` is "per
 * service", and `types/restfulapi/aiRunGet.d.ts` deliberately declares it no narrower than
 * `Record<string, unknown>` so that a second AI service writes its own shape rather than editing
 * that one. This constant is a specimen of §20's table, and pins nothing on any other service.
 *
 * The `reason` of a field is written here in English. In production it is written in the language
 * the asset owner reads (§20), so a client must not assume it is ASCII — this project writes one
 * language per file, which is why the specimen is not in Vietnamese.
 */
const CANNED_ASSET_MEDIA_EXTRACTION_RESULT = {
  fields: [
    {
      path: 'exterior.wallMaterial',
      value: 'brick',
      fieldStateName: AI_RUN_FIELD_STATUS.EXTRACTED.NAME,
      suggestionConfidence: 0.92,
      reason: 'The front wall is visibly brick in two of the photos.',
      sourceMediaKeys: [
        'media-key-0001',
        'media-key-0002',
      ],
      agreement: {
        agreedReadingCount: 3,
        totalReadingCount: 3,
      },
    },
    {
      path: 'exterior.roofCondition',
      value: 'weathered',
      fieldStateName: AI_RUN_FIELD_STATUS.SUGGESTED.NAME,
      suggestionConfidence: 0.64,
      reason: 'The roof tiles are discolored, though the ridge is not in frame.',
      sourceMediaKeys: [
        'media-key-0002',
      ],
      agreement: {
        agreedReadingCount: 2,
        totalReadingCount: 3,
      },
    },
    {
      path: 'interior.floorCount',
      value: 2,
      fieldStateName: AI_RUN_FIELD_STATUS.DERIVED.NAME,
      suggestionConfidence: 0.71,
      reason: 'Two window rows are counted above the entrance.',
      sourceMediaKeys: [
        'media-key-0003',
      ],
      agreement: {
        agreedReadingCount: 2,
        totalReadingCount: 3,
      },
    },
  ],
  missingFieldPaths: [
    'interior.ceilingHeightMeters',
  ],
  unreadableMediaKeys: [
    'media-key-0004',
  ],
  mediaSignature: 'media-signature-of-the-succeeded-canned-run',
}

/*
 * The step trace each canned run answers with when `?expand=steps` was asked for.
 *
 * Seven fields per step, exactly as `types/restfulapi/aiRunGet.d.ts` declares them — and
 * `rejections` is absent on purpose. §10 is emphatic that the trace holds figures and never
 * values, and the contract never names the column, so it is not on this surface.
 *
 * The step names, outcome codes and reason codes are specimens taken from the vocabulary the
 * repository's own step tests already use. Nothing this version fixes that vocabulary, and §20
 * owns the real one.
 */
const CANNED_AI_RUN_STEPS = {
  QUEUED: [],
  RUNNING: [
    {
      stepIndex: 1,
      stepName: 'select-suggestible-fields',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-02-01T09:00:00.000Z'),
      finishedAt: new Date('2026-02-01T09:00:01.000Z'),
    },
    {
      stepIndex: 2,
      stepName: 'fetch-asset-media',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-02-01T09:00:02.000Z'),
      finishedAt: new Date('2026-02-01T09:00:09.000Z'),
    },
    {
      stepIndex: 3,
      stepName: 'read-asset-media',
      stepCategoryName: AI_RUN_STEP_CATEGORY.AI.NAME,
      outcomeCode: 'running',
      reasonCode: null,
      startedAt: new Date('2026-02-01T09:00:10.000Z'),
      finishedAt: null,
    },
  ],
  SUCCEEDED: [
    {
      stepIndex: 1,
      stepName: 'select-suggestible-fields',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-01-05T11:00:00.000Z'),
      finishedAt: new Date('2026-01-05T11:00:01.000Z'),
    },
    {
      stepIndex: 2,
      stepName: 'fetch-asset-media',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-01-05T11:00:02.000Z'),
      finishedAt: new Date('2026-01-05T11:00:14.000Z'),
    },
    {
      stepIndex: 3,
      stepName: 'read-asset-media',
      stepCategoryName: AI_RUN_STEP_CATEGORY.AI.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-01-05T11:00:15.000Z'),
      finishedAt: new Date('2026-01-05T11:00:48.000Z'),
    },
    {
      stepIndex: 4,
      stepName: 'validate-readings',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'partially_settled',
      reasonCode: 'reading_too_long',
      startedAt: new Date('2026-01-05T11:00:49.000Z'),
      finishedAt: new Date('2026-01-05T11:00:50.000Z'),
    },
    {
      stepIndex: 5,
      stepName: 'settle-fields',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'partially_settled',
      reasonCode: 'low_agreement',
      startedAt: new Date('2026-01-05T11:00:51.000Z'),
      finishedAt: new Date('2026-01-05T11:00:52.000Z'),
    },
    {
      stepIndex: 6,
      stepName: 'score-confidence',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-01-05T11:00:53.000Z'),
      finishedAt: new Date('2026-01-05T11:00:54.000Z'),
    },
  ],
  FAILED: [
    {
      stepIndex: 1,
      stepName: 'select-suggestible-fields',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-01-07T08:30:00.000Z'),
      finishedAt: new Date('2026-01-07T08:30:01.000Z'),
    },
    {
      stepIndex: 2,
      stepName: 'fetch-asset-media',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'abandoned',
      reasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_LIMIT_EXCEEDED,
      startedAt: new Date('2026-01-07T08:30:02.000Z'),
      finishedAt: new Date('2026-01-07T08:30:03.000Z'),
    },
  ],
  CANCELED: [
    {
      stepIndex: 1,
      stepName: 'select-suggestible-fields',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-01-09T14:15:00.000Z'),
      finishedAt: new Date('2026-01-09T14:15:01.000Z'),
    },
    {
      stepIndex: 2,
      stepName: 'fetch-asset-media',
      stepCategoryName: AI_RUN_STEP_CATEGORY.CODE.NAME,
      outcomeCode: 'succeeded',
      reasonCode: null,
      startedAt: new Date('2026-01-09T14:15:02.000Z'),
      finishedAt: new Date('2026-01-09T14:15:19.000Z'),
    },
    {
      stepIndex: 3,
      stepName: 'read-asset-media',
      stepCategoryName: AI_RUN_STEP_CATEGORY.AI.NAME,
      outcomeCode: 'abandoned',
      reasonCode: null,
      startedAt: new Date('2026-01-09T14:15:20.000Z'),
      finishedAt: new Date('2026-01-09T14:15:33.000Z'),
    },
  ],
}

/*
 * The body each canned run key answers with, before the step trace is added.
 *
 * Every field `.hora/contracts/1.0.0/client-api.md` names for `AiRunResponse` is present on every
 * one of them, and `steps` is absent from all five — it is added only by a request that asked for
 * it. `engine` is the pair `types/restfulapi/aiRunGet.d.ts` declares, and is a pair of nulls on a
 * run that has not reached a worker; `usage` counts what happened rather than what was planned,
 * which is why the canceled run reports what it spent up to the stop instead of zeros.
 */
const CANNED_AI_RUN_RESPONSE_HASH = {
  [CANNED_RUN_KEY.QUEUED]: {
    runKey: CANNED_RUN_KEY.QUEUED,
    runCategoryName: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.NAME,
    externalRef: 'external-ref-of-the-queued-canned-run',
    subjectLabel: 'A house on Nguyen Hue, not yet started',
    correlationId: 'correlation-id-of-the-queued-canned-run',
    statusName: AI_RUN_STATUS.QUEUED.NAME,
    engine: {
      label: null,
      confidenceMethodVersion: null,
    },
    usage: {
      modelCallCount: 0,
      inputTokenCount: 0,
      outputTokenCount: 0,
    },
    result: null,
    failure: null,
  },
  [CANNED_RUN_KEY.RUNNING]: {
    runKey: CANNED_RUN_KEY.RUNNING,
    runCategoryName: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.NAME,
    externalRef: 'external-ref-of-the-running-canned-run',
    subjectLabel: 'A warehouse on Le Loi, being read now',
    correlationId: 'correlation-id-of-the-running-canned-run',
    statusName: AI_RUN_STATUS.RUNNING.NAME,
    engine: {
      label: 'asset-media-extraction-loop@stub-model',
      confidenceMethodVersion: null,
    },
    usage: {
      modelCallCount: 1,
      inputTokenCount: 4820,
      outputTokenCount: 310,
    },
    result: null,
    failure: null,
  },
  [CANNED_RUN_KEY.SUCCEEDED]: {
    runKey: CANNED_RUN_KEY.SUCCEEDED,
    runCategoryName: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.NAME,
    externalRef: 'external-ref-of-the-succeeded-canned-run',
    subjectLabel: 'A townhouse on Tran Hung Dao, read from four photos',
    correlationId: 'correlation-id-of-the-succeeded-canned-run',
    statusName: AI_RUN_STATUS.SUCCEEDED.NAME,
    engine: {
      label: 'asset-media-extraction-loop@stub-model',
      confidenceMethodVersion: 'confidence-1.0.0',
    },
    usage: {
      modelCallCount: 3,
      inputTokenCount: 14650,
      outputTokenCount: 1284,
    },
    result: CANNED_ASSET_MEDIA_EXTRACTION_RESULT,
    failure: null,
  },
  [CANNED_RUN_KEY.FAILED]: {
    runKey: CANNED_RUN_KEY.FAILED,
    runCategoryName: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.NAME,
    externalRef: 'external-ref-of-the-failed-canned-run',
    subjectLabel: 'A shophouse on Hai Ba Trung, sent with too many photos',
    correlationId: 'correlation-id-of-the-failed-canned-run',
    statusName: AI_RUN_STATUS.FAILED.NAME,
    engine: {
      label: 'asset-media-extraction-loop@stub-model',
      confidenceMethodVersion: null,
    },
    usage: {
      modelCallCount: 0,
      inputTokenCount: 0,
      outputTokenCount: 0,
    },
    result: null,
    failure: {
      reasonCode: AI_RUN_FAILURE_REASON_CODE.MEDIA_LIMIT_EXCEEDED,
      parameters: {
        limitName: 'mediaCount',
        limitValue: 12,
        declaredValue: 17,
      },
    },
  },
  [CANNED_RUN_KEY.CANCELED]: {
    runKey: CANNED_RUN_KEY.CANCELED,
    runCategoryName: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.NAME,
    externalRef: 'external-ref-of-the-canceled-canned-run',
    subjectLabel: 'A villa on Dien Bien Phu, stopped part way',
    correlationId: 'correlation-id-of-the-canceled-canned-run',
    statusName: AI_RUN_STATUS.CANCELED.NAME,
    engine: {
      label: 'asset-media-extraction-loop@stub-model',
      confidenceMethodVersion: null,
    },
    usage: {
      modelCallCount: 2,
      inputTokenCount: 9240,
      outputTokenCount: 617,
    },
    result: null,
    failure: null,
  },
}

/*
 * The step trace, reached by the same key its body is.
 */
const CANNED_AI_RUN_STEPS_HASH = {
  [CANNED_RUN_KEY.QUEUED]: CANNED_AI_RUN_STEPS.QUEUED,
  [CANNED_RUN_KEY.RUNNING]: CANNED_AI_RUN_STEPS.RUNNING,
  [CANNED_RUN_KEY.SUCCEEDED]: CANNED_AI_RUN_STEPS.SUCCEEDED,
  [CANNED_RUN_KEY.FAILED]: CANNED_AI_RUN_STEPS.FAILED,
  [CANNED_RUN_KEY.CANCELED]: CANNED_AI_RUN_STEPS.CANCELED,
}

/**
 * Stub renderer: `GET /v1/ai-runs/:runKey`.
 *
 * **It answers canned bodies and reads nothing.** A stub exists so that anything building against
 * this operation can do so before the behaviour is written, and its whole job is to pin the shape
 * the contract fixes — so every value it returns is a literal, and it performs no database read,
 * no validation and no computation of its own.
 *
 * **The real renderer replaces this body, in this file, under this name.** The REST layer has no
 * `stub/` and `actual/` split the way the GraphQL layer does: the engine's `renderersPath` points
 * at one directory, and a route is whatever class the framework finds under it. So the migration a
 * GraphQL stub makes by moving folders, a REST stub makes by keeping its class name, its
 * `get:routePath` and its response shape while its body is rewritten — checkpoint 6 of
 * `#run-delivery`. The canned constants above go with the old body.
 *
 * **Its five keys are the five values of `statusName`.** A stub that answered one shape would
 * leave the other four to be met for the first time by whoever wires against the real route, which
 * is the one failure a stub exists to prevent. `?expand=steps` is the sixth shape, and every one
 * of the five answers it.
 *
 * **It declares no error envelope, and refuses nothing.** The contract's `404` for another
 * client's run is a decision that needs the run and the client, and neither is here; the engine's
 * own filter still answers `401` and `403` ahead of this class, because `get:passesFilter` is left
 * at its inherited `false`.
 *
 * @extends {BaseGetRenderer<*>}
 */
export default class AiRunGetRenderer extends BaseGetRenderer {
  /**
   * get: the route this renderer answers, under the engine's `/v1` prefix.
   *
   * @override
   * @returns {string} Route path.
   */
  static get routePath () {
    return '/ai-runs/:runKey'
  }

  /**
   * get: the body each canned run key answers with — a seam so tests can read it.
   *
   * @returns {Record<string, restfulapi.v1.AiRunResponse>} Canned response hash.
   */
  static get cannedAiRunResponseHash () {
    return CANNED_AI_RUN_RESPONSE_HASH
  }

  /**
   * get: the step trace each canned run key answers with — a seam so tests can read it.
   *
   * @returns {Record<string, Array<restfulapi.v1.AiRunStepResponse>>} Canned steps hash.
   */
  static get cannedAiRunStepsHash () {
    return CANNED_AI_RUN_STEPS_HASH
  }

  /**
   * get: the canned run a run key this stub does not name is answered as.
   *
   * @returns {string} Run key.
   */
  static get fallbackCannedRunKey () {
    return FALLBACK_CANNED_RUN_KEY
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @override
   * @returns {typeof AiRunGetRenderer} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunGetRenderer} */ (this.constructor)
  }

  /**
   * Render the canned answer for the run key the path names.
   *
   * @override
   * @param {RestfulApiType.RenderInput<null, *>} params - Parameters.
   * @returns {Promise<RestfulApiType.RenderResponse>} Response.
   * @public
   */
  async render ({
    query,
    request,
  }) {
    const runKey = this.extractRunKey({
      request,
    })

    const content = this.buildAiRunResponse({
      runKey,
      expand: query.expand,
    })

    return RestfulApiResponse.create({
      statusCode: SUCCESS_STATUS_CODE,
      content,
    })
  }

  /**
   * Extract the run key the path carries.
   *
   * @param {{
   *   request: *
   * }} params - Parameters.
   * @returns {string | null} Run key, or null when the path carried none.
   */
  extractRunKey ({
    request,
  }) {
    return request.pathParameterHash
      .runKey
  }

  /**
   * Build the body this request is answered with.
   *
   * @param {{
   *   runKey: string | null
   *   expand: *
   * }} params - Parameters.
   * @returns {restfulapi.v1.AiRunResponse} Response body.
   */
  buildAiRunResponse ({
    runKey,
    expand,
  }) {
    const cannedRunKey = this.extractCannedRunKey({
      runKey,
    })

    const cannedAiRunResponse = this.Ctor.cannedAiRunResponseHash[cannedRunKey]

    const stepsExpansion = this.buildStepsExpansion({
      cannedRunKey,
      expand,
    })

    return {
      ...cannedAiRunResponse,
      ...stepsExpansion,
    }
  }

  /**
   * Extract which of the canned runs a run key names.
   *
   * The found entry is read through its own `runKey` rather than tested for existence, so a key
   * that reaches a member of `Object.prototype` instead of a canned run falls back as any other
   * unknown key does.
   *
   * @param {{
   *   runKey: string | null
   * }} params - Parameters.
   * @returns {string} Canned run key.
   */
  extractCannedRunKey ({
    runKey,
  }) {
    const cannedAiRunResponse = this.Ctor.cannedAiRunResponseHash[runKey]

    return cannedAiRunResponse
      ?.runKey
      ?? this.Ctor.fallbackCannedRunKey
  }

  /**
   * Build the fields `?expand=` adds to the body, which is nothing unless steps were asked for.
   *
   * The hash is read by the value the caller sent, and the read is spread rather than returned.
   * That is what makes it total: a value this version does not answer to — a missing key, or a
   * member borrowed from `Object.prototype` — contributes no field, exactly as no `expand` at
   * all does.
   *
   * @param {{
   *   cannedRunKey: string
   *   expand: *
   * }} params - Parameters.
   * @returns {{
   *   steps?: Array<restfulapi.v1.AiRunStepResponse>
   * }} Expanded fields.
   */
  buildStepsExpansion ({
    cannedRunKey,
    expand,
  }) {
    const expansionHash = {
      [EXPAND_STEPS_QUERY_VALUE]: {
        steps: this.Ctor.cannedAiRunStepsHash[cannedRunKey],
      },
    }

    return {
      ...expansionHash[expand],
    }
  }
}
