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
 */

const TABLE_NAME = 'ai_runs'

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
    // scoping — the same request key as 10010001, under a different client
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
    accepted_at: new Date('2026-09-10T04:04:04.004Z'),
    started_at: new Date('2026-09-10T04:04:05.005Z'),
    finished_at: new Date('2026-09-10T04:04:06.006Z'),
  },
  {
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
    accepted_at: new Date('2026-09-10T05:05:05.005Z'),
    started_at: new Date('2026-09-10T05:05:06.006Z'),
    finished_at: new Date('2026-09-10T05:05:07.007Z'),
  },
  {
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
    accepted_at: new Date('2026-09-10T09:09:09.009Z'),
    started_at: new Date('2026-09-10T09:09:10.010Z'),
    finished_at: new Date('2026-09-10T09:09:11.011Z'),
  },
  {
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
    finished_at: new Date('2026-09-10T10:10:12.012Z'),
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
