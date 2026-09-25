import AiRunStepRecorder from '../../../app/aiRun/AiRunStepRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * Every run this file records a step against is created by this file, in `#run-record`'s own id
 * block (`10210001` upward). The development seeders already hang a step trace off the runs
 * `#run-contract` seeded, and `(ai_run_id, step_index)` is UNIQUE — so a step written here against
 * one of those runs either collides with the seeded trace outright, or reads back through the
 * finder below mixed in with steps this file never wrote. A test that borrows another writer's
 * rows passes or fails by who claimed them first, which is not what any of these cases is about.
 *
 * Each case creates a run of its own, so the step index a case claims is counted within a run
 * nothing else writes to, and no case depends on another having run before it.
 */

describe('AiRunStepRecorder', () => {
  describe('#saveAiRunStep()', () => {
    /*
     * One step, written whole at the moment it closes.
     *
     * The three cases carry the three categories a step can have, because the category is the one
     * value this class derives, and a run that thought for itself must never read back as a run
     * that called a model.
     *
     * The last of them has no finishing instant. A step that was cut short - the run hit its time
     * limit, or the owner walked away from it - still started, and still ended in an outcome, so it
     * is recorded with a null `finishedAt` rather than with an invented one.
     */
    describe('should save the step it was handed', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10210001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210001',
              requestKey: 'request-key-10210001',
              requestBodyHash: 'request-body-hash-10210001',
              externalRef: 'external-ref-10210001',
              subjectLabel: 'Subject label of run 10210001',
              correlationId: 'correlation-id-10210001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210001',
              acceptedAt: new Date('2026-09-21T01:00:01.001Z'),
              startedAt: new Date('2026-09-21T01:00:02.002Z'),
              finishedAt: null,
            },
            step: {
              aiRunId: 10210001,
              stepIndex: 1,
              stepName: 'fetch-asset-media',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-21T01:01:01.001Z'),
              finishedAt: new Date('2026-09-21T01:01:02.002Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10210001,
            AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
            stepIndex: 1,
            stepName: 'fetch-asset-media',
            outcomeCode: 'succeeded',
            rejections: null,
            reasonCode: null,
            startedAt: new Date('2026-09-21T01:01:01.001Z'),
            finishedAt: new Date('2026-09-21T01:01:02.002Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10210002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210002',
              requestKey: 'request-key-10210002',
              requestBodyHash: 'request-body-hash-10210002',
              externalRef: 'external-ref-10210002',
              subjectLabel: 'Subject label of run 10210002',
              correlationId: 'correlation-id-10210002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210002',
              acceptedAt: new Date('2026-09-21T02:00:01.001Z'),
              startedAt: new Date('2026-09-21T02:00:02.002Z'),
              finishedAt: null,
            },
            step: {
              aiRunId: 10210002,
              stepIndex: 2,
              stepName: 'read-asset-media',
              stepCategoryName: 'ai',
              outcomeCode: 'partially_settled',
              // The field path, the reason and the figures. No value read out of the medium
              // appears here, and none may: this row outlives the content by two years.
              rejections: [
                {
                  fieldPath: 'subject.alpha',
                  reasonCode: 'below_agreement_threshold',
                  figures: {
                    agreedReadingCount: 1,
                    totalReadingCount: 3,
                  },
                },
                {
                  fieldPath: 'subject.beta',
                  reasonCode: 'reading_too_long',
                  figures: {
                    readingLength: 641,
                  },
                },
              ],
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-09-21T02:02:02.002Z'),
              finishedAt: new Date('2026-09-21T02:02:09.009Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10210002,
            AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
            stepIndex: 2,
            stepName: 'read-asset-media',
            outcomeCode: 'partially_settled',
            rejections: [
              {
                fieldPath: 'subject.alpha',
                reasonCode: 'below_agreement_threshold',
                figures: {
                  agreedReadingCount: 1,
                  totalReadingCount: 3,
                },
              },
              {
                fieldPath: 'subject.beta',
                reasonCode: 'reading_too_long',
                figures: {
                  readingLength: 641,
                },
              },
            ],
            reasonCode: 'low_agreement',
            startedAt: new Date('2026-09-21T02:02:02.002Z'),
            finishedAt: new Date('2026-09-21T02:02:09.009Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10210003,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210003',
              requestKey: 'request-key-10210003',
              requestBodyHash: 'request-body-hash-10210003',
              externalRef: 'external-ref-10210003',
              subjectLabel: 'Subject label of run 10210003',
              correlationId: 'correlation-id-10210003',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210003',
              acceptedAt: new Date('2026-09-21T03:00:01.001Z'),
              startedAt: new Date('2026-09-21T03:00:02.002Z'),
              finishedAt: null,
            },
            step: {
              aiRunId: 10210003,
              stepIndex: 1,
              stepName: 'confirm-reading',
              stepCategoryName: 'human',
              outcomeCode: 'abandoned',
              rejections: null,
              reasonCode: 'run_time_limit_reached',
              startedAt: new Date('2026-09-21T03:03:03.003Z'),
              finishedAt: null, // the step was cut short, and never finished
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10210003,
            AiRunStepCategoryId: 3, // AI_RUN_STEP_CATEGORY.HUMAN.ID
            stepIndex: 1,
            stepName: 'confirm-reading',
            outcomeCode: 'abandoned',
            rejections: null,
            reasonCode: 'run_time_limit_reached',
            startedAt: new Date('2026-09-21T03:03:03.003Z'),
            finishedAt: null,
          }),
        },
      ]

      test.each(cases)('stepName: $input.step.stepName', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStepRecorder.create()

        const received = await recorder.saveAiRunStep(input.step)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#saveAiRunStep()', () => {
    /*
     * A category that could not be derived refuses the row.
     *
     * The derivation answers null for a name that names no category, and the column is NOT NULL, so
     * the write is refused rather than landing under a guessed category. A step filed under the
     * wrong category would misreport, forever and silently, whether the run thought for itself or
     * called a model - and no later reader could tell that it had.
     */
    describe('when the category name names no category', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10210011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210011',
              requestKey: 'request-key-10210011',
              requestBodyHash: 'request-body-hash-10210011',
              externalRef: 'external-ref-10210011',
              subjectLabel: 'Subject label of run 10210011',
              correlationId: 'correlation-id-10210011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210011',
              acceptedAt: new Date('2026-09-21T04:00:01.001Z'),
              startedAt: new Date('2026-09-21T04:00:02.002Z'),
              finishedAt: null,
            },
            step: {
              aiRunId: 10210011,
              stepIndex: 101,
              stepName: 'refused-by-unknown-category',
              stepCategoryName: 'model', // reads like a category, and is not one
              outcomeCode: 'succeeded',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-21T04:04:04.004Z'),
              finishedAt: new Date('2026-09-21T04:04:05.005Z'),
            },
          },
        },
        {
          input: {
            aiRunRow: {
              id: 10210012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210012',
              requestKey: 'request-key-10210012',
              requestBodyHash: 'request-body-hash-10210012',
              externalRef: 'external-ref-10210012',
              subjectLabel: 'Subject label of run 10210012',
              correlationId: 'correlation-id-10210012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210012',
              acceptedAt: new Date('2026-09-21T05:00:01.001Z'),
              startedAt: new Date('2026-09-21T05:00:02.002Z'),
              finishedAt: null,
            },
            step: {
              aiRunId: 10210012,
              stepIndex: 102,
              stepName: 'refused-by-wrong-case',
              stepCategoryName: 'AI', // the right name in the wrong case
              outcomeCode: 'succeeded',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-21T05:05:05.005Z'),
              finishedAt: new Date('2026-09-21T05:05:06.006Z'),
            },
          },
        },
      ]

      test.each(cases)('stepName: $input.step.stepName', async ({
        input,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStepRecorder.create()

        const received = () => recorder.saveAiRunStep(input.step)

        await expect(received)
          .rejects
          .toThrow('AiRunStep.AiRunStepCategoryId cannot be null')
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#findAiRunSteps()', () => {
    /*
     * The round trip, and the acceptance criterion it backs: each step of a run is recorded in the
     * order it ran, and says whether it was code or a model call.
     *
     * The steps are written deliberately out of order - the third first, then the first, then the
     * second - because a finder that answered in insertion order would pass a test whose writes
     * already arrived sorted, and would then misreport the run of every worker that recorded a step
     * late. The order asserted here is the one the steps claim in `step_index`, which is the order
     * they ran in.
     *
     * Each row is asserted with its category loaded, so what carried the step out is readable from
     * the step rather than only from an id a reader has to look up elsewhere.
     *
     * It is read through the class's own finder rather than through the model, because a test
     * verifies by exercising the code under test. The rows are the ones this test wrote, on a run
     * this test created: the whole list the finder answers with is therefore this test's own, which
     * is what lets it be asserted exactly and in order rather than only searched for a match.
     */
    describe('when the steps were written by #saveAiRunStep()', () => {
      const cases = [
        {
          input: {
            aiRunId: 10210021,
            aiRunRow: {
              id: 10210021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210021',
              requestKey: 'request-key-10210021',
              requestBodyHash: 'request-body-hash-10210021',
              externalRef: 'external-ref-10210021',
              subjectLabel: 'Subject label of run 10210021',
              correlationId: 'correlation-id-10210021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210021',
              acceptedAt: new Date('2026-09-22T01:00:01.001Z'),
              startedAt: new Date('2026-09-22T01:00:02.002Z'),
              finishedAt: null,
            },
            thirdSavedStep: {
              aiRunId: 10210021,
              stepIndex: 3,
              stepName: 'settle-fields',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-22T01:03:01.001Z'),
              finishedAt: new Date('2026-09-22T01:03:02.002Z'),
            },
            firstSavedStep: {
              aiRunId: 10210021,
              stepIndex: 1,
              stepName: 'fetch-asset-media',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-22T01:01:01.001Z'),
              finishedAt: new Date('2026-09-22T01:01:02.002Z'),
            },
            secondSavedStep: {
              aiRunId: 10210021,
              stepIndex: 2,
              stepName: 'read-asset-media',
              stepCategoryName: 'ai',
              outcomeCode: 'succeeded',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-22T01:02:01.001Z'),
              finishedAt: new Date('2026-09-22T01:02:08.008Z'),
            },
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'fetch-asset-media',
              AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
              AiRunStepCategory: expect.objectContaining({
                name: 'code',
              }),
              startedAt: new Date('2026-09-22T01:01:01.001Z'),
              finishedAt: new Date('2026-09-22T01:01:02.002Z'),
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'read-asset-media',
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              AiRunStepCategory: expect.objectContaining({
                name: 'ai',
              }),
              startedAt: new Date('2026-09-22T01:02:01.001Z'),
              finishedAt: new Date('2026-09-22T01:02:08.008Z'),
            }),
            expect.objectContaining({
              stepIndex: 3,
              stepName: 'settle-fields',
              AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
              AiRunStepCategory: expect.objectContaining({
                name: 'code',
              }),
              startedAt: new Date('2026-09-22T01:03:01.001Z'),
              finishedAt: new Date('2026-09-22T01:03:02.002Z'),
            }),
          ],
        },
        {
          input: {
            aiRunId: 10210022,
            aiRunRow: {
              id: 10210022,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210022',
              requestKey: 'request-key-10210022',
              requestBodyHash: 'request-body-hash-10210022',
              externalRef: 'external-ref-10210022',
              subjectLabel: 'Subject label of run 10210022',
              correlationId: 'correlation-id-10210022',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210022',
              acceptedAt: new Date('2026-09-22T02:00:01.001Z'),
              startedAt: new Date('2026-09-22T02:00:02.002Z'),
              finishedAt: null,
            },
            thirdSavedStep: {
              aiRunId: 10210022,
              stepIndex: 3,
              stepName: 'await-owner-decision',
              stepCategoryName: 'human',
              outcomeCode: 'abandoned',
              rejections: null,
              reasonCode: 'run_time_limit_reached',
              startedAt: new Date('2026-09-22T02:03:01.001Z'),
              finishedAt: null, // the step was cut short, and never finished
            },
            firstSavedStep: {
              aiRunId: 10210022,
              stepIndex: 1,
              stepName: 'digest-request-body',
              stepCategoryName: 'code',
              outcomeCode: 'succeeded',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-22T02:01:01.001Z'),
              finishedAt: new Date('2026-09-22T02:01:02.002Z'),
            },
            secondSavedStep: {
              aiRunId: 10210022,
              stepIndex: 2,
              stepName: 'score-readings',
              stepCategoryName: 'ai',
              outcomeCode: 'partially_settled',
              rejections: [
                {
                  fieldPath: 'subject.gamma',
                  reasonCode: 'below_agreement_threshold',
                  figures: {
                    agreedReadingCount: 2,
                    totalReadingCount: 5,
                  },
                },
              ],
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-09-22T02:02:01.001Z'),
              finishedAt: new Date('2026-09-22T02:02:07.007Z'),
            },
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'digest-request-body',
              AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
              AiRunStepCategory: expect.objectContaining({
                name: 'code',
              }),
              startedAt: new Date('2026-09-22T02:01:01.001Z'),
              finishedAt: new Date('2026-09-22T02:01:02.002Z'),
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'score-readings',
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              AiRunStepCategory: expect.objectContaining({
                name: 'ai',
              }),
              rejections: [
                {
                  fieldPath: 'subject.gamma',
                  reasonCode: 'below_agreement_threshold',
                  figures: {
                    agreedReadingCount: 2,
                    totalReadingCount: 5,
                  },
                },
              ],
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-09-22T02:02:01.001Z'),
              finishedAt: new Date('2026-09-22T02:02:07.007Z'),
            }),
            expect.objectContaining({
              stepIndex: 3,
              stepName: 'await-owner-decision',
              AiRunStepCategoryId: 3, // AI_RUN_STEP_CATEGORY.HUMAN.ID
              AiRunStepCategory: expect.objectContaining({
                name: 'human',
              }),
              startedAt: new Date('2026-09-22T02:03:01.001Z'),
              finishedAt: null,
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStepRecorder.create()
        await recorder.saveAiRunStep(input.thirdSavedStep)
        await recorder.saveAiRunStep(input.firstSavedStep)
        await recorder.saveAiRunStep(input.secondSavedStep)

        const findAiRunStepsArgs = {
          aiRunId: input.aiRunId,
        }

        const received = await recorder.findAiRunSteps(findAiRunStepsArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#saveAiRunStep()', () => {
    /*
     * A step whose caller handed over more than this column may carry is still recorded, and the
     * row it writes holds only the field path, the reason code and the figures.
     *
     * The three payloads below are the ones a security audit put through this method and read back
     * out of the database: a rejection carrying the value it rejected, a bare string in place of
     * the array, and entries nested inside arrays of their own - which reached the write as a
     * forty-thousand-deep array and came back out of it as a `RangeError` raised inside Sequelize,
     * a failure no worker catching this class could name. They are dropped rather than refused:
     * the step ran, and what it did is the run's record whatever a worker attached alongside it.
     *
     * This row is kept for seven hundred and thirty days and the request and result bodies are
     * purged at thirty, so a value that landed here would outlive by two years the purge meant to
     * remove it, and nothing downstream would ever say that it had.
     */
    describe('when the caller hands over more than the column may carry', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10210031,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210031',
              requestKey: 'request-key-10210031',
              requestBodyHash: 'request-body-hash-10210031',
              externalRef: 'external-ref-10210031',
              subjectLabel: 'Subject label of run 10210031',
              correlationId: 'correlation-id-10210031',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210031',
              acceptedAt: new Date('2026-09-23T01:00:01.001Z'),
              startedAt: new Date('2026-09-23T01:00:02.002Z'),
              finishedAt: null,
            },
            step: {
              aiRunId: 10210031,
              stepIndex: 1,
              stepName: 'read-with-value-attached',
              stepCategoryName: 'ai',
              outcomeCode: 'partially_settled',
              // The value the field was rejected for, attached beside its length, and the medium
              // the reading came out of. Both are content; neither may reach this row.
              rejections: [
                {
                  fieldPath: 'attributes.ownerNote',
                  reasonCode: 'value-over-max-length',
                  value: 'Owner: Jane Doe, 090-1234-5678, jane.doe@example.com',
                  figures: {
                    valueLength: 51,
                  },
                },
                {
                  fieldPath: 'attributes.contractNote',
                  reasonCode: 'reading-unreadable',
                  figures: {
                    valueLength: 88,
                    sample: 'contract 7788, tenant Jane Doe',
                  },
                },
              ],
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-09-23T01:01:01.001Z'),
              finishedAt: new Date('2026-09-23T01:01:02.002Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10210031,
            AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
            stepIndex: 1,
            stepName: 'read-with-value-attached',
            outcomeCode: 'partially_settled',
            rejections: [
              {
                fieldPath: 'attributes.ownerNote',
                reasonCode: 'value-over-max-length',
                figures: {
                  valueLength: 51,
                },
              },
              {
                fieldPath: 'attributes.contractNote',
                reasonCode: 'reading-unreadable',
                figures: {
                  valueLength: 88,
                },
              },
            ],
            reasonCode: 'low_agreement',
            startedAt: new Date('2026-09-23T01:01:01.001Z'),
            finishedAt: new Date('2026-09-23T01:01:02.002Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10210032,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210032',
              requestKey: 'request-key-10210032',
              requestBodyHash: 'request-body-hash-10210032',
              externalRef: 'external-ref-10210032',
              subjectLabel: 'Subject label of run 10210032',
              correlationId: 'correlation-id-10210032',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210032',
              acceptedAt: new Date('2026-09-23T02:00:01.001Z'),
              startedAt: new Date('2026-09-23T02:00:02.002Z'),
              finishedAt: null,
            },
            step: {
              aiRunId: 10210032,
              stepIndex: 1,
              stepName: 'read-with-bare-text',
              stepCategoryName: 'ai',
              outcomeCode: 'partially_settled',
              // Not an array of rejections at all, and the whole of it read out of a medium.
              rejections: 'RAW MEDIUM TEXT: contract 7788, tenant Jane Doe',
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-09-23T02:01:01.001Z'),
              finishedAt: new Date('2026-09-23T02:01:02.002Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10210032,
            AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
            stepIndex: 1,
            stepName: 'read-with-bare-text',
            outcomeCode: 'partially_settled',
            rejections: null,
            reasonCode: 'low_agreement',
            startedAt: new Date('2026-09-23T02:01:01.001Z'),
            finishedAt: new Date('2026-09-23T02:01:02.002Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10210033,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210033',
              requestKey: 'request-key-10210033',
              requestBodyHash: 'request-body-hash-10210033',
              externalRef: 'external-ref-10210033',
              subjectLabel: 'Subject label of run 10210033',
              correlationId: 'correlation-id-10210033',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210033',
              acceptedAt: new Date('2026-09-23T03:00:01.001Z'),
              startedAt: new Date('2026-09-23T03:00:02.002Z'),
              finishedAt: null,
            },
            step: {
              aiRunId: 10210033,
              stepIndex: 1,
              stepName: 'read-with-nested-entries',
              stepCategoryName: 'ai',
              outcomeCode: 'partially_settled',
              // Entries nested inside arrays of their own. Written three levels deep because a
              // test file may hold no loop to build a deeper one; nothing here descends either.
              rejections: [
                [
                  [
                    {
                      fieldPath: 'subject.alpha',
                      reasonCode: 'below_agreement_threshold',
                      figures: {
                        agreedReadingCount: 1,
                        totalReadingCount: 3,
                      },
                    },
                  ],
                ],
              ],
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-09-23T03:01:01.001Z'),
              finishedAt: new Date('2026-09-23T03:01:02.002Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10210033,
            AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
            stepIndex: 1,
            stepName: 'read-with-nested-entries',
            outcomeCode: 'partially_settled',
            rejections: null,
            reasonCode: 'low_agreement',
            startedAt: new Date('2026-09-23T03:01:01.001Z'),
            finishedAt: new Date('2026-09-23T03:01:02.002Z'),
          }),
        },
      ]

      test.each(cases)('stepName: $input.step.stepName', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStepRecorder.create()

        const received = await recorder.saveAiRunStep(input.step)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#findAiRunSteps()', () => {
    /*
     * What the column actually holds once the write has been through the database and back.
     *
     * The save above asserts the row this class built; this asserts the row a reader finds two
     * years later, which is the one the retention promise is made about. The same two payloads a
     * security audit read back out of this column verbatim are written here and read back through
     * the class's own finder - one carrying the value it rejected, one a bare string of medium
     * text - and what comes back holds neither.
     */
    describe('when the step was saved with more than the column may carry', () => {
      const cases = [
        {
          input: {
            aiRunId: 10210041,
            aiRunRow: {
              id: 10210041,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210041',
              requestKey: 'request-key-10210041',
              requestBodyHash: 'request-body-hash-10210041',
              externalRef: 'external-ref-10210041',
              subjectLabel: 'Subject label of run 10210041',
              correlationId: 'correlation-id-10210041',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210041',
              acceptedAt: new Date('2026-09-24T01:00:01.001Z'),
              startedAt: new Date('2026-09-24T01:00:02.002Z'),
              finishedAt: null,
            },
            savedStep: {
              aiRunId: 10210041,
              stepIndex: 1,
              stepName: 'store-with-value-attached',
              stepCategoryName: 'ai',
              outcomeCode: 'partially_settled',
              rejections: [
                {
                  fieldPath: 'attributes.ownerNote',
                  reasonCode: 'value-over-max-length',
                  value: 'Owner: Jane Doe, 090-1234-5678, jane.doe@example.com',
                  figures: {
                    valueLength: 51,
                  },
                },
              ],
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-09-24T01:01:01.001Z'),
              finishedAt: new Date('2026-09-24T01:01:02.002Z'),
            },
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'store-with-value-attached',
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              AiRunStepCategory: expect.objectContaining({
                name: 'ai',
              }),
              rejections: [
                {
                  fieldPath: 'attributes.ownerNote',
                  reasonCode: 'value-over-max-length',
                  figures: {
                    valueLength: 51,
                  },
                },
              ],
              reasonCode: 'low_agreement',
            }),
          ],
        },
        {
          input: {
            aiRunId: 10210042,
            aiRunRow: {
              id: 10210042,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210042',
              requestKey: 'request-key-10210042',
              requestBodyHash: 'request-body-hash-10210042',
              externalRef: 'external-ref-10210042',
              subjectLabel: 'Subject label of run 10210042',
              correlationId: 'correlation-id-10210042',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210042',
              acceptedAt: new Date('2026-09-24T02:00:01.001Z'),
              startedAt: new Date('2026-09-24T02:00:02.002Z'),
              finishedAt: null,
            },
            savedStep: {
              aiRunId: 10210042,
              stepIndex: 1,
              stepName: 'store-with-bare-text',
              stepCategoryName: 'ai',
              outcomeCode: 'partially_settled',
              rejections: 'RAW MEDIUM TEXT: contract 7788, tenant Jane Doe',
              reasonCode: 'low_agreement',
              startedAt: new Date('2026-09-24T02:01:01.001Z'),
              finishedAt: new Date('2026-09-24T02:01:02.002Z'),
            },
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'store-with-bare-text',
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              AiRunStepCategory: expect.objectContaining({
                name: 'ai',
              }),
              rejections: null,
              reasonCode: 'low_agreement',
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunStepRecorder.create()
        await recorder.saveAiRunStep(input.savedStep)

        const findAiRunStepsArgs = {
          aiRunId: input.aiRunId,
        }

        const received = await recorder.findAiRunSteps(findAiRunStepsArgs)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#saveAiRunStep()', () => {
    /*
     * The two instants the first use case reads to say how long a step took.
     *
     * This class drops what it cannot answer for everywhere else — a rejection whose path is not a
     * path goes, and the sound decision beside it stays. These two are not droppable: `started_at`
     * is NOT NULL, so there is nothing to drop to, and a `finished_at` that is present and is not a
     * time coerces to the literal text `Invalid date`, which makes the duration unreadable while
     * reading as though it had been recorded. Every case below wrote such a row before this guard.
     */
    describe('should refuse an instant field carrying something that is not an instant', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10210051,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210051',
              requestKey: 'request-key-10210051',
              requestBodyHash: 'request-body-hash-10210051',
              externalRef: 'external-ref-10210051',
              subjectLabel: 'Subject label of run 10210051',
              correlationId: 'correlation-id-10210051',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210051',
              acceptedAt: new Date('2026-09-24T04:01:01.001Z'),
              startedAt: new Date('2026-09-24T04:01:02.002Z'),
              finishedAt: null,
            },
            savedStep: {
              aiRunId: 10210051,
              stepIndex: 1,
              stepName: 'probe-instant',
              stepCategoryName: 'code',
              outcomeCode: 'PROBE_OK',
              rejections: null,
              reasonCode: null,
              startedAt: 'whenever',
              finishedAt: new Date('2026-09-24T04:01:09.009Z'),
            },
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a step started at a word that is not a time',
        },
        {
          input: {
            aiRunRow: {
              id: 10210052,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210052',
              requestKey: 'request-key-10210052',
              requestBodyHash: 'request-body-hash-10210052',
              externalRef: 'external-ref-10210052',
              subjectLabel: 'Subject label of run 10210052',
              correlationId: 'correlation-id-10210052',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210052',
              acceptedAt: new Date('2026-09-24T04:01:01.001Z'),
              startedAt: new Date('2026-09-24T04:01:02.002Z'),
              finishedAt: null,
            },
            savedStep: {
              aiRunId: 10210052,
              stepIndex: 1,
              stepName: 'probe-instant',
              stepCategoryName: 'code',
              outcomeCode: 'PROBE_OK',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-24T04:01:10.010Z'),
              finishedAt: 'whenever',
            },
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a step finished at a word that is not a time',
        },
        {
          input: {
            aiRunRow: {
              id: 10210053,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210053',
              requestKey: 'request-key-10210053',
              requestBodyHash: 'request-body-hash-10210053',
              externalRef: 'external-ref-10210053',
              subjectLabel: 'Subject label of run 10210053',
              correlationId: 'correlation-id-10210053',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210053',
              acceptedAt: new Date('2026-09-24T04:01:01.001Z'),
              startedAt: new Date('2026-09-24T04:01:02.002Z'),
              finishedAt: null,
            },
            savedStep: {
              aiRunId: 10210053,
              stepIndex: 1,
              stepName: 'probe-instant',
              stepCategoryName: 'code',
              outcomeCode: 'PROBE_OK',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-24T04:01:11.011Z'),
              finishedAt: {},
            },
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a step finished at an empty object',
        },
        {
          input: {
            aiRunRow: {
              id: 10210054,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210054',
              requestKey: 'request-key-10210054',
              requestBodyHash: 'request-body-hash-10210054',
              externalRef: 'external-ref-10210054',
              subjectLabel: 'Subject label of run 10210054',
              correlationId: 'correlation-id-10210054',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210054',
              acceptedAt: new Date('2026-09-24T04:01:01.001Z'),
              startedAt: new Date('2026-09-24T04:01:02.002Z'),
              finishedAt: null,
            },
            savedStep: {
              aiRunId: 10210054,
              stepIndex: 1,
              stepName: 'probe-instant',
              stepCategoryName: 'code',
              outcomeCode: 'PROBE_OK',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-24T04:01:12.012Z'),
              finishedAt: new Date('whenever'),
            },
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a step finished at a Date that names no time',
        },
        {
          input: {
            aiRunRow: {
              id: 10210055,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210055',
              requestKey: 'request-key-10210055',
              requestBodyHash: 'request-body-hash-10210055',
              externalRef: 'external-ref-10210055',
              subjectLabel: 'Subject label of run 10210055',
              correlationId: 'correlation-id-10210055',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210055',
              acceptedAt: new Date('2026-09-24T04:01:01.001Z'),
              startedAt: new Date('2026-09-24T04:01:02.002Z'),
              finishedAt: null,
            },
            savedStep: {
              aiRunId: 10210055,
              stepIndex: 1,
              stepName: 'probe-instant',
              stepCategoryName: 'code',
              outcomeCode: 'PROBE_OK',
              rejections: null,
              reasonCode: null,
              startedAt: 0,
              finishedAt: new Date('2026-09-24T04:01:13.013Z'),
            },
          },
          expected: 'refused an instant field carrying something that is not an instant',
          label: 'a step started at the epoch written as a number',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStepRecorder.create()

        const actual = () => recorder.saveAiRunStep(input.savedStep) // Act

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunStepRecorder', () => {
  describe('#saveAiRunStep()', () => {
    /*
     * The other half of the rule above. A step still running has no instant it finished at, and the
     * column is NULL for exactly that reason — so the guard reads only what is present, and a null
     * passes through it untouched.
     */
    describe('should record a step that has not finished', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10210056,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 2, // AI_RUN_STATUS.RUNNING.ID
              runKey: 'run-key-10210056',
              requestKey: 'request-key-10210056',
              requestBodyHash: 'request-body-hash-10210056',
              externalRef: 'external-ref-10210056',
              subjectLabel: 'Subject label of run 10210056',
              correlationId: 'correlation-id-10210056',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10210056',
              acceptedAt: new Date('2026-09-24T04:01:01.001Z'),
              startedAt: new Date('2026-09-24T04:01:02.002Z'),
              finishedAt: null,
            },
            savedStep: {
              aiRunId: 10210056,
              stepIndex: 1,
              stepName: 'probe-still-running',
              stepCategoryName: 'code',
              outcomeCode: 'PROBE_RUNNING',
              rejections: null,
              reasonCode: null,
              startedAt: new Date('2026-09-24T04:01:20.020Z'),
              finishedAt: null,
            },
          },
          expected: expect.objectContaining({
            stepName: 'probe-still-running',
            startedAt: new Date('2026-09-24T04:01:20.020Z'),
            finishedAt: null,
          }),
          label: 'a step that has not finished, whose finished instant is an absence and not a wrong time',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow) // Arrange

        const recorder = AiRunStepRecorder.create()

        const received = await recorder.saveAiRunStep(input.savedStep) // Act

        expect(received) // Assert
          .toEqual(expected)
      })
    })
  })
})
