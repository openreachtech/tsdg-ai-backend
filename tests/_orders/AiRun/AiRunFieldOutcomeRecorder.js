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
     * The state arriving as text, which is how a status id that passed through a query string or a
     * JSON body arrives.
     *
     * `'4'` is `missing`, and a state compared as it arrived would not have matched the `missing`
     * this recorder holds — leaving a row that says the field settled nothing while carrying the
     * confidence and the evidence category of a reading that lost. That is the row the second use
     * case of `#run-record` reads when an operator asks why a run returned no value for a field, so
     * it is the one row that must never contradict itself. Both leftovers are recorded as null.
     *
     * **A case that stood beside this one has moved to a refusal.** It handed a value read out of a
     * medium to `suggestion_confidence` on a field that settled, and asserted that the row was
     * written with the score nulled — on the reasoning that the column is nullable and already
     * means "no score". Section 10 says it means NULL **when nothing was settled**, so writing that
     * marker against a settled field made a dropped score indistinguishable from a field that
     * scored nothing, in the very row this comment calls the one that must never contradict itself.
     * It is refused now, and lives in the settled-field describe below.
     */
    describe('when a value read out of a medium reaches a nullable column', () => {
      const cases = [
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
          expected: 'refused a reading count outside the range a count can hold',
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

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * The three doors the third audit round found, after the second had closed the ones beside them.
     *
     * `settled_at` is the same defect as the two on `ai_run_steps`: a value that is present and is
     * not a time coerces to the literal text `Invalid date`, on a row kept for two years, and the
     * class checked the kind of every other value it writes while asking nothing of this one.
     *
     * The counts had a floor and no ceiling. `INTEGER` is what the migration declares, so a figure
     * above what the column holds is stored by SQLite, rejected or clamped by a strict MariaDB, and
     * is not a figure either way.
     */
    describe('should refuse a value the record cannot answer for', () => {
      const cases = [
        {
          input: {
            settledAt: 'whenever',
          },
          expected: 'refused a settled instant that is not an instant',
          label: 'a settled instant written as a word that is not a time',
        },
        {
          input: {
            settledAt: new Date('whenever'),
          },
          expected: 'refused a settled instant that is not an instant',
          label: 'a settled instant built from a word that is not a time',
        },
        {
          input: {
            settledAt: null,
          },
          expected: 'refused a settled instant that is not an instant',
          label: 'a settled instant of null, which the column does not hold',
        },
        {
          input: {
            settledAt: 1758534549000,
          },
          expected: 'refused a settled instant that is not an instant',
          label: 'a settled instant written as the number of milliseconds',
        },
        {
          input: {
            agreedReadingCount: 4294967296,
            totalReadingCount: 4294967296,
          },
          expected: 'refused a reading count outside the range a count can hold',
          label: 'a count above what the column holds',
        },
        {
          input: {
            agreedReadingCount: '99999999999999999999',
            totalReadingCount: '99999999999999999999',
          },
          expected: 'refused a reading count outside the range a count can hold',
          label: 'a count written as a string of twenty digits',
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
          fieldPath: 'probe.instant',
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

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * What a settled field has to carry, which is section 10 read literally.
     *
     * Both columns are declared NULL **when nothing was settled**. So on a field that did settle, a
     * null is the marker for the opposite state, and two ways of writing it were reaching the row:
     * an evidence kind the caller simply omitted, and a score this class could not read, which was
     * quietly turned into the no-score marker and written. Either reads back — 730 days later, by
     * an operator asking why a field returned no value — as a field whose majority reading rested
     * on nothing and was scored by nothing, indistinguishable from one that settled nothing at all.
     *
     * The first four scores are the ones the audit put through. Under SQLite a `DECIMAL(5, 4)`
     * takes a string whole where a strict-mode MySQL refuses it, so that channel was open exactly
     * where nobody was watching; they now stop here instead of being nulled and written.
     */
    describe('should refuse a settled field carrying none of what settling it records', () => {
      const cases = [
        {
          input: {
            fieldPath: 'probe.settled.evidence-omitted',
            suggestionConfidence: 0.95,
          },
          expected: 'field AiRunEvidenceCategoryId',
          label: 'an evidence kind omitted altogether',
        },
        {
          input: {
            fieldPath: 'probe.settled.evidence-null',
            aiRunEvidenceCategoryId: null,
            suggestionConfidence: 0.95,
          },
          expected: 'field AiRunEvidenceCategoryId',
          label: 'an evidence kind stated as null',
        },
        {
          input: {
            fieldPath: 'probe.settled.score-text',
            aiRunEvidenceCategoryId: 1,
            // expected names the field below, so a guard that fired for the other reason is caught
            suggestionConfidence: 'read from the medium: the owner is a sample person',
          },
          expected: 'field suggestionConfidence',
          label: 'a score carrying what was read out of the medium',
        },
        {
          input: {
            fieldPath: 'probe.settled.score-above',
            aiRunEvidenceCategoryId: 1,
            // expected names the field below, so a guard that fired for the other reason is caught
            suggestionConfidence: '1.5',
          },
          expected: 'field suggestionConfidence',
          label: 'a score above the top of the range',
        },
        {
          input: {
            fieldPath: 'probe.settled.score-below',
            aiRunEvidenceCategoryId: 1,
            // expected names the field below, so a guard that fired for the other reason is caught
            suggestionConfidence: -0.5,
          },
          expected: 'field suggestionConfidence',
          label: 'a score below the bottom of the range',
        },
        {
          input: {
            fieldPath: 'probe.settled.score-exponent',
            aiRunEvidenceCategoryId: 1,
            // expected names the field below, so a guard that fired for the other reason is caught
            suggestionConfidence: '1e-3',
          },
          expected: 'field suggestionConfidence',
          label: 'a score written in a form no decimal column spells',
        },
        {
          input: {
            fieldPath: 'probe.settled.score-null',
            aiRunEvidenceCategoryId: 1,
            // expected names the field below, so a guard that fired for the other reason is caught
            suggestionConfidence: null,
          },
          expected: 'field suggestionConfidence',
          label: 'a score stated as null on a field that settled',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create() // Arrange

        const actual = () => recorder.saveAiRunFieldOutcome({ // Act
          aiRunId: 10010004,
          aiRunStepId: 10240004,
          aiRunFieldStatusId: 1, // AI_RUN_FIELD_STATUS.EXTRACTED.ID — a state that settles
          agreedReadingCount: 3,
          totalReadingCount: 3,
          confidenceMethodVersion: 'confidence-v1.0.0',
          settledAt: new Date('2026-09-22T09:09:12.012Z'),
          // the evidence kind and the score are stated per case, so a case that omits one omits it
          ...input,
        })

        await expect(actual) // Assert
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunFieldOutcomeRecorder', () => {
  describe('#saveAiRunFieldOutcome()', () => {
    /*
     * The other side of the rule above, and the state the two markers exist for.
     *
     * A field that settled nothing records no evidence kind and no score, and reaches none of the
     * refusals — which is what makes a null in either column mean one thing rather than two.
     */
    describe('should record a field that settled nothing with neither', () => {
      const cases = [
        {
          input: {
            fieldPath: 'probe.unsettled.omitted',
          },
          label: 'neither stated',
        },
        {
          input: {
            fieldPath: 'probe.unsettled.null',
            aiRunEvidenceCategoryId: null,
            suggestionConfidence: null,
          },
          label: 'both stated as null',
        },
        {
          input: {
            fieldPath: 'probe.unsettled.held',
            aiRunEvidenceCategoryId: 1,
            suggestionConfidence: 0.95,
          },
          label: 'both stated, from a reading that did not win',
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
      }) => {
        const recorder = AiRunFieldOutcomeRecorder.create() // Arrange

        const expected = {
          AiRunEvidenceCategoryId: null,
          suggestionConfidence: null,
        }

        const received = await recorder.saveAiRunFieldOutcome({ // Act
          aiRunId: 10010004,
          aiRunStepId: 10240004,
          aiRunFieldStatusId: 4, // AI_RUN_FIELD_STATUS.MISSING.ID — the state that settles nothing
          agreedReadingCount: 0,
          totalReadingCount: 3,
          confidenceMethodVersion: 'confidence-v1.0.0',
          settledAt: new Date('2026-09-22T09:09:13.013Z'),
          ...input,
        })

        expect(received) // Assert
          .toEqual(expect.objectContaining(expected))
      })
    })
  })
})
