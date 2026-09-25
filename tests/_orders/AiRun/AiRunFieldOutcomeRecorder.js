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
 *
 * The two refusal describes at the end need rows the earlier ones do not. A step belonging to
 * another run needs two runs, so those cases create a second one and hang the step off it; a step
 * that is not there needs an id nothing ever creates, and `10229001` upward is reserved inside
 * this feature's block for exactly that, kept apart from the `10220001` steps so an id that must
 * stay absent is never mistaken for one that was meant to be written.
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

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * A text parameter carrying a value read out of a medium, refused at the row.
     *
     * Both payloads below were written whole before the shapes were stated. `field_path` and
     * `confidence_method_version` are free text on the seven-hundred-and-thirty-day clock, so a
     * value that reached either of them would outlive by two years the purge meant to remove it —
     * and `field_path` is the one a model can produce, because a path is not always bounded by a
     * schema.
     *
     * The row is refused rather than repaired. Stripping a sentence down to the characters a path
     * may hold would leave a row naming a field nobody settled, read for two years as though it
     * were the real one, and stripping is a guess. Both columns are `NOT NULL`, so the shape check
     * answering null is what refuses the whole row — the same mechanism an omitted step is refused
     * by, and the reason the error names the column.
     */
    describe('when a text parameter carries a value read out of a medium', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10220015,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220015',
              requestKey: 'request-key-10220015',
              requestBodyHash: 'request-body-hash-10220015',
              externalRef: 'external-ref-10220015',
              subjectLabel: 'Subject label of run 10220015',
              correlationId: 'correlation-id-10220015',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220015',
              acceptedAt: new Date('2026-09-22T01:00:01.001Z'),
              startedAt: new Date('2026-09-22T01:00:02.002Z'),
              finishedAt: new Date('2026-09-22T01:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220005,
              AiRunId: 10220015,
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              stepIndex: 1,
              stepName: 'step-name-10220005',
              outcomeCode: 'outcome-code-10220005',
              startedAt: new Date('2026-09-22T01:01:01.001Z'),
              finishedAt: new Date('2026-09-22T01:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220015,
              aiRunStepId: 10220005,
              fieldPath: 'the owner note says sample person, born 1984, phone 090-0000-0000',
              aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
              aiRunEvidenceCategoryId: 1, // AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID
              suggestionConfidence: 0.8125,
              agreedReadingCount: 3,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-0005',
              settledAt: new Date('2026-09-22T05:05:05.005Z'),
            },
          },
          expected: 'notNull Violation: AiRunFieldOutcome.fieldPath cannot be null',
        },
        {
          input: {
            aiRunRow: {
              id: 10220016,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220016',
              requestKey: 'request-key-10220016',
              requestBodyHash: 'request-body-hash-10220016',
              externalRef: 'external-ref-10220016',
              subjectLabel: 'Subject label of run 10220016',
              correlationId: 'correlation-id-10220016',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220016',
              acceptedAt: new Date('2026-09-22T02:00:01.001Z'),
              startedAt: new Date('2026-09-22T02:00:02.002Z'),
              finishedAt: new Date('2026-09-22T02:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220006,
              AiRunId: 10220016,
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              stepIndex: 1,
              stepName: 'step-name-10220006',
              outcomeCode: 'outcome-code-10220006',
              startedAt: new Date('2026-09-22T02:01:01.001Z'),
              finishedAt: new Date('2026-09-22T02:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220016,
              aiRunStepId: 10220006,
              fieldPath: 'subject.epsilon',
              aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
              aiRunEvidenceCategoryId: 1, // AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID
              suggestionConfidence: 0.7125,
              agreedReadingCount: 3,
              totalReadingCount: 3,
              confidenceMethodVersion: 'read from the medium: the owner is a sample person',
              settledAt: new Date('2026-09-22T06:06:06.006Z'),
            },
          },
          expected: 'notNull Violation: AiRunFieldOutcome.confidenceMethodVersion cannot be null',
        },
      ]

      test.each(cases)('fieldPath: $input.fieldOutcome.fieldPath', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)
        await AiRunStep.create(input.aiRunStepRow)

        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = () => recorder.saveAiRunFieldOutcome(input.fieldOutcome)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * The two payloads that reach the table anyway, and what the row says once they have.
     *
     * The first is a value read out of a medium handed to `suggestion_confidence`. That column is
     * `DECIMAL(5, 4)`, which a strict-mode MySQL would refuse outright — but every Jest run and
     * every developer's machine is SQLite, which takes a string whole. So the channel is open
     * exactly where nobody is watching, and the row records no score rather than that text: the
     * column is nullable and already means "no score", so the rest of the row still stands and the
     * trace keeps the field.
     *
     * The second is the state arriving as text, which is how a status id that passed through a
     * query string or a JSON body arrives. `'4'` is `missing`, and a state compared as it arrived
     * would not have matched the `missing` this recorder holds — leaving a row that says the field
     * settled nothing while carrying the confidence and the evidence category of a reading that
     * lost. That is the row the second use case of `#run-record` reads when an operator asks why a
     * run returned no value for a field, so it is the one row that must never contradict itself.
     * Both leftovers are recorded as null.
     */
    describe('when a value read out of a medium reaches a nullable column', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10220017,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220017',
              requestKey: 'request-key-10220017',
              requestBodyHash: 'request-body-hash-10220017',
              externalRef: 'external-ref-10220017',
              subjectLabel: 'Subject label of run 10220017',
              correlationId: 'correlation-id-10220017',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220017',
              acceptedAt: new Date('2026-09-22T03:00:01.001Z'),
              startedAt: new Date('2026-09-22T03:00:02.002Z'),
              finishedAt: new Date('2026-09-22T03:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220007,
              AiRunId: 10220017,
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              stepIndex: 1,
              stepName: 'step-name-10220007',
              outcomeCode: 'outcome-code-10220007',
              startedAt: new Date('2026-09-22T03:01:01.001Z'),
              finishedAt: new Date('2026-09-22T03:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220017,
              aiRunStepId: 10220007,
              fieldPath: 'subject.zeta',
              aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
              aiRunEvidenceCategoryId: 1, // AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID
              suggestionConfidence: 'read from the medium: 090-0000-0000',
              agreedReadingCount: 3,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-0007',
              settledAt: new Date('2026-09-22T07:07:07.007Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10220017,
            AiRunStepId: 10220007,
            fieldPath: 'subject.zeta',
            AiRunFieldStatusId: 1,
            AiRunEvidenceCategoryId: 1,
            suggestionConfidence: null,
            agreedReadingCount: 3,
            totalReadingCount: 3,
            confidenceMethodVersion: 'confidence-method-0007',
            settledAt: new Date('2026-09-22T07:07:07.007Z'),
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 10220018,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220018',
              requestKey: 'request-key-10220018',
              requestBodyHash: 'request-body-hash-10220018',
              externalRef: 'external-ref-10220018',
              subjectLabel: 'Subject label of run 10220018',
              correlationId: 'correlation-id-10220018',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220018',
              acceptedAt: new Date('2026-09-22T04:00:01.001Z'),
              startedAt: new Date('2026-09-22T04:00:02.002Z'),
              finishedAt: new Date('2026-09-22T04:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220008,
              AiRunId: 10220018,
              AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
              stepIndex: 1,
              stepName: 'step-name-10220008',
              outcomeCode: 'outcome-code-10220008',
              reasonCode: 'reason-code-10220008',
              startedAt: new Date('2026-09-22T04:01:01.001Z'),
              finishedAt: new Date('2026-09-22T04:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220018,
              aiRunStepId: 10220008,
              fieldPath: 'subject.eta',
              aiRunFieldStatusId: '4', // AI_RUN_FIELD_STATUS.MISSING.ID, as text
              aiRunEvidenceCategoryId: 1, // left over from a reading that did not win
              suggestionConfidence: 0.9999, // left over from a reading that did not win
              agreedReadingCount: 2, // no majority of the five readings agreed
              totalReadingCount: 5,
              confidenceMethodVersion: 'confidence-method-0008',
              settledAt: new Date('2026-09-22T08:08:08.008Z'),
            },
          },
          expected: expect.objectContaining({
            AiRunId: 10220018,
            AiRunStepId: 10220008,
            fieldPath: 'subject.eta',
            AiRunFieldStatusId: 4, // normalized before it is written, not left for the column to coerce
            AiRunEvidenceCategoryId: null,
            suggestionConfidence: null,
            agreedReadingCount: 2,
            totalReadingCount: 5,
            confidenceMethodVersion: 'confidence-method-0008',
            settledAt: new Date('2026-09-22T08:08:08.008Z'),
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
     * The step named belongs to another run, and the row is refused.
     *
     * Each case creates two runs and hangs the step off the second, then asks for a field outcome
     * on the first. Nothing in the table would have stopped it: `ai_run_step_id` is `NOT NULL` and
     * carries no database foreign key, because referential integrity in this service is enforced
     * in application code — so before this guard both ids were written as they arrived and the row
     * was taken.
     *
     * What that row would have said is the reason the guard exists. `AiRunStepId` is on this table
     * for one purpose: the reason code for how a field was settled lives on the step, and this is
     * what makes it reachable from the field. A row pointing at another run's step answers the
     * second use case of `#run-record` with somebody else's reason code, silently, with nothing on
     * the row to show for it.
     *
     * The refusal throws rather than answering null the way a malformed path does, and the whole
     * message is asserted rather than a fragment of it: both ids and the run the step actually
     * belongs to are the three facts that tell the caller which pair it crossed, and a refusal
     * that dropped them would leave the caller with no more than it started with.
     */
    describe('when the step belongs to another run', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10220019,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220019',
              requestKey: 'request-key-10220019',
              requestBodyHash: 'request-body-hash-10220019',
              externalRef: 'external-ref-10220019',
              subjectLabel: 'Subject label of run 10220019',
              correlationId: 'correlation-id-10220019',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220019',
              acceptedAt: new Date('2026-09-23T01:00:01.001Z'),
              startedAt: new Date('2026-09-23T01:00:02.002Z'),
              finishedAt: new Date('2026-09-23T01:00:03.003Z'),
            },
            otherAiRunRow: {
              id: 10220020,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220020',
              requestKey: 'request-key-10220020',
              requestBodyHash: 'request-body-hash-10220020',
              externalRef: 'external-ref-10220020',
              subjectLabel: 'Subject label of run 10220020',
              correlationId: 'correlation-id-10220020',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220020',
              acceptedAt: new Date('2026-09-23T02:00:01.001Z'),
              startedAt: new Date('2026-09-23T02:00:02.002Z'),
              finishedAt: new Date('2026-09-23T02:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220009,
              AiRunId: 10220020, // the step is a step of the other run
              AiRunStepCategoryId: 1, // AI_RUN_STEP_CATEGORY.CODE.ID
              stepIndex: 1,
              stepName: 'step-name-10220009',
              outcomeCode: 'outcome-code-10220009',
              reasonCode: 'reason-code-10220009',
              startedAt: new Date('2026-09-23T02:01:01.001Z'),
              finishedAt: new Date('2026-09-23T02:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220019,
              aiRunStepId: 10220009,
              fieldPath: 'subject.theta',
              aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
              aiRunEvidenceCategoryId: null,
              suggestionConfidence: null,
              agreedReadingCount: 1,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-0009',
              settledAt: new Date('2026-09-23T05:05:05.005Z'),
            },
          },
          expected: 'AiRunFieldOutcomeRecorder#saveAiRunFieldOutcome() refused a step belonging to another run: AiRunId 10220019, AiRunStepId 10220009, AiRunId of the step 10220020',
        },
        {
          input: {
            aiRunRow: {
              id: 10220021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220021',
              requestKey: 'request-key-10220021',
              requestBodyHash: 'request-body-hash-10220021',
              externalRef: 'external-ref-10220021',
              subjectLabel: 'Subject label of run 10220021',
              correlationId: 'correlation-id-10220021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220021',
              acceptedAt: new Date('2026-09-23T03:00:01.001Z'),
              startedAt: new Date('2026-09-23T03:00:02.002Z'),
              finishedAt: new Date('2026-09-23T03:00:03.003Z'),
            },
            otherAiRunRow: {
              id: 10220022,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220022',
              requestKey: 'request-key-10220022',
              requestBodyHash: 'request-body-hash-10220022',
              externalRef: 'external-ref-10220022',
              subjectLabel: 'Subject label of run 10220022',
              correlationId: 'correlation-id-10220022',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220022',
              acceptedAt: new Date('2026-09-23T04:00:01.001Z'),
              startedAt: new Date('2026-09-23T04:00:02.002Z'),
              finishedAt: new Date('2026-09-23T04:00:03.003Z'),
            },
            aiRunStepRow: {
              id: 10220010,
              AiRunId: 10220022, // the step is a step of the other run
              AiRunStepCategoryId: 2, // AI_RUN_STEP_CATEGORY.AI.ID
              stepIndex: 1,
              stepName: 'step-name-10220010',
              outcomeCode: 'outcome-code-10220010',
              startedAt: new Date('2026-09-23T04:01:01.001Z'),
              finishedAt: new Date('2026-09-23T04:01:02.002Z'),
            },
            fieldOutcome: {
              aiRunId: 10220021,
              aiRunStepId: 10220010,
              fieldPath: 'subject.iota',
              aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
              aiRunEvidenceCategoryId: 1, // AI_RUN_EVIDENCE_CATEGORY.VISIBLE_TEXT.ID
              suggestionConfidence: 0.6125,
              agreedReadingCount: 3,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-0010',
              settledAt: new Date('2026-09-23T06:06:06.006Z'),
            },
          },
          expected: 'AiRunFieldOutcomeRecorder#saveAiRunFieldOutcome() refused a step belonging to another run: AiRunId 10220021, AiRunStepId 10220010, AiRunId of the step 10220022',
        },
      ]

      test.each(cases)('fieldPath: $input.fieldOutcome.fieldPath', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)
        await AiRun.create(input.otherAiRunRow)
        await AiRunStep.create(input.aiRunStepRow)

        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = () => recorder.saveAiRunFieldOutcome(input.fieldOutcome)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * The step named is not there at all, and the row is refused separately.
     *
     * It is the same read and the same branch as the crossed pair above, and it is a different
     * defect in the caller: an id that was never a step, or whose step never saved, rather than
     * two live runs crossed. Each refusal names itself, so the caller's log says which one
     * happened without the reader having to go and look — the same reason `AiRunStatusRecorder`
     * keeps a run that does not exist apart from a run that has settled.
     *
     * The run each case creates is real, so what is refused is the step alone. The step ids are
     * reserved inside this feature's own block and are never created by anything.
     */
    describe('when no step carries the id', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 10220023,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220023',
              requestKey: 'request-key-10220023',
              requestBodyHash: 'request-body-hash-10220023',
              externalRef: 'external-ref-10220023',
              subjectLabel: 'Subject label of run 10220023',
              correlationId: 'correlation-id-10220023',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220023',
              acceptedAt: new Date('2026-09-23T07:00:01.001Z'),
              startedAt: new Date('2026-09-23T07:00:02.002Z'),
              finishedAt: new Date('2026-09-23T07:00:03.003Z'),
            },
            fieldOutcome: {
              aiRunId: 10220023,
              aiRunStepId: 10229001, // reserved as a step that is never created
              fieldPath: 'subject.kappa',
              aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID
              aiRunEvidenceCategoryId: null,
              suggestionConfidence: null,
              agreedReadingCount: 2,
              totalReadingCount: 5,
              confidenceMethodVersion: 'confidence-method-0011',
              settledAt: new Date('2026-09-23T07:07:07.007Z'),
            },
          },
          expected: 'AiRunFieldOutcomeRecorder#saveAiRunFieldOutcome() refused a step that does not exist: AiRunId 10220023, AiRunStepId 10229001',
        },
        {
          input: {
            aiRunRow: {
              id: 10220024,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-10220024',
              requestKey: 'request-key-10220024',
              requestBodyHash: 'request-body-hash-10220024',
              externalRef: 'external-ref-10220024',
              subjectLabel: 'Subject label of run 10220024',
              correlationId: 'correlation-id-10220024',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10220024',
              acceptedAt: new Date('2026-09-23T08:00:01.001Z'),
              startedAt: new Date('2026-09-23T08:00:02.002Z'),
              finishedAt: new Date('2026-09-23T08:00:03.003Z'),
            },
            fieldOutcome: {
              aiRunId: 10220024,
              aiRunStepId: 10229002, // reserved as a step that is never created
              fieldPath: 'subject.lambda',
              aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID
              aiRunEvidenceCategoryId: 2, // AI_RUN_EVIDENCE_CATEGORY.VISUAL_ESTIMATE.ID
              suggestionConfidence: 0.5125,
              agreedReadingCount: 3,
              totalReadingCount: 3,
              confidenceMethodVersion: 'confidence-method-0012',
              settledAt: new Date('2026-09-23T08:08:08.008Z'),
            },
          },
          expected: 'AiRunFieldOutcomeRecorder#saveAiRunFieldOutcome() refused a step that does not exist: AiRunId 10220024, AiRunStepId 10229002',
        },
      ]

      test.each(cases)('fieldPath: $input.fieldOutcome.fieldPath', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const recorder = AiRunFieldOutcomeRecorder.create()

        const received = () => recorder.saveAiRunFieldOutcome(input.fieldOutcome)

        await expect(received)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * The three channels checkpoint 8's re-audit found after the first pass had closed the ones
     * before them, and every case below is a payload it actually got a row written with.
     *
     * The field state was the mirror of a defect this class had already been corrected for. The
     * first correction normalized the state for the *decision* - so `'01'` named no state, and
     * nothing was recorded as settled - and left the *write* raw, where the INTEGER column coerced
     * `'01'` to 1 anyway. The row then said the field came out `extracted`, on no evidence, with no
     * confidence: a settled row carrying neither, which is what the second use case reads when an
     * operator asks why a field returned no value. The guard and the write have to agree on what a
     * state id is, and now they do - the comparable id is what gets written.
     *
     * The two counts took free text, and the class documentation said in as many words that they
     * did not. `agreed 99 of 1` is impossible rather than merely malformed: section 10 calls the
     * pair "how many readings agreed out of how many".
     *
     * The two master ids were checked by nothing. This table declares no database foreign key, by
     * the rule that integrity is application code, so an id naming no seeded row was written.
     */
    describe('should refuse a value the record cannot answer for', () => {
      const cases = [
        {
          input: {
            aiRunFieldStatusId: '01',
          },
          expected: 'refused a field state that is not an id',
          label: 'a state id written with a leading zero, which the column would coerce',
        },
        {
          input: {
            aiRunFieldStatusId: '1.0',
          },
          expected: 'refused a field state that is not an id',
          label: 'a state id written as a decimal',
        },
        {
          input: {
            aiRunFieldStatusId: 99,
          },
          expected: 'refused a field state naming no master row',
          label: 'a state id no master row carries',
        },
        {
          input: {
            aiRunEvidenceCategoryId: 99,
          },
          expected: 'refused an evidence kind naming no master row',
          label: 'an evidence kind no master row carries',
        },
        {
          input: {
            agreedReadingCount: 'sample person 090-0000-0000',
          },
          expected: 'refused a reading count that is not a whole number',
          label: 'a count carrying what was read out of a medium',
        },
        {
          input: {
            agreedReadingCount: -5,
          },
          expected: 'refused a reading count that is not a whole number',
          label: 'a count below zero, which no reading can agree',
        },
        {
          input: {
            agreedReadingCount: 99,
            totalReadingCount: 1,
          },
          expected: 'refused more readings agreeing than there were readings',
          label: 'more readings agreeing than there were readings',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create() // Arrange

        const actual = () => recorder.saveAiRunFieldOutcome({
          aiRunId: 10010004,
          aiRunStepId: 10240004,
          fieldPath: 'probe.refused',
          aiRunFieldStatusId: 1,
          aiRunEvidenceCategoryId: 1,
          suggestionConfidence: 0.95,
          agreedReadingCount: 3,
          totalReadingCount: 3,
          confidenceMethodVersion: 'confidence-v1.0.0',
          settledAt: new Date('2026-09-22T09:09:09.009Z'),
          ...input,
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})
