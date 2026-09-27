import AiRunTracePurger from '../../../app/aiRunRetention/AiRunTracePurger.js'

import AiModelCall from '../../../sequelize/models/AiModelCall.js'
import AiRun from '../../../sequelize/models/AiRun.js'
import AiRunFieldOutcome from '../../../sequelize/models/AiRunFieldOutcome.js'
import AiRunStep from '../../../sequelize/models/AiRunStep.js'

/*
 * What the trace purge removes, and the stamp it leaves in place of it (specs/1.0.0, #retention).
 *
 * **Every run below is accepted in 2017, and every one of them already carries
 * `content_purged_at`.** Both are isolation rather than decoration. The first keeps each sweep's
 * horizon - two years back from a `now` in 2019 - clear of the 2026 runs this repository seeds and
 * every other test creates, so a sweep here reaches nothing but the rows of the describe that
 * created them. The second keeps these rows out of the content sweeps in `AiRunContentPurger.js`,
 * whose own horizons fall in 2019 and would otherwise select every 2017 run in the table. It is
 * also simply true: a run that has reached the trace horizon had its content emptied seven hundred
 * days earlier.
 *
 * **The windows descend down the file**, for the reason the sibling file states: a describe
 * asserting a count must not be handed a row an earlier describe left behind.
 *
 * Ids are #retention's own block, `11030001` upward, and none is borrowed.
 */

describe('AiRunTracePurger', () => {
  describe('#purgeExpiredAiRunTraces()', () => {
    /*
     * The field outcomes, which are the first of the three trace tables to go.
     *
     * They are deleted before the steps they point at, so that no intermediate state of the batch
     * has an outcome naming a step that is gone - this project keeps referential integrity in
     * application code, so nothing in the database would stop the other order.
     */
    describe('should delete the field outcomes of a run past the trace horizon', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11030001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11030001',
              requestKey: 'request-key-11030001',
              requestBodyHash: 'request-body-hash-11030001',
              externalRef: 'external-ref-11030001',
              subjectLabel: '',
              correlationId: 'correlation-id-11030001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11030001',
              acceptedAt: new Date('2017-06-01T01:01:01.001Z'),
              finishedAt: new Date('2017-06-01T01:01:09.009Z'),
              contentPurgedAt: new Date('2017-07-01T01:01:01.001Z'),
            },
            aiRunStepRow: {
              id: 11030101,
              AiRunId: 11030001,
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              stepIndex: 0,
              stepName: 'read-asset-media',
              outcomeCode: 'outcome-code-11030101',
              startedAt: new Date('2017-06-01T01:01:02.002Z'),
              finishedAt: new Date('2017-06-01T01:01:03.003Z'),
            },
            aiRunFieldOutcomeRow: {
              id: 11030201,
              AiRunId: 11030001,
              AiRunStepId: 11030101,
              fieldPath: 'asset.color',
              AiRunFieldStatusId: 1,
              AiRunEvidenceCategoryId: 1,
              suggestionConfidence: '0.8125',
              agreedReadingCount: 2,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-11030201',
              settledAt: new Date('2017-06-01T01:01:04.004Z'),
            },
            purgeArgs: {
              now: new Date('2019-06-05T05:05:05.005Z'),
            },
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        await AiRunStep.create(input.aiRunStepRow)

        await AiRunFieldOutcome.create(input.aiRunFieldOutcomeRow)

        const purger = AiRunTracePurger.create()

        await purger.purgeExpiredAiRunTraces(input.purgeArgs)

        const received = await AiRunFieldOutcome.findAll({ // Act
          where: {
            AiRunId: input.aiRunRow.id,
          },
        })

        expect(received) // Assert
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunTracePurger', () => {
  describe('#purgeExpiredAiRunTraces()', () => {
    /*
     * The steps, which are what §10 calls the decision trace in the narrow sense.
     */
    describe('should delete the steps of a run past the trace horizon', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11030002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11030002',
              requestKey: 'request-key-11030002',
              requestBodyHash: 'request-body-hash-11030002',
              externalRef: 'external-ref-11030002',
              subjectLabel: '',
              correlationId: 'correlation-id-11030002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11030002',
              acceptedAt: new Date('2017-06-02T02:02:02.002Z'),
              finishedAt: new Date('2017-06-02T02:02:09.009Z'),
              contentPurgedAt: new Date('2017-07-02T02:02:02.002Z'),
            },
            aiRunStepRow: {
              id: 11030102,
              AiRunId: 11030002,
              AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
              stepIndex: 0,
              stepName: 'select-suggestible-fields',
              outcomeCode: 'outcome-code-11030102',
              startedAt: new Date('2017-06-02T02:02:03.003Z'),
              finishedAt: new Date('2017-06-02T02:02:04.004Z'),
            },
            purgeArgs: {
              now: new Date('2019-06-05T05:05:05.005Z'),
            },
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        await AiRunStep.create(input.aiRunStepRow)

        const purger = AiRunTracePurger.create()

        await purger.purgeExpiredAiRunTraces(input.purgeArgs)

        const received = await AiRunStep.findAll({ // Act
          where: {
            AiRunId: input.aiRunRow.id,
          },
        })

        expect(received) // Assert
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunTracePurger', () => {
  describe('#purgeExpiredAiRunTraces()', () => {
    /*
     * The model calls, whose whole row goes rather than one column of it.
     *
     * The content purge empties `response_body` and keeps the rest, because the model, the prompt
     * version and the token counts are the decision trace. Two years later the trace itself is
     * past its clock, so the row goes - which also takes any raw output with it that a content
     * purge somehow never reached.
     */
    describe('should delete the model calls of a run past the trace horizon', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11030003,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11030003',
              requestKey: 'request-key-11030003',
              requestBodyHash: 'request-body-hash-11030003',
              externalRef: 'external-ref-11030003',
              subjectLabel: '',
              correlationId: 'correlation-id-11030003',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11030003',
              acceptedAt: new Date('2017-06-03T03:03:03.003Z'),
              finishedAt: new Date('2017-06-03T03:03:09.009Z'),
              contentPurgedAt: new Date('2017-07-03T03:03:03.003Z'),
            },
            aiModelCallRow: {
              id: 11030301,
              AiRunId: 11030003,
              AiModelId: 10110001,
              actionName: 'read-asset-medium',
              readingIndex: 2,
              promptVersion: '2017-05-01T00:00:00.000Z',
              latencyMilliseconds: 2345,
              inputTokenCount: 678,
              outputTokenCount: 90,
              responseBody: null,
              calledAt: new Date('2017-06-03T03:03:05.005Z'),
            },
            purgeArgs: {
              now: new Date('2019-06-05T05:05:05.005Z'),
            },
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        await AiModelCall.create(input.aiModelCallRow)

        const purger = AiRunTracePurger.create()

        await purger.purgeExpiredAiRunTraces(input.purgeArgs)

        const received = await AiModelCall.findAll({ // Act
          where: {
            AiRunId: input.aiRunRow.id,
          },
        })

        expect(received) // Assert
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunTracePurger', () => {
  describe('#purgeExpiredAiRunTraces()', () => {
    /*
     * The stamp, which is the only thing a trace purge leaves behind and the reason §19's fourth
     * criterion can be met at all.
     *
     * The trace is rows, so removing it leaves nothing to read: a run whose steps are gone looks
     * exactly like a run canceled before it took one. A run carrying `content_purged_at` alone is
     * inside the trace horizon and still answers why a value was or was not produced; a run
     * carrying both stamps is past both. Without `trace_purged_at` those two are the same row.
     *
     * The content stamp is asserted unchanged in the same breath. A trace purge writing both would
     * claim a content purge that never happened, and the two instants are two events - which is
     * what "two separate settings, never one" comes to on one row.
     */
    describe('should stamp the run and leave the content stamp where it found it', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11030004,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-11030004',
              requestKey: 'request-key-11030004',
              requestBodyHash: 'request-body-hash-11030004',
              externalRef: 'external-ref-11030004',
              subjectLabel: '',
              correlationId: 'correlation-id-11030004',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11030004',
              failureReasonCode: 'failure-reason-code-11030004',
              acceptedAt: new Date('2017-06-04T04:04:04.004Z'),
              finishedAt: new Date('2017-06-04T04:04:09.009Z'),
              contentPurgedAt: new Date('2017-07-04T04:04:04.004Z'),
            },
            aiRunStepRow: {
              id: 11030103,
              AiRunId: 11030004,
              AiRunStepCategoryId: 3, // AI_RUN_STEP_CATEGORY.HUMAN.ID
              stepIndex: 0,
              stepName: 'settle-asset-fields',
              outcomeCode: 'outcome-code-11030103',
              startedAt: new Date('2017-06-04T04:04:05.005Z'),
              finishedAt: new Date('2017-06-04T04:04:06.006Z'),
            },
            purgeArgs: {
              now: new Date('2019-06-05T05:05:05.005Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11030004,
            tracePurgedAt: new Date('2019-06-05T05:05:05.005Z'),
            contentPurgedAt: new Date('2017-07-04T04:04:04.004Z'),
            failureReasonCode: 'failure-reason-code-11030004',
            externalRef: 'external-ref-11030004',
            subjectLabel: '',
          }),
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        await AiRunStep.create(input.aiRunStepRow)

        const purger = AiRunTracePurger.create()

        await purger.purgeExpiredAiRunTraces(input.purgeArgs)

        const received = await AiRun.findOne({ // Act
          where: {
            id: input.aiRunRow.id,
          },
        })

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTracePurger', () => {
  describe('#purgeExpiredAiRunTraces()', () => {
    /*
     * What the sweep answers with when it clears the set, on the longer clock.
     *
     * This window's horizon falls before the accepted times of every describe above it, so no row
     * either of them left behind can be counted here.
     */
    describe('should answer with what it purged and that it finished', () => {
      const cases = [
        {
          input: {
            aiRunRows: [
              {
                id: 11030011,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11030011',
                requestKey: 'request-key-11030011',
                requestBodyHash: 'request-body-hash-11030011',
                externalRef: 'external-ref-11030011',
                subjectLabel: '',
                correlationId: 'correlation-id-11030011',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11030011',
                acceptedAt: new Date('2017-04-01T01:01:01.001Z'),
                contentPurgedAt: new Date('2017-05-01T01:01:01.001Z'),
              },
              {
                id: 11030012,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
                runKey: 'run-key-11030012',
                requestKey: 'request-key-11030012',
                requestBodyHash: 'request-body-hash-11030012',
                externalRef: 'external-ref-11030012',
                subjectLabel: '',
                correlationId: 'correlation-id-11030012',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11030012',
                acceptedAt: new Date('2017-04-02T02:02:02.002Z'),
                contentPurgedAt: new Date('2017-05-02T02:02:02.002Z'),
              },
            ],
            purgeArgs: {
              now: new Date('2019-04-10T10:10:10.010Z'),
            },
          },
          expected: {
            purgedAiRunCount: 2,
            batchCount: 1,
            isSweepExhausted: true,
          },
        },
      ]

      test.each(cases)('now: $input.purgeArgs.now', async ({
        input,
        expected,
      }) => {
        await AiRun.bulkCreate(input.aiRunRows) // Arrange

        const purger = AiRunTracePurger.create()

        const received = await purger.purgeExpiredAiRunTraces(input.purgeArgs) // Act

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTracePurger', () => {
  describe('#purgeExpiredAiRunTraces()', () => {
    /*
     * A sweep that runs out of batches before it runs out of rows, on the longer clock.
     *
     * The trace purge deletes rows across three tables rather than emptying columns on one, so a
     * batch of two hundred runs is several thousand rows in one transaction - which is exactly why
     * the bound exists here as much as on the shorter clock.
     */
    describe('should stop at its batch bound and say it did not finish', () => {
      const cases = [
        {
          factoryParams: {
            aiRunCountPerBatch: 1,
            maximumBatchCount: 2,
          },
          input: {
            aiRunRows: [
              {
                id: 11030021,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11030021',
                requestKey: 'request-key-11030021',
                requestBodyHash: 'request-body-hash-11030021',
                externalRef: 'external-ref-11030021',
                subjectLabel: '',
                correlationId: 'correlation-id-11030021',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11030021',
                acceptedAt: new Date('2017-02-01T01:01:01.001Z'),
                contentPurgedAt: new Date('2017-03-01T01:01:01.001Z'),
              },
              {
                id: 11030022,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11030022',
                requestKey: 'request-key-11030022',
                requestBodyHash: 'request-body-hash-11030022',
                externalRef: 'external-ref-11030022',
                subjectLabel: '',
                correlationId: 'correlation-id-11030022',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11030022',
                acceptedAt: new Date('2017-02-02T02:02:02.002Z'),
                contentPurgedAt: new Date('2017-03-02T02:02:02.002Z'),
              },
              {
                id: 11030023,
                ApiClientId: 10000001,
                AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
                AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
                runKey: 'run-key-11030023',
                requestKey: 'request-key-11030023',
                requestBodyHash: 'request-body-hash-11030023',
                externalRef: 'external-ref-11030023',
                subjectLabel: '',
                correlationId: 'correlation-id-11030023',
                callbackUrl: 'https://signing.client.development.invalid/callbacks/11030023',
                acceptedAt: new Date('2017-02-03T03:03:03.003Z'),
                contentPurgedAt: new Date('2017-03-03T03:03:03.003Z'),
              },
            ],
            purgeArgs: {
              now: new Date('2019-02-10T10:10:10.010Z'),
            },
          },
          expected: {
            purgedAiRunCount: 2,
            batchCount: 2,
            isSweepExhausted: false,
          },
        },
      ]

      test.each(cases)('aiRunCountPerBatch: $factoryParams.aiRunCountPerBatch', async ({
        factoryParams,
        input,
        expected,
      }) => {
        await AiRun.bulkCreate(input.aiRunRows) // Arrange

        const purger = AiRunTracePurger.create(factoryParams)

        const received = await purger.purgeExpiredAiRunTraces(input.purgeArgs) // Act

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTracePurger', () => {
  describe('#purgeExpiredAiRunTraces()', () => {
    /*
     * An instant that is not an instant, refused before anything is read - the same guard its twin
     * carries, for the same reason. A trace purge stamped `Invalid date` would delete two years of
     * decision trace and then be unable to say of which runs.
     *
     * None of these cases reaches the database, so none creates a row.
     */
    describe('should refuse a now that is not an instant', () => {
      const cases = [
        {
          params: {
            now: 'whenever',
          },
          label: 'a word that is not a time',
        },
        {
          params: {
            now: '2019-06-05T05:05:05.005Z',
          },
          label: 'a time written as a string, which is not what the signature asks for',
        },
        {
          params: {
            now: new Date('not a date at all'),
          },
          label: 'a Date carrying no time',
        },
        {
          params: {
            now: null,
          },
          label: 'nothing at all',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
      }) => {
        const purger = AiRunTracePurger.create() // Arrange
        const expected = 'AiRunTracePurger#purgeExpiredAiRunTraces() refused an instant that is not an instant: field now'

        const actual = () => purger.purgeExpiredAiRunTraces(params) // Act

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})
