import AiRunCancellationPostRenderer from '../../../server/restfulapi/renderers/v1/post/AiRunCancellationPostRenderer.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * The route §15 declares, read end to end: a run key out of the path, a client out of the
 * resolved signature, and the body a client really receives.
 *
 * **Nothing is stubbed.** The registrar, the recorder and the row all run for real, so what is
 * asserted below is an answer this application assembled out of `ai_runs` rather than one a mock
 * was told to give.
 *
 * Every run here is created by this file, in `#run-cancel`'s own id block (`10830001` upward;
 * `10839001` upward is never created, so a not-found case has something to ask after that no run
 * will ever answer). The development seeders hold runs in all five statuses, and a route that
 * wrote `cancel_requested_at` onto one of them would change what `#run-contract`'s own tests read.
 * The id map for the whole block is in `AiRunCancellationRegistrar.js` beside this file.
 *
 * **The client is a plain object.** `AppRestfulApiContext` resolves one from a signed request,
 * which a renderer test has no request to present; this renderer reads two fields off the context,
 * and those are what the cases supply. The resolution itself has its own test file.
 */

describe('AiRunCancellationPostRenderer', () => {
  describe('#render()', () => {
    /*
     * A run still going answers `202` with where it still is. The status is not `canceled`,
     * because nothing has been canceled yet: the request is recorded and the run stops at its next
     * step boundary, which is the second acceptance criterion and is the worker's to keep.
     */
    describe('when the client owns a run that is still going', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10830001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10830001',
              requestKey: 'request-key-10830001',
              requestBodyHash: 'request-body-hash-10830001',
              externalRef: 'external-ref-10830001',
              subjectLabel: 'Subject label of run 10830001',
              correlationId: 'correlation-id-10830001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10830001',
              acceptedAt: new Date('2026-11-21T01:01:01.001Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            now: new Date('2026-11-21T01:01:11.011Z'),
          },
          expected: {
            statusCode: 202,
            headers: {},
            content: {
              statusName: 'queued',
            },
            error: null,
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10830002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10830002',
              requestKey: 'request-key-10830002',
              requestBodyHash: 'request-body-hash-10830002',
              externalRef: 'external-ref-10830002',
              subjectLabel: 'Subject label of run 10830002',
              correlationId: 'correlation-id-10830002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10830002',
              acceptedAt: new Date('2026-11-22T02:02:02.002Z'),
              startedAt: new Date('2026-11-22T02:02:03.003Z'),
              finishedAt: null,
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            now: new Date('2026-11-22T02:02:22.022Z'),
          },
          expected: {
            statusCode: 202,
            headers: {},
            content: {
              statusName: 'running',
            },
            error: null,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const renderer = AiRunCancellationPostRenderer.create()
        const args = {
          body: {},
          context: {
            apiClientId: input.apiClientId,
            now: input.now,
          },
          request: {
            pathParameterHash: {
              runKey: input.aiRunRow.runKey,
            },
          },
        }

        const received = await renderer.render(args)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The fifth acceptance criterion, on the wire and for all three terminal statuses: canceling a
     * run that has already reached one "returns that state, not an error". The status stays `202`
     * — the caller reads the state in `statusName`, which is where the contract puts it, and not
     * in the HTTP status, which cannot tell a first ask from a fifth and does not need to.
     */
    describe('when the client owns a run that has already settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10830011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10830011',
              requestKey: 'request-key-10830011',
              requestBodyHash: 'request-body-hash-10830011',
              externalRef: 'external-ref-10830011',
              subjectLabel: 'Subject label of run 10830011',
              correlationId: 'correlation-id-10830011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10830011',
              acceptedAt: new Date('2026-11-23T03:03:03.003Z'),
              startedAt: new Date('2026-11-23T03:03:04.004Z'),
              finishedAt: new Date('2026-11-23T03:03:05.005Z'),
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            now: new Date('2026-11-23T03:03:33.033Z'),
          },
          expected: {
            statusCode: 202,
            headers: {},
            content: {
              statusName: 'succeeded',
            },
            error: null,
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10830012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10830012',
              requestKey: 'request-key-10830012',
              requestBodyHash: 'request-body-hash-10830012',
              externalRef: 'external-ref-10830012',
              subjectLabel: 'Subject label of run 10830012',
              correlationId: 'correlation-id-10830012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10830012',
              acceptedAt: new Date('2026-11-24T04:04:04.004Z'),
              startedAt: new Date('2026-11-24T04:04:05.005Z'),
              finishedAt: new Date('2026-11-24T04:04:06.006Z'),
              cancelRequestedAt: null,
            },
            apiClientId: 10000001,
            now: new Date('2026-11-24T04:04:44.044Z'),
          },
          expected: {
            statusCode: 202,
            headers: {},
            content: {
              statusName: 'failed',
            },
            error: null,
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10830013,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-10830013',
              requestKey: 'request-key-10830013',
              requestBodyHash: 'request-body-hash-10830013',
              externalRef: 'external-ref-10830013',
              subjectLabel: 'Subject label of run 10830013',
              correlationId: 'correlation-id-10830013',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10830013',
              acceptedAt: new Date('2026-11-25T05:05:05.005Z'),
              startedAt: new Date('2026-11-25T05:05:06.006Z'),
              finishedAt: new Date('2026-11-25T05:05:08.008Z'),
              cancelRequestedAt: new Date('2026-11-25T05:05:07.007Z'),
            },
            apiClientId: 10000001,
            now: new Date('2026-11-25T05:05:55.055Z'),
          },
          expected: {
            statusCode: 202,
            headers: {},
            content: {
              statusName: 'canceled',
            },
            error: null,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunRow.id', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const renderer = AiRunCancellationPostRenderer.create()
        const args = {
          body: {},
          context: {
            apiClientId: input.apiClientId,
            now: input.now,
          },
          request: {
            pathParameterHash: {
              runKey: input.aiRunRow.runKey,
            },
          },
        }

        const received = await renderer.render(args)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The sixth and eighth acceptance criteria, and the reason every case below carries the same
     * `expected` object.
     *
     * Two of these run keys name a run that really exists and really belongs to another client;
     * two name nothing at all. All four are answered with one status, one body and one wording, so
     * a caller holding somebody else's run key learns exactly what a caller holding a key nothing
     * carries learns: nothing. A `403`, or a `404` worded differently, would confirm that another
     * client's run exists — which is why the sixth criterion's "any other caller is refused" and
     * the eighth's "answers as though the run did not exist" are one refusal here and not two.
     *
     * The other half of the eighth criterion — that the run is left unchanged — is asserted on the
     * recorder in `AiRunCancellationRegistrar.js`, where the seam that would have written to it
     * can be shown never to be reached.
     */
    describe('when the client owns no run under that key', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10830021,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 1, // AI_RUN_STATUS.QUEUED.ID
              runKey: 'run-key-10830021',
              requestKey: 'request-key-10830021',
              requestBodyHash: 'request-body-hash-10830021',
              externalRef: 'external-ref-10830021',
              subjectLabel: 'Subject label of run 10830021',
              correlationId: 'correlation-id-10830021',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10830021',
              acceptedAt: new Date('2026-11-26T06:06:06.006Z'),
              startedAt: null,
              finishedAt: null,
              cancelRequestedAt: null,
            },
            runKey: 'run-key-10830021',
            apiClientId: 10000001,
            now: new Date('2026-11-26T06:06:26.026Z'),
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10830022,
              ApiClientId: 10000002,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10830022',
              requestKey: 'request-key-10830022',
              requestBodyHash: 'request-body-hash-10830022',
              externalRef: 'external-ref-10830022',
              subjectLabel: 'Subject label of run 10830022',
              correlationId: 'correlation-id-10830022',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10830022',
              acceptedAt: new Date('2026-11-27T07:07:07.007Z'),
              startedAt: new Date('2026-11-27T07:07:08.008Z'),
              finishedAt: null,
              cancelRequestedAt: null,
            },
            runKey: 'run-key-10830022',
            apiClientId: 10000001,
            now: new Date('2026-11-27T07:07:27.027Z'),
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow)

        const renderer = AiRunCancellationPostRenderer.create()
        const expected = {
          statusCode: 404,
          headers: {},
          content: null,
          error: {
            message: 'AI run not found',
          },
        }
        const args = {
          body: {},
          context: {
            apiClientId: input.apiClientId,
            now: input.now,
          },
          request: {
            pathParameterHash: {
              runKey: input.runKey,
            },
          },
        }

        const received = await renderer.render(args)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The same refusal, from a key no run carries and from a path that carried no key at all.
     * `null` is what the framework's path-parameter proxy answers for a key the path did not
     * carry, so it is the value this route really meets rather than one invented here.
     */
    describe('when no run carries the key at all', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10839001',
            apiClientId: 10000001,
            now: new Date('2026-11-28T08:08:08.008Z'),
          },
        },
        {
          input: {
            runKey: null,
            apiClientId: 10000001,
            now: new Date('2026-11-30T10:10:10.010Z'),
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const renderer = AiRunCancellationPostRenderer.create()
        const expected = {
          statusCode: 404,
          headers: {},
          content: null,
          error: {
            message: 'AI run not found',
          },
        }
        const args = {
          body: {},
          context: {
            apiClientId: input.apiClientId,
            now: input.now,
          },
          request: {
            pathParameterHash: {
              runKey: input.runKey,
            },
          },
        }

        const received = await renderer.render(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
