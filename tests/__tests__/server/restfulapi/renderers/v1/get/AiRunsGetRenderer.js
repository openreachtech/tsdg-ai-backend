import AiRunsGetRenderer from '../../../../../../../server/restfulapi/renderers/v1/get/AiRunsGetRenderer.js'

import {
  BaseGetRenderer,
} from '@openreachtech/renchan'

import AiRunPageResponseBuilder from '../../../../../../../app/aiRun/AiRunPageResponseBuilder.js'
import AiRunsQueryInputAdapter from '../../../../../../../app/adapter/forRenderer/AiRunsQueryInputAdapter.js'
import AiRunsQueryInputValidator from '../../../../../../../app/validator/forRenderer/AiRunsQueryInputValidator.js'

/*
 * The route section 13 declares, read end to end against the development seeders.
 *
 * **Nothing is mocked and nothing is written.** Every run below is a seeded row, read through the
 * real adapter, the real validator and the real `AiRunPageResponseBuilder`. Stubbing the builder
 * would have proved that the renderer calls something and nothing about what a client reads.
 *
 * **The query arrives as text, because that is how a query string arrives.** Every value in the
 * cases below is the string Express would hand over — `'4'` and not `4` — so the reading of a
 * count out of text is exercised here rather than assumed.
 *
 * **The client is a number and the clock is a value.** `AppRestfulApiContext` resolves both from
 * the request before this class is reached; the renderer reads two fields off the context, and
 * the cases supply them. The resolution has its own test file.
 */

describe('AiRunsGetRenderer', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AiRunsGetRenderer.prototype

      expect(received)
        .toBeInstanceOf(BaseGetRenderer)
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('.get:routePath', () => {
    describe('when called as is', () => {
      test('should be the route the contract fixes', () => {
        const received = AiRunsGetRenderer.routePath

        expect(received)
          .toBe('/ai-runs')
      })
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('.get:method', () => {
    describe('when called as is', () => {
      test('should be the HTTP method of the route', () => {
        const received = AiRunsGetRenderer.method

        expect(received)
          .toBe('get')
      })
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('.get:errorStructureHash', () => {
    /*
     * One refusal per parameter the request may carry, and all of them the contract's `422`. The
     * whole hash is compared rather than picked at, because what this route may answer with is
     * exactly this list — an entry added without a rule behind it, or a rule added without an
     * entry, is a refusal nothing can reach or a crash where a refusal belongs.
     */
    describe('when called as is', () => {
      test('should declare one refusal per parameter', () => {
        const expected = {
          InvalidStatusName: {
            statusCode: 422,
            errorMessage: 'Invalid status name',
          },
          InvalidRunCategoryName: {
            statusCode: 422,
            errorMessage: 'Invalid run category name',
          },
          InvalidCorrelationId: {
            statusCode: 422,
            errorMessage: 'Invalid correlation id',
          },
          InvalidStalledForSeconds: {
            statusCode: 422,
            errorMessage: 'Invalid stalled for seconds',
          },
          InvalidLimit: {
            statusCode: 422,
            errorMessage: 'Invalid limit',
          },
          InvalidCursor: {
            statusCode: 422,
            errorMessage: 'Invalid cursor',
          },
        }

        const received = AiRunsGetRenderer.errorStructureHash

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('.get:AiRunPageResponseBuilderCtor', () => {
    describe('when called as is', () => {
      test('should be the builder a CLI shares the row with', () => {
        const received = AiRunsGetRenderer.AiRunPageResponseBuilderCtor

        expect(received)
          .toBe(AiRunPageResponseBuilder) // same reference
      })
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('.createAiRunPageResponseBuilder()', () => {
    describe('when called as is', () => {
      test('should be an instance of the builder', () => {
        const received = AiRunsGetRenderer.createAiRunPageResponseBuilder()

        expect(received)
          .toBeInstanceOf(AiRunPageResponseBuilder)
      })
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('#createInputAdapter()', () => {
    describe('should be an instance of the adapter', () => {
      const cases = [
        {
          input: {
            query: {
              limit: '4',
            },
          },
        },
        {
          input: {
            query: {
              statusName: 'running',
            },
          },
        },
      ]

      test.each(cases)('query: $input.query', ({
        input,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = renderer.createInputAdapter(input)

        expect(received)
          .toBeInstanceOf(AiRunsQueryInputAdapter)
      })
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('#createInputValidator()', () => {
    describe('should be an instance of the validator', () => {
      const cases = [
        {
          input: {
            input: {
              statusName: 'running',
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: null,
              cursor: null,
            },
          },
        },
        {
          input: {
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 4,
              cursor: null,
            },
          },
        },
      ]

      test.each(cases)('statusName: $input.input.statusName', ({
        input,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = renderer.createInputValidator(input)

        expect(received)
          .toBeInstanceOf(AiRunsQueryInputValidator)
      })
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('#validateInput()', () => {
    describe('should answer with the refusal the failing rule names', () => {
      const cases = [
        {
          input: {
            input: {
              statusName: 'runing',
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: null,
              cursor: null,
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid status name',
            },
          },
        },
        {
          input: {
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 101,
              cursor: null,
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid limit',
            },
          },
        },
      ]

      test.each(cases)('statusName: $input.input.statusName', ({
        input,
        expected,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = renderer.validateInput(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should answer with nothing when every rule passed', () => {
      const cases = [
        {
          input: {
            input: {
              statusName: 'running',
              runCategoryName: 'asset-media-extraction',
              correlationId: 'correlation-id-10700000',
              stalledForSeconds: 300,
              limit: 4,
              cursor: 'cnVuLWtleS0xMDAxMDAwMQ',
            },
          },
        },
        {
          input: {
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: null,
              cursor: null,
            },
          },
        },
      ]

      test.each(cases)('statusName: $input.input.statusName', ({
        input,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = renderer.validateInput(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunsGetRenderer', () => {
  describe('#render()', () => {
    /*
     * The first, third, fifth and eighth acceptance criteria of section 13, read through the
     * route a client actually calls: only this client's runs come back, each row carries the
     * subject label, the kind, the status, the elapsed time and the token spend, and the label is
     * exactly what the caller supplied.
     *
     * The second criterion is here too. Run 10010001 has finished two of its three steps, and the
     * row answers with the second — the third is still open and is not "the last step that
     * completed". Run 10010002 has finished none, and answers null for it.
     */
    describe('when the client asked for a page of its own runs', () => {
      const cases = [
        {
          input: {
            query: {
              limit: '2',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runs: [
                {
                  runKey: 'run-key-10700003',
                  runCategoryName: 'asset-media-extraction',
                  subjectLabel: 'Subject label of run 10700003',
                  correlationId: 'correlation-id-10700000',
                  externalRef: 'external-ref-10700003',
                  statusName: 'queued',
                  lastCompletedStep: null,
                  elapsedSeconds: 7193,
                  modelCallCount: 0,
                  inputTokenCount: 0,
                  outputTokenCount: 0,
                  acceptedAt: new Date('2026-09-14T03:00:06.006Z'),
                },
                {
                  runKey: 'run-key-10700002',
                  runCategoryName: 'asset-media-extraction',
                  subjectLabel: 'Subject label of run 10700002',
                  correlationId: 'correlation-id-10700000',
                  externalRef: 'external-ref-10700002',
                  statusName: 'running',
                  lastCompletedStep: null,
                  elapsedSeconds: 10795,
                  modelCallCount: 0,
                  inputTokenCount: 0,
                  outputTokenCount: 0,
                  acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
                },
              ],
              nextCursor: 'cnVuLWtleS0xMDcwMDAwMg', // run-key-10700002
            },
            error: null,
          },
        },
        {
          input: {
            query: {
              statusName: 'running',
              limit: '20',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runs: [
                {
                  runKey: 'run-key-10700002',
                  runCategoryName: 'asset-media-extraction',
                  subjectLabel: 'Subject label of run 10700002',
                  correlationId: 'correlation-id-10700000',
                  externalRef: 'external-ref-10700002',
                  statusName: 'running',
                  lastCompletedStep: null,
                  elapsedSeconds: 10795,
                  modelCallCount: 0,
                  inputTokenCount: 0,
                  outputTokenCount: 0,
                  acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
                },
                {
                  runKey: 'run-key-10010001',
                  runCategoryName: 'asset-media-extraction',
                  subjectLabel: 'Subject label of run 10010001',
                  correlationId: 'correlation-id-10010001',
                  externalRef: 'external-ref-10010001',
                  statusName: 'running',
                  lastCompletedStep: {
                    stepName: 'fetch-media',
                    stepIndex: 2,
                  },
                  elapsedSeconds: 359938,
                  modelCallCount: 1,
                  inputTokenCount: 1609,
                  outputTokenCount: 199,
                  acceptedAt: new Date('2026-09-10T01:01:01.001Z'),
                },
              ],
              nextCursor: null,
            },
            error: null,
          },
        },
        {
          // the correlation filter, asked as a client really asks it
          input: {
            query: {
              correlationId: 'correlation-id-10010004',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runs: [
                {
                  runKey: 'run-key-10010004',
                  runCategoryName: 'asset-media-extraction',
                  subjectLabel: 'Subject label of run 10010004',
                  correlationId: 'correlation-id-10010004',
                  externalRef: 'external-ref-10010004',
                  statusName: 'succeeded',
                  lastCompletedStep: {
                    stepName: 'await-owner-decision',
                    stepIndex: 7,
                  },
                  elapsedSeconds: 2,
                  modelCallCount: 3,
                  inputTokenCount: 14406, // 4801 + 4802 + 4803
                  outputTokenCount: 966, // 311 + 322 + 333
                  acceptedAt: new Date('2026-09-10T04:04:04.004Z'),
                },
              ],
              nextCursor: null,
            },
            error: null,
          },
        },
        {
          // another client's run key would be in this page were the scope not bound from the
          // signature: 10700004 carries the same correlation id and belongs to 10000002
          input: {
            query: {
              correlationId: 'correlation-id-10700000',
              limit: '20',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runs: [
                {
                  runKey: 'run-key-10700003',
                  runCategoryName: 'asset-media-extraction',
                  subjectLabel: 'Subject label of run 10700003',
                  correlationId: 'correlation-id-10700000',
                  externalRef: 'external-ref-10700003',
                  statusName: 'queued',
                  lastCompletedStep: null,
                  elapsedSeconds: 7193,
                  modelCallCount: 0,
                  inputTokenCount: 0,
                  outputTokenCount: 0,
                  acceptedAt: new Date('2026-09-14T03:00:06.006Z'),
                },
                {
                  runKey: 'run-key-10700002',
                  runCategoryName: 'asset-media-extraction',
                  subjectLabel: 'Subject label of run 10700002',
                  correlationId: 'correlation-id-10700000',
                  externalRef: 'external-ref-10700002',
                  statusName: 'running',
                  lastCompletedStep: null,
                  elapsedSeconds: 10795,
                  modelCallCount: 0,
                  inputTokenCount: 0,
                  outputTokenCount: 0,
                  acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
                },
                {
                  runKey: 'run-key-10700001',
                  runCategoryName: 'asset-media-extraction',
                  subjectLabel: 'Subject label of run 10700001',
                  correlationId: 'correlation-id-10700000',
                  externalRef: 'external-ref-10700001',
                  statusName: 'succeeded',
                  lastCompletedStep: null,
                  elapsedSeconds: 2,
                  modelCallCount: 0,
                  inputTokenCount: 0,
                  outputTokenCount: 0,
                  acceptedAt: new Date('2026-09-14T01:00:01.001Z'),
                },
              ],
              nextCursor: null,
            },
            error: null,
          },
        },
      ]

      test.each(cases)('query: $input.query', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The seventh criterion through the route: a page states how to ask for the next one, and the
     * cursor it states is one the route itself accepts. The second case is the first case's
     * answer handed straight back, which is the only thing a client ever does with it.
     */
    describe('when the client walked to the next page', () => {
      const cases = [
        {
          input: {
            query: {
              limit: '4',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runs: expect.arrayContaining([
                expect.objectContaining({
                  runKey: 'run-key-10010011',
                }),
              ]),
              nextCursor: 'cnVuLWtleS0xMDAxMDAxMQ', // run-key-10010011
            },
            error: null,
          },
        },
        {
          input: {
            query: {
              limit: '4',
              cursor: 'cnVuLWtleS0xMDAxMDAxMQ', // run-key-10010011
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runs: expect.arrayContaining([
                expect.objectContaining({
                  runKey: 'run-key-10010006',
                }),
                expect.objectContaining({
                  runKey: 'run-key-10010002',
                }),
              ]),
              nextCursor: 'cnVuLWtleS0xMDAxMDAwMg', // run-key-10010002
            },
            error: null,
          },
        },
      ]

      test.each(cases)('cursor: $input.query.cursor', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The fourth criterion through the route: runs stalled past a threshold in one request, asked
     * for with the text a query string carries.
     */
    describe('when the client asked for its stalled runs', () => {
      const cases = [
        {
          input: {
            query: {
              stalledForSeconds: '7200',
              limit: '20',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runs: [
                expect.objectContaining({
                  runKey: 'run-key-10700002',
                  statusName: 'running',
                }),
                expect.objectContaining({
                  runKey: 'run-key-10010002',
                  statusName: 'queued',
                }),
                expect.objectContaining({
                  runKey: 'run-key-10010001',
                  statusName: 'running',
                }),
              ],
              nextCursor: null,
            },
            error: null,
          },
        },
        {
          input: {
            query: {
              stalledForSeconds: '86400',
              limit: '20',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runs: [
                expect.objectContaining({
                  runKey: 'run-key-10010002',
                  statusName: 'queued',
                }),
                expect.objectContaining({
                  runKey: 'run-key-10010001',
                  statusName: 'running',
                }),
              ],
              nextCursor: null,
            },
            error: null,
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.query.stalledForSeconds', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * Each of the six parameters refused under its own name, so a caller is told which one it got
     * wrong. A status name this service does not have is among them rather than answered with an
     * empty page — a client reading zero runs in a state that does not exist has no way to tell
     * that from having no runs.
     */
    describe('when the client asked with a value the schema does not accept', () => {
      const cases = [
        {
          input: {
            query: {
              statusName: 'runing',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid status name',
            },
          },
        },
        {
          input: {
            query: {
              runCategoryName: 'asset-media-extractions',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid run category name',
            },
          },
        },
        {
          input: {
            query: {
              correlationId: [
                'correlation-id-10700000',
                'correlation-id-10010004',
              ],
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid correlation id',
            },
          },
        },
        {
          input: {
            query: {
              stalledForSeconds: 'an-hour',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid stalled for seconds',
            },
          },
        },
        {
          input: {
            query: {
              limit: '101',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid limit',
            },
          },
        },
        {
          input: {
            // a run key sent as a cursor, which is the cursor somebody builds by hand
            query: {
              cursor: 'run-key-10010001',
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid cursor',
            },
          },
        },
      ]

      test.each(cases)('query: $input.query', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * A cursor that decodes but names no run of this client is refused in the same words a
     * fabricated one is. The first of the two names another client's run, and answering it any
     * differently would confirm that run exists — which is the refusal `GET /v1/ai-runs/:runKey`
     * answers `404` rather than `403` in order not to make.
     */
    describe('when the cursor names no run of this client', () => {
      const cases = [
        {
          input: {
            query: {
              cursor: 'cnVuLWtleS0xMDAxMDAwMw', // run-key-10010003, which belongs to 10000002
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid cursor',
            },
          },
        },
        {
          input: {
            query: {
              cursor: 'cnVuLWtleS05OTk5OTk5OQ', // run-key-99999999, which names no run at all
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-14T05:00:00.000Z'),
            },
          },
          expected: {
            statusCode: 422,
            headers: {},
            content: null,
            error: {
              message: 'Invalid cursor',
            },
          },
        },
      ]

      test.each(cases)('cursor: $input.query.cursor', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunsGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
