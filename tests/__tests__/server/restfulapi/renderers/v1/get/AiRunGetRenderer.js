import AiRunGetRenderer from '../../../../../../../server/restfulapi/renderers/v1/get/AiRunGetRenderer.js'

import {
  BaseGetRenderer,
} from '@openreachtech/renchan'

import AiRunResponseBuilder from '../../../../../../../app/aiRun/AiRunResponseBuilder.js'

/*
 * The route section 12 declares, read end to end against the development seeders.
 *
 * **Nothing is mocked, and nothing is written.** Every run below is `#run-contract`'s seeded row,
 * every step is `#run-record`'s and every model call is `#provider-layer`'s, so the body asserted
 * here is one this application really assembled out of five tables through the real
 * `AiRunResponseBuilder`. Stubbing the builder would have proved that the renderer calls something
 * and nothing about what a client reads.
 *
 * **Three columns no seeded run carries are why some fields read null on every case** —
 * `engine_label`, `result_body` and `failure_parameters`. `#run-contract`'s seeder writes none of
 * the three on any row, so `engine.label` is null throughout, `result` is null even on the
 * succeeded runs, and the failed run's `failure.parameters` is null. The non-null paths are
 * covered against a run entity written out by hand in
 * `tests/__tests__/app/aiRun/AiRunResponseBuilder.js`, where the builder's own describes live. The
 * gap belongs to the fixture and is reported rather than papered over: it is not weakened here by
 * asserting something looser than what the rows really answer.
 *
 * **The client is a plain object.** `AppRestfulApiContext` resolves a client from a signed request,
 * which a renderer test has no request to present; the renderer reads one field off it, and that
 * field is what the cases supply. The resolution itself has its own test file.
 */

describe('AiRunGetRenderer', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AiRunGetRenderer.prototype

      expect(received)
        .toBeInstanceOf(BaseGetRenderer)
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('.get:routePath', () => {
    describe('when called as is', () => {
      test('should be the route the contract fixes', () => {
        const received = AiRunGetRenderer.routePath

        expect(received)
          .toBe('/ai-runs/:runKey')
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('.get:method', () => {
    describe('when called as is', () => {
      test('should be the HTTP method of the route', () => {
        const received = AiRunGetRenderer.method

        expect(received)
          .toBe('get')
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('.get:errorStructureHash', () => {
    /*
     * One refusal, and the whole of the vocabulary. A second entry here would be a second thing a
     * caller could tell apart, which is what the ninth criterion forbids.
     */
    describe('when called as is', () => {
      test('should declare the one refusal this route answers with', () => {
        const expected = {
          AiRunNotFound: {
            statusCode: 404,
            errorMessage: 'AI run not found',
          },
        }

        const received = AiRunGetRenderer.errorStructureHash

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('.get:AiRunResponseBuilderCtor', () => {
    describe('when called as is', () => {
      test('should be the builder both callers share', () => {
        const received = AiRunGetRenderer.AiRunResponseBuilderCtor

        expect(received)
          .toBe(AiRunResponseBuilder) // same reference
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('.createAiRunResponseBuilder()', () => {
    describe('when called as is', () => {
      test('should be instance of AiRunResponseBuilder', () => {
        const received = AiRunGetRenderer.createAiRunResponseBuilder()

        expect(received)
          .toBeInstanceOf(AiRunResponseBuilder)
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunGetRenderer,
      },
      {
        tally: class AlphaAiRunGetRenderer extends AiRunGetRenderer {},
      },
      {
        tally: class BetaAiRunGetRenderer extends AiRunGetRenderer {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const renderer = tally.create()

      const received = renderer.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#extractRunKey()', () => {
    /*
     * The third case is what the framework's path-parameter proxy answers for a key the path did
     * not carry: null, never undefined.
     */
    const cases = [
      {
        input: {
          request: {
            pathParameterHash: {
              runKey: 'run-key-10010004',
            },
          },
        },
        expected: 'run-key-10010004',
      },
      {
        input: {
          request: {
            pathParameterHash: {
              runKey: 'run-key-10010005',
            },
          },
        },
        expected: 'run-key-10010005',
      },
      {
        input: {
          request: {
            pathParameterHash: {
              runKey: null,
            },
          },
        },
        expected: null,
      },
    ]

    test.each(cases)('runKey: $input.request.pathParameterHash.runKey', ({
      input,
      expected,
    }) => {
      const renderer = AiRunGetRenderer.create()

      const received = renderer.extractRunKey(input)

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#extractExpandsSteps()', () => {
    /*
     * `steps` is the one expansion this version answers to, so the truthy side has exactly one
     * value to carry — the contract names no second one.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            query: {
              expand: 'steps',
            },
          },
        },
      ]

      test.each(cases)('expand: $input.query.expand', ({
        input,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const received = renderer.extractExpandsSteps(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            query: {
              // expand: not sent
            },
          },
        },
        {
          input: {
            query: {
              expand: 'rejections',
            },
          },
        },
        {
          input: {
            query: {
              expand: 'Steps', // the value is answered to as sent, and never case-folded
            },
          },
        },
        {
          input: {
            query: {
              expand: '',
            },
          },
        },
        {
          input: {
            query: {
              expand: [ // what a repeated query parameter arrives as
                'steps',
                'steps',
              ],
            },
          },
        },
      ]

      test.each(cases)('expand: $input.query.expand', ({
        input,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const received = renderer.extractExpandsSteps(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#render()', () => {
    /*
     * The fourth acceptance criterion of section 12: reading a run back by its key answers the
     * body the terminal callback carries. All five values of `statusName` are here, because a
     * route that answered one of them would leave the other four met for the first time by
     * whoever wired against it.
     *
     * The sixth criterion is the failed run: a reason code and its parameters, and no result. The
     * seventh is the canceled run: two model calls and the tokens they spent before the stop,
     * rather than nothing.
     *
     * No case carries `steps`. The whole response is compared, so the absence of the key is what
     * is asserted — "a response that did not ask for the trace carries none" is the second half of
     * the fifth criterion.
     */
    describe('when the client owns the run', () => {
      const cases = [
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010002',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010002',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010002',
              subjectLabel: 'Subject label of run 10010002',
              correlationId: 'correlation-id-10010002',
              statusName: 'queued',
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
            error: null,
          },
        },
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010001',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010001',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010001',
              subjectLabel: 'Subject label of run 10010001',
              correlationId: 'correlation-id-10010001',
              statusName: 'running',
              engine: {
                label: null,
                confidenceMethodVersion: null,
              },
              usage: {
                modelCallCount: 1,
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
              result: null,
              failure: null,
            },
            error: null,
          },
        },
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010004',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010004',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010004',
              subjectLabel: 'Subject label of run 10010004',
              correlationId: 'correlation-id-10010004',
              statusName: 'succeeded',
              engine: {
                label: null,
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
              usage: {
                modelCallCount: 3,
                inputTokenCount: 14406, // 4801 + 4802 + 4803
                outputTokenCount: 966, // 311 + 322 + 333
              },
              result: null,
              failure: null,
            },
            error: null,
          },
        },
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010005',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010005',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010005',
              subjectLabel: 'Subject label of run 10010005',
              correlationId: 'correlation-id-10010005',
              statusName: 'failed',
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
              failure: {
                reasonCode: 'MEDIA_UNREADABLE',
                parameters: null,
              },
            },
            error: null,
          },
        },
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010006',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010006',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010006',
              subjectLabel: 'Subject label of run 10010006',
              correlationId: 'correlation-id-10010006',
              statusName: 'canceled',
              engine: {
                label: null,
                confidenceMethodVersion: null,
              },
              usage: {
                modelCallCount: 2,
                inputTokenCount: 5413, // 2706 + 2707
                outputTokenCount: 343, // 166 + 177
              },
              result: null,
              failure: null,
            },
            error: null,
          },
        },
      ]

      test.each(cases)('runKey: $input.request.pathParameterHash.runKey', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The fifth criterion's first half: asking for the trace adds it to that same response.
     *
     * The seven steps of run 10010004 are the whole of its trace, and each carries the seven
     * fields the contract's shape declares — `rejections` is absent although two of the seeded
     * rows hold it, which is what keeps the internal decision trace off a client surface. A run
     * that has begun nothing answers the same key holding no entry, rather than no key.
     */
    describe('when the step trace was asked for', () => {
      const cases = [
        {
          input: {
            query: {
              expand: 'steps',
            },
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010004',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010004',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010004',
              subjectLabel: 'Subject label of run 10010004',
              correlationId: 'correlation-id-10010004',
              statusName: 'succeeded',
              engine: {
                label: null,
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
              usage: {
                modelCallCount: 3,
                inputTokenCount: 14406, // 4801 + 4802 + 4803
                outputTokenCount: 966, // 311 + 322 + 333
              },
              result: null,
              failure: null,
              steps: [
                {
                  stepIndex: 1,
                  stepName: 'filter-suggestible-fields',
                  stepCategoryName: 'code',
                  outcomeCode: 'fields-kept',
                  reasonCode: null,
                  startedAt: new Date('2026-09-12T01:01:01.001Z'),
                  finishedAt: new Date('2026-09-12T01:01:01.101Z'),
                },
                {
                  stepIndex: 2,
                  stepName: 'fetch-media',
                  stepCategoryName: 'code',
                  outcomeCode: 'media-fetched',
                  reasonCode: null,
                  startedAt: new Date('2026-09-12T01:01:02.002Z'),
                  finishedAt: new Date('2026-09-12T01:01:04.202Z'),
                },
                {
                  stepIndex: 3,
                  stepName: 'read-media',
                  stepCategoryName: 'ai',
                  outcomeCode: 'readings-returned',
                  reasonCode: null,
                  startedAt: new Date('2026-09-12T01:01:05.005Z'),
                  finishedAt: new Date('2026-09-12T01:01:11.305Z'),
                },
                {
                  stepIndex: 4,
                  stepName: 'drop-disallowed-readings',
                  stepCategoryName: 'code',
                  outcomeCode: 'readings-dropped',
                  reasonCode: 'schema-check-dropped-readings',
                  startedAt: new Date('2026-09-12T01:01:12.012Z'),
                  finishedAt: new Date('2026-09-12T01:01:12.412Z'),
                },
                {
                  stepIndex: 5,
                  stepName: 'settle-by-majority',
                  stepCategoryName: 'code',
                  outcomeCode: 'fields-settled',
                  reasonCode: 'majority-not-reached-for-some-fields',
                  startedAt: new Date('2026-09-12T01:01:13.013Z'),
                  finishedAt: new Date('2026-09-12T01:01:13.513Z'),
                },
                {
                  stepIndex: 6,
                  stepName: 'score-confidence',
                  stepCategoryName: 'code',
                  outcomeCode: 'confidence-scored',
                  reasonCode: null,
                  startedAt: new Date('2026-09-12T01:01:14.014Z'),
                  finishedAt: new Date('2026-09-12T01:01:14.614Z'),
                },
                {
                  stepIndex: 7,
                  stepName: 'await-owner-decision',
                  stepCategoryName: 'human',
                  outcomeCode: 'decision-recorded',
                  reasonCode: null,
                  startedAt: new Date('2026-09-12T01:01:15.015Z'),
                  finishedAt: new Date('2026-09-12T01:01:45.715Z'),
                },
              ],
            },
            error: null,
          },
        },
        {
          input: {
            query: {
              expand: 'steps',
            },
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010002',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010002',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010002',
              subjectLabel: 'Subject label of run 10010002',
              correlationId: 'correlation-id-10010002',
              statusName: 'queued',
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
              steps: [],
            },
            error: null,
          },
        },
      ]

      test.each(cases)('runKey: $input.request.pathParameterHash.runKey', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The fifth criterion read from the other side: an expansion this version does not answer to
     * adds nothing, and is not a refusal either. The run answers its ordinary body, `steps` key
     * and all absent — including for the array a repeated `?expand=steps&expand=steps` arrives as,
     * which is a value and not the string.
     */
    describe('when an expansion this version does not answer to was asked for', () => {
      const cases = [
        {
          input: {
            query: {
              expand: 'rejections',
            },
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010006',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010006',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010006',
              subjectLabel: 'Subject label of run 10010006',
              correlationId: 'correlation-id-10010006',
              statusName: 'canceled',
              engine: {
                label: null,
                confidenceMethodVersion: null,
              },
              usage: {
                modelCallCount: 2,
                inputTokenCount: 5413, // 2706 + 2707
                outputTokenCount: 343, // 166 + 177
              },
              result: null,
              failure: null,
            },
            error: null,
          },
        },
        {
          input: {
            query: {
              expand: [
                'steps',
                'steps',
              ],
            },
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010005',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010005',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010005',
              subjectLabel: 'Subject label of run 10010005',
              correlationId: 'correlation-id-10010005',
              statusName: 'failed',
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
              failure: {
                reasonCode: 'MEDIA_UNREADABLE',
                parameters: null,
              },
            },
            error: null,
          },
        },
      ]

      test.each(cases)('runKey: $input.request.pathParameterHash.runKey', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The ninth criterion, and the reason every case below carries the same `expected` object.
     *
     * Two of these run keys name a run that exists — 10010003 and 10010007 both belong to the
     * rotating client — and two name nothing at all. All four are answered with one status, one
     * body and one wording, so a caller holding another client's run key learns from the answer
     * exactly what a caller holding a key nothing carries learns: nothing. A `403`, or a `404`
     * worded differently, would confirm that somebody else's run exists.
     *
     * Asking for the trace does not change the refusal either: the read that would have loaded the
     * run is the read that refused it, so there is nothing further to do or not do.
     */
    describe('when the client owns no run under that key', () => {
      const cases = [
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010003', // the rotating client's succeeded run
              },
            },
          },
          expected: {
            statusCode: 404,
            headers: {},
            content: null,
            error: {
              message: 'AI run not found',
            },
          },
        },
        {
          input: {
            query: {
              expand: 'steps',
            },
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010007', // the rotating client's queued run
              },
            },
          },
          expected: {
            statusCode: 404,
            headers: {},
            content: null,
            error: {
              message: 'AI run not found',
            },
          },
        },
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-that-no-run-carries',
              },
            },
          },
          expected: {
            statusCode: 404,
            headers: {},
            content: null,
            error: {
              message: 'AI run not found',
            },
          },
        },
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000001,
            },
            request: {
              pathParameterHash: {
                runKey: null, // what the proxy answers when the path carried no key
              },
            },
          },
          expected: {
            statusCode: 404,
            headers: {},
            content: null,
            error: {
              message: 'AI run not found',
            },
          },
        },
      ]

      test.each(cases)('runKey: $input.request.pathParameterHash.runKey', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })

    /*
     * The same run key, read by the client that owns it and by the one that does not.
     *
     * The pair is what makes the ninth criterion an assertion rather than a claim: one case's
     * answer carries the run and the other's carries the refusal, and the only thing that differs
     * between the two calls is which client asked.
     */
    describe('when the same run key is read by two clients', () => {
      const cases = [
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000002,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010003',
              },
            },
          },
          expected: {
            statusCode: 200,
            headers: {},
            content: {
              runKey: 'run-key-10010003',
              runCategoryName: 'asset-media-extraction',
              externalRef: 'external-ref-10010003',
              subjectLabel: 'Subject label of run 10010003',
              correlationId: 'correlation-id-10010003',
              statusName: 'succeeded',
              engine: {
                label: null,
                confidenceMethodVersion: 'confidence-v1.1.0',
              },
              usage: {
                modelCallCount: 2,
                inputTokenCount: 7809, // 3904 + 3905
                outputTokenCount: 499, // 244 + 255
              },
              result: null,
              failure: null,
            },
            error: null,
          },
        },
        {
          input: {
            query: {},
            context: {
              apiClientId: 10000003,
            },
            request: {
              pathParameterHash: {
                runKey: 'run-key-10010003',
              },
            },
          },
          expected: {
            statusCode: 404,
            headers: {},
            content: null,
            error: {
              message: 'AI run not found',
            },
          },
        },
      ]

      test.each(cases)('apiClientId: $input.context.apiClientId', async ({
        input,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const received = await renderer.render(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
