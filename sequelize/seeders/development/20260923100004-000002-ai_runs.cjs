'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  AI_RUN_CATEGORY,
} = require('../../../constants/aiRunCategoryConstants.cjs')
const {
  AI_RUN_STATUS,
} = require('../../../constants/aiRunStatusConstants.cjs')

/*
 * Development fixtures: runs that already exist before a request arrives (specs/1.0.0,
 * #run-contract, `ai_runs`).
 *
 * They exist so that a repeated idempotency key has something to repeat. The request path decides
 * three things about a key it has seen before — it answers with the run the key already named, it
 * answers with that run's status as it now stands, and it refuses the key under a different body —
 * and none of the three can be read from an empty table.
 *
 * The rows that carry those cases:
 *
 *   - 10010001 a run of the active client, left `running`. A request repeating its key under the
 *              same body answers with this run, and the status it answers with proves the status
 *              was read rather than assumed to be the one a run is accepted with.
 *   - 10010002 a run of the same client under a different key. A request repeating that key under
 *              a body that is not the seeded one is refused `409`, and this row is left unchanged.
 *   - 10010003 the rotating client's run, carrying the *same* request key as 10010001. Idempotency
 *              is the pair of client and key, so the two coexist — and a lookup that forgot the
 *              client would find the wrong one of them.
 *
 * The rest fill in the five statuses and the other two clients, so a later reader has a run in
 * every state without adding a file.
 *
 * `request_body_hash` is never written by hand. Each row declares the body it was accepted with in
 * `raw_request_body`, and the digest is taken from it by `RequestBodyDigester` — the same class the
 * request path digests with. A literal hash here could disagree with what the application computes,
 * and the disagreement would look like a body mismatch rather than like a wrong fixture.
 *
 * The callback prefixes match the client that owns the run, under the reserved `.invalid` domain,
 * which never resolves.
 *
 * `engine_label` and `result_body` are carried by run 10010004 alone, and by no other row.
 *
 * They read null everywhere else because a run that never reached a worker records no engine, and
 * a run that has not succeeded writes no result — `.hora/contracts/1.0.0/client-api.md` states
 * `result` as null unless the run succeeded. 10010004 is the run every other fixture file already
 * treats as the whole one: four media all fetched and read, three readings, eight settled fields
 * and a seven-step trace. So it is the row that can carry a result body agreeing with all of them.
 *
 * 10010003 is the other run that succeeded, and it is left carrying neither. That is what keeps
 * "a succeeded run holding no engine label and no stored result" readable off a row rather than
 * off an entity written out in a test: with two succeeded runs in the file, filling both would
 * leave that answer unread. `AiRunStatusRecorder` accepts a succeeded run stating no result body,
 * and §19's purge empties the column on a run that once held one — so `result: null` under a
 * succeeded status is a state a client really meets, and one it cannot tell those two apart by
 * ([[Q112]]).
 *
 * This row is not itself a purged one — `content_purged_at` is null on it and its request body is
 * still here — and its own settled fields would let it carry a result. Filling it is the obvious
 * next move if a second row carrying the two columns is ever wanted.
 *
 * `failure_parameters` is null on both failed rows, and that is the contract's answer rather than
 * a gap. `MEDIA_LIMIT_EXCEEDED` is the one reason code of the seven that carries parameters at all
 * ([[Q103]]), and neither failed row carries it: 10010005 failed under `MEDIA_UNREADABLE` and
 * 10010009 under `PROVIDER_CALL_FAILED`, and the contract names no parameters for either. Writing
 * some anyway would put a payload on the wire that nothing states the shape of.
 */

const TABLE_NAME = 'ai_runs'

/*
 * What produced run 10010004's result: the loop of section 20 and the model it ran against.
 *
 * `ai_models` holds one row in a default installation — the deterministic stub, which is how "no
 * key is read and no outbound connection is opened" is expressed as data. So the label names that
 * model, and the three readings of `20260926110004-000009-ai_model_calls.cjs` are its calls.
 */
const ENGINE_LABEL_OF_RUN_10010004 = 'asset-media-extraction-loop@stub'

/*
 * What run 10010004 returned, in the shape section 20 declares: one entry per field it settled,
 * the required paths no majority settled, what was fetched and could not be read, and the
 * signature echoed back.
 *
 * Every entry agrees with the row that settled it in
 * `20260925110002-000005-ai_run_field_outcomes.cjs` — the same six paths, the same states, the
 * same scores and the same agreement counts — and `missingFieldPaths` is that file's two `missing`
 * rows for this run. A body written free of them would make one run answer two ways about its own
 * fields, and an operator tracing a field from the body to the row it was scored on would find
 * them disagreeing.
 *
 * `sourceMediaKeys` names media of this run alone, from
 * `20260926110001-000006-ai_run_media.cjs`, so a body that borrowed another run's key would be
 * visible as one. `unreadableMediaKeys` is empty because all four of this run's media were fetched
 * and read — the unreadable medium in the fixture set belongs to 10010003.
 *
 * The two entries scored on a category prior name no medium at all: their value rests on what the
 * asset's category implies rather than on anything in a photo, and `sourceMediaKeys` says so by
 * being empty rather than by citing a photo the value did not come from.
 *
 * `suggestionConfidence` is a JSON number and not the string a `DECIMAL(5, 4)` column answers with
 * ([[Q98]]). This body is the service's own rendering and is handed back as it was written, so the
 * number form a client reads is decided here.
 */
const RESULT_BODY_OF_RUN_10010004 = JSON.stringify({
  fields: [
    {
      path: 'attributes.floorArea',
      value: '86.5',
      fieldStateName: 'extracted',
      suggestionConfidence: 1,
      reason: 'The floor area is printed on the plan itself.',
      sourceMediaKeys: [
        'media-key-floor-plan',
      ],
      agreement: {
        agreedReadingCount: 3,
        totalReadingCount: 3,
      },
    },
    {
      path: 'attributes.bedroomCount',
      value: '3',
      fieldStateName: 'extracted',
      suggestionConfidence: 0.84,
      reason: 'Three rooms are marked as bedrooms on the plan.',
      sourceMediaKeys: [
        'media-key-floor-plan',
        'media-key-living-room',
      ],
      agreement: {
        agreedReadingCount: 2,
        totalReadingCount: 3,
      },
    },
    {
      path: 'attributes.facadeWidth',
      value: '4.2',
      fieldStateName: 'derived',
      suggestionConfidence: 0.65,
      reason: 'Estimated from the front of the building against the doorway beside it.',
      sourceMediaKeys: [
        'media-key-front-elevation',
      ],
      agreement: {
        agreedReadingCount: 4,
        totalReadingCount: 5,
      },
    },
    {
      path: 'attributes.roadWidth',
      value: '7.5',
      fieldStateName: 'derived',
      suggestionConfidence: 0.51,
      reason: 'Estimated from the two parked cars across the road in front.',
      sourceMediaKeys: [
        'media-key-front-elevation',
        'media-key-balcony-view',
      ],
      agreement: {
        agreedReadingCount: 2,
        totalReadingCount: 3,
      },
    },
    {
      path: 'attributes.legalStatusSlug',
      value: 'legal-status-full-title',
      fieldStateName: 'suggested',
      suggestionConfidence: 0.33,
      reason: 'Taken from what this asset category usually holds, with no document photographed.',
      sourceMediaKeys: [],
      agreement: {
        agreedReadingCount: 3,
        totalReadingCount: 5,
      },
    },
    {
      path: 'attributes.furnishingSlug',
      value: 'furnishing-fully-fitted',
      fieldStateName: 'suggested',
      suggestionConfidence: 0.0125,
      reason: 'Taken from the asset category alone, and agreed on by the barest majority.',
      sourceMediaKeys: [],
      agreement: {
        agreedReadingCount: 2,
        totalReadingCount: 3,
      },
    },
  ],
  missingFieldPaths: [
    'attributes.balconyDirectionSlug',
    'attributes.buildYear',
  ],
  unreadableMediaKeys: [],
  mediaSignature: 'media-signature-10010004',
})

const aiRunSeeds = [
  {
    // repeat — answered with this run, and with `running` as its status
    id: 10010001,
    api_client_id: 10000001,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.RUNNING.ID,
    run_key: 'run-key-10010001',
    request_key: 'request-key-repeat-10010001',
    raw_request_body: '{"externalRef":"external-ref-10010001","subjectLabel":"Subject label of run 10010001","correlationId":"correlation-id-10010001","callbackUrl":"https://signing.client.development.invalid/callbacks/10010001"}',
    external_ref: 'external-ref-10010001',
    subject_label: 'Subject label of run 10010001',
    correlation_id: 'correlation-id-10010001',
    callback_url: 'https://signing.client.development.invalid/callbacks/10010001',
    accepted_at: new Date('2026-09-10T01:01:01.001Z'),
    started_at: new Date('2026-09-10T01:01:02.002Z'),
    finished_at: null,
  },
  {
    // mismatch — a request repeating this key under another body is refused 409
    id: 10010002,
    api_client_id: 10000001,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.QUEUED.ID,
    run_key: 'run-key-10010002',
    request_key: 'request-key-mismatch-10010002',
    raw_request_body: '{"externalRef":"external-ref-10010002","subjectLabel":"Subject label of run 10010002","correlationId":"correlation-id-10010002","callbackUrl":"https://signing.client.development.invalid/callbacks/10010002"}',
    external_ref: 'external-ref-10010002',
    subject_label: 'Subject label of run 10010002',
    correlation_id: 'correlation-id-10010002',
    callback_url: 'https://signing.client.development.invalid/callbacks/10010002',
    accepted_at: new Date('2026-09-10T02:02:02.002Z'),
    started_at: null,
    finished_at: null,
  },
  {
    // scoping — the same request key as 10010001, under a different client. It is also the
    // succeeded run left carrying no engine label and no result body, so that answer is read off
    // a row too
    id: 10010003,
    api_client_id: 10000002,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.SUCCEEDED.ID,
    run_key: 'run-key-10010003',
    request_key: 'request-key-repeat-10010001',
    raw_request_body: '{"externalRef":"external-ref-10010003","subjectLabel":"Subject label of run 10010003","correlationId":"correlation-id-10010003","callbackUrl":"https://rotating.client.development.invalid/callbacks/10010003"}',
    external_ref: 'external-ref-10010003',
    subject_label: 'Subject label of run 10010003',
    correlation_id: 'correlation-id-10010003',
    callback_url: 'https://rotating.client.development.invalid/callbacks/10010003',
    accepted_at: new Date('2026-09-10T03:03:03.003Z'),
    started_at: new Date('2026-09-10T03:03:04.004Z'),
    finished_at: new Date('2026-09-10T03:03:05.005Z'),
  },
  {
    // succeeded, and the one row carrying an engine label and a result body. Its result agrees
    // field for field with the rows that settled them
    id: 10010004,
    api_client_id: 10000001,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.SUCCEEDED.ID,
    run_key: 'run-key-10010004',
    request_key: 'request-key-succeeded-10010004',
    raw_request_body: '{"externalRef":"external-ref-10010004","subjectLabel":"Subject label of run 10010004","correlationId":"correlation-id-10010004","callbackUrl":"https://signing.client.development.invalid/callbacks/10010004"}',
    external_ref: 'external-ref-10010004',
    subject_label: 'Subject label of run 10010004',
    correlation_id: 'correlation-id-10010004',
    callback_url: 'https://signing.client.development.invalid/callbacks/10010004',
    engine_label: ENGINE_LABEL_OF_RUN_10010004,
    result_body: RESULT_BODY_OF_RUN_10010004,
    accepted_at: new Date('2026-09-10T04:04:04.004Z'),
    started_at: new Date('2026-09-10T04:04:05.005Z'),
    finished_at: new Date('2026-09-10T04:04:06.006Z'),
  },
  {
    // failed — and says why, in the code its own step trace fails with (`media-unreadable`)
    id: 10010005,
    api_client_id: 10000001,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.FAILED.ID,
    run_key: 'run-key-10010005',
    request_key: 'request-key-failed-10010005',
    raw_request_body: '{"externalRef":"external-ref-10010005","subjectLabel":"Subject label of run 10010005","correlationId":"correlation-id-10010005","callbackUrl":"https://signing.client.development.invalid/callbacks/10010005"}',
    external_ref: 'external-ref-10010005',
    subject_label: 'Subject label of run 10010005',
    correlation_id: 'correlation-id-10010005',
    callback_url: 'https://signing.client.development.invalid/callbacks/10010005',
    failure_reason_code: 'MEDIA_UNREADABLE',
    accepted_at: new Date('2026-09-10T05:05:05.005Z'),
    started_at: new Date('2026-09-10T05:05:06.006Z'),
    finished_at: new Date('2026-09-10T05:05:07.007Z'),
  },
  {
    // canceled — asked for and taken effect 400 milliseconds apart, which is the gap two separate
    // columns are kept to measure
    id: 10010006,
    api_client_id: 10000001,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.CANCELED.ID,
    run_key: 'run-key-10010006',
    request_key: 'request-key-canceled-10010006',
    raw_request_body: '{"externalRef":"external-ref-10010006","subjectLabel":"Subject label of run 10010006","correlationId":"correlation-id-10010006","callbackUrl":"https://signing.client.development.invalid/callbacks/10010006"}',
    external_ref: 'external-ref-10010006',
    subject_label: 'Subject label of run 10010006',
    correlation_id: 'correlation-id-10010006',
    callback_url: 'https://signing.client.development.invalid/callbacks/10010006',
    accepted_at: new Date('2026-09-10T06:06:06.006Z'),
    started_at: new Date('2026-09-10T06:06:07.007Z'),
    finished_at: new Date('2026-09-10T06:06:08.008Z'),
    cancel_requested_at: new Date('2026-09-10T06:06:07.307Z'),
    canceled_at: new Date('2026-09-10T06:06:07.707Z'),
  },
  {
    id: 10010007,
    api_client_id: 10000002,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.QUEUED.ID,
    run_key: 'run-key-10010007',
    request_key: 'request-key-queued-10010007',
    raw_request_body: '{"externalRef":"external-ref-10010007","subjectLabel":"Subject label of run 10010007","correlationId":"correlation-id-10010007","callbackUrl":"https://rotating.client.development.invalid/callbacks/10010007"}',
    external_ref: 'external-ref-10010007',
    subject_label: 'Subject label of run 10010007',
    correlation_id: 'correlation-id-10010007',
    callback_url: 'https://rotating.client.development.invalid/callbacks/10010007',
    accepted_at: new Date('2026-09-10T07:07:07.007Z'),
    started_at: null,
    finished_at: null,
  },
  {
    id: 10010008,
    api_client_id: 10000002,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.RUNNING.ID,
    run_key: 'run-key-10010008',
    request_key: 'request-key-running-10010008',
    raw_request_body: '{"externalRef":"external-ref-10010008","subjectLabel":"Subject label of run 10010008","correlationId":"correlation-id-10010008","callbackUrl":"https://rotating.client.development.invalid/callbacks/10010008"}',
    external_ref: 'external-ref-10010008',
    subject_label: 'Subject label of run 10010008',
    correlation_id: 'correlation-id-10010008',
    callback_url: 'https://rotating.client.development.invalid/callbacks/10010008',
    accepted_at: new Date('2026-09-10T08:08:08.008Z'),
    started_at: new Date('2026-09-10T08:08:09.009Z'),
    finished_at: null,
  },
  {
    // failed for a reason that is not the media's, so the column is read varying rather than fixed
    id: 10010009,
    api_client_id: 10000003,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.FAILED.ID,
    run_key: 'run-key-10010009',
    request_key: 'request-key-inactive-10010009',
    raw_request_body: '{"externalRef":"external-ref-10010009","subjectLabel":"Subject label of run 10010009","correlationId":"correlation-id-10010009","callbackUrl":"https://switched-off.client.development.invalid/callbacks/10010009"}',
    external_ref: 'external-ref-10010009',
    subject_label: 'Subject label of run 10010009',
    correlation_id: 'correlation-id-10010009',
    callback_url: 'https://switched-off.client.development.invalid/callbacks/10010009',
    failure_reason_code: 'PROVIDER_CALL_FAILED',
    accepted_at: new Date('2026-09-10T09:09:09.009Z'),
    started_at: new Date('2026-09-10T09:09:10.010Z'),
    finished_at: new Date('2026-09-10T09:09:11.011Z'),
  },
  {
    // canceled — 2.7 seconds apart, so the gap reads as a measurement rather than as a constant.
    // `finished_at` follows the instant it took effect, because that is when the work stopped.
    id: 10010010,
    api_client_id: 10000003,
    ai_run_category_id: AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID,
    ai_run_status_id: AI_RUN_STATUS.CANCELED.ID,
    run_key: 'run-key-10010010',
    request_key: 'request-key-canceled-10010010',
    raw_request_body: '{"externalRef":"external-ref-10010010","subjectLabel":"Subject label of run 10010010","correlationId":"correlation-id-10010010","callbackUrl":"https://switched-off.client.development.invalid/callbacks/10010010"}',
    external_ref: 'external-ref-10010010',
    subject_label: 'Subject label of run 10010010',
    correlation_id: 'correlation-id-10010010',
    callback_url: 'https://switched-off.client.development.invalid/callbacks/10010010',
    accepted_at: new Date('2026-09-10T10:10:10.010Z'),
    started_at: new Date('2026-09-10T10:10:11.011Z'),
    finished_at: new Date('2026-09-10T10:10:14.514Z'),
    cancel_requested_at: new Date('2026-09-10T10:10:11.511Z'),
    canceled_at: new Date('2026-09-10T10:10:14.211Z'),
  },
]

/**
 * Create the digester the seeded bodies are hashed by.
 *
 * `RequestBodyDigester` is an ES module and a seeder is CommonJS, so it is reached by a dynamic
 * import rather than `require`. Digesting through it — rather than writing a literal hash into the
 * row — leaves one implementation of the digest, shared with the request path that compares it.
 *
 * @returns {Promise<import('../../../app/aiRun/RequestBodyDigester.js').default>} Digester.
 */
async function createRequestBodyDigester () {
  const {
    default: RequestBodyDigester,
  } = await import('../../../app/aiRun/RequestBodyDigester.js')

  return RequestBodyDigester.create()
}

/**
 * Fulfill a seed row, replacing the body it declares in the clear with the columns stored.
 *
 * @param {{
 *   seed: {[key: string]: *}
 *   digester: import('../../../app/aiRun/RequestBodyDigester.js').default
 * }} params - Parameters.
 * @returns {{[key: string]: *}} Row to insert.
 */
function fulfillRequestBodyHash ({
  seed,
  digester,
}) {
  const {
    raw_request_body: rawRequestBody,
    ...storedFields
  } = seed

  const requestBodyHash = digester.digestRequestBody({
    rawBody: rawRequestBody,
  })

  return {
    ...storedFields,
    request_body: rawRequestBody,
    request_body_hash: requestBodyHash,
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const digester = await createRequestBodyDigester()

    const fulfilledSeeds = aiRunSeeds.map(it =>
      fulfillRequestBodyHash({
        seed: it,
        digester,
      })
    )

    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(fulfilledSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: aiRunSeeds.map(it => it.id) })
  },
}
