import AiRun from '../../../sequelize/models/AiRun.js'

/*
 * What the two retention purges write onto a run, asked of the table rather than of the
 * declaration (specs/1.0.0, #retention).
 *
 * Every run below is created by this file, in #retention's own id block - `11010001` upward - and
 * none is borrowed. Each case creates the run it writes to, so no case depends on another having
 * run first, and every row this file asserts on is owned by this file. The runs are accepted in
 * November 2026, clear of 2026-09-10, which is the day the `ai_runs` fixture was seeded on and the
 * day no test in this repository writes into.
 *
 * **Why these questions need a row at all.** Three facts about the purges cannot be read off a
 * model declaration. `subject_label` is NOT NULL and the purge empties it rather than nulling it,
 * so the table has to accept an empty string where every other content column takes null. The
 * content purge writes four keys at once through `Model.update()`, which reaches this model's
 * `beforeBulkUpdate` guard - and that guard refuses a bulk write naming a key it declares no
 * attribute for, so a purge naming `trace_purged_at` before this checkpoint added the column would
 * have been refused rather than ignored. And the two stamps have to move independently: a content
 * purge must leave the trace stamp where it found it, which is the row-level shape of "two
 * separate settings, never one".
 *
 * The purge jobs themselves are not here. They are checkpoints of their own; what this file fixes
 * is that the schema they will write into accepts the writes they have to make.
 */

describe('AiRun', () => {
  describe('#update()', () => {
    /*
     * A content purge, as the job will write it: the request body and the result body nulled, the
     * subject label emptied, and the instant stamped.
     *
     * The second case is a failed run whose result body was never written. Its content purge
     * empties one column fewer and still stamps, which is the whole of "a run whose content has
     * been purged is distinguishable from one that never carried any" - without the stamp that run
     * would read exactly as it did before the purge reached it.
     *
     * `tracePurgedAt` is asserted null in both: the content clock is the shorter of the two, so a
     * run whose content has just gone is a run whose trace is still there, and a purge that stamped
     * both would put every run past the longer horizon two years early.
     */
    describe('when a content purge empties what section 7 counts as content', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11010001,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11010001',
              requestKey: 'request-key-11010001',
              requestBodyHash: 'request-body-hash-11010001',
              externalRef: 'external-ref-11010001',
              subjectLabel: 'Subject label of run 11010001',
              correlationId: 'correlation-id-11010001',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11010001',
              requestBody: '{"fields":[{"path":"subject.alpha","value":"value of run 11010001"}]}',
              resultBody: '{"fields":[{"path":"subject.alpha","suggestedValue":"suggestion of 11010001"}]}',
              acceptedAt: new Date('2026-11-21T01:00:01.001Z'),
              startedAt: new Date('2026-11-21T01:00:02.002Z'),
              finishedAt: new Date('2026-11-21T01:00:03.003Z'),
              /*
               * Carried at creation so the instance holds it. `#update()` answers the instance
               * rather than the row, and an instance carries only what it was created with plus
               * what the update changed - a column never given to it is absent rather than null.
               * The claim this case exists to make, that a content purge leaves the trace stamp
               * standing, cannot be made unless it is here.
               */
              tracePurgedAt: null,
            },
            purgedValues: {
              requestBody: null,
              resultBody: null,
              subjectLabel: '',
              contentPurgedAt: new Date('2026-12-21T11:11:11.011Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11010001,
            requestBody: null,
            resultBody: null,
            subjectLabel: '',
            contentPurgedAt: new Date('2026-12-21T11:11:11.011Z'),
            tracePurgedAt: null,
            externalRef: 'external-ref-11010001',
            requestBodyHash: 'request-body-hash-11010001',
          }),
        },
        {
          input: {
            aiRunRow: {
              id: 11010002,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 4, // AI_RUN_STATUS.FAILED.ID
              runKey: 'run-key-11010002',
              requestKey: 'request-key-11010002',
              requestBodyHash: 'request-body-hash-11010002',
              externalRef: 'external-ref-11010002',
              subjectLabel: 'Subject label of run 11010002',
              correlationId: 'correlation-id-11010002',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11010002',
              requestBody: '{"fields":[{"path":"subject.beta","value":"value of run 11010002"}]}',
              failureReasonCode: 'failure-reason-code-11010002',
              acceptedAt: new Date('2026-11-22T02:00:01.001Z'),
              startedAt: new Date('2026-11-22T02:00:02.002Z'),
              finishedAt: new Date('2026-11-22T02:00:03.003Z'),
              // Carried for the reason the case above states: the instance answers with what it
              // was created with, so a column never given to it is absent rather than null.
              tracePurgedAt: null,
            },
            purgedValues: {
              requestBody: null,
              resultBody: null,
              subjectLabel: '',
              contentPurgedAt: new Date('2026-12-22T12:12:12.012Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11010002,
            requestBody: null,
            resultBody: null,
            subjectLabel: '',
            contentPurgedAt: new Date('2026-12-22T12:12:12.012Z'),
            tracePurgedAt: null,
            failureReasonCode: 'failure-reason-code-11010002',
          }),
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
        expected,
      }) => {
        const aiRun = await AiRun.create(input.aiRunRow)

        const received = await aiRun.update(input.purgedValues)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRun', () => {
  describe('#update()', () => {
    /*
     * A trace purge, reaching a run whose content went two years' worth of clock ago.
     *
     * The run keeps the content stamp it already carried and gains a second one, so the pair reads
     * as two events at two instants rather than as one "purged" flag with no date to argue from.
     * That pairing is what the fourth criterion of section 19 rests on: a run carrying the content
     * stamp alone is inside the trace horizon and still answers why a value was or was not
     * produced, and a run carrying both is past both horizons - and without the second stamp those
     * two runs are the same row, since the trace is rows in other tables and its absence leaves
     * nothing behind to read.
     */
    describe('when a trace purge stamps a run whose content has already gone', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11010011,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 3, // AI_RUN_STATUS.SUCCEEDED.ID
              runKey: 'run-key-11010011',
              requestKey: 'request-key-11010011',
              requestBodyHash: 'request-body-hash-11010011',
              externalRef: 'external-ref-11010011',
              subjectLabel: '',
              correlationId: 'correlation-id-11010011',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11010011',
              engineLabel: 'engine-label-11010011',
              acceptedAt: new Date('2026-11-23T03:00:01.001Z'),
              startedAt: new Date('2026-11-23T03:00:02.002Z'),
              finishedAt: new Date('2026-11-23T03:00:03.003Z'),
              contentPurgedAt: new Date('2026-12-23T13:13:13.013Z'),
            },
            purgedValues: {
              tracePurgedAt: new Date('2028-11-23T23:23:23.023Z'),
            },
          },
          expected: expect.objectContaining({
            id: 11010011,
            contentPurgedAt: new Date('2026-12-23T13:13:13.013Z'),
            tracePurgedAt: new Date('2028-11-23T23:23:23.023Z'),
            subjectLabel: '',
            engineLabel: 'engine-label-11010011',
          }),
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
        expected,
      }) => {
        const aiRun = await AiRun.create(input.aiRunRow)

        const received = await aiRun.update(input.purgedValues)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRun', () => {
  describe('.update()', () => {
    /*
     * The same content purge written the way a job over many rows writes it, which is the path this
     * model guards.
     *
     * `beforeBulkUpdate` refuses a bulk write naming a key this model declares no attribute for,
     * and it refuses one naming the run status under a condition it did not build. A content purge
     * names four keys and no status, so it is neither - and that is worth a row rather than an
     * argument, because the guard is what a purge job written against this table meets first.
     *
     * One row moved is the assertion: the write reached the run it addressed, and the guard let it.
     */
    describe('when a content purge is written over the whole matching set', () => {
      const cases = [
        {
          input: {
            aiRunRow: {
              id: 11010021,
              ApiClientId: 10000001,
              AiRunCategoryId: 1, // AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.ID
              AiRunStatusId: 5, // AI_RUN_STATUS.CANCELED.ID
              runKey: 'run-key-11010021',
              requestKey: 'request-key-11010021',
              requestBodyHash: 'request-body-hash-11010021',
              externalRef: 'external-ref-11010021',
              subjectLabel: 'Subject label of run 11010021',
              correlationId: 'correlation-id-11010021',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/11010021',
              requestBody: '{"fields":[{"path":"subject.gamma","value":"value of run 11010021"}]}',
              acceptedAt: new Date('2026-11-24T04:00:01.001Z'),
              startedAt: new Date('2026-11-24T04:00:02.002Z'),
              cancelRequestedAt: new Date('2026-11-24T04:00:03.003Z'),
              canceledAt: new Date('2026-11-24T04:00:04.004Z'),
              finishedAt: new Date('2026-11-24T04:00:04.004Z'),
            },
            purgedValues: {
              requestBody: null,
              resultBody: null,
              subjectLabel: '',
              contentPurgedAt: new Date('2026-12-24T14:14:14.014Z'),
            },
            options: {
              where: {
                id: 11010021,
              },
            },
          },
          expected: [
            1, // the rows the write moved
          ],
        },
      ]

      test.each(cases)('runKey: $input.aiRunRow.runKey', async ({
        input,
        expected,
      }) => {
        await AiRun.create(input.aiRunRow)

        const received = await AiRun.update(input.purgedValues, input.options)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
