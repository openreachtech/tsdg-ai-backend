import AiRunFieldOutcomeRecorder from '../../../app/aiRun/AiRunFieldOutcomeRecorder.js'

import AiRun from '../../../sequelize/models/AiRun.js'
import AiRunStep from '../../../sequelize/models/AiRunStep.js'

/*
 * Every run and every step this file hangs a field outcome off is created by this file, in
 * `#run-record`'s own id block (`10220001` upward for the steps, `10220011` upward for the runs, so
 * the two sets read apart). A field outcome needs a step on the other end of its `AiRunStepId`, and
 * a step needs a run on the other end of its `AiRunId`; taking either from `#run-contract`'s seeded
 * runs would put this file's rows on a run the step seeder also writes to, and
 * `(ai_run_id, step_index)` is UNIQUE — so the two would collide on that index, and which of them
 * landed would be decided by whichever writer ran first. Creating them here leaves every row this
 * file asserts on owned by this file.
 *
 * Each case creates a run and a step of its own, so the step claims index 1 of a run nothing else
 * writes to and no case depends on another having run before it. `(ai_run_id, field_path)` is
 * UNIQUE too, and a run per case settles that for the field outcomes as well.
 */

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * A field the run settled: the state it came out as, what the majority reading rested on, the
     * score, the agreement counts, the version of the formula and the instant, all recorded as the
     * caller stated them — and the step it was settled by recorded beside them, which is what makes
     * the step's own reason code reachable from the field.
     *
     * The score arrives as a number in one case and as text in the other, because
     * `suggestion_confidence` is `DECIMAL(5, 4)` and Sequelize hands a DECIMAL back as a number on
     * SQLite and as a string on MariaDB. Each is expected back exactly as it was handed in: this
     * class records the score the scorer computed and converts neither rendering into the other.
     */
    describe('when the field was settled', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10220011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220011',
              requestKey: 'request-key-10220011',
              requestBodyHash: 'request-body-hash-10220011',
              externalRef: 'external-ref-10220011',
              subjectLabel: 'Subject label of run 10220011',
              correlationId: 'correlation-id-10220011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220011',
              acceptedAt: new Date('2026-09-21T01:00:01.001Z'),
              startedAt: new Date('2026-09-21T01:00:02.002Z'),
              finishedAt: new Date('2026-09-21T01:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220001,
              AiRunId: 10220011,
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              stepIndex: 1,
              stepName: 'step-name-10220001',
              outcomeCode: 'outcome-code-10220001',
              startedAt: new Date('2026-09-21T01:01:01.001Z'),
              finishedAt: new Date('2026-09-21T01:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220011,
              aiRunStepId: 10220001,
              fieldPath: 'subject.alpha',
              aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
              aiRunEvidenceCategoryId: 1, // AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID
              suggestionConfidence: 0.9125, // as SQLite hands a DECIMAL back
              agreedReadingCount: 3,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-0001',
              settledAt: new Date('2026-09-21T05:05:05.005Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10220011,
            AiRunStepId: 10220001,
            fieldPath: 'subject.alpha',
            AiRunFieldStatusId: 1,
            AiRunEvidenceCategoryId: 1,
            suggestionConfidence: 0.9125,
            agreedReadingCount: 3,
            totalReadingCount: 3,
            confidenceMethodVersion: 'confidence-method-0001',
            settledAt: new Date('2026-09-21T05:05:05.005Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10220012,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220012',
              requestKey: 'request-key-10220012',
              requestBodyHash: 'request-body-hash-10220012',
              externalRef: 'external-ref-10220012',
              subjectLabel: 'Subject label of run 10220012',
              correlationId: 'correlation-id-10220012',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220012',
              acceptedAt: new Date('2026-09-21T02:00:01.001Z'),
              startedAt: new Date('2026-09-21T02:00:02.002Z'),
              finishedAt: new Date('2026-09-21T02:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220002,
              AiRunId: 10220012,
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              stepIndex: 1,
              stepName: 'step-name-10220002',
              outcomeCode: 'outcome-code-10220002',
              startedAt: new Date('2026-09-21T02:01:01.001Z'),
              finishedAt: new Date('2026-09-21T02:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220012,
              aiRunStepId: 10220002,
              fieldPath: 'subject.beta',
              aiRunFieldStatusId: 3, // AI_RUN_FIELD_STATUS.SUGGESTED.ID
              aiRunEvidenceCategoryId: 3, // AI_RUN_EVIDENCE_CATEGORY.CATEGORY_PRIOR.ID
              suggestionConfidence: '0.4250', // as MariaDB hands a DECIMAL back
              agreedReadingCount: 2,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-0002',
              settledAt: new Date('2026-09-21T06:06:06.006Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10220012,
            AiRunStepId: 10220002,
            fieldPath: 'subject.beta',
            AiRunFieldStatusId: 3,
            AiRunEvidenceCategoryId: 3,
            suggestionConfidence: '0.4250',
            agreedReadingCount: 2,
            totalReadingCount: 3,
            confidenceMethodVersion: 'confidence-method-0002',
            settledAt: new Date('2026-09-21T06:06:06.006Z'),
          }),
        },
      ]

      test.each(cases)('fieldPath: $input.fieldOutcome.fieldPath', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)
        await AiRunStep.create(input.aiRunStepRow)

        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = await recorder.saveAiRunFieldOutcome(input.fieldOutcome)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * A field the run considered and did not answer. This is the row the second use case of
     * `#run-record` reads: the state says `missing`, the counts say how far the readings fell short
     * of a majority — one of three, and two of five — and the reason the step gave is reachable
     * through the step the outcome names.
     *
     * The second case is the one that matters beyond the first. It hands in a category and a score
     * left over from a reading that did not win, and both are recorded as null anyway: a field
     * nothing settled rested on no majority reading and carries no score, so a leftover recorded
     * against it would say otherwise.
     *
     * Every column written here is a decision. None of them is a value read out of a medium, which
     * is what lets these rows outlive the purge that removes the content they were decided from.
     */
    describe('when the field settled nothing', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10220013,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID — a field settling nothing is still a success
              runKey: 'run-key-10220013',
              requestKey: 'request-key-10220013',
              requestBodyHash: 'request-body-hash-10220013',
              externalRef: 'external-ref-10220013',
              subjectLabel: 'Subject label of run 10220013',
              correlationId: 'correlation-id-10220013',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220013',
              acceptedAt: new Date('2026-09-21T03:00:01.001Z'),
              startedAt: new Date('2026-09-21T03:00:02.002Z'),
              finishedAt: new Date('2026-09-21T03:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220003,
              AiRunId: 10220013,
              AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
              stepIndex: 1,
              stepName: 'step-name-10220003',
              outcomeCode: 'outcome-code-10220003',
              reasonCode: 'reason-code-10220003',
              startedAt: new Date('2026-09-21T03:01:01.001Z'),
              finishedAt: new Date('2026-09-21T03:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220013,
              aiRunStepId: 10220003,
              fieldPath: 'subject.gamma',
              aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
              aiRunEvidenceCategoryId: null,
              suggestionConfidence: null,
              agreedReadingCount: 1, // no majority of the three readings agreed
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-0003',
              settledAt: new Date('2026-09-21T07:07:07.007Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10220013,
            AiRunStepId: 10220003,
            fieldPath: 'subject.gamma',
            AiRunFieldStatusId: 4,
            AiRunEvidenceCategoryId: null,
            suggestionConfidence: null,
            agreedReadingCount: 1,
            totalReadingCount: 3,
            confidenceMethodVersion: 'confidence-method-0003',
            settledAt: new Date('2026-09-21T07:07:07.007Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10220014,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID — a field settling nothing is still a success
              runKey: 'run-key-10220014',
              requestKey: 'request-key-10220014',
              requestBodyHash: 'request-body-hash-10220014',
              externalRef: 'external-ref-10220014',
              subjectLabel: 'Subject label of run 10220014',
              correlationId: 'correlation-id-10220014',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220014',
              acceptedAt: new Date('2026-09-21T04:00:01.001Z'),
              startedAt: new Date('2026-09-21T04:00:02.002Z'),
              finishedAt: new Date('2026-09-21T04:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220004,
              AiRunId: 10220014,
              AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
              stepIndex: 1,
              stepName: 'step-name-10220004',
              outcomeCode: 'outcome-code-10220004',
              reasonCode: 'reason-code-10220004',
              startedAt: new Date('2026-09-21T04:01:01.001Z'),
              finishedAt: new Date('2026-09-21T04:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220014,
              aiRunStepId: 10220004,
              fieldPath: 'subject.delta',
              aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
              aiRunEvidenceCategoryId: 2, // left over from a reading that did not win
              suggestionConfidence: 0.3125, // left over from a reading that did not win
              agreedReadingCount: 2, // no majority of the five readings agreed
              totalReadingCount: 5,
              confidenceMethodVersion: 'confidence-method-0004',
              settledAt: new Date('2026-09-21T08:08:08.008Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10220014,
            AiRunStepId: 10220004,
            fieldPath: 'subject.delta',
            AiRunFieldStatusId: 4,
            AiRunEvidenceCategoryId: null,
            suggestionConfidence: null,
            agreedReadingCount: 2,
            totalReadingCount: 5,
            confidenceMethodVersion: 'confidence-method-0004',
            settledAt: new Date('2026-09-21T08:08:08.008Z'),
          }),
        },
      ]

      test.each(cases)('fieldPath: $input.fieldOutcome.fieldPath', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)
        await AiRunStep.create(input.aiRunStepRow)

        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = await recorder.saveAiRunFieldOutcome(input.fieldOutcome)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
