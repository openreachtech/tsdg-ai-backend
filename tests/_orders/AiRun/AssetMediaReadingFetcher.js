import AssetMediaReadingFetcher from '../../../app/assetMediaExtraction/AssetMediaReadingFetcher.js'

import StubAiModelProcessor from '../../../app/tools/AiModelProcessor/StubAiModelProcessor.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * Step 3 of specs/1.0.0 §20, and its own acceptance criterion: "the media is read the configured
 * number of times, and each reading is recorded separately with its own reading index".
 *
 * Both halves are asserted, and the second is asserted on the rows rather than on the answer: the
 * spy on the recorder pins every call's `reading_index`, so a class that read three times and
 * recorded one row, or recorded three rows all numbered one, fails here.
 *
 * **The model processor is the one thing stood in for**, because it is the boundary a test must
 * never cross - a real driver would reach a vendor, and the keyless driver this installation
 * carries answers a tool call with no findings in it by design, which is not what step 3's contract
 * is about. `AiModelCallRecorder` runs for real and writes real `ai_model_calls` rows.
 *
 * **The two describes at the foot of this file are the exception, and are about that driver.** One
 * of them runs the real `StubAiModelProcessor` - a driver that opens no connection is not a
 * boundary, so there is nothing to stand in for - and pins what §20's fourth use case asks of a
 * keyless installation: a screen's worth of readings, drawn from the media the request names. The
 * other pins the other half of the same fork, that a driver answering for any other model is
 * carried through untouched.
 *
 * The runs are created here in `#asset-media-extraction`'s own block, `10610961` upward.
 */

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    describe('should read the media the configured number of times', () => {
      const cases = [
        {
          factoryParams: {
            readingCount: 3,
          },
          params: {
            aiRunRow: {
              id: 10610961,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610961',
              requestKey: 'request-key-10610961',
              requestBodyHash: 'request-body-hash-10610961',
              externalRef: 'external-ref-10610961',
              subjectLabel: 'Subject label of run 10610961',
              correlationId: 'correlation-id-10610961',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610961',
              acceptedAt: new Date('2026-09-26T10:00:01.001Z'),
              startedAt: new Date('2026-09-26T10:00:02.002Z'),
              finishedAt: null,
            },
            fetchParams: {
              aiRunId: 10610961,
              aiModelId: 10110001, // AI_MODEL.STUB.ID
              aiAgent: {
                id: 10150001,
                name: 'asset-media-extraction-agent',
              },
              composedPrompt: {
                instruction: 'Read the photographs and record what they show.',
                role: 'You read photographs of a property.',
                toolSchemas: [
                  {
                    name: 'record_field_readings',
                  },
                ],
                instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
              },
              attachedFiles: [
                {
                  id: 10610971,
                  fileUrl: '/workspace/medium-10610971',
                  fileType: 'image/jpeg',
                },
              ],
            },
          },
          expected: {
            readings: [
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610971',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610971',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610971',
                  ],
                },
              ],
            ],
            totalReadingCount: 3,
          },
        },
        {
          factoryParams: {
            readingCount: 2,
          },
          params: {
            aiRunRow: {
              id: 10610962,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610962',
              requestKey: 'request-key-10610962',
              requestBodyHash: 'request-body-hash-10610962',
              externalRef: 'external-ref-10610962',
              subjectLabel: 'Subject label of run 10610962',
              correlationId: 'correlation-id-10610962',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610962',
              acceptedAt: new Date('2026-09-26T11:00:01.001Z'),
              startedAt: new Date('2026-09-26T11:00:02.002Z'),
              finishedAt: null,
            },
            fetchParams: {
              aiRunId: 10610962,
              aiModelId: 10110001, // AI_MODEL.STUB.ID
              aiAgent: {
                id: 10150001,
                name: 'asset-media-extraction-agent',
              },
              composedPrompt: {
                instruction: 'Read the photographs and record what they show.',
                role: 'You read photographs of a property.',
                toolSchemas: [
                  {
                    name: 'record_field_readings',
                  },
                ],
                instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
              },
              attachedFiles: [
                {
                  id: 10610972,
                  fileUrl: '/workspace/medium-10610972',
                  fileType: 'image/png',
                },
              ],
            },
          },
          expected: {
            readings: [
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610971',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'brick',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible on the front wall.',
                  sourceMediaKeys: [
                    'media-key-10610971',
                  ],
                },
              ],
            ],
            totalReadingCount: 2,
          },
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)

        const fetcher = AssetMediaReadingFetcher.create(factoryParams)

        const aiModelProcessor = {
          /**
           * Answer one forced tool call carrying one finding.
           *
           * @returns {Promise<*>} The normalized response.
           */
          sendRequestToAi: async () => ({
            hasError: () => false,
            extractInputTokenCount: () => 1201,
            extractOutputTokenCount: () => 342,
            extractFunctionCalls: () => [
              {
                name: 'record_field_readings',
                arguments: {
                  readings: [
                    {
                      path: 'attributes.wallMaterial',
                      value: 'brick',
                      evidenceKindName: 'visible-text',
                      reason: 'Visible on the front wall.',
                      sourceMediaKeys: [
                        'media-key-10610971',
                      ],
                    },
                  ],
                },
              },
            ],
          }),
        }
        const saveAiModelCallSpy = jest.spyOn(fetcher.aiModelCallRecorder, 'saveAiModelCall')

        const actual = await fetcher.fetchAssetMediaReadings({
          aiRunId: params.fetchParams.aiRunId,
          aiModelId: params.fetchParams.aiModelId,
          aiModelProcessor,
          aiAgent: params.fetchParams.aiAgent,
          composedPrompt: params.fetchParams.composedPrompt,
          attachedFiles: params.fetchParams.attachedFiles,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toEqual(expected)
        expect(saveAiModelCallSpy)
          .toHaveBeenCalledTimes(expected.totalReadingCount)
        expect(saveAiModelCallSpy)
          .toHaveBeenNthCalledWith(1, expect.objectContaining({
            aiRunId: params.fetchParams.aiRunId,
            aiModelId: params.fetchParams.aiModelId,
            actionName: 'read-media',
            readingIndex: 1,
            inputTokenCount: 1201,
            outputTokenCount: 342,
          }))
        expect(saveAiModelCallSpy)
          .toHaveBeenNthCalledWith(2, expect.objectContaining({
            readingIndex: 2,
          }))
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    /*
     * [[Q113]]: a run told its time is up takes no further reading. The signal is already raised
     * when the step begins, so nothing is asked of a model and nothing is recorded - and
     * `totalReadingCount` still answers what the run set out to take, which is what keeps a field
     * from being settled by readings that never happened.
     */
    describe('should take no reading once the run has been told its time is up', () => {
      const cases = [
        {
          factoryParams: {
            readingCount: 3,
          },
          params: {
            aiRunRow: {
              id: 10610963,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-10610963',
              requestKey: 'request-key-10610963',
              requestBodyHash: 'request-body-hash-10610963',
              externalRef: 'external-ref-10610963',
              subjectLabel: 'Subject label of run 10610963',
              correlationId: 'correlation-id-10610963',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610963',
              acceptedAt: new Date('2026-09-26T12:00:01.001Z'),
              startedAt: new Date('2026-09-26T12:00:02.002Z'),
              finishedAt: new Date('2026-09-26T12:05:02.002Z'),
            },
            fetchParams: {
              aiRunId: 10610963,
              aiModelId: 10110001, // AI_MODEL.STUB.ID
              aiAgent: {
                id: 10150001,
                name: 'asset-media-extraction-agent',
              },
              composedPrompt: {
                instruction: 'Read the photographs and record what they show.',
                role: 'You read photographs of a property.',
                toolSchemas: [
                  {
                    name: 'record_field_readings',
                  },
                ],
                instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
              },
              attachedFiles: [],
            },
          },
          expected: {
            readings: [],
            totalReadingCount: 3,
          },
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)

        const fetcher = AssetMediaReadingFetcher.create(factoryParams)

        const aiModelProcessor = {
          /**
           * Answer a reading nobody should have asked for.
           *
           * @returns {Promise<*>} The normalized response.
           */
          sendRequestToAi: async () => ({
            hasError: () => false,
            extractInputTokenCount: () => 1,
            extractOutputTokenCount: () => 1,
            extractFunctionCalls: () => [],
          }),
        }
        const sendRequestToAiSpy = jest.spyOn(aiModelProcessor, 'sendRequestToAi')

        const actual = await fetcher.fetchAssetMediaReadings({
          aiRunId: params.fetchParams.aiRunId,
          aiModelId: params.fetchParams.aiModelId,
          aiModelProcessor,
          aiAgent: params.fetchParams.aiAgent,
          composedPrompt: params.fetchParams.composedPrompt,
          attachedFiles: params.fetchParams.attachedFiles,
          signal: AbortSignal.abort(),
        })

        expect(actual)
          .toEqual(expected)
        expect(sendRequestToAiSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    /*
     * A reading whose call failed contributes nothing and is still recorded: the call was made and
     * the tokens were spent, so a run billed by its calls must see it. `totalReadingCount` still
     * answers three, which is what stops the one surviving reading from looking unanimous.
     */
    describe('should record a reading whose call failed and carry none of it forward', () => {
      const cases = [
        {
          factoryParams: {
            readingCount: 1,
          },
          params: {
            aiRunRow: {
              id: 10610964,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610964',
              requestKey: 'request-key-10610964',
              requestBodyHash: 'request-body-hash-10610964',
              externalRef: 'external-ref-10610964',
              subjectLabel: 'Subject label of run 10610964',
              correlationId: 'correlation-id-10610964',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610964',
              acceptedAt: new Date('2026-09-26T13:00:01.001Z'),
              startedAt: new Date('2026-09-26T13:00:02.002Z'),
              finishedAt: null,
            },
            fetchParams: {
              aiRunId: 10610964,
              aiModelId: 10110001, // AI_MODEL.STUB.ID
              aiAgent: {
                id: 10150001,
                name: 'asset-media-extraction-agent',
              },
              composedPrompt: {
                instruction: 'Read the photographs and record what they show.',
                role: 'You read photographs of a property.',
                toolSchemas: [
                  {
                    name: 'record_field_readings',
                  },
                ],
                instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
              },
              attachedFiles: [],
            },
          },
          expected: {
            readings: [],
            totalReadingCount: 1,
          },
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)

        const fetcher = AssetMediaReadingFetcher.create(factoryParams)

        const aiModelProcessor = {
          /**
           * Answer a failure, as a driver whose vendor refused the call does.
           *
           * @returns {Promise<*>} The normalized response.
           */
          sendRequestToAi: async () => ({
            hasError: () => true,
            extractInputTokenCount: () => 880,
            extractOutputTokenCount: () => 0,
            extractErrorMessage: () => 'the vendor refused the call',
            extractFunctionCalls: () => [],
          }),
        }
        const saveAiModelCallSpy = jest.spyOn(fetcher.aiModelCallRecorder, 'saveAiModelCall')

        const actual = await fetcher.fetchAssetMediaReadings({
          aiRunId: params.fetchParams.aiRunId,
          aiModelId: params.fetchParams.aiModelId,
          aiModelProcessor,
          aiAgent: params.fetchParams.aiAgent,
          composedPrompt: params.fetchParams.composedPrompt,
          attachedFiles: params.fetchParams.attachedFiles,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toEqual(expected)
        expect(saveAiModelCallSpy)
          .toHaveBeenCalledWith(expect.objectContaining({
            aiRunId: 10610964,
            readingIndex: 1,
            inputTokenCount: 880,
            outputTokenCount: 0,
            responseBody: null,
          }))
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    describe('should throw error', () => {
      const cases = [
        {
          params: {
            aiRunId: 10610965,
            aiModelId: 10110001, // AI_MODEL.STUB.ID
            aiModelProcessor: null,
            aiAgent: {
              id: 10150001,
              name: 'asset-media-extraction-agent',
            },
            composedPrompt: {
              instruction: 'Read the photographs and record what they show.',
              role: 'You read photographs of a property.',
              toolSchemas: [],
              instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
            },
            attachedFiles: [],
            signal: AbortSignal.timeout(60000),
          },
          expected: 'AssetMediaReadingFetcher#fetchAssetMediaReadings() refused a run whose agent offers no reading tool: AiRunId 10610965, tool record_field_readings',
        },
        {
          params: {
            aiRunId: 10610966,
            aiModelId: 10110001, // AI_MODEL.STUB.ID
            aiModelProcessor: null,
            aiAgent: {
              id: 10150001,
              name: 'asset-media-extraction-agent',
            },
            composedPrompt: {
              instruction: 'Read the photographs and record what they show.',
              role: 'You read photographs of a property.',
              toolSchemas: [
                {
                  name: 'some_other_tool',
                },
              ],
              instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
            },
            attachedFiles: [],
            signal: AbortSignal.timeout(60000),
          },
          expected: 'AssetMediaReadingFetcher#fetchAssetMediaReadings() refused a run whose agent offers no reading tool: AiRunId 10610966, tool record_field_readings',
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', async ({
        params,
        expected,
      }) => {
        const fetcher = AssetMediaReadingFetcher.create()

        const actual = () => fetcher.fetchAssetMediaReadings(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    /*
     * specs/1.0.0 §20's fourth use case: "the client system builds and demonstrates its whole
     * suggestion screen before any API key exists, because the stub answers deterministically from
     * the media the request names".
     *
     * The driver here is the real keyless one, and it fills in no findings - so what the three
     * readings carry is this service's own fixture, and its being there at all is the whole point
     * of the case. The three readings are identical, which is what lets step 5 settle anything, and
     * every value is written out rather than recomputed, so a draw that stopped being a function of
     * the request alone fails here.
     *
     * `response_body` is asserted beside them: the stand-in happens before the call is recorded, so
     * the row a run is billed and traced by carries the findings the run went on to settle rather
     * than the empty call the driver made.
     */
    describe('should answer a keyless run from this service own fixture', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10610967,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610967',
              requestKey: 'request-key-10610967',
              requestBodyHash: 'request-body-hash-10610967',
              externalRef: 'external-ref-10610967',
              subjectLabel: 'Subject label of run 10610967',
              correlationId: 'correlation-id-10610967',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610967',
              acceptedAt: new Date('2026-09-26T11:00:01.001Z'),
              startedAt: new Date('2026-09-26T11:00:02.002Z'),
              finishedAt: null,
            },
            fetchParams: {
              aiRunId: 10610967,
              aiModelId: 10110001, // AI_MODEL.STUB.ID
              aiAgent: {
                id: 10150001,
                name: 'asset-media-extraction-agent',
              },
              composedPrompt: {
                instruction: 'Read the photographs and record what they show.',
                role: 'You read photographs of a property.',
                toolSchemas: [
                  {
                    name: 'record_field_readings',
                  },
                ],
                instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
              },
              fieldSchema: [
                {
                  path: 'attributes.wallMaterial',
                  label: 'Wall material',
                  valueKind: 'select',
                  isRequired: true,
                  options: [
                    'brick',
                    'concrete',
                    'timber',
                  ],
                },
                {
                  path: 'attributes.frontageNote',
                  label: 'Frontage note',
                  valueKind: 'text',
                  isRequired: false,
                  maxLength: 64,
                },
              ],
              mediaSignature: 'media-signature-10610967',
              attachedFiles: [
                {
                  id: 10610977,
                  fileUrl: '/workspace/medium-10610977',
                  fileType: 'image/jpeg',
                },
              ],
              readableMediaKeys: [
                'media-key-10610977',
              ],
            },
          },
          expected: {
            readings: [
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'timber',
                  evidenceKindName: 'category-prior',
                  reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
                  sourceMediaKeys: [
                    'media-key-10610977',
                  ],
                },
                {
                  path: 'attributes.frontageNote',
                  value: 'stub-value-2115552256',
                  evidenceKindName: 'visual-estimate',
                  reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
                  sourceMediaKeys: [
                    'media-key-10610977',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'timber',
                  evidenceKindName: 'category-prior',
                  reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
                  sourceMediaKeys: [
                    'media-key-10610977',
                  ],
                },
                {
                  path: 'attributes.frontageNote',
                  value: 'stub-value-2115552256',
                  evidenceKindName: 'visual-estimate',
                  reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
                  sourceMediaKeys: [
                    'media-key-10610977',
                  ],
                },
              ],
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'timber',
                  evidenceKindName: 'category-prior',
                  reason: '[stub] demonstration value for attributes.wallMaterial, supplied without a model call.',
                  sourceMediaKeys: [
                    'media-key-10610977',
                  ],
                },
                {
                  path: 'attributes.frontageNote',
                  value: 'stub-value-2115552256',
                  evidenceKindName: 'visual-estimate',
                  reason: '[stub] demonstration value for attributes.frontageNote, supplied without a model call.',
                  sourceMediaKeys: [
                    'media-key-10610977',
                  ],
                },
              ],
            ],
            totalReadingCount: 3,
          },
          expectedResponseBody: '[{"name":"record_field_readings","arguments":{"readings":[{"path":"attributes.wallMaterial","value":"timber","evidenceKindName":"category-prior","reason":"[stub] demonstration value for attributes.wallMaterial, supplied without a model call.","sourceMediaKeys":["media-key-10610977"]},{"path":"attributes.frontageNote","value":"stub-value-2115552256","evidenceKindName":"visual-estimate","reason":"[stub] demonstration value for attributes.frontageNote, supplied without a model call.","sourceMediaKeys":["media-key-10610977"]}]}}]',
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        expected,
        expectedResponseBody,
      }) => {
        await AiRun.create(params.aiRunRow)
        const fetcher = AssetMediaReadingFetcher.create()
        const aiModelProcessor = StubAiModelProcessor.create()
        const saveAiModelCallSpy = jest.spyOn(fetcher.aiModelCallRecorder, 'saveAiModelCall')

        const actual = await fetcher.fetchAssetMediaReadings({
          aiRunId: params.fetchParams.aiRunId,
          aiModelId: params.fetchParams.aiModelId,
          aiModelProcessor,
          aiAgent: params.fetchParams.aiAgent,
          composedPrompt: params.fetchParams.composedPrompt,
          fieldSchema: params.fetchParams.fieldSchema,
          mediaSignature: params.fetchParams.mediaSignature,
          attachedFiles: params.fetchParams.attachedFiles,
          readableMediaKeys: params.fetchParams.readableMediaKeys,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toEqual(expected)
        expect(saveAiModelCallSpy)
          .toHaveBeenCalledTimes(expected.totalReadingCount)
        expect(saveAiModelCallSpy)
          .toHaveBeenNthCalledWith(1, expect.objectContaining({
            actionName: 'read-media',
            readingIndex: 1,
            responseBody: expectedResponseBody,
          }))
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    /*
     * The other half of the same fork. A driver answering for any model but the keyless one has its
     * own findings, and they are what the reading carries - the fixture is not merged into them,
     * not appended to them, and not consulted at all. The schema, the signature and the photographs
     * are handed in exactly as they are on the case above, so a version that supplied findings for
     * every driver would answer the fixture here and fail.
     */
    describe('should carry another driver answer through untouched', () => {
      const cases = [
        {
          params: {
            aiRunRow: {
              id: 10610968,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10610968',
              requestKey: 'request-key-10610968',
              requestBodyHash: 'request-body-hash-10610968',
              externalRef: 'external-ref-10610968',
              subjectLabel: 'Subject label of run 10610968',
              correlationId: 'correlation-id-10610968',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10610968',
              acceptedAt: new Date('2026-09-26T12:00:01.001Z'),
              startedAt: new Date('2026-09-26T12:00:02.002Z'),
              finishedAt: null,
            },
            fetchParams: {
              aiRunId: 10610968,
              aiModelId: 10110001, // AI_MODEL.STUB.ID
              aiAgent: {
                id: 10150001,
                name: 'asset-media-extraction-agent',
              },
              composedPrompt: {
                instruction: 'Read the photographs and record what they show.',
                role: 'You read photographs of a property.',
                toolSchemas: [
                  {
                    name: 'record_field_readings',
                  },
                ],
                instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
              },
              fieldSchema: [
                {
                  path: 'attributes.wallMaterial',
                  label: 'Wall material',
                  valueKind: 'select',
                  isRequired: true,
                  options: [
                    'brick',
                    'concrete',
                    'timber',
                  ],
                },
              ],
              mediaSignature: 'media-signature-10610968',
              attachedFiles: [
                {
                  id: 10610978,
                  fileUrl: '/workspace/medium-10610978',
                  fileType: 'image/jpeg',
                },
              ],
              readableMediaKeys: [
                'media-key-10610978',
              ],
            },
          },
          expected: {
            readings: [
              [
                {
                  path: 'attributes.wallMaterial',
                  value: 'timber',
                  evidenceKindName: 'visible-text',
                  reason: 'Written on the plate beside the door.',
                  sourceMediaKeys: [
                    'media-key-10610978',
                  ],
                },
              ],
            ],
            totalReadingCount: 1,
          },
        },
      ]

      test.each(cases)('runKey: $params.aiRunRow.runKey', async ({
        params,
        expected,
      }) => {
        await AiRun.create(params.aiRunRow)
        const fetcher = AssetMediaReadingFetcher.create({
          readingCount: 1,
        })
        const aiModelProcessor = {
          aiModel: 'some-vendor-model',

          /**
           * Answer one forced tool call carrying this driver own finding.
           *
           * @returns {Promise<*>} The normalized response.
           */
          sendRequestToAi: async () => ({
            hasError: () => false,
            extractInputTokenCount: () => 2401,
            extractOutputTokenCount: () => 684,
            extractFunctionCalls: () => [
              {
                name: 'record_field_readings',
                arguments: {
                  readings: [
                    {
                      path: 'attributes.wallMaterial',
                      value: 'timber',
                      evidenceKindName: 'visible-text',
                      reason: 'Written on the plate beside the door.',
                      sourceMediaKeys: [
                        'media-key-10610978',
                      ],
                    },
                  ],
                },
              },
            ],
          }),
        }

        const actual = await fetcher.fetchAssetMediaReadings({
          aiRunId: params.fetchParams.aiRunId,
          aiModelId: params.fetchParams.aiModelId,
          aiModelProcessor,
          aiAgent: params.fetchParams.aiAgent,
          composedPrompt: params.fetchParams.composedPrompt,
          fieldSchema: params.fetchParams.fieldSchema,
          mediaSignature: params.fetchParams.mediaSignature,
          attachedFiles: params.fetchParams.attachedFiles,
          readableMediaKeys: params.fetchParams.readableMediaKeys,
          signal: AbortSignal.timeout(60000),
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
