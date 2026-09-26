import AiRunGetRenderer from '../../../../../../../server/restfulapi/renderers/v1/get/AiRunGetRenderer.js'

import {
  BaseGetRenderer,
} from '@openreachtech/renchan'

const QUEUED_RUN_KEY = '1111111111111111111111111111111111111111111111111111111111111111'
const RUNNING_RUN_KEY = '2222222222222222222222222222222222222222222222222222222222222222'
const SUCCEEDED_RUN_KEY = '3333333333333333333333333333333333333333333333333333333333333333'
const FAILED_RUN_KEY = '4444444444444444444444444444444444444444444444444444444444444444'
const CANCELED_RUN_KEY = '5555555555555555555555555555555555555555555555555555555555555555'

describe('AiRunGetRenderer', () => {
  describe('super class', () => {
    test('to be instance of BaseGetRenderer', () => {
      const received = AiRunGetRenderer.prototype

      expect(received)
        .toBeInstanceOf(BaseGetRenderer)
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('.get:routePath', () => {
    describe('when called as is', () => {
      test('should declare the route the contract fixes', () => {
        const expected = '/ai-runs/:runKey'

        const actual = AiRunGetRenderer.routePath

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('.get:method', () => {
    describe('when called as is', () => {
      test('should declare the HTTP method of the route', () => {
        const expected = 'get'

        const actual = AiRunGetRenderer.method

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('.get:fallbackCannedRunKey', () => {
    describe('when called as is', () => {
      test('should be the succeeded canned run key', () => {
        const expected = SUCCEEDED_RUN_KEY

        const actual = AiRunGetRenderer.fallbackCannedRunKey

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#get:Ctor', () => {
    describe('when reached through an instance', () => {
      test('should be own class', () => {
        const renderer = AiRunGetRenderer.create()

        const actual = renderer.Ctor

        expect(actual)
          .toBe(AiRunGetRenderer) // same reference
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#extractRunKey()', () => {
    const cases = [
      {
        params: {
          request: {
            pathParameterHash: {
              runKey: SUCCEEDED_RUN_KEY,
            },
          },
        },
        expected: SUCCEEDED_RUN_KEY,
      },
      {
        params: {
          request: {
            pathParameterHash: {
              runKey: FAILED_RUN_KEY,
            },
          },
        },
        expected: FAILED_RUN_KEY,
      },
      {
        params: {
          request: {
            pathParameterHash: {
              runKey: 'a-run-key-this-stub-does-not-name',
            },
          },
        },
        expected: 'a-run-key-this-stub-does-not-name',
      },
    ]

    test.each(cases)('runKey: $params.request.pathParameterHash.runKey', ({
      params,
      expected,
    }) => {
      const renderer = AiRunGetRenderer.create()

      const actual = renderer.extractRunKey(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#extractCannedRunKey()', () => {
    describe('when the run key names a canned run', () => {
      const cases = [
        {
          params: {
            runKey: QUEUED_RUN_KEY,
          },
          expected: QUEUED_RUN_KEY,
        },
        {
          params: {
            runKey: RUNNING_RUN_KEY,
          },
          expected: RUNNING_RUN_KEY,
        },
        {
          params: {
            runKey: SUCCEEDED_RUN_KEY,
          },
          expected: SUCCEEDED_RUN_KEY,
        },
        {
          params: {
            runKey: FAILED_RUN_KEY,
          },
          expected: FAILED_RUN_KEY,
        },
        {
          params: {
            runKey: CANCELED_RUN_KEY,
          },
          expected: CANCELED_RUN_KEY,
        },
      ]

      test.each(cases)('runKey: $params.runKey', ({
        params,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = renderer.extractCannedRunKey(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('when the run key names no canned run', () => {
      const cases = [
        {
          params: {
            runKey: 'a-run-key-this-stub-does-not-name',
          },
          expected: SUCCEEDED_RUN_KEY,
        },
        {
          params: {
            runKey: 'toString',
          },
          expected: SUCCEEDED_RUN_KEY,
        },
        {
          params: {
            runKey: null,
          },
          expected: SUCCEEDED_RUN_KEY,
        },
      ]

      test.each(cases)('runKey: $params.runKey', ({
        params,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = renderer.extractCannedRunKey(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#buildStepsExpansion()', () => {
    describe('when steps were asked for', () => {
      const cases = [
        {
          params: {
            cannedRunKey: QUEUED_RUN_KEY,
            expand: 'steps',
          },
          expected: {
            steps: [],
          },
        },
        {
          params: {
            cannedRunKey: FAILED_RUN_KEY,
            expand: 'steps',
          },
          expected: {
            steps: [
              {
                stepIndex: 1,
                stepName: 'select-suggestible-fields',
                stepCategoryName: 'code',
                outcomeCode: 'succeeded',
                reasonCode: null,
                startedAt: new Date('2026-01-07T08:30:00.000Z'),
                finishedAt: new Date('2026-01-07T08:30:01.000Z'),
              },
              {
                stepIndex: 2,
                stepName: 'fetch-asset-media',
                stepCategoryName: 'code',
                outcomeCode: 'abandoned',
                reasonCode: 'MEDIA_LIMIT_EXCEEDED',
                startedAt: new Date('2026-01-07T08:30:02.000Z'),
                finishedAt: new Date('2026-01-07T08:30:03.000Z'),
              },
            ],
          },
        },
      ]

      test.each(cases)('cannedRunKey: $params.cannedRunKey', ({
        params,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = renderer.buildStepsExpansion(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('when steps were not asked for', () => {
      const cases = [
        {
          params: {
            cannedRunKey: SUCCEEDED_RUN_KEY,
            expand: 'usage',
          },
        },
        {
          params: {
            cannedRunKey: SUCCEEDED_RUN_KEY,
            expand: 'toString',
          },
        },
        {
          params: {
            cannedRunKey: SUCCEEDED_RUN_KEY,
            expand: 'STEPS',
          },
        },
      ]

      test.each(cases)('expand: $params.expand', ({
        params,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = renderer.buildStepsExpansion(params)

        expect(actual)
          .toEqual({})
      })
    })
  })
})

describe('AiRunGetRenderer', () => {
  describe('#render()', () => {
    describe('when no expansion was asked for', () => {
      const cases = [
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: QUEUED_RUN_KEY,
              },
            },
          },
          expected: {
            runKey: QUEUED_RUN_KEY,
            runCategoryName: 'asset-media-extraction',
            externalRef: expect.any(String),
            subjectLabel: expect.any(String),
            correlationId: expect.any(String),
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
        },
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: RUNNING_RUN_KEY,
              },
            },
          },
          expected: {
            runKey: RUNNING_RUN_KEY,
            runCategoryName: 'asset-media-extraction',
            externalRef: expect.any(String),
            subjectLabel: expect.any(String),
            correlationId: expect.any(String),
            statusName: 'running',
            engine: {
              label: expect.any(String),
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
        },
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: SUCCEEDED_RUN_KEY,
              },
            },
          },
          expected: {
            runKey: SUCCEEDED_RUN_KEY,
            runCategoryName: 'asset-media-extraction',
            externalRef: expect.any(String),
            subjectLabel: expect.any(String),
            correlationId: expect.any(String),
            statusName: 'succeeded',
            engine: {
              label: expect.any(String),
              confidenceMethodVersion: expect.any(String),
            },
            usage: {
              modelCallCount: 3,
              inputTokenCount: 14650,
              outputTokenCount: 1284,
            },
            result: expect.objectContaining({
              fields: expect.any(Array),
              missingFieldPaths: expect.any(Array),
              unreadableMediaKeys: expect.any(Array),
              mediaSignature: expect.any(String),
            }),
            failure: null,
          },
        },
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: FAILED_RUN_KEY,
              },
            },
          },
          expected: {
            runKey: FAILED_RUN_KEY,
            runCategoryName: 'asset-media-extraction',
            externalRef: expect.any(String),
            subjectLabel: expect.any(String),
            correlationId: expect.any(String),
            statusName: 'failed',
            engine: {
              label: expect.any(String),
              confidenceMethodVersion: null,
            },
            usage: {
              modelCallCount: 0,
              inputTokenCount: 0,
              outputTokenCount: 0,
            },
            result: null,
            failure: {
              reasonCode: 'MEDIA_LIMIT_EXCEEDED',
              parameters: {
                mediaCountLimit: 12,
                sentMediaCount: 17,
              },
            },
          },
        },
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: CANCELED_RUN_KEY,
              },
            },
          },
          expected: {
            runKey: CANCELED_RUN_KEY,
            runCategoryName: 'asset-media-extraction',
            externalRef: expect.any(String),
            subjectLabel: expect.any(String),
            correlationId: expect.any(String),
            statusName: 'canceled',
            engine: {
              label: expect.any(String),
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
        },
      ]

      test.each(cases)('runKey: $params.request.pathParameterHash.runKey', async ({
        params,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = await renderer.render(params)

        expect(actual.content)
          .toEqual(expected)
      })
    })

    describe('to answer with the status code the contract fixes', () => {
      const cases = [
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: SUCCEEDED_RUN_KEY,
              },
            },
          },
          expected: 200,
        },
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: FAILED_RUN_KEY,
              },
            },
          },
          expected: 200,
        },
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: CANCELED_RUN_KEY,
              },
            },
          },
          expected: 200,
        },
      ]

      test.each(cases)('runKey: $params.request.pathParameterHash.runKey', async ({
        params,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = await renderer.render(params)

        expect(actual.statusCode)
          .toBe(expected)
      })
    })

    describe('when the run key names no canned run', () => {
      const cases = [
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: 'a-run-key-this-stub-does-not-name',
              },
            },
          },
          expected: SUCCEEDED_RUN_KEY,
        },
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: 'another-run-key-this-stub-does-not-name',
              },
            },
          },
          expected: SUCCEEDED_RUN_KEY,
        },
      ]

      test.each(cases)('runKey: $params.request.pathParameterHash.runKey', async ({
        params,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = await renderer.render(params)

        expect(actual.content)
          .toHaveProperty('runKey', expected)
      })
    })

    describe('when the run succeeded', () => {
      const cases = [
        {
          params: {
            query: {},
            request: {
              pathParameterHash: {
                runKey: SUCCEEDED_RUN_KEY,
              },
            },
          },
          expected: {
            fields: [
              {
                path: 'exterior.wallMaterial',
                value: 'brick',
                fieldStateName: 'extracted',
                suggestionConfidence: 0.92,
                reason: expect.any(String),
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
                fieldStateName: 'suggested',
                suggestionConfidence: 0.64,
                reason: expect.any(String),
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
                fieldStateName: 'derived',
                suggestionConfidence: 0.71,
                reason: expect.any(String),
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
            mediaSignature: expect.any(String),
          },
        },
      ]

      test.each(cases)('runKey: $params.request.pathParameterHash.runKey', async ({
        params,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = await renderer.render(params)

        expect(actual.content.result)
          .toEqual(expected)
      })
    })

    describe('when steps were asked for, and the run has not begun', () => {
      const cases = [
        {
          params: {
            query: {
              expand: 'steps',
            },
            request: {
              pathParameterHash: {
                runKey: QUEUED_RUN_KEY,
              },
            },
          },
        },
      ]

      test.each(cases)('runKey: $params.request.pathParameterHash.runKey', async ({
        params,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = await renderer.render(params)

        expect(actual.content.steps)
          .toHaveLength(0)
      })
    })

    describe('when steps were asked for', () => {
      const cases = [
        {
          params: {
            query: {
              expand: 'steps',
            },
            request: {
              pathParameterHash: {
                runKey: RUNNING_RUN_KEY,
              },
            },
          },
          expected: [
            {
              stepIndex: 1,
              stepName: 'select-suggestible-fields',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-02-01T09:00:00.000Z'),
              finishedAt: new Date('2026-02-01T09:00:01.000Z'),
            },
            {
              stepIndex: 2,
              stepName: 'fetch-asset-media',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-02-01T09:00:02.000Z'),
              finishedAt: new Date('2026-02-01T09:00:09.000Z'),
            },
            {
              stepIndex: 3,
              stepName: 'read-asset-media',
              stepCategoryName: 'ai',
              outcomeCode: 'running',
              reasonCode: null,
              startedAt: new Date('2026-02-01T09:00:10.000Z'),
              finishedAt: null,
            },
          ],
        },
        {
          params: {
            query: {
              expand: 'steps',
            },
            request: {
              pathParameterHash: {
                runKey: SUCCEEDED_RUN_KEY,
              },
            },
          },
          expected: [
            {
              stepIndex: 1,
              stepName: 'select-suggestible-fields',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-01-05T11:00:00.000Z'),
              finishedAt: new Date('2026-01-05T11:00:01.000Z'),
            },
            {
              stepIndex: 2,
              stepName: 'fetch-asset-media',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-01-05T11:00:02.000Z'),
              finishedAt: new Date('2026-01-05T11:00:14.000Z'),
            },
            {
              stepIndex: 3,
              stepName: 'read-asset-media',
              stepCategoryName: 'ai',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-01-05T11:00:15.000Z'),
              finishedAt: new Date('2026-01-05T11:00:48.000Z'),
            },
            {
              stepIndex: 4,
              stepName: 'validate-readings',
              stepCategoryName: 'code',
              outcomeCode: 'partially_settled',
              reasonCode: 'reading_too_long',
              startedAt: new Date('2026-01-05T11:00:49.000Z'),
              finishedAt: new Date('2026-01-05T11:00:50.000Z'),
            },
            {
              stepIndex: 5,
              stepName: 'settle-fields',
              stepCategoryName: 'code',
              outcomeCode: 'partially_settled',
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-01-05T11:00:51.000Z'),
              finishedAt: new Date('2026-01-05T11:00:52.000Z'),
            },
            {
              stepIndex: 6,
              stepName: 'score-confidence',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-01-05T11:00:53.000Z'),
              finishedAt: new Date('2026-01-05T11:00:54.000Z'),
            },
          ],
        },
        {
          params: {
            query: {
              expand: 'steps',
            },
            request: {
              pathParameterHash: {
                runKey: FAILED_RUN_KEY,
              },
            },
          },
          expected: [
            {
              stepIndex: 1,
              stepName: 'select-suggestible-fields',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-01-07T08:30:00.000Z'),
              finishedAt: new Date('2026-01-07T08:30:01.000Z'),
            },
            {
              stepIndex: 2,
              stepName: 'fetch-asset-media',
              stepCategoryName: 'code',
              outcomeCode: 'abandoned',
              reasonCode: 'MEDIA_LIMIT_EXCEEDED',
              startedAt: new Date('2026-01-07T08:30:02.000Z'),
              finishedAt: new Date('2026-01-07T08:30:03.000Z'),
            },
          ],
        },
        {
          params: {
            query: {
              expand: 'steps',
            },
            request: {
              pathParameterHash: {
                runKey: CANCELED_RUN_KEY,
              },
            },
          },
          expected: [
            {
              stepIndex: 1,
              stepName: 'select-suggestible-fields',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-01-09T14:15:00.000Z'),
              finishedAt: new Date('2026-01-09T14:15:01.000Z'),
            },
            {
              stepIndex: 2,
              stepName: 'fetch-asset-media',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-01-09T14:15:02.000Z'),
              finishedAt: new Date('2026-01-09T14:15:19.000Z'),
            },
            {
              stepIndex: 3,
              stepName: 'read-asset-media',
              stepCategoryName: 'ai',
              outcomeCode: 'abandoned',
              reasonCode: null,
              startedAt: new Date('2026-01-09T14:15:20.000Z'),
              finishedAt: new Date('2026-01-09T14:15:33.000Z'),
            },
          ],
        },
      ]

      test.each(cases)('runKey: $params.request.pathParameterHash.runKey', async ({
        params,
        expected,
      }) => {
        const renderer = AiRunGetRenderer.create()

        const actual = await renderer.render(params)

        expect(actual.content.steps)
          .toEqual(expected)
      })
    })
  })
})
