import AssetMediaExtractionPostRenderer from '../../../../../../../server/restfulapi/renderers/v1/post/AssetMediaExtractionPostRenderer.js'

import BaseAiRunPostRenderer from '../../../../../../../server/restfulapi/renderers/BaseAiRunPostRenderer.js'

import AiRunRateLimitInspector from '../../../../../../../app/aiRun/AiRunRateLimitInspector.js'

/*
 * The route section 20 declares, in the members of it that write nothing.
 *
 * **What this file no longer holds is the point of it.** The stub that stood in this class settled
 * the run it accepted, out of a digest of the request, and two thirds of the test file here was the
 * reading of that digest - the value a field came out as, the state it carried, how many readings
 * agreed. None of it is here because none of it is there: the reading belongs to the job, and this
 * class accepts. A member that disappeared from the implementation disappears from its tests in the
 * same breath, and what is left below is every member that remains.
 *
 * **`.get:JobDispatcherCtor` is asserted to still throw, deliberately.** This service has no queue
 * until the worker checkpoint builds one, so the member naming that queue is left inherited and
 * unanswered rather than filled with a sham. The case below is what stops it being filled by
 * accident, and it is the case to delete on the day it is filled on purpose.
 *
 * **The rate-limit cases count the development seeder's own runs inside 2026-09-10**, for the
 * reason `AiRunRateLimitInspector`'s own test states: that is the day the fixture was seeded on and
 * the day no DB-writing test writes into, so the count behind each case is the same whatever else
 * has run. The figures are small ones handed to a real inspector through the class's own seam - the
 * sixty the constant states would need sixty seeded runs, which would be a fixture written to fit a
 * test.
 */

describe('AssetMediaExtractionPostRenderer', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = AssetMediaExtractionPostRenderer.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPostRenderer)
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:routePath', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const received = AssetMediaExtractionPostRenderer.routePath

        expect(received)
          .toBe('/asset-media-extractions')
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:aiRunCategory', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {
          ID: 1,
          NAME: 'asset-media-extraction',
          DISPLAY_NAME: 'Asset media extraction',
          DISPLAY_ORDER: 10,
          IS_ACTIVE: true,
        }

        const received = AssetMediaExtractionPostRenderer.aiRunCategory

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:errorStructureHash', () => {
    /*
     * Every refusal the base declares, plus the one this route adds. The whole hash is compared in
     * one go: a refusal arriving here that the contract does not fix is a status a client has no
     * handling for, so a new key has to be a line somebody wrote on purpose.
     */
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {
          MissingIdempotencyKey: {
            statusCode: 422,
            errorMessage: 'Idempotency-Key header is required',
          },
          InvalidIdempotencyKey: {
            statusCode: 422,
            errorMessage: 'Invalid Idempotency-Key header',
          },
          InvalidRequestBody: {
            statusCode: 422,
            errorMessage: 'Invalid request body',
          },
          InvalidExternalRef: {
            statusCode: 422,
            errorMessage: 'Invalid externalRef',
          },
          InvalidSubjectLabel: {
            statusCode: 422,
            errorMessage: 'Invalid subjectLabel',
          },
          InvalidCorrelationId: {
            statusCode: 422,
            errorMessage: 'Invalid correlationId',
          },
          InvalidCallbackUrl: {
            statusCode: 422,
            errorMessage: 'Invalid callbackUrl',
          },
          RequestBodyMismatch: {
            statusCode: 409,
            errorMessage: 'Idempotency-Key was already used with a different request body',
          },
          RateLimitExceeded: {
            statusCode: 429,
            errorMessage: 'Rate limit exceeded',
          },
        }

        const received = AssetMediaExtractionPostRenderer.errorStructureHash

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:JobDispatcherCtor', () => {
    describe('when not inherited', () => {
      const cases = [
        {
          input: {
            Ctor: AssetMediaExtractionPostRenderer,
          },
          expected: 'AssetMediaExtractionPostRenderer.get:JobDispatcherCtor must be inherited',
        },
        {
          input: {
            Ctor: class AlphaAssetMediaExtractionPostRenderer extends AssetMediaExtractionPostRenderer {},
          },
          expected: 'AlphaAssetMediaExtractionPostRenderer.get:JobDispatcherCtor must be inherited',
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
        expected,
      }) => {
        expect(() => input.Ctor.JobDispatcherCtor)
          .toThrow(expected)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.get:unbuiltQueueJobDispatcher', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const expected = {
          dispatchJob: expect.any(Function),
        }

        const received = AssetMediaExtractionPostRenderer.unbuiltQueueJobDispatcher

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when its job is dispatched', () => {
      test('should send nothing', async () => {
        const jobDispatcher = AssetMediaExtractionPostRenderer.unbuiltQueueJobDispatcher

        const received = await jobDispatcher.dispatchJob()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('.createAiRunRateLimitInspector()', () => {
    describe('when called as is', () => {
      test('should be instance of AiRunRateLimitInspector', () => {
        const received = AssetMediaExtractionPostRenderer.createAiRunRateLimitInspector()

        expect(received)
          .toBeInstanceOf(AiRunRateLimitInspector)
      })
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          Ctor: AssetMediaExtractionPostRenderer,
        },
      },
      {
        input: {
          Ctor: class BetaAssetMediaExtractionPostRenderer extends AssetMediaExtractionPostRenderer {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', ({
      input,
    }) => {
      const renderer = input.Ctor.create()

      const received = renderer.Ctor

      expect(received)
        .toBe(input.Ctor) // same reference
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#ensureJobDispatcher()', () => {
    const cases = [
      {
        input: {
          Ctor: AssetMediaExtractionPostRenderer,
        },
      },
      {
        input: {
          Ctor: class GammaAssetMediaExtractionPostRenderer extends AssetMediaExtractionPostRenderer {},
        },
      },
    ]

    test.each(cases)('Ctor: $input.Ctor.name', async ({
      input,
    }) => {
      const renderer = input.Ctor.create()

      const received = await renderer.ensureJobDispatcher()

      expect(received)
        .toBe(AssetMediaExtractionPostRenderer.unbuiltQueueJobDispatcher) // same reference
    })
  })
})

describe('AssetMediaExtractionPostRenderer', () => {
  describe('#isWithinRateLimit()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            aiRunRateLimitInspectorArgs: {
              maximumAcceptedAiRunCount: 7,
              windowSecondCount: 86400,
            },
            context: {
              apiClientId: 10000001, // Six runs seeded inside the window
              now: new Date('2026-09-10T12:00:00.000Z'),
            },
          },
        },
        {
          input: {
            aiRunRateLimitInspectorArgs: {
              maximumAcceptedAiRunCount: 4,
              windowSecondCount: 86400,
            },
            context: {
              apiClientId: 10000002, // Three runs seeded inside the window
              now: new Date('2026-09-10T12:00:00.000Z'),
            },
          },
        },
      ]

      test.each(cases)('maximumAcceptedAiRunCount: $input.aiRunRateLimitInspectorArgs.maximumAcceptedAiRunCount', async ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()
        const aiRunRateLimitInspector = AiRunRateLimitInspector.create(input.aiRunRateLimitInspectorArgs)
        jest.spyOn(AssetMediaExtractionPostRenderer, 'createAiRunRateLimitInspector')
          .mockReturnValue(aiRunRateLimitInspector)
        const isWithinRateLimitArgs = {
          context: input.context,
        }

        const received = await renderer.isWithinRateLimit(isWithinRateLimitArgs)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            aiRunRateLimitInspectorArgs: {
              maximumAcceptedAiRunCount: 6, // Exactly what this client has already had
              windowSecondCount: 86400,
            },
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-10T12:00:00.000Z'),
            },
          },
        },
        {
          input: {
            aiRunRateLimitInspectorArgs: {
              maximumAcceptedAiRunCount: 3,
              windowSecondCount: 86400,
            },
            context: {
              apiClientId: 10000002,
              now: new Date('2026-09-10T12:00:00.000Z'),
            },
          },
        },
      ]

      test.each(cases)('maximumAcceptedAiRunCount: $input.aiRunRateLimitInspectorArgs.maximumAcceptedAiRunCount', async ({
        input,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()
        const aiRunRateLimitInspector = AiRunRateLimitInspector.create(input.aiRunRateLimitInspectorArgs)
        jest.spyOn(AssetMediaExtractionPostRenderer, 'createAiRunRateLimitInspector')
          .mockReturnValue(aiRunRateLimitInspector)
        const isWithinRateLimitArgs = {
          context: input.context,
        }

        const received = await renderer.isWithinRateLimit(isWithinRateLimitArgs)

        expect(received)
          .toBeFalsy()
      })
    })

    /*
     * The instant the limit is measured against is the request's own, not a clock read a second
     * time. A renderer reading the clock here would measure one request at two instants.
     */
    describe('should ask with the request client and the request instant', () => {
      const cases = [
        {
          input: {
            context: {
              apiClientId: 10000001,
              now: new Date('2026-09-10T12:00:00.000Z'),
            },
          },
          expected: {
            apiClientId: 10000001,
            now: new Date('2026-09-10T12:00:00.000Z'),
          },
        },
        {
          input: {
            context: {
              apiClientId: 10000003,
              now: new Date('2026-09-10T13:00:00.000Z'),
            },
          },
          expected: {
            apiClientId: 10000003,
            now: new Date('2026-09-10T13:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('apiClientId: $input.context.apiClientId', async ({
        input,
        expected,
      }) => {
        const renderer = AssetMediaExtractionPostRenderer.create()
        const aiRunRateLimitInspector = AiRunRateLimitInspector.create()
        const isWithinRateLimitSpy = jest.spyOn(aiRunRateLimitInspector, 'isWithinRateLimit')
        jest.spyOn(AssetMediaExtractionPostRenderer, 'createAiRunRateLimitInspector')
          .mockReturnValue(aiRunRateLimitInspector)
        const isWithinRateLimitArgs = {
          context: input.context,
        }

        await renderer.isWithinRateLimit(isWithinRateLimitArgs)

        expect(isWithinRateLimitSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
