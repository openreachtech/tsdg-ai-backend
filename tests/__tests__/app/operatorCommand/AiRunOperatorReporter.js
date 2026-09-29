import AiRunOperatorReporter from '../../../../app/operatorCommand/AiRunOperatorReporter.js'

/*
 * What `#operator-cli` puts on a terminal, read as a pure value.
 *
 * **Nothing here touches a table, and nothing is mocked away.** This class is handed rows that are
 * already built — `AiRunPageResponseBuilder#buildAiRunRowResponse()`'s own shape — and answers
 * text. Every case below therefore states a row and the exact characters it comes out as, spaces
 * included: alignment is the whole of what a table is, and an assertion that skipped the padding
 * would pass on a reporter that printed its columns in a heap.
 *
 * **The describe that matters most is `should never print the subject label`.** Section 7 counts
 * the subject label as content, so the database gives it thirty days and the purge empties it; a
 * scrollback, a runbook's captured output and a scheduled task's log have no clock at all. Every
 * row in this file carries a subject label for that reason — not as decoration, but so that every
 * exact-text assertion in it is also an assertion that the label did not come out.
 *
 * **Every instant is written into the case.** Nothing here reads a clock, because a report that
 * differed by the second it ran could not be asserted character for character.
 */

describe('AiRunOperatorReporter', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#sink', () => {
        const cases = [
          {
            label: 'a collector of its own',
            input: {
              sink: {
                write: () => true,
              },
            },
          },
          {
            label: 'standard output',
            input: {
              sink: process.stdout,
            },
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const reporter = new AiRunOperatorReporter(input)

          expect(reporter)
            .toHaveProperty('sink', input.sink)
        })
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          label: 'a collector of its own',
          input: {
            sink: {
              write: () => true,
            },
          },
        },
        {
          label: 'standard output',
          input: {
            sink: process.stdout,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRunOperatorReporter.create(input)

        expect(received)
          .toBeInstanceOf(AiRunOperatorReporter)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          label: 'a collector of its own',
          input: {
            sink: {
              write: () => true,
            },
          },
        },
        {
          label: 'standard output',
          input: {
            sink: process.stdout,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunOperatorReporter)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('.create()', () => {
    describe('should fill default sink', () => {
      test('with no arguments', () => {
        const expected = {
          sink: process.stdout,
        }

        const SpyClass = constructorSpy.spyOn(AiRunOperatorReporter)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('.get:standardOutputSink', () => {
    describe('when called as is', () => {
      test('should be standard output', () => {
        const received = AiRunOperatorReporter.standardOutputSink

        expect(received)
          .toBe(process.stdout) // same reference
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#reportAiRunRows()', () => {
    describe('should write the table and close it with a line break', () => {
      const cases = [
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10700001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'EXAMPLE-SUBJECT-LABEL-1',
                correlationId: 'asset-1001',
                externalRef: 'ext-1001',
                statusName: 'running',
                lastCompletedStep: {
                  stepName: 'read-media',
                  stepIndex: 3,
                },
                elapsedSeconds: 723,
                modelCallCount: 3,
                inputTokenCount: 12345,
                outputTokenCount: 678,
                acceptedAt: new Date('2026-09-14T03:48:00.000Z'),
              },
            ],
          },
          expected: [
            'RUN KEY           STATUS   ELAPSED  LAST STEP     KIND                    CALLS  IN TOKENS  OUT TOKENS  CORRELATION  EXTERNAL REF  ACCEPTED',
            'run-key-10700001  running   12m03s  3:read-media  asset-media-extraction      3      12345         678  asset-1001   ext-1001      2026-09-14T03:48:00Z',
            '',
          ].join('\n'),
        },
      ]

      test.each(cases)('runKey: $input.rows.0.runKey', ({
        input,
        expected,
      }) => {
        const sink = {
          write: jest.fn(),
        }

        const reporter = AiRunOperatorReporter.create({
          sink,
        })

        reporter.reportAiRunRows(input)

        expect(sink.write)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#reportAiRunRows()', () => {
    describe('should never print the subject label', () => {
      const cases = [
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10700001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'SUBJECT-LABEL-MUST-NEVER-REACH-A-TERMINAL',
                correlationId: 'asset-1001',
                externalRef: 'ext-1001',
                statusName: 'running',
                lastCompletedStep: {
                  stepName: 'read-media',
                  stepIndex: 3,
                },
                elapsedSeconds: 723,
                modelCallCount: 3,
                inputTokenCount: 12345,
                outputTokenCount: 678,
                acceptedAt: new Date('2026-09-14T03:48:00.000Z'),
              },
              {
                runKey: 'run-key-10700002',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'SECOND-SUBJECT-LABEL-MUST-NEVER-REACH-A-TERMINAL',
                correlationId: 'asset-1002',
                externalRef: 'ext-1002',
                statusName: 'failed',
                lastCompletedStep: null,
                elapsedSeconds: 0,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T04:00:00.000Z'),
              },
            ],
          },
          expected: 'SUBJECT-LABEL-MUST-NEVER-REACH-A-TERMINAL',
        },
      ]

      test.each(cases)('subjectLabel: $input.rows.0.subjectLabel', ({
        input,
        expected,
      }) => {
        const writtenTexts = []

        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: text => writtenTexts.push(text),
          },
        })

        reporter.reportAiRunRows(input)

        expect(writtenTexts)
          .toHaveLength(1)
        expect(writtenTexts[0])
          .not
          .toMatch(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildAiRunRowsText()', () => {
    describe('with runs of differing widths', () => {
      const cases = [
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10700001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'EXAMPLE-SUBJECT-LABEL-1',
                correlationId: 'asset-1001',
                externalRef: 'ext-1001',
                statusName: 'running',
                lastCompletedStep: {
                  stepName: 'read-media',
                  stepIndex: 3,
                },
                elapsedSeconds: 723,
                modelCallCount: 3,
                inputTokenCount: 12345,
                outputTokenCount: 678,
                acceptedAt: new Date('2026-09-14T03:48:00.000Z'),
              },
              {
                runKey: 'run-key-2',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'EXAMPLE-SUBJECT-LABEL-2',
                correlationId: 'asset-2',
                externalRef: 'ext-2',
                statusName: 'queued',
                lastCompletedStep: null,
                elapsedSeconds: 0,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T04:00:00.000Z'),
              },
              {
                runKey: 'run-key-3',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'EXAMPLE-SUBJECT-LABEL-3',
                correlationId: 'asset-3',
                externalRef: 'ext-3',
                statusName: 'failed',
                lastCompletedStep: {
                  stepName: 'fetch-media',
                  stepIndex: 1,
                },
                elapsedSeconds: 7523,
                modelCallCount: 1,
                inputTokenCount: 900,
                outputTokenCount: 42,
                acceptedAt: new Date('2026-09-14T01:55:00.000Z'),
              },
            ],
          },
          expected: [
            'RUN KEY           STATUS   ELAPSED  LAST STEP      KIND                    CALLS  IN TOKENS  OUT TOKENS  CORRELATION  EXTERNAL REF  ACCEPTED',
            'run-key-10700001  running   12m03s  3:read-media   asset-media-extraction      3      12345         678  asset-1001   ext-1001      2026-09-14T03:48:00Z',
            'run-key-2         queued        0s  -              asset-media-extraction      0          0           0  asset-2      ext-2         2026-09-14T04:00:00Z',
            'run-key-3         failed     2h05m  1:fetch-media  asset-media-extraction      1        900          42  asset-3      ext-3         2026-09-14T01:55:00Z',
          ].join('\n'),
        },
      ]

      test.each(cases)('rows.0.runKey: $input.rows.0.runKey', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunRowsText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with one run', () => {
      const cases = [
        {
          input: {
            rows: [
              {
                runKey: 'run-key-10700001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'EXAMPLE-SUBJECT-LABEL-1',
                correlationId: 'asset-1001',
                externalRef: 'ext-1001',
                statusName: 'running',
                lastCompletedStep: {
                  stepName: 'read-media',
                  stepIndex: 3,
                },
                elapsedSeconds: 723,
                modelCallCount: 3,
                inputTokenCount: 12345,
                outputTokenCount: 678,
                acceptedAt: new Date('2026-09-14T03:48:00.000Z'),
              },
            ],
          },
          expected: [
            'RUN KEY           STATUS   ELAPSED  LAST STEP     KIND                    CALLS  IN TOKENS  OUT TOKENS  CORRELATION  EXTERNAL REF  ACCEPTED',
            'run-key-10700001  running   12m03s  3:read-media  asset-media-extraction      3      12345         678  asset-1001   ext-1001      2026-09-14T03:48:00Z',
          ].join('\n'),
        },
      ]

      test.each(cases)('rows.0.runKey: $input.rows.0.runKey', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunRowsText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with no run at all', () => {
      const cases = [
        {
          label: 'an empty page',
          input: {
            rows: [],
          },
          expected: 'RUN KEY  STATUS  ELAPSED  LAST STEP  KIND  CALLS  IN TOKENS  OUT TOKENS  CORRELATION  EXTERNAL REF  ACCEPTED',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunRowsText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildAiRunRowCells()', () => {
    describe('should read eleven fields off the row, and the subject label off none', () => {
      const cases = [
        {
          input: {
            row: {
              runKey: 'run-key-10700001',
              runCategoryName: 'asset-media-extraction',
              subjectLabel: 'EXAMPLE-SUBJECT-LABEL-1',
              correlationId: 'asset-1001',
              externalRef: 'ext-1001',
              statusName: 'running',
              lastCompletedStep: {
                stepName: 'read-media',
                stepIndex: 3,
              },
              elapsedSeconds: 723,
              modelCallCount: 3,
              inputTokenCount: 12345,
              outputTokenCount: 678,
              acceptedAt: new Date('2026-09-14T03:48:00.000Z'),
            },
          },
          expected: [
            'run-key-10700001',
            'running',
            '12m03s',
            '3:read-media',
            'asset-media-extraction',
            '3',
            '12345',
            '678',
            'asset-1001',
            'ext-1001',
            '2026-09-14T03:48:00Z',
          ],
        },
        {
          input: {
            row: {
              runKey: 'run-key-10700009',
              runCategoryName: 'asset-media-extraction',
              subjectLabel: 'EXAMPLE-SUBJECT-LABEL-2',
              correlationId: 'asset-1009',
              externalRef: '',
              statusName: 'queued',
              lastCompletedStep: null,
              elapsedSeconds: 0,
              modelCallCount: 0,
              inputTokenCount: 0,
              outputTokenCount: 0,
              acceptedAt: new Date('2026-09-14T04:00:00.000Z'),
            },
          },
          expected: [
            'run-key-10700009',
            'queued',
            '0s',
            '-',
            'asset-media-extraction',
            '0',
            '0',
            '0',
            'asset-1009',
            '-',
            '2026-09-14T04:00:00Z',
          ],
        },
      ]

      test.each(cases)('runKey: $input.row.runKey', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunRowCells(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#reportAiRunDetail()', () => {
    describe('should write the run and its steps, and close them with a line break', () => {
      const cases = [
        {
          input: {
            row: {
              runKey: 'run-key-10700001',
              runCategoryName: 'asset-media-extraction',
              subjectLabel: 'EXAMPLE-SUBJECT-LABEL-1',
              correlationId: 'asset-1001',
              externalRef: 'ext-1001',
              statusName: 'running',
              lastCompletedStep: {
                stepName: 'read-media',
                stepIndex: 3,
              },
              elapsedSeconds: 723,
              modelCallCount: 3,
              inputTokenCount: 12345,
              outputTokenCount: 678,
              acceptedAt: new Date('2026-09-14T03:48:00.000Z'),
            },
            steps: [],
          },
          expected: [
            'RUN KEY           STATUS   ELAPSED  LAST STEP     KIND                    CALLS  IN TOKENS  OUT TOKENS  CORRELATION  EXTERNAL REF  ACCEPTED',
            'run-key-10700001  running   12m03s  3:read-media  asset-media-extraction      3      12345         678  asset-1001   ext-1001      2026-09-14T03:48:00Z',
            '',
            'no steps recorded',
            '',
          ].join('\n'),
        },
      ]

      test.each(cases)('runKey: $input.row.runKey', ({
        input,
        expected,
      }) => {
        const sink = {
          write: jest.fn(),
        }

        const reporter = AiRunOperatorReporter.create({
          sink,
        })

        reporter.reportAiRunDetail(input)

        expect(sink.write)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#reportAiRunDetail()', () => {
    describe('should never print the subject label', () => {
      const cases = [
        {
          input: {
            row: {
              runKey: 'run-key-10700001',
              runCategoryName: 'asset-media-extraction',
              subjectLabel: 'DETAIL-SUBJECT-LABEL-MUST-NEVER-REACH-A-TERMINAL',
              correlationId: 'asset-1001',
              externalRef: 'ext-1001',
              statusName: 'running',
              lastCompletedStep: {
                stepName: 'read-media',
                stepIndex: 3,
              },
              elapsedSeconds: 723,
              modelCallCount: 3,
              inputTokenCount: 12345,
              outputTokenCount: 678,
              acceptedAt: new Date('2026-09-14T03:48:00.000Z'),
            },
            steps: [
              {
                stepIndex: 0,
                stepName: 'fetch-media',
                AiRunStepCategory: {
                  name: 'media-fetch',
                },
                outcomeCode: 'succeeded',
                reasonCode: null,
                startedAt: new Date('2026-09-14T03:48:01.000Z'),
                finishedAt: new Date('2026-09-14T03:48:46.000Z'),
              },
            ],
          },
          expected: 'DETAIL-SUBJECT-LABEL-MUST-NEVER-REACH-A-TERMINAL',
        },
      ]

      test.each(cases)('subjectLabel: $input.row.subjectLabel', ({
        input,
        expected,
      }) => {
        const writtenTexts = []

        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: text => writtenTexts.push(text),
          },
        })

        reporter.reportAiRunDetail(input)

        expect(writtenTexts)
          .toHaveLength(1)
        expect(writtenTexts[0])
          .not
          .toMatch(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildAiRunDetailText()', () => {
    describe('with steps handed over out of order', () => {
      const cases = [
        {
          input: {
            row: {
              runKey: 'run-key-10700001',
              runCategoryName: 'asset-media-extraction',
              subjectLabel: 'EXAMPLE-SUBJECT-LABEL-1',
              correlationId: 'asset-1001',
              externalRef: 'ext-1001',
              statusName: 'running',
              lastCompletedStep: {
                stepName: 'read-media',
                stepIndex: 3,
              },
              elapsedSeconds: 723,
              modelCallCount: 3,
              inputTokenCount: 12345,
              outputTokenCount: 678,
              acceptedAt: new Date('2026-09-14T03:48:00.000Z'),
            },
            steps: [
              {
                stepIndex: 2,
                stepName: 'read-media',
                AiRunStepCategory: {
                  name: 'model-call',
                },
                outcomeCode: 'succeeded',
                reasonCode: null,
                startedAt: new Date('2026-09-14T03:50:05.000Z'),
                finishedAt: null,
              },
              {
                stepIndex: 0,
                stepName: 'fetch-media',
                AiRunStepCategory: {
                  name: 'media-fetch',
                },
                outcomeCode: 'succeeded',
                reasonCode: null,
                startedAt: new Date('2026-09-14T03:48:01.000Z'),
                finishedAt: new Date('2026-09-14T03:48:46.000Z'),
              },
              {
                stepIndex: 1,
                stepName: 'settle-fields',
                AiRunStepCategory: {
                  name: 'settlement',
                },
                outcomeCode: 'failed',
                reasonCode: 'no-majority',
                startedAt: new Date('2026-09-14T03:48:50.000Z'),
                finishedAt: new Date('2026-09-14T03:50:00.000Z'),
              },
            ],
          },
          expected: [
            'RUN KEY           STATUS   ELAPSED  LAST STEP     KIND                    CALLS  IN TOKENS  OUT TOKENS  CORRELATION  EXTERNAL REF  ACCEPTED',
            'run-key-10700001  running   12m03s  3:read-media  asset-media-extraction      3      12345         678  asset-1001   ext-1001      2026-09-14T03:48:00Z',
            '',
            'STEP  NAME           KIND         OUTCOME    REASON       STARTED               FINISHED               TOOK',
            '   0  fetch-media    media-fetch  succeeded  -            2026-09-14T03:48:01Z  2026-09-14T03:48:46Z    45s',
            '   1  settle-fields  settlement   failed     no-majority  2026-09-14T03:48:50Z  2026-09-14T03:50:00Z  1m10s',
            '   2  read-media     model-call   succeeded  -            2026-09-14T03:50:05Z  -                         -',
          ].join('\n'),
        },
      ]

      test.each(cases)('steps.0.stepName: $input.steps.0.stepName', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunDetailText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with no step recorded', () => {
      const cases = [
        {
          input: {
            row: {
              runKey: 'run-key-10700009',
              runCategoryName: 'asset-media-extraction',
              subjectLabel: 'EXAMPLE-SUBJECT-LABEL-2',
              correlationId: 'asset-1009',
              externalRef: 'ext-1009',
              statusName: 'queued',
              lastCompletedStep: null,
              elapsedSeconds: 0,
              modelCallCount: 0,
              inputTokenCount: 0,
              outputTokenCount: 0,
              acceptedAt: new Date('2026-09-14T04:00:00.000Z'),
            },
            steps: [],
          },
          expected: [
            'RUN KEY           STATUS  ELAPSED  LAST STEP  KIND                    CALLS  IN TOKENS  OUT TOKENS  CORRELATION  EXTERNAL REF  ACCEPTED',
            'run-key-10700009  queued       0s  -          asset-media-extraction      0          0           0  asset-1009   ext-1009      2026-09-14T04:00:00Z',
            '',
            'no steps recorded',
          ].join('\n'),
        },
      ]

      test.each(cases)('runKey: $input.row.runKey', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunDetailText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildAiRunStepsText()', () => {
    describe('with a trace to print', () => {
      const cases = [
        {
          input: {
            steps: [
              {
                stepIndex: 2,
                stepName: 'read-media',
                AiRunStepCategory: {
                  name: 'model-call',
                },
                outcomeCode: 'succeeded',
                reasonCode: null,
                startedAt: new Date('2026-09-14T03:50:05.000Z'),
                finishedAt: null,
              },
              {
                stepIndex: 0,
                stepName: 'fetch-media',
                AiRunStepCategory: {
                  name: 'media-fetch',
                },
                outcomeCode: 'succeeded',
                reasonCode: null,
                startedAt: new Date('2026-09-14T03:48:01.000Z'),
                finishedAt: new Date('2026-09-14T03:48:46.000Z'),
              },
              {
                stepIndex: 1,
                stepName: 'settle-fields',
                AiRunStepCategory: {
                  name: 'settlement',
                },
                outcomeCode: 'failed',
                reasonCode: 'no-majority',
                startedAt: new Date('2026-09-14T03:48:50.000Z'),
                finishedAt: new Date('2026-09-14T03:50:00.000Z'),
              },
            ],
          },
          expected: [
            'STEP  NAME           KIND         OUTCOME    REASON       STARTED               FINISHED               TOOK',
            '   0  fetch-media    media-fetch  succeeded  -            2026-09-14T03:48:01Z  2026-09-14T03:48:46Z    45s',
            '   1  settle-fields  settlement   failed     no-majority  2026-09-14T03:48:50Z  2026-09-14T03:50:00Z  1m10s',
            '   2  read-media     model-call   succeeded  -            2026-09-14T03:50:05Z  -                         -',
          ].join('\n'),
        },
      ]

      test.each(cases)('steps.0.stepName: $input.steps.0.stepName', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunStepsText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with no step recorded', () => {
      const cases = [
        {
          label: 'an empty trace',
          input: {
            steps: [],
          },
          expected: 'no steps recorded',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunStepsText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#sortAiRunSteps()', () => {
    describe('should answer the steps in the order their run ran them', () => {
      const cases = [
        {
          input: {
            steps: [
              {
                stepIndex: 2,
                stepName: 'read-media',
              },
              {
                stepIndex: 0,
                stepName: 'fetch-media',
              },
              {
                stepIndex: 1,
                stepName: 'settle-fields',
              },
            ],
          },
          expected: [
            {
              stepIndex: 0,
              stepName: 'fetch-media',
            },
            {
              stepIndex: 1,
              stepName: 'settle-fields',
            },
            {
              stepIndex: 2,
              stepName: 'read-media',
            },
          ],
        },
        {
          input: {
            steps: [
              {
                stepIndex: 0,
                stepName: 'only-step',
              },
            ],
          },
          expected: [
            {
              stepIndex: 0,
              stepName: 'only-step',
            },
          ],
        },
      ]

      test.each(cases)('steps.0.stepName: $input.steps.0.stepName', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.sortAiRunSteps(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should leave the array it was handed as it was', () => {
      const cases = [
        {
          input: {
            steps: [
              {
                stepIndex: 2,
                stepName: 'read-media',
              },
              {
                stepIndex: 0,
                stepName: 'fetch-media',
              },
            ],
          },
          expected: [
            {
              stepIndex: 2,
              stepName: 'read-media',
            },
            {
              stepIndex: 0,
              stepName: 'fetch-media',
            },
          ],
        },
      ]

      test.each(cases)('steps.0.stepName: $input.steps.0.stepName', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        reporter.sortAiRunSteps(input)

        expect(input.steps)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildAiRunStepCells()', () => {
    describe('should answer the cells one step reads as', () => {
      const cases = [
        {
          input: {
            aiRunStep: {
              stepIndex: 1,
              stepName: 'settle-fields',
              AiRunStepCategory: {
                name: 'settlement',
              },
              outcomeCode: 'failed',
              reasonCode: 'no-majority',
              startedAt: new Date('2026-09-14T03:48:50.000Z'),
              finishedAt: new Date('2026-09-14T03:50:00.000Z'),
            },
          },
          expected: [
            '1',
            'settle-fields',
            'settlement',
            'failed',
            'no-majority',
            '2026-09-14T03:48:50Z',
            '2026-09-14T03:50:00Z',
            '1m10s',
          ],
        },
        {
          input: {
            aiRunStep: {
              stepIndex: 2,
              stepName: 'read-media',
              AiRunStepCategory: {
                name: 'model-call',
              },
              outcomeCode: 'succeeded',
              reasonCode: null,
              startedAt: new Date('2026-09-14T03:50:05.000Z'),
              finishedAt: null,
            },
          },
          expected: [
            '2',
            'read-media',
            'model-call',
            'succeeded',
            '-',
            '2026-09-14T03:50:05Z',
            '-',
            '-',
          ],
        },
      ]

      test.each(cases)('stepName: $input.aiRunStep.stepName', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildAiRunStepCells(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#extractAiRunStepCategoryName()', () => {
    describe('with the category the finder included', () => {
      const cases = [
        {
          input: {
            aiRunStep: {
              stepIndex: 0,
              stepName: 'fetch-media',
              AiRunStepCategory: {
                id: 1,
                name: 'media-fetch',
              },
            },
          },
          expected: 'media-fetch',
        },
        {
          input: {
            aiRunStep: {
              stepIndex: 2,
              stepName: 'read-media',
              AiRunStepCategory: {
                id: 2,
                name: 'model-call',
              },
            },
          },
          expected: 'model-call',
        },
      ]

      test.each(cases)('stepName: $input.aiRunStep.stepName', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.extractAiRunStepCategoryName(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with no category at all', () => {
      const cases = [
        {
          label: 'a step read without its association',
          input: {
            aiRunStep: {
              stepIndex: 0,
              stepName: 'fetch-media',
              // AiRunStepCategory: undefined
            },
          },
        },
        {
          label: 'a step whose association came back null',
          input: {
            aiRunStep: {
              stepIndex: 1,
              stepName: 'settle-fields',
              AiRunStepCategory: null,
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.extractAiRunStepCategoryName(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#reportNothingFound()', () => {
    describe('should write the sentence and close it with a line break', () => {
      const cases = [
        {
          input: {
            label: 'stalled beyond 300 seconds',
          },
          expected: 'no runs found: stalled beyond 300 seconds\n',
        },
        {
          input: {
            label: 'failed since 2026-09-14T00:00:00Z',
          },
          expected: 'no runs found: failed since 2026-09-14T00:00:00Z\n',
        },
      ]

      test.each(cases)('label: $input.label', ({
        input,
        expected,
      }) => {
        const sink = {
          write: jest.fn(),
        }

        const reporter = AiRunOperatorReporter.create({
          sink,
        })

        reporter.reportNothingFound(input)

        expect(sink.write)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildNothingFoundText()', () => {
    describe('with a question to state', () => {
      const cases = [
        {
          input: {
            label: 'stalled beyond 300 seconds',
          },
          expected: 'no runs found: stalled beyond 300 seconds',
        },
        {
          input: {
            label: 'correlation asset-7788',
          },
          expected: 'no runs found: correlation asset-7788',
        },
      ]

      test.each(cases)('label: $input.label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildNothingFoundText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with none', () => {
      const cases = [
        {
          label: 'a label of null',
          input: {
            label: null,
          },
          expected: 'no runs found',
        },
        {
          label: 'a label of empty text',
          input: {
            label: '',
          },
          expected: 'no runs found',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildNothingFoundText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateTextCell()', () => {
    /*
     * A correlation id and an external ref are a caller's own text, and the rule that admits them
     * bounds their length and nothing else — so an escape sequence is storable. Printed raw, the
     * terminal acts on it: `ESC [ 2 K` clears the line the operator is reading and `ESC [ 1 A`
     * puts the next one over the top of it. This command is read exactly when the service will
     * not answer and there is nowhere else to look, so a report the reported data can edit is
     * worse than no report.
     *
     * The marker is asserted as visible rather than as stripped: an operator should be able to
     * see that somebody stored something strange, which a silently shortened cell would hide.
     */
    describe('with a control character in the text', () => {
      const cases = [
        {
          label: 'an erase-line and cursor-up sequence',
          input: {
            value: 'corr\u001b[2K\u001b[1Aerased',
          },
          expected: 'corr?[2K?[1Aerased',
        },
        {
          label: 'a bare carriage return',
          input: {
            value: 'ext\rcarriage',
          },
          expected: 'ext?carriage',
        },
        {
          label: 'a line break forging a second row',
          input: {
            value: 'first\nsecond',
          },
          expected: 'first?second',
        },
        {
          label: 'a delete character',
          input: {
            value: 'ref\u007fgone',
          },
          expected: 'ref?gone',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateTextCell(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with text to print', () => {
      const cases = [
        {
          input: {
            value: 'run-key-10700001',
          },
          expected: 'run-key-10700001',
        },
        {
          input: {
            value: 'no-majority',
          },
          expected: 'no-majority',
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateTextCell(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with nothing to print', () => {
      const cases = [
        {
          label: 'a value of null',
          input: {
            value: null,
          },
          expected: '-',
        },
        {
          label: 'a value of empty text',
          input: {
            value: '',
          },
          expected: '-',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateTextCell(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateElapsedText()', () => {
    describe('with a duration to print', () => {
      const cases = [
        {
          input: {
            elapsedSeconds: 0,
          },
          expected: '0s',
        },
        {
          input: {
            elapsedSeconds: 45,
          },
          expected: '45s',
        },
        {
          input: {
            elapsedSeconds: 59,
          },
          expected: '59s',
        },
        {
          input: {
            elapsedSeconds: 60,
          },
          expected: '1m00s',
        },
        {
          input: {
            elapsedSeconds: 723,
          },
          expected: '12m03s',
        },
        {
          input: {
            elapsedSeconds: 3599,
          },
          expected: '59m59s',
        },
        {
          input: {
            elapsedSeconds: 3600,
          },
          expected: '1h00m',
        },
        {
          input: {
            elapsedSeconds: 7523,
          },
          expected: '2h05m',
        },
        {
          input: {
            elapsedSeconds: 86399,
          },
          expected: '23h59m',
        },
      ]

      test.each(cases)('elapsedSeconds: $input.elapsedSeconds', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateElapsedText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with none', () => {
      const cases = [
        {
          label: 'a duration of null',
          input: {
            elapsedSeconds: null,
          },
          expected: '-',
        },
        {
          label: 'no duration at all',
          input: {
            // elapsedSeconds: undefined
          },
          expected: '-',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateElapsedText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateSecondScaleElapsedText()', () => {
    describe('should answer whole seconds', () => {
      const cases = [
        {
          input: {
            elapsedSeconds: 0,
          },
          expected: '0s',
        },
        {
          input: {
            elapsedSeconds: 7,
          },
          expected: '7s',
        },
        {
          input: {
            elapsedSeconds: 59,
          },
          expected: '59s',
        },
      ]

      test.each(cases)('elapsedSeconds: $input.elapsedSeconds', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateSecondScaleElapsedText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateMinuteScaleElapsedText()', () => {
    describe('should answer minutes and padded seconds', () => {
      const cases = [
        {
          input: {
            elapsedSeconds: 60,
          },
          expected: '1m00s',
        },
        {
          input: {
            elapsedSeconds: 65,
          },
          expected: '1m05s',
        },
        {
          input: {
            elapsedSeconds: 723,
          },
          expected: '12m03s',
        },
        {
          input: {
            elapsedSeconds: 3599,
          },
          expected: '59m59s',
        },
      ]

      test.each(cases)('elapsedSeconds: $input.elapsedSeconds', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateMinuteScaleElapsedText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateHourScaleElapsedText()', () => {
    describe('should answer hours and padded minutes', () => {
      const cases = [
        {
          input: {
            elapsedSeconds: 3600,
          },
          expected: '1h00m',
        },
        {
          input: {
            elapsedSeconds: 7523,
          },
          expected: '2h05m',
        },
        {
          input: {
            elapsedSeconds: 86399,
          },
          expected: '23h59m',
        },
      ]

      test.each(cases)('elapsedSeconds: $input.elapsedSeconds', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateHourScaleElapsedText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#padClockNumber()', () => {
    describe('should answer two digits', () => {
      const cases = [
        {
          input: {
            value: 0,
          },
          expected: '00',
        },
        {
          input: {
            value: 5,
          },
          expected: '05',
        },
        {
          input: {
            value: 59,
          },
          expected: '59',
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.padClockNumber(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateLastCompletedStepText()', () => {
    describe('with a step the run has finished', () => {
      const cases = [
        {
          input: {
            lastCompletedStep: {
              stepName: 'fetch-media',
              stepIndex: 0,
            },
          },
          expected: '0:fetch-media',
        },
        {
          input: {
            lastCompletedStep: {
              stepName: 'read-media',
              stepIndex: 3,
            },
          },
          expected: '3:read-media',
        },
      ]

      test.each(cases)('stepName: $input.lastCompletedStep.stepName', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateLastCompletedStepText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with none', () => {
      const cases = [
        {
          label: 'a step of null',
          input: {
            lastCompletedStep: null,
          },
          expected: '-',
        },
        {
          label: 'no step at all',
          input: {
            // lastCompletedStep: undefined
          },
          expected: '-',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateLastCompletedStepText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateCountText()', () => {
    describe('with a count to print', () => {
      const cases = [
        {
          input: {
            count: 0,
          },
          expected: '0',
        },
        {
          input: {
            count: 3,
          },
          expected: '3',
        },
        {
          input: {
            count: 12345,
          },
          expected: '12345',
        },
      ]

      test.each(cases)('count: $input.count', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateCountText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with none', () => {
      const cases = [
        {
          label: 'a count of null',
          input: {
            count: null,
          },
          expected: '-',
        },
        {
          label: 'no count at all',
          input: {
            // count: undefined
          },
          expected: '-',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateCountText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateInstantText()', () => {
    describe('with an instant to print', () => {
      const cases = [
        {
          input: {
            instant: new Date('2026-09-14T03:48:00.000Z'),
          },
          expected: '2026-09-14T03:48:00Z',
        },
        {
          input: {
            instant: new Date('2026-09-14T01:55:09.317Z'),
          },
          expected: '2026-09-14T01:55:09Z',
        },
        {
          input: {
            instant: new Date('2026-12-31T23:59:59.999Z'),
          },
          expected: '2026-12-31T23:59:59Z',
        },
      ]

      test.each(cases)('instant: $input.instant', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateInstantText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with none', () => {
      const cases = [
        {
          label: 'an instant of null',
          input: {
            instant: null,
          },
          expected: '-',
        },
        {
          label: 'no instant at all',
          input: {
            // instant: undefined
          },
          expected: '-',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateInstantText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateDurationText()', () => {
    describe('with a step that finished', () => {
      const cases = [
        {
          input: {
            startedAt: new Date('2026-09-14T03:47:30.000Z'),
            finishedAt: new Date('2026-09-14T03:47:30.400Z'),
          },
          expected: '0s',
        },
        {
          input: {
            startedAt: new Date('2026-09-14T03:48:01.000Z'),
            finishedAt: new Date('2026-09-14T03:48:46.000Z'),
          },
          expected: '45s',
        },
        {
          input: {
            startedAt: new Date('2026-09-14T03:48:50.000Z'),
            finishedAt: new Date('2026-09-14T03:50:00.000Z'),
          },
          expected: '1m10s',
        },
        {
          input: {
            startedAt: new Date('2026-09-14T01:55:00.000Z'),
            finishedAt: new Date('2026-09-14T04:00:23.000Z'),
          },
          expected: '2h05m',
        },
      ]

      test.each(cases)('startedAt: $input.startedAt', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateDurationText(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with a step that has not', () => {
      const cases = [
        {
          label: 'still open',
          input: {
            startedAt: new Date('2026-09-14T03:50:05.000Z'),
            finishedAt: null,
          },
          expected: '-',
        },
        {
          label: 'never begun',
          input: {
            startedAt: null,
            finishedAt: new Date('2026-09-14T03:50:05.000Z'),
          },
          expected: '-',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateDurationText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildTableText()', () => {
    describe('should measure every column against its heading as well as its values', () => {
      const cases = [
        {
          input: {
            columns: [
              { heading: 'ALPHA', alignsRight: false },
              { heading: 'B', alignsRight: true },
            ],
            rowsCells: [
              ['a', '1000'],
              ['aaaaaaa', '2'],
            ],
          },
          expected: [
            'ALPHA       B',
            'a        1000',
            'aaaaaaa     2',
          ].join('\n'),
        },
      ]

      test.each(cases)('columns.0.heading: $input.columns.0.heading', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildTableText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildHeadingCells()', () => {
    describe('should answer the headings in their own order', () => {
      const cases = [
        {
          input: {
            columns: [
              { heading: 'ALPHA', alignsRight: false },
              { heading: 'BETA', alignsRight: true },
            ],
          },
          expected: [
            'ALPHA',
            'BETA',
          ],
        },
        {
          input: {
            columns: [
              { heading: 'GAMMA', alignsRight: true },
            ],
          },
          expected: [
            'GAMMA',
          ],
        },
      ]

      test.each(cases)('columns.0.heading: $input.columns.0.heading', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildHeadingCells(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#generateColumnWidths()', () => {
    describe('should answer the widest value of each column', () => {
      const cases = [
        {
          input: {
            allRowsCells: [
              ['ALPHA', 'B'],
              ['a', '1000'],
              ['aaaaaaa', '2'],
            ],
          },
          expected: [
            7,
            4,
          ],
        },
        {
          input: {
            allRowsCells: [
              ['HEADING'],
            ],
          },
          expected: [
            7,
          ],
        },
      ]

      test.each(cases)('allRowsCells.0.0: $input.allRowsCells.0.0', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.generateColumnWidths(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#buildTableRowText()', () => {
    describe('should pad every cell and leave no trailing space', () => {
      const cases = [
        {
          input: {
            cells: [
              'a',
              '1000',
            ],
            columns: [
              { heading: 'ALPHA', alignsRight: false },
              { heading: 'B', alignsRight: true },
            ],
            columnWidths: [
              7,
              4,
            ],
          },
          expected: 'a        1000',
        },
        {
          input: {
            cells: [
              'aaaaaaa',
              '2',
            ],
            columns: [
              { heading: 'ALPHA', alignsRight: false },
              { heading: 'B', alignsRight: true },
            ],
            columnWidths: [
              7,
              4,
            ],
          },
          expected: 'aaaaaaa     2',
        },
        {
          input: {
            cells: [
              '1000',
              'a',
            ],
            columns: [
              { heading: 'B', alignsRight: true },
              { heading: 'ALPHA', alignsRight: false },
            ],
            columnWidths: [
              4,
              7,
            ],
          },
          expected: '1000  a',
        },
      ]

      test.each(cases)('cells.0: $input.cells.0', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.buildTableRowText(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#padCell()', () => {
    describe('should pad on the side the column asked for', () => {
      const cases = [
        {
          input: {
            text: 'abc',
            width: 6,
            alignsRight: false,
          },
          expected: 'abc   ',
        },
        {
          input: {
            text: '42',
            width: 6,
            alignsRight: true,
          },
          expected: '    42',
        },
        {
          input: {
            text: 'exactly',
            width: 7,
            alignsRight: true,
          },
          expected: 'exactly',
        },
        {
          input: {
            text: 'wider-than-its-column',
            width: 4,
            alignsRight: false,
          },
          expected: 'wider-than-its-column',
        },
      ]

      test.each(cases)('text: $input.text', ({
        input,
        expected,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.padCell(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#isAbsentValue()', () => {
    describe('with nothing there', () => {
      const cases = [
        {
          label: 'a value of null',
          input: {
            value: null,
          },
        },
        {
          label: 'no value at all',
          input: {
            // value: undefined
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.isAbsentValue(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('with something there', () => {
      const cases = [
        {
          input: {
            value: 0,
          },
        },
        {
          input: {
            value: '',
          },
        },
        {
          input: {
            value: 'run-key-10700001',
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.isAbsentValue(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#isAbsentText()', () => {
    describe('with nothing there', () => {
      const cases = [
        {
          label: 'a text of null',
          input: {
            text: null,
          },
        },
        {
          label: 'a text of empty text',
          input: {
            text: '',
          },
        },
        {
          label: 'no text at all',
          input: {
            // text: undefined
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.isAbsentText(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('with something there', () => {
      const cases = [
        {
          input: {
            text: 'ext-1001',
          },
        },
        {
          input: {
            text: ' ',
          },
        },
      ]

      test.each(cases)('text: $input.text', ({
        input,
      }) => {
        const reporter = AiRunOperatorReporter.create({
          sink: {
            write: () => true,
          },
        })

        const received = reporter.isAbsentText(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunOperatorReporter', () => {
  describe('#writeReport()', () => {
    describe('should write once, and close the report with a line break', () => {
      const cases = [
        {
          input: {
            text: 'no runs found: stalled beyond 300 seconds',
          },
          expected: 'no runs found: stalled beyond 300 seconds\n',
        },
        {
          input: {
            text: 'first line\nsecond line',
          },
          expected: 'first line\nsecond line\n',
        },
      ]

      test.each(cases)('text: $input.text', ({
        input,
        expected,
      }) => {
        const sink = {
          write: jest.fn(),
        }

        const reporter = AiRunOperatorReporter.create({
          sink,
        })

        reporter.writeReport(input)

        expect(sink.write)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
