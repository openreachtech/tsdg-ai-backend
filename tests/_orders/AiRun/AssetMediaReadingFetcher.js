import AssetMediaReadingFetcher from '../../../app/assetMediaExtraction/AssetMediaReadingFetcher.js'

import StubAiModelProcessor from '../../../app/tools/AiModelProcessor/StubAiModelProcessor.js'

import AiModelResponse from '../../../app/tools/AiModelResponse.js'

import SendMessageToGeminiCapsule from '../../../app/geminiClient/SendMessageToGeminiCapsule.js'

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
 *
 * **`#run-cancel` writes into this file too, in `10860001` upward.** The describe at the foot is
 * that feature's: a cancellation arriving while a provider call is in flight, and the reading
 * already recorded staying recorded. It creates the one run it reads and borrows none, so its
 * position carries no dependency — and its run is accepted in November 2026, clear of the
 * September days every block above it uses.
 *
 * **The aborting of a call already in flight writes into this file last, in `11300001` upward.**
 * That is §15's deferred item, built once a driver existed that opens a connection at all, and its
 * two describes are the last two here. The first is the record a canceled run leaves behind — the
 * tokens of the readings taken before the abort, and the zero-token row of the call that was
 * abandoned; the second is the signal itself reaching every reading's driver call. Each creates
 * the one run it reads and borrows none, so their position carries no dependency, and both runs
 * are accepted in December 2026 — clear of the September days above and of November's block. The
 * block is higher than every id written anywhere in this folder.
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

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    /*
     * specs/1.0.0 §15's third acceptance criterion, as far as this class carries it: "a provider
     * call in flight is aborted, and the tokens spent up to the abort are still recorded". The
     * second half is the half a naive abort drops, and it is the half asserted here.
     *
     * **The signal is raised by the driver itself, which is what puts the abort in flight rather
     * than before the step.** `AbortSignal.abort()` handed in at the top would be answered by the
     * guard before anything was asked of a model, which is the case the describe above this one
     * already covers. Here the first call is made, the signal is raised while that call is being
     * answered — a client asking to cancel a run mid-reading — and the run stops at the next
     * boundary, which is where the second reading would have begun.
     *
     * **One reading was taken, so one `ai_model_calls` row stands.** Nothing removes it: the row
     * is written as the call answers, no transaction wraps the run, and the terminal write that
     * follows touches `ai_runs` alone. That is what makes §17's "ORT bills a run by reading the
     * model calls recorded against it, including the calls a canceled run had already spent" a
     * property of the record rather than of a calculation.
     *
     * **`totalReadingCount` still answers three**, which is what stops one surviving reading from
     * being taken for a unanimous consensus by the step that settles fields.
     *
     * The run is created here in `#run-cancel`'s own block, `10860001` upward.
     */
    describe('should keep the reading it had recorded when the run was canceled mid-step', () => {
      const cases = [
        {
          factoryParams: {
            readingCount: 3,
          },
          params: {
            aiRunRow: {
              id: 10860001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10860001',
              requestKey: 'request-key-10860001',
              requestBodyHash: 'request-body-hash-10860001',
              externalRef: 'external-ref-10860001',
              subjectLabel: 'Subject label of run 10860001',
              correlationId: 'correlation-id-10860001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10860001',
              acceptedAt: new Date('2026-11-07T01:01:01.001Z'),
              startedAt: new Date('2026-11-07T01:01:02.002Z'),
              finishedAt: null,
              cancelRequestedAt: new Date('2026-11-07T01:01:03.003Z'),
            },
            fetchParams: {
              aiRunId: 10860001,
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
                  id: 10860011,
                  fileUrl: '/workspace/medium-10860011',
                  fileType: 'image/png',
                },
              ],
            },
          },
          expected: {
            readings: [
              [
                {
                  path: 'attributes.roofMaterial',
                  value: 'tile',
                  evidenceKindName: 'visible-text',
                  reason: 'Visible along the eaves.',
                  sourceMediaKeys: [
                    'media-key-10860011',
                  ],
                },
              ],
            ],
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
        const aiRunWorkTerminator = new AbortController()

        const aiModelProcessor = {
          /**
           * Answer one forced tool call, and raise the run's signal while answering it.
           *
           * Raising it here is what stands in for the client's cancellation reaching the run while
           * a provider call is in flight. It is raised on every call rather than on a counted one,
           * because a stub that counted would be logic written inside a test.
           *
           * @returns {Promise<*>} The normalized response.
           */
          sendRequestToAi: async () => {
            aiRunWorkTerminator.abort()

            return {
              hasError: () => false,
              extractInputTokenCount: () => 1409,
              extractOutputTokenCount: () => 517,
              extractFunctionCalls: () => [
                {
                  name: 'record_field_readings',
                  arguments: {
                    readings: [
                      {
                        path: 'attributes.roofMaterial',
                        value: 'tile',
                        evidenceKindName: 'visible-text',
                        reason: 'Visible along the eaves.',
                        sourceMediaKeys: [
                          'media-key-10860011',
                        ],
                      },
                    ],
                  },
                },
              ],
            }
          },
        }
        const saveAiModelCallSpy = jest.spyOn(fetcher.aiModelCallRecorder, 'saveAiModelCall')

        const actual = await fetcher.fetchAssetMediaReadings({
          aiRunId: params.fetchParams.aiRunId,
          aiModelId: params.fetchParams.aiModelId,
          aiModelProcessor,
          aiAgent: params.fetchParams.aiAgent,
          composedPrompt: params.fetchParams.composedPrompt,
          attachedFiles: params.fetchParams.attachedFiles,
          signal: aiRunWorkTerminator.signal,
        })

        expect(actual)
          .toEqual(expected)
        expect(saveAiModelCallSpy)
          .toHaveBeenCalledTimes(1)
        expect(saveAiModelCallSpy)
          .toHaveBeenNthCalledWith(1, expect.objectContaining({
            aiRunId: params.fetchParams.aiRunId,
            aiModelId: params.fetchParams.aiModelId,
            actionName: 'read-media',
            readingIndex: 1,
            inputTokenCount: 1409,
            outputTokenCount: 517,
          }))
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    /*
     * specs/1.0.0 §15, the item deferred until a real vendor driver existed: a provider call
     * already in flight is no longer waited out, and the tokens spent before it are still recorded.
     *
     * **The abort lands inside the second call rather than between two**, which is what makes this
     * different from the describe above. There, the signal was raised while a call was being
     * answered and that call still answered; here the second call comes back the way an abandoned
     * vendor call comes back — as `SendMessageToGeminiCapsule.createWithError()`, the real capsule
     * a rejected `generateContent()` produces, built here from an `AbortError`-shaped failure. No
     * vendor is reached to produce it: the capsule is a value, and reading it is all this step does.
     *
     * **The first reading keeps its row and its counts.** §15's third criterion is that the tokens
     * a run spent before it stopped are recorded and reported, and that is asserted on the rows
     * rather than on the answer — `2101` and `803` are still there after the abort.
     *
     * **The aborted call is recorded too, and it records zero tokens.** That is not a gap in the
     * record and it must not be read as one: `@google/genai` states that aborting is a client-only
     * operation, that it does not cancel the request in the service, and that the usage is charged
     * regardless. So Google billed for that second reading and this service has no token count for
     * it, because a dropped connection brings back no usage figure. An operator reconciling an
     * invoice against `ai_model_calls` meets the difference there.
     *
     * **The third reading is never taken.** The run stops at the reading boundary, which is §15's
     * second criterion — a running run stops at the next step boundary, never mid-step — and it is
     * unchanged by this feature. What this feature changed is only that the run no longer waits out
     * the second call to reach that boundary.
     *
     * **`totalReadingCount` still answers three**, so one surviving reading cannot be taken for a
     * unanimous consensus by the step that settles fields.
     *
     * The run is created here in this feature's own block, `11300001` upward — higher than every id
     * written anywhere in this folder, and accepted in December 2026, clear of 2026-09-10 and of
     * every other block's days.
     */
    describe('should keep the tokens spent before a call was aborted in flight', () => {
      const cases = [
        {
          factoryParams: {
            readingCount: 3,
          },
          input: {
            aiRunRow: {
              id: 11300001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-11300001',
              requestKey: 'request-key-11300001',
              requestBodyHash: 'request-body-hash-11300001',
              externalRef: 'external-ref-11300001',
              subjectLabel: 'Subject label of run 11300001',
              correlationId: 'correlation-id-11300001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11300001',
              acceptedAt: new Date('2026-12-03T02:02:01.001Z'),
              startedAt: new Date('2026-12-03T02:02:02.002Z'),
              finishedAt: null,
              cancelRequestedAt: new Date('2026-12-03T02:02:03.003Z'),
            },
            fetchParams: {
              aiRunId: 11300001,
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
                  id: 11300011,
                  fileUrl: '/workspace/medium-11300011',
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
                  reason: 'Visible across the front elevation.',
                  sourceMediaKeys: [
                    'media-key-11300011',
                  ],
                },
              ],
            ],
            totalReadingCount: 3,
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        factoryParams,
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetcher = AssetMediaReadingFetcher.create(factoryParams)
        const aiRunWorkTerminator = new AbortController()

        const answeredResponse = {
          hasError: () => false,
          extractInputTokenCount: () => 2101,
          extractOutputTokenCount: () => 803,
          extractFunctionCalls: () => [
            {
              name: 'record_field_readings',
              arguments: {
                readings: [
                  {
                    path: 'attributes.wallMaterial',
                    value: 'brick',
                    evidenceKindName: 'visible-text',
                    reason: 'Visible across the front elevation.',
                    sourceMediaKeys: [
                      'media-key-11300011',
                    ],
                  },
                ],
              },
            },
          ],
        }
        const abortedCapsule = SendMessageToGeminiCapsule.createWithError({
          error: new Error('This operation was aborted'),
        })
        const abortedResponse = AiModelResponse.create({
          aiResponseCapsule: abortedCapsule,
        })

        const aiModelProcessor = {
          /**
           * Stand in for a driver, and be replaced by the spy below.
           *
           * @returns {Promise<*>} The normalized response.
           */
          sendRequestToAi: async () => answeredResponse,
        }
        jest.spyOn(aiModelProcessor, 'sendRequestToAi')
          .mockResolvedValueOnce(answeredResponse)
          .mockImplementationOnce(async () => {
            aiRunWorkTerminator.abort()

            return abortedResponse
          })
        const saveAiModelCallSpy = jest.spyOn(fetcher.aiModelCallRecorder, 'saveAiModelCall')

        const received = await fetcher.fetchAssetMediaReadings({
          aiRunId: input.fetchParams.aiRunId,
          aiModelId: input.fetchParams.aiModelId,
          aiModelProcessor,
          aiAgent: input.fetchParams.aiAgent,
          composedPrompt: input.fetchParams.composedPrompt,
          attachedFiles: input.fetchParams.attachedFiles,
          signal: aiRunWorkTerminator.signal,
        })

        expect(received)
          .toEqual(expected)
        expect(saveAiModelCallSpy)
          .toHaveBeenCalledTimes(2)
        expect(saveAiModelCallSpy)
          .toHaveBeenNthCalledWith(1, expect.objectContaining({
            aiRunId: input.fetchParams.aiRunId,
            aiModelId: input.fetchParams.aiModelId,
            actionName: 'read-media',
            readingIndex: 1,
            inputTokenCount: 2101,
            outputTokenCount: 803,
          }))
        expect(saveAiModelCallSpy)
          .toHaveBeenNthCalledWith(2, expect.objectContaining({
            aiRunId: input.fetchParams.aiRunId,
            aiModelId: input.fetchParams.aiModelId,
            actionName: 'read-media',
            readingIndex: 2,
            inputTokenCount: 0,
            outputTokenCount: 0,
            responseBody: null,
          }))
      })
    })
  })
})

describe('AssetMediaReadingFetcher', () => {
  describe('#fetchAssetMediaReadings()', () => {
    /*
     * The other half of the same crossing: every reading the step makes carries the run's own
     * signal down to the driver, under the name the driver contract gives it.
     *
     * Asserted on both calls and by reference. A step that handed the signal to the first reading
     * only, or that built a controller of its own, would leave a call in flight with nothing the
     * run can raise — and would pass a test that merely checked a signal was present somewhere.
     *
     * The run is created here in this feature's own block, `11300002`.
     */
    describe('should hand the run own abort signal to every reading it takes', () => {
      const cases = [
        {
          factoryParams: {
            readingCount: 2,
          },
          input: {
            aiRunRow: {
              id: 11300002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-11300002',
              requestKey: 'request-key-11300002',
              requestBodyHash: 'request-body-hash-11300002',
              externalRef: 'external-ref-11300002',
              subjectLabel: 'Subject label of run 11300002',
              correlationId: 'correlation-id-11300002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11300002',
              acceptedAt: new Date('2026-12-04T03:03:01.001Z'),
              startedAt: new Date('2026-12-04T03:03:02.002Z'),
              finishedAt: null,
            },
            fetchParams: {
              aiRunId: 11300002,
              aiModelId: 10110001, // AI_MODEL.STUB.ID
              aiAgent: {
                id: 10150001,
                name: 'asset-media-extraction-agent',
              },
              composedPrompt: {
                instruction: 'Read the photographs once more and record what they show.',
                role: 'You read photographs of a property.',
                toolSchemas: [
                  {
                    name: 'record_field_readings',
                  },
                ],
                instructionSavedAt: new Date('2026-09-24T00:00:04.004Z'),
              },
              attachedFiles: [
                {
                  id: 11300021,
                  fileUrl: '/workspace/medium-11300021',
                  fileType: 'image/jpeg',
                },
              ],
            },
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        factoryParams,
        input,
      }) => {
        await AiRun.create(input.aiRunRow)

        const fetcher = AssetMediaReadingFetcher.create(factoryParams)
        const aiRunWorkTerminator = new AbortController()

        const aiModelProcessor = {
          /**
           * Stand in for a driver, and answer a reading that found nothing.
           *
           * @returns {Promise<*>} The normalized response.
           */
          sendRequestToAi: async () => ({
            hasError: () => false,
            extractInputTokenCount: () => 1301,
            extractOutputTokenCount: () => 401,
            extractFunctionCalls: () => [],
          }),
        }
        const sendRequestToAiSpy = jest.spyOn(aiModelProcessor, 'sendRequestToAi')
        const expected = expect.objectContaining({
          abortSignal: aiRunWorkTerminator.signal, // same reference
        })

        await fetcher.fetchAssetMediaReadings({
          aiRunId: input.fetchParams.aiRunId,
          aiModelId: input.fetchParams.aiModelId,
          aiModelProcessor,
          aiAgent: input.fetchParams.aiAgent,
          composedPrompt: input.fetchParams.composedPrompt,
          attachedFiles: input.fetchParams.attachedFiles,
          signal: aiRunWorkTerminator.signal,
        })

        expect(sendRequestToAiSpy)
          .toHaveBeenCalledTimes(2)
        expect(sendRequestToAiSpy)
          .toHaveBeenNthCalledWith(1, expected)
        expect(sendRequestToAiSpy)
          .toHaveBeenNthCalledWith(2, expected)
      })
    })
  })
})
