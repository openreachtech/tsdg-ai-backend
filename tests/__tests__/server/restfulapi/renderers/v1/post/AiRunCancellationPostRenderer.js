import AiRunCancellationPostRenderer from '../../../../../../../server/restfulapi/renderers/v1/post/AiRunCancellationPostRenderer.js'

import {
  BasePostRenderer,
} from '@openreachtech/renchan'

import AiRunCancellationRegistrar from '../../../../../../../app/aiRun/AiRunCancellationRegistrar.js'

/*
 * The surface of the route §15 declares: its path, its method, the one refusal it can answer with
 * and the collaborator it hands the work to.
 *
 * `#render()` is not here. It writes `cancel_requested_at` on the runs it is asked about, so it
 * lives under `tests/_orders/AiRun/` beside the rows it stands on — placement follows what the
 * method does.
 *
 * **The route path is asserted character for character against the contract**, because the
 * framework builds the express route out of it and nothing else does: a renderer whose path
 * drifted would be a route the client cannot reach, and no other test in this repository would
 * notice.
 */

describe('AiRunCancellationPostRenderer', () => {
  describe('inheritance', () => {
    /*
     * `BasePostRenderer` and not `BaseAiRunPostRenderer`. That base is the accept path of a
     * run-creating route — an idempotency pair, a request-body digest, a run category and a queue
     * — and this route creates no run, so inheriting it would bring refusals this route cannot
     * raise and abstract members it has no honest answer for.
     */
    test('should be correct class', () => {
      const received = AiRunCancellationPostRenderer.prototype

      expect(received)
        .toBeInstanceOf(BasePostRenderer)
    })
  })
})

describe('AiRunCancellationPostRenderer', () => {
  describe('.get:routePath', () => {
    describe('when called as is', () => {
      test('should be the route the contract fixes', () => {
        const received = AiRunCancellationPostRenderer.routePath

        expect(received)
          .toBe('/ai-runs/:runKey/cancellations')
      })
    })
  })
})

describe('AiRunCancellationPostRenderer', () => {
  describe('.get:method', () => {
    describe('when called as is', () => {
      test('should be the HTTP method of the route', () => {
        const received = AiRunCancellationPostRenderer.method

        expect(received)
          .toBe('post')
      })
    })
  })
})

describe('AiRunCancellationPostRenderer', () => {
  describe('.get:errorStructureHash', () => {
    /*
     * One refusal, and the whole of the vocabulary. A second entry would be a second thing a
     * caller could tell apart, and §15's eighth criterion is that a foreign run answers exactly as
     * an unknown one does — which is also why the status is 404 and never 403.
     */
    describe('when called as is', () => {
      test('should declare the one refusal this route answers with', () => {
        const expected = {
          AiRunNotFound: {
            statusCode: 404,
            errorMessage: 'AI run not found',
          },
        }

        const received = AiRunCancellationPostRenderer.errorStructureHash

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunCancellationPostRenderer', () => {
  describe('.get:AiRunCancellationRegistrarCtor', () => {
    describe('when called as is', () => {
      test('should be the registrar this route hands the work to', () => {
        const received = AiRunCancellationPostRenderer.AiRunCancellationRegistrarCtor

        expect(received)
          .toBe(AiRunCancellationRegistrar) // same reference
      })
    })
  })
})

describe('AiRunCancellationPostRenderer', () => {
  describe('.createAiRunCancellationRegistrar()', () => {
    describe('when called as is', () => {
      test('should be instance of AiRunCancellationRegistrar', () => {
        const received = AiRunCancellationPostRenderer.createAiRunCancellationRegistrar()

        expect(received)
          .toBeInstanceOf(AiRunCancellationRegistrar)
      })
    })
  })
})

describe('AiRunCancellationPostRenderer', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiRunCancellationPostRenderer,
      },
      {
        tally: class AlphaAiRunCancellationPostRenderer extends AiRunCancellationPostRenderer {},
      },
      {
        tally: class BetaAiRunCancellationPostRenderer extends AiRunCancellationPostRenderer {},
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

describe('AiRunCancellationPostRenderer', () => {
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
              runKey: 'run-key-10010002',
            },
          },
        },
        expected: 'run-key-10010002',
      },
      {
        input: {
          request: {
            pathParameterHash: {
              runKey: 'run-key-10010006',
            },
          },
        },
        expected: 'run-key-10010006',
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
      const renderer = AiRunCancellationPostRenderer.create()

      const received = renderer.extractRunKey(input)

      expect(received)
        .toBe(expected)
    })
  })
})
