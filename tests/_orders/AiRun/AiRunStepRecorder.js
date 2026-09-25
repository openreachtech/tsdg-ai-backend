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
